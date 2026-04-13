<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Staff extends Model
{
    use HasFactory;

    protected $table = 'staff';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'specialization',
        'experience',
        'avatar',
        'is_active',
        'max_daily_bookings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['avatar_url'];

    /**
     * Get avatar URL
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return Storage::disk('public')->url($this->avatar);
        }
        return null;
    }

    /**
     * Scope: Active staff only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Relationship: Staff has many services
     */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_staff');
    }

    /**
     * Relationship: Staff has many bookings
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get linked user account
     */
    public function user()
    {
        return User::where('email', $this->email)->first();
    }
}