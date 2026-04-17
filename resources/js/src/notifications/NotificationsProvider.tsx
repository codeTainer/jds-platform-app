import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import type { AppNotification, NotificationListResponse } from '../types';

interface NotificationsContextValue {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    refresh: () => Promise<void>;
    markRead: (notificationId: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { signedIn } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    async function refresh() {
        if (!signedIn) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.get<NotificationListResponse>('/api/notifications', {
                params: {
                    unread_only: true,
                    per_page: 20,
                },
            });
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } finally {
            setLoading(false);
        }
    }

    async function markRead(notificationId: string) {
        const target = notifications.find((notification) => notification.id === notificationId);

        if (target?.read_at) {
            return;
        }

        await api.patch(`/api/notifications/${notificationId}/read`);
        setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
        setUnreadCount((current) => Math.max(current - 1, 0));
    }

    async function markAllRead() {
        await api.post('/api/notifications/mark-all-read');
        setNotifications([]);
        setUnreadCount(0);
    }

    useEffect(() => {
        void refresh();

        if (!signedIn) {
            return;
        }

        const interval = window.setInterval(() => {
            void refresh();
        }, 15000);

        return () => window.clearInterval(interval);
    }, [signedIn]);

    const value = useMemo<NotificationsContextValue>(() => ({
        notifications,
        unreadCount,
        loading,
        refresh,
        markRead,
        markAllRead,
    }), [loading, notifications, unreadCount]);

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);

    if (!context) {
        throw new Error('useNotifications must be used inside NotificationsProvider.');
    }

    return context;
}
