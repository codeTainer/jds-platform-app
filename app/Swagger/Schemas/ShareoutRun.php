<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ShareoutRun',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'membership_cycle_id', type: 'integer', example: 1),
        new OA\Property(property: 'scheduled_start_on', type: 'string', format: 'date', nullable: true, example: '2026-12-15'),
        new OA\Property(property: 'scheduled_end_on', type: 'string', format: 'date', nullable: true, example: '2026-12-21'),
        new OA\Property(property: 'executed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-12-18T14:30:00Z'),
        new OA\Property(property: 'total_profit', type: 'number', format: 'float', nullable: true, example: 154411.25),
        new OA\Property(property: 'admin_fee_rate', type: 'number', format: 'float', nullable: true, example: 20),
        new OA\Property(property: 'admin_fee_amount', type: 'number', format: 'float', nullable: true, example: 30882.25),
        new OA\Property(property: 'distributable_profit', type: 'number', format: 'float', nullable: true, example: 123529),
        new OA\Property(property: 'status', type: 'string', example: 'approved'),
        new OA\Property(property: 'approved_by', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'approved_at', type: 'string', format: 'date-time', nullable: true, example: '2026-12-16T09:00:00Z'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Prepared for the annual share-out window.'),
        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle', nullable: true),
        new OA\Property(property: 'approver', ref: '#/components/schemas/User', nullable: true),
        new OA\Property(property: 'items_count', type: 'integer', nullable: true, example: 4),
        new OA\Property(property: 'items_sum_total_saved', type: 'number', format: 'float', nullable: true, example: 1000000),
        new OA\Property(property: 'items_sum_gross_return', type: 'number', format: 'float', nullable: true, example: 1154411.25),
        new OA\Property(property: 'items_sum_outstanding_loan_deduction', type: 'number', format: 'float', nullable: true, example: 0),
        new OA\Property(property: 'items_sum_admin_fee_deduction', type: 'number', format: 'float', nullable: true, example: 30882.25),
        new OA\Property(property: 'items_sum_net_payout', type: 'number', format: 'float', nullable: true, example: 1123529),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-12-15T08:00:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-12-16T09:00:00Z'),
    ]
)]
class ShareoutRun
{
}
