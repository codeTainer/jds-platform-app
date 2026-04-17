import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

type MemberSupportTab = 'raise-concern' | 'history';

const memberSupportTabs: Array<{ id: MemberSupportTab; label: string; description: string }> = [
    {
        id: 'raise-concern',
        label: 'Raise Concern',
        description: 'Submit an issue about your account, shares, fees, loans, or share-out records directly from the platform.',
    },
    {
        id: 'history',
        label: 'Concern History',
        description: 'Track the concerns you have submitted, see EXCO updates, and review final resolution notes.',
    },
];

interface ConcernFormState {
    reference_type: string;
    reference_id: string;
    subject: string;
    message: string;
}

const initialConcernForm: ConcernFormState = {
    reference_type: 'account',
    reference_id: '',
    subject: '',
    message: '',
};

export function SupportSection() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<MemberSupportTab>('raise-concern');
    const [referenceGroups, setReferenceGroups] = useState<ConcernReferenceGroup[]>([]);
    const [concerns, setConcerns] = useState<PaginatedResponse<Concern> | null>(null);
    const [selectedConcernId, setSelectedConcernId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [referenceTypeFilter, setReferenceTypeFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState<ConcernFormState>(initialConcernForm);

    const selectedGroup = referenceGroups.find((group) => group.type === form.reference_type) ?? referenceGroups[0] ?? null;
    const selectedConcern = concerns?.data.find((concern) => concern.id === selectedConcernId) ?? null;
    const activeSupportTab = memberSupportTabs.find((tab) => tab.id === activeTab) ?? memberSupportTabs[0];

    const loadOptions = async () => {
        const { data } = await api.get<{ reference_groups: ConcernReferenceGroup[] }>('/api/member/concerns/options');
        setReferenceGroups(data.reference_groups);

        if (!data.reference_groups.some((group) => group.type === form.reference_type) && data.reference_groups[0]) {
            setForm((current) => ({
                ...current,
                reference_type: data.reference_groups[0].type,
                reference_id: '',
            }));
        }
    };

    const loadConcerns = async (nextPage = page, nextPerPage = perPage) => {
        const { data } = await api.get<PaginatedResponse<Concern>>('/api/member/concerns', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                status: statusFilter || undefined,
                reference_type: referenceTypeFilter || undefined,
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
        Promise.all([loadOptions(), loadConcerns(1)])
            .catch((requestError: any) => {
                setError(requestError.response?.data?.message ?? 'Unable to load the support workspace right now.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadConcerns(1, perPage);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [statusFilter, referenceTypeFilter, perPage]);

    async function submitConcern(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSubmitting(true);
            const payload: Record<string, unknown> = {
                reference_type: form.reference_type,
                subject: form.subject,
                message: form.message,
            };

            if (selectedGroup?.requires_record) {
                payload.reference_id = Number(form.reference_id);
            }

            const { data } = await api.post<{ message: string; concern: Concern }>('/api/member/concerns', payload);
            showToast(data.message, 'success');
            setForm({
                reference_type: form.reference_type,
                reference_id: '',
                subject: '',
                message: '',
            });
            await loadConcerns(1);
            setSelectedConcernId(data.concern.id);
            setActiveTab('history');
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to submit your concern right now.', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <PageHeader
                description="Use this workspace to raise questions about your account, savings, fees, loans, or share-out records and follow EXCO responses without relying on WhatsApp."
                eyebrow="Support"
                title="Raise concerns and follow up with EXCO."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="workspace-tabs">
                {memberSupportTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Support workspace</p>
                <h3>{activeSupportTab.label}</h3>
                <p>{activeSupportTab.description}</p>
            </div>

            {activeTab === 'raise-concern' ? (
                <div className="mt-6">
                    <Panel eyebrow="New concern" title="Tell EXCO exactly what needs attention">
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void submitConcern(event)}>
                            <label className="app-field">
                                <span className="app-field__label">Concern category</span>
                                <AppSelect
                                    className="app-field__control"
                                    onChange={(event) => setForm((current) => ({
                                        ...current,
                                        reference_type: event.target.value,
                                        reference_id: '',
                                    }))}
                                    required
                                    value={form.reference_type}
                                >
                                    {referenceGroups.map((group) => (
                                        <option key={group.type} value={group.type}>{group.label}</option>
                                    ))}
                                </AppSelect>
                            </label>

                            <label className="app-field">
                                <span className="app-field__label">Related record</span>
                                <AppSelect
                                    className="app-field__control"
                                    disabled={!selectedGroup?.requires_record}
                                    onChange={(event) => setForm((current) => ({ ...current, reference_id: event.target.value }))}
                                    required={selectedGroup?.requires_record}
                                    value={form.reference_id}
                                >
                                    <option value="">{selectedGroup?.requires_record ? 'Select related record' : 'No record required'}</option>
                                    {selectedGroup?.options.map((option) => (
                                        <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                </AppSelect>
                            </label>

                            <label className="app-field md:col-span-2">
                                <span className="app-field__label">Subject</span>
                                <input
                                    className="app-field__control"
                                    maxLength={150}
                                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                                    placeholder="Briefly describe the issue"
                                    required
                                    value={form.subject}
                                />
                            </label>

                            <label className="app-field md:col-span-2">
                                <span className="app-field__label">Concern details</span>
                                <textarea
                                    className="app-field__control"
                                    maxLength={3000}
                                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                                    placeholder="Explain what happened, what you expected, and any detail EXCO should check."
                                    required
                                    value={form.message}
                                />
                            </label>

                            {selectedGroup ? (
                                <div className="md:col-span-2">
                                    <Notice>
                                        <strong>{selectedGroup.label}:</strong> {selectedGroup.description}
                                        {selectedGroup.requires_record && selectedGroup.options.length === 0 ? ' No linked records are available yet for this category.' : ''}
                                    </Notice>
                                </div>
                            ) : null}

                            <div className="md:col-span-2">
                                <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={submitting || loading} type="submit">
                                    {submitting ? 'Submitting...' : 'Submit concern'}
                                </button>
                            </div>
                        </form>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'history' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Concern history" title="Your submitted concerns">
                        {concerns ? (
                            <DataTable
                                columns={[
                                    { key: 'subject', header: 'Subject', render: (concern) => concern.subject },
                                    { key: 'reference', header: 'Category', render: (concern) => concern.reference_group_label },
                                    { key: 'status', header: 'Status', render: (concern) => concern.status.replace('_', ' ') },
                                    { key: 'raised_at', header: 'Raised On', render: (concern) => formatDate(concern.raised_at) },
                                    { key: 'resolved_at', header: 'Updated On', render: (concern) => formatDate(concern.resolved_at) },
                                    {
                                        key: 'action',
                                        header: 'Action',
                                        exportable: false,
                                        render: (concern) => (
                                            <button
                                                aria-label={`View concern ${concern.subject}`}
                                                className="app-icon-button"
                                                onClick={() => setSelectedConcernId(concern.id)}
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
                                emptyMessage="You have not submitted any concerns yet."
                                exportFilename="my-concerns.csv"
                                filterPlaceholder="Filter your concerns"
                                onPageChange={(nextPage) => void loadConcerns(nextPage)}
                                onPerPageChange={(value) => {
                                    setPage(1);
                                    setPerPage(value);
                                }}
                                rowKey={(concern) => concern.id}
                                rows={concerns.data}
                                toolbarExtras={(
                                    <>
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
                        ) : <Notice>{loading ? 'Loading your concern history...' : 'No concern records available yet.'}</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'history' && selectedConcern ? (
                <div className="constitution-modal-backdrop" onClick={() => setSelectedConcernId(null)} role="presentation">
                    <div
                        aria-modal="true"
                        className="constitution-modal constitution-modal--narrow"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                    >
                        <div className="constitution-modal__header">
                            <div>
                                <p className="constitution-modal__eyebrow">{selectedConcern.reference_group_label}</p>
                                <h3>{selectedConcern.subject}</h3>
                            </div>
                            <button
                                aria-label="Close concern detail"
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
                                    <h4>Concern details</h4>
                                    <p>{selectedConcern.message}</p>
                                </div>
                                <div className="support-message-box">
                                    <h4>Linked record</h4>
                                    <p>{selectedConcern.reference_label}</p>
                                    {selectedConcern.reference_subtitle ? <p>{selectedConcern.reference_subtitle}</p> : null}
                                </div>
                                <div className="support-message-box">
                                    <h4>Status</h4>
                                    <p>{selectedConcern.status.replace('_', ' ')}</p>
                                    <p>Raised: {formatDate(selectedConcern.raised_at)}</p>
                                    <p>Last update: {formatDate(selectedConcern.resolved_at)}</p>
                                </div>
                                <div className="support-message-box">
                                    <h4>EXCO response</h4>
                                    <p>{selectedConcern.resolution_note ?? 'No response note yet. EXCO will update this thread as they review your concern.'}</p>
                                    {selectedConcern.resolver ? <p>Handled by: {selectedConcern.resolver.name}</p> : null}
                                </div>
                            </div>
                            {selectedConcern.action_url ? (
                                <div className="mt-4">
                                    <button
                                        className="landing-btn landing-btn--secondary"
                                        onClick={() => {
                                            setSelectedConcernId(null);
                                            navigate(selectedConcern.action_url!);
                                        }}
                                        type="button"
                                    >
                                        Open linked workspace
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
