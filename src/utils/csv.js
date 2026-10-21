// Minimal, dependency-free CSV export.

function escapeCell(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {Array<object>} rows
 * @param {Array<{key:string,label:string,get?:(row)=>any}>} columns
 * @returns {string} CSV text
 */
export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.get ? c.get(row) : row[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

/** Trigger a browser download of CSV text. */
export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
