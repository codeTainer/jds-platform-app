import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAppearance } from '../../appearance/AppearanceProvider';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { useToast } from '../../feedback/ToastProvider';

export function AppearanceSection() {
    const { branding, updateBranding } = useAppearance();
    const { showToast } = useToast();
    const [form, setForm] = useState(branding);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setForm(branding);
        setLogoFile(null);
        setRemoveLogo(false);
    }, [branding]);

    const previewLogoUrl = useMemo(() => {
        if (removeLogo) {
            return null;
        }

        if (logoFile) {
            return URL.createObjectURL(logoFile);
        }

        return form.logo_url ?? null;
    }, [form.logo_url, logoFile, removeLogo]);

    useEffect(() => () => {
        if (logoFile && previewLogoUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewLogoUrl);
        }
    }, [logoFile, previewLogoUrl]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');

        const payload = new FormData();
        payload.append('app_name', form.app_name.trim());
        payload.append('app_short_name', form.app_short_name.trim().toUpperCase());
        payload.append('app_motto', form.app_motto.trim());
        payload.append('primary_color', form.primary_color.toUpperCase());
        payload.append('secondary_color', form.secondary_color.toUpperCase());

        if (logoFile) {
            payload.append('logo', logoFile);
        }

        if (removeLogo && !logoFile) {
            payload.append('remove_logo', '1');
        }

        try {
            await updateBranding(payload);
            showToast('Appearance updated successfully.', 'success');
        } catch (requestError: any) {
            const message = requestError.response?.data?.message ?? 'Unable to update appearance settings right now.';
            setError(message);
            showToast(message, 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <PageHeader
                description="Control the visible brand identity from one place. Saved changes update the shared logo, app name, motto, and colors immediately without a hard refresh."
                eyebrow="Appearance"
                title="Manage the platform branding."
            />

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <Panel eyebrow="Brand settings" title="Update the app identity">
                    <form className="appearance-form" onSubmit={handleSubmit}>
                        <div className="appearance-form__grid">
                            <label className="appearance-field">
                                <span className="appearance-field__label">App name</span>
                                <input
                                    className="app-field__control"
                                    maxLength={120}
                                    onChange={(event) => setForm((current) => ({ ...current, app_name: event.target.value }))}
                                    placeholder="JDS Platform"
                                    value={form.app_name}
                                />
                            </label>

                            <label className="appearance-field">
                                <span className="appearance-field__label">Short name</span>
                                <input
                                    className="app-field__control"
                                    maxLength={12}
                                    onChange={(event) => setForm((current) => ({ ...current, app_short_name: event.target.value.toUpperCase() }))}
                                    placeholder="JDS"
                                    value={form.app_short_name}
                                />
                            </label>

                            <label className="appearance-field">
                                <span className="appearance-field__label">Motto</span>
                                <input
                                    className="app-field__control"
                                    maxLength={180}
                                    onChange={(event) => setForm((current) => ({ ...current, app_motto: event.target.value }))}
                                    placeholder="Savings | Loans | Accountability"
                                    value={form.app_motto}
                                />
                            </label>

                            <label className="appearance-field">
                                <span className="appearance-field__label">App logo</span>
                                <input
                                    accept=".jpg,.jpeg,.png,.webp,.svg"
                                    className="app-field__control"
                                    onChange={(event) => {
                                        const nextFile = event.target.files?.[0] ?? null;
                                        setLogoFile(nextFile);
                                        if (nextFile) {
                                            setRemoveLogo(false);
                                        }
                                    }}
                                    type="file"
                                />
                            </label>

                            <label className="appearance-field">
                                <span className="appearance-field__label">Primary color</span>
                                <div className="appearance-color-control">
                                    <input
                                        className="appearance-color-control__picker"
                                        onChange={(event) => setForm((current) => ({ ...current, primary_color: event.target.value.toUpperCase() }))}
                                        type="color"
                                        value={form.primary_color}
                                    />
                                    <input
                                        className="app-field__control"
                                        maxLength={7}
                                        onChange={(event) => setForm((current) => ({ ...current, primary_color: event.target.value.toUpperCase() }))}
                                        placeholder="#0B4C89"
                                        value={form.primary_color}
                                    />
                                </div>
                            </label>

                            <label className="appearance-field">
                                <span className="appearance-field__label">Secondary color</span>
                                <div className="appearance-color-control">
                                    <input
                                        className="appearance-color-control__picker"
                                        onChange={(event) => setForm((current) => ({ ...current, secondary_color: event.target.value.toUpperCase() }))}
                                        type="color"
                                        value={form.secondary_color}
                                    />
                                    <input
                                        className="app-field__control"
                                        maxLength={7}
                                        onChange={(event) => setForm((current) => ({ ...current, secondary_color: event.target.value.toUpperCase() }))}
                                        placeholder="#A67C24"
                                        value={form.secondary_color}
                                    />
                                </div>
                            </label>
                        </div>

                        <label className="appearance-toggle">
                            <input
                                checked={removeLogo}
                                onChange={(event) => {
                                    setRemoveLogo(event.target.checked);
                                    if (event.target.checked) {
                                        setLogoFile(null);
                                    }
                                }}
                                type="checkbox"
                            />
                            <span>Remove current logo and use the short name badge instead</span>
                        </label>

                        <div className="appearance-form__actions">
                            <button className="landing-btn landing-btn--primary" disabled={saving} type="submit">
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </Panel>

                <Panel eyebrow="Preview" title="Live brand preview">
                    <div className="appearance-preview">
                        <div className="appearance-preview__hero">
                            <div className="appearance-preview__brand">
                                {previewLogoUrl ? (
                                    <div className="appearance-preview__logo appearance-preview__logo--image">
                                        <img alt={`${form.app_name} logo preview`} src={previewLogoUrl} />
                                    </div>
                                ) : (
                                    <div className="appearance-preview__logo">
                                        {form.app_short_name}
                                    </div>
                                )}
                                <div>
                                    <p>{form.app_name}</p>
                                    <strong>{form.app_motto}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="appearance-preview__cards">
                            <div className="appearance-preview__card">
                                <span>Primary action</span>
                                <button className="landing-btn landing-btn--primary" type="button">Primary button</button>
                            </div>
                            <div className="appearance-preview__card">
                                <span>Secondary accent</span>
                                <div className="appearance-preview__swatch" style={{ background: form.secondary_color }} />
                            </div>
                        </div>
                        <Notice>
                            After you save, the shared brand components update automatically. You do not need to hard refresh the page.
                        </Notice>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
