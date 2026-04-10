import * as XLSX from 'xlsx';

function titleCase(segment: string) {
    return segment
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function deriveExportTitle(filename: string) {
    const basename = filename.replace(/\.[^.]+$/, '');
    return titleCase(basename.replace(/[_-]+/g, ' '));
}

interface DownloadCsvOptions {
    title?: string;
}

export type TableExportFormat = 'csv' | 'xlsx';

function normalizeFilename(filename: string, extension: string) {
    return filename.replace(/\.[^.]+$/, '') + extension;
}

function buildExportRows(
    title: string,
    headers: string[],
    rows: Array<Array<string | number | null | undefined>>,
) {
    return [
        [title],
        [],
        headers,
        ...rows.map((row) => row.map((value) => String(value ?? ''))),
    ];
}

export function downloadCsv(
    filename: string,
    headers: string[],
    rows: Array<Array<string | number | null | undefined>>,
    options: DownloadCsvOptions = {},
) {
    const title = options.title ?? deriveExportTitle(filename);

    const escapeValue = (value: string | number | null | undefined) => {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    };

    const titleRow = [title, ...Array(Math.max(headers.length - 1, 0)).fill('')];
    const csv = [
        titleRow.map(escapeValue).join(','),
        '',
        headers.map(escapeValue).join(','),
        ...rows.map((row) => row.map(escapeValue).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export function downloadXlsx(
    filename: string,
    headers: string[],
    rows: Array<Array<string | number | null | undefined>>,
    options: DownloadCsvOptions = {},
) {
    const title = options.title ?? deriveExportTitle(filename);
    const worksheetData = buildExportRows(title, headers, rows);
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const lastColumnIndex = Math.max(headers.length - 1, 0);

    worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } },
    ];

    worksheet['!cols'] = headers.map((header, index) => {
        const longestValue = rows.reduce((max, row) => {
            const text = String(row[index] ?? '');
            return Math.max(max, text.length);
        }, header.length);

        return { wch: Math.min(Math.max(longestValue + 4, 16), 40) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    XLSX.writeFile(workbook, normalizeFilename(filename, '.xlsx'));
}

export function downloadTableExport(
    format: TableExportFormat,
    filename: string,
    headers: string[],
    rows: Array<Array<string | number | null | undefined>>,
    options: DownloadCsvOptions = {},
) {
    if (format === 'xlsx') {
        downloadXlsx(filename, headers, rows, options);
        return;
    }

    downloadCsv(filename, headers, rows, options);
}
