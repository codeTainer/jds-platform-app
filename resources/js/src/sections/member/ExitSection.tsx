import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { useToast } from '../../feedback/ToastProvider';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { MemberExitOverview, MemberExitRequest, PaginatedResponse } from '../../types';

type MemberExitTab = 'overview' | 'request-exit' | 'history';

const memberExitTabs: Array<{ id: MemberExitTab; label: string; description: string }> = [
    {
        id: 'overview',
        label: 'Overview',
        description: 'See your current saved value, any outstanding loan balance, and the current estimate of what could be refunded on exit.',
    },
    {
        id: 'request-exit',
        label: 'Request Exit',
        description: 'Submit a formal exit request for EXCO review with the date you gave notice and the date you want to leave the cooperative.',
    },
    {
        id: 'history',
        label: 'Exit History',
        description: 'Track every exit request you have submitted, including EXCO notes, refund estimate, and completion status.',
    },
];

const initialExitForm = {
    notice_given_on: '',
    requested_exit_on: '',
    notes: '',
};

export function MemberExitSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<MemberExitTab>('overview');
    const [overview, setOverview] = useState<MemberExitOverview | null>(null);
    const [requests, setRequests] = useState<PaginatedResponse<MemberExitRequest> | null>(null);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(initialExitForm);

    const activeMemberExitTab = memberExitTabs.find((tab) => tab.id === activeTab) ?? memberExitTabs[0];
    const selectedRequest = requests?.data.find((request) => request.id === selectedRequestId) ?? null;
    const hasOpenWorkflow = ['pending', 'in_review', 'approved'].includes(overview?.summary.latest_exit_request_status ?? '');
    const memberCanRequestExit = overview?.member.membership_status === 'active' && !hasOpenWorkflow;

    const loadOverview = async () => {
        const { data } = await api.get<MemberExitOverview>('/api/member/exit-requests/overview');
        setOverview(data);
    };

    const loadRequests = async (nextPage = page) => {
        const { data } = await api.get<PaginatedResponse<MemberExitRequest>>('/api/member/exit-requests', {
            params: {
                page: nextPage,
                per_page: 10,
                status: statusFilter || undefined,
            },
        });

        setRequests(data);
        setPage(data.current_page);
        setSelectedRequestId((current) => {
            if (current && data.data.some((request) => request.id === current)) {
                return current;
            }

            return data.data[0]?.id ?? null;
        });
    };

    useEffect(() => {
        Promise.all([loadOverview(), loadRequests(1)])
            .catch((requestError: any) => {
                setError(requestError.response?.data?.message ?? 'Unable to load exit request information right now.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadRequests(1);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [statusFilter]);

    async function submitExitRequest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!memberCanRequestExit) {
            showToast('You cannot submit a new exit request right now.', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await api.post<{ message: string; exit_request: MemberExitRequest }>('/api/member/exit-requests', {
                notice_given_on: form.notice_given_on,
                requested_exit_on: form.requested_exit_on,
                notes: form.notes || null,
            });
            showToast(data.message, 'success');
            setForm(initialExitForm);
            await Promise.all([loadOverview(), loadRequests(1)]);
            setSelectedRequestId(data.exit_request.id);
            setActiveTab('history');
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to submit your exit request right now.', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <PageHeader
                description="Use this workspace when you want to leave the cooperative formally, so EXCO can review your request, calculate any loan deductions, and determine your final refund amount."
                eyebrow="Exit requests"
                title="Track your member withdrawal request."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="workspace-tabs">
                {memberExitTabs.map((tab) => (
                    <button
                        className={`workspace-tabs__button ${activeTab === tab.id ? 'workspace-tabs__button--active' : ''}`}
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="workspace-tabs__context">
                <p className="workspace-tabs__eyebrow">Exit workflow</p>
                <h3>{activeMemberExitTab.label}</h3>
                <p>{activeMemberExitTab.description}</p>
            </div>

            {overview ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Total saved value" value={formatCurrency(overview.summary.total_saved_value)} />
                    <SummaryCard label="Outstanding loan balance" value={formatCurrency(overview.summary.outstanding_loan_balance)} />
                    <SummaryCard label="Estimated refund" value={formatCurrency(overview.summary.estimated_refund_amount)} />
                    <SummaryCard label="Latest exit status" value={overview.summary.latest_exit_request_status ? overview.summary.latest_exit_request_status.replace('_', ' ') : 'No request yet'} />
                </div>
            ) : null}

            {activeTab === 'overview' && overview ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Exit position" title="Current exit estimate">
                        <Notice>
                            <strong>How this estimate works:</strong> the current refund estimate is your total confirmed share value minus any outstanding approved or active loan balance. EXCO will review the request and confirm the final numbers before completion.
                        </Notice>
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard label="Membership status" value={overview.member.membership_status} />
                            <SummaryCard label="Member code" value={overview.member.member_number ?? 'Not set'} />
                            <SummaryCard label="Left on" value={formatDate(overview.member.left_on)} />
                            <SummaryCard label="Can submit request" value={memberCanRequestExit ? 'Yes' : 'No'} />
                        </div>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'request-exit' ? (
                <div className="mt-6">
                    <Panel eyebrow="New exit request" title="Submit your formal request">
                        {!memberCanRequestExit ? (
                            <Notice tone="warning">
                                {overview?.member.membership_status !== 'active'
                                    ? 'Your membership is no longer active, so a new exit request cannot be submitted.'
                                    : 'You already have an exit request that is still being processed by EXCO.'}
                            </Notice>
                        ) : null}

                        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void submitExitRequest(event)}>
                            <label className="app-field">
                                <span className="app-field__label">Notice given on</span>
                                <input
                                    className="app-field__control"
                                    disabled={!memberCanRequestExit}
                                    onChange={(event) => setForm((current) => ({ ...current, notice_given_on: event.target.value }))}
                                    required
                                    type="date"
                                    value={form.notice_given_on}
                                />
                            </label>

                            <label className="app-field">
                                <span className="app-field__label">Requested exit date</span>
                                <input
                                    className="app-field__control"
                                    disabled={!memberCanRequestExit}
                                    onChange={(event) => setForm((current) => ({ ...current, requested_exit_on: event.target.value }))}
                                    required
                                    type="date"
                                    value={form.requested_exit_on}
                                />
                            </label>

                            <label className="app-field md:col-span-2">
                                <span className="app-field__label">Notes</span>
                                <textarea
                                    className="app-field__control"
                                    disabled={!memberCanRequestExit}
                                    maxLength={3000}
                                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                                    placeholder="Optional note for EXCO, for example your reason for leaving or any repayment/payout clarification."
                                    value={form.notes}
                                />
                            </label>

                            <div className="md:col-span-2">
                                <button
                                    className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white"
                                    disabled={submitting || !memberCanRequestExit}
                                    type="submit"
                                >
                                    {submitting ? 'Submitting...' : 'Submit exit request'}
                                </button>
                            </div>
                        </form>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'history' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Exit history" title="Your submitted exit requests">
                        {requests ? (
                            <DataTable
                                columns={[
                                    { key: 'notice_given_on', header: 'Notice Given', render: (request) => formatDate(request.notice_given_on) },
                                    { key: 'requested_exit_on', header: 'Requested Exit', render: (request) => formatDate(request.requested_exit_on) },
                                    { key: 'status', header: 'Status', render: (request) => request.status.replace('_', ' ') },
                                    { key: 'loan_deduction', header: 'Loan Deduction', render: (request) => formatCurrency(request.outstanding_loan_deduction) },
                                    { key: 'refund', header: 'Refund Amount', render: (request) => formatCurrency(request.savings_refund_amount ?? 0) },
                                    { key: 'processed_at', header: 'Processed At', render: (request) => formatDate(request.processed_at) },
                                    {
                                        key: 'open',
                                        header: 'Open',
                                        exportable: false,
                                        render: (request) => (
                                            <button
                                                className="audit-table-button"
                                                onClick={() => setSelectedRequestId(request.id)}
                                                type="button"
                                            >
                                                View
                                            </button>
                                        ),
                                    },
                                ]}
                                currentPage={requests.current_page}
                                emptyMessage="You have not submitted any exit requests yet."
                                exportFilename="my-exit-requests.csv"
                                filterPlaceholder="Filter exit requests"
                                onPageChange={(nextPage) => void loadRequests(nextPage)}
                                rowKey={(request) => request.id}
                                rows={requests.data}
                                toolbarExtras={(
                                    <select className="app-filter-select" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="in_review">In review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                )}
                                totalItems={requests.total}
                                totalPages={requests.last_page}
                            />
                        ) : <Notice>{loading ? 'Loading your exit requests...' : 'No exit requests found.'}</Notice>}
                    </Panel>

                    {selectedRequest ? (
                        <Panel eyebrow={selectedRequest.status.replace('_', ' ')} title="Exit request detail">
                            <div className="audit-detail">
                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Request timeline</span>
                                    <strong>Notice: {formatDate(selectedRequest.notice_given_on)}</strong>
                                    <p>Requested exit: {formatDate(selectedRequest.requested_exit_on)}</p>
                                    <p>Last processed: {formatDate(selectedRequest.processed_at)}</p>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Financial summary</span>
                                    <strong>Estimated refund: {formatCurrency(selectedRequest.savings_refund_amount ?? 0)}</strong>
                                    <p>Loan deduction: {formatCurrency(selectedRequest.outstanding_loan_deduction)}</p>
                                    <p>Current savings value: {formatCurrency(selectedRequest.current_total_saved_value ?? 0)}</p>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Processing note</span>
                                    <p>{selectedRequest.notes ?? 'No processing note has been added yet.'}</p>
                                    <p>{selectedRequest.processor ? `Handled by ${selectedRequest.processor.name}` : 'Not yet assigned to an EXCO processor.'}</p>
                                </div>
                            </div>
                        </Panel>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
