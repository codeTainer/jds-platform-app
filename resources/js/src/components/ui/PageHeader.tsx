interface PageHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
    return (
        <header className="app-page-header">
            <p className="app-page-header__eyebrow">{eyebrow}</p>
            <h1 className="app-page-header__title">{title}</h1>
            <p className="app-page-header__description">{description}</p>
        </header>
    );
}
