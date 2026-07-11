import type { PlatformBridge } from "../platform/bridge";
import { isSafeRelPath } from "../platform/paths";
import type { InputFileRecord } from "../report/evidence";
import type { SimulationConfig, WorkspaceManifest } from "./manifest";

export interface CapturedSimulationInputs {
  declaredInputPaths: string[];
  inputFiles: InputFileRecord[];
  missingInputPaths: string[];
}

/**
 * Find workspace-relative files that materially define a configured run.
 * Capability parameters remain extensible, so path fields are discovered
 * recursively instead of hard-coding only ngspice and KiCad parameter names.
 */
export function collectSimulationInputPaths(
  simulation: SimulationConfig,
  manifest?: Pick<WorkspaceManifest, "requirements">
): string[] {
  const paths = new Set<string>();

  const visit = (value: unknown, key = "") => {
    if (typeof value === "string" && /RelPath$/i.test(key) && isSafeRelPath(value)) {
      paths.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key));
      return;
    }
    if (typeof value === "object" && value !== null) {
      Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
    }
  };

  visit(simulation.params);
  if (manifest) {
    const linked = new Set(simulation.requirementIds);
    manifest.requirements.forEach((requirement) => {
      if (linked.has(requirement.id) && requirement.sourceRelPath && isSafeRelPath(requirement.sourceRelPath)) {
        paths.add(requirement.sourceRelPath);
      }
    });
  }
  return [...paths].sort(compareText);
}

/** Hash every declared input that currently exists. Missing files are left to
 * adapter validation and are not represented as if their bytes were captured. */
export async function hashSimulationInputs(
  bridge: PlatformBridge,
  root: string,
  simulation: SimulationConfig,
  manifest?: Pick<WorkspaceManifest, "requirements">
): Promise<InputFileRecord[]> {
  return (await captureSimulationInputs(bridge, root, simulation, manifest)).inputFiles;
}

/** Capture the complete declared input set, including explicit missing state. */
export async function captureSimulationInputs(
  bridge: PlatformBridge,
  root: string,
  simulation: SimulationConfig,
  manifest?: Pick<WorkspaceManifest, "requirements">
): Promise<CapturedSimulationInputs> {
  const declaredInputPaths = collectSimulationInputPaths(simulation, manifest);
  const records: InputFileRecord[] = [];
  const missingInputPaths: string[] = [];
  for (const relPath of declaredInputPaths) {
    if (await bridge.fileExists(root, relPath)) {
      records.push({ relPath, sha256: await bridge.hashFile(root, relPath) });
    } else {
      missingInputPaths.push(relPath);
    }
  }
  return { declaredInputPaths, inputFiles: records, missingInputPaths };
}

export function workspaceAbsolutePath(root: string, relPath: string): string {
  if (!isSafeRelPath(relPath)) throw new Error("Path must be workspace-relative.");
  const separator = root.includes("\\") ? "\\" : "/";
  return `${root.replace(/[\\/]+$/, "")}${separator}${relPath.replaceAll("/", separator)}`;
}

/** Find only simulations whose declared definition includes a saved input. */
export function simulationIdsUsingInputPath(
  manifest: Pick<WorkspaceManifest, "requirements" | "simulations">,
  relPath: string
): Set<string> {
  return new Set(
    manifest.simulations
      .filter((simulation) => collectSimulationInputPaths(simulation, manifest).includes(relPath))
      .map((simulation) => simulation.id)
  );
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
