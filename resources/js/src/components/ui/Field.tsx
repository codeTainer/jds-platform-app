import { useState } from 'react';
import type { ReactNode } from 'react';

interface FieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    icon?: ReactNode;
}

export function Field({ label, value, onChange, type = 'text', placeholder, icon }: FieldProps) {
    const [revealed, setRevealed] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && revealed ? 'text' : type;

    return (
        <label className="app-field">
            <span className="app-field__label">{label}</span>
            <span className="app-field__input-wrap">
                <input
                    className={`app-field__control${icon ? ' app-field__control--with-icon' : ''}${isPasswordField ? ' app-field__control--password' : ''}`}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    type={inputType}
                    value={value}
                />
                {icon ? (
                    <span className="app-field__icon" aria-hidden="true">
                        {icon}
                    </span>
                ) : null}
                {isPasswordField ? (
                    <button
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                        className="app-field__toggle"
                        onClick={(event) => {
                            event.preventDefault();
                            setRevealed((current) => !current);
                        }}
                        type="button"
                    >
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
                    </button>
                ) : null}
            </span>
        </label>
    );
}
