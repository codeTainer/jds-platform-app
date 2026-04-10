<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class MemberShareoutEndpoints
{
    #[OA\Get(
        path: '/api/member/shareouts/overview',
        summary: 'Get the authenticated member share-out overview',
        security: [['bearerAuth' => []]],
        tags: ['Member Shareouts'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Share-out overview',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'summary',
                            properties: [
                                new OA\Property(property: 'shareout_items_count', type: 'integer', example: 1),
                                new OA\Property(property: 'total_gross_return', type: 'number', format: 'float', example: 120000),
                                new OA\Property(property: 'total_admin_fee_deduction', type: 'number', format: 'float', example: 24000),
                                new OA\Property(property: 'total_outstanding_loan_deduction', type: 'number', format: 'float', example: 30000),
                                new OA\Property(property: 'total_net_payout', type: 'number', format: 'float', example: 66000),
                                new OA\Property(property: 'paid_items_count', type: 'integer', example: 0),
                            ],
                            type: 'object'
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
        path: '/api/member/shareouts',
        summary: 'List the authenticated member share-out items',
        security: [['bearerAuth' => []]],
        tags: ['Member Shareouts'],
        parameters: [
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
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
}
