import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/ui/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../notifications/NotificationsProvider';

type MenuItem = {
    path: string;
    label: string;
    icon: JSX.Element;
};

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

function OverviewIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M4.5 4.5h6v6h-6zm9 0h6v10.5h-6zm-9 9h6v6h-6zm9 4.5h6V19.5h-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function CycleIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M12 4.5v3m0 9v3m7.5-7.5h-3m-9 0h-3m10.303-5.303-2.12 2.12m-4.363 4.363-2.12 2.12m8.603 0-2.12-2.12m-4.363-4.363-2.12-2.12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    );
}

function ApplicationIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M7.5 4.5h7.75L19.5 8.75V18a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 6 18V6A1.5 1.5 0 0 1 7.5 4.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M15 4.5V9h4.5M9 12h6m-6 3h4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function MembersIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M12 13.25a3.75 3.75 0 1 0-3.75-3.75A3.75 3.75 0 0 0 12 13.25Zm-6.75 6a6.75 6.75 0 0 1 13.5 0M18.5 6.75h2.25m-1.125-1.125v2.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function SavingsIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M4.5 7.5h15v9h-15z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M4.5 10.5h15M9 13.5h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function ShareoutIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M12 4.5v15m0-15 4.5 4.5M12 4.5 7.5 9m9 10.5h-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function LoanIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M6 9.5h9.5a3.5 3.5 0 1 1 0 7H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="m10 6.5-4 3 4 3m4 5 4-3-4-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function ExitIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M10.5 6H7.5A1.5 1.5 0 0 0 6 7.5v9A1.5 1.5 0 0 0 7.5 18h3m4.5-3 3-3m0 0-3-3m3 3H10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function ProfileIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M12 12.75a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12.75Zm-7 6.75a7 7 0 0 1 14 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function AuditIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M7.5 4.5h9A1.5 1.5 0 0 1 18 6v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18V6a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M9 9h6m-6 3h6m-6 3h3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function ReportsIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M6 18.5V12m6 6.5V6m6 12.5V9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M4.5 19.5h15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function SupportIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M8.25 9.75a3.75 3.75 0 1 1 5.52 3.3c-.93.49-1.77 1.17-1.77 2.2v.5M12 18.75h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
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

    const menu: MenuItem[] = isExco
        ? [
              { path: '/dashboard/exco', label: 'Overview', icon: <OverviewIcon /> },
              { path: '/dashboard/exco/cycles', label: 'Cycle Studio', icon: <CycleIcon /> },
              { path: '/dashboard/exco/applications', label: 'Applications', icon: <ApplicationIcon /> },
              { path: '/dashboard/exco/members', label: 'Members', icon: <MembersIcon /> },
              { path: '/dashboard/exco/savings', label: 'Savings Management', icon: <SavingsIcon /> },
              { path: '/dashboard/exco/shareouts', label: 'Share-out Studio', icon: <ShareoutIcon /> },
              { path: '/dashboard/exco/loans', label: 'Loan Management', icon: <LoanIcon /> },
              { path: '/dashboard/exco/exits', label: 'Exit Desk', icon: <ExitIcon /> },
              { path: '/dashboard/member', label: 'My Profile', icon: <ProfileIcon /> },
              { path: '/dashboard/member/savings', label: 'My Savings', icon: <SavingsIcon /> },
              { path: '/dashboard/member/shareouts', label: 'My Share-outs', icon: <ShareoutIcon /> },
              { path: '/dashboard/member/loans', label: 'My Loans', icon: <LoanIcon /> },
              { path: '/dashboard/member/exits', label: 'My Exit Requests', icon: <ExitIcon /> },
              { path: '/dashboard/exco/audit', label: 'Audit Trail', icon: <AuditIcon /> },
              { path: '/dashboard/exco/reports', label: 'Reports', icon: <ReportsIcon /> },
              { path: '/dashboard/exco/support', label: 'Support Desk', icon: <SupportIcon /> },
          ]
        : [
              { path: '/dashboard/member', label: 'My Profile', icon: <ProfileIcon /> },
              { path: '/dashboard/member/savings', label: 'Savings', icon: <SavingsIcon /> },
              { path: '/dashboard/member/shareouts', label: 'Share-outs', icon: <ShareoutIcon /> },
              { path: '/dashboard/member/loans', label: 'Loans', icon: <LoanIcon /> },
              { path: '/dashboard/member/exits', label: 'Exit Requests', icon: <ExitIcon /> },
              { path: '/dashboard/member/support', label: 'Support', icon: <SupportIcon /> },
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
                        {menu.map(({ path, label, icon }) => (
                            <NavLink
                                key={path}
                                className={({ isActive }) => isActive ? 'dashboard-nav-link dashboard-nav-link-active' : 'dashboard-nav-link dashboard-nav-link-idle'}
                                end={path === '/dashboard/exco' || path === '/dashboard/member'}
                                to={path}
                            >
                                <span className="dashboard-nav-link__icon">{icon}</span>
                                <span>{label}</span>
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
