export interface SharePurchaseWindowInfo {
    shareMonthLabel: string;
    opensAt: Date;
    closesAt: Date;
    isInCycle: boolean;
    isOpen: boolean;
}

function parseShareMonthValue(value: string): { year: number; month: number } | null {
    if (!value) {
        return null;
    }

    const parts = value.trim().split('-');

    if (parts.length < 2) {
        return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);

    if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
        return null;
    }

    return { year, month };
}

export function resolveSharePurchaseWindow(
    value: string,
    cycleStartsOn?: string | null,
    cycleEndsOn?: string | null,
    referenceDate = new Date(),
): SharePurchaseWindowInfo | null {
    const parsed = parseShareMonthValue(value);

    if (!parsed) {
        return null;
    }

    const shareMonthStart = new Date(parsed.year, parsed.month - 1, 1);
    const cycleStart = cycleStartsOn ? new Date(cycleStartsOn) : null;
    const cycleEnd = cycleEndsOn ? new Date(cycleEndsOn) : null;
    const cycleStartMonth = cycleStart ? new Date(cycleStart.getFullYear(), cycleStart.getMonth(), 1) : null;
    const cycleEndMonth = cycleEnd ? new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), 1) : null;
    const isFirstCycleMonth = Boolean(cycleStartMonth)
        && shareMonthStart.getFullYear() === cycleStartMonth!.getFullYear()
        && shareMonthStart.getMonth() === cycleStartMonth!.getMonth();
    const opensAt = isFirstCycleMonth
        ? new Date(parsed.year, parsed.month - 1, 25, 0, 0, 0, 0)
        : new Date(parsed.year, parsed.month - 2, 25, 0, 0, 0, 0);
    const closesAt = isFirstCycleMonth
        ? new Date(parsed.year, parsed.month, 5, 23, 59, 59, 999)
        : new Date(parsed.year, parsed.month - 1, 5, 23, 59, 59, 999);
    const shareMonthLabel = new Intl.DateTimeFormat('en-NG', {
        month: 'long',
        year: 'numeric',
    }).format(shareMonthStart);
    const isInCycle = (!cycleStartMonth || shareMonthStart >= cycleStartMonth)
        && (!cycleEndMonth || shareMonthStart <= cycleEndMonth);

    return {
        shareMonthLabel,
        opensAt,
        closesAt,
        isInCycle,
        isOpen: isInCycle && referenceDate >= opensAt && referenceDate <= closesAt,
    };
}

export function formatShareWindowDate(value: Date) {
    return new Intl.DateTimeFormat('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(value);
}

export function toShareMonthApiDate(value: string) {
    const parsed = parseShareMonthValue(value);

    if (!parsed) {
        return value;
    }

    return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-01`;
}
