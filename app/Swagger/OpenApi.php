<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

#[OA\Info(
    title: 'JDS Platform API',
    version: '1.0.0',
    description: 'API documentation for the JDS Platform Laravel backend.'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'API Token',
    description: 'Use the Bearer token returned from POST /api/auth/login.'
)]
#[OA\Server(
    url: L5_SWAGGER_CONST_HOST,
    description: 'Primary API server'
)]
class OpenApi
{
    // Root OpenAPI metadata container for swagger-php.
}
