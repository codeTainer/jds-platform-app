<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_exit_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->date('notice_given_on');
            $table->date('requested_exit_on');
            $table->string('status', 30)->default('pending');
            $table->decimal('outstanding_loan_deduction', 12, 2)->default(0);
            $table->decimal('savings_refund_amount', 12, 2)->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('concerns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('concernable_type')->nullable();
            $table->unsignedBigInteger('concernable_id')->nullable();
            $table->string('subject');
            $table->text('message');
            $table->string('status', 30)->default('open');
            $table->timestamp('raised_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_note')->nullable();
            $table->timestamps();
        });

        Schema::create('shareout_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_cycle_id')->constrained('membership_cycles')->cascadeOnDelete();
            $table->date('scheduled_start_on')->nullable();
            $table->date('scheduled_end_on')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->decimal('roi_rate', 5, 2)->nullable();
            $table->decimal('admin_fee_rate', 5, 2)->default(20);
            $table->string('status', 30)->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('membership_cycle_id');
        });

        Schema::create('shareout_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shareout_run_id')->constrained('shareout_runs')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->unsignedInteger('total_shares');
            $table->decimal('total_saved', 12, 2);
            $table->decimal('gross_return', 12, 2);
            $table->decimal('outstanding_loan_deduction', 12, 2)->default(0);
            $table->decimal('admin_fee_deduction', 12, 2)->default(0);
            $table->decimal('net_payout', 12, 2);
            $table->string('status', 30)->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['shareout_run_id', 'member_id'], 'shareout_items_run_member_unique');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('auditable_type')->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->text('description')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->jsonb('value')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('shareout_items');
        Schema::dropIfExists('shareout_runs');
        Schema::dropIfExists('concerns');
        Schema::dropIfExists('member_exit_requests');
    }
};
