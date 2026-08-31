/**
 * High-performance CSV export utility with UTF-8 BOM for Microsoft Excel & Google Sheets
 */
export function exportToCsv(
  filenamePrefix: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
) {
  if (!rows || rows.length === 0) return;

  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const formattedHeaders = headers.map((h) => (h.includes(",") ? `"${h}"` : h));
  const formattedRows = rows.map((row) => row.map(escapeCell).join(","));

  const csvString = [formattedHeaders.join(","), ...formattedRows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
