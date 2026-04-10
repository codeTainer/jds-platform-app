<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SharePurchase extends Model
{
    protected $fillable = [
        'membership_cycle_id',
        'member_id',
        'share_month',
        'shares_count',
        'unit_share_price',
        'total_amount',
        'payment_status',
        'purchased_at',
        'confirmed_at',
        'confirmed_by',
        'payment_reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'share_month' => 'date',
            'unit_share_price' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'purchased_at' => 'datetime',
            'confirmed_at' => 'datetime',
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

    public function confirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
