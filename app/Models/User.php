<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'member_id',
        'role',
        'must_change_password',
        'temporary_password_sent_at',
        'password_changed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'temporary_password_sent_at' => 'datetime',
            'password_changed_at' => 'datetime',
        ];
    }

    public const ROLE_CHAIRPERSON = 'chairperson';
    public const ROLE_SECRETARY = 'secretary';
    public const ROLE_TREASURER = 'treasurer';
    public const ROLE_MEMBER = 'member';
    public const ROLE_SUPPORT = 'support';

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function confirmedSharePurchases(): HasMany
    {
        return $this->hasMany(SharePurchase::class, 'confirmed_by');
    }

    public function reviewedSharePaymentSubmissions(): HasMany
    {
        return $this->hasMany(SharePaymentSubmission::class, 'reviewed_by');
    }

    public function reviewedMembershipFeeSubmissions(): HasMany
    {
        return $this->hasMany(MembershipFeeSubmission::class, 'reviewed_by');
    }

    public function disbursements(): HasMany
    {
        return $this->hasMany(LoanDisbursement::class, 'disbursed_by');
    }

    public function receivedRepayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class, 'received_by');
    }

    public function resolvedConcerns(): HasMany
    {
        return $this->hasMany(Concern::class, 'resolved_by');
    }

    public function processedExitRequests(): HasMany
    {
        return $this->hasMany(MemberExitRequest::class, 'processed_by');
    }

    public function approvedShareoutRuns(): HasMany
    {
        return $this->hasMany(ShareoutRun::class, 'approved_by');
    }

    public function reviewedMemberApplications(): HasMany
    {
        return $this->hasMany(MemberApplication::class, 'reviewed_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }

    public function accessTokens(): HasMany
    {
        return $this->hasMany(UserAccessToken::class);
    }

    public function isChairperson(): bool
    {
        return $this->role === self::ROLE_CHAIRPERSON;
    }

    public function isSecretary(): bool
    {
        return $this->role === self::ROLE_SECRETARY;
    }

    public function isTreasurer(): bool
    {
        return $this->role === self::ROLE_TREASURER;
    }

    public function isMember(): bool
    {
        return $this->role === self::ROLE_MEMBER;
    }

    public function isSupport(): bool
    {
        return $this->role === self::ROLE_SUPPORT;
    }

    public function canCalculateShareout(): bool
    {
        return in_array($this->role, [self::ROLE_SECRETARY, self::ROLE_TREASURER], true);
    }

    public function canApproveShareout(): bool
    {
        return $this->isChairperson();
    }

    public function canExecuteShareout(): bool
    {
        return $this->isTreasurer();
    }

    public function canManageConcerns(): bool
    {
        return in_array($this->role, [
            self::ROLE_CHAIRPERSON,
            self::ROLE_SECRETARY,
            self::ROLE_TREASURER,
            self::ROLE_SUPPORT,
        ], true);
    }
}
