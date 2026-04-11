import axios from 'axios';

export const tokenStorageKey = 'jds_auth_token';
export const tokenStorageModeKey = 'jds_auth_token_storage';

export const api = axios.create({
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

function clearStoredTokens(): void {
    window.localStorage.removeItem(tokenStorageKey);
    window.sessionStorage.removeItem(tokenStorageKey);
    window.localStorage.removeItem(tokenStorageModeKey);
}

export function applyToken(token: string | null, persist = true): void {
    if (token) {
        clearStoredTokens();

        if (persist) {
            window.localStorage.setItem(tokenStorageKey, token);
            window.localStorage.setItem(tokenStorageModeKey, 'local');
        } else {
            window.sessionStorage.setItem(tokenStorageKey, token);
            window.localStorage.setItem(tokenStorageModeKey, 'session');
        }

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        clearStoredTokens();
        delete api.defaults.headers.common.Authorization;
    }
}

export function readToken(): string | null {
    return window.localStorage.getItem(tokenStorageKey)
        ?? window.sessionStorage.getItem(tokenStorageKey);
}

applyToken(readToken());
