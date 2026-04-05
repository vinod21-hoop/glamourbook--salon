<?php
// app/Models/Slot.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Slot extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'start_time',
        'end_time',
        'staff_id',
        'max_bookings',
        'current_bookings',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    // ── Relationships ────────────────────────────────

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    // ── Scopes ───────────────────────────────────────

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
                     ->whereColumn('current_bookings', '<', 'max_bookings');
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    // ── Helpers ──────────────────────────────────────

    public function isAvailable(): bool
    {
        return $this->status === 'available'
            && $this->current_bookings < $this->max_bookings;
    }

    public function incrementBookings(): void
    {
        $this->increment('current_bookings');

        if ($this->fresh()->current_bookings >= $this->max_bookings) {
            $this->update(['status' => 'full']);
        }
    }

    public function decrementBookings(): void
    {
        if ($this->current_bookings > 0) {
            $this->decrement('current_bookings');
        }
        if ($this->fresh()->current_bookings < $this->max_bookings
            && $this->status === 'full'
        ) {
            $this->update(['status' => 'available']);
        }
    }

    public function getFormattedTimeAttribute(): string
    {
        return Carbon::parse($this->start_time)->format('h:i A')
             . ' - '
             . Carbon::parse($this->end_time)->format('h:i A');
    }
}