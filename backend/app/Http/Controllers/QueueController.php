<?php
// app/Http/Controllers/QueueController.php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;

class QueueController extends Controller
{
    public function __construct(
        private QueueService $queueService
    ) {}

    /**
     * Get today's live queue
     */
    public function todayQueue(): JsonResponse
    {
        $queueData = $this->queueService->getTodayQueue();

        return response()->json([
            'success' => true,
            'data'    => $queueData,
        ]);
    }

    /**
     * Get queue status for user's booking
     */
    public function myQueueStatus(int $bookingId): JsonResponse
    {
        $booking = Booking::where('user_id', auth()->id())->findOrFail($bookingId);

        $position = $this->queueService->getPositionForBooking($booking);

        if (!$position) {
            return response()->json([
                'success' => false,
                'message' => 'No queue entry found for this booking',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $position,
        ]);
    }
}