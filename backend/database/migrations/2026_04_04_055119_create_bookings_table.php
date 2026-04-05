<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::disableForeignKeyConstraints();
    Schema::dropIfExists('bookings');
    Schema::enableForeignKeyConstraints();

    Schema::create('bookings', function (Blueprint $table) {
        $table->id();
        $table->string('booking_ref')->unique();

        $table->unsignedBigInteger('user_id');
        $table->unsignedBigInteger('service_id');
        $table->unsignedBigInteger('slot_id');
        $table->unsignedBigInteger('staff_id')->nullable();

        $table->date('date');
        $table->time('time_slot');
        $table->enum('type', ['salon', 'home'])->default('salon');
        $table->text('address')->nullable();

        $table->enum('status', [
            'pending',
            'confirmed',
            'checked_in',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        ])->default('pending');

        $table->decimal('base_price', 10, 2);
        $table->decimal('home_charge', 10, 2)->default(0);
        $table->decimal('discount', 10, 2)->default(0);
        $table->decimal('total_price', 10, 2);

        $table->string('coupon_code')->nullable();
        $table->text('notes')->nullable();

        $table->timestamp('checked_in_at')->nullable();
        $table->timestamp('completed_at')->nullable();
        $table->timestamp('grace_deadline')->nullable();

        $table->timestamps();
        $table->softDeletes();

        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        $table->foreign('slot_id')->references('id')->on('slots')->onDelete('cascade');
        $table->foreign('staff_id')->references('id')->on('staff')->nullOnDelete();

        $table->index(['user_id', 'status']);
        $table->index(['date', 'status']);
        $table->index('booking_ref');
    });
}
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};