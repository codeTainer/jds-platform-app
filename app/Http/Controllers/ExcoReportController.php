<?php

namespace App\Http\Controllers;

use App\Models\Concern;
use App\Models\Loan;
use App\Models\Member;
use App\Models\MembershipCycle;
use App\Models\MembershipFee;
use App\Models\SharePurchase;
use App\Models\ShareoutItem;
use App\Support\ConcernCatalog;
use Illuminate\Http\Request;

class ExcoReportController extends Controller
{
    public function __construct(
        private readonly ConcernCatalog $concernCatalog
    )
    {
    }

    public function summary(Request $request)
    {
        $cycle = $this->resolveCycle($request);
        $baseCycleId = $cycle?->id;

        $savingsQuery = SharePurchase::query()
            ->whereIn('payment_status', ['paid', 'confirmed'])
            ->when($baseCycleId, fn ($query) => $query->where('membership_cycle_id', $baseCycleId));

        $feesQuery = MembershipFee::query()
            ->where('status', 'paid')
            ->when($baseCycleId, fn ($query) => $query->where('membership_cycle_id', $baseCycleId));

        $loanDisbursedQuery = Loan::query()
            ->whereIn('status', ['disbursed', 'partially_repaid', 'repaid'])
            ->when($baseCycleId, fn ($query) => $query->where('membership_cycle_id', $baseCycleId));

        $outstandingLoansQuery = Loan::query()
            ->whereIn('status', ['disbursed', 'partially_repaid'])
            ->where('outstanding_amount', '>', 0)
            ->when($baseCycleId, fn ($query) => $query->where('membership_cycle_id', $baseCycleId));

        $shareoutItemsQuery = ShareoutItem::query()
            ->whereHas('run', fn ($query) => $query->when($baseCycleId, fn ($inner) => $inner->where('membership_cycle_id', $baseCycleId)));

        $openConcernsQuery = Concern::query()->whereIn('status', ['open', 'in_review']);
        $resolvedConcernsQuery = Concern::query()->where('status', 'resolved');

        return response()->json([
            'cycle' => $cycle,
            'summary' => [
                'members_on_platform' => Member::query()->count(),
                'members_with_savings' => (clone $savingsQuery)->distinct('member_id')->count('member_id'),
                'total_savings_value' => (string) round((float) (clone $savingsQuery)->sum('total_amount'), 2),
                'membership_fees_paid_total' => (string) round((float) (clone $feesQuery)->sum('amount'), 2),
                'loans_disbursed_total' => (string) round((float) (clone $loanDisbursedQuery)->sum('approved_amount'), 2),
                'loan_service_charge_total' => (string) round((float) (clone $loanDisbursedQuery)->sum('service_charge_amount'), 2),
                'outstanding_loan_balance' => (string) round((float) (clone $outstandingLoansQuery)->sum('outstanding_amount'), 2),
                'shareout_net_payout_total' => (string) round((float) (clone $shareoutItemsQuery)->sum('net_payout'), 2),
                'shareout_paid_total' => (string) round((float) (clone $shareoutItemsQuery)->where('status', 'paid')->sum('net_payout'), 2),
                'open_concerns_count' => $openConcernsQuery->count(),
                'resolved_concerns_count' => $resolvedConcernsQuery->count(),
            ],
        ]);
    }

    public function savings(Request $request)
    {
        $cycleId = $request->integer('membership_cycle_id');
        $search = trim($request->string('search')->toString());

        $members = Member::query()
            ->when($search !== '', fn ($query) => $query
                ->where('full_name', 'like', '%'.$search.'%')
                ->orWhere('email', 'like', '%'.$search.'%')
                ->orWhere('member_number', 'like', '%'.$search.'%'))
            ->withCount([
                'sharePurchases as share_purchase_entries_count' => fn ($query) => $query
                    ->when($cycleId, fn ($inner) => $inner->where('membership_cycle_id', $cycleId))
                    ->whereIn('payment_status', ['paid', 'confirmed']),
                'membershipFees as membership_fee_entries_count' => fn ($query) => $query
                    ->when($cycleId, fn ($inner) => $inner->where('membership_cycle_id', $cycleId))
                    ->where('status', 'paid'),
            ])
            ->withSum([
                'sharePurchases as total_shares_count' => fn ($query) => $query
                    ->when($cycleId, fn ($inner) => $inner->where('membership_cycle_id', $cycleId))
                    ->whereIn('payment_status', ['paid', 'confirmed']),
            ], 'shares_count')
            ->withSum([
                'sharePurchases as total_saved_value' => fn ($query) => $query
                    ->when($cycleId, fn ($inner) => $inner->where('membership_cycle_id', $cycleId))
                    ->whereIn('payment_status', ['paid', 'confirmed']),
            ], 'total_amount')
            ->withSum([
                'membershipFees as membership_fees_paid_total' => fn ($query) => $query
                    ->when($cycleId, fn ($inner) => $inner->where('membership_cycle_id', $cycleId))
                    ->where('status', 'paid'),
            ], 'amount')
            ->orderByDesc('total_saved_value')
            ->orderBy('full_name')
            ->paginate($this->perPage($request));

        return response()->json($members);
    }

    public function loans(Request $request)
    {
        $loans = Loan::query()
            ->with(['member', 'guarantor', 'cycle'])
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('requested_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($loans);
    }

    public function shareouts(Request $request)
    {
        $items = ShareoutItem::query()
            ->with(['member', 'run.cycle'])
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->whereHas('run', fn ($runQuery) => $runQuery->where('membership_cycle_id', $request->integer('membership_cycle_id'))))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('net_payout')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($items);
    }

    public function concerns(Request $request)
    {
        $concerns = Concern::query()
            ->with(['member', 'resolver', 'concernable'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('reference_type'), function ($query) use ($request) {
                $referenceType = $request->string('reference_type')->toString();
                $modelClass = $this->concernCatalog->modelClassForReferenceType($referenceType);

                if ($referenceType === 'account') {
                    $query->whereNull('concernable_type')->whereNull('concernable_id');

                    return;
                }

                if ($modelClass) {
                    $query->where('concernable_type', $modelClass);
                }
            })
            ->orderByRaw("case when status = 'open' then 0 when status = 'in_review' then 1 else 2 end")
            ->orderByDesc('raised_at')
            ->paginate($this->perPage($request));

        $concerns->setCollection(
            $concerns->getCollection()->map(fn (Concern $concern) => $this->concernCatalog->serializeConcern($concern))
        );

        return response()->json($concerns);
    }

    private function resolveCycle(Request $request): ?MembershipCycle
    {
        if ($request->filled('membership_cycle_id')) {
            return MembershipCycle::query()->find($request->integer('membership_cycle_id'));
        }

        return MembershipCycle::query()->where('is_active', true)->first();
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 250);
    }
}
