<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoReportEndpoints
{
    #[OA\Get(
        path: '/api/exco/reports/summary',
        summary: 'Get the EXCO reporting summary for a cycle or the active cycle',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Reports'],
        parameters: [
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Report summary',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle', nullable: true),
                        new OA\Property(
                            property: 'summary',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'members_on_platform', type: 'integer', example: 24),
                                new OA\Property(property: 'members_with_savings', type: 'integer', example: 18),
                                new OA\Property(property: 'total_savings_value', type: 'number', format: 'float', example: 8200000),
                                new OA\Property(property: 'membership_fees_paid_total', type: 'number', format: 'float', example: 54000),
                                new OA\Property(property: 'loans_disbursed_total', type: 'number', format: 'float', example: 3200000),
                                new OA\Property(property: 'loan_service_charge_total', type: 'number', format: 'float', example: 320000),
                                new OA\Property(property: 'outstanding_loan_balance', type: 'number', format: 'float', example: 850000),
                                new OA\Property(property: 'shareout_net_payout_total', type: 'number', format: 'float', example: 9150000),
                                new OA\Property(property: 'shareout_paid_total', type: 'number', format: 'float', example: 6100000),
                                new OA\Property(property: 'open_concerns_count', type: 'integer', example: 2),
                                new OA\Property(property: 'resolved_concerns_count', type: 'integer', example: 6),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function summary(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/reports/savings',
        summary: 'Get the EXCO savings report',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Reports'],
        parameters: [
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated savings report',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Member')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 3),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
                        new OA\Property(property: 'total', type: 'integer', example: 24),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function savings(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/reports/loans',
        summary: 'Get the EXCO loan report',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Reports'],
        parameters: [
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated loan report',
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
    public function loans(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/reports/shareouts',
        summary: 'Get the EXCO share-out report',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Reports'],
        parameters: [
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated share-out report',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/ShareoutItem')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 5),
                        new OA\Property(property: 'total', type: 'integer', example: 5),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function shareouts(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/reports/concerns',
        summary: 'Get the EXCO concern report',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Reports'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'reference_type', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated concern report',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Concern')),
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
    public function concerns(): void
    {
    }
}
