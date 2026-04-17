<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AppearanceSettings;
use Illuminate\Http\Request;

class AppearanceController extends Controller
{
    public function __construct(
        private readonly AppearanceSettings $appearanceSettings
    ) {
    }

    public function publicShow()
    {
        return response()->json([
            'branding' => $this->appearanceSettings->get(),
        ]);
    }

    public function show(Request $request)
    {
        $this->ensureExco($request);

        return response()->json([
            'branding' => $this->appearanceSettings->get(),
        ]);
    }

    public function update(Request $request)
    {
        $this->ensureExco($request);

        $data = $request->validate([
            'app_name' => ['required', 'string', 'max:120'],
            'app_short_name' => ['required', 'string', 'max:12'],
            'app_motto' => ['required', 'string', 'max:180'],
            'primary_color' => ['required', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'secondary_color' => ['required', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);

        return response()->json([
            'message' => 'Appearance settings updated successfully.',
            'branding' => $this->appearanceSettings->update(
                $data,
                $request->file('logo'),
            ),
        ]);
    }

    private function ensureExco(Request $request): void
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user || $user->isMember()) {
            abort(403, 'You are not authorized to manage appearance settings.');
        }
    }
}
