<?php
// app/Http/Controllers/NotificationController.php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function index(): JsonResponse
    {
        $notifications = $this->notificationService->getUnread(auth()->id());

        return response()->json([
            'success' => true,
            'data'    => $notifications,
        ]);
    }

    public function markRead(int $id): JsonResponse
    {
        $this->notificationService->markAsRead($id);

        return response()->json(['success' => true]);
    }

    public function markAllRead(): JsonResponse
    {
        $this->notificationService->markAllAsRead(auth()->id());

        return response()->json(['success' => true]);
    }
}