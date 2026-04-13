<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'MemberExitRequest',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 3),
        new OA\Property(property: 'member_id', type: 'integer', example: 1),
        new OA\Property(property: 'notice_given_on', type: 'string', format: 'date', example: '2026-04-01'),
        new OA\Property(property: 'requested_exit_on', type: 'string', format: 'date', example: '2026-05-01'),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'outstanding_loan_deduction', type: 'number', format: 'float', example: 250000),
        new OA\Property(property: 'savings_refund_amount', type: 'number', format: 'float', nullable: true, example: 950000),
        new OA\Property(property: 'processed_by', type: 'integer', nullable: true, example: 2),
        new OA\Property(property: 'processed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-13T14:00:00Z'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Member confirmed final exit after loan reconciliation.'),
        new OA\Property(property: 'current_total_saved_value', type: 'number', format: 'float', nullable: true, example: 1200000),
        new OA\Property(property: 'current_outstanding_loan_balance', type: 'number', format: 'float', nullable: true, example: 250000),
        new OA\Property(property: 'current_estimated_refund_amount', type: 'number', format: 'float', nullable: true, example: 950000),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(
            property: 'processor',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 2),
                new OA\Property(property: 'name', type: 'string', example: 'Secretary JDS'),
                new OA\Property(property: 'email', type: 'string', example: 'secretary@jds.local'),
                new OA\Property(property: 'role', type: 'string', example: 'secretary'),
            ]
        ),
    ]
)]
class MemberExitRequest
{
}
