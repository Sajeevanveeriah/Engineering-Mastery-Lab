import { describe, expect, it } from "vitest";
import { emptyAcademyProgress } from "../lib/storage";
import {
  buildAcademyHomeRecommendations
} from "../lib/academy/homeRecommendations";
import {
  MAX_RECOMMENDATION_SUMMARY_CHARACTERS
} from "../lib/academy/recommendation";

const now = "2026-07-30T09:00:00.000Z";

describe("academy learner-home recommendations", () => {
  it("starts a genuine beginner at the first internal lesson with a reason", () => {
    const model = buildAcademyHomeRecommendations(
      structuredClone(emptyAcademyProgress),
      now
    );

    expect(model.recommendations[0]).toMatchObject({
      activityId: "EML-E0-D01-L01",
      kind: "lesson",
      route:
        "/learn/courses/ACADEMY-E0/units/EML-E0-D01/lessons/EML-E0-D01-L01"
    });
    expect(model.recommendations[0]?.reason.trim().length).toBeGreaterThan(20);
    expect(model.recommendations[0]?.summary.length)
      .toBeLessThanOrEqual(MAX_RECOMMENDATION_SUMMARY_CHARACTERS);
    expect(model.recommendations[0]?.summary)
      .toContain("Learning practice and engineering questions");
    expect(model.recommendations[0]?.summary)
      .toMatch(/and \d+ later activities\./);
    expect(model.recommendations[0]?.summary).not.toContain("SKILL-");
    expect(model.recommendations[0]?.reason).not.toContain("SKILL-");
    expect(model.candidateIds).toEqual(
      model.recommendations.map((recommendation) => recommendation.activityId)
    );
  });

  it("does not recommend a dependent activity before its prerequisite skill", () => {
    const model = buildAcademyHomeRecommendations(
      structuredClone(emptyAcademyProgress),
      now
    );

    expect(
      model.recommendations.some(
        (recommendation) => recommendation.activityId.startsWith("EML-E0-D02")
      )
    ).toBe(false);
    expect(model.recommendations[0]?.reasonCodes).toContain("prerequisite-gap");
  });

  it("includes due review and unfinished laboratory signals deterministically", () => {
    const progress = structuredClone(emptyAcademyProgress);
    progress.skillRecords["SKILL-E0-D01"] = {
      skillId: "SKILL-E0-D01",
      mastery: "review-due",
      evidence: [],
      transitions: [],
      historyTruncated: false,
      reviewDueAt: "2026-07-29T09:00:00.000Z",
      updatedAt: "2026-07-29T09:00:00.000Z"
    };
    progress.unfinishedLabs["academy-practice-lab"] = {
      labId: "academy-practice-lab",
      courseId: "ACADEMY-E0",
      unitId: "EML-E0-D01",
      lessonId: "EML-E0-D01-L01",
      status: "paused",
      lastStepId: "observe",
      blocker: null,
      notes: "",
      startedAt: "2026-07-29T08:00:00.000Z",
      updatedAt: "2026-07-29T09:00:00.000Z"
    };

    const first = buildAcademyHomeRecommendations(progress, now);
    const second = buildAcademyHomeRecommendations(progress, now);

    expect(first).toEqual(second);
    expect(first.dueReviewSkillIds).toEqual(["SKILL-E0-D01"]);
    expect(first.recommendations.some((item) => item.kind === "review")).toBe(true);
    expect(first.recommendations.some((item) => item.kind === "laboratory")).toBe(true);
    expect(first.activeLab).toMatchObject({
      id: "academy-practice-lab",
      status: "paused",
      route: "/learn/labs/practice"
    });
  });

  it("rejects an invalid recommendation clock", () => {
    expect(() =>
      buildAcademyHomeRecommendations(
        structuredClone(emptyAcademyProgress),
        "not-a-date"
      )
    ).toThrow(/valid current timestamp/);
  });
});
