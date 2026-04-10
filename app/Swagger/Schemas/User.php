<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'User',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'name', type: 'string', example: 'Shadrach Gideon'),
        new OA\Property(property: 'email', type: 'string', example: 'chairperson@jds.local'),
        new OA\Property(property: 'member_id', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'role', type: 'string', example: 'chairperson'),
        new OA\Property(property: 'must_change_password', type: 'boolean', example: true),
        new OA\Property(property: 'temporary_password_sent_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-07T09:00:00Z'),
        new OA\Property(property: 'password_changed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-07T09:30:00Z'),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-04-01T19:26:18Z'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-04-01T19:26:18Z'),
    ]
)]
class User
{
}
