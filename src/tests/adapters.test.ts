import { describe, expect, it } from "vitest";
import { AdapterRegistry } from "../lib/adapters/registry";
import { createBuiltinAdapters } from "../lib/adapters/builtin";
import {
  ADAPTER_CONTRACT_VERSION,
  AdapterInfo,
  AdapterRequest,
  AdapterResult,
  DetectionResult,
  EngineAdapter,
  ExecutionContext,
  ValidationIssue,
  failureResult
} from "../lib/adapters/contract";
import { isSafeRelPath } from "../lib/platform/paths";
import { sha256Hex } from "../lib/platform/memoryBridge";

function makeRegistry(): AdapterRegistry {
  const reg = new AdapterRegistry();
  for (const a of createBuiltinAdapters()) reg.register(a);
  return reg;
}

describe("adapter registry", () => {
  it("registers all built-in engines and lists them sorted", () => {
    const reg = makeRegistry();
    const ids = reg.list().map((i) => i.id);
    expect(ids).toEqual([
      "builtin-control",
      "builtin-electrical",
      "builtin-embedded",
      "builtin-mechanical",
      "builtin-ml",
      "builtin-plc",
      "builtin-robotics"
    ]);
  });

  it("rejects adapters with an unknown contract version", () => {
    const reg = new AdapterRegistry();
    const bad = {
      contractVersion: 99,
      describe: () => ({ id: "x", name: "x", kind: "builtin", contractVersion: 99, capabilities: [] })
    } as unknown as EngineAdapter;
    expect(() => reg.register(bad)).toThrow(/contract version 99/);
  });

  it("rejects duplicate adapter ids", () => {
    const reg = makeRegistry();
    expect(() => reg.register(createBuiltinAdapters()[0])).toThrow(/duplicate id/);
  });

  it("rejects capabilities that are not namespaced by adapter id", () => {
    const reg = new AdapterRegistry();
    const bad: EngineAdapter = {
      contractVersion: ADAPTER_CONTRACT_VERSION,
      describe: (): AdapterInfo => ({
        id: "a",
        name: "a",
        kind: "builtin",
        contractVersion: ADAPTER_CONTRACT_VERSION,
        capabilities: [{ id: "b.cap", title: "t", description: "d" }]
      }),
      detect: async (): Promise<DetectionResult> => ({ ready: true }),
      validate: (): ValidationIssue[] => [],
      execute: async (r: AdapterRequest, _c: ExecutionContext): Promise<AdapterResult> =>
        failureResult(r.capabilityId, "failed", "unused")
    };
    expect(() => reg.register(bad)).toThrow(/namespaced/);
  });

  it("resolves capability ids to their owning adapter", () => {
    const reg = makeRegistry();
    const hit = reg.resolveCapability("builtin-control.pid-step");
    expect(hit?.adapter.describe().id).toBe("builtin-control");
    expect(reg.resolveCapability("nope.missing")).toBeUndefined();
  });
});

describe("built-in adapters", () => {
  const ctx: ExecutionContext = { bridge: null };

  it("runs a PID step response with metrics", async () => {
    const reg = makeRegistry();
    const { adapter } = reg.resolveCapability("builtin-control.pid-step")!;
    const result = await adapter.execute(
      { capabilityId: "builtin-control.pid-step", params: { kp: 2, ki: 0.5, kd: 0.1, setpoint: 1 } },
      ctx
    );
    expect(result.status).toBe("ok");
    expect(result.tables[0].columns.map((c) => c.name)).toEqual(["t", "pv", "sp", "u"]);
    const pv = result.tables[0].columns[1].values;
    expect(pv[pv.length - 1]).toBeGreaterThan(0.9); // converges towards setpoint
    expect(result.scalars.overshootPct).toBeGreaterThanOrEqual(0);
  });

  it("returns invalid-input with actionable message for bad parameters", async () => {
    const reg = makeRegistry();
    const { adapter } = reg.resolveCapability("builtin-electrical.rc-charge")!;
    const result = await adapter.execute(
      { capabilityId: "builtin-electrical.rc-charge", params: { r: -5 } },
      ctx
    );
    expect(result.status).toBe("invalid-input");
    expect(result.message).toMatch(/"r" must be a positive finite number/);
  });

  it("computes RLC step response and reports regime scalars", async () => {
    const reg = makeRegistry();
    const { adapter } = reg.resolveCapability("builtin-electrical.rlc-step")!;
    const result = await adapter.execute(
      { capabilityId: "builtin-electrical.rlc-step", params: { r: 100, l: 0.1, c: 1e-6, vs: 5, duration: 0.01 } },
      ctx
    );
    expect(result.status).toBe("ok");
    expect(result.scalars.omega0).toBeCloseTo(1 / Math.sqrt(0.1 * 1e-6), 3);
  });

  it("latches the PLC tank high-high trip", async () => {
    const reg = makeRegistry();
    const { adapter } = reg.resolveCapability("builtin-plc.tank-fill")!;
    const result = await adapter.execute(
      { capabilityId: "builtin-plc.tank-fill", params: { duration: 30, dt: 0.1, initialLevel: 20 } },
      ctx
    );
    expect(result.status).toBe("ok");
    expect(result.message).toMatch(/tripped high-high/);
    expect(result.scalars.tripTime).toBeGreaterThan(0);
  });

  it("fits a linear regression through known points", async () => {
    const reg = makeRegistry();
    const { adapter } = reg.resolveCapability("builtin-ml.linear-regression")!;
    const result = await adapter.execute(
      { capabilityId: "builtin-ml.linear-regression", params: { xs: [0, 1, 2, 3], ys: [1, 3, 5, 7] } },
      ctx
    );
    expect(result.status).toBe("ok");
    expect(result.scalars.slope).toBeCloseTo(2, 6);
    expect(result.scalars.intercept).toBeCloseTo(1, 6);
    expect(result.scalars.r2).toBeCloseTo(1, 6);
  });

  it("every built-in detects as ready without a bridge", async () => {
    for (const adapter of createBuiltinAdapters()) {
      const det = await adapter.detect(null);
      expect(det.ready).toBe(true);
    }
  });
});

describe("path safety", () => {
  it("accepts plain relative POSIX paths", () => {
    expect(isSafeRelPath("circuits/rc.cir")).toBe(true);
    expect(isSafeRelPath("a/b/c.txt")).toBe(true);
  });

  it("rejects traversal, absolute, drive-letter, UNC and backslash paths", () => {
    for (const bad of [
      "../etc/passwd",
      "a/../../b",
      "/etc/passwd",
      "C:/Windows/system32",
      "c:evil",
      "\\\\server\\share",
      "a\\b",
      "a//b",
      ".",
      "..",
      "",
      "~/x",
      "a/./b",
      "nul\0byte",
      // NTFS alternate data streams and Windows reserved device names
      "report.txt:hidden",
      "sub/file:stream",
      "con",
      "results/con",
      "com1.txt",
      "LPT1",
      "aux.log"
    ]) {
      expect(isSafeRelPath(bad), bad).toBe(false);
    }
  });
});

describe("sha256 (memory bridge hashing)", () => {
  it("matches known FIPS 180-4 vectors", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex("The quick brown fox jumps over the lazy dog")).toBe(
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"
    );
  });
});
