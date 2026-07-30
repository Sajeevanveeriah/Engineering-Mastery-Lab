import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PROGRESS_IMPORT_LIMITS,
  buildAcademyCourseRoute,
  buildAcademyLessonRoute,
  buildAcademyUnitRoute,
  exportProgress,
  importProgress,
  loadProgress,
  loadProgressWithStatus,
  emptyProgress,
  migrateProgressV1,
  migrateProgressV2,
  migrateProgressV3,
  migrateProgressV4,
  recordAcademyAssessmentAttempt,
  recordAcademyQuestionAttempt,
  recordAcademyRecommendationReceipt,
  recordAcademySkillEvidence,
  saveProgress,
  setAcademyLessonBookmarked,
  setAcademyLessonNotes,
  setAcademyResumeCursor,
  setAcademyReviewState,
  startAcademyLesson,
  updateAcademyLesson,
  updateAcademyQuestionInteraction,
  validateProgressStateV4,
  type AcademyAssessmentAttempt,
  type AcademyQuestionInteractionRecord,
  type AcademyQuestionAttemptRecord,
  type ProgressStateV2,
  type ProgressStateV4
} from "../lib/storage";
import {
  academyCourseChallengeRoute,
  academyCourseRoute,
  academyLessonRoute,
  academyScrollOffset,
  academyUnitAssessmentRoute,
  academyUnitRoute,
  assessmentQuestionScores,
  bestAssessmentScore,
  latestAssessmentScore
} from "../lib/academy/navigation";
import { planAcademyMasteryEvidence } from "../lib/academy/masteryIntegration";
import type { Skill } from "../lib/academy/types";

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

function createVersion2Base(): ProgressStateV2 {
  const {
    version: _version,
    themePreference: _themePreference,
    engineeringWorkspaces: _engineeringWorkspaces,
    curriculumRecords: _curriculumRecords,
    weeklyReviews: _weeklyReviews,
    academy: _academy,
    ...common
  } = structuredClone(emptyProgress);
  return {
    ...common,
    recentItems: [],
    version: 2 as const,
    theme: "light" as const
  };
}

function createVersion4Base(): ProgressStateV4 {
  const {
    version: _version,
    academy: _academy,
    recentItems: _recentItems,
    ...common
  } = structuredClone(emptyProgress);
  return {
    ...common,
    version: 4,
    recentItems: []
  };
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

const academyLesson = {
  courseId: "ACADEMY-E0",
  unitId: "EML-E0-D01",
  lessonId: "EML-E0-D01-L01"
} as const;

function academyLessonRecord(index = 0) {
  const stage = Math.floor(index / 175);
  const stageIndex = index % 175;
  const unitNumber = Math.floor(stageIndex / 7) + 1;
  const lessonNumber = (stageIndex % 7) + 1;
  const courseId = `ACADEMY-E${stage}`;
  const unitId = `EML-E${stage}-D${String(unitNumber).padStart(2, "0")}`;
  const lessonId = `${unitId}-L${String(lessonNumber).padStart(2, "0")}`;
  return {
    courseId,
    unitId,
    lessonId,
    startedAt: "2026-07-30T00:00:00Z",
    updatedAt: "2026-07-30T00:00:00Z",
    completedAt: null,
    lastBlockId: null,
    scrollPosition: 0,
    videoPositions: {},
    notes: "",
    bookmarked: false,
    requirements: {
      knowledgeChecksPassed: false,
      practiceCompleted: false,
      appliedEvidenceSatisfied: false
    },
    completionEarned: false
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

  it("requires every native v5 top-level field", () => {
    expect(() => importProgress(JSON.stringify({
      version: 5,
      academy: structuredClone(emptyProgress.academy)
    }))).toThrow(/missing required field/);
  });

  it("fills missing sections with defaults", () => {
    const restored = importProgress(JSON.stringify({ version: 1 }));
    expect(restored.version).toBe(5);
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
      version: 5,
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
      version: 5,
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
      version: 5,
      themePreference: "dark",
      engineeringWorkspaces: version3.engineeringWorkspaces,
      curriculumRecords: {},
      weeklyReviews: {}
    });
    expect(importProgress(JSON.stringify(version3))).toEqual(migrated);
  });

  it("retains the exact v4 validator and preserves every v4 section in v5", () => {
    const version4 = createVersion4Base();
    version4.skillRatings.controls = { level: 4, evidence: "Controller test" };
    version4.challenges.pid = {
      passed: true,
      completedAt: "2026-07-29T00:00:00Z",
      notes: "Retained"
    };
    version4.reflections.pid = "Retained reflection";
    version4.artefacts.report = true;
    version4.sprintChecklist.review = true;
    version4.themePreference = "dark";
    version4.profile = {
      version: 1,
      displayName: "Saj",
      goal: "project",
      disciplines: ["Robotics"],
      experience: "advanced",
      weeklyEffortHours: 6,
      recommendedPathwayId: "robotics",
      createdAt: "2026-07-29T00:00:00Z",
      updatedAt: "2026-07-29T00:00:00Z"
    };
    version4.onboardingComplete = true;
    version4.pathways.robotics = {
      status: "enrolled",
      enrolledAt: "2026-07-29T00:00:00Z",
      lastStepId: "localisation",
      completedStepIds: ["kinematics"]
    };
    version4.labPositions.pid = {
      stageId: "simulate",
      visitedStageIds: ["learn", "simulate"],
      updatedAt: "2026-07-29T00:00:00Z"
    };
    version4.bookmarks["tool:converter"] = true;
    version4.recentItems = [{
      id: "pid",
      type: "lab",
      title: "PID control",
      route: "/learn/labs/pid",
      visitedAt: "2026-07-29T00:00:00Z"
    }];
    version4.projects.rover = {
      status: "active",
      startedAt: "2026-07-29T00:00:00Z",
      updatedAt: "2026-07-29T00:00:00Z",
      completedMilestoneIds: ["requirements"],
      checkedEvidenceIds: ["requirements-review"],
      notes: "Retained project"
    };
    version4.manualEvidence = [{
      id: "ev-1",
      title: "Rover evidence",
      description: "Retained evidence",
      linkedSkills: ["localisation"],
      discipline: "Robotics",
      createdAt: "2026-07-29T00:00:00Z"
    }];
    version4.achievements = ["first-proof"];
    version4.accessibility = { reducedMotion: true, highContrast: true };
    version4.engineeringWorkspaces.rover = {
      schemaVersion: 1,
      projectId: "rover",
      bundleJson: "{\"schemaVersion\":1}",
      updatedAt: "2026-07-29T00:00:00Z"
    };
    version4.curriculumRecords.S006 = completedLearningRecord() as
      typeof version4.curriculumRecords.S006;
    version4.weeklyReviews["2026-W31"] = {
      weekKey: "2026-W31",
      plannedBlocks: 12,
      completedBlocks: 10,
      evidenceCount: 3,
      reflection: "Retained review",
      createdAt: "2026-07-29T00:00:00Z",
      updatedAt: "2026-07-29T00:00:00Z"
    };
    version4.legacy = { retained: { lane: "v4" } };

    const exactV4 = validateProgressStateV4(version4);
    expect(exactV4).toEqual(version4);

    const migrated = migrateProgressV4(version4);
    const { version: _migratedVersion, academy, ...migratedV4Fields } = migrated;
    const { version: _version4, ...expectedV4Fields } = exactV4;
    expect(_migratedVersion).toBe(5);
    expect(migratedV4Fields).toEqual(expectedV4Fields);
    expect(academy).toEqual(emptyProgress.academy);
    expect(migrated.curriculumRecords.S006).toEqual(version4.curriculumRecords.S006);
  });

  it("round-trips native v5 academy state and every academy domain", () => {
    let state = startAcademyLesson(structuredClone(emptyProgress), {
      ...academyLesson,
      timestamp: "2026-07-30T00:00:00Z",
      blockId: "intro"
    });
    state = updateAcademyLesson(state, {
      ...academyLesson,
      timestamp: "2026-07-30T00:01:00Z",
      lastBlockId: "practice",
      scrollPosition: 0.625,
      videoPosition: {
        mediaId: "video-1",
        positionSeconds: 90,
        durationSeconds: 300
      },
      requirements: {
        knowledgeChecksPassed: true,
        practiceCompleted: true,
        appliedEvidenceSatisfied: true
      }
    });
    state = setAcademyLessonNotes(state, {
      ...academyLesson,
      timestamp: "2026-07-30T00:02:00Z",
      notes: "Check the body-frame sign convention."
    });
    state = setAcademyLessonBookmarked(state, {
      ...academyLesson,
      timestamp: "2026-07-30T00:03:00Z",
      bookmarked: true
    });
    state = setAcademyResumeCursor(state, {
      ...academyLesson,
      timestamp: "2026-07-30T00:04:00Z",
      blockId: "summary"
    });
    state = recordAcademyAssessmentAttempt(state, {
      attemptId: "attempt-1",
      assessmentId: "EML-E0-D01-L01-PRACTICE",
      responseSummary: {
        q1: "correct",
        q2: "incorrect-unit"
      },
      scorePercent: 75,
      hintsUsed: ["q2-h1"],
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: "2026-07-30T00:05:00Z",
      submittedAt: "2026-07-30T00:06:00Z"
    });
    state.academy.skillRecords["frame-transform"] = {
      skillId: "frame-transform",
      mastery: "proficient",
      evidence: [{
        evidenceId: "evidence-1",
        kind: "scored-activity",
        referenceId: "attempt-1",
        summary: "Applied the body-frame transform correctly.",
        recordedAt: "2026-07-30T00:06:00Z",
        scorePercent: 75,
        activityId: "frame-transform-practice"
      }],
      transitions: [{
        from: "not-started",
        to: "introduced",
        reason: "Lesson started",
        at: "2026-07-30T00:00:00Z"
      }, {
        from: "introduced",
        to: "practising",
        reason: "Practice submitted",
        at: "2026-07-30T00:05:00Z"
      }, {
        from: "practising",
        to: "proficient",
        reason: "Assessment evidence accepted",
        at: "2026-07-30T00:06:00Z"
      }],
      historyTruncated: false,
      reviewDueAt: "2026-08-06T00:06:00Z",
      updatedAt: "2026-07-30T00:06:00Z"
    };
    state.academy.unfinishedLabs["lab-frame-transform"] = {
      labId: "lab-frame-transform",
      ...academyLesson,
      status: "paused",
      lastStepId: "measure",
      blocker: null,
      notes: "Resume after sensor calibration.",
      startedAt: "2026-07-30T00:07:00Z",
      updatedAt: "2026-07-30T00:08:00Z"
    };
    state.academy.recommendationReceipts = [{
      receiptId: "recommendation-1",
      algorithmVersion: "academy-next-v1",
      inputFingerprint: "sha256-test-fixture",
      candidateIds: [academyLesson.lessonId, "EML-E0-D01-L02"],
      recommendationIds: ["EML-E0-D01-L02"],
      reasonCodes: ["prerequisite-complete"],
      generatedAt: "2026-07-30T00:09:00Z"
    }];
    state = setAcademyReviewState(state, {
      reviewId: "review-frame-transform",
      targetType: "skill",
      targetId: "frame-transform",
      state: "scheduled",
      dueAt: "2026-08-06T00:06:00Z",
      lastReviewedAt: null,
      updatedAt: "2026-07-30T00:09:00Z"
    });
    state.recentItems = [{
      id: academyLesson.lessonId,
      type: "lesson",
      title: "Frames and transforms",
      route: buildAcademyLessonRoute(
        academyLesson.courseId,
        academyLesson.unitId,
        academyLesson.lessonId
      ),
      visitedAt: "2026-07-30T00:04:00Z"
    }];

    const restored = importProgress(exportProgress(state));
    expect(restored).toEqual(state);
    expect(restored.version).toBe(5);
    expect(restored.academy.lessonRecords[academyLesson.lessonId]).toMatchObject({
      completionEarned: true,
      completedAt: "2026-07-30T00:01:00Z",
      bookmarked: true,
      lastBlockId: "summary"
    });
    expect(restored.academy.resumeCursor?.route).toBe(
      "/learn/courses/ACADEMY-E0/units/EML-E0-D01/lessons/EML-E0-D01-L01"
    );
  });

  it("earns lesson completion only when every requirement is satisfied", () => {
    let state = startAcademyLesson(structuredClone(emptyProgress), {
      ...academyLesson,
      timestamp: "2026-07-30T01:00:00Z"
    });
    state = updateAcademyLesson(state, {
      ...academyLesson,
      timestamp: "2026-07-30T01:01:00Z",
      requirements: {
        knowledgeChecksPassed: true,
        practiceCompleted: true
      }
    });
    expect(state.academy.lessonRecords[academyLesson.lessonId].completionEarned).toBe(false);
    expect(state.academy.lessonRecords[academyLesson.lessonId].completedAt).toBeNull();

    state = updateAcademyLesson(state, {
      ...academyLesson,
      timestamp: "2026-07-30T01:02:00Z",
      requirements: { appliedEvidenceSatisfied: true }
    });
    expect(state.academy.lessonRecords[academyLesson.lessonId].completionEarned).toBe(true);
    expect(state.academy.lessonRecords[academyLesson.lessonId].completedAt)
      .toBe("2026-07-30T01:02:00Z");

    expect(() => updateAcademyLesson(state, {
      ...academyLesson,
      timestamp: "2026-07-30T01:03:00Z",
      requirements: { practiceCompleted: false }
    })).toThrow(/cannot regress/);

    const forged = structuredClone(state);
    forged.academy.lessonRecords[academyLesson.lessonId].completionEarned = false;
    expect(() => importProgress(JSON.stringify(forged))).toThrow(/derived/);
  });

  it("supports all 175 lessons and rejects academy collections above their bound", () => {
    const state = structuredClone(emptyProgress);
    for (let index = 0; index < 175; index += 1) {
      const record = academyLessonRecord(index);
      state.academy.lessonRecords[record.lessonId] = record;
    }
    expect(importProgress(exportProgress(state)).academy.lessonRecords)
      .toHaveProperty("EML-E0-D25-L07");

    const oversized = structuredClone(emptyProgress);
    for (let index = 0; index <= PROGRESS_IMPORT_LIMITS.academyLessons; index += 1) {
      const record = academyLessonRecord(index);
      oversized.academy.lessonRecords[record.lessonId] = record;
    }
    expect(() => importProgress(JSON.stringify(oversized))).toThrow(/lessonRecords exceeds/);
  });

  it("rejects conflicting recommendation receipts for the same deterministic input", () => {
    const state = structuredClone(emptyProgress);
    state.academy.recommendationReceipts = [{
      receiptId: "recommendation-1",
      algorithmVersion: "academy-next-v1",
      inputFingerprint: "fixture-input",
      candidateIds: ["EML-E0-D01-L01", "EML-E0-D01-L02"],
      recommendationIds: ["EML-E0-D01-L01"],
      reasonCodes: ["first"],
      generatedAt: "2026-07-30T01:00:00Z"
    }, {
      receiptId: "recommendation-2",
      algorithmVersion: "academy-next-v1",
      inputFingerprint: "fixture-input",
      candidateIds: ["EML-E0-D01-L01", "EML-E0-D01-L02"],
      recommendationIds: ["EML-E0-D01-L02"],
      reasonCodes: ["second"],
      generatedAt: "2026-07-30T01:01:00Z"
    }];
    expect(() => importProgress(JSON.stringify(state))).toThrow(/deterministic input/);
  });

  it("records bounded idempotent recommendation receipts through the supported API", () => {
    const firstReceipt = {
      receiptId: "receipt-1",
      algorithmVersion: "academy-next-v1",
      inputFingerprint: "input-1",
      candidateIds: ["EML-E0-D01-L01", "EML-E0-D01-L02"],
      recommendationIds: ["EML-E0-D01-L02"],
      reasonCodes: ["next-in-sequence"],
      generatedAt: "2026-07-30T14:00:00Z"
    };
    let state = recordAcademyRecommendationReceipt(
      structuredClone(emptyProgress),
      firstReceipt
    );
    expect(state.academy.recommendationReceipts).toEqual([firstReceipt]);
    expect(recordAcademyRecommendationReceipt(state, firstReceipt)).toEqual(state);

    expect(() => recordAcademyRecommendationReceipt(state, {
      ...firstReceipt,
      recommendationIds: ["EML-E0-D01-L01"]
    })).toThrow(/conflicting receipt ID/);
    expect(() => recordAcademyRecommendationReceipt(state, {
      ...firstReceipt,
      receiptId: "receipt-same-input"
    })).toThrow(/conflicting deterministic input/);
    expect(() => recordAcademyRecommendationReceipt(state, {
      ...firstReceipt,
      receiptId: "receipt-older",
      inputFingerprint: "input-older",
      generatedAt: "2026-07-30T13:59:59Z"
    })).toThrow(/generatedAt/);

    for (
      let index = 2;
      index <= PROGRESS_IMPORT_LIMITS.academyRecommendationReceipts + 5;
      index += 1
    ) {
      state = recordAcademyRecommendationReceipt(state, {
        ...firstReceipt,
        receiptId: `receipt-${index}`,
        inputFingerprint: `input-${index}`,
        generatedAt: new Date(Date.UTC(2026, 6, 30, 14, index)).toISOString()
      });
    }
    expect(state.academy.recommendationReceipts)
      .toHaveLength(PROGRESS_IMPORT_LIMITS.academyRecommendationReceipts);
    expect(state.academy.recommendationReceipts[0].receiptId).toBe("receipt-6");
    expect(state.academy.recommendationReceipts.at(-1)?.receiptId).toBe("receipt-105");
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("truncates assessment attempt history deterministically to the newest attempts", () => {
    let state = structuredClone(emptyProgress);
    for (let index = 1; index <= PROGRESS_IMPORT_LIMITS.academyAttemptsPerAssessment + 5; index += 1) {
      state = recordAcademyAssessmentAttempt(state, {
        attemptId: `attempt-${index}`,
        assessmentId: "EML-E0-D01-L01-PRACTICE",
        responseSummary: { q1: index % 2 === 0 ? "correct" : "incorrect" },
        scorePercent: index,
        hintsUsed: [],
        feedbackState: "shown",
        revealState: "hidden",
        startedAt: `2026-07-30T02:${String(index).padStart(2, "0")}:00Z`,
        submittedAt: `2026-07-30T02:${String(index).padStart(2, "0")}:30Z`
      });
    }
    const attempts = state.academy.assessmentAttempts["EML-E0-D01-L01-PRACTICE"];
    expect(attempts).toHaveLength(PROGRESS_IMPORT_LIMITS.academyAttemptsPerAssessment);
    expect(attempts[0].attemptId).toBe("attempt-6");
    expect(attempts.at(-1)?.attemptId).toBe("attempt-25");
    expect(importProgress(exportProgress(state))).toEqual(state);
    const lastAttempt = attempts.at(-1);
    expect(lastAttempt).toBeDefined();
    if (lastAttempt) {
      expect(recordAcademyAssessmentAttempt(state, lastAttempt)).toEqual(state);
      expect(() => recordAcademyAssessmentAttempt(state, {
        ...lastAttempt,
        scorePercent: lastAttempt.scorePercent - 1
      })).toThrow(/conflicting attempt/);
    }
  });

  it("stores bounded per-question attempts and preserves them across export and import", () => {
    const questionId = "EML-E0-D01-L01-Q01";
    const createQuestionAttempt = (
      index: number
    ): AcademyQuestionAttemptRecord => ({
      attemptId: `question-attempt-${index}`,
      contextId: "EML-E0-D01-L01-PRACTICE",
      questionId,
      questionType: "single-choice",
      attemptedAt: `2026-07-30T03:${String(index).padStart(2, "0")}:00Z`,
      responseSummary: index % 2 === 0 ? "option-correct" : "option-retry",
      isCorrect: index % 2 === 0,
      scorePercent: index % 2 === 0 ? 100 : 0,
      misconceptionKeys: index % 2 === 0 ? [] : ["option-retry"],
      variantSeed: 10_000 + index,
      retryIndex: index % 2,
      hintsUsed: index % 3 === 0 ? ["hint-1"] : []
    });
    let state = structuredClone(emptyProgress);
    for (
      let index = 1;
      index <= PROGRESS_IMPORT_LIMITS.academyQuestionAttemptsPerQuestion + 5;
      index += 1
    ) {
      state = recordAcademyQuestionAttempt(
        state,
        createQuestionAttempt(index)
      );
    }

    const attempts = state.academy.questionAttempts[questionId];
    expect(attempts).toHaveLength(
      PROGRESS_IMPORT_LIMITS.academyQuestionAttemptsPerQuestion
    );
    expect(attempts[0].attemptId).toBe("question-attempt-6");
    expect(attempts.at(-1)?.attemptId).toBe("question-attempt-25");
    const restored = importProgress(exportProgress(state));
    expect(restored.academy.questionAttempts[questionId]).toEqual(attempts);

    expect(recordAcademyQuestionAttempt(
      state,
      createQuestionAttempt(25)
    )).toEqual(state);
    expect(() => recordAcademyQuestionAttempt(
      state,
      {
        ...createQuestionAttempt(25),
        responseSummary: "conflicting replay"
      }
    )).toThrow(/conflicting attempt/);

    const mismatchedKey = structuredClone(state);
    mismatchedKey.academy.questionAttempts["different-question"] = [
      createQuestionAttempt(26)
    ];
    expect(() => importProgress(JSON.stringify(mismatchedKey))).toThrow(
      /must match its record key/
    );

    const inconsistentScore = createQuestionAttempt(26);
    inconsistentScore.isCorrect = true;
    inconsistentScore.scorePercent = 0;
    expect(() => recordAcademyQuestionAttempt(
      state,
      inconsistentScore
    )).toThrow(/must agree/);
  });

  it("rejects forged Academy V2 question and assessment attempt identities", () => {
    const questionId = "EML-E0-D01-L01-V2-Q2-BASE";
    const assessmentId = "EML-E0-D01-L01-V2-ASSESSMENT";
    const questionAttempt: AcademyQuestionAttemptRecord = {
      attemptId: "ATTEMPT-V2-CANONICAL",
      contextId: assessmentId,
      questionId,
      questionType: "ordering",
      attemptedAt: "2026-07-30T03:30:00Z",
      responseSummary: "Ordered response",
      isCorrect: true,
      scorePercent: 100,
      misconceptionKeys: [],
      variantSeed: 42,
      retryIndex: 0,
      hintsUsed: [`${questionId}-H1`]
    };
    expect(() => recordAcademyQuestionAttempt(
      structuredClone(emptyProgress),
      questionAttempt
    )).not.toThrow();
    expect(() => recordAcademyQuestionAttempt(
      structuredClone(emptyProgress),
      {
        ...questionAttempt,
        contextId: "EML-E0-D01-L01-FORGED-ASSESSMENT"
      }
    )).toThrow(/canonical V2 assessment identifier/);
    expect(() => recordAcademyQuestionAttempt(
      structuredClone(emptyProgress),
      {
        ...questionAttempt,
        questionId: "EML-E0-D01-L01-V2-Q2-RETRY"
      }
    )).toThrow(/scenario must match/);
    expect(() => recordAcademyQuestionAttempt(
      structuredClone(emptyProgress),
      {
        ...questionAttempt,
        hintsUsed: ["EML-E0-D01-L01-V2-Q3-BASE-H1"]
      }
    )).toThrow(/canonical hint ids/);

    const assessmentAttempt: AcademyAssessmentAttempt = {
      attemptId: "ATTEMPT-V2-ASSESSMENT",
      assessmentId,
      responseSummary: { [questionId]: "Ordered response" },
      scorePercent: 100,
      hintsUsed: [`${questionId}-H1`],
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: "2026-07-30T03:30:00Z",
      submittedAt: "2026-07-30T03:30:00Z"
    };
    expect(() => recordAcademyAssessmentAttempt(
      structuredClone(emptyProgress),
      assessmentAttempt
    )).not.toThrow();
    expect(() => recordAcademyAssessmentAttempt(
      structuredClone(emptyProgress),
      {
        ...assessmentAttempt,
        responseSummary: {
          "EML-E0-D01-L02-V2-Q2-BASE": "Foreign lesson response"
        }
      }
    )).toThrow(/canonical Academy V2 assessment/);
  });

  it("accumulates V2 question interaction events immutably and idempotently", () => {
    const original = structuredClone(emptyProgress);
    const identity = {
      questionId: "EML-E0-D01-L01-V2-Q2-RETRY",
      contextId: "EML-E0-D01-L01-V2-ASSESSMENT",
      scenarioMode: "retry" as const,
      retryIndex: 1 as const
    };
    const retryEvent = {
      ...identity,
      kind: "retry" as const,
      timestamp: "2026-07-30T04:00:00Z"
    };
    let state = updateAcademyQuestionInteraction(original, retryEvent);
    expect(original.academy.questionInteractions).toEqual({});
    expect(updateAcademyQuestionInteraction(state, retryEvent)).toEqual(state);

    const hintEvent = {
      ...identity,
      kind: "hint" as const,
      hintId: "EML-E0-D01-L01-V2-Q2-RETRY-H2",
      timestamp: "2026-07-30T04:01:00Z"
    };
    state = updateAcademyQuestionInteraction(state, hintEvent);
    expect(updateAcademyQuestionInteraction(state, hintEvent)).toEqual(state);

    const attemptEvent = {
      ...identity,
      kind: "attempt" as const,
      scorePercent: 50,
      isCorrect: false,
      revealedHintIds: [
        "EML-E0-D01-L01-V2-Q2-RETRY-H1",
        "EML-E0-D01-L01-V2-Q2-RETRY-H2"
      ],
      solutionRevealed: false,
      timestamp: "2026-07-30T04:02:00Z"
    };
    state = updateAcademyQuestionInteraction(state, attemptEvent);
    expect(updateAcademyQuestionInteraction(state, attemptEvent)).toEqual(state);
    expect(state.academy.questionInteractions[identity.questionId]).toMatchObject({
      revealedHintCount: 2,
      retryOpened: true,
      lastAttemptScorePercent: 50,
      lastAttemptIsCorrect: false
    });

    state = updateAcademyQuestionInteraction(state, {
      ...identity,
      kind: "solution",
      timestamp: "2026-07-30T04:03:00Z"
    });
    state = updateAcademyQuestionInteraction(state, {
      ...identity,
      kind: "attempt",
      scorePercent: 100,
      isCorrect: true,
      revealedHintIds: attemptEvent.revealedHintIds,
      solutionRevealed: true,
      timestamp: "2026-07-30T04:04:00Z"
    });

    expect(state.academy.questionInteractions[identity.questionId]).toEqual({
      questionId: identity.questionId,
      contextId: identity.contextId,
      scenarioMode: "retry",
      retryIndex: 1,
      revealedHintIds: attemptEvent.revealedHintIds,
      revealedHintCount: 2,
      solutionRevealed: true,
      retryOpened: true,
      lastAttemptScorePercent: 100,
      lastAttemptIsCorrect: true,
      updatedAt: "2026-07-30T04:04:00Z"
    });
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("bounds V2 question interaction hints and records deterministically", () => {
    const hintQuestionId = "EML-E0-D01-L01-V2-Q3-BASE";
    let hintState = structuredClone(emptyProgress);
    for (
      let index = 1;
      index <= PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion;
      index += 1
    ) {
      hintState = updateAcademyQuestionInteraction(hintState, {
        kind: "hint",
        questionId: hintQuestionId,
        contextId: "EML-E0-D01-L01-V2-ASSESSMENT",
        scenarioMode: "base",
        retryIndex: 0,
        hintId: `${hintQuestionId}-H${index}`,
        timestamp: `2026-07-30T05:00:${String(index).padStart(2, "0")}Z`
      });
    }
    const hints = hintState.academy.questionInteractions[hintQuestionId];
    expect(hints.revealedHintIds).toHaveLength(
      PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion
    );
    expect(hints.revealedHintCount).toBe(
      PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion
    );
    expect(hints.revealedHintIds[0]).toBe(`${hintQuestionId}-H1`);
    expect(hints.revealedHintIds).toContain(`${hintQuestionId}-H16`);

    const recordState = structuredClone(emptyProgress);
    const stageForUnit = (unitNumber: number): number => {
      if (unitNumber <= 3) return 0;
      if (unitNumber <= 8) return 1;
      if (unitNumber <= 16) return 2;
      if (unitNumber <= 23) return 3;
      return 4;
    };
    const makeInteraction = (index: number): AcademyQuestionInteractionRecord => {
      const mode = index % 2 === 0 ? "BASE" : "RETRY";
      const questionNumber = 2 + (Math.floor(index / 2) % 4);
      const lessonNumber = 1 + (Math.floor(index / 8) % 7);
      const unitNumber = 1 + Math.floor(index / 56);
      const stage = stageForUnit(unitNumber);
      const lessonId = `EML-E${stage}-D${String(unitNumber).padStart(2, "0")}-L${
        String(lessonNumber).padStart(2, "0")
      }`;
      const questionId = `${lessonId}-V2-Q${questionNumber}-${mode}`;
      return {
        questionId,
        contextId: `${lessonId}-V2-ASSESSMENT`,
        scenarioMode: mode === "BASE" ? "base" : "retry",
        retryIndex: mode === "BASE" ? 0 : 1,
        revealedHintIds: [],
        revealedHintCount: 0,
        solutionRevealed: false,
        retryOpened: false,
        lastAttemptScorePercent: null,
        lastAttemptIsCorrect: null,
        updatedAt: new Date(Date.UTC(2026, 6, 1, 0, index)).toISOString()
      };
    };
    for (
      let index = 0;
      index < PROGRESS_IMPORT_LIMITS.academyQuestionInteractions;
      index += 1
    ) {
      const record = makeInteraction(index);
      recordState.academy.questionInteractions[record.questionId] = record;
    }
    const oldestQuestionId = makeInteraction(0).questionId;
    const newestIndex = PROGRESS_IMPORT_LIMITS.academyQuestionInteractions;
    const newest = makeInteraction(newestIndex);
    const bounded = updateAcademyQuestionInteraction(recordState, {
      kind: "solution",
      questionId: newest.questionId,
      contextId: newest.contextId,
      scenarioMode: newest.scenarioMode,
      retryIndex: newest.retryIndex,
      timestamp: newest.updatedAt
    });
    expect(Object.keys(bounded.academy.questionInteractions)).toHaveLength(
      PROGRESS_IMPORT_LIMITS.academyQuestionInteractions
    );
    expect(bounded.academy.questionInteractions).not.toHaveProperty(oldestQuestionId);
    expect(bounded.academy.questionInteractions).toHaveProperty(newest.questionId);

    const oversized = structuredClone(bounded);
    const extra = makeInteraction(newestIndex + 1);
    oversized.academy.questionInteractions[extra.questionId] = extra;
    expect(() => importProgress(JSON.stringify(oversized))).toThrow(
      /questionInteractions exceeds/
    );
  });

  it("rejects invalid V2 question interaction events and malformed imports", () => {
    const interactionIdentity = {
      questionId: "EML-E0-D01-L01-V2-Q4-BASE",
      contextId: "EML-E0-D01-L01-V2-ASSESSMENT",
      scenarioMode: "base" as const,
      retryIndex: 0 as const,
      timestamp: "2026-07-30T06:00:00Z"
    };
    const baseEvent = {
      ...interactionIdentity,
      kind: "hint" as const,
      hintId: "EML-E0-D01-L01-V2-Q4-BASE-H1"
    };
    const state = updateAcademyQuestionInteraction(
      structuredClone(emptyProgress),
      baseEvent
    );

    expect(() => updateAcademyQuestionInteraction(state, {
      ...baseEvent,
      contextId: "EML-E0-D01-L01-OTHER-ASSESSMENT",
      timestamp: "2026-07-30T06:01:00Z"
    })).toThrow(/canonical V2 assessment identifier/);
    expect(() => updateAcademyQuestionInteraction(state, {
      ...baseEvent,
      hintId: "EML-E0-D01-L01-V2-Q4-BASE-H2",
      timestamp: "2026-07-30T05:59:59Z"
    })).toThrow(/cannot be earlier/);
    expect(() => updateAcademyQuestionInteraction(state, {
      ...baseEvent,
      retryIndex: 1
    } as never)).toThrow(/must be 0 for base scenario/);
    expect(() => updateAcademyQuestionInteraction(state, {
      ...interactionIdentity,
      kind: "attempt",
      scorePercent: 0,
      isCorrect: true,
      revealedHintIds: [],
      solutionRevealed: false,
      timestamp: "2026-07-30T06:02:00Z"
    })).toThrow(/must agree/);
    expect(() => updateAcademyQuestionInteraction(state, {
      ...interactionIdentity,
      kind: "attempt",
      scorePercent: 0,
      isCorrect: false,
      revealedHintIds: Array.from(
        { length: PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion + 1 },
        (_, index) => `EML-E0-D01-L01-V2-Q4-BASE-H${index + 1}`
      ),
      solutionRevealed: false,
      timestamp: "2026-07-30T06:02:00Z"
    })).toThrow(/revealedHintIds exceeds/);
    expect(() => updateAcademyQuestionInteraction(
      structuredClone(emptyProgress),
      {
        ...baseEvent,
        contextId: "EML-E0-D01-L01-FORGED-ASSESSMENT"
      }
    )).toThrow(/canonical V2 assessment identifier/);
    expect(() => updateAcademyQuestionInteraction(
      structuredClone(emptyProgress),
      {
        ...baseEvent,
        questionId: "EML-E0-D01-L01-V2-Q4-RETRY"
      }
    )).toThrow(/scenario must match/);
    expect(() => updateAcademyQuestionInteraction(
      structuredClone(emptyProgress),
      {
        ...baseEvent,
        questionId: "EML-E0-D01-L01-V2-Q5-BASE"
      }
    )).toThrow(/canonical hint ids/);

    const malformedCount = structuredClone(state);
    malformedCount.academy.questionInteractions[baseEvent.questionId]
      .revealedHintCount = 2;
    expect(() => importProgress(JSON.stringify(malformedCount))).toThrow(
      /revealedHintCount must match/
    );

    const mismatchedKey = structuredClone(state);
    mismatchedKey.academy.questionInteractions["EML-E0-D01-L01-V2-Q4-OTHER"] = {
      ...mismatchedKey.academy.questionInteractions[baseEvent.questionId]
    };
    expect(() => importProgress(JSON.stringify(mismatchedKey))).toThrow(
      /questionId must match its record key/
    );
  });

  it("migrates an earlier native v5 record without question persistence fields", () => {
    const earlierV5 = JSON.parse(
      JSON.stringify(emptyProgress)
    ) as Record<string, unknown>;
    const academy = earlierV5.academy as Record<string, unknown>;
    delete academy.questionAttempts;
    delete academy.questionInteractions;

    const restored = importProgress(JSON.stringify(earlierV5));
    expect(restored.version).toBe(5);
    expect(restored.academy.questionAttempts).toEqual({});
    expect(restored.academy.questionInteractions).toEqual({});
  });

  it("records idempotent legal skill transitions and bounds mastery history", () => {
    const introducedInput = {
      skillId: "frame-transform",
      evidence: {
        evidenceId: "skill-evidence-1",
        kind: "manual" as const,
        referenceId: "lesson-note-1",
        summary: "Identified the source and target frames.",
        recordedAt: "2026-07-30T05:00:00Z"
      },
      nextMastery: "introduced" as const,
      reason: "Lesson concept introduced",
      reviewDueAt: null,
      timestamp: "2026-07-30T05:00:00Z"
    };
    let state = recordAcademySkillEvidence(
      structuredClone(emptyProgress),
      introducedInput
    );
    const idempotent = recordAcademySkillEvidence(state, introducedInput);
    expect(idempotent).toEqual(state);
    expect(state.academy.skillRecords["frame-transform"].evidence).toHaveLength(1);
    expect(state.academy.skillRecords["frame-transform"].transitions).toHaveLength(1);

    expect(() => recordAcademySkillEvidence(state, {
      ...introducedInput,
      evidence: {
        ...introducedInput.evidence,
        summary: "Conflicting replay"
      }
    })).toThrow(/conflicting evidence ID/);
    expect(() => recordAcademySkillEvidence(state, {
      ...introducedInput,
      evidence: {
        ...introducedInput.evidence,
        evidenceId: "skill-evidence-illegal"
      },
      nextMastery: "mastered"
    })).toThrow(/cannot transition introduced to mastered/);

    const advance = (
      nextMastery: "practising" | "proficient" | "mastered" | "review-due",
      index: number
    ) => {
      const timestamp = new Date(Date.UTC(2026, 6, 30, 5, index)).toISOString();
      const input = {
        skillId: "frame-transform",
        evidence: {
          evidenceId: `skill-evidence-${index + 1}`,
          kind: "assessment" as const,
          referenceId: `attempt-${index}`,
          summary: `Evidence ${index}`,
          recordedAt: timestamp
        },
        nextMastery,
        reason: `Transition ${index}`,
        reviewDueAt: nextMastery === "review-due" ? "2027-01-01T00:00:00Z" : null,
        timestamp
      };
      state = recordAcademySkillEvidence(state, input);
      return input;
    };

    advance("practising", 1);
    advance("proficient", 2);
    advance("mastered", 3);
    let lastInput = advance("review-due", 4);
    for (let index = 5; index < 75; index += 1) {
      lastInput = advance(index % 2 === 1 ? "mastered" : "review-due", index);
    }

    const skill = state.academy.skillRecords["frame-transform"];
    expect(skill.historyTruncated).toBe(true);
    expect(skill.evidence).toHaveLength(PROGRESS_IMPORT_LIMITS.academySkillEvidence);
    expect(skill.transitions).toHaveLength(PROGRESS_IMPORT_LIMITS.academySkillTransitions);
    expect(recordAcademySkillEvidence(state, lastInput)).toEqual(state);
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("preserves mastery scoring evidence and accumulates same-state activities", () => {
    let state = recordAcademySkillEvidence(structuredClone(emptyProgress), {
      skillId: "state-estimation",
      evidence: {
        evidenceId: "instruction-1",
        kind: "instructional",
        referenceId: "EML-E3-D18-L01",
        summary: "State-estimation concepts introduced.",
        recordedAt: "2026-07-30T06:00:00Z"
      },
      nextMastery: "introduced",
      reason: "Instruction completed",
      reviewDueAt: null,
      timestamp: "2026-07-30T06:00:00Z"
    });
    state = recordAcademySkillEvidence(state, {
      skillId: "state-estimation",
      evidence: {
        evidenceId: "knowledge-check-1",
        kind: "knowledge-check",
        referenceId: "check-1",
        summary: "Initial retrieval check.",
        recordedAt: "2026-07-30T06:01:00Z",
        scorePercent: 80
      },
      nextMastery: "introduced",
      reason: "Additional evidence at the current state",
      reviewDueAt: null,
      timestamp: "2026-07-30T06:01:00Z"
    });
    state = recordAcademySkillEvidence(state, {
      skillId: "state-estimation",
      evidence: {
        evidenceId: "guided-1",
        kind: "guided-practice",
        referenceId: "guided-practice-1",
        summary: "Completed guided Kalman-filter practice.",
        recordedAt: "2026-07-30T06:02:00Z",
        scorePercent: 70
      },
      nextMastery: "practising",
      reason: "Guided-practice threshold met",
      reviewDueAt: null,
      timestamp: "2026-07-30T06:02:00Z"
    });
    const firstScoredActivity = {
      skillId: "state-estimation",
      evidence: {
        evidenceId: "scored-1",
        kind: "scored-activity" as const,
        referenceId: "attempt-1",
        summary: "First independent scored activity.",
        recordedAt: "2026-07-30T06:03:00Z",
        scorePercent: 85,
        activityId: "activity-ekf"
      },
      nextMastery: "practising" as const,
      reason: "First independent score retained at practising",
      reviewDueAt: null,
      timestamp: "2026-07-30T06:03:00Z"
    };
    state = recordAcademySkillEvidence(state, firstScoredActivity);
    expect(recordAcademySkillEvidence(state, firstScoredActivity)).toEqual(state);
    state = recordAcademySkillEvidence(state, {
      skillId: "state-estimation",
      evidence: {
        evidenceId: "scored-2",
        kind: "scored-activity",
        referenceId: "attempt-2",
        summary: "Second independent scored activity.",
        recordedAt: "2026-07-30T06:04:00Z",
        scorePercent: 90,
        activityId: "activity-particle-filter"
      },
      nextMastery: "proficient",
      reason: "Two independent scores met the proficiency threshold",
      reviewDueAt: "2026-08-06T06:04:00Z",
      timestamp: "2026-07-30T06:04:00Z"
    });
    state = recordAcademySkillEvidence(state, {
      skillId: "state-estimation",
      evidence: {
        evidenceId: "applied-1",
        kind: "applied-evidence",
        referenceId: "rover-localisation",
        summary: "Applied state estimation on the rover project.",
        recordedAt: "2026-07-30T06:05:00Z",
        passed: true
      },
      nextMastery: "proficient",
      reason: "Applied evidence added at the current state",
      reviewDueAt: "2026-08-06T06:04:00Z",
      timestamp: "2026-07-30T06:05:00Z"
    });
    state = recordAcademySkillEvidence(state, {
      skillId: "state-estimation",
      evidence: {
        evidenceId: "review-1",
        kind: "delayed-review",
        referenceId: "review-state-estimation",
        summary: "Delayed retrieval review passed.",
        recordedAt: "2026-08-06T06:05:00Z",
        scorePercent: 95
      },
      nextMastery: "mastered",
      reason: "Delayed review and applied evidence met mastery requirements",
      reviewDueAt: "2026-08-20T06:05:00Z",
      timestamp: "2026-08-06T06:05:00Z"
    });

    const skill = state.academy.skillRecords["state-estimation"];
    expect(skill.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "scored-activity",
        scorePercent: 85,
        activityId: "activity-ekf"
      }),
      expect.objectContaining({
        kind: "applied-evidence",
        passed: true
      }),
      expect.objectContaining({
        kind: "delayed-review",
        scorePercent: 95
      })
    ]));
    expect(skill.transitions).toContainEqual(expect.objectContaining({
      from: "practising",
      to: "practising",
      reason: "First independent score retained at practising"
    }));
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("rejects semantically invalid mastery evidence fields", () => {
    const record = (evidence: {
      evidenceId: string;
      kind: "instructional" | "guided-practice" | "scored-activity" | "delayed-review" | "applied-evidence" | "manual";
      referenceId: string;
      summary: string;
      recordedAt: string;
      scorePercent?: number;
      activityId?: string;
      passed?: boolean;
    }) => recordAcademySkillEvidence(structuredClone(emptyProgress), {
      skillId: "validation-skill",
      evidence,
      nextMastery: "introduced",
      reason: "Validation fixture",
      reviewDueAt: null,
      timestamp: "2026-07-30T07:00:00Z"
    });
    const base = {
      evidenceId: "evidence-1",
      referenceId: "reference-1",
      summary: "Validation fixture.",
      recordedAt: "2026-07-30T07:00:00Z"
    };

    expect(() => record({ ...base, kind: "guided-practice" }))
      .toThrow(/scorePercent is required/);
    expect(() => record({
      ...base,
      kind: "scored-activity",
      scorePercent: 80
    })).toThrow(/activityId is required/);
    expect(() => record({
      ...base,
      kind: "delayed-review",
      scorePercent: 101
    })).toThrow(/0 to 100/);
    expect(() => record({ ...base, kind: "applied-evidence" }))
      .toThrow(/passed is required/);
    expect(() => record({
      ...base,
      kind: "instructional",
      activityId: "not-valid-here"
    })).toThrow(/only valid for scored-activity/);
    expect(() => record({
      ...base,
      kind: "guided-practice",
      scorePercent: 80,
      passed: true
    })).toThrow(/only valid for applied-evidence/);
    expect(() => record({
      ...base,
      kind: "manual",
      scorePercent: 80
    })).toThrow(/not valid for legacy manual/);
  });

  it("rejects unsafe academy routes, mismatched IDs, and prototype pollution", () => {
    const state = setAcademyResumeCursor(structuredClone(emptyProgress), {
      ...academyLesson,
      timestamp: "2026-07-30T03:00:00Z",
      blockId: "intro"
    });
    state.academy.resumeCursor = {
      ...state.academy.resumeCursor!,
      route: "https://example.invalid/return"
    };
    expect(() => importProgress(JSON.stringify(state))).toThrow(/route/);

    const wrongRecent = structuredClone(emptyProgress);
    wrongRecent.recentItems = [{
      id: "EML-E0-D01-L02",
      type: "lesson",
      title: "Wrong target",
      route: buildAcademyLessonRoute(
        academyLesson.courseId,
        academyLesson.unitId,
        academyLesson.lessonId
      ),
      visitedAt: "2026-07-30T03:00:00Z"
    }];
    expect(() => importProgress(JSON.stringify(wrongRecent))).toThrow(/recent lesson ID/);

    const polluted = exportProgress(structuredClone(emptyProgress)).replace(
      '"lessonRecords": {}',
      '"lessonRecords": {"__proto__": {}}'
    );
    expect(() => importProgress(polluted)).toThrow(/unsafe key/);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("validates before save and writes only canonical v5 state", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    const valid = structuredClone(emptyProgress);
    expect(saveProgress(valid)).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      "engineering-mastery-lab/progress/v5",
      expect.stringContaining('"version":5')
    );

    const invalid = structuredClone(emptyProgress);
    invalid.academy.lessonRecords[academyLesson.lessonId] = {
      ...academyLessonRecord(),
      scrollPosition: 2
    };
    expect(saveProgress(invalid)).toBe(false);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("round-trips native v5 curriculum and weekly review records", () => {
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

  it("canonicalises v4 content aliases without losing their learning record", () => {
    const version4 = createVersion4Base();
    version4.curriculumRecords["EML-E3-ROS2"] = completedLearningRecord() as
      typeof version4.curriculumRecords[string];
    const migrated = migrateProgressV4(version4);
    expect(migrated.curriculumRecords["EML-E3-D18"]).toEqual(completedLearningRecord());
    expect(migrated.curriculumRecords["EML-E3-ROS2"]).toBeUndefined();

    version4.curriculumRecords["EML-E3-D18"] = completedLearningRecord({
      notes: "Conflicting canonical record"
    }) as typeof version4.curriculumRecords[string];
    expect(() => migrateProgressV4(version4)).toThrow(/conflicting records/);
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

describe("academy progress integration", () => {
  it("builds exact canonical academy routes and rejects mismatched identities", () => {
    const courseRoute = "/learn/courses/ACADEMY-E0";
    const unitRoute = `${courseRoute}/units/EML-E0-D01`;
    const lessonRoute = `${unitRoute}/lessons/EML-E0-D01-L01`;

    expect(buildAcademyCourseRoute(academyLesson.courseId)).toBe(courseRoute);
    expect(buildAcademyUnitRoute(academyLesson.courseId, academyLesson.unitId))
      .toBe(unitRoute);
    expect(buildAcademyLessonRoute(
      academyLesson.courseId,
      academyLesson.unitId,
      academyLesson.lessonId
    )).toBe(lessonRoute);
    expect(academyCourseRoute(academyLesson.courseId)).toBe(courseRoute);
    expect(academyUnitRoute(academyLesson.courseId, academyLesson.unitId)).toBe(unitRoute);
    expect(academyLessonRoute(
      academyLesson.courseId,
      academyLesson.unitId,
      academyLesson.lessonId
    )).toBe(lessonRoute);
    expect(academyUnitAssessmentRoute(
      academyLesson.courseId,
      academyLesson.unitId,
      "quiz"
    )).toBe(`${unitRoute}/assessments/quiz`);
    expect(academyCourseChallengeRoute(academyLesson.courseId))
      .toBe(`${courseRoute}/challenge`);

    expect(() => academyCourseRoute("ACADEMY-E5")).toThrow(/ACADEMY-E0 through ACADEMY-E4/);
    expect(() => academyCourseRoute("../ACADEMY-E0")).toThrow(/canonical identifier/);
    expect(() => academyUnitRoute("ACADEMY-E0", "EML-E1-D01")).toThrow(/stage must match/);
    expect(() => academyLessonRoute(
      "ACADEMY-E0",
      "EML-E0-D01",
      "EML-E0-D02-L01"
    )).toThrow(/unitId/);
    expect(() => academyLessonRoute(
      "ACADEMY-E0",
      "EML-E0-D01",
      "EML-E0-D01-L08"
    )).toThrow(/L01 through L07/);
  });

  it("preserves the exact resume block and normalised scroll position", () => {
    let state = startAcademyLesson(structuredClone(emptyProgress), {
      ...academyLesson,
      timestamp: "2026-07-30T08:00:00Z",
      blockId: "intro"
    });
    state = setAcademyResumeCursor(state, {
      ...academyLesson,
      timestamp: "2026-07-30T08:01:00Z",
      blockId: "intro"
    });
    state = updateAcademyLesson(state, {
      ...academyLesson,
      timestamp: "2026-07-30T08:02:00Z",
      lastBlockId: "worked-example",
      scrollPosition: 0.625
    });

    expect(state.academy.lessonRecords[academyLesson.lessonId]).toMatchObject({
      lastBlockId: "worked-example",
      scrollPosition: 0.625,
      updatedAt: "2026-07-30T08:02:00Z"
    });
    expect(state.academy.resumeCursor).toEqual({
      ...academyLesson,
      blockId: "worked-example",
      route: buildAcademyLessonRoute(
        academyLesson.courseId,
        academyLesson.unitId,
        academyLesson.lessonId
      ),
      updatedAt: "2026-07-30T08:02:00Z"
    });

    state = setAcademyResumeCursor(state, {
      ...academyLesson,
      timestamp: "2026-07-30T08:03:00Z",
      blockId: "summary"
    });
    expect(state.academy.lessonRecords[academyLesson.lessonId]).toMatchObject({
      lastBlockId: "summary",
      scrollPosition: 0.625
    });
    expect(importProgress(exportProgress(state))).toEqual(state);

    expect(() => updateAcademyLesson(state, {
      ...academyLesson,
      timestamp: "2026-07-30T08:04:00Z",
      scrollPosition: -0.001
    })).toThrow(/0 to 1/);
    expect(() => updateAcademyLesson(state, {
      ...academyLesson,
      timestamp: "2026-07-30T08:04:00Z",
      scrollPosition: 1.001
    })).toThrow(/0 to 1/);
  });

  it("converts a stored normalised scroll position into a bounded page offset", () => {
    expect(academyScrollOffset(0, 1_800, 600)).toBe(0);
    expect(academyScrollOffset(0.625, 1_800, 600)).toBe(750);
    expect(academyScrollOffset(1, 1_800, 600)).toBe(1_200);
    expect(academyScrollOffset(0.75, 500, 600)).toBe(0);
    expect(academyScrollOffset(undefined, 1_800, 600)).toBeNull();
    expect(academyScrollOffset(-0.01, 1_800, 600)).toBeNull();
    expect(academyScrollOffset(1.01, 1_800, 600)).toBeNull();
    expect(academyScrollOffset(0.5, Number.NaN, 600)).toBeNull();
  });

  it("auto-starts lessons for notes and bookmarks and preserves later unbookmarking", () => {
    let state = setAcademyLessonNotes(structuredClone(emptyProgress), {
      ...academyLesson,
      timestamp: "2026-07-30T09:00:00Z",
      notes: "Check the transform direction before substituting values."
    });
    state = setAcademyLessonBookmarked(state, {
      ...academyLesson,
      timestamp: "2026-07-30T09:01:00Z",
      bookmarked: true
    });

    expect(state.academy.lessonRecords[academyLesson.lessonId]).toMatchObject({
      notes: "Check the transform direction before substituting values.",
      bookmarked: true,
      startedAt: "2026-07-30T09:00:00Z"
    });
    expect(importProgress(exportProgress(state))).toEqual(state);

    state = setAcademyLessonBookmarked(state, {
      ...academyLesson,
      timestamp: "2026-07-30T09:02:00Z",
      bookmarked: false
    });
    expect(state.academy.lessonRecords[academyLesson.lessonId].bookmarked).toBe(false);
    expect(() => setAcademyLessonNotes(structuredClone(emptyProgress), {
      ...academyLesson,
      timestamp: "2026-07-30T09:00:00Z",
      notes: "x".repeat(PROGRESS_IMPORT_LIMITS.notesCharacters + 1)
    })).toThrow(/notes/);
  });

  it("schedules and completes a review through legal durable transitions", () => {
    const scheduled = {
      reviewId: "REVIEW-state-estimation",
      targetType: "skill" as const,
      targetId: "state-estimation",
      state: "scheduled" as const,
      dueAt: "2026-08-06T10:00:00Z",
      lastReviewedAt: null,
      updatedAt: "2026-07-30T10:00:00Z"
    };
    let state = setAcademyReviewState(structuredClone(emptyProgress), scheduled);
    state = setAcademyReviewState(state, {
      ...scheduled,
      state: "due",
      updatedAt: "2026-08-06T10:00:00Z"
    });
    state = setAcademyReviewState(state, {
      ...scheduled,
      state: "completed",
      lastReviewedAt: "2026-08-06T10:30:00Z",
      updatedAt: "2026-08-06T10:30:00Z"
    });

    expect(state.academy.reviewStates[scheduled.reviewId]).toMatchObject({
      state: "completed",
      lastReviewedAt: "2026-08-06T10:30:00Z"
    });
    expect(importProgress(exportProgress(state))).toEqual(state);
    expect(() => setAcademyReviewState(state, {
      ...scheduled,
      state: "due",
      lastReviewedAt: "2026-08-06T10:30:00Z",
      updatedAt: "2026-08-06T11:00:00Z"
    })).toThrow(/cannot transition completed to due/);
    expect(() => setAcademyReviewState(structuredClone(emptyProgress), {
      ...scheduled,
      state: "completed"
    })).toThrow(/lastReviewedAt is required/);
  });

  it("uses aggregate assessment results without treating correct questions as 100 percent", () => {
    const assessmentId = "EML-E0-D01-QUIZ";
    const attempt = (
      attemptId: string,
      responseSummary: Record<string, string>,
      scorePercent: number,
      submittedAt: string
    ): AcademyAssessmentAttempt => ({
      attemptId,
      assessmentId,
      responseSummary,
      scorePercent,
      hintsUsed: [],
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: submittedAt,
      submittedAt
    });
    const progress = structuredClone(emptyProgress.academy);
    progress.assessmentAttempts[assessmentId] = [
      attempt("ATTEMPT-1", { "question-1": "correct" }, 100, "2026-07-30T11:00:00Z"),
      attempt("RESULT-1", { RESULT: "80% across 2 questions" }, 80, "2026-07-30T11:01:00Z"),
      attempt("ATTEMPT-2", { "question-2": "incorrect" }, 0, "2026-07-30T11:02:00Z"),
      attempt("RESULT-2", { RESULT: "75% across 4 questions" }, 75, "2026-07-30T11:03:00Z")
    ];

    expect(latestAssessmentScore(progress, assessmentId)).toBe(75);
    expect(bestAssessmentScore(progress, assessmentId)).toBe(80);
    expect(assessmentQuestionScores(progress.assessmentAttempts[assessmentId])).toEqual({
      "question-1": 100,
      "question-2": 0
    });

    const questionOnlyId = "EML-E0-D01-TEST";
    progress.assessmentAttempts[questionOnlyId] = [
      attempt("ATTEMPT-only", { "question-1": "correct" }, 100, "2026-07-30T11:04:00Z")
    ].map((entry) => ({ ...entry, assessmentId: questionOnlyId }));
    expect(latestAssessmentScore(progress, questionOnlyId)).toBeNull();
    expect(bestAssessmentScore(progress, questionOnlyId)).toBeNull();

    const legacyId = "ACADEMY-E0-CHALLENGE";
    progress.assessmentAttempts[legacyId] = [
      attempt("legacy-result", { overall: "64%" }, 64, "2026-07-30T11:05:00Z")
    ].map((entry) => ({ ...entry, assessmentId: legacyId }));
    expect(latestAssessmentScore(progress, legacyId)).toBe(64);
    expect(bestAssessmentScore(progress, legacyId)).toBe(64);
  });

  it("accumulates mastery evidence and records an evidence-led decline", () => {
    const skill: Skill = {
      id: "state-estimation",
      title: "State estimation",
      description: "Estimate robot state from noisy sensors.",
      prerequisiteSkillIds: [],
      unitIds: ["EML-E3-D18"],
      lessonIds: ["EML-E3-D18-L01"],
      requiresAppliedEvidence: false
    };
    let state = structuredClone(emptyProgress);
    const recordDraft = (
      draft: Parameters<typeof planAcademyMasteryEvidence>[2],
      now: string
    ) => {
      const plan = planAcademyMasteryEvidence(state.academy, skill, draft, now);
      state = recordAcademySkillEvidence(state, plan);
      return plan;
    };

    const first = recordDraft({
      evidenceId: "scored-1",
      kind: "scored-activity",
      referenceId: "attempt-1",
      summary: "First independent state-estimation activity.",
      recordedAt: "2026-07-30T12:00:00Z",
      scorePercent: 85,
      activityId: "ekf"
    }, "2026-07-30T12:00:00Z");
    expect(first.nextMastery).toBe("introduced");

    const second = recordDraft({
      evidenceId: "scored-2",
      kind: "scored-activity",
      referenceId: "attempt-2",
      summary: "Second independent state-estimation activity.",
      recordedAt: "2026-07-30T12:01:00Z",
      scorePercent: 90,
      activityId: "particle-filter"
    }, "2026-07-30T12:01:00Z");
    expect(second.nextMastery).toBe("proficient");

    const delayed = recordDraft({
      evidenceId: "review-pass",
      kind: "delayed-review",
      referenceId: "review-1",
      summary: "Delayed retrieval review passed.",
      recordedAt: "2026-07-31T12:00:00Z",
      scorePercent: 95
    }, "2026-07-31T12:00:00Z");
    expect(delayed.nextMastery).toBe("mastered");

    const declined = recordDraft({
      evidenceId: "review-fail",
      kind: "delayed-review",
      referenceId: "review-2",
      summary: "Latest delayed retrieval review fell below threshold.",
      recordedAt: "2026-08-01T12:00:00Z",
      scorePercent: 80
    }, "2026-08-01T12:00:00Z");
    expect(declined.nextMastery).toBe("proficient");
    expect(declined.reason).toContain("Latest delayed review is 80.00%");
    expect(state.academy.skillRecords[skill.id]).toMatchObject({
      mastery: "proficient",
      evidence: expect.arrayContaining([
        expect.objectContaining({ evidenceId: "scored-1", activityId: "ekf" }),
        expect.objectContaining({ evidenceId: "review-fail", scorePercent: 80 })
      ])
    });
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("converts field-light legacy skill evidence without inventing scores or pass states", () => {
    const skill: Skill = {
      id: "legacy-mastery",
      title: "Legacy mastery",
      description: "Compatibility fixture.",
      prerequisiteSkillIds: [],
      unitIds: ["EML-E0-D01"],
      lessonIds: ["EML-E0-D01-L01"],
      requiresAppliedEvidence: false
    };
    const state = structuredClone(emptyProgress);
    state.academy.skillRecords[skill.id] = {
      skillId: skill.id,
      mastery: "introduced",
      evidence: [
        {
          evidenceId: "legacy-assessment",
          kind: "assessment",
          referenceId: "assessment-1",
          summary: "Legacy assessment evidence.",
          recordedAt: "2026-07-30T13:00:00Z"
        },
        {
          evidenceId: "legacy-lab",
          kind: "lab",
          referenceId: "lab-1",
          summary: "Legacy lab evidence.",
          recordedAt: "2026-07-30T13:01:00Z"
        },
        {
          evidenceId: "legacy-project",
          kind: "project",
          referenceId: "project-1",
          summary: "Legacy project evidence.",
          recordedAt: "2026-07-30T13:02:00Z"
        },
        {
          evidenceId: "legacy-manual",
          kind: "manual",
          referenceId: "manual-1",
          summary: "Legacy manual evidence.",
          recordedAt: "2026-07-30T13:03:00Z"
        }
      ],
      transitions: [{
        from: "not-started",
        to: "introduced",
        reason: "Migrated legacy evidence",
        at: "2026-07-30T13:00:00Z"
      }],
      historyTruncated: false,
      reviewDueAt: null,
      updatedAt: "2026-07-30T13:03:00Z"
    };

    const plan = planAcademyMasteryEvidence(state.academy, skill, {
      evidenceId: "guided-1",
      kind: "guided-practice",
      referenceId: "guided-1",
      summary: "Guided compatibility check.",
      recordedAt: "2026-07-30T13:04:00Z",
      scorePercent: 70
    }, "2026-07-30T13:04:00Z");
    expect(plan.nextMastery).toBe("practising");
    expect(() => recordAcademySkillEvidence(state, plan)).not.toThrow();
  });
});

describe("progress storage fallback", () => {
  it("loads a valid v5 record before every historical key", () => {
    const nativeV5 = setAcademyResumeCursor(structuredClone(emptyProgress), {
      ...academyLesson,
      timestamp: "2026-07-30T04:00:00Z",
      blockId: "worked-example"
    });
    const version4 = createVersion4Base();
    version4.bookmarks["historical-v4"] = true;
    const getItem = vi.fn((key: string) => {
      if (key.endsWith("/v5")) return exportProgress(nativeV5);
      if (key.endsWith("/v4")) return JSON.stringify(version4);
      return null;
    });
    vi.stubGlobal("localStorage", { getItem });

    expect(loadProgress()).toEqual(nativeV5);
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it("falls back from malformed v5 to a fully preserved v4 record", () => {
    const version4 = createVersion4Base();
    version4.themePreference = "light";
    version4.curriculumRecords.S006 = completedLearningRecord() as
      typeof version4.curriculumRecords.S006;
    version4.weeklyReviews["2026-W31"] = {
      weekKey: "2026-W31",
      plannedBlocks: 10,
      completedBlocks: 8,
      evidenceCount: 2,
      reflection: "Retained after malformed v5.",
      createdAt: "2026-07-30T00:00:00Z",
      updatedAt: "2026-07-30T00:00:00Z"
    };
    const invalidV5Bytes = JSON.stringify({
      ...emptyProgress,
      academy: {
        ...emptyProgress.academy,
        resumeCursor: {
          ...academyLesson,
          blockId: "intro",
          route: "https://example.invalid",
          updatedAt: "2026-07-30T00:00:00Z"
        }
      }
    });
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => {
        if (key.endsWith("/v5")) return invalidV5Bytes;
        if (key.endsWith("/v4")) return JSON.stringify(version4);
        return null;
      }),
      setItem
    });

    const result = loadProgressWithStatus();
    expect(result).toMatchObject({
      source: "v4",
      recoveryRequired: true,
      invalidCurrentBytes: invalidV5Bytes
    });
    expect(result.progress).toMatchObject({
      version: 5,
      themePreference: "light",
      curriculumRecords: { S006: version4.curriculumRecords.S006 },
      weeklyReviews: version4.weeklyReviews,
      academy: emptyProgress.academy
    });
    expect(setItem).not.toHaveBeenCalled();
  });

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
    expect(loaded.version).toBe(5);
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
      version: 5,
      artefacts: { "legacy-report": true },
      engineeringWorkspaces: {}
    });
  });
});
