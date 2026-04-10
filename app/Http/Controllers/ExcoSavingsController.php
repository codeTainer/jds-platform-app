<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MembershipCycle;
use App\Models\MembershipFee;
use App\Models\MembershipFeeSubmission;
use App\Models\SharePurchase;
use App\Models\SharePaymentSubmission;
use App\Support\ProcessNotifier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class ExcoSavingsController extends Controller
{
    public function __construct(
        private readonly ProcessNotifier $processNotifier
    ) {
    }

    public function membershipFees(Request $request)
    {
        $paidMonth = $request->filled('paid_month')
            ? Carbon::createFromFormat('Y-m', (string) $request->string('paid_month'))->startOfMonth()
            : null;

        $fees = MembershipFee::query()
            ->with(['member', 'cycle'])
            ->when($request->filled('member_id'), fn ($query) => $query->where('member_id', $request->integer('member_id')))
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('fee_type'), fn ($query) => $query->where('fee_type', $request->string('fee_type')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($paidMonth, fn ($query) => $query
                ->whereYear('paid_at', $paidMonth->year)
                ->whereMonth('paid_at', $paidMonth->month))
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($fees);
    }

    public function sharePurchases(Request $request)
    {
        $shareMonth = $request->filled('share_month')
            ? Carbon::createFromFormat('Y-m', (string) $request->string('share_month'))->startOfMonth()
            : null;

        $purchases = SharePurchase::query()
            ->with(['member', 'cycle', 'confirmer'])
            ->when($request->filled('member_id'), fn ($query) => $query->where('member_id', $request->integer('member_id')))
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('payment_status'), fn ($query) => $query->where('payment_status', $request->string('payment_status')))
            ->when($shareMonth, fn ($query) => $query
                ->whereYear('share_month', $shareMonth->year)
                ->whereMonth('share_month', $shareMonth->month))
            ->orderByDesc('share_month')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($purchases);
    }

    public function sharePaymentSubmissions(Request $request)
    {
        $shareMonth = $request->filled('share_month')
            ? Carbon::createFromFormat('Y-m', (string) $request->string('share_month'))->startOfMonth()
            : null;

        $submissions = SharePaymentSubmission::query()
            ->with(['member', 'cycle', 'reviewer', 'approvedSharePurchase'])
            ->when($request->filled('member_id'), fn ($query) => $query->where('member_id', $request->integer('member_id')))
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($shareMonth, fn ($query) => $query
                ->whereYear('share_month', $shareMonth->year)
                ->whereMonth('share_month', $shareMonth->month))
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($submissions);
    }

    public function membershipFeeSubmissions(Request $request)
    {
        $submissions = MembershipFeeSubmission::query()
            ->with(['member', 'cycle', 'reviewer', 'approvedMembershipFee'])
            ->when($request->filled('member_id'), fn ($query) => $query->where('member_id', $request->integer('member_id')))
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('fee_type'), fn ($query) => $query->where('fee_type', $request->string('fee_type')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($submissions);
    }

    public function storeSharePurchase(Request $request)
    {
        $cycle = $this->resolveCycle($request);

        $data = $request->validate([
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'membership_cycle_id' => ['nullable', 'integer', 'exists:membership_cycles,id'],
            'share_month' => ['required', 'date'],
            'shares_count' => ['required', 'integer', 'min:1'],
            'unit_share_price' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['sometimes', Rule::in(['pending', 'paid', 'confirmed'])],
            'purchased_at' => ['nullable', 'date'],
            'confirmed_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($data['shares_count'] < $cycle->min_monthly_shares || $data['shares_count'] > $cycle->max_monthly_shares) {
            return response()->json([
                'message' => "Shares for a month must be between {$cycle->min_monthly_shares} and {$cycle->max_monthly_shares}.",
            ], 422);
        }

        $shareMonth = Carbon::parse($data['share_month'])->startOfMonth()->toDateString();

        $exists = SharePurchase::query()
            ->where('member_id', $data['member_id'])
            ->whereDate('share_month', $shareMonth)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A share purchase already exists for this member and month.',
            ], 422);
        }

        $unitSharePrice = $data['unit_share_price'] ?? $cycle->share_price;
        $paymentStatus = $data['payment_status'] ?? 'pending';
        $confirmedBy = in_array($paymentStatus, ['paid', 'confirmed'], true) ? $request->user()?->id : null;

        $purchase = SharePurchase::create([
            'membership_cycle_id' => $cycle->id,
            'member_id' => $data['member_id'],
            'share_month' => $shareMonth,
            'shares_count' => $data['shares_count'],
            'unit_share_price' => $unitSharePrice,
            'total_amount' => bcmul((string) $unitSharePrice, (string) $data['shares_count'], 2),
            'payment_status' => $paymentStatus,
            'purchased_at' => $paymentStatus === 'pending' ? ($data['purchased_at'] ?? null) : ($data['purchased_at'] ?? now()),
            'confirmed_at' => $paymentStatus === 'confirmed' ? ($data['confirmed_at'] ?? now()) : null,
            'confirmed_by' => $paymentStatus === 'confirmed' ? $confirmedBy : null,
            'notes' => $data['notes'] ?? null,
        ])->load(['member', 'cycle', 'confirmer']);

        return response()->json([
            'message' => 'Share purchase recorded successfully.',
            'share_purchase' => $purchase,
        ], 201);
    }

    public function reviewSharePaymentSubmission(Request $request, SharePaymentSubmission $sharePaymentSubmission)
    {
        if ($sharePaymentSubmission->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending share payment submissions can be reviewed.',
            ], 422);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'review_note' => ['nullable', 'string'],
        ]);
        $reviewNote = $data['review_note'] ?? null;

        $submission = DB::transaction(function () use ($request, $sharePaymentSubmission, $data, $reviewNote) {
            if ($data['status'] === 'approved') {
                $existing = SharePurchase::query()
                    ->where('member_id', $sharePaymentSubmission->member_id)
                    ->whereDate('share_month', $sharePaymentSubmission->share_month)
                    ->exists();

                if ($existing) {
                    throw new HttpResponseException(response()->json([
                        'message' => 'An official share purchase already exists for this member and month.',
                    ], 422));
                }

                $purchase = SharePurchase::create([
                    'membership_cycle_id' => $sharePaymentSubmission->membership_cycle_id,
                    'member_id' => $sharePaymentSubmission->member_id,
                    'share_month' => $sharePaymentSubmission->share_month,
                    'shares_count' => $sharePaymentSubmission->shares_count,
                    'unit_share_price' => $sharePaymentSubmission->unit_share_price,
                    'total_amount' => $sharePaymentSubmission->expected_amount,
                    'payment_status' => 'confirmed',
                    'purchased_at' => $sharePaymentSubmission->submitted_at ?? now(),
                    'confirmed_at' => now(),
                    'confirmed_by' => $request->user()?->id,
                    'notes' => $reviewNote
                        ? trim(($sharePaymentSubmission->member_note ? $sharePaymentSubmission->member_note . PHP_EOL : '') . 'Review note: ' . $reviewNote)
                        : $sharePaymentSubmission->member_note,
                ]);

                $sharePaymentSubmission->update([
                    'status' => 'approved',
                    'reviewed_by' => $request->user()?->id,
                    'reviewed_at' => now(),
                    'approved_share_purchase_id' => $purchase->id,
                    'review_note' => $reviewNote,
                ]);
            } else {
                $sharePaymentSubmission->update([
                    'status' => 'rejected',
                    'reviewed_by' => $request->user()?->id,
                    'reviewed_at' => now(),
                    'review_note' => $reviewNote,
                ]);
            }

            return $sharePaymentSubmission->fresh(['member', 'cycle', 'reviewer', 'approvedSharePurchase']);
        });

        $this->processNotifier->notifyMember(
            $submission->member,
            title: $data['status'] === 'approved' ? 'Share purchase approved' : 'Share purchase update',
            message: $data['status'] === 'approved'
                ? 'Your share payment receipt has been approved and posted to your savings record.'
                : 'Your share payment receipt was reviewed and rejected. Please check the review note and resubmit if needed.',
            category: 'shares',
            actionUrl: '/dashboard/member/savings',
            actionLabel: 'Open savings',
            level: $data['status'] === 'approved' ? 'success' : 'warning',
            meta: [
                'submission_id' => $submission->id,
                'status' => $submission->status,
            ],
        );

        return response()->json([
            'message' => $data['status'] === 'approved'
                ? 'Share payment submission approved and posted successfully.'
                : 'Share payment submission rejected successfully.',
            'submission' => $submission,
        ]);
    }

    public function reviewMembershipFeeSubmission(Request $request, MembershipFeeSubmission $membershipFeeSubmission)
    {
        if ($membershipFeeSubmission->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending membership fee submissions can be reviewed.',
            ], 422);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'review_note' => ['nullable', 'string'],
        ]);
        $reviewNote = $data['review_note'] ?? null;

        $submission = DB::transaction(function () use ($request, $membershipFeeSubmission, $data, $reviewNote) {
            if ($data['status'] === 'approved') {
                $existing = MembershipFee::query()
                    ->where('member_id', $membershipFeeSubmission->member_id)
                    ->where('membership_cycle_id', $membershipFeeSubmission->membership_cycle_id)
                    ->where('fee_type', $membershipFeeSubmission->fee_type)
                    ->exists();

                if ($existing) {
                    throw new HttpResponseException(response()->json([
                        'message' => 'An official membership fee already exists for this member, cycle, and fee type.',
                    ], 422));
                }

                $fee = MembershipFee::create([
                    'membership_cycle_id' => $membershipFeeSubmission->membership_cycle_id,
                    'member_id' => $membershipFeeSubmission->member_id,
                    'fee_type' => $membershipFeeSubmission->fee_type,
                    'amount' => $membershipFeeSubmission->expected_amount,
                    'status' => 'paid',
                    'paid_at' => $membershipFeeSubmission->submitted_at ?? now(),
                    'notes' => $reviewNote
                        ? trim(($membershipFeeSubmission->member_note ? $membershipFeeSubmission->member_note . PHP_EOL : '') . 'Review note: ' . $reviewNote)
                        : $membershipFeeSubmission->member_note,
                ]);

                $membershipFeeSubmission->update([
                    'status' => 'approved',
                    'reviewed_by' => $request->user()?->id,
                    'reviewed_at' => now(),
                    'approved_membership_fee_id' => $fee->id,
                    'review_note' => $reviewNote,
                ]);
            } else {
                $membershipFeeSubmission->update([
                    'status' => 'rejected',
                    'reviewed_by' => $request->user()?->id,
                    'reviewed_at' => now(),
                    'review_note' => $reviewNote,
                ]);
            }

            return $membershipFeeSubmission->fresh(['member', 'cycle', 'reviewer', 'approvedMembershipFee']);
        });

        $this->processNotifier->notifyMember(
            $submission->member,
            title: $data['status'] === 'approved' ? 'Membership fee approved' : 'Membership fee update',
            message: $data['status'] === 'approved'
                ? 'Your membership fee receipt has been approved and posted to your fee records.'
                : 'Your membership fee receipt was reviewed and rejected. Please check the review note and resubmit if needed.',
            category: 'fees',
            actionUrl: '/dashboard/member/savings',
            actionLabel: 'Open fee records',
            level: $data['status'] === 'approved' ? 'success' : 'warning',
            meta: [
                'submission_id' => $submission->id,
                'status' => $submission->status,
            ],
        );

        return response()->json([
            'message' => $data['status'] === 'approved'
                ? 'Membership fee submission approved and posted successfully.'
                : 'Membership fee submission rejected successfully.',
            'submission' => $submission,
        ]);
    }

    public function memberShareHistory(Request $request, Member $member)
    {
        $shareMonth = $request->filled('share_month')
            ? Carbon::createFromFormat('Y-m', (string) $request->string('share_month'))->startOfMonth()
            : null;

        $purchases = $member->sharePurchases()
            ->with(['cycle', 'confirmer'])
            ->when($request->filled('payment_status'), fn ($query) => $query->where('payment_status', $request->string('payment_status')))
            ->when($shareMonth, fn ($query) => $query
                ->whereYear('share_month', $shareMonth->year)
                ->whereMonth('share_month', $shareMonth->month))
            ->orderByDesc('share_month')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($purchases);
    }

    public function memberMembershipFees(Request $request, Member $member)
    {
        $paidMonth = $request->filled('paid_month')
            ? Carbon::createFromFormat('Y-m', (string) $request->string('paid_month'))->startOfMonth()
            : null;

        $fees = $member->membershipFees()
            ->with('cycle')
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($paidMonth, fn ($query) => $query
                ->whereYear('paid_at', $paidMonth->year)
                ->whereMonth('paid_at', $paidMonth->month))
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($fees);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }

    private function resolveCycle(Request $request): MembershipCycle
    {
        if ($request->filled('membership_cycle_id')) {
            return MembershipCycle::query()->findOrFail($request->integer('membership_cycle_id'));
        }

        return MembershipCycle::query()->where('is_active', true)->firstOrFail();
    }
}
