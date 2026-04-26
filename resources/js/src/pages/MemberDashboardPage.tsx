import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MemberExitSection } from '../sections/member/ExitSection';
import { SupportSection } from '../sections/member/SupportSection';

const MemberHomeSection = lazy(() => import('../sections/member/MemberHomeSection').then((module) => ({ default: module.MemberHomeSection })));
const MemberLoansSection = lazy(() => import('../sections/member/MemberLoansSection').then((module) => ({ default: module.MemberLoansSection })));
const MemberSavingsSection = lazy(() => import('../sections/member/MemberSavingsSection').then((module) => ({ default: module.MemberSavingsSection })));
const MemberShareoutsSection = lazy(() => import('../sections/member/MemberShareoutsSection').then((module) => ({ default: module.MemberShareoutsSection })));
const AccountSection = lazy(() => import('../sections/shared/AccountSection').then((module) => ({ default: module.AccountSection })));
const NotificationsSection = lazy(() => import('../sections/shared/NotificationsSection').then((module) => ({ default: module.NotificationsSection })));

function MemberRouteFallback() {
    return <div className="rounded-[28px] border border-[rgba(255,255,255,0.14)] bg-[var(--panel)]/88 px-6 py-5 text-[var(--muted)]">Loading section...</div>;
}

export function MemberDashboardPage() {
    const { user } = useAuth();

    return (
        <Suspense fallback={<MemberRouteFallback />}>
            <Routes>
                <Route element={<MemberHomeSection name={user?.member?.full_name ?? user?.name ?? 'member'} />} index />
                <Route element={<AccountSection />} path="account" />
                <Route element={<MemberSavingsSection />} path="savings" />
                <Route element={<MemberShareoutsSection />} path="shareouts" />
                <Route element={<MemberLoansSection />} path="loans" />
                <Route element={<MemberExitSection />} path="exits" />
                <Route element={<NotificationsSection />} path="notifications" />
                <Route element={<SupportSection />} path="support" />
                <Route element={<Navigate replace to="/dashboard/member" />} path="*" />
            </Routes>
        </Suspense>
    );
}
