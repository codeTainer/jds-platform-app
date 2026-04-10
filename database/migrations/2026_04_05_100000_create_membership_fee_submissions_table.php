<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_fee_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_cycle_id')->constrained('membership_cycles')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('fee_type', 30);
            $table->decimal('expected_amount', 12, 2);
            $table->string('receipt_path');
            $table->string('receipt_disk')->nullable();
            $table->string('receipt_original_name')->nullable();
            $table->string('receipt_mime_type')->nullable();
            $table->unsignedBigInteger('receipt_size_bytes')->nullable();
            $table->string('status', 30)->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('approved_membership_fee_id')->nullable()->constrained('membership_fees')->nullOnDelete();
            $table->text('member_note')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_fee_submissions');
    }
};
