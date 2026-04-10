<?php

namespace App\Support;

use App\Models\Member;
use App\Models\User;
use App\Notifications\InAppProcessNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

class ProcessNotifier
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public function notifyUser(
        User $user,
        string $title,
        string $message,
        string $category,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
        string $level = 'info',
        array $meta = [],
    ): void {
        $user->notify(new InAppProcessNotification(
            title: $title,
            message: $message,
            category: $category,
            actionUrl: $actionUrl,
            actionLabel: $actionLabel,
            level: $level,
            meta: $meta,
        ));
    }

    /**
     * @param  iterable<int, User>|Collection<int, User>  $users
     * @param  array<string, mixed>  $meta
     */
    public function notifyUsers(
        iterable $users,
        string $title,
        string $message,
        string $category,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
        string $level = 'info',
        array $meta = [],
    ): void {
        Notification::send($users, new InAppProcessNotification(
            title: $title,
            message: $message,
            category: $category,
            actionUrl: $actionUrl,
            actionLabel: $actionLabel,
            level: $level,
            meta: $meta,
        ));
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public function notifyExco(
        string $title,
        string $message,
        string $category,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
        string $level = 'info',
        array $meta = [],
        ?int $exceptUserId = null,
    ): void {
        $users = User::query()
            ->whereIn('role', [
                User::ROLE_CHAIRPERSON,
                User::ROLE_SECRETARY,
                User::ROLE_TREASURER,
                User::ROLE_SUPPORT,
            ])
            ->when($exceptUserId, fn ($query) => $query->whereKeyNot($exceptUserId))
            ->get();

        if ($users->isEmpty()) {
            return;
        }

        $this->notifyUsers($users, $title, $message, $category, $actionUrl, $actionLabel, $level, $meta);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public function notifyMember(
        ?Member $member,
        string $title,
        string $message,
        string $category,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
        string $level = 'info',
        array $meta = [],
    ): void {
        if (! $member) {
            return;
        }

        $user = $member->relationLoaded('user')
            ? $member->user
            : $member->user()->first();

        if (! $user) {
            return;
        }

        $this->notifyUser($user, $title, $message, $category, $actionUrl, $actionLabel, $level, $meta);
    }
}
