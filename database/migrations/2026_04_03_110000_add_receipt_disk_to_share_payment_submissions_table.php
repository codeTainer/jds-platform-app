<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('share_payment_submissions', function (Blueprint $table) {
            $table->string('receipt_disk', 50)->nullable()->after('receipt_path');
        });

        DB::table('share_payment_submissions')
            ->whereNull('receipt_disk')
            ->update(['receipt_disk' => config('jds.receipt_disk', 'public')]);
    }

    public function down(): void
    {
        Schema::table('share_payment_submissions', function (Blueprint $table) {
            $table->dropColumn('receipt_disk');
        });
    }
};
