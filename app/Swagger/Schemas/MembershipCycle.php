<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'MembershipCycle',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'name', type: 'string', example: 'JDS 2026 Cycle'),
        new OA\Property(property: 'code', type: 'string', example: 'JDS2026'),
        new OA\Property(property: 'starts_on', type: 'string', format: 'date', example: '2026-01-01'),
        new OA\Property(property: 'ends_on', type: 'string', format: 'date', example: '2026-12-31'),
        new OA\Property(property: 'onboarding_opens_at', type: 'string', format: 'date-time', nullable: true, example: '2026-01-01T00:00:00Z'),
        new OA\Property(property: 'onboarding_closes_at', type: 'string', format: 'date-time', nullable: true, example: '2026-01-31T23:59:59Z'),
        new OA\Property(property: 'accepting_new_applications', type: 'boolean', example: true),
        new OA\Property(property: 'onboarding_notes', type: 'string', nullable: true, example: 'Initial demo cycle for local development.'),
        new OA\Property(property: 'share_price', type: 'number', format: 'float', example: 20000),
        new OA\Property(property: 'min_monthly_shares', type: 'integer', example: 1),
        new OA\Property(property: 'max_monthly_shares', type: 'integer', example: 10),
        new OA\Property(property: 'loan_multiplier', type: 'number', format: 'float', example: 3),
        new OA\Property(property: 'loan_service_charge_rate', type: 'number', format: 'float', example: 10),
        new OA\Property(property: 'loan_duration_months', type: 'integer', example: 3),
        new OA\Property(property: 'overdue_penalty_rate', type: 'number', format: 'float', example: 10),
        new OA\Property(property: 'overdue_penalty_window_months', type: 'integer', example: 2),
        new OA\Property(property: 'shareout_admin_fee_rate', type: 'number', format: 'float', example: 20),
        new OA\Property(property: 'registration_fee_new_member', type: 'number', format: 'float', example: 2500),
        new OA\Property(property: 'registration_fee_existing_member', type: 'number', format: 'float', example: 1500),
        new OA\Property(property: 'loan_pause_month', type: 'integer', example: 9),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'member_applications_count', type: 'integer', nullable: true, example: 12),
        new OA\Property(property: 'share_purchases_count', type: 'integer', nullable: true, example: 47),
        new OA\Property(property: 'loans_count', type: 'integer', nullable: true, example: 9),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-01T19:26:17Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-01T19:26:17Z'),
    ]
)]
class MembershipCycle
{
}
