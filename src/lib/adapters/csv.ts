// CSV export for adapter data tables. RFC 4180 line endings, header row with
// units, full float precision so results are reproducible.

import { DataTable } from "./contract";

export function tableToCsv(table: DataTable): string {
  const header = table.columns.map((c) => (c.unit ? `${c.name} [${c.unit}]` : c.name)).map(csvField).join(",");
  const rows = Math.max(0, ...table.columns.map((c) => c.values.length));
  const lines = [header];
  for (let i = 0; i < rows; i++) {
    lines.push(table.columns.map((c) => formatNumber(c.values[i])).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

function formatNumber(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "";
  return String(v);
}

function csvField(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
