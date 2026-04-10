<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('share_payment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_cycle_id')->constrained('membership_cycles')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->date('share_month');
            $table->unsignedInteger('shares_count');
            $table->decimal('unit_share_price', 12, 2);
            $table->decimal('expected_amount', 12, 2);
            $table->string('receipt_path');
            $table->string('status', 30)->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('approved_share_purchase_id')->nullable()->constrained('share_purchases')->nullOnDelete();
            $table->text('member_note')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->index(['membership_cycle_id', 'status'], 'share_payment_submissions_cycle_status_index');
            $table->index(['member_id', 'share_month'], 'share_payment_submissions_member_month_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('share_payment_submissions');
    }
};
