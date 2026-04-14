<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    // Apply CORS to all API routes and the Sanctum/JWT token endpoint
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        // Explicit origin from environment (set this to your Netlify URL in Railway)
        env('FRONTEND_URL', 'http://localhost:5173'),
        // Local development origins
        'http://localhost:5174',
        'http://localhost:3000',
    ],

    // Wildcard pattern to allow all Netlify preview and production deployments
    'allowed_origins_patterns' => [
        '#^https://[a-z0-9\-]+\.netlify\.app$#',
    ],

    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-XSRF-TOKEN'],

    'exposed_headers' => [],

    // Cache preflight response for 2 hours
    'max_age' => 7200,

    // Required when the frontend sends cookies or Authorization headers
    'supports_credentials' => true,

];