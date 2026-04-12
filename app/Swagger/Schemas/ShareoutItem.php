<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ShareoutItem',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'shareout_run_id', type: 'integer', example: 1),
        new OA\Property(property: 'member_id', type: 'integer', example: 1),
        new OA\Property(property: 'total_shares', type: 'integer', example: 50),
        new OA\Property(property: 'total_saved', type: 'number', format: 'float', example: 1000000),
        new OA\Property(property: 'gross_return', type: 'number', format: 'float', example: 1154411.25),
        new OA\Property(property: 'outstanding_loan_deduction', type: 'number', format: 'float', example: 30000),
        new OA\Property(property: 'admin_fee_deduction', type: 'number', format: 'float', example: 30882.25),
        new OA\Property(property: 'net_payout', type: 'number', format: 'float', example: 1093529),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'paid_at', type: 'string', format: 'date-time', nullable: true, example: '2026-12-18T15:00:00Z'),
        new OA\Property(
            property: 'run_context',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'total_savings_pool', type: 'number', format: 'float', example: 9500000),
                new OA\Property(property: 'total_profit', type: 'number', format: 'float', example: 1170000),
                new OA\Property(property: 'admin_fee_amount', type: 'number', format: 'float', example: 234000),
                new OA\Property(property: 'distributable_profit', type: 'number', format: 'float', example: 936000),
            ]
        ),
        new OA\Property(
            property: 'profit_breakdown',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'loan_service_charge_total', type: 'number', format: 'float', example: 900000),
                new OA\Property(property: 'default_penalty_total', type: 'number', format: 'float', example: 60000),
                new OA\Property(property: 'membership_fee_total', type: 'number', format: 'float', example: 210000),
                new OA\Property(property: 'total_profit', type: 'number', format: 'float', example: 1170000),
            ]
        ),
        new OA\Property(
            property: 'calculation',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'principal_amount', type: 'number', format: 'float', example: 1000000),
                new OA\Property(property: 'total_savings_pool', type: 'number', format: 'float', example: 9500000),
                new OA\Property(property: 'savings_ratio', type: 'number', format: 'float', example: 0.10526316),
                new OA\Property(property: 'savings_ratio_percent', type: 'number', format: 'float', example: 10.5263),
                new OA\Property(property: 'gross_profit_share', type: 'number', format: 'float', example: 123157.89),
                new OA\Property(property: 'distributable_profit_share', type: 'number', format: 'float', example: 98526.32),
                new OA\Property(property: 'admin_fee_amount', type: 'number', format: 'float', nullable: true, example: 234000),
            ]
        ),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'run', ref: '#/components/schemas/ShareoutRun', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-12-15T08:00:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-12-18T15:00:00Z'),
    ]
)]
class ShareoutItem
{
}
