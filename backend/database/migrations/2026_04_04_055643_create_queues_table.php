<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('position');
            $table->integer('queue_number');
            $table->timestamp('estimated_start_time')->nullable();
            $table->timestamp('estimated_end_time')->nullable();
            $table->enum('status', [
                'waiting',
                'grace_period',
                'serving',
                'completed',
                'skipped'
            ])->default('waiting');
            $table->timestamp('called_at')->nullable();
            $table->timestamp('grace_expires_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queues');
    }
};