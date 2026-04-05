<?php
// app/Http/Requests/RegisterRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'gender'   => 'nullable|in:male,female,other',
            'phone'    => 'nullable|string|max:15|unique:users,phone',
            'address'  => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'    => 'This email is already registered.',
            'phone.unique'    => 'This phone number is already registered.',
            'password.min'    => 'Password must be at least 6 characters.',
            'password.confirmed' => 'Passwords do not match.',
        ];
    }
}