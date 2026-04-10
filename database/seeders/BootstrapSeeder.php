<?php

namespace Database\Seeders;

use App\Models\Member;
use App\Models\MembershipCycle;
use App\Models\MembershipFee;
use App\Models\SharePurchase;
use App\Models\User;
use App\Support\MemberNumberGenerator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BootstrapSeeder extends Seeder
{
    public function run(): void
    {
        $cycle = MembershipCycle::firstOrCreate(
            ['code' => 'JDS2026'],
            [
                'name' => 'JDS 2026 Cycle',
                'starts_on' => '2026-01-01',
                'ends_on' => '2026-12-31',
                'onboarding_opens_at' => '2026-01-01 00:00:00',
                'onboarding_closes_at' => '2026-01-31 23:59:59',
                'accepting_new_applications' => true,
                'onboarding_notes' => 'Initial demo cycle for local development.',
                'share_price' => 20000,
                'min_monthly_shares' => 1,
                'max_monthly_shares' => 10,
                'loan_multiplier' => 3,
                'loan_service_charge_rate' => 10,
                'loan_duration_months' => 3,
                'overdue_penalty_rate' => 10,
                'overdue_penalty_window_months' => 2,
                'shareout_admin_fee_rate' => 20,
                'registration_fee_new_member' => 2500,
                'registration_fee_existing_member' => 1500,
                'loan_pause_month' => 9,
                'is_active' => true,
            ]
        );

        MembershipCycle::query()
            ->whereKeyNot($cycle->id)
            ->update(['is_active' => false]);

        $chairperson = $this->seedExcoMember(
            fullName: 'Shadrach Gideon',
            email: 'chairperson@jds.local',
            role: User::ROLE_CHAIRPERSON,
            memberNumber: 'JDS-EXCO-0001'
        );

        $secretary = $this->seedExcoMember(
            fullName: 'Jamila Mahdi',
            email: 'secretary@jds.local',
            role: User::ROLE_SECRETARY,
            memberNumber: 'JDS-EXCO-0002'
        );

        $treasurer = $this->seedExcoMember(
            fullName: 'Deborah Obise',
            email: 'treasurer@jds.local',
            role: User::ROLE_TREASURER,
            memberNumber: 'JDS-EXCO-0003'
        );

        $member = $this->seedMember(
            fullName: 'Ebube Chidi',
            email: 'ebube93.chidi@gmail.com',
            memberNumber: 'JDS-MEM-0001'
        );

        $secondMember = $this->seedMember(
            fullName: 'Amina Yusuf',
            email: 'amina.yusuf@jds.local',
            memberNumber: 'JDS-MEM-0002'
        );

        foreach ([$chairperson, $secretary, $treasurer, $member] as $seededMember) {
            $this->seedSavingsHistory($seededMember, $cycle, true);
        }

        $this->seedSavingsHistory($secondMember, $cycle, false);
    }

    private function seedExcoMember(string $fullName, string $email, string $role, string $memberNumber): Member
    {
        $member = Member::updateOrCreate(
            ['email' => $email],
            [
                'member_number' => $memberNumber,
                'full_name' => $fullName,
                'phone_number' => '00000000000',
                'joined_on' => '2026-01-01',
                'membership_status' => 'active',
                'has_online_banking' => true,
                'whatsapp_active' => true,
                'profile_completed_at' => now(),
                'notes' => 'Bootstrapped EXCO member for local development.',
            ]
        );

        app(MemberNumberGenerator::class)->synchronizeWithExistingCode($memberNumber);

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $fullName,
                'member_id' => $member->id,
                'role' => $role,
                'password' => Hash::make('password123'),
                'must_change_password' => true,
                'temporary_password_sent_at' => now(),
                'password_changed_at' => null,
                'email_verified_at' => now(),
            ]
        );

        return $member;
    }

    private function seedMember(string $fullName, string $email, string $memberNumber): Member
    {
        $member = Member::updateOrCreate(
            ['email' => $email],
            [
                'member_number' => $memberNumber,
                'full_name' => $fullName,
                'phone_number' => '08000000001',
                'joined_on' => '2026-01-01',
                'membership_status' => 'active',
                'has_online_banking' => true,
                'whatsapp_active' => true,
                'profile_completed_at' => now(),
                'notes' => 'Bootstrapped normal member for local development.',
            ]
        );

        app(MemberNumberGenerator::class)->synchronizeWithExistingCode($memberNumber);

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $fullName,
                'member_id' => $member->id,
                'role' => User::ROLE_MEMBER,
                'password' => Hash::make('password123'),
                'must_change_password' => true,
                'temporary_password_sent_at' => now(),
                'password_changed_at' => null,
                'email_verified_at' => now(),
            ]
        );

        return $member;
    }

    private function seedSavingsHistory(Member $member, MembershipCycle $cycle, bool $includeMembershipFee): void
    {
        if ($includeMembershipFee) {
            MembershipFee::updateOrCreate(
                [
                    'membership_cycle_id' => $cycle->id,
                    'member_id' => $member->id,
                    'fee_type' => 'existing_member',
                ],
                [
                    'amount' => $cycle->registration_fee_existing_member,
                    'status' => 'paid',
                    'paid_at' => now()->subMonths(2),
                    'payment_reference' => 'BOOTSTRAP-FEE-' . $member->id,
                    'notes' => 'Bootstrapped membership fee for local development.',
                ]
            );
        }

        foreach ([
            '2026-01-01' => 2,
            '2026-02-01' => 2,
            '2026-03-01' => 2,
        ] as $shareMonth => $sharesCount) {
            SharePurchase::updateOrCreate(
                [
                    'member_id' => $member->id,
                    'share_month' => $shareMonth,
                ],
                [
                    'membership_cycle_id' => $cycle->id,
                    'shares_count' => $sharesCount,
                    'unit_share_price' => $cycle->share_price,
                    'total_amount' => $sharesCount * (float) $cycle->share_price,
                    'payment_status' => 'confirmed',
                    'purchased_at' => now()->subMonth(),
                    'confirmed_at' => now()->subMonth(),
                    'payment_reference' => 'BOOTSTRAP-SHARE-' . $member->id . '-' . str_replace('-', '', $shareMonth),
                    'notes' => 'Bootstrapped share purchase for local development.',
                ]
            );
        }
    }
}
