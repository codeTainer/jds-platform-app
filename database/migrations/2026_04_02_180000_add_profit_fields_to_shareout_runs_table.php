<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shareout_runs', function (Blueprint $table) {
            $table->decimal('total_profit', 14, 2)->nullable()->after('executed_at');
            $table->decimal('admin_fee_amount', 14, 2)->default(0)->after('admin_fee_rate');
            $table->decimal('distributable_profit', 14, 2)->default(0)->after('admin_fee_amount');
        });
    }

    public function down(): void
    {
        Schema::table('shareout_runs', function (Blueprint $table) {
            $table->dropColumn(['total_profit', 'admin_fee_amount', 'distributable_profit']);
        });
    }
};
