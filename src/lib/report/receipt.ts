// Workspace-scoped persistence for the most recently captured simulation
// result. All file access goes through PlatformBridge's validated operations.

import type { PlatformBridge } from "../platform/bridge";
import type { SimulationRun } from "./evidence";
import { captureSimulationInputs } from "../workspace/inputs";
import {
  createRunDefinition,
  LATEST_RUN_RECEIPT_REL_PATH,
  LATEST_RUN_RECEIPT_SCHEMA_VERSION,
  MAX_LATEST_RUN_RECEIPT_BYTES,
  parseLatestRunReceipt,
  serializeLatestRunReceipt,
  validateLatestRunReceipt
} from "./receiptValidation";
import type {
  LatestRunReceipt,
  LatestRunReceiptInput,
  ReceiptManifest
} from "./receiptValidation";
import { RunReceiptError } from "./receiptError";

export {
  LATEST_RUN_RECEIPT_REL_PATH,
  LATEST_RUN_RECEIPT_SCHEMA_VERSION,
  MAX_LATEST_RUN_RECEIPT_BYTES,
  parseLatestRunReceipt,
  serializeLatestRunReceipt,
  validateLatestRunReceipt
} from "./receiptValidation";
export type { LatestRunReceipt, LatestRunReceiptInput, ReceiptManifest } from "./receiptValidation";
export { RunReceiptError };

/**
 * Build and validate a receipt without reading the clock or deriving a result.
 * The caller supplies the timestamp, hashes and exact AdapterResult.
 */
export function createLatestRunReceipt(
  input: LatestRunReceiptInput,
  manifest: ReceiptManifest
): LatestRunReceipt {
  const definition = createRunDefinition(manifest, input.simulationId);
  const presentPaths = new Set(input.inputFiles.map((file) => file.relPath));
  return validateLatestRunReceipt(
    {
      ...input,
      schemaVersion: LATEST_RUN_RECEIPT_SCHEMA_VERSION,
      definition,
      missingInputPaths: definition.declaredInputPaths.filter((relPath) => !presentPaths.has(relPath))
    },
    manifest
  );
}

/** Persist a canonical receipt using the bridge's atomic workspace write. */
export async function saveLatestRunReceipt(
  bridge: PlatformBridge,
  root: string,
  receipt: LatestRunReceipt,
  manifest?: ReceiptManifest
): Promise<LatestRunReceipt> {
  const validated = validateLatestRunReceipt(receipt, manifest);
  if (manifest) await validateLatestRunReceiptAgainstWorkspace(bridge, root, validated, manifest);
  const json = serializeLatestRunReceipt(validated, manifest);
  await bridge.createDirAll(root, "evidence");
  await bridge.writeTextFileAtomic(root, LATEST_RUN_RECEIPT_REL_PATH, json);
  return validated;
}

export type ReceiptPersistenceOutcome =
  | { persistence: "persisted"; receipt: LatestRunReceipt }
  | { persistence: "session-only"; receipt: LatestRunReceipt; error: string };

/** Convert write failure into an explicit session-only state for the UI. */
export async function persistLatestRunReceipt(
  bridge: PlatformBridge,
  root: string,
  receipt: LatestRunReceipt,
  manifest: ReceiptManifest
): Promise<ReceiptPersistenceOutcome> {
  try {
    return {
      persistence: "persisted",
      receipt: await saveLatestRunReceipt(bridge, root, receipt, manifest)
    };
  } catch (error) {
    return {
      persistence: "session-only",
      receipt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Return null only when no receipt exists. Invalid data throws RunReceiptError
 * so Workbench cannot silently present corrupt data as an actual run.
 */
export async function loadLatestRunReceipt(
  bridge: PlatformBridge,
  root: string,
  manifest?: ReceiptManifest
): Promise<LatestRunReceipt | null> {
  if (!(await bridge.fileExists(root, LATEST_RUN_RECEIPT_REL_PATH))) return null;
  const json = await bridge.readTextFile(
    root,
    LATEST_RUN_RECEIPT_REL_PATH,
    MAX_LATEST_RUN_RECEIPT_BYTES + 1
  );
  const receipt = parseLatestRunReceipt(json, manifest);
  if (manifest) await validateLatestRunReceiptAgainstWorkspace(bridge, root, receipt, manifest);
  return receipt;
}

/** Recheck present, missing and hashed input state against the current files. */
export async function validateLatestRunReceiptAgainstWorkspace(
  bridge: PlatformBridge,
  root: string,
  receipt: LatestRunReceipt,
  manifest: ReceiptManifest
): Promise<LatestRunReceipt> {
  const validated = validateLatestRunReceipt(receipt, manifest);
  const simulation = manifest.simulations.find((candidate) => candidate.id === validated.simulationId);
  if (!simulation) throw new Error(`Simulation ${validated.simulationId} is no longer present.`);
  const current = await captureSimulationInputs(bridge, root, simulation, manifest);
  const canonical = (value: unknown) => JSON.stringify(value);
  const sortFiles = (files: typeof validated.inputFiles) => [...files].sort((a, b) => a.relPath.localeCompare(b.relPath));
  if (canonical(current.declaredInputPaths) !== canonical(validated.definition.declaredInputPaths)) {
    throw new RunReceiptError("Latest-run receipt declared input paths do not match the current workspace.");
  }
  if (canonical(current.missingInputPaths) !== canonical(validated.missingInputPaths)) {
    throw new RunReceiptError("Latest-run receipt missing-input state does not match the current workspace.");
  }
  if (canonical(sortFiles(current.inputFiles)) !== canonical(sortFiles(validated.inputFiles))) {
    throw new RunReceiptError("Latest-run receipt input hashes do not match the current workspace.");
  }
  return validated;
}

/** Adapt a validated receipt to buildEvidenceReport's run input. */
export function latestRunReceiptToSimulationRun(
  receipt: LatestRunReceipt,
  persistence: "persisted" | "session-only" = "persisted"
): SimulationRun {
  const validated = validateLatestRunReceipt(receipt);
  return {
    simulationId: validated.simulationId,
    result: validated.result,
    capturedUtc: validated.capturedUtc,
    inputFiles: validated.inputFiles,
    persistence,
    declaredInputPaths: validated.definition.declaredInputPaths,
    missingInputPaths: validated.missingInputPaths
  };
}
