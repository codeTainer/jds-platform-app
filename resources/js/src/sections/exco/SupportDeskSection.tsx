import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AppSelect } from '../../components/ui/AppSelect';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { useToast } from '../../feedback/ToastProvider';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import type { Concern, ConcernReferenceGroup, PaginatedResponse } from '../../types';

function ViewIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M2.25 12s3.75-6 9.75-6 9.75 6 9.75 6-3.75 6-9.75 6-9.75-6-9.75-6Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <circle cx="12" cy="12" fill="currentColor" r="2.4" />
        </svg>
    );
}

type SupportDeskTab = 'queue' | 'workspace';

const supportDeskTabs: Array<{ id: SupportDeskTab; label: string; description: string }> = [
    {
        id: 'queue',
        label: 'Concern Queue',
        description: 'Review all member concerns, filter by category or status, and open any item for handling.',
    },
    {
        id: 'workspace',
        label: 'Resolution Workspace',
        description: 'Read the member issue, move it into review, resolve it, or reject it with a clear response note.',
    },
];

export function SupportDeskSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<SupportDeskTab>('queue');
    const [concerns, setConcerns] = useState<PaginatedResponse<Concern> | null>(null);
    const [selectedConcernId, setSelectedConcernId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [referenceTypeFilter, setReferenceTypeFilter] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [filtersLoaded, setFiltersLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [resolutionForm, setResolutionForm] = useState({
        status: 'in_review',
        resolution_note: '',
    });

    const referenceGroups: ConcernReferenceGroup[] = [
        { type: 'account', label: 'Account / Profile', description: '', requires_record: false, options: [] },
        { type: 'share_payment_submission', label: 'Share Receipt Submission', description: '', requires_record: true, options: [] },
        { type: 'share_purchase', label: 'Share Purchase Record', description: '', requires_record: true, options: [] },
        { type: 'membership_fee_submission', label: 'Membership Fee Receipt', description: '', requires_record: true, options: [] },
        { type: 'membership_fee', label: 'Membership Fee Record', description: '', requires_record: true, options: [] },
        { type: 'loan', label: 'Loan Record', description: '', requires_record: true, options: [] },
        { type: 'loan_repayment_submission', label: 'Loan Repayment Receipt', description: '', requires_record: true, options: [] },
        { type: 'shareout_item', label: 'Share-out Record', description: '', requires_record: true, options: [] },
    ];

    const selectedConcern = concerns?.data.find((concern) => concern.id === selectedConcernId) ?? null;
    const activeSupportDeskTab = supportDeskTabs.find((tab) => tab.id === activeTab) ?? supportDeskTabs[0];
    const concernIsClosed = selectedConcern ? ['resolved', 'rejected'].includes(selectedConcern.status) : false;
    const availableStatusOptions = selectedConcern
        ? concernIsClosed
            ? [selectedConcern.status]
            : selectedConcern.status === 'in_review'
                ? ['open', 'in_review', 'resolved', 'rejected']
                : ['open', 'in_review', 'resolved', 'rejected']
        : ['open', 'in_review', 'resolved', 'rejected'];

    const loadConcerns = async (nextPage = page, nextPerPage = perPage) => {
        const { data } = await api.get<PaginatedResponse<Concern>>('/api/exco/concerns', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                status: statusFilter || undefined,
                reference_type: referenceTypeFilter || undefined,
                member_search: memberSearch || undefined,
            },
        });

        setConcerns(data);
        setPage(data.current_page);
        setPerPage(data.per_page);
        setSelectedConcernId((current) => {
            if (current && data.data.some((concern) => concern.id === current)) {
                return current;
            }

            return data.data[0]?.id ?? null;
        });
    };

    useEffect(() => {
        loadConcerns(1)
            .catch((requestError: any) => {
                showToast(requestError.response?.data?.message ?? 'Unable to load the support queue.', 'error');
            })
            .finally(() => {
                setLoading(false);
                setFiltersLoaded(true);
            });
    }, []);

    useEffect(() => {
        if (!filtersLoaded) {
            return;
        }

        const timeout = window.setTimeout(() => {
            void loadConcerns(1, perPage);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [statusFilter, referenceTypeFilter, memberSearch, filtersLoaded, perPage]);

    useEffect(() => {
        if (!selectedConcern) {
            return;
        }

        setResolutionForm({
            status: selectedConcern.status === 'open' ? 'in_review' : selectedConcern.status,
            resolution_note: selectedConcern.resolution_note ?? '',
        });
    }, [selectedConcernId, selectedConcern?.status, selectedConcern?.resolution_note]);

    async function updateConcern(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedConcern) {
            return;
        }

        try {
            const { data } = await api.patch<{ message: string; concern: Concern }>(`/api/exco/concerns/${selectedConcern.id}`, resolutionForm);
            showToast(data.message, 'success');
            await loadConcerns(page);
            setSelectedConcernId(data.concern.id);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to update this concern right now.', 'error');
        }
    }

    return (
        <div>
            <PageHeader
                description="This desk centralizes member complaints and support follow-up so EXCO can review, respond, and resolve issues inside the platform."
                eyebrow="Support desk"
                title="Review and resolve member concerns."
            />

            <div className="workspace-tabs">
                {supportDeskTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Support desk</p>
                <h3>{activeSupportDeskTab.label}</h3>
                <p>{activeSupportDeskTab.description}</p>
            </div>

            {activeTab === 'queue' ? (
                <div className="mt-6">
                    <Panel eyebrow="Concern queue" title="All member support requests">
                        {concerns ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (concern) => concern.member?.full_name ?? 'Unknown member' },
                                    { key: 'subject', header: 'Subject', render: (concern) => concern.subject },
                                    { key: 'reference', header: 'Category', render: (concern) => concern.reference_group_label },
                                    { key: 'status', header: 'Status', render: (concern) => concern.status.replace('_', ' ') },
                                    { key: 'raised_at', header: 'Raised On', render: (concern) => formatDate(concern.raised_at) },
                                    {
                                        key: 'action',
                                        header: 'Action',
                                        exportable: false,
                                        render: (concern) => (
                                            <button
                                                aria-label={`View concern ${concern.subject}`}
                                                className="app-icon-button"
                                                onClick={() => {
                                                    setSelectedConcernId(concern.id);
                                                }}
                                                title="View concern"
                                                type="button"
                                            >
                                                <ViewIcon />
                                            </button>
                                        ),
                                    },
                                ]}
                                currentPage={concerns.current_page}
                                currentPerPage={perPage}
                                emptyMessage="No concerns have been submitted yet."
                                exportFilename="support-concerns.csv"
                                filterPlaceholder="Filter concern queue"
                                onPageChange={(nextPage) => void loadConcerns(nextPage)}
                                onPerPageChange={(value) => {
                                    setPage(1);
                                    setPerPage(value);
                                }}
                                rowKey={(concern) => concern.id}
                                rows={concerns.data}
                                toolbarExtras={(
                                    <>
                                        <input
                                            className="app-filter-select"
                                            onChange={(event) => setMemberSearch(event.target.value)}
                                            placeholder="Search member"
                                            value={memberSearch}
                                        />
                                        <AppSelect className="app-filter-select" onChange={(event) => setReferenceTypeFilter(event.target.value)} value={referenceTypeFilter}>
                                            <option value="">All categories</option>
                                            {referenceGroups.map((group) => <option key={group.type} value={group.type}>{group.label}</option>)}
                                        </AppSelect>
                                        <AppSelect className="app-filter-select" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                                            <option value="">All statuses</option>
                                            <option value="open">Open</option>
                                            <option value="in_review">In review</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="rejected">Rejected</option>
                                        </AppSelect>
                                    </>
                                )}
                                totalItems={concerns.total}
                                totalPages={concerns.last_page}
                            />
                        ) : <Notice>{loading ? 'Loading support queue...' : 'No concern data available.'}</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'workspace' ? (
                <div className="mt-6 grid gap-6">
                    {selectedConcern ? (
                        <>
                            <Panel eyebrow={selectedConcern.reference_group_label} title={selectedConcern.subject}>
                                <div className="support-detail-grid">
                                    <div className="support-message-box">
                                        <h4>Member issue</h4>
                                        <p>{selectedConcern.message}</p>
                                    </div>
                                    <div className="support-message-box">
                                        <h4>Member</h4>
                                        <p>{selectedConcern.member?.full_name ?? 'Unknown member'}</p>
                                        <p>{selectedConcern.member?.member_number ?? 'No member code'}</p>
                                        <p>{selectedConcern.member?.email ?? 'No email'}</p>
                                    </div>
                                    <div className="support-message-box">
                                        <h4>Linked record</h4>
                                        <p>{selectedConcern.reference_label}</p>
                                        {selectedConcern.reference_subtitle ? <p>{selectedConcern.reference_subtitle}</p> : null}
                                    </div>
                                    <div className="support-message-box">
                                        <h4>Timeline</h4>
                                        <p>Status: {selectedConcern.status.replace('_', ' ')}</p>
                                        <p>Raised: {formatDate(selectedConcern.raised_at)}</p>
                                        <p>Resolved: {formatDate(selectedConcern.resolved_at)}</p>
                                    </div>
                                </div>
                            </Panel>

                            <Panel eyebrow="Resolution" title="Update concern status and response">
                                <form className="grid gap-4" onSubmit={(event) => void updateConcern(event)}>
                                    <label className="app-field">
                                        <span className="app-field__label">Status</span>
                                        <AppSelect
                                            className="app-field__control"
                                            disabled={concernIsClosed}
                                            onChange={(event) => setResolutionForm((current) => ({ ...current, status: event.target.value }))}
                                            value={resolutionForm.status}
                                        >
                                            {availableStatusOptions.map((status) => (
                                                <option key={status} value={status}>
                                                    {status.replace('_', ' ')}
                                                </option>
                                            ))}
                                        </AppSelect>
                                    </label>
                                    <label className="app-field">
                                        <span className="app-field__label">Response note</span>
                                        <textarea
                                            className="app-field__control"
                                            disabled={concernIsClosed}
                                            onChange={(event) => setResolutionForm((current) => ({ ...current, resolution_note: event.target.value }))}
                                            placeholder="Explain what you checked, what you found, and the action taken."
                                            value={resolutionForm.resolution_note}
                                        />
                                    </label>
                                    {concernIsClosed ? (
                                        <Notice>
                                            This concern is already closed as <strong>{selectedConcern?.status.replace('_', ' ')}</strong>. Closed concerns stay on record and can no longer be changed.
                                        </Notice>
                                    ) : null}
                                    <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={concernIsClosed} type="submit">
                                        Save concern update
                                    </button>
                                </form>
                            </Panel>
                        </>
                    ) : (
                        <Notice>Select a concern from the queue to open its full resolution workspace.</Notice>
                    )}
                </div>
            ) : null}

            {activeTab === 'queue' && selectedConcern ? (
                <div className="constitution-modal-backdrop" onClick={() => setSelectedConcernId(null)} role="presentation">
                    <div
                        aria-modal="true"
                        className="constitution-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                    >
                        <div className="constitution-modal__header">
                            <div>
                                <p className="constitution-modal__eyebrow">{selectedConcern.reference_group_label}</p>
                                <h3>{selectedConcern.subject}</h3>
                            </div>
                            <button
                                aria-label="Close concern"
                                className="constitution-modal__close"
                                onClick={() => setSelectedConcernId(null)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>
                        <div className="constitution-modal__body">
                            <div className="support-detail-grid">
                                <div className="support-message-box">
                                    <h4>Member issue</h4>
                                    <p>{selectedConcern.message}</p>
                                </div>
                                <div className="support-message-box">
                                    <h4>Member</h4>
                                    <p>{selectedConcern.member?.full_name ?? 'Unknown member'}</p>
                                    <p>{selectedConcern.member?.member_number ?? 'No member code'}</p>
                                    <p>{selectedConcern.member?.email ?? 'No email'}</p>
                                </div>
                                <div className="support-message-box">
                                    <h4>Linked record</h4>
                                    <p>{selectedConcern.reference_label}</p>
                                    {selectedConcern.reference_subtitle ? <p>{selectedConcern.reference_subtitle}</p> : null}
                                </div>
                                <div className="support-message-box">
                                    <h4>Timeline</h4>
                                    <p>Status: {selectedConcern.status.replace('_', ' ')}</p>
                                    <p>Raised: {formatDate(selectedConcern.raised_at)}</p>
                                    <p>Resolved: {formatDate(selectedConcern.resolved_at)}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <form className="grid gap-4" onSubmit={(event) => void updateConcern(event)}>
                                    <label className="app-field">
                                        <span className="app-field__label">Status</span>
                                        <AppSelect
                                            className="app-field__control"
                                            disabled={concernIsClosed}
                                            onChange={(event) => setResolutionForm((current) => ({ ...current, status: event.target.value }))}
                                            value={resolutionForm.status}
                                        >
                                            {availableStatusOptions.map((status) => (
                                                <option key={status} value={status}>
                                                    {status.replace('_', ' ')}
                                                </option>
                                            ))}
                                        </AppSelect>
                                    </label>
                                    <label className="app-field">
                                        <span className="app-field__label">Response note</span>
                                        <textarea
                                            className="app-field__control"
                                            disabled={concernIsClosed}
                                            onChange={(event) => setResolutionForm((current) => ({ ...current, resolution_note: event.target.value }))}
                                            placeholder="Explain what you checked, what you found, and the action taken."
                                            value={resolutionForm.resolution_note}
                                        />
                                    </label>
                                    {concernIsClosed ? (
                                        <Notice>
                                            This concern is already closed as <strong>{selectedConcern.status.replace('_', ' ')}</strong>. Closed concerns stay on record and can no longer be changed.
                                        </Notice>
                                    ) : null}
                                    <div className="record-action-group">
                                        <button
                                            className="rounded-full border border-[rgba(12,59,102,0.16)] bg-white px-4 py-2.5 text-[0.96rem] font-semibold text-[var(--ink)]"
                                            onClick={() => setSelectedConcernId(null)}
                                            type="button"
                                        >
                                            Close
                                        </button>
                                        <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={concernIsClosed} type="submit">
                                            Save concern update
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
