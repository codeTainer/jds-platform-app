<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Member',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'member_number', type: 'string', nullable: true, example: 'JDS2026-0001'),
        new OA\Property(property: 'full_name', type: 'string', example: 'John Doe'),
        new OA\Property(property: 'email', type: 'string', example: 'john@example.com'),
        new OA\Property(property: 'phone_number', type: 'string', example: '08012345678'),
        new OA\Property(property: 'joined_on', type: 'string', format: 'date', nullable: true, example: '2026-04-01'),
        new OA\Property(property: 'membership_status', type: 'string', example: 'active'),
        new OA\Property(property: 'has_online_banking', type: 'boolean', example: true),
        new OA\Property(property: 'whatsapp_active', type: 'boolean', example: true),
        new OA\Property(property: 'profile_completed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-01T08:23:06Z'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Created from member application #3'),
        new OA\Property(property: 'user', ref: '#/components/schemas/User', nullable: true),
        new OA\Property(property: 'share_purchases_count', type: 'integer', example: 5),
        new OA\Property(property: 'loans_count', type: 'integer', example: 1),
        new OA\Property(property: 'concerns_count', type: 'integer', example: 0),
        new OA\Property(property: 'share_purchases_sum_shares_count', type: 'number', format: 'float', nullable: true, example: 8),
        new OA\Property(property: 'share_purchases_sum_total_amount', type: 'number', format: 'float', nullable: true, example: 160000),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-01T08:23:06Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-01T08:23:06Z'),
    ]
)]
class Member
{
    // This class is only for Swagger documentation
}
