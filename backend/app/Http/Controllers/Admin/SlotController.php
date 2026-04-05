<?php
// app/Http/Controllers/Admin/SlotController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WorkingHour;
use App\Models\BlockedDate;
use App\Models\Slot;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SlotController extends Controller
{
    public function __construct(
        private SlotService $slotService
    ) {}

    /**
     * Get working hours config
     */
    public function getWorkingHours(): JsonResponse
    {
        $hours = WorkingHour::orderBy('day_of_week')->get()->map(fn($wh) => [
            'id'            => $wh->id,
            'day_of_week'   => $wh->day_of_week,
            'day_name'      => $wh->day_name,
            'open_time'     => $wh->open_time,
            'close_time'    => $wh->close_time,
            'is_open'       => $wh->is_open,
            'slot_duration' => $wh->slot_duration,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $hours,
        ]);
    }

    /**
     * Update working hours
     */
    public function updateWorkingHours(Request $request): JsonResponse
    {
        $request->validate([
            'hours'                  => 'required|array',
            'hours.*.day_of_week'    => 'required|integer|min:0|max:6',
            'hours.*.open_time'      => 'required|date_format:H:i',
            'hours.*.close_time'     => 'required|date_format:H:i|after:hours.*.open_time',
            'hours.*.is_open'        => 'required|boolean',
            'hours.*.slot_duration'  => 'required|integer|min:15|max:120',
        ]);

        foreach ($request->hours as $hour) {
            WorkingHour::updateOrCreate(
                ['day_of_week' => $hour['day_of_week']],
                [
                    'open_time'     => $hour['open_time'],
                    'close_time'    => $hour['close_time'],
                    'is_open'       => $hour['is_open'],
                    'slot_duration' => $hour['slot_duration'],
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Working hours updated successfully',
        ]);
    }

    /**
     * Generate slots for date range
     */
    public function generateSlots(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date|after_or_equal:today',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $from  = Carbon::parse($request->from);
        $to    = Carbon::parse($request->to);
        $count = $this->slotService->generateSlots($from, $to);

        return response()->json([
            'success' => true,
            'message' => "{$count} slots generated successfully",
            'data'    => ['slots_created' => $count],
        ]);
    }

    /**
     * Block a date
     */
    public function blockDate(Request $request): JsonResponse
    {
        $request->validate([
            'date'     => 'required|date|after_or_equal:today',
            'reason'   => 'nullable|string|max:255',
            'staff_id' => 'nullable|exists:staff,id',
        ]);

        $this->slotService->blockDate(
            $request->date,
            $request->reason,
            $request->staff_id
        );

        return response()->json([
            'success' => true,
            'message' => 'Date blocked successfully',
        ]);
    }

    /**
     * Unblock a date
     */
    public function unblockDate(Request $request): JsonResponse
    {
        $request->validate([
            'date'     => 'required|date',
            'staff_id' => 'nullable|exists:staff,id',
        ]);

        BlockedDate::where('date', $request->date)
            ->when($request->staff_id, fn($q) => $q->where('staff_id', $request->staff_id))
            ->delete();

        // Restore slots
        Slot::where('date', $request->date)
            ->where('status', 'blocked')
            ->when($request->staff_id, fn($q) => $q->where('staff_id', $request->staff_id))
            ->update(['status' => 'available']);

        return response()->json([
            'success' => true,
            'message' => 'Date unblocked successfully',
        ]);
    }

    /**
     * Get blocked dates
     */
    public function getBlockedDates(): JsonResponse
    {
        $blocked = BlockedDate::with('staff:id,name')
            ->where('date', '>=', today())
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $blocked,
        ]);
    }

    /**
     * View slots for a specific date
     */
    public function viewSlots(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $slots = Slot::with(['staff:id,name', 'bookings.user:id,name'])
            ->where('date', $request->date)
            ->orderBy('start_time')
            ->get()
            ->map(fn($slot) => [
                'id'               => $slot->id,
                'start_time'       => Carbon::parse($slot->start_time)->format('h:i A'),
                'end_time'         => Carbon::parse($slot->end_time)->format('h:i A'),
                'staff_name'       => $slot->staff?->name ?? 'Any',
                'status'           => $slot->status,
                'max_bookings'     => $slot->max_bookings,
                'current_bookings' => $slot->current_bookings,
                'bookings'         => $slot->bookings->map(fn($b) => [
                    'booking_ref' => $b->booking_ref,
                    'customer'    => $b->user->name,
                    'status'      => $b->status,
                ]),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $slots,
        ]);
    }
}