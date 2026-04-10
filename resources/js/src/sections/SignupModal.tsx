import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { MembershipCycle } from '../types';
import { CheckTile } from '../components/ui/CheckTile';
import { Field } from '../components/ui/Field';
import { Notice } from '../components/ui/Notice';

export function SignupModal({ onClose }: { onClose: () => void }) {
    const [cycleState, setCycleState] = useState<{ loading: boolean; cycle: MembershipCycle | null; open: boolean; error: string }>({
        loading: true,
        cycle: null,
        open: false,
        error: '',
    });
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        has_online_banking: true,
        whatsapp_active: true,
        biodata: '',
    });
    const [feedback, setFeedback] = useState({ message: '', error: '' });

    useEffect(() => {
        api.get('/api/onboarding/current-cycle')
            .then(({ data }) => setCycleState({ loading: false, cycle: data.cycle, open: data.onboarding_open, error: '' }))
            .catch((requestError) => setCycleState({
                loading: false,
                cycle: null,
                open: false,
                error: requestError.response?.data?.message ?? 'Unable to load onboarding status.',
            }));
    }, []);

    return (
        <div className="signup-modal-backdrop">
            <div className="signup-modal">
                <div className="signup-modal__header">
                    <div>
                        <p className="signup-modal__eyebrow">New member sign up</p>
                        <h2 className="signup-modal__title">Apply for onboarding</h2>
                    </div>
                    <button className="signup-modal__close" onClick={onClose} type="button">Close</button>
                </div>

                {cycleState.loading ? <Notice>Checking if the onboarding window is open...</Notice> : null}
                {!cycleState.loading && cycleState.error ? <Notice tone="danger">{cycleState.error}</Notice> : null}
                {!cycleState.loading && !cycleState.error && !cycleState.open ? (
                    <div className="signup-modal__closed">
                        <div className="signup-modal__closed-title">Onboarding closed</div>
                        <div className="signup-modal__closed-text">New member onboarding is currently closed for {cycleState.cycle?.name || 'the active cycle'}.</div>
                    </div>
                ) : null}

                {!cycleState.loading && cycleState.open && cycleState.cycle ? (
                    <div className="signup-modal__layout">
                        <div className="signup-modal__side">
                            <div className="signup-modal__side-eyebrow">Current onboarding cycle</div>
                            <div className="signup-modal__side-title">{cycleState.cycle.name}</div>
                            <div className="signup-modal__side-code">{cycleState.cycle.code}</div>
                            <div className="signup-modal__side-text">Closes: {cycleState.cycle.onboarding_closes_at || 'To be announced'}</div>
                            <div className="signup-modal__side-note">
                                Complete your details carefully. Once submitted, the application moves to EXCO review before approval.
                            </div>
                        </div>

                        <form
                            className="signup-modal__form"
                            onSubmit={async (event) => {
                                event.preventDefault();
                                setFeedback({ message: '', error: '' });
                                try {
                                    const { data } = await api.post('/api/member-applications', {
                                        ...form,
                                        biodata: form.biodata ? { note: form.biodata } : null,
                                    });
                                    setFeedback({ message: `${data.message} Your application is awaiting EXCO review.`, error: '' });
                                } catch (requestError: any) {
                                    setFeedback({ message: '', error: requestError.response?.data?.message ?? 'Unable to submit application.' });
                                }
                                }}
                        >
                            <div className="signup-modal__full"><Field label="Full Name" onChange={(value) => setForm((current) => ({ ...current, full_name: value }))} value={form.full_name} /></div>
                            <Field label="Email" onChange={(value) => setForm((current) => ({ ...current, email: value }))} type="email" value={form.email} />
                            <Field label="Phone Number" onChange={(value) => setForm((current) => ({ ...current, phone_number: value }))} value={form.phone_number} />
                            <CheckTile checked={form.has_online_banking} label="Has online banking" onChange={(checked) => setForm((current) => ({ ...current, has_online_banking: checked }))} />
                            <CheckTile checked={form.whatsapp_active} label="Active on WhatsApp" onChange={(checked) => setForm((current) => ({ ...current, whatsapp_active: checked }))} />
                            <label className="signup-modal__full signup-modal__textarea-field">
                                <span>Biodata note</span>
                                <textarea className="signup-modal__textarea" onChange={(event) => setForm((current) => ({ ...current, biodata: event.target.value }))} value={form.biodata} />
                            </label>
                            {feedback.message ? <div className="signup-modal__full"><Notice tone="success">{feedback.message}</Notice></div> : null}
                            {feedback.error ? <div className="signup-modal__full"><Notice tone="danger">{feedback.error}</Notice></div> : null}
                            <div className="signup-modal__full"><button className="landing-btn landing-btn--primary landing-btn--block" type="submit">Submit application</button></div>
                        </form>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
