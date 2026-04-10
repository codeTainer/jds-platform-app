<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SharePurchase',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'membership_cycle_id', type: 'integer', example: 1),
        new OA\Property(property: 'member_id', type: 'integer', example: 1),
        new OA\Property(property: 'share_month', type: 'string', format: 'date', example: '2026-04-01'),
        new OA\Property(property: 'shares_count', type: 'integer', example: 2),
        new OA\Property(property: 'unit_share_price', type: 'number', format: 'float', example: 20000),
        new OA\Property(property: 'total_amount', type: 'number', format: 'float', example: 40000),
        new OA\Property(property: 'payment_status', type: 'string', example: 'confirmed'),
        new OA\Property(property: 'purchased_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T10:00:00Z'),
        new OA\Property(property: 'confirmed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T10:05:00Z'),
        new OA\Property(property: 'payment_reference', type: 'string', nullable: true, example: 'NIP983447210561'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Verified from WhatsApp receipt'),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle', nullable: true),
        new OA\Property(property: 'confirmer', ref: '#/components/schemas/User', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-02T10:00:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-02T10:05:00Z'),
    ]
)]
class SharePurchase
{
}
