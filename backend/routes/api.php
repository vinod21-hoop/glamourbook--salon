<?php
// routes/api.php
// REPLACE the entire file

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\SlotController;
use App\Http\Controllers\Admin\QueueController as AdminQueueController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\CouponController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (No auth required)
|--------------------------------------------------------------------------
*/
Route::get('/test', function () {
    return response()->json(['message' => 'API working']);
});
// Auth
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);

// Public services listing
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{id}', [ServiceController::class, 'show']);

// Public reviews
Route::get('/services/{id}/reviews', [ReviewController::class, 'serviceReviews']);

// Public queue display (for TV/monitor in salon)
Route::get('/queue/today', [QueueController::class, 'todayQueue']);

// Public settings (for frontend dynamic content)
Route::get('/settings/public', [SettingsController::class, 'publicSettings']);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED USER ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->group(function () {

    // Auth management
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/me', [LoginController::class, 'me']);
    Route::post('/refresh', [LoginController::class, 'refresh']);

    // Booking flow
    Route::get('/booking/available-dates', [BookingController::class, 'availableDates']);
    Route::get('/booking/available-slots', [BookingController::class, 'availableSlots']);
    Route::post('/booking/calculate-price', [BookingController::class, 'calculatePrice']);
    Route::post('/booking', [BookingController::class, 'store']);
    Route::get('/my-bookings', [BookingController::class, 'myBookings']);
    Route::get('/my-bookings/{id}', [BookingController::class, 'show']);
    Route::post('/my-bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // Queue
    Route::get('/queue/my-status/{bookingId}', [QueueController::class, 'myQueueStatus']);

    // Payment
    Route::post('/payment/create-order/{bookingId}', [PaymentController::class, 'createOrder']);
    Route::post('/payment/verify', [PaymentController::class, 'verify']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    /*
    |--------------------------------------------------------------------------
    | ADMIN ROUTES
    |--------------------------------------------------------------------------
    */

    Route::middleware('admin')->prefix('admin')->group(function () {

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Services management
        Route::get('/services', [AdminServiceController::class, 'index']);
        Route::post('/services', [AdminServiceController::class, 'store']);
        Route::put('/services/{id}', [AdminServiceController::class, 'update']);
        Route::delete('/services/{id}', [AdminServiceController::class, 'destroy']);
        Route::patch('/services/{id}/toggle', [AdminServiceController::class, 'toggleStatus']);

        // Bookings management
        Route::get('/bookings', [AdminBookingController::class, 'index']);
        Route::get('/bookings/today', [AdminBookingController::class, 'todaySummary']);
        Route::get('/bookings/{id}', [AdminBookingController::class, 'show']);
        Route::put('/bookings/{id}/status', [AdminBookingController::class, 'updateStatus']);
        Route::post('/bookings/{id}/late-arrival', [AdminBookingController::class, 'handleLateArrival']);
        Route::post('/bookings/{id}/cash-payment', [AdminBookingController::class, 'acceptCashPayment']);

        // Slot management
        Route::get('/working-hours', [SlotController::class, 'getWorkingHours']);
        Route::put('/working-hours', [SlotController::class, 'updateWorkingHours']);
        Route::post('/slots/generate', [SlotController::class, 'generateSlots']);
        Route::get('/slots', [SlotController::class, 'viewSlots']);
        Route::post('/slots/block-date', [SlotController::class, 'blockDate']);
        Route::post('/slots/unblock-date', [SlotController::class, 'unblockDate']);
        Route::get('/blocked-dates', [SlotController::class, 'getBlockedDates']);

        // Queue management
        Route::get('/queue', [AdminQueueController::class, 'index']);
        Route::post('/queue/call-next', [AdminQueueController::class, 'callNext']);
        Route::post('/queue/check-in/{bookingId}', [AdminQueueController::class, 'checkIn']);
        Route::post('/queue/complete/{bookingId}', [AdminQueueController::class, 'complete']);
        Route::post('/queue/no-show/{bookingId}', [AdminQueueController::class, 'markNoShow']);

        // Settings
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update']);
        Route::put('/settings/bulk', [SettingsController::class, 'bulkUpdate']);

        // Staff
        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{id}', [StaffController::class, 'update']);
        Route::delete('/staff/{id}', [StaffController::class, 'destroy']);

        // Coupons
        Route::get('/coupons', [CouponController::class, 'index']);
        Route::post('/coupons', [CouponController::class, 'store']);
        Route::put('/coupons/{id}', [CouponController::class, 'update']);
        Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
        Route::patch('/coupons/{id}/toggle', [CouponController::class, 'toggleStatus']);
    });
});