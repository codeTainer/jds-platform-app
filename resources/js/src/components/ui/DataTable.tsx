import { isValidElement, useMemo, useState, type ReactNode } from 'react';
import { deriveExportTitle, downloadTableExport, type TableExportFormat } from '../../lib/download';

export interface DataTableColumn<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    csvValue?: (row: T) => string | number | null | undefined;
    className?: string;
    exportable?: boolean;
}

interface DataTableProps<T> {
    columns: Array<DataTableColumn<T>>;
    rows: T[];
    rowKey: (row: T) => string | number;
    emptyMessage: string;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    exportLabel?: string;
    onExport?: (format: TableExportFormat) => void | Promise<void>;
    exportFilename?: string;
    filterPlaceholder?: string;
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    toolbarExtras?: ReactNode;
}

function extractNodeText(node: ReactNode): string {
    if (node == null || typeof node === 'boolean') {
        return '';
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map((child) => extractNodeText(child)).join(' ').trim();
    }

    if (isValidElement(node)) {
        return extractNodeText(node.props.children);
    }

    return '';
}

function SearchIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4.25 4.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
    );
}

function CsvIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M7 3.75h7l4.25 4.25v12.25H7z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path d="M14 3.75V8h4.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M9 14h6M9 17h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
    );
}

function PdfIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M7 3.75h7l4.25 4.25v12.25H7z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path d="M14 3.75V8h4.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M9 15.25h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            <path d="M9 18h3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
    );
}

function XlsxIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M7 3.75h7l4.25 4.25v12.25H7z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
            <path d="M14 3.75V8h4.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M9 14.5l2 2.5 2-2.5M9 18l2-2 2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function PrintIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M7.5 8V4.75h9V8M7 17.5h10v2.75H7zm-1.5-9h13a2 2 0 0 1 2 2V16h-3.5v-2.25h-10V16H3.5v-5.5a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    emptyMessage,
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    exportLabel = 'Download CSV',
    onExport,
    exportFilename = 'table-export.csv',
    filterPlaceholder = 'Filter records',
    filterValue,
    onFilterChange,
    toolbarExtras,
}: DataTableProps<T>) {
    const [internalFilter, setInternalFilter] = useState('');
    const activeFilter = filterValue ?? internalFilter;
    const exportableColumns = useMemo(
        () => columns.filter((column) => column.exportable !== false),
        [columns],
    );
    const exportTitle = useMemo(
        () => exportLabel !== 'Download CSV' ? exportLabel : deriveExportTitle(exportFilename),
        [exportFilename, exportLabel],
    );

    const getCellText = (row: T, column: DataTableColumn<T>) => {
        if (column.csvValue) {
            return String(column.csvValue(row) ?? '');
        }

        return extractNodeText(column.render(row));
    };

    const filteredRows = useMemo(() => {
        const query = activeFilter.trim().toLowerCase();

        if (!query) {
            return rows;
        }

        return rows.filter((row) =>
            columns.some((column) => getCellText(row, column).toLowerCase().includes(query)),
        );
    }, [activeFilter, columns, rows]);

    const shownCount = filteredRows.length;

    const handleFilterChange = (value: string) => {
        if (onFilterChange) {
            onFilterChange(value);
            return;
        }

        setInternalFilter(value);
    };

    const handleTableExport = async (format: TableExportFormat) => {
        if (onExport) {
            await onExport(format);
            return;
        }

        downloadTableExport(
            format,
            exportFilename,
            exportableColumns.map((column) => column.header),
            filteredRows.map((row) => exportableColumns.map((column) => getCellText(row, column))),
            { title: exportTitle },
        );
    };

    const escapeHtml = (value: string) =>
        value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

    const openPrintableView = (mode: 'print' | 'pdf') => {
        const popup = window.open('', '_blank', 'width=1100,height=800');

        if (!popup) {
            return;
        }

        const headings = exportableColumns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('');
        const body = filteredRows.length
            ? filteredRows
                  .map(
                      (row) =>
                          `<tr>${exportableColumns
                              .map((column) => `<td>${escapeHtml(getCellText(row, column))}</td>`)
                              .join('')}</tr>`,
                  )
                  .join('')
            : `<tr><td colspan="${exportableColumns.length}">${escapeHtml(emptyMessage)}</td></tr>`;

        popup.document.open();
        popup.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(exportTitle)}</title>
<style>
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Arial, sans-serif; padding: 24px; color: #17324a; background: #ffffff; }
.sheet { width: 100%; }
h1 { margin: 0 0 8px; font-size: 24px; font-weight: 700; }
p { margin: 0 0 20px; color: #53687c; font-size: 14px; }
table { width: 100%; border-collapse: collapse; table-layout: auto; }
th { background: #0a4b86; color: #fff; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
th, td { border: 1px solid #d7e3ef; padding: 10px 12px; text-align: left; vertical-align: top; }
tbody tr:nth-child(even) td { background: #f8fbff; }
@page { size: auto; margin: 14mm; }
</style>
</head>
<body>
<div class="sheet">
<h1>${escapeHtml(exportTitle)}</h1>
<p>${mode === 'pdf' ? 'Choose "Save as PDF" in the print dialog to download this table.' : 'Use your printer dialog to print this table.'}</p>
<table>
<thead><tr>${headings}</tr></thead>
<tbody>${body}</tbody>
</table>
</div>
</body>
</html>`);
        popup.document.close();

        const triggerPrint = () => {
            popup.focus();
            popup.print();
        };

        popup.onload = () => {
            popup.setTimeout(triggerPrint, 250);
        };
    };

    return (
        <div>
            <div className="app-table-toolbar">
                <div className="app-table-toolbar__group app-table-toolbar__group--primary">
                    <div className="text-[0.98rem] text-[var(--muted)]">
                        {totalItems} record{totalItems === 1 ? '' : 's'}{activeFilter ? ` | ${shownCount} shown` : ''}
                    </div>
                    <label className="app-search-field app-search-field--table">
                        <span className="app-search-field__icon">
                            <SearchIcon />
                        </span>
                        <input
                            className="app-search-field__input"
                            onChange={(event) => handleFilterChange(event.target.value)}
                            placeholder={filterPlaceholder}
                            value={activeFilter}
                        />
                    </label>
                    {toolbarExtras}
                </div>
                <div className="app-table-toolbar__group app-table-toolbar__group--exports">
                    <button className="app-toolbar-button" onClick={() => void handleTableExport('csv')} title="Export CSV" type="button">
                        <CsvIcon />
                        <span>CSV</span>
                    </button>
                    <button className="app-toolbar-button" onClick={() => void handleTableExport('xlsx')} title="Export Excel" type="button">
                        <XlsxIcon />
                        <span>XLSX</span>
                    </button>
                    <button className="app-toolbar-button" onClick={() => openPrintableView('pdf')} title="Export PDF" type="button">
                        <PdfIcon />
                        <span>PDF</span>
                    </button>
                    <button className="app-toolbar-button" onClick={() => openPrintableView('print')} title="Print" type="button">
                        <PrintIcon />
                        <span>Print</span>
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-[rgba(23,55,45,0.1)]">
                <div className="overflow-x-auto">
                    <table className="app-table min-w-full border-collapse bg-white">
                        <thead className="app-table__head">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`app-table__header-cell px-4 py-3 text-left text-[0.84rem] font-semibold uppercase tracking-[0.18em] ${column.className ?? ''}`.trim()}
                                    >
                                        {column.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length ? (
                                filteredRows.map((row) => (
                                    <tr key={rowKey(row)} className="border-t border-[rgba(23,55,45,0.08)]">
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`px-4 py-3.5 text-[0.98rem] text-[var(--ink)] ${column.className ?? ''}`.trim()}
                                            >
                                                {column.render(row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-8 text-center text-[0.98rem] text-[var(--muted)]" colSpan={columns.length}>
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="app-table-pagination">
                <div className="app-table-pagination__meta">
                    Page {currentPage} of {totalPages || 1}
                </div>
                <div className="app-table-pagination__actions">
                    <button
                        className="app-table-pagination__button"
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(currentPage - 1)}
                        type="button"
                    >
                        Previous
                    </button>
                    <button
                        className="app-table-pagination__button"
                        disabled={currentPage >= totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                        type="button"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
