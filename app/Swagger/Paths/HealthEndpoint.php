<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class HealthEndpoint
{
    #[OA\Get(
        path: '/api/health',
        summary: 'Health check endpoint',
        tags: ['System'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Application health status',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'ok'),
                        new OA\Property(property: 'app', type: 'string', example: 'JDS Platform'),
                    ]
                )
            ),
        ]
    )]
    public function __invoke(): void
    {
    }
}
