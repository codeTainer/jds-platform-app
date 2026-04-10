interface CheckTileProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function CheckTile({ label, checked, onChange }: CheckTileProps) {
    return (
        <label className="app-check-tile">
            <span className="app-check-tile__label">{label}</span>
            <input checked={checked} className="app-check-tile__input" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
        </label>
    );
}
