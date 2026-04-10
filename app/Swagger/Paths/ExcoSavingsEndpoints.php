<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class ExcoSavingsEndpoints
{
    #[OA\Get(
        path: '/api/exco/membership-fees',
        summary: 'List membership fees for EXCO',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Savings'],
        parameters: [
            new OA\Parameter(name: 'member_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'fee_type', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'paid_month', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: '2026-01')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated membership fees',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/MembershipFee')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 4),
                        new OA\Property(property: 'total', type: 'integer', example: 4),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function membershipFees(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/membership-fee-submissions',
        summary: 'List member membership fee submissions for EXCO review',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Savings'],
        parameters: [
            new OA\Parameter(name: 'member_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'fee_type', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated membership fee submissions',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/MembershipFeeSubmission')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 2),
                        new OA\Property(property: 'total', type: 'integer', example: 2),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function membershipFeeSubmissions(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/share-purchases',
        summary: 'List share purchases for EXCO',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Savings'],
        parameters: [
            new OA\Parameter(name: 'member_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'payment_status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'share_month', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: '2026-03')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated share purchases',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/SharePurchase')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 2),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
                        new OA\Property(property: 'total', type: 'integer', example: 12),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function sharePurchases(): void
    {
    }

    #[OA\Get(
        path: '/api/exco/share-payment-submissions',
        summary: 'List member share payment submissions for EXCO review',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Savings'],
        parameters: [
            new OA\Parameter(name: 'member_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'share_month', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: '2026-03')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated share payment submissions',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/SharePaymentSubmission')),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 2),
                        new OA\Property(property: 'total', type: 'integer', example: 2),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function sharePaymentSubmissions(): void
    {
    }

    #[OA\Post(
        path: '/api/exco/share-purchases',
        summary: 'Record a member share purchase',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Savings'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['member_id', 'share_month', 'shares_count'],
                properties: [
                    new OA\Property(property: 'member_id', type: 'integer', example: 1),
                    new OA\Property(property: 'membership_cycle_id', type: 'integer', nullable: true, example: 1),
                    new OA\Property(property: 'share_month', type: 'string', format: 'date', example: '2026-04-01'),
                    new OA\Property(property: 'shares_count', type: 'integer', example: 2),
                    new OA\Property(property: 'unit_share_price', type: 'number', format: 'float', nullable: true, example: 20000),
                    new OA\Property(property: 'payment_status', type: 'string', example: 'confirmed'),
                    new OA\Property(property: 'purchased_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T10:00:00Z'),
                    new OA\Property(property: 'confirmed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-02T10:05:00Z'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Verified from WhatsApp receipt'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Share purchase recorded',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share purchase recorded successfully.'),
                        new OA\Property(property: 'share_purchase', ref: '#/components/schemas/SharePurchase'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error or duplicate monthly share entry'),
        ]
    )]
    public function storeSharePurchase(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/share-payment-submissions/{sharePaymentSubmission}/review',
        summary: 'Approve or reject a member share payment submission',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Savings'],
        parameters: [
            new OA\Parameter(name: 'sharePaymentSubmission', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'approved'),
                    new OA\Property(property: 'review_note', type: 'string', nullable: true, example: 'Receipt verified and posted.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Submission reviewed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share payment submission approved and posted successfully.'),
                        new OA\Property(property: 'submission', ref: '#/components/schemas/SharePaymentSubmission'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Only pending submissions can be reviewed'),
        ]
    )]
    public function reviewSharePaymentSubmission(): void
    {
    }

    #[OA\Patch(
        path: '/api/exco/membership-fee-submissions/{membershipFeeSubmission}/review',
        summary: 'Approve or reject a member membership fee submission',
        security: [['bearerAuth' => []]],
        tags: ['EXCO Savings'],
        parameters: [
            new OA\Parameter(name: 'membershipFeeSubmission', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'approved'),
                    new OA\Property(property: 'review_note', type: 'string', nullable: true, example: 'Receipt verified and posted.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Submission reviewed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Membership fee submission approved and posted successfully.'),
                        new OA\Property(property: 'submission', ref: '#/components/schemas/MembershipFeeSubmission'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Only pending submissions can be reviewed'),
        ]
    )]
    public function reviewMembershipFeeSubmission(): void
    {
    }
}
