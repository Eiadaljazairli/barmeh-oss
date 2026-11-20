export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function escapeCell(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(',');
  const lines = rows.map((r) => columns.map((c) => escapeCell(c.accessor(r))).join(','));
  const csv = '\uFEFF' + [headerLine, ...lines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const ts = new Date().toISOString().slice(0, 10);
  link.download = `${filename}_${ts}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
