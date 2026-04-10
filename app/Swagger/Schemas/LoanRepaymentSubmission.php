<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'LoanRepaymentSubmission',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 7),
        new OA\Property(property: 'loan_id', type: 'integer', example: 14),
        new OA\Property(property: 'member_id', type: 'integer', example: 1),
        new OA\Property(property: 'amount_paid', type: 'number', format: 'float', example: 50000),
        new OA\Property(property: 'receipt_path', type: 'string', example: 'loan-repayment-receipts/abc123.pdf'),
        new OA\Property(property: 'receipt_disk', type: 'string', nullable: true, example: 'public'),
        new OA\Property(property: 'receipt_original_name', type: 'string', nullable: true, example: 'repayment-receipt.pdf'),
        new OA\Property(property: 'receipt_mime_type', type: 'string', nullable: true, example: 'application/pdf'),
        new OA\Property(property: 'receipt_size_bytes', type: 'integer', nullable: true, example: 248931),
        new OA\Property(property: 'receipt_url', type: 'string', nullable: true, example: '/storage/loan-repayment-receipts/abc123.pdf'),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-03T11:30:00Z'),
        new OA\Property(property: 'reviewed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-03T13:00:00Z'),
        new OA\Property(property: 'approved_loan_repayment_id', type: 'integer', nullable: true, example: 3),
        new OA\Property(property: 'member_note', type: 'string', nullable: true, example: 'Bank transfer made this morning.'),
        new OA\Property(property: 'review_note', type: 'string', nullable: true, example: 'Verified and posted.'),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'loan', ref: '#/components/schemas/Loan', nullable: true),
        new OA\Property(property: 'reviewer', ref: '#/components/schemas/User', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-03T11:30:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-03T13:00:00Z'),
    ]
)]
class LoanRepaymentSubmission
{
}
