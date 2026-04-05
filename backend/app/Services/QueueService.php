<?php
// app/Services/QueueService.php (COMPLETE FILE)

namespace App\Services;

use App\Models\Queue;
use App\Models\Booking;
use App\Models\Slot;
use App\Events\QueueUpdated;
use App\Jobs\ProcessNoShow;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QueueService
{
    private int $gracePeriod;

    public function __construct()
    {
        $this->gracePeriod = (int) config('salon.grace_period_minutes', 15);
    }

    public function addToQueue(Booking $booking): Queue
    {
        return DB::transaction(function () use ($booking) {
            $dateStr = $booking->date->toDateString();

            $maxPosition = Queue::whereHas('booking', fn($q) =>
                $q->whereDate('date', $dateStr)
            )->active()->max('position') ?? 0;

            $maxQueueNum = Queue::whereHas('booking', fn($q) =>
                $q->whereDate('date', $dateStr)
            )->max('queue_number') ?? 0;

            $position    = $maxPosition + 1;
            $queueNumber = $maxQueueNum + 1;

            $estimatedStart = $this->calculateEstimatedTime($dateStr, $position);
            $duration       = $booking->service->duration ?? 30;

            $queue = Queue::create([
                'booking_id'           => $booking->id,
                'position'             => $position,
                'queue_number'         => $queueNumber,
                'estimated_start_time' => $estimatedStart,
                'estimated_end_time'   => $estimatedStart?->copy()->addMinutes($duration),
                'status'               => 'waiting',
            ]);

            Log::info("Queue: Added {$booking->booking_ref} → Position {$position}, Q#{$queueNumber}");
            $this->broadcastUpdate();

            return $queue;
        });
    }

    public function callNext(): ?Queue
    {
        return DB::transaction(function () {
            $next = Queue::with('booking.service')
                ->today()
                ->where('status', 'waiting')
                ->orderBy('position')
                ->first();

            if (!$next) return null;

            $graceExpiry = now()->addMinutes($this->gracePeriod);

            $next->update([
                'status'           => 'grace_period',
                'called_at'        => now(),
                'grace_expires_at' => $graceExpiry,
            ]);

            $next->booking->update(['grace_deadline' => $graceExpiry]);

            ProcessNoShow::dispatch($next->id)->delay($graceExpiry);

            Log::info("Queue: Called Q#{$next->queue_number}");
            $this->broadcastUpdate();

            return $next;
        });
    }

    public function checkIn(Booking $booking): Queue
    {
        return DB::transaction(function () use ($booking) {
            $queue = $booking->queue;

            if (!$queue || !in_array($queue->status, ['waiting', 'grace_period'])) {
                throw new \RuntimeException('Cannot check in');
            }

            $queue->update(['status' => 'serving']);
            $booking->update([
                'status'        => 'checked_in',
                'checked_in_at' => now(),
            ]);

            Log::info("Queue: Checked in {$booking->booking_ref}");
            $this->broadcastUpdate();

            return $queue;
        });
    }

    public function completeService(Booking $booking): void
    {
        DB::transaction(function () use ($booking) {
            if ($booking->queue) {
                $booking->queue->update(['status' => 'completed']);
            }

            $booking->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);

            Log::info("Queue: Completed {$booking->booking_ref}");
            $this->recalculatePositions($booking->date);
            $this->callNext();
        });
    }

    public function handleNoShow(int $queueId): void
    {
        DB::transaction(function () use ($queueId) {
            $queue = Queue::with('booking.slot')->find($queueId);

            if (!$queue || $queue->status !== 'grace_period') return;

            Log::warning("Queue: No-show Q#{$queue->queue_number}");

            $queue->update(['status' => 'skipped']);
            $queue->booking->update(['status' => 'no_show']);

            if ($queue->booking->slot) {
                $queue->booking->slot->decrementBookings();
            }

            $this->recalculatePositions($queue->booking->date);
            $this->callNext();
        });
    }

    public function handleLateArrival(Booking $oldBooking): ?Booking
    {
        return DB::transaction(function () use ($oldBooking) {
            if ($oldBooking->status !== 'no_show') {
                throw new \RuntimeException('Only no-show bookings can be rescheduled');
            }

            $nextSlot = Slot::where('date', today())
                ->available()
                ->where('start_time', '>', now()->format('H:i:s'))
                ->orderBy('start_time')
                ->first();

            if (!$nextSlot) return null;

            $newBooking = $oldBooking->replicate([
                'booking_ref', 'deleted_at',
                'checked_in_at', 'completed_at', 'grace_deadline',
            ]);
            $newBooking->slot_id   = $nextSlot->id;
            $newBooking->time_slot = $nextSlot->start_time;
            $newBooking->status    = 'confirmed';
            $newBooking->notes     = "Rescheduled from {$oldBooking->booking_ref} (late arrival)";
            $newBooking->save();

            $nextSlot->incrementBookings();

            $oldBooking->update([
                'notes' => ($oldBooking->notes ?? '') . "\nRescheduled → {$newBooking->booking_ref}",
            ]);

            $this->addToQueue($newBooking);

            Log::info("Queue: Late arrival rescheduled {$oldBooking->booking_ref} → {$newBooking->booking_ref}");

            return $newBooking;
        });
    }

    public function recalculatePositions($date): void
    {
        $dateStr = $date instanceof Carbon ? $date->toDateString() : $date;

        $waiting = Queue::whereHas('booking', fn($q) =>
            $q->whereDate('date', $dateStr)
        )
            ->where('status', 'waiting')
            ->orderBy('position')
            ->get();

        $servingEnd = Queue::whereHas('booking', fn($q) =>
            $q->whereDate('date', $dateStr)
        )
            ->where('status', 'serving')
            ->max('estimated_end_time');

        $currentTime = $servingEnd ? Carbon::parse($servingEnd) : now();
        $pos = 1;

        foreach ($waiting as $queue) {
            $duration = $queue->booking->service->duration ?? 30;

            $queue->update([
                'position'             => $pos,
                'estimated_start_time' => $currentTime->copy(),
                'estimated_end_time'   => $currentTime->copy()->addMinutes($duration),
            ]);

            $currentTime->addMinutes($duration);
            $pos++;
        }

        $this->broadcastUpdate();
    }

    private function calculateEstimatedTime(string $dateStr, int $position): ?Carbon
    {
        $totalBefore = Queue::whereHas('booking', fn($q) =>
            $q->whereDate('date', $dateStr)
        )
            ->whereIn('status', ['waiting', 'grace_period', 'serving'])
            ->with('booking.service')
            ->get()
            ->sum(fn($q) => $q->booking->service->duration ?? 30);

        return now()->addMinutes($totalBefore);
    }

    public function getTodayQueue(): array
    {
        $queues = Queue::with([
            'booking.user:id,name,phone',
            'booking.service:id,name,duration',
            'booking.staff:id,name',
        ])
            ->today()
            ->orderBy('position')
            ->get();

        $active = $queues->whereIn('status', ['waiting', 'grace_period', 'serving']);

        return [
            'queue' => $queues->map(fn($q) => [
                'id'              => $q->id,
                'queue_number'    => $q->queue_number,
                'position'        => $q->position,
                'status'          => $q->status,
                'customer_name'   => $q->booking->user->name,
                'service_name'    => $q->booking->service->name,
                'duration'        => $q->booking->service->duration,
                'estimated_start' => $q->estimated_start_time?->format('h:i A'),
                'estimated_end'   => $q->estimated_end_time?->format('h:i A'),
                'grace_expires'   => $q->grace_expires_at?->format('h:i A'),
                'staff_name'      => $q->booking->staff?->name,
                'booking_ref'     => $q->booking->booking_ref,
                'booking_type'    => $q->booking->type,
            ]),
            'serving_count'  => $active->where('status', 'serving')->count(),
            'waiting_count'  => $active->where('status', 'waiting')->count(),
            'total_active'   => $active->count(),
            'completed_today' => $queues->where('status', 'completed')->count(),
        ];
    }

    public function getPositionForBooking(Booking $booking): ?array
    {
        $queue = $booking->queue;
        if (!$queue) return null;

        $ahead = Queue::today()
            ->where('status', 'waiting')
            ->where('position', '<', $queue->position)
            ->count();

        return [
            'queue_number'        => $queue->queue_number,
            'position'            => $queue->position,
            'people_ahead'        => $ahead,
            'status'              => $queue->status,
            'estimated_start'     => $queue->estimated_start_time?->format('h:i A'),
            'estimated_end'       => $queue->estimated_end_time?->format('h:i A'),
            'estimated_wait_mins' => $queue->estimated_start_time
                ? max(0, (int) now()->diffInMinutes($queue->estimated_start_time, false))
                : null,
        ];
    }

    private function broadcastUpdate(): void
    {
        try {
            event(new QueueUpdated($this->getTodayQueue()));
        } catch (\Exception $e) {
            Log::warning("Broadcast failed: " . $e->getMessage());
        }
    }
}