<?php
// app/Services/PaymentService.php

namespace App\Services;

use App\Models\Payment;
use App\Models\Booking;
use Razorpay\Api\Api;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    private Api $razorpay;

    public function __construct()
    {
        $this->razorpay = new Api(
            config('services.razorpay.key', env('RAZORPAY_KEY')),
            config('services.razorpay.secret', env('RAZORPAY_SECRET'))
        );
    }

    /**
     * Create Razorpay order
     */
    public function createOrder(Booking $booking): array
    {
        try {
            $order = $this->razorpay->order->create([
                'amount'   => (int) ($booking->total_price * 100), // Amount in paise
                'currency' => 'INR',
                'receipt'  => $booking->booking_ref,
                'notes'    => [
                    'booking_id'  => $booking->id,
                    'booking_ref' => $booking->booking_ref,
                    'service'     => $booking->service->name,
                ],
            ]);

            // Save payment record
            $payment = Payment::create([
                'booking_id'        => $booking->id,
                'user_id'           => $booking->user_id,
                'razorpay_order_id' => $order->id,
                'amount'            => $booking->total_price,
                'currency'          => 'INR',
                'status'            => 'pending',
                'method'            => 'razorpay',
            ]);

            return [
                'order_id'    => $order->id,
                'amount'      => $order->amount,
                'currency'    => $order->currency,
                'key'         => env('RAZORPAY_KEY'),
                'booking_ref' => $booking->booking_ref,
                'payment_id'  => $payment->id,
            ];
        } catch (\Exception $e) {
            Log::error("Razorpay order creation failed: " . $e->getMessage());
            throw new \RuntimeException('Payment initialization failed');
        }
    }

    /**
     * Verify and capture Razorpay payment
     */
    public function verifyPayment(array $data): Payment
    {
        $payment = Payment::where('razorpay_order_id', $data['razorpay_order_id'])->firstOrFail();

        try {
            // Verify signature
            $attributes = [
                'razorpay_order_id'   => $data['razorpay_order_id'],
                'razorpay_payment_id' => $data['razorpay_payment_id'],
                'razorpay_signature'  => $data['razorpay_signature'],
            ];

            $this->razorpay->utility->verifyPaymentSignature($attributes);

            // Update payment record
            $payment->update([
                'razorpay_payment_id' => $data['razorpay_payment_id'],
                'razorpay_signature'  => $data['razorpay_signature'],
                'status'              => 'captured',
            ]);

            Log::info("Payment captured: {$payment->razorpay_payment_id}");

            return $payment;
        } catch (\Exception $e) {
            $payment->update(['status' => 'failed']);
            Log::error("Payment verification failed: " . $e->getMessage());
            throw new \RuntimeException('Payment verification failed');
        }
    }

    /**
     * Process refund
     */
    public function processRefund(Payment $payment, ?float $amount = null): Payment
    {
        if (!$payment->isPaid()) {
            throw new \RuntimeException('Cannot refund unpaid payment');
        }

        $refundAmount = $amount ?? $payment->amount;

        try {
            $refund = $this->razorpay->payment
                ->fetch($payment->razorpay_payment_id)
                ->refund([
                    'amount' => (int) ($refundAmount * 100),
                ]);

            $payment->update([
                'status'        => 'refunded',
                'refund_amount' => $refundAmount,
                'metadata'      => array_merge(
                    $payment->metadata ?? [],
                    ['refund_id' => $refund->id]
                ),
            ]);

            Log::info("Refund processed: ₹{$refundAmount} for {$payment->razorpay_payment_id}");

            return $payment;
        } catch (\Exception $e) {
            Log::error("Refund failed: " . $e->getMessage());
            throw new \RuntimeException('Refund processing failed');
        }
    }

    /**
     * Create cash payment (pending — will be marked captured when cash is collected)
     */
    public function createCashPayment(Booking $booking): Payment
    {
        // Check if payment already exists
        $existing = Payment::where('booking_id', $booking->id)->first();

        if ($existing) {
            $existing->update([
                'method' => 'cash',
                'status' => 'pending',
            ]);
            return $existing;
        }

        return Payment::create([
            'booking_id' => $booking->id,
            'user_id'    => $booking->user_id,
            'amount'     => $booking->total_price,
            'currency'   => 'INR',
            'status'     => 'pending',
            'method'     => 'cash',
        ]);
    }
}
