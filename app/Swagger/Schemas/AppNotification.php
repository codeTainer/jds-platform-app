<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'AppNotification',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', example: '8d93f57f-6d6d-4df5-8f4d-6f5e0d951201'),
        new OA\Property(property: 'title', type: 'string', example: 'Loan disbursed'),
        new OA\Property(property: 'message', type: 'string', example: 'Your approved loan has been disbursed. Please view the receipt and confirm it in the app.'),
        new OA\Property(property: 'category', type: 'string', example: 'loans'),
        new OA\Property(property: 'action_url', type: 'string', nullable: true, example: '/dashboard/member/loans'),
        new OA\Property(property: 'action_label', type: 'string', nullable: true, example: 'View receipt'),
        new OA\Property(property: 'level', type: 'string', example: 'success'),
        new OA\Property(property: 'meta', type: 'object', nullable: true),
        new OA\Property(property: 'read_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-10T11:25:00Z'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-10T11:20:00Z'),
    ]
)]
class AppNotification
{
}
