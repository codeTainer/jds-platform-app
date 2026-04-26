import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AppSelect } from '../../components/ui/AppSelect';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { useToast } from '../../feedback/ToastProvider';
import { downloadTableExport, type TableExportFormat } from '../../lib/download';
import { formatCurrency, formatDate, formatMonth } from '../../lib/formatters';
import { api } from '../../lib/api';
import { formatShareWindowDate, resolveSharePurchaseWindow, toShareMonthApiDate } from '../../lib/shareWindow';
import type { MembershipCycle, MembershipFee, MembershipFeeSubmission, PaginatedResponse, SavingsOverview, SharePaymentSubmission, SharePurchase } from '../../types';

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

export function MemberSavingsSection() {
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
    const selectedSubmissionCycle = cycles.find((cycle) => String(cycle.id) === submissionForm.membership_cycle_id) ?? null;
    const selectedSharePurchaseWindow = resolveSharePurchaseWindow(
        submissionForm.share_month,
        selectedSubmissionCycle?.starts_on,
        selectedSubmissionCycle?.ends_on,
    );

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

        if (!submissionForm.share_month) {
            showToast('Please choose the share month you are paying for.', 'error');
            return;
        }

        if (!selectedSharePurchaseWindow?.isOpen) {
            showToast(
                selectedSharePurchaseWindow
                    ? !selectedSharePurchaseWindow.isInCycle
                        ? `Share payment for ${selectedSharePurchaseWindow.shareMonthLabel} is outside the selected cycle.`
                        : `Share payment for ${selectedSharePurchaseWindow.shareMonthLabel} is only open from ${formatShareWindowDate(selectedSharePurchaseWindow.opensAt)} to ${formatShareWindowDate(selectedSharePurchaseWindow.closesAt)}.`
                    : 'Please choose a valid share month before submitting.',
                'error',
            );
            return;
        }

        if (!submissionFile) {
            showToast('Please upload your share payment receipt before submitting.', 'error');
            return;
        }

        const payload = new FormData();
        payload.append('membership_cycle_id', submissionForm.membership_cycle_id);
        payload.append('share_month', toShareMonthApiDate(submissionForm.share_month));
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
                            <input className="app-field__control" onChange={(event) => setSubmissionForm((current) => ({ ...current, share_month: event.target.value }))} required type="month" value={submissionForm.share_month} />
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
                        {selectedSharePurchaseWindow ? (
                            <div className="md:col-span-2">
                                <Notice tone={selectedSharePurchaseWindow.isOpen ? undefined : 'danger'}>
                                    {selectedSharePurchaseWindow.isInCycle
                                        ? `${selectedSharePurchaseWindow.shareMonthLabel} shares can be submitted from ${formatShareWindowDate(selectedSharePurchaseWindow.opensAt)} to ${formatShareWindowDate(selectedSharePurchaseWindow.closesAt)}. ${selectedSharePurchaseWindow.isOpen ? 'This window is currently open.' : 'This window is currently closed.'}`
                                        : `${selectedSharePurchaseWindow.shareMonthLabel} is outside the selected cycle. Choose a share month that falls within ${selectedSubmissionCycle?.code ?? 'the selected cycle'}.`}
                                </Notice>
                            </div>
                        ) : (
                            <div className="md:col-span-2">
                                <Notice>
                                    Shares for each month open on the 25th of the previous month and close on the 5th of the share month.
                                </Notice>
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <button className="rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" disabled={submissionSubmitting || Boolean(submissionForm.share_month && !selectedSharePurchaseWindow?.isOpen)} type="submit">
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

