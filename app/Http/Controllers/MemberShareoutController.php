<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MemberShareoutController extends Controller
{
    public function overview(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $items = $member->shareoutItems();

        return response()->json([
            'summary' => [
                'shareout_items_count' => (clone $items)->count(),
                'total_gross_return' => (string) ((clone $items)->sum('gross_return')),
                'total_admin_fee_deduction' => (string) ((clone $items)->sum('admin_fee_deduction')),
                'total_outstanding_loan_deduction' => (string) ((clone $items)->sum('outstanding_loan_deduction')),
                'total_net_payout' => (string) ((clone $items)->sum('net_payout')),
                'paid_items_count' => (clone $items)->where('status', 'paid')->count(),
            ],
        ]);
    }

    public function index(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $items = $member->shareoutItems()
            ->with(['run.cycle'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->whereHas('run', fn ($runQuery) => $runQuery->where('membership_cycle_id', $request->integer('membership_cycle_id'))))
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        return response()->json($items);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }
}
