<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoShareoutEndpoints
{
    #[OA\Get(
        path: '/api/exco/shareout-runs',
        summary: 'List share-out runs for EXCO',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated share-out runs',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/ShareoutRun')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'total', type: 'integer', example: 1),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/membership-cycles/{membershipCycle}/shareout-profit-preview',
        summary: 'Preview the auto-calculated profit for a cycle share-out',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'membershipCycle', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Cycle profit preview',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle'),
                        new OA\Property(
                            property: 'profit_breakdown',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'loan_service_charge_total', type: 'number', format: 'float', example: 120000),
                                new OA\Property(property: 'default_penalty_total', type: 'number', format: 'float', example: 12500),
                                new OA\Property(property: 'membership_fee_total', type: 'number', format: 'float', example: 24000),
                                new OA\Property(property: 'total_profit', type: 'number', format: 'float', example: 156500),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function profitPreview(): void
    {
    }

    #[OA\Post(
        path: '/api/exco/shareout-runs',
        summary: 'Generate or recalculate a share-out run for a cycle',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['membership_cycle_id'],
                properties: [
                    new OA\Property(property: 'membership_cycle_id', type: 'integer', example: 1),
                    new OA\Property(property: 'scheduled_start_on', type: 'string', format: 'date', nullable: true, example: '2026-12-15'),
                    new OA\Property(property: 'scheduled_end_on', type: 'string', format: 'date', nullable: true, example: '2026-12-21'),
                    new OA\Property(property: 'total_profit', type: 'number', format: 'float', nullable: true, example: 154411.25),
                    new OA\Property(property: 'admin_fee_rate', type: 'number', format: 'float', nullable: true, example: 20),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Annual payout draft'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Share-out run generated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share-out draft calculated successfully.'),
                        new OA\Property(property: 'run', ref: '#/components/schemas/ShareoutRun'),
                        new OA\Property(
                            property: 'profit_breakdown',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'loan_service_charge_total', type: 'number', format: 'float', example: 120000),
                                new OA\Property(property: 'default_penalty_total', type: 'number', format: 'float', example: 12500),
                                new OA\Property(property: 'membership_fee_total', type: 'number', format: 'float', example: 24000),
                                new OA\Property(property: 'total_profit', type: 'number', format: 'float', example: 156500),
                            ]
                        ),
                        new OA\Property(
                            property: 'summary',
                            properties: [
                                new OA\Property(property: 'members_count', type: 'integer', example: 4),
                                new OA\Property(property: 'total_shares', type: 'integer', example: 50),
                                new OA\Property(property: 'total_saved', type: 'number', format: 'float', example: 1000000),
                                new OA\Property(property: 'total_profit', type: 'number', format: 'float', example: 154411.25),
                                new OA\Property(property: 'admin_fee_amount', type: 'number', format: 'float', example: 30882.25),
                                new OA\Property(property: 'distributable_profit', type: 'number', format: 'float', example: 123529),
                                new OA\Property(property: 'gross_return_total', type: 'number', format: 'float', example: 1154411.25),
                                new OA\Property(property: 'outstanding_loan_deduction_total', type: 'number', format: 'float', example: 0),
                                new OA\Property(property: 'admin_fee_deduction_total', type: 'number', format: 'float', example: 30882.25),
                                new OA\Property(property: 'net_payout_total', type: 'number', format: 'float', example: 1123529),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Run is locked or validation failed'),
        ]
    )]
    public function store(): void
    {
    }

    #[OA\Delete(
        path: '/api/exco/shareout-runs/{shareoutRun}',
        summary: 'Delete a calculated share-out run',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'shareoutRun', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Share-out run deleted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share-out run deleted successfully.'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Only calculated runs can be deleted'),
        ]
    )]
    public function destroy(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/shareout-runs/{shareoutRun}',
        summary: 'Get share-out run detail',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'shareoutRun', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Share-out run detail',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'run', ref: '#/components/schemas/ShareoutRun'),
                        new OA\Property(
                            property: 'summary',
                            properties: [
                                new OA\Property(property: 'members_count', type: 'integer', example: 4),
                                new OA\Property(property: 'total_saved', type: 'number', format: 'float', example: 1000000),
                                new OA\Property(property: 'total_profit', type: 'number', format: 'float', example: 154411.25),
                                new OA\Property(property: 'admin_fee_amount', type: 'number', format: 'float', example: 30882.25),
                                new OA\Property(property: 'distributable_profit', type: 'number', format: 'float', example: 123529),
                                new OA\Property(property: 'gross_return_total', type: 'number', format: 'float', example: 1154411.25),
                                new OA\Property(property: 'outstanding_loan_deduction_total', type: 'number', format: 'float', example: 0),
                                new OA\Property(property: 'admin_fee_deduction_total', type: 'number', format: 'float', example: 30882.25),
                                new OA\Property(property: 'net_payout_total', type: 'number', format: 'float', example: 1123529),
                            ],
                            type: 'object'
                        ),
                        new OA\Property(
                            property: 'profit_breakdown',
                            type: 'object',
                            nullable: true,
                            properties: [
                                new OA\Property(property: 'loan_service_charge_total', type: 'number', format: 'float', example: 120000),
                                new OA\Property(property: 'default_penalty_total', type: 'number', format: 'float', example: 12500),
                                new OA\Property(property: 'membership_fee_total', type: 'number', format: 'float', example: 24000),
                                new OA\Property(property: 'total_profit', type: 'number', format: 'float', example: 156500),
                            ]
                        ),
                        new OA\Property(
                            property: 'formula',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'profit_share', type: 'string', example: 'Each member receives a share of distributable profit based on their savings ratio within the total cycle savings pool.'),
                                new OA\Property(property: 'final_payout', type: 'string', example: 'Final share-out = member savings + member share of distributable profit - outstanding loan deduction.'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function show(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/shareout-runs/{shareoutRun}/items',
        summary: 'List share-out items for a run',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'shareoutRun', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated share-out items',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/ShareoutItem')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 4),
                        new OA\Property(property: 'total', type: 'integer', example: 4),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function items(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/shareout-runs/{shareoutRun}/approve',
        summary: 'Approve a calculated share-out run',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'shareoutRun', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Share-out run approved',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share-out run approved successfully.'),
                        new OA\Property(property: 'run', ref: '#/components/schemas/ShareoutRun'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Only calculated runs can be approved'),
        ]
    )]
    public function approve(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/shareout-runs/{shareoutRun}/reject',
        summary: 'Reject a calculated or approved share-out run',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'shareoutRun', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Share-out run rejected',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share-out run rejected successfully.'),
                        new OA\Property(property: 'run', ref: '#/components/schemas/ShareoutRun'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Only calculated or approved runs can be rejected'),
        ]
    )]
    public function reject(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/shareout-runs/{shareoutRun}/execute',
        summary: 'Mark an approved share-out run as executed',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'shareoutRun', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Share-out run executed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share-out run marked as executed.'),
                        new OA\Property(property: 'run', ref: '#/components/schemas/ShareoutRun'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Only approved runs can be executed'),
        ]
    )]
    public function execute(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/shareout-items/{shareoutItem}/mark-paid',
        summary: 'Mark an executed share-out item as paid',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Shareouts'],
        parameters: [
            new OA\Parameter(name: 'shareoutItem', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Share-out item updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share-out item marked as paid.'),
                        new OA\Property(property: 'item', ref: '#/components/schemas/ShareoutItem'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Run must be executed before items can be marked paid'),
        ]
    )]
    public function markItemPaid(): void
    {
    }
}
