// Parsers for kicad-cli output: version strings and ERC/DRC JSON reports.
// Fixture-tested; report shapes follow the schemas.kicad.org drc/erc v1 files
// emitted by `kicad-cli ... --format json`.

import { Diagnostic } from "../contract";

export interface KicadVersion {
  raw: string;
  major: number;
  minor: number;
  patch: number;
}

/** Parse `kicad-cli version` output, e.g. "8.0.4" or "9.0.0-rc1". */
export function parseKicadVersion(output: string): KicadVersion | null {
  const m = output.trim().match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { raw: output.trim().split(/\r?\n/)[0], major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

interface ReportViolation {
  type?: string;
  description?: string;
  severity?: string;
  items?: { description?: string; pos?: { x: number; y: number } }[];
}

export interface KicadFindings {
  diagnostics: Diagnostic[];
  errorCount: number;
  warningCount: number;
}

function toDiagnostic(v: ReportViolation, source: string, sheet?: string): Diagnostic {
  const severity = v.severity === "error" ? "error" : v.severity === "warning" ? "warning" : "info";
  const item = v.items?.[0];
  const pos = item?.pos ? ` @ (${item.pos.x} mm, ${item.pos.y} mm)` : "";
  return {
    severity,
    message: `${v.description ?? v.type ?? "violation"}${item?.description ? ` - ${item.description}` : ""}`,
    source,
    location: `${sheet ?? ""}${pos}`.trim() || undefined
  };
}

function summarise(diagnostics: Diagnostic[]): KicadFindings {
  return {
    diagnostics,
    errorCount: diagnostics.filter((d) => d.severity === "error").length,
    warningCount: diagnostics.filter((d) => d.severity === "warning").length
  };
}

/** Parse a `kicad-cli pcb drc --format json` report. */
export function parseDrcReport(json: string): KicadFindings {
  const parsed = parseJsonObject(json, "DRC");
  const diagnostics: Diagnostic[] = [];
  for (const key of ["violations", "unconnected_items", "schematic_parity"] as const) {
    const list = parsed[key];
    if (Array.isArray(list)) {
      for (const v of list) diagnostics.push(toDiagnostic(v as ReportViolation, `kicad-cli drc:${key}`));
    }
  }
  return summarise(diagnostics);
}

/** Parse a `kicad-cli sch erc --format json` report (violations grouped by sheet). */
export function parseErcReport(json: string): KicadFindings {
  const parsed = parseJsonObject(json, "ERC");
  const diagnostics: Diagnostic[] = [];
  const sheets = parsed.sheets;
  if (Array.isArray(sheets)) {
    for (const sheet of sheets) {
      const s = sheet as { path?: string; violations?: ReportViolation[] };
      if (Array.isArray(s.violations)) {
        for (const v of s.violations) diagnostics.push(toDiagnostic(v, "kicad-cli erc", s.path));
      }
    }
  } else if (Array.isArray(parsed.violations)) {
    for (const v of parsed.violations) diagnostics.push(toDiagnostic(v as ReportViolation, "kicad-cli erc"));
  }
  return summarise(diagnostics);
}

function parseJsonObject(json: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`${label} report is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} report must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}
