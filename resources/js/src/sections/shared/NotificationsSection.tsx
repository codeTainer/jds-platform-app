import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { useNotifications } from '../../notifications/NotificationsProvider';
import { api } from '../../lib/api';
import type { AppNotification, NotificationListResponse } from '../../types';

function ViewIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M2.25 12s3.75-6 9.75-6 9.75 6 9.75 6-3.75 6-9.75 6-9.75-6-9.75-6Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <circle cx="12" cy="12" fill="currentColor" r="2.4" />
        </svg>
    );
}

function categoryLabel(category: string) {
    switch (category) {
        case 'shares':
            return 'Shares';
        case 'fees':
            return 'Fees';
        case 'loans':
            return 'Loans';
        case 'security':
            return 'Security';
        case 'accounts':
            return 'Accounts';
        default:
            return 'General';
    }
}

function formatNotificationDate(value?: string | null) {
    if (!value) {
        return 'Just now';
    }

    return new Date(value).toLocaleString('en-NG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function truncateText(value: string, maxLength = 96) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength).trim()}...`;
}

export function NotificationsSection() {
    const navigate = useNavigate();
    const { unreadCount, markRead, markAllRead, refresh } = useNotifications();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function loadNotifications(nextPage = page, nextPerPage = perPage) {
        setLoading(true);
        setError('');

        try {
            const { data } = await api.get<NotificationListResponse>('/api/notifications', {
                params: {
                    page: nextPage,
                    per_page: nextPerPage,
                },
            });

            setNotifications(data.notifications);
            setPage(data.pagination?.current_page ?? nextPage);
            setPerPage(data.pagination?.per_page ?? nextPerPage);
            setLastPage(data.pagination?.last_page ?? 1);
            setTotal(data.pagination?.total ?? data.notifications.length);
            setSelectedNotification((current) => {
                if (current && data.notifications.some((notification) => notification.id === current.id)) {
                    return data.notifications.find((notification) => notification.id === current.id) ?? current;
                }

                return current;
            });
        } catch (requestError: any) {
            setError(requestError.response?.data?.message ?? 'Unable to load notifications right now.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadNotifications(1, perPage);
    }, []);

    async function handleMarkAllRead() {
        await markAllRead();
        await refresh();
        await loadNotifications(page, perPage);
    }

    async function handleMarkRead(notification: AppNotification) {
        await markRead(notification.id);
        await refresh();
        await loadNotifications(page, perPage);
        setSelectedNotification((current) => current?.id === notification.id
            ? { ...notification, read_at: notification.read_at ?? new Date().toISOString() }
            : current);
    }

    async function handleOpenNotification(notification: AppNotification) {
        if (!notification.read_at) {
            await handleMarkRead(notification);
        }

        if (notification.action_url) {
            navigate(notification.action_url);
        }
    }

    return (
        <div>
            <PageHeader
                description="Review every system notification in one place, mark items as read, and open the linked workflow whenever you need to follow up."
                eyebrow="Notifications"
                title="Track all your in-app notifications."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <Panel
                action={(
                    <button
                        className="dashboard-notifications-drawer__mark-all"
                        disabled={unreadCount === 0}
                        onClick={() => void handleMarkAllRead()}
                        type="button"
                    >
                        Mark all read
                    </button>
                )}
                eyebrow="Notification register"
                title="All notifications"
            >
                {loading && !notifications.length ? <Notice>Loading notifications...</Notice> : null}

                {!loading || notifications.length ? (
                    <DataTable
                        columns={[
                            { key: 'title', header: 'Title', render: (notification) => notification.title },
                            { key: 'category', header: 'Category', render: (notification) => categoryLabel(notification.category) },
                            { key: 'message', header: 'Message', render: (notification) => truncateText(notification.message) },
                            { key: 'status', header: 'Status', render: (notification) => notification.read_at ? 'Read' : 'Unread' },
                            { key: 'received', header: 'Received', render: (notification) => formatNotificationDate(notification.created_at) },
                            {
                                key: 'action',
                                header: 'Action',
                                exportable: false,
                                render: (notification) => (
                                    <button
                                        aria-label={`View notification ${notification.title}`}
                                        className="app-icon-button"
                                        onClick={() => setSelectedNotification(notification)}
                                        title="View notification"
                                        type="button"
                                    >
                                        <ViewIcon />
                                    </button>
                                ),
                            },
                        ]}
                        currentPage={page}
                        currentPerPage={perPage}
                        emptyMessage="No notifications have been recorded yet."
                        exportFilename="notifications.csv"
                        filterPlaceholder="Filter notifications"
                        onPageChange={(nextPage) => void loadNotifications(nextPage, perPage)}
                        onPerPageChange={(value) => {
                            setPage(1);
                            setPerPage(value);
                            void loadNotifications(1, value);
                        }}
                        rowKey={(notification) => notification.id}
                        rows={notifications}
                        totalItems={total}
                        totalPages={lastPage}
                    />
                ) : null}
            </Panel>

            {selectedNotification ? (
                <div
                    className="constitution-modal-backdrop"
                    onClick={() => setSelectedNotification(null)}
                    role="presentation"
                >
                    <div
                        className="constitution-modal constitution-modal--narrow notification-detail-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="constitution-modal__header">
                            <div>
                                <p className="constitution-modal__eyebrow">{categoryLabel(selectedNotification.category)}</p>
                                <h3>{selectedNotification.title}</h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={() => setSelectedNotification(null)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>
                        <div className="constitution-modal__body">
                            <div className="notification-detail-modal__meta">
                                <span className={`notification-detail-modal__status${selectedNotification.read_at ? '' : ' notification-detail-modal__status--unread'}`}>
                                    {selectedNotification.read_at ? 'Read' : 'Unread'}
                                </span>
                                <span>{formatNotificationDate(selectedNotification.created_at)}</span>
                            </div>
                            <p className="notification-detail-modal__message">{selectedNotification.message}</p>
                            <div className="notification-detail-modal__actions">
                                {!selectedNotification.read_at ? (
                                    <button
                                        className="landing-btn landing-btn--secondary"
                                        onClick={() => void handleMarkRead(selectedNotification)}
                                        type="button"
                                    >
                                        Mark as read
                                    </button>
                                ) : null}
                                {selectedNotification.action_url ? (
                                    <button
                                        className="landing-btn landing-btn--primary"
                                        onClick={() => void handleOpenNotification(selectedNotification)}
                                        type="button"
                                    >
                                        {selectedNotification.action_label ?? 'Open notification'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
