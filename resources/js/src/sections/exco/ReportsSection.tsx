import { useEffect, useState } from 'react';
import { AppSelect } from '../../components/ui/AppSelect';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { downloadTableExport, type TableExportFormat } from '../../lib/download';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Concern, ExcoReportSummaryResponse, Loan, Member, MembershipCycle, PaginatedResponse, ShareoutItem } from '../../types';

type ReportTab = 'summary' | 'savings' | 'loans' | 'shareouts' | 'concerns';

const reportTabs: Array<{ id: ReportTab; label: string; description: string }> = [
    {
        id: 'summary',
        label: 'Cycle Summary',
        description: 'See the main operating totals for the selected cycle, including savings, fees, loans, share-out, and support metrics.',
    },
    {
        id: 'savings',
        label: 'Savings Report',
        description: 'Review member-by-member savings totals, share counts, and membership fee intake for the selected cycle.',
    },
    {
        id: 'loans',
        label: 'Loan Report',
        description: 'Track requested, approved, disbursed, repaid, and outstanding loan positions for the selected cycle.',
    },
    {
        id: 'shareouts',
        label: 'Share-out Report',
        description: 'Review share-out payout records by member, including deductions and payment status.',
    },
    {
        id: 'concerns',
        label: 'Concern Report',
        description: 'Monitor support activity, outstanding issues, and resolution performance across the platform.',
    },
];

export function ReportsSection() {
    const [activeTab, setActiveTab] = useState<ReportTab>('summary');
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [cycleFilter, setCycleFilter] = useState('');
    const [loanStatusFilter, setLoanStatusFilter] = useState('');
    const [shareoutStatusFilter, setShareoutStatusFilter] = useState('');
    const [concernStatusFilter, setConcernStatusFilter] = useState('');
    const [concernTypeFilter, setConcernTypeFilter] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [summary, setSummary] = useState<ExcoReportSummaryResponse | null>(null);
    const [savingsRows, setSavingsRows] = useState<PaginatedResponse<Member> | null>(null);
    const [loanRows, setLoanRows] = useState<PaginatedResponse<Loan> | null>(null);
    const [shareoutRows, setShareoutRows] = useState<PaginatedResponse<ShareoutItem> | null>(null);
    const [concernRows, setConcernRows] = useState<PaginatedResponse<Concern> | null>(null);
    const [savingsPage, setSavingsPage] = useState(1);
    const [loanPage, setLoanPage] = useState(1);
    const [shareoutPage, setShareoutPage] = useState(1);
    const [concernPage, setConcernPage] = useState(1);
    const [savingsPerPage, setSavingsPerPage] = useState(10);
    const [loanPerPage, setLoanPerPage] = useState(10);
    const [shareoutPerPage, setShareoutPerPage] = useState(10);
    const [concernPerPage, setConcernPerPage] = useState(10);
    const [error, setError] = useState('');

    const activeReportTab = reportTabs.find((tab) => tab.id === activeTab) ?? reportTabs[0];

    const loadSummary = async () => {
        const { data } = await api.get<ExcoReportSummaryResponse>('/api/exco/reports/summary', {
            params: {
                membership_cycle_id: cycleFilter || undefined,
            },
        });
        setSummary(data);
    };

    const loadSavings = async (nextPage = savingsPage, nextPerPage = savingsPerPage) => {
        const { data } = await api.get<PaginatedResponse<Member>>('/api/exco/reports/savings', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                membership_cycle_id: cycleFilter || undefined,
                search: memberSearch || undefined,
            },
        });
        setSavingsRows(data);
        setSavingsPage(data.current_page);
        setSavingsPerPage(data.per_page);
    };

    const loadLoans = async (nextPage = loanPage, nextPerPage = loanPerPage) => {
        const { data } = await api.get<PaginatedResponse<Loan>>('/api/exco/reports/loans', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                membership_cycle_id: cycleFilter || undefined,
                status: loanStatusFilter || undefined,
            },
        });
        setLoanRows(data);
        setLoanPage(data.current_page);
        setLoanPerPage(data.per_page);
    };

    const loadShareouts = async (nextPage = shareoutPage, nextPerPage = shareoutPerPage) => {
        const { data } = await api.get<PaginatedResponse<ShareoutItem>>('/api/exco/reports/shareouts', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                membership_cycle_id: cycleFilter || undefined,
                status: shareoutStatusFilter || undefined,
            },
        });
        setShareoutRows(data);
        setShareoutPage(data.current_page);
        setShareoutPerPage(data.per_page);
    };

    const loadConcerns = async (nextPage = concernPage, nextPerPage = concernPerPage) => {
        const { data } = await api.get<PaginatedResponse<Concern>>('/api/exco/reports/concerns', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                status: concernStatusFilter || undefined,
                reference_type: concernTypeFilter || undefined,
            },
        });
        setConcernRows(data);
        setConcernPage(data.current_page);
        setConcernPerPage(data.per_page);
    };

    useEffect(() => {
        Promise.all([
            api.get<MembershipCycle[]>('/api/exco/membership-cycles').then(({ data }) => {
                setCycles(data);
                const activeCycle = data.find((cycle) => cycle.is_active);

                if (activeCycle) {
                    setCycleFilter(String(activeCycle.id));
                }
            }),
            loadSummary(),
            loadSavings(1),
            loadLoans(1),
            loadShareouts(1),
            loadConcerns(1),
        ]).catch((requestError: any) => {
            setError(requestError.response?.data?.message ?? 'Unable to load reports right now.');
        });
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void Promise.all([
                loadSummary(),
                loadSavings(1, savingsPerPage),
                loadLoans(1, loanPerPage),
                loadShareouts(1, shareoutPerPage),
                loadConcerns(1, concernPerPage),
            ]);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [cycleFilter, memberSearch, loanStatusFilter, shareoutStatusFilter, concernStatusFilter, concernTypeFilter, savingsPerPage, loanPerPage, shareoutPerPage, concernPerPage]);

    async function exportSavings(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<Member>>('/api/exco/reports/savings', {
            params: {
                page: 1,
                per_page: 250,
                membership_cycle_id: cycleFilter || undefined,
                search: memberSearch || undefined,
            },
        });
        downloadTableExport(format, 'savings-report.csv', ['Member', 'Member Code', 'Share Entries', 'Total Shares', 'Total Saved', 'Fees Paid Count', 'Fees Paid Total'], data.data.map((member) => [
            member.full_name,
            member.member_number,
            member.share_purchase_entries_count ?? 0,
            member.total_shares_count ?? 0,
            member.total_saved_value ?? 0,
            member.membership_fee_entries_count ?? 0,
            member.membership_fees_paid_total ?? 0,
        ]));
    }

    async function exportLoans(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<Loan>>('/api/exco/reports/loans', {
            params: {
                page: 1,
                per_page: 250,
                membership_cycle_id: cycleFilter || undefined,
                status: loanStatusFilter || undefined,
            },
        });
        downloadTableExport(format, 'loan-report.csv', ['Member', 'Cycle', 'Requested Amount', 'Approved Amount', 'Outstanding', 'Service Charge', 'Status', 'Requested At'], data.data.map((loan) => [
            loan.member?.full_name,
            loan.cycle?.code,
            loan.requested_amount,
            loan.approved_amount,
            loan.outstanding_amount,
            loan.service_charge_amount,
            loan.status,
            formatDate(loan.requested_at),
        ]));
    }

    async function exportShareouts(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<ShareoutItem>>('/api/exco/reports/shareouts', {
            params: {
                page: 1,
                per_page: 250,
                membership_cycle_id: cycleFilter || undefined,
                status: shareoutStatusFilter || undefined,
            },
        });
        downloadTableExport(format, 'shareout-report.csv', ['Member', 'Cycle', 'Total Saved', 'Loan Deduction', 'Admin Fee', 'Net Payout', 'Status', 'Paid At'], data.data.map((item) => [
            item.member?.full_name,
            item.run?.cycle?.code,
            item.total_saved,
            item.outstanding_loan_deduction,
            item.admin_fee_deduction,
            item.net_payout,
            item.status,
            formatDate(item.paid_at),
        ]));
    }

    async function exportConcerns(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<Concern>>('/api/exco/reports/concerns', {
            params: {
                page: 1,
                per_page: 250,
                status: concernStatusFilter || undefined,
                reference_type: concernTypeFilter || undefined,
            },
        });
        downloadTableExport(format, 'concern-report.csv', ['Member', 'Subject', 'Category', 'Status', 'Raised On', 'Resolved On'], data.data.map((concern) => [
            concern.member?.full_name,
            concern.subject,
            concern.reference_group_label,
            concern.status,
            formatDate(concern.raised_at),
            formatDate(concern.resolved_at),
        ]));
    }

    return (
        <div>
            <PageHeader
                description="This reporting workspace gives EXCO a cycle-by-cycle view of savings performance, loan exposure, share-out payouts, and support workload."
                eyebrow="Reports and audit"
                title="Review operational reports across the cooperative."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="workspace-tabs">
                {reportTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Reports workspace</p>
                <h3>{activeReportTab.label}</h3>
                <p>{activeReportTab.description}</p>
            </div>

            <div className="mt-6">
                <Panel eyebrow="Report filters" title="Choose the cycle and report filters">
                    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                        <label className="app-field">
                            <span className="app-field__label">Cycle</span>
                            <AppSelect className="app-field__control" onChange={(event) => setCycleFilter(event.target.value)} value={cycleFilter}>
                                <option value="">Active cycle / all cycles</option>
                                {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                            </AppSelect>
                        </label>
                        {activeTab === 'savings' ? (
                            <label className="app-field">
                                <span className="app-field__label">Member search</span>
                                <input className="app-field__control" onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search member" value={memberSearch} />
                            </label>
                        ) : null}
                        {activeTab === 'loans' ? (
                            <label className="app-field">
                                <span className="app-field__label">Loan status</span>
                                <AppSelect className="app-field__control" onChange={(event) => setLoanStatusFilter(event.target.value)} value={loanStatusFilter}>
                                    <option value="">All statuses</option>
                                    <option value="pending_guarantor">Pending guarantor</option>
                                    <option value="guarantor_approved">Guarantor approved</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="disbursed">Disbursed</option>
                                    <option value="partially_repaid">Partially repaid</option>
                                    <option value="repaid">Repaid</option>
                                </AppSelect>
                            </label>
                        ) : null}
                        {activeTab === 'shareouts' ? (
                            <label className="app-field">
                                <span className="app-field__label">Share-out status</span>
                                <AppSelect className="app-field__control" onChange={(event) => setShareoutStatusFilter(event.target.value)} value={shareoutStatusFilter}>
                                    <option value="">All statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </AppSelect>
                            </label>
                        ) : null}
                        {activeTab === 'concerns' ? (
                            <>
                                <label className="app-field">
                                    <span className="app-field__label">Concern status</span>
                                    <AppSelect className="app-field__control" onChange={(event) => setConcernStatusFilter(event.target.value)} value={concernStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="open">Open</option>
                                        <option value="in_review">In review</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </AppSelect>
                                </label>
                                <label className="app-field">
                                    <span className="app-field__label">Concern category</span>
                                    <AppSelect className="app-field__control" onChange={(event) => setConcernTypeFilter(event.target.value)} value={concernTypeFilter}>
                                        <option value="">All categories</option>
                                        <option value="account">Account / Profile</option>
                                        <option value="share_payment_submission">Share Receipt Submission</option>
                                        <option value="share_purchase">Share Purchase Record</option>
                                        <option value="membership_fee_submission">Membership Fee Receipt</option>
                                        <option value="membership_fee">Membership Fee Record</option>
                                        <option value="loan">Loan Record</option>
                                        <option value="loan_repayment_submission">Loan Repayment Receipt</option>
                                        <option value="shareout_item">Share-out Record</option>
                                    </AppSelect>
                                </label>
                            </>
                        ) : null}
                    </div>
                </Panel>
            </div>

            {activeTab === 'summary' && summary ? (
                <div className="mt-6 grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <SummaryCard label="Members on platform" value={String(summary.summary.members_on_platform)} />
                        <SummaryCard label="Members with savings" value={String(summary.summary.members_with_savings)} />
                        <SummaryCard label="Total savings" value={formatCurrency(summary.summary.total_savings_value)} />
                        <SummaryCard label="Fees paid" value={formatCurrency(summary.summary.membership_fees_paid_total)} />
                        <SummaryCard label="Loans disbursed" value={formatCurrency(summary.summary.loans_disbursed_total)} />
                        <SummaryCard label="Service charges" value={formatCurrency(summary.summary.loan_service_charge_total)} />
                        <SummaryCard label="Outstanding loans" value={formatCurrency(summary.summary.outstanding_loan_balance)} />
                        <SummaryCard label="Share-out net payout" value={formatCurrency(summary.summary.shareout_net_payout_total)} />
                        <SummaryCard label="Share-out paid" value={formatCurrency(summary.summary.shareout_paid_total)} />
                        <SummaryCard label="Open concerns" value={String(summary.summary.open_concerns_count)} />
                    </div>

                    <Panel eyebrow="Cycle context" title={summary.cycle?.name ?? 'Current reporting scope'}>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard label="Cycle code" value={summary.cycle?.code ?? 'All cycles'} />
                            <SummaryCard label="Starts on" value={summary.cycle ? formatDate(summary.cycle.starts_on) : 'Not filtered'} />
                            <SummaryCard label="Ends on" value={summary.cycle ? formatDate(summary.cycle.ends_on) : 'Not filtered'} />
                            <SummaryCard label="Resolved concerns" value={String(summary.summary.resolved_concerns_count)} />
                        </div>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'savings' ? (
                <div className="mt-6">
                    <Panel eyebrow="Savings report" title="Member savings and fee intake">
                        {savingsRows ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (member) => member.full_name },
                                    { key: 'member_number', header: 'Member Code', render: (member) => member.member_number ?? 'Not set' },
                                    { key: 'share_entries', header: 'Share Entries', render: (member) => String(member.share_purchase_entries_count ?? 0) },
                                    { key: 'total_shares', header: 'Total Shares', render: (member) => String(member.total_shares_count ?? 0) },
                                    { key: 'total_saved', header: 'Total Saved', render: (member) => formatCurrency(member.total_saved_value ?? 0) },
                                    { key: 'fees_paid_count', header: 'Fees Paid Count', render: (member) => String(member.membership_fee_entries_count ?? 0) },
                                    { key: 'fees_paid_total', header: 'Fees Paid Total', render: (member) => formatCurrency(member.membership_fees_paid_total ?? 0) },
                                ]}
                                currentPage={savingsRows.current_page}
                                currentPerPage={savingsPerPage}
                                emptyMessage="No savings records found for the selected filters."
                                exportFilename="savings-report.csv"
                                filterPlaceholder="Filter savings report"
                                onExport={(format) => void exportSavings(format)}
                                onPageChange={(nextPage) => void loadSavings(nextPage)}
                                onPerPageChange={(value) => {
                                    setSavingsPage(1);
                                    setSavingsPerPage(value);
                                }}
                                rowKey={(member) => member.id}
                                rows={savingsRows.data}
                                totalItems={savingsRows.total}
                                totalPages={savingsRows.last_page}
                            />
                        ) : <Notice>Loading savings report...</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'loans' ? (
                <div className="mt-6">
                    <Panel eyebrow="Loan report" title="Loan portfolio register">
                        {loanRows ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (loan) => loan.member?.full_name ?? 'Unknown' },
                                    { key: 'cycle', header: 'Cycle', render: (loan) => loan.cycle?.code ?? 'Not set' },
                                    { key: 'requested', header: 'Requested Amount', render: (loan) => formatCurrency(loan.requested_amount) },
                                    { key: 'approved', header: 'Approved Amount', render: (loan) => formatCurrency(loan.approved_amount ?? 0) },
                                    { key: 'outstanding', header: 'Outstanding', render: (loan) => formatCurrency(loan.outstanding_amount ?? 0) },
                                    { key: 'charge', header: 'Service Charge', render: (loan) => formatCurrency(loan.service_charge_amount ?? 0) },
                                    { key: 'status', header: 'Status', render: (loan) => loan.status.replace('_', ' ') },
                                    { key: 'requested_at', header: 'Requested At', render: (loan) => formatDate(loan.requested_at) },
                                ]}
                                currentPage={loanRows.current_page}
                                currentPerPage={loanPerPage}
                                emptyMessage="No loan records found for the selected filters."
                                exportFilename="loan-report.csv"
                                filterPlaceholder="Filter loan report"
                                onExport={(format) => void exportLoans(format)}
                                onPageChange={(nextPage) => void loadLoans(nextPage)}
                                onPerPageChange={(value) => {
                                    setLoanPage(1);
                                    setLoanPerPage(value);
                                }}
                                rowKey={(loan) => loan.id}
                                rows={loanRows.data}
                                totalItems={loanRows.total}
                                totalPages={loanRows.last_page}
                            />
                        ) : <Notice>Loading loan report...</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'shareouts' ? (
                <div className="mt-6">
                    <Panel eyebrow="Share-out report" title="Share-out payout register">
                        {shareoutRows ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (item) => item.member?.full_name ?? 'Unknown' },
                                    { key: 'cycle', header: 'Cycle', render: (item) => item.run?.cycle?.code ?? 'Not set' },
                                    { key: 'saved', header: 'Total Saved', render: (item) => formatCurrency(item.total_saved) },
                                    { key: 'loan', header: 'Loan Deduction', render: (item) => formatCurrency(item.outstanding_loan_deduction) },
                                    { key: 'admin', header: 'Admin Fee', render: (item) => formatCurrency(item.admin_fee_deduction) },
                                    { key: 'net', header: 'Net Payout', render: (item) => formatCurrency(item.net_payout) },
                                    { key: 'status', header: 'Status', render: (item) => item.status },
                                    { key: 'paid_at', header: 'Paid At', render: (item) => formatDate(item.paid_at) },
                                ]}
                                currentPage={shareoutRows.current_page}
                                currentPerPage={shareoutPerPage}
                                emptyMessage="No share-out records found for the selected filters."
                                exportFilename="shareout-report.csv"
                                filterPlaceholder="Filter share-out report"
                                onExport={(format) => void exportShareouts(format)}
                                onPageChange={(nextPage) => void loadShareouts(nextPage)}
                                onPerPageChange={(value) => {
                                    setShareoutPage(1);
                                    setShareoutPerPage(value);
                                }}
                                rowKey={(item) => item.id}
                                rows={shareoutRows.data}
                                totalItems={shareoutRows.total}
                                totalPages={shareoutRows.last_page}
                            />
                        ) : <Notice>Loading share-out report...</Notice>}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'concerns' ? (
                <div className="mt-6">
                    <Panel eyebrow="Concern report" title="Support and resolution register">
                        {concernRows ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (concern) => concern.member?.full_name ?? 'Unknown' },
                                    { key: 'subject', header: 'Subject', render: (concern) => concern.subject },
                                    { key: 'category', header: 'Category', render: (concern) => concern.reference_group_label },
                                    { key: 'status', header: 'Status', render: (concern) => concern.status.replace('_', ' ') },
                                    { key: 'raised_at', header: 'Raised On', render: (concern) => formatDate(concern.raised_at) },
                                    { key: 'resolved_at', header: 'Resolved On', render: (concern) => formatDate(concern.resolved_at) },
                                ]}
                                currentPage={concernRows.current_page}
                                currentPerPage={concernPerPage}
                                emptyMessage="No concern records found for the selected filters."
                                exportFilename="concern-report.csv"
                                filterPlaceholder="Filter concern report"
                                onExport={(format) => void exportConcerns(format)}
                                onPageChange={(nextPage) => void loadConcerns(nextPage)}
                                onPerPageChange={(value) => {
                                    setConcernPage(1);
                                    setConcernPerPage(value);
                                }}
                                rowKey={(concern) => concern.id}
                                rows={concernRows.data}
                                totalItems={concernRows.total}
                                totalPages={concernRows.last_page}
                            />
                        ) : <Notice>Loading concern report...</Notice>}
                    </Panel>
                </div>
            ) : null}
        </div>
    );
}
