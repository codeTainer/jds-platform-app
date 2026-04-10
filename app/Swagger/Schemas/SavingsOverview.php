<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SavingsOverview',
    type: 'object',
    properties: [
        new OA\Property(property: 'member', ref: '#/components/schemas/Member'),
        new OA\Property(
            property: 'summary',
            properties: [
                new OA\Property(property: 'share_purchases_count', type: 'integer', example: 5),
                new OA\Property(property: 'total_shares_count', type: 'integer', example: 8),
                new OA\Property(property: 'total_share_value', type: 'number', format: 'float', example: 160000),
                new OA\Property(property: 'membership_fees_paid', type: 'integer', example: 1),
                new OA\Property(property: 'membership_fees_pending', type: 'integer', example: 0),
            ],
            type: 'object'
        ),
    ]
)]
class SavingsOverview
{
}
