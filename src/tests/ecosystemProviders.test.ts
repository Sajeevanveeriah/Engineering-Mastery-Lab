import { describe, expect, it } from "vitest";
import {
  CONTENT_PACK_SCHEMA_VERSION,
  InMemoryCuratedContentPackProvider,
  InMemorySynchronisationProvider,
  SyntheticCohortProvider,
  SyntheticEducatorAnalyticsProvider,
  UnavailableCollaborationProvider,
  assertOpaqueIdentifier,
  createLocalReferenceEcosystem,
  createSyncRecord,
  createSyntheticCohortFixture,
  hostedCapabilityStates
} from "../lib/ecosystem";

describe("ecosystem provider contracts", () => {
  it("reports every hosted capability as honestly unavailable", () => {
    expect(Object.keys(hostedCapabilityStates).sort()).toEqual([
      "billing",
      "cohorts",
      "collaboration",
      "educator-analytics",
      "identity",
      "synchronisation"
    ]);
    for (const capability of Object.values(hostedCapabilityStates)) {
      expect(capability.status).toBe("unavailable");
      expect(capability.executionBoundary).toBe("none");
      expect(capability.networkAccess).toBe(false);
      expect(capability.hostedService).toBe(false);
      expect(capability.dataUse).toBe("none");
      expect(capability.explanation.length).toBeGreaterThan(20);
    }
  });

  it("returns an unavailable result instead of simulating collaboration", () => {
    const provider = new UnavailableCollaborationProvider();
    const result = provider.requestWorkspace({
      projectRecordId: assertOpaqueIdentifier(
        "record:aaaaaaaaaaaaaaab",
        "record"
      )
    });
    expect(result.status).toBe("unavailable");
    expect(provider.capability.explanation).toMatch(/not connected/i);
    expect(provider.capability.explanation).toMatch(/no multi-user/i);
  });

  it("provides a deterministic local sync reference with export and recovery", () => {
    const provider = new InMemorySynchronisationProvider();
    const record = createSyncRecord({
      recordId: assertOpaqueIdentifier("record:aaaaaaaaaaaaaaab", "record"),
      entityType: "scenario",
      actorId: assertOpaqueIdentifier("actor:aaaaaaaaaaaaaaab", "actor"),
      deviceId: assertOpaqueIdentifier("device:aaaaaaaaaaaaaaab", "device"),
      operationId: assertOpaqueIdentifier(
        "operation:aaaaaaaaaaaaaaab",
        "operation"
      ),
      updatedAt: "2026-01-01T00:00:00.000Z",
      payload: { speed: 1.2, unit: "m/s" }
    });
    expect(provider.apply(record).status).toBe("applied");
    const exported = provider.exportLocalState("2026-01-02T00:00:00.000Z");

    const recovered = new InMemorySynchronisationProvider();
    recovered.recoverLocalState(exported);
    expect(recovered.read(record.recordId)?.payload).toEqual({
      speed: 1.2,
      unit: "m/s"
    });
    expect(recovered.apply(record).status).toBe("duplicate");
    expect(provider.capability.explanation).toMatch(/not cloud/i);
  });

  it("clones synthetic cohort fixtures and applies privacy-safe analytics", () => {
    const fixture = createSyntheticCohortFixture();
    const cohorts = new SyntheticCohortProvider([fixture]);
    const first = cohorts.getSnapshot(fixture.cohort.id);
    expect(first.status).toBe("ready");
    if (first.status !== "ready") throw new Error("expected cohort fixture");
    first.value.memberships.pop();
    const second = cohorts.getSnapshot(fixture.cohort.id);
    expect(second.status).toBe("ready");
    if (second.status !== "ready") throw new Error("expected cohort fixture");
    expect(second.value.memberships).toHaveLength(fixture.memberships.length);

    const analytics = new SyntheticEducatorAnalyticsProvider(cohorts);
    const result = analytics.aggregateProgress(
      fixture.cohort.id,
      fixture.assignments[0].id
    );
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("expected aggregate");
    expect(result.value.status).toBe("released");
    expect(JSON.stringify(result.value)).not.toContain("actor:");
    expect(analytics.capability.explanation).toMatch(/no telemetry/i);
  });

  it("serves bounded local content manifests without leaking mutable references", () => {
    const packId = assertOpaqueIdentifier("pack:aaaaaaaaaaaaaaab", "pack");
    const provider = new InMemoryCuratedContentPackProvider([
      {
        schemaVersion: CONTENT_PACK_SCHEMA_VERSION,
        id: packId,
        version: "1.2.3",
        title: "Motor sizing foundations",
        contentIds: [
          assertOpaqueIdentifier("content:aaaaaaaaaaaaaaac", "content"),
          assertOpaqueIdentifier("content:aaaaaaaaaaaaaaab", "content")
        ]
      }
    ]);
    const first = provider.get(packId);
    expect(first.status).toBe("ready");
    if (first.status !== "ready") throw new Error("expected content pack");
    expect(first.value.contentIds).toEqual([
      "content:aaaaaaaaaaaaaaab",
      "content:aaaaaaaaaaaaaaac"
    ]);
    first.value.contentIds.pop();
    const second = provider.get(packId);
    expect(second.status).toBe("ready");
    if (second.status !== "ready") throw new Error("expected content pack");
    expect(second.value.contentIds).toHaveLength(2);
    expect(provider.capability.executionBoundary).toBe("local-memory");
    expect(provider.capability.networkAccess).toBe(false);
  });

  it("rejects duplicate packs and exposes one coherent local reference bundle", () => {
    const pack = {
      schemaVersion: CONTENT_PACK_SCHEMA_VERSION,
      id: assertOpaqueIdentifier("pack:aaaaaaaaaaaaaaab", "pack"),
      version: "1.0.0",
      title: "Synthetic pack",
      contentIds: [
        assertOpaqueIdentifier("content:aaaaaaaaaaaaaaab", "content")
      ]
    };
    expect(() =>
      new InMemoryCuratedContentPackProvider([pack, structuredClone(pack)])
    ).toThrow(/duplicate pack/);

    const ecosystem = createLocalReferenceEcosystem();
    expect(ecosystem.synchronisation.capability.status).toBe("local-reference");
    expect(ecosystem.conflictResolution.capability.status).toBe("local-reference");
    expect(ecosystem.cohorts.capability.dataUse).toBe("synthetic-fixtures");
    expect(ecosystem.collaboration.capability.status).toBe("unavailable");
    expect(ecosystem.contentPacks.list()).toHaveLength(1);
    expect(ecosystem.educatorAnalytics.capability.dataUse).toBe(
      "synthetic-fixtures"
    );
  });
});
