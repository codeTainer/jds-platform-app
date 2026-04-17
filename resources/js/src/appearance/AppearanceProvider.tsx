import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import type { BrandingSettings } from '../types';

interface AppearanceContextValue {
    branding: BrandingSettings;
    loading: boolean;
    refreshBranding: () => Promise<void>;
    updateBranding: (payload: FormData | BrandingSettings) => Promise<void>;
}

const defaultBranding: BrandingSettings = {
    app_name: 'JDS Platform',
    app_short_name: 'JDS',
    app_motto: 'Savings | Loans | Accountability',
    primary_color: '#0B4C89',
    secondary_color: '#A67C24',
    logo_url: null,
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function clamp(value: number) {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string) {
    const normalized = hex.replace('#', '');

    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}

function rgbToHex(r: number, g: number, b: number) {
    return `#${[r, g, b].map((value) => clamp(value).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function shiftColor(hex: string, amount: number) {
    const { r, g, b } = hexToRgb(hex);

    return rgbToHex(r + amount, g + amount, b + amount);
}

function applyBranding(branding: BrandingSettings) {
    const root = document.documentElement;
    root.style.setProperty('--forest', branding.primary_color);
    root.style.setProperty('--forest-bright', shiftColor(branding.primary_color, 24));
    root.style.setProperty('--forest-deep', shiftColor(branding.primary_color, -32));
    root.style.setProperty('--accent', branding.secondary_color);
    root.style.setProperty('--accent-deep', shiftColor(branding.secondary_color, -28));
    document.title = branding.app_name;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
    const [loading, setLoading] = useState(true);

    async function refreshBranding() {
        setLoading(true);

        try {
            const { data } = await api.get<{ branding: BrandingSettings }>('/api/public/appearance');
            const nextBranding = data.branding ?? defaultBranding;
            setBranding(nextBranding);
            applyBranding(nextBranding);
        } finally {
            setLoading(false);
        }
    }

    async function updateBranding(payload: FormData | BrandingSettings) {
        const isFormData = payload instanceof FormData;
        const { data } = await api.post<{ branding: BrandingSettings }>(
            '/api/exco/appearance',
            payload,
            isFormData
                ? {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
                : undefined,
        );
        const applied = data.branding ?? defaultBranding;
        setBranding(applied);
        applyBranding(applied);
    }

    useEffect(() => {
        applyBranding(defaultBranding);
        void refreshBranding();
    }, []);

    const value = useMemo<AppearanceContextValue>(() => ({
        branding,
        loading,
        refreshBranding,
        updateBranding,
    }), [branding, loading]);

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);

    if (!context) {
        throw new Error('useAppearance must be used inside AppearanceProvider.');
    }

    return context;
}
