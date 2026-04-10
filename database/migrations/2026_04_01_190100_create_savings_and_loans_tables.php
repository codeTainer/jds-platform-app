<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_cycle_id')->constrained('membership_cycles')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('fee_type', 30);
            $table->decimal('amount', 12, 2);
            $table->string('status', 30)->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('share_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_cycle_id')->constrained('membership_cycles')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->date('share_month');
            $table->unsignedInteger('shares_count');
            $table->decimal('unit_share_price', 12, 2);
            $table->decimal('total_amount', 12, 2);
            $table->string('payment_status', 30)->default('pending');
            $table->timestamp('purchased_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['member_id', 'share_month'], 'share_purchases_member_month_unique');
        });

        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_cycle_id')->nullable()->constrained('membership_cycles')->nullOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('guarantor_member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->decimal('requested_amount', 12, 2);
            $table->decimal('approved_amount', 12, 2)->nullable();
            $table->decimal('service_charge_rate', 5, 2)->default(10);
            $table->decimal('service_charge_amount', 12, 2)->nullable();
            $table->decimal('total_due_amount', 12, 2)->nullable();
            $table->decimal('outstanding_amount', 12, 2)->nullable();
            $table->string('status', 30)->default('draft');
            $table->text('purpose')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamp('repaid_at')->nullable();
            $table->date('due_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('loan_guarantor_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->foreignId('guarantor_member_id')->constrained('members')->cascadeOnDelete();
            $table->string('status', 30)->default('pending');
            $table->timestamp('responded_at')->nullable();
            $table->text('response_note')->nullable();
            $table->timestamps();

            $table->unique(['loan_id', 'guarantor_member_id'], 'loan_guarantor_loan_member_unique');
        });

        Schema::create('loan_disbursements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->unique()->constrained('loans')->cascadeOnDelete();
            $table->foreignId('disbursed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method', 50);
            $table->string('status', 30)->default('pending_member_confirmation');
            $table->timestamp('disbursed_at');
            $table->timestamp('member_confirmed_at')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('loan_repayments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount_paid', 12, 2);
            $table->decimal('principal_amount', 12, 2)->nullable();
            $table->decimal('service_charge_amount', 12, 2)->nullable();
            $table->decimal('penalty_amount', 12, 2)->nullable();
            $table->decimal('balance_after_payment', 12, 2)->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->string('status', 30)->default('posted');
            $table->timestamp('paid_at');
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loan_disbursements');
        Schema::dropIfExists('loan_guarantor_approvals');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('share_purchases');
        Schema::dropIfExists('membership_fees');
    }
};
