<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    public function log(
        ?User $actor,
        string $action,
        Model|string|null $auditable = null,
        ?string $description = null,
        array $metadata = []
    ): AuditLog {
        [$auditableType, $auditableId] = $this->resolveAuditable($auditable);

        return AuditLog::query()->create([
            'actor_user_id' => $actor?->id,
            'action' => $action,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'description' => $description,
            'metadata' => $metadata ?: null,
            'occurred_at' => now(),
        ]);
    }

    /**
     * @return array{0: string|null, 1: int|string|null}
     */
    private function resolveAuditable(Model|string|null $auditable): array
    {
        if ($auditable instanceof Model) {
            return [$auditable::class, $auditable->getKey()];
        }

        return [is_string($auditable) ? $auditable : null, null];
    }
}
