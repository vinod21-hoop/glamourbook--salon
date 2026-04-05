<?php
// app/Http/Controllers/ServiceController.php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * List all active services (with optional gender filter)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Service::active()->orderBy('sort_order');

        // Filter by gender/category
        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        // Search
        if ($request->has('search')) {
            $query->where('name', 'ILIKE', "%{$request->search}%");
        }

        $services = $query->get()->map(fn($service) => [
            'id'                 => $service->id,
            'name'               => $service->name,
            'slug'               => $service->slug,
            'category'           => $service->category,
            'price'              => $service->price,
            'formatted_price'    => $service->formatted_price,
            'duration'           => $service->duration,
            'formatted_duration' => $service->formatted_duration,
            'description'        => $service->description,
            'image_url'          => $service->image_url,
            'home_available'     => $service->home_available,
            'average_rating'     => $service->average_rating,
            'reviews_count'      => $service->reviews()->visible()->count(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $services,
        ]);
    }

    /**
     * Get single service details
     */
    public function show(int $id): JsonResponse
    {
        $service = Service::with([
            'reviews' => fn($q) => $q->visible()->with('user:id,name')->latest()->limit(10),
            'staff'   => fn($q) => $q->where('is_active', true),
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                 => $service->id,
                'name'               => $service->name,
                'category'           => $service->category,
                'price'              => $service->price,
                'formatted_price'    => $service->formatted_price,
                'duration'           => $service->duration,
                'formatted_duration' => $service->formatted_duration,
                'description'        => $service->description,
                'image_url'          => $service->image_url,
                'home_available'     => $service->home_available,
                'average_rating'     => $service->average_rating,
                'reviews'            => $service->reviews->map(fn($r) => [
                    'id'          => $r->id,
                    'user_name'   => $r->user->name,
                    'rating'      => $r->rating,
                    'comment'     => $r->comment,
                    'created_at'  => $r->created_at->diffForHumans(),
                ]),
                'staff' => $service->staff->map(fn($s) => [
                    'id'             => $s->id,
                    'name'           => $s->name,
                    'specialization' => $s->specialization,
                ]),
            ],
        ]);
    }
}