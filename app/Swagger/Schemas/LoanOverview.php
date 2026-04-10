<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'LoanOverview',
    type: 'object',
    properties: [
        new OA\Property(
            property: 'summary',
            type: 'object',
            properties: [
                new OA\Property(property: 'share_value', type: 'number', format: 'float', example: 160000),
                new OA\Property(property: 'loan_multiplier', type: 'number', format: 'float', example: 3),
                new OA\Property(property: 'eligible_amount', type: 'number', format: 'float', example: 480000),
                new OA\Property(property: 'can_request', type: 'boolean', example: false),
                new OA\Property(property: 'request_block_reason', type: 'string', nullable: true, example: 'You already have a loan that has not been fully repaid. Another loan can only be requested after the current one is cleared.'),
                new OA\Property(property: 'active_loan', ref: '#/components/schemas/Loan', nullable: true),
            ]
        ),
    ]
)]
class LoanOverview
{
}
