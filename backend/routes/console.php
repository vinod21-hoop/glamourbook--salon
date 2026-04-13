<?php
// routes/console.php

use Illuminate\Support\Facades\Schedule;

// Generate slots daily at midnight for next 30 days
Schedule::command('slots:generate 30')->daily()->at('00:00');
use App\Services\SlotService;
use App\Jobs\SendBookingReminder;

// Generate slots for next 7 days every day at midnight
Schedule::call(function () {
    $slotService = app(SlotService::class);
    $slotService->generateSlots(now(), now()->addDays(7));
})->daily()->at('00:00')->name('generate-slots');

// Send booking reminders daily at 6 PM
Schedule::job(new SendBookingReminder)->daily()->at('18:00')->name('booking-reminders');