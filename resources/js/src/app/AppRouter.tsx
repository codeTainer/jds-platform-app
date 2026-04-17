import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LandingPage } from '../pages/LandingPage';
import { ExcoDashboardPage } from '../pages/ExcoDashboardPage';
import { MemberDashboardPage } from '../pages/MemberDashboardPage';
import { ForcePasswordChangePage } from '../pages/ForcePasswordChangePage';
import { useAppearance } from '../appearance/AppearanceProvider';

export function AppRouter() {
    const { booting, signedIn, isExco, hasMemberProfile, mustChangePassword } = useAuth();
    const { branding } = useAppearance();

    if (booting) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--sand)]">
                <div className="rounded-[32px] border border-white/70 bg-white/85 px-8 py-6 shadow-[0_24px_80px_rgba(70,57,28,0.12)]">
                    Loading {branding.app_name}...
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={signedIn ? <Navigate replace to={mustChangePassword ? '/auth/change-password' : isExco ? '/dashboard/exco' : '/dashboard/member'} /> : <LandingPage />} />
            <Route path="/auth/change-password" element={signedIn ? <ForcePasswordChangePage /> : <Navigate replace to="/" />} />
            <Route path="/dashboard" element={signedIn ? (mustChangePassword ? <Navigate replace to="/auth/change-password" /> : <DashboardLayout />) : <Navigate replace to="/" />}>
                <Route path="exco/*" element={isExco ? <ExcoDashboardPage /> : <Navigate replace to="/dashboard/member" />} />
                <Route path="member/*" element={hasMemberProfile ? <MemberDashboardPage /> : <Navigate replace to={isExco ? '/dashboard/exco' : '/'} />} />
            </Route>
            <Route path="*" element={<Navigate replace to={signedIn ? (mustChangePassword ? '/auth/change-password' : isExco ? '/dashboard/exco' : '/dashboard/member') : '/'} />} />
        </Routes>
    );
}
