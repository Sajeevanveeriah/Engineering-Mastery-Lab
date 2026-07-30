import { describe, expect, it } from "vitest";
import type {
  AcademyLessonV2OutlineItem,
  AcademyLessonV2SectionKey
} from "../components/academy/AcademyLessonV2";
import {
  academyLessonV2AssessmentEventId,
  type AcademyLessonV2AssessmentAttemptEvent
} from "../components/academy/AcademyLessonV2Assessment";
import academyLessonTeachingProfilesV2E0D01 from "../data/academy/lessonTeachingProfilesV2/units/EML-E0-D01";
import {
  academyLessonV2AssessmentId,
  academyLessonV2QuestionId
} from "../lib/academy/lessonTeachingProfileV2Assessment";
import { loadAcademyLesson } from "../lib/academy/curriculum";
import { emptyProgress } from "../lib/storage";
import {
  academyLessonV2AttemptId,
  applyAcademyLessonV2AttemptEvent,
  assertAcademyLessonV2AssessmentEvent,
  assertAcademyLessonV2AssessmentProgress,
  deriveAcademyLessonV2InitialScores,
  resolveAcademyLessonResumeBlockId
} from "../pages/AcademyLessonPage";

const lessonId = "EML-E0-D01-L01";
const sectionKeys: readonly AcademyLessonV2SectionKey[] = [
  "overview",
  "terms",
  "conceptual-model",
  "reasoned-cases",
  "failure-boundary",
  "misconception",
  "explorer",
  "assessment"
];
const outline: AcademyLessonV2OutlineItem[] = sectionKeys.map((key) => ({
  key,
  id: `${lessonId}-V2-${key.toUpperCase()}`,
  resumeBlockId: `${lessonId}-V2-${key.toUpperCase()}`,
  title: key
}));
const retainedBlockId = `${lessonId}-BLOCK-EXAMPLE-WORKED`;
const availableBlockIds = new Set([
  ...outline.map((item) => item.id),
  retainedBlockId
]);

describe("Academy lesson page resume integration", () => {
  it("retains exact V2 and supplemental block identifiers", () => {
    expect(
      resolveAcademyLessonResumeBlockId(
        lessonId,
        outline[3]?.id,
        availableBlockIds,
        outline
      )
    ).toBe(outline[3]?.id);
    expect(
      resolveAcademyLessonResumeBlockId(
        lessonId,
        retainedBlockId,
        availableBlockIds,
        outline
      )
    ).toBe(retainedBlockId);
  });

  it.each([
    ["BLOCK-INTRO", "overview"],
    ["BLOCK-DEFINITION", "terms"],
    ["BLOCK-EXAMPLE", "reasoned-cases"],
    ["BLOCK-VISUAL", "explorer"],
    ["BLOCK-CONCEPT", "conceptual-model"],
    ["BLOCK-MISCONCEPTION", "misconception"],
    ["BLOCK-CHECK", "assessment"],
    ["BLOCK-PRACTICE", "assessment"]
  ] as const)(
    "maps the legacy %s cursor to the V2 %s section",
    (legacySuffix, sectionKey) => {
      expect(
        resolveAcademyLessonResumeBlockId(
          lessonId,
          `${lessonId}-${legacySuffix}`,
          availableBlockIds,
          outline
        )
      ).toBe(outline.find((item) => item.key === sectionKey)?.id);
    }
  );

  it("rejects missing, cross-lesson and unknown cursor identifiers", () => {
    expect(
      resolveAcademyLessonResumeBlockId(
        lessonId,
        null,
        availableBlockIds,
        outline
      )
    ).toBeNull();
    expect(
      resolveAcademyLessonResumeBlockId(
        lessonId,
        "EML-E0-D01-L02-BLOCK-INTRO",
        availableBlockIds,
        outline
      )
    ).toBeNull();
    expect(
      resolveAcademyLessonResumeBlockId(
        lessonId,
        `${lessonId}-BLOCK-REMOVED`,
        availableBlockIds,
        outline
      )
    ).toBeNull();
  });
});

const occurredAt = "2026-07-30T12:00:00.000Z";
const assessmentId = academyLessonV2AssessmentId(lessonId);
const questionId = academyLessonV2QuestionId(lessonId, "q2", "base");
const identity = {
  lessonId,
  assessmentId,
  questionKey: "q2" as const,
  questionId,
  scenarioMode: "base" as const,
  retryIndex: 0 as const
};
const attemptEvent: AcademyLessonV2AssessmentAttemptEvent = {
  kind: "attempt",
  eventId: academyLessonV2AssessmentEventId(
    identity,
    "attempt",
    1,
    occurredAt
  ),
  occurredAt,
  ...identity,
  attemptNumber: 1,
  scorePercent: 100,
  isCorrect: true,
  variantSeed: 42,
  responseSummary: "The mechanism is ordered from evidence to decision.",
  hintsUsed: [`${questionId}-H1`],
  solutionRevealed: false,
  misconceptionKeys: []
};

describe("Academy lesson V2 assessment route boundary", () => {
  it("accepts only the canonical event identity and derives a stable receipt", () => {
    expect(() =>
      assertAcademyLessonV2AssessmentEvent(lessonId, attemptEvent)
    ).not.toThrow();
    expect(academyLessonV2AttemptId(attemptEvent.eventId)).toBe(
      academyLessonV2AttemptId(attemptEvent.eventId)
    );
    expect(academyLessonV2AttemptId(attemptEvent.eventId)).toMatch(
      /^ATTEMPT-V2-EML-E0-D01-L01-V2-Q2-BASE-attempt-1-/
    );
  });

  it("rejects forged assessment context and mismatched scenario suffixes", () => {
    expect(() =>
      assertAcademyLessonV2AssessmentEvent(lessonId, {
        ...attemptEvent,
        assessmentId: `${lessonId}-FORGED-ASSESSMENT`
      })
    ).toThrow(/canonical assessment/);
    expect(() =>
      assertAcademyLessonV2AssessmentEvent(lessonId, {
        ...attemptEvent,
        questionId: academyLessonV2QuestionId(lessonId, "q2", "retry")
      })
    ).toThrow(/canonical question identity/);
  });

  it("rejects foreign or incomplete pass progress", () => {
    expect(() =>
      assertAcademyLessonV2AssessmentProgress(lessonId, {
        lessonId: "EML-E0-D01-L02",
        assessmentId,
        attempted: 4,
        total: 4,
        scorePercent: 100,
        requiredScorePercent: 80,
        masteryEligible: true
      })
    ).toThrow(/open lesson/);
    expect(() =>
      assertAcademyLessonV2AssessmentProgress(lessonId, {
        lessonId,
        assessmentId,
        attempted: 3,
        total: 4,
        scorePercent: 100,
        requiredScorePercent: 80,
        masteryEligible: true
      })
    ).toThrow(/all four questions/);
  });

  it("rehydrates the best score from bounded attempt history, not only the latest interaction", () => {
    const academy = structuredClone(emptyProgress.academy);
    academy.questionInteractions[questionId] = {
      questionId,
      contextId: assessmentId,
      scenarioMode: "base",
      retryIndex: 0,
      revealedHintIds: [],
      revealedHintCount: 0,
      solutionRevealed: false,
      retryOpened: false,
      lastAttemptScorePercent: 0,
      lastAttemptIsCorrect: false,
      updatedAt: "2026-07-30T12:01:00.000Z"
    };
    academy.questionAttempts[questionId] = [
      {
        attemptId: "ATTEMPT-V2-HIGH",
        contextId: assessmentId,
        questionId,
        questionType: "ordering",
        attemptedAt: occurredAt,
        responseSummary: "Correct ordering",
        isCorrect: true,
        scorePercent: 100,
        misconceptionKeys: [],
        variantSeed: 42,
        retryIndex: 0,
        hintsUsed: []
      },
      {
        attemptId: "ATTEMPT-V2-LOW",
        contextId: assessmentId,
        questionId,
        questionType: "ordering",
        attemptedAt: "2026-07-30T12:01:00.000Z",
        responseSummary: "Incorrect ordering",
        isCorrect: false,
        scorePercent: 0,
        misconceptionKeys: [],
        variantSeed: 42,
        retryIndex: 0,
        hintsUsed: []
      }
    ];

    expect(deriveAcademyLessonV2InitialScores(lessonId, academy)).toEqual({
      q2: 100
    });
  });

  it("applies an exact duplicate event idempotently across history and mastery", async () => {
    const lesson = await loadAcademyLesson(lessonId);
    const profile = academyLessonTeachingProfilesV2E0D01[lessonId];
    expect(lesson).not.toBeNull();
    expect(profile).toBeDefined();
    if (!lesson || !profile) return;

    const once = applyAcademyLessonV2AttemptEvent(
      structuredClone(emptyProgress),
      lesson,
      profile,
      attemptEvent
    );
    const twice = applyAcademyLessonV2AttemptEvent(
      once,
      lesson,
      profile,
      attemptEvent
    );

    expect(twice).toEqual(once);
    expect(twice.academy.assessmentAttempts[assessmentId]).toHaveLength(1);
    expect(twice.academy.questionAttempts[questionId]).toHaveLength(1);
    for (const skillId of lesson.skillIds) {
      const matchingEvidence = twice.academy.skillRecords[
        skillId
      ]?.evidence.filter((entry) =>
        entry.evidenceId.includes(academyLessonV2AttemptId(attemptEvent.eventId)
          .replace(/^ATTEMPT-/u, "EV-"))
      );
      expect(matchingEvidence).toHaveLength(1);
    }
  });
});
