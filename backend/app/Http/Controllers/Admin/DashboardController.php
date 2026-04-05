<?php
// app/Http/Controllers/Admin/DashboardController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // Today's stats
        $todayBookings  = Booking::today()->count();
        $todayRevenue   = Payment::whereHas('booking', fn($q) => $q->today())
            ->where('status', 'captured')
            ->sum('amount');
        $todayCompleted = Booking::today()->where('status', 'completed')->count();
        $todayNoShows   = Booking::today()->where('status', 'no_show')->count();

        // Overall stats
        $totalUsers    = User::customers()->count();
        $totalBookings = Booking::count();
        $totalRevenue  = Payment::where('status', 'captured')->sum('amount');
        $totalServices = Service::active()->count();

        // Weekly revenue (last 7 days)
        $weeklyRevenue = collect(range(6, 0))->map(function ($daysAgo) {
            $date = Carbon::today()->subDays($daysAgo);
            $revenue = Payment::whereDate('created_at', $date)
                ->where('status', 'captured')
                ->sum('amount');

            return [
                'date'    => $date->format('M d'),
                'day'     => $date->format('D'),
                'revenue' => (float) $revenue,
            ];
        });

        // Recent bookings
        $recentBookings = Booking::with(['user:id,name', 'service:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($b) => [
                'id'           => $b->id,
                'booking_ref'  => $b->booking_ref,
                'customer'     => $b->user->name,
                'service'      => $b->service->name,
                'date'         => $b->date->format('M d, Y'),
                'status'       => $b->status,
                'total'        => '₹' . number_format($b->total_price, 0),
            ]);

        // Service popularity
        $popularServices = Service::withCount(['bookings' => fn($q) =>
            $q->where('status', '!=', 'cancelled')
        ])
            ->orderByDesc('bookings_count')
            ->limit(5)
            ->get()
            ->map(fn($s) => [
                'name'     => $s->name,
                'bookings' => $s->bookings_count,
                'revenue'  => '₹' . number_format(
                    $s->bookings()->whereHas('payment', fn($q) =>
                        $q->where('status', 'captured')
                    )->sum('total_price'),
                    0
                ),
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'today' => [
                    'bookings'  => $todayBookings,
                    'revenue'   => (float) $todayRevenue,
                    'completed' => $todayCompleted,
                    'no_shows'  => $todayNoShows,
                ],
                'overall' => [
                    'users'    => $totalUsers,
                    'bookings' => $totalBookings,
                    'revenue'  => (float) $totalRevenue,
                    'services' => $totalServices,
                ],
                'weekly_revenue'   => $weeklyRevenue,
                'recent_bookings'  => $recentBookings,
                'popular_services' => $popularServices,
            ],
        ]);
    }
}