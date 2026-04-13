<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoAuditLogEndpoints
{
    #[OA\Get(
        path: '/api/exco/audit-logs',
        summary: 'Get the EXCO audit trail',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Audit'],
        parameters: [
            new OA\Parameter(name: 'actor_user_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'module', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: 'loans')),
            new OA\Parameter(name: 'action', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: 'loans.approved')),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'date_from', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'date_to', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated audit logs',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/AuditLog')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 3),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
                        new OA\Property(property: 'total', type: 'integer', example: 28),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function index(): void
    {
    }
}
