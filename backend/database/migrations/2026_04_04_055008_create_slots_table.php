<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('slots', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->foreignId('staff_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('max_bookings')->default(1);
            $table->integer('current_bookings')->default(0);
            $table->enum('status', ['available', 'full', 'blocked'])->default('available');
            $table->timestamps();

            $table->unique(['date', 'start_time', 'staff_id']);
            $table->index(['date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('slots');
    }
};