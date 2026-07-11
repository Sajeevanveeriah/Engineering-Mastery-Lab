// Deterministic engineering evidence report. This module does not read the
// wall clock. Timestamps and run receipts are explicit inputs so identical
// inputs produce byte-identical Markdown suitable for review and versioning.

import type { AdapterResult } from "../adapters/contract";
import type { SimulationConfig, WorkspaceManifest } from "../workspace/manifest";

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
  /** Receipt capture time, when the result came from a latest-run receipt. */
  capturedUtc?: string;
  /** Input hashes captured with that receipt. */
  inputFiles?: InputFileRecord[];
  /** Whether the receipt write completed or this result exists only in memory. */
  persistence?: "persisted" | "session-only";
  /** Complete declared and missing input state captured for the run. */
  declaredInputPaths?: string[];
  missingInputPaths?: string[];
}

export interface EvidenceReportInput {
  manifest: WorkspaceManifest;
  appVersion: string;
  /** ISO-8601 UTC supplied by the caller so the body stays deterministic. */
  generatedUtc: string;
  tools: ToolRecord[];
  /** Current workspace hashes at report generation time. */
  inputFiles: InputFileRecord[];
  runs: SimulationRun[];
  limitations: string[];
}

// "Completed" means the tool ran and produced parseable output. It does not
// mean a design check passed. Findings and scalar counts carry that verdict.
const STATUS_LABEL: Record<AdapterResult["status"], string> = {
  ok: "COMPLETED",
  failed: "FAILED",
  timeout: "FAILED (timeout)",
  cancelled: "NOT RUN (cancelled)",
  "tool-missing": "NOT RUN (tool missing)",
  "invalid-input": "FAILED (invalid input)"
};

interface ReportContext {
  input: EvidenceReportInput;
  lines: string[];
  limitations: Set<string>;
  runsById: Map<string, SimulationRun>;
}

interface RunEvidenceSummary {
  lines: string[];
  limitations: string[];
}

interface HashDifferences {
  missingCurrent: string[];
  mismatched: string[];
}

export function buildEvidenceReport(input: EvidenceReportInput): string {
  const context = createReportContext(input);
  writeHeader(context);
  writeProjectMetadata(context);
  writeRequirements(context);
  writeTools(context);
  writeInputFiles(context);
  writeSimulations(context);
  writeLimitations(context);
  writeReproduction(context);
  return context.lines.join("\n");
}

function createReportContext(input: EvidenceReportInput): ReportContext {
  const limitations = new Set<string>();
  for (const explicit of input.limitations) {
    const normalised = explicit.trim();
    limitations.add(normalised || "An explicit limitation entry was blank and could not be described.");
  }

  // Duplicate ids use the greatest canonical serialisation. Selection does
  // not depend on arrival order, including when receipt metadata differs.
  const runsById = new Map<string, SimulationRun>();
  for (const run of input.runs) {
    const existing = runsById.get(run.simulationId);
    if (!existing || canonicalKey(run) > canonicalKey(existing)) runsById.set(run.simulationId, run);
  }
  const knownIds = new Set(input.manifest.simulations.map((simulation) => simulation.id));
  const unknownIds = [...runsById.keys()].filter((id) => !knownIds.has(id)).sort(compareText);
  if (unknownIds.length > 0) {
    limitations.add(`Run data referenced simulation ids that are not present in the manifest: ${unknownIds.join(", ")}.`);
  }
  return { input, lines: [], limitations, runsById };
}

function writeHeader(context: ReportContext): void {
  const { input } = context;
  line(context, `# Engineering Evidence Report: ${mdEscape(input.manifest.name)}`);
  line(context);
  line(
    context,
    `Generated: ${mdEscape(input.generatedUtc)} · Engineering Workbench ${mdEscape(input.appVersion)} · ` +
      `Manifest schema v${input.manifest.schemaVersion}`
  );
  line(context);
  if (input.manifest.description) {
    line(context, mdEscape(input.manifest.description));
    line(context);
  }
}

function writeProjectMetadata(context: ReportContext): void {
  const { manifest } = context.input;
  line(context, "## 1. Project metadata");
  line(context);
  line(context, "| Field | Value |");
  line(context, "|---|---|");
  line(context, `| Name | ${mdEscape(manifest.name)} |`);
  line(context, `| Created (UTC) | ${mdEscape(manifest.createdUtc)} |`);
  line(context, `| Modified (UTC) | ${mdEscape(manifest.modifiedUtc)} |`);
  line(context, `| Requirements | ${manifest.requirements.length} |`);
  line(context, `| Simulations | ${manifest.simulations.length} |`);
  line(context);
}

function writeRequirements(context: ReportContext): void {
  const { manifest } = context.input;
  line(context, "## 2. Requirements");
  line(context);
  if (manifest.requirements.length === 0) {
    line(context, "No requirements are recorded in the manifest.");
    line(context);
    return;
  }

  line(context, "| Id | Requirement | Source | Linked simulations |");
  line(context, "|---|---|---|---|");
  for (const requirement of [...manifest.requirements].sort((a, b) => compareText(a.id, b.id))) {
    const simulations = manifest.simulations
      .filter((simulation) => simulation.requirementIds.includes(requirement.id))
      .map((simulation) => simulation.id)
      .sort(compareText)
      .join(", ");
    line(
      context,
      `| ${mdEscape(requirement.id)} | ${mdEscape(requirement.title)} | ` +
        `${requirement.sourceRelPath ? mdEscape(requirement.sourceRelPath) : "Not recorded"} | ` +
        `${simulations ? mdEscape(simulations) : "None"} |`
    );
  }
  line(context);
}

function writeTools(context: ReportContext): void {
  line(context, "## 3. Tools and adapter versions");
  line(context);
  line(context, "| Tool | Status | Version | Executable |");
  line(context, "|---|---|---|---|");
  const tools = [...context.input.tools].sort(
    (a, b) => compareText(a.name, b.name) || compareCanonical(a, b)
  );
  for (const tool of tools) {
    line(
      context,
      `| ${mdEscape(tool.name)} | ` +
        `${tool.ready ? "ready" : `unavailable${tool.error ? ` (${mdEscape(tool.error)})` : ""}`} | ` +
        `${tool.version ? mdEscape(tool.version) : "Not recorded"} | ` +
        `${tool.executablePath ? mdEscape(tool.executablePath) : "Not recorded"} |`
    );
  }
  line(context);
}

function writeInputFiles(context: ReportContext): void {
  line(context, "## 4. Input files and hashes");
  line(context);
  if (context.input.inputFiles.length === 0) {
    line(context, "No current input files were recorded.");
    line(context);
    return;
  }
  line(context, "| File | SHA-256 |");
  line(context, "|---|---|");
  for (const file of [...context.input.inputFiles].sort(compareInputFile)) {
    line(context, `| ${mdEscape(file.relPath)} | \`${mdEscape(file.sha256)}\` |`);
  }
  line(context);
}

function writeSimulations(context: ReportContext): void {
  line(context, "## 5. Simulations and results");
  line(context);
  const simulations = [...context.input.manifest.simulations].sort((a, b) => compareText(a.id, b.id));
  simulations.forEach((simulation, index) => writeSimulation(context, simulation, index));
}

function writeSimulation(context: ReportContext, simulation: SimulationConfig, index: number): void {
  writeSimulationConfiguration(context, simulation, index);
  const run = context.runsById.get(simulation.id);
  if (!run) {
    line(context, "Evidence status: **NO RUN RESULT SUPPLIED**.");
    line(context, "Result: **NOT AVAILABLE** in this report.");
    line(context);
    context.limitations.add(`No run result was supplied for simulation ${JSON.stringify(simulation.id)}.`);
    return;
  }

  const evidence = describeRunEvidence(run, context.input.inputFiles);
  evidence.lines.forEach((evidenceLine) => line(context, evidenceLine));
  evidence.limitations.forEach((limitation) => context.limitations.add(limitation));
  line(context);
  writeResultSummary(context, simulation, run.result);
  writeScalars(context, run.result);
  writeDataTables(context, run.result);
  writeDiagnostics(context, run.result);
  writeGeneratedFiles(context, run.result);
}

function writeSimulationConfiguration(
  context: ReportContext,
  simulation: SimulationConfig,
  index: number
): void {
  line(context, `### 5.${index + 1} ${mdEscape(simulation.id)}: ${mdEscape(simulation.title)}`);
  line(context);
  const requirementIds = [...simulation.requirementIds].sort(compareText).map(mdEscape).join(", ");
  line(
    context,
    `Capability: \`${mdEscape(simulation.capabilityId)}\` · Requirements: ${requirementIds || "None"}`
  );
  line(context);
  line(context, "Configuration:");
  line(context);
  line(context, "```json");
  line(context, JSON.stringify(sortKeysDeep(simulation.params), null, 2));
  line(context, "```");
  line(context);
}

function writeResultSummary(
  context: ReportContext,
  simulation: SimulationConfig,
  result: AdapterResult
): void {
  const errorCount = result.scalars.errorCount;
  const verdict =
    typeof errorCount === "number" && Number.isFinite(errorCount)
      ? errorCount > 0
        ? " · findings: NOT CLEAN"
        : " · findings: clean"
      : "";
  line(context, `Result: **${STATUS_LABEL[result.status]}**${verdict}: ${mdEscape(result.message)}`);
  if (result.toolVersion) line(context, `Tool version: ${mdEscape(result.toolVersion)}`);
  line(context);
  recordResultLimitations(context, simulation.id, result, errorCount);
}

function recordResultLimitations(
  context: ReportContext,
  simulationId: string,
  result: AdapterResult,
  errorCount: number | undefined
): void {
  if (result.status !== "ok") {
    context.limitations.add(
      `Simulation ${JSON.stringify(simulationId)} did not complete successfully (status: ${result.status}).`
    );
  }
  if (typeof errorCount === "number" && Number.isFinite(errorCount) && errorCount > 0) {
    context.limitations.add(
      `Simulation ${JSON.stringify(simulationId)} completed with ${fmtNum(errorCount)} error finding(s).`
    );
  }
  if (result.raw?.truncated === true) {
    context.limitations.add(`Raw tool output for simulation ${JSON.stringify(simulationId)} was truncated.`);
  }
}

function writeScalars(context: ReportContext, result: AdapterResult): void {
  const keys = Object.keys(result.scalars).sort(compareText);
  if (keys.length === 0) return;
  line(context, "| Quantity | Value |");
  line(context, "|---|---|");
  keys.forEach((key) => line(context, `| ${mdEscape(key)} | ${fmtNum(result.scalars[key])} |`));
  line(context);
}

function writeDataTables(context: ReportContext, result: AdapterResult): void {
  for (const table of result.tables) {
    const pointCount = table.columns[0]?.values.length ?? 0;
    const columnNames = mdEscape(table.columns.map((column) => column.name).join(", "));
    line(
      context,
      `Data: *${mdEscape(table.title)}*: ${pointCount} points × ${table.columns.length} columns ` +
        `(${columnNames}). Plot from the exported CSV below.`
    );
    line(context);
  }
}

function writeDiagnostics(context: ReportContext, result: AdapterResult): void {
  if (result.diagnostics.length === 0) return;
  line(context, "Findings:");
  line(context);
  const diagnostics = [...result.diagnostics].sort(
    (a, b) => compareText(a.severity, b.severity) || compareText(a.message, b.message) || compareCanonical(a, b)
  );
  for (const diagnostic of diagnostics) {
    line(
      context,
      `- **${diagnostic.severity}** ` +
        `${diagnostic.location ? `(${mdEscape(diagnostic.location)}) ` : ""}${mdEscape(diagnostic.message)}`
    );
  }
  line(context);
}

function writeGeneratedFiles(context: ReportContext, result: AdapterResult): void {
  if (result.generatedFiles.length === 0) return;
  line(context, "Generated outputs:");
  line(context);
  line(context, "| File | Kind | SHA-256 |");
  line(context, "|---|---|---|");
  const files = [...result.generatedFiles].sort(
    (a, b) => compareText(a.relPath, b.relPath) || compareText(a.kind, b.kind) || compareCanonical(a, b)
  );
  for (const file of files) {
    line(
      context,
      `| ${mdEscape(file.relPath)} | ${mdEscape(file.kind)} | ` +
        `${file.sha256 ? `\`${mdEscape(file.sha256)}\`` : "Not recorded"} |`
    );
  }
  line(context);
}

function writeLimitations(context: ReportContext): void {
  line(context, "## 6. Limitations");
  line(context);
  if (context.input.runs.some((run) => run.result.status === "tool-missing")) {
    context.limitations.add(
      "One or more simulations could not run because an external tool is not installed on this machine."
    );
  }
  if (context.limitations.size === 0) {
    line(context, "None recorded.");
  } else {
    [...context.limitations].sort(compareText).forEach((limitation) => line(context, `- ${mdEscape(limitation)}`));
  }
  line(context);
}

function writeReproduction(context: ReportContext): void {
  line(context, "## 7. Reproduction");
  line(context);
  line(context, "1. Install the tool versions listed in section 3.");
  line(context, "2. Open this workspace in Engineering Workbench (File → Open project).");
  line(context, "3. Verify current input file hashes against section 4 and any receipt hash status in section 5.");
  line(context, "4. Run each simulation listed in section 5 with the configuration shown.");
  line(
    context,
    "5. Regenerate this report. With the same supplied timestamps and inputs, an identical project state produces identical report bytes."
  );
  line(context);
}

function describeRunEvidence(run: SimulationRun, currentInputFiles: InputFileRecord[]): RunEvidenceSummary {
  if (!run.capturedUtc) {
    return {
      lines: [run.persistence === "session-only"
        ? "Evidence status: **SESSION-ONLY RESULT WITHOUT RECEIPT METADATA**."
        : "Evidence status: **RESULT SUPPLIED WITHOUT RECEIPT METADATA**."],
      limitations: [
        `Run result for simulation ${JSON.stringify(run.simulationId)} has no receipt timestamp or captured input hashes.`
      ]
    };
  }

  const persisted = run.persistence !== "session-only";
  const lines = [
    persisted
      ? "Evidence status: **PERSISTED LATEST-RUN RECEIPT**."
      : "Evidence status: **SESSION-ONLY RESULT, RECEIPT NOT PERSISTED**.",
    `${persisted ? "Receipt" : "Result"} captured (UTC): ${mdEscape(run.capturedUtc)}`
  ];
  if (run.missingInputPaths && run.missingInputPaths.length > 0) {
    lines.push(`Declared inputs missing at capture: ${mdEscape([...run.missingInputPaths].sort(compareText).join(", "))}.`);
  }
  if (run.inputFiles === undefined) return missingReceiptHashes(run, lines);
  if (run.inputFiles.length === 0) {
    lines.push("Input hash check: **NO INPUT FILES RECORDED IN RECEIPT**.");
    return { lines, limitations: [] };
  }
  return compareReceiptHashes(run, currentInputFiles, lines);
}

function missingReceiptHashes(run: SimulationRun, lines: string[]): RunEvidenceSummary {
  lines.push("Input hash check: **NOT AVAILABLE** because the supplied run did not include captured hashes.");
  return {
    lines,
    limitations: [
      `Receipt metadata for simulation ${JSON.stringify(run.simulationId)} did not include captured input hashes.`
    ]
  };
}

function compareReceiptHashes(
  run: SimulationRun,
  currentInputFiles: InputFileRecord[],
  lines: string[]
): RunEvidenceSummary {
  const differences = findHashDifferences(run.inputFiles ?? [], currentInputFiles);
  if (differences.mismatched.length === 0 && differences.missingCurrent.length === 0) {
    lines.push("Input hash check: **MATCHED CURRENT INPUTS**.");
    return { lines, limitations: [] };
  }

  const limitations: string[] = [];
  appendMismatchedHashEvidence(run.simulationId, differences.mismatched, lines, limitations);
  appendMissingHashEvidence(run.simulationId, differences.missingCurrent, lines, limitations);
  return { lines, limitations };
}

function findHashDifferences(capturedFiles: InputFileRecord[], currentFiles: InputFileRecord[]): HashDifferences {
  const currentHashes = new Map<string, Set<string>>();
  for (const file of currentFiles) {
    const hashes = currentHashes.get(file.relPath) ?? new Set<string>();
    hashes.add(file.sha256);
    currentHashes.set(file.relPath, hashes);
  }
  const missingCurrent: string[] = [];
  const mismatched: string[] = [];
  for (const captured of capturedFiles) {
    const hashes = currentHashes.get(captured.relPath);
    if (!hashes) missingCurrent.push(captured.relPath);
    else if (hashes.size !== 1 || !hashes.has(captured.sha256)) mismatched.push(captured.relPath);
  }
  return { missingCurrent, mismatched };
}

function appendMismatchedHashEvidence(
  simulationId: string,
  mismatched: string[],
  lines: string[],
  limitations: string[]
): void {
  if (mismatched.length === 0) return;
  const paths = mismatched.sort(compareText).join(", ");
  lines.push(`Input hash check: **MISMATCH** for ${mdEscape(paths)}.`);
  limitations.push(
    `Receipt input hashes for simulation ${JSON.stringify(simulationId)} do not match current files: ${paths}.`
  );
}

function appendMissingHashEvidence(
  simulationId: string,
  missingCurrent: string[],
  lines: string[],
  limitations: string[]
): void {
  if (missingCurrent.length === 0) return;
  const paths = missingCurrent.sort(compareText).join(", ");
  lines.push(`Input hash check: **NOT CHECKED** because current hashes were not supplied for ${mdEscape(paths)}.`);
  limitations.push(
    `Current hashes were unavailable for receipt inputs used by simulation ${JSON.stringify(simulationId)}: ${paths}.`
  );
}

function line(context: ReportContext, value = ""): void {
  context.lines.push(value);
}

function fmtNum(value: number): string {
  if (Number.isNaN(value)) return "n/a";
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
  return value.toPrecision(8);
}

function mdEscape(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function canonicalKey(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function compareCanonical(a: unknown, b: unknown): number {
  return compareText(canonicalKey(a), canonicalKey(b));
}

function compareInputFile(a: InputFileRecord, b: InputFileRecord): number {
  return compareText(a.relPath, b.relPath) || compareText(a.sha256, b.sha256);
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(value as Record<string, unknown>).sort(compareText)) {
      out[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}
