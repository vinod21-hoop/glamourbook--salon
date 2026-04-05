<?php
// app/Http/Controllers/Admin/QueueController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    public function __construct(
        private QueueService $queueService
    ) {}

    /**
     * Get today's full queue
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->queueService->getTodayQueue(),
        ]);
    }

    /**
     * Call next in queue
     */
    public function callNext(): JsonResponse
    {
        $next = $this->queueService->callNext();

        if (!$next) {
            return response()->json([
                'success' => false,
                'message' => 'No one is waiting in the queue',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => "Called Queue #{$next->queue_number}",
            'data'    => $next->load('booking.user'),
        ]);
    }

    /**
     * Check in customer
     */
    public function checkIn(int $bookingId): JsonResponse
    {
        $booking = Booking::findOrFail($bookingId);

        try {
            $queue = $this->queueService->checkIn($booking);

            return response()->json([
                'success' => true,
                'message' => 'Customer checked in successfully',
                'data'    => $queue,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mark service complete
     */
    public function complete(int $bookingId): JsonResponse
    {
        $booking = Booking::findOrFail($bookingId);

        $this->queueService->completeService($booking);

        return response()->json([
            'success' => true,
            'message' => 'Service completed. Next person called.',
        ]);
    }

    /**
     * Force no-show
     */
    public function markNoShow(int $bookingId): JsonResponse
    {
        $booking = Booking::with('queue')->findOrFail($bookingId);

        if (!$booking->queue) {
            return response()->json([
                'success' => false,
                'message' => 'Booking has no queue entry',
            ], 422);
        }

        $this->queueService->handleNoShow($booking->queue->id);

        return response()->json([
            'success' => true,
            'message' => 'Marked as no-show. Next person promoted.',
        ]);
    }
}