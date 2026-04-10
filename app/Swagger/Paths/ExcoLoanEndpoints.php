<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoLoanEndpoints
{
    #[OA\Get(
        path: '/api/exco/loans',
        summary: 'List loans for EXCO',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Loans'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'requested_month', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: '2026-04')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated loans',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Loan')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 2),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
                        new OA\Property(property: 'total', type: 'integer', example: 12),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/loans/{loan}/approve',
        summary: 'Approve a loan after guarantor approval',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Loans'],
        parameters: [
            new OA\Parameter(name: 'loan', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'approved_amount', type: 'number', format: 'float', nullable: true, example: 150000),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Approved after verification'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Loan approved',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Loan approved successfully.'),
                        new OA\Property(property: 'loan', ref: '#/components/schemas/Loan'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Loan cannot be approved in its current state'),
        ]
    )]
    public function approve(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/loans/{loan}/reject',
        summary: 'Reject a loan request',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Loans'],
        parameters: [
            new OA\Parameter(name: 'loan', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Application does not meet current criteria'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Loan rejected',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Loan rejected successfully.'),
                        new OA\Property(property: 'loan', ref: '#/components/schemas/Loan'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Loan can no longer be rejected'),
        ]
    )]
    public function reject(): void
    {
    }

    #[OA\Post(
        path: '/api/exco/loans/{loan}/disburse',
        summary: 'Post a loan disbursement for an approved loan',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Loans'],
        parameters: [
            new OA\Parameter(name: 'loan', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['payment_method', 'receipt'],
                    properties: [
                        new OA\Property(property: 'payment_method', type: 'string', example: 'bank_transfer'),
                        new OA\Property(property: 'receipt', type: 'string', format: 'binary'),
                        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Transferred to member account'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Loan disbursed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Loan disbursed successfully.'),
                        new OA\Property(property: 'loan', ref: '#/components/schemas/Loan'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Loan must be approved before disbursement'),
        ]
    )]
    public function disburse(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/loan-repayment-submissions',
        summary: 'List loan repayment receipt submissions for EXCO review',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Loans'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: 'pending')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated repayment submissions',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/LoanRepaymentSubmission')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 2),
                        new OA\Property(property: 'total', type: 'integer', example: 2),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function repaymentSubmissions(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/loan-repayment-submissions/{loanRepaymentSubmission}/review',
        summary: 'Approve or reject a member-submitted loan repayment receipt',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Loans'],
        parameters: [
            new OA\Parameter(name: 'loanRepaymentSubmission', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'approved'),
                    new OA\Property(property: 'review_note', type: 'string', nullable: true, example: 'Verified against bank receipt.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Repayment submission reviewed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Loan repayment receipt approved and posted successfully.'),
                        new OA\Property(property: 'loan', ref: '#/components/schemas/Loan'),
                        new OA\Property(property: 'submission', ref: '#/components/schemas/LoanRepaymentSubmission'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Submission cannot be reviewed in its current state'),
        ]
    )]
    public function reviewRepaymentSubmission(): void
    {
    }
}
