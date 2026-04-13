<?php

namespace App\Http\Controllers;

use App\Models\Concern;
use App\Support\AuditLogger;
use App\Support\ConcernCatalog;
use App\Support\ProcessNotifier;
use Illuminate\Http\Request;

class MemberConcernController extends Controller
{
    public function __construct(
        private readonly ConcernCatalog $catalog,
        private readonly ProcessNotifier $notifier,
        private readonly AuditLogger $auditLogger
    )
    {
    }

    public function options(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        return response()->json([
            'reference_groups' => $this->catalog->referenceGroupsForMember($member),
            'status_options' => ['open', 'in_review', 'resolved', 'rejected'],
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

        $concerns = Concern::query()
            ->where('member_id', $member->id)
            ->with(['member', 'resolver', 'concernable'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('reference_type'), function ($query) use ($request) {
                $referenceType = $request->string('reference_type')->toString();
                $modelClass = $this->catalog->modelClassForReferenceType($referenceType);

                if ($referenceType === 'account') {
                    $query->whereNull('concernable_type')->whereNull('concernable_id');

                    return;
                }

                if ($modelClass) {
                    $query->where('concernable_type', $modelClass);
                }
            })
            ->orderByRaw("case when status in ('open', 'in_review') then 0 else 1 end")
            ->orderByDesc('raised_at')
            ->paginate($this->perPage($request));

        $concerns->setCollection(
            $concerns->getCollection()->map(fn (Concern $concern) => $this->catalog->serializeConcern($concern))
        );

        return response()->json($concerns);
    }

    public function store(Request $request)
    {
        $member = $request->user()?->member;

        if (! $member) {
            return response()->json([
                'message' => 'This account is not linked to a member profile.',
            ], 403);
        }

        $data = $request->validate([
            'reference_type' => ['required', 'string'],
            'reference_id' => ['nullable', 'integer'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:3000'],
        ]);

        if (! $this->catalog->isAllowedReferenceType($data['reference_type'])) {
            return response()->json([
                'message' => 'Select a valid concern category before submitting.',
            ], 422);
        }

        if ($this->catalog->requiresRecord($data['reference_type']) && empty($data['reference_id'])) {
            return response()->json([
                'message' => 'Select the related record you want to raise this concern about.',
            ], 422);
        }

        $concernable = $this->catalog->resolveMemberReference(
            $member,
            $data['reference_type'],
            isset($data['reference_id']) ? (int) $data['reference_id'] : null,
        );

        if ($this->catalog->requiresRecord($data['reference_type']) && ! $concernable) {
            return response()->json([
                'message' => 'The selected record could not be linked to your account.',
            ], 422);
        }

        $concern = Concern::query()->create([
            'member_id' => $member->id,
            'concernable_type' => $concernable ? $concernable::class : null,
            'concernable_id' => $concernable?->getKey(),
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => 'open',
            'raised_at' => now(),
        ])->load(['member', 'resolver', 'concernable']);

        $this->notifier->notifyExco(
            title: 'New concern raised',
            message: $member->full_name.' submitted a support concern: '.$concern->subject,
            category: 'general',
            actionUrl: '/dashboard/exco/support',
            actionLabel: 'Open support desk',
            level: 'warning',
            meta: [
                'concern_id' => $concern->id,
                'member_id' => $member->id,
            ],
            exceptUserId: $request->user()?->id,
        );

        $this->auditLogger->log(
            $request->user(),
            'concerns.created',
            $concern,
            'Raised a new concern: ' . $concern->subject . '.',
            [
                'concern_id' => $concern->id,
                'member_number' => $member->member_number,
                'reference_type' => $data['reference_type'],
            ],
        );

        return response()->json([
            'message' => 'Your concern has been submitted successfully.',
            'concern' => $this->catalog->serializeConcern($concern),
        ], 201);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }
}
