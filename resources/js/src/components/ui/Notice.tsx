import type { ReactNode } from 'react';

interface NoticeProps {
    tone?: 'success' | 'danger' | 'neutral';
    children: ReactNode;
}

export function Notice({ tone = 'neutral', children }: NoticeProps) {
    const classes = tone === 'success'
        ? 'notice notice-success'
        : tone === 'danger'
          ? 'notice notice-danger'
          : 'notice notice-neutral';

    return <div className={classes}>{children}</div>;
}
