import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Field } from '../components/ui/Field';
import { Notice } from '../components/ui/Notice';
import { Panel } from '../components/ui/Panel';
import { useToast } from '../feedback/ToastProvider';
import { getPasswordRuleChecks, validatePasswordForm, type PasswordFormErrors } from '../lib/passwordRules';

export function ForcePasswordChangePage() {
    const { changePassword, isExco, mustChangePassword } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<PasswordFormErrors>({});
    const passwordChecks = useMemo(() => {
        return getPasswordRuleChecks(
            form.current_password,
            form.password,
            form.password_confirmation,
            mustChangePassword ? 'Different from your temporary password' : 'Different from your current password',
        );
    }, [form.current_password, form.password, form.password_confirmation, mustChangePassword]);
    const canSubmit = Object.keys(validatePasswordForm(
        form,
        mustChangePassword ? 'temporary password' : 'current password',
    )).length === 0 && passwordChecks.every((check) => check.passed);

    function updateField(field: keyof typeof form, value: string) {
        const nextForm = {
            ...form,
            [field]: value,
        };

        setForm(nextForm);

        if (Object.keys(fieldErrors).length > 0) {
            setFieldErrors(validatePasswordForm(
                nextForm,
                mustChangePassword ? 'temporary password' : 'current password',
            ));
        }

        if (error) {
            setError('');
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationErrors = validatePasswordForm(
            form,
            mustChangePassword ? 'temporary password' : 'current password',
        );

        setFieldErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setError('Please correct the highlighted fields and try again.');
            return;
        }

        if (!canSubmit) {
            setError('Please satisfy all password requirements before continuing.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await changePassword(form);
            showToast('Password updated successfully.', 'success');
            navigate(isExco ? '/dashboard/exco' : '/dashboard/member', { replace: true });
        } catch (requestError: any) {
            const message =
                requestError.response?.data?.message ??
                'Unable to change your password right now.';
            setError(message);
            showToast(message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-gate-shell">
            <div className="auth-gate-card">
                <Panel
                    eyebrow="Security"
                    title={mustChangePassword ? 'Change your temporary password' : 'Change your password'}
                >
                    <p className="auth-gate-copy">
                        {mustChangePassword
                            ? 'Your account was created with a temporary password. Set a new password before you continue into the platform.'
                            : 'Update your current password to keep your account secure.'}
                    </p>

                    <form className="auth-gate-form" onSubmit={handleSubmit}>
                        <Field
                            label="Current password"
                            error={fieldErrors.current_password}
                            onChange={(value) => updateField('current_password', value)}
                            type="password"
                            value={form.current_password}
                        />
                        <Field
                            label="New password"
                            error={fieldErrors.password}
                            onChange={(value) => updateField('password', value)}
                            type="password"
                            value={form.password}
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
                            error={fieldErrors.password_confirmation}
                            onChange={(value) => updateField('password_confirmation', value)}
                            type="password"
                            value={form.password_confirmation}
                        />

                        {error ? <Notice tone="danger">{error}</Notice> : null}

                        <button
                            className="landing-btn landing-btn--primary landing-btn--block"
                            disabled={submitting}
                            type="submit"
                        >
                            {submitting ? 'Updating password...' : 'Save new password'}
                        </button>
                    </form>
                </Panel>
            </div>
        </div>
    );
}
