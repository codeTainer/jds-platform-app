import { Navigate, Route, Routes } from 'react-router-dom';
import { ApplicationsSection } from '../sections/exco/ApplicationsSection';
import { CycleStudioSection } from '../sections/exco/CycleStudioSection';
import { LoansSection } from '../sections/exco/LoansSection';
import { MembersSection } from '../sections/exco/MembersSection';
import { OverviewSection } from '../sections/exco/OverviewSection';
import { ReportsSection } from '../sections/exco/ReportsSection';
import { ShareoutStudioSection } from '../sections/exco/ShareoutStudioSection';
import { SavingsDeskSection } from '../sections/exco/SavingsDeskSection';
import { SupportDeskSection } from '../sections/exco/SupportDeskSection';

export function ExcoDashboardPage() {
    return (
        <Routes>
            <Route element={<OverviewSection />} index />
            <Route element={<CycleStudioSection />} path="cycles" />
            <Route element={<ApplicationsSection />} path="applications" />
            <Route element={<MembersSection />} path="members" />
            <Route element={<SavingsDeskSection />} path="savings" />
            <Route element={<ShareoutStudioSection />} path="shareouts" />
            <Route element={<LoansSection />} path="loans" />
            <Route element={<SupportDeskSection />} path="support" />
            <Route element={<ReportsSection />} path="reports" />
            <Route element={<Navigate replace to="/dashboard/exco" />} path="*" />
        </Routes>
    );
}
