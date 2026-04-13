<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\NotificationLog;
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
     * Create Razorpay payment order
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
     * Verify Razorpay payment
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
            $booking = $this->bookingService->confirmBooking($payment->booking);

            // Notify customer
            NotificationLog::create([
                'user_id' => $booking->user_id,
                'type'    => 'payment_success',
                'title'   => 'Payment Successful! ✅',
                'message' => "Your online payment of ₹{$booking->total_price} for {$booking->service->name} is confirmed.",
                'data'    => json_encode(['booking_id' => $booking->id]),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment successful! Booking confirmed.',
                'data'    => [
                    'booking' => $booking->load('queue'),
                    'payment' => $payment,
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
     * Customer chooses "Pay at Salon / Pay to Staff" (Cash)
     */
    public function chooseCashPayment(int $bookingId): JsonResponse
    {
        $booking = Booking::where('user_id', auth()->id())
            ->where('status', 'pending')
            ->with('service')
            ->findOrFail($bookingId);

        try {
            // Create pending cash payment record
            $payment = $this->paymentService->createCashPayment($booking);

            // Confirm booking & add to queue
            $this->bookingService->confirmBooking($booking);

            // Notify customer
            NotificationLog::create([
                'user_id' => $booking->user_id,
                'type'    => 'booking_confirmed_cash',
                'title'   => 'Booking Confirmed! 💰',
                'message' => $booking->type === 'home'
                    ? "Your booking for {$booking->service->name} is confirmed! Please pay ₹{$booking->total_price} cash to the stylist."
                    : "Your booking for {$booking->service->name} is confirmed! Please pay ₹{$booking->total_price} at the salon.",
                'data'    => json_encode([
                    'booking_id' => $booking->id,
                    'amount'     => $booking->total_price,
                    'method'     => 'cash',
                ]),
            ]);

            return response()->json([
                'success' => true,
                'message' => $booking->type === 'home'
                    ? 'Booking confirmed! Pay cash to the stylist.'
                    : 'Booking confirmed! Pay at the salon.',
                'data'    => [
                    'booking' => $booking->fresh()->load('queue'),
                    'payment' => $payment,
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}