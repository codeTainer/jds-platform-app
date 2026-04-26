import { useEffect, useState } from 'react';
import { AppSelect } from '../../components/ui/AppSelect';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { api } from '../../lib/api';
import type { MemberShareoutOverview, MembershipCycle, PaginatedResponse, ShareoutItem } from '../../types';

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

export function MemberShareoutsSection() {
    const [overview, setOverview] = useState<MemberShareoutOverview | null>(null);
    const [items, setItems] = useState<PaginatedResponse<ShareoutItem> | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [cycleFilter, setCycleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState('');

    const loadTable = async (nextPage = page, nextPerPage = perPage) => {
        const { data } = await api.get<PaginatedResponse<ShareoutItem>>('/api/member/shareouts', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                membership_cycle_id: cycleFilter || undefined,
                status: statusFilter || undefined,
            },
        });
        setItems(data);
        setPage(data.current_page);
        setPerPage(data.per_page);
        setSelectedItemId((current) => {
            if (current && data.data.some((item) => item.id === current)) {
                return current;
            }

            return data.data[0]?.id ?? null;
        });
    };

    useEffect(() => {
        Promise.all([
            api.get<MemberShareoutOverview>('/api/member/shareouts/overview').then(({ data }) => setOverview(data)),
            loadTable(1),
            api.get<MembershipCycle[]>('/api/member/membership-cycles').then(({ data }) => setCycles(data)),
        ]).catch((requestError: any) => {
            setError(requestError.response?.data?.message ?? 'Unable to load share-out information right now.');
        });
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadTable(1, perPage);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [cycleFilter, statusFilter, perPage]);

    const selectedItem = items?.data.find((item) => item.id === selectedItemId) ?? null;

    return (
        <div>
            <PageHeader
                description="This section shows your yearly share-out records, deductions, and net payout values as EXCO completes each cycle payout run."
                eyebrow="Share-outs"
                title="Review your annual share-out history."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            {overview ? (
                <div className="member-summary-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Share-out runs" value={String(overview.summary.shareout_items_count)} />
                    <SummaryCard label="Gross return" value={formatCurrency(overview.summary.total_gross_return)} />
                    <SummaryCard label="Loan deductions" value={formatCurrency(overview.summary.total_outstanding_loan_deduction)} />
                    <SummaryCard label="Net payout" value={formatCurrency(overview.summary.total_net_payout)} />
                </div>
            ) : null}

            {overview?.formula ? (
                <div className="mt-6">
                    <Notice>
                        <strong>Share-out formula:</strong> {overview.formula.profit_share} {overview.formula.final_payout}
                    </Notice>
                </div>
            ) : null}

            <div className="mt-6">
                <Panel eyebrow="Share-out records" title="Your share-out breakdowns">
                    {items ? (
                        <DataTable
                            columns={[
                                { key: 'cycle', header: 'Cycle', render: (item) => item.run?.cycle?.code ?? 'Not set' },
                                { key: 'total_saved', header: 'Total Saved', render: (item) => formatCurrency(item.total_saved) },
                                { key: 'savings_ratio', header: 'Savings Ratio', render: (item) => `${Number(item.calculation?.savings_ratio_percent ?? 0).toFixed(2)}%` },
                                { key: 'profit_share', header: 'Share of Profit', render: (item) => formatCurrency(item.calculation?.distributable_profit_share ?? 0) },
                                { key: 'loan_deduction', header: 'Loan Deduction', render: (item) => formatCurrency(item.outstanding_loan_deduction) },
                                { key: 'net_payout', header: 'Net Payout', render: (item) => formatCurrency(item.net_payout) },
                                { key: 'status', header: 'Status', render: (item) => item.status },
                                { key: 'paid_at', header: 'Paid At', render: (item) => formatDate(item.paid_at) },
                                {
                                    key: 'action',
                                    header: 'Action',
                                    exportable: false,
                                    render: (item) => (
                                        <button
                                            aria-label={`View share-out breakdown for ${item.run?.cycle?.code ?? 'cycle'}`}
                                            className="app-icon-button"
                                            onClick={() => setSelectedItemId(item.id)}
                                            title="View breakdown"
                                            type="button"
                                        >
                                            <ViewIcon />
                                        </button>
                                    ),
                                },
                            ]}
                            currentPage={items.current_page}
                            currentPerPage={perPage}
                            emptyMessage="No share-out records have been posted for your account yet."
                            exportFilename="my-shareouts.csv"
                            filterPlaceholder="Filter share-out records"
                            onPageChange={(nextPage) => void loadTable(nextPage)}
                            onPerPageChange={(value) => {
                                setPage(1);
                                setPerPage(value);
                            }}
                            rowKey={(item) => item.id}
                            rows={items.data}
                            toolbarExtras={(
                                <>
                                    <AppSelect className="app-filter-select" onChange={(event) => setCycleFilter(event.target.value)} value={cycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </AppSelect>
                                    <AppSelect className="app-filter-select" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                    </AppSelect>
                                </>
                            )}
                            totalItems={items.total}
                            totalPages={items.last_page}
                        />
                    ) : <Notice>Loading share-out records...</Notice>}
                </Panel>
            </div>

            {selectedItem ? (
                <div className="mt-6 grid gap-6">
                    <Panel
                        eyebrow={selectedItem.run?.cycle?.code ?? 'Selected share-out'}
                        title="How this share-out was calculated"
                    >
                        <div className="shareout-explainer">
                            <p className="shareout-explainer__lead">
                                This breakdown shows the full cycle profit pool, the 20% admin retention, your savings ratio within the total savings pool, and the final payout after any outstanding loan deduction.
                            </p>
                            <div className="member-summary-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard label="Loan service charges" value={formatCurrency(selectedItem.profit_breakdown?.loan_service_charge_total ?? 0)} />
                                <SummaryCard label="Default penalties" value={formatCurrency(selectedItem.profit_breakdown?.default_penalty_total ?? 0)} />
                                <SummaryCard label="Membership fees" value={formatCurrency(selectedItem.profit_breakdown?.membership_fee_total ?? 0)} />
                                <SummaryCard label="Total cycle profit" value={formatCurrency(selectedItem.run_context?.total_profit ?? 0)} />
                                <SummaryCard label="Admin retained" value={formatCurrency(selectedItem.run_context?.admin_fee_amount ?? 0)} />
                                <SummaryCard label="Distributable profit" value={formatCurrency(selectedItem.run_context?.distributable_profit ?? 0)} />
                                <SummaryCard label="Total savings by all members" value={formatCurrency(selectedItem.run_context?.total_savings_pool ?? 0)} />
                                <SummaryCard label="Your total savings" value={formatCurrency(selectedItem.calculation?.principal_amount ?? selectedItem.total_saved)} />
                                <SummaryCard label="Your savings ratio" value={`${Number(selectedItem.calculation?.savings_ratio_percent ?? 0).toFixed(2)}%`} />
                                <SummaryCard label="Your share of profit" value={formatCurrency(selectedItem.calculation?.distributable_profit_share ?? 0)} />
                                <SummaryCard label="Outstanding loan deduction" value={formatCurrency(selectedItem.outstanding_loan_deduction)} />
                                <SummaryCard label="Final share-out payout" value={formatCurrency(selectedItem.net_payout)} />
                            </div>
                            <div className="shareout-formula-box">
                                <p><strong>Profit-share formula:</strong> (Your total savings / Total savings by all members) x Distributable profit</p>
                                <p><strong>Final payout formula:</strong> Your total savings + Your share of profit - Outstanding loan deduction</p>
                            </div>
                        </div>
                    </Panel>
                </div>
            ) : null}
        </div>
    );
}

