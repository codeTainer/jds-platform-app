<?php

namespace App\Http\Controllers;

use App\Models\MembershipCycle;
use App\Models\MembershipFee;
use App\Models\MembershipFeeSubmission;
use App\Models\SharePurchase;
use App\Models\SharePaymentSubmission;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MemberSavingsController extends Controller
{
    public function cycles()
    {
        return response()->json(
            MembershipCycle::query()
                ->orderByDesc('starts_on')
                ->get()
        );
    }

    public function overview(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $sharePurchases = SharePurchase::query()->where('member_id', $member->id);
        $membershipFees = MembershipFee::query()->where('member_id', $member->id);

        return response()->json([
            'member' => $member,
            'summary' => [
                'share_purchases_count' => (clone $sharePurchases)->count(),
                'total_shares_count' => (int) ((clone $sharePurchases)->sum('shares_count')),
                'total_share_value' => (string) ((clone $sharePurchases)->sum('total_amount')),
                'membership_fees_paid' => (clone $membershipFees)->where('status', 'paid')->count(),
                'membership_fees_pending' => (clone $membershipFees)->where('status', 'pending')->count(),
            ],
        ]);
    }

    public function sharePurchases(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

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

    public function membershipFees(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

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

    public function membershipFeeSubmissions(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $submissions = $member->membershipFeeSubmissions()
            ->with(['cycle', 'reviewer', 'approvedMembershipFee'])
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('fee_type'), fn ($query) => $query->where('fee_type', $request->string('fee_type')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($submissions);
    }

    public function sharePaymentSubmissions(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $shareMonth = $request->filled('share_month')
            ? Carbon::createFromFormat('Y-m', (string) $request->string('share_month'))->startOfMonth()
            : null;

        $submissions = $member->sharePaymentSubmissions()
            ->with(['cycle', 'reviewer', 'approvedSharePurchase'])
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($shareMonth, fn ($query) => $query
                ->whereYear('share_month', $shareMonth->year)
                ->whereMonth('share_month', $shareMonth->month))
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return response()->json($submissions);
    }

    public function storeSharePaymentSubmission(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $data = $request->validate([
            'membership_cycle_id' => ['nullable', 'integer', 'exists:membership_cycles,id'],
            'share_month' => ['required', 'date'],
            'shares_count' => ['required', 'integer', 'min:1'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'member_note' => ['nullable', 'string'],
        ]);

        $cycle = $request->filled('membership_cycle_id')
            ? MembershipCycle::query()->findOrFail($request->integer('membership_cycle_id'))
            : MembershipCycle::query()->where('is_active', true)->firstOrFail();

        if ($member->membership_status !== 'active') {
            return response()->json([
                'message' => 'Only active members can submit share payment receipts.',
            ], 422);
        }

        if ($data['shares_count'] < $cycle->min_monthly_shares || $data['shares_count'] > $cycle->max_monthly_shares) {
            return response()->json([
                'message' => "Shares for a month must be between {$cycle->min_monthly_shares} and {$cycle->max_monthly_shares}.",
            ], 422);
        }

        $shareMonth = Carbon::parse($data['share_month'])->startOfMonth()->toDateString();

        $existingOfficial = SharePurchase::query()
            ->where('member_id', $member->id)
            ->whereDate('share_month', $shareMonth)
            ->exists();

        if ($existingOfficial) {
            return response()->json([
                'message' => 'An official share purchase already exists for this month.',
            ], 422);
        }

        $existingPending = SharePaymentSubmission::query()
            ->where('member_id', $member->id)
            ->where('membership_cycle_id', $cycle->id)
            ->whereDate('share_month', $shareMonth)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existingPending) {
            return response()->json([
                'message' => 'A share payment submission for this month is already awaiting or has completed review.',
            ], 422);
        }

        $receiptDisk = (string) config('jds.receipt_disk', 'public');
        $receiptFile = $request->file('receipt');
        $receiptPath = $receiptFile->store('share-payment-receipts', $receiptDisk);
        $unitSharePrice = (float) $cycle->share_price;

        $submission = SharePaymentSubmission::create([
            'membership_cycle_id' => $cycle->id,
            'member_id' => $member->id,
            'share_month' => $shareMonth,
            'shares_count' => $data['shares_count'],
            'unit_share_price' => $unitSharePrice,
            'expected_amount' => bcmul((string) $unitSharePrice, (string) $data['shares_count'], 2),
            'receipt_path' => $receiptPath,
            'receipt_disk' => $receiptDisk,
            'receipt_original_name' => $receiptFile->getClientOriginalName(),
            'receipt_mime_type' => $receiptFile->getClientMimeType(),
            'receipt_size_bytes' => $receiptFile->getSize(),
            'status' => 'pending',
            'submitted_at' => now(),
            'member_note' => $data['member_note'] ?? null,
        ])->load(['cycle', 'reviewer', 'approvedSharePurchase']);

        return response()->json([
            'message' => 'Share payment receipt submitted successfully and is awaiting EXCO verification.',
            'submission' => $submission,
        ], 201);
    }

    public function storeMembershipFeeSubmission(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $data = $request->validate([
            'membership_cycle_id' => ['nullable', 'integer', 'exists:membership_cycles,id'],
            'fee_type' => ['required', 'in:new_member,existing_member'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'member_note' => ['nullable', 'string'],
        ]);

        $cycle = $request->filled('membership_cycle_id')
            ? MembershipCycle::query()->findOrFail($request->integer('membership_cycle_id'))
            : MembershipCycle::query()->where('is_active', true)->firstOrFail();

        if ($member->membership_status !== 'active') {
            return response()->json([
                'message' => 'Only active members can submit membership fee receipts.',
            ], 422);
        }

        $existingOfficial = MembershipFee::query()
            ->where('member_id', $member->id)
            ->where('membership_cycle_id', $cycle->id)
            ->where('fee_type', $data['fee_type'])
            ->exists();

        if ($existingOfficial) {
            return response()->json([
                'message' => 'An official membership fee record already exists for this cycle and fee type.',
            ], 422);
        }

        $existingPending = MembershipFeeSubmission::query()
            ->where('member_id', $member->id)
            ->where('membership_cycle_id', $cycle->id)
            ->where('fee_type', $data['fee_type'])
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existingPending) {
            return response()->json([
                'message' => 'A membership fee submission for this cycle and fee type is already awaiting or has completed review.',
            ], 422);
        }

        $receiptDisk = (string) config('jds.receipt_disk', 'public');
        $receiptFile = $request->file('receipt');
        $receiptPath = $receiptFile->store('membership-fee-receipts', $receiptDisk);
        $expectedAmount = $data['fee_type'] === 'new_member'
            ? $cycle->registration_fee_new_member
            : $cycle->registration_fee_existing_member;

        $submission = MembershipFeeSubmission::create([
            'membership_cycle_id' => $cycle->id,
            'member_id' => $member->id,
            'fee_type' => $data['fee_type'],
            'expected_amount' => $expectedAmount,
            'receipt_path' => $receiptPath,
            'receipt_disk' => $receiptDisk,
            'receipt_original_name' => $receiptFile->getClientOriginalName(),
            'receipt_mime_type' => $receiptFile->getClientMimeType(),
            'receipt_size_bytes' => $receiptFile->getSize(),
            'status' => 'pending',
            'submitted_at' => now(),
            'member_note' => $data['member_note'] ?? null,
        ])->load(['cycle', 'reviewer', 'approvedMembershipFee']);

        return response()->json([
            'message' => 'Membership fee receipt submitted successfully and is awaiting EXCO verification.',
            'submission' => $submission,
        ], 201);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }
}
