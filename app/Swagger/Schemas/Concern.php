<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Concern',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'subject', type: 'string', example: 'My April share is missing'),
        new OA\Property(property: 'message', type: 'string', example: 'I uploaded the receipt and it was approved, but the record still does not appear in my share history.'),
        new OA\Property(property: 'status', type: 'string', example: 'open'),
        new OA\Property(property: 'raised_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-12T09:10:00Z'),
        new OA\Property(property: 'resolved_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-13T15:25:00Z'),
        new OA\Property(property: 'resolution_note', type: 'string', nullable: true, example: 'EXCO confirmed the missing posting and updated your record.'),
        new OA\Property(property: 'reference_type', type: 'string', example: 'share_purchase'),
        new OA\Property(property: 'reference_group_label', type: 'string', example: 'Share Purchase Record'),
        new OA\Property(property: 'reference_label', type: 'string', example: 'Share purchase for April 2026'),
        new OA\Property(property: 'reference_subtitle', type: 'string', nullable: true, example: 'JDS2026 · 10 shares · NGN 200,000.00'),
        new OA\Property(property: 'action_url', type: 'string', nullable: true, example: '/dashboard/member/savings'),
        new OA\Property(
            property: 'member',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 1),
                new OA\Property(property: 'member_number', type: 'string', nullable: true, example: 'JDS-MEM-0001'),
                new OA\Property(property: 'full_name', type: 'string', example: 'Ebube Chidi'),
                new OA\Property(property: 'email', type: 'string', example: 'ebube93.chidi@gmail.com'),
            ]
        ),
        new OA\Property(
            property: 'resolver',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 2),
                new OA\Property(property: 'name', type: 'string', example: 'Secretary JDS'),
                new OA\Property(property: 'role', type: 'string', example: 'secretary'),
            ]
        ),
    ]
)]
class Concern
{
}
