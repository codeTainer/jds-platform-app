<?php

namespace App\Support;

use App\Models\Member;
use App\Models\User;
use App\Notifications\TemporaryAccountCredentials;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MemberAccountProvisioner
{
    public function __construct(
        private readonly MemberNumberGenerator $memberNumberGenerator,
        private readonly ProcessNotifier $processNotifier
    ) {
    }

    /**
     * @return array{member: \App\Models\Member, user: \App\Models\User, temporary_password: string}
     */
    public function create(array $payload, bool $sendNotification = true): array
    {
        $temporaryPassword = $this->generateTemporaryPassword();

        $result = DB::transaction(function () use ($payload, $temporaryPassword) {
            $role = $payload['role'] ?? User::ROLE_MEMBER;
            $memberNumber = $payload['member_number'] ?? $this->memberNumberGenerator->nextForRole($role);

            if (! empty($payload['member_number'])) {
                $this->memberNumberGenerator->synchronizeWithExistingCode($memberNumber);
            }

            $member = Member::create([
                'member_number' => $memberNumber,
                'full_name' => $payload['full_name'],
                'email' => $payload['email'],
                'phone_number' => $payload['phone_number'],
                'joined_on' => $payload['joined_on'] ?? today(),
                'membership_status' => $payload['membership_status'] ?? 'active',
                'has_online_banking' => (bool) ($payload['has_online_banking'] ?? true),
                'whatsapp_active' => (bool) ($payload['whatsapp_active'] ?? true),
                'biodata' => $payload['biodata'] ?? null,
                'profile_completed_at' => $payload['profile_completed_at'] ?? now(),
                'notes' => $payload['notes'] ?? null,
            ]);

            $user = User::create([
                'name' => $payload['name'] ?? $payload['full_name'],
                'email' => $payload['email'],
                'member_id' => $member->id,
                'role' => $role,
                'password' => $temporaryPassword,
                'must_change_password' => true,
                'temporary_password_sent_at' => null,
                'password_changed_at' => null,
                'email_verified_at' => $payload['email_verified_at'] ?? now(),
            ]);

            return [
                'member' => $member,
                'user' => $user,
                'temporary_password' => $temporaryPassword,
            ];
        });

        if ($sendNotification) {
            DB::afterCommit(function () use ($result, $temporaryPassword) {
                try {
                    $result['user']->notify(new TemporaryAccountCredentials($temporaryPassword));
                    $result['user']->forceFill([
                        'temporary_password_sent_at' => now(),
                    ])->save();
                } catch (\Throwable $exception) {
                    Log::warning('Unable to send temporary JDS credentials.', [
                        'user_id' => $result['user']->id,
                        'email' => $result['user']->email,
                        'message' => $exception->getMessage(),
                    ]);
                }

                try {
                    $this->processNotifier->notifyUser(
                        $result['user'],
                        title: 'Temporary account created',
                        message: 'Your JDS platform account has been created. Sign in with your temporary password and change it immediately.',
                        category: 'accounts',
                        actionUrl: '/',
                        actionLabel: 'Open login',
                        level: 'info',
                    );
                } catch (\Throwable $exception) {
                    Log::warning('Unable to store in-app temporary account notification.', [
                        'user_id' => $result['user']->id,
                        'email' => $result['user']->email,
                        'message' => $exception->getMessage(),
                    ]);
                }
            });
        }

        return [
            'member' => $result['member']->fresh('user'),
            'user' => $result['user']->fresh('member'),
            'temporary_password' => $temporaryPassword,
        ];
    }

    private function generateTemporaryPassword(): string
    {
        return 'Jds-' . Str::upper(Str::random(4)) . '-' . random_int(1000, 9999);
    }
}
