import { describe, expect, it } from "vitest";
import type { AdapterResult } from "../lib/adapters/contract";
import { MemoryBridge, sha256Hex } from "../lib/platform/memoryBridge";
import {
  createLatestRunReceipt,
  latestRunReceiptToSimulationRun,
  LATEST_RUN_RECEIPT_REL_PATH,
  loadLatestRunReceipt,
  MAX_LATEST_RUN_RECEIPT_BYTES,
  parseLatestRunReceipt,
  persistLatestRunReceipt,
  RunReceiptError,
  saveLatestRunReceipt,
  serializeLatestRunReceipt
} from "../lib/report/receipt";
import { createManifest } from "../lib/workspace/manifest";

const CAPTURED_UTC = "2026-07-11T10:15:30.000Z";
const INPUT_CONTENT = "exact simulation configuration";
const INPUT_HASH = sha256Hex(INPUT_CONTENT);

function result(): AdapterResult {
  return {
    status: "ok",
    capabilityId: "builtin-control.pid-step",
    message: "Actual adapter result",
    tables: [
      {
        title: "Step response",
        columns: [
          { name: "t", unit: "s", values: [0, 0.1, 0.2] },
          { name: "pv", values: [0, 0.4, 0.8] }
        ]
      }
    ],
    scalars: {
      riseTime: Number.NaN,
      upperBound: Number.POSITIVE_INFINITY,
      negativeZero: -0,
      finalValue: 0.8
    },
    diagnostics: [{ severity: "info", message: "captured", source: "test" }],
    generatedFiles: [{ relPath: "results/run.csv", kind: "csv", sha256: "b".repeat(64) }],
    raw: { stdout: "adapter output", stderr: "", truncated: false },
    durationMs: 12.5,
    toolVersion: "built-in"
  };
}

function manifest() {
  const workspace = createManifest("Receipt test", "", "2026-07-11T00:00:00.000Z");
  workspace.simulations.push({
    id: "sim-pid",
    title: "PID",
    capabilityId: "builtin-control.pid-step",
    params: { configRelPath: "simulations/pid.json", tau: 1 },
    requirementIds: []
  });
  return workspace;
}

function receipt() {
  return createLatestRunReceipt(
    {
      simulationId: "sim-pid",
      capturedUtc: CAPTURED_UTC,
      inputFiles: [{ relPath: "simulations/pid.json", sha256: INPUT_HASH }],
      result: result()
    },
    manifest()
  );
}

describe("latest-run receipt persistence", () => {
  it("round-trips through bridge persistence without replacing or fabricating the adapter result", async () => {
    const bridge = new MemoryBridge();
    bridge.seedFile("/project", "simulations/pid.json", INPUT_CONTENT);
    const original = receipt();

    const saved = await saveLatestRunReceipt(bridge, "/project", original, manifest());
    const loaded = await loadLatestRunReceipt(bridge, "/project", manifest());

    expect(saved).toEqual(original);
    expect(loaded).toEqual(original);
    expect(loaded?.result.message).toBe("Actual adapter result");
    expect(Number.isNaN(loaded?.result.scalars.riseTime)).toBe(true);
    expect(loaded?.result.scalars.upperBound).toBe(Number.POSITIVE_INFINITY);
    expect(Object.is(loaded?.result.scalars.negativeZero, -0)).toBe(true);
    const persisted = await bridge.readTextFile("/project", LATEST_RUN_RECEIPT_REL_PATH);
    expect(persisted).toContain("__engineeringWorkbenchNumber");
  });

  it("serialises deterministically and adapts receipt metadata to a report run", () => {
    const original = receipt();
    expect(serializeLatestRunReceipt(original)).toBe(serializeLatestRunReceipt(original));
    expect(parseLatestRunReceipt(serializeLatestRunReceipt(original), manifest())).toEqual(original);
    expect(latestRunReceiptToSimulationRun(original)).toEqual({
      simulationId: original.simulationId,
      capturedUtc: original.capturedUtc,
      inputFiles: original.inputFiles,
      result: original.result,
      persistence: "persisted",
      declaredInputPaths: ["simulations/pid.json"],
      missingInputPaths: []
    });
  });

  it("returns null when the workspace has no receipt", async () => {
    const bridge = new MemoryBridge();
    await expect(loadLatestRunReceipt(bridge, "/project", manifest())).resolves.toBeNull();
  });

  it("rejects corrupt and oversized persisted data instead of treating it as a run", async () => {
    const bridge = new MemoryBridge();
    bridge.seedFile("/project", LATEST_RUN_RECEIPT_REL_PATH, "{broken");
    await expect(loadLatestRunReceipt(bridge, "/project", manifest())).rejects.toBeInstanceOf(RunReceiptError);

    bridge.seedFile(
      "/project",
      LATEST_RUN_RECEIPT_REL_PATH,
      "x".repeat(MAX_LATEST_RUN_RECEIPT_BYTES + 1)
    );
    await expect(loadLatestRunReceipt(bridge, "/project", manifest())).rejects.toThrow(/too large/i);
  });

  it("rejects missing simulation references and capability mismatches", () => {
    const original = receipt();
    expect(() =>
      createLatestRunReceipt(
        { ...original, simulationId: "missing-simulation" },
        manifest()
      )
    ).toThrow(/not present in the workspace manifest/);

    expect(() =>
      createLatestRunReceipt(
        { ...original, result: { ...original.result, capabilityId: "other.capability" } },
        manifest()
      )
    ).toThrow(/does not match simulation/);
  });

  it("rejects unsafe input paths, invalid hashes and inconsistent table shapes", () => {
    const original = receipt();
    expect(() =>
      createLatestRunReceipt({ ...original, inputFiles: [{ relPath: "../outside", sha256: INPUT_HASH }] }, manifest())
    ).toThrow(/safe workspace-relative path/);
    expect(() =>
      createLatestRunReceipt({ ...original, inputFiles: [{ relPath: "simulations/pid.json", sha256: "not-a-hash" }] }, manifest())
    ).toThrow(/64 lowercase hexadecimal/);

    const badResult = result();
    badResult.tables[0].columns[1].values.pop();
    expect(() => createLatestRunReceipt({ ...original, result: badResult }, manifest())).toThrow(/same number of values/);
  });

  it("invalidates exact definition changes but ignores unrelated requirements", () => {
    const bound = manifest();
    bound.requirements.push(
      { id: "REQ-1", title: "Linked", sourceRelPath: "requirements/linked.md" },
      { id: "REQ-X", title: "Unlinked" }
    );
    bound.simulations[0].requirementIds = ["REQ-1"];
    const original = createLatestRunReceipt({
      simulationId: "sim-pid",
      capturedUtc: CAPTURED_UTC,
      inputFiles: [
        { relPath: "requirements/linked.md", sha256: "c".repeat(64) },
        { relPath: "simulations/pid.json", sha256: INPUT_HASH }
      ],
      result: result()
    }, bound);
    const json = serializeLatestRunReceipt(original);

    const parameterChange = structuredClone(bound);
    parameterChange.simulations[0].params.tau = 2;
    expect(() => parseLatestRunReceipt(json, parameterChange)).toThrow(/does not match the current workspace manifest/);

    const linkChange = structuredClone(bound);
    linkChange.simulations[0].requirementIds = [];
    expect(() => parseLatestRunReceipt(json, linkChange)).toThrow(/does not match the current workspace manifest/);

    const linkedRequirementChange = structuredClone(bound);
    linkedRequirementChange.requirements[0].title = "Changed linked requirement";
    expect(() => parseLatestRunReceipt(json, linkedRequirementChange)).toThrow(/does not match the current workspace manifest/);

    const unrelatedChange = structuredClone(bound);
    unrelatedChange.requirements[1].title = "Changed but still unlinked";
    expect(parseLatestRunReceipt(json, unrelatedChange)).toEqual(original);
  });

  it("invalidates declared input replacement, addition, content and missing-state changes", async () => {
    const bridge = new MemoryBridge();
    const currentManifest = manifest();
    bridge.seedFile("/project", "simulations/pid.json", INPUT_CONTENT);
    const original = receipt();
    await saveLatestRunReceipt(bridge, "/project", original, currentManifest);

    bridge.seedFile("/project", "simulations/pid.json", "replacement bytes");
    await expect(loadLatestRunReceipt(bridge, "/project", currentManifest)).rejects.toThrow(/input hashes do not match/);

    const replacementPath = structuredClone(currentManifest);
    replacementPath.simulations[0].params = { configRelPath: "simulations/other.json", tau: 1 };
    expect(() => parseLatestRunReceipt(serializeLatestRunReceipt(original), replacementPath)).toThrow(/does not match/);

    const addedPath = structuredClone(currentManifest);
    addedPath.simulations[0].params.modelRelPath = "simulations/model.json";
    expect(() => parseLatestRunReceipt(serializeLatestRunReceipt(original), addedPath)).toThrow(/does not match/);

    const missingManifest = manifest();
    missingManifest.simulations[0].params = { configRelPath: "simulations/missing.json", tau: 1 };
    const missingReceipt = createLatestRunReceipt({
      simulationId: "sim-pid",
      capturedUtc: CAPTURED_UTC,
      inputFiles: [],
      result: result()
    }, missingManifest);
    expect(missingReceipt.missingInputPaths).toEqual(["simulations/missing.json"]);
    await saveLatestRunReceipt(bridge, "/missing", missingReceipt, missingManifest);
    bridge.seedFile("/missing", "simulations/missing.json", "now present");
    await expect(loadLatestRunReceipt(bridge, "/missing", missingManifest)).rejects.toThrow(/missing-input state/);
  });

  it("returns an explicit session-only outcome when the receipt write fails", async () => {
    class ReceiptWriteFailBridge extends MemoryBridge {
      override async writeTextFileAtomic(root: string, relPath: string, contents: string): Promise<void> {
        if (relPath === LATEST_RUN_RECEIPT_REL_PATH) throw new Error("injected receipt write failure");
        await super.writeTextFileAtomic(root, relPath, contents);
      }
    }
    const bridge = new ReceiptWriteFailBridge();
    bridge.seedFile("/project", "simulations/pid.json", INPUT_CONTENT);
    const outcome = await persistLatestRunReceipt(bridge, "/project", receipt(), manifest());
    expect(outcome.persistence).toBe("session-only");
    if (outcome.persistence === "session-only") {
      expect(outcome.error).toContain("injected receipt write failure");
      expect(outcome.receipt.result.message).toBe("Actual adapter result");
    }
    await expect(bridge.fileExists("/project", LATEST_RUN_RECEIPT_REL_PATH)).resolves.toBe(false);
  });
});
