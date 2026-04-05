<?php
// app/Http/Controllers/ReviewController.php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Submit a review
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        $booking = Booking::where('user_id', auth()->id())
            ->where('status', 'completed')
            ->findOrFail($request->booking_id);

        // Check if already reviewed
        if ($booking->review) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reviewed this booking',
            ], 422);
        }

        $review = Review::create([
            'user_id'    => auth()->id(),
            'booking_id' => $booking->id,
            'service_id' => $booking->service_id,
            'staff_id'   => $booking->staff_id,
            'rating'     => $request->rating,
            'comment'    => $request->comment,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully',
            'data'    => $review,
        ], 201);
    }

    /**
     * Get reviews for a service
     */
    public function serviceReviews(int $serviceId): JsonResponse
    {
        $reviews = Review::with('user:id,name')
            ->where('service_id', $serviceId)
            ->visible()
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => $reviews,
        ]);
    }
}