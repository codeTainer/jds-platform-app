<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\LoanGuarantorApproval;
use App\Models\LoanRepaymentSubmission;
use App\Models\MembershipCycle;
use App\Support\AuditLogger;
use App\Support\ProcessNotifier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MemberLoanController extends Controller
{
    public function __construct(
        private readonly ProcessNotifier $processNotifier,
        private readonly AuditLogger $auditLogger
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

        $cycle = MembershipCycle::query()->where('is_active', true)->first();
        $shareValue = (float) $member->sharePurchases()
            ->whereIn('payment_status', ['paid', 'confirmed'])
            ->sum('total_amount');

        $loanMultiplier = $cycle ? (float) $cycle->loan_multiplier : 0;
        $eligibleAmount = $shareValue * $loanMultiplier;
        $requestBlockReason = null;

        $activeLoan = $member->loans()
            ->whereIn('status', ['pending_guarantor', 'guarantor_approved', 'approved', 'disbursed', 'partially_repaid'])
            ->latest('id')
            ->first();

        if ($activeLoan) {
            $requestBlockReason = 'You already have a loan that has not been fully repaid. Another loan can only be requested after the current one is cleared.';
        } elseif ($eligibleAmount <= 0) {
            $requestBlockReason = 'You are not yet eligible for a loan because there are no confirmed share purchases on your account.';
        }

        return response()->json([
            'summary' => [
                'share_value' => number_format($shareValue, 2, '.', ''),
                'loan_multiplier' => number_format($loanMultiplier, 2, '.', ''),
                'eligible_amount' => number_format($eligibleAmount, 2, '.', ''),
                'can_request' => $eligibleAmount > 0 && ! $activeLoan,
                'request_block_reason' => $requestBlockReason,
                'active_loan' => $activeLoan?->load(['guarantor', 'guarantorApprovals', 'disbursement']),
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

        $loans = $member->loans()
            ->with(['cycle', 'guarantor', 'guarantorApprovals', 'disbursement', 'repayments'])
            ->orderByDesc('requested_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($loans);
    }

    public function store(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $cycle = MembershipCycle::query()->where('is_active', true)->first();

        if (! $cycle) {
            return response()->json([
                'message' => 'No active membership cycle is configured.',
            ], 422);
        }

        if ((int) now()->month === (int) $cycle->loan_pause_month) {
            return response()->json([
                'message' => 'Loan requests are paused for this month.',
            ], 422);
        }

        if (! $this->canRequestLoan($member->id)) {
            return response()->json([
                'message' => 'You already have an active loan or a pending request in progress.',
            ], 422);
        }

        $data = $request->validate([
            'requested_amount' => ['required', 'numeric', 'min:1'],
            'guarantor_member_id' => [
                'required',
                'integer',
                'exists:members,id',
                Rule::notIn([$member->id]),
            ],
            'purpose' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $eligibleAmount = $this->eligibleAmount($member->id, $cycle);

        if ((float) $data['requested_amount'] > $eligibleAmount) {
            return response()->json([
                'message' => 'Requested amount exceeds your current loan eligibility.',
            ], 422);
        }

        if ($this->guarantorHasActiveGuaranteedLoan((int) $data['guarantor_member_id'])) {
            return response()->json([
                'message' => 'Selected guarantor already has another unpaid guaranteed loan.',
            ], 422);
        }

        $loan = DB::transaction(function () use ($cycle, $member, $data) {
            $loan = Loan::create([
                'membership_cycle_id' => $cycle->id,
                'member_id' => $member->id,
                'guarantor_member_id' => $data['guarantor_member_id'],
                'requested_amount' => $data['requested_amount'],
                'service_charge_rate' => $cycle->loan_service_charge_rate,
                'status' => 'pending_guarantor',
                'purpose' => $data['purpose'] ?? null,
                'requested_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            LoanGuarantorApproval::create([
                'loan_id' => $loan->id,
                'guarantor_member_id' => $data['guarantor_member_id'],
                'status' => 'pending',
            ]);

            return $loan;
        });

        $loadedLoan = $loan->load(['cycle', 'guarantor', 'guarantorApprovals']);

        $this->processNotifier->notifyMember(
            $member,
            title: 'Loan request sent',
            message: 'Your loan request has been submitted successfully and is awaiting guarantor response.',
            category: 'loans',
            actionUrl: '/dashboard/member/loans',
            actionLabel: 'Open loans',
            level: 'success',
            meta: ['loan_id' => $loan->id],
        );

        $this->processNotifier->notifyMember(
            $loadedLoan->guarantor,
            title: 'Guarantor request sent',
            message: "{$member->full_name} selected you as guarantor for a loan request.",
            category: 'loans',
            actionUrl: '/dashboard/member/loans',
            actionLabel: 'Review request',
            level: 'info',
            meta: ['loan_id' => $loan->id],
        );

        $this->processNotifier->notifyExco(
            title: 'New loan request submitted',
            message: "{$member->full_name} submitted a new loan request that is awaiting guarantor approval.",
            category: 'loans',
            actionUrl: '/dashboard/exco/loans',
            actionLabel: 'Open loans',
            level: 'info',
            meta: ['loan_id' => $loan->id],
        );

        $this->auditLogger->log(
            $request->user(),
            'loans.requested',
            $loan,
            'Submitted a new loan request.',
            [
                'loan_id' => $loan->id,
                'member_number' => $member->member_number,
                'cycle_code' => $cycle->code,
                'requested_amount' => $loan->requested_amount,
                'guarantor_member_number' => $loadedLoan->guarantor?->member_number,
            ],
        );

        return response()->json([
            'message' => 'Loan request submitted successfully.',
            'loan' => $loadedLoan,
        ], 201);
    }

    public function guarantorApprovals(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $approvals = LoanGuarantorApproval::query()
            ->with(['loan.member', 'loan.cycle'])
            ->where('guarantor_member_id', $member->id)
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($approvals);
    }

    public function availableGuarantors(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $guarantors = DB::table('members')
            ->select(['id', 'member_number', 'full_name', 'email'])
            ->where('id', '!=', $member->id)
            ->where('membership_status', 'active')
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('loans')
                    ->whereColumn('loans.guarantor_member_id', 'members.id')
                    ->whereIn('loans.status', ['pending_guarantor', 'guarantor_approved', 'approved', 'disbursed', 'partially_repaid']);
            })
            ->orderBy('full_name')
            ->get();

        return response()->json($guarantors);
    }

    public function respondToGuarantorApproval(Request $request, LoanGuarantorApproval $loanGuarantorApproval)
    {
        $member = $request->user()?->member;

        if (! $member || $loanGuarantorApproval->guarantor_member_id !== $member->id) {
            return response()->json([
                'message' => 'You are not authorized to respond to this guarantor request.',
            ], 403);
        }

        if ($loanGuarantorApproval->status !== 'pending') {
            return response()->json([
                'message' => 'This guarantor request has already been responded to.',
            ], 422);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'response_note' => ['nullable', 'string'],
        ]);

        if ($data['status'] === 'approved' && $this->guarantorHasActiveGuaranteedLoan($member->id, $loanGuarantorApproval->loan_id)) {
            return response()->json([
                'message' => 'You already guarantee another unpaid loan and cannot approve this one.',
            ], 422);
        }

        $approval = DB::transaction(function () use ($loanGuarantorApproval, $data) {
            $loanGuarantorApproval->update([
                'status' => $data['status'],
                'responded_at' => now(),
                'response_note' => $data['response_note'] ?? null,
            ]);

            $loan = $loanGuarantorApproval->loan;

            $loan->update([
                'status' => $data['status'] === 'approved' ? 'guarantor_approved' : 'rejected',
            ]);

            return $loanGuarantorApproval->fresh(['loan.member', 'loan.cycle']);
        });

        $loan = $approval->loan;

        $this->processNotifier->notifyMember(
            $loan?->member,
            title: $data['status'] === 'approved' ? 'Guarantor approved your request' : 'Guarantor rejected your request',
            message: $data['status'] === 'approved'
                ? 'Your guarantor has approved your loan request. EXCO can now continue the review.'
                : 'Your guarantor declined your loan request.',
            category: 'loans',
            actionUrl: '/dashboard/member/loans',
            actionLabel: 'Open loans',
            level: $data['status'] === 'approved' ? 'success' : 'warning',
            meta: ['loan_id' => $approval->loan_id],
        );

        if ($data['status'] === 'approved' && $loan) {
            $this->processNotifier->notifyExco(
                title: 'Loan ready for EXCO review',
                message: "{$loan->member?->full_name} now has full guarantor approval on a loan request.",
                category: 'loans',
                actionUrl: '/dashboard/exco/loans',
                actionLabel: 'Review loan',
                level: 'info',
                meta: ['loan_id' => $approval->loan_id],
            );
        }

        $this->auditLogger->log(
            $request->user(),
            $data['status'] === 'approved' ? 'loans.guarantor_approved' : 'loans.guarantor_rejected',
            $loan ?? $loanGuarantorApproval,
            sprintf(
                '%s guarantor request for loan #%d.',
                $data['status'] === 'approved' ? 'Approved' : 'Rejected',
                $approval->loan_id
            ),
            [
                'loan_id' => $approval->loan_id,
                'guarantor_member_number' => $member->member_number,
                'status' => $data['status'],
            ],
        );

        return response()->json([
            'message' => 'Guarantor response recorded successfully.',
            'approval' => $approval,
        ]);
    }

    public function destroy(Request $request, Loan $loan)
    {
        $member = $request->user()?->member;

        if (! $member || $loan->member_id !== $member->id) {
            return response()->json([
                'message' => 'You are not authorized to delete this loan request.',
            ], 403);
        }

        if (in_array($loan->status, ['disbursed', 'partially_repaid', 'repaid'], true) || $loan->disbursement()->exists()) {
            return response()->json([
                'message' => 'A loan request can only be deleted before it is disbursed.',
            ], 422);
        }

        $loanId = $loan->id;
        $memberNumber = $member->member_number;
        $requestedAmount = $loan->requested_amount;
        $loan->delete();

        $this->auditLogger->log(
            $request->user(),
            'loans.deleted',
            Loan::class,
            'Deleted loan request #' . $loanId . ' before disbursement.',
            [
                'loan_id' => $loanId,
                'member_number' => $memberNumber,
                'requested_amount' => $requestedAmount,
            ],
        );

        return response()->json([
            'message' => 'Loan request deleted successfully.',
        ]);
    }

    public function confirmDisbursement(Request $request, Loan $loan)
    {
        $member = $request->user()?->member;

        if (! $member || $loan->member_id !== $member->id) {
            return response()->json([
                'message' => 'You are not authorized to confirm this loan disbursement.',
            ], 403);
        }

        $disbursement = $loan->disbursement;

        if (! $disbursement) {
            return response()->json([
                'message' => 'No disbursement receipt has been posted for this loan yet.',
            ], 422);
        }

        if ($disbursement->member_confirmed_at) {
            return response()->json([
                'message' => 'This loan disbursement has already been confirmed.',
            ], 422);
        }

        $disbursement->update([
            'status' => 'member_confirmed',
            'member_confirmed_at' => now(),
        ]);

        $this->processNotifier->notifyExco(
            title: 'Loan receipt confirmed',
            message: "{$member->full_name} confirmed receipt of a disbursed loan.",
            category: 'loans',
            actionUrl: '/dashboard/exco/loans',
            actionLabel: 'Open loans',
            level: 'success',
            meta: ['loan_id' => $loan->id],
        );

        $this->auditLogger->log(
            $request->user(),
            'loans.disbursement_confirmed',
            $loan,
            'Confirmed receipt of a disbursed loan.',
            [
                'loan_id' => $loan->id,
                'member_number' => $member->member_number,
            ],
        );

        return response()->json([
            'message' => 'Loan receipt confirmed successfully.',
            'loan' => $loan->fresh(['cycle', 'guarantor', 'guarantorApprovals', 'disbursement', 'repayments']),
        ]);
    }

    public function repaymentSubmissions(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $submissions = LoanRepaymentSubmission::query()
            ->with(['loan.cycle', 'reviewer', 'approvedLoanRepayment'])
            ->where('member_id', $member->id)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($submissions);
    }

    public function storeRepaymentSubmission(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $data = $request->validate([
            'loan_id' => ['required', 'integer', 'exists:loans,id'],
            'amount_paid' => ['required', 'numeric', 'min:0.01'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'member_note' => ['nullable', 'string'],
        ]);

        /** @var Loan $loan */
        $loan = Loan::query()
            ->with('member')
            ->findOrFail($data['loan_id']);

        if ($loan->member_id !== $member->id) {
            return response()->json([
                'message' => 'You can only submit a repayment receipt for your own loan.',
            ], 403);
        }

        if (! in_array($loan->status, ['disbursed', 'partially_repaid'], true)) {
            return response()->json([
                'message' => 'Repayment receipts can only be submitted for a disbursed loan that is still active.',
            ], 422);
        }

        if ((float) ($loan->outstanding_amount ?? 0) <= 0) {
            return response()->json([
                'message' => 'This loan is already fully repaid.',
            ], 422);
        }

        $pendingSubmissionExists = LoanRepaymentSubmission::query()
            ->where('loan_id', $loan->id)
            ->where('member_id', $member->id)
            ->where('status', 'pending')
            ->exists();

        if ($pendingSubmissionExists) {
            return response()->json([
                'message' => 'A repayment receipt for this loan is already waiting for EXCO review.',
            ], 422);
        }

        $receipt = $request->file('receipt');
        $disk = (string) config('jds.receipt_disk', 'public');
        $path = $receipt->store('loan-repayment-receipts', $disk);

        $submission = LoanRepaymentSubmission::query()->create([
            'loan_id' => $loan->id,
            'member_id' => $member->id,
            'amount_paid' => $data['amount_paid'],
            'receipt_path' => $path,
            'receipt_disk' => $disk,
            'receipt_original_name' => $receipt->getClientOriginalName(),
            'receipt_mime_type' => $receipt->getMimeType(),
            'receipt_size_bytes' => $receipt->getSize(),
            'status' => 'pending',
            'submitted_at' => now(),
            'member_note' => $data['member_note'] ?? null,
        ])->load(['loan.cycle', 'reviewer', 'approvedLoanRepayment']);

        $this->processNotifier->notifyExco(
            title: 'New repayment receipt submitted',
            message: "{$member->full_name} submitted a loan repayment receipt for EXCO review.",
            category: 'loans',
            actionUrl: '/dashboard/exco/loans',
            actionLabel: 'Review repayments',
            level: 'info',
            meta: [
                'loan_id' => $loan->id,
                'submission_id' => $submission->id,
            ],
        );

        $this->auditLogger->log(
            $request->user(),
            'loans.repayment_submitted',
            $submission,
            'Submitted a loan repayment receipt for review.',
            [
                'loan_id' => $loan->id,
                'submission_id' => $submission->id,
                'member_number' => $member->member_number,
                'amount_paid' => $submission->amount_paid,
            ],
        );

        return response()->json([
            'message' => 'Loan repayment receipt submitted successfully for EXCO review.',
            'submission' => $submission,
        ], 201);
    }

    private function canRequestLoan(int $memberId): bool
    {
        return ! Loan::query()
            ->where('member_id', $memberId)
            ->whereIn('status', ['pending_guarantor', 'guarantor_approved', 'approved', 'disbursed', 'partially_repaid'])
            ->exists();
    }

    private function guarantorHasActiveGuaranteedLoan(int $guarantorMemberId, ?int $ignoreLoanId = null): bool
    {
        return Loan::query()
            ->where('guarantor_member_id', $guarantorMemberId)
            ->when($ignoreLoanId, fn ($query) => $query->whereKeyNot($ignoreLoanId))
            ->whereIn('status', ['pending_guarantor', 'guarantor_approved', 'approved', 'disbursed', 'partially_repaid'])
            ->exists();
    }

    private function eligibleAmount(int $memberId, MembershipCycle $cycle): float
    {
        $shareValue = (float) DB::table('share_purchases')
            ->where('member_id', $memberId)
            ->whereIn('payment_status', ['paid', 'confirmed'])
            ->sum('total_amount');

        return $shareValue * (float) $cycle->loan_multiplier;
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }
}
