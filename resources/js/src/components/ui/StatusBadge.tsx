import type { ReactNode } from 'react';

export function StatusBadge({ active, children }: { active: boolean; children: ReactNode }) {
    return (
        <span className={active ? 'status-badge status-badge-active' : 'status-badge status-badge-muted'}>
            {children}
        </span>
    );
}
