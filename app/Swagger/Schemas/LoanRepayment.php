<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'LoanRepayment',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'loan_id', type: 'integer', example: 14),
        new OA\Property(property: 'member_id', type: 'integer', example: 1),
        new OA\Property(property: 'received_by', type: 'integer', nullable: true, example: 2),
        new OA\Property(property: 'amount_paid', type: 'number', format: 'float', example: 200000),
        new OA\Property(property: 'balance_after_payment', type: 'number', format: 'float', example: 0),
        new OA\Property(property: 'payment_method', type: 'string', nullable: true, example: 'bank_transfer'),
        new OA\Property(property: 'status', type: 'string', example: 'posted'),
        new OA\Property(property: 'paid_at', type: 'string', format: 'date-time', example: '2026-04-02T13:00:00Z'),
        new OA\Property(property: 'payment_reference', type: 'string', nullable: true, example: '20260402/FB/772391'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Full repayment received'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-02T13:00:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-02T13:00:00Z'),
    ]
)]
class LoanRepayment
{
}
