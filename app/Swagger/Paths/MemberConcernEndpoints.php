<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class MemberConcernEndpoints
{
    #[OA\Get(
        path: '/api/member/concerns/options',
        summary: 'Get concern reference options for the authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Concerns'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Concern reference options',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'reference_groups',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'type', type: 'string', example: 'share_purchase'),
                                    new OA\Property(property: 'label', type: 'string', example: 'Share Purchase Record'),
                                    new OA\Property(property: 'description', type: 'string', example: 'Questions about a posted monthly share purchase record.'),
                                    new OA\Property(property: 'requires_record', type: 'boolean', example: true),
                                    new OA\Property(
                                        property: 'options',
                                        type: 'array',
                                        items: new OA\Items(
                                            properties: [
                                                new OA\Property(property: 'id', type: 'integer', example: 12),
                                                new OA\Property(property: 'label', type: 'string', example: 'Share purchase for April 2026'),
                                                new OA\Property(property: 'subtitle', type: 'string', nullable: true, example: 'JDS2026 · 10 shares · NGN 200,000.00'),
                                            ],
                                            type: 'object'
                                        )
                                    ),
                                ],
                                type: 'object'
                            )
                        ),
                        new OA\Property(
                            property: 'status_options',
                            type: 'array',
                            items: new OA\Items(type: 'string', example: 'open')
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function options(): void
    {
    }

    #[OA\Get(
        path: '/api/member/concerns',
        summary: 'List concerns raised by the authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Concerns'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'reference_type', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated member concerns',
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
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Post(
        path: '/api/member/concerns',
        summary: 'Submit a new concern as the authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Concerns'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['reference_type', 'subject', 'message'],
                properties: [
                    new OA\Property(property: 'reference_type', type: 'string', example: 'share_purchase'),
                    new OA\Property(property: 'reference_id', type: 'integer', nullable: true, example: 12),
                    new OA\Property(property: 'subject', type: 'string', example: 'My April share is missing'),
                    new OA\Property(property: 'message', type: 'string', example: 'I uploaded the receipt and it was approved, but the purchase does not show in my official history.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Concern submitted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Your concern has been submitted successfully.'),
                        new OA\Property(property: 'concern', ref: '#/components/schemas/Concern'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
            new OA\Response(response: 422, description: 'Validation failed'),
        ]
    )]
    public function store(): void
    {
    }
}
