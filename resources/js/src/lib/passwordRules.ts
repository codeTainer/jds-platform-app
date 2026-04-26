export interface PasswordRuleCheck {
    label: string;
    passed: boolean;
}

export interface PasswordFormValues {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export interface PasswordFormErrors {
    current_password?: string;
    password?: string;
    password_confirmation?: string;
}

export function getPasswordRuleChecks(
    currentPassword: string,
    nextPassword: string,
    confirmation: string,
    compareLabel: string,
): PasswordRuleCheck[] {
    return [
        {
            label: 'At least 8 characters',
            passed: nextPassword.length >= 8,
        },
        {
            label: 'At least 1 uppercase letter',
            passed: /[A-Z]/.test(nextPassword),
        },
        {
            label: 'At least 1 lowercase letter',
            passed: /[a-z]/.test(nextPassword),
        },
        {
            label: 'At least 1 number',
            passed: /\d/.test(nextPassword),
        },
        {
            label: 'At least 1 special character',
            passed: /[^A-Za-z0-9]/.test(nextPassword),
        },
        {
            label: compareLabel,
            passed: nextPassword.length > 0 && currentPassword.length > 0 && nextPassword !== currentPassword,
        },
        {
            label: 'Matches the confirmation password',
            passed: nextPassword.length > 0 && nextPassword === confirmation,
        },
    ];
}

export function validatePasswordForm(
    form: PasswordFormValues,
    compareSubjectLabel: string,
): PasswordFormErrors {
    const errors: PasswordFormErrors = {};

    if (!form.current_password.trim()) {
        errors.current_password = 'Current password is required.';
    }

    if (!form.password) {
        errors.password = 'New password is required.';
    } else {
        const rules = getPasswordRuleChecks(
            form.current_password,
            form.password,
            form.password_confirmation,
            `Different from your ${compareSubjectLabel}`,
        );

        const unmetNonConfirmationRule = rules
            .filter((rule) => rule.label !== 'Matches the confirmation password')
            .some((rule) => !rule.passed);

        if (unmetNonConfirmationRule) {
            errors.password = 'Please meet all password requirements below.';
        }
    }

    if (!form.password_confirmation) {
        errors.password_confirmation = 'Please confirm your new password.';
    } else if (form.password && form.password !== form.password_confirmation) {
        errors.password_confirmation = 'Confirmation password must match the new password.';
    }

    return errors;
}
