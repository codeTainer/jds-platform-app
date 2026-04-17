import { useEffect, useMemo, useState } from 'react';
import { AppSelect } from '../../components/ui/AppSelect';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/formatters';
import type { AuditLogEntry, PaginatedResponse } from '../../types';

const moduleOptions = [
    { value: '', label: 'All modules' },
    { value: 'auth', label: 'Authentication' },
    { value: 'members', label: 'Members' },
    { value: 'applications', label: 'Applications' },
    { value: 'cycles', label: 'Cycles' },
    { value: 'shares', label: 'Shares' },
    { value: 'fees', label: 'Membership Fees' },
    { value: 'loans', label: 'Loans' },
    { value: 'shareouts', label: 'Share-out' },
    { value: 'concerns', label: 'Support / Concerns' },
];

function formatMetadataValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return 'Not recorded';
    }

    if (Array.isArray(value)) {
        return value.join(', ');
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

export function AuditLogSection() {
    const [rows, setRows] = useState<PaginatedResponse<AuditLogEntry> | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [error, setError] = useState('');

    async function loadAuditLogs(nextPage = page, nextPerPage = perPage) {
        const { data } = await api.get<PaginatedResponse<AuditLogEntry>>('/api/exco/audit-logs', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                search: search || undefined,
                module: moduleFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
        });

        setError('');
        setRows(data);
        setPage(data.current_page);
        setPerPage(data.per_page);
        setSelectedEntry((current) => current ? data.data.find((entry) => entry.id === current.id) ?? current : null);
    }

    useEffect(() => {
        void loadAuditLogs(1).catch((requestError: any) => {
            setError(requestError.response?.data?.message ?? 'Unable to load audit logs right now.');
        });
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadAuditLogs(1, perPage).catch((requestError: any) => {
                setError(requestError.response?.data?.message ?? 'Unable to load audit logs right now.');
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [dateFrom, dateTo, moduleFilter, perPage, search]);

    const selectedMetadataEntries = useMemo(
        () => Object.entries(selectedEntry?.metadata ?? {}),
        [selectedEntry],
    );

    return (
        <div>
            <PageHeader
                description="Review who performed major actions across member intake, savings, loans, share-out, support, and account activity from the moment audit logging went live."
                eyebrow="Audit trail"
                title="See who did what across the platform."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="mt-6">
                <Panel eyebrow="Audit filters" title="Narrow the activity log">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="app-field">
                            <span className="app-field__label">Search</span>
                            <input
                                className="app-field__control"
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search actor or description"
                                value={search}
                            />
                        </label>

                        <label className="app-field">
                            <span className="app-field__label">Module</span>
                            <AppSelect className="app-field__control" onChange={(event) => setModuleFilter(event.target.value)} value={moduleFilter}>
                                {moduleOptions.map((option) => (
                                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                                ))}
                            </AppSelect>
                        </label>

                        <label className="app-field">
                            <span className="app-field__label">From date</span>
                            <input className="app-field__control" onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
                        </label>

                        <label className="app-field">
                            <span className="app-field__label">To date</span>
                            <input className="app-field__control" onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />
                        </label>
                    </div>
                </Panel>
            </div>

            <div className="mt-6">
                <Panel eyebrow="Audit register" title="Recorded activity">
                    {rows ? (
                        <DataTable
                            columns={[
                                {
                                    key: 'actor',
                                    header: 'Actor',
                                    render: (entry) => entry.actor ? `${entry.actor.name} (${entry.actor.role})` : 'System',
                                },
                                { key: 'module', header: 'Module', render: (entry) => entry.module_label },
                                { key: 'action', header: 'Action', render: (entry) => entry.action_label },
                                { key: 'description', header: 'What happened', render: (entry) => entry.description ?? 'No description recorded.' },
                                { key: 'occurred_at', header: 'When', render: (entry) => formatDate(entry.occurred_at) },
                                {
                                    key: 'open',
                                    header: 'Open',
                                    render: (entry) => (
                                        <button
                                            className="audit-table-button"
                                            onClick={() => setSelectedEntry(entry)}
                                            type="button"
                                        >
                                            View
                                        </button>
                                    ),
                                    exportable: false,
                                },
                            ]}
                            currentPage={rows.current_page}
                            currentPerPage={perPage}
                            emptyMessage="No audit entries have been recorded yet."
                            exportFilename="audit-log.csv"
                            filterPlaceholder="Filter this page"
                            onPageChange={(nextPage) => void loadAuditLogs(nextPage)}
                            onPerPageChange={(value) => {
                                setPage(1);
                                setPerPage(value);
                            }}
                            rowKey={(entry) => entry.id}
                            rows={rows.data}
                            totalItems={rows.total}
                            totalPages={rows.last_page}
                        />
                    ) : <Notice>Loading audit entries...</Notice>}
                </Panel>
            </div>

            {selectedEntry ? (
                <div className="constitution-modal-backdrop" onClick={() => setSelectedEntry(null)} role="presentation">
                    <div
                        aria-modal="true"
                        className="constitution-modal audit-entry-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                    >
                        <div className="constitution-modal__header">
                            <div>
                                <p className="constitution-modal__eyebrow">Audit entry</p>
                                <h3>Review the selected activity</h3>
                            </div>
                            <button
                                aria-label="Close audit entry"
                                className="constitution-modal__close"
                                onClick={() => setSelectedEntry(null)}
                                type="button"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="constitution-modal__body">
                            <div className="audit-detail">
                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Actor</span>
                                    <strong>{selectedEntry.actor ? selectedEntry.actor.name : 'System'}</strong>
                                    <p>{selectedEntry.actor ? `${selectedEntry.actor.email} - ${selectedEntry.actor.role}` : 'No actor account was attached to this event.'}</p>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Action</span>
                                    <strong>{selectedEntry.module_label} - {selectedEntry.action_label}</strong>
                                    <p>{selectedEntry.description ?? 'No description recorded.'}</p>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Occurred at</span>
                                    <strong>{formatDate(selectedEntry.occurred_at)}</strong>
                                </div>

                                <div className="audit-detail__group">
                                    <span className="audit-detail__label">Metadata</span>
                                    {selectedMetadataEntries.length ? (
                                        <div className="audit-detail__metadata">
                                            {selectedMetadataEntries.map(([key, value]) => (
                                                <div className="audit-detail__metadata-row" key={key}>
                                                    <span>{key.replaceAll('_', ' ')}</span>
                                                    <strong>{formatMetadataValue(value)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No extra metadata was recorded for this event.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
