import { describe, expect, it } from "vitest";
import { createRegistry } from "../lib/adapters/instance";
import { MemoryBridge } from "../lib/platform/memoryBridge";
import { buildEvidenceReport } from "../lib/report/evidence";
import {
  createLatestRunReceipt,
  latestRunReceiptToSimulationRun,
  LATEST_RUN_RECEIPT_REL_PATH,
  loadLatestRunReceipt,
  RunReceiptError,
  saveLatestRunReceipt
} from "../lib/report/receipt";
import { hashSimulationInputs } from "../lib/workspace/inputs";
import { MANIFEST_FILENAME } from "../lib/workspace/manifest";
import {
  createWorkspace,
  openWorkspace,
  saveWorkspace,
  type OpenWorkspace
} from "../lib/workspace/workspace";

const ROOT = "/complete-workbench-workflow";
const REQUIREMENT_PATH = "requirements/REQ-CTRL-001.md";
const CONFIG_PATH = "simulations/pid-step.json";
const REPORT_PATH = "reports/20260711-Closed-Loop-Control-Evidence-Rev00.md";
const CAPTURED_UTC = "2026-07-11T10:15:30.000Z";
const REPORT_UTC = "2026-07-11T10:16:00.000Z";
const CAPABILITY_ID = "builtin-control.pid-step";

const validParams = {
  kp: 2,
  ki: 0.5,
  kd: 0.1,
  setpoint: 1,
  tau: 1.5,
  dt: 0.02,
  duration: 8,
  configRelPath: CONFIG_PATH
};

async function prepareWorkspace(bridge: MemoryBridge): Promise<OpenWorkspace> {
  const workspace = await createWorkspace(
    bridge,
    ROOT,
    "Closed-loop control study",
    "Traceable built-in simulation workflow."
  );

  await bridge.writeTextFileAtomic(
    ROOT,
    REQUIREMENT_PATH,
    "# REQ-CTRL-001\n\nThe closed-loop response shall be simulated and retained as evidence.\n"
  );
  await bridge.writeTextFileAtomic(ROOT, CONFIG_PATH, JSON.stringify(validParams, null, 2) + "\n");

  workspace.manifest.requirements.push({
    id: "REQ-CTRL-001",
    title: "Simulate and retain the closed-loop response",
    sourceRelPath: REQUIREMENT_PATH
  });
  workspace.manifest.simulations.push({
    id: "sim-pid-step",
    title: "PID step response",
    capabilityId: CAPABILITY_ID,
    params: validParams,
    requirementIds: ["REQ-CTRL-001"]
  });
  await saveWorkspace(bridge, workspace);

  return openWorkspace(bridge, ROOT);
}

describe("complete non-UI Workbench workflow", () => {
  it("persists a traceable workspace, actual run receipt and evidence report", async () => {
    const bridge = new MemoryBridge();
    const reopened = await prepareWorkspace(bridge);
    const simulation = reopened.manifest.simulations[0];

    expect(reopened.manifest.requirements).toEqual([
      expect.objectContaining({ id: "REQ-CTRL-001", sourceRelPath: REQUIREMENT_PATH })
    ]);
    expect(simulation.requirementIds).toEqual(["REQ-CTRL-001"]);

    const resolved = createRegistry().resolveCapability(simulation.capabilityId);
    expect(resolved, "configured capability must resolve through the production registry").toBeDefined();
    expect(resolved?.adapter.validate({ capabilityId: simulation.capabilityId, params: simulation.params })).toEqual([]);

    const result = await resolved!.adapter.execute(
      { capabilityId: simulation.capabilityId, params: simulation.params },
      { bridge, workspaceRoot: ROOT }
    );
    expect(result.status).toBe("ok");
    expect(result.tables[0].columns[0].values.length).toBeGreaterThan(1);

    const inputFiles = await hashSimulationInputs(bridge, ROOT, simulation, reopened.manifest);
    expect(inputFiles.map((file) => file.relPath)).toEqual([REQUIREMENT_PATH, CONFIG_PATH]);
    expect(inputFiles.every((file) => /^[a-f0-9]{64}$/.test(file.sha256))).toBe(true);

    const receipt = createLatestRunReceipt(
      {
        simulationId: simulation.id,
        capturedUtc: CAPTURED_UTC,
        inputFiles,
        result
      },
      reopened.manifest
    );
    await saveLatestRunReceipt(bridge, ROOT, receipt, reopened.manifest);
    const loadedReceipt = await loadLatestRunReceipt(bridge, ROOT, reopened.manifest);
    expect(loadedReceipt).toEqual(receipt);

    const detection = await resolved!.adapter.detect(bridge);
    const report = buildEvidenceReport({
      manifest: reopened.manifest,
      appVersion: "0.1.0",
      generatedUtc: REPORT_UTC,
      tools: [
        {
          name: resolved!.adapter.describe().name,
          ready: detection.ready,
          version: detection.version,
          executablePath: detection.executablePath,
          error: detection.error
        }
      ],
      inputFiles,
      runs: [latestRunReceiptToSimulationRun(loadedReceipt!)],
      limitations: []
    });
    await bridge.writeTextFileAtomic(ROOT, REPORT_PATH, report);

    expect(report).toContain("Evidence status: **PERSISTED LATEST-RUN RECEIPT**.");
    expect(report).toContain("Input hash check: **MATCHED CURRENT INPUTS**.");
    expect(report).toContain("Result: **COMPLETED**");
    expect(report).not.toMatch(/Result: \*\*(PASS|VERIFIED)\*\*/);
    expect(report).toContain("REQ-CTRL-001");
    expect(report).toContain("sim-pid-step");

    for (const relPath of [
      MANIFEST_FILENAME,
      REQUIREMENT_PATH,
      CONFIG_PATH,
      LATEST_RUN_RECEIPT_REL_PATH,
      REPORT_PATH
    ]) {
      await expect(bridge.fileExists(ROOT, relPath), relPath).resolves.toBe(true);
    }
    expect(await bridge.listDir(ROOT, "reports")).toEqual([
      "20260711-Closed-Loop-Control-Evidence-Rev00.md"
    ]);
    expect(await bridge.readTextFile(ROOT, REPORT_PATH)).toBe(report);
  });

  it("rejects an invalid rerun definition without replacing prior manifest or receipt", async () => {
    const bridge = new MemoryBridge();
    const reopened = await prepareWorkspace(bridge);
    const simulation = reopened.manifest.simulations[0];
    const resolved = createRegistry().resolveCapability(simulation.capabilityId)!;
    const initialInputs = await hashSimulationInputs(bridge, ROOT, simulation, reopened.manifest);
    const initialResult = await resolved.adapter.execute(
      { capabilityId: simulation.capabilityId, params: simulation.params },
      { bridge, workspaceRoot: ROOT }
    );
    await saveLatestRunReceipt(
      bridge,
      ROOT,
      createLatestRunReceipt(
        {
          simulationId: simulation.id,
          capturedUtc: CAPTURED_UTC,
          inputFiles: initialInputs,
          result: initialResult
        },
        reopened.manifest
      ),
      reopened.manifest
    );

    const previousManifestBytes = await bridge.readTextFile(ROOT, MANIFEST_FILENAME);
    const previousReceiptBytes = await bridge.readTextFile(ROOT, LATEST_RUN_RECEIPT_REL_PATH);
    const invalidParams = { ...simulation.params, tau: 0 };
    simulation.params = invalidParams;
    await expect(saveWorkspace(bridge, reopened)).rejects.toThrow(/Parameter "tau" must be a positive finite number/);
    expect(await bridge.readTextFile(ROOT, MANIFEST_FILENAME)).toBe(previousManifestBytes);
    expect(await bridge.readTextFile(ROOT, LATEST_RUN_RECEIPT_REL_PATH)).toBe(previousReceiptBytes);
    const afterRejectedEdit = await openWorkspace(bridge, ROOT);
    expect(afterRejectedEdit.manifest.simulations[0].params.tau).toBe(1.5);

    const failedResult = await resolved.adapter.execute(
      { capabilityId: simulation.capabilityId, params: invalidParams },
      { bridge, workspaceRoot: ROOT }
    );
    expect(failedResult.status).toBe("invalid-input");
    const retainedReceipt = await loadLatestRunReceipt(bridge, ROOT, afterRejectedEdit.manifest);
    expect(retainedReceipt?.result.status).toBe("ok");

    bridge.seedFile(ROOT, LATEST_RUN_RECEIPT_REL_PATH, "{corrupt");
    await expect(loadLatestRunReceipt(bridge, ROOT, afterRejectedEdit.manifest)).rejects.toBeInstanceOf(
      RunReceiptError
    );
  });
});
