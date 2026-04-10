<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShareoutRun extends Model
{
    protected $fillable = [
        'membership_cycle_id',
        'scheduled_start_on',
        'scheduled_end_on',
        'executed_at',
        'total_profit',
        'admin_fee_rate',
        'admin_fee_amount',
        'distributable_profit',
        'status',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_start_on' => 'date',
            'scheduled_end_on' => 'date',
            'executed_at' => 'datetime',
            'total_profit' => 'decimal:2',
            'admin_fee_rate' => 'decimal:2',
            'admin_fee_amount' => 'decimal:2',
            'distributable_profit' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(MembershipCycle::class, 'membership_cycle_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ShareoutItem::class);
    }
}
