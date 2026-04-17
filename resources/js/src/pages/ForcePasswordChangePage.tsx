import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Field } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { Panel } from "../components/ui/Panel";
import { useToast } from "../feedback/ToastProvider";

export function ForcePasswordChangePage() {
    const { changePassword, isExco, mustChangePassword } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            await changePassword(form);
            showToast("Password updated successfully.", "success");
            navigate(isExco ? "/dashboard/exco" : "/dashboard/member", { replace: true });
        } catch (requestError: any) {
            const message =
                requestError.response?.data?.message ??
                "Unable to change your password right now.";
            setError(message);
            showToast(message, "error");
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
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    current_password: value,
                                }))
                            }
                            type="password"
                            value={form.current_password}
                        />
                        <Field
                            label="New password"
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    password: value,
                                }))
                            }
                            type="password"
                            value={form.password}
                        />
                        <Field
                            label="Confirm new password"
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    password_confirmation: value,
                                }))
                            }
                            type="password"
                            value={form.password_confirmation}
                        />

                        {error ? <Notice tone="danger">{error}</Notice> : null}

                        <button
                            className="landing-btn landing-btn--primary landing-btn--block"
                            disabled={submitting}
                            type="submit"
                        >
                            {submitting ? "Updating password..." : "Save new password"}
                        </button>
                    </form>
                </Panel>
            </div>
        </div>
    );
}
