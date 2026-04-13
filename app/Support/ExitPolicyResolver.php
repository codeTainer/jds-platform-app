<?php

namespace App\Support;

use App\Models\Member;
use App\Models\MemberExitRequest;
use App\Models\MembershipCycle;
use App\Models\ShareoutRun;
use Carbon\Carbon;

class ExitPolicyResolver
{
    /**
     * @return array{
     *   mode: 'immediate_settlement'|'shareout_first',
     *   label: string,
     *   description: string,
     *   relevant_cycle_id: int|null,
     *   relevant_cycle_code: string|null,
     *   relevant_cycle_end_on: string|null
     * }
     */
    public function resolveForExitDate(string $requestedExitOn): array
    {
        $exitDate = Carbon::parse($requestedExitOn)->startOfDay();

        $activeCycle = MembershipCycle::query()
            ->whereDate('starts_on', '<=', $exitDate->toDateString())
            ->whereDate('ends_on', '>=', $exitDate->toDateString())
            ->orderByDesc('starts_on')
            ->first();

        if ($activeCycle) {
            return [
                'mode' => 'immediate_settlement',
                'label' => 'Immediate settlement',
                'description' => 'This exit falls within an active cycle. Once completed, the member is settled directly at exit and excluded from that cycle\'s year-end share-out.',
                'relevant_cycle_id' => $activeCycle->id,
                'relevant_cycle_code' => $activeCycle->code,
                'relevant_cycle_end_on' => optional($activeCycle->ends_on)->toDateString(),
            ];
        }

        $lastClosedCycle = MembershipCycle::query()
            ->whereDate('ends_on', '<', $exitDate->toDateString())
            ->orderByDesc('ends_on')
            ->first();

        return [
            'mode' => 'shareout_first',
            'label' => 'Share-out first',
            'description' => 'This exit falls after a cycle has already closed. The member remains eligible for that closed cycle\'s share-out before the exit can be approved.',
            'relevant_cycle_id' => $lastClosedCycle?->id,
            'relevant_cycle_code' => $lastClosedCycle?->code,
            'relevant_cycle_end_on' => optional($lastClosedCycle?->ends_on)->toDateString(),
        ];
    }

    public function shouldExcludeMemberFromCycleShareout(Member $member, MembershipCycle $cycle): bool
    {
        return MemberExitRequest::query()
            ->where('member_id', $member->id)
            ->where('status', MemberExitRequest::STATUS_COMPLETED)
            ->whereDate('requested_exit_on', '<=', $cycle->ends_on)
            ->exists();
    }

    public function canApproveExitRequest(MemberExitRequest $memberExitRequest): bool
    {
        $policy = $this->resolveForExitDate($memberExitRequest->requested_exit_on->toDateString());

        if ($policy['mode'] !== 'shareout_first' || ! $policy['relevant_cycle_id']) {
            return true;
        }

        return ShareoutRun::query()
            ->where('membership_cycle_id', $policy['relevant_cycle_id'])
            ->whereIn('status', ['approved', 'executed'])
            ->exists();
    }

    public function approvalBlockMessage(MemberExitRequest $memberExitRequest): string
    {
        $policy = $this->resolveForExitDate($memberExitRequest->requested_exit_on->toDateString());

        if ($policy['mode'] !== 'shareout_first') {
            return 'This exit request can be approved normally.';
        }

        if ($policy['relevant_cycle_code']) {
            return 'This exit falls after cycle close. Keep it pending until the ' . $policy['relevant_cycle_code'] . ' share-out has been approved.';
        }

        return 'This exit falls after cycle close. Keep it pending until the relevant cycle share-out has been approved.';
    }
}
