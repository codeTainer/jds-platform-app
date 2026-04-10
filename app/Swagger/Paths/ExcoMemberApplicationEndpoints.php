<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoMemberApplicationEndpoints
{
    #[OA\Get(
        path: '/api/exco/member-applications',
        summary: 'List member applications for EXCO review',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Member Applications'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of applications',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/MemberApplication'))
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/member-applications/{id}',
        summary: 'View a single member application',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Member Applications'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Application details',
                content: new OA\JsonContent(ref: '#/components/schemas/MemberApplication')
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Application not found'),
        ]
    )]
    public function show(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/member-applications/{id}/review',
        summary: 'Approve or reject a member application',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Member Applications'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'approved'),
                    new OA\Property(property: 'review_note', type: 'string', nullable: true, example: 'Meets onboarding criteria.'),
                    new OA\Property(property: 'reviewed_by', type: 'integer', nullable: true, example: 1),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Application reviewed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Application reviewed successfully.'),
                        new OA\Property(property: 'application', ref: '#/components/schemas/MemberApplication'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Invalid review state'),
        ]
    )]
    public function review(): void
    {
    }
}
