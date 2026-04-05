<?php
// config/auth.php
// Only change the 'guards' and 'defaults' sections

return [
    'defaults' => [
        'guard'     => 'api',    // ← Changed from 'web' to 'api'
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver'   => 'session',
            'provider' => 'users',
        ],

        'api' => [
            'driver'   => 'jwt',     // ← Added JWT driver
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model'  => App\Models\User::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider'    => 'users',
            'table'       => 'password_reset_tokens',
            'expire'      => 60,
            'throttle'    => 60,
        ],
    ],

    'password_timeout' => 10800,
];