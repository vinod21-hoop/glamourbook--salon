<?php
// app/Models/Coupon.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'description', 'type', 'value',
        'min_order', 'max_discount', 'usage_limit',
        'used_count', 'per_user_limit', 'valid_from',
        'valid_until', 'is_active',
    ];

    protected $casts = [
        'value'        => 'decimal:2',
        'min_order'    => 'decimal:2',
        'max_discount' => 'decimal:2',
        'valid_from'   => 'date',
        'valid_until'  => 'date',
        'is_active'    => 'boolean',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'coupon_user')
                     ->withPivot('booking_id')
                     ->withTimestamps();
    }

    public function isValid(): bool
    {
        return $this->is_active
            && Carbon::today()->between($this->valid_from, $this->valid_until)
            && ($this->usage_limit === null || $this->used_count < $this->usage_limit);
    }

    public function canUserUse(int $userId): bool
    {
        if (!$this->isValid()) return false;

        $used = DB::table('coupon_user')
            ->where('coupon_id', $this->id)
            ->where('user_id', $userId)
            ->count();

        return $used < $this->per_user_limit;
    }

    public function calculateDiscount(float $amount): float
    {
        if ($amount < $this->min_order) return 0;

        $discount = $this->type === 'percentage'
            ? ($amount * $this->value / 100)
            : $this->value;

        if ($this->max_discount !== null) {
            $discount = min($discount, $this->max_discount);
        }

        return round(min($discount, $amount), 2);
    }
}