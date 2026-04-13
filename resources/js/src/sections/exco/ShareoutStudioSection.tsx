import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../feedback/ToastProvider';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { MembershipCycle, PaginatedResponse, ShareoutFormula, ShareoutItem, ShareoutProfitBreakdown, ShareoutRun, ShareoutSummary } from '../../types';

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

function DeleteIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M4.5 7.5h15"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path
                d="M9.75 3.75h4.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path
                d="M7.5 7.5v10.125A1.875 1.875 0 0 0 9.375 19.5h5.25A1.875 1.875 0 0 0 16.5 17.625V7.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path d="M10.5 10.5v5.25M13.5 10.5v5.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
    );
}

interface ShareoutForm {
    membership_cycle_id: string;
    total_profit: string;
    admin_fee_rate: string;
    scheduled_start_on: string;
    scheduled_end_on: string;
    notes: string;
}

const initialForm: ShareoutForm = {
    membership_cycle_id: '',
    total_profit: '',
    admin_fee_rate: '20',
    scheduled_start_on: '',
    scheduled_end_on: '',
    notes: '',
};

type ShareoutWorkspaceTab = 'draft-generator' | 'run-register' | 'breakdown';

export function ShareoutStudioSection() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<ShareoutWorkspaceTab>('run-register');
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [runs, setRuns] = useState<PaginatedResponse<ShareoutRun> | null>(null);
    const [selectedRun, setSelectedRun] = useState<ShareoutRun | null>(null);
    const [selectedRunSummary, setSelectedRunSummary] = useState<ShareoutSummary | null>(null);
    const [selectedRunProfitBreakdown, setSelectedRunProfitBreakdown] = useState<ShareoutProfitBreakdown | null>(null);
    const [selectedRunFormula, setSelectedRunFormula] = useState<ShareoutFormula | null>(null);
    const [profitBreakdown, setProfitBreakdown] = useState<ShareoutProfitBreakdown | null>(null);
    const [items, setItems] = useState<PaginatedResponse<ShareoutItem> | null>(null);
    const [runPendingDelete, setRunPendingDelete] = useState<ShareoutRun | null>(null);
    const [runsPage, setRunsPage] = useState(1);
    const [itemsPage, setItemsPage] = useState(1);
    const [itemStatusFilter, setItemStatusFilter] = useState('');
    const [form, setForm] = useState<ShareoutForm>(initialForm);
    const canCalculate = user?.role === 'secretary' || user?.role === 'treasurer';
    const canApprove = user?.role === 'chairperson';
    const canExecute = user?.role === 'treasurer';
    const shareoutWorkspaceTabs: Array<{ id: ShareoutWorkspaceTab; label: string; description: string }> = [
        ...(canCalculate ? [{
            id: 'draft-generator' as ShareoutWorkspaceTab,
            label: 'Draft Generator',
            description: 'Calculate or recalculate the cycle share-out draft from automated profit, admin deductions, and savings ratios.',
        }] : []),
        {
            id: 'run-register',
            label: 'Run Register',
            description: 'Browse the share-out runs already generated for each cycle and open any run for review.',
        },
        {
            id: 'breakdown',
            label: 'Item Breakdown',
            description: 'Inspect member-by-member payout values, approve or reject the run, and complete execution and payment tracking.',
        },
    ];

    const loadProfitPreview = async (cycleId: number | string) => {
        if (!cycleId) {
            setProfitBreakdown(null);
            setForm((current) => ({ ...current, total_profit: '' }));
            return;
        }

        try {
            const { data } = await api.get<{ profit_breakdown: ShareoutProfitBreakdown }>(`/api/exco/membership-cycles/${cycleId}/shareout-profit-preview`);
            setProfitBreakdown(data.profit_breakdown);
            setForm((current) => ({
                ...current,
                total_profit: String(data.profit_breakdown.total_profit ?? ''),
            }));
        } catch {
            setProfitBreakdown(null);
            setForm((current) => ({ ...current, total_profit: '' }));
            showToast('Unable to calculate the cycle profit preview right now.', 'error');
        }
    };

    const loadRuns = async (page = runsPage) => {
        const { data } = await api.get<PaginatedResponse<ShareoutRun>>('/api/exco/shareout-runs', {
            params: { page, per_page: 10 },
        });
        setRuns(data);
        setRunsPage(data.current_page);
    };

    const loadRunDetail = async (runId: number, page = itemsPage, status = itemStatusFilter) => {
        const [{ data: detail }, { data: paginatedItems }] = await Promise.all([
            api.get<{ run: ShareoutRun; summary: ShareoutSummary; profit_breakdown: ShareoutProfitBreakdown | null; formula: ShareoutFormula }>(`/api/exco/shareout-runs/${runId}`),
            api.get<PaginatedResponse<ShareoutItem>>(`/api/exco/shareout-runs/${runId}/items`, {
                params: { page, per_page: 10, status: status || undefined },
            }),
        ]);

        setSelectedRun(detail.run);
        setSelectedRunSummary(detail.summary);
        setSelectedRunProfitBreakdown(detail.profit_breakdown);
        setSelectedRunFormula(detail.formula);
        setItems(paginatedItems);
        setItemsPage(paginatedItems.current_page);
    };

    useEffect(() => {
        Promise.all([
            api.get<MembershipCycle[]>('/api/exco/membership-cycles').then(({ data }) => {
                setCycles(data);

                const activeCycle = data.find((cycle) => cycle.is_active);

                if (activeCycle) {
                    setForm((current) => ({
                        ...current,
                        membership_cycle_id: String(activeCycle.id),
                        admin_fee_rate: String(activeCycle.shareout_admin_fee_rate ?? 20),
                    }));
                    void loadProfitPreview(activeCycle.id);
                }
            }),
            loadRuns(1),
        ]).catch(() => {
            showToast('Unable to load share-out data right now.', 'error');
        });
    }, []);

    useEffect(() => {
        if (!selectedRun) {
            return;
        }

        const timeout = window.setTimeout(() => {
            void loadRunDetail(selectedRun.id, 1, itemStatusFilter);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [selectedRun?.id, itemStatusFilter]);

    async function generateRun(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            const { data } = await api.post<{ message: string; run: ShareoutRun }>(
                '/api/exco/shareout-runs',
                {
                    membership_cycle_id: Number(form.membership_cycle_id),
                    total_profit: Number(form.total_profit),
                    admin_fee_rate: Number(form.admin_fee_rate),
                    scheduled_start_on: form.scheduled_start_on || null,
                    scheduled_end_on: form.scheduled_end_on || null,
                    notes: form.notes || null,
                },
            );

            showToast(data.message, 'success');
            await loadRuns(1);
            await loadRunDetail(data.run.id, 1);
            setActiveTab('breakdown');
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to calculate share-out run.', 'error');
        }
    }

    async function approveRun() {
        if (!selectedRun) {
            return;
        }

        try {
            const { data } = await api.patch<{ message: string }>(`/api/exco/shareout-runs/${selectedRun.id}/approve`);
            showToast(data.message, 'success');
            await loadRuns(runsPage);
            await loadRunDetail(selectedRun.id, itemsPage);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to approve share-out run.', 'error');
        }
    }

    async function rejectRun() {
        if (!selectedRun) {
            return;
        }

        try {
            const { data } = await api.patch<{ message: string }>(`/api/exco/shareout-runs/${selectedRun.id}/reject`);
            showToast(data.message, 'success');
            await loadRuns(runsPage);
            await loadRunDetail(selectedRun.id, itemsPage);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to reject share-out run.', 'error');
        }
    }

    async function executeRun() {
        if (!selectedRun) {
            return;
        }

        try {
            const { data } = await api.patch<{ message: string }>(`/api/exco/shareout-runs/${selectedRun.id}/execute`);
            showToast(data.message, 'success');
            await loadRuns(runsPage);
            await loadRunDetail(selectedRun.id, itemsPage);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to execute share-out run.', 'error');
        }
    }

    async function deleteRun(run: ShareoutRun) {
        try {
            const { data } = await api.delete<{ message: string }>(`/api/exco/shareout-runs/${run.id}`);
            showToast(data.message, 'success');
            await loadRuns(run.id === selectedRun?.id && runsPage > 1 && runs?.data.length === 1 ? runsPage - 1 : runsPage);
            setRunPendingDelete(null);

            if (selectedRun?.id === run.id) {
                setSelectedRun(null);
                setSelectedRunSummary(null);
                setSelectedRunProfitBreakdown(null);
                setSelectedRunFormula(null);
                setItems(null);
                setItemsPage(1);
                setItemStatusFilter('');
            }
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to delete share-out run.', 'error');
        }
    }

    async function markItemPaid(itemId: number) {
        if (!selectedRun) {
            return;
        }

        try {
            const { data } = await api.patch<{ message: string }>(`/api/exco/shareout-items/${itemId}/mark-paid`);
            showToast(data.message, 'success');
            await loadRunDetail(selectedRun.id, itemsPage);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to mark payout as paid.', 'error');
        }
    }

    const activeShareoutTab = shareoutWorkspaceTabs.find((tab) => tab.id === activeTab) ?? shareoutWorkspaceTabs[0];

    return (
        <div>
            <PageHeader
                description="This workspace calculates the yearly share-out, applies loan deductions and administrative costs, and lets EXCO approve and track payouts."
                eyebrow="Share-out studio"
                title="Prepare, approve, and execute annual share-out runs."
            />

            <div className="workspace-tabs">
                {shareoutWorkspaceTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Share-out studio</p>
                <h3>{activeShareoutTab.label}</h3>
                <p>{activeShareoutTab.description}</p>
            </div>

            {activeTab === 'draft-generator' && canCalculate ? (
                <div className="mt-6">
                    <Panel eyebrow="Share-out run" title="Generate or recalculate a cycle draft">
                        <form className="grid gap-4" onSubmit={(event) => void generateRun(event)}>
                            <label className="app-field">
                                <span className="app-field__label">Cycle</span>
                                <select className="app-field__control" onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({ ...current, membership_cycle_id: value }));
                                    void loadProfitPreview(value);
                                }} required value={form.membership_cycle_id}>
                                    <option value="">Select cycle</option>
                                    {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                                </select>
                            </label>
                            <label className="app-field">
                                <span className="app-field__label">Total Annual Profit</span>
                                <input className="app-field__control" min="0" placeholder="Auto-calculated from recorded cycle income" readOnly required step="0.01" type="number" value={form.total_profit} />
                            </label>
                            <label className="app-field">
                                <span className="app-field__label">Admin Fee Rate (%)</span>
                                <input className="app-field__control" min="0" onChange={(event) => setForm((current) => ({ ...current, admin_fee_rate: event.target.value }))} placeholder="Percentage retained for administration" required step="0.01" type="number" value={form.admin_fee_rate} />
                            </label>
                            <label className="app-field">
                                <span className="app-field__label">Scheduled Share-out Start Date</span>
                                <input className="app-field__control" onChange={(event) => setForm((current) => ({ ...current, scheduled_start_on: event.target.value }))} required type="date" value={form.scheduled_start_on} />
                            </label>
                            <label className="app-field">
                                <span className="app-field__label">Scheduled Share-out End Date</span>
                                <input className="app-field__control" onChange={(event) => setForm((current) => ({ ...current, scheduled_end_on: event.target.value }))} required type="date" value={form.scheduled_end_on} />
                            </label>
                            <label className="app-field">
                                <span className="app-field__label">Notes</span>
                                <textarea className="app-field__control" onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Add context for this share-out run" value={form.notes} />
                            </label>
                            {profitBreakdown ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <SummaryCard label="Loan service charges" value={formatCurrency(profitBreakdown.loan_service_charge_total)} />
                                    <SummaryCard label="Default penalty charges" value={formatCurrency(profitBreakdown.default_penalty_total)} />
                                    <SummaryCard label="Membership fees" value={formatCurrency(profitBreakdown.membership_fee_total)} />
                                    <SummaryCard label="Auto-calculated profit" value={formatCurrency(profitBreakdown.total_profit)} />
                                </div>
                            ) : null}
                            <Notice>
                                The total annual profit is now calculated automatically from recorded loan service charges, posted default penalties, and paid membership fees for the selected cycle. The system will deduct the admin fee, distribute the remaining profit according to each member&apos;s savings ratio, then subtract any outstanding loan balance from the final payout.
                            </Notice>
                            <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" type="submit">Calculate share-out draft</button>
                        </form>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'run-register' ? (
                <div className="mt-6">
                    <Panel eyebrow="Share-out register" title="Calculated runs">
                    {runs ? (
                        <DataTable
                            columns={[
                                { key: 'cycle', header: 'Cycle', render: (run) => run.cycle?.code ?? 'Not set' },
                                { key: 'profit', header: 'Annual Profit', render: (run) => formatCurrency(run.total_profit ?? 0) },
                                { key: 'admin', header: 'Admin Fee', render: (run) => `${run.admin_fee_rate ?? 0}%` },
                                { key: 'distributable', header: 'Distributable Profit', render: (run) => formatCurrency(run.distributable_profit ?? 0) },
                                { key: 'items', header: 'Members', render: (run) => String(run.items_count ?? 0) },
                                { key: 'net', header: 'Net Payout', render: (run) => formatCurrency(run.items_sum_net_payout ?? 0) },
                                { key: 'status', header: 'Status', render: (run) => <StatusBadge active={['approved', 'executed'].includes(run.status)}>{run.status}</StatusBadge> },
                                {
                                    key: 'action',
                                    header: 'Action',
                                    exportable: false,
                                    render: (run) => (
                                        <div className="record-action-group record-action-group--compact">
                                            <button
                                                aria-label={`View share-out run for ${run.cycle?.code ?? 'cycle'}`}
                                                className="app-icon-button"
                                                onClick={() => {
                                                    void loadRunDetail(run.id, 1);
                                                    setActiveTab('breakdown');
                                                }}
                                                title="View run"
                                                type="button"
                                            >
                                                <ViewIcon />
                                            </button>
                                            {run.status === 'calculated' && canCalculate ? (
                                                <button
                                                    aria-label={`Delete share-out run for ${run.cycle?.code ?? 'cycle'}`}
                                                    className="app-icon-button"
                                                    onClick={() => setRunPendingDelete(run)}
                                                    title="Delete run"
                                                    type="button"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            ) : null}
                                        </div>
                                    ),
                                },
                            ]}
                            currentPage={runs.current_page}
                            emptyMessage="No share-out runs have been generated yet."
                            exportFilename="shareout-runs.csv"
                            filterPlaceholder="Filter share-out runs"
                            onPageChange={(page) => void loadRuns(page)}
                            rowKey={(run) => run.id}
                            rows={runs.data}
                            totalItems={runs.total}
                            totalPages={runs.last_page}
                        />
                    ) : <Notice>Loading share-out runs...</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'breakdown' && selectedRun && selectedRunSummary ? (
                <div className="mt-6 grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                        <SummaryCard label="Members" value={String(selectedRunSummary.members_count)} />
                        <SummaryCard label="Total saved" value={formatCurrency(selectedRunSummary.total_saved)} />
                        <SummaryCard label="Total profit" value={formatCurrency(selectedRunSummary.total_profit)} />
                        <SummaryCard label="Admin retained" value={formatCurrency(selectedRunSummary.admin_fee_amount)} />
                        <SummaryCard label="Distributable profit" value={formatCurrency(selectedRunSummary.distributable_profit)} />
                        <SummaryCard label="Loan deductions" value={formatCurrency(selectedRunSummary.outstanding_loan_deduction_total)} />
                        <SummaryCard label="Net payout" value={formatCurrency(selectedRunSummary.net_payout_total)} />
                    </div>

                    {selectedRunProfitBreakdown ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard label="Loan service charges" value={formatCurrency(selectedRunProfitBreakdown.loan_service_charge_total)} />
                            <SummaryCard label="Default penalties" value={formatCurrency(selectedRunProfitBreakdown.default_penalty_total)} />
                            <SummaryCard label="Membership fees" value={formatCurrency(selectedRunProfitBreakdown.membership_fee_total)} />
                            <SummaryCard label="Auto-calculated profit" value={formatCurrency(selectedRunProfitBreakdown.total_profit)} />
                        </div>
                    ) : null}

                    <Panel
                        action={(
                            <div className="shareout-action-group">
                                {selectedRun.status === 'calculated' && canApprove ? <button className="rounded-full bg-[var(--forest)] px-4 py-2.5 text-[0.96rem] font-semibold text-white" onClick={() => void approveRun()} type="button">Approve run</button> : null}
                                {['calculated', 'approved'].includes(selectedRun.status) && canApprove ? <button className="rounded-full bg-[var(--danger)] px-4 py-2.5 text-[0.96rem] font-semibold text-white" onClick={() => void rejectRun()} type="button">Reject run</button> : null}
                                {selectedRun.status === 'approved' && canExecute ? <button className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-[0.96rem] font-semibold text-white" onClick={() => void executeRun()} type="button">Mark as executed</button> : null}
                            </div>
                        )}
                        eyebrow={selectedRun.cycle?.code ?? 'Selected run'}
                        title="Share-out item breakdown"
                    >
                        <div className="mb-4 text-[0.98rem] text-[var(--muted)]">
                            Scheduled window: {formatDate(selectedRun.scheduled_start_on)} to {formatDate(selectedRun.scheduled_end_on)}
                        </div>
                        {selectedRunFormula ? (
                            <Notice>
                                <strong>Allocation formula:</strong> {selectedRunFormula.profit_share} {selectedRunFormula.final_payout}
                            </Notice>
                        ) : null}
                        {items ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (item) => item.member?.full_name ?? 'Unknown' },
                                    { key: 'shares', header: 'Total Shares', render: (item) => String(item.total_shares) },
                                    { key: 'saved', header: 'Total Saved', render: (item) => formatCurrency(item.total_saved) },
                                    { key: 'ratio', header: 'Savings Ratio', render: (item) => `${Number(item.calculation?.savings_ratio_percent ?? 0).toFixed(2)}%` },
                                    { key: 'profit_share', header: 'Profit Share', render: (item) => formatCurrency(item.calculation?.distributable_profit_share ?? 0) },
                                    { key: 'loan', header: 'Loan Deduction', render: (item) => formatCurrency(item.outstanding_loan_deduction) },
                                    { key: 'admin', header: 'Admin Fee', render: (item) => formatCurrency(item.admin_fee_deduction) },
                                    { key: 'net', header: 'Net Payout', render: (item) => formatCurrency(item.net_payout) },
                                    { key: 'status', header: 'Status', render: (item) => <StatusBadge active={item.status === 'paid'}>{item.status}</StatusBadge> },
                                    {
                                        key: 'action',
                                        header: 'Action',
                                        exportable: false,
                                        render: (item) => selectedRun.status === 'executed' && item.status !== 'paid' && canExecute
                                            ? <button className="rounded-full bg-[var(--forest)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void markItemPaid(item.id)} type="button">Mark paid</button>
                                            : item.status,
                                    },
                                ]}
                                currentPage={items.current_page}
                                emptyMessage="No share-out items have been calculated for this run."
                                exportFilename="shareout-items.csv"
                                filterPlaceholder="Filter share-out items"
                                onPageChange={(page) => void loadRunDetail(selectedRun.id, page, itemStatusFilter)}
                                rowKey={(item) => item.id}
                                rows={items.data}
                                toolbarExtras={(
                                    <select className="app-filter-select" onChange={(event) => setItemStatusFilter(event.target.value)} value={itemStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                )}
                                totalItems={items.total}
                                totalPages={items.last_page}
                            />
                        ) : <Notice>Loading share-out items...</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'breakdown' && (!selectedRun || !selectedRunSummary) ? (
                <div className="mt-6">
                    <Notice>Select a share-out run from the register to inspect its member-by-member breakdown.</Notice>
                </div>
            ) : null}

            {runPendingDelete ? (
                <div className="constitution-modal-backdrop">
                    <div className="constitution-modal constitution-modal--narrow">
                        <div className="constitution-modal__header">
                            <div>
                                <div className="constitution-modal__eyebrow">Delete Share-out Run</div>
                                <h3>Are you sure you want to delete this calculated run?</h3>
                            </div>
                            <button className="constitution-modal__close" onClick={() => setRunPendingDelete(null)} type="button">
                                Close
                            </button>
                        </div>
                        <div className="constitution-modal__body">
                            <p>
                                This will permanently remove the share-out run for <strong>{runPendingDelete.cycle?.code ?? 'the selected cycle'}</strong> and automatically clear all generated share-out item breakdown records for that run.
                            </p>
                            <p>
                                Only calculated runs can be deleted. Approved, rejected, or executed runs must stay on record.
                            </p>
                            <div className="shareout-confirmation-actions">
                                <button className="rounded-full border border-[rgba(12,59,102,0.18)] bg-white px-4 py-2.5 text-[0.96rem] font-semibold text-[var(--ink)]" onClick={() => setRunPendingDelete(null)} type="button">
                                    Cancel
                                </button>
                                <button className="rounded-full bg-[var(--danger)] px-4 py-2.5 text-[0.96rem] font-semibold text-white" onClick={() => void deleteRun(runPendingDelete)} type="button">
                                    Yes, delete run
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
