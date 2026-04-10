<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SharePaymentSubmission',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'membership_cycle_id', type: 'integer', example: 1),
        new OA\Property(property: 'member_id', type: 'integer', example: 4),
        new OA\Property(property: 'share_month', type: 'string', format: 'date', example: '2026-04-01'),
        new OA\Property(property: 'shares_count', type: 'integer', example: 2),
        new OA\Property(property: 'unit_share_price', type: 'number', format: 'float', example: 20000),
        new OA\Property(property: 'expected_amount', type: 'number', format: 'float', example: 40000),
        new OA\Property(property: 'receipt_path', type: 'string', example: 'share-payment-receipts/receipt-123.png'),
        new OA\Property(property: 'receipt_disk', type: 'string', nullable: true, example: 'public'),
        new OA\Property(property: 'receipt_original_name', type: 'string', nullable: true, example: 'april-share-receipt.pdf'),
        new OA\Property(property: 'receipt_mime_type', type: 'string', nullable: true, example: 'application/pdf'),
        new OA\Property(property: 'receipt_size_bytes', type: 'integer', nullable: true, example: 248321),
        new OA\Property(property: 'receipt_url', type: 'string', nullable: true, example: '/storage/share-payment-receipts/receipt-123.png'),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-03T09:30:00Z'),
        new OA\Property(property: 'reviewed_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-03T10:00:00Z'),
        new OA\Property(property: 'approved_share_purchase_id', type: 'integer', nullable: true, example: 12),
        new OA\Property(property: 'member_note', type: 'string', nullable: true, example: 'Transferred this morning.'),
        new OA\Property(property: 'review_note', type: 'string', nullable: true, example: 'Receipt verified against bank entry.'),
        new OA\Property(property: 'member', ref: '#/components/schemas/Member', nullable: true),
        new OA\Property(property: 'cycle', ref: '#/components/schemas/MembershipCycle', nullable: true),
        new OA\Property(property: 'reviewer', ref: '#/components/schemas/User', nullable: true),
        new OA\Property(property: 'approved_share_purchase', ref: '#/components/schemas/SharePurchase', nullable: true),
    ]
)]
class SharePaymentSubmission
{
}
