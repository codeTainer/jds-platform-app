import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const ApplicationsSection = lazy(() => import('../sections/exco/ApplicationsSection').then((module) => ({ default: module.ApplicationsSection })));
const AppearanceSection = lazy(() => import('../sections/exco/AppearanceSection').then((module) => ({ default: module.AppearanceSection })));
const AuditLogSection = lazy(() => import('../sections/exco/AuditLogSection').then((module) => ({ default: module.AuditLogSection })));
const CycleStudioSection = lazy(() => import('../sections/exco/CycleStudioSection').then((module) => ({ default: module.CycleStudioSection })));
const ExitDeskSection = lazy(() => import('../sections/exco/ExitDeskSection').then((module) => ({ default: module.ExitDeskSection })));
const LoansSection = lazy(() => import('../sections/exco/LoansSection').then((module) => ({ default: module.LoansSection })));
const MembersSection = lazy(() => import('../sections/exco/MembersSection').then((module) => ({ default: module.MembersSection })));
const OverviewSection = lazy(() => import('../sections/exco/OverviewSection').then((module) => ({ default: module.OverviewSection })));
const ReportsSection = lazy(() => import('../sections/exco/ReportsSection').then((module) => ({ default: module.ReportsSection })));
const ShareoutStudioSection = lazy(() => import('../sections/exco/ShareoutStudioSection').then((module) => ({ default: module.ShareoutStudioSection })));
const SavingsDeskSection = lazy(() => import('../sections/exco/SavingsDeskSection').then((module) => ({ default: module.SavingsDeskSection })));
const SupportDeskSection = lazy(() => import('../sections/exco/SupportDeskSection').then((module) => ({ default: module.SupportDeskSection })));
const AccountSection = lazy(() => import('../sections/shared/AccountSection').then((module) => ({ default: module.AccountSection })));
const NotificationsSection = lazy(() => import('../sections/shared/NotificationsSection').then((module) => ({ default: module.NotificationsSection })));

function ExcoRouteFallback() {
    return <div className="rounded-[28px] border border-[rgba(255,255,255,0.14)] bg-[var(--panel)]/88 px-6 py-5 text-[var(--muted)]">Loading section...</div>;
}

export function ExcoDashboardPage() {
    return (
        <Suspense fallback={<ExcoRouteFallback />}>
            <Routes>
                <Route element={<OverviewSection />} index />
                <Route element={<AccountSection />} path="account" />
                <Route element={<AppearanceSection />} path="appearance" />
                <Route element={<CycleStudioSection />} path="cycles" />
                <Route element={<ApplicationsSection />} path="applications" />
                <Route element={<MembersSection />} path="members" />
                <Route element={<SavingsDeskSection />} path="savings" />
                <Route element={<ShareoutStudioSection />} path="shareouts" />
                <Route element={<LoansSection />} path="loans" />
                <Route element={<ExitDeskSection />} path="exits" />
                <Route element={<NotificationsSection />} path="notifications" />
                <Route element={<AuditLogSection />} path="audit" />
                <Route element={<SupportDeskSection />} path="support" />
                <Route element={<ReportsSection />} path="reports" />
                <Route element={<Navigate replace to="/dashboard/exco" />} path="*" />
            </Routes>
        </Suspense>
    );
}
