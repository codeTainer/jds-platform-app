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

class MemberExitRequestController extends Controller
{
    public function __construct(
        private readonly ProcessNotifier $processNotifier,
        private readonly AuditLogger $auditLogger,
        private readonly ExitPolicyResolver $exitPolicyResolver
    ) {
    }

    public function overview(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        return response()->json([
            'member' => [
                'id' => $member->id,
                'member_number' => $member->member_number,
                'full_name' => $member->full_name,
                'membership_status' => $member->membership_status,
                'left_on' => optional($member->left_on)->toDateString(),
            ],
            'summary' => $this->buildExitSummary($member),
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

        $requests = $member->exitRequests()
            ->with('processedBy')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        $requests->setCollection(
            $requests->getCollection()->map(fn (MemberExitRequest $exitRequest) => $this->serializeExitRequest($exitRequest))
        );

        return response()->json($requests);
    }

    public function store(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        if ($member->membership_status !== 'active') {
            return response()->json([
                'message' => 'Only active members can submit an exit request.',
            ], 422);
        }

        $hasOpenRequest = $member->exitRequests()
            ->whereIn('status', [
                MemberExitRequest::STATUS_PENDING,
                MemberExitRequest::STATUS_IN_REVIEW,
                MemberExitRequest::STATUS_APPROVED,
            ])->exists();

        if ($hasOpenRequest) {
            return response()->json([
                'message' => 'You already have an exit request that is still being processed.',
            ], 422);
        }

        $data = $request->validate([
            'notice_given_on' => ['required', 'date'],
            'requested_exit_on' => ['required', 'date', 'after_or_equal:notice_given_on'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ]);

        $summary = $this->buildExitSummary($member);

        $exitRequest = MemberExitRequest::query()->create([
            'member_id' => $member->id,
            'notice_given_on' => $data['notice_given_on'],
            'requested_exit_on' => $data['requested_exit_on'],
            'status' => MemberExitRequest::STATUS_PENDING,
            'outstanding_loan_deduction' => $summary['outstanding_loan_balance'],
            'savings_refund_amount' => $summary['estimated_refund_amount'],
            'notes' => $data['notes'] ?? null,
        ])->load(['member', 'processedBy']);

        $this->processNotifier->notifyExco(
            title: 'New exit request submitted',
            message: $member->full_name . ' submitted a member exit request for EXCO review.',
            category: 'accounts',
            actionUrl: '/dashboard/exco/exits',
            actionLabel: 'Open exit desk',
            level: 'warning',
            meta: [
                'exit_request_id' => $exitRequest->id,
                'member_id' => $member->id,
            ],
            exceptUserId: $request->user()?->id,
        );

        $this->auditLogger->log(
            $request->user(),
            'exits.requested',
            $exitRequest,
            'Submitted a member exit request.',
            [
                'exit_request_id' => $exitRequest->id,
                'member_number' => $member->member_number,
                'requested_exit_on' => $exitRequest->requested_exit_on?->toDateString(),
                'estimated_refund_amount' => $exitRequest->savings_refund_amount,
                'outstanding_loan_deduction' => $exitRequest->outstanding_loan_deduction,
            ],
        );

        return response()->json([
            'message' => 'Exit request submitted successfully and is awaiting EXCO review.',
            'exit_request' => $this->serializeExitRequest($exitRequest),
        ], 201);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }

    private function serializeExitRequest(MemberExitRequest $exitRequest): array
    {
        return [
            ...$exitRequest->toArray(),
            'exit_policy' => $this->exitPolicyResolver->resolveForExitDate($exitRequest->requested_exit_on->toDateString()),
            'processor' => $exitRequest->processedBy ? [
                'id' => $exitRequest->processedBy->id,
                'name' => $exitRequest->processedBy->name,
                'email' => $exitRequest->processedBy->email,
                'role' => $exitRequest->processedBy->role,
            ] : null,
        ];
    }

    /**
     * @return array{total_saved_value: float, outstanding_loan_balance: float, estimated_refund_amount: float, latest_exit_request_status: string|null}
     */
    private function buildExitSummary(Member $member): array
    {
        $totalSavedValue = round((float) SharePurchase::query()
            ->where('member_id', $member->id)
            ->whereIn('payment_status', ['paid', 'confirmed'])
            ->sum('total_amount'), 2);

        $outstandingLoanBalance = round((float) Loan::query()
            ->where('member_id', $member->id)
            ->whereIn('status', ['approved', 'disbursed', 'partially_repaid'])
            ->sum('outstanding_amount'), 2);

        $latestExitRequestStatus = $member->exitRequests()
            ->latest('id')
            ->value('status');

        return [
            'total_saved_value' => $totalSavedValue,
            'outstanding_loan_balance' => $outstandingLoanBalance,
            'estimated_refund_amount' => max($totalSavedValue - $outstandingLoanBalance, 0),
            'latest_exit_request_status' => $latestExitRequestStatus,
        ];
    }
}
