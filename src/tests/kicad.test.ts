import { describe, expect, it, vi } from "vitest";
import { parseDrcReport, parseErcReport, parseKicadVersion } from "../lib/adapters/kicad/parse";
import { KicadAdapter } from "../lib/adapters/kicad/adapter";
import { MemoryBridge, sha256Hex } from "../lib/platform/memoryBridge";
import { KicadSubcommand, ProcessResult, ToolRunRequest } from "../lib/platform/bridge";
import {
  BOM_OUTPUT,
  DRC_REPORT_CLEAN,
  DRC_REPORT_CLEAN_10,
  DRC_REPORT_UNKNOWN_SCHEMA,
  DRC_REPORT_WITH_VIOLATIONS,
  DRC_REPORT_WITH_VIOLATIONS_10,
  DRILL_OUTPUTS,
  ERC_REPORT_CLEAN,
  ERC_REPORT_CLEAN_10,
  ERC_REPORT_UNKNOWN_SCHEMA,
  ERC_REPORT_WITH_VIOLATIONS,
  ERC_REPORT_WITH_VIOLATIONS_10,
  GERBER_OUTPUTS,
  KICAD_ERROR_STDERR,
  NETLIST_OUTPUT,
  RENDER_OUTPUT,
  VERSION_OUTPUT_7,
  VERSION_OUTPUT_8,
  VERSION_OUTPUT_9,
  VERSION_OUTPUT_10
} from "./fixtures/kicad";

interface CapabilityCase {
  capabilityId: string;
  inputRelPath: string;
  version: string;
  subcommand: KicadSubcommand;
  outputKind: string;
  outputIsDir: boolean;
  outputFilename?: string;
  outputFiles: Record<string, string>;
  exitCode?: number;
}

const CAPABILITY_CASES: CapabilityCase[] = [
  {
    capabilityId: "kicad.erc",
    inputRelPath: "pcb/design.kicad_sch",
    version: "KiCad 10.0",
    subcommand: "sch-erc",
    outputKind: "report",
    outputIsDir: false,
    outputFilename: "report.json",
    outputFiles: { "report.json": ERC_REPORT_CLEAN_10 }
  },
  {
    capabilityId: "kicad.drc",
    inputRelPath: "pcb/board.kicad_pcb",
    version: "8.0.4",
    subcommand: "pcb-drc",
    outputKind: "report",
    outputIsDir: false,
    outputFilename: "report.json",
    outputFiles: { "report.json": DRC_REPORT_WITH_VIOLATIONS },
    exitCode: 5
  },
  {
    capabilityId: "kicad.export-netlist",
    inputRelPath: "pcb/design.kicad_sch",
    version: "7.0.11",
    subcommand: "sch-export-netlist",
    outputKind: "netlist",
    outputIsDir: false,
    outputFilename: "netlist.net",
    outputFiles: { "netlist.net": NETLIST_OUTPUT }
  },
  {
    capabilityId: "kicad.export-bom",
    inputRelPath: "pcb/design.kicad_sch",
    version: "8.0.4",
    subcommand: "sch-export-bom",
    outputKind: "csv",
    outputIsDir: false,
    outputFilename: "bom.csv",
    outputFiles: { "bom.csv": BOM_OUTPUT }
  },
  {
    capabilityId: "kicad.export-gerbers",
    inputRelPath: "pcb/board.kicad_pcb",
    version: "7.0.11",
    subcommand: "pcb-export-gerbers",
    outputKind: "gerber",
    outputIsDir: true,
    outputFiles: GERBER_OUTPUTS
  },
  {
    capabilityId: "kicad.export-drill",
    inputRelPath: "pcb/board.kicad_pcb",
    version: "7.0.11",
    subcommand: "pcb-export-drill",
    outputKind: "drill",
    outputIsDir: true,
    outputFiles: DRILL_OUTPUTS
  },
  {
    capabilityId: "kicad.render",
    inputRelPath: "pcb/board.kicad_pcb",
    version: "9.0.0",
    subcommand: "pcb-render",
    outputKind: "image",
    outputIsDir: false,
    outputFilename: "render.png",
    outputFiles: { "render.png": RENDER_OUTPUT }
  }
];

const NON_REPORT_CASES = CAPABILITY_CASES.filter((testCase) => testCase.outputKind !== "report");

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

function expectBoundedKicadRequest(request: ToolRunRequest, testCase: CapabilityCase): asserts request is Extract<ToolRunRequest, { tool: "kicad-cli" }> {
  expect(request.tool).toBe("kicad-cli");
  if (request.tool !== "kicad-cli") throw new Error("Expected a typed kicad-cli request.");

  expect(Object.keys(request).sort()).toEqual(["inputRelPath", "outputRelPath", "subcommand", "tool"]);
  expect(request.subcommand).toBe(testCase.subcommand);
  expect(request.inputRelPath).toBe(testCase.inputRelPath);

  const pathParts = request.outputRelPath.split("/");
  expect(pathParts.slice(0, 2)).toEqual(["results", "kicad"]);
  expect(pathParts[2]).toMatch(/^[0-9a-f]{32}$/);
  if (testCase.outputIsDir) {
    expect(pathParts).toHaveLength(3);
  } else {
    expect(pathParts).toHaveLength(4);
    expect(pathParts[3]).toBe(testCase.outputFilename);
  }
}

function seedCapabilityOutput(
  bridge: MemoryBridge,
  workspaceRoot: string,
  outputRelPath: string,
  testCase: CapabilityCase
): void {
  if (testCase.outputIsDir) {
    for (const [name, contents] of Object.entries(testCase.outputFiles)) {
      bridge.seedFile(workspaceRoot, `${outputRelPath}/${name}`, contents);
    }
    return;
  }

  const contents = Object.values(testCase.outputFiles)[0];
  bridge.seedFile(workspaceRoot, outputRelPath, contents);
}

describe("kicad-cli parsing", () => {
  it("parses version strings", () => {
    expect(parseKicadVersion(VERSION_OUTPUT_8)).toMatchObject({ major: 8, minor: 0, patch: 4 });
    expect(parseKicadVersion(VERSION_OUTPUT_7)?.major).toBe(7);
    expect(parseKicadVersion(VERSION_OUTPUT_9)?.major).toBe(9);
    expect(parseKicadVersion(VERSION_OUTPUT_10)).toMatchObject({ major: 10, minor: 0, patch: 0 });
  });

  it("rejects missing, unparseable, unrelated, and unsupported version output", () => {
    expect(() => parseKicadVersion("")).toThrow(/exactly one non-empty banner/);
    expect(() => parseKicadVersion("weird output")).toThrow(/not a recognised kicad-cli banner/);
    expect(() => parseKicadVersion("another-tool 10.0.1")).toThrow(/not a recognised kicad-cli banner/);
    expect(() => parseKicadVersion("KiCad 6.0.11")).toThrow(/unsupported/);
    expect(() => parseKicadVersion("KiCad 11.0")).toThrow(/unsupported/);
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

  it("parses representative KiCad 10 clean and violating reports", () => {
    expect(JSON.parse(DRC_REPORT_CLEAN_10).kicad_version).toBe("10.0.0");
    expect(JSON.parse(ERC_REPORT_WITH_VIOLATIONS_10).kicad_version).toBe("10.0.0");
    expect(parseDrcReport(DRC_REPORT_CLEAN_10)).toMatchObject({ errorCount: 0, warningCount: 0 });
    expect(parseDrcReport(DRC_REPORT_WITH_VIOLATIONS_10)).toMatchObject({ errorCount: 2, warningCount: 1 });
    expect(parseErcReport(ERC_REPORT_CLEAN_10)).toMatchObject({ errorCount: 0, warningCount: 0 });
    expect(parseErcReport(ERC_REPORT_WITH_VIOLATIONS_10)).toMatchObject({ errorCount: 1, warningCount: 1 });
  });

  it("throws on malformed reports", () => {
    expect(() => parseDrcReport("not json")).toThrow(/not valid JSON/);
    expect(() => parseErcReport("[1,2]")).toThrow(/JSON object/);
  });

  it("rejects unknown or structurally changed report schemas instead of returning zero findings", () => {
    expect(() => parseDrcReport(DRC_REPORT_UNKNOWN_SCHEMA)).toThrow(/unsupported schema/);
    expect(() => parseErcReport(ERC_REPORT_UNKNOWN_SCHEMA)).toThrow(/unsupported schema/);
    expect(() => parseDrcReport(JSON.stringify({}))).toThrow(/unsupported schema/);
    expect(() =>
      parseDrcReport(JSON.stringify({ $schema: "https://schemas.kicad.org/drc.v1.json", violations: [] }))
    ).toThrow(/unconnected_items.*array/);
    expect(() =>
      parseErcReport(JSON.stringify({ $schema: "https://schemas.kicad.org/erc.v1.json", sheets: [{}] }))
    ).toThrow(/violations.*array/);
  });
});

describe("kicad adapter", () => {
  const adapter = new KicadAdapter();

  it("reports not-ready with remediation when kicad-cli is missing", async () => {
    const det = await adapter.detect(new MemoryBridge());
    expect(det.ready).toBe(false);
    expect(det.remediation).toMatch(/kicad/i);
  });

  it("fails closed before execution when the detected version is missing or invalid", async () => {
    for (const version of ["", "not a version", "another-tool 10.0.1", "KiCad 11.0"]) {
      const bridge = readyBridge(version);
      let executed = false;
      bridge.onRun = () => {
        executed = true;
        return okProcess();
      };

      const result = await adapter.execute(
        { capabilityId: "kicad.export-netlist", params: { inputRelPath: "pcb/design.kicad_sch" } },
        { bridge, workspaceRoot: "/ws" }
      );
      expect(result.status).toBe("failed");
      expect(result.message).toMatch(/unsupported version banner/);
      expect(executed).toBe(false);
    }
  });

  it("validates input extensions and unsafe paths", () => {
    expect(adapter.validate({ capabilityId: "kicad.drc", params: { inputRelPath: "pcb/board.kicad_pcb" } })).toEqual([]);
    expect(adapter.validate({ capabilityId: "kicad.drc", params: { inputRelPath: "pcb/board.kicad_sch" } })[0].message).toMatch(/kicad_pcb/);
    expect(adapter.validate({ capabilityId: "kicad.erc", params: { inputRelPath: "../evil.kicad_sch" } })[0].message).toMatch(/safe/);
  });

  it("fails before execution when a generated output path collides with stale content", async () => {
    const collisionUuid = "11111111-1111-4111-8111-111111111111";
    const collisionId = collisionUuid.replace(/-/g, "");
    const randomUuid = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(collisionUuid);
    try {
      const bridge = readyBridge("7.0.11");
      bridge.seedFile("/ws", `results/kicad/${collisionId}/stale.net`, "stale output");
      let executed = false;
      bridge.onRun = () => {
        executed = true;
        return okProcess();
      };

      const result = await adapter.execute(
        { capabilityId: "kicad.export-netlist", params: { inputRelPath: "pcb/design.kicad_sch" } },
        { bridge, workspaceRoot: "/ws" }
      );

      expect(result.status).toBe("failed");
      expect(result.message).toMatch(/already contains files.*stopped before execution/);
      expect(result.generatedFiles).toEqual([]);
      expect(executed).toBe(false);
    } finally {
      randomUuid.mockRestore();
    }
  });

  it("keeps generated output paths bounded for a near-limit input path", async () => {
    const inputRelPath = `${"a/".repeat(2000)}design.kicad_sch`;
    expect(inputRelPath.length).toBeGreaterThan(4000);
    expect(inputRelPath.length).toBeLessThanOrEqual(4096);
    const testCase: CapabilityCase = {
      ...CAPABILITY_CASES.find((candidate) => candidate.capabilityId === "kicad.export-netlist")!,
      inputRelPath
    };
    const bridge = readyBridge(testCase.version);
    bridge.seedFile("/ws", inputRelPath, "(kicad_sch ...)");
    let outputRelPath = "";
    bridge.onRun = (request, options) => {
      expectBoundedKicadRequest(request, testCase);
      outputRelPath = request.outputRelPath;
      seedCapabilityOutput(bridge, options.workspaceRoot, request.outputRelPath, testCase);
      return okProcess();
    };

    const result = await adapter.execute(
      { capabilityId: testCase.capabilityId, params: { inputRelPath } },
      { bridge, workspaceRoot: "/ws" }
    );

    expect(result.status).toBe("ok");
    expect(outputRelPath.length).toBeLessThan(100);
    expect(outputRelPath).toMatch(/^results\/kicad\/[0-9a-f]{32}\/netlist\.net$/);
  });

  it.each(CAPABILITY_CASES)(
    "runs $capabilityId through its typed command and returns fresh hashed outputs",
    async (testCase) => {
      const bridge = readyBridge(testCase.version);
      let outputRelPath = "";
      bridge.onRun = (request, options) => {
        expectBoundedKicadRequest(request, testCase);
        expect(options.workspaceRoot).toBe("/ws");
        expect(options.timeoutMs).toBe(4321);
        outputRelPath = request.outputRelPath;
        seedCapabilityOutput(bridge, options.workspaceRoot, request.outputRelPath, testCase);
        return okProcess({ exitCode: testCase.exitCode ?? 0 });
      };

      const result = await adapter.execute(
        {
          capabilityId: testCase.capabilityId,
          params: {
            inputRelPath: testCase.inputRelPath,
            executablePath: "C:/untrusted/arbitrary.exe",
            args: ["--untrusted-flag"]
          }
        },
        { bridge, workspaceRoot: "/ws", timeoutMs: 4321 }
      );

      expect(result.status).toBe("ok");
      expect(result.toolVersion).toBe(testCase.version);
      expect(outputRelPath).not.toBe("");
      expect(result.generatedFiles.map((file) => file.kind)).toEqual(
        Array(Object.keys(testCase.outputFiles).length).fill(testCase.outputKind)
      );
      expect(result.generatedFiles.map((file) => file.sha256).sort()).toEqual(
        Object.values(testCase.outputFiles).map(sha256Hex).sort()
      );

      const expectedPaths = testCase.outputIsDir
        ? Object.keys(testCase.outputFiles).sort().map((name) => `${outputRelPath}/${name}`)
        : [outputRelPath];
      expect(result.generatedFiles.map((file) => file.relPath).sort()).toEqual(expectedPaths);
    }
  );

  it.each(CAPABILITY_CASES)("fails $capabilityId when the current execution writes no output", async (testCase) => {
    const bridge = readyBridge(testCase.version);
    bridge.onRun = (request) => {
      expectBoundedKicadRequest(request, testCase);
      return okProcess();
    };

    const result = await adapter.execute(
      { capabilityId: testCase.capabilityId, params: { inputRelPath: testCase.inputRelPath } },
      { bridge, workspaceRoot: "/ws" }
    );

    expect(result.status).toBe("failed");
    expect(result.generatedFiles).toEqual([]);
    expect(result.message).toMatch(/without writing a report|produced no files|was not created/);
  });

  it.each(NON_REPORT_CASES)(
    "does not accept $capabilityId output left by a previous successful execution",
    async (testCase) => {
      const bridge = readyBridge(testCase.version);
      const outputPaths: string[] = [];
      bridge.onRun = (request, options) => {
        expectBoundedKicadRequest(request, testCase);
        outputPaths.push(request.outputRelPath);
        seedCapabilityOutput(bridge, options.workspaceRoot, request.outputRelPath, testCase);
        return okProcess();
      };

      const request = { capabilityId: testCase.capabilityId, params: { inputRelPath: testCase.inputRelPath } };
      const first = await adapter.execute(request, { bridge, workspaceRoot: "/ws" });
      expect(first.status).toBe("ok");

      bridge.onRun = (runRequest) => {
        expectBoundedKicadRequest(runRequest, testCase);
        outputPaths.push(runRequest.outputRelPath);
        return okProcess();
      };
      const second = await adapter.execute(request, { bridge, workspaceRoot: "/ws" });

      expect(outputPaths).toHaveLength(2);
      expect(outputPaths[1]).not.toBe(outputPaths[0]);
      expect(second.status).toBe("failed");
      expect(second.generatedFiles).toEqual([]);
    }
  );

  it.each(CAPABILITY_CASES)("maps $capabilityId cancellation without accepting output", async (testCase) => {
    const bridge = readyBridge(testCase.version);
    const controller = new AbortController();
    controller.abort();
    let executed = false;
    bridge.onRun = () => {
      executed = true;
      return okProcess();
    };

    const result = await adapter.execute(
      { capabilityId: testCase.capabilityId, params: { inputRelPath: testCase.inputRelPath } },
      { bridge, workspaceRoot: "/ws", signal: controller.signal }
    );

    expect(result.status).toBe("cancelled");
    expect(result.generatedFiles).toEqual([]);
    expect(executed).toBe(false);
  });

  it.each(CAPABILITY_CASES)("maps $capabilityId timeout without accepting output", async (testCase) => {
    const bridge = readyBridge(testCase.version);
    bridge.onRun = (request, options) => {
      expectBoundedKicadRequest(request, testCase);
      expect(options.timeoutMs).toBe(25);
      return okProcess({ exitCode: null, timedOut: true, durationMs: 25 });
    };

    const result = await adapter.execute(
      { capabilityId: testCase.capabilityId, params: { inputRelPath: testCase.inputRelPath } },
      { bridge, workspaceRoot: "/ws", timeoutMs: 25 }
    );

    expect(result.status).toBe("timeout");
    expect(result.durationMs).toBe(25);
    expect(result.generatedFiles).toEqual([]);
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
    expect(result.message).toMatch(/without writing a report/);
    expect(result.message).toMatch(/Unable to load/);
  });

  it("does not report a stale ERC report when a rerun writes nothing", async () => {
    const bridge = readyBridge();
    const outputPaths: string[] = [];
    // First run writes a real report.
    bridge.onRun = (req, opts) => {
      if (req.tool === "kicad-cli") {
        outputPaths.push(req.outputRelPath);
        bridge.seedFile(opts.workspaceRoot, req.outputRelPath, ERC_REPORT_CLEAN);
      }
      return okProcess();
    };
    const req = { capabilityId: "kicad.erc", params: { inputRelPath: "pcb/design.kicad_sch" } };
    const first = await adapter.execute(req, { bridge, workspaceRoot: "/ws" });
    expect(first.status).toBe("ok");
    // Second run fails to write (e.g. corrupt design) but exits 0.
    bridge.onRun = (runRequest) => {
      if (runRequest.tool === "kicad-cli") outputPaths.push(runRequest.outputRelPath);
      return okProcess();
    };
    const second = await adapter.execute(req, { bridge, workspaceRoot: "/ws" });
    expect(second.status).toBe("failed");
    expect(second.message).toMatch(/without writing a report/);
    expect(outputPaths).toHaveLength(2);
    expect(outputPaths[1]).not.toBe(outputPaths[0]);
  });

  it.each([
    { capabilityId: "kicad.erc", inputRelPath: "pcb/design.kicad_sch" },
    { capabilityId: "kicad.drc", inputRelPath: "pcb/board.kicad_pcb" }
  ])("gates $capabilityId to KiCad 8 or newer", async ({ capabilityId, inputRelPath }) => {
    const result = await adapter.execute(
      { capabilityId, params: { inputRelPath } },
      { bridge: readyBridge("7.0.11"), workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("failed");
    expect(result.message).toMatch(/requires kicad-cli 8.0 or newer/);
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
