// Deterministic engineering evidence report. Pure function of its input:
// identical project state produces byte-identical Markdown, so reports diff
// cleanly under review. No wall-clock access here — the caller supplies the
// generation timestamp explicitly and it is printed in a single labelled line.

import { AdapterResult } from "../adapters/contract";
import { WorkspaceManifest } from "../workspace/manifest";

export interface ToolRecord {
  name: string;
  ready: boolean;
  version?: string;
  executablePath?: string;
  error?: string;
}

export interface InputFileRecord {
  relPath: string;
  sha256: string;
}

export interface SimulationRun {
  simulationId: string;
  result: AdapterResult;
}

export interface EvidenceReportInput {
  manifest: WorkspaceManifest;
  appVersion: string;
  /** ISO-8601 UTC; supplied by the caller so the body stays deterministic. */
  generatedUtc: string;
  tools: ToolRecord[];
  inputFiles: InputFileRecord[];
  runs: SimulationRun[];
  limitations: string[];
}

// "Completed" means the tool ran and produced parseable output — NOT that a
// design check passed. ERC/DRC can complete with errors; the findings and
// scalar counts below carry the verdict, not this label.
const STATUS_LABEL: Record<AdapterResult["status"], string> = {
  ok: "COMPLETED",
  failed: "FAILED",
  timeout: "FAILED (timeout)",
  cancelled: "NOT RUN (cancelled)",
  "tool-missing": "NOT RUN (tool missing)",
  "invalid-input": "FAILED (invalid input)"
};

function fmtNum(v: number): string {
  if (Number.isNaN(v)) return "n/a";
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  return v.toPrecision(8);
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function buildEvidenceReport(input: EvidenceReportInput): string {
  const { manifest } = input;
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`# Engineering Evidence Report — ${manifest.name}`);
  push();
  push(`Generated: ${input.generatedUtc} · Engineering Workbench ${input.appVersion} · Manifest schema v${manifest.schemaVersion}`);
  push();
  if (manifest.description) {
    push(manifest.description);
    push();
  }

  push("## 1. Project metadata");
  push();
  push("| Field | Value |");
  push("|---|---|");
  push(`| Name | ${mdEscape(manifest.name)} |`);
  push(`| Created (UTC) | ${manifest.createdUtc} |`);
  push(`| Modified (UTC) | ${manifest.modifiedUtc} |`);
  push(`| Requirements | ${manifest.requirements.length} |`);
  push(`| Simulations | ${manifest.simulations.length} |`);
  push();

  push("## 2. Requirements");
  push();
  if (manifest.requirements.length === 0) {
    push("No requirements are recorded in the manifest.");
  } else {
    push("| Id | Requirement | Source | Verified by |");
    push("|---|---|---|---|");
    for (const req of [...manifest.requirements].sort((a, b) => a.id.localeCompare(b.id))) {
      const sims = manifest.simulations
        .filter((s) => s.requirementIds.includes(req.id))
        .map((s) => s.id)
        .sort()
        .join(", ");
      push(`| ${req.id} | ${mdEscape(req.title)} | ${req.sourceRelPath ?? "—"} | ${sims || "—"} |`);
    }
  }
  push();

  push("## 3. Tools and adapter versions");
  push();
  push("| Tool | Status | Version | Executable |");
  push("|---|---|---|---|");
  for (const tool of [...input.tools].sort((a, b) => a.name.localeCompare(b.name))) {
    push(
      `| ${mdEscape(tool.name)} | ${tool.ready ? "ready" : `unavailable${tool.error ? ` (${mdEscape(tool.error)})` : ""}`} | ` +
        `${tool.version ?? "—"} | ${tool.executablePath ? mdEscape(tool.executablePath) : "—"} |`
    );
  }
  push();

  push("## 4. Input files and hashes");
  push();
  if (input.inputFiles.length === 0) {
    push("No input files recorded.");
  } else {
    push("| File | SHA-256 |");
    push("|---|---|");
    for (const f of [...input.inputFiles].sort((a, b) => a.relPath.localeCompare(b.relPath))) {
      push(`| ${mdEscape(f.relPath)} | \`${f.sha256}\` |`);
    }
  }
  push();

  push("## 5. Simulations and results");
  push();
  const runsById = new Map(input.runs.map((r) => [r.simulationId, r.result]));
  for (const sim of [...manifest.simulations].sort((a, b) => a.id.localeCompare(b.id))) {
    push(`### 5.${1 + [...manifest.simulations].sort((a, b) => a.id.localeCompare(b.id)).findIndex((s) => s.id === sim.id)} ${sim.id} — ${mdEscape(sim.title)}`);
    push();
    push(`Capability: \`${sim.capabilityId}\` · Requirements: ${[...sim.requirementIds].sort().join(", ") || "—"}`);
    push();
    push("Configuration:");
    push();
    push("```json");
    push(JSON.stringify(sortKeysDeep(sim.params), null, 2));
    push("```");
    push();
    const result = runsById.get(sim.id);
    if (!result) {
      push("Result: **NOT RUN** in this report.");
      push();
      continue;
    }
    // Surface a check verdict for validation runs that report error counts,
    // so a completed-with-errors ERC/DRC is not mistaken for a clean pass.
    const errorCount = result.scalars.errorCount;
    const verdict =
      typeof errorCount === "number" ? (errorCount > 0 ? " · findings: NOT CLEAN" : " · findings: clean") : "";
    push(`Result: **${STATUS_LABEL[result.status]}**${verdict} — ${mdEscape(result.message)}`);
    if (result.toolVersion) push(`Tool version: ${result.toolVersion}`);
    push();
    const scalarKeys = Object.keys(result.scalars).sort();
    if (scalarKeys.length > 0) {
      push("| Quantity | Value |");
      push("|---|---|");
      for (const key of scalarKeys) push(`| ${mdEscape(key)} | ${fmtNum(result.scalars[key])} |`);
      push();
    }
    for (const table of result.tables) {
      const n = table.columns[0]?.values.length ?? 0;
      push(
        `Data: *${mdEscape(table.title)}* — ${n} points × ${table.columns.length} columns ` +
          `(${table.columns.map((c) => c.name).join(", ")}). Plot from the exported CSV below.`
      );
      push();
    }
    if (result.diagnostics.length > 0) {
      push("Findings:");
      push();
      for (const d of [...result.diagnostics].sort((a, b) => a.severity.localeCompare(b.severity) || a.message.localeCompare(b.message))) {
        push(`- **${d.severity}** ${d.location ? `(${mdEscape(d.location)}) ` : ""}${mdEscape(d.message)}`);
      }
      push();
    }
    if (result.generatedFiles.length > 0) {
      push("Generated outputs:");
      push();
      push("| File | Kind | SHA-256 |");
      push("|---|---|---|");
      for (const f of [...result.generatedFiles].sort((a, b) => a.relPath.localeCompare(b.relPath))) {
        push(`| ${mdEscape(f.relPath)} | ${f.kind} | ${f.sha256 ? `\`${f.sha256}\`` : "—"} |`);
      }
      push();
    }
  }

  push("## 6. Limitations");
  push();
  const limitations = [...input.limitations];
  if (input.runs.some((r) => r.result.status === "tool-missing")) {
    limitations.push("One or more simulations could not run because an external tool is not installed on this machine.");
  }
  if (limitations.length === 0) {
    push("None recorded.");
  } else {
    for (const l of limitations.sort()) push(`- ${mdEscape(l)}`);
  }
  push();

  push("## 7. Reproduction");
  push();
  push("1. Install the tool versions listed in section 3.");
  push("2. Open this workspace in Engineering Workbench (File → Open project).");
  push("3. Verify input file hashes against section 4.");
  push("4. Run each simulation listed in section 5 with the configuration shown.");
  push("5. Regenerate this report; apart from the generation timestamp it must be identical for an identical project state.");
  push();

  return lines.join("\n");
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeysDeep((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}
