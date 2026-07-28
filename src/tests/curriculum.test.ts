import { describe, expect, it } from "vitest";
import {
  capabilityStages,
  masteryModules
} from "../data/masteryCurriculum";
import {
  localCalendarPlanningModel,
  rebootDiagnostics,
  rebootMilestones,
  rebootProjectReleases,
  rebootResources,
  rebootSessions,
  rebootWeeklyReviewTemplate
} from "../data/rebootCurriculum";
import {
  canSkipAfterDiagnostic,
  currentMilestone,
  currentProjectRelease,
  isProofSession,
  milestoneSessionCounts,
  nextUnfinishedSession,
  numericCheckPasses,
  optionalRebootResourceIds,
  progressDimensions,
  validateCurriculum,
  weeklyReviewDue
} from "../lib/curriculum";
import type { LearningRecord } from "../lib/storage";

function record(overrides: Partial<LearningRecord> = {}): LearningRecord {
  return {
    status: "not-started",
    blocker: null,
    confidence: null,
    actualMinutes: 0,
    notes: "",
    evidenceReferences: [],
    attemptCount: 0,
    diagnosticScore: null,
    gateResult: "not-assessed",
    completedAt: null,
    contentVersion: "2026.07.26",
    ...overrides
  };
}

describe("authoritative reboot curriculum", () => {
  it("matches every workbook count and reference invariant", () => {
    expect(rebootSessions).toHaveLength(110);
    expect(rebootSessions.map((session) => session.id)).toEqual(
      Array.from({ length: 110 }, (_, index) => `S${String(index + 1).padStart(3, "0")}`)
    );
    expect(new Set(rebootSessions.map((session) => session.id)).size).toBe(110);
    expect(rebootSessions.reduce((sum, session) => sum + session.plannedMinutes, 0)).toBe(2750);
    expect(rebootMilestones).toHaveLength(10);
    for (const [milestoneId, count] of Object.entries(milestoneSessionCounts)) {
      expect(rebootSessions.filter((session) => session.milestoneId === milestoneId)).toHaveLength(count);
    }
    expect(rebootResources).toHaveLength(64);
    expect(new Set(rebootResources.map((resource) => resource.id)).size).toBe(64);
    const references = new Set(rebootSessions.flatMap((session) => session.resourceIds));
    expect(references.size).toBe(61);
    expect([...references].every((id) => rebootResources.some((resource) => resource.id === id))).toBe(true);
    expect(rebootResources.map((resource) => resource.id).filter((id) => !references.has(id)).sort())
      .toEqual([...optionalRebootResourceIds].sort());
    expect(rebootDiagnostics).toHaveLength(10);
    expect(rebootProjectReleases).toHaveLength(4);
    expect(rebootWeeklyReviewTemplate).toHaveLength(12);
  });

  it("keeps proof sessions mandatory after a passing diagnostic", () => {
    const proofSessions = rebootSessions.filter(isProofSession);
    expect(proofSessions).toHaveLength(10);
    expect(proofSessions.every((session) => !canSkipAfterDiagnostic(session, 4))).toBe(true);
    expect(canSkipAfterDiagnostic(rebootSessions.find((session) => !isProofSession(session))!, 3)).toBe(true);
    expect(canSkipAfterDiagnostic(rebootSessions.find((session) => !isProofSession(session))!, 2)).toBe(false);
    expect(nextUnfinishedSession({
      S001: record({ status: "done", completedAt: "2026-01-01T00:00:00Z" }),
      S002: record({ status: "done", completedAt: "2026-01-01T00:00:00Z" }),
      S003: record({ status: "done", completedAt: "2026-01-01T00:00:00Z" }),
      S004: record({ status: "done", completedAt: "2026-01-01T00:00:00Z" }),
      S005: record({ status: "done", completedAt: "2026-01-01T00:00:00Z" }),
      S006: record({
        status: "done",
        gateResult: "not-assessed",
        completedAt: "2026-01-01T00:00:00Z"
      })
    })?.id).toBe("S006");
  });

  it("calculates next session, current milestone and release from stable records", () => {
    const records: Record<string, LearningRecord> = {};
    expect(nextUnfinishedSession(records)?.id).toBe("S001");
    expect(currentMilestone(records).id).toBe("M0");
    expect(currentProjectRelease(records).id).toBe("P1");
    for (const session of rebootSessions.slice(0, 52)) {
      records[session.id] = record({
        status: "done",
        actualMinutes: session.plannedMinutes,
        gateResult: isProofSession(session) ? "passed" : "not-assessed",
        completedAt: "2026-01-01T00:00:00Z"
      });
    }
    expect(nextUnfinishedSession(records)?.id).toBe("S053");
    expect(currentMilestone(records).id).toBe("M5");
    expect(currentProjectRelease(records).id).toBe("P3");
  });

  it("keeps exposure, practice, evidence and mastery numerically separate", () => {
    const summary = progressDimensions(["a", "b", "c", "d"], {
      a: record({ status: "in-progress" }),
      b: record({ status: "done", actualMinutes: 25, completedAt: "2026-01-01T00:00:00Z" }),
      c: record({ status: "done", actualMinutes: 25, evidenceReferences: ["proof"], completedAt: "2026-01-01T00:00:00Z" }),
      d: record({ status: "done", actualMinutes: 25, evidenceReferences: ["proof"], gateResult: "passed", completedAt: "2026-01-01T00:00:00Z" })
    });
    expect(summary).toEqual({ exposure: 100, practice: 75, evidence: 50, mastery: 25, total: 4 });
  });

  it("uses an ISO calendar-week key while cycling the twelve-week workbook template", () => {
    const review = weeklyReviewDue({}, new Date("2026-08-02T12:00:00Z"));
    expect(review).toMatchObject({
      due: true,
      calendarWeek: 31,
      templateWeek: 7,
      weekKey: "2026-W31",
      plannedBlocks: 12
    });
    expect(weeklyReviewDue({
      "2026-W31": {
        weekKey: "2026-W31",
        plannedBlocks: 12,
        completedBlocks: 9,
        evidenceCount: 3,
        reflection: "",
        createdAt: "2026-08-02T12:00:00.000Z",
        updatedAt: "2026-08-02T12:00:00.000Z"
      }
    }, new Date("2026-08-02T12:00:00Z")).due).toBe(false);
    expect(localCalendarPlanningModel.missingEventMeaning).toBe("unknown");
    expect(JSON.stringify(localCalendarPlanningModel)).not.toContain("OneDrive");
  });
});

describe("complete E0-E4 curriculum", () => {
  it("contains five stages, 25 substantive domain modules and a valid reachable DAG", () => {
    expect(capabilityStages).toHaveLength(5);
    expect(masteryModules).toHaveLength(25);
    expect(masteryModules.map((module) => module.domainNumber).sort((a, b) => a - b))
      .toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    expect(validateCurriculum()).toEqual({ valid: true, errors: [] });
  });

  it("gives every module complete structure and an independently checked example", () => {
    for (const module of masteryModules) {
      expect(module.outcomes.length).toBeGreaterThan(0);
      expect(module.equations.length).toBeGreaterThan(0);
      expect(module.vocabulary.length).toBeGreaterThan(0);
      expect(module.commonMistakes.length).toBeGreaterThan(0);
      expect(module.evidenceRequirement.length).toBeGreaterThan(20);
      expect(module.masteryGate.length).toBeGreaterThan(20);
      expect(module.textEquivalent.length).toBeGreaterThan(20);
      expect(module.resources.length).toBeGreaterThan(0);
      expect(module.provenance.length).toBeGreaterThan(0);
      expect(numericCheckPasses(module.workedExample)).toBe(true);
    }
  });
});
