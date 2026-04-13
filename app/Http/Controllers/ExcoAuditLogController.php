<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class ExcoAuditLogController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->user()?->canViewAuditLogs()) {
            return response()->json([
                'message' => 'You are not authorized to view the audit trail.',
            ], 403);
        }

        $auditLogs = AuditLog::query()
            ->with(['actor.member'])
            ->when($request->filled('actor_user_id'), fn ($query) => $query->where('actor_user_id', $request->integer('actor_user_id')))
            ->when($request->filled('module'), function ($query) use ($request) {
                $module = trim($request->string('module')->toString());

                if ($module !== '') {
                    $query->where('action', 'like', $module . '.%');
                }
            })
            ->when($request->filled('action'), fn ($query) => $query->where('action', $request->string('action')))
            ->when($request->filled('date_from'), fn ($query) => $query->whereDate('occurred_at', '>=', $request->string('date_from')))
            ->when($request->filled('date_to'), fn ($query) => $query->whereDate('occurred_at', '<=', $request->string('date_to')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim($request->string('search')->toString());

                if ($search === '') {
                    return;
                }

                $query->where(function ($inner) use ($search) {
                    $inner->where('description', 'ilike', '%' . $search . '%')
                        ->orWhere('action', 'ilike', '%' . $search . '%')
                        ->orWhereHas('actor', function ($actorQuery) use ($search) {
                            $actorQuery->where('name', 'ilike', '%' . $search . '%')
                                ->orWhere('email', 'ilike', '%' . $search . '%')
                                ->orWhereHas('member', function ($memberQuery) use ($search) {
                                    $memberQuery->where('full_name', 'ilike', '%' . $search . '%')
                                        ->orWhere('member_number', 'ilike', '%' . $search . '%');
                                });
                        });
                });
            })
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        $auditLogs->setCollection(
            $auditLogs->getCollection()->map(fn (AuditLog $auditLog) => $this->serializeAuditLog($auditLog))
        );

        return response()->json($auditLogs);
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }

    private function serializeAuditLog(AuditLog $auditLog): array
    {
        [$module, $actionName] = array_pad(explode('.', $auditLog->action, 2), 2, 'event');

        return [
            'id' => $auditLog->id,
            'action' => $auditLog->action,
            'module' => $module,
            'module_label' => $this->labelize($module),
            'action_label' => $this->labelize($actionName),
            'description' => $auditLog->description,
            'auditable_type' => $auditLog->auditable_type,
            'auditable_id' => $auditLog->auditable_id,
            'occurred_at' => optional($auditLog->occurred_at)->toIso8601String(),
            'metadata' => $auditLog->metadata ?? [],
            'actor' => $auditLog->actor ? [
                'id' => $auditLog->actor->id,
                'name' => $auditLog->actor->name,
                'email' => $auditLog->actor->email,
                'role' => $auditLog->actor->role,
                'member_number' => $auditLog->actor->member?->member_number,
            ] : null,
        ];
    }

    private function labelize(string $value): string
    {
        return str($value)
            ->replace(['_', '-'], ' ')
            ->title()
            ->toString();
    }
}
