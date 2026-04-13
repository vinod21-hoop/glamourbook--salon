<?php
// app/Http/Controllers/Admin/DashboardController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Service;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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

        // Staff statistics - with error handling
        $staffStats = collect([]);
        $topStaff = collect([]);

        try {
            $staffStats = Staff::with('services:id,name')
                ->active()
                ->get()
                ->map(function ($staff) {
                    try {
                        $totalBookings = $staff->bookings()->count();
                        $completedBookings = $staff->bookings()->where('status', 'completed')->count();
                        $todayBookings = $staff->bookings()->today()->count();
                        $currentService = $staff->bookings()
                            ->where('status', 'in_progress')
                            ->with('service:id,name')
                            ->latest()
                            ->first();

                        // Revenue calculations
                        $totalRevenue = $staff->bookings()
                            ->where('status', 'completed')
                            ->sum('total_price') ?? 0;
                        $monthRevenue = $staff->bookings()
                            ->whereMonth('date', Carbon::now()->month)
                            ->where('status', 'completed')
                            ->sum('total_price') ?? 0;
                        $lastMonthRevenue = $staff->bookings()
                            ->whereMonth('date', Carbon::now()->subMonth()->month)
                            ->where('status', 'completed')
                            ->sum('total_price') ?? 0;

                        // Rating from reviews - safely get average
                        $bookingIds = $staff->bookings()->pluck('id')->toArray();
                        $avgRating = !empty($bookingIds) 
                            ? DB::table('reviews')->whereIn('booking_id', $bookingIds)->avg('rating') ?? 0
                            : 0;

                        return [
                            'id'                 => $staff->id,
                            'name'               => $staff->name,
                            'specialization'    => $staff->specialization,
                            'experience'        => $staff->experience,
                            'avatar_url'        => $staff->avatar_url,
                            'services'          => $staff->services->map(fn($s) => $s->name)->join(', '),
                            'total_bookings'    => $totalBookings,
                            'completed_bookings' => $completedBookings,
                            'today_bookings'    => $todayBookings,
                            'total_revenue'     => (float) $totalRevenue,
                            'month_revenue'     => (float) $monthRevenue,
                            'last_month_revenue' => (float) $lastMonthRevenue,
                            'revenue_growth'    => $lastMonthRevenue > 0 
                                ? round((($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                                : 0,
                            'avg_rating'        => round((float) $avgRating, 1),
                            'current_service'   => $currentService ? [
                                'booking_ref' => $currentService->booking_ref,
                                'service'     => $currentService->service->name ?? 'N/A',
                                'customer'    => $currentService->user->name ?? 'N/A',
                            ] : null,
                        ];
                    } catch (\Exception $e) {
                        // Return basic staff info if there's an error in calculations
                        return [
                            'id'                 => $staff->id,
                            'name'               => $staff->name,
                            'specialization'    => $staff->specialization,
                            'experience'        => $staff->experience,
                            'avatar_url'        => $staff->avatar_url,
                            'services'          => $staff->services->map(fn($s) => $s->name)->join(', '),
                            'total_bookings'    => 0,
                            'completed_bookings' => 0,
                            'today_bookings'    => 0,
                            'total_revenue'     => 0,
                            'month_revenue'     => 0,
                            'last_month_revenue' => 0,
                            'revenue_growth'    => 0,
                            'avg_rating'        => 0,
                            'current_service'   => null,
                        ];
                    }
                })
                ->sortByDesc('month_revenue');

            // Top performing staff (by monthly revenue)
            $topStaff = $staffStats->take(5)->values();
        } catch (\Exception $e) {
            // Log the error but don't crash the dashboard
            \Log::error('Dashboard staff stats error: ' . $e->getMessage());
        }

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
                'staff_stats'      => $staffStats->values()->toArray(),
                'top_staff'        => $topStaff->toArray(),
            ],
        ]);
    }
}