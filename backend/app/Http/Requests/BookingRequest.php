<?php
// app/Http/Requests/BookingRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id'  => 'required|exists:services,id',
            'slot_id'     => 'required|exists:slots,id',
            'date'        => 'required|date|after_or_equal:today',
            'type'        => 'required|in:salon,home',
            'address'     => 'required_if:type,home|nullable|string|max:500',
            'coupon_code' => 'nullable|string|exists:coupons,code',
            'notes'       => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'date.after_or_equal' => 'Booking date must be today or later.',
            'address.required_if' => 'Address is required for home service.',
            'slot_id.exists'      => 'Selected slot is not valid.',
        ];
    }
}