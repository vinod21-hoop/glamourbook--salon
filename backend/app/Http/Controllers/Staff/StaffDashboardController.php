<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Staff;
use App\Models\NotificationLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StaffDashboardController extends Controller
{
    /**
     * Get staff from authenticated user
     */
    private function getStaff()
{
    $user = auth()->user();

    if (!$user) {
        abort(response()->json([
            'success' => false,
            'message' => 'Not authenticated!',
        ], 401));
    }

    \Illuminate\Support\Facades\Log::info('Staff login attempt', [
        'user_id'    => $user->id,
        'user_email' => $user->email,
        'user_role'  => $user->role,
    ]);

    $staff = Staff::where('email', $user->email)->first();

    if (!$staff) {
        abort(response()->json([
            'success' => false,
            'message' => 'Staff profile not found for: ' . $user->email,
            'debug'   => [
                'user_email'   => $user->email,
                'user_role'    => $user->role,
                'staff_emails' => Staff::pluck('email')->toArray(),
            ]
        ], 404));
    }

    return $staff;
}

    /**
     * Main Dashboard - Stats + Revenue + Performance
     */
    public function dashboard(): JsonResponse
    {
        $staff = $this->getStaff();

        // Today's stats
        $todayBookings = Booking::where('staff_id', $staff->id)
            ->whereDate('date', today())
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->get();

        $todayStats = [
            'total'       => $todayBookings->count(),
            'pending'     => $todayBookings->where('status', 'pending')->count(),
            'confirmed'   => $todayBookings->where('status', 'confirmed')->count(),
            'in_progress' => $todayBookings->where('status', 'in_progress')->count(),
            'completed'   => $todayBookings->where('status', 'completed')->count(),
        ];

        // Revenue calculations
        $todayRevenue = Booking::where('staff_id', $staff->id)
            ->whereDate('date', today())
            ->where('status', 'completed')
            ->sum('total_price');

        $weekRevenue = Booking::where('staff_id', $staff->id)
            ->whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])
            ->where('status', 'completed')
            ->sum('total_price');

        $monthRevenue = Booking::where('staff_id', $staff->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', 'completed')
            ->sum('total_price');

        $lastMonthRevenue = Booking::where('staff_id', $staff->id)
            ->whereMonth('date', now()->subMonth()->month)
            ->whereYear('date', now()->subMonth()->year)
            ->where('status', 'completed')
            ->sum('total_price');

        // Revenue growth
        $revenueGrowth = $lastMonthRevenue > 0
            ? round((($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : 0;

        // Monthly revenue chart (last 6 months)
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $revenue = Booking::where('staff_id', $staff->id)
                ->whereMonth('date', $date->month)
                ->whereYear('date', $date->year)
                ->where('status', 'completed')
                ->sum('total_price');

            $monthlyRevenue[] = [
                'month'   => $date->format('M'),
                'revenue' => (float) $revenue,
            ];
        }

        // Daily revenue chart (last 7 days)
        $dailyRevenue = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $revenue = Booking::where('staff_id', $staff->id)
                ->whereDate('date', $date)
                ->where('status', 'completed')
                ->sum('total_price');

            $dailyRevenue[] = [
                'day'     => $date->format('D'),
                'date'    => $date->format('M d'),
                'revenue' => (float) $revenue,
            ];
        }

        // Performance metrics
        $totalBookingsMonth = Booking::where('staff_id', $staff->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->count();

        $completedBookingsMonth = Booking::where('staff_id', $staff->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', 'completed')
            ->count();

        $cancelledBookingsMonth = Booking::where('staff_id', $staff->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', 'cancelled')
            ->count();

        $noShowMonth = Booking::where('staff_id', $staff->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->where('status', 'no_show')
            ->count();

        $completionRate = $totalBookingsMonth > 0
            ? round(($completedBookingsMonth / $totalBookingsMonth) * 100, 1)
            : 0;

        // Average rating
        $avgRating = DB::table('reviews')
            ->join('bookings', 'reviews.booking_id', '=', 'bookings.id')
            ->where('bookings.staff_id', $staff->id)
            ->where('reviews.is_visible', true)
            ->avg('reviews.rating');

        $totalReviews = DB::table('reviews')
            ->join('bookings', 'reviews.booking_id', '=', 'bookings.id')
            ->where('bookings.staff_id', $staff->id)
            ->where('reviews.is_visible', true)
            ->count();

        // Top services
        $topServices = Booking::where('staff_id', $staff->id)
            ->where('status', 'completed')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->select('service_id', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_price) as revenue'))
            ->groupBy('service_id')
            ->with('service:id,name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($b) => [
                'service_name' => $b->service->name ?? 'Unknown',
                'count'        => $b->count,
                'revenue'      => (float) $b->revenue,
            ]);

        // Recent reviews
        $recentReviews = DB::table('reviews')
            ->join('bookings', 'reviews.booking_id', '=', 'bookings.id')
            ->join('users', 'reviews.user_id', '=', 'users.id')
            ->join('services', 'bookings.service_id', '=', 'services.id')
            ->where('bookings.staff_id', $staff->id)
            ->where('reviews.is_visible', true)
            ->select(
                'reviews.rating',
                'reviews.comment',
                'reviews.created_at',
                'users.name as customer_name',
                'services.name as service_name'
            )
            ->orderByDesc('reviews.created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'staff' => [
                    'id'             => $staff->id,
                    'name'           => $staff->name,
                    'specialization' => $staff->specialization,
                    'avatar_url'     => $staff->avatar_url,
                ],
                'today' => $todayStats,
                'revenue' => [
                    'today'          => (float) $todayRevenue,
                    'week'           => (float) $weekRevenue,
                    'month'          => (float) $monthRevenue,
                    'last_month'     => (float) $lastMonthRevenue,
                    'growth'         => $revenueGrowth,
                    'monthly_chart'  => $monthlyRevenue,
                    'daily_chart'    => $dailyRevenue,
                ],
                'performance' => [
                    'total_bookings'    => $totalBookingsMonth,
                    'completed'         => $completedBookingsMonth,
                    'cancelled'         => $cancelledBookingsMonth,
                    'no_show'           => $noShowMonth,
                    'completion_rate'   => $completionRate,
                    'avg_rating'        => round($avgRating ?? 0, 1),
                    'total_reviews'     => $totalReviews,
                ],
                'top_services'   => $topServices,
                'recent_reviews' => $recentReviews,
            ],
        ]);
    }

    /**
     * Get today's bookings for staff
     */
    public function todayBookings(): JsonResponse
    {
        $staff = $this->getStaff();

        $bookings = Booking::with(['service', 'user', 'payment'])
            ->where('staff_id', $staff->id)
            ->whereDate('date', today())
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('time_slot')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $bookings,
        ]);
    }

    /**
     * Get staff schedule for a specific date
     */
    public function mySchedule(Request $request): JsonResponse
    {
        $staff = $this->getStaff();
        $date = $request->query('date', today()->toDateString());

        $bookings = Booking::with(['service', 'user', 'payment'])
            ->where('staff_id', $staff->id)
            ->whereDate('date', $date)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('time_slot')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'date'     => $date,
                'bookings' => $bookings,
            ],
        ]);
    }

    /**
     * Staff collects cash payment
     */
    public function collectCash(int $bookingId): JsonResponse
    {
        $staff = $this->getStaff();

        $booking = Booking::with(['service', 'user'])
            ->where('staff_id', $staff->id)
            ->findOrFail($bookingId);

        $payment = $booking->payment;

        if ($payment && $payment->status === 'captured') {
            return response()->json([
                'success' => false,
                'message' => 'Payment already received!',
            ], 422);
        }

        if (!$payment) {
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'user_id'    => $booking->user_id,
                'amount'     => $booking->total_price,
                'currency'   => 'INR',
                'status'     => 'captured',
                'method'     => 'cash',
            ]);
        } else {
            $payment->update([
                'status' => 'captured',
                'method' => 'cash',
            ]);
        }

        // Notify customer
        NotificationLog::create([
            'user_id' => $booking->user_id,
            'type'    => 'payment_received',
            'title'   => 'Cash Payment Received ✅',
            'message' => "Thank you! Your cash payment of ₹{$booking->total_price} for {$booking->service->name} has been received by {$staff->name}.",
            'data'    => json_encode([
                'booking_id' => $booking->id,
                'amount'     => $booking->total_price,
                'staff_name' => $staff->name,
            ]),
        ]);

        Log::info("Cash collected: ₹{$booking->total_price} by {$staff->name} for booking #{$booking->booking_ref}");

        return response()->json([
            'success' => true,
            'message' => "Cash ₹{$booking->total_price} collected successfully!",
        ]);
    }

    /**
     * Start service
     */
    public function startService(int $bookingId): JsonResponse
    {
        $staff = $this->getStaff();

        $booking = Booking::with(['service'])
            ->where('staff_id', $staff->id)
            ->findOrFail($bookingId);

        $booking->update(['status' => 'in_progress']);

        NotificationLog::create([
            'user_id' => $booking->user_id,
            'type'    => 'service_started',
            'title'   => 'Service Started! 💇',
            'message' => "{$staff->name} has started your {$booking->service->name} service.",
            'data'    => json_encode(['booking_id' => $booking->id]),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service started!',
        ]);
    }

    /**
     * Complete service
     */
    public function completeService(int $bookingId): JsonResponse
    {
        $staff = $this->getStaff();

        $booking = Booking::with(['service'])
            ->where('staff_id', $staff->id)
            ->findOrFail($bookingId);

        $booking->update(['status' => 'completed']);

        NotificationLog::create([
            'user_id' => $booking->user_id,
            'type'    => 'service_completed',
            'title'   => 'Service Completed! ✨',
            'message' => "Your {$booking->service->name} by {$staff->name} is complete. Please leave a review!",
            'data'    => json_encode(['booking_id' => $booking->id]),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service completed!',
        ]);
    }
}