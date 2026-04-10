<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'LoanDisbursement',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'loan_id', type: 'integer', example: 14),
        new OA\Property(property: 'disbursed_by', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'amount', type: 'number', format: 'float', example: 150000),
        new OA\Property(property: 'payment_method', type: 'string', example: 'bank_transfer'),
        new OA\Property(property: 'status', type: 'string', example: 'pending_member_confirmation'),
        new OA\Property(property: 'disbursed_at', type: 'string', format: 'date-time', example: '2026-04-02T12:30:00Z'),
        new OA\Property(property: 'payment_reference', type: 'string', nullable: true, example: 'TRX-20260402-184533'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Transferred to member account'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-02T12:30:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-02T12:30:00Z'),
    ]
)]
class LoanDisbursement
{
}
