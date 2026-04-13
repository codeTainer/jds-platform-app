<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class MemberExitRequestEndpoints
{
    #[OA\Get(
        path: '/api/member/exit-requests/overview',
        summary: 'Get the authenticated member exit overview',
        security: [['bearerAuth' => []]],
        tags: ['Member Exit Requests'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Exit overview',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'member',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'id', type: 'integer', example: 1),
                                new OA\Property(property: 'member_number', type: 'string', nullable: true, example: 'JDS-MEM-0001'),
                                new OA\Property(property: 'full_name', type: 'string', example: 'Ebube Chidi'),
                                new OA\Property(property: 'membership_status', type: 'string', example: 'active'),
                                new OA\Property(property: 'left_on', type: 'string', format: 'date', nullable: true, example: null),
                            ]
                        ),
                        new OA\Property(
                            property: 'summary',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'total_saved_value', type: 'number', format: 'float', example: 1200000),
                                new OA\Property(property: 'outstanding_loan_balance', type: 'number', format: 'float', example: 250000),
                                new OA\Property(property: 'estimated_refund_amount', type: 'number', format: 'float', example: 950000),
                                new OA\Property(property: 'latest_exit_request_status', type: 'string', nullable: true, example: 'pending'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function overview(): void
    {
    }

    #[OA\Get(
        path: '/api/member/exit-requests',
        summary: 'List exit requests raised by the authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Exit Requests'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated exit requests',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/MemberExitRequest')),
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
    public function index(): void
    {
    }

    #[OA\Post(
        path: '/api/member/exit-requests',
        summary: 'Submit a new member exit request',
        security: [['bearerAuth' => []]],
        tags: ['Member Exit Requests'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['notice_given_on', 'requested_exit_on'],
                properties: [
                    new OA\Property(property: 'notice_given_on', type: 'string', format: 'date', example: '2026-04-01'),
                    new OA\Property(property: 'requested_exit_on', type: 'string', format: 'date', example: '2026-05-01'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'I want to exit after my current commitments are concluded.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Exit request submitted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Exit request submitted successfully and is awaiting EXCO review.'),
                        new OA\Property(property: 'exit_request', ref: '#/components/schemas/MemberExitRequest'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
            new OA\Response(response: 422, description: 'Validation failed'),
        ]
    )]
    public function store(): void
    {
    }
}
