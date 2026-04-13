<?php

namespace App\Http\Controllers;

use App\Models\Concern;
use App\Support\ConcernCatalog;
use App\Support\ProcessNotifier;
use Illuminate\Http\Request;

class ExcoConcernController extends Controller
{
    public function __construct(
        private readonly ConcernCatalog $catalog,
        private readonly ProcessNotifier $notifier
    )
    {
    }

    public function index(Request $request)
    {
        if (! $request->user()?->canManageConcerns()) {
            return response()->json([
                'message' => 'You are not authorized to access the support desk.',
            ], 403);
        }

        $concerns = Concern::query()
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
            ->when($request->filled('member_search'), function ($query) use ($request) {
                $search = trim($request->string('member_search')->toString());

                if ($search === '') {
                    return;
                }

                $query->whereHas('member', function ($memberQuery) use ($search) {
                    $memberQuery->where('full_name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%')
                        ->orWhere('member_number', 'like', '%'.$search.'%');
                });
            })
            ->orderByRaw("case when status = 'open' then 0 when status = 'in_review' then 1 else 2 end")
            ->orderByDesc('raised_at')
            ->paginate($this->perPage($request));

        $concerns->setCollection(
            $concerns->getCollection()->map(fn (Concern $concern) => $this->catalog->serializeConcern($concern))
        );

        return response()->json($concerns);
    }

    public function update(Request $request, Concern $concern)
    {
        if (! $request->user()?->canManageConcerns()) {
            return response()->json([
                'message' => 'You are not authorized to update concerns.',
            ], 403);
        }

        $data = $request->validate([
            'status' => ['required', 'string', 'in:open,in_review,resolved,rejected'],
            'resolution_note' => ['nullable', 'string', 'max:3000'],
        ]);

        if (! $this->canTransitionTo($concern, $data['status'])) {
            return response()->json([
                'message' => 'This concern is already closed and cannot be changed to another status.',
            ], 422);
        }

        if (in_array($data['status'], ['resolved', 'rejected'], true) && blank($data['resolution_note'] ?? null)) {
            return response()->json([
                'message' => 'Add a resolution note before resolving or rejecting a concern.',
            ], 422);
        }

        $isResolvedState = in_array($data['status'], ['resolved', 'rejected'], true);
        $resolutionNote = array_key_exists('resolution_note', $data)
            ? (filled($data['resolution_note']) ? $data['resolution_note'] : null)
            : $concern->resolution_note;

        $concern->update([
            'status' => $data['status'],
            'resolution_note' => $resolutionNote,
            'resolved_at' => $isResolvedState ? now() : null,
            'resolved_by' => $isResolvedState ? $request->user()?->id : null,
        ]);

        $concern->load(['member.user', 'member', 'resolver', 'concernable']);

        $statusLabel = str_replace('_', ' ', $data['status']);

        $this->notifier->notifyMember(
            member: $concern->member,
            title: 'Concern update received',
            message: 'Your concern "'.$concern->subject.'" is now marked as '.$statusLabel.'.',
            category: 'general',
            actionUrl: '/dashboard/member/support',
            actionLabel: 'View concern',
            level: $data['status'] === 'rejected' ? 'warning' : 'info',
            meta: [
                'concern_id' => $concern->id,
                'status' => $concern->status,
            ],
        );

        return response()->json([
            'message' => 'Concern updated successfully.',
            'concern' => $this->catalog->serializeConcern($concern),
        ]);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }

    private function canTransitionTo(Concern $concern, string $nextStatus): bool
    {
        if ($concern->status === $nextStatus) {
            return true;
        }

        return in_array($concern->status, ['open', 'in_review'], true);
    }
}
