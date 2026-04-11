<?php

namespace App\Http\Middleware;

use App\Models\UserAccessToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if (! $bearerToken) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $accessToken = UserAccessToken::query()
            ->with('user.member')
            ->where('token_hash', hash('sha256', $bearerToken))
            ->first();

        if (! $accessToken) {
            return response()->json([
                'message' => 'Invalid token.',
            ], 401);
        }

        if ($accessToken->expires_at && $accessToken->expires_at->isPast()) {
            $accessToken->delete();

            return response()->json([
                'message' => 'Token has expired.',
            ], 401);
        }

        $idleTimeoutMinutes = max((int) config('jds.idle_timeout_minutes', 5), 1);
        $activityReference = $accessToken->last_used_at ?? $accessToken->created_at;

        if ($activityReference && $activityReference->copy()->addMinutes($idleTimeoutMinutes)->isPast()) {
            $accessToken->delete();

            return response()->json([
                'message' => "Your session expired after {$idleTimeoutMinutes} minutes of inactivity. Please sign in again.",
                'idle_timeout' => true,
            ], 401);
        }

        $accessToken->forceFill([
            'last_used_at' => now(),
        ])->save();

        $request->setUserResolver(fn () => $accessToken->user);
        $request->attributes->set('accessToken', $accessToken);

        if (
            $accessToken->user?->must_change_password
            && ! $request->is('api/auth/me')
            && ! $request->is('api/auth/logout')
            && ! $request->is('api/auth/change-password')
        ) {
            return response()->json([
                'message' => 'You must change your temporary password before continuing.',
                'requires_password_change' => true,
            ], 423);
        }

        return $next($request);
    }
}
