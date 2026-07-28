import {
  ECOSYSTEM_LIMITS,
  assertEntityType,
  assertIsoTimestamp,
  assertOpaqueIdentifier,
  assertSafeInteger,
  assertSafeJsonObject,
  assertSafeJsonValue,
  canonicalJson,
  compareCanonicalText,
  type ActorId,
  type DeviceId,
  type JsonObject,
  type OperationId,
  type RecordId
} from "./validation";

export const SYNC_RECORD_SCHEMA_VERSION = 1 as const;
export const SYNC_EXPORT_SCHEMA_VERSION = 1 as const;

export type VersionVector = Readonly<Record<string, number>>;

export interface SyncRecordEnvelope<T extends JsonObject = JsonObject> {
  schemaVersion: typeof SYNC_RECORD_SCHEMA_VERSION;
  recordId: RecordId;
  entityType: string;
  actorId: ActorId;
  deviceId: DeviceId;
  operationId: OperationId;
  version: VersionVector;
  updatedAt: string;
  tombstone: boolean;
  payload: T | null;
}

export interface NewRecordInput<T extends JsonObject> {
  recordId: RecordId;
  entityType: string;
  actorId: ActorId;
  deviceId: DeviceId;
  operationId: OperationId;
  updatedAt: string;
  payload: T;
}

export interface RecordMutationInput {
  actorId: ActorId;
  deviceId: DeviceId;
  operationId: OperationId;
  updatedAt: string;
}

export type VersionRelationship =
  | "equal"
  | "left-dominates"
  | "right-dominates"
  | "concurrent";

export type SyncConflictReason =
  | "concurrent-version"
  | "equal-version-divergence";

export interface SyncConflict<T extends JsonObject = JsonObject> {
  recordId: RecordId;
  reason: SyncConflictReason;
  current: SyncRecordEnvelope<T>;
  incoming: SyncRecordEnvelope<T>;
}

export type SyncRelationship<T extends JsonObject = JsonObject> =
  | { status: "duplicate" }
  | { status: "fast-forward" }
  | { status: "stale" }
  | { status: "conflict"; conflict: SyncConflict<T> };

export type ConflictResolutionStrategy =
  | "keep-current"
  | "accept-incoming"
  | "latest-updated"
  | "merge-payload";

export interface ConflictResolutionInput<T extends JsonObject = JsonObject>
  extends RecordMutationInput {
  strategy: ConflictResolutionStrategy;
  mergedPayload?: T;
}

export type SyncApplyResult<T extends JsonObject = JsonObject> =
  | { status: "applied"; record: SyncRecordEnvelope<T> }
  | { status: "duplicate"; record: SyncRecordEnvelope<T> | null }
  | { status: "stale"; current: SyncRecordEnvelope<T> }
  | { status: "conflict"; conflict: SyncConflict<T> };

export interface SyncExportBundle {
  schemaVersion: typeof SYNC_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  records: SyncRecordEnvelope[];
  processedOperations: SyncRecordEnvelope[];
}

const ENVELOPE_KEYS = new Set([
  "schemaVersion",
  "recordId",
  "entityType",
  "actorId",
  "deviceId",
  "operationId",
  "version",
  "updatedAt",
  "tombstone",
  "payload"
]);
const EXPORT_KEYS = new Set([
  "schemaVersion",
  "exportedAt",
  "records",
  "processedOperations"
]);

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label} contains unsupported field ${key}`);
  }
}

export function validateVersionVector(value: unknown): Record<string, number> {
  const safe = assertSafeJsonObject(value, "version vector");
  const entries = Object.entries(safe);
  if (entries.length === 0 || entries.length > ECOSYSTEM_LIMITS.actorsPerVersion) {
    throw new Error(
      `version vector must contain 1 to ${ECOSYSTEM_LIMITS.actorsPerVersion} actors`
    );
  }
  const vector: Record<string, number> = {};
  for (const [actor, counter] of entries) {
    const actorId = assertOpaqueIdentifier(actor, "actor");
    vector[actorId] = assertSafeInteger(counter, `version counter for ${actor}`, 1);
  }
  return Object.fromEntries(
    Object.entries(vector).sort(([left], [right]) => compareCanonicalText(left, right))
  );
}

export function validateSyncRecordEnvelope<T extends JsonObject = JsonObject>(
  value: unknown
): SyncRecordEnvelope<T> {
  const safe = assertSafeJsonObject(value, "sync record envelope");
  assertExactKeys(safe, ENVELOPE_KEYS, "sync record envelope");
  if (safe.schemaVersion !== SYNC_RECORD_SCHEMA_VERSION) {
    throw new Error(`unsupported sync record schema version ${String(safe.schemaVersion)}`);
  }
  const recordId = assertOpaqueIdentifier(safe.recordId, "record");
  const entityType = assertEntityType(safe.entityType);
  const actorId = assertOpaqueIdentifier(safe.actorId, "actor");
  const deviceId = assertOpaqueIdentifier(safe.deviceId, "device");
  const operationId = assertOpaqueIdentifier(safe.operationId, "operation");
  const version = validateVersionVector(safe.version);
  const updatedAt = assertIsoTimestamp(safe.updatedAt, "record updatedAt");
  if (typeof safe.tombstone !== "boolean") {
    throw new Error("record tombstone must be a boolean");
  }
  if (version[actorId] === undefined) {
    throw new Error("record actor must be represented in its version vector");
  }
  if (safe.tombstone && safe.payload !== null) {
    throw new Error("a tombstone record must have a null payload");
  }
  if (!safe.tombstone && safe.payload === null) {
    throw new Error("a live record must have a payload");
  }
  const payload = safe.payload === null
    ? null
    : (assertSafeJsonObject(safe.payload, "record payload") as T);
  return {
    schemaVersion: SYNC_RECORD_SCHEMA_VERSION,
    recordId,
    entityType,
    actorId,
    deviceId,
    operationId,
    version,
    updatedAt,
    tombstone: safe.tombstone,
    payload
  };
}

function nextVersion(
  current: VersionVector,
  actorId: ActorId
): Record<string, number> {
  const vector = validateVersionVector(current);
  if (
    vector[actorId] === undefined &&
    Object.keys(vector).length >= ECOSYSTEM_LIMITS.actorsPerVersion
  ) {
    throw new Error("version vector actor limit reached");
  }
  const previous = vector[actorId] ?? 0;
  if (previous === Number.MAX_SAFE_INTEGER) {
    throw new Error("version counter cannot be incremented safely");
  }
  vector[actorId] = previous + 1;
  return Object.fromEntries(
    Object.entries(vector).sort(([left], [right]) => compareCanonicalText(left, right))
  );
}

function assertMutationInput(
  input: RecordMutationInput,
  earliestUpdatedAt: string
): RecordMutationInput {
  const actorId = assertOpaqueIdentifier(input.actorId, "actor");
  const deviceId = assertOpaqueIdentifier(input.deviceId, "device");
  const operationId = assertOpaqueIdentifier(input.operationId, "operation");
  const updatedAt = assertIsoTimestamp(input.updatedAt, "mutation updatedAt");
  if (updatedAt < earliestUpdatedAt) {
    throw new Error("mutation updatedAt must not precede the current record");
  }
  return { actorId, deviceId, operationId, updatedAt };
}

export function createSyncRecord<T extends JsonObject>(
  input: NewRecordInput<T>
): SyncRecordEnvelope<T> {
  const actorId = assertOpaqueIdentifier(input.actorId, "actor");
  const record: SyncRecordEnvelope<T> = {
    schemaVersion: SYNC_RECORD_SCHEMA_VERSION,
    recordId: assertOpaqueIdentifier(input.recordId, "record"),
    entityType: assertEntityType(input.entityType),
    actorId,
    deviceId: assertOpaqueIdentifier(input.deviceId, "device"),
    operationId: assertOpaqueIdentifier(input.operationId, "operation"),
    version: { [actorId]: 1 },
    updatedAt: assertIsoTimestamp(input.updatedAt, "record updatedAt"),
    tombstone: false,
    payload: assertSafeJsonObject(input.payload, "record payload") as T
  };
  return validateSyncRecordEnvelope<T>(record);
}

export function updateSyncRecord<T extends JsonObject>(
  currentValue: SyncRecordEnvelope<T>,
  payload: T,
  input: RecordMutationInput
): SyncRecordEnvelope<T> {
  const current = validateSyncRecordEnvelope<T>(currentValue);
  if (current.tombstone) {
    throw new Error("a deleted record must be restored explicitly");
  }
  const mutation = assertMutationInput(input, current.updatedAt);
  return validateSyncRecordEnvelope<T>({
    ...current,
    actorId: mutation.actorId,
    deviceId: mutation.deviceId,
    operationId: mutation.operationId,
    version: nextVersion(current.version, mutation.actorId),
    updatedAt: mutation.updatedAt,
    tombstone: false,
    payload: assertSafeJsonObject(payload, "record payload")
  });
}

export function deleteSyncRecord<T extends JsonObject>(
  currentValue: SyncRecordEnvelope<T>,
  input: RecordMutationInput
): SyncRecordEnvelope<T> {
  const current = validateSyncRecordEnvelope<T>(currentValue);
  if (current.tombstone) throw new Error("record is already deleted");
  const mutation = assertMutationInput(input, current.updatedAt);
  return validateSyncRecordEnvelope<T>({
    ...current,
    actorId: mutation.actorId,
    deviceId: mutation.deviceId,
    operationId: mutation.operationId,
    version: nextVersion(current.version, mutation.actorId),
    updatedAt: mutation.updatedAt,
    tombstone: true,
    payload: null
  });
}

export function restoreSyncRecord<T extends JsonObject>(
  currentValue: SyncRecordEnvelope<T>,
  payload: T,
  input: RecordMutationInput
): SyncRecordEnvelope<T> {
  const current = validateSyncRecordEnvelope<T>(currentValue);
  if (!current.tombstone) throw new Error("only a tombstone can be restored");
  const mutation = assertMutationInput(input, current.updatedAt);
  return validateSyncRecordEnvelope<T>({
    ...current,
    actorId: mutation.actorId,
    deviceId: mutation.deviceId,
    operationId: mutation.operationId,
    version: nextVersion(current.version, mutation.actorId),
    updatedAt: mutation.updatedAt,
    tombstone: false,
    payload: assertSafeJsonObject(payload, "record payload")
  });
}

export function compareVersionVectors(
  leftValue: VersionVector,
  rightValue: VersionVector
): VersionRelationship {
  const left = validateVersionVector(leftValue);
  const right = validateVersionVector(rightValue);
  let leftGreater = false;
  let rightGreater = false;
  const actors = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const actor of actors) {
    const leftCounter = left[actor] ?? 0;
    const rightCounter = right[actor] ?? 0;
    if (leftCounter > rightCounter) leftGreater = true;
    if (rightCounter > leftCounter) rightGreater = true;
  }
  if (leftGreater && rightGreater) return "concurrent";
  if (leftGreater) return "left-dominates";
  if (rightGreater) return "right-dominates";
  return "equal";
}

function semanticRecordSignature(record: SyncRecordEnvelope): string {
  return canonicalJson({
    entityType: record.entityType,
    version: record.version,
    tombstone: record.tombstone,
    payload: record.payload
  });
}

export function detectSyncRelationship<T extends JsonObject>(
  currentValue: SyncRecordEnvelope<T>,
  incomingValue: SyncRecordEnvelope<T>
): SyncRelationship<T> {
  const current = validateSyncRecordEnvelope<T>(currentValue);
  const incoming = validateSyncRecordEnvelope<T>(incomingValue);
  if (current.recordId !== incoming.recordId) {
    throw new Error("cannot compare envelopes for different records");
  }
  if (current.entityType !== incoming.entityType) {
    throw new Error("record entity type cannot change");
  }
  if (current.operationId === incoming.operationId) {
    if (canonicalJson(current) === canonicalJson(incoming)) return { status: "duplicate" };
    throw new Error("operation identifier was reused with different content");
  }
  const relationship = compareVersionVectors(current.version, incoming.version);
  if (relationship === "left-dominates") return { status: "stale" };
  if (relationship === "right-dominates") return { status: "fast-forward" };
  if (
    relationship === "equal" &&
    semanticRecordSignature(current) === semanticRecordSignature(incoming)
  ) {
    return { status: "duplicate" };
  }
  return {
    status: "conflict",
    conflict: {
      recordId: current.recordId,
      reason: relationship === "concurrent"
        ? "concurrent-version"
        : "equal-version-divergence",
      current,
      incoming
    }
  };
}

function mergedResolutionVersion(
  conflict: SyncConflict,
  resolverActorId: ActorId
): Record<string, number> {
  const current = validateVersionVector(conflict.current.version);
  const incoming = validateVersionVector(conflict.incoming.version);
  const actors = new Set([...Object.keys(current), ...Object.keys(incoming)]);
  if (
    !actors.has(resolverActorId) &&
    actors.size >= ECOSYSTEM_LIMITS.actorsPerVersion
  ) {
    throw new Error("version vector actor limit reached");
  }
  const merged: Record<string, number> = {};
  for (const actor of actors) {
    merged[actor] = Math.max(current[actor] ?? 0, incoming[actor] ?? 0);
  }
  const previous = merged[resolverActorId] ?? 0;
  if (previous === Number.MAX_SAFE_INTEGER) {
    throw new Error("version counter cannot be incremented safely");
  }
  merged[resolverActorId] = previous + 1;
  return Object.fromEntries(
    Object.entries(merged).sort(([left], [right]) => compareCanonicalText(left, right))
  );
}

export function resolveSyncConflict<T extends JsonObject>(
  conflictValue: SyncConflict<T>,
  input: ConflictResolutionInput<T>
): SyncRecordEnvelope<T> {
  const relationship = detectSyncRelationship(
    conflictValue.current,
    conflictValue.incoming
  );
  if (relationship.status !== "conflict") {
    throw new Error("the supplied records do not represent an unresolved conflict");
  }
  const conflict = relationship.conflict;
  const mutation = assertMutationInput(
    input,
    conflict.current.updatedAt > conflict.incoming.updatedAt
      ? conflict.current.updatedAt
      : conflict.incoming.updatedAt
  );
  if (
    mutation.operationId === conflict.current.operationId ||
    mutation.operationId === conflict.incoming.operationId
  ) {
    throw new Error("conflict resolution requires a new operation identifier");
  }

  let chosen: SyncRecordEnvelope<T>;
  if (input.strategy === "keep-current") {
    chosen = conflict.current;
  } else if (input.strategy === "accept-incoming") {
    chosen = conflict.incoming;
  } else if (input.strategy === "latest-updated") {
    if (conflict.current.updatedAt === conflict.incoming.updatedAt) {
      chosen = canonicalJson(conflict.current) <= canonicalJson(conflict.incoming)
        ? conflict.current
        : conflict.incoming;
    } else {
      chosen = conflict.current.updatedAt > conflict.incoming.updatedAt
        ? conflict.current
        : conflict.incoming;
    }
  } else {
    if (input.mergedPayload === undefined) {
      throw new Error("merge-payload resolution requires an explicit merged payload");
    }
    if (conflict.current.tombstone || conflict.incoming.tombstone) {
      throw new Error("a deletion conflict requires an explicit keep or accept strategy");
    }
    chosen = {
      ...conflict.current,
      tombstone: false,
      payload: assertSafeJsonObject(input.mergedPayload, "merged payload") as T
    };
  }

  return validateSyncRecordEnvelope<T>({
    schemaVersion: SYNC_RECORD_SCHEMA_VERSION,
    recordId: conflict.recordId,
    entityType: conflict.current.entityType,
    actorId: mutation.actorId,
    deviceId: mutation.deviceId,
    operationId: mutation.operationId,
    version: mergedResolutionVersion(conflict, mutation.actorId),
    updatedAt: mutation.updatedAt,
    tombstone: chosen.tombstone,
    payload: chosen.payload
  });
}

function validateSyncExportBundle(value: unknown): SyncExportBundle {
  const safeValue = assertSafeJsonValue(value, "sync export");
  if (
    safeValue === null ||
    typeof safeValue !== "object" ||
    Array.isArray(safeValue)
  ) {
    throw new Error("sync export must be an object");
  }
  assertExactKeys(safeValue, EXPORT_KEYS, "sync export");
  if (safeValue.schemaVersion !== SYNC_EXPORT_SCHEMA_VERSION) {
    throw new Error(`unsupported sync export schema version ${String(safeValue.schemaVersion)}`);
  }
  const exportedAt = assertIsoTimestamp(safeValue.exportedAt, "exportedAt");
  if (!Array.isArray(safeValue.records)) throw new Error("sync export records must be an array");
  if (!Array.isArray(safeValue.processedOperations)) {
    throw new Error("sync export processedOperations must be an array");
  }
  if (safeValue.records.length > ECOSYSTEM_LIMITS.recordsPerExport) {
    throw new Error("sync export exceeds the record limit");
  }
  if (safeValue.processedOperations.length > ECOSYSTEM_LIMITS.operationsPerExport) {
    throw new Error("sync export exceeds the operation limit");
  }
  const records = safeValue.records.map((record) => validateSyncRecordEnvelope(record));
  const processedOperations = safeValue.processedOperations.map((record) =>
    validateSyncRecordEnvelope(record)
  );
  const recordIds = new Set<string>();
  for (const record of records) {
    if (recordIds.has(record.recordId)) throw new Error("sync export has duplicate record ids");
    recordIds.add(record.recordId);
  }
  const operations = new Map<string, string>();
  for (const operation of processedOperations) {
    const signature = canonicalJson(operation);
    const previous = operations.get(operation.operationId);
    if (previous !== undefined) {
      if (previous !== signature) {
        throw new Error("sync export reuses an operation identifier");
      }
      throw new Error("sync export has duplicate processed operations");
    }
    operations.set(operation.operationId, signature);
  }
  for (const record of records) {
    const receipt = operations.get(record.operationId);
    if (receipt === undefined || receipt !== canonicalJson(record)) {
      throw new Error("each recovered record must have a matching operation receipt");
    }
  }
  return {
    schemaVersion: SYNC_EXPORT_SCHEMA_VERSION,
    exportedAt,
    records,
    processedOperations
  };
}

export function parseSyncExport(serialized: string): SyncExportBundle {
  if (typeof serialized !== "string") throw new Error("sync export must be text");
  if (new TextEncoder().encode(serialized).byteLength > ECOSYSTEM_LIMITS.exportBytes) {
    throw new Error("sync export exceeds the byte limit");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new Error("sync export is not valid JSON");
  }
  return validateSyncExportBundle(parsed);
}

export class InMemorySyncStore {
  private readonly records = new Map<string, SyncRecordEnvelope>();
  private readonly processedOperations = new Map<string, SyncRecordEnvelope>();

  apply<T extends JsonObject>(incomingValue: SyncRecordEnvelope<T>): SyncApplyResult<T> {
    const incoming = validateSyncRecordEnvelope<T>(incomingValue);
    const priorOperation = this.processedOperations.get(incoming.operationId);
    if (priorOperation !== undefined) {
      if (canonicalJson(priorOperation) !== canonicalJson(incoming)) {
        throw new Error("operation identifier was reused with different content");
      }
      const current = this.records.get(incoming.recordId);
      return {
        status: "duplicate",
        record: current ? (validateSyncRecordEnvelope<T>(current)) : null
      };
    }
    if (this.processedOperations.size >= ECOSYSTEM_LIMITS.operationsPerExport) {
      throw new Error("processed operation limit reached");
    }

    const currentValue = this.records.get(incoming.recordId);
    if (currentValue === undefined) {
      if (this.records.size >= ECOSYSTEM_LIMITS.recordsPerExport) {
        throw new Error("record limit reached");
      }
      this.processedOperations.set(incoming.operationId, incoming);
      this.records.set(incoming.recordId, incoming);
      return { status: "applied", record: incoming };
    }
    const current = validateSyncRecordEnvelope<T>(currentValue);
    const relationship = detectSyncRelationship(current, incoming);
    this.processedOperations.set(incoming.operationId, incoming);
    if (relationship.status === "duplicate") {
      return { status: "duplicate", record: current };
    }
    if (relationship.status === "stale") {
      return { status: "stale", current };
    }
    if (relationship.status === "conflict") {
      return relationship;
    }
    this.records.set(incoming.recordId, incoming);
    return { status: "applied", record: incoming };
  }

  readActive<T extends JsonObject = JsonObject>(recordIdValue: RecordId): SyncRecordEnvelope<T> | null {
    const recordId = assertOpaqueIdentifier(recordIdValue, "record");
    const record = this.records.get(recordId);
    if (record === undefined || record.tombstone) return null;
    return validateSyncRecordEnvelope<T>(record);
  }

  readEnvelope<T extends JsonObject = JsonObject>(recordIdValue: RecordId): SyncRecordEnvelope<T> | null {
    const recordId = assertOpaqueIdentifier(recordIdValue, "record");
    const record = this.records.get(recordId);
    return record === undefined ? null : validateSyncRecordEnvelope<T>(record);
  }

  listActive(): SyncRecordEnvelope[] {
    return [...this.records.values()]
      .filter((record) => !record.tombstone)
      .sort((left, right) => compareCanonicalText(left.recordId, right.recordId))
      .map((record) => validateSyncRecordEnvelope(record));
  }

  listIncludingDeleted(): SyncRecordEnvelope[] {
    return [...this.records.values()]
      .sort((left, right) => compareCanonicalText(left.recordId, right.recordId))
      .map((record) => validateSyncRecordEnvelope(record));
  }

  exportBundle(exportedAtValue: string): SyncExportBundle {
    const exportedAt = assertIsoTimestamp(exportedAtValue, "exportedAt");
    return validateSyncExportBundle({
      schemaVersion: SYNC_EXPORT_SCHEMA_VERSION,
      exportedAt,
      records: this.listIncludingDeleted(),
      processedOperations: [...this.processedOperations.values()]
        .sort((left, right) =>
          compareCanonicalText(left.operationId, right.operationId)
        )
        .map((record) => validateSyncRecordEnvelope(record))
    });
  }

  exportJson(exportedAt: string): string {
    const serialized = canonicalJson(this.exportBundle(exportedAt));
    if (new TextEncoder().encode(serialized).byteLength > ECOSYSTEM_LIMITS.exportBytes) {
      throw new Error("sync export exceeds the byte limit");
    }
    return serialized;
  }

  static recover(serialized: string): InMemorySyncStore {
    const bundle = parseSyncExport(serialized);
    const store = new InMemorySyncStore();
    for (const operation of bundle.processedOperations) {
      store.processedOperations.set(operation.operationId, operation);
    }
    for (const record of bundle.records) {
      store.records.set(record.recordId, record);
    }
    return store;
  }
}
