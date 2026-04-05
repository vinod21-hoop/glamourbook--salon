<?php
// app/Models/Staff.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Staff extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'staff';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'specialization',
        'avatar',
        'is_active',
        'max_daily_bookings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ── Relationships ────────────────────────────────

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_staff');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function slots()
    {
        return $this->hasMany(Slot::class);
    }

    // ── Scopes ───────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Helpers ──────────────────────────────────────

    public function todayBookingsCount(): int
    {
        return $this->bookings()
            ->whereDate('date', today())
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->count();
    }

    public function isAvailableToday(): bool
    {
        return $this->is_active
            && $this->todayBookingsCount() < $this->max_daily_bookings;
    }
}