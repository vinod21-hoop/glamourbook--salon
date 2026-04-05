<?php
// database/seeders/WorkingHoursSeeder.php

namespace Database\Seeders;

use App\Models\WorkingHour;
use Illuminate\Database\Seeder;

class WorkingHoursSeeder extends Seeder
{
    public function run(): void
    {
        $hours = [
            ['day_of_week' => 0, 'open_time' => '10:00', 'close_time' => '18:00', 'is_open' => false, 'slot_duration' => 30], // Sunday closed
            ['day_of_week' => 1, 'open_time' => '10:00', 'close_time' => '20:00', 'is_open' => true, 'slot_duration' => 30],
            ['day_of_week' => 2, 'open_time' => '10:00', 'close_time' => '20:00', 'is_open' => true, 'slot_duration' => 30],
            ['day_of_week' => 3, 'open_time' => '10:00', 'close_time' => '20:00', 'is_open' => true, 'slot_duration' => 30],
            ['day_of_week' => 4, 'open_time' => '10:00', 'close_time' => '20:00', 'is_open' => true, 'slot_duration' => 30],
            ['day_of_week' => 5, 'open_time' => '10:00', 'close_time' => '20:00', 'is_open' => true, 'slot_duration' => 30],
            ['day_of_week' => 6, 'open_time' => '10:00', 'close_time' => '18:00', 'is_open' => true, 'slot_duration' => 30], // Saturday shorter
        ];

        foreach ($hours as $hour) {
            WorkingHour::updateOrCreate(
                ['day_of_week' => $hour['day_of_week']],
                $hour
            );
        }
    }
}