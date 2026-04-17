import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useToast } from '../../feedback/ToastProvider';
import { AppSelect } from '../../components/ui/AppSelect';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { api } from '../../lib/api';
import type { Loan, LoanRepaymentSubmission, PaginatedResponse } from '../../types';

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

interface DisbursementForm {
    payment_method: string;
    notes: string;
}

const initialDisbursementForm: DisbursementForm = {
    payment_method: 'bank_transfer',
    notes: '',
};

type LoanWorkspaceTab = 'register' | 'loan-workspace' | 'repayment-reviews';

const loanWorkspaceTabs: Array<{ id: LoanWorkspaceTab; label: string; description: string }> = [
    {
        id: 'register',
        label: 'Loan Register',
        description: 'Review all loan requests, active balances, and status progression across the cooperative.',
    },
    {
        id: 'loan-workspace',
        label: 'Loan Workspace',
        description: 'Open a selected loan to approve it and disburse funds from one focused workspace.',
    },
    {
        id: 'repayment-reviews',
        label: 'Repayment Reviews',
        description: 'Review member-uploaded repayment receipts and confirm them into official loan repayment records.',
    },
];

export function LoansSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<LoanWorkspaceTab>('register');
    const [loansTable, setLoansTable] = useState<PaginatedResponse<Loan> | null>(null);
    const [repaymentSubmissionsTable, setRepaymentSubmissionsTable] = useState<PaginatedResponse<LoanRepaymentSubmission> | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [page, setPage] = useState(1);
    const [repaymentSubmissionPage, setRepaymentSubmissionPage] = useState(1);
    const [loansPerPage, setLoansPerPage] = useState(10);
    const [repaymentSubmissionsPerPage, setRepaymentSubmissionsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [requestedMonthFilter, setRequestedMonthFilter] = useState('');
    const [repaymentSubmissionStatusFilter, setRepaymentSubmissionStatusFilter] = useState('');
    const [disbursementForm, setDisbursementForm] = useState<DisbursementForm>(initialDisbursementForm);
    const [disbursementReceiptFile, setDisbursementReceiptFile] = useState<File | null>(null);

    const loadLoans = async (nextPage = page, nextPerPage = loansPerPage) => {
        const { data } = await api.get<PaginatedResponse<Loan>>('/api/exco/loans', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                status: statusFilter || undefined,
                requested_month: requestedMonthFilter || undefined,
            },
        });
        setLoansTable(data);
        setPage(data.current_page);
        setLoansPerPage(data.per_page);

        if (selectedLoan) {
            const updated = data.data.find((loan) => loan.id === selectedLoan.id);
            if (updated) {
                setSelectedLoan(updated);
            }
        }
    };

    useEffect(() => {
        void loadLoans(1);
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadLoans(1, loansPerPage);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [statusFilter, requestedMonthFilter, loansPerPage]);

    const loadRepaymentSubmissions = async (nextPage = repaymentSubmissionPage, nextPerPage = repaymentSubmissionsPerPage) => {
        const { data } = await api.get<PaginatedResponse<LoanRepaymentSubmission>>('/api/exco/loan-repayment-submissions', {
            params: {
                page: nextPage,
                per_page: nextPerPage,
                status: repaymentSubmissionStatusFilter || undefined,
            },
        });
        setRepaymentSubmissionsTable(data);
        setRepaymentSubmissionPage(data.current_page);
        setRepaymentSubmissionsPerPage(data.per_page);
    };

    useEffect(() => {
        void loadRepaymentSubmissions(1);
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadRepaymentSubmissions(1, repaymentSubmissionsPerPage);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [repaymentSubmissionStatusFilter, repaymentSubmissionsPerPage]);

    async function approveLoan(loanId: number) {
        try {
            await api.patch(`/api/exco/loans/${loanId}/approve`);
            showToast('Loan approved successfully.', 'success');
            await loadLoans(page);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to approve loan.', 'error');
        }
    }

    async function rejectLoan(loanId: number) {
        try {
            await api.patch(`/api/exco/loans/${loanId}/reject`);
            showToast('Loan rejected successfully.', 'success');
            await loadLoans(page);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to reject loan.', 'error');
        }
    }

    async function disburseLoan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedLoan) return;

        if (!disbursementReceiptFile) {
            showToast('Please upload the disbursement receipt before posting this loan.', 'error');
            return;
        }

        try {
            const payload = new FormData();
            payload.append('payment_method', disbursementForm.payment_method);
            payload.append('receipt', disbursementReceiptFile);
            if (disbursementForm.notes) {
                payload.append('notes', disbursementForm.notes);
            }

            await api.post(`/api/exco/loans/${selectedLoan.id}/disburse`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setDisbursementForm(initialDisbursementForm);
            setDisbursementReceiptFile(null);
            showToast('Loan disbursed successfully.', 'success');
            await loadLoans(page);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to disburse loan.', 'error');
        }
    }

    async function reviewRepaymentSubmission(submissionId: number, status: 'approved' | 'rejected') {
        try {
            const payload = status === 'rejected'
                ? { status, review_note: 'Rejected during EXCO verification.' }
                : { status };

            await api.patch(`/api/exco/loan-repayment-submissions/${submissionId}/review`, payload);
            showToast(
                status === 'approved'
                    ? 'Loan repayment receipt approved and posted successfully.'
                    : 'Loan repayment receipt rejected successfully.',
                'success',
            );
            await Promise.all([loadLoans(page), loadRepaymentSubmissions(repaymentSubmissionPage)]);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to review loan repayment receipt.', 'error');
        }
    }

    const activeLoanWorkspaceTab = loanWorkspaceTabs.find((tab) => tab.id === activeTab) ?? loanWorkspaceTabs[0];

    return (
        <div>
            <PageHeader
                description="This is the EXCO loan management workspace. Review member requests, confirm guarantor progression, approve loans, post disbursements, and record repayments."
                eyebrow="Loan management"
                title="Manage requests, approvals, disbursements and repayments."
            />

            <div className="workspace-tabs">
                {loanWorkspaceTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Loan management</p>
                <h3>{activeLoanWorkspaceTab.label}</h3>
                <p>{activeLoanWorkspaceTab.description}</p>
            </div>

            {activeTab === 'register' ? (
                <div className="mt-6">
                    <Panel eyebrow="Loan register" title="All loan requests and active loans">
                {loansTable ? (
                    <DataTable
                        columns={[
                            { key: 'member', header: 'Member', render: (loan) => loan.member?.full_name ?? 'Unknown' },
                            { key: 'guarantor', header: 'Guarantor', render: (loan) => loan.guarantor?.full_name ?? 'Not set' },
                            { key: 'requested_amount', header: 'Requested', render: (loan) => formatCurrency(loan.requested_amount) },
                            { key: 'outstanding_amount', header: 'Outstanding', render: (loan) => formatCurrency(loan.outstanding_amount ?? 0) },
                            { key: 'status', header: 'Status', render: (loan) => <StatusBadge active={['approved', 'disbursed', 'partially_repaid', 'repaid'].includes(loan.status)}>{loan.status.replace('_', ' ')}</StatusBadge> },
                            { key: 'requested_at', header: 'Requested At', render: (loan) => formatDate(loan.requested_at) },
                            {
                                key: 'action',
                                header: 'Action',
                                exportable: false,
                                render: (loan) => (
                                    <button
                                        aria-label={`View loan for ${loan.member?.full_name ?? 'member'}`}
                                        className="app-icon-button"
                                        onClick={() => {
                                            setSelectedLoan(loan);
                                            setActiveTab('loan-workspace');
                                        }}
                                        title="View loan"
                                        type="button"
                                    >
                                        <ViewIcon />
                                    </button>
                                ),
                            },
                        ]}
                        currentPage={loansTable.current_page}
                        currentPerPage={loansPerPage}
                        emptyMessage="No loan requests have been recorded yet."
                        exportFilename="exco-loans.csv"
                        filterPlaceholder="Filter loans"
                        toolbarExtras={(
                            <>
                                <input
                                    className="app-filter-select"
                                    onChange={(event) => setRequestedMonthFilter(event.target.value)}
                                    type="month"
                                    value={requestedMonthFilter}
                                />
                                <AppSelect className="app-filter-select" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                                    <option value="">All statuses</option>
                                    <option value="pending_guarantor">Pending guarantor</option>
                                    <option value="guarantor_approved">Guarantor approved</option>
                                    <option value="approved">Approved</option>
                                    <option value="disbursed">Disbursed</option>
                                    <option value="partially_repaid">Partially repaid</option>
                                    <option value="repaid">Repaid</option>
                                    <option value="rejected">Rejected</option>
                                </AppSelect>
                            </>
                        )}
                        onPageChange={(nextPage) => void loadLoans(nextPage)}
                        onPerPageChange={(value) => {
                            setPage(1);
                            setLoansPerPage(value);
                        }}
                        rowKey={(loan) => loan.id}
                        rows={loansTable.data}
                        totalItems={loansTable.total}
                        totalPages={loansTable.last_page}
                    />
                ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'loan-workspace' && selectedLoan ? (
                <div className="loan-workspace-grid mt-6">
                    <Panel eyebrow="Selected loan" title={`${selectedLoan.member?.full_name ?? 'Member'} loan detail`}>
                        <div className="loan-detail-stack">
                            <div>Requested amount: {formatCurrency(selectedLoan.requested_amount)}</div>
                            <div>Approved amount: {formatCurrency(selectedLoan.approved_amount ?? 0)}</div>
                            <div>Total due: {formatCurrency(selectedLoan.total_due_amount ?? 0)}</div>
                            <div>Outstanding: {formatCurrency(selectedLoan.outstanding_amount ?? 0)}</div>
                            <div>Purpose: {selectedLoan.purpose ?? 'Not provided'}</div>
                            <div>Due on: {formatDate(selectedLoan.due_on)}</div>
                        </div>

                        <div className="loan-action-group">
                            {selectedLoan.status === 'guarantor_approved' ? (
                                <button className="rounded-full bg-[var(--forest)] px-4 py-2.5 text-[0.98rem] font-semibold text-white" onClick={() => void approveLoan(selectedLoan.id)} type="button">Approve loan</button>
                            ) : null}
                            {['pending_guarantor', 'guarantor_approved'].includes(selectedLoan.status) ? (
                                <button className="rounded-full bg-[var(--danger)] px-4 py-2.5 text-[0.98rem] font-semibold text-white" onClick={() => void rejectLoan(selectedLoan.id)} type="button">Reject loan</button>
                            ) : null}
                        </div>
                    </Panel>

                    <div className="loan-workspace-stack">
                        <Panel eyebrow="Disbursement" title="Post a loan disbursement">
                            <form className="loan-disbursement-form" onSubmit={(event) => void disburseLoan(event)}>
                                <input className="app-field__control rounded-[20px] px-4 py-3.5 text-[1rem]" onChange={(event) => setDisbursementForm((current) => ({ ...current, payment_method: event.target.value }))} placeholder="Payment method" value={disbursementForm.payment_method} />
                                <label className="app-field">
                                    <span className="app-field__label">Disbursement receipt</span>
                                    <input
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        className="app-field__control"
                                        onChange={(event) => setDisbursementReceiptFile(event.target.files?.[0] ?? null)}
                                        required
                                        type="file"
                                    />
                                </label>
                                <textarea className="app-field__control min-h-24 rounded-[20px] px-4 py-3.5 text-[1rem]" onChange={(event) => setDisbursementForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" value={disbursementForm.notes} />
                                <button className="rounded-full bg-[var(--accent)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={selectedLoan.status !== 'approved'} type="submit">Disburse loan</button>
                            </form>

                            {selectedLoan.disbursement ? (
                                <div className="loan-disbursement-meta">
                                    <div>Disbursement status: {selectedLoan.disbursement.status.replace('_', ' ')}</div>
                                    <div>Disbursed at: {formatDate(selectedLoan.disbursement.disbursed_at)}</div>
                                    <div>Member confirmed at: {formatDate(selectedLoan.disbursement.member_confirmed_at)}</div>
                                    <div>
                                        Receipt: {selectedLoan.disbursement.receipt_url ? (
                                            <a className="landing-btn landing-btn--secondary" href={selectedLoan.disbursement.receipt_url} rel="noreferrer" target="_blank">View receipt</a>
                                        ) : 'No receipt'}
                                    </div>
                                </div>
                            ) : null}
                        </Panel>
                    </div>
                </div>
            ) : null}

            {activeTab === 'loan-workspace' && !selectedLoan ? (
                <div className="mt-6">
                    <Notice>Select a loan from the register to open its approval and disbursement workspace.</Notice>
                </div>
            ) : null}

            {activeTab === 'repayment-reviews' ? (
                <div className="mt-6">
                    <Panel eyebrow="Repayment reviews" title="Member-submitted repayment receipts awaiting EXCO review">
                        {repaymentSubmissionsTable ? (
                            <DataTable
                                columns={[
                                    { key: 'member', header: 'Member', render: (submission) => submission.member?.full_name ?? submission.loan?.member?.full_name ?? 'Unknown' },
                                    { key: 'loan_cycle', header: 'Cycle', render: (submission) => submission.loan?.cycle?.code ?? 'Not set' },
                                    { key: 'amount', header: 'Amount Paid', render: (submission) => formatCurrency(submission.amount_paid) },
                                    { key: 'submitted_at', header: 'Submitted At', render: (submission) => formatDate(submission.submitted_at) },
                                    { key: 'receipt', header: 'Receipt', render: (submission) => submission.receipt_url ? <a className="landing-btn landing-btn--secondary" href={submission.receipt_url} rel="noreferrer" target="_blank">View receipt</a> : 'No receipt' },
                                    { key: 'status', header: 'Status', render: (submission) => <StatusBadge active={submission.status === 'approved'}>{submission.status}</StatusBadge> },
                                    { key: 'member_note', header: 'Member Note', render: (submission) => submission.member_note ?? 'No note' },
                                    {
                                        key: 'action',
                                    header: 'Action',
                                    exportable: false,
                                    render: (submission) => submission.status === 'pending' ? (
                                            <div className="record-action-group">
                                                <button className="rounded-full bg-[var(--forest)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void reviewRepaymentSubmission(submission.id, 'approved')} type="button">Approve</button>
                                                <button className="rounded-full bg-[var(--danger)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void reviewRepaymentSubmission(submission.id, 'rejected')} type="button">Reject</button>
                                            </div>
                                        ) : submission.status,
                                    },
                                ]}
                                currentPage={repaymentSubmissionsTable.current_page}
                                currentPerPage={repaymentSubmissionsPerPage}
                                emptyMessage="No loan repayment receipts are waiting for review."
                                exportFilename="loan-repayment-submissions.csv"
                                filterPlaceholder="Filter repayment submissions"
                                onPageChange={(nextPage) => void loadRepaymentSubmissions(nextPage)}
                                onPerPageChange={(value) => {
                                    setRepaymentSubmissionPage(1);
                                    setRepaymentSubmissionsPerPage(value);
                                }}
                                rowKey={(submission) => submission.id}
                                rows={repaymentSubmissionsTable.data}
                                toolbarExtras={(
                                    <AppSelect className="app-filter-select" onChange={(event) => setRepaymentSubmissionStatusFilter(event.target.value)} value={repaymentSubmissionStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </AppSelect>
                                )}
                                totalItems={repaymentSubmissionsTable.total}
                                totalPages={repaymentSubmissionsTable.last_page}
                            />
                        ) : null}
                    </Panel>
                </div>
            ) : null}
        </div>
    );
}
