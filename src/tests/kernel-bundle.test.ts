import { describe, expect, it } from "vitest";
import {
  InMemoryProjectBundleStore,
  KERNEL_LIMITS,
  canonicalStringify,
  calculateMotorSizingProjectScenario,
  createNotebookBlock,
  createMotorSizingVerticalSlice,
  exportProjectBundle,
  importProjectBundle,
  previewProjectBundle
} from "../lib/kernel";
import { sha256Hex } from "../lib/platform/memoryBridge";

describe("engineering project bundles", () => {
  it("round-trips a canonical bundle with SHA-256 integrity deterministically", () => {
    const fixture = createMotorSizingVerticalSlice();
    const imported = importProjectBundle(fixture.bundle);
    expect(imported.sourceVersion).toBe(2);
    expect(imported.migrated).toBe(false);
    expect(imported.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(imported.project).toEqual(fixture.project);
    expect(calculateMotorSizingProjectScenario(imported.project, "baseline")).toEqual(fixture.result);
    expect(calculateMotorSizingProjectScenario(imported.project, "reduced-speed"))
      .toEqual(fixture.alternateResult);
    expect(exportProjectBundle(imported.project)).toBe(fixture.bundle);
    expect(canonicalStringify({ z: 1, a: { y: 2, x: 3 } })).toBe(
      canonicalStringify({ a: { x: 3, y: 2 }, z: 1 })
    );
  });

  it("uses locale-independent ordinal ordering for canonical bytes and hashes", () => {
    const localeSensitive = {
      z: 10,
      aA: 9,
      aa: 8,
      "a.a": 6,
      "a:a": 5,
      "a-a": 4,
      a_a: 3,
      A: 2,
      a: 1,
      Z: 11
    };
    const canonical =
      '{"A":2,"Z":11,"a":1,"a-a":4,"a.a":6,"a:a":5,"aA":9,"a_a":3,"aa":8,"z":10}';
    expect(canonicalStringify(localeSensitive)).toBe(canonical);
    expect(sha256Hex(canonical)).toBe(
      "86228ee7abe30e7832bf997118a23ce6b357267b339d768e2a28cd81f0b4c5fa"
    );
  });

  it("rejects corruption, oversized bundles, unsafe keys and non-finite canonical values", () => {
    const fixture = createMotorSizingVerticalSlice();
    const corrupted = fixture.bundle.replace("Motor sizing study", "Motor sizing altered");
    expect(() => importProjectBundle(corrupted)).toThrow(/integrity/);
    expect(() => importProjectBundle("x".repeat(KERNEL_LIMITS.bundleCharacters + 1))).toThrow(/exceeds/);
    expect(() => importProjectBundle(
      `{"format":"engineering-mastery-lab/project-bundle","version":2,"__proto__":{"polluted":true}}`
    )).toThrow(/unsafe key/);
    expect(() => canonicalStringify({ invalid: Number.NaN })).toThrow(/non-finite/);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("previews conflicts, applies atomically and restores the previous snapshot through undo", () => {
    const fixture = createMotorSizingVerticalSlice();
    const changedProject = {
      ...fixture.project,
      name: "Changed motor sizing study",
      revision: fixture.project.revision + 1
    };
    const changedBundle = exportProjectBundle(changedProject);
    const store = new InMemoryProjectBundleStore(fixture.project);
    const before = store.snapshot();
    const preview = store.preview(changedBundle);
    expect(preview.conflicts).toContainEqual(
      expect.objectContaining({ scope: "project", id: fixture.project.id })
    );
    expect(() => store.apply(changedBundle)).toThrow(/unresolved conflicts/);
    expect(store.snapshot()).toEqual(before);
    expect(() => store.apply(changedBundle.replace("Changed", "Corrupted"), {
      conflictPolicy: "replace"
    })).toThrow(/integrity/);
    expect(store.snapshot()).toEqual(before);

    const receipt = store.apply(changedBundle, {
      expectedStoreRevision: 0,
      conflictPolicy: "replace"
    });
    expect(receipt).toMatchObject({ storeRevision: 1, replaced: true });
    expect(store.snapshot()?.name).toBe("Changed motor sizing study");
    expect(store.undo(1)).toEqual(before);
    expect(store.storeRevision).toBe(2);
  });

  it("migrates a populated version 1 project without loss and re-imports deterministically", () => {
    const fixture = createMotorSizingVerticalSlice();
    const legacyProject = Object.fromEntries(
      Object.entries(fixture.project).filter(([key]) => key !== "revision")
    );
    legacyProject.version = 1;
    const v1 = JSON.stringify({
      format: "engineering-mastery-lab/project-bundle",
      version: 1,
      project: legacyProject
    });
    const first = importProjectBundle(v1);
    const second = importProjectBundle(v1);
    expect(first).toMatchObject({ sourceVersion: 1, migrated: true });
    expect(first.project).toEqual({ ...fixture.project, revision: 0 });
    expect(second.project).toEqual(first.project);
    expect(calculateMotorSizingProjectScenario(first.project, "baseline")).toEqual(fixture.result);
    expect(calculateMotorSizingProjectScenario(first.project, "reduced-speed"))
      .toEqual(fixture.alternateResult);

    const currentBundle = exportProjectBundle(first.project);
    const cleanReImport = importProjectBundle(currentBundle);
    expect(cleanReImport).toMatchObject({ sourceVersion: 2, migrated: false });
    expect(cleanReImport.project).toEqual(first.project);
    expect(exportProjectBundle(cleanReImport.project)).toBe(currentBundle);
  });

  it("returns no conflict when previewing an identical deterministic re-import", () => {
    const fixture = createMotorSizingVerticalSlice();
    expect(previewProjectBundle(fixture.bundle, fixture.project).conflicts).toEqual([]);
  });

  it("reports and preserves local-only content before a replacement import", () => {
    const fixture = createMotorSizingVerticalSlice();
    const localOnly = {
      ...fixture.project,
      notebook: {
        ...fixture.project.notebook,
        blocks: [
          ...fixture.project.notebook.blocks,
          createNotebookBlock("local-only-note", "note", "Retain this local note.")
        ]
      }
    };
    const store = new InMemoryProjectBundleStore(localOnly);
    const before = store.snapshot();

    expect(store.preview(fixture.bundle).conflicts).toContainEqual({
      scope: "notebook",
      id: "local-only-note",
      message: "Local notebook local-only-note would be removed"
    });
    expect(() => store.apply(fixture.bundle)).toThrow(/unresolved conflicts/);
    expect(store.snapshot()).toEqual(before);
  });

  it("reports timestamp-only project provenance changes as import conflicts", () => {
    const fixture = createMotorSizingVerticalSlice();
    const incoming = {
      ...fixture.project,
      updatedAt: "2026-01-01T00:00:01.000Z"
    };
    expect(previewProjectBundle(exportProjectBundle(incoming), fixture.project).conflicts)
      .toContainEqual({
        scope: "project",
        id: fixture.project.id,
        message: "Project metadata differs"
      });
  });

  it("reports evidence relationship changes as import conflicts", () => {
    const fixture = createMotorSizingVerticalSlice();
    const incoming = {
      ...fixture.project,
      evidenceGraph: {
        ...fixture.project.evidenceGraph,
        edges: [
          ...fixture.project.evidenceGraph.edges,
          {
            from: fixture.project.id,
            to: "engineering-report",
            relation: "documents" as const
          }
        ]
      }
    };
    expect(previewProjectBundle(exportProjectBundle(incoming), fixture.project).conflicts)
      .toContainEqual({
        scope: "project",
        id: fixture.project.id,
        message: "Evidence graph relationships differ"
      });
  });
});
