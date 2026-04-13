<?php

namespace App\Support;

use App\Models\Loan;
use App\Models\MembershipCycle;
use App\Models\SharePurchase;

class ShareoutCalculator
{
    public function __construct(
        private readonly ExitPolicyResolver $exitPolicyResolver
    ) {
    }

    public function build(MembershipCycle $cycle, float $totalProfit, float $adminFeeRate): array
    {
        $shareRows = SharePurchase::query()
            ->with('member')
            ->where('membership_cycle_id', $cycle->id)
            ->whereIn('payment_status', ['paid', 'confirmed'])
            ->get()
            ->groupBy('member_id')
            ->map(function ($purchases, $memberId) {
                $member = $purchases->first()?->member;

                return [
                    'member_id' => (int) $memberId,
                    'member' => $member,
                    'total_shares' => (int) $purchases->sum('shares_count'),
                    'total_saved' => round((float) $purchases->sum('total_amount'), 2),
                ];
            })
            ->filter(fn ($row) => $row['member'] !== null
                && $row['total_shares'] > 0
                && ! $this->exitPolicyResolver->shouldExcludeMemberFromCycleShareout($row['member'], $cycle))
            ->values();

        $totalSavedAll = round((float) $shareRows->sum('total_saved'), 2);
        $adminFeeAmount = round($totalProfit * ($adminFeeRate / 100), 2);
        $distributableProfit = round(max($totalProfit - $adminFeeAmount, 0), 2);

        $outstandingLoans = Loan::query()
            ->whereIn('status', ['disbursed', 'partially_repaid'])
            ->where('outstanding_amount', '>', 0)
            ->get()
            ->groupBy('member_id')
            ->map(fn ($loans) => round((float) $loans->sum('outstanding_amount'), 2));

        $items = $shareRows->map(function (array $row) use ($totalSavedAll, $totalProfit, $adminFeeAmount, $distributableProfit, $outstandingLoans) {
            $shareRatio = $totalSavedAll > 0 ? ($row['total_saved'] / $totalSavedAll) : 0;
            $grossProfitShare = round($totalProfit * $shareRatio, 2);
            $adminFeeDeduction = round($adminFeeAmount * $shareRatio, 2);
            $distributableProfitShare = round($distributableProfit * $shareRatio, 2);
            $outstandingLoanDeduction = (float) ($outstandingLoans[$row['member_id']] ?? 0);
            $grossReturn = round($row['total_saved'] + $grossProfitShare, 2);
            $netPayout = round(max($row['total_saved'] + $distributableProfitShare - $outstandingLoanDeduction, 0), 2);

            return [
                'member_id' => $row['member_id'],
                'member' => $row['member'],
                'total_shares' => $row['total_shares'],
                'total_saved' => $row['total_saved'],
                'gross_return' => $grossReturn,
                'outstanding_loan_deduction' => $outstandingLoanDeduction,
                'admin_fee_deduction' => $adminFeeDeduction,
                'net_payout' => $netPayout,
                'status' => 'pending',
            ];
        })->values();

        return [
            'items' => $items->all(),
            'summary' => [
                'members_count' => $items->count(),
                'total_shares' => (int) $items->sum('total_shares'),
                'total_saved' => round((float) $items->sum('total_saved'), 2),
                'total_profit' => $totalProfit,
                'admin_fee_amount' => $adminFeeAmount,
                'distributable_profit' => $distributableProfit,
                'gross_return_total' => round((float) $items->sum('gross_return'), 2),
                'outstanding_loan_deduction_total' => round((float) $items->sum('outstanding_loan_deduction'), 2),
                'admin_fee_deduction_total' => round((float) $items->sum('admin_fee_deduction'), 2),
                'net_payout_total' => round((float) $items->sum('net_payout'), 2),
            ],
        ];
    }
}
