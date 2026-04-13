<?php
// app/Services/SlotService.php

namespace App\Services;

use App\Models\Slot;
use App\Models\Staff;
use App\Models\WorkingHour;
use App\Models\BlockedDate;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class SlotService
{
    /**
     * Generate slots for a range of dates
     */
    public function generateSlots(Carbon $from, Carbon $to): int
    {
        $count = 0;
        foreach (CarbonPeriod::create($from, $to) as $date) {
            $count += $this->generateSlotsForDate($date);
        }
        return $count;
    }

    /**
     * Generate slots for a single date
     */
    public function generateSlotsForDate(Carbon $date): int
    {
        $workingHour = WorkingHour::where('day_of_week', $date->dayOfWeek)->first();

        // Skip if not a working day
        if (!$workingHour || !$workingHour->is_open) {
            return 0;
        }

        // Skip if date is blocked globally
        if (BlockedDate::where('date', $date->toDateString())
            ->whereNull('staff_id')
            ->exists()
        ) {
            return 0;
        }

        $slotDuration = $workingHour->slot_duration;
        $openTime  = Carbon::parse($date->toDateString() . ' ' . $workingHour->open_time);
        $closeTime = Carbon::parse($date->toDateString() . ' ' . $workingHour->close_time);
        $count = 0;

        $staffMembers = Staff::active()->get();

        while ($openTime->copy()->addMinutes($slotDuration)->lte($closeTime)) {
            $endTime = $openTime->copy()->addMinutes($slotDuration);

            if ($staffMembers->isEmpty()) {
                // No staff — create generic slots
                $slot = Slot::firstOrCreate(
                    [
                        'date'       => $date->toDateString(),
                        'start_time' => $openTime->format('H:i:s'),
                        'staff_id'   => null,
                    ],
                    [
                        'end_time'         => $endTime->format('H:i:s'),
                        'max_bookings'     => 1,
                        'current_bookings' => 0,
                        'status'           => 'available',
                    ]
                );
                if ($slot->wasRecentlyCreated) $count++;
            } else {
                // Create per-staff slots
                foreach ($staffMembers as $staff) {
                    $isBlocked = BlockedDate::where('date', $date->toDateString())
                        ->where('staff_id', $staff->id)
                        ->exists();

                    if ($isBlocked) continue;

                    $slot = Slot::firstOrCreate(
                        [
                            'date'       => $date->toDateString(),
                            'start_time' => $openTime->format('H:i:s'),
                            'staff_id'   => $staff->id,
                        ],
                        [
                            'end_time'         => $endTime->format('H:i:s'),
                            'max_bookings'     => 1,
                            'current_bookings' => 0,
                            'status'           => 'available',
                        ]
                    );
                    if ($slot->wasRecentlyCreated) $count++;
                }
            }

            $openTime->addMinutes($slotDuration);
        }

        return $count;
    }

    /**
     * Get available slots for a given date
     */
    public function getAvailableSlots(string $date, ?int $staffId = null): Collection
    {
        $query = Slot::with('staff:id,name')
            ->where('date', $date)
            ->available()
            ->orderBy('start_time');

        if ($staffId) {
            $query->where('staff_id', $staffId);
        }

        // Filter out past slots if it's today
        if (Carbon::parse($date)->isToday()) {
            $query->where('start_time', '>', now()->addMinutes(15)->format('H:i:s'));
        }

        return $query->get()->map(fn(Slot $slot) => [
            'id'         => $slot->id,
            'start_time' => Carbon::parse($slot->start_time)->format('h:i A'),
            'end_time'   => Carbon::parse($slot->end_time)->format('h:i A'),
            'staff_id'   => $slot->staff_id,
            'staff_name' => $slot->staff?->name ?? 'Any Available',
            'available'  => $slot->isAvailable(),
        ]);
    }

    /**
 * Get available dates for next N days
 */
public function getAvailableDates(int $days = 30, ?int $staffId = null): Collection
{
    $dates = collect();

    foreach (CarbonPeriod::create(today(), today()->addDays($days)) as $date) {
        $wh = WorkingHour::where('day_of_week', $date->dayOfWeek)->first();

        if (!$wh || !$wh->is_open) continue;

        $isBlocked = BlockedDate::where('date', $date->toDateString())
            ->whereNull('staff_id')
            ->exists();

        if ($isBlocked) continue;

        $slotsQuery = Slot::where('date', $date->toDateString())->available();

        // Filter by staff if provided
        if ($staffId) {
            $slotsQuery->where('staff_id', $staffId);
        }

        if ($date->isToday()) {
            $slotsQuery->where('start_time', '>', now()->format('H:i:s'));
        }

        $availableCount = $slotsQuery->count();

        if ($availableCount > 0) {
            $dates->push([
                'date'            => $date->toDateString(),
                'formatted'       => $date->format('D, M d'),
                'day_name'        => $date->format('l'),
                'is_today'        => $date->isToday(),
                'available_slots' => $availableCount,
            ]);
        }
    }

    return $dates;
}

    /**
     * Block a date
     */
    public function blockDate(string $date, ?string $reason = null, ?int $staffId = null): void
    {
        BlockedDate::create([
            'date'     => $date,
            'reason'   => $reason,
            'staff_id' => $staffId,
        ]);

        Slot::where('date', $date)
            ->when($staffId, fn($q) => $q->where('staff_id', $staffId))
            ->update(['status' => 'blocked']);
    }
}