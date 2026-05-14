<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('archive_documents', function (Blueprint $table) {
            $table->boolean('is_checked_out')->default(false)->after('is_confidential');
            $table->string('checked_out_to')->nullable()->after('is_checked_out');
            $table->foreignId('checked_out_by')->nullable()->constrained('users')->nullOnDelete()->after('checked_out_to');
            $table->dateTime('checked_out_at')->nullable()->after('checked_out_by');
            $table->text('checked_out_notes')->nullable()->after('checked_out_at');
        });
    }

    public function down(): void
    {
        Schema::table('archive_documents', function (Blueprint $table) {
            $table->dropForeign(['checked_out_by']);
            $table->dropColumn(['is_checked_out', 'checked_out_to', 'checked_out_by', 'checked_out_at', 'checked_out_notes']);
        });
    }
};

