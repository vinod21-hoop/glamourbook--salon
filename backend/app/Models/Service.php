<?php
// app/Models/Service.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'category',
        'price',
        'duration',
        'description',
        'image',
        'is_active',
        'home_available',
        'sort_order',
    ];

    protected $casts = [
        'price'          => 'decimal:2',
        'is_active'      => 'boolean',
        'home_available' => 'boolean',
    ];

    protected $appends = [
        'formatted_price',
        'formatted_duration',
        'image_url',
    ];

    // ── Auto-generate slug ───────────────────────────

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($service) {
            if (empty($service->slug)) {
                $service->slug = Str::slug($service->name) . '-' . Str::lower(Str::random(4));
            }
        });
    }

    // ── Relationships ────────────────────────────────

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function staff()
    {
        return $this->belongsToMany(Staff::class, 'service_staff');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    // ── Scopes ───────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where(function ($q) use ($category) {
            $q->where('category', $category)
              ->orWhere('category', 'unisex');
        });
    }

    public function scopeHomeAvailable($query)
    {
        return $query->where('home_available', true);
    }

    // ── Accessors ────────────────────────────────────

    public function getFormattedPriceAttribute(): string
    {
        return '₹' . number_format($this->price, 0);
    }

    public function getFormattedDurationAttribute(): string
    {
        $hours = intdiv($this->duration, 60);
        $mins  = $this->duration % 60;

        if ($hours > 0 && $mins > 0) return "{$hours}h {$mins}m";
        if ($hours > 0) return "{$hours}h";
        return "{$mins} mins";
    }

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) return null;
        return asset('storage/' . $this->image);
    }

    public function getAverageRatingAttribute(): float
    {
        return round(
            $this->reviews()->where('is_visible', true)->avg('rating') ?? 0,
            1
        );
    }
}