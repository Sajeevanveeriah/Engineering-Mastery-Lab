import {
  buildAcademyCourseRoute,
  buildAcademyLessonRoute,
  buildAcademyUnitRoute,
  type AcademyAssessmentAttempt,
  type AcademyProgressState
} from "../storage";
import type { Course, Unit } from "./types";

export function academyCourseRoute(courseId: string): string {
  return buildAcademyCourseRoute(courseId);
}

export function academyUnitRoute(courseId: string, unitId: string): string {
  return buildAcademyUnitRoute(courseId, unitId);
}

export function academyLessonRoute(
  courseId: string,
  unitId: string,
  lessonId: string
): string {
  return buildAcademyLessonRoute(courseId, unitId, lessonId);
}

export function academyUnitAssessmentRoute(
  courseId: string,
  unitId: string,
  assessment: "quiz" | "test"
): string {
  return `${academyUnitRoute(courseId, unitId)}/assessments/${assessment}`;
}

export function academyCourseChallengeRoute(courseId: string): string {
  return `${academyCourseRoute(courseId)}/challenge`;
}

export function academyScrollOffset(
  scrollPosition: number | null | undefined,
  documentHeight: number,
  viewportHeight: number
): number | null {
  if (
    scrollPosition === null
    || scrollPosition === undefined
    || !Number.isFinite(scrollPosition)
    || scrollPosition < 0
    || scrollPosition > 1
    || !Number.isFinite(documentHeight)
    || documentHeight < 0
    || !Number.isFinite(viewportHeight)
    || viewportHeight < 0
  ) {
    return null;
  }
  const maximumScroll = Math.max(0, documentHeight - viewportHeight);
  return scrollPosition * maximumScroll;
}

export interface AcademyProgressCounts {
  completed: number;
  started: number;
  total: number;
  percent: number;
}

export function academyLessonProgressCounts(
  progress: AcademyProgressState,
  lessonIds: readonly string[]
): AcademyProgressCounts {
  const records = lessonIds
    .map((lessonId) => progress.lessonRecords[lessonId])
    .filter((record) => record !== undefined);
  const completed = records.filter((record) => record.completionEarned).length;
  const started = records.length;
  return {
    completed,
    started,
    total: lessonIds.length,
    percent: lessonIds.length === 0 ? 0 : Math.round((completed / lessonIds.length) * 100)
  };
}

export function academyUnitProgressCounts(
  progress: AcademyProgressState,
  unit: Unit
): AcademyProgressCounts {
  return academyLessonProgressCounts(progress, unit.lessonIds);
}

export function academyCourseProgressCounts(
  progress: AcademyProgressState,
  course: Course,
  units: readonly Unit[]
): AcademyProgressCounts {
  const lessonIds = course.unitIds.flatMap(
    (unitId) => units.find((unit) => unit.id === unitId)?.lessonIds ?? []
  );
  return academyLessonProgressCounts(progress, lessonIds);
}

export function latestAssessmentScore(
  progress: AcademyProgressState,
  assessmentId: string
): number | null {
  const attempts = resultAssessmentAttempts(
    progress.assessmentAttempts[assessmentId] ?? []
  );
  return attempts.at(-1)?.scorePercent ?? null;
}

export function bestAssessmentScore(
  progress: AcademyProgressState,
  assessmentId: string
): number | null {
  const attempts = resultAssessmentAttempts(
    progress.assessmentAttempts[assessmentId] ?? []
  );
  return attempts.length === 0
    ? null
    : Math.max(...attempts.map((attempt) => attempt.scorePercent));
}

export function assessmentQuestionScores(
  attempts: readonly AcademyAssessmentAttempt[]
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const attempt of attempts) {
    for (const questionId of Object.keys(attempt.responseSummary)) {
      if (questionId === "RESULT") continue;
      scores[questionId] = attempt.scorePercent;
    }
  }
  return scores;
}

function resultAssessmentAttempts(
  attempts: readonly AcademyAssessmentAttempt[]
): AcademyAssessmentAttempt[] {
  const explicitResults = attempts.filter(
    (attempt) => Object.prototype.hasOwnProperty.call(attempt.responseSummary, "RESULT")
  );
  if (explicitResults.length > 0) return explicitResults;

  const legacyResults = attempts.filter((attempt) => {
    const responseKeys = Object.keys(attempt.responseSummary);
    return attempt.attemptId.startsWith("RESULT-") || responseKeys.length > 1;
  });
  if (legacyResults.length > 0) return legacyResults;

  if (
    attempts.length > 0
    && attempts.every((attempt) => !attempt.attemptId.startsWith("ATTEMPT-"))
  ) {
    return [...attempts];
  }
  return [];
}
