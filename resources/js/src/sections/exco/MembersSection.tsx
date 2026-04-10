import { ChangeEvent, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { DataTable } from '../../components/ui/DataTable';
import { Field } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../feedback/ToastProvider';
import { downloadTableExport, type TableExportFormat } from '../../lib/download';
import { formatCurrency, formatDate, formatMonth } from '../../lib/formatters';
import { api } from '../../lib/api';
import type { Member, MembershipCycle, MembershipFee, PaginatedResponse, SharePurchase, UserRole } from '../../types';

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

type MemberRegistryTab = 'intake' | 'directory' | 'share-history' | 'membership-fees';

type ImportDraftRow = {
    full_name: string;
    email: string;
    phone_number: string;
    role: UserRole;
    membership_status: string;
    joined_on: string;
    has_online_banking: boolean;
    whatsapp_active: boolean;
    notes: string;
};

const importTemplateRows: ImportDraftRow[] = [
    {
        full_name: 'Example Member',
        email: 'example.member@jds.local',
        phone_number: '08000000010',
        role: 'member',
        membership_status: 'active',
        joined_on: '2026-01-01',
        has_online_banking: true,
        whatsapp_active: true,
        notes: 'Member code will be generated automatically by the platform.',
    },
    {
        full_name: 'Example Treasurer',
        email: 'example.treasurer@jds.local',
        phone_number: '08000000011',
        role: 'treasurer',
        membership_status: 'active',
        joined_on: '2026-01-01',
        has_online_banking: true,
        whatsapp_active: true,
        notes: 'Use the role column to determine whether the platform generates JDS-MEM or JDS-EXCO codes.',
    },
];

const memberRegistryTabs: Array<{ id: MemberRegistryTab; label: string; description: string }> = [
    {
        id: 'intake',
        label: 'Member Intake',
        description: 'Create a single member manually or import an existing register in batch. Each account gets a temporary login and a system-generated JDS member code unless you supply a trusted code.',
    },
    {
        id: 'directory',
        label: 'Directory',
        description: 'Browse the full member register, search by person, and filter by role or membership status.',
    },
    {
        id: 'share-history',
        label: 'Share History',
        description: 'Open a member record and inspect the official share purchase history already posted for that account.',
    },
    {
        id: 'membership-fees',
        label: 'Membership Fees',
        description: 'Review each selected member’s fee records by cycle, status, and payment month.',
    },
];

const defaultMemberForm = {
    full_name: '',
    email: '',
    phone_number: '',
    role: 'member' as UserRole,
    membership_status: 'active',
    joined_on: '',
    has_online_banking: true,
    whatsapp_active: true,
    notes: '',
};

export function MembersSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<MemberRegistryTab>('directory');
    const [memberSearch, setMemberSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [membersTable, setMembersTable] = useState<PaginatedResponse<Member> | null>(null);
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedMemberShares, setSelectedMemberShares] = useState<PaginatedResponse<SharePurchase> | null>(null);
    const [selectedMemberFees, setSelectedMemberFees] = useState<PaginatedResponse<MembershipFee> | null>(null);
    const [selectedMemberSharesPage, setSelectedMemberSharesPage] = useState(1);
    const [selectedMemberFeesPage, setSelectedMemberFeesPage] = useState(1);
    const [selectedShareMonthFilter, setSelectedShareMonthFilter] = useState('');
    const [selectedShareStatusFilter, setSelectedShareStatusFilter] = useState('');
    const [selectedFeeCycleFilter, setSelectedFeeCycleFilter] = useState('');
    const [selectedFeeStatusFilter, setSelectedFeeStatusFilter] = useState('');
    const [selectedFeeMonthFilter, setSelectedFeeMonthFilter] = useState('');
    const [memberForm, setMemberForm] = useState(defaultMemberForm);
    const [creatingMember, setCreatingMember] = useState(false);
    const [importRows, setImportRows] = useState<ImportDraftRow[]>([]);
    const [importFileName, setImportFileName] = useState('');
    const [importing, setImporting] = useState(false);

    const loadMembersTable = async (page = 1, search = memberSearch, role = roleFilter, status = statusFilter) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get<PaginatedResponse<Member>>('/api/exco/members', {
                params: {
                    page,
                    per_page: 10,
                    search: search || undefined,
                    role: role || undefined,
                    status: status || undefined,
                },
            });
            setMembersTable(data);
        } catch (requestError: any) {
            setError(requestError.response?.data?.message ?? 'Unable to load platform members right now.');
        } finally {
            setLoading(false);
        }
    };

    const loadSelectedMemberHistory = async (member: Member, sharePage = 1, feePage = 1) => {
        const [sharesResponse, feesResponse] = await Promise.all([
            api.get<PaginatedResponse<SharePurchase>>(`/api/exco/members/${member.id}/share-purchases`, {
                params: {
                    page: sharePage,
                    per_page: 8,
                    share_month: selectedShareMonthFilter || undefined,
                    payment_status: selectedShareStatusFilter || undefined,
                },
            }),
            api.get<PaginatedResponse<MembershipFee>>(`/api/exco/members/${member.id}/membership-fees`, {
                params: {
                    page: feePage,
                    per_page: 8,
                    membership_cycle_id: selectedFeeCycleFilter || undefined,
                    status: selectedFeeStatusFilter || undefined,
                    paid_month: selectedFeeMonthFilter || undefined,
                },
            }),
        ]);
        setSelectedMember(member);
        setSelectedMemberShares(sharesResponse.data);
        setSelectedMemberFees(feesResponse.data);
        setSelectedMemberSharesPage(sharesResponse.data.current_page);
        setSelectedMemberFeesPage(feesResponse.data.current_page);
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadMembersTable(1, memberSearch, roleFilter, statusFilter);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [memberSearch, roleFilter, statusFilter]);

    useEffect(() => {
        void api.get<MembershipCycle[]>('/api/exco/membership-cycles').then(({ data }) => setCycles(data));
    }, []);

    useEffect(() => {
        if (!selectedMember) {
            return;
        }

        const timeout = window.setTimeout(() => {
            void loadSelectedMemberHistory(selectedMember, 1, 1);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [selectedMember, selectedShareMonthFilter, selectedShareStatusFilter, selectedFeeCycleFilter, selectedFeeStatusFilter, selectedFeeMonthFilter]);

    async function exportMembers(format: TableExportFormat) {
        const { data } = await api.get<PaginatedResponse<Member>>('/api/exco/members', {
            params: {
                page: 1,
                per_page: 100,
                search: memberSearch || undefined,
                role: roleFilter || undefined,
                status: statusFilter || undefined,
            },
        });
        downloadTableExport(format, 'jds-members.csv', ['Member Number', 'Full Name', 'Email', 'Phone Number', 'Role', 'Status', 'Total Shares', 'Total Value'], data.data.map((member) => [
            member.member_number, member.full_name, member.email, member.phone_number, member.user?.role ?? 'member', member.membership_status, member.share_purchases_sum_shares_count ?? 0, member.share_purchases_sum_total_amount ?? 0,
        ]));
    }

    async function exportSelectedMemberShares(format: TableExportFormat) {
        if (!selectedMember) return;
        const { data } = await api.get<PaginatedResponse<SharePurchase>>(`/api/exco/members/${selectedMember.id}/share-purchases`, {
            params: {
                page: 1,
                per_page: 100,
                share_month: selectedShareMonthFilter || undefined,
                payment_status: selectedShareStatusFilter || undefined,
            },
        });
        downloadTableExport(format, `${selectedMember.full_name.replace(/\s+/g, '-').toLowerCase()}-share-history.csv`, ['Month', 'Cycle', 'Shares', 'Unit Share Price', 'Total Amount', 'Status', 'Payment Reference'], data.data.map((purchase) => [
            formatMonth(purchase.share_month), purchase.cycle?.code, purchase.shares_count, purchase.unit_share_price, purchase.total_amount, purchase.payment_status, purchase.payment_reference,
        ]));
    }

    async function handleCreateMember(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreatingMember(true);
        setError('');

        try {
            await api.post('/api/exco/members', {
                ...memberForm,
                joined_on: memberForm.joined_on || undefined,
            });
            showToast('Member account created and temporary login details sent.', 'success');
            setMemberForm(defaultMemberForm);
            setActiveTab('directory');
            await loadMembersTable(1);
        } catch (requestError: any) {
            const message = requestError.response?.data?.message ?? 'Unable to create the member account right now.';
            setError(message);
            showToast(message, 'error');
        } finally {
            setCreatingMember(false);
        }
    }

    function normalizeImportedRows(rows: Record<string, unknown>[]): ImportDraftRow[] {
        return rows
            .map((row) => {
                const normalized: Record<string, unknown> = {};

                Object.entries(row).forEach(([key, value]) => {
                    const normalizedKey = key.toLowerCase().trim().replace(/[\s-]+/g, '_');
                    normalized[normalizedKey] = typeof value === 'string' ? value.trim() : value;
                });

                return {
                    full_name: String(normalized.full_name ?? ''),
                    email: String(normalized.email ?? ''),
                    phone_number: String(normalized.phone_number ?? ''),
                    role: (String(normalized.role ?? 'member').toLowerCase() as UserRole) || 'member',
                    membership_status: String(normalized.membership_status ?? 'active').toLowerCase(),
                    joined_on: String(normalized.joined_on ?? ''),
                    has_online_banking: normalizeBoolean(normalized.has_online_banking, true),
                    whatsapp_active: normalizeBoolean(normalized.whatsapp_active, true),
                    notes: String(normalized.notes ?? ''),
                };
            })
            .filter((row) => row.full_name || row.email || row.phone_number);
    }

    async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) {
            setImportRows([]);
            setImportFileName('');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
                defval: '',
            });
            const normalizedRows = normalizeImportedRows(rawRows);
            setImportRows(normalizedRows);
            setImportFileName(file.name);

            if (!normalizedRows.length) {
                showToast('No importable rows were found in that file.', 'error');
            }
        } catch {
            setImportRows([]);
            setImportFileName('');
            showToast('Unable to read that file. Please upload a valid CSV or Excel sheet.', 'error');
        }
    }

    async function handleImportMembers() {
        if (!importRows.length) {
            showToast('Load a CSV or Excel file before starting the import.', 'error');
            return;
        }

        setImporting(true);
        setError('');

        try {
            const { data } = await api.post<{
                message: string;
                imported_count: number;
                failed_count: number;
            }>('/api/exco/members/import', {
                members: importRows,
            });

            showToast(data.message, data.failed_count > 0 ? 'error' : 'success');
            setImportRows([]);
            setImportFileName('');
            setActiveTab('directory');
            await loadMembersTable(1);
        } catch (requestError: any) {
            const message = requestError.response?.data?.message ?? 'Unable to import the member register right now.';
            setError(message);
            showToast(message, 'error');
        } finally {
            setImporting(false);
        }
    }

    function downloadImportTemplate(format: 'csv' | 'xlsx') {
        const headers = [
            'full_name',
            'email',
            'phone_number',
            'role',
            'membership_status',
            'joined_on',
            'has_online_banking',
            'whatsapp_active',
            'notes',
        ];

        const rows = importTemplateRows.map((row) => ({
            ...row,
            has_online_banking: row.has_online_banking ? 'true' : 'false',
            whatsapp_active: row.whatsapp_active ? 'true' : 'false',
        }));

        if (format === 'csv') {
            const csvLines = [
                headers.join(','),
                ...rows.map((row) => headers.map((header) => {
                    const value = String(row[header as keyof typeof row] ?? '');
                    return `"${value.replaceAll('"', '""')}"`;
                }).join(',')),
            ];

            const blob = new Blob(["\uFEFF" + csvLines.join('\r\n')], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'jds-member-import-template.csv';
            document.body.append(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(rows, {
            header: headers,
        });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
        XLSX.writeFile(workbook, 'jds-member-import-template.xlsx');
    }

    const activeMemberRegistryTab = memberRegistryTabs.find((tab) => tab.id === activeTab) ?? memberRegistryTabs[0];

    return (
        <div>
            <PageHeader
                description="This registry is the working list for EXCO. It includes EXCO officers and normal members because every platform user with a member profile participates in the cooperative."
                eyebrow="Member registry"
                title="See every member currently in the platform."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="workspace-tabs">
                {memberRegistryTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Member registry</p>
                <h3>{activeMemberRegistryTab.label}</h3>
                <p>{activeMemberRegistryTab.description}</p>
            </div>

            {activeTab === 'intake' ? (
                <div className="mt-6">
                    <div className="members-intake-grid">
                        <Panel eyebrow="Manual entry" title="Add a single existing member">
                            <form className="members-intake-form" onSubmit={handleCreateMember}>
                                <Field label="Full name" onChange={(value) => setMemberForm((current) => ({ ...current, full_name: value }))} value={memberForm.full_name} />
                                <div className="members-intake-form__row">
                                    <Field label="Email" onChange={(value) => setMemberForm((current) => ({ ...current, email: value }))} type="email" value={memberForm.email} />
                                    <Field label="Phone number" onChange={(value) => setMemberForm((current) => ({ ...current, phone_number: value }))} value={memberForm.phone_number} />
                                </div>
                                <div className="members-intake-form__row">
                                    <label className="app-field">
                                        <span className="app-field__label">Role</span>
                                        <select className="app-field__control" onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value as UserRole }))} value={memberForm.role}>
                                            <option value="member">Member</option>
                                            <option value="chairperson">Chairperson</option>
                                            <option value="secretary">Secretary</option>
                                            <option value="treasurer">Treasurer</option>
                                            <option value="support">Support</option>
                                        </select>
                                    </label>
                                    <label className="app-field">
                                        <span className="app-field__label">Membership status</span>
                                        <select className="app-field__control" onChange={(event) => setMemberForm((current) => ({ ...current, membership_status: event.target.value }))} value={memberForm.membership_status}>
                                            <option value="active">Active</option>
                                            <option value="approved">Approved</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="pending_review">Pending review</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="members-intake-form__row">
                                    <label className="app-field">
                                        <span className="app-field__label">Joined on</span>
                                        <input className="app-field__control" onChange={(event) => setMemberForm((current) => ({ ...current, joined_on: event.target.value }))} type="date" value={memberForm.joined_on} />
                                    </label>
                                    <label className="app-field">
                                        <span className="app-field__label">Notes</span>
                                        <input className="app-field__control" onChange={(event) => setMemberForm((current) => ({ ...current, notes: event.target.value }))} type="text" value={memberForm.notes} />
                                    </label>
                                </div>
                                <div className="members-intake-form__row">
                                    <label className="app-field">
                                        <span className="app-field__label">Online banking</span>
                                        <select className="app-field__control" onChange={(event) => setMemberForm((current) => ({ ...current, has_online_banking: event.target.value === 'true' }))} value={String(memberForm.has_online_banking)}>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </label>
                                    <label className="app-field">
                                        <span className="app-field__label">WhatsApp active</span>
                                        <select className="app-field__control" onChange={(event) => setMemberForm((current) => ({ ...current, whatsapp_active: event.target.value === 'true' }))} value={String(memberForm.whatsapp_active)}>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </label>
                                </div>

                                <p className="members-intake-help">
                                    Member codes are generated automatically as <strong>{memberForm.role === 'member' ? 'JDS-MEM-0001' : 'JDS-EXCO-0001'}</strong>. The system creates a temporary account and emails the login details to the member.
                                </p>

                                <button className="landing-btn landing-btn--primary" disabled={creatingMember} type="submit">
                                    {creatingMember ? 'Creating member...' : 'Create member account'}
                                </button>
                            </form>
                        </Panel>

                        <Panel eyebrow="Batch upload" title="Import an existing member register">
                            <div className="members-upload-box">
                                <p className="members-intake-help">
                                    Upload a CSV or Excel file with columns such as <strong>full_name</strong>, <strong>email</strong>, <strong>phone_number</strong>, <strong>role</strong>, <strong>membership_status</strong>, <strong>joined_on</strong>, <strong>has_online_banking</strong>, <strong>whatsapp_active</strong>, and <strong>notes</strong>. Member codes are generated automatically during import.
                                </p>
                                <div className="members-upload-actions">
                                    <button className="landing-btn landing-btn--secondary" onClick={() => downloadImportTemplate('csv')} type="button">
                                        Download CSV template
                                    </button>
                                    <button className="landing-btn landing-btn--secondary" onClick={() => downloadImportTemplate('xlsx')} type="button">
                                        Download XLSX template
                                    </button>
                                </div>
                                <input accept=".csv,.xlsx,.xls" onChange={handleImportFileChange} type="file" />
                                {importRows.length ? (
                                    <p className="members-upload-preview">
                                        <strong>{importRows.length}</strong> row(s) loaded from <strong>{importFileName}</strong>. Preview: {importRows.slice(0, 3).map((row) => `${row.full_name} (${row.email})`).join(', ')}
                                    </p>
                                ) : null}
                                <div className="members-upload-actions">
                                    <button className="landing-btn landing-btn--primary" disabled={importing || !importRows.length} onClick={() => void handleImportMembers()} type="button">
                                        {importing ? 'Importing members...' : 'Import members'}
                                    </button>
                                    <button
                                        className="landing-btn landing-btn--secondary"
                                        onClick={() => {
                                            setImportRows([]);
                                            setImportFileName('');
                                        }}
                                        type="button"
                                    >
                                        Clear file
                                    </button>
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>
            ) : null}

            {activeTab === 'directory' ? (
                <div className="mt-6">
                    <Panel eyebrow="Directory" title="Registered members">
                {loading ? <Notice>Loading platform members...</Notice> : null}
                {!loading && membersTable ? (
                    <DataTable
                        columns={[
                            { key: 'member_number', header: 'Member No.', render: (member) => member.member_number ?? 'Pending' },
                            { key: 'full_name', header: 'Full Name', render: (member) => member.full_name },
                            { key: 'role', header: 'Role', render: (member) => member.user?.role ?? 'member' },
                            { key: 'email', header: 'Email', render: (member) => member.email },
                            { key: 'status', header: 'Status', render: (member) => <StatusBadge active={member.membership_status === 'active' || member.membership_status === 'approved'}>{member.membership_status}</StatusBadge> },
                            { key: 'shares', header: 'Total Shares', render: (member) => String(member.share_purchases_sum_shares_count ?? 0) },
                            { key: 'value', header: 'Share Value', render: (member) => formatCurrency(member.share_purchases_sum_total_amount) },
                            {
                                key: 'actions',
                                header: 'Action',
                                exportable: false,
                                render: (member) => (
                                    <button
                                        aria-label={`View ${member.full_name} history`}
                                        className="app-icon-button"
                                        onClick={() => {
                                            void loadSelectedMemberHistory(member);
                                            setActiveTab('share-history');
                                        }}
                                        title="View history"
                                        type="button"
                                    >
                                        <ViewIcon />
                                    </button>
                                ),
                            },
                        ]}
                        currentPage={membersTable.current_page}
                        emptyMessage="No members match the current search."
                        exportFilename="jds-members.csv"
                        filterPlaceholder="Filter members"
                        filterValue={memberSearch}
                        onFilterChange={setMemberSearch}
                        onExport={(format) => void exportMembers(format)}
                        onPageChange={(page) => void loadMembersTable(page, memberSearch, roleFilter, statusFilter)}
                        rowKey={(member) => member.id}
                        rows={membersTable.data}
                        toolbarExtras={(
                            <>
                                <select className="app-filter-select" onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
                                    <option value="">All roles</option>
                                    <option value="chairperson">Chairperson</option>
                                    <option value="secretary">Secretary</option>
                                    <option value="treasurer">Treasurer</option>
                                    <option value="support">Support</option>
                                    <option value="member">Member</option>
                                </select>
                                <select className="app-filter-select" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                                    <option value="">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending_review">Pending review</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </>
                        )}
                        totalItems={membersTable.total}
                        totalPages={membersTable.last_page}
                    />
                ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'share-history' && selectedMember ? (
                <div className="mt-6">
                    <Panel eyebrow="Selected member" title={`${selectedMember.full_name} share history`}>
                        {selectedMemberShares ? (
                            <DataTable
                                columns={[
                                    { key: 'share_month', header: 'Month', render: (purchase) => formatMonth(purchase.share_month) },
                                    { key: 'cycle', header: 'Cycle', render: (purchase) => purchase.cycle?.code ?? 'Not set' },
                                    { key: 'shares_count', header: 'Shares', render: (purchase) => String(purchase.shares_count) },
                                    { key: 'unit_share_price', header: 'Unit Price', render: (purchase) => formatCurrency(purchase.unit_share_price) },
                                    { key: 'total_amount', header: 'Total', render: (purchase) => formatCurrency(purchase.total_amount) },
                                    { key: 'payment_status', header: 'Status', render: (purchase) => <StatusBadge active={purchase.payment_status === 'confirmed' || purchase.payment_status === 'paid'}>{purchase.payment_status}</StatusBadge> },
                                ]}
                                currentPage={selectedMemberShares.current_page}
                                emptyMessage="No share purchases recorded yet for this member."
                                filterPlaceholder="Filter share history"
                                onExport={(format) => void exportSelectedMemberShares(format)}
                                onPageChange={(page) => { setSelectedMemberSharesPage(page); void loadSelectedMemberHistory(selectedMember, page, selectedMemberFeesPage); }}
                                rowKey={(purchase) => purchase.id}
                                rows={selectedMemberShares.data}
                                toolbarExtras={(
                                    <>
                                        <input
                                            className="app-filter-select"
                                            onChange={(event) => setSelectedShareMonthFilter(event.target.value)}
                                            type="month"
                                            value={selectedShareMonthFilter}
                                        />
                                        <select className="app-filter-select" onChange={(event) => setSelectedShareStatusFilter(event.target.value)} value={selectedShareStatusFilter}>
                                            <option value="">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="confirmed">Confirmed</option>
                                        </select>
                                    </>
                                )}
                                totalItems={selectedMemberShares.total}
                                totalPages={selectedMemberShares.last_page}
                            />
                        ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'membership-fees' && selectedMember ? (
                <div className="mt-6">
                    <Panel eyebrow="Selected member" title={`${selectedMember.full_name} membership fees`}>
                        {selectedMemberFees ? (
                            <DataTable
                                columns={[
                                    { key: 'cycle', header: 'Cycle', render: (fee) => fee.cycle?.code ?? 'Not set' },
                                    { key: 'fee_type', header: 'Fee Type', render: (fee) => fee.fee_type.replace('_', ' ') },
                                    { key: 'amount', header: 'Amount', render: (fee) => formatCurrency(fee.amount) },
                                    { key: 'status', header: 'Status', render: (fee) => <StatusBadge active={fee.status === 'paid'}>{fee.status}</StatusBadge> },
                                    { key: 'paid_at', header: 'Paid At', render: (fee) => formatDate(fee.paid_at) },
                                ]}
                                currentPage={selectedMemberFees.current_page}
                                emptyMessage="No membership fee records found for this member."
                                filterPlaceholder="Filter membership fees"
                                onPageChange={(page) => { setSelectedMemberFeesPage(page); void loadSelectedMemberHistory(selectedMember, selectedMemberSharesPage, page); }}
                                rowKey={(fee) => fee.id}
                                rows={selectedMemberFees.data}
                                toolbarExtras={(
                                    <>
                                        <select className="app-filter-select" onChange={(event) => setSelectedFeeCycleFilter(event.target.value)} value={selectedFeeCycleFilter}>
                                            <option value="">All cycles</option>
                                            {cycles.map((cycle) => (
                                                <option key={cycle.id} value={cycle.id}>{cycle.code}</option>
                                            ))}
                                        </select>
                                        <select className="app-filter-select" onChange={(event) => setSelectedFeeStatusFilter(event.target.value)} value={selectedFeeStatusFilter}>
                                            <option value="">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="waived">Waived</option>
                                        </select>
                                        <input
                                            className="app-filter-select"
                                            onChange={(event) => setSelectedFeeMonthFilter(event.target.value)}
                                            type="month"
                                            value={selectedFeeMonthFilter}
                                        />
                                    </>
                                )}
                                totalItems={selectedMemberFees.total}
                                totalPages={selectedMemberFees.last_page}
                            />
                        ) : null}
                    </Panel>
                </div>
            ) : null}

            {activeTab !== 'directory' && activeTab !== 'intake' && !selectedMember ? <div className="mt-6"><Notice>Select a member from the directory to open their history.</Notice></div> : null}
        </div>
    );
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (['true', 'yes', '1'].includes(normalized)) {
            return true;
        }

        if (['false', 'no', '0'].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}
