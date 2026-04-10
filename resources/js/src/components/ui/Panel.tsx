import type { ReactNode } from 'react';

interface PanelProps {
    title?: string;
    eyebrow?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function Panel({ title, eyebrow, action, children, className = '' }: PanelProps) {
    return (
        <section className={`app-panel ${className}`.trim()}>
            {(title || eyebrow || action) ? (
                <div className="app-panel__header">
                    <div>
                        {eyebrow ? <p className="app-panel__eyebrow">{eyebrow}</p> : null}
                        {title ? <h2 className="app-panel__title">{title}</h2> : null}
                    </div>
                    {action ? <div>{action}</div> : null}
                </div>
            ) : null}
            {children}
        </section>
    );
}
