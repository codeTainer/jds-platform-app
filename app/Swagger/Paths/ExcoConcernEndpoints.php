<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoConcernEndpoints
{
    #[OA\Get(
        path: '/api/exco/concerns',
        summary: 'List concerns for EXCO and support staff',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Concerns'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'reference_type', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'member_search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated concern queue',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Concern')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'total', type: 'integer', example: 1),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Unauthorized for support desk'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/concerns/{concern}',
        summary: 'Update the status or response note for a concern',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Concerns'],
        parameters: [
            new OA\Parameter(name: 'concern', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'resolved'),
                    new OA\Property(property: 'resolution_note', type: 'string', nullable: true, example: 'EXCO verified the record and posted the missing share purchase.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Concern updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Concern updated successfully.'),
                        new OA\Property(property: 'concern', ref: '#/components/schemas/Concern'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Unauthorized for support desk'),
            new OA\Response(response: 422, description: 'Validation failed'),
        ]
    )]
    public function update(): void
    {
    }
}
