<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class LoanDisbursement extends Model
{
    protected $fillable = [
        'loan_id',
        'disbursed_by',
        'amount',
        'payment_method',
        'status',
        'disbursed_at',
        'member_confirmed_at',
        'receipt_path',
        'receipt_disk',
        'receipt_original_name',
        'receipt_mime_type',
        'receipt_size_bytes',
        'payment_reference',
        'notes',
    ];

    protected $appends = [
        'receipt_url',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'disbursed_at' => 'datetime',
            'member_confirmed_at' => 'datetime',
            'receipt_size_bytes' => 'integer',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function disbursedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }

    public function getReceiptUrlAttribute(): ?string
    {
        if (! $this->receipt_path) {
            return null;
        }

        $disk = $this->receipt_disk ?: config('jds.receipt_disk', 'public');

        if ($disk === 'public') {
            return '/storage/' . ltrim($this->receipt_path, '/');
        }

        return Storage::disk($disk)->url($this->receipt_path);
    }
}
