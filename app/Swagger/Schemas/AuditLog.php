<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'AuditLog',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 14),
        new OA\Property(property: 'action', type: 'string', example: 'loans.approved'),
        new OA\Property(property: 'module', type: 'string', example: 'loans'),
        new OA\Property(property: 'module_label', type: 'string', example: 'Loans'),
        new OA\Property(property: 'action_label', type: 'string', example: 'Approved'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Approved loan request #8 for Ebube Chidi.'),
        new OA\Property(property: 'auditable_type', type: 'string', nullable: true, example: 'App\\Models\\Loan'),
        new OA\Property(property: 'auditable_id', type: 'integer', nullable: true, example: 8),
        new OA\Property(property: 'occurred_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-13T11:15:00Z'),
        new OA\Property(property: 'metadata', type: 'object', nullable: true),
        new OA\Property(
            property: 'actor',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 2),
                new OA\Property(property: 'name', type: 'string', example: 'Secretary JDS'),
                new OA\Property(property: 'email', type: 'string', example: 'secretary@jds.local'),
                new OA\Property(property: 'role', type: 'string', example: 'secretary'),
                new OA\Property(property: 'member_number', type: 'string', nullable: true, example: 'JDS-EXCO-0002'),
            ]
        ),
    ]
)]
class AuditLog
{
}
