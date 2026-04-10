<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InAppProcessNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly string $category,
        private readonly ?string $actionUrl = null,
        private readonly ?string $actionLabel = null,
        private readonly string $level = 'info',
        private readonly array $meta = [],
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'category' => $this->category,
            'action_url' => $this->actionUrl,
            'action_label' => $this->actionLabel,
            'level' => $this->level,
            'meta' => $this->meta,
        ];
    }
}
