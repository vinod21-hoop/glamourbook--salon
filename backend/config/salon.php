<?php

return [
    'home_service_charge'      => env('HOME_SERVICE_CHARGE', 500),
    'grace_period_minutes'     => env('GRACE_PERIOD_MINUTES', 15),
    'default_slot_duration'    => env('DEFAULT_SLOT_DURATION', 30),
    'max_advance_booking_days' => 30,
    'currency'                 => 'INR',

    'working_hours' => [
        'default_open'  => '10:00',
        'default_close' => '20:00',
    ],
];