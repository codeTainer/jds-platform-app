<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Loan extends Model
{
    protected $fillable = [
        'membership_cycle_id',
        'member_id',
        'guarantor_member_id',
        'requested_amount',
        'approved_amount',
        'service_charge_rate',
        'service_charge_amount',
        'total_due_amount',
        'outstanding_amount',
        'status',
        'purpose',
        'requested_at',
        'approved_at',
        'disbursed_at',
        'repaid_at',
        'due_on',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'requested_amount' => 'decimal:2',
            'approved_amount' => 'decimal:2',
            'service_charge_rate' => 'decimal:2',
            'service_charge_amount' => 'decimal:2',
            'total_due_amount' => 'decimal:2',
            'outstanding_amount' => 'decimal:2',
            'requested_at' => 'datetime',
            'approved_at' => 'datetime',
            'disbursed_at' => 'datetime',
            'repaid_at' => 'datetime',
            'due_on' => 'date',
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

    public function guarantor(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'guarantor_member_id');
    }

    public function guarantorApprovals(): HasMany
    {
        return $this->hasMany(LoanGuarantorApproval::class);
    }

    public function disbursement(): HasOne
    {
        return $this->hasOne(LoanDisbursement::class);
    }

    public function repayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class);
    }

    public function repaymentSubmissions(): HasMany
    {
        return $this->hasMany(LoanRepaymentSubmission::class);
    }
}
