<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanRepayment extends Model
{
    protected $fillable = [
        'loan_id',
        'member_id',
        'received_by',
        'amount_paid',
        'principal_amount',
        'service_charge_amount',
        'penalty_amount',
        'balance_after_payment',
        'payment_method',
        'status',
        'paid_at',
        'payment_reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'principal_amount' => 'decimal:2',
            'service_charge_amount' => 'decimal:2',
            'penalty_amount' => 'decimal:2',
            'balance_after_payment' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
