<?php

namespace App\Http\Controllers;

use App\Models\MembershipCycle;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExcoMembershipCycleController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditLogger
    ) {
    }

    public function index()
    {
        $cycles = MembershipCycle::query()
            ->withCount(['memberApplications', 'sharePurchases', 'loans'])
            ->orderByDesc('is_active')
            ->orderByDesc('starts_on')
            ->get();

        return response()->json($cycles);
    }

    public function store(Request $request)
    {
        $data = $this->validateCycle($request);

        $cycle = DB::transaction(function () use ($data) {
            if ($data['is_active'] ?? false) {
                MembershipCycle::query()->update(['is_active' => false]);
            }

            return MembershipCycle::create($data);
        });

        $this->auditLogger->log(
            $request->user(),
            'cycles.created',
            $cycle,
            'Created membership cycle ' . $cycle->code . '.',
            [
                'cycle_id' => $cycle->id,
                'cycle_code' => $cycle->code,
                'is_active' => $cycle->is_active,
            ],
        );

        return response()->json([
            'message' => 'Membership cycle created successfully.',
            'cycle' => $cycle,
        ], 201);
    }

    public function show(MembershipCycle $membershipCycle)
    {
        return response()->json(
            $membershipCycle->loadCount(['memberApplications', 'sharePurchases', 'loans'])
        );
    }

    public function update(Request $request, MembershipCycle $membershipCycle)
    {
        $data = $this->validateCycle($request, $membershipCycle->id, true);

        $cycle = DB::transaction(function () use ($data, $membershipCycle) {
            if (($data['is_active'] ?? false) === true) {
                MembershipCycle::query()
                    ->whereKeyNot($membershipCycle->id)
                    ->update(['is_active' => false]);
            }

            $membershipCycle->update($data);

            return $membershipCycle->fresh();
        });

        $this->auditLogger->log(
            $request->user(),
            'cycles.updated',
            $cycle,
            'Updated membership cycle ' . $cycle->code . '.',
            [
                'cycle_id' => $cycle->id,
                'cycle_code' => $cycle->code,
                'is_active' => $cycle->is_active,
            ],
        );

        return response()->json([
            'message' => 'Membership cycle updated successfully.',
            'cycle' => $cycle,
        ]);
    }

    public function activate(MembershipCycle $membershipCycle)
    {
        $cycle = DB::transaction(function () use ($membershipCycle) {
            MembershipCycle::query()->update(['is_active' => false]);

            $membershipCycle->update(['is_active' => true]);

            return $membershipCycle->fresh();
        });

        $this->auditLogger->log(
            request()->user(),
            'cycles.activated',
            $cycle,
            'Activated membership cycle ' . $cycle->code . '.',
            [
                'cycle_id' => $cycle->id,
                'cycle_code' => $cycle->code,
            ],
        );

        return response()->json([
            'message' => 'Membership cycle activated successfully.',
            'cycle' => $cycle,
        ]);
    }

    public function destroy(MembershipCycle $membershipCycle)
    {
        $membershipCycle->loadCount([
            'memberApplications',
            'sharePurchases',
            'sharePaymentSubmissions',
            'membershipFees',
            'membershipFeeSubmissions',
            'loans',
        ])->load('shareoutRun');

        $hasOperationalRecords =
            ($membershipCycle->member_applications_count ?? 0) > 0
            || ($membershipCycle->share_purchases_count ?? 0) > 0
            || ($membershipCycle->share_payment_submissions_count ?? 0) > 0
            || ($membershipCycle->membership_fees_count ?? 0) > 0
            || ($membershipCycle->membership_fee_submissions_count ?? 0) > 0
            || ($membershipCycle->loans_count ?? 0) > 0
            || $membershipCycle->shareoutRun !== null;

        if ($hasOperationalRecords) {
            return response()->json([
                'message' => 'This cycle already has operational records and cannot be deleted.',
            ], 422);
        }

        $deletedCycleId = $membershipCycle->id;
        $deletedCycleCode = $membershipCycle->code;
        $membershipCycle->delete();

        $this->auditLogger->log(
            request()->user(),
            'cycles.deleted',
            MembershipCycle::class,
            'Deleted membership cycle ' . $deletedCycleCode . '.',
            [
                'cycle_id' => $deletedCycleId,
                'cycle_code' => $deletedCycleCode,
            ],
        );

        return response()->json([
            'message' => 'Membership cycle deleted successfully.',
        ]);
    }

    private function validateCycle(Request $request, ?int $cycleId = null, bool $isUpdate = false): array
    {
        $required = $isUpdate ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'code' => [
                $required,
                'string',
                'max:50',
                Rule::unique('membership_cycles', 'code')->ignore($cycleId),
            ],
            'starts_on' => [$required, 'date'],
            'ends_on' => [$required, 'date', 'after:starts_on'],
            'onboarding_opens_at' => ['nullable', 'date', 'before_or_equal:onboarding_closes_at'],
            'onboarding_closes_at' => ['nullable', 'date', 'after_or_equal:onboarding_opens_at'],
            'accepting_new_applications' => ['sometimes', 'boolean'],
            'onboarding_notes' => ['nullable', 'string'],
            'share_price' => ['sometimes', 'numeric', 'min:0'],
            'min_monthly_shares' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'max_monthly_shares' => ['sometimes', 'integer', 'min:1', 'max:10', 'gte:min_monthly_shares'],
            'loan_multiplier' => ['sometimes', 'numeric', 'min:1'],
            'loan_service_charge_rate' => ['sometimes', 'numeric', 'min:0'],
            'loan_duration_months' => ['sometimes', 'integer', 'min:1'],
            'overdue_penalty_rate' => ['sometimes', 'numeric', 'min:0'],
            'overdue_penalty_window_months' => ['sometimes', 'integer', 'min:1'],
            'shareout_admin_fee_rate' => ['sometimes', 'numeric', 'min:0'],
            'registration_fee_new_member' => ['sometimes', 'numeric', 'min:0'],
            'registration_fee_existing_member' => ['sometimes', 'numeric', 'min:0'],
            'loan_pause_month' => ['sometimes', 'integer', 'between:1,12'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
