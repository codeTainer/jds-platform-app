<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class AppearanceEndpoints
{
    #[OA\Get(
        path: '/api/public/appearance',
        summary: 'Load the public branding settings for the application shell',
        tags: ['Appearance'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Branding loaded successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'branding', ref: '#/components/schemas/BrandingSettings'),
                    ]
                )
            ),
        ]
    )]
    public function publicShow(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/appearance',
        summary: 'Load the current branding settings for EXCO appearance management',
        security: [['bearerAuth' => []]],
        tags: ['Appearance'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Appearance settings loaded successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'branding', ref: '#/components/schemas/BrandingSettings'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function show(): void
    {
    }

    #[OA\Post(
        path: '/api/exco/appearance',
        summary: 'Update the branding settings used across the app',
        security: [['bearerAuth' => []]],
        tags: ['Appearance'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                required: ['app_name', 'app_short_name', 'app_motto', 'primary_color', 'secondary_color'],
                properties: [
                    new OA\Property(property: 'app_name', type: 'string', example: 'JDS Platform'),
                    new OA\Property(property: 'app_short_name', type: 'string', example: 'JDS'),
                    new OA\Property(property: 'app_motto', type: 'string', example: 'Savings | Loans | Accountability'),
                    new OA\Property(property: 'primary_color', type: 'string', example: '#0B4C89'),
                    new OA\Property(property: 'secondary_color', type: 'string', example: '#A67C24'),
                    new OA\Property(property: 'logo', type: 'string', format: 'binary'),
                    new OA\Property(property: 'remove_logo', type: 'boolean', example: false),
                ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Appearance settings updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Appearance settings updated successfully.'),
                        new OA\Property(property: 'branding', ref: '#/components/schemas/BrandingSettings'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(): void
    {
    }
}
