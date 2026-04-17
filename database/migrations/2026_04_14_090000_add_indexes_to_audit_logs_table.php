<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('occurred_at', 'audit_logs_occurred_at_index');
            $table->index('actor_user_id', 'audit_logs_actor_user_id_index');
            $table->index('action', 'audit_logs_action_index');
            $table->index(['auditable_type', 'auditable_id'], 'audit_logs_auditable_index');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('audit_logs_occurred_at_index');
            $table->dropIndex('audit_logs_actor_user_id_index');
            $table->dropIndex('audit_logs_action_index');
            $table->dropIndex('audit_logs_auditable_index');
        });
    }
};
