<?php

namespace App\Http\Controllers;

use App\Models\MembershipCycle;
use App\Models\ShareoutItem;
use App\Models\ShareoutRun;
use App\Support\AuditLogger;
use App\Support\ShareoutCalculator;
use App\Support\ShareoutProfitCalculator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExcoShareoutController extends Controller
{
    public function __construct(
        private readonly ShareoutCalculator $calculator,
        private readonly ShareoutProfitCalculator $profitCalculator,
        private readonly AuditLogger $auditLogger
    )
    {
    }

    public function index(Request $request)
    {
        $runs = ShareoutRun::query()
            ->with(['cycle', 'approver'])
            ->withCount('items')
            ->withSum('items', 'total_saved')
            ->withSum('items', 'net_payout')
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        return response()->json($runs);
    }

    public function store(Request $request)
    {
        if (! $request->user()?->canCalculateShareout()) {
            return response()->json([
                'message' => 'Only the secretary or treasurer can calculate a share-out run.',
            ], 403);
        }

        $data = $request->validate([
            'membership_cycle_id' => ['required', 'integer', 'exists:membership_cycles,id'],
            'scheduled_start_on' => ['required', 'date'],
            'scheduled_end_on' => ['required', 'date', 'after_or_equal:scheduled_start_on'],
            'total_profit' => ['nullable', 'numeric', 'min:0'],
            'admin_fee_rate' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $cycle = MembershipCycle::query()->findOrFail($data['membership_cycle_id']);
        $profitBreakdown = $this->profitCalculator->build($cycle);
        $totalProfit = array_key_exists('total_profit', $data) && $data['total_profit'] !== null
            ? round((float) $data['total_profit'], 2)
            : $profitBreakdown['total_profit'];
        $adminFeeRate = (float) ($data['admin_fee_rate'] ?? $cycle->shareout_admin_fee_rate);

        $run = ShareoutRun::query()->firstOrNew([
            'membership_cycle_id' => $cycle->id,
        ]);

        if ($run->exists && in_array($run->status, ['approved', 'executed'], true)) {
            return response()->json([
                'message' => 'This cycle already has a locked share-out run. Create changes before approval or execution.',
            ], 422);
        }

        $scheduledStart = Carbon::parse($data['scheduled_start_on'])->toDateString();
        $scheduledEnd = Carbon::parse($data['scheduled_end_on'])->toDateString();

        $calculated = $this->calculator->build($cycle, $totalProfit, $adminFeeRate);

        $savedRun = DB::transaction(function () use ($run, $cycle, $data, $scheduledStart, $scheduledEnd, $totalProfit, $adminFeeRate, $calculated) {
            $run->fill([
                'membership_cycle_id' => $cycle->id,
                'scheduled_start_on' => $scheduledStart,
                'scheduled_end_on' => $scheduledEnd,
                'total_profit' => $totalProfit,
                'roi_rate' => null,
                'admin_fee_rate' => $adminFeeRate,
                'admin_fee_amount' => $calculated['summary']['admin_fee_amount'],
                'distributable_profit' => $calculated['summary']['distributable_profit'],
                'status' => 'calculated',
                'approved_by' => null,
                'approved_at' => null,
                'executed_at' => null,
                'notes' => $data['notes'] ?? null,
            ])->save();

            $run->items()->delete();
            $run->items()->createMany(
                collect($calculated['items'])
                    ->map(fn (array $item) => collect($item)->except('member')->all())
                    ->all()
            );

            return $run->fresh(['cycle', 'approver'])
                ->loadCount('items')
                ->loadSum('items', 'total_saved')
                ->loadSum('items', 'net_payout');
        });

        $this->auditLogger->log(
            $request->user(),
            'shareouts.calculated',
            $savedRun,
            'Calculated share-out draft for cycle ' . $cycle->code . '.',
            [
                'shareout_run_id' => $savedRun->id,
                'cycle_code' => $cycle->code,
                'total_profit' => $totalProfit,
                'admin_fee_rate' => $adminFeeRate,
                'items_count' => $savedRun->items_count,
            ],
        );

        return response()->json([
            'message' => 'Share-out draft calculated successfully.',
            'run' => $savedRun,
            'summary' => $calculated['summary'],
            'profit_breakdown' => $profitBreakdown,
        ], 201);
    }

    public function profitPreview(MembershipCycle $membershipCycle)
    {
        return response()->json([
            'cycle' => $membershipCycle,
            'profit_breakdown' => $this->profitCalculator->build($membershipCycle),
        ]);
    }

    public function show(ShareoutRun $shareoutRun)
    {
        $run = $shareoutRun->load(['cycle', 'approver'])
            ->loadCount('items')
            ->loadSum('items', 'total_saved')
            ->loadSum('items', 'gross_return')
            ->loadSum('items', 'outstanding_loan_deduction')
            ->loadSum('items', 'admin_fee_deduction')
            ->loadSum('items', 'net_payout');

        return response()->json([
            'run' => $run,
            'summary' => $this->summaryFromRun($run),
            'profit_breakdown' => $run->cycle ? $this->profitCalculator->build($run->cycle) : null,
            'formula' => $this->formulaSummary(),
        ]);
    }

    public function items(Request $request, ShareoutRun $shareoutRun)
    {
        $items = $shareoutRun->items()
            ->with('member')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('net_payout')
            ->orderBy('id')
            ->paginate($this->perPage($request));

        $totalSavingsPool = round((float) $shareoutRun->items()->sum('total_saved'), 2);
        $totalProfit = round((float) ($shareoutRun->total_profit ?? 0), 2);
        $adminFeeAmount = round((float) ($shareoutRun->admin_fee_amount ?? 0), 2);
        $distributableProfit = round((float) ($shareoutRun->distributable_profit ?? max($totalProfit - $adminFeeAmount, 0)), 2);

        $items->setCollection(
            $items->getCollection()->map(function (ShareoutItem $item) use ($totalSavingsPool, $totalProfit, $adminFeeAmount, $distributableProfit) {
                $memberSavings = round((float) $item->total_saved, 2);
                $savingsRatio = $totalSavingsPool > 0 ? $memberSavings / $totalSavingsPool : 0;

                return [
                    ...$item->toArray(),
                    'calculation' => [
                        'principal_amount' => $this->decimalString($memberSavings),
                        'total_savings_pool' => $this->decimalString($totalSavingsPool),
                        'savings_ratio' => round($savingsRatio, 8),
                        'savings_ratio_percent' => $this->decimalString(round($savingsRatio * 100, 4)),
                        'gross_profit_share' => $this->decimalString(round($totalProfit * $savingsRatio, 2)),
                        'distributable_profit_share' => $this->decimalString(round($distributableProfit * $savingsRatio, 2)),
                        'admin_fee_amount' => $this->decimalString($adminFeeAmount),
                    ],
                ];
            })
        );

        return response()->json($items);
    }

    public function destroy(ShareoutRun $shareoutRun)
    {
        if (! request()->user()?->canCalculateShareout()) {
            return response()->json([
                'message' => 'Only the secretary or treasurer can delete a calculated share-out run.',
            ], 403);
        }

        if ($shareoutRun->status !== 'calculated') {
            return response()->json([
                'message' => 'Only calculated share-out runs can be deleted.',
            ], 422);
        }

        $runId = $shareoutRun->id;
        $cycleCode = $shareoutRun->cycle?->code;
        $shareoutRun->delete();

        $this->auditLogger->log(
            request()->user(),
            'shareouts.deleted',
            ShareoutRun::class,
            'Deleted calculated share-out run #' . $runId . '.',
            [
                'shareout_run_id' => $runId,
                'cycle_code' => $cycleCode,
            ],
        );

        return response()->json([
            'message' => 'Share-out run deleted successfully.',
        ]);
    }

    public function approve(Request $request, ShareoutRun $shareoutRun)
    {
        if (! $request->user()?->canApproveShareout()) {
            return response()->json([
                'message' => 'Only the chairperson can approve a share-out run.',
            ], 403);
        }

        if ($shareoutRun->status !== 'calculated') {
            return response()->json([
                'message' => 'Only calculated share-out runs can be approved.',
            ], 422);
        }

        $shareoutRun->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        $this->auditLogger->log(
            $request->user(),
            'shareouts.approved',
            $shareoutRun,
            'Approved share-out run #' . $shareoutRun->id . '.',
            [
                'shareout_run_id' => $shareoutRun->id,
                'cycle_code' => $shareoutRun->cycle?->code,
            ],
        );

        return response()->json([
            'message' => 'Share-out run approved successfully.',
            'run' => $shareoutRun->fresh(['cycle', 'approver']),
        ]);
    }

    public function reject(ShareoutRun $shareoutRun)
    {
        if (! request()->user()?->canApproveShareout()) {
            return response()->json([
                'message' => 'Only the chairperson can reject a share-out run.',
            ], 403);
        }

        if (! in_array($shareoutRun->status, ['calculated', 'approved'], true)) {
            return response()->json([
                'message' => 'Only calculated or approved share-out runs can be rejected.',
            ], 422);
        }

        $shareoutRun->update([
            'status' => 'rejected',
            'approved_by' => null,
            'approved_at' => null,
            'executed_at' => null,
        ]);

        $this->auditLogger->log(
            request()->user(),
            'shareouts.rejected',
            $shareoutRun,
            'Rejected share-out run #' . $shareoutRun->id . '.',
            [
                'shareout_run_id' => $shareoutRun->id,
                'cycle_code' => $shareoutRun->cycle?->code,
            ],
        );

        return response()->json([
            'message' => 'Share-out run rejected successfully.',
            'run' => $shareoutRun->fresh(['cycle', 'approver']),
        ]);
    }

    public function execute(ShareoutRun $shareoutRun)
    {
        if (! request()->user()?->canExecuteShareout()) {
            return response()->json([
                'message' => 'Only the treasurer can execute a share-out run.',
            ], 403);
        }

        if ($shareoutRun->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved share-out runs can be executed.',
            ], 422);
        }

        $shareoutRun->update([
            'status' => 'executed',
            'executed_at' => now(),
        ]);

        $this->auditLogger->log(
            request()->user(),
            'shareouts.executed',
            $shareoutRun,
            'Marked share-out run #' . $shareoutRun->id . ' as executed.',
            [
                'shareout_run_id' => $shareoutRun->id,
                'cycle_code' => $shareoutRun->cycle?->code,
            ],
        );

        return response()->json([
            'message' => 'Share-out run marked as executed.',
            'run' => $shareoutRun->fresh(['cycle', 'approver']),
        ]);
    }

    public function markItemPaid(ShareoutItem $shareoutItem)
    {
        if (! request()->user()?->canExecuteShareout()) {
            return response()->json([
                'message' => 'Only the treasurer can mark share-out items as paid.',
            ], 403);
        }

        if ($shareoutItem->run?->status !== 'executed') {
            return response()->json([
                'message' => 'Items can only be marked paid after the share-out run has been executed.',
            ], 422);
        }

        $shareoutItem->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->auditLogger->log(
            request()->user(),
            'shareouts.item_paid',
            $shareoutItem,
            'Marked share-out item #' . $shareoutItem->id . ' as paid.',
            [
                'shareout_item_id' => $shareoutItem->id,
                'shareout_run_id' => $shareoutItem->shareout_run_id,
                'member_number' => $shareoutItem->member?->member_number,
                'net_payout' => $shareoutItem->net_payout,
            ],
        );

        return response()->json([
            'message' => 'Share-out item marked as paid.',
            'item' => $shareoutItem->fresh(['member', 'run.cycle']),
        ]);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }

    private function summaryFromRun(ShareoutRun $run): array
    {
        return [
            'members_count' => $run->items_count ?? 0,
            'total_saved' => (string) ($run->items_sum_total_saved ?? 0),
            'total_profit' => (string) ($run->total_profit ?? 0),
            'admin_fee_amount' => (string) ($run->admin_fee_amount ?? 0),
            'distributable_profit' => (string) ($run->distributable_profit ?? 0),
            'gross_return_total' => (string) ($run->items_sum_gross_return ?? 0),
            'outstanding_loan_deduction_total' => (string) ($run->items_sum_outstanding_loan_deduction ?? 0),
            'admin_fee_deduction_total' => (string) ($run->items_sum_admin_fee_deduction ?? 0),
            'net_payout_total' => (string) ($run->items_sum_net_payout ?? 0),
        ];
    }

    private function formulaSummary(): array
    {
        return [
            'profit_share' => 'Each member receives a share of distributable profit based on their savings ratio within the total cycle savings pool.',
            'final_payout' => 'Final share-out = member savings + member share of distributable profit - outstanding loan deduction.',
        ];
    }

    private function decimalString(float $value): string
    {
        return number_format($value, 2, '.', '');
    }
}
