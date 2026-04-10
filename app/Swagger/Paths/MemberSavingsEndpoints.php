<?php

namespace App\Swagger\Paths;

use OpenApi\Attributes as OA;

class MemberSavingsEndpoints
{
    #[OA\Get(
        path: '/api/member/membership-cycles',
        summary: 'List membership cycles available to the authenticated member',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Membership cycles',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/MembershipCycle'))
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function membershipCycles(): void
    {
    }

    #[OA\Get(
        path: '/api/member/savings/overview',
        summary: 'Get the authenticated member savings overview',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Savings overview',
                content: new OA\JsonContent(ref: '#/components/schemas/SavingsOverview')
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function overview(): void
    {
    }

    #[OA\Get(
        path: '/api/member/share-purchases',
        summary: 'List the authenticated member share purchases',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        parameters: [
            new OA\Parameter(name: 'share_month', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: '2026-03')),
            new OA\Parameter(name: 'payment_status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
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
                        new OA\Property(property: 'last_page', type: 'integer', example: 1),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 5),
                        new OA\Property(property: 'total', type: 'integer', example: 5),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function sharePurchases(): void
    {
    }

    #[OA\Get(
        path: '/api/member/share-payment-submissions',
        summary: 'List the authenticated member share payment submissions',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        parameters: [
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'share_month', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: '2026-03')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
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
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function sharePaymentSubmissions(): void
    {
    }

    #[OA\Post(
        path: '/api/member/share-payment-submissions',
        summary: 'Submit a share payment receipt for EXCO verification',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['share_month', 'shares_count', 'receipt'],
                    properties: [
                        new OA\Property(property: 'membership_cycle_id', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'share_month', type: 'string', format: 'date', example: '2026-04-01'),
                        new OA\Property(property: 'shares_count', type: 'integer', example: 2),
                        new OA\Property(property: 'receipt', type: 'string', format: 'binary'),
                        new OA\Property(property: 'member_note', type: 'string', nullable: true, example: 'Paid this morning.'),
                    ],
                    type: 'object'
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Share payment submission recorded',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Share payment receipt submitted successfully and is awaiting EXCO verification.'),
                        new OA\Property(property: 'submission', ref: '#/components/schemas/SharePaymentSubmission'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
            new OA\Response(response: 422, description: 'Validation error or duplicate monthly submission'),
        ]
    )]
    public function storeSharePaymentSubmission(): void
    {
    }

    #[OA\Get(
        path: '/api/member/membership-fee-submissions',
        summary: 'List the authenticated member membership fee submissions',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        parameters: [
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
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function membershipFeeSubmissions(): void
    {
    }

    #[OA\Post(
        path: '/api/member/membership-fee-submissions',
        summary: 'Submit a membership fee receipt for EXCO verification',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['fee_type', 'receipt'],
                    properties: [
                        new OA\Property(property: 'membership_cycle_id', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'fee_type', type: 'string', example: 'existing_member'),
                        new OA\Property(property: 'receipt', type: 'string', format: 'binary'),
                        new OA\Property(property: 'member_note', type: 'string', nullable: true, example: 'Membership fee paid today.'),
                    ],
                    type: 'object'
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Membership fee submission recorded',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Membership fee receipt submitted successfully and is awaiting EXCO verification.'),
                        new OA\Property(property: 'submission', ref: '#/components/schemas/MembershipFeeSubmission'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
            new OA\Response(response: 422, description: 'Validation error or duplicate cycle submission'),
        ]
    )]
    public function storeMembershipFeeSubmission(): void
    {
    }

    #[OA\Get(
        path: '/api/member/membership-fees',
        summary: 'List the authenticated member membership fees',
        security: [['bearerAuth' => []]],
        tags: ['Member Savings'],
        parameters: [
            new OA\Parameter(name: 'membership_cycle_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
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
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'total', type: 'integer', example: 1),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Authenticated user is not linked to a member profile'),
        ]
    )]
    public function membershipFees(): void
    {
    }
}
