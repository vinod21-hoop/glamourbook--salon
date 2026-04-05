<?php
// app/Http/Controllers/PaymentController.php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\PaymentService;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private BookingService $bookingService,
    ) {}

    /**
     * Create payment order (Razorpay)
     */
    public function createOrder(int $bookingId): JsonResponse
    {
        $booking = Booking::where('user_id', auth()->id())
            ->where('status', 'pending')
            ->findOrFail($bookingId);

        try {
            $orderData = $this->paymentService->createOrder($booking);

            return response()->json([
                'success' => true,
                'data'    => $orderData,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify payment after Razorpay callback
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'razorpay_order_id'   => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature'  => 'required|string',
        ]);

        try {
            $payment = $this->paymentService->verifyPayment($request->all());

            // Auto-confirm booking
            $booking = $this->bookingService->confirmBooking($payment->booking);

            return response()->json([
                'success' => true,
                'message' => 'Payment successful! Booking confirmed.',
                'data'    => [
                    'booking'  => $booking->load('queue'),
                    'payment'  => $payment,
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}