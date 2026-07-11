// Parsers for ngspice batch output. Fixture-tested against captured real
// ngspice output so machines without ngspice can still verify behaviour.

import { DataTable, Diagnostic } from "../contract";

/** Extract "ngspice-XX" style version from `ngspice --version` output. */
export function parseNgspiceVersion(output: string): string | null {
  const m = output.match(/ngspice[- ]?(\d+(?:\.\d+)*)/i);
  return m ? m[1] : null;
}

/**
 * Parse a `wrdata` ASCII data file. With `set wr_vecnames` the first line
 * holds column names; with `set wr_singlescale` the first column is the
 * shared scale (time, frequency or sweep value).
 */
export function parseWrData(text: string, title: string): DataTable {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new Error("ngspice produced an empty data file.");
  }

  let names: string[] | null = null;
  let dataStart = 0;
  const firstTokens = lines[0].split(/\s+/);
  if (firstTokens.some((t) => Number.isNaN(Number(t)))) {
    names = firstTokens;
    dataStart = 1;
  }

  const rows: number[][] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const tokens = lines[i].split(/\s+/);
    const row = tokens.map(Number);
    if (row.some((v) => Number.isNaN(v))) {
      throw new Error(`Malformed ngspice data on line ${i + 1}: "${lines[i]}"`);
    }
    rows.push(row);
  }
  if (rows.length === 0) {
    throw new Error("ngspice data file contains a header but no data rows.");
  }
  const width = rows[0].length;
  if (!rows.every((r) => r.length === width)) {
    throw new Error("ngspice data file has inconsistent column counts.");
  }
  if (names && names.length !== width) {
    // Header/vector mismatch: fall back to generated names rather than failing.
    names = null;
  }

  const columns = Array.from({ length: width }, (_, c) => ({
    name: names ? names[c] : c === 0 ? "scale" : `col${c}`,
    values: rows.map((r) => r[c])
  }));
  return { title, columns };
}

/**
 * Parse `print all` output of an operating-point analysis into node-voltage /
 * branch-current scalars.
 */
export function parseOpOutput(stdout: string): Record<string, number> {
  const scalars: Record<string, number> = {};
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.trim().match(/^([a-zA-Z0-9_.#()[\]+-]+)\s*=\s*([-+0-9.eE]+)\s*$/);
    if (!m) continue;
    const value = Number(m[2]);
    if (!Number.isNaN(value)) scalars[m[1]] = value;
  }
  return scalars;
}

/** Convert ngspice stderr/stdout error lines into structured diagnostics. */
export function extractDiagnostics(stdout: string, stderr: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const scan = (text: string) => {
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (line.length === 0) continue;
      if (/^error:|fatal/i.test(line)) {
        diagnostics.push({ severity: "error", message: line, source: "ngspice" });
      } else if (/^warning:/i.test(line)) {
        diagnostics.push({ severity: "warning", message: line, source: "ngspice" });
      }
    }
  };
  scan(stdout);
  scan(stderr);
  return diagnostics;
}
