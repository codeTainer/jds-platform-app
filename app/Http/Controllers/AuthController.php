<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserAccessToken;
use App\Support\ProcessNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private readonly ProcessNotifier $processNotifier
    ) {
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->with('member')
            ->where('email', $data['email'])
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        $plainTextToken = Str::random(80);

        $token = UserAccessToken::create([
            'user_id' => $user->id,
            'name' => 'react-client',
            'token_hash' => hash('sha256', $plainTextToken),
        ]);

        return response()->json([
            'message' => $user->must_change_password
                ? 'Login successful. You must change your password before continuing.'
                : 'Login successful.',
            'token' => $plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('member'),
        ]);
    }

    public function logout(Request $request)
    {
        $accessToken = $request->attributes->get('accessToken');

        if ($accessToken instanceof UserAccessToken) {
            $accessToken->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function changePassword(Request $request)
    {
        /** @var User $user */
        $user = $request->user()->load('member');

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        if (Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Choose a new password that is different from the temporary password.',
            ], 422);
        }

        $user->forceFill([
            'password' => $data['password'],
            'must_change_password' => false,
            'password_changed_at' => now(),
        ])->save();

        $this->processNotifier->notifyUser(
            $user,
            title: 'Password changed successfully',
            message: 'Your password has been updated successfully.',
            category: 'security',
            actionUrl: $user->role === User::ROLE_MEMBER ? '/dashboard/member' : '/dashboard/exco',
            actionLabel: 'Open dashboard',
            level: 'success',
        );

        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => $user->fresh('member'),
        ]);
    }
}
