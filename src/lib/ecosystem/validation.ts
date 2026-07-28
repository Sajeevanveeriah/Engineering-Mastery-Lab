export const ECOSYSTEM_LIMITS = Object.freeze({
  identifierCharacters: 48,
  entityTypeCharacters: 64,
  textCharacters: 240,
  payloadBytes: 64 * 1024,
  exportBytes: 2 * 1024 * 1024,
  recordsPerExport: 1_000,
  operationsPerExport: 2_000,
  actorsPerVersion: 32,
  jsonDepth: 8,
  objectKeys: 128,
  arrayItems: 25_000,
  cohortMembers: 500,
  cohortAssignments: 250,
  completionRecords: 25_000,
  evidenceReviews: 25_000,
  cohortsPerProvider: 250,
  contentPacks: 250,
  contentItemsPerPack: 500
});

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type OpaqueIdentifierKind =
  | "actor"
  | "device"
  | "record"
  | "operation"
  | "cohort"
  | "assignment"
  | "evidence"
  | "content"
  | "pack";

export type OpaqueIdentifier<K extends OpaqueIdentifierKind> = string & {
  readonly __opaqueIdentifierKind: K;
};

export type ActorId = OpaqueIdentifier<"actor">;
export type DeviceId = OpaqueIdentifier<"device">;
export type RecordId = OpaqueIdentifier<"record">;
export type OperationId = OpaqueIdentifier<"operation">;
export type CohortId = OpaqueIdentifier<"cohort">;
export type AssignmentId = OpaqueIdentifier<"assignment">;
export type EvidenceId = OpaqueIdentifier<"evidence">;
export type ContentId = OpaqueIdentifier<"content">;
export type PackId = OpaqueIdentifier<"pack">;

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const OPAQUE_BODY = "[a-z2-7]{16,32}";
const ENTITY_TYPE_PATTERN = /^[a-z][a-z0-9-]*$/;

export function assertOpaqueIdentifier<K extends OpaqueIdentifierKind>(
  value: unknown,
  kind: K
): OpaqueIdentifier<K> {
  // The format prevents direct names, email addresses and device labels.
  // Producers must still source the token from random or explicitly synthetic
  // entropy and must never encode personal data into it.
  if (typeof value !== "string" || value.length > ECOSYSTEM_LIMITS.identifierCharacters) {
    throw new Error(`${kind} identifier must be a bounded opaque string`);
  }
  const pattern = new RegExp(`^${kind}:${OPAQUE_BODY}$`);
  if (!pattern.test(value)) {
    throw new Error(
      `${kind} identifier must use the non-personal opaque form ${kind}:<base32 token>`
    );
  }
  return value as OpaqueIdentifier<K>;
}

export function assertEntityType(value: unknown, label = "entity type"): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > ECOSYSTEM_LIMITS.entityTypeCharacters ||
    !ENTITY_TYPE_PATTERN.test(value)
  ) {
    throw new Error(`${label} must be a bounded lower-case slug`);
  }
  return value;
}

export function assertBoundedText(
  value: unknown,
  label: string,
  maximum = ECOSYSTEM_LIMITS.textCharacters
): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum) {
    throw new Error(`${label} must contain between 1 and ${maximum} characters`);
  }
  return value;
}

export function assertIsoTimestamp(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be an ISO 8601 timestamp`);
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    throw new Error(`${label} must be a canonical ISO 8601 UTC timestamp`);
  }
  return value;
}

export function assertSafeInteger(
  value: unknown,
  label: string,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

export function compareCanonicalText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function assertSafeJsonValue(
  value: unknown,
  label = "value",
  depth = 0
): JsonValue {
  if (depth > ECOSYSTEM_LIMITS.jsonDepth) {
    throw new Error(`${label} exceeds the maximum JSON nesting depth`);
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number`);
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > ECOSYSTEM_LIMITS.arrayItems) {
      throw new Error(`${label} exceeds the maximum array item count`);
    }
    return value.map((item, index) =>
      assertSafeJsonValue(item, `${label}[${index}]`, depth + 1)
    );
  }
  if (!isPlainObject(value)) {
    throw new Error(`${label} must contain JSON-compatible values only`);
  }
  const entries = Object.entries(value);
  if (entries.length > ECOSYSTEM_LIMITS.objectKeys) {
    throw new Error(`${label} exceeds the maximum object key count`);
  }
  const result: JsonObject = {};
  for (const [key, nested] of entries) {
    if (UNSAFE_KEYS.has(key)) throw new Error(`${label} contains unsafe key ${key}`);
    if (key.length === 0 || key.length > ECOSYSTEM_LIMITS.identifierCharacters) {
      throw new Error(`${label} contains an invalid key`);
    }
    result[key] = assertSafeJsonValue(nested, `${label}.${key}`, depth + 1);
  }
  return result;
}

export function assertSafeJsonObject(value: unknown, label = "value"): JsonObject {
  const safe = assertSafeJsonValue(value, label);
  if (safe === null || typeof safe !== "object" || Array.isArray(safe)) {
    throw new Error(`${label} must be a JSON object`);
  }
  const bytes = new TextEncoder().encode(JSON.stringify(safe)).byteLength;
  if (bytes > ECOSYSTEM_LIMITS.payloadBytes) {
    throw new Error(`${label} exceeds the ${ECOSYSTEM_LIMITS.payloadBytes} byte limit`);
  }
  return safe;
}

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareCanonicalText(left, right))
        .map(([key, nested]) => [key, sortJson(nested)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown, label = "value"): string {
  return JSON.stringify(sortJson(assertSafeJsonValue(value, label)));
}

export function cloneJsonObject<T extends JsonObject>(value: T, label = "value"): T {
  return assertSafeJsonObject(value, label) as T;
}
