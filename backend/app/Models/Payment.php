<?php
// app/Models/Payment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id', 'user_id', 'razorpay_order_id',
        'razorpay_payment_id', 'razorpay_signature',
        'amount', 'currency', 'status', 'method',
        'refund_amount', 'metadata',
    ];

    protected $casts = [
        'amount'        => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'metadata'      => 'array',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'captured';
    }
}