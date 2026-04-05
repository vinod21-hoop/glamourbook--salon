<?php
// app/Http/Controllers/Admin/SettingsController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get all settings grouped
     */
    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get()
            ->groupBy('group')
            ->map(fn($group) => $group->map(fn($s) => [
                'id'          => $s->id,
                'key'         => $s->key,
                'value'       => $s->type === 'json' ? json_decode($s->value, true) : $s->value,
                'type'        => $s->type,
                'label'       => $s->label,
                'description' => $s->description,
                'is_public'   => $s->is_public,
            ]));

        return response()->json([
            'success' => true,
            'data'    => $settings,
        ]);
    }

    /**
     * Get public settings (for frontend)
     */
    public function publicSettings(): JsonResponse
    {
        $settings = Setting::public()->get()
            ->mapWithKeys(fn($s) => [
                $s->key => $s->type === 'json'
                    ? json_decode($s->value, true)
                    : $s->value
            ]);

        return response()->json([
            'success' => true,
            'data'    => $settings,
        ]);
    }

    /**
     * Update a setting
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'key'   => 'required|string',
            'value' => 'required',
        ]);

        $setting = Setting::where('key', $request->key)->first();
        $type = $setting?->type ?? 'string';

        Setting::set($request->key, $request->value, $type, [
            'label'       => $request->label ?? $setting?->label,
            'description' => $request->description ?? $setting?->description,
            'group'       => $request->group ?? $setting?->group ?? 'general',
            'is_public'   => $request->is_public ?? $setting?->is_public ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Setting updated successfully',
        ]);
    }

    /**
     * Bulk update settings
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string',
            'settings.*.value' => 'required',
        ]);

        foreach ($request->settings as $item) {
            $existing = Setting::where('key', $item['key'])->first();
            Setting::set(
                $item['key'],
                $item['value'],
                $item['type'] ?? $existing?->type ?? 'string'
            );
        }

        return response()->json([
            'success' => true,
            'message' => count($request->settings) . ' settings updated',
        ]);
    }
}