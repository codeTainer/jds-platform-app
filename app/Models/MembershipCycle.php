<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MembershipCycle extends Model
{
    protected $fillable = [
        'name',
        'code',
        'starts_on',
        'ends_on',
        'onboarding_opens_at',
        'onboarding_closes_at',
        'accepting_new_applications',
        'onboarding_notes',
        'share_price',
        'min_monthly_shares',
        'max_monthly_shares',
        'loan_multiplier',
        'loan_service_charge_rate',
        'loan_duration_months',
        'overdue_penalty_rate',
        'overdue_penalty_window_months',
        'shareout_admin_fee_rate',
        'registration_fee_new_member',
        'registration_fee_existing_member',
        'loan_pause_month',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'onboarding_opens_at' => 'datetime',
            'onboarding_closes_at' => 'datetime',
            'accepting_new_applications' => 'boolean',
            'share_price' => 'decimal:2',
            'loan_multiplier' => 'decimal:2',
            'loan_service_charge_rate' => 'decimal:2',
            'overdue_penalty_rate' => 'decimal:2',
            'shareout_admin_fee_rate' => 'decimal:2',
            'registration_fee_new_member' => 'decimal:2',
            'registration_fee_existing_member' => 'decimal:2',
            'is_active' => 'boolean',
        ];
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

    public function memberApplications(): HasMany
    {
        return $this->hasMany(MemberApplication::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function shareoutRun(): HasOne
    {
        return $this->hasOne(ShareoutRun::class);
    }
}
