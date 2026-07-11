// ngspice adapter (contract v1): executes an installed ngspice binary in
// batch mode through the platform bridge. On machines without ngspice the
// adapter reports not-ready with remediation; behaviour is fixture-tested
// through MemoryBridge.

import {
  ADAPTER_CONTRACT_VERSION,
  AdapterInfo,
  AdapterRequest,
  AdapterResult,
  DetectionResult,
  EngineAdapter,
  ExecutionContext,
  GeneratedFile,
  ValidationIssue,
  failureResult
} from "../contract";
import { PlatformBridge } from "../../platform/bridge";
import { isSafeRelPath } from "../../platform/paths";
import { tableToCsv } from "../csv";
import { buildRunDeck, validateAnalysis, validateNetlist, MAX_NETLIST_BYTES } from "./netlist";
import { extractDiagnostics, parseOpOutput, parseWrData } from "./parse";
import { NgspiceAnalysis, NgspiceRunParams } from "./types";

export const NGSPICE_REMEDIATION =
  "Install ngspice (https://ngspice.sourceforge.io), add it to PATH or choose the genuine executable in Diagnostics.";

export class NgspiceAdapter implements EngineAdapter {
  readonly contractVersion = ADAPTER_CONTRACT_VERSION;

  describe(): AdapterInfo {
    return {
      id: "ngspice",
      name: "ngspice circuit simulator",
      kind: "external",
      contractVersion: ADAPTER_CONTRACT_VERSION,
      capabilities: [
        { id: "ngspice.validate", title: "Netlist validation", description: "Static checks on a SPICE netlist." },
        { id: "ngspice.op", title: "DC operating point", description: "Bias-point analysis; reports node voltages and branch currents." },
        { id: "ngspice.dc", title: "DC sweep", description: "Sweep a source and record output vectors." },
        { id: "ngspice.ac", title: "AC analysis", description: "Small-signal frequency sweep; records magnitude and phase." },
        { id: "ngspice.tran", title: "Transient analysis", description: "Time-domain simulation of the circuit." }
      ]
    };
  }

  async detect(bridge: PlatformBridge | null): Promise<DetectionResult> {
    if (!bridge) {
      return { ready: false, error: "External tools require the desktop app.", remediation: "Run the Engineering Workbench desktop build." };
    }
    const det = await bridge.detectTool("ngspice");
    if (!det.found) {
      return { ready: false, error: det.error ?? "ngspice was not found.", remediation: NGSPICE_REMEDIATION };
    }
    return { ready: true, executablePath: det.path, version: det.version };
  }

  validate(request: AdapterRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const params = request.params as Partial<NgspiceRunParams> & { netlistText?: string };
    if (request.capabilityId === "ngspice.validate") {
      if (typeof params.netlistText !== "string") {
        return [{ severity: "error", message: "netlistText (string) is required.", field: "netlistText" }];
      }
      return [];
    }
    if (typeof params.netlistRelPath !== "string" || !isSafeRelPath(params.netlistRelPath)) {
      issues.push({
        severity: "error",
        message: "netlistRelPath must be a safe workspace-relative path (e.g. circuits/rc.cir).",
        field: "netlistRelPath"
      });
    }
    const analysis = params.analysis as NgspiceAnalysis | undefined;
    const expected = request.capabilityId.replace("ngspice.", "");
    if (!analysis || analysis.kind !== expected) {
      issues.push({ severity: "error", message: `analysis.kind must be "${expected}" for ${request.capabilityId}.` });
    } else {
      issues.push(...validateAnalysis(analysis, Array.isArray(params.vectors) ? params.vectors : []));
    }
    return issues;
  }

  async execute(request: AdapterRequest, ctx: ExecutionContext): Promise<AdapterResult> {
    if (request.capabilityId === "ngspice.validate") {
      return this.executeValidate(request);
    }

    const issues = this.validate(request);
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length > 0) {
      return failureResult(request.capabilityId, "invalid-input", errors.map((e) => e.message).join(" "));
    }
    if (!ctx.bridge || !ctx.workspaceRoot) {
      return failureResult(
        request.capabilityId,
        "tool-missing",
        "ngspice simulations need the desktop app with an open workspace."
      );
    }
    const detection = await this.detect(ctx.bridge);
    if (!detection.ready) {
      return failureResult(request.capabilityId, "tool-missing", `${detection.error} ${detection.remediation ?? ""}`.trim());
    }

    const params = request.params as unknown as NgspiceRunParams;
    const bridge = ctx.bridge;
    const root = ctx.workspaceRoot;

    let baseNetlist: string;
    try {
      baseNetlist = await bridge.readTextFile(root, params.netlistRelPath, MAX_NETLIST_BYTES + 1);
    } catch (err) {
      return failureResult(
        request.capabilityId,
        "invalid-input",
        `Could not read netlist "${params.netlistRelPath}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
    const netlistIssues = validateNetlist(baseNetlist).filter((i) => i.severity === "error");
    if (netlistIssues.length > 0) {
      return failureResult(request.capabilityId, "invalid-input", netlistIssues.map((i) => i.message).join(" "), {
        diagnostics: netlistIssues.map((i) => ({ severity: "error" as const, message: i.message, source: "validator" }))
      });
    }

    // Stable run id derived from the simulation, not wall-clock, so repeated
    // runs of the same config overwrite their own artefacts deterministically.
    const runId = `${request.capabilityId.replace(/\./g, "-")}-${sanitize(params.netlistRelPath)}`;
    const deckRelPath = `simulations/${runId}.deck.cir`;
    const dataRelPath = `results/${runId}.data.txt`;
    const csvRelPath = `results/${runId}.csv`;

    const deck = buildRunDeck(baseNetlist, params.analysis, params.vectors ?? [], dataRelPath);
    await bridge.createDirAll(root, "simulations");
    await bridge.createDirAll(root, "results");
    await bridge.writeTextFileAtomic(root, deckRelPath, deck);

    // Guard against stale output: overwrite the data file with a sentinel
    // before the run so a run that exits 0 without producing fresh output
    // cannot be parsed as the previous run's results (evidence integrity).
    const sentinel = `__ewb_no_output__${runId}__`;
    if (params.analysis.kind !== "op") {
      await bridge.writeTextFileAtomic(root, dataRelPath, sentinel);
    }

    const proc = await bridge.runTool(
      { tool: "ngspice", netlistRelPath: deckRelPath, outputDirRelPath: "results" },
      { workspaceRoot: root, timeoutMs: ctx.timeoutMs, signal: ctx.signal }
    );

    const diagnostics = extractDiagnostics(proc.stdout, proc.stderr);
    const raw = {
      stdout: proc.stdout,
      stderr: proc.stderr,
      truncated: proc.truncated
    };
    const generatedFiles: GeneratedFile[] = [{ relPath: deckRelPath, kind: "netlist", description: "Generated run deck" }];

    if (proc.cancelled) {
      return failureResult(request.capabilityId, "cancelled", "Simulation cancelled by the user.", { raw, generatedFiles });
    }
    if (proc.timedOut) {
      return failureResult(
        request.capabilityId,
        "timeout",
        `ngspice did not finish within the time limit and was stopped. Reduce the analysis span or increase the timeout.`,
        { raw, generatedFiles, durationMs: proc.durationMs }
      );
    }
    if (proc.exitCode !== 0) {
      const firstError = diagnostics.find((d) => d.severity === "error")?.message;
      return failureResult(
        request.capabilityId,
        "failed",
        `ngspice exited with code ${proc.exitCode ?? "unknown"}${firstError ? `: ${firstError}` : "."} Check the netlist and diagnostics.`,
        { raw, diagnostics, generatedFiles, durationMs: proc.durationMs, toolVersion: detection.version }
      );
    }

    try {
      if (params.analysis.kind === "op") {
        const scalars = parseOpOutput(proc.stdout);
        if (Object.keys(scalars).length === 0) {
          throw new Error("No operating-point values found in ngspice output.");
        }
        return {
          status: "ok",
          capabilityId: request.capabilityId,
          message: `Operating point solved (${Object.keys(scalars).length} values).`,
          tables: [],
          scalars,
          diagnostics,
          generatedFiles,
          raw,
          durationMs: proc.durationMs,
          toolVersion: detection.version
        };
      }

      const dataText = await bridge.readTextFile(root, dataRelPath);
      if (dataText.trim() === sentinel) {
        return failureResult(
          request.capabilityId,
          "failed",
          "ngspice exited without producing output data. The most likely cause is a recorded vector that does not exist in the circuit " +
            "(check the vector names against the netlist nodes) or an analysis that aborted with warnings. See diagnostics.",
          { raw, diagnostics, generatedFiles, durationMs: proc.durationMs, toolVersion: detection.version }
        );
      }
      const table = parseWrData(dataText, `${request.capabilityId} — ${params.netlistRelPath}`);
      const csv = tableToCsv(table);
      await bridge.writeTextFileAtomic(root, csvRelPath, csv);
      generatedFiles.push(
        { relPath: dataRelPath, kind: "raw", description: "ngspice wrdata output", sha256: await bridge.hashFile(root, dataRelPath) },
        { relPath: csvRelPath, kind: "csv", description: "Parsed results (CSV)", sha256: await bridge.hashFile(root, csvRelPath) }
      );
      return {
        status: "ok",
        capabilityId: request.capabilityId,
        message: `${request.capabilityId} completed: ${table.columns[0]?.values.length ?? 0} points, ${table.columns.length} columns.`,
        tables: [table],
        scalars: {},
        diagnostics,
        generatedFiles,
        raw,
        durationMs: proc.durationMs,
        toolVersion: detection.version
      };
    } catch (err) {
      return failureResult(
        request.capabilityId,
        "failed",
        `ngspice ran but its output could not be parsed: ${err instanceof Error ? err.message : String(err)} ` +
          "The raw output files are kept in results/ for inspection.",
        { raw, diagnostics, generatedFiles, durationMs: proc.durationMs, toolVersion: detection.version }
      );
    }
  }

  private executeValidate(request: AdapterRequest): AdapterResult {
    const text = request.params.netlistText;
    if (typeof text !== "string") {
      return failureResult(request.capabilityId, "invalid-input", "netlistText (string) is required.");
    }
    const issues = validateNetlist(text);
    const errors = issues.filter((i) => i.severity === "error");
    return {
      status: errors.length > 0 ? "invalid-input" : "ok",
      capabilityId: request.capabilityId,
      message:
        errors.length > 0
          ? `Netlist has ${errors.length} error(s).`
          : issues.length > 0
            ? `Netlist is usable with ${issues.length} warning(s).`
            : "Netlist looks valid.",
      tables: [],
      scalars: {},
      diagnostics: issues.map((i) => ({ severity: i.severity, message: i.message, source: "validator" })),
      generatedFiles: []
    };
  }
}

function sanitize(relPath: string): string {
  return relPath.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
