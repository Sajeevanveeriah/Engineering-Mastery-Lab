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

const MIN_SUPPORTED_KICAD_MAJOR = 7;
const MAX_SUPPORTED_KICAD_MAJOR = 10;

/** Parse a KiCad CLI version banner, e.g. "8.0.4", "KiCad 9.0.0", or "kicad-cli 10.0". */
export function parseKicadVersion(output: string): KicadVersion {
  const lines = output.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length !== 1) {
    throw new Error("KiCad version output must contain exactly one non-empty banner line.");
  }

  const raw = lines[0].trim();
  const match = raw.match(
    /^(?:(?:kicad-cli|kicad)(?:\s+version)?\s*:?\s*)?(\d+)\.(\d+)(?:\.(\d+))?(?:[-+][0-9a-z.-]+)?$/i
  );
  if (!match) {
    throw new Error(`KiCad version output is not a recognised kicad-cli banner: "${raw}".`);
  }

  const major = Number(match[1]);
  if (major < MIN_SUPPORTED_KICAD_MAJOR || major > MAX_SUPPORTED_KICAD_MAJOR) {
    throw new Error(
      `KiCad ${major} is unsupported; recognised major versions are ${MIN_SUPPORTED_KICAD_MAJOR} through ${MAX_SUPPORTED_KICAD_MAJOR}.`
    );
  }

  return { raw, major, minor: Number(match[2]), patch: Number(match[3] ?? 0) };
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
  requireSchema(parsed, "DRC", "https://schemas.kicad.org/drc.v1.json");
  const diagnostics: Diagnostic[] = [];
  for (const key of ["violations", "unconnected_items", "schematic_parity"] as const) {
    const list = requireObjectArray(parsed[key], `DRC report field "${key}"`);
    for (const v of list) diagnostics.push(toDiagnostic(v as ReportViolation, `kicad-cli drc:${key}`));
  }
  return summarise(diagnostics);
}

/** Parse a `kicad-cli sch erc --format json` report (violations grouped by sheet). */
export function parseErcReport(json: string): KicadFindings {
  const parsed = parseJsonObject(json, "ERC");
  requireSchema(parsed, "ERC", "https://schemas.kicad.org/erc.v1.json");
  const diagnostics: Diagnostic[] = [];
  const sheets = requireObjectArray(parsed.sheets, 'ERC report field "sheets"');
  for (const sheet of sheets) {
    const violations = requireObjectArray(sheet.violations, 'ERC report sheet field "violations"');
    const path = typeof sheet.path === "string" ? sheet.path : undefined;
    for (const v of violations) {
      diagnostics.push(toDiagnostic(v as ReportViolation, "kicad-cli erc", path));
    }
  }
  return summarise(diagnostics);
}

function requireSchema(parsed: Record<string, unknown>, label: string, expected: string): void {
  if (parsed.$schema !== expected) {
    throw new Error(`${label} report uses an unsupported schema; expected "${expected}".`);
  }
}

function requireObjectArray(value: unknown, label: string): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  if (value.some((entry) => typeof entry !== "object" || entry === null || Array.isArray(entry))) {
    throw new Error(`${label} must contain only JSON objects.`);
  }
  return value as Record<string, unknown>[];
}

function parseJsonObject(json: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(
      `${label} report is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} report must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}
