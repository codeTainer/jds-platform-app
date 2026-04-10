import { useEffect, useState } from 'react';
import { useToast } from '../../feedback/ToastProvider';
import { DataTable } from '../../components/ui/DataTable';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { downloadTableExport, type TableExportFormat } from '../../lib/download';
import { formatCurrency, formatDate, formatMonth } from '../../lib/formatters';
import { api } from '../../lib/api';
import type { MembershipCycle, MembershipFee, MembershipFeeSubmission, PaginatedResponse, SharePaymentSubmission, SharePurchase } from '../../types';

type SavingsDeskTab = 'share-receipts' | 'share-purchases' | 'fee-receipts' | 'membership-fees';

const savingsDeskTabs: Array<{ id: SavingsDeskTab; label: string; description: string }> = [
    {
        id: 'share-receipts',
        label: 'Share Receipts',
        description: 'Review member-uploaded share receipts and convert approved submissions into official share records.',
    },
    {
        id: 'share-purchases',
        label: 'Share Purchases',
        description: 'Review the official monthly share records that have already been posted after verification.',
    },
    {
        id: 'fee-receipts',
        label: 'Fee Receipts',
        description: 'Review membership fee receipts submitted by members and approve the valid cycle fee entries.',
    },
    {
        id: 'membership-fees',
        label: 'Membership Fees',
        description: 'Review the official membership fee register after confirmed receipts have been posted.',
    },
];

export function SavingsDeskSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<SavingsDeskTab>('share-receipts');
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [feesTable, setFeesTable] = useState<PaginatedResponse<MembershipFee> | null>(null);
    const [feeSubmissionsTable, setFeeSubmissionsTable] = useState<PaginatedResponse<MembershipFeeSubmission> | null>(null);
    const [sharePurchasesTable, setSharePurchasesTable] = useState<PaginatedResponse<SharePurchase> | null>(null);
    const [shareSubmissionsTable, setShareSubmissionsTable] = useState<PaginatedResponse<SharePaymentSubmission> | null>(null);
    const [feesPage, setFeesPage] = useState(1);
    const [feeSubmissionsPage, setFeeSubmissionsPage] = useState(1);
    const [sharePurchasesPage, setSharePurchasesPage] = useState(1);
    const [shareSubmissionsPage, setShareSubmissionsPage] = useState(1);
    const [shareMonthFilter, setShareMonthFilter] = useState('');
    const [shareStatusFilter, setShareStatusFilter] = useState('');
    const [shareCycleFilter, setShareCycleFilter] = useState('');
    const [feeMonthFilter, setFeeMonthFilter] = useState('');
    const [feeStatusFilter, setFeeStatusFilter] = useState('');
    const [feeCycleFilter, setFeeCycleFilter] = useState('');
    const [feeTypeFilter, setFeeTypeFilter] = useState('');
    const [feeSubmissionCycleFilter, setFeeSubmissionCycleFilter] = useState('');
    const [feeSubmissionStatusFilter, setFeeSubmissionStatusFilter] = useState('');
    const [feeSubmissionTypeFilter, setFeeSubmissionTypeFilter] = useState('');

    const loadTables = async (
        sharePage = sharePurchasesPage,
        shareSubmissionPage = shareSubmissionsPage,
        feeSubmissionPage = feeSubmissionsPage,
        feePage = feesPage,
    ) => {
        const [sharePurchasesResponse, shareSubmissionsResponse, feeSubmissionsResponse, feesResponse] = await Promise.all([
            api.get<PaginatedResponse<SharePurchase>>('/api/exco/share-purchases', {
                params: {
                    page: sharePage,
                    per_page: 10,
                    share_month: shareMonthFilter || undefined,
                    payment_status: shareStatusFilter || undefined,
                    membership_cycle_id: shareCycleFilter || undefined,
                },
            }),
            api.get<PaginatedResponse<SharePaymentSubmission>>('/api/exco/share-payment-submissions', {
                params: {
                    page: shareSubmissionPage,
                    per_page: 10,
                    share_month: shareMonthFilter || undefined,
                    status: shareStatusFilter || undefined,
                    membership_cycle_id: shareCycleFilter || undefined,
                },
            }),
            api.get<PaginatedResponse<MembershipFeeSubmission>>('/api/exco/membership-fee-submissions', {
                params: {
                    page: feeSubmissionPage,
                    per_page: 10,
                    membership_cycle_id: feeSubmissionCycleFilter || undefined,
                    fee_type: feeSubmissionTypeFilter || undefined,
                    status: feeSubmissionStatusFilter || undefined,
                },
            }),
            api.get<PaginatedResponse<MembershipFee>>('/api/exco/membership-fees', {
                params: {
                    page: feePage,
                    per_page: 10,
                    paid_month: feeMonthFilter || undefined,
                    status: feeStatusFilter || undefined,
                    membership_cycle_id: feeCycleFilter || undefined,
                    fee_type: feeTypeFilter || undefined,
                },
            }),
        ]);

        setSharePurchasesTable(sharePurchasesResponse.data);
        setShareSubmissionsTable(shareSubmissionsResponse.data);
        setFeeSubmissionsTable(feeSubmissionsResponse.data);
        setFeesTable(feesResponse.data);
        setSharePurchasesPage(sharePurchasesResponse.data.current_page);
        setShareSubmissionsPage(shareSubmissionsResponse.data.current_page);
        setFeeSubmissionsPage(feeSubmissionsResponse.data.current_page);
        setFeesPage(feesResponse.data.current_page);
    };

    useEffect(() => {
        api.get<MembershipCycle[]>('/api/exco/membership-cycles').then(({ data }) => {
            setCycles(data);
        });

        void loadTables(1, 1, 1, 1);
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadTables(1, 1, 1, 1);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [
        shareMonthFilter,
        shareStatusFilter,
        shareCycleFilter,
        feeMonthFilter,
        feeStatusFilter,
        feeCycleFilter,
        feeTypeFilter,
        feeSubmissionCycleFilter,
        feeSubmissionStatusFilter,
        feeSubmissionTypeFilter,
    ]);

    async function reviewShareSubmission(submissionId: number, status: 'approved' | 'rejected') {
        try {
            const payload = status === 'rejected'
                ? { status, review_note: 'Rejected during EXCO verification.' }
                : { status };

            await api.patch(`/api/exco/share-payment-submissions/${submissionId}/review`, payload);
            showToast(status === 'approved' ? 'Share receipt approved and posted successfully.' : 'Share receipt rejected successfully.', 'success');
            await loadTables(sharePurchasesPage, 1, feeSubmissionsPage, feesPage);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to review share payment submission.', 'error');
        }
    }

    async function reviewMembershipFeeSubmission(submissionId: number, status: 'approved' | 'rejected') {
        try {
            const payload = status === 'rejected'
                ? { status, review_note: 'Rejected during EXCO verification.' }
                : { status };

            await api.patch(`/api/exco/membership-fee-submissions/${submissionId}/review`, payload);
            showToast(status === 'approved' ? 'Membership fee receipt approved and posted successfully.' : 'Membership fee receipt rejected successfully.', 'success');
            await loadTables(sharePurchasesPage, shareSubmissionsPage, 1, feesPage);
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to review membership fee submission.', 'error');
        }
    }

    async function exportSharePurchases(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<SharePurchase>>('/api/exco/share-purchases', {
            params: {
                page: 1,
                per_page: 100,
                share_month: shareMonthFilter || undefined,
                payment_status: shareStatusFilter || undefined,
                membership_cycle_id: shareCycleFilter || undefined,
            },
        });
        downloadTableExport(format, 'jds-share-purchases.csv', ['Member', 'Month', 'Shares', 'Unit Share Price', 'Total Amount', 'Status', 'Cycle'], data.data.map((purchase) => [
            purchase.member?.full_name, formatMonth(purchase.share_month), purchase.shares_count, purchase.unit_share_price, purchase.total_amount, purchase.payment_status, purchase.cycle?.code,
        ]));
    }

    async function exportShareSubmissions(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<SharePaymentSubmission>>('/api/exco/share-payment-submissions', {
            params: {
                page: 1,
                per_page: 100,
                share_month: shareMonthFilter || undefined,
                status: shareStatusFilter || undefined,
                membership_cycle_id: shareCycleFilter || undefined,
            },
        });
        downloadTableExport(format, 'share-payment-submissions.csv', ['Member', 'Cycle', 'Month', 'Shares', 'Expected Amount', 'Status', 'Submitted At'], data.data.map((submission) => [
            submission.member?.full_name,
            submission.cycle?.code,
            formatMonth(submission.share_month),
            submission.shares_count,
            submission.expected_amount,
            submission.status,
            formatDate(submission.submitted_at),
        ]));
    }

    async function exportMembershipFees(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<MembershipFee>>('/api/exco/membership-fees', {
            params: {
                page: 1,
                per_page: 100,
                paid_month: feeMonthFilter || undefined,
                status: feeStatusFilter || undefined,
                membership_cycle_id: feeCycleFilter || undefined,
                fee_type: feeTypeFilter || undefined,
            },
        });
        downloadTableExport(format, 'jds-membership-fees.csv', ['Member', 'Cycle', 'Fee Type', 'Amount', 'Status', 'Paid At'], data.data.map((fee) => [
            fee.member?.full_name, fee.cycle?.code, fee.fee_type, fee.amount, fee.status, formatDate(fee.paid_at),
        ]));
    }

    async function exportMembershipFeeSubmissions(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<MembershipFeeSubmission>>('/api/exco/membership-fee-submissions', {
            params: {
                page: 1,
                per_page: 100,
                membership_cycle_id: feeSubmissionCycleFilter || undefined,
                fee_type: feeSubmissionTypeFilter || undefined,
                status: feeSubmissionStatusFilter || undefined,
            },
        });
        downloadTableExport(format, 'membership-fee-submissions.csv', ['Member', 'Cycle', 'Fee Type', 'Expected Amount', 'Status', 'Submitted At'], data.data.map((submission) => [
            submission.member?.full_name,
            submission.cycle?.code,
            submission.fee_type,
            submission.expected_amount,
            submission.status,
            formatDate(submission.submitted_at),
        ]));
    }

    const activeSavingsDeskTab = savingsDeskTabs.find((tab) => tab.id === activeTab) ?? savingsDeskTabs[0];

    return (
        <div>
            <PageHeader
                description="This is the EXCO savings management workspace. Members now submit both share and membership-fee receipts from their own dashboard, and EXCO reviews those submissions before the official records are posted."
                eyebrow="Savings management"
                title="Review savings receipts and official fee records."
            />

            <div className="workspace-tabs">
                {savingsDeskTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Savings management</p>
                <h3>{activeSavingsDeskTab.label}</h3>
                <p>{activeSavingsDeskTab.description}</p>
            </div>

            <div className="mt-6">
                <Notice>
                    Members pay externally, upload their receipts in the platform, and EXCO confirms only the verified receipts into the official cooperative record.
                </Notice>
            </div>

            {activeTab === 'share-receipts' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Share receipt verification" title="Share payment submissions awaiting EXCO review">
                    {shareSubmissionsTable ? (
                        <DataTable
                            columns={[
                                { key: 'member', header: 'Member', render: (submission) => submission.member?.full_name ?? 'Unknown' },
                                { key: 'month', header: 'Month', render: (submission) => formatMonth(submission.share_month) },
                                { key: 'shares', header: 'Shares', render: (submission) => String(submission.shares_count) },
                                { key: 'expected', header: 'Expected Amount', render: (submission) => formatCurrency(submission.expected_amount) },
                                { key: 'cycle', header: 'Cycle', render: (submission) => submission.cycle?.code ?? 'Not set' },
                                { key: 'receipt', header: 'Receipt', render: (submission) => submission.receipt_url ? <a className="landing-btn landing-btn--secondary" href={submission.receipt_url} rel="noreferrer" target="_blank">View receipt</a> : 'No receipt' },
                                { key: 'status', header: 'Status', render: (submission) => <StatusBadge active={submission.status === 'approved'}>{submission.status}</StatusBadge> },
                                {
                                    key: 'action',
                                    header: 'Action',
                                    exportable: false,
                                    render: (submission) => submission.status === 'pending' ? (
                                        <div className="flex gap-2">
                                            <button className="rounded-full bg-[var(--forest)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void reviewShareSubmission(submission.id, 'approved')} type="button">Approve</button>
                                            <button className="rounded-full bg-[var(--danger)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void reviewShareSubmission(submission.id, 'rejected')} type="button">Reject</button>
                                        </div>
                                    ) : submission.status,
                                },
                            ]}
                            currentPage={shareSubmissionsTable.current_page}
                            emptyMessage="No share payment submissions are waiting for review."
                            exportFilename="share-payment-submissions.csv"
                            filterPlaceholder="Filter share receipts"
                            onExport={(format) => void exportShareSubmissions(format)}
                            onPageChange={(page) => void loadTables(sharePurchasesPage, page, feeSubmissionsPage, feesPage)}
                            rowKey={(submission) => submission.id}
                            rows={shareSubmissionsTable.data}
                            toolbarExtras={(
                                <>
                                    <input
                                        className="app-filter-select"
                                        onChange={(event) => setShareMonthFilter(event.target.value)}
                                        type="month"
                                        value={shareMonthFilter}
                                    />
                                    <select className="app-filter-select" onChange={(event) => setShareStatusFilter(event.target.value)} value={shareStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <select className="app-filter-select" onChange={(event) => setShareCycleFilter(event.target.value)} value={shareCycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </select>
                                </>
                            )}
                            totalItems={shareSubmissionsTable.total}
                            totalPages={shareSubmissionsTable.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'share-purchases' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Share purchase table" title="All recorded share purchases">
                    {sharePurchasesTable ? (
                        <DataTable
                            columns={[
                                { key: 'member', header: 'Member', render: (purchase) => purchase.member?.full_name ?? 'Unknown' },
                                { key: 'month', header: 'Month', render: (purchase) => formatMonth(purchase.share_month) },
                                { key: 'shares', header: 'Shares', render: (purchase) => String(purchase.shares_count) },
                                { key: 'total', header: 'Total', render: (purchase) => formatCurrency(purchase.total_amount) },
                                { key: 'status', header: 'Status', render: (purchase) => <StatusBadge active={purchase.payment_status === 'confirmed' || purchase.payment_status === 'paid'}>{purchase.payment_status}</StatusBadge> },
                                { key: 'cycle', header: 'Cycle', render: (purchase) => purchase.cycle?.code ?? 'Not set' },
                            ]}
                            currentPage={sharePurchasesTable.current_page}
                            emptyMessage="No share purchases have been posted yet."
                            exportFilename="jds-share-purchases.csv"
                            filterPlaceholder="Filter share purchases"
                            onExport={(format) => void exportSharePurchases(format)}
                            onPageChange={(page) => void loadTables(page, shareSubmissionsPage, feeSubmissionsPage, feesPage)}
                            rowKey={(purchase) => purchase.id}
                            rows={sharePurchasesTable.data}
                            toolbarExtras={(
                                <>
                                    <input
                                        className="app-filter-select"
                                        onChange={(event) => setShareMonthFilter(event.target.value)}
                                        type="month"
                                        value={shareMonthFilter}
                                    />
                                    <select className="app-filter-select" onChange={(event) => setShareStatusFilter(event.target.value)} value={shareStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="confirmed">Confirmed</option>
                                    </select>
                                    <select className="app-filter-select" onChange={(event) => setShareCycleFilter(event.target.value)} value={shareCycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </select>
                                </>
                            )}
                            totalItems={sharePurchasesTable.total}
                            totalPages={sharePurchasesTable.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'fee-receipts' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Membership fee verification" title="Membership fee submissions awaiting EXCO review">
                    {feeSubmissionsTable ? (
                        <DataTable
                            columns={[
                                { key: 'member', header: 'Member', render: (submission) => submission.member?.full_name ?? 'Unknown' },
                                { key: 'cycle', header: 'Cycle', render: (submission) => submission.cycle?.code ?? 'Not set' },
                                { key: 'fee_type', header: 'Fee Type', render: (submission) => submission.fee_type.replace('_', ' ') },
                                { key: 'expected_amount', header: 'Expected Amount', render: (submission) => formatCurrency(submission.expected_amount) },
                                { key: 'receipt', header: 'Receipt', render: (submission) => submission.receipt_url ? <a className="landing-btn landing-btn--secondary" href={submission.receipt_url} rel="noreferrer" target="_blank">View receipt</a> : 'No receipt' },
                                { key: 'status', header: 'Status', render: (submission) => <StatusBadge active={submission.status === 'approved'}>{submission.status}</StatusBadge> },
                                {
                                    key: 'action',
                                    header: 'Action',
                                    exportable: false,
                                    render: (submission) => submission.status === 'pending' ? (
                                        <div className="flex gap-2">
                                            <button className="rounded-full bg-[var(--forest)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void reviewMembershipFeeSubmission(submission.id, 'approved')} type="button">Approve</button>
                                            <button className="rounded-full bg-[var(--danger)] px-3 py-2 text-[0.9rem] font-semibold text-white" onClick={() => void reviewMembershipFeeSubmission(submission.id, 'rejected')} type="button">Reject</button>
                                        </div>
                                    ) : submission.status,
                                },
                            ]}
                            currentPage={feeSubmissionsTable.current_page}
                            emptyMessage="No membership fee submissions are waiting for review."
                            exportFilename="membership-fee-submissions.csv"
                            filterPlaceholder="Filter fee receipts"
                            onExport={(format) => void exportMembershipFeeSubmissions(format)}
                            onPageChange={(page) => void loadTables(sharePurchasesPage, shareSubmissionsPage, page, feesPage)}
                            rowKey={(submission) => submission.id}
                            rows={feeSubmissionsTable.data}
                            toolbarExtras={(
                                <>
                                    <select className="app-filter-select" onChange={(event) => setFeeSubmissionCycleFilter(event.target.value)} value={feeSubmissionCycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </select>
                                    <select className="app-filter-select" onChange={(event) => setFeeSubmissionTypeFilter(event.target.value)} value={feeSubmissionTypeFilter}>
                                        <option value="">All fee types</option>
                                        <option value="new_member">New member</option>
                                        <option value="existing_member">Existing member</option>
                                    </select>
                                    <select className="app-filter-select" onChange={(event) => setFeeSubmissionStatusFilter(event.target.value)} value={feeSubmissionStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </>
                            )}
                            totalItems={feeSubmissionsTable.total}
                            totalPages={feeSubmissionsTable.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'membership-fees' ? (
                <div className="mt-6 grid gap-6">
                    <Panel eyebrow="Membership fees table" title="All recorded membership fees">
                    {feesTable ? (
                        <DataTable
                            columns={[
                                { key: 'member', header: 'Member', render: (fee) => fee.member?.full_name ?? 'Unknown' },
                                { key: 'cycle', header: 'Cycle', render: (fee) => fee.cycle?.code ?? 'Not set' },
                                { key: 'fee_type', header: 'Fee Type', render: (fee) => fee.fee_type.replace('_', ' ') },
                                { key: 'amount', header: 'Amount', render: (fee) => formatCurrency(fee.amount) },
                                { key: 'status', header: 'Status', render: (fee) => <StatusBadge active={fee.status === 'paid'}>{fee.status}</StatusBadge> },
                                { key: 'paid_at', header: 'Paid At', render: (fee) => formatDate(fee.paid_at) },
                            ]}
                            currentPage={feesTable.current_page}
                            emptyMessage="No membership fees have been recorded yet."
                            exportFilename="jds-membership-fees.csv"
                            filterPlaceholder="Filter membership fees"
                            onExport={(format) => void exportMembershipFees(format)}
                            onPageChange={(page) => void loadTables(sharePurchasesPage, shareSubmissionsPage, feeSubmissionsPage, page)}
                            rowKey={(fee) => fee.id}
                            rows={feesTable.data}
                            toolbarExtras={(
                                <>
                                    <input
                                        className="app-filter-select"
                                        onChange={(event) => setFeeMonthFilter(event.target.value)}
                                        type="month"
                                        value={feeMonthFilter}
                                    />
                                    <select className="app-filter-select" onChange={(event) => setFeeCycleFilter(event.target.value)} value={feeCycleFilter}>
                                        <option value="">All cycles</option>
                                        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.code}</option>)}
                                    </select>
                                    <select className="app-filter-select" onChange={(event) => setFeeTypeFilter(event.target.value)} value={feeTypeFilter}>
                                        <option value="">All fee types</option>
                                        <option value="new_member">New member</option>
                                        <option value="existing_member">Existing member</option>
                                    </select>
                                    <select className="app-filter-select" onChange={(event) => setFeeStatusFilter(event.target.value)} value={feeStatusFilter}>
                                        <option value="">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="waived">Waived</option>
                                    </select>
                                </>
                            )}
                            totalItems={feesTable.total}
                            totalPages={feesTable.last_page}
                        />
                    ) : null}
                    </Panel>
                </div>
            ) : null}
        </div>
    );
}
