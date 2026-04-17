import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppSelect } from '../components/ui/AppSelect';
import { DataTable } from '../components/ui/DataTable';
import { Notice } from '../components/ui/Notice';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useToast } from '../feedback/ToastProvider';
import { downloadTableExport, type TableExportFormat } from '../lib/download';
import { formatCurrency, formatDate, formatMonth } from '../lib/formatters';
import { api } from '../lib/api';
import { MemberExitSection } from '../sections/member/ExitSection';
import { SupportSection } from '../sections/member/SupportSection';
import { AccountSection } from '../sections/shared/AccountSection';
import { NotificationsSection } from '../sections/shared/NotificationsSection';
import type { Loan, LoanGuarantorApproval, LoanOverview, LoanRepaymentSubmission, MemberShareoutOverview, MembershipCycle, MembershipFee, MembershipFeeSubmission, PaginatedResponse, SavingsOverview, SharePaymentSubmission, SharePurchase, ShareoutItem } from '../types';

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

export function MemberDashboardPage() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route element={<MemberHomeSection name={user?.member?.full_name ?? user?.name ?? 'member'} />} index />
            <Route element={<AccountSection />} path="account" />
            <Route element={<MemberSavingsSection />} path="savings" />
            <Route element={<MemberShareoutsSection />} path="shareouts" />
            <Route element={<MemberLoansSection />} path="loans" />
            <Route element={<MemberExitSection />} path="exits" />
            <Route element={<NotificationsSection />} path="notifications" />
            <Route element={<SupportSection />} path="support" />
            <Route element={<Navigate replace to="/dashboard/member" />} path="*" />
        </Routes>
    );
}

type SavingsWorkspaceTab = 'overview' | 'share-payment' | 'submitted-receipts' | 'share-history' | 'fee-payment' | 'fee-submissions' | 'membership-fees';

const savingsWorkspaceTabs: Array<{ id: SavingsWorkspaceTab; label: string; description: string }> = [
    {
        id: 'overview',
        label: 'Overview',
        description: 'See your current savings summary and pending fee count at a glance.',
    },
    {
        id: 'share-payment',
        label: 'Share Payment',
        description: 'Upload a receipt so EXCO can verify and post your latest monthly share purchase.',
    },
    {
        id: 'submitted-receipts',
        label: 'Submitted Receipts',
        description: 'Track every receipt you have submitted and see whether it is pending, approved, or rejected.',
    },
    {
        id: 'share-history',
        label: 'Share History',
        description: 'Review the official monthly share purchases that have already been verified for your account.',
    },
    {
        id: 'fee-payment',
        label: 'Fee Payment',
        description: 'Upload a membership fee receipt so EXCO can verify and post the official fee entry for your cycle.',
    },
    {
        id: 'fee-submissions',
        label: 'Fee Receipts',
        description: 'Track each membership fee receipt you have submitted and see whether it is pending, approved, or rejected.',
    },
    {
        id: 'membership-fees',
        label: 'Fee Records',
        description: 'Check your cycle-based fee records and payment status after EXCO confirms your receipt.',
    },
];

function MemberShareoutsSection() {
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

type MemberLoanTab = 'overview' | 'request-loan' | 'guarantor-queue' | 'repayment-receipts' | 'loan-history';

const memberLoanTabs: Array<{ id: MemberLoanTab; label: string; description: string }> = [
    {
        id: 'overview',
        label: 'Overview',
        description: 'See your current eligibility, loan multiplier, and whether you can submit a fresh request right now.',
    },
    {
        id: 'request-loan',
        label: 'Request Loan',
        description: 'Submit a new loan request with a guarantor and supporting notes directly from your member workspace.',
    },
    {
        id: 'guarantor-queue',
        label: 'Guarantor Queue',
        description: 'Respond to requests where another member has selected you as guarantor for a pending loan.',
    },
    {
        id: 'repayment-receipts',
        label: 'Repayment Receipts',
        description: 'Upload your repayment receipt for EXCO review and track whether the repayment proof has been approved or rejected.',
    },
    {
        id: 'loan-history',
        label: 'Loan History',
        description: 'Review your existing loan records, balances, due dates, and any deletable pre-disbursement requests.',
    },
];

function MemberLoansSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<MemberLoanTab>('overview');
    const [overview, setOverview] = useState<LoanOverview | null>(null);
    const [loans, setLoans] = useState<PaginatedResponse<Loan> | null>(null);
    const [guarantorApprovals, setGuarantorApprovals] = useState<PaginatedResponse<LoanGuarantorApproval> | null>(null);
    const [selectedGuarantorApproval, setSelectedGuarantorApproval] = useState<LoanGuarantorApproval | null>(null);
    const [repaymentSubmissions, setRepaymentSubmissions] = useState<PaginatedResponse<LoanRepaymentSubmission> | null>(null);
    const [guarantors, setGuarantors] = useState<Array<{ id: number; member_number: string | null; full_name: string; email: string }>>([]);
    const [loanPage, setLoanPage] = useState(1);
    const [approvalPage, setApprovalPage] = useState(1);
    const [repaymentSubmissionPage, setRepaymentSubmissionPage] = useState(1);
    const [loanPerPage, setLoanPerPage] = useState(10);
    const [approvalPerPage, setApprovalPerPage] = useState(10);
    const [repaymentSubmissionPerPage, setRepaymentSubmissionPerPage] = useState(10);
    const [loanPendingDelete, setLoanPendingDelete] = useState<Loan | null>(null);
    const [error, setError] = useState('');
    const [repaymentSubmissionStatusFilter, setRepaymentSubmissionStatusFilter] = useState('');
    const [repaymentFile, setRepaymentFile] = useState<File | null>(null);
    const [repaymentSubmitting, setRepaymentSubmitting] = useState(false);
    const [loanForm, setLoanForm] = useState({
        requested_amount: '',
        guarantor_member_id: '',
        purpose: '',
        notes: '',
    });
    const [repaymentForm, setRepaymentForm] = useState({
        amount_paid: '',
        member_note: '',
    });

    const loadOverview = async () => {
        const { data } = await api.get<LoanOverview>('/api/member/loans/overview');
        setOverview(data);
    };

    const loadTables = async (
        nextLoanPage = loanPage,
        nextApprovalPage = approvalPage,
        nextRepaymentSubmissionPage = repaymentSubmissionPage,
        nextLoanPerPage = loanPerPage,
        nextApprovalPerPage = approvalPerPage,
        nextRepaymentPerPage = repaymentSubmissionPerPage,
    ) => {
        const [loanResponse, approvalResponse, repaymentSubmissionResponse] = await Promise.all([
            api.get<PaginatedResponse<Loan>>('/api/member/loans', { params: { page: nextLoanPage, per_page: nextLoanPerPage } }),
            api.get<PaginatedResponse<LoanGuarantorApproval>>('/api/member/guarantor-approvals', { params: { page: nextApprovalPage, per_page: nextApprovalPerPage } }),
            api.get<PaginatedResponse<LoanRepaymentSubmission>>('/api/member/loan-repayment-submissions', {
                params: {
                    page: nextRepaymentSubmissionPage,
                    per_page: nextRepaymentPerPage,
                    status: repaymentSubmissionStatusFilter || undefined,
                },
            }),
        ]);

        setLoans(loanResponse.data);
        setGuarantorApprovals(approvalResponse.data);
        setRepaymentSubmissions(repaymentSubmissionResponse.data);
        setLoanPage(loanResponse.data.current_page);
        setApprovalPage(approvalResponse.data.current_page);
        setRepaymentSubmissionPage(repaymentSubmissionResponse.data.current_page);
        setLoanPerPage(loanResponse.data.per_page);
        setApprovalPerPage(approvalResponse.data.per_page);
        setRepaymentSubmissionPerPage(repaymentSubmissionResponse.data.per_page);
    };

    useEffect(() => {
        Promise.all([
            loadOverview(),
            loadTables(1, 1),
            api.get<Array<{ id: number; member_number: string | null; full_name: string; email: string }>>('/api/member/loan-guarantors').then(({ data }) => setGuarantors(data)),
        ]).catch((requestError: any) => {
            setError(requestError.response?.data?.message ?? 'Unable to load loan information right now.');
        });
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadTables(loanPage, approvalPage, 1, loanPerPage, approvalPerPage, repaymentSubmissionPerPage);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [repaymentSubmissionStatusFilter, loanPerPage, approvalPerPage, repaymentSubmissionPerPage]);

    async function requestLoan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!overview?.summary.can_request) {
            showToast(
                overview?.summary.request_block_reason ?? 'You cannot request another loan right now.',
                'error',
            );

            return;
        }

        try {
            await api.post('/api/member/loans', {
                requested_amount: Number(loanForm.requested_amount),
                guarantor_member_id: Number(loanForm.guarantor_member_id),
                purpose: loanForm.purpose || null,
                notes: loanForm.notes || null,
            });
            setLoanForm({ requested_amount: '', guarantor_member_id: '', purpose: '', notes: '' });
            showToast('Loan request submitted successfully.', 'success');
            await Promise.all([loadOverview(), loadTables(1, approvalPage, repaymentSubmissionPage)]);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to submit loan request.', 'error');
        }
    }

    async function respondToGuarantorApproval(approvalId: number, status: 'approved' | 'rejected') {
        try {
            await api.patch(`/api/member/guarantor-approvals/${approvalId}`, { status });
            showToast(`Guarantor request ${status}.`, 'success');
            await loadTables(loanPage, approvalPage, repaymentSubmissionPage);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to respond to guarantor request.', 'error');
        }
    }

    async function deleteLoan(loanId: number) {
        try {
            await api.delete(`/api/member/loans/${loanId}`);
            showToast('Loan request deleted successfully.', 'success');
            setLoanPendingDelete(null);
            await Promise.all([loadOverview(), loadTables(1, approvalPage, repaymentSubmissionPage)]);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to delete loan request.', 'error');
        }
    }

    async function submitRepaymentReceipt(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!overview?.summary.active_loan || !['disbursed', 'partially_repaid'].includes(overview.summary.active_loan.status)) {
            showToast('There is no active disbursed loan available for repayment submission right now.', 'error');
            return;
        }

        if (!repaymentFile) {
            showToast('Please upload your repayment receipt before submitting.', 'error');
            return;
        }

        const normalizedAmount = repaymentForm.amount_paid.replace(/,/g, '').trim();
        const parsedAmount = Number(normalizedAmount);

        if (!normalizedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            showToast('Enter a valid repayment amount, for example 200000 or 200,000.', 'error');
            return;
        }

        const payload = new FormData();
        payload.append('loan_id', String(overview.summary.active_loan.id));
        payload.append('amount_paid', String(parsedAmount));
        payload.append('receipt', repaymentFile);
        if (repaymentForm.member_note) {
            payload.append('member_note', repaymentForm.member_note);
        }

        try {
            setRepaymentSubmitting(true);
            await api.post('/api/member/loan-repayment-submissions', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setRepaymentForm({ amount_paid: '', member_note: '' });
            setRepaymentFile(null);
            showToast('Your repayment receipt has been submitted for EXCO review.', 'success');
            await Promise.all([loadOverview(), loadTables(loanPage, approvalPage, 1)]);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to submit repayment receipt.', 'error');
        } finally {
            setRepaymentSubmitting(false);
        }
    }

    async function confirmLoanDisbursement(loanId: number) {
        try {
            await api.patch(`/api/member/loans/${loanId}/confirm-disbursement`);
            showToast('Loan receipt confirmed successfully.', 'success');
            await Promise.all([loadOverview(), loadTables(loanPage, approvalPage, repaymentSubmissionPage)]);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to confirm this loan disbursement right now.', 'error');
        }
    }

    async function exportLoans(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<Loan>>('/api/member/loans', { params: { page: 1, per_page: 100 } });
        downloadTableExport(format, 'my-loans.csv', ['Requested Amount', 'Approved Amount', 'Outstanding', 'Status', 'Guarantor', 'Requested At', 'Due On'], data.data.map((loan) => [
            loan.requested_amount,
            loan.approved_amount,
            loan.outstanding_amount,
            loan.status,
            loan.guarantor?.full_name,
            formatDate(loan.requested_at),
            formatDate(loan.due_on),
        ]));
    }

    async function exportRepaymentSubmissions(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<LoanRepaymentSubmission>>('/api/member/loan-repayment-submissions', {
            params: {
                page: 1,
                per_page: 100,
                status: repaymentSubmissionStatusFilter || undefined,
            },
        });
        downloadTableExport(format, 'my-loan-repayment-submissions.csv', ['Loan ID', 'Amount Paid', 'Status', 'Submitted At', 'Reviewed At'], data.data.map((submission) => [
            submission.loan_id,
            submission.amount_paid,
            submission.status,
            formatDate(submission.submitted_at),
            formatDate(submission.reviewed_at),
        ]));
    }

    const activeMemberLoanTab = memberLoanTabs.find((tab) => tab.id === activeTab) ?? memberLoanTabs[0];

    return (
        <div>
            <PageHeader
                description="This loan workspace lets you request a loan, monitor guarantor status, and track the official repayment state that EXCO records on the platform."
                eyebrow="Loans"
                title="Request loans and monitor repayment progress."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="workspace-tabs">
                {memberLoanTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Loans</p>
                <h3>{activeMemberLoanTab.label}</h3>
                <p>{activeMemberLoanTab.description}</p>
            </div>

            {activeTab === 'overview' && overview ? (
                <div className="member-summary-grid mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Share value" value={formatCurrency(overview.summary.share_value)} />
                    <SummaryCard label="Loan multiplier" value={`${overview.summary.loan_multiplier}x`} />
                    <SummaryCard label="Eligible amount" value={formatCurrency(overview.summary.eligible_amount)} />
                    <SummaryCard label="Can request now" value={overview.summary.can_request ? 'Yes' : 'No'} />
                </div>
            ) : null}

            {activeTab === 'request-loan' ? (
                <div className="mt-6">
                    <Panel eyebrow="Loan request" title="Submit a new loan request">
                    <form className="member-request-form grid gap-4" onSubmit={(event) => void requestLoan(event)}>
                        <input className="app-field__control rounded-[20px] px-4 py-3.5 text-[1rem]" min="1" onChange={(event) => setLoanForm((current) => ({ ...current, requested_amount: event.target.value }))} placeholder="Requested amount" type="number" value={loanForm.requested_amount} />
                        <AppSelect className="app-field__control rounded-[20px] px-4 py-3.5 text-[1rem]" onChange={(event) => setLoanForm((current) => ({ ...current, guarantor_member_id: event.target.value }))} value={loanForm.guarantor_member_id}>
                            <option value="">Select guarantor</option>
                            {guarantors.map((guarantor) => <option key={guarantor.id} value={guarantor.id}>{guarantor.full_name} {guarantor.member_number ? `(${guarantor.member_number})` : ''}</option>)}
                        </AppSelect>
                        <input className="app-field__control rounded-[20px] px-4 py-3.5 text-[1rem]" onChange={(event) => setLoanForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Purpose of loan" value={loanForm.purpose} />
                        <textarea className="app-field__control min-h-24 rounded-[20px] px-4 py-3.5 text-[1rem]" onChange={(event) => setLoanForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Additional notes" value={loanForm.notes} />
                        <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" type="submit">Submit loan request</button>
                    </form>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'guarantor-queue' ? (
                <div className="mt-6">
                    <Panel eyebrow="Guarantor queue" title="Requests waiting on your response">
                    {guarantorApprovals ? (
                        <DataTable
                            columns={[
                                { key: 'member', header: 'Borrower', className: 'w-[24%]', render: (approval) => approval.loan?.member?.full_name ?? 'Unknown' },
                                { key: 'amount', header: 'Amount', className: 'w-[20%]', render: (approval) => formatCurrency(approval.loan?.requested_amount ?? 0) },
                                { key: 'status', header: 'Status', className: 'w-[16%]', render: (approval) => approval.status.replace('_', ' ') },
                                {
                                    key: 'action',
                                    header: 'Action',
                                    className: 'w-[40%] whitespace-nowrap',
                                    exportable: false,
                                    render: (approval) => (
                                        <div className="record-action-group record-action-group--compact">
                                            <button
                                                aria-label={`View loan request from ${approval.loan?.member?.full_name ?? 'borrower'}`}
                                                className="app-icon-button"
                                                onClick={() => setSelectedGuarantorApproval(approval)}
                                                title="View loan request"
                                                type="button"
                                            >
                                                <ViewIcon />
                                            </button>
                                            {approval.status === 'pending' ? (
                                                <>
                                                    <button className="rounded-full bg-[var(--forest)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void respondToGuarantorApproval(approval.id, 'approved')} type="button">Approve</button>
                                                    <button className="rounded-full bg-[var(--danger)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void respondToGuarantorApproval(approval.id, 'rejected')} type="button">Reject</button>
                                                </>
                                            ) : null}
                                        </div>
                                    ),
                                },
                            ]}
                            currentPage={guarantorApprovals.current_page}
                            currentPerPage={approvalPerPage}
                            emptyMessage="No guarantor requests are waiting for your response."
                            exportFilename="my-guarantor-requests.csv"
                            filterPlaceholder="Filter guarantor requests"
                            onPageChange={(page) => void loadTables(loanPage, page)}
                            onPerPageChange={(value) => {
                                setApprovalPage(1);
                                setApprovalPerPage(value);
                            }}
                            rowKey={(approval) => approval.id}
                            rows={guarantorApprovals.data}
                            totalItems={guarantorApprovals.total}
                            totalPages={guarantorApprovals.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {selectedGuarantorApproval ? (
                <div
                    className="constitution-modal-backdrop"
                    onClick={() => setSelectedGuarantorApproval(null)}
                    role="presentation"
                >
                    <div
                        aria-modal="true"
                        className="constitution-modal constitution-modal--narrow"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                    >
                        <div className="constitution-modal__header">
                            <div>
                                <p className="constitution-modal__eyebrow">Guarantor review</p>
                                <h3>Loan request details</h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={() => setSelectedGuarantorApproval(null)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>
                        <div className="constitution-modal__body">
                            <div className="member-inline-summary-grid grid gap-3 text-[0.98rem] text-[var(--muted)] md:grid-cols-2">
                                <div><strong>Borrower:</strong> {selectedGuarantorApproval.loan?.member?.full_name ?? 'Unknown'}</div>
                                <div><strong>Requested amount:</strong> {formatCurrency(selectedGuarantorApproval.loan?.requested_amount ?? 0)}</div>
                                <div><strong>Date requested:</strong> {formatDate(selectedGuarantorApproval.loan?.requested_at)}</div>
                                <div><strong>Guarantor status:</strong> {selectedGuarantorApproval.status.replace('_', ' ')}</div>
                                <div><strong>Purpose:</strong> {selectedGuarantorApproval.loan?.purpose ?? 'Not stated'}</div>
                                <div><strong>Cycle:</strong> {selectedGuarantorApproval.loan?.cycle?.code ?? 'Not set'}</div>
                            </div>

                            <div className="mt-5">
                                <strong>Borrower note</strong>
                                <p className="mt-2 text-[0.98rem] leading-7 text-[var(--muted)]">
                                    {selectedGuarantorApproval.loan?.notes ?? 'No additional notes were provided for this request.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeTab === 'repayment-receipts' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Repayment receipt" title="Submit a loan repayment receipt">
                        {overview?.summary.active_loan && ['disbursed', 'partially_repaid'].includes(overview.summary.active_loan.status) ? (
                            <form className="member-upload-form grid gap-4 md:grid-cols-2" onSubmit={(event) => void submitRepaymentReceipt(event)}>
                                <div className="app-panel repayment-summary-card md:col-span-2">
                                    <div className="member-inline-summary-grid grid gap-3 text-[0.98rem] text-[var(--muted)] md:grid-cols-3">
                                        <div>Outstanding amount: {formatCurrency(overview.summary.active_loan.outstanding_amount ?? 0)}</div>
                                        <div>Total due: {formatCurrency(overview.summary.active_loan.total_due_amount ?? 0)}</div>
                                        <div>Due on: {formatDate(overview.summary.active_loan.due_on)}</div>
                                    </div>
                                    {overview.summary.active_loan.disbursement ? (
                                        <div className="member-inline-summary-grid mt-4 grid gap-3 text-[0.98rem] text-[var(--muted)] md:grid-cols-3">
                                            <div>Disbursement status: {overview.summary.active_loan.disbursement.status.replace('_', ' ')}</div>
                                            <div>Disbursed at: {formatDate(overview.summary.active_loan.disbursement.disbursed_at)}</div>
                                            <div>
                                                Receipt: {overview.summary.active_loan.disbursement.receipt_url ? (
                                                    <a className="landing-btn landing-btn--secondary" href={overview.summary.active_loan.disbursement.receipt_url} rel="noreferrer" target="_blank">View receipt</a>
                                                ) : 'No receipt'}
                                            </div>
                                        </div>
                                    ) : null}
                                    {overview.summary.active_loan.disbursement?.status === 'pending_member_confirmation' ? (
                                        <div className="mt-4">
                                            <button className="rounded-full bg-[var(--accent)] px-5 py-3 text-[0.98rem] font-semibold text-white" onClick={() => void confirmLoanDisbursement(overview.summary.active_loan!.id)} type="button">
                                                Confirm loan receipt
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                                <label className="app-field">
                                    <span className="app-field__label">Amount Paid</span>
                                    <input className="app-field__control" inputMode="decimal" onChange={(event) => setRepaymentForm((current) => ({ ...current, amount_paid: event.target.value }))} placeholder="Enter repayment amount" type="text" value={repaymentForm.amount_paid} />
                                </label>
                                <label className="app-field">
                                    <span className="app-field__label">Receipt Upload</span>
                                    <input
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        className="app-field__control"
                                        onChange={(event) => setRepaymentFile(event.target.files?.[0] ?? null)}
                                        required
                                        type="file"
                                    />
                                </label>
                                <label className="app-field md:col-span-2">
                                    <span className="app-field__label">Note</span>
                                    <textarea className="app-field__control" onChange={(event) => setRepaymentForm((current) => ({ ...current, member_note: event.target.value }))} placeholder="Optional note for EXCO review" value={repaymentForm.member_note} />
                                </label>
                                <div className="md:col-span-2">
                                    <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={repaymentSubmitting} type="submit">
                                        {repaymentSubmitting ? 'Submitting...' : 'Submit repayment receipt'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <Notice>Repayment receipts can only be submitted after your loan has been disbursed and while there is still an outstanding balance.</Notice>
                        )}
                    </Panel>

                    <Panel eyebrow="Submitted repayments" title="Your repayment receipt submissions">
                        {repaymentSubmissions ? (
                            <DataTable
                                columns={[
                                    { key: 'loan_id', header: 'Loan ID', render: (submission) => `#${submission.loan_id}` },
                                    { key: 'amount', header: 'Amount Paid', render: (submission) => formatCurrency(submission.amount_paid) },
                                    { key: 'receipt', header: 'Receipt', render: (submission) => submission.receipt_url ? <a className="landing-btn landing-btn--secondary" href={submission.receipt_url} rel="noreferrer" target="_blank">View receipt</a> : 'No receipt' },
                                    { key: 'status', header: 'Status', render: (submission) => submission.status },
                                    { key: 'review_note', header: 'Review Note', render: (submission) => submission.review_note ?? 'Not reviewed' },
                                    { key: 'submitted_at', header: 'Submitted At', render: (submission) => formatDate(submission.submitted_at) },
                                ]}
                                currentPage={repaymentSubmissions.current_page}
                                currentPerPage={repaymentSubmissionPerPage}
                                emptyMessage="No repayment receipts have been submitted yet."
                                exportFilename="my-loan-repayment-submissions.csv"
                                filterPlaceholder="Filter repayment submissions"
                                onExport={(format) => void exportRepaymentSubmissions(format)}
                                onPageChange={(nextPage) => void loadTables(loanPage, approvalPage, nextPage)}
                                onPerPageChange={(value) => {
                                    setRepaymentSubmissionPage(1);
                                    setRepaymentSubmissionPerPage(value);
                                }}
                                rowKey={(submission) => submission.id}
                                rows={repaymentSubmissions.data}
                                toolbarExtras={(
                                    <AppSelect className="app-filter-select" onChange={(event) => setRepaymentSubmissionStatusFilter(event.target.value)} value={repaymentSubmissionStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </AppSelect>
                                )}
                                totalItems={repaymentSubmissions.total}
                                totalPages={repaymentSubmissions.last_page}
                            />
                        ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'loan-history' ? (
                <div className="mt-6">
                    <Panel eyebrow="My loans" title="Your loan history and current balances">
                    {loans ? (
                        <DataTable
                            columns={[
                                { key: 'requested_amount', header: 'Requested', render: (loan) => formatCurrency(loan.requested_amount) },
                                { key: 'approved_amount', header: 'Approved', render: (loan) => formatCurrency(loan.approved_amount ?? 0) },
                                { key: 'outstanding_amount', header: 'Outstanding', render: (loan) => formatCurrency(loan.outstanding_amount ?? 0) },
                                { key: 'guarantor', header: 'Guarantor', render: (loan) => loan.guarantor?.full_name ?? 'Not set' },
                                { key: 'status', header: 'Status', render: (loan) => loan.status.replace('_', ' ') },
                                { key: 'receipt', header: 'Disbursement Receipt', render: (loan) => loan.disbursement?.receipt_url ? <a className="landing-btn landing-btn--secondary" href={loan.disbursement.receipt_url} rel="noreferrer" target="_blank">View receipt</a> : 'Not posted' },
                                { key: 'disbursement_status', header: 'Receipt Status', render: (loan) => loan.disbursement?.status ? loan.disbursement.status.replace('_', ' ') : 'Not posted' },
                                { key: 'due_on', header: 'Due On', render: (loan) => formatDate(loan.due_on) },
                                {
                                    key: 'action',
                                    header: 'Action',
                                    exportable: false,
                                    render: (loan) => {
                                        if (loan.disbursement?.status === 'pending_member_confirmation') {
                                            return (
                                                <button className="rounded-full bg-[var(--accent)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void confirmLoanDisbursement(loan.id)} type="button">
                                                    Confirm receipt
                                                </button>
                                            );
                                        }

                                        if (!['disbursed', 'partially_repaid', 'repaid'].includes(loan.status)) {
                                            return <button className="rounded-full bg-[var(--danger)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => setLoanPendingDelete(loan)} type="button">Delete</button>;
                                        }

                                        return 'Locked';
                                    },
                                },
                            ]}
                            currentPage={loans.current_page}
                            currentPerPage={loanPerPage}
                            emptyMessage="No loan requests have been submitted yet."
                            exportFilename="my-loans.csv"
                            filterPlaceholder="Filter my loans"
                            onExport={(format) => void exportLoans(format)}
                            onPageChange={(page) => void loadTables(page, approvalPage)}
                            onPerPageChange={(value) => {
                                setLoanPage(1);
                                setLoanPerPage(value);
                            }}
                            rowKey={(loan) => loan.id}
                            rows={loans.data}
                            totalItems={loans.total}
                            totalPages={loans.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {loanPendingDelete ? (
                <div className="constitution-modal-backdrop">
                    <div className="constitution-modal constitution-modal--narrow">
                        <div className="constitution-modal__header">
                            <div>
                                <div className="constitution-modal__eyebrow">Delete Loan Request</div>
                                <h3>Are you sure you want to delete this loan request?</h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={() => setLoanPendingDelete(null)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>

                        <div className="constitution-modal__body">
                            <p>
                                This will permanently remove your loan request for <strong>{formatCurrency(loanPendingDelete.requested_amount)}</strong>.
                            </p>
                            <p>
                                Only loan requests that have not moved into a disbursed or repayment state can be deleted.
                            </p>
                            <div className="shareout-confirmation-actions">
                                <button
                                    className="landing-btn landing-btn--secondary"
                                    onClick={() => setLoanPendingDelete(null)}
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="rounded-full bg-[var(--danger)] px-4 py-2.5 text-[0.96rem] font-semibold text-white"
                                    onClick={() => void deleteLoan(loanPendingDelete.id)}
                                    type="button"
                                >
                                    Yes, delete request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function MemberHomeSection({ name }: { name: string }) {
    return (
        <div>
            <PageHeader
                description="This member workspace lets you view the official cooperative records that EXCO has posted after verifying your payments and savings activity."
                eyebrow="Member home"
                title={`Welcome back, ${name}.`}
            />
            <Panel title="Your savings records are now live">
                <Notice>Open the Savings menu to see the fees and share entries EXCO has verified and recorded for your account.</Notice>
            </Panel>
        </div>
    );
}

function MemberSavingsSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<SavingsWorkspaceTab>('overview');
    const [overview, setOverview] = useState<SavingsOverview | null>(null);
    const [sharePurchases, setSharePurchases] = useState<PaginatedResponse<SharePurchase> | null>(null);
    const [sharePaymentSubmissions, setSharePaymentSubmissions] = useState<PaginatedResponse<SharePaymentSubmission> | null>(null);
    const [membershipFeeSubmissions, setMembershipFeeSubmissions] = useState<PaginatedResponse<MembershipFeeSubmission> | null>(null);
    const [membershipFees, setMembershipFees] = useState<PaginatedResponse<MembershipFee> | null>(null);
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [submissionSubmitting, setSubmissionSubmitting] = useState(false);
    const [membershipFeeSubmissionFile, setMembershipFeeSubmissionFile] = useState<File | null>(null);
    const [membershipFeeSubmitting, setMembershipFeeSubmitting] = useState(false);
    const [submissionForm, setSubmissionForm] = useState({
        membership_cycle_id: '',
        share_month: '',
        shares_count: '1',
        member_note: '',
    });
    const [membershipFeeForm, setMembershipFeeForm] = useState({
        membership_cycle_id: '',
        fee_type: 'existing_member' as 'new_member' | 'existing_member',
        member_note: '',
    });
    const [sharePage, setSharePage] = useState(1);
    const [submissionPage, setSubmissionPage] = useState(1);
    const [feeSubmissionPage, setFeeSubmissionPage] = useState(1);
    const [feePage, setFeePage] = useState(1);
    const [sharePerPage, setSharePerPage] = useState(10);
    const [submissionPerPage, setSubmissionPerPage] = useState(10);
    const [feeSubmissionPerPage, setFeeSubmissionPerPage] = useState(10);
    const [feePerPage, setFeePerPage] = useState(10);
    const [error, setError] = useState('');
    const [shareMonthFilter, setShareMonthFilter] = useState('');
    const [shareStatusFilter, setShareStatusFilter] = useState('');
    const [feeCycleFilter, setFeeCycleFilter] = useState('');
    const [feeStatusFilter, setFeeStatusFilter] = useState('');
    const [feeMonthFilter, setFeeMonthFilter] = useState('');
    const [feeSubmissionCycleFilter, setFeeSubmissionCycleFilter] = useState('');
    const [feeSubmissionTypeFilter, setFeeSubmissionTypeFilter] = useState('');
    const [feeSubmissionStatusFilter, setFeeSubmissionStatusFilter] = useState('');
    const [submissionCycleFilter, setSubmissionCycleFilter] = useState('');
    const [submissionStatusFilter, setSubmissionStatusFilter] = useState('');

    const loadOverview = async () => {
        const { data } = await api.get<SavingsOverview>('/api/member/savings/overview');
        setOverview(data);
    };

    const loadTables = async (
        nextSharePage = sharePage,
        nextSubmissionPage = submissionPage,
        nextFeeSubmissionPage = feeSubmissionPage,
        nextFeePage = feePage,
        nextSharePerPage = sharePerPage,
        nextSubmissionPerPage = submissionPerPage,
        nextFeeSubmissionPerPage = feeSubmissionPerPage,
        nextFeePerPage = feePerPage,
    ) => {
        const [shareResponse, submissionResponse, feeSubmissionResponse, feeResponse] = await Promise.all([
            api.get<PaginatedResponse<SharePurchase>>('/api/member/share-purchases', {
                params: {
                    page: nextSharePage,
                    per_page: nextSharePerPage,
                    share_month: shareMonthFilter || undefined,
                    payment_status: shareStatusFilter || undefined,
                },
            }),
            api.get<PaginatedResponse<SharePaymentSubmission>>('/api/member/share-payment-submissions', {
                params: {
                    page: nextSubmissionPage,
                    per_page: nextSubmissionPerPage,
                    membership_cycle_id: submissionCycleFilter || undefined,
                    share_month: shareMonthFilter || undefined,
                    status: submissionStatusFilter || undefined,
                },
            }),
            api.get<PaginatedResponse<MembershipFeeSubmission>>('/api/member/membership-fee-submissions', {
                params: {
                    page: nextFeeSubmissionPage,
                    per_page: nextFeeSubmissionPerPage,
                    membership_cycle_id: feeSubmissionCycleFilter || undefined,
                    fee_type: feeSubmissionTypeFilter || undefined,
                    status: feeSubmissionStatusFilter || undefined,
                },
            }),
            api.get<PaginatedResponse<MembershipFee>>('/api/member/membership-fees', {
                params: {
                    page: nextFeePage,
                    per_page: nextFeePerPage,
                    membership_cycle_id: feeCycleFilter || undefined,
                    status: feeStatusFilter || undefined,
                    paid_month: feeMonthFilter || undefined,
                },
            }),
        ]);
        setSharePurchases(shareResponse.data);
        setSharePaymentSubmissions(submissionResponse.data);
        setMembershipFeeSubmissions(feeSubmissionResponse.data);
        setMembershipFees(feeResponse.data);
        setSharePage(shareResponse.data.current_page);
        setSubmissionPage(submissionResponse.data.current_page);
        setFeeSubmissionPage(feeSubmissionResponse.data.current_page);
        setFeePage(feeResponse.data.current_page);
        setSharePerPage(shareResponse.data.per_page);
        setSubmissionPerPage(submissionResponse.data.per_page);
        setFeeSubmissionPerPage(feeSubmissionResponse.data.per_page);
        setFeePerPage(feeResponse.data.per_page);
    };

    useEffect(() => {
        Promise.all([
            loadOverview(),
            loadTables(1, 1, 1, 1),
            api.get<MembershipCycle[]>('/api/member/membership-cycles').then(({ data }) => {
                setCycles(data);
                const activeCycle = data.find((cycle) => cycle.is_active);
                if (activeCycle) {
                    setSubmissionForm((current) => ({ ...current, membership_cycle_id: String(activeCycle.id) }));
                    setMembershipFeeForm((current) => ({ ...current, membership_cycle_id: String(activeCycle.id) }));
                }
            }),
        ]).catch((requestError: any) => {
            setError(requestError.response?.data?.message ?? 'Unable to load savings information right now.');
        });
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadTables(1, 1, 1, 1, sharePerPage, submissionPerPage, feeSubmissionPerPage, feePerPage);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [shareMonthFilter, shareStatusFilter, feeCycleFilter, feeStatusFilter, feeMonthFilter, submissionCycleFilter, submissionStatusFilter, feeSubmissionCycleFilter, feeSubmissionTypeFilter, feeSubmissionStatusFilter, sharePerPage, submissionPerPage, feeSubmissionPerPage, feePerPage]);

    async function submitSharePayment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!submissionFile) {
            showToast('Please upload your share payment receipt before submitting.', 'error');
            return;
        }

        const payload = new FormData();
        payload.append('membership_cycle_id', submissionForm.membership_cycle_id);
        payload.append('share_month', submissionForm.share_month);
        payload.append('shares_count', submissionForm.shares_count);
        payload.append('receipt', submissionFile);
        if (submissionForm.member_note) {
            payload.append('member_note', submissionForm.member_note);
        }

        try {
            setSubmissionSubmitting(true);
            await api.post('/api/member/share-payment-submissions', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSubmissionForm((current) => ({
                ...current,
                share_month: '',
                shares_count: '1',
                member_note: '',
            }));
            setSubmissionFile(null);
            showToast('Your share payment receipt has been submitted for EXCO verification.', 'success');
            await loadTables(sharePage, 1, feeSubmissionPage, feePage);
            await loadOverview();
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to submit your share payment receipt.', 'error');
        } finally {
            setSubmissionSubmitting(false);
        }
    }

    async function submitMembershipFeeReceipt(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!membershipFeeSubmissionFile) {
            showToast('Please upload your membership fee receipt before submitting.', 'error');
            return;
        }

        const payload = new FormData();
        payload.append('membership_cycle_id', membershipFeeForm.membership_cycle_id);
        payload.append('fee_type', membershipFeeForm.fee_type);
        payload.append('receipt', membershipFeeSubmissionFile);
        if (membershipFeeForm.member_note) {
            payload.append('member_note', membershipFeeForm.member_note);
        }

        try {
            setMembershipFeeSubmitting(true);
            await api.post('/api/member/membership-fee-submissions', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMembershipFeeForm((current) => ({
                ...current,
                member_note: '',
            }));
            setMembershipFeeSubmissionFile(null);
            showToast('Your membership fee receipt has been submitted for EXCO verification.', 'success');
            await loadTables(sharePage, submissionPage, 1, feePage);
            await loadOverview();
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to submit your membership fee receipt.', 'error');
        } finally {
            setMembershipFeeSubmitting(false);
        }
    }

    async function exportShareHistory(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<SharePurchase>>('/api/member/share-purchases', {
            params: {
                page: 1,
                per_page: 100,
                share_month: shareMonthFilter || undefined,
                payment_status: shareStatusFilter || undefined,
            },
        });
        downloadTableExport(format, 'my-share-history.csv', ['Month', 'Cycle', 'Shares', 'Unit Share Price', 'Total Amount', 'Status', 'Recorded On'], data.data.map((purchase) => [
            formatMonth(purchase.share_month), purchase.cycle?.code, purchase.shares_count, purchase.unit_share_price, purchase.total_amount, purchase.payment_status, formatDate(purchase.purchased_at),
        ]));
    }

    async function exportSharePaymentSubmissions(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<SharePaymentSubmission>>('/api/member/share-payment-submissions', {
            params: {
                page: 1,
                per_page: 100,
                membership_cycle_id: submissionCycleFilter || undefined,
                share_month: shareMonthFilter || undefined,
                status: submissionStatusFilter || undefined,
            },
        });
        downloadTableExport(format, 'my-share-payment-submissions.csv', ['Cycle', 'Month', 'Shares', 'Expected Amount', 'Status', 'Submitted At', 'Reviewed At'], data.data.map((submission) => [
            submission.cycle?.code,
            formatMonth(submission.share_month),
            submission.shares_count,
            submission.expected_amount,
            submission.status,
            formatDate(submission.submitted_at),
            formatDate(submission.reviewed_at),
        ]));
    }

    async function exportMembershipFees(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<MembershipFee>>('/api/member/membership-fees', {
            params: {
                page: 1,
                per_page: 100,
                membership_cycle_id: feeCycleFilter || undefined,
                status: feeStatusFilter || undefined,
                paid_month: feeMonthFilter || undefined,
            },
        });
        downloadTableExport(format, 'my-membership-fees.csv', ['Cycle', 'Fee Type', 'Amount', 'Status', 'Paid At'], data.data.map((fee) => [
            fee.cycle?.code, fee.fee_type, fee.amount, fee.status, formatDate(fee.paid_at),
        ]));
    }

    async function exportMembershipFeeSubmissions(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<MembershipFeeSubmission>>('/api/member/membership-fee-submissions', {
            params: {
                page: 1,
                per_page: 100,
                membership_cycle_id: feeSubmissionCycleFilter || undefined,
                fee_type: feeSubmissionTypeFilter || undefined,
                status: feeSubmissionStatusFilter || undefined,
            },
        });
        downloadTableExport(format, 'my-membership-fee-submissions.csv', ['Cycle', 'Fee Type', 'Expected Amount', 'Status', 'Submitted At', 'Reviewed At'], data.data.map((submission) => [
            submission.cycle?.code,
            submission.fee_type,
            submission.expected_amount,
            submission.status,
            formatDate(submission.submitted_at),
            formatDate(submission.reviewed_at),
        ]));
    }

    const activeSavingsTab = savingsWorkspaceTabs.find((tab) => tab.id === activeTab) ?? savingsWorkspaceTabs[0];

    return (
        <div>
            <PageHeader
                description="This savings workspace lets you submit share and membership-fee receipts, then track the official records EXCO posts after verifying your bank-transfer proof."
                eyebrow="Savings"
                title="Track your shares and fee records."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="member-savings-tabs">
                {savingsWorkspaceTabs.map((tab) => (
                    <button
                        className={`member-savings-tabs__button ${activeTab === tab.id ? 'member-savings-tabs__button--active' : ''}`}
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="member-savings-tabs__context">
                <p className="member-savings-tabs__eyebrow">Savings workspace</p>
                <h3>{activeSavingsTab.label}</h3>
                <p>{activeSavingsTab.description}</p>
            </div>

            {activeTab === 'overview' ? (
                <div className="mt-6 grid gap-6">
                    <Notice>
                        Share purchases and membership fees are both submitted here with receipt uploads. EXCO reviews each receipt and posts the official record after verification.
                    </Notice>

                    {overview ? (
                        <div className="member-summary-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard label="Total share entries" value={String(overview.summary.share_purchases_count)} />
                            <SummaryCard label="Total shares" value={String(overview.summary.total_shares_count)} />
                            <SummaryCard label="Share value" value={formatCurrency(overview.summary.total_share_value)} />
                            <SummaryCard label="Pending fees" value={String(overview.summary.membership_fees_pending)} />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {activeTab === 'share-payment' ? (
                <div className="mt-6">
                    <Notice>
                        Upload your transfer receipt here. EXCO will review it and convert it into an official share record once verified.
                    </Notice>
                </div>
            ) : null}

            {activeTab === 'fee-payment' ? (
                <div className="mt-6">
                    <Notice>
                        Upload your membership fee receipt here. EXCO will review it and convert it into an official cycle fee record once verified.
                    </Notice>
                </div>
            ) : null}

            {activeTab === 'share-payment' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Share payment" title="Submit a share payment receipt">
                    <form className="member-upload-form grid gap-4 md:grid-cols-2" onSubmit={(event) => void submitSharePayment(event)}>
                        <label className="app-field">
                            <span className="app-field__label">Cycle</span>
                            <AppSelect className="app-field__control" onChange={(event) => setSubmissionForm((current) => ({ ...current, membership_cycle_id: event.target.value }))} required value={submissionForm.membership_cycle_id}>
                                <option value="">Select cycle</option>
                                {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                            </AppSelect>
                        </label>
                        <label className="app-field">
                            <span className="app-field__label">Share Month</span>
                            <input className="app-field__control" onChange={(event) => setSubmissionForm((current) => ({ ...current, share_month: event.target.value }))} required type="date" value={submissionForm.share_month} />
                        </label>
                        <label className="app-field">
                            <span className="app-field__label">Number of Shares</span>
                            <input className="app-field__control" min="1" onChange={(event) => setSubmissionForm((current) => ({ ...current, shares_count: event.target.value }))} required type="number" value={submissionForm.shares_count} />
                        </label>
                        <label className="app-field">
                            <span className="app-field__label">Receipt Upload</span>
                            <input
                                className="app-field__control"
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                onChange={(event) => setSubmissionFile(event.target.files?.[0] ?? null)}
                                required
                                type="file"
                            />
                        </label>
                        <label className="app-field md:col-span-2">
                            <span className="app-field__label">Note</span>
                            <textarea className="app-field__control" onChange={(event) => setSubmissionForm((current) => ({ ...current, member_note: event.target.value }))} placeholder="Optional note for EXCO verification" value={submissionForm.member_note} />
                        </label>
                        <div className="md:col-span-2">
                            <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={submissionSubmitting} type="submit">
                                {submissionSubmitting ? 'Submitting...' : 'Submit receipt for verification'}
                            </button>
                        </div>
                    </form>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'submitted-receipts' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Submitted receipts" title="Your share payment submissions">
                    {sharePaymentSubmissions ? (
                        <DataTable
                            columns={[
                                { key: 'cycle', header: 'Cycle', render: (submission) => submission.cycle?.code ?? 'Not set' },
                                { key: 'share_month', header: 'Month', render: (submission) => formatMonth(submission.share_month) },
                                { key: 'shares_count', header: 'Shares', render: (submission) => String(submission.shares_count) },
                                { key: 'expected_amount', header: 'Expected Amount', render: (submission) => formatCurrency(submission.expected_amount) },
                                { key: 'receipt', header: 'Receipt', render: (submission) => submission.receipt_url ? <a className="landing-btn landing-btn--secondary" href={submission.receipt_url} rel="noreferrer" target="_blank">View receipt</a> : 'No receipt' },
                                { key: 'status', header: 'Status', render: (submission) => submission.status },
                                { key: 'review_note', header: 'Review Note', render: (submission) => submission.review_note ?? 'Not reviewed' },
                            ]}
                            currentPage={sharePaymentSubmissions.current_page}
                            currentPerPage={submissionPerPage}
                            emptyMessage="No share payment receipts have been submitted yet."
                            exportFilename="my-share-payment-submissions.csv"
                            filterPlaceholder="Filter receipt submissions"
                            onExport={(format) => void exportSharePaymentSubmissions(format)}
                            onPageChange={(page) => void loadTables(sharePage, page, feeSubmissionPage, feePage)}
                            onPerPageChange={(value) => {
                                setSubmissionPage(1);
                                setSubmissionPerPage(value);
                            }}
                            rowKey={(submission) => submission.id}
                            rows={sharePaymentSubmissions.data}
                            toolbarExtras={(
                                <>
                                    <AppSelect className="app-filter-select" onChange={(event) => setSubmissionCycleFilter(event.target.value)} value={submissionCycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </AppSelect>
                                    <AppSelect className="app-filter-select" onChange={(event) => setSubmissionStatusFilter(event.target.value)} value={submissionStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </AppSelect>
                                </>
                            )}
                            totalItems={sharePaymentSubmissions.total}
                            totalPages={sharePaymentSubmissions.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'fee-payment' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Membership fee payment" title="Submit a membership fee receipt">
                    <form className="member-upload-form grid gap-4 md:grid-cols-2" onSubmit={(event) => void submitMembershipFeeReceipt(event)}>
                        <label className="app-field">
                            <span className="app-field__label">Cycle</span>
                            <AppSelect className="app-field__control" onChange={(event) => setMembershipFeeForm((current) => ({ ...current, membership_cycle_id: event.target.value }))} required value={membershipFeeForm.membership_cycle_id}>
                                <option value="">Select cycle</option>
                                {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                            </AppSelect>
                        </label>
                        <label className="app-field">
                            <span className="app-field__label">Fee Type</span>
                            <AppSelect className="app-field__control" onChange={(event) => setMembershipFeeForm((current) => ({ ...current, fee_type: event.target.value as 'new_member' | 'existing_member' }))} required value={membershipFeeForm.fee_type}>
                                <option value="new_member">New member</option>
                                <option value="existing_member">Existing member</option>
                            </AppSelect>
                        </label>
                        <label className="app-field md:col-span-2">
                            <span className="app-field__label">Receipt Upload</span>
                            <input
                                className="app-field__control"
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                onChange={(event) => setMembershipFeeSubmissionFile(event.target.files?.[0] ?? null)}
                                required
                                type="file"
                            />
                        </label>
                        <label className="app-field md:col-span-2">
                            <span className="app-field__label">Note</span>
                            <textarea className="app-field__control" onChange={(event) => setMembershipFeeForm((current) => ({ ...current, member_note: event.target.value }))} placeholder="Optional note for EXCO verification" value={membershipFeeForm.member_note} />
                        </label>
                        <div className="md:col-span-2">
                            <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={membershipFeeSubmitting} type="submit">
                                {membershipFeeSubmitting ? 'Submitting...' : 'Submit fee receipt for verification'}
                            </button>
                        </div>
                    </form>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'fee-submissions' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Fee receipts" title="Your membership fee submissions">
                    {membershipFeeSubmissions ? (
                        <DataTable
                            columns={[
                                { key: 'cycle', header: 'Cycle', render: (submission) => submission.cycle?.code ?? 'Not set' },
                                { key: 'fee_type', header: 'Fee Type', render: (submission) => submission.fee_type.replace('_', ' ') },
                                { key: 'expected_amount', header: 'Expected Amount', render: (submission) => formatCurrency(submission.expected_amount) },
                                { key: 'receipt', header: 'Receipt', render: (submission) => submission.receipt_url ? <a className="landing-btn landing-btn--secondary" href={submission.receipt_url} rel="noreferrer" target="_blank">View receipt</a> : 'No receipt' },
                                { key: 'status', header: 'Status', render: (submission) => submission.status },
                                { key: 'review_note', header: 'Review Note', render: (submission) => submission.review_note ?? 'Not reviewed' },
                            ]}
                            currentPage={membershipFeeSubmissions.current_page}
                            currentPerPage={feeSubmissionPerPage}
                            emptyMessage="No membership fee receipts have been submitted yet."
                            exportFilename="my-membership-fee-submissions.csv"
                            filterPlaceholder="Filter fee receipts"
                            onExport={(format) => void exportMembershipFeeSubmissions(format)}
                            onPageChange={(page) => void loadTables(sharePage, submissionPage, page, feePage)}
                            onPerPageChange={(value) => {
                                setFeeSubmissionPage(1);
                                setFeeSubmissionPerPage(value);
                            }}
                            rowKey={(submission) => submission.id}
                            rows={membershipFeeSubmissions.data}
                            toolbarExtras={(
                                <>
                                    <AppSelect className="app-filter-select" onChange={(event) => setFeeSubmissionCycleFilter(event.target.value)} value={feeSubmissionCycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </AppSelect>
                                    <AppSelect className="app-filter-select" onChange={(event) => setFeeSubmissionTypeFilter(event.target.value)} value={feeSubmissionTypeFilter}>
                                        <option value="">All fee types</option>
                                        <option value="new_member">New member</option>
                                        <option value="existing_member">Existing member</option>
                                    </AppSelect>
                                    <AppSelect className="app-filter-select" onChange={(event) => setFeeSubmissionStatusFilter(event.target.value)} value={feeSubmissionStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </AppSelect>
                                </>
                            )}
                            totalItems={membershipFeeSubmissions.total}
                            totalPages={membershipFeeSubmissions.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'share-history' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Share history" title="Your monthly share purchases">
                    {sharePurchases ? (
                        <DataTable
                            columns={[
                                { key: 'share_month', header: 'Month', render: (purchase) => formatMonth(purchase.share_month) },
                                { key: 'cycle', header: 'Cycle', render: (purchase) => purchase.cycle?.code ?? 'Not set' },
                                { key: 'shares_count', header: 'Shares', render: (purchase) => String(purchase.shares_count) },
                                { key: 'unit_share_price', header: 'Unit Price', render: (purchase) => formatCurrency(purchase.unit_share_price) },
                                { key: 'total_amount', header: 'Total', render: (purchase) => formatCurrency(purchase.total_amount) },
                                { key: 'status', header: 'Status', render: (purchase) => purchase.payment_status },
                            ]}
                            currentPage={sharePurchases.current_page}
                            currentPerPage={sharePerPage}
                            emptyMessage="No share purchases have been posted for your account yet."
                            exportFilename="my-share-history.csv"
                            filterPlaceholder="Filter share history"
                            onExport={(format) => void exportShareHistory(format)}
                            onPageChange={(page) => void loadTables(page, submissionPage, feeSubmissionPage, feePage)}
                            onPerPageChange={(value) => {
                                setSharePage(1);
                                setSharePerPage(value);
                            }}
                            rowKey={(purchase) => purchase.id}
                            rows={sharePurchases.data}
                            toolbarExtras={(
                                <>
                                    <input
                                        className="app-filter-select"
                                        onChange={(event) => setShareMonthFilter(event.target.value)}
                                        type="month"
                                        value={shareMonthFilter}
                                    />
                                    <AppSelect className="app-filter-select" onChange={(event) => setShareStatusFilter(event.target.value)} value={shareStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="confirmed">Confirmed</option>
                                    </AppSelect>
                                </>
                            )}
                            totalItems={sharePurchases.total}
                            totalPages={sharePurchases.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'membership-fees' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Membership fees" title="Your fee records">
                    {membershipFees ? (
                        <DataTable
                            columns={[
                                { key: 'cycle', header: 'Cycle', render: (fee) => fee.cycle?.code ?? 'Not set' },
                                { key: 'fee_type', header: 'Fee Type', render: (fee) => fee.fee_type.replace('_', ' ') },
                                { key: 'amount', header: 'Amount', render: (fee) => formatCurrency(fee.amount) },
                                { key: 'status', header: 'Status', render: (fee) => fee.status },
                                { key: 'paid_at', header: 'Paid At', render: (fee) => formatDate(fee.paid_at) },
                            ]}
                            currentPage={membershipFees.current_page}
                            currentPerPage={feePerPage}
                            emptyMessage="No membership fee records found yet."
                            exportFilename="my-membership-fees.csv"
                            filterPlaceholder="Filter membership fees"
                            onExport={(format) => void exportMembershipFees(format)}
                            onPageChange={(page) => void loadTables(sharePage, submissionPage, feeSubmissionPage, page)}
                            onPerPageChange={(value) => {
                                setFeePage(1);
                                setFeePerPage(value);
                            }}
                            rowKey={(fee) => fee.id}
                            rows={membershipFees.data}
                            toolbarExtras={(
                                <>
                                    <AppSelect className="app-filter-select" onChange={(event) => setFeeCycleFilter(event.target.value)} value={feeCycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </AppSelect>
                                    <AppSelect className="app-filter-select" onChange={(event) => setFeeStatusFilter(event.target.value)} value={feeStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="waived">Waived</option>
                                    </AppSelect>
                                    <input
                                        className="app-filter-select"
                                        onChange={(event) => setFeeMonthFilter(event.target.value)}
                                        type="month"
                                        value={feeMonthFilter}
                                    />
                                </>
                            )}
                            totalItems={membershipFees.total}
                            totalPages={membershipFees.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}
        </div>
    );
}

function PlaceholderSection({ eyebrow, title, description, message }: { eyebrow: string; title: string; description: string; message: string }) {
    return (
        <div>
            <PageHeader description={description} eyebrow={eyebrow} title={title} />
            <Panel title={`${eyebrow} module in progress`}>
                <Notice>{message}</Notice>
            </Panel>
        </div>
    );
}
