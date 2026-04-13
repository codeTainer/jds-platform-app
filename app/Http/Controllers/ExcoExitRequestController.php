<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Member;
use App\Models\MemberExitRequest;
use App\Models\SharePurchase;
use App\Support\AuditLogger;
use App\Support\ExitPolicyResolver;
use App\Support\ProcessNotifier;
use Illuminate\Http\Request;

class ExcoExitRequestController extends Controller
{
    public function __construct(
        private readonly ProcessNotifier $processNotifier,
        private readonly AuditLogger $auditLogger,
        private readonly ExitPolicyResolver $exitPolicyResolver
    ) {
    }

    public function index(Request $request)
    {
        if (! $request->user()?->canManageExitRequests()) {
            return response()->json([
                'message' => 'You are not authorized to manage member exits.',
            ], 403);
        }

        $requests = MemberExitRequest::query()
            ->with(['member.user', 'processedBy'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('member_search'), function ($query) use ($request) {
                $search = trim($request->string('member_search')->toString());

                if ($search === '') {
                    return;
                }

                $query->whereHas('member', function ($memberQuery) use ($search) {
                    $memberQuery->where('full_name', 'ilike', '%' . $search . '%')
                        ->orWhere('email', 'ilike', '%' . $search . '%')
                        ->orWhere('member_number', 'ilike', '%' . $search . '%');
                });
            })
            ->orderByRaw("case when status = 'pending' then 0 when status = 'in_review' then 1 when status = 'approved' then 2 else 3 end")
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        $requests->setCollection(
            $requests->getCollection()->map(function (MemberExitRequest $exitRequest) {
                $summary = $this->buildFinancialSummary($exitRequest->member);

                return [
                    ...$exitRequest->toArray(),
                    'current_total_saved_value' => number_format($summary['total_saved_value'], 2, '.', ''),
                    'current_outstanding_loan_balance' => number_format($summary['outstanding_loan_balance'], 2, '.', ''),
                    'current_estimated_refund_amount' => number_format($summary['estimated_refund_amount'], 2, '.', ''),
                    'exit_policy' => $this->exitPolicyResolver->resolveForExitDate($exitRequest->requested_exit_on->toDateString()),
                    'processor' => $exitRequest->processedBy ? [
                        'id' => $exitRequest->processedBy->id,
                        'name' => $exitRequest->processedBy->name,
                        'email' => $exitRequest->processedBy->email,
                        'role' => $exitRequest->processedBy->role,
                    ] : null,
                ];
            })
        );

        return response()->json($requests);
    }

    public function update(Request $request, MemberExitRequest $memberExitRequest)
    {
        if (! $request->user()?->canManageExitRequests()) {
            return response()->json([
                'message' => 'You are not authorized to manage member exits.',
            ], 403);
        }

        $data = $request->validate([
            'status' => ['required', 'in:in_review,approved,rejected,completed'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ]);

        if (! $this->canTransitionTo($memberExitRequest, $data['status'])) {
            return response()->json([
                'message' => 'This exit request can no longer be changed to the selected status.',
            ], 422);
        }

        if (in_array($data['status'], [MemberExitRequest::STATUS_REJECTED, MemberExitRequest::STATUS_COMPLETED], true) && blank($data['notes'] ?? null)) {
            return response()->json([
                'message' => 'Add a processing note before rejecting or completing an exit request.',
            ], 422);
        }

        if (in_array($data['status'], [MemberExitRequest::STATUS_APPROVED, MemberExitRequest::STATUS_COMPLETED], true)
            && ! $this->exitPolicyResolver->canApproveExitRequest($memberExitRequest)) {
            return response()->json([
                'message' => $this->exitPolicyResolver->approvalBlockMessage($memberExitRequest),
            ], 422);
        }

        $memberExitRequest->load(['member.user', 'processedBy']);
        $financialSummary = $this->buildFinancialSummary($memberExitRequest->member);

        $memberExitRequest->fill([
            'status' => $data['status'],
            'outstanding_loan_deduction' => $financialSummary['outstanding_loan_balance'],
            'savings_refund_amount' => $financialSummary['estimated_refund_amount'],
            'processed_by' => $request->user()?->id,
            'processed_at' => now(),
            'notes' => array_key_exists('notes', $data)
                ? (filled($data['notes']) ? $data['notes'] : null)
                : $memberExitRequest->notes,
        ]);

        if ($data['status'] === MemberExitRequest::STATUS_COMPLETED) {
            $memberExitRequest->member->update([
                'membership_status' => 'inactive',
                'left_on' => $memberExitRequest->requested_exit_on ?? today(),
            ]);
        }

        if ($memberExitRequest->status !== MemberExitRequest::STATUS_COMPLETED && $data['status'] !== MemberExitRequest::STATUS_COMPLETED) {
            $memberExitRequest->member->forceFill([
                'left_on' => null,
            ])->save();
        }

        $memberExitRequest->save();
        $memberExitRequest->load(['member.user', 'processedBy']);

        $statusLabel = str_replace('_', ' ', $memberExitRequest->status);

        $this->processNotifier->notifyMember(
            $memberExitRequest->member,
            title: 'Exit request updated',
            message: 'Your member exit request is now marked as ' . $statusLabel . '.',
            category: 'accounts',
            actionUrl: '/dashboard/member/exits',
            actionLabel: 'Open exit requests',
            level: in_array($memberExitRequest->status, [MemberExitRequest::STATUS_APPROVED, MemberExitRequest::STATUS_COMPLETED], true)
                ? 'success'
                : ($memberExitRequest->status === MemberExitRequest::STATUS_REJECTED ? 'warning' : 'info'),
            meta: [
                'exit_request_id' => $memberExitRequest->id,
                'status' => $memberExitRequest->status,
            ],
        );

        $this->auditLogger->log(
            $request->user(),
            'exits.updated',
            $memberExitRequest,
            'Updated member exit request #' . $memberExitRequest->id . ' to ' . $memberExitRequest->status . '.',
            [
                'exit_request_id' => $memberExitRequest->id,
                'member_number' => $memberExitRequest->member?->member_number,
                'status' => $memberExitRequest->status,
                'savings_refund_amount' => $memberExitRequest->savings_refund_amount,
                'outstanding_loan_deduction' => $memberExitRequest->outstanding_loan_deduction,
            ],
        );

        return response()->json([
            'message' => 'Exit request updated successfully.',
            'exit_request' => [
                ...$memberExitRequest->toArray(),
                'current_total_saved_value' => number_format($financialSummary['total_saved_value'], 2, '.', ''),
                'current_outstanding_loan_balance' => number_format($financialSummary['outstanding_loan_balance'], 2, '.', ''),
                'current_estimated_refund_amount' => number_format($financialSummary['estimated_refund_amount'], 2, '.', ''),
                'exit_policy' => $this->exitPolicyResolver->resolveForExitDate($memberExitRequest->requested_exit_on->toDateString()),
                'processor' => $memberExitRequest->processedBy ? [
                    'id' => $memberExitRequest->processedBy->id,
                    'name' => $memberExitRequest->processedBy->name,
                    'email' => $memberExitRequest->processedBy->email,
                    'role' => $memberExitRequest->processedBy->role,
                ] : null,
            ],
        ]);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }

    private function canTransitionTo(MemberExitRequest $memberExitRequest, string $nextStatus): bool
    {
        if ($memberExitRequest->status === $nextStatus) {
            return true;
        }

        return match ($memberExitRequest->status) {
            MemberExitRequest::STATUS_PENDING => in_array($nextStatus, [
                MemberExitRequest::STATUS_IN_REVIEW,
                MemberExitRequest::STATUS_APPROVED,
                MemberExitRequest::STATUS_REJECTED,
            ], true),
            MemberExitRequest::STATUS_IN_REVIEW => in_array($nextStatus, [
                MemberExitRequest::STATUS_APPROVED,
                MemberExitRequest::STATUS_REJECTED,
            ], true),
            MemberExitRequest::STATUS_APPROVED => $nextStatus === MemberExitRequest::STATUS_COMPLETED,
            default => false,
        };
    }

    /**
     * @return array{total_saved_value: float, outstanding_loan_balance: float, estimated_refund_amount: float}
     */
    private function buildFinancialSummary(?Member $member): array
    {
        if (! $member) {
            return [
                'total_saved_value' => 0,
                'outstanding_loan_balance' => 0,
                'estimated_refund_amount' => 0,
            ];
        }

        $totalSavedValue = round((float) SharePurchase::query()
            ->where('member_id', $member->id)
            ->whereIn('payment_status', ['paid', 'confirmed'])
            ->sum('total_amount'), 2);

        $outstandingLoanBalance = round((float) Loan::query()
            ->where('member_id', $member->id)
            ->whereIn('status', ['approved', 'disbursed', 'partially_repaid'])
            ->sum('outstanding_amount'), 2);

        return [
            'total_saved_value' => $totalSavedValue,
            'outstanding_loan_balance' => $outstandingLoanBalance,
            'estimated_refund_amount' => max($totalSavedValue - $outstandingLoanBalance, 0),
        ];
    }
}
