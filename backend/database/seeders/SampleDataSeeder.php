<?php
// database/seeders/SampleDataSeeder.php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Service;
use App\Models\Staff;
use App\Models\Coupon;
use Illuminate\Database\Seeder;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin User ───────────────────────────────
        User::create([
            'name'     => 'Admin',
            'email'    => 'admin@glamourbook.com',
            'password' => 'password123',
            'role'     => 'admin',
            'phone'    => '9999999999',
            'gender'   => 'male',
        ]);

        // ── Test User ────────────────────────────────
        User::create([
            'name'     => 'John Doe',
            'email'    => 'john@test.com',
            'password' => 'password123',
            'role'     => 'user',
            'phone'    => '9876543210',
            'gender'   => 'male',
        ]);

        User::create([
            'name'     => 'Jane Smith',
            'email'    => 'jane@test.com',
            'password' => 'password123',
            'role'     => 'user',
            'phone'    => '9876543211',
            'gender'   => 'female',
        ]);

        // ── Male Services ────────────────────────────
        $maleServices = [
            ['name' => 'Men\'s Haircut',     'category' => 'male', 'price' => 300,  'duration' => 30, 'description' => 'Classic men\'s haircut with styling', 'sort_order' => 1],
            ['name' => 'Beard Trim',         'category' => 'male', 'price' => 150,  'duration' => 20, 'description' => 'Professional beard trimming and shaping', 'sort_order' => 2],
            ['name' => 'Hair Color (Men)',   'category' => 'male', 'price' => 800,  'duration' => 60, 'description' => 'Full hair coloring for men', 'sort_order' => 3],
            ['name' => 'Head Massage',       'category' => 'male', 'price' => 200,  'duration' => 20, 'description' => 'Relaxing head massage with oil', 'sort_order' => 4],
            ['name' => 'Clean Shave',        'category' => 'male', 'price' => 100,  'duration' => 15, 'description' => 'Traditional clean shave', 'sort_order' => 5],
            ['name' => 'Men\'s Facial',      'category' => 'male', 'price' => 500,  'duration' => 45, 'description' => 'Deep cleansing facial for men', 'sort_order' => 6],
        ];

        // ── Female Services ──────────────────────────
        $femaleServices = [
            ['name' => 'Women\'s Haircut',   'category' => 'female', 'price' => 500,  'duration' => 45, 'description' => 'Professional women\'s haircut and styling', 'sort_order' => 7],
            ['name' => 'Hair Coloring',      'category' => 'female', 'price' => 2000, 'duration' => 120, 'description' => 'Full hair coloring with premium products', 'sort_order' => 8],
            ['name' => 'Bridal Makeup',      'category' => 'female', 'price' => 5000, 'duration' => 120, 'description' => 'Complete bridal makeup package', 'sort_order' => 9],
            ['name' => 'Hair Spa',           'category' => 'female', 'price' => 1500, 'duration' => 60, 'description' => 'Deep conditioning hair spa treatment', 'sort_order' => 10],
            ['name' => 'Threading',          'category' => 'female', 'price' => 100,  'duration' => 15, 'description' => 'Eyebrow and face threading', 'sort_order' => 11],
            ['name' => 'Women\'s Facial',    'category' => 'female', 'price' => 800,  'duration' => 60, 'description' => 'Premium facial treatment', 'sort_order' => 12],
            ['name' => 'Manicure & Pedicure','category' => 'female', 'price' => 1000, 'duration' => 60, 'description' => 'Complete nail care treatment', 'sort_order' => 13],
        ];

        // ── Unisex Services ──────────────────────────
        $unisexServices = [
            ['name' => 'Hair Straightening', 'category' => 'unisex', 'price' => 3000, 'duration' => 180, 'description' => 'Keratin hair straightening', 'sort_order' => 14],
            ['name' => 'Dandruff Treatment', 'category' => 'unisex', 'price' => 700,  'duration' => 45, 'description' => 'Anti-dandruff scalp treatment', 'sort_order' => 15],
        ];

        $allServices = array_merge($maleServices, $femaleServices, $unisexServices);

        foreach ($allServices as $service) {
            Service::create(array_merge($service, [
                'is_active'      => true,
                'home_available' => true,
            ]));
        }

        // ── Staff Members ────────────────────────────
        $staff1 = Staff::create([
            'name'               => 'Rahul Sharma',
            'phone'              => '9111111111',
            'specialization'     => 'Hair Specialist',
            'is_active'          => true,
            'max_daily_bookings' => 16,
        ]);

        $staff2 = Staff::create([
            'name'               => 'Priya Patel',
            'phone'              => '9222222222',
            'specialization'     => 'Makeup Artist',
            'is_active'          => true,
            'max_daily_bookings' => 12,
        ]);

        $staff3 = Staff::create([
            'name'               => 'Amit Kumar',
            'phone'              => '9333333333',
            'specialization'     => 'Senior Stylist',
            'is_active'          => true,
            'max_daily_bookings' => 16,
        ]);

        // Assign services to staff
        $staff1->services()->attach(Service::whereIn('category', ['male', 'unisex'])->pluck('id'));
        $staff2->services()->attach(Service::whereIn('category', ['female', 'unisex'])->pluck('id'));
        $staff3->services()->attach(Service::pluck('id')); // All services

        // ── Sample Coupons ───────────────────────────
        Coupon::create([
            'code'           => 'WELCOME20',
            'description'    => '20% off on first booking',
            'type'           => 'percentage',
            'value'          => 20,
            'min_order'      => 200,
            'max_discount'   => 500,
            'per_user_limit' => 1,
            'valid_from'     => now(),
            'valid_until'    => now()->addMonths(3),
            'is_active'      => true,
        ]);

        Coupon::create([
            'code'           => 'FLAT100',
            'description'    => 'Flat ₹100 off',
            'type'           => 'fixed',
            'value'          => 100,
            'min_order'      => 500,
            'usage_limit'    => 100,
            'per_user_limit' => 2,
            'valid_from'     => now(),
            'valid_until'    => now()->addMonths(1),
            'is_active'      => true,
        ]);
    }
}