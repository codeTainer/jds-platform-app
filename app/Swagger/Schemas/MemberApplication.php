<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'MemberApplication',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'membership_cycle_id', type: 'integer', example: 1),
        new OA\Property(property: 'full_name', type: 'string', example: 'Jane Doe'),
        new OA\Property(property: 'email', type: 'string', example: 'jane@example.com'),
        new OA\Property(property: 'phone_number', type: 'string', example: '08012345678'),
        new OA\Property(property: 'has_online_banking', type: 'boolean', example: true),
        new OA\Property(property: 'whatsapp_active', type: 'boolean', example: true),
        new OA\Property(property: 'biodata', type: 'object', nullable: true),
        new OA\Property(property: 'status', type: 'string', example: 'pending_review'),
        new OA\Property(property: 'applied_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-01T20:10:00Z'),
        new OA\Property(property: 'reviewed_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'reviewed_by', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'approved_member_id', type: 'integer', nullable: true),
        new OA\Property(property: 'review_note', type: 'string', nullable: true),
        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle'),
        new OA\Property(property: 'reviewer', ref: '#/components/schemas/User', nullable: true),
        new OA\Property(property: 'approved_member', ref: '#/components/schemas/Member'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-01T20:10:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-01T20:10:00Z'),
    ]
)]
class MemberApplication
{
}
