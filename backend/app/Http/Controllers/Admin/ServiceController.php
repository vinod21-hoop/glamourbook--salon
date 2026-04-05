<?php
// app/Http/Controllers/Admin/ServiceController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceRequest;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = Service::withCount('bookings')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $services,
        ]);
    }

    public function store(ServiceRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('services', 'public');
        }

        $service = Service::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully',
            'data'    => $service,
        ], 201);
    }

    public function update(ServiceRequest $request, int $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            $data['image'] = $request->file('image')->store('services', 'public');
        }

        $service->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data'    => $service->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        // Check for active bookings
        $activeBookings = $service->bookings()->active()->count();
        if ($activeBookings > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete: {$activeBookings} active bookings exist",
            ], 422);
        }

        if ($service->image) {
            Storage::disk('public')->delete($service->image);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully',
        ]);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->update(['is_active' => !$service->is_active]);

        return response()->json([
            'success' => true,
            'message' => $service->is_active ? 'Service activated' : 'Service deactivated',
        ]);
    }
}