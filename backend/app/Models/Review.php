<?php
// app/Models/Review.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'booking_id', 'service_id',
        'staff_id', 'rating', 'comment', 'is_visible',
    ];

    protected $casts = ['is_visible' => 'boolean'];

    public function user()    { return $this->belongsTo(User::class); }
    public function booking() { return $this->belongsTo(Booking::class); }
    public function service() { return $this->belongsTo(Service::class); }
    public function staff()   { return $this->belongsTo(Staff::class); }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }
}