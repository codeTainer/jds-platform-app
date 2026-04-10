<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoMembershipCycleEndpoints
{
    #[OA\Get(
        path: '/api/exco/membership-cycles',
        summary: 'List membership cycles',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Membership Cycles'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of membership cycles',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/MembershipCycle'))
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Post(
        path: '/api/exco/membership-cycles',
        summary: 'Create a membership cycle',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Membership Cycles'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'code', 'starts_on', 'ends_on'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'JDS 2027 Cycle'),
                    new OA\Property(property: 'code', type: 'string', example: 'JDS2027'),
                    new OA\Property(property: 'starts_on', type: 'string', format: 'date', example: '2027-01-01'),
                    new OA\Property(property: 'ends_on', type: 'string', format: 'date', example: '2027-12-31'),
                    new OA\Property(property: 'onboarding_opens_at', type: 'string', format: 'date-time', nullable: true),
                    new OA\Property(property: 'onboarding_closes_at', type: 'string', format: 'date-time', nullable: true),
                    new OA\Property(property: 'accepting_new_applications', type: 'boolean', example: true),
                    new OA\Property(property: 'is_active', type: 'boolean', example: false),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Cycle created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Membership cycle created successfully.'),
                        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/membership-cycles/{id}',
        summary: 'View a membership cycle',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Membership Cycles'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Cycle details',
                content: new OA\JsonContent(ref: '#/components/schemas/MembershipCycle')
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Cycle not found'),
        ]
    )]
    public function show(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/membership-cycles/{id}',
        summary: 'Update a membership cycle',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Membership Cycles'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'JDS 2027 Cycle'),
                    new OA\Property(property: 'accepting_new_applications', type: 'boolean', example: false),
                    new OA\Property(property: 'onboarding_notes', type: 'string', nullable: true),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Cycle updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Membership cycle updated successfully.'),
                        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle'),
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

    #[OA\Patch(
        path: '/api/exco/membership-cycles/{id}/activate',
        summary: 'Activate a membership cycle',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Membership Cycles'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Cycle activated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Membership cycle activated successfully.'),
                        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Cycle not found'),
        ]
    )]
    public function activate(): void
    {
    }

    #[OA\Delete(
        path: '/api/exco/membership-cycles/{id}',
        summary: 'Delete a membership cycle',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Membership Cycles'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Cycle deleted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Membership cycle deleted successfully.'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Cycle has linked records and cannot be deleted'),
        ]
    )]
    public function destroy(): void
    {
    }
}
