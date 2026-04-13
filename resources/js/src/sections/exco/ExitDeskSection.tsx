import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { useToast } from '../../feedback/ToastProvider';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { MemberExitRequest, PaginatedResponse } from '../../types';

type ExitDeskTab = 'queue' | 'workspace';

const exitDeskTabs: Array<{ id: ExitDeskTab; label: string; description: string }> = [
    {
        id: 'queue',
        label: 'Exit Queue',
        description: 'Review all member exit requests, filter by status, and identify which requests are awaiting action from EXCO.',
    },
    {
        id: 'workspace',
        label: 'Resolution Workspace',
        description: 'Open a selected request, review the savings and loan deduction impact, and move it through approval, rejection, or completion.',
    },
];

function availableStatusOptions(status: MemberExitRequest['status']) {
    switch (status) {
        case 'pending':
            return ['in_review', 'approved', 'rejected'] as const;
        case 'in_review':
            return ['approved', 'rejected'] as const;
        case 'approved':
            return ['completed'] as const;
        default:
            return [] as const;
    }
}

export function ExitDeskSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<ExitDeskTab>('queue');
    const [requests, setRequests] = useState<PaginatedResponse<MemberExitRequest> | null>(null);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        status: 'in_review',
        notes: '',
    });

    const activeExitDeskTab = exitDeskTabs.find((tab) => tab.id === activeTab) ?? exitDeskTabs[0];
    const selectedRequest = requests?.data.find((request) => request.id === selectedRequestId) ?? null;
    const statusOptions = selectedRequest ? availableStatusOptions(selectedRequest.status) : [];
    const closedRequest = selectedRequest ? ['rejected', 'completed'].includes(selectedRequest.status) : false;

    const summary = useMemo(() => {
        const rows = requests?.data ?? [];

        return {
            pending: rows.filter((request) => request.status === 'pending').length,
            inReview: rows.filter((request) => request.status === 'in_review').length,
            approved: rows.filter((request) => request.status === 'approved').length,
            completed: rows.filter((request) => request.status === 'completed').length,
        };
    }, [requests]);

    async function loadRequests(nextPage = page) {
        const { data } = await api.get<PaginatedResponse<MemberExitRequest>>('/api/exco/exit-requests', {
            params: {
                page: nextPage,
                per_page: 10,
                status: statusFilter || undefined,
                member_search: memberSearch || undefined,
            },
        });

        setError('');
        setRequests(data);
        setPage(data.current_page);
        setSelectedRequestId((current) => {
            if (current && data.data.some((request) => request.id === current)) {
                return current;
            }

            return data.data[0]?.id ?? null;
        });
    }

    useEffect(() => {
        void loadRequests(1)
            .catch((requestError: any) => {
                setError(requestError.response?.data?.message ?? 'Unable to load the exit desk right now.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadRequests(1).catch((requestError: any) => {
                setError(requestError.response?.data?.message ?? 'Unable to load the exit desk right now.');
            });
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [statusFilter, memberSearch]);

    useEffect(() => {
        if (!selectedRequest) {
            return;
        }

        const nextStatus = availableStatusOptions(selectedRequest.status)[0] ?? selectedRequest.status;
        setForm({
            status: nextStatus,
            notes: selectedRequest.notes ?? '',
        });
    }, [selectedRequestId, selectedRequest?.status]);

    async function updateExitRequest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedRequest || closedRequest || !statusOptions.includes(form.status as any)) {
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await api.patch<{ message: string; exit_request: MemberExitRequest }>(`/api/exco/exit-requests/${selectedRequest.id}`, {
                status: form.status,
                notes: form.notes || null,
            });
            showToast(data.message, 'success');
            await loadRequests(page);
            setSelectedRequestId(data.exit_request.id);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to update this exit request right now.', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <PageHeader
                description="This desk helps EXCO process member withdrawals by reviewing the request timeline, outstanding loan deductions, and the estimated refund based on confirmed savings."
                eyebrow="Exit desk"
                title="Manage member exit and withdrawal requests."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Pending requests" value={String(summary.pending)} />
                <SummaryCard label="In review" value={String(summary.inReview)} />
                <SummaryCard label="Approved" value={String(summary.approved)} />
                <SummaryCard label="Completed" value={String(summary.completed)} />
            </div>

            <div className="workspace-tabs mt-6">
                {exitDeskTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Member exit desk</p>
                <h3>{activeExitDeskTab.label}</h3>
                <p>{activeExitDeskTab.description}</p>
            </div>

            {activeTab === 'queue' ? (
                <div className="mt-6">
                    <Panel eyebrow="Exit register" title="Member exit requests">
                        {requests ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (request) => request.member?.full_name ?? 'Unknown' },
                                    { key: 'member_number', header: 'Member Code', render: (request) => request.member?.member_number ?? 'Not set' },
                                    { key: 'status', header: 'Status', render: (request) => request.status.replace('_', ' ') },
                                    { key: 'notice_given_on', header: 'Notice Given', render: (request) => formatDate(request.notice_given_on) },
                                    { key: 'requested_exit_on', header: 'Requested Exit', render: (request) => formatDate(request.requested_exit_on) },
                                    { key: 'refund', header: 'Est. Refund', render: (request) => formatCurrency(request.current_estimated_refund_amount ?? request.savings_refund_amount ?? 0) },
                                    {
                                        key: 'open',
                                        header: 'Open',
                                        exportable: false,
                                        render: (request) => (
                                            <button
                                                className="audit-table-button"
                                                onClick={() => {
                                                    setSelectedRequestId(request.id);
                                                    setActiveTab('workspace');
                                                }}
                                                type="button"
                                            >
                                                View
                                            </button>
                                        ),
                                    },
                                ]}
                                currentPage={requests.current_page}
                                emptyMessage="No exit requests have been submitted yet."
                                exportFilename="member-exit-requests.csv"
                                filterPlaceholder="Filter this page"
                                onPageChange={(nextPage) => void loadRequests(nextPage)}
                                rowKey={(request) => request.id}
                                rows={requests.data}
                                toolbarExtras={(
                                    <>
                                        <input
                                            className="app-filter-select"
                                            onChange={(event) => setMemberSearch(event.target.value)}
                                            placeholder="Search member"
                                            value={memberSearch}
                                        />
                                        <select className="app-filter-select" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                                            <option value="">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="in_review">In review</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </>
                                )}
                                totalItems={requests.total}
                                totalPages={requests.last_page}
                            />
                        ) : <Notice>{loading ? 'Loading exit requests...' : 'No exit requests found.'}</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'workspace' ? (
                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
                    <Panel eyebrow="Selected request" title={selectedRequest ? `${selectedRequest.member?.full_name ?? 'Member'} exit request` : 'Select an exit request'}>
                        {selectedRequest ? (
                            <div className="audit-detail">
                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Member</span>
                                    <strong>{selectedRequest.member?.full_name ?? 'Unknown member'}</strong>
                                    <p>{selectedRequest.member?.member_number ?? 'No member code'} - {selectedRequest.member?.email ?? 'No email recorded'}</p>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Request timeline</span>
                                    <strong>Notice given: {formatDate(selectedRequest.notice_given_on)}</strong>
                                    <p>Requested exit: {formatDate(selectedRequest.requested_exit_on)}</p>
                                    <p>Status: {selectedRequest.status.replace('_', ' ')}</p>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Financial breakdown</span>
                                    <strong>Total saved value: {formatCurrency(selectedRequest.current_total_saved_value ?? 0)}</strong>
                                    <p>Outstanding loan deduction: {formatCurrency(selectedRequest.current_outstanding_loan_balance ?? selectedRequest.outstanding_loan_deduction)}</p>
                                    <p>Estimated refund: {formatCurrency(selectedRequest.current_estimated_refund_amount ?? selectedRequest.savings_refund_amount ?? 0)}</p>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Current notes</span>
                                    <p>{selectedRequest.notes ?? 'No processing note has been added yet.'}</p>
                                    <p>{selectedRequest.processor ? `Last handled by ${selectedRequest.processor.name}` : 'No EXCO processor has updated this request yet.'}</p>
                                </div>
                            </div>
                        ) : (
                            <Notice>Select an exit request from the queue to review it here.</Notice>
                        )}
                    </Panel>

                    <Panel eyebrow="Update request" title="Move the request through the workflow">
                        {selectedRequest ? (
                            <form className="grid gap-4" onSubmit={(event) => void updateExitRequest(event)}>
                                {closedRequest ? (
                                    <Notice tone="warning">This exit request is already closed and can no longer be changed.</Notice>
                                ) : null}

                                {!closedRequest && !statusOptions.length ? (
                                    <Notice tone="warning">There are no further transitions available for this request from its current status.</Notice>
                                ) : null}

                                <label className="app-field">
                                    <span className="app-field__label">Next status</span>
                                    <select
                                        className="app-field__control"
                                        disabled={closedRequest || !statusOptions.length}
                                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                                        value={form.status}
                                    >
                                        {statusOptions.map((status) => (
                                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="app-field">
                                    <span className="app-field__label">Processing note</span>
                                    <textarea
                                        className="app-field__control"
                                        disabled={closedRequest}
                                        maxLength={3000}
                                        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                                        placeholder="Add the reason for rejection, approval context, or completion note."
                                        value={form.notes}
                                    />
                                </label>

                                <button
                                    className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white"
                                    disabled={submitting || closedRequest || !statusOptions.length}
                                    type="submit"
                                >
                                    {submitting ? 'Saving...' : 'Update exit request'}
                                </button>
                            </form>
                        ) : (
                            <Notice>Select an exit request first so you can update it here.</Notice>
                        )}
                    </Panel>
                </div>
            ) : null}
        </div>
    );
}
