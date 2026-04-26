import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppearance } from '../appearance/AppearanceProvider';

const LandingPage = lazy(() => import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const ExcoDashboardPage = lazy(() => import('../pages/ExcoDashboardPage').then((module) => ({ default: module.ExcoDashboardPage })));
const MemberDashboardPage = lazy(() => import('../pages/MemberDashboardPage').then((module) => ({ default: module.MemberDashboardPage })));
const ForcePasswordChangePage = lazy(() => import('../pages/ForcePasswordChangePage').then((module) => ({ default: module.ForcePasswordChangePage })));

function RouteFallback() {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-[32px] border border-[rgba(255,255,255,0.18)] bg-[var(--panel)]/85 px-8 py-6 text-[var(--ink)] shadow-[0_24px_80px_rgba(7,20,36,0.18)]">
            Loading workspace...
        </div>
    );
}

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
        <Suspense fallback={<RouteFallback />}>
            <Routes>
                <Route path="/" element={signedIn ? <Navigate replace to={mustChangePassword ? '/auth/change-password' : isExco ? '/dashboard/exco' : '/dashboard/member'} /> : <LandingPage />} />
                <Route path="/auth/change-password" element={signedIn ? <ForcePasswordChangePage /> : <Navigate replace to="/" />} />
                <Route path="/dashboard" element={signedIn ? (mustChangePassword ? <Navigate replace to="/auth/change-password" /> : <DashboardLayout />) : <Navigate replace to="/" />}>
                    <Route path="exco/*" element={isExco ? <ExcoDashboardPage /> : <Navigate replace to="/dashboard/member" />} />
                    <Route path="member/*" element={hasMemberProfile ? <MemberDashboardPage /> : <Navigate replace to={isExco ? '/dashboard/exco' : '/'} />} />
                </Route>
                <Route path="*" element={<Navigate replace to={signedIn ? (mustChangePassword ? '/auth/change-password' : isExco ? '/dashboard/exco' : '/dashboard/member') : '/'} />} />
            </Routes>
        </Suspense>
    );
}
