import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/ui/BrandMark';
import { useAuth } from '../auth/AuthContext';

export function DashboardLayout() {
    const { user, logout, isExco } = useAuth();
    const navigate = useNavigate();

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
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
