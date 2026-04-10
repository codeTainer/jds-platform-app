<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Member;
use App\Models\MembershipCycle;
use App\Models\SharePurchase;

class PublicSummaryController extends Controller
{
    public function __invoke()
    {
        $activeCycle = MembershipCycle::query()
            ->where('is_active', true)
            ->first();

        return response()->json([
            'summary' => [
                'total_members' => Member::query()->count(),
                'active_members' => Member::query()->where('membership_status', 'active')->count(),
                'total_cycles' => MembershipCycle::query()->count(),
                'total_loans' => Loan::query()->count(),
                'total_share_entries' => SharePurchase::query()->count(),
            ],
            'active_cycle' => $activeCycle,
        ]);
    }
}
