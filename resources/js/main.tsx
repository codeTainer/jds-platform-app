import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './src/auth/AuthContext';
import { AppRouter } from './src/app/AppRouter';
import { ToastProvider } from './src/feedback/ToastProvider';

const rootElement = document.getElementById('app');

if (rootElement) {
    createRoot(rootElement).render(
        <React.StrictMode>
            <BrowserRouter>
                <AuthProvider>
                    <ToastProvider>
                        <AppRouter />
                    </ToastProvider>
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>,
    );
}
