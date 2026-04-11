import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, applyToken, readToken } from "../lib/api";
import type { LoginResponse, User } from "../types";

interface LoginForm {
    email: string;
    password: string;
    remember?: boolean;
}

interface AuthContextValue {
    user: User | null;
    booting: boolean;
    signedIn: boolean;
    isExco: boolean;
    hasMemberProfile: boolean;
    mustChangePassword: boolean;
    login: (form: LoginForm) => Promise<void>;
    changePassword: (form: ChangePasswordForm) => Promise<void>;
    logout: () => Promise<void>;
}

interface ChangePasswordForm {
    current_password: string;
    password: string;
    password_confirmation: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EXCO_ROLES = new Set([
    "chairperson",
    "secretary",
    "treasurer",
    "support",
]);

const idleTimeoutMinutes = Math.max(
    Number(import.meta.env.VITE_JDS_IDLE_TIMEOUT_MINUTES ?? 5),
    1,
);
const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
const idleLogoutNoticeKey = "jds_idle_logout_notice";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        const token = readToken();

        if (!token) {
            setBooting(false);
            return;
        }

        api.get<{ user: User }>("/api/auth/me")
            .then(({ data }) => setUser(data.user))
            .catch(() => applyToken(null))
            .finally(() => setBooting(false));
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        let timeoutId = 0;

        const performIdleLogout = async () => {
            window.sessionStorage.setItem(
                idleLogoutNoticeKey,
                `You were signed out after ${idleTimeoutMinutes} minutes of inactivity.`,
            );

            try {
                await api.post("/api/auth/logout");
            } catch {
                // Ignore logout cleanup errors during idle expiry.
            } finally {
                applyToken(null);
                setUser(null);
            }
        };

        const resetIdleTimer = () => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                void performIdleLogout();
            }, idleTimeoutMs);
        };

        const activityEvents: Array<keyof WindowEventMap> = [
            "click",
            "keydown",
            "mousemove",
            "scroll",
            "touchstart",
        ];

        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, resetIdleTimer, { passive: true });
        });

        resetIdleTimer();

        return () => {
            window.clearTimeout(timeoutId);

            activityEvents.forEach((eventName) => {
                window.removeEventListener(eventName, resetIdleTimer);
            });
        };
    }, [user]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            booting,
            signedIn: Boolean(user),
            isExco: Boolean(user && EXCO_ROLES.has(user.role)),
            hasMemberProfile: Boolean(user?.member),
            mustChangePassword: Boolean(user?.must_change_password),
            async login(form) {
                const { data } = await api.post<LoginResponse>(
                    "/api/auth/login",
                    form,
                );
                applyToken(data.token, form.remember ?? true);
                setUser(data.user);
            },
            async changePassword(form) {
                const { data } = await api.post<{ message: string; user: User }>(
                    "/api/auth/change-password",
                    form,
                );
                setUser(data.user);
            },
            async logout() {
                try {
                    await api.post("/api/auth/logout");
                } catch {
                    // Ignore logout cleanup errors.
                } finally {
                    applyToken(null);
                    setUser(null);
                }
            },
        }),
        [booting, user],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }

    return context;
}
