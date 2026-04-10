<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MembershipFeeSubmission extends Model
{
    protected $fillable = [
        'membership_cycle_id',
        'member_id',
        'fee_type',
        'expected_amount',
        'receipt_path',
        'receipt_disk',
        'receipt_original_name',
        'receipt_mime_type',
        'receipt_size_bytes',
        'status',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'approved_membership_fee_id',
        'member_note',
        'review_note',
    ];

    protected $appends = [
        'receipt_url',
    ];

    protected function casts(): array
    {
        return [
            'expected_amount' => 'decimal:2',
            'receipt_size_bytes' => 'integer',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(MembershipCycle::class, 'membership_cycle_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedMembershipFee(): BelongsTo
    {
        return $this->belongsTo(MembershipFee::class, 'approved_membership_fee_id');
    }

    public function getReceiptUrlAttribute(): ?string
    {
        if (! $this->receipt_path) {
            return null;
        }

        $disk = $this->receipt_disk ?: config('jds.receipt_disk', 'public');

        if ($disk === 'public') {
            return '/storage/'.ltrim($this->receipt_path, '/');
        }

        return Storage::disk($disk)->url($this->receipt_path);
    }
}
