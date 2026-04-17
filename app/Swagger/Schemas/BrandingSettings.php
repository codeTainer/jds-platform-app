<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'BrandingSettings',
    type: 'object',
    properties: [
        new OA\Property(property: 'app_name', type: 'string', example: 'JDS Platform'),
        new OA\Property(property: 'app_short_name', type: 'string', example: 'JDS'),
        new OA\Property(property: 'app_motto', type: 'string', example: 'Savings | Loans | Accountability'),
        new OA\Property(property: 'primary_color', type: 'string', example: '#0B4C89'),
        new OA\Property(property: 'secondary_color', type: 'string', example: '#A67C24'),
        new OA\Property(property: 'logo_url', type: 'string', nullable: true, example: '/storage/branding/logo.png'),
    ]
)]
class BrandingSettings
{
}
