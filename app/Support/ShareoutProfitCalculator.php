<?php

namespace App\Support;

use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\MembershipCycle;
use App\Models\MembershipFee;

class ShareoutProfitCalculator
{
    public function build(MembershipCycle $cycle): array
    {
        $serviceChargeTotal = round((float) Loan::query()
            ->where('membership_cycle_id', $cycle->id)
            ->whereIn('status', ['disbursed', 'partially_repaid', 'repaid'])
            ->sum('service_charge_amount'), 2);

        $penaltyTotal = round((float) LoanRepayment::query()
            ->whereHas('loan', fn ($query) => $query->where('membership_cycle_id', $cycle->id))
            ->where('status', 'posted')
            ->sum('penalty_amount'), 2);

        $membershipFeeTotal = round((float) MembershipFee::query()
            ->where('membership_cycle_id', $cycle->id)
            ->where('status', 'paid')
            ->sum('amount'), 2);

        return [
            'loan_service_charge_total' => $serviceChargeTotal,
            'default_penalty_total' => $penaltyTotal,
            'membership_fee_total' => $membershipFeeTotal,
            'total_profit' => round($serviceChargeTotal + $penaltyTotal + $membershipFeeTotal, 2),
        ];
    }
}
