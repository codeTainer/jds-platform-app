import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/ui/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../notifications/NotificationsProvider';

function BellIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M14.857 17.082a2.997 2.997 0 0 1-5.714 0m9.857-2.653c-.822-.91-2.143-2.297-2.143-6.215a4.857 4.857 0 1 0-9.714 0c0 3.918-1.32 5.305-2.143 6.215A.857.857 0 0 0 5.636 16h12.728a.857.857 0 0 0 .636-1.571Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
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

export function DashboardLayout() {
    const { user, logout, isExco } = useAuth();
    const { notifications, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();
    const navigate = useNavigate();
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const menu = isExco
        ? [
              ['/dashboard/exco', 'Overview'],
              ['/dashboard/exco/cycles', 'Cycle Studio'],
              ['/dashboard/exco/applications', 'Applications'],
              ['/dashboard/exco/members', 'Members'],
              ['/dashboard/exco/savings', 'Savings Management'],
              ['/dashboard/exco/shareouts', 'Share-out Studio'],
              ['/dashboard/exco/loans', 'Loan Management'],
              ['/dashboard/member', 'My Profile'],
              ['/dashboard/member/savings', 'My Savings'],
              ['/dashboard/member/shareouts', 'My Share-outs'],
              ['/dashboard/member/loans', 'My Loans'],
          ]
        : [
              ['/dashboard/member', 'My Profile'],
              ['/dashboard/member/savings', 'Savings'],
              ['/dashboard/member/shareouts', 'Share-outs'],
              ['/dashboard/member/loans', 'Loans'],
              ['/dashboard/member/support', 'Support'],
          ];

    async function openNotifications() {
        setNotificationsOpen(true);
        await refresh();
    }

    async function handleNotificationClick(notificationId: string, actionUrl?: string | null) {
        await markRead(notificationId);

        if (actionUrl) {
            navigate(actionUrl);
            setNotificationsOpen(false);
        }
    }

    return (
        <div className="dashboard-shell">
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <BrandMark />
                    <div className="dashboard-sidebar__profile">
                        <div className="dashboard-sidebar__eyebrow">
                            {isExco ? 'EXCO dashboard' : 'Member dashboard'}
                        </div>
                        <div className="dashboard-sidebar__name">{user?.name}</div>
                        <div className="dashboard-sidebar__role">{user?.role}</div>
                    </div>

                    <nav className="dashboard-sidebar__nav">
                        {menu.map(([path, label]) => (
                            <NavLink
                                key={path}
                                className={({ isActive }) => isActive ? 'dashboard-nav-link dashboard-nav-link-active' : 'dashboard-nav-link dashboard-nav-link-idle'}
                                end={path === '/dashboard/exco' || path === '/dashboard/member'}
                                to={path}
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="dashboard-sidebar__actions">
                        <a
                            className="dashboard-sidebar__button dashboard-sidebar__button--light"
                            href="/swagger"
                            target="_blank"
                            rel="noreferrer"
                        >
                            API Docs
                        </a>
                        <button
                            className="dashboard-sidebar__button dashboard-sidebar__button--light"
                            onClick={async () => {
                                await logout();
                                navigate('/');
                            }}
                            type="button"
                        >
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-main__topbar">
                        <button
                            className="dashboard-notifications-trigger"
                            onClick={() => void openNotifications()}
                            type="button"
                        >
                            <BellIcon />
                            <span>Notifications</span>
                            {unreadCount > 0 ? (
                                <span className="dashboard-notifications-trigger__count">{unreadCount}</span>
                            ) : null}
                        </button>
                    </div>
                    <Outlet />
                </main>
            </div>

            {notificationsOpen ? (
                <div className="dashboard-notifications-overlay" onClick={() => setNotificationsOpen(false)} role="presentation">
                    <aside className="dashboard-notifications-drawer" onClick={(event) => event.stopPropagation()}>
                        <div className="dashboard-notifications-drawer__header">
                            <div>
                                <h2>Notifications</h2>
                                <p>{unreadCount} unread</p>
                            </div>
                            <div className="dashboard-notifications-drawer__actions">
                                <button
                                    className="dashboard-notifications-drawer__mark-all"
                                    disabled={unreadCount === 0}
                                    onClick={() => void markAllRead()}
                                    type="button"
                                >
                                    Mark all read
                                </button>
                                <button
                                    aria-label="Close notifications"
                                    className="dashboard-notifications-drawer__close"
                                    onClick={() => setNotificationsOpen(false)}
                                    type="button"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        <div className="dashboard-notifications-drawer__body">
                            {loading && notifications.length === 0 ? (
                                <p className="dashboard-notifications-empty">Loading notifications...</p>
                            ) : null}

                            {!loading && notifications.length === 0 ? (
                                <p className="dashboard-notifications-empty">No notifications yet.</p>
                            ) : null}

                            {notifications.map((notification) => (
                                <button
                                    className={`dashboard-notification-card ${!notification.read_at ? 'dashboard-notification-card--unread' : ''}`}
                                    key={notification.id}
                                    onClick={() => void handleNotificationClick(notification.id, notification.action_url)}
                                    type="button"
                                >
                                    <div className={`dashboard-notification-card__icon dashboard-notification-card__icon--${notification.category}`}>
                                        {categoryLabel(notification.category).slice(0, 1)}
                                    </div>
                                    <div className="dashboard-notification-card__content">
                                        <div className="dashboard-notification-card__meta">
                                            <span className="dashboard-notification-card__category">{categoryLabel(notification.category)}</span>
                                            {!notification.read_at ? (
                                                <span className="dashboard-notification-card__badge">New</span>
                                            ) : null}
                                        </div>
                                        <h3>{notification.title}</h3>
                                        <p>{notification.message}</p>
                                        <div className="dashboard-notification-card__footer">
                                            <span>{formatNotificationDate(notification.created_at)}</span>
                                            {notification.action_label ? <strong>{notification.action_label}</strong> : null}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            ) : null}
        </div>
    );
}
