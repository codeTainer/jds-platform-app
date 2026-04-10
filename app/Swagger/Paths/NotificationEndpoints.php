<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class NotificationEndpoints
{
    #[OA\Get(
        path: '/api/notifications',
        summary: 'List the authenticated user in-app notifications',
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        parameters: [
            new OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 20)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notifications loaded successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'unread_count', type: 'integer', example: 3),
                        new OA\Property(property: 'notifications', type: 'array', items: new OA\Items(ref: '#/components/schemas/AppNotification')),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Patch(
        path: '/api/notifications/{notification}/read',
        summary: 'Mark a single in-app notification as read',
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        parameters: [
            new OA\Parameter(name: 'notification', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notification marked as read',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Notification marked as read.'),
                        new OA\Property(property: 'notification', ref: '#/components/schemas/AppNotification'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Not authorized to access this notification'),
        ]
    )]
    public function markRead(): void
    {
    }

    #[OA\Post(
        path: '/api/notifications/mark-all-read',
        summary: 'Mark all in-app notifications as read for the authenticated user',
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'All notifications marked as read',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'All notifications marked as read.'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function markAllRead(): void
    {
    }
}
