<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\LoanRepaymentSubmission;
use App\Support\AuditLogger;
use App\Support\ProcessNotifier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExcoLoanController extends Controller
{
    public function __construct(
        private readonly ProcessNotifier $processNotifier,
        private readonly AuditLogger $auditLogger
    ) {
    }

    public function index(Request $request)
    {
        $requestedMonth = $request->filled('requested_month')
            ? Carbon::createFromFormat('Y-m', (string) $request->string('requested_month'))->startOfMonth()
            : null;

        $loans = Loan::query()
            ->with(['member', 'guarantor', 'cycle', 'guarantorApprovals', 'disbursement'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($requestedMonth, fn ($query) => $query
                ->whereYear('requested_at', $requestedMonth->year)
                ->whereMonth('requested_at', $requestedMonth->month))
            ->orderByDesc('requested_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($loans);
    }

    public function approve(Request $request, Loan $loan)
    {
        if (! in_array($loan->status, ['guarantor_approved', 'pending_guarantor'], true)) {
            return response()->json([
                'message' => 'Only pending loan requests can be approved.',
            ], 422);
        }

        if ($loan->status === 'pending_guarantor') {
            return response()->json([
                'message' => 'Guarantor approval is still pending for this loan.',
            ], 422);
        }

        $data = $request->validate([
            'approved_amount' => ['nullable', 'numeric', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $updatedLoan = DB::transaction(function () use ($loan, $data) {
            $approvedAmount = (float) ($data['approved_amount'] ?? $loan->requested_amount);
            $serviceChargeAmount = round($approvedAmount * ((float) $loan->service_charge_rate / 100), 2);
            $totalDueAmount = $approvedAmount + $serviceChargeAmount;
            $dueOn = Carbon::parse($loan->requested_at ?? now())
                ->addMonths((int) ($loan->cycle?->loan_duration_months ?? 3))
                ->toDateString();

            $loan->update([
                'approved_amount' => $approvedAmount,
                'service_charge_amount' => $serviceChargeAmount,
                'total_due_amount' => $totalDueAmount,
                'outstanding_amount' => $totalDueAmount,
                'status' => 'approved',
                'approved_at' => now(),
                'due_on' => $dueOn,
                'notes' => $data['notes'] ?? $loan->notes,
            ]);

            return $loan->fresh(['member', 'guarantor', 'cycle', 'guarantorApprovals', 'disbursement']);
        });

        $this->processNotifier->notifyMember(
            $updatedLoan->member,
            title: 'Loan approved',
            message: 'Your loan request has been approved by EXCO.',
            category: 'loans',
            actionUrl: '/dashboard/member/loans',
            actionLabel: 'Open loans',
            level: 'success',
            meta: ['loan_id' => $updatedLoan->id],
        );

        $this->auditLogger->log(
            $request->user(),
            'loans.approved',
            $updatedLoan,
            'Approved loan request #' . $updatedLoan->id . '.',
            [
                'loan_id' => $updatedLoan->id,
                'member_number' => $updatedLoan->member?->member_number,
                'approved_amount' => $updatedLoan->approved_amount,
                'total_due_amount' => $updatedLoan->total_due_amount,
            ],
        );

        return response()->json([
            'message' => 'Loan approved successfully.',
            'loan' => $updatedLoan,
        ]);
    }

    public function reject(Request $request, Loan $loan)
    {
        if (in_array($loan->status, ['disbursed', 'partially_repaid', 'repaid'], true)) {
            return response()->json([
                'message' => 'This loan can no longer be rejected.',
            ], 422);
        }

        $data = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $loan->update([
            'status' => 'rejected',
            'notes' => $data['notes'] ?? $loan->notes,
        ]);

        $freshLoan = $loan->fresh(['member', 'guarantor', 'cycle', 'guarantorApprovals', 'disbursement']);

        $this->processNotifier->notifyMember(
            $freshLoan->member,
            title: 'Loan rejected',
            message: 'Your loan request was reviewed and rejected by EXCO.',
            category: 'loans',
            actionUrl: '/dashboard/member/loans',
            actionLabel: 'Open loans',
            level: 'warning',
            meta: ['loan_id' => $freshLoan->id],
        );

        $this->auditLogger->log(
            $request->user(),
            'loans.rejected',
            $freshLoan,
            'Rejected loan request #' . $freshLoan->id . '.',
            [
                'loan_id' => $freshLoan->id,
                'member_number' => $freshLoan->member?->member_number,
            ],
        );

        return response()->json([
            'message' => 'Loan rejected successfully.',
            'loan' => $freshLoan,
        ]);
    }

    public function disburse(Request $request, Loan $loan)
    {
        if ($loan->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved loans can be disbursed.',
            ], 422);
        }

        $data = $request->validate([
            'payment_method' => ['required', 'string', 'max:50'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'notes' => ['nullable', 'string'],
        ]);

        $receipt = $request->file('receipt');
        $disk = (string) config('jds.receipt_disk', 'public');
        $path = $receipt->store('loan-disbursement-receipts', $disk);

        $updatedLoan = DB::transaction(function () use ($loan, $request, $data, $disk, $path, $receipt) {
            $loan->disbursement()->create([
                'disbursed_by' => $request->user()?->id,
                'amount' => $loan->approved_amount,
                'payment_method' => $data['payment_method'],
                'status' => 'pending_member_confirmation',
                'disbursed_at' => now(),
                'receipt_path' => $path,
                'receipt_disk' => $disk,
                'receipt_original_name' => $receipt->getClientOriginalName(),
                'receipt_mime_type' => $receipt->getMimeType(),
                'receipt_size_bytes' => $receipt->getSize(),
                'payment_reference' => null,
                'notes' => $data['notes'] ?? null,
            ]);

            $loan->update([
                'status' => 'disbursed',
                'disbursed_at' => now(),
            ]);

            return $loan->fresh(['member', 'guarantor', 'cycle', 'guarantorApprovals', 'disbursement']);
        });

        $this->processNotifier->notifyMember(
            $updatedLoan->member,
            title: 'Loan disbursed',
            message: 'Your approved loan has been disbursed. Please view the receipt and confirm it in the app.',
            category: 'loans',
            actionUrl: '/dashboard/member/loans',
            actionLabel: 'View receipt',
            level: 'success',
            meta: ['loan_id' => $updatedLoan->id],
        );

        $this->auditLogger->log(
            $request->user(),
            'loans.disbursed',
            $updatedLoan,
            'Disbursed approved loan #' . $updatedLoan->id . '.',
            [
                'loan_id' => $updatedLoan->id,
                'member_number' => $updatedLoan->member?->member_number,
                'amount' => $updatedLoan->approved_amount,
                'payment_method' => $data['payment_method'],
            ],
        );

        return response()->json([
            'message' => 'Loan disbursed successfully.',
            'loan' => $updatedLoan,
        ]);
    }

    public function repaymentSubmissions(Request $request)
    {
        $submissions = LoanRepaymentSubmission::query()
            ->with(['loan.member', 'loan.cycle', 'member', 'reviewer', 'approvedLoanRepayment'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($submissions);
    }

    public function reviewRepaymentSubmission(Request $request, LoanRepaymentSubmission $loanRepaymentSubmission)
    {
        if ($loanRepaymentSubmission->status !== 'pending') {
            return response()->json([
                'message' => 'This repayment submission has already been reviewed.',
            ], 422);
        }

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_note' => ['nullable', 'string'],
        ]);

        $submission = $loanRepaymentSubmission->load(['loan.member', 'loan.cycle']);
        $loan = $submission->loan;

        if (! $loan || ! in_array($loan->status, ['disbursed', 'partially_repaid'], true)) {
            return response()->json([
                'message' => 'Only active disbursed loans can accept repayment approval.',
            ], 422);
        }

        $reviewNote = $data['review_note'] ?? null;

        $updatedLoan = DB::transaction(function () use ($loan, $submission, $request, $data, $reviewNote) {
            $approvedRepayment = null;

            if ($data['status'] === 'approved') {
                $amountPaid = (float) $submission->amount_paid;
                $currentOutstanding = (float) ($loan->outstanding_amount ?? $loan->total_due_amount ?? 0);
                $balanceAfterPayment = max($currentOutstanding - $amountPaid, 0);

                $approvedRepayment = LoanRepayment::query()->create([
                    'loan_id' => $loan->id,
                    'member_id' => $loan->member_id,
                    'received_by' => $request->user()?->id,
                    'amount_paid' => $amountPaid,
                    'balance_after_payment' => $balanceAfterPayment,
                    'payment_method' => 'bank_transfer',
                    'status' => 'posted',
                    'paid_at' => $submission->submitted_at ?? now(),
                    'payment_reference' => null,
                    'notes' => $reviewNote ?: $submission->member_note,
                ]);

                $loan->update([
                    'outstanding_amount' => $balanceAfterPayment,
                    'status' => $balanceAfterPayment <= 0 ? 'repaid' : 'partially_repaid',
                    'repaid_at' => $balanceAfterPayment <= 0 ? now() : null,
                ]);
            }

            $submission->update([
                'status' => $data['status'],
                'reviewed_by' => $request->user()?->id,
                'reviewed_at' => now(),
                'approved_loan_repayment_id' => $approvedRepayment?->id,
                'review_note' => $reviewNote,
            ]);

            return $loan->fresh(['member', 'guarantor', 'cycle', 'guarantorApprovals', 'disbursement', 'repayments', 'repaymentSubmissions']);
        });

        $this->processNotifier->notifyMember(
            $updatedLoan->member,
            title: $data['status'] === 'approved' ? 'Repayment approved' : 'Repayment update',
            message: $data['status'] === 'approved'
                ? 'Your repayment receipt has been approved and applied to your loan balance.'
                : 'Your repayment receipt was reviewed and rejected. Please check the note and resubmit if needed.',
            category: 'loans',
            actionUrl: '/dashboard/member/loans',
            actionLabel: 'Open loans',
            level: $data['status'] === 'approved' ? 'success' : 'warning',
            meta: [
                'loan_id' => $updatedLoan->id,
                'submission_id' => $loanRepaymentSubmission->id,
            ],
        );

        $this->auditLogger->log(
            $request->user(),
            $data['status'] === 'approved' ? 'loans.repayment_approved' : 'loans.repayment_rejected',
            $loanRepaymentSubmission,
            sprintf(
                '%s repayment submission #%d for loan #%d.',
                $data['status'] === 'approved' ? 'Approved' : 'Rejected',
                $loanRepaymentSubmission->id,
                $updatedLoan->id
            ),
            [
                'loan_id' => $updatedLoan->id,
                'submission_id' => $loanRepaymentSubmission->id,
                'member_number' => $updatedLoan->member?->member_number,
                'status' => $data['status'],
                'amount_paid' => $loanRepaymentSubmission->amount_paid,
            ],
        );

        return response()->json([
            'message' => $data['status'] === 'approved'
                ? 'Loan repayment receipt approved and repayment posted successfully.'
                : 'Loan repayment receipt rejected successfully.',
            'loan' => $updatedLoan,
            'submission' => $loanRepaymentSubmission->fresh(['loan.member', 'loan.cycle', 'member', 'reviewer', 'approvedLoanRepayment']),
        ]);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }
}
