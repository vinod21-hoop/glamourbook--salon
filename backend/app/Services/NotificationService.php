<?php
// app/Services/NotificationService.php

namespace App\Services;

use App\Models\NotificationLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send in-app notification
     */
    public function sendNotification(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): NotificationLog {
        return NotificationLog::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'channel' => 'app',
            'data'    => $data,
        ]);
    }

    /**
     * Send booking confirmation notification
     */
    public function bookingConfirmed(\App\Models\Booking $booking): void
    {
        $this->sendNotification(
            $booking->user_id,
            'booking_confirmed',
            'Booking Confirmed!',
            "Your booking {$booking->booking_ref} for {$booking->service->name} on {$booking->date->format('M d, Y')} at {$booking->slot->formatted_time} has been confirmed.",
            ['booking_id' => $booking->id]
        );
    }

    /**
     * Send queue update notification
     */
    public function queueUpdate(\App\Models\Booking $booking, string $message): void
    {
        $this->sendNotification(
            $booking->user_id,
            'queue_update',
            'Queue Update',
            $message,
            ['booking_id' => $booking->id]
        );
    }

    /**
     * Get user's unread notifications
     */
    public function getUnread(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return NotificationLog::where('user_id', $userId)
            ->unread()
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId): void
    {
        NotificationLog::where('id', $notificationId)
            ->update(['is_read' => true]);
    }

    /**
     * Mark all as read
     */
    public function markAllAsRead(int $userId): void
    {
        NotificationLog::where('user_id', $userId)
            ->unread()
            ->update(['is_read' => true]);
    }
}