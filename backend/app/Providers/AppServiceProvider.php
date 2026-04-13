<?php

namespace App\Providers;

use App\Models\Staff;
use App\Observers\StaffObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Staff::observe(StaffObserver::class);
    }
}