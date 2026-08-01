import { describe, expect, it } from "vitest";
import { emptyAcademyProgress } from "../lib/storage";
import { buildGuidedAcademyEntry } from "../lib/academy/guidedAcademy";

describe("guided Academy entry", () => {
  it("starts a new learner in the first genuine beginner lesson in one activation", () => {
    expect(buildGuidedAcademyEntry(emptyAcademyProgress, "2026-07-31T06:00:00.000Z")).toMatchObject({
      mode: "new",
      primaryLabel: "Start from the beginning",
      primaryRoute:
        "/learn/courses/ACADEMY-E0/units/EML-E0-D01/lessons/EML-E0-D01-L01",
      courseTitle: "Learning and quantitative foundations",
      unitTitle: "Learning practice and engineering questions",
      lessonTitle: "How technical learning works",
      sectionTitle: "Learn",
      dueReviewCount: 0
    });
  });

  it("continues a returning learner at the exact saved lesson and section", () => {
    const academy = structuredClone(emptyAcademyProgress);
    academy.resumeCursor = {
      courseId: "ACADEMY-E1",
      unitId: "EML-E1-D04",
      lessonId: "EML-E1-D04-L03",
      blockId: "worked-example",
      route:
        "/learn/courses/ACADEMY-E1/units/EML-E1-D04/lessons/EML-E1-D04-L03",
      updatedAt: "2026-07-31T05:00:00.000Z"
    };

    expect(buildGuidedAcademyEntry(academy, "2026-07-31T06:00:00.000Z")).toMatchObject({
      mode: "returning",
      primaryLabel: "Continue learning",
      primaryRoute:
        "/learn/courses/ACADEMY-E1/units/EML-E1-D04/lessons/EML-E1-D04-L03?resume=worked-example",
      courseTitle: "Core engineering and computing foundations",
      unitTitle: "Calculus, linear algebra and statistics",
      lessonTitle: "Multivariable calculus and coupled sensitivity",
      sectionTitle: "Worked example"
    });
  });

  it("presents canonical V2 resume ids as human lesson phases", () => {
    const academy = structuredClone(emptyAcademyProgress);
    academy.resumeCursor = {
      courseId: "ACADEMY-E0",
      unitId: "EML-E0-D01",
      lessonId: "EML-E0-D01-L01",
      blockId: "EML-E0-D01-L01-V2-REASONED-CASES",
      route:
        "/learn/courses/ACADEMY-E0/units/EML-E0-D01/lessons/EML-E0-D01-L01",
      updatedAt: "2026-07-31T05:00:00.000Z"
    };

    expect(
      buildGuidedAcademyEntry(academy, "2026-07-31T06:00:00.000Z").sectionTitle
    ).toBe("Worked example");
  });

  it("reports only reviews that are due at the supplied time", () => {
    const academy = structuredClone(emptyAcademyProgress);
    academy.reviewStates = {
      due: {
        reviewId: "review-due",
        targetType: "skill",
        targetId: "SKILL-E0-D01",
        state: "scheduled",
        dueAt: "2026-07-31T05:59:59.000Z",
        lastReviewedAt: "2026-07-30T06:00:00.000Z",
        updatedAt: "2026-07-30T06:00:00.000Z"
      },
      later: {
        reviewId: "review-later",
        targetType: "skill",
        targetId: "SKILL-E0-D02",
        state: "scheduled",
        dueAt: "2026-08-01T06:00:00.000Z",
        lastReviewedAt: "2026-07-30T06:00:00.000Z",
        updatedAt: "2026-07-30T06:00:00.000Z"
      }
    };

    expect(
      buildGuidedAcademyEntry(academy, "2026-07-31T06:00:00.000Z").dueReviewCount
    ).toBe(1);
  });
});
