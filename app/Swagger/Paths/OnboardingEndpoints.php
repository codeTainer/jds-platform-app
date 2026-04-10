<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class OnboardingEndpoints
{
    #[OA\Get(
        path: '/api/onboarding/current-cycle',
        summary: 'Get the current active cycle and whether onboarding is open',
        tags: ['Onboarding'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Current cycle onboarding status',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle'),
                        new OA\Property(property: 'onboarding_open', type: 'boolean', example: true),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'No active cycle configured'),
        ]
    )]
    public function currentCycle(): void
    {
    }

    #[OA\Post(
        path: '/api/member-applications',
        summary: 'Submit a new member application',
        tags: ['Onboarding'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['full_name', 'email', 'phone_number', 'has_online_banking', 'whatsapp_active'],
                properties: [
                    new OA\Property(property: 'full_name', type: 'string', example: 'Jane Doe'),
                    new OA\Property(property: 'email', type: 'string', example: 'jane@example.com'),
                    new OA\Property(property: 'phone_number', type: 'string', example: '08012345678'),
                    new OA\Property(property: 'has_online_banking', type: 'boolean', example: true),
                    new OA\Property(property: 'whatsapp_active', type: 'boolean', example: true),
                    new OA\Property(property: 'biodata', type: 'object', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Application submitted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Application submitted successfully.'),
                        new OA\Property(property: 'application', ref: '#/components/schemas/MemberApplication'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Onboarding closed or validation error'),
        ]
    )]
    public function apply(): void
    {
    }
}
