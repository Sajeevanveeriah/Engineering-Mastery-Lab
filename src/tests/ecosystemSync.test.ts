import { describe, expect, it } from "vitest";
import {
  ECOSYSTEM_LIMITS,
  InMemorySyncStore,
  assertOpaqueIdentifier,
  compareVersionVectors,
  createSyncRecord,
  deleteSyncRecord,
  detectSyncRelationship,
  parseSyncExport,
  resolveSyncConflict,
  restoreSyncRecord,
  updateSyncRecord,
  validateSyncRecordEnvelope
} from "../lib/ecosystem";

const actorA = assertOpaqueIdentifier("actor:aaaaaaaaaaaaaaab", "actor");
const actorB = assertOpaqueIdentifier("actor:aaaaaaaaaaaaaaac", "actor");
const actorC = assertOpaqueIdentifier("actor:aaaaaaaaaaaaaaad", "actor");
const deviceA = assertOpaqueIdentifier("device:aaaaaaaaaaaaaaab", "device");
const deviceB = assertOpaqueIdentifier("device:aaaaaaaaaaaaaaac", "device");
const recordId = assertOpaqueIdentifier("record:aaaaaaaaaaaaaaab", "record");

function operation(token: string) {
  return assertOpaqueIdentifier(`operation:${token}`, "operation");
}

function baseRecord() {
  return createSyncRecord({
    recordId,
    entityType: "engineering-project",
    actorId: actorA,
    deviceId: deviceA,
    operationId: operation("aaaaaaaaaaaaaaab"),
    updatedAt: "2026-01-01T00:00:00.000Z",
    payload: { title: "Motor sizing", safetyFactor: 1.5 }
  });
}

describe("ecosystem synchronisation records", () => {
  it("uses version vectors to detect concurrent edits and resolves them explicitly", () => {
    const base = baseRecord();
    const current = updateSyncRecord(
      base,
      { title: "Motor sizing", safetyFactor: 1.8 },
      {
        actorId: actorA,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaac"),
        updatedAt: "2026-01-02T00:00:00.000Z"
      }
    );
    const incoming = updateSyncRecord(
      base,
      { title: "Motor sizing analysis", safetyFactor: 1.5 },
      {
        actorId: actorB,
        deviceId: deviceB,
        operationId: operation("aaaaaaaaaaaaaaad"),
        updatedAt: "2026-01-03T00:00:00.000Z"
      }
    );

    expect(compareVersionVectors(current.version, incoming.version)).toBe("concurrent");
    const relationship = detectSyncRelationship(current, incoming);
    expect(relationship.status).toBe("conflict");
    if (relationship.status !== "conflict") throw new Error("expected conflict");

    const resolved = resolveSyncConflict(relationship.conflict, {
      strategy: "merge-payload",
      mergedPayload: {
        title: "Motor sizing analysis",
        safetyFactor: 1.8
      },
      actorId: actorC,
      deviceId: deviceA,
      operationId: operation("aaaaaaaaaaaaaaae"),
      updatedAt: "2026-01-04T00:00:00.000Z"
    });

    expect(compareVersionVectors(resolved.version, current.version)).toBe("left-dominates");
    expect(compareVersionVectors(resolved.version, incoming.version)).toBe("left-dominates");
    expect(resolved.payload).toEqual({
      safetyFactor: 1.8,
      title: "Motor sizing analysis"
    });
  });

  it("retains conflicts until a dominating resolution is applied", () => {
    const store = new InMemorySyncStore();
    const base = baseRecord();
    const current = updateSyncRecord(
      base,
      { title: "Current", safetyFactor: 1.7 },
      {
        actorId: actorA,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaaf"),
        updatedAt: "2026-01-02T00:00:00.000Z"
      }
    );
    const incoming = updateSyncRecord(
      base,
      { title: "Incoming", safetyFactor: 1.6 },
      {
        actorId: actorB,
        deviceId: deviceB,
        operationId: operation("aaaaaaaaaaaaaaag"),
        updatedAt: "2026-01-03T00:00:00.000Z"
      }
    );

    expect(store.apply(base).status).toBe("applied");
    expect(store.apply(current).status).toBe("applied");
    const result = store.apply(incoming);
    expect(result.status).toBe("conflict");
    expect(store.readActive(recordId)?.payload).toEqual({
      safetyFactor: 1.7,
      title: "Current"
    });
    if (result.status !== "conflict") throw new Error("expected conflict");

    const resolution = resolveSyncConflict(result.conflict, {
      strategy: "accept-incoming",
      actorId: actorA,
      deviceId: deviceA,
      operationId: operation("aaaaaaaaaaaaaaah"),
      updatedAt: "2026-01-04T00:00:00.000Z"
    });
    expect(store.apply(resolution).status).toBe("applied");
    expect(store.readActive(recordId)?.payload).toEqual({
      safetyFactor: 1.6,
      title: "Incoming"
    });
  });

  it("requires an explicit winner when a concurrent edit conflicts with deletion", () => {
    const base = baseRecord();
    const current = updateSyncRecord(
      base,
      { title: "Retain this edit", safetyFactor: 1.9 },
      {
        actorId: actorA,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaao"),
        updatedAt: "2026-01-02T00:00:00.000Z"
      }
    );
    const incomingDeletion = deleteSyncRecord(base, {
      actorId: actorB,
      deviceId: deviceB,
      operationId: operation("aaaaaaaaaaaaaaap"),
      updatedAt: "2026-01-03T00:00:00.000Z"
    });
    const relationship = detectSyncRelationship(current, incomingDeletion);
    expect(relationship.status).toBe("conflict");
    if (relationship.status !== "conflict") throw new Error("expected conflict");

    expect(() =>
      resolveSyncConflict(relationship.conflict, {
        strategy: "merge-payload",
        mergedPayload: { title: "Ambiguous merge", safetyFactor: 1.9 },
        actorId: actorC,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaaq"),
        updatedAt: "2026-01-04T00:00:00.000Z"
      })
    ).toThrow(/deletion conflict/);

    const resolvedDeletion = resolveSyncConflict(relationship.conflict, {
      strategy: "accept-incoming",
      actorId: actorC,
      deviceId: deviceA,
      operationId: operation("aaaaaaaaaaaaaaar"),
      updatedAt: "2026-01-04T00:00:00.000Z"
    });
    expect(resolvedDeletion.tombstone).toBe(true);
    expect(resolvedDeletion.payload).toBeNull();
  });

  it("uses durable tombstones and requires explicit restoration", () => {
    const store = new InMemorySyncStore();
    const base = baseRecord();
    const tombstone = deleteSyncRecord(base, {
      actorId: actorA,
      deviceId: deviceA,
      operationId: operation("aaaaaaaaaaaaaaai"),
      updatedAt: "2026-01-02T00:00:00.000Z"
    });
    store.apply(base);
    expect(store.apply(tombstone).status).toBe("applied");
    expect(store.readActive(recordId)).toBeNull();
    expect(store.readEnvelope(recordId)?.tombstone).toBe(true);
    expect(store.apply(tombstone).status).toBe("duplicate");
    expect(() =>
      updateSyncRecord(
        tombstone,
        { title: "Implicit resurrection", safetyFactor: 1.2 },
        {
          actorId: actorA,
          deviceId: deviceA,
          operationId: operation("aaaaaaaaaaaaaaaj"),
          updatedAt: "2026-01-03T00:00:00.000Z"
        }
      )
    ).toThrow(/restored explicitly/);

    const restored = restoreSyncRecord(
      tombstone,
      { title: "Explicit restoration", safetyFactor: 1.5 },
      {
        actorId: actorA,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaak"),
        updatedAt: "2026-01-03T00:00:00.000Z"
      }
    );
    expect(store.apply(restored).status).toBe("applied");
    expect(store.readActive(recordId)?.tombstone).toBe(false);
  });

  it("exports deterministic bounded state and recovers idempotency receipts", () => {
    const store = new InMemorySyncStore();
    const base = baseRecord();
    const updated = updateSyncRecord(
      base,
      { title: "Recovered", safetyFactor: 2 },
      {
        actorId: actorA,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaal"),
        updatedAt: "2026-01-02T00:00:00.000Z"
      }
    );
    store.apply(base);
    store.apply(updated);

    const exportedAt = "2026-01-05T00:00:00.000Z";
    const firstExport = store.exportJson(exportedAt);
    const secondExport = store.exportJson(exportedAt);
    expect(firstExport).toBe(secondExport);
    expect(new TextEncoder().encode(firstExport).byteLength).toBeLessThan(
      ECOSYSTEM_LIMITS.exportBytes
    );

    const recovered = InMemorySyncStore.recover(firstExport);
    expect(recovered.readActive(recordId)?.payload).toEqual({
      safetyFactor: 2,
      title: "Recovered"
    });
    expect(recovered.apply(base).status).toBe("duplicate");
    expect(recovered.apply(updated).status).toBe("duplicate");
  });

  it("rejects unsafe keys, personal-looking identifiers, invalid reuse, and oversized data", () => {
    expect(() =>
      assertOpaqueIdentifier("actor:saj@example.com", "actor")
    ).toThrow(/non-personal opaque form/);
    expect(() =>
      createSyncRecord({
        recordId,
        entityType: "engineering-project",
        actorId: actorA,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaam"),
        updatedAt: "2026-01-01T00:00:00.000Z",
        payload: JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, never>
      })
    ).toThrow(/unsafe key/);
    expect(() =>
      createSyncRecord({
        recordId,
        entityType: "engineering-project",
        actorId: actorA,
        deviceId: deviceA,
        operationId: operation("aaaaaaaaaaaaaaan"),
        updatedAt: "2026-01-01T00:00:00.000Z",
        payload: { text: "x".repeat(ECOSYSTEM_LIMITS.payloadBytes + 1) }
      })
    ).toThrow(/byte limit/);

    const base = baseRecord();
    expect(() =>
      validateSyncRecordEnvelope({
        ...base,
        operationId: base.operationId,
        payload: { title: "changed", safetyFactor: 1.5 },
        extra: true
      })
    ).toThrow(/unsupported field/);
    expect(() =>
      parseSyncExport(
        '{"schemaVersion":1,"exportedAt":"2026-01-01T00:00:00.000Z","records":[],"processedOperations":[],"__proto__":{}}'
      )
    ).toThrow(/unsafe key/);

    const store = new InMemorySyncStore();
    store.apply(base);
    expect(() =>
      store.apply({
        ...base,
        payload: { title: "reused operation", safetyFactor: 3 }
      })
    ).toThrow(/reused/);
  });
});
