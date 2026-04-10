<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_disbursements', function (Blueprint $table) {
            $table->string('receipt_path')->nullable()->after('member_confirmed_at');
            $table->string('receipt_disk', 40)->nullable()->after('receipt_path');
            $table->string('receipt_original_name')->nullable()->after('receipt_disk');
            $table->string('receipt_mime_type', 120)->nullable()->after('receipt_original_name');
            $table->unsignedBigInteger('receipt_size_bytes')->nullable()->after('receipt_mime_type');
        });
    }

    public function down(): void
    {
        Schema::table('loan_disbursements', function (Blueprint $table) {
            $table->dropColumn([
                'receipt_path',
                'receipt_disk',
                'receipt_original_name',
                'receipt_mime_type',
                'receipt_size_bytes',
            ]);
        });
    }
};
