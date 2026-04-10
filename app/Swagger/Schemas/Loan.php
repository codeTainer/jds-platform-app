<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Loan',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 14),
        new OA\Property(property: 'membership_cycle_id', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'member_id', type: 'integer', example: 1),
        new OA\Property(property: 'guarantor_member_id', type: 'integer', nullable: true, example: 3),
        new OA\Property(property: 'requested_amount', type: 'number', format: 'float', example: 150000),
        new OA\Property(property: 'approved_amount', type: 'number', format: 'float', nullable: true, example: 150000),
        new OA\Property(property: 'service_charge_rate', type: 'number', format: 'float', nullable: true, example: 10),
        new OA\Property(property: 'service_charge_amount', type: 'number', format: 'float', nullable: true, example: 15000),
        new OA\Property(property: 'total_due_amount', type: 'number', format: 'float', nullable: true, example: 165000),
        new OA\Property(property: 'outstanding_amount', type: 'number', format: 'float', nullable: true, example: 65000),
        new OA\Property(property: 'status', type: 'string', example: 'partially_repaid'),
        new OA\Property(property: 'purpose', type: 'string', nullable: true, example: 'School fees'),
        new OA\Property(property: 'requested_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T10:00:00Z'),
        new OA\Property(property: 'approved_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T11:30:00Z'),
        new OA\Property(property: 'disbursed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T12:30:00Z'),
        new OA\Property(property: 'repaid_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-05T15:00:00Z'),
        new OA\Property(property: 'due_on', type: 'string', format: 'date', nullable: true, example: '2026-07-02'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Approved by EXCO'),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'guarantor', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle', nullable: true),
        new OA\Property(property: 'guarantor_approvals', type: 'array', nullable: true, items: new OA\Items(ref: '#/components/schemas/LoanGuarantorApproval')),
        new OA\Property(property: 'disbursement', ref: '#/components/schemas/LoanDisbursement', nullable: true),
        new OA\Property(property: 'repayments', type: 'array', nullable: true, items: new OA\Items(ref: '#/components/schemas/LoanRepayment')),
        new OA\Property(property: 'repayment_submissions', type: 'array', nullable: true, items: new OA\Items(ref: '#/components/schemas/LoanRepaymentSubmission')),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-02T10:00:00Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-02T12:35:00Z'),
    ]
)]
class Loan
{
}
