<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'MembershipFee',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'membership_cycle_id', type: 'integer', example: 1),
        new OA\Property(property: 'member_id', type: 'integer', example: 1),
        new OA\Property(property: 'fee_type', type: 'string', example: 'new_member'),
        new OA\Property(property: 'amount', type: 'number', format: 'float', example: 2500),
        new OA\Property(property: 'status', type: 'string', example: 'paid'),
        new OA\Property(property: 'paid_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T09:00:00Z'),
        new OA\Property(property: 'payment_reference', type: 'string', nullable: true, example: 'FT251230998174'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Verified from transfer receipt'),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-02T09:00:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-02T09:00:00Z'),
    ]
)]
class MembershipFee
{
}
