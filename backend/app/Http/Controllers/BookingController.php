<?php
// app/Http/Controllers/BookingController.php

namespace App\Http\Controllers;

use App\Http\Requests\BookingRequest;
use App\Models\Booking;
use App\Services\BookingService;
use App\Services\SlotService;
use App\Services\QueueService;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        private BookingService $bookingService,
        private SlotService $slotService,
        private QueueService $queueService,
    ) {}

    /**
     * Get available dates
     */
    public function availableDates(): JsonResponse
    {
        $dates = $this->slotService->getAvailableDates();

        return response()->json([
            'success' => true,
            'data'    => $dates,
        ]);
    }

    /**
     * Get available slots for a date
     */
    public function availableSlots(Request $request): JsonResponse
    {
        $request->validate([
            'date'     => 'required|date|after_or_equal:today',
            'staff_id' => 'nullable|exists:staff,id',
        ]);

        $slots = $this->slotService->getAvailableSlots(
            $request->date,
            $request->staff_id
        );

        return response()->json([
            'success' => true,
            'data'    => $slots,
        ]);
    }

    /**
     * Calculate price before booking
     */
    public function calculatePrice(Request $request): JsonResponse
    {
        $request->validate([
            'service_id'  => 'required|exists:services,id',
            'type'        => 'required|in:salon,home',
            'coupon_code' => 'nullable|string',
        ]);

        $service = Service::findOrFail($request->service_id);

        $pricing = $this->bookingService->calculatePricing(
            $service,
            $request->type,
            $request->coupon_code,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'data'    => $pricing,
        ]);
    }

    /**
     * Create a new booking
     */
    public function store(BookingRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $data['user_id'] = auth()->id();

            $booking = $this->bookingService->createBooking($data);

            return response()->json([
                'success' => true,
                'message' => 'Booking created successfully',
                'data'    => $booking,
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get user's bookings
     */
    public function myBookings(Request $request): JsonResponse
    {
        $bookings = $this->bookingService->getUserBookings(
            auth()->id(),
            $request->status
        );

        $mapped = $bookings->map(fn($b) => [
            'id'              => $b->id,
            'booking_ref'     => $b->booking_ref,
            'service_name'    => $b->service->name,
            'date'            => $b->date->format('M d, Y'),
            'time_slot'       => \Carbon\Carbon::parse($b->time_slot)->format('h:i A'),
            'type'            => $b->type,
            'status'          => $b->status,
            'total_price'     => '₹' . number_format($b->total_price, 0),
            'staff_name'      => $b->staff?->name,
            'queue_position'  => $b->queue
                ? $this->queueService->getPositionForBooking($b)
                : null,
            'can_cancel'      => $b->canCancel(),
            'can_check_in'    => $b->canCheckIn(),
            'has_review'      => $b->review !== null,
            'payment_status'  => $b->payment?->status,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $mapped,
        ]);
    }

    /**
     * Get single booking details
     */
    public function show(int $id): JsonResponse
    {
        $booking = Booking::with(['service', 'slot', 'staff', 'queue', 'payment', 'review'])
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $booking->id,
                'booking_ref'    => $booking->booking_ref,
                'service'        => [
                    'name'     => $booking->service->name,
                    'duration' => $booking->service->formatted_duration,
                    'price'    => $booking->service->formatted_price,
                ],
                'date'           => $booking->date->format('l, M d, Y'),
                'time_slot'      => \Carbon\Carbon::parse($booking->time_slot)->format('h:i A'),
                'type'           => $booking->type,
                'address'        => $booking->address,
                'status'         => $booking->status,
                'base_price'     => $booking->base_price,
                'home_charge'    => $booking->home_charge,
                'discount'       => $booking->discount,
                'total_price'    => $booking->total_price,
                'staff_name'     => $booking->staff?->name,
                'queue_info'     => $booking->queue
                    ? $this->queueService->getPositionForBooking($booking)
                    : null,
                'payment'        => $booking->payment ? [
                    'status' => $booking->payment->status,
                    'method' => $booking->payment->method,
                    'amount' => $booking->payment->amount,
                ] : null,
                'can_cancel'     => $booking->canCancel(),
                'can_check_in'   => $booking->canCheckIn(),
            ],
        ]);
    }

    /**
     * Cancel booking
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = Booking::where('user_id', auth()->id())->findOrFail($id);

        try {
            $booking = $this->bookingService->cancelBooking(
                $booking,
                $request->reason ?? 'User cancelled'
            );

            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully',
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}