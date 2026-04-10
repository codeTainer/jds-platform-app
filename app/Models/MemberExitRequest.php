<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberExitRequest extends Model
{
    protected $fillable = [
        'member_id',
        'notice_given_on',
        'requested_exit_on',
        'status',
        'outstanding_loan_deduction',
        'savings_refund_amount',
        'processed_by',
        'processed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'notice_given_on' => 'date',
            'requested_exit_on' => 'date',
            'outstanding_loan_deduction' => 'decimal:2',
            'savings_refund_amount' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
