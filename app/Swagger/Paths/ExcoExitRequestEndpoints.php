<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoExitRequestEndpoints
{
    #[OA\Get(
        path: '/api/exco/exit-requests',
        summary: 'List member exit requests for EXCO',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Exit Requests'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'member_search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
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
            new OA\Response(response: 403, description: 'Unauthorized for exit desk'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/exit-requests/{memberExitRequest}',
        summary: 'Update a member exit request status',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Exit Requests'],
        parameters: [
            new OA\Parameter(name: 'memberExitRequest', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'approved'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Approved pending final payout processing.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Exit request updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Exit request updated successfully.'),
                        new OA\Property(property: 'exit_request', ref: '#/components/schemas/MemberExitRequest'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Unauthorized for exit desk'),
            new OA\Response(response: 422, description: 'Validation failed'),
        ]
    )]
    public function update(): void
    {
    }
}
