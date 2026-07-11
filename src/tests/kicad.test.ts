import { describe, expect, it } from "vitest";
import { parseDrcReport, parseErcReport, parseKicadVersion } from "../lib/adapters/kicad/parse";
import { KicadAdapter } from "../lib/adapters/kicad/adapter";
import { MemoryBridge } from "../lib/platform/memoryBridge";
import { ProcessResult } from "../lib/platform/bridge";
import {
  DRC_REPORT_CLEAN,
  DRC_REPORT_WITH_VIOLATIONS,
  ERC_REPORT_CLEAN,
  ERC_REPORT_WITH_VIOLATIONS,
  KICAD_ERROR_STDERR,
  VERSION_OUTPUT_7,
  VERSION_OUTPUT_8,
  VERSION_OUTPUT_9
} from "./fixtures/kicad";

function okProcess(partial: Partial<ProcessResult> = {}): ProcessResult {
  return { exitCode: 0, stdout: "", stderr: "", timedOut: false, cancelled: false, truncated: false, durationMs: 30, ...partial };
}

function readyBridge(version = "8.0.4"): MemoryBridge {
  const bridge = new MemoryBridge();
  bridge.detections.set("kicad-cli", { found: true, path: "C:/Program Files/KiCad/8.0/bin/kicad-cli.exe", version });
  bridge.seedFile("/ws", "pcb/board.kicad_pcb", "(kicad_pcb ...)");
  bridge.seedFile("/ws", "pcb/design.kicad_sch", "(kicad_sch ...)");
  return bridge;
}

describe("kicad-cli parsing", () => {
  it("parses version strings", () => {
    expect(parseKicadVersion(VERSION_OUTPUT_8)).toMatchObject({ major: 8, minor: 0, patch: 4 });
    expect(parseKicadVersion(VERSION_OUTPUT_7)?.major).toBe(7);
    expect(parseKicadVersion(VERSION_OUTPUT_9)?.major).toBe(9);
    expect(parseKicadVersion("weird output")).toBeNull();
  });

  it("parses clean and violating DRC reports", () => {
    expect(parseDrcReport(DRC_REPORT_CLEAN)).toMatchObject({ errorCount: 0, warningCount: 0 });
    const findings = parseDrcReport(DRC_REPORT_WITH_VIOLATIONS);
    expect(findings.errorCount).toBe(2); // clearance + unconnected
    expect(findings.warningCount).toBe(1);
    expect(findings.diagnostics[0].message).toMatch(/Clearance violation/);
    expect(findings.diagnostics[0].location).toMatch(/105.2 mm/);
  });

  it("parses clean and violating ERC reports with sheet locations", () => {
    expect(parseErcReport(ERC_REPORT_CLEAN)).toMatchObject({ errorCount: 0, warningCount: 0 });
    const findings = parseErcReport(ERC_REPORT_WITH_VIOLATIONS);
    expect(findings.errorCount).toBe(1);
    expect(findings.warningCount).toBe(1);
    expect(findings.diagnostics[0].source).toBe("kicad-cli erc");
  });

  it("throws on malformed reports", () => {
    expect(() => parseDrcReport("not json")).toThrow(/not valid JSON/);
    expect(() => parseErcReport("[1,2]")).toThrow(/JSON object/);
  });
});

describe("kicad adapter", () => {
  const adapter = new KicadAdapter();

  it("reports not-ready with remediation when kicad-cli is missing", async () => {
    const det = await adapter.detect(new MemoryBridge());
    expect(det.ready).toBe(false);
    expect(det.remediation).toMatch(/kicad/i);
  });

  it("validates input extensions and unsafe paths", () => {
    expect(adapter.validate({ capabilityId: "kicad.drc", params: { inputRelPath: "pcb/board.kicad_pcb" } })).toEqual([]);
    expect(adapter.validate({ capabilityId: "kicad.drc", params: { inputRelPath: "pcb/board.kicad_sch" } })[0].message).toMatch(/kicad_pcb/);
    expect(adapter.validate({ capabilityId: "kicad.erc", params: { inputRelPath: "../evil.kicad_sch" } })[0].message).toMatch(/safe/);
  });

  it("runs a DRC and returns structured findings", async () => {
    const bridge = readyBridge();
    bridge.onRun = (req, opts) => {
      expect(req.tool).toBe("kicad-cli");
      if (req.tool === "kicad-cli") {
        expect(req.subcommand).toBe("pcb-drc");
        bridge.seedFile(opts.workspaceRoot, req.outputRelPath, DRC_REPORT_WITH_VIOLATIONS);
      }
      // Non-zero exit: kicad-cli signals violations via exit code.
      return okProcess({ exitCode: 5 });
    };
    const result = await adapter.execute(
      { capabilityId: "kicad.drc", params: { inputRelPath: "pcb/board.kicad_pcb" } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("ok");
    expect(result.scalars).toEqual({ errorCount: 2, warningCount: 1 });
    expect(result.message).toMatch(/2 error/);
    expect(result.generatedFiles[0].kind).toBe("report");
  });

  it("passes a clean ERC", async () => {
    const bridge = readyBridge();
    bridge.onRun = (req, opts) => {
      if (req.tool === "kicad-cli") bridge.seedFile(opts.workspaceRoot, req.outputRelPath, ERC_REPORT_CLEAN);
      return okProcess();
    };
    const result = await adapter.execute(
      { capabilityId: "kicad.erc", params: { inputRelPath: "pcb/design.kicad_sch" } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("ok");
    expect(result.message).toMatch(/passed with no findings/);
  });

  it("fails usefully when the design cannot be loaded (no report produced)", async () => {
    const bridge = readyBridge();
    bridge.onRun = () => okProcess({ exitCode: 2, stderr: KICAD_ERROR_STDERR });
    const result = await adapter.execute(
      { capabilityId: "kicad.erc", params: { inputRelPath: "pcb/design.kicad_sch" } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("failed");
    expect(result.message).toMatch(/produced no report/);
    expect(result.message).toMatch(/Unable to load/);
  });

  it("gates capabilities on the detected version", async () => {
    const bridge = readyBridge("7.0.11");
    const result = await adapter.execute(
      { capabilityId: "kicad.export-bom", params: { inputRelPath: "pcb/design.kicad_sch" } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("failed");
    expect(result.message).toMatch(/requires kicad-cli 8.0 or newer; detected 7.0.11/);

    const render = await adapter.execute(
      { capabilityId: "kicad.render", params: { inputRelPath: "pcb/board.kicad_pcb" } },
      { bridge: readyBridge("8.0.4"), workspaceRoot: "/ws" }
    );
    expect(render.status).toBe("failed");
    expect(render.message).toMatch(/requires kicad-cli 9.0/);
  });

  it("inventories gerber outputs with hashes", async () => {
    const bridge = readyBridge();
    bridge.onRun = (req, opts) => {
      if (req.tool === "kicad-cli") {
        bridge.seedFile(opts.workspaceRoot, `${req.outputRelPath}/board-F_Cu.gtl`, "G04 gerber*");
        bridge.seedFile(opts.workspaceRoot, `${req.outputRelPath}/board-B_Cu.gbl`, "G04 gerber*");
      }
      return okProcess();
    };
    const result = await adapter.execute(
      { capabilityId: "kicad.export-gerbers", params: { inputRelPath: "pcb/board.kicad_pcb" } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("ok");
    expect(result.generatedFiles).toHaveLength(2);
    expect(result.generatedFiles.every((f) => f.sha256?.length === 64)).toBe(true);
  });

  it("fails when an export claims success but writes nothing", async () => {
    const bridge = readyBridge();
    bridge.onRun = () => okProcess();
    const result = await adapter.execute(
      { capabilityId: "kicad.export-netlist", params: { inputRelPath: "pcb/design.kicad_sch" } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("failed");
    expect(result.message).toMatch(/was not created/);
  });

  it("maps timeout and missing input to structured results", async () => {
    const bridge = readyBridge();
    bridge.onRun = () => okProcess({ exitCode: null, timedOut: true });
    const timedOut = await adapter.execute(
      { capabilityId: "kicad.drc", params: { inputRelPath: "pcb/board.kicad_pcb" } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(timedOut.status).toBe("timeout");

    const missing = await adapter.execute(
      { capabilityId: "kicad.drc", params: { inputRelPath: "pcb/nonexistent.kicad_pcb" } },
      { bridge: readyBridge(), workspaceRoot: "/ws" }
    );
    expect(missing.status).toBe("invalid-input");
    expect(missing.message).toMatch(/does not exist/);
  });
});
