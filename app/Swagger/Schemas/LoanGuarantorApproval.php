<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'LoanGuarantorApproval',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'loan_id', type: 'integer', example: 14),
        new OA\Property(property: 'guarantor_member_id', type: 'integer', example: 3),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'responded_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T11:00:00Z'),
        new OA\Property(property: 'response_note', type: 'string', nullable: true, example: 'I agree to guarantee this loan.'),
        new OA\Property(property: 'loan', ref: '#/components/schemas/Loan', nullable: true),
        new OA\Property(property: 'guarantor', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-02T10:55:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-02T11:00:00Z'),
    ]
)]
class LoanGuarantorApproval
{
}
