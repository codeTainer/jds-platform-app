import axios from 'axios';

export const tokenStorageKey = 'jds_auth_token';

export const api = axios.create({
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

export function applyToken(token: string | null): void {
    if (token) {
        window.localStorage.setItem(tokenStorageKey, token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        window.localStorage.removeItem(tokenStorageKey);
        delete api.defaults.headers.common.Authorization;
    }
}

export function readToken(): string | null {
    return window.localStorage.getItem(tokenStorageKey);
}

applyToken(readToken());
