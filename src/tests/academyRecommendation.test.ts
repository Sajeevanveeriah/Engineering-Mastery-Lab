import { describe, expect, it } from "vitest";
import {
  RecommendationValidationError,
  recommendNextActivities
} from "../lib/academy/recommendation";
import type {
  RecommendationCandidate,
  RecommendationContext
} from "../lib/academy/recommendation";

function candidate(
  id: string,
  coursePosition: number,
  extra: Partial<RecommendationCandidate> = {}
): RecommendationCandidate {
  return {
    id,
    title: `Activity ${id}`,
    route: `/academy/${id}`,
    kind: "practice",
    skillIds: [`skill-${id}`],
    prerequisiteSkillIds: [],
    coursePosition,
    completed: false,
    ...extra
  };
}

function context(
  candidates: RecommendationCandidate[],
  extra: Partial<RecommendationContext> = {}
): RecommendationContext {
  return {
    now: "2026-07-30T08:00:00.000Z",
    currentCoursePosition: 5,
    candidates,
    mastery: [],
    recentResponses: [],
    unfinishedLabIds: [],
    ...extra
  };
}

describe("academy recommendation signals", () => {
  it("uses prerequisite gaps and recent incorrect responses with plain reasons", () => {
    const prerequisite = candidate("foundation", 4, {
      skillIds: ["kinematics"]
    });
    const target = candidate("target", 5, {
      skillIds: ["motion"],
      prerequisiteSkillIds: ["kinematics"]
    });
    const result = recommendNextActivities(
      context([target, prerequisite], {
        skillLabels: [{
          skillId: "kinematics",
          title: "Robot kinematics"
        }],
        mastery: [
          {
            skillId: "kinematics",
            state: "introduced",
            achievementState: "introduced"
          }
        ],
        recentResponses: [
          {
            questionId: "q-kinematics",
            skillIds: ["kinematics"],
            isCorrect: false,
            confidence: "high",
            answeredAt: "2026-07-30T07:00:00.000Z"
          }
        ]
      })
    )[0];

    expect(result).toMatchObject({
      activityId: "foundation",
      reasonCodes: expect.arrayContaining([
        "prerequisite-gap",
        "recent-incorrect",
        "mastery-gap",
        "course-position"
      ])
    });
    expect(result?.reason).toContain(
      "develops prerequisite Robot kinematics needed before Activity target"
    );
    expect(result?.reason).toContain(
      "Recent incorrect responses involved Robot kinematics"
    );
    expect(result?.summary).toBe(
      "This activity develops Robot kinematics for Activity target."
    );
    expect(
      recommendNextActivities(context([target, prerequisite])).map(
        (recommendation) => recommendation.activityId
      )
    ).not.toContain("target");
  });

  it("optionally includes low-confidence correct answers", () => {
    const target = candidate("target", 5, { skillIds: ["estimation"] });
    const lowConfidenceResponse = {
      questionId: "q-estimation",
      skillIds: ["estimation"],
      isCorrect: true,
      confidence: "low" as const,
      answeredAt: "2026-07-30T07:00:00.000Z"
    };
    const excluded = recommendNextActivities(
      context([target], { recentResponses: [lowConfidenceResponse] })
    )[0];
    const included = recommendNextActivities(
      context([target], {
        recentResponses: [lowConfidenceResponse],
        includeLowConfidenceCorrect: true
      })
    )[0];

    expect(excluded?.reasonCodes).not.toContain("low-confidence-correct");
    expect(included?.reasonCodes).toContain("low-confidence-correct");
    expect((included?.priorityScore ?? 0) - (excluded?.priorityScore ?? 0)).toBe(
      35
    );
  });

  it("prioritises review-due skills while preserving their achieved prerequisite status", () => {
    const review = candidate("review", 5, {
      kind: "review",
      skillIds: ["slam"]
    });
    const dependent = candidate("dependent", 6, {
      prerequisiteSkillIds: ["slam"]
    });
    const recommendations = recommendNextActivities(
      context([dependent, review], {
        mastery: [
          {
            skillId: "slam",
            state: "review-due",
            achievementState: "mastered",
            reviewDueAt: "2026-07-29T00:00:00.000Z"
          }
        ]
      })
    );

    expect(recommendations[0]).toMatchObject({
      activityId: "review",
      reasonCodes: expect.arrayContaining(["review-due"])
    });
    expect(
      recommendations.find((item) => item.activityId === "dependent")
        ?.reasonCodes
    ).not.toContain("prerequisite-gap");
  });

  it("keeps unfinished laboratories eligible even if marked completed", () => {
    const laboratory = candidate("lab-1", 5, {
      kind: "laboratory",
      completed: true
    });
    const completedLesson = candidate("lesson-1", 5, {
      kind: "lesson",
      completed: true
    });
    const recommendations = recommendNextActivities(
      context([completedLesson, laboratory], {
        unfinishedLabIds: ["lab-1"]
      })
    );

    expect(recommendations.map((item) => item.activityId)).toEqual(["lab-1"]);
    expect(recommendations[0]?.reasonCodes).toContain("unfinished-lab");
  });
});

describe("academy recommendation determinism and bounds", () => {
  it("uses stable tie-breaking independent of candidate input order", () => {
    const alpha = candidate("alpha", 5);
    const beta = candidate("beta", 5);
    const first = recommendNextActivities(context([beta, alpha]));
    const second = recommendNextActivities(context([alpha, beta]));

    expect(first).toEqual(second);
    expect(first.map((item) => item.activityId)).toEqual(["alpha", "beta"]);
  });

  it("uses course position as a deterministic relevance signal", () => {
    const current = candidate("current", 5, {
      skillIds: ["shared"]
    });
    const distant = candidate("distant", 25, {
      skillIds: ["shared"]
    });

    expect(
      recommendNextActivities(context([distant, current]))[0]?.activityId
    ).toBe("current");
  });

  it("respects the result limit and rejects unsafe input", () => {
    const candidates = [
      candidate("a", 1),
      candidate("b", 2),
      candidate("c", 3)
    ];
    expect(
      recommendNextActivities(context(candidates, { limit: 2 }))
    ).toHaveLength(2);
    expect(() =>
      recommendNextActivities(context(candidates, { limit: 0 }))
    ).toThrow(RecommendationValidationError);
    expect(() =>
      recommendNextActivities(
        context([candidates[0] as RecommendationCandidate, candidates[0] as RecommendationCandidate])
      )
    ).toThrow(/duplicated/);
    expect(() =>
      recommendNextActivities(
        context([candidate("not-a-lab", 1)], {
          unfinishedLabIds: ["not-a-lab"]
        })
      )
    ).toThrow(/does not identify a laboratory/);
    expect(() =>
      recommendNextActivities(
        context([candidate("future", 1)], {
          recentResponses: [
            {
              questionId: "future-response",
              skillIds: ["skill-future"],
              isCorrect: false,
              answeredAt: "2026-07-30T09:00:00.000Z"
            }
          ]
        })
      )
    ).toThrow(/occurs after now/);
    expect(() =>
      recommendNextActivities(
        context([candidate("labelled", 1)], {
          skillLabels: [
            { skillId: "skill-labelled", title: "Labelled skill" },
            { skillId: "skill-labelled", title: "Duplicate label" }
          ]
        })
      )
    ).toThrow(/label "skill-labelled" is duplicated/);
  });
});
