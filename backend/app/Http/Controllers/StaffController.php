<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\JsonResponse;

class StaffController extends Controller
{
    /**
     * Public: List all active staff
     */
    public function index(): JsonResponse
    {
        $staff = Staff::where('is_active', true)
            ->with('services:id,name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }

    /**
     * Public: Get single staff member
     */
    public function show($id): JsonResponse
    {
        $staff = Staff::where('is_active', true)
            ->with('services:id,name')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }
}