<?php
// app/Http/Requests/ServiceRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Admin check via middleware
    }

    public function rules(): array
    {
        return [
            'name'           => 'required|string|max:255',
            'category'       => 'required|in:male,female,unisex',
            'price'          => 'required|numeric|min:0',
            'duration'       => 'required|integer|min:15|max:480',
            'description'    => 'nullable|string|max:2000',
            'image'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'is_active'      => 'boolean',
            'home_available' => 'boolean',
            'sort_order'     => 'nullable|integer',
        ];
    }
}