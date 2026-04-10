<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShareoutItem extends Model
{
    protected $fillable = [
        'shareout_run_id',
        'member_id',
        'total_shares',
        'total_saved',
        'gross_return',
        'outstanding_loan_deduction',
        'admin_fee_deduction',
        'net_payout',
        'status',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'total_saved' => 'decimal:2',
            'gross_return' => 'decimal:2',
            'outstanding_loan_deduction' => 'decimal:2',
            'admin_fee_deduction' => 'decimal:2',
            'net_payout' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(ShareoutRun::class, 'shareout_run_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
