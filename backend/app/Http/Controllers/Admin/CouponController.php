<?php
// app/Http/Controllers/Admin/CouponController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index(): JsonResponse
    {
        $coupons = Coupon::orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $coupons,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code'           => 'required|string|unique:coupons,code|max:20',
            'description'    => 'nullable|string|max:255',
            'type'           => 'required|in:percentage,fixed',
            'value'          => 'required|numeric|min:0',
            'min_order'      => 'nullable|numeric|min:0',
            'max_discount'   => 'nullable|numeric|min:0',
            'usage_limit'    => 'nullable|integer|min:1',
            'per_user_limit' => 'nullable|integer|min:1',
            'valid_from'     => 'required|date',
            'valid_until'    => 'required|date|after_or_equal:valid_from',
        ]);

        $coupon = Coupon::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Coupon created',
            'data'    => $coupon,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);

        $request->validate([
            'description'    => 'nullable|string|max:255',
            'type'           => 'sometimes|in:percentage,fixed',
            'value'          => 'sometimes|numeric|min:0',
            'min_order'      => 'nullable|numeric|min:0',
            'max_discount'   => 'nullable|numeric|min:0',
            'usage_limit'    => 'nullable|integer|min:1',
            'per_user_limit' => 'nullable|integer|min:1',
            'valid_from'     => 'sometimes|date',
            'valid_until'    => 'sometimes|date|after_or_equal:valid_from',
            'is_active'      => 'nullable|boolean',
        ]);

        $coupon->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Coupon updated',
            'data'    => $coupon,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Coupon::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Coupon deleted',
        ]);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->update(['is_active' => !$coupon->is_active]);

        return response()->json([
            'success' => true,
            'message' => $coupon->is_active ? 'Coupon activated' : 'Coupon deactivated',
        ]);
    }
}