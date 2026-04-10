<?php

namespace App\Support;

use App\Models\Setting;
use App\Models\User;

class MemberNumberGenerator
{
    public function nextForRole(string $role): string
    {
        $track = $this->trackForRole($role);
        $setting = Setting::query()
            ->lockForUpdate()
            ->firstOrCreate(
                ['key' => "member_code_sequence.{$track}"],
                [
                    'value' => ['next' => 1],
                    'description' => 'Auto-increment sequence for generated JDS member codes.',
                ]
            );

        $current = max(1, (int) ($setting->value['next'] ?? 1));

        $setting->update([
            'value' => ['next' => $current + 1],
        ]);

        return $this->prefixForRole($role) . '-' . str_pad((string) $current, 4, '0', STR_PAD_LEFT);
    }

    public function synchronizeWithExistingCode(string $memberNumber): void
    {
        if (! preg_match('/^JDS-(MEM|EXCO)-(\d{4})$/', strtoupper($memberNumber), $matches)) {
            return;
        }

        $track = strtolower($matches[1]) === 'mem' ? 'mem' : 'exco';
        $next = ((int) $matches[2]) + 1;

        $setting = Setting::query()
            ->lockForUpdate()
            ->firstOrCreate(
                ['key' => "member_code_sequence.{$track}"],
                [
                    'value' => ['next' => 1],
                    'description' => 'Auto-increment sequence for generated JDS member codes.',
                ]
            );

        $current = max(1, (int) ($setting->value['next'] ?? 1));

        if ($next > $current) {
            $setting->update([
                'value' => ['next' => $next],
            ]);
        }
    }

    public function expectedPrefixForRole(string $role): string
    {
        return $this->prefixForRole($role);
    }

    private function prefixForRole(string $role): string
    {
        return $this->trackForRole($role) === 'mem' ? 'JDS-MEM' : 'JDS-EXCO';
    }

    private function trackForRole(string $role): string
    {
        return $role === User::ROLE_MEMBER ? 'mem' : 'exco';
    }
}
