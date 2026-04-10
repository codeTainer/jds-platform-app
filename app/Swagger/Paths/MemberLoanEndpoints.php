<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class MemberLoanEndpoints
{
    #[OA\Get(
        path: '/api/member/loans/overview',
        summary: 'Get the authenticated member loan overview and eligibility',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Loan overview',
                content: new OA\JsonContent(ref: '#/components/schemas/LoanOverview')
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function overview(): void
    {
    }

    #[OA\Get(
        path: '/api/member/loans',
        summary: 'List the authenticated member loans',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated member loans',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Loan')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 2),
                        new OA\Property(property: 'total', type: 'integer', example: 2),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Post(
        path: '/api/member/loans',
        summary: 'Submit a new loan request as an authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['requested_amount', 'guarantor_member_id'],
                properties: [
                    new OA\Property(property: 'requested_amount', type: 'number', format: 'float', example: 150000),
                    new OA\Property(property: 'guarantor_member_id', type: 'integer', example: 3),
                    new OA\Property(property: 'purpose', type: 'string', nullable: true, example: 'School fees'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Need urgent support'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Loan request submitted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Loan request submitted successfully.'),
                        new OA\Property(property: 'loan', ref: '#/components/schemas/Loan'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
            new OA\Response(response: 422, description: 'Validation error or loan request blocked'),
        ]
    )]
    public function store(): void
    {
    }

    #[OA\Delete(
        path: '/api/member/loans/{loan}',
        summary: 'Delete a member loan request before disbursement',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        parameters: [
            new OA\Parameter(name: 'loan', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Loan deleted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Loan request deleted successfully.'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Not authorized to delete this loan'),
            new OA\Response(response: 422, description: 'Loan can no longer be deleted'),
        ]
    )]
    public function destroy(): void
    {
    }

    #[OA\Get(
        path: '/api/member/loan-guarantors',
        summary: 'List available guarantors for the authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Available guarantors',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'id', type: 'integer', example: 3),
                            new OA\Property(property: 'member_number', type: 'string', nullable: true, example: 'JDS2026-0003'),
                            new OA\Property(property: 'full_name', type: 'string', example: 'Jamila Mahdi'),
                            new OA\Property(property: 'email', type: 'string', example: 'secretary@jds.local'),
                        ],
                        type: 'object'
                    )
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function availableGuarantors(): void
    {
    }

    #[OA\Get(
        path: '/api/member/guarantor-approvals',
        summary: 'List guarantor approvals awaiting or reflecting the authenticated member response',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated guarantor approvals',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/LoanGuarantorApproval')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'total', type: 'integer', example: 1),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function guarantorApprovals(): void
    {
    }

    #[OA\Patch(
        path: '/api/member/guarantor-approvals/{loanGuarantorApproval}',
        summary: 'Approve or reject a guarantor request as the assigned guarantor',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        parameters: [
            new OA\Parameter(name: 'loanGuarantorApproval', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'approved'),
                    new OA\Property(property: 'response_note', type: 'string', nullable: true, example: 'I agree to stand as guarantor.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Guarantor response recorded',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Guarantor response recorded successfully.'),
                        new OA\Property(property: 'approval', ref: '#/components/schemas/LoanGuarantorApproval'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Not authorized to respond to this guarantor request'),
            new OA\Response(response: 422, description: 'Invalid guarantor response state'),
        ]
    )]
    public function respondToGuarantorApproval(): void
    {
    }

    #[OA\Get(
        path: '/api/member/loan-repayment-submissions',
        summary: 'List the authenticated member loan repayment receipt submissions',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: 'pending')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated repayment receipt submissions',
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
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function repaymentSubmissions(): void
    {
    }

    #[OA\Post(
        path: '/api/member/loan-repayment-submissions',
        summary: 'Submit a loan repayment receipt as an authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Loans'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['loan_id', 'amount_paid', 'receipt'],
                    properties: [
                        new OA\Property(property: 'loan_id', type: 'integer', example: 14),
                        new OA\Property(property: 'amount_paid', type: 'number', format: 'float', example: 50000),
                        new OA\Property(property: 'receipt', type: 'string', format: 'binary'),
                        new OA\Property(property: 'member_note', type: 'string', nullable: true, example: 'Bank transfer made this morning.'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Repayment receipt submitted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Loan repayment receipt submitted successfully for EXCO review.'),
                        new OA\Property(property: 'submission', ref: '#/components/schemas/LoanRepaymentSubmission'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
            new OA\Response(response: 422, description: 'Validation error or submission blocked'),
        ]
    )]
    public function storeRepaymentSubmission(): void
    {
    }
}
