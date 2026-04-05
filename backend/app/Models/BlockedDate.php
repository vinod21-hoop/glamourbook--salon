<?php
// app/Models/BlockedDate.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedDate extends Model
{
    protected $fillable = ['date', 'reason', 'staff_id'];

    protected $casts = ['date' => 'date'];

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}