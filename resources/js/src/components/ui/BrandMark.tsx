import { useAppearance } from '../../appearance/AppearanceProvider';

export function BrandMark() {
    const { branding } = useAppearance();

    return (
        <div className="app-brand">
            {branding.logo_url ? (
                <div className="app-brand__crest app-brand__crest--image">
                    <img
                        alt={`${branding.app_name} logo`}
                        className="app-brand__logo-image"
                        src={branding.logo_url}
                    />
                </div>
            ) : (
                <div className="app-brand__crest">
                    {branding.app_short_name}
                </div>
            )}
            <div className="app-brand__text">
                <div className="app-brand__title">{branding.app_name}</div>
                <div className="app-brand__subtitle">{branding.app_motto}</div>
            </div>
        </div>
    );
}
