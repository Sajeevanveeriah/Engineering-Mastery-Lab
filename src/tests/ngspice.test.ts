import { describe, expect, it } from "vitest";
import { buildRunDeck, validateAnalysis, validateNetlist } from "../lib/adapters/ngspice/netlist";
import { extractDiagnostics, parseNgspiceVersion, parseOpOutput, parseWrData } from "../lib/adapters/ngspice/parse";
import { NgspiceAdapter } from "../lib/adapters/ngspice/adapter";
import { MemoryBridge } from "../lib/platform/memoryBridge";
import { ProcessResult } from "../lib/platform/bridge";
import {
  AC_WRDATA,
  DC_WRDATA_NO_HEADER,
  ERROR_STDERR,
  MALFORMED_WRDATA,
  OP_STDOUT,
  TRAN_WRDATA,
  VERSION_OUTPUT
} from "./fixtures/ngspice";

const RC_NETLIST = `* RC low-pass filter
V1 in 0 AC 1 PULSE(0 5 0 1u 1u 1 2)
R1 in out 1k
C1 out 0 100n
.end
`;

function okProcess(partial: Partial<ProcessResult> = {}): ProcessResult {
  return { exitCode: 0, stdout: "", stderr: "", timedOut: false, cancelled: false, truncated: false, durationMs: 12, ...partial };
}

function readyBridge(): MemoryBridge {
  const bridge = new MemoryBridge();
  bridge.detections.set("ngspice", { found: true, path: "C:/Spice64/bin/ngspice.exe", version: "44" });
  bridge.seedFile("/ws", "circuits/rc.cir", RC_NETLIST);
  return bridge;
}

describe("netlist validation", () => {
  it("accepts a well-formed netlist", () => {
    expect(validateNetlist(RC_NETLIST).filter((i) => i.severity === "error")).toEqual([]);
  });

  it("rejects empty netlists, missing .end, and .control blocks", () => {
    expect(validateNetlist("")[0].message).toMatch(/empty/);
    expect(validateNetlist("* title\nR1 a b 1k\n").some((i) => i.message.includes(".end"))).toBe(true);
    const withControl = "* t\nR1 a b 1k\n.control\nshell rm -rf /\n.endc\n.end\n";
    const issues = validateNetlist(withControl);
    expect(issues.some((i) => i.message.includes(".control"))).toBe(true);
    expect(issues.some((i) => i.message.includes("shell"))).toBe(true);
  });

  it("catches .control smuggled across a SPICE continuation line", () => {
    // ".cont" + "+rol" reassembles to ".control" in ngspice's parser.
    const split = "* t\nR1 a b 1k\n.cont\n+rol\nshell echo pwned\n.endc\n.end\n";
    const issues = validateNetlist(split);
    expect(issues.some((i) => i.message.includes(".control"))).toBe(true);
    // shell escape split across a continuation too
    const splitShell = "* t\nR1 a b 1k\n.control\nsh\n+ell echo pwned\n.endc\n.end\n";
    expect(validateNetlist(splitShell).some((i) => i.message.includes("shell"))).toBe(true);
  });

  it("validates analysis parameters", () => {
    expect(validateAnalysis({ kind: "dc", source: "V1", start: 0, stop: 5, step: 0.1 }, ["v(out)"])).toEqual([]);
    expect(validateAnalysis({ kind: "dc", source: "V1; rm", start: 0, stop: 5, step: 0.1 }, ["v(out)"])[0].message).toMatch(/Invalid swept source/);
    expect(validateAnalysis({ kind: "ac", pointsPerDecade: 10, fStart: 100, fStop: 10 }, ["v(out)"])[0].message).toMatch(/fStop/);
    expect(validateAnalysis({ kind: "tran", tStep: 1e-5, tStop: 1e-2 }, [])[0].message).toMatch(/output vector/);
    expect(
      validateAnalysis({ kind: "tran", tStep: 1e-5, tStop: 1e-2 }, ["v(out); shell"])[0].message
    ).toMatch(/Invalid vector expression/);
  });
});

describe("run deck generation", () => {
  it("appends a control block before .end for a transient run", () => {
    const deck = buildRunDeck(RC_NETLIST, { kind: "tran", tStep: 1e-5, tStop: 1e-3 }, ["v(out)"], "results/run.data.txt");
    expect(deck).toContain(".control");
    expect(deck).toContain("tran 1.000000e-5".replace("e-5", "e-5") /* format check below */);
    expect(deck).toMatch(/tran 1\.000000e-0?5 1\.000000e-0?3/);
    expect(deck).toContain("wrdata results/run.data.txt v(out)");
    // control block comes before the final .end
    expect(deck.indexOf(".control")).toBeLessThan(deck.lastIndexOf(".end"));
    expect(deck.trim().endsWith(".end")).toBe(true);
  });

  it("records magnitude and phase for AC analyses", () => {
    const deck = buildRunDeck(RC_NETLIST, { kind: "ac", pointsPerDecade: 20, fStart: 10, fStop: 1e5 }, ["v(out)"], "results/ac.txt");
    expect(deck).toContain("wrdata results/ac.txt mag(v(out)) ph(v(out))");
    expect(deck).toMatch(/ac dec 20/);
  });

  it("uses print all for the operating point", () => {
    const deck = buildRunDeck(RC_NETLIST, { kind: "op" }, [], "results/op.txt");
    expect(deck).toContain("op");
    expect(deck).toContain("print all");
    expect(deck).not.toContain("wrdata");
  });
});

describe("output parsing", () => {
  it("parses versions", () => {
    expect(parseNgspiceVersion(VERSION_OUTPUT)).toBe("44");
    expect(parseNgspiceVersion("garbage")).toBeNull();
  });

  it("parses wrdata with header", () => {
    const table = parseWrData(TRAN_WRDATA, "tran");
    expect(table.columns.map((c) => c.name)).toEqual(["time", "v(out)"]);
    expect(table.columns[0].values).toHaveLength(6);
    expect(table.columns[1].values[5]).toBeCloseTo(3.934693, 5);
  });

  it("parses wrdata without header using generated names", () => {
    const table = parseWrData(DC_WRDATA_NO_HEADER, "dc");
    expect(table.columns.map((c) => c.name)).toEqual(["scale", "col1"]);
    expect(table.columns[1].values[3]).toBeCloseTo(2.0, 6);
  });

  it("parses AC magnitude/phase columns", () => {
    const table = parseWrData(AC_WRDATA, "ac");
    expect(table.columns.map((c) => c.name)).toEqual(["frequency", "mag(v(out))", "ph(v(out))"]);
  });

  it("throws on malformed and empty data", () => {
    expect(() => parseWrData(MALFORMED_WRDATA, "x")).toThrow(/Malformed/);
    expect(() => parseWrData("", "x")).toThrow(/empty/);
    expect(() => parseWrData("time v(out)\n", "x")).toThrow(/no data rows/);
  });

  it("parses operating-point scalars", () => {
    const scalars = parseOpOutput(OP_STDOUT);
    expect(scalars["v(out)"]).toBeCloseTo(3.333333, 5);
    expect(scalars["v1#branch"]).toBeCloseTo(-1.666667e-3, 8);
  });

  it("extracts error diagnostics", () => {
    const diags = extractDiagnostics("", ERROR_STDERR);
    expect(diags.filter((d) => d.severity === "error")).toHaveLength(2);
    expect(diags[0].message).toMatch(/unknown subckt/);
  });
});

describe("ngspice adapter execution (memory bridge)", () => {
  it("reports not-ready with remediation when ngspice is missing", async () => {
    const adapter = new NgspiceAdapter();
    const det = await adapter.detect(new MemoryBridge());
    expect(det.ready).toBe(false);
    expect(det.remediation).toMatch(/ngspice/);
  });

  it("runs a transient analysis end to end, exporting CSV", async () => {
    const bridge = readyBridge();
    bridge.onRun = (req, opts) => {
      expect(req.tool).toBe("ngspice");
      if (req.tool === "ngspice") {
        expect(req.netlistRelPath).toMatch(/^simulations\/.*\.deck\.cir$/);
      }
      // Simulate ngspice writing the wrdata file into the workspace.
      bridge.seedFile(opts.workspaceRoot, "results/ngspice-tran-circuits-rc-cir.data.txt", TRAN_WRDATA);
      return okProcess({ stdout: "ngspice-44 done" });
    };
    const adapter = new NgspiceAdapter();
    const result = await adapter.execute(
      {
        capabilityId: "ngspice.tran",
        params: {
          netlistRelPath: "circuits/rc.cir",
          analysis: { kind: "tran", tStep: 1e-5, tStop: 1e-3 },
          vectors: ["v(out)"]
        }
      },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("ok");
    expect(result.tables[0].columns[0].name).toBe("time");
    const kinds = result.generatedFiles.map((f) => f.kind).sort();
    expect(kinds).toEqual(["csv", "netlist", "raw"]);
    const csvFile = result.generatedFiles.find((f) => f.kind === "csv")!;
    expect(csvFile.sha256).toMatch(/^[0-9a-f]{64}$/);
    const csv = await bridge.readTextFile("/ws", csvFile.relPath);
    expect(csv.split("\r\n")[0]).toBe("time,v(out)");
  });

  it("solves an operating point from stdout", async () => {
    const bridge = readyBridge();
    bridge.onRun = () => okProcess({ stdout: OP_STDOUT });
    const adapter = new NgspiceAdapter();
    const result = await adapter.execute(
      { capabilityId: "ngspice.op", params: { netlistRelPath: "circuits/rc.cir", analysis: { kind: "op" }, vectors: [] } },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("ok");
    expect(result.scalars["v(out)"]).toBeCloseTo(3.333333, 5);
  });

  it("maps timeout, cancellation, and tool failure to structured statuses", async () => {
    const adapter = new NgspiceAdapter();
    const request = {
      capabilityId: "ngspice.tran",
      params: { netlistRelPath: "circuits/rc.cir", analysis: { kind: "tran", tStep: 1e-5, tStop: 1 }, vectors: ["v(out)"] }
    };

    const timeoutBridge = readyBridge();
    timeoutBridge.onRun = () => okProcess({ exitCode: null, timedOut: true });
    const timedOut = await adapter.execute(request, { bridge: timeoutBridge, workspaceRoot: "/ws" });
    expect(timedOut.status).toBe("timeout");
    expect(timedOut.message).toMatch(/time limit/);

    const cancelBridge = readyBridge();
    cancelBridge.onRun = () => okProcess({ exitCode: null, cancelled: true });
    const cancelled = await adapter.execute(request, { bridge: cancelBridge, workspaceRoot: "/ws" });
    expect(cancelled.status).toBe("cancelled");

    const failBridge = readyBridge();
    failBridge.onRun = () => okProcess({ exitCode: 1, stderr: ERROR_STDERR });
    const failed = await adapter.execute(request, { bridge: failBridge, workspaceRoot: "/ws" });
    expect(failed.status).toBe("failed");
    expect(failed.message).toMatch(/exited with code 1/);
    expect(failed.diagnostics.some((d) => d.severity === "error")).toBe(true);
  });

  it("does not report stale data when a rerun produces no fresh output", async () => {
    const bridge = readyBridge();
    // First run writes real data.
    bridge.onRun = (_req, opts) => {
      bridge.seedFile(opts.workspaceRoot, "results/ngspice-tran-circuits-rc-cir.data.txt", TRAN_WRDATA);
      return okProcess();
    };
    const adapter = new NgspiceAdapter();
    const request = {
      capabilityId: "ngspice.tran",
      params: { netlistRelPath: "circuits/rc.cir", analysis: { kind: "tran", tStep: 1e-5, tStop: 1e-3 }, vectors: ["v(out)"] }
    };
    const first = await adapter.execute(request, { bridge, workspaceRoot: "/ws" });
    expect(first.status).toBe("ok");
    // Second run exits 0 but writes nothing new: the adapter must NOT re-read
    // the previous data file as a fresh result.
    bridge.onRun = () => okProcess();
    const second = await adapter.execute(request, { bridge, workspaceRoot: "/ws" });
    expect(second.status).toBe("failed");
    expect(second.message).toMatch(/without producing output data/);
  });

  it("handles malformed tool output without crashing", async () => {
    const bridge = readyBridge();
    bridge.onRun = (_req, opts) => {
      bridge.seedFile(opts.workspaceRoot, "results/ngspice-tran-circuits-rc-cir.data.txt", MALFORMED_WRDATA);
      return okProcess();
    };
    const adapter = new NgspiceAdapter();
    const result = await adapter.execute(
      {
        capabilityId: "ngspice.tran",
        params: { netlistRelPath: "circuits/rc.cir", analysis: { kind: "tran", tStep: 1e-5, tStop: 1e-3 }, vectors: ["v(out)"] }
      },
      { bridge, workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("failed");
    expect(result.message).toMatch(/could not be parsed/);
  });

  it("rejects unsafe netlist paths before touching the bridge", async () => {
    const adapter = new NgspiceAdapter();
    const result = await adapter.execute(
      {
        capabilityId: "ngspice.tran",
        params: { netlistRelPath: "../../etc/passwd", analysis: { kind: "tran", tStep: 1e-5, tStop: 1e-3 }, vectors: ["v(out)"] }
      },
      { bridge: readyBridge(), workspaceRoot: "/ws" }
    );
    expect(result.status).toBe("invalid-input");
    expect(result.message).toMatch(/safe workspace-relative path/);
  });

  it("validates netlists without a bridge (web build)", async () => {
    const adapter = new NgspiceAdapter();
    const result = await adapter.execute(
      { capabilityId: "ngspice.validate", params: { netlistText: RC_NETLIST } },
      { bridge: null }
    );
    expect(result.status).toBe("ok");
  });
});
