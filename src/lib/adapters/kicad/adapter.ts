// KiCad CLI adapter (contract v1): validation and export against an already
// installed kicad-cli, executed through the platform bridge. Capabilities are
// gated on the detected KiCad version; unsupported commands fail with a clear
// explanation instead of invoking the tool.

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
import { KicadSubcommand, PlatformBridge } from "../../platform/bridge";
import { isSafeRelPath } from "../../platform/paths";
import { parseDrcReport, parseErcReport, parseKicadVersion } from "./parse";

export const KICAD_REMEDIATION =
  "Install KiCad 7 or newer (https://www.kicad.org/download/) and either add kicad-cli to PATH " +
  "or set its location in Diagnostics → KiCad → executable path.";

interface CapabilitySpec {
  id: string;
  title: string;
  description: string;
  subcommand: KicadSubcommand;
  /** Minimum kicad-cli major version that supports the subcommand. */
  minMajor: number;
  input: "schematic" | "pcb";
  /** Whether outputRelPath names a directory (gerbers/drill) or a file. */
  outputIsDir: boolean;
  outputKind: string;
}

const CAPABILITIES: CapabilitySpec[] = [
  { id: "kicad.erc", title: "Schematic ERC", description: "Electrical rules check with structured findings.", subcommand: "sch-erc", minMajor: 8, input: "schematic", outputIsDir: false, outputKind: "report" },
  { id: "kicad.drc", title: "PCB DRC", description: "Design rules check with structured findings.", subcommand: "pcb-drc", minMajor: 8, input: "pcb", outputIsDir: false, outputKind: "report" },
  { id: "kicad.export-netlist", title: "Netlist export", description: "Export the schematic netlist.", subcommand: "sch-export-netlist", minMajor: 7, input: "schematic", outputIsDir: false, outputKind: "netlist" },
  { id: "kicad.export-bom", title: "BOM export", description: "Export the bill of materials as CSV.", subcommand: "sch-export-bom", minMajor: 8, input: "schematic", outputIsDir: false, outputKind: "csv" },
  { id: "kicad.export-gerbers", title: "Gerber export", description: "Export fabrication gerbers.", subcommand: "pcb-export-gerbers", minMajor: 7, input: "pcb", outputIsDir: true, outputKind: "gerber" },
  { id: "kicad.export-drill", title: "Drill export", description: "Export drill files.", subcommand: "pcb-export-drill", minMajor: 7, input: "pcb", outputIsDir: true, outputKind: "drill" },
  { id: "kicad.render", title: "PCB render", description: "Raytraced board image (KiCad 9+).", subcommand: "pcb-render", minMajor: 9, input: "pcb", outputIsDir: false, outputKind: "image" }
];

export interface KicadAdapterOptions {
  executablePath?: string;
}

export class KicadAdapter implements EngineAdapter {
  readonly contractVersion = ADAPTER_CONTRACT_VERSION;

  constructor(private options: KicadAdapterOptions = {}) {}

  describe(): AdapterInfo {
    return {
      id: "kicad",
      name: "KiCad CLI",
      kind: "external",
      contractVersion: ADAPTER_CONTRACT_VERSION,
      capabilities: CAPABILITIES.map(({ id, title, description }) => ({ id, title, description }))
    };
  }

  async detect(bridge: PlatformBridge | null): Promise<DetectionResult> {
    if (!bridge) {
      return { ready: false, error: "External tools require the desktop app.", remediation: "Run the Engineering Workbench desktop build." };
    }
    const det = await bridge.detectTool("kicad-cli", this.options.executablePath);
    if (!det.found) {
      return { ready: false, error: det.error ?? "kicad-cli was not found.", remediation: KICAD_REMEDIATION };
    }
    return { ready: true, executablePath: det.path, version: det.version };
  }

  validate(request: AdapterRequest): ValidationIssue[] {
    const spec = CAPABILITIES.find((c) => c.id === request.capabilityId);
    if (!spec) return [{ severity: "error", message: `Unknown capability "${request.capabilityId}".` }];
    const issues: ValidationIssue[] = [];
    const input = request.params.inputRelPath;
    if (typeof input !== "string" || !isSafeRelPath(input)) {
      issues.push({ severity: "error", message: "inputRelPath must be a safe workspace-relative path.", field: "inputRelPath" });
    } else {
      const expectedExt = spec.input === "schematic" ? ".kicad_sch" : ".kicad_pcb";
      if (!input.endsWith(expectedExt)) {
        issues.push({ severity: "error", message: `${spec.title} needs a ${expectedExt} file (got "${input}").`, field: "inputRelPath" });
      }
    }
    return issues;
  }

  async execute(request: AdapterRequest, ctx: ExecutionContext): Promise<AdapterResult> {
    const spec = CAPABILITIES.find((c) => c.id === request.capabilityId);
    if (!spec) return failureResult(request.capabilityId, "invalid-input", `Unknown capability "${request.capabilityId}".`);

    const errors = this.validate(request).filter((i) => i.severity === "error");
    if (errors.length > 0) {
      return failureResult(request.capabilityId, "invalid-input", errors.map((e) => e.message).join(" "));
    }
    if (!ctx.bridge || !ctx.workspaceRoot) {
      return failureResult(request.capabilityId, "tool-missing", "KiCad operations need the desktop app with an open workspace.");
    }
    const detection = await this.detect(ctx.bridge);
    if (!detection.ready) {
      return failureResult(request.capabilityId, "tool-missing", `${detection.error} ${detection.remediation ?? ""}`.trim());
    }
    const version = parseKicadVersion(detection.version ?? "");
    if (version && version.major < spec.minMajor) {
      return failureResult(
        request.capabilityId,
        "failed",
        `${spec.title} requires kicad-cli ${spec.minMajor}.0 or newer; detected ${version.raw}. Update KiCad to use this capability.`
      );
    }

    const bridge = ctx.bridge;
    const root = ctx.workspaceRoot;
    const inputRelPath = request.params.inputRelPath as string;
    if (!(await bridge.fileExists(root, inputRelPath))) {
      return failureResult(request.capabilityId, "invalid-input", `Input file "${inputRelPath}" does not exist in the workspace.`);
    }

    const runId = `${request.capabilityId.replace(/\./g, "-")}-${sanitize(inputRelPath)}`;
    const outputRelPath = spec.outputIsDir
      ? `results/${runId}`
      : `results/${runId}.${outputExtension(spec)}`;
    await bridge.createDirAll(root, spec.outputIsDir ? outputRelPath : "results");

    // Guard against a stale report being read as a fresh result: overwrite the
    // output file with a sentinel before the run. kicad-cli erc/drc exits 0
    // even with violations, so "did the tool write a fresh report" is the
    // reliable success signal, not the exit code.
    const sentinel = `__ewb_no_report__${runId}__`;
    const isReportRun = spec.subcommand === "sch-erc" || spec.subcommand === "pcb-drc";
    if (isReportRun && !spec.outputIsDir) {
      await bridge.writeTextFileAtomic(root, outputRelPath, sentinel);
    }

    const proc = await bridge.runTool(
      { tool: "kicad-cli", subcommand: spec.subcommand, inputRelPath, outputRelPath },
      { workspaceRoot: root, timeoutMs: ctx.timeoutMs, signal: ctx.signal, toolPathOverride: this.options.executablePath }
    );

    const raw = { stdout: proc.stdout, stderr: proc.stderr, truncated: proc.truncated };
    if (proc.cancelled) return failureResult(request.capabilityId, "cancelled", "Operation cancelled by the user.", { raw });
    if (proc.timedOut) {
      return failureResult(request.capabilityId, "timeout", `kicad-cli did not finish within the time limit and was stopped.`, {
        raw,
        durationMs: proc.durationMs
      });
    }

    // ERC/DRC: success is signalled by a freshly written report (kicad-cli
    // exits 0 even when the design has violations), not by the exit code.
    if (isReportRun) {
      let reportText: string;
      try {
        reportText = await bridge.readTextFile(root, outputRelPath);
      } catch {
        return failureResult(
          request.capabilityId,
          "failed",
          `kicad-cli exited with code ${proc.exitCode ?? "unknown"} and produced no report. ${firstLine(proc.stderr)}`.trim(),
          { raw, durationMs: proc.durationMs, toolVersion: detection.version }
        );
      }
      if (reportText.trim() === sentinel) {
        return failureResult(
          request.capabilityId,
          "failed",
          `kicad-cli exited with code ${proc.exitCode ?? "unknown"} without writing a report. ${firstLine(proc.stderr) || firstLine(proc.stdout)}`.trim(),
          { raw, durationMs: proc.durationMs, toolVersion: detection.version }
        );
      }
      try {
        const findings = spec.subcommand === "sch-erc" ? parseErcReport(reportText) : parseDrcReport(reportText);
        const generatedFiles: GeneratedFile[] = [
          { relPath: outputRelPath, kind: "report", description: `${spec.title} JSON report`, sha256: await bridge.hashFile(root, outputRelPath) }
        ];
        return {
          status: "ok",
          capabilityId: request.capabilityId,
          message:
            findings.errorCount + findings.warningCount === 0
              ? `${spec.title} passed with no findings.`
              : `${spec.title} found ${findings.errorCount} error(s) and ${findings.warningCount} warning(s).`,
          tables: [],
          scalars: { errorCount: findings.errorCount, warningCount: findings.warningCount },
          diagnostics: findings.diagnostics,
          generatedFiles,
          raw,
          durationMs: proc.durationMs,
          toolVersion: detection.version
        };
      } catch (err) {
        return failureResult(
          request.capabilityId,
          "failed",
          `kicad-cli produced a report that could not be parsed: ${err instanceof Error ? err.message : String(err)}`,
          { raw, durationMs: proc.durationMs, toolVersion: detection.version }
        );
      }
    }

    // Export subcommands: non-zero exit means failure; otherwise inventory outputs.
    if (proc.exitCode !== 0) {
      return failureResult(
        request.capabilityId,
        "failed",
        `kicad-cli exited with code ${proc.exitCode ?? "unknown"}. ${firstLine(proc.stderr) || firstLine(proc.stdout)}`.trim(),
        { raw, durationMs: proc.durationMs, toolVersion: detection.version }
      );
    }
    const generatedFiles: GeneratedFile[] = [];
    if (spec.outputIsDir) {
      const names = await bridge.listDir(root, outputRelPath);
      for (const name of names) {
        const rel = `${outputRelPath}/${name}`;
        generatedFiles.push({ relPath: rel, kind: spec.outputKind, sha256: await bridge.hashFile(root, rel) });
      }
      if (generatedFiles.length === 0) {
        return failureResult(request.capabilityId, "failed", `${spec.title} reported success but produced no files in ${outputRelPath}.`, {
          raw,
          durationMs: proc.durationMs,
          toolVersion: detection.version
        });
      }
    } else {
      if (!(await bridge.fileExists(root, outputRelPath))) {
        return failureResult(request.capabilityId, "failed", `${spec.title} reported success but ${outputRelPath} was not created.`, {
          raw,
          durationMs: proc.durationMs,
          toolVersion: detection.version
        });
      }
      generatedFiles.push({ relPath: outputRelPath, kind: spec.outputKind, sha256: await bridge.hashFile(root, outputRelPath) });
    }
    return {
      status: "ok",
      capabilityId: request.capabilityId,
      message: `${spec.title} completed: ${generatedFiles.length} file(s) in results/.`,
      tables: [],
      scalars: { fileCount: generatedFiles.length },
      diagnostics: [],
      generatedFiles,
      raw,
      durationMs: proc.durationMs,
      toolVersion: detection.version
    };
  }
}

function outputExtension(spec: CapabilitySpec): string {
  switch (spec.outputKind) {
    case "report":
      return "report.json";
    case "csv":
      return "bom.csv";
    case "netlist":
      return "net";
    case "image":
      return "png";
    default:
      return "out";
  }
}

function sanitize(relPath: string): string {
  return relPath.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function firstLine(text: string): string {
  return text.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? "";
}
