<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Member extends Model
{
    protected $fillable = [
        'member_number',
        'full_name',
        'email',
        'phone_number',
        'joined_on',
        'left_on',
        'membership_status',
        'has_online_banking',
        'whatsapp_active',
        'biodata',
        'profile_completed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'joined_on' => 'date',
            'left_on' => 'date',
            'has_online_banking' => 'boolean',
            'whatsapp_active' => 'boolean',
            'biodata' => 'array',
            'profile_completed_at' => 'datetime',
        ];
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function membershipFees(): HasMany
    {
        return $this->hasMany(MembershipFee::class);
    }

    public function membershipFeeSubmissions(): HasMany
    {
        return $this->hasMany(MembershipFeeSubmission::class);
    }

    public function sharePurchases(): HasMany
    {
        return $this->hasMany(SharePurchase::class);
    }

    public function sharePaymentSubmissions(): HasMany
    {
        return $this->hasMany(SharePaymentSubmission::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function guaranteedLoans(): HasMany
    {
        return $this->hasMany(Loan::class, 'guarantor_member_id');
    }

    public function loanRepayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class);
    }

    public function loanRepaymentSubmissions(): HasMany
    {
        return $this->hasMany(LoanRepaymentSubmission::class);
    }

    public function exitRequests(): HasMany
    {
        return $this->hasMany(MemberExitRequest::class);
    }

    public function concerns(): HasMany
    {
        return $this->hasMany(Concern::class);
    }

    public function approvedApplications(): HasMany
    {
        return $this->hasMany(MemberApplication::class, 'approved_member_id');
    }

    public function shareoutItems(): HasMany
    {
        return $this->hasMany(ShareoutItem::class);
    }
}
