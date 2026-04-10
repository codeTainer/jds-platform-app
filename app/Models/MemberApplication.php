<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberApplication extends Model
{
    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_WITHDRAWN = 'withdrawn';

    protected $fillable = [
        'membership_cycle_id',
        'full_name',
        'email',
        'phone_number',
        'has_online_banking',
        'whatsapp_active',
        'biodata',
        'status',
        'applied_at',
        'reviewed_at',
        'reviewed_by',
        'approved_member_id',
        'review_note',
    ];

    protected function casts(): array
    {
        return [
            'has_online_banking' => 'boolean',
            'whatsapp_active' => 'boolean',
            'biodata' => 'array',
            'applied_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(MembershipCycle::class, 'membership_cycle_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedMember(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'approved_member_id');
    }
}
