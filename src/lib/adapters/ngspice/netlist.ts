// Netlist validation and batch run-deck generation. Pure functions; the
// generated deck is executed by ngspice in batch mode (-b) with the workspace
// root as the working directory.

import { ValidationIssue } from "../contract";
import { NgspiceAnalysis } from "./types";

export const MAX_NETLIST_BYTES = 512 * 1024;

/** Vector expression allow-list: v(node), i(src), plain vector names. */
const VECTOR_RE = /^[a-zA-Z][a-zA-Z0-9_]*\(\s*[a-zA-Z0-9_./+-]+\s*\)$|^[a-zA-Z0-9_./+-]+$/;
/** Source / device names appearing in `dc` sweeps. */
const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_.]*$/;

/** Static checks on a user-supplied base netlist. */
export function validateNetlist(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (text.trim().length === 0) {
    return [{ severity: "error", message: "Netlist is empty." }];
  }
  if (text.length > MAX_NETLIST_BYTES) {
    return [{ severity: "error", message: `Netlist exceeds the ${MAX_NETLIST_BYTES / 1024} KiB size limit.` }];
  }
  const lines = text.split(/\r?\n/);
  const lower = lines.map((l) => l.trim().toLowerCase());
  if (!lower.some((l) => l === ".end")) {
    issues.push({ severity: "error", message: "Netlist must contain a final .end line." });
  }
  // Compact form: drop comment lines (`*`) and inline comments (`$`/`;`), then
  // remove ALL whitespace. This defeats attempts to smuggle a `.control` block
  // or shell escape past a per-line check by splitting keywords across SPICE
  // continuation lines (a `+` line concatenates onto the previous one).
  const compact = lines
    .map((l) => l.trim())
    .filter((l) => !l.startsWith("*"))
    .map((l) => l.replace(/[$;].*$/, "")) // strip inline comments
    .map((l) => l.replace(/^\+/, "")) // drop SPICE continuation marker
    .join("")
    .replace(/\s+/g, "")
    .toLowerCase();
  if (compact.includes(".control") || compact.includes(".endc")) {
    issues.push({
      severity: "error",
      message: "Netlist must not contain a .control block; analyses are configured in the workbench."
    });
  }
  if (compact.includes("shell") || compact.includes("system(") || compact.includes("exec(")) {
    issues.push({ severity: "error", message: "Netlist contains shell escapes, which are not allowed." });
  }
  const first = lines[0]?.trim() ?? "";
  if (first.startsWith(".") || first.length === 0) {
    issues.push({
      severity: "warning",
      message: "First netlist line should be a title comment (ngspice treats it as the title)."
    });
  }
  const hasComponent = lower.some((l) => /^[rlcvidqmx]/.test(l));
  if (!hasComponent) {
    issues.push({ severity: "warning", message: "No components detected (R/L/C/V/I/D/Q/M/X lines)." });
  }
  return issues;
}

export function validateAnalysis(analysis: NgspiceAnalysis, vectors: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const positive = (v: number, name: string) => {
    if (!Number.isFinite(v) || v <= 0) issues.push({ severity: "error", message: `${name} must be positive.`, field: name });
  };
  switch (analysis.kind) {
    case "op":
      break;
    case "dc":
      if (!NAME_RE.test(analysis.source)) {
        issues.push({ severity: "error", message: `Invalid swept source name "${analysis.source}".`, field: "source" });
      }
      if (!Number.isFinite(analysis.start) || !Number.isFinite(analysis.stop)) {
        issues.push({ severity: "error", message: "DC sweep bounds must be finite numbers." });
      }
      positive(analysis.step, "step");
      if (Number.isFinite(analysis.start) && Number.isFinite(analysis.stop) && analysis.stop <= analysis.start) {
        issues.push({ severity: "error", message: "DC sweep stop must be greater than start." });
      }
      break;
    case "ac":
      positive(analysis.pointsPerDecade, "pointsPerDecade");
      positive(analysis.fStart, "fStart");
      positive(analysis.fStop, "fStop");
      if (analysis.fStop <= analysis.fStart) {
        issues.push({ severity: "error", message: "AC sweep fStop must be greater than fStart." });
      }
      break;
    case "tran":
      positive(analysis.tStep, "tStep");
      positive(analysis.tStop, "tStop");
      if (analysis.tStop <= analysis.tStep) {
        issues.push({ severity: "error", message: "Transient tStop must be greater than tStep." });
      }
      break;
    default: {
      issues.push({ severity: "error", message: "Unknown analysis kind." });
    }
  }
  if (analysis.kind !== "op") {
    if (vectors.length === 0) {
      issues.push({ severity: "error", message: "At least one output vector is required (e.g. v(out))." });
    }
    for (const v of vectors) {
      if (!VECTOR_RE.test(v)) {
        issues.push({ severity: "error", message: `Invalid vector expression "${v}".`, field: "vectors" });
      }
    }
  }
  return issues;
}

function analysisCommand(analysis: NgspiceAnalysis): string {
  switch (analysis.kind) {
    case "op":
      return "op";
    case "dc":
      return `dc ${analysis.source} ${fmt(analysis.start)} ${fmt(analysis.stop)} ${fmt(analysis.step)}`;
    case "ac":
      return `ac dec ${Math.round(analysis.pointsPerDecade)} ${fmt(analysis.fStart)} ${fmt(analysis.fStop)}`;
    case "tran":
      return `tran ${fmt(analysis.tStep)} ${fmt(analysis.tStop)}`;
  }
}

function fmt(v: number): string {
  // Plain decimal/exponential notation ngspice accepts; never locale-formatted.
  return Number(v).toExponential(6);
}

/**
 * For AC analyses the recorded vectors are complex; record magnitude and
 * phase explicitly so the wrdata file contains real columns only.
 */
export function outputExpressions(analysis: NgspiceAnalysis, vectors: string[]): string[] {
  if (analysis.kind === "ac") {
    return vectors.flatMap((v) => [`mag(${v})`, `ph(${v})`]);
  }
  return vectors;
}

/**
 * Build the batch run deck: the user netlist with a generated .control block
 * appended before .end. `dataFileRelPath` is where wrdata writes results,
 * relative to the workspace root (the process working directory).
 */
export function buildRunDeck(
  baseNetlist: string,
  analysis: NgspiceAnalysis,
  vectors: string[],
  dataFileRelPath: string
): string {
  const lines = baseNetlist.split(/\r?\n/);
  const endIndex = lines.findIndex((l) => l.trim().toLowerCase() === ".end");
  const body = endIndex >= 0 ? lines.slice(0, endIndex) : lines;

  const control: string[] = ["", "* --- generated by Engineering Workbench; do not edit ---", ".control", "set filetype=ascii"];
  if (analysis.kind === "op") {
    control.push("op", "print all");
  } else {
    control.push("set wr_vecnames", "set wr_singlescale");
    control.push(analysisCommand(analysis));
    control.push(`wrdata ${dataFileRelPath} ${outputExpressions(analysis, vectors).join(" ")}`);
  }
  control.push("quit", ".endc", ".end", "");
  return [...body, ...control].join("\n");
}
