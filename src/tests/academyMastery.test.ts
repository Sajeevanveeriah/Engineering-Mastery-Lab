import { describe, expect, it } from "vitest";
import {
  DEFAULT_MASTERY_POLICY,
  DEFAULT_SPACED_REVIEW_HEURISTIC,
  MasteryValidationError,
  applyMasteryEvidence,
  createMasteryProgress,
  evaluateMastery,
  refreshMasteryReviewStatus
} from "../lib/academy/mastery";
import type {
  MasteryEvidence,
  MasteryPolicy
} from "../lib/academy/mastery";
import {
  emptyProgress,
  recordAcademySkillEvidence
} from "../lib/storage";
import { planAcademyMasteryEvidence } from "../lib/academy/masteryIntegration";
import type { Skill } from "../lib/academy/types";

const skillId = "skill-control";

function evidence(
  id: string,
  kind: MasteryEvidence["kind"],
  occurredAt: string,
  extra: Partial<MasteryEvidence> = {}
): MasteryEvidence {
  return { id, skillId, kind, occurredAt, ...extra };
}

const instruction = evidence(
  "instruction",
  "instructional",
  "2026-01-01T00:00:00.000Z"
);
const scoredA = evidence(
  "scored-a",
  "scored-activity",
  "2026-01-01T12:00:00.000Z",
  { activityId: "quiz-a", scorePercent: 80 }
);
const scoredB = evidence(
  "scored-b",
  "scored-activity",
  "2026-01-02T00:00:00.000Z",
  { activityId: "quiz-b", scorePercent: 80 }
);
const delayedReview = evidence(
  "review-pass",
  "delayed-review",
  "2026-01-03T00:00:00.000Z",
  { scorePercent: 90 }
);
const appliedPass = evidence(
  "applied-pass",
  "applied-evidence",
  "2026-01-03T01:00:00.000Z",
  { passed: true }
);

describe("academy mastery thresholds", () => {
  it("starts not-started and becomes introduced after an attempt", () => {
    expect(
      createMasteryProgress(skillId, "2026-01-01T00:00:00.000Z")
    ).toMatchObject({
      state: "not-started",
      achievementState: "not-started"
    });
    expect(
      evaluateMastery({
        skillId,
        evidence: [instruction],
        now: "2026-01-01T00:00:00.000Z",
        requiresAppliedEvidence: false
      })
    ).toMatchObject({
      state: "introduced",
      achievementState: "introduced"
    });
  });

  it("applies the 60 percent recent guided-practice boundary", () => {
    const atBoundary = evidence(
      "guided-60",
      "guided-practice",
      "2026-01-01T01:00:00.000Z",
      { scorePercent: 60 }
    );
    const belowBoundary = evidence(
      "guided-low",
      "guided-practice",
      "2026-01-01T01:00:00.000Z",
      { scorePercent: 59.99 }
    );

    expect(
      evaluateMastery({
        skillId,
        evidence: [instruction, atBoundary],
        now: "2026-01-01T02:00:00.000Z",
        requiresAppliedEvidence: false
      }).state
    ).toBe("practising");
    const below = evaluateMastery({
      skillId,
      evidence: [instruction, belowBoundary],
      now: "2026-01-01T02:00:00.000Z",
      requiresAppliedEvidence: false
    });
    expect(below.state).toBe("introduced");
    expect(below.reasons.join(" ")).not.toContain("meeting the 60%");
  });

  it("requires two independent scored activities at the 80 percent boundary", () => {
    const repeatA = evidence(
      "scored-a-repeat",
      "scored-activity",
      "2026-01-02T00:00:00.000Z",
      { activityId: "quiz-a", scorePercent: 100 }
    );
    const oneIndependent = evaluateMastery({
      skillId,
      evidence: [instruction, scoredA, repeatA],
      now: "2026-01-02T01:00:00.000Z",
      requiresAppliedEvidence: false
    });
    const twoIndependent = evaluateMastery({
      skillId,
      evidence: [instruction, repeatA, scoredB],
      now: "2026-01-02T01:00:00.000Z",
      requiresAppliedEvidence: false
    });

    expect(oneIndependent.achievementState).toBe("introduced");
    expect(twoIndependent.achievementState).toBe("proficient");
    expect(twoIndependent.reasons.join(" ")).toContain(
      "2 independent scored activities"
    );
  });

  it("requires delayed review and applied evidence when the skill requires it", () => {
    const withoutApplication = evaluateMastery({
      skillId,
      evidence: [instruction, scoredA, scoredB, delayedReview],
      now: "2026-01-03T02:00:00.000Z",
      requiresAppliedEvidence: true
    });
    const mastered = evaluateMastery({
      skillId,
      evidence: [
        instruction,
        scoredA,
        scoredB,
        delayedReview,
        appliedPass
      ],
      now: "2026-01-03T02:00:00.000Z",
      requiresAppliedEvidence: true
    });
    const noApplicationRequired = evaluateMastery({
      skillId,
      evidence: [instruction, scoredA, scoredB, delayedReview],
      now: "2026-01-03T02:00:00.000Z",
      requiresAppliedEvidence: false
    });

    expect(withoutApplication.achievementState).toBe("proficient");
    expect(withoutApplication.reasons.join(" ")).toContain(
      "waiting for the required learner-attested local applied evidence"
    );
    expect(mastered.achievementState).toBe("mastered");
    expect(mastered.reasons.join(" ")).toContain(
      "the app has not independently verified it"
    );
    expect(noApplicationRequired.achievementState).toBe("mastered");
  });
});

describe("academy spaced review and decline", () => {
  const masteredEvidence = [
    instruction,
    scoredA,
    scoredB,
    delayedReview,
    appliedPass
  ];

  it("documents the schedule as a configurable heuristic", () => {
    expect(DEFAULT_SPACED_REVIEW_HEURISTIC.description).toContain(
      "configurable"
    );
    expect(DEFAULT_SPACED_REVIEW_HEURISTIC.description).toContain(
      "not a scientifically perfect"
    );
  });

  it("uses the exact due boundary and preserves mastered achievement", () => {
    const beforeDue = evaluateMastery({
      skillId,
      evidence: masteredEvidence,
      now: "2026-01-16T23:59:59.999Z",
      requiresAppliedEvidence: true
    });
    const atDue = refreshMasteryReviewStatus(beforeDue, {
      now: "2026-01-17T00:00:00.000Z",
      requiresAppliedEvidence: true
    });

    expect(beforeDue).toMatchObject({
      state: "mastered",
      reviewDueAt: "2026-01-17T00:00:00.000Z"
    });
    expect(atDue).toMatchObject({
      state: "review-due",
      achievementState: "mastered",
      highestState: "mastered",
      reviewDueAt: "2026-01-17T00:00:00.000Z"
    });
    expect(atDue.reasons.join(" ")).toContain(
      "mastered achievement is retained"
    );
  });

  it("declines only with explicit evidence and records the reasons", () => {
    const mastered = evaluateMastery({
      skillId,
      evidence: masteredEvidence,
      now: "2026-01-03T02:00:00.000Z",
      requiresAppliedEvidence: true
    });
    const failedReview = evidence(
      "review-fail",
      "delayed-review",
      "2026-01-05T00:00:00.000Z",
      { scorePercent: 89.99 }
    );
    const declined = applyMasteryEvidence(mastered, failedReview, {
      now: "2026-01-05T01:00:00.000Z",
      requiresAppliedEvidence: true
    });

    expect(declined).toMatchObject({
      state: "proficient",
      achievementState: "proficient",
      highestState: "mastered"
    });
    expect(declined.declineReasons.join(" ")).toContain("89.99%");
    expect(declined.declineReasons.join(" ")).toContain(
      "below the 90% mastery threshold"
    );
  });

  it("bounds, sorts and deterministically evaluates evidence history", () => {
    const boundedPolicy: MasteryPolicy = {
      ...DEFAULT_MASTERY_POLICY,
      maxEvidenceHistory: 3
    };
    const ordered = evaluateMastery(
      {
        skillId,
        evidence: [delayedReview, instruction, scoredB, scoredA],
        now: "2026-01-04T00:00:00.000Z",
        requiresAppliedEvidence: false
      },
      boundedPolicy
    );
    const reordered = evaluateMastery(
      {
        skillId,
        evidence: [scoredA, delayedReview, instruction, scoredB],
        now: "2026-01-04T00:00:00.000Z",
        requiresAppliedEvidence: false
      },
      boundedPolicy
    );

    expect(ordered).toEqual(reordered);
    expect(ordered.evidence.map((item) => item.id)).toEqual([
      "scored-a",
      "scored-b",
      "review-pass"
    ]);
  });

  it("rejects scores outside zero to 100", () => {
    expect(() =>
      evaluateMastery({
        skillId,
        evidence: [
          evidence(
            "invalid-score",
            "guided-practice",
            "2026-01-01T00:00:00.000Z",
            { scorePercent: -0.01 }
          )
        ],
        now: "2026-01-01T00:00:00.000Z",
        requiresAppliedEvidence: false
      })
    ).toThrow(MasteryValidationError);
  });

  it("rejects evidence from after the evaluation time", () => {
    expect(() =>
      evaluateMastery({
        skillId,
        evidence: [
          evidence(
            "future",
            "instructional",
            "2026-01-02T00:00:00.000Z"
          )
        ],
        now: "2026-01-01T00:00:00.000Z",
        requiresAppliedEvidence: false
      })
    ).toThrow(/after the evaluation time/);
  });
});

describe("academy mastery storage integration", () => {
  const skill: Skill = {
    id: "skill-integration",
    title: "Integration skill",
    description: "Exercises the storage transition boundary.",
    prerequisiteSkillIds: [],
    unitIds: ["unit-integration"],
    lessonIds: ["lesson-integration"],
    requiresAppliedEvidence: false
  };

  it("records first guided practice as introduced before later promotion", () => {
    let progress = structuredClone(emptyProgress);
    const firstTimestamp = "2026-02-01T00:00:00.000Z";
    const firstPlan = planAcademyMasteryEvidence(
      progress.academy,
      skill,
      {
        evidenceId: "guided-first",
        kind: "guided-practice",
        referenceId: "practice-set",
        summary: "First guided-practice response scored 80%.",
        recordedAt: firstTimestamp,
        scorePercent: 80
      },
      firstTimestamp
    );

    expect(firstPlan.nextMastery).toBe("introduced");
    expect(() =>
      recordAcademySkillEvidence(progress, firstPlan)
    ).not.toThrow();
    progress = recordAcademySkillEvidence(progress, firstPlan);

    const secondTimestamp = "2026-02-01T00:01:00.000Z";
    const secondPlan = planAcademyMasteryEvidence(
      progress.academy,
      skill,
      {
        evidenceId: "guided-second",
        kind: "guided-practice",
        referenceId: "practice-set",
        summary: "Second guided-practice response scored 80%.",
        recordedAt: secondTimestamp,
        scorePercent: 80
      },
      secondTimestamp
    );

    expect(secondPlan.nextMastery).toBe("practising");
    expect(() =>
      recordAcademySkillEvidence(progress, secondPlan)
    ).not.toThrow();
  });
});
