import { useEffect, useMemo, useState } from 'react';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { api } from '../../lib/api';
import type { Member, MemberApplication, MembershipCycle, PaginatedResponse } from '../../types';

export function OverviewSection() {
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [applications, setApplications] = useState<MemberApplication[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            api.get<MembershipCycle[]>('/api/exco/membership-cycles'),
            api.get<MemberApplication[]>('/api/exco/member-applications'),
            api.get<PaginatedResponse<Member>>('/api/exco/members', { params: { page: 1, per_page: 1 } }),
        ]).then(([cyclesResponse, applicationsResponse, membersResponse]) => {
            setCycles(cyclesResponse.data);
            setApplications(applicationsResponse.data);
            setMemberCount(membersResponse.data.total);
        }).catch((requestError: any) => {
            setError(requestError.response?.data?.message ?? 'Unable to load the EXCO dashboard right now.');
        });
    }, []);

    const activeCycle = useMemo(() => cycles.find((cycle) => cycle.is_active) ?? null, [cycles]);
    const pendingApplications = useMemo(() => applications.filter((application) => application.status === 'pending_review'), [applications]);

    return (
        <div>
            <PageHeader
                description="This dashboard is structured for your daily EXCO work: activate the current cycle, review new member applications, and monitor how many members are already inside the platform."
                eyebrow="Executive workspace"
                title="Oversee onboarding, members and annual cycle controls."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Active cycle" value={activeCycle?.code ?? 'Not set'} />
                <SummaryCard label="Pending applications" value={String(pendingApplications.length)} />
                <SummaryCard label="Members on platform" value={String(memberCount)} />
                <SummaryCard label="Cycle share price" value={activeCycle ? formatCurrency(activeCycle.share_price) : 'Pending'} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Panel eyebrow="Live cycle" title={activeCycle?.name ?? 'No active cycle'}>
                    {activeCycle ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <div className="text-[1rem] font-semibold">Onboarding window</div>
                                <div className="mt-2 text-[0.98rem] leading-7 text-[var(--muted)]">
                                    {formatDate(activeCycle.onboarding_opens_at)} to {formatDate(activeCycle.onboarding_closes_at)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[1rem] font-semibold">Application intake</div>
                                <div className="mt-2">
                                    <StatusBadge active={activeCycle.accepting_new_applications}>
                                        {activeCycle.accepting_new_applications ? 'Open' : 'Closed'}
                                    </StatusBadge>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Notice>No active cycle has been configured yet.</Notice>
                    )}
                </Panel>

                <Panel eyebrow="Queue" title="Applications awaiting review">
                    <div className="space-y-3">
                        {pendingApplications.length ? pendingApplications.slice(0, 4).map((application) => (
                            <div key={application.id} className="rounded-[22px] border border-[rgba(23,55,45,0.08)] bg-[rgba(247,250,248,1)] px-4 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[1rem] font-semibold">{application.full_name}</div>
                                        <div className="mt-1 text-[0.96rem] text-[var(--muted)]">{application.email}</div>
                                    </div>
                                    <StatusBadge active>{application.status.replace('_', ' ')}</StatusBadge>
                                </div>
                            </div>
                        )) : <Notice>No pending applications right now.</Notice>}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
