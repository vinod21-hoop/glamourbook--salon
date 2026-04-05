<?php
// app/Jobs/SendBookingReminder.php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBookingReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(NotificationService $notificationService): void
    {
        // Find bookings for tomorrow
        $bookings = Booking::with('service')
            ->whereDate('date', tomorrow())
            ->whereIn('status', ['confirmed'])
            ->get();

        foreach ($bookings as $booking) {
            $notificationService->sendNotification(
                $booking->user_id,
                'booking_reminder',
                'Booking Tomorrow!',
                "Reminder: You have a booking for {$booking->service->name} tomorrow at {$booking->time_slot}.",
                ['booking_id' => $booking->id]
            );
        }
    }
}