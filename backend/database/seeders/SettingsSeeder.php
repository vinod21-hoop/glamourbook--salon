<?php
// database/seeders/SettingsSeeder.php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            [
                'key'         => 'salon_name',
                'value'       => 'GlamourBook Salon',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Salon Name',
                'is_public'   => true,
            ],
            [
                'key'         => 'salon_phone',
                'value'       => '+91 9876543210',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Salon Phone',
                'is_public'   => true,
            ],
            [
                'key'         => 'salon_address',
                'value'       => '123 Beauty Lane, Mumbai, India',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Salon Address',
                'is_public'   => true,
            ],
            [
                'key'         => 'salon_email',
                'value'       => 'hello@glamourbook.com',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Salon Email',
                'is_public'   => true,
            ],

            // Pricing
            [
                'key'         => 'home_service_charge',
                'value'       => '500',
                'type'        => 'integer',
                'group'       => 'pricing',
                'label'       => 'Home Service Charge (₹)',
                'is_public'   => true,
            ],

            // UI Content
            [
                'key'         => 'hero_title',
                'value'       => 'Look Your Best, Feel Your Best',
                'type'        => 'string',
                'group'       => 'ui',
                'label'       => 'Hero Section Title',
                'is_public'   => true,
            ],
            [
                'key'         => 'hero_subtitle',
                'value'       => 'Premium salon services at your doorstep or at our luxury salon',
                'type'        => 'string',
                'group'       => 'ui',
                'label'       => 'Hero Section Subtitle',
                'is_public'   => true,
            ],
            [
                'key'         => 'banner_text',
                'value'       => '🎉 Get 20% off on your first booking! Use code WELCOME20',
                'type'        => 'string',
                'group'       => 'ui',
                'label'       => 'Banner Announcement',
                'is_public'   => true,
            ],
            [
                'key'         => 'show_banner',
                'value'       => 'true',
                'type'        => 'boolean',
                'group'       => 'ui',
                'label'       => 'Show Banner',
                'is_public'   => true,
            ],

            // Queue Settings
            [
                'key'         => 'grace_period_minutes',
                'value'       => '15',
                'type'        => 'integer',
                'group'       => 'queue',
                'label'       => 'Grace Period (minutes)',
                'is_public'   => false,
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}