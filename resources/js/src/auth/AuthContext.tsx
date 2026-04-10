import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, applyToken, readToken } from "../lib/api";
import type { LoginResponse, User } from "../types";

interface LoginForm {
    email: string;
    password: string;
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
                applyToken(data.token);
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
