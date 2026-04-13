<?php

namespace App\Observers;

use App\Models\Staff;
use App\Models\User;

class StaffObserver
{
    /**
     * Auto-create user account when staff is created
     */
    public function created(Staff $staff)
    {
        if ($staff->email && !User::where('email', $staff->email)->exists()) {
            User::create([
                'name'     => $staff->name,
                'email'    => $staff->email,
                'password' => bcrypt('staff' . rand(1000, 9999)),
                'role'     => 'staff',
                'phone'    => $staff->phone,
            ]);
        }
    }

    /**
     * Auto-update user account when staff is updated
     */
    public function updated(Staff $staff)
    {
        $oldEmail = $staff->getOriginal('email');
        $user = User::where('email', $oldEmail)->first();

        if ($user) {
            $user->update([
                'name'  => $staff->name,
                'email' => $staff->email,
                'phone' => $staff->phone,
            ]);
        }
    }

    /**
     * Auto-delete user account when staff is deleted
     */
    public function deleted(Staff $staff)
    {
        if ($staff->email) {
            User::where('email', $staff->email)->delete();
        }
    }
}