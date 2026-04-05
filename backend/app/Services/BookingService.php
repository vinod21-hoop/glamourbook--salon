<?php
// app/Services/BookingService.php

namespace App\Services;

use App\Models\Booking;
use App\Models\Service;
use App\Models\Slot;
use App\Models\Coupon;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BookingService
{
    public function __construct(
        private QueueService $queueService,
        private PaymentService $paymentService,
    ) {}

    /**
     * Create a new booking
     */
    public function createBooking(array $data): Booking
    {
        return DB::transaction(function () use ($data) {
            $service = Service::findOrFail($data['service_id']);
            $slot    = Slot::findOrFail($data['slot_id']);

            // Validate slot is available
            if (!$slot->isAvailable()) {
                throw new \RuntimeException('Selected slot is no longer available');
            }

            // Validate date
            $date = Carbon::parse($data['date']);
            if ($date->lt(today())) {
                throw new \RuntimeException('Cannot book for past dates');
            }

            // Validate no duplicate booking
            $existingBooking = Booking::where('user_id', $data['user_id'])
                ->where('date', $data['date'])
                ->where('slot_id', $data['slot_id'])
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->first();

            if ($existingBooking) {
                throw new \RuntimeException('You already have a booking for this slot');
            }

            // Calculate pricing
            $pricing = $this->calculatePricing(
                $service,
                $data['type'] ?? 'salon',
                $data['coupon_code'] ?? null,
                $data['user_id']
            );

            // Create the booking
            $booking = Booking::create([
                'user_id'     => $data['user_id'],
                'service_id'  => $service->id,
                'slot_id'     => $slot->id,
                'staff_id'    => $slot->staff_id ?? null,
                'date'        => $data['date'],
                'time_slot'   => $slot->start_time,
                'type'        => $data['type'] ?? 'salon',
                'address'     => ($data['type'] ?? 'salon') === 'home'
                    ? $data['address'] ?? null
                    : null,
                'status'      => 'pending',
                'base_price'  => $pricing['base_price'],
                'home_charge' => $pricing['home_charge'],
                'discount'    => $pricing['discount'],
                'total_price' => $pricing['total'],
                'coupon_code' => $data['coupon_code'] ?? null,
                'notes'       => $data['notes'] ?? null,
            ]);

            // Reserve the slot
            $slot->incrementBookings();

            // Apply coupon usage tracking
            if (!empty($data['coupon_code']) && $pricing['discount'] > 0) {
                $coupon = Coupon::where('code', $data['coupon_code'])->first();
                if ($coupon) {
                    $coupon->increment('used_count');
                    DB::table('coupon_user')->insert([
                        'coupon_id'  => $coupon->id,
                        'user_id'    => $data['user_id'],
                        'booking_id' => $booking->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            return $booking->load(['service', 'slot', 'user', 'staff']);
        });
    }

    /**
     * Confirm booking after payment
     */
    public function confirmBooking(Booking $booking): Booking
    {
        return DB::transaction(function () use ($booking) {
            $booking->update(['status' => 'confirmed']);

            // Add to queue automatically
            $this->queueService->addToQueue($booking);

            return $booking->fresh(['queue', 'service', 'slot']);
        });
    }

    /**
     * Cancel a booking
     */
    public function cancelBooking(Booking $booking, string $reason = ''): Booking
    {
        if (!$booking->canCancel()) {
            throw new \RuntimeException('This booking cannot be cancelled');
        }

        return DB::transaction(function () use ($booking, $reason) {
            $booking->update([
                'status' => 'cancelled',
                'notes'  => $booking->notes
                    ? "{$booking->notes}\nCancelled: {$reason}"
                    : "Cancelled: {$reason}",
            ]);

            // Release the slot
            $booking->slot->decrementBookings();

            // Remove from queue
            if ($booking->queue) {
                $booking->queue->delete();
            }

            // Recalculate remaining queue
            $this->queueService->recalculatePositions($booking->date);

            // Refund if already paid
            if ($booking->payment && $booking->payment->isPaid()) {
                $this->paymentService->processRefund($booking->payment);
            }

            return $booking->fresh();
        });
    }

    /**
     * Calculate pricing for a booking
     */
    public function calculatePricing(
        Service $service,
        string $type = 'salon',
        ?string $couponCode = null,
        ?int $userId = null
    ): array {
        $basePrice  = (float) $service->price;
        $homeCharge = 0;
        $discount   = 0;

        // Add home service charge
        if ($type === 'home') {
            $homeCharge = (float) Setting::get('home_service_charge', config('salon.home_service_charge', 500));
        }

        $subtotal = $basePrice + $homeCharge;

        // Apply coupon
        if ($couponCode && $userId) {
            $coupon = Coupon::where('code', $couponCode)->first();

            if ($coupon && $coupon->canUserUse($userId)) {
                $discount = $coupon->calculateDiscount($subtotal);
            }
        }

        $total = max(0, $subtotal - $discount);

        return [
            'base_price'  => $basePrice,
            'home_charge' => $homeCharge,
            'discount'    => $discount,
            'subtotal'    => $subtotal,
            'total'       => round($total, 2),
        ];
    }

    /**
     * Get user's bookings
     */
    public function getUserBookings(int $userId, ?string $status = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Booking::with(['service', 'slot', 'staff', 'queue', 'payment', 'review'])
            ->where('user_id', $userId)
            ->orderByDesc('date')
            ->orderByDesc('time_slot');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get();
    }
}