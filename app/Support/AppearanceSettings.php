<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AppearanceSettings
{
    public const KEY = 'appearance.branding';
    private const LOGO_DISK = 'public';

    /**
     * @return array<string, mixed>
     */
    public function get(): array
    {
        $defaults = $this->defaults();
        $stored = $this->storedValue();

        return [
            'app_name' => $this->normalizeRequiredText($stored['app_name'] ?? null) ?? $defaults['app_name'],
            'app_short_name' => $this->normalizeShortName($stored['app_short_name'] ?? null) ?? $defaults['app_short_name'],
            'app_motto' => $this->normalizeRequiredText($stored['app_motto'] ?? null) ?? $defaults['app_motto'],
            'primary_color' => $this->normalizeColor($stored['primary_color'] ?? null) ?? $defaults['primary_color'],
            'secondary_color' => $this->normalizeColor($stored['secondary_color'] ?? null) ?? $defaults['secondary_color'],
            'logo_url' => $this->logoUrl(
                $stored['logo_disk'] ?? null,
                $stored['logo_path'] ?? null,
            ),
        ];
    }

    /**
     * @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    public function update(array $values, ?UploadedFile $logo = null): array
    {
        $defaults = $this->defaults();
        $stored = $this->storedValue();
        $branding = [
            'app_name' => $this->normalizeRequiredText($values['app_name'] ?? null) ?? $defaults['app_name'],
            'app_short_name' => $this->normalizeShortName($values['app_short_name'] ?? null) ?? $defaults['app_short_name'],
            'app_motto' => $this->normalizeRequiredText($values['app_motto'] ?? null) ?? $defaults['app_motto'],
            'primary_color' => $this->normalizeColor($values['primary_color'] ?? null) ?? $defaults['primary_color'],
            'secondary_color' => $this->normalizeColor($values['secondary_color'] ?? null) ?? $defaults['secondary_color'],
            'logo_disk' => $stored['logo_disk'] ?? null,
            'logo_path' => $stored['logo_path'] ?? null,
        ];

        $removeLogo = filter_var($values['remove_logo'] ?? false, FILTER_VALIDATE_BOOL);

        if ($removeLogo && $branding['logo_path']) {
            $this->deleteLogo($branding['logo_disk'], $branding['logo_path']);
            $branding['logo_disk'] = null;
            $branding['logo_path'] = null;
        }

        if ($logo) {
            if ($branding['logo_path']) {
                $this->deleteLogo($branding['logo_disk'], $branding['logo_path']);
            }

            $branding['logo_disk'] = self::LOGO_DISK;
            $branding['logo_path'] = $logo->store('branding', self::LOGO_DISK);
        }

        Setting::query()->updateOrCreate(
            ['key' => self::KEY],
            [
                'value' => $branding,
                'description' => 'Brand identity settings used across the application shell.',
            ],
        );

        return $this->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function defaults(): array
    {
        return [
            'app_name' => 'JDS Platform',
            'app_short_name' => 'JDS',
            'app_motto' => 'Savings | Loans | Accountability',
            'primary_color' => '#0B4C89',
            'secondary_color' => '#A67C24',
            'logo_url' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function storedValue(): array
    {
        $setting = Setting::query()->where('key', self::KEY)->first();

        if (! $setting || ! is_array($setting->value)) {
            return [];
        }

        return $setting->value;
    }

    private function normalizeColor(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = strtoupper(trim($value));

        if (! preg_match('/^#([0-9A-F]{6})$/', $trimmed)) {
            return null;
        }

        return $trimmed;
    }

    private function normalizeRequiredText(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : null;
    }

    private function normalizeShortName(mixed $value): ?string
    {
        $normalized = $this->normalizeRequiredText($value);

        if (! $normalized) {
            return null;
        }

        return mb_strtoupper(mb_substr($normalized, 0, 12));
    }

    private function logoUrl(mixed $disk, mixed $path): ?string
    {
        if (! is_string($path) || trim($path) === '') {
            return null;
        }

        $resolvedDisk = is_string($disk) && trim($disk) !== '' ? $disk : self::LOGO_DISK;

        return Storage::disk($resolvedDisk)->url($path);
    }

    private function deleteLogo(mixed $disk, mixed $path): void
    {
        if (! is_string($path) || trim($path) === '') {
            return;
        }

        $resolvedDisk = is_string($disk) && trim($disk) !== '' ? $disk : self::LOGO_DISK;

        Storage::disk($resolvedDisk)->delete($path);
    }
}
