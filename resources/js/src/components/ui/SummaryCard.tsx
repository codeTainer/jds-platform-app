export function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="summary-card">
            <div className="summary-card__label">{label}</div>
            <div className="summary-card__value">{value}</div>
        </div>
    );
}
