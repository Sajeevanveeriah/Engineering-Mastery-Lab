import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PROGRESS_IMPORT_LIMITS,
  exportProgress,
  importProgress,
  loadProgress,
  emptyProgress,
  migrateProgressV1,
  migrateProgressV2,
  migrateProgressV3
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

function createVersion2Base() {
  const {
    version: _version,
    themePreference: _themePreference,
    engineeringWorkspaces: _engineeringWorkspaces,
    curriculumRecords: _curriculumRecords,
    weeklyReviews: _weeklyReviews,
    ...common
  } = structuredClone(emptyProgress);
  return { ...common, version: 2 as const, theme: "light" as const };
}

function completedLearningRecord(overrides: Record<string, unknown> = {}) {
  return {
    status: "done",
    blocker: null,
    confidence: 4,
    actualMinutes: 25,
    notes: "Retained",
    evidenceReferences: ["test:result-1"],
    attemptCount: 1,
    diagnosticScore: null,
    gateResult: "passed",
    completedAt: "2026-01-01T00:00:00Z",
    contentVersion: "2026.07.28",
    ...overrides
  };
}

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
    state.themePreference = "light";

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
    expect(restored.version).toBe(4);
    expect(restored.skillRatings).toEqual({});
    expect(restored.themePreference).toBe("system");
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
      version: 4,
      skillRatings: old.skillRatings,
      challenges: old.challenges,
      reflections: old.reflections,
      artefacts: old.artefacts,
      sprintChecklist: old.sprintChecklist,
      themePreference: "dark",
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
      ...createVersion2Base(),
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
    const first = migrateProgressV2(version2);
    const second = importProgress(JSON.stringify(version2));

    expect(first).toEqual(second);
    expect(second).toMatchObject({
      version: 4,
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
      ...version2,
      recentItems: [{
        ...version2.recentItems[0],
        route: "/learn/labs/..?stage=learn"
      }]
    })).toThrow(/canonical internal route/);
  });

  it("migrates version 3 without losing an explicit theme or engineering workspace", () => {
    const version2 = createVersion2Base();
    const version3 = {
      ...version2,
      version: 3 as const,
      theme: "dark" as const,
      engineeringWorkspaces: {
        rover: {
          schemaVersion: 1 as const,
          projectId: "rover",
          bundleJson: "{\"schemaVersion\":1}",
          updatedAt: "2026-01-01T00:00:00Z"
        }
      }
    };
    const migrated = migrateProgressV3(version3);
    expect(migrated).toMatchObject({
      version: 4,
      themePreference: "dark",
      engineeringWorkspaces: version3.engineeringWorkspaces,
      curriculumRecords: {},
      weeklyReviews: {}
    });
    expect(importProgress(JSON.stringify(version3))).toEqual(migrated);
  });

  it("round-trips v4 curriculum and weekly review records", () => {
    const state = structuredClone(emptyProgress);
    state.curriculumRecords.S001 = completedLearningRecord() as typeof state.curriculumRecords.S001;
    state.weeklyReviews["2026-W31"] = {
      weekKey: "2026-W31",
      plannedBlocks: 12,
      completedBlocks: 10,
      evidenceCount: 3,
      reflection: "Reduced the next task after one blocker.",
      createdAt: "2026-07-27T00:00:00Z",
      updatedAt: "2026-07-27T00:00:00Z"
    };
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("migrates content aliases and blocks conflicting alias records", () => {
    const source = {
      ...structuredClone(emptyProgress),
      curriculumRecords: {
        "EML-E3-ROS2": completedLearningRecord()
      }
    };
    const migrated = importProgress(JSON.stringify(source));
    expect(migrated.curriculumRecords["EML-E3-D18"]).toEqual(completedLearningRecord());
    expect(migrated.curriculumRecords["EML-E3-ROS2"]).toBeUndefined();

    expect(() => importProgress(JSON.stringify({
      ...source,
      curriculumRecords: {
        "EML-E3-ROS2": completedLearningRecord(),
        "EML-E3-D18": completedLearningRecord({ notes: "Different record" })
      }
    }))).toThrow(/conflicting records/);
  });

  it("blocks diagnostic skips for proof sessions and scores below 3", () => {
    expect(() => importProgress(JSON.stringify({
      ...emptyProgress,
      curriculumRecords: {
        S006: completedLearningRecord({ status: "skipped-diagnostic", diagnosticScore: 4 })
      }
    }))).toThrow(/mandatory proof/);
    expect(() => importProgress(JSON.stringify({
      ...emptyProgress,
      curriculumRecords: {
        S005: completedLearningRecord({ status: "skipped-diagnostic", diagnosticScore: 2 })
      }
    }))).toThrow(/score 3 or 4/);
  });

  it("restores the exact canonical bytes held before an import", () => {
    const beforeState = structuredClone(emptyProgress);
    beforeState.bookmarks["tool:converter"] = true;
    const beforeBytes = exportProgress(beforeState);
    const imported = structuredClone(emptyProgress);
    imported.themePreference = "dark";
    expect(exportProgress(importProgress(exportProgress(imported)))).not.toBe(beforeBytes);
    expect(exportProgress(importProgress(beforeBytes))).toBe(beforeBytes);
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
    const version2 = {
      ...createVersion2Base(),
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
    expect(loaded.version).toBe(4);
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
      version: 4,
      artefacts: { "legacy-report": true },
      engineeringWorkspaces: {}
    });
  });
});
