<?php
// app/Models/Booking.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'booking_ref', 'user_id', 'service_id', 'slot_id',
        'staff_id', 'date', 'time_slot', 'type', 'address',
        'status', 'base_price', 'home_charge', 'discount',
        'total_price', 'coupon_code', 'notes',
        'checked_in_at', 'completed_at', 'grace_deadline',
    ];

    protected $casts = [
        'date'           => 'date',
        'base_price'     => 'decimal:2',
        'home_charge'    => 'decimal:2',
        'discount'       => 'decimal:2',
        'total_price'    => 'decimal:2',
        'checked_in_at'  => 'datetime',
        'completed_at'   => 'datetime',
        'grace_deadline' => 'datetime',
    ];

    // ── Auto-generate booking reference ──────────────

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($booking) {
            if (empty($booking->booking_ref)) {
                $booking->booking_ref = 'BK-' . strtoupper(Str::random(8));
            }
        });
    }

    // ── Relationships ────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function slot()
    {
        return $this->belongsTo(Slot::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function queue()
    {
        return $this->hasOne(Queue::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    // ── Scopes ───────────────────────────────────────

    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', today())
                     ->whereIn('status', ['pending', 'confirmed']);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            'pending', 'confirmed', 'checked_in', 'in_progress',
        ]);
    }

    // ── Helpers ──────────────────────────────────────

    public function canCancel(): bool
    {
        return in_array($this->status, ['pending', 'confirmed']);
    }

    public function canCheckIn(): bool
    {
        return $this->status === 'confirmed' && $this->date->isToday();
    }
}