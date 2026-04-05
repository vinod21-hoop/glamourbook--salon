<?php
// app/Http/Controllers/Admin/BookingController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\QueueService;
use App\Services\BookingService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        private QueueService $queueService,
        private BookingService $bookingService,
        private PaymentService $paymentService,
    ) {}

    /**
     * List all bookings with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with([
            'user:id,name,phone',
            'service:id,name',
            'staff:id,name',
            'payment',
            'queue',
        ])
            ->orderByDesc('date')
            ->orderByDesc('time_slot');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_ref', 'ILIKE', "%{$search}%")
                  ->orWhereHas('user', fn($uq) =>
                      $uq->where('name', 'ILIKE', "%{$search}%")
                         ->orWhere('phone', 'ILIKE', "%{$search}%")
                  );
            });
        }

        $bookings = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data'    => $bookings,
        ]);
    }

    /**
     * Get single booking detail
     */
    public function show(int $id): JsonResponse
    {
        $booking = Booking::with([
            'user', 'service', 'slot', 'staff',
            'payment', 'queue', 'review',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $booking,
        ]);
    }

    /**
     * Update booking status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:confirmed,checked_in,in_progress,completed,cancelled,no_show',
        ]);

        $booking = Booking::with(['queue', 'slot', 'payment'])->findOrFail($id);
        $newStatus = $request->status;

        try {
            switch ($newStatus) {
                case 'confirmed':
                    $this->bookingService->confirmBooking($booking);
                    break;

                case 'checked_in':
                    $this->queueService->checkIn($booking);
                    break;

                case 'in_progress':
                    if ($booking->queue) {
                        $booking->queue->update(['status' => 'serving']);
                    }
                    $booking->update(['status' => 'in_progress']);
                    break;

                case 'completed':
                    $this->queueService->completeService($booking);
                    break;

                case 'cancelled':
                    $this->bookingService->cancelBooking($booking, 'Cancelled by admin');
                    break;

                case 'no_show':
                    if ($booking->queue) {
                        $this->queueService->handleNoShow($booking->queue->id);
                    } else {
                        $booking->update(['status' => 'no_show']);
                    }
                    break;
            }

            return response()->json([
                'success' => true,
                'message' => "Booking status updated to {$newStatus}",
                'data'    => $booking->fresh(['queue', 'payment']),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Handle late arrival — reschedule
     */
    public function handleLateArrival(int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        try {
            $newBooking = $this->queueService->handleLateArrival($booking);

            if (!$newBooking) {
                return response()->json([
                    'success' => false,
                    'message' => 'No available slots for rescheduling',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Booking rescheduled successfully',
                'data'    => [
                    'old_booking' => $booking->fresh(),
                    'new_booking' => $newBooking->load(['queue', 'slot']),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Accept cash payment
     */
    public function acceptCashPayment(int $id): JsonResponse
    {
        $booking = Booking::where('status', 'pending')->findOrFail($id);

        $payment = $this->paymentService->createCashPayment($booking);
        $this->bookingService->confirmBooking($booking);

        return response()->json([
            'success' => true,
            'message' => 'Cash payment accepted. Booking confirmed.',
            'data'    => $booking->fresh(['payment', 'queue']),
        ]);
    }

    /**
     * Get today's bookings summary
     */
    public function todaySummary(): JsonResponse
    {
        $today = Booking::with(['user:id,name', 'service:id,name,duration', 'staff:id,name', 'queue'])
            ->today()
            ->orderBy('time_slot')
            ->get();

        $summary = [
            'total'       => $today->count(),
            'pending'     => $today->where('status', 'pending')->count(),
            'confirmed'   => $today->where('status', 'confirmed')->count(),
            'checked_in'  => $today->where('status', 'checked_in')->count(),
            'in_progress' => $today->where('status', 'in_progress')->count(),
            'completed'   => $today->where('status', 'completed')->count(),
            'cancelled'   => $today->where('status', 'cancelled')->count(),
            'no_show'     => $today->where('status', 'no_show')->count(),
            'bookings'    => $today->map(fn($b) => [
                'id'           => $b->id,
                'booking_ref'  => $b->booking_ref,
                'customer'     => $b->user->name,
                'service'      => $b->service->name,
                'time'         => \Carbon\Carbon::parse($b->time_slot)->format('h:i A'),
                'type'         => $b->type,
                'status'       => $b->status,
                'queue_number' => $b->queue?->queue_number,
                'staff'        => $b->staff?->name,
            ]),
        ];

        return response()->json([
            'success' => true,
            'data'    => $summary,
        ]);
    }
}