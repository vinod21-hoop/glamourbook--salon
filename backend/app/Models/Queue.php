<?php
// app/Models/Queue.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'position',
        'queue_number',
        'estimated_start_time',
        'estimated_end_time',
        'status',
        'called_at',
        'grace_expires_at',
    ];

    protected $casts = [
        'estimated_start_time' => 'datetime',
        'estimated_end_time'   => 'datetime',
        'called_at'            => 'datetime',
        'grace_expires_at'     => 'datetime',
    ];

    // ── Relationships ────────────────────────────────

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    // ── Scopes ───────────────────────────────────────

    public function scopeToday($query)
    {
        return $query->whereHas('booking', fn($q) =>
            $q->whereDate('date', today())
        );
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['waiting', 'grace_period', 'serving']);
    }

    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting');
    }
}