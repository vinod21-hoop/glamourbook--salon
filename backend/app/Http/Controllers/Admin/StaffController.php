<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    /**
     * List all staff members
     */
    public function index(): JsonResponse
    {
        $staff = Staff::with('services:id,name')
            ->orderBy('name')
            ->get()
            ->map(function ($member) {
                $user = User::where('email', $member->email)->first();
                $member->has_account = $user ? true : false;
                $member->user_id = $user?->id;
                return $member->toArray();
            });

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }

    /**
     * Show single staff member
     */
    public function show($id): JsonResponse
    {
        $staff = Staff::with('services:id,name')->findOrFail($id);

        $user = User::where('email', $staff->email)->first();
        $staff->has_account = $user ? true : false;

        return response()->json([
            'success' => true,
            'data' => $staff->toArray(),
        ]);
    }

    /**
     * Add new staff member + auto-create login credentials
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'email'              => 'required|email|unique:staff,email',
            'phone'              => 'required|string|max:15',
            'specialization'     => 'nullable|string|max:255',
            'experience'         => 'nullable|string',
            'avatar'             => 'nullable|image|max:2048',
            'is_active'          => 'nullable|boolean',
            'max_daily_bookings' => 'nullable|integer|min:1|max:100',
            'services'           => 'nullable|array',
            'services.*'         => 'exists:services,id',
        ]);

        try {
            // IMPORTANT: Clean up any soft-deleted user accounts BEFORE the transaction starts
            // This prevents unique constraint violations when re-adding staff with the same email
            DB::table('users')->where('email', $validated['email'])->delete();

            DB::beginTransaction();

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $validated['avatar'] = $request->file('avatar')->store('staff', 'public');
            }

            $validated['is_active'] = $validated['is_active'] ?? true;

            // Generate random password
            $defaultPassword = 'staff' . rand(1000, 9999);

            // Create staff record
            $staff = Staff::create([
                'name'               => $validated['name'],
                'email'              => $validated['email'],
                'phone'              => $validated['phone'],
                'specialization'     => $validated['specialization'] ?? null,
                'experience'         => $validated['experience'] ?? null,
                'avatar'             => $validated['avatar'] ?? null,
                'is_active'          => $validated['is_active'],
                'max_daily_bookings' => $validated['max_daily_bookings'] ?? 16,
            ]);

            // Attach services if provided
            if (!empty($validated['services'])) {
                $staff->services()->attach($validated['services']);
            }

            // Create user account for staff login
            $user = User::where('email', $staff->email)->first();

            if (!$user) {
                $user = User::create([
                    'name'     => $staff->name,
                    'email'    => $staff->email,
                    'password' => bcrypt($defaultPassword),
                    'role'     => 'staff',
                    'phone'    => $staff->phone,
                ]);
            } else {
                // User exists, update password
                $user->update(['password' => bcrypt($defaultPassword)]);
            }

            DB::commit();

            $staff->load('services:id,name');

            return response()->json([
                'success' => true,
                'message' => "Staff member '{$staff->name}' added successfully!",
                'data'    => $staff->toArray(),
                'login_credentials' => [
                    'email'    => $staff->email,
                    'password' => $defaultPassword,
                    'note'     => 'Please save these credentials. The password will not be shown again.',
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create staff member.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update staff member
     */
    public function update(Request $request, $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $rules = [
            'name'           => 'sometimes|string|max:255',
            'email'          => 'sometimes|email|unique:staff,email,' . $staff->id,
            'phone'          => 'sometimes|string|max:15',
            'specialization' => 'nullable|string|max:255',
            'experience'     => 'nullable|string',
            'is_active'      => 'nullable|boolean',
            'services'       => 'nullable|array',
            'services.*'     => 'exists:services,id',
        ];

        // Only validate avatar if it's being uploaded
        if ($request->hasFile('avatar')) {
            $rules['avatar'] = 'required|image|max:2048';
        }

        $validated = $request->validate($rules);

        try {
            DB::beginTransaction();

            $oldEmail = $staff->email;

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                // Delete old avatar
                if ($staff->avatar) {
                    Storage::disk('public')->delete($staff->avatar);
                }
                $validated['avatar'] = $request->file('avatar')->store('staff', 'public');
            }

            // Update staff record
            $staff->update(collect($validated)->except(['services'])->toArray());

            // Sync services if provided
            if (isset($validated['services'])) {
                $staff->services()->sync($validated['services']);
            }

            // Update linked user account
            $user = User::where('email', $oldEmail)->first();
            if ($user) {
                $user->update([
                    'name'  => $staff->name,
                    'email' => $staff->email,
                    'phone' => $staff->phone,
                ]);
            }

            DB::commit();

            $staff->load('services:id,name');

            return response()->json([
                'success' => true,
                'message' => "Staff member '{$staff->name}' updated successfully!",
                'data'    => $staff->fresh()->toArray(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update staff member.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete staff member + their user account
     */
    public function destroy($id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        try {
            DB::beginTransaction();

            $staffName = $staff->name;
            $staffEmail = $staff->email;

            // Delete avatar file
            if ($staff->avatar) {
                Storage::disk('public')->delete($staff->avatar);
            }

            // Detach services
            $staff->services()->detach();

            // Delete staff record
            $staff->delete();

            // Permanently delete linked user account (force delete to free up email)
            if ($staffEmail) {
                User::where('email', $staffEmail)->forceDelete();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$staffName} has been removed successfully!",
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete staff member.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset staff password (Admin action)
     */
    public function resetPassword($id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $user = User::where('email', $staff->email)->first();

        if (!$user) {
            // Create user account if it doesn't exist
            $newPassword = 'staff' . rand(1000, 9999);

            User::create([
                'name'     => $staff->name,
                'email'    => $staff->email,
                'password' => bcrypt($newPassword),
                'role'     => 'staff',
                'phone'    => $staff->phone,
            ]);

            return response()->json([
                'success' => true,
                'message' => "User account created for {$staff->name}!",
                'login_credentials' => [
                    'email'    => $staff->email,
                    'password' => $newPassword,
                ]
            ]);
        }

        $newPassword = 'staff' . rand(1000, 9999);
        $user->update(['password' => bcrypt($newPassword)]);

        return response()->json([
            'success' => true,
            'message' => "Password reset for {$staff->name}!",
            'login_credentials' => [
                'email'    => $staff->email,
                'password' => $newPassword,
            ]
        ]);
    }
}