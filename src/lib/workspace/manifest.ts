// Workspace manifest: schemaVersion 1. Pure validation and serialisation —
// no filesystem access here (see workspace.ts for IO via the bridge).

export const MANIFEST_SCHEMA_VERSION = 1;
export const MANIFEST_FILENAME = "workbench.json";

/** Standard folders every workspace contains. */
export const WORKSPACE_FOLDERS = [
  "requirements",
  "circuits",
  "pcb",
  "simulations",
  "results",
  "evidence",
  "reports"
] as const;

export interface RequirementRef {
  id: string;
  title: string;
  /** Workspace-relative source document, if any. */
  sourceRelPath?: string;
}

export interface SimulationConfig {
  id: string;
  title: string;
  /** Capability that executes this configuration, e.g. "ngspice.tran". */
  capabilityId: string;
  /** Capability-specific parameters (netlist path, sweep bounds, ...). */
  params: Record<string, unknown>;
  /** Requirement ids this simulation provides evidence for. */
  requirementIds: string[];
}

export interface WorkspaceManifest {
  schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
  name: string;
  description: string;
  createdUtc: string;
  modifiedUtc: string;
  requirements: RequirementRef[];
  simulations: SimulationConfig[];
}

export interface ManifestIssue {
  path: string;
  message: string;
}

export class ManifestError extends Error {
  constructor(
    message: string,
    readonly issues: ManifestIssue[] = []
  ) {
    super(message);
    this.name = "ManifestError";
  }
}

export function createManifest(name: string, description: string, nowUtc: string): WorkspaceManifest {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    name,
    description,
    createdUtc: nowUtc,
    modifiedUtc: nowUtc,
    requirements: [],
    simulations: []
  };
}

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSafeManifestRelPath(p: string): boolean {
  if (p.length === 0 || p.includes("\\") || p.startsWith("/") || /^[a-zA-Z]:/.test(p)) return false;
  return p.split("/").every((s) => s.length > 0 && s !== "." && s !== "..");
}

/**
 * Parse and validate manifest JSON. Throws `ManifestError` with structured
 * issues. A schemaVersion greater than this build understands produces a
 * distinct "newer version" error so callers can show the right guidance.
 */
export function parseManifest(json: string): WorkspaceManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new ManifestError(`workbench.json is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!isRecord(parsed)) throw new ManifestError("workbench.json must contain a JSON object.");

  const v = parsed.schemaVersion;
  if (typeof v !== "number" || !Number.isInteger(v)) {
    throw new ManifestError("workbench.json is missing an integer schemaVersion field.");
  }
  if (v > MANIFEST_SCHEMA_VERSION) {
    throw new ManifestError(
      `This project was created by a newer version of Engineering Workbench (schemaVersion ${v}; ` +
        `this build supports up to ${MANIFEST_SCHEMA_VERSION}). Update the application to open it. ` +
        "The file has not been modified."
    );
  }
  if (v < MANIFEST_SCHEMA_VERSION) {
    throw new ManifestError(
      `Unsupported manifest schemaVersion ${v}; this build supports version ${MANIFEST_SCHEMA_VERSION}.`
    );
  }

  const issues: ManifestIssue[] = [];
  const str = (key: "name" | "description" | "createdUtc" | "modifiedUtc"): string => {
    const val = parsed[key];
    if (typeof val !== "string") {
      issues.push({ path: key, message: "must be a string" });
      return "";
    }
    return val;
  };
  const name = str("name");
  const description = str("description");
  const createdUtc = str("createdUtc");
  const modifiedUtc = str("modifiedUtc");
  if (name.length === 0) issues.push({ path: "name", message: "must not be empty" });
  if (createdUtc && !ISO_UTC.test(createdUtc)) issues.push({ path: "createdUtc", message: "must be ISO-8601 UTC" });
  if (modifiedUtc && !ISO_UTC.test(modifiedUtc)) issues.push({ path: "modifiedUtc", message: "must be ISO-8601 UTC" });

  const requirements: RequirementRef[] = [];
  if (!Array.isArray(parsed.requirements)) {
    issues.push({ path: "requirements", message: "must be an array" });
  } else {
    parsed.requirements.forEach((r, i) => {
      if (!isRecord(r) || typeof r.id !== "string" || typeof r.title !== "string" || r.id.length === 0) {
        issues.push({ path: `requirements[${i}]`, message: "must have string id and title" });
        return;
      }
      if (r.sourceRelPath !== undefined) {
        if (typeof r.sourceRelPath !== "string" || !isSafeManifestRelPath(r.sourceRelPath)) {
          issues.push({ path: `requirements[${i}].sourceRelPath`, message: "must be a safe relative path" });
          return;
        }
      }
      requirements.push({
        id: r.id,
        title: r.title,
        ...(typeof r.sourceRelPath === "string" ? { sourceRelPath: r.sourceRelPath } : {})
      });
    });
  }

  const simulations: SimulationConfig[] = [];
  if (!Array.isArray(parsed.simulations)) {
    issues.push({ path: "simulations", message: "must be an array" });
  } else {
    parsed.simulations.forEach((s, i) => {
      if (
        !isRecord(s) ||
        typeof s.id !== "string" ||
        s.id.length === 0 ||
        typeof s.title !== "string" ||
        s.title.length === 0 ||
        typeof s.capabilityId !== "string" ||
        s.capabilityId.length === 0 ||
        !isRecord(s.params) ||
        !Array.isArray(s.requirementIds) ||
        !s.requirementIds.every((x) => typeof x === "string" && x.length > 0)
      ) {
        issues.push({
          path: `simulations[${i}]`,
          message: "must have string id/title/capabilityId, object params, and string[] requirementIds"
        });
        return;
      }
      validateParameterPaths(s.params, `simulations[${i}].params`, issues);
      const duplicateLink = findDuplicate(s.requirementIds as string[]);
      if (duplicateLink) {
        issues.push({
          path: `simulations[${i}].requirementIds`,
          message: `contains duplicate requirement id "${duplicateLink}"`
        });
      }
      simulations.push({
        id: s.id,
        title: s.title,
        capabilityId: s.capabilityId,
        params: s.params,
        requirementIds: s.requirementIds as string[]
      });
    });
  }

  const dupSim = findDuplicate(simulations.map((s) => s.id));
  if (dupSim) issues.push({ path: "simulations", message: `duplicate simulation id "${dupSim}"` });
  const dupReq = findDuplicate(requirements.map((r) => r.id));
  if (dupReq) issues.push({ path: "requirements", message: `duplicate requirement id "${dupReq}"` });

  // Traceability links must resolve inside this manifest. A dangling id can
  // look like verification coverage in reports even though no requirement
  // exists, so reject it at the workspace boundary.
  const knownRequirementIds = new Set(requirements.map((requirement) => requirement.id));
  simulations.forEach((simulation, simulationIndex) => {
    simulation.requirementIds.forEach((requirementId, referenceIndex) => {
      if (!knownRequirementIds.has(requirementId)) {
        issues.push({
          path: `simulations[${simulationIndex}].requirementIds[${referenceIndex}]`,
          message: `references unknown requirement id "${requirementId}"`
        });
      }
    });
  });

  if (issues.length > 0) {
    throw new ManifestError(
      `workbench.json failed validation: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      issues
    );
  }

  return { schemaVersion: MANIFEST_SCHEMA_VERSION, name, description, createdUtc, modifiedUtc, requirements, simulations };
}

/**
 * Serialise with stable key order and sorted collections so identical states
 * produce byte-identical files (reviewable diffs, deterministic reports).
 */
export function serializeManifest(m: WorkspaceManifest): string {
  const ordered = {
    schemaVersion: m.schemaVersion,
    name: m.name,
    description: m.description,
    createdUtc: m.createdUtc,
    modifiedUtc: m.modifiedUtc,
    requirements: [...m.requirements]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((r) => ({
        id: r.id,
        title: r.title,
        ...(r.sourceRelPath !== undefined ? { sourceRelPath: r.sourceRelPath } : {})
      })),
    simulations: [...m.simulations]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => ({
        id: s.id,
        title: s.title,
        capabilityId: s.capabilityId,
        params: sortKeys(s.params),
        requirementIds: [...s.requirementIds].sort()
      }))
  };
  return JSON.stringify(ordered, null, 2) + "\n";
}

/**
 * Validate an in-memory manifest before it is allowed near the filesystem.
 * JSON serialisation can otherwise silently drop values such as `undefined`
 * or coerce non-finite numbers to `null`, so check parameter values before the
 * normal parse validation creates a defensive canonical copy.
 */
export function validateManifestForWrite(m: WorkspaceManifest): WorkspaceManifest {
  const issues: ManifestIssue[] = [];
  m.simulations.forEach((simulation, index) => {
    validateJsonValue(simulation.params, `simulations[${index}].params`, issues, new Set<object>());
  });
  if (issues.length > 0) throwManifestIssues(issues);
  return parseManifest(serializeManifest(m));
}

/** Return only existing simulation ids whose evidence definition changed. */
export function affectedSimulationIds(
  previous: WorkspaceManifest,
  next: WorkspaceManifest
): Set<string> {
  const affected = new Set<string>();
  const nextById = new Map(next.simulations.map((simulation) => [simulation.id, simulation]));
  for (const simulation of previous.simulations) {
    const nextSimulation = nextById.get(simulation.id);
    if (!nextSimulation || simulationDefinitionKey(previous, simulation) !== simulationDefinitionKey(next, nextSimulation)) {
      affected.add(simulation.id);
    }
  }
  return affected;
}

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) out[k] = obj[k];
  return out;
}

function validateJsonValue(
  value: unknown,
  path: string,
  issues: ManifestIssue[],
  ancestors: Set<object>
): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) issues.push({ path, message: "must be a finite JSON number" });
    return;
  }
  if (typeof value !== "object") {
    issues.push({ path, message: `contains unsupported ${typeof value} value` });
    return;
  }
  const object = value as object;
  if (ancestors.has(object)) {
    issues.push({ path, message: "must not contain circular references" });
    return;
  }
  ancestors.add(object);
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateJsonValue(item, `${path}[${index}]`, issues, ancestors));
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      issues.push({ path, message: "must contain only plain JSON objects" });
    } else {
      Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
        validateJsonValue(child, `${path}.${key}`, issues, ancestors);
      });
    }
  }
  ancestors.delete(object);
}

function validateParameterPaths(value: unknown, path: string, issues: ManifestIssue[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateParameterPaths(item, `${path}[${index}]`, issues));
    return;
  }
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    if (/RelPath$/i.test(key) && (typeof child !== "string" || !isSafeManifestRelPath(child))) {
      issues.push({ path: childPath, message: "must be a safe relative path" });
    }
    validateParameterPaths(child, childPath, issues);
  });
}

function simulationDefinitionKey(manifest: WorkspaceManifest, simulation: SimulationConfig): string {
  const requirementById = new Map(manifest.requirements.map((requirement) => [requirement.id, requirement]));
  const linkedRequirements = simulation.requirementIds
    .map((id) => requirementById.get(id) ?? { id, title: "", sourceRelPath: undefined })
    .sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(sortKeysDeep({
    simulation: {
      id: simulation.id,
      title: simulation.title,
      capabilityId: simulation.capabilityId,
      params: simulation.params,
      requirementIds: [...simulation.requirementIds].sort()
    },
    linkedRequirements
  }));
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    Object.keys(value).sort().forEach((key) => { out[key] = sortKeysDeep(value[key]); });
    return out;
  }
  return value;
}

function throwManifestIssues(issues: ManifestIssue[]): never {
  throw new ManifestError(
    `workbench.json failed validation: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`,
    issues
  );
}

function findDuplicate(ids: string[]): string | null {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return null;
}
