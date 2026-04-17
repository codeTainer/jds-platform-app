import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useToast } from '../../feedback/ToastProvider';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { api } from '../../lib/api';
import type { MembershipCycle } from '../../types';

function EditIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M4.5 16.5V19.5H7.5L17.25 9.75L14.25 6.75L4.5 16.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path
                d="M12.75 8.25L15.75 11.25"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M5.25 7.5H18.75"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path
                d="M9.75 10.5V16.5M14.25 10.5V16.5M7.5 7.5L8.25 18A1.5 1.5 0 0 0 9.75 19.5H14.25A1.5 1.5 0 0 0 15.75 18L16.5 7.5M9.75 7.5V5.25A.75.75 0 0 1 10.5 4.5H13.5A.75.75 0 0 1 14.25 5.25V7.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

interface CycleForm {
    name: string;
    code: string;
    starts_on: string;
    ends_on: string;
    onboarding_opens_at: string;
    onboarding_closes_at: string;
    share_price: string;
    accepting_new_applications: boolean;
    is_active: boolean;
}

const initialCycleForm: CycleForm = {
    name: '',
    code: '',
    starts_on: '',
    ends_on: '',
    onboarding_opens_at: '',
    onboarding_closes_at: '',
    share_price: '20000',
    accepting_new_applications: true,
    is_active: false,
};

type CycleStudioTab = 'create-cycle' | 'cycle-register';

const cycleStudioTabs: Array<{ id: CycleStudioTab; label: string; description: string }> = [
    {
        id: 'create-cycle',
        label: 'Create Cycle',
        description: 'Open a fresh operational year with its dates, onboarding window, share price, and active-cycle settings.',
    },
    {
        id: 'cycle-register',
        label: 'Cycle Register',
        description: 'Review all configured cycles, current statuses, and onboarding activity from one register.',
    },
];

export function CycleStudioSection() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<CycleStudioTab>('create-cycle');
    const [cycles, setCycles] = useState<MembershipCycle[]>([]);
    const [cycleForm, setCycleForm] = useState<CycleForm>(initialCycleForm);
    const [editingCycleId, setEditingCycleId] = useState<number | null>(null);
    const [cyclePendingDelete, setCyclePendingDelete] = useState<MembershipCycle | null>(null);

    const loadCycles = async () => {
        const { data } = await api.get<MembershipCycle[]>('/api/exco/membership-cycles');
        setCycles(data);
    };

    useEffect(() => {
        void loadCycles();
    }, []);

    async function createCycle(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const payload = {
                ...cycleForm,
                onboarding_opens_at: cycleForm.onboarding_opens_at || null,
                onboarding_closes_at: cycleForm.onboarding_closes_at || null,
                share_price: Number(cycleForm.share_price),
            };

            if (editingCycleId) {
                await api.patch(`/api/exco/membership-cycles/${editingCycleId}`, payload);
            } else {
                await api.post('/api/exco/membership-cycles', payload);
            }

            setCycleForm(initialCycleForm);
            setEditingCycleId(null);
            showToast(editingCycleId ? 'Cycle updated successfully.' : 'Cycle created successfully.', 'success');
            await loadCycles();
            setActiveTab('cycle-register');
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? `Unable to ${editingCycleId ? 'update' : 'create'} cycle.`, 'error');
        }
    }

    async function activateCycle(cycleId: number) {
        try {
            await api.patch(`/api/exco/membership-cycles/${cycleId}/activate`);
            showToast('Active cycle updated.', 'success');
            await loadCycles();
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to activate the selected cycle.', 'error');
        }
    }

    function startEditingCycle(cycle: MembershipCycle) {
        setEditingCycleId(cycle.id);
        setCycleForm({
            name: cycle.name ?? '',
            code: cycle.code ?? '',
            starts_on: cycle.starts_on ? String(cycle.starts_on).slice(0, 10) : '',
            ends_on: cycle.ends_on ? String(cycle.ends_on).slice(0, 10) : '',
            onboarding_opens_at: cycle.onboarding_opens_at ? String(cycle.onboarding_opens_at).slice(0, 10) : '',
            onboarding_closes_at: cycle.onboarding_closes_at ? String(cycle.onboarding_closes_at).slice(0, 10) : '',
            share_price: String(cycle.share_price ?? '20000'),
            accepting_new_applications: Boolean(cycle.accepting_new_applications),
            is_active: Boolean(cycle.is_active),
        });
        setActiveTab('create-cycle');
    }

    function resetCycleForm() {
        setEditingCycleId(null);
        setCycleForm(initialCycleForm);
    }

    async function deleteCycle() {
        if (!cyclePendingDelete) {
            return;
        }

        try {
            await api.delete(`/api/exco/membership-cycles/${cyclePendingDelete.id}`);
            showToast('Cycle deleted successfully.', 'success');
            if (editingCycleId === cyclePendingDelete.id) {
                resetCycleForm();
            }
            setCyclePendingDelete(null);
            await loadCycles();
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to delete the selected cycle.', 'error');
        }
    }

    const activeCycleStudioTab = cycleStudioTabs.find((tab) => tab.id === activeTab) ?? cycleStudioTabs[0];

    return (
        <div>
            <PageHeader
                description="This section lets EXCO control the operational year, the onboarding window, and the active cycle the rest of the platform should follow."
                eyebrow="Cycle studio"
                title="Create and activate annual JDS cycles."
            />

            <div className="workspace-tabs">
                {cycleStudioTabs.map((tab) => (
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
                <p className="workspace-tabs__eyebrow">Cycle studio</p>
                <h3>{activeCycleStudioTab.label}</h3>
                <p>{activeCycleStudioTab.description}</p>
            </div>

            {activeTab === 'create-cycle' ? (
                <div className="mt-6">
                    <Panel eyebrow={editingCycleId ? 'Edit cycle' : 'New cycle'} title={editingCycleId ? 'Update selected cycle' : 'Open a fresh cycle'}>
                    {editingCycleId ? (
                        <Notice>
                            You are editing an existing cycle. Save your changes here, or cancel to return to a blank cycle form.
                        </Notice>
                    ) : null}
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void createCycle(event)}>
                        {[
                            ['Cycle name', 'name', 'text'],
                            ['Cycle code', 'code', 'text'],
                            ['Share price', 'share_price', 'number'],
                            ['Starts on', 'starts_on', 'date'],
                            ['Ends on', 'ends_on', 'date'],
                            ['Onboarding opens', 'onboarding_opens_at', 'date'],
                            ['Onboarding closes', 'onboarding_closes_at', 'date'],
                        ].map(([label, key, type], index) => (
                            <label className={`block ${index === 0 ? 'md:col-span-2' : ''}`.trim()} key={key}>
                                <span className="mb-2 block text-[0.98rem] font-medium">{label}</span>
                                <input
                                    className="app-field__control w-full rounded-[20px] px-4 py-3.5 text-[1rem]"
                                    onChange={(event) => setCycleForm((current) => ({ ...current, [key]: event.target.value }))}
                                    type={type}
                                    value={cycleForm[key as keyof CycleForm] as string}
                                />
                            </label>
                        ))}
                        <label className="cycle-studio__toggle-row md:col-span-2">
                            <span>Accept new applications immediately</span>
                            <input checked={cycleForm.accepting_new_applications} onChange={(event) => setCycleForm((current) => ({ ...current, accepting_new_applications: event.target.checked }))} type="checkbox" />
                        </label>
                        <label className="cycle-studio__toggle-row md:col-span-2">
                            <span>Make this the active cycle</span>
                            <input checked={cycleForm.is_active} onChange={(event) => setCycleForm((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" />
                        </label>
                        <div className="md:col-span-2">
                            <div className="flex flex-wrap gap-3">
                                <button className="w-full rounded-full bg-[var(--forest)] px-5 py-3.5 text-[1rem] font-semibold text-white" type="submit">
                                    {editingCycleId ? 'Save cycle changes' : 'Create cycle'}
                                </button>
                                {editingCycleId ? (
                                    <button className="cycle-studio__secondary-action w-full rounded-full px-5 py-3.5 text-[1rem] font-semibold" onClick={resetCycleForm} type="button">
                                        Cancel editing
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </form>
                    </Panel>
                </div>
            ) : null}

            {activeTab === 'cycle-register' ? (
                <div className="mt-6">
                    <Panel eyebrow="Existing cycles" title="Current cycle list">
                    <div className="space-y-4">
                        {cycles.map((cycle) => (
                            <div key={cycle.id} className="cycle-studio__register-card px-5 py-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-[1rem] font-semibold">{cycle.name}</div>
                                            <StatusBadge active={cycle.is_active}>{cycle.is_active ? 'Active' : 'Inactive'}</StatusBadge>
                                        </div>
                                        <div className="mt-2 text-[0.98rem] text-[var(--muted)]">
                                            {cycle.code} | {formatDate(cycle.starts_on)} to {formatDate(cycle.ends_on)}
                                        </div>
                                        <div className="mt-2 text-[0.98rem] text-[var(--muted)]">
                                            Applications: {cycle.member_applications_count ?? 0} | Share price: {formatCurrency(cycle.share_price)}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {!cycle.is_active ? (
                                            <button className="cycle-studio__secondary-action rounded-full px-4 py-2.5 text-[0.98rem] font-semibold" onClick={() => void activateCycle(cycle.id)} type="button">
                                                Activate
                                            </button>
                                        ) : null}
                                        <button
                                            aria-label={`Edit ${cycle.name}`}
                                            className="app-icon-button"
                                            onClick={() => startEditingCycle(cycle)}
                                            title="Edit cycle"
                                            type="button"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            aria-label={`Delete ${cycle.name}`}
                                            className="app-icon-button"
                                            onClick={() => setCyclePendingDelete(cycle)}
                                            title="Delete cycle"
                                            type="button"
                                        >
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    </Panel>
                </div>
            ) : null}

            {cyclePendingDelete ? (
                <div className="constitution-modal-backdrop">
                    <div className="constitution-modal constitution-modal--narrow">
                        <div className="constitution-modal__header">
                            <div>
                                <div className="constitution-modal__eyebrow">Delete cycle</div>
                                <h3>Delete {cyclePendingDelete.code}?</h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={() => setCyclePendingDelete(null)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>

                        <div className="constitution-modal__body">
                            <section className="constitution-section">
                                <p>
                                    This will remove the selected cycle permanently. Cycles with linked applications, savings, loans, or share-out records cannot be deleted.
                                </p>
                            </section>

                            <div className="members-upload-actions">
                                <button className="landing-btn landing-btn--primary" onClick={() => void deleteCycle()} type="button">
                                    Delete cycle
                                </button>
                                <button className="landing-btn landing-btn--secondary" onClick={() => setCyclePendingDelete(null)} type="button">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
