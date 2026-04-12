<?php

namespace App\Http\Controllers;

use App\Models\ShareoutItem;
use App\Models\ShareoutRun;
use App\Support\ShareoutProfitCalculator;
use Illuminate\Http\Request;

class MemberShareoutController extends Controller
{
    private array $profitBreakdownCache = [];

    public function __construct(
        private readonly ShareoutProfitCalculator $profitCalculator
    )
    {
    }

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
            'formula' => $this->formulaSummary(),
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
            ->with([
                'run' => fn ($query) => $query->with('cycle')->withSum('items', 'total_saved'),
            ])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->whereHas('run', fn ($runQuery) => $runQuery->where('membership_cycle_id', $request->integer('membership_cycle_id'))))
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        $items->setCollection(
            $items->getCollection()->map(fn (ShareoutItem $item) => $this->serializeItem($item))
        );

        return response()->json($items);
    }

    private function serializeItem(ShareoutItem $item): array
    {
        $run = $item->run;
        $totalSavingsPool = round((float) ($run?->items_sum_total_saved ?? 0), 2);
        $memberSavings = round((float) $item->total_saved, 2);
        $totalProfit = round((float) ($run?->total_profit ?? 0), 2);
        $adminFeeAmount = round((float) ($run?->admin_fee_amount ?? 0), 2);
        $distributableProfit = round((float) ($run?->distributable_profit ?? max($totalProfit - $adminFeeAmount, 0)), 2);
        $savingsRatio = $totalSavingsPool > 0 ? $memberSavings / $totalSavingsPool : 0;
        $grossProfitShare = round($totalProfit * $savingsRatio, 2);
        $distributableProfitShare = round($distributableProfit * $savingsRatio, 2);

        return [
            ...$item->toArray(),
            'run_context' => [
                'total_savings_pool' => $this->decimalString($totalSavingsPool),
                'total_profit' => $this->decimalString($totalProfit),
                'admin_fee_amount' => $this->decimalString($adminFeeAmount),
                'distributable_profit' => $this->decimalString($distributableProfit),
            ],
            'profit_breakdown' => $this->profitBreakdownForRun($run),
            'calculation' => [
                'principal_amount' => $this->decimalString($memberSavings),
                'total_savings_pool' => $this->decimalString($totalSavingsPool),
                'savings_ratio' => round($savingsRatio, 8),
                'savings_ratio_percent' => $this->decimalString(round($savingsRatio * 100, 4)),
                'gross_profit_share' => $this->decimalString($grossProfitShare),
                'distributable_profit_share' => $this->decimalString($distributableProfitShare),
            ],
        ];
    }

    private function profitBreakdownForRun(?ShareoutRun $run): array
    {
        $cycleId = $run?->membership_cycle_id;

        if (! $cycleId || ! $run?->cycle) {
            return [
                'loan_service_charge_total' => '0.00',
                'default_penalty_total' => '0.00',
                'membership_fee_total' => '0.00',
                'total_profit' => '0.00',
            ];
        }

        if (! array_key_exists($cycleId, $this->profitBreakdownCache)) {
            $this->profitBreakdownCache[$cycleId] = $this->profitCalculator->build($run->cycle);
        }

        return collect($this->profitBreakdownCache[$cycleId])
            ->map(fn ($value) => $this->decimalString((float) $value))
            ->all();
    }

    private function formulaSummary(): array
    {
        return [
            'profit_share' => 'Your share of profit = (your total savings / total savings by all members) × distributable profit.',
            'final_payout' => 'Final share-out = your total savings + your share of distributable profit - outstanding loan deduction.',
        ];
    }

    private function decimalString(float $value): string
    {
        return number_format($value, 2, '.', '');
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }
}
