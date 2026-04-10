<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->date('starts_on');
            $table->date('ends_on');
            $table->timestamp('onboarding_opens_at')->nullable();
            $table->timestamp('onboarding_closes_at')->nullable();
            $table->boolean('accepting_new_applications')->default(false);
            $table->text('onboarding_notes')->nullable();
            $table->decimal('share_price', 12, 2)->default(20000);
            $table->unsignedTinyInteger('min_monthly_shares')->default(1);
            $table->unsignedTinyInteger('max_monthly_shares')->default(10);
            $table->decimal('loan_multiplier', 5, 2)->default(3);
            $table->decimal('loan_service_charge_rate', 5, 2)->default(10);
            $table->unsignedTinyInteger('loan_duration_months')->default(3);
            $table->decimal('overdue_penalty_rate', 5, 2)->default(10);
            $table->unsignedTinyInteger('overdue_penalty_window_months')->default(2);
            $table->decimal('shareout_admin_fee_rate', 5, 2)->default(20);
            $table->decimal('registration_fee_new_member', 12, 2)->default(2500);
            $table->decimal('registration_fee_existing_member', 12, 2)->default(1500);
            $table->unsignedTinyInteger('loan_pause_month')->default(9);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('member_number')->nullable()->unique();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('phone_number', 20);
            $table->date('joined_on')->nullable();
            $table->date('left_on')->nullable();
            $table->string('membership_status', 30)->default('pending');
            $table->boolean('has_online_banking')->default(false);
            $table->boolean('whatsapp_active')->default(true);
            $table->jsonb('biodata')->nullable();
            $table->timestamp('profile_completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('member_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_cycle_id')->constrained('membership_cycles')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('phone_number', 20);
            $table->boolean('has_online_banking')->default(false);
            $table->boolean('whatsapp_active')->default(true);
            $table->jsonb('biodata')->nullable();
            $table->string('status', 30)->default('pending_review');
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_applications');
        Schema::dropIfExists('members');
        Schema::dropIfExists('membership_cycles');
    }
};
