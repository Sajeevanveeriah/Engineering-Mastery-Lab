import { sha256Hex } from "../platform/memoryBridge";
import {
  assertOnlyKeys,
  requireArray,
  requireIdentifier,
  requireInteger,
  requireRecord,
  requireText
} from "../kernel/validation";
import { canonicalJson, utf8ByteLength } from "./canonical";

export const ADAPTER_ECOSYSTEM_SCHEMA_VERSION = 1 as const;

export type AdapterAvailability =
  | { state: "ready"; version: string }
  | { state: "missing"; reason: string; remediation: string }
  | { state: "disabled"; reason: string }
  | { state: "unknown"; reason: string };

export interface EcosystemCapability {
  id: string;
  title: string;
  description: string;
  inputSchemaVersion: number;
  outputSchemaVersion: number;
  deterministicFixtureId?: string;
}

export interface AdapterExecutionPolicy {
  minimumTimeoutMs: number;
  maximumTimeoutMs: number;
  maximumOutputBytes: number;
  cancellation: "cooperative";
}

export interface AdapterEcosystemDescriptor {
  schemaVersion: typeof ADAPTER_ECOSYSTEM_SCHEMA_VERSION;
  adapterId: string;
  adapterVersion: string;
  kind: "builtin" | "external";
  availability: AdapterAvailability;
  capabilities: EcosystemCapability[];
  executionPolicy: AdapterExecutionPolicy;
}

export interface CapabilityDiscoveryRecord {
  adapterId: string;
  adapterVersion: string;
  capability: EcosystemCapability;
  availability: AdapterAvailability;
}

export interface AdapterExecutionPlan {
  adapterId: string;
  capabilityId: string;
  requestSha256: string;
  timeoutMs: number;
  maximumOutputBytes: number;
  state: "ready" | "blocked-tool-missing" | "blocked-adapter" | "cancelled-before-start";
  message: string;
}

export interface DeterministicFixtureResult {
  schemaVersion: 1;
  adapterId: string;
  adapterVersion: string;
  capabilityId: string;
  fixtureId: string;
  verificationBoundary: "deterministic-fixture-only";
  inputSha256: string;
  outputSha256: string;
  output: unknown;
}

export function validateAdapterEcosystemDescriptor(value: unknown): AdapterEcosystemDescriptor {
  const record = requireRecord(value, "adapter ecosystem descriptor");
  assertOnlyKeys(record, new Set([
    "schemaVersion",
    "adapterId",
    "adapterVersion",
    "kind",
    "availability",
    "capabilities",
    "executionPolicy"
  ]), "adapter ecosystem descriptor");
  if (record.schemaVersion !== ADAPTER_ECOSYSTEM_SCHEMA_VERSION) {
    throw new Error("Adapter ecosystem schema version is unsupported");
  }
  if (record.kind !== "builtin" && record.kind !== "external") {
    throw new Error("Adapter ecosystem kind is invalid");
  }
  const adapterId = requireIdentifier(record.adapterId, "adapter ecosystem descriptor.adapterId");
  const capabilities = validateCapabilities(record.capabilities, adapterId);
  const descriptor: AdapterEcosystemDescriptor = {
    schemaVersion: ADAPTER_ECOSYSTEM_SCHEMA_VERSION,
    adapterId,
    adapterVersion: validateSemanticVersion(
      record.adapterVersion,
      "adapter ecosystem descriptor.adapterVersion"
    ),
    kind: record.kind,
    availability: validateAvailability(record.availability),
    capabilities,
    executionPolicy: validateExecutionPolicy(record.executionPolicy)
  };
  if (descriptor.kind === "builtin" && descriptor.availability.state === "missing") {
    throw new Error("A built-in adapter cannot claim that an external tool is missing");
  }
  return descriptor;
}

export function discoverAdapterCapabilities(
  descriptors: ReadonlyArray<AdapterEcosystemDescriptor>
): CapabilityDiscoveryRecord[] {
  const seenAdapterIds = new Set<string>();
  const seenCapabilityIds = new Set<string>();
  const discovered: CapabilityDiscoveryRecord[] = [];
  for (const candidate of descriptors) {
    const descriptor = validateAdapterEcosystemDescriptor(candidate);
    if (seenAdapterIds.has(descriptor.adapterId)) {
      throw new Error(`Capability discovery contains duplicate adapter id ${descriptor.adapterId}`);
    }
    seenAdapterIds.add(descriptor.adapterId);
    for (const capability of descriptor.capabilities) {
      if (seenCapabilityIds.has(capability.id)) {
        throw new Error(`Capability discovery contains duplicate capability id ${capability.id}`);
      }
      seenCapabilityIds.add(capability.id);
      discovered.push({
        adapterId: descriptor.adapterId,
        adapterVersion: descriptor.adapterVersion,
        capability,
        availability: descriptor.availability
      });
    }
  }
  return discovered.sort((left, right) => compareText(left.capability.id, right.capability.id));
}

export function planAdapterExecution(
  candidateDescriptor: AdapterEcosystemDescriptor,
  capabilityId: string,
  request: unknown,
  options: { timeoutMs: number; cancellationRequested: boolean }
): AdapterExecutionPlan {
  const descriptor = validateAdapterEcosystemDescriptor(candidateDescriptor);
  const capability = descriptor.capabilities.find((item) => item.id === capabilityId);
  if (!capability) throw new Error(`Adapter ${descriptor.adapterId} does not expose capability ${capabilityId}`);
  const timeoutMs = requireInteger(
    options.timeoutMs,
    "adapter execution timeoutMs",
    descriptor.executionPolicy.minimumTimeoutMs,
    descriptor.executionPolicy.maximumTimeoutMs
  );
  const requestSha256 = sha256Hex(canonicalJson(request));
  const common = {
    adapterId: descriptor.adapterId,
    capabilityId,
    requestSha256,
    timeoutMs,
    maximumOutputBytes: descriptor.executionPolicy.maximumOutputBytes
  };
  if (options.cancellationRequested) {
    return {
      ...common,
      state: "cancelled-before-start",
      message: "Execution was not started because cancellation was already requested."
    };
  }
  if (descriptor.availability.state === "missing") {
    return {
      ...common,
      state: "blocked-tool-missing",
      message: `${descriptor.availability.reason} ${descriptor.availability.remediation}`.trim()
    };
  }
  if (descriptor.availability.state !== "ready") {
    return {
      ...common,
      state: "blocked-adapter",
      message: descriptor.availability.reason
    };
  }
  return {
    ...common,
    state: "ready",
    message: "Execution may be delegated to the existing bounded adapter boundary."
  };
}

/**
 * Convert elapsed/cancellation observations into a deterministic terminal
 * state. This helper does not schedule, wait for, or terminate any process.
 */
export function settleAdapterExecution(
  plan: AdapterExecutionPlan,
  observations: {
    elapsedMs: number;
    cancellationRequested: boolean;
    adapterStatus: "ok" | "failed";
  }
): "ok" | "failed" | "timeout" | "cancelled" | "not-started" {
  if (plan.state !== "ready") return "not-started";
  const elapsedMs = requireInteger(observations.elapsedMs, "adapter execution elapsedMs", 0, 86_400_000);
  if (observations.cancellationRequested) return "cancelled";
  if (elapsedMs > plan.timeoutMs) return "timeout";
  return observations.adapterStatus;
}

export function createDeterministicFixtureResult(
  candidateDescriptor: AdapterEcosystemDescriptor,
  capabilityId: string,
  fixtureId: string,
  input: unknown,
  output: unknown
): DeterministicFixtureResult {
  const descriptor = validateAdapterEcosystemDescriptor(candidateDescriptor);
  const capability = descriptor.capabilities.find((item) => item.id === capabilityId);
  if (!capability) throw new Error(`Adapter ${descriptor.adapterId} does not expose capability ${capabilityId}`);
  const stableFixtureId = requireIdentifier(fixtureId, "adapter fixture id");
  if (!capability.deterministicFixtureId || capability.deterministicFixtureId !== stableFixtureId) {
    throw new Error(`Capability ${capabilityId} does not declare fixture ${stableFixtureId}`);
  }
  const outputCanonical = canonicalJson(output);
  if (utf8ByteLength(outputCanonical) > descriptor.executionPolicy.maximumOutputBytes) {
    throw new Error(
      `Fixture output exceeds ${descriptor.executionPolicy.maximumOutputBytes} bytes`
    );
  }
  return {
    schemaVersion: 1,
    adapterId: descriptor.adapterId,
    adapterVersion: descriptor.adapterVersion,
    capabilityId,
    fixtureId: stableFixtureId,
    verificationBoundary: "deterministic-fixture-only",
    inputSha256: sha256Hex(canonicalJson(input)),
    outputSha256: sha256Hex(outputCanonical),
    output: JSON.parse(outputCanonical) as unknown
  };
}

function validateCapabilities(value: unknown, adapterId: string): EcosystemCapability[] {
  const capabilities = requireArray(value, "adapter ecosystem capabilities", 256)
    .map((candidate, index) => {
      const path = `adapter ecosystem capabilities[${index}]`;
      const record = requireRecord(candidate, path);
      assertOnlyKeys(record, new Set([
        "id",
        "title",
        "description",
        "inputSchemaVersion",
        "outputSchemaVersion",
        "deterministicFixtureId"
      ]), path);
      const id = requireIdentifier(record.id, `${path}.id`);
      if (!id.startsWith(`${adapterId}.`)) {
        throw new Error(`${path}.id must be namespaced by adapter id ${adapterId}`);
      }
      const deterministicFixtureId = record.deterministicFixtureId === undefined
        ? undefined
        : requireIdentifier(record.deterministicFixtureId, `${path}.deterministicFixtureId`);
      return {
        id,
        title: requireText(record.title, `${path}.title`, 240),
        description: requireText(record.description, `${path}.description`, 4_000),
        inputSchemaVersion: requireInteger(record.inputSchemaVersion, `${path}.inputSchemaVersion`, 1, 1_000),
        outputSchemaVersion: requireInteger(record.outputSchemaVersion, `${path}.outputSchemaVersion`, 1, 1_000),
        ...(deterministicFixtureId !== undefined ? { deterministicFixtureId } : {})
      };
    });
  if (capabilities.length === 0) throw new Error("Adapter ecosystem capabilities must not be empty");
  const ids = new Set<string>();
  for (const capability of capabilities) {
    if (ids.has(capability.id)) throw new Error(`Adapter ecosystem contains duplicate capability id ${capability.id}`);
    ids.add(capability.id);
  }
  return capabilities.sort((left, right) => compareText(left.id, right.id));
}

function validateAvailability(value: unknown): AdapterAvailability {
  const record = requireRecord(value, "adapter ecosystem availability");
  if (record.state === "ready") {
    assertOnlyKeys(record, new Set(["state", "version"]), "adapter ecosystem availability");
    return {
      state: "ready",
      version: requireText(record.version, "adapter ecosystem availability.version", 240)
    };
  }
  if (record.state === "missing") {
    assertOnlyKeys(record, new Set([
      "state", "reason", "remediation"
    ]), "adapter ecosystem availability");
    return {
      state: "missing",
      reason: requireText(record.reason, "adapter ecosystem availability.reason", 1_000),
      remediation: requireText(record.remediation, "adapter ecosystem availability.remediation", 1_000)
    };
  }
  if (record.state === "disabled" || record.state === "unknown") {
    assertOnlyKeys(record, new Set(["state", "reason"]), "adapter ecosystem availability");
    return {
      state: record.state,
      reason: requireText(record.reason, "adapter ecosystem availability.reason", 1_000)
    };
  }
  throw new Error("Adapter ecosystem availability state is invalid");
}

function validateExecutionPolicy(value: unknown): AdapterExecutionPolicy {
  const record = requireRecord(value, "adapter execution policy");
  assertOnlyKeys(record, new Set([
    "minimumTimeoutMs", "maximumTimeoutMs", "maximumOutputBytes", "cancellation"
  ]), "adapter execution policy");
  if (record.cancellation !== "cooperative") {
    throw new Error("Adapter execution policy cancellation mode is unsupported");
  }
  const minimumTimeoutMs = requireInteger(
    record.minimumTimeoutMs,
    "adapter execution policy.minimumTimeoutMs",
    50,
    120_000
  );
  const maximumTimeoutMs = requireInteger(
    record.maximumTimeoutMs,
    "adapter execution policy.maximumTimeoutMs",
    50,
    120_000
  );
  if (minimumTimeoutMs > maximumTimeoutMs) {
    throw new Error("Adapter execution timeout range is inverted");
  }
  return {
    minimumTimeoutMs,
    maximumTimeoutMs,
    maximumOutputBytes: requireInteger(
      record.maximumOutputBytes,
      "adapter execution policy.maximumOutputBytes",
      1_024,
      16_000_000
    ),
    cancellation: "cooperative"
  };
}

function validateSemanticVersion(value: unknown, path: string): string {
  const version = requireText(value, path, 64);
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`${path} must be a semantic version`);
  }
  return version;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
