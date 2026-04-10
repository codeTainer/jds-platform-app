<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MemberApplication;
use App\Models\MembershipCycle;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicMemberApplicationController extends Controller
{
    public function currentCycle()
    {
        $cycle = MembershipCycle::query()
            ->where('is_active', true)
            ->first();

        if (! $cycle) {
            return response()->json([
                'message' => 'No active membership cycle is currently configured.',
            ], 404);
        }

        $now = now();
        $isOpen = $cycle->accepting_new_applications
            && (! $cycle->onboarding_opens_at || $cycle->onboarding_opens_at->lte($now))
            && (! $cycle->onboarding_closes_at || $cycle->onboarding_closes_at->gte($now));

        return response()->json([
            'cycle' => $cycle,
            'onboarding_open' => $isOpen,
        ]);
    }

    public function store(Request $request)
    {
        $cycle = MembershipCycle::query()
            ->where('is_active', true)
            ->firstOrFail();

        $now = now();
        $isOpen = $cycle->accepting_new_applications
            && (! $cycle->onboarding_opens_at || $cycle->onboarding_opens_at->lte($now))
            && (! $cycle->onboarding_closes_at || $cycle->onboarding_closes_at->gte($now));

        if (! $isOpen) {
            return response()->json([
                'message' => 'New member onboarding is currently closed.',
            ], 422);
        }

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('member_applications', 'email'),
                Rule::unique('members', 'email'),
            ],
            'phone_number' => ['required', 'string', 'max:20'],
            'has_online_banking' => ['required', 'boolean'],
            'whatsapp_active' => ['required', 'boolean'],
            'biodata' => ['nullable', 'array'],
        ]);

        $application = MemberApplication::create([
            ...$data,
            'membership_cycle_id' => $cycle->id,
            'status' => MemberApplication::STATUS_PENDING_REVIEW,
            'applied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application submitted successfully.',
            'application' => $application->load('cycle'),
        ], 201);
    }
}
