<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $limit = min(max($request->integer('limit', 20), 1), 50);

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'notifications' => $user->notifications()
                ->latest()
                ->limit($limit)
                ->get()
                ->map(fn (DatabaseNotification $notification) => $this->transformNotification($notification))
                ->values(),
        ]);
    }

    public function markRead(Request $request, DatabaseNotification $notification)
    {
        $this->ensureOwnership($request, $notification);

        if (! $notification->read_at) {
            $notification->markAsRead();
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => $this->transformNotification($notification->fresh()),
        ]);
    }

    public function markAllRead(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $user->unreadNotifications()->update([
            'read_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    private function ensureOwnership(Request $request, DatabaseNotification $notification): void
    {
        /** @var User $user */
        $user = $request->user();

        if ($notification->notifiable_type !== User::class || (int) $notification->notifiable_id !== (int) $user->id) {
            abort(403, 'You are not authorized to access this notification.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function transformNotification(DatabaseNotification $notification): array
    {
        $data = is_array($notification->data) ? $notification->data : [];

        return [
            'id' => $notification->id,
            'title' => $data['title'] ?? 'Notification',
            'message' => $data['message'] ?? '',
            'category' => $data['category'] ?? 'general',
            'action_url' => $data['action_url'] ?? null,
            'action_label' => $data['action_label'] ?? null,
            'level' => $data['level'] ?? 'info',
            'meta' => $data['meta'] ?? [],
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
        ];
    }
}
