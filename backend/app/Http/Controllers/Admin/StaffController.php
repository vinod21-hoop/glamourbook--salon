<?php
// app/Http/Controllers/Admin/StaffController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staff = Staff::with('services:id,name')
            ->withCount(['bookings' => fn($q) => $q->today()->active()])
            ->get()
            ->map(fn($s) => [
                'id'               => $s->id,
                'name'             => $s->name,
                'phone'            => $s->phone,
                'email'            => $s->email,
                'specialization'   => $s->specialization,
                'is_active'        => $s->is_active,
                'max_daily'        => $s->max_daily_bookings,
                'today_bookings'   => $s->bookings_count,
                'available_today'  => $s->isAvailableToday(),
                'services'         => $s->services->pluck('name'),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $staff,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'               => 'required|string|max:255',
            'phone'              => 'nullable|string|max:15',
            'email'              => 'nullable|email',
            'specialization'     => 'nullable|string|max:255',
            'max_daily_bookings' => 'nullable|integer|min:1|max:50',
            'service_ids'        => 'nullable|array',
            'service_ids.*'      => 'exists:services,id',
            'avatar'             => 'nullable|image|max:2048',
        ]);

        $data = $request->except(['service_ids', 'avatar']);

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('staff', 'public');
        }

        $staff = Staff::create($data);

        if ($request->has('service_ids')) {
            $staff->services()->sync($request->service_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff member added',
            'data'    => $staff->load('services'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $request->validate([
            'name'               => 'sometimes|string|max:255',
            'phone'              => 'nullable|string|max:15',
            'email'              => 'nullable|email',
            'specialization'     => 'nullable|string|max:255',
            'max_daily_bookings' => 'nullable|integer|min:1|max:50',
            'is_active'          => 'nullable|boolean',
            'service_ids'        => 'nullable|array',
            'service_ids.*'      => 'exists:services,id',
        ]);

        $staff->update($request->except(['service_ids']));

        if ($request->has('service_ids')) {
            $staff->services()->sync($request->service_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff updated',
            'data'    => $staff->fresh('services'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $activeBookings = $staff->bookings()->active()->count();
        if ($activeBookings > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete: {$activeBookings} active bookings",
            ], 422);
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'message' => 'Staff removed',
        ]);
    }
}