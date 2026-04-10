<?php

namespace App\Http\Controllers;

use App\Models\MemberApplication;
use App\Models\User;
use App\Support\MemberAccountProvisioner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExcoMemberApplicationController extends Controller
{
    public function __construct(
        private readonly MemberAccountProvisioner $memberAccountProvisioner
    ) {
    }

    public function index(Request $request)
    {
        $applications = MemberApplication::query()
            ->with(['cycle', 'reviewer', 'approvedMember'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('membership_cycle_id'), fn ($query) => $query->where('membership_cycle_id', $request->integer('membership_cycle_id')))
            ->latest('applied_at')
            ->latest('id')
            ->get();

        return response()->json($applications);
    }

    public function show(MemberApplication $memberApplication)
    {
        return response()->json(
            $memberApplication->load(['cycle', 'reviewer', 'approvedMember'])
        );
    }

    public function review(Request $request, MemberApplication $memberApplication)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([
                MemberApplication::STATUS_APPROVED,
                MemberApplication::STATUS_REJECTED,
            ])],
            'review_note' => ['nullable', 'string'],
            'reviewed_by' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if ($memberApplication->status !== MemberApplication::STATUS_PENDING_REVIEW) {
            return response()->json([
                'message' => 'Only pending applications can be reviewed.',
            ], 422);
        }

        $application = DB::transaction(function () use ($data, $memberApplication) {
            $memberApplication->update([
                'status' => $data['status'],
                'review_note' => $data['review_note'] ?? null,
                'reviewed_by' => $data['reviewed_by'] ?? null,
                'reviewed_at' => now(),
            ]);

            if ($data['status'] === MemberApplication::STATUS_APPROVED) {
                $provisionedAccount = $this->memberAccountProvisioner->create([
                    'full_name' => $memberApplication->full_name,
                    'email' => $memberApplication->email,
                    'phone_number' => $memberApplication->phone_number,
                    'joined_on' => $memberApplication->cycle?->starts_on ?? today(),
                    'membership_status' => 'approved',
                    'has_online_banking' => $memberApplication->has_online_banking,
                    'whatsapp_active' => $memberApplication->whatsapp_active,
                    'biodata' => $memberApplication->biodata,
                    'profile_completed_at' => $memberApplication->biodata ? now() : null,
                    'notes' => 'Created from member application #' . $memberApplication->id,
                    'role' => User::ROLE_MEMBER,
                ]);

                $memberApplication->update([
                    'approved_member_id' => $provisionedAccount['member']->id,
                ]);
            }

            return $memberApplication->fresh(['cycle', 'reviewer', 'approvedMember']);
        });

        return response()->json([
            'message' => 'Application reviewed successfully.',
            'application' => $application,
        ]);
    }
}
