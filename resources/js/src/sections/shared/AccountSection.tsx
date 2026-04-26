import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Field } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../feedback/ToastProvider';
import { formatDate } from '../../lib/formatters';
import { getPasswordRuleChecks, validatePasswordForm, type PasswordFormErrors } from '../../lib/passwordRules';

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="account-detail-card">
            <span className="account-detail-card__label">{label}</span>
            <strong className="account-detail-card__value">{value}</strong>
        </div>
    );
}

export function AccountSection() {
    const { user, isExco, changePassword } = useAuth();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFormErrors>({});
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const passwordChecks = useMemo(() => getPasswordRuleChecks(
        passwordForm.current_password,
        passwordForm.password,
        passwordForm.password_confirmation,
        'Different from your current password',
    ), [passwordForm.current_password, passwordForm.password, passwordForm.password_confirmation]);
    const canSubmitPasswordChange = Object.keys(validatePasswordForm(passwordForm, 'current password')).length === 0
        && passwordChecks.every((check) => check.passed);

    useEffect(() => {
        setPasswordModalOpen(searchParams.get('password') === '1');
    }, [searchParams]);

    function openPasswordModal() {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('password', '1');
        setSearchParams(nextParams);
    }

    function closePasswordModal() {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('password');
        setSearchParams(nextParams);
        setPasswordModalOpen(false);
        setPasswordError('');
        setPasswordFieldErrors({});
    }

    function updatePasswordField(field: keyof typeof passwordForm, value: string) {
        const nextForm = {
            ...passwordForm,
            [field]: value,
        };

        setPasswordForm(nextForm);

        if (Object.keys(passwordFieldErrors).length > 0) {
            setPasswordFieldErrors(validatePasswordForm(nextForm, 'current password'));
        }

        if (passwordError) {
            setPasswordError('');
        }
    }

    async function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationErrors = validatePasswordForm(passwordForm, 'current password');

        setPasswordFieldErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setPasswordError('Please correct the highlighted fields and try again.');
            return;
        }

        if (!canSubmitPasswordChange) {
            setPasswordError('Please satisfy all password requirements before continuing.');
            return;
        }

        setPasswordSubmitting(true);
        setPasswordError('');

        try {
            await changePassword(passwordForm);
            showToast('Password updated successfully.', 'success');
            closePasswordModal();
            setPasswordForm({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
            setPasswordFieldErrors({});
        } catch (requestError: any) {
            const message = requestError.response?.data?.message ?? 'Unable to change your password right now.';
            setPasswordError(message);
            showToast(message, 'error');
        } finally {
            setPasswordSubmitting(false);
        }
    }

    return (
        <div>
            <PageHeader
                description="Review the personal account record currently stored for you on the platform, including your contact details and membership profile where available."
                eyebrow="My account"
                title="See your personal account record."
            />

            <div className="grid gap-6">
                <Panel
                    action={(
                        <button
                            className="landing-btn landing-btn--primary"
                            onClick={openPasswordModal}
                            type="button"
                        >
                            Change password
                        </button>
                    )}
                    eyebrow="Account identity"
                    title="Your account details"
                >
                    <div className="account-detail-grid">
                        <DetailRow label="Full name" value={user?.member?.full_name ?? user?.name ?? 'Not set'} />
                        <DetailRow label="Email address" value={user?.email ?? 'Not set'} />
                        <DetailRow label="Phone number" value={user?.member?.phone_number ?? 'Not available'} />
                        <DetailRow label="Role" value={user?.role ?? 'Not set'} />
                        <DetailRow label="Member number" value={user?.member?.member_number ?? 'Not assigned'} />
                        <DetailRow label="Membership status" value={user?.member?.membership_status ?? 'Not available'} />
                        <DetailRow label="Joined on" value={formatDate(user?.member?.joined_on) || 'Not available'} />
                        <DetailRow label="Password changed" value={formatDate(user?.password_changed_at) || 'Not recorded'} />
                    </div>
                </Panel>

                {user?.member ? (
                    <Panel eyebrow="Member profile" title="Additional member information">
                        <div className="account-detail-grid">
                            <DetailRow label="Online banking" value={user.member.has_online_banking ? 'Yes' : 'No'} />
                            <DetailRow label="WhatsApp active" value={user.member.whatsapp_active ? 'Yes' : 'No'} />
                            <DetailRow label="Profile completed" value={formatDate(user.member.profile_completed_at) || 'Not recorded'} />
                            <DetailRow label="Notes" value={user.member.notes?.trim() || 'No notes recorded'} />
                        </div>
                    </Panel>
                ) : (
                    <Notice>
                        This account does not currently have a linked member profile. {isExco ? 'You can still use the platform with your EXCO access.' : ''}
                    </Notice>
                )}
            </div>

            {passwordModalOpen ? (
                <div
                    className="constitution-modal-backdrop"
                    onClick={closePasswordModal}
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
                                <p className="constitution-modal__eyebrow">Security</p>
                                <h3>Change your password</h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={closePasswordModal}
                                type="button"
                            >
                                Close
                            </button>
                        </div>
                        <div className="constitution-modal__body">
                            <form className="auth-gate-form" onSubmit={(event) => void submitPasswordChange(event)}>
                                <Field
                                    label="Current password"
                                    error={passwordFieldErrors.current_password}
                                    onChange={(value) => updatePasswordField('current_password', value)}
                                    type="password"
                                    value={passwordForm.current_password}
                                />
                                <Field
                                    label="New password"
                                    error={passwordFieldErrors.password}
                                    onChange={(value) => updatePasswordField('password', value)}
                                    type="password"
                                    value={passwordForm.password}
                                />
                                <div className="password-rules-card">
                                    <p className="password-rules-card__title">Password requirements</p>
                                    <div className="password-rules-list">
                                        {passwordChecks.map((check) => (
                                            <div
                                                className={`password-rules-item${check.passed ? ' password-rules-item--passed' : ''}`}
                                                key={check.label}
                                            >
                                                <span className="password-rules-item__icon" aria-hidden="true">
                                                    {check.passed ? '✓' : '•'}
                                                </span>
                                                <span>{check.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Field
                                    label="Confirm new password"
                                    error={passwordFieldErrors.password_confirmation}
                                    onChange={(value) => updatePasswordField('password_confirmation', value)}
                                    type="password"
                                    value={passwordForm.password_confirmation}
                                />

                                {passwordError ? <Notice tone="danger">{passwordError}</Notice> : null}

                                <div className="notification-detail-modal__actions">
                                    <button
                                        className="landing-btn landing-btn--secondary"
                                        onClick={closePasswordModal}
                                        type="button"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="landing-btn landing-btn--primary"
                                        disabled={passwordSubmitting}
                                        type="submit"
                                    >
                                        {passwordSubmitting ? 'Updating password...' : 'Save new password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
