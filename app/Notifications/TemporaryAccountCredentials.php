<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TemporaryAccountCredentials extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $temporaryPassword
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        /** @var User $notifiable */
        return (new MailMessage)
            ->subject('Your JDS Platform Temporary Account')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('A JDS Platform account has been created for you.')
            ->line('Email: ' . $notifiable->email)
            ->line('Temporary password: ' . $this->temporaryPassword)
            ->line('Please sign in and change this password immediately. You will be required to do so before using the platform.')
            ->action('Open JDS Platform', rtrim((string) config('app.url'), '/') . '/')
            ->line('If you were not expecting this account, please contact JDS management.');
    }
}
