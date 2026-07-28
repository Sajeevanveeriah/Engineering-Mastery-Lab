import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PROGRESS_IMPORT_LIMITS,
  exportProgress,
  importProgress,
  loadProgress,
  emptyProgress,
  migrateProgressV1,
  migrateProgressV2
} from "../lib/storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

const malformedSections: Array<[string, Record<string, unknown>, RegExp]> = [
  ["skill level", { skillRatings: { controls: { level: 6, evidence: "test" } } }, /level/],
  ["skill evidence", { skillRatings: { controls: { level: 3, evidence: 42 } } }, /evidence/],
  ["challenge pass state", { challenges: { pid: { passed: "yes", completedAt: "2026-01-01T00:00:00Z" } } }, /passed/],
  ["challenge timestamp", { challenges: { pid: { passed: true, completedAt: "2026-02-30T00:00:00Z" } } }, /completedAt/],
  ["challenge notes", { challenges: { pid: { passed: true, completedAt: "2026-01-01T00:00:00Z", notes: 3 } } }, /notes/],
  ["reflection", { reflections: { pid: false } }, /reflections/],
  ["artefact", { artefacts: { report: "complete" } }, /artefacts/],
  ["checklist item", { sprintChecklist: { review: 1 } }, /sprintChecklist/],
  ["theme", { theme: "blue" }, /theme/]
];

describe("progress export/import", () => {
  it("round-trips a progress state", () => {
    const state = structuredClone(emptyProgress);
    state.skillRatings["controls-l1"] = { level: 4, evidence: "PID challenge screenshots" };
    state.challenges["pid-c2"] = { passed: true, completedAt: "2026-01-01T00:00:00Z" };
    state.labPositions.pid = {
      stageId: "simulate",
      visitedStageIds: ["learn", "simulate"],
      updatedAt: "2026-01-01T00:00:00Z"
    };
    state.recentItems = [{
      id: "pid",
      type: "lab",
      title: "PID control",
      route: "/learn/labs/pid",
      visitedAt: "2026-01-01T00:00:00Z"
    }];
    state.theme = "light";

    const json = exportProgress(state);
    const restored = importProgress(json);
    expect(restored).toEqual(state);
  });

  it("rejects non-object input", () => {
    expect(() => importProgress("42")).toThrow();
  });

  it("rejects unsupported versions", () => {
    expect(() => importProgress(JSON.stringify({ version: 99 }))).toThrow(/version/);
  });

  it("fills missing sections with defaults", () => {
    const restored = importProgress(JSON.stringify({ version: 1 }));
    expect(restored.version).toBe(3);
    expect(restored.skillRatings).toEqual({});
    expect(restored.theme).toBe("light");
  });

  it("migrates every valid version 1 field without loss", () => {
    const old = {
      version: 1 as const,
      skillRatings: { controls: { level: 4, evidence: "test record" } },
      challenges: { "pid-c1": { passed: true, completedAt: "2026-01-01T00:00:00Z", notes: "verified" } },
      reflections: { pid: "reflection" },
      artefacts: { "pid-ev0": true },
      sprintChecklist: { "sprint-sim": true },
      theme: "dark" as const
    };
    const migrated = migrateProgressV1(old);
    expect(migrated).toMatchObject({
      version: 3,
      skillRatings: old.skillRatings,
      challenges: old.challenges,
      reflections: old.reflections,
      artefacts: old.artefacts,
      sprintChecklist: old.sprintChecklist,
      theme: "dark",
      onboardingComplete: true
    });
    expect(migrated.profile).toBeNull();
  });

  it("preserves bounded unknown version 1 fields under legacy", () => {
    const restored = importProgress(JSON.stringify({ version: 1, experimentalPlanner: { week: 3, note: "keep me" } }));
    expect(restored.legacy).toEqual({ experimentalPlanner: { week: 3, note: "keep me" } });
  });

  it("round-trips version 2 profile, pathway, project, and evidence records", () => {
    const state = structuredClone(emptyProgress);
    state.onboardingComplete = true;
    state.profile = {
      version: 1,
      goal: "project",
      disciplines: ["Robotics"],
      experience: "advanced",
      weeklyEffortHours: 6,
      recommendedPathwayId: "mechatronics",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z"
    };
    state.pathways.controls = { status: "enrolled", enrolledAt: "2026-01-01T00:00:00Z", lastStepId: "lab-pid", completedStepIds: ["lab-mechanical"] };
    state.projects["temperature-controller"] = { status: "active", startedAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", completedMilestoneIds: ["requirements"], checkedEvidenceIds: [], notes: "work" };
    state.manualEvidence.push({ id: "manual-1", title: "Test", description: "Evidence", linkedSkills: ["controls"], discipline: "Controls", createdAt: "2026-01-01T00:00:00Z" });
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("migrates version 2 deterministically and preserves every existing section", () => {
    const version2 = {
      ...structuredClone(emptyProgress),
      version: 2 as const,
      skillRatings: { controls: { level: 2, evidence: "record" } },
      bookmarks: { "tool:converter": true },
      labPositions: {
        pid: {
          stageId: "simulate",
          visitedStageIds: ["learn", "simulate"],
          updatedAt: "2026-01-01T00:00:00Z"
        }
      },
      recentItems: [{
        id: "pid",
        type: "lab" as const,
        title: "PID control",
        route: "/learn/labs/pid?stage=simulate",
        visitedAt: "2026-01-01T00:00:00Z"
      }],
      projects: {
        "temperature-controller": {
          status: "paused" as const,
          startedAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
          completedMilestoneIds: ["requirements"],
          checkedEvidenceIds: [],
          notes: "retained"
        }
      }
    };
    const { engineeringWorkspaces, ...oldShape } = version2;
    expect(engineeringWorkspaces).toEqual({});
    const first = migrateProgressV2(oldShape);
    const second = importProgress(JSON.stringify(oldShape));

    expect(first).toEqual(second);
    expect(second).toMatchObject({
      version: 3,
      skillRatings: version2.skillRatings,
      bookmarks: version2.bookmarks,
      labPositions: version2.labPositions,
      projects: version2.projects,
      engineeringWorkspaces: {}
    });
    expect(second.recentItems).toEqual([{
      ...version2.recentItems[0],
      route: "/learn/labs/pid"
    }]);
    expect(importProgress(exportProgress(second))).toEqual(second);

    expect(() => migrateProgressV2({
      ...oldShape,
      recentItems: [{
        ...version2.recentItems[0],
        route: "/learn/labs/..?stage=learn"
      }]
    })).toThrow(/canonical internal route/);
  });

  it("round-trips a bounded validated engineering workspace record", () => {
    const state = structuredClone(emptyProgress);
    state.engineeringWorkspaces["motor-sizing"] = {
      schemaVersion: 1,
      projectId: "motor-sizing",
      bundleJson: "{\"schemaVersion\":1}",
      updatedAt: "2026-01-01T00:00:00Z"
    };
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("rejects malformed and oversized engineering workspace records", () => {
    expect(() => importProgress(JSON.stringify({
      ...emptyProgress,
      engineeringWorkspaces: {
        motor: {
          schemaVersion: 2,
          projectId: "motor",
          bundleJson: "{}",
          updatedAt: "2026-01-01T00:00:00Z"
        }
      }
    }))).toThrow(/schemaVersion/);

    expect(() => importProgress(JSON.stringify({
      ...emptyProgress,
      engineeringWorkspaces: {
        motor: {
          schemaVersion: 1,
          projectId: "motor",
          bundleJson: "x".repeat(PROGRESS_IMPORT_LIMITS.bundleCharacters + 1),
          updatedAt: "2026-01-01T00:00:00Z"
        }
      }
    }))).toThrow(/bundleJson/);
  });

  it("rejects unsafe nested legacy keys and malformed version 2 routes", () => {
    expect(() => importProgress('{"version":1,"old":{"__proto__":{"polluted":true}}}')).toThrow(/unsafe key/);
    expect(() => importProgress(JSON.stringify({ ...emptyProgress, recentItems: [{ id: "x", type: "tool", title: "x", route: "https://example.com", visitedAt: "2026-01-01T00:00:00Z" }] }))).toThrow(/internal route/);
    for (const route of [
      "//example.invalid/path",
      "/\\example.invalid/path",
      "/%5Cexample.invalid/path",
      "/%2F%2Fexample.invalid/path",
      "/learn?next=https://example.invalid",
      "/.",
      "/..",
      "/learn/../tools"
    ]) {
      expect(() => importProgress(JSON.stringify({
        ...emptyProgress,
        recentItems: [{
          id: "x",
          type: "tool",
          title: "x",
          route,
          visitedAt: "2026-01-01T00:00:00Z"
        }]
      }))).toThrow(/canonical internal route/);
    }
  });

  it.each(malformedSections)("rejects a malformed nested %s", (_name, section, message) => {
    expect(() => importProgress(JSON.stringify({ version: 1, ...section }))).toThrow(message);
  });

  it("rejects overlong evidence before replacing progress", () => {
    const evidence = "x".repeat(PROGRESS_IMPORT_LIMITS.evidenceCharacters + 1);
    expect(() => importProgress(JSON.stringify({
      version: 1,
      skillRatings: { controls: { level: 3, evidence } }
    }))).toThrow(/evidence/);
  });

  it("rejects sections that exceed their bounded entry count", () => {
    const artefacts = Object.fromEntries(
      Array.from({ length: PROGRESS_IMPORT_LIMITS.entriesPerSection + 1 }, (_, index) => [`item-${index}`, true])
    );
    expect(() => importProgress(JSON.stringify({ version: 1, artefacts }))).toThrow(/entries/);
  });

  it("rejects unsafe record keys", () => {
    expect(() => importProgress('{"version":1,"artefacts":{"__proto__":true}}')).toThrow(/unsafe key/);
  });
});

describe("progress storage fallback", () => {
  it("recovers a valid version 2 record when version 3 is malformed", () => {
    const { engineeringWorkspaces: _engineeringWorkspaces, ...version2Base } =
      structuredClone(emptyProgress);
    const version2 = {
      ...version2Base,
      version: 2,
      bookmarks: { "tool:converter": true }
    };
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => {
        if (key.endsWith("/v3")) return "{malformed";
        if (key.endsWith("/v2")) return JSON.stringify(version2);
        return null;
      })
    });

    const loaded = loadProgress();
    expect(loaded.version).toBe(3);
    expect(loaded.bookmarks).toEqual({ "tool:converter": true });
    expect(loaded.engineeringWorkspaces).toEqual({});
  });

  it("continues to version 1 after invalid newer records", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => {
        if (key.endsWith("/v3")) return JSON.stringify({ version: 99 });
        if (key.endsWith("/v2")) return "{malformed";
        if (key.endsWith("/v1")) {
          return JSON.stringify({ version: 1, artefacts: { "legacy-report": true } });
        }
        return null;
      })
    });

    expect(loadProgress()).toMatchObject({
      version: 3,
      artefacts: { "legacy-report": true },
      engineeringWorkspaces: {}
    });
  });
});
