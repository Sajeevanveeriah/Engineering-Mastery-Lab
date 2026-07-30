import {
  academyCourses,
  academySkills,
  academyUnitSeeds,
  academyUnits
} from "../../data/academy/catalogue";
import type {
  AcademyProgressState,
  AcademySkillRecord
} from "../storage";
import {
  recommendNextActivities,
  type AcademyRecommendation,
  type RecommendationCandidate,
  type RecommendationResponseSignal
} from "./recommendation";
import {
  academyCourseChallengeRoute,
  academyLessonRoute,
  academyUnitAssessmentRoute
} from "./navigation";

export const ACADEMY_RECOMMENDATION_ALGORITHM_VERSION = "academy-next-v1";

interface CanonicalLesson {
  id: string;
  title: string;
  courseId: string;
  unitId: string;
  skillId: string;
  prerequisiteSkillIds: string[];
  position: number;
}

export interface AcademyHomeRecommendationModel {
  recommendations: AcademyRecommendation[];
  candidateIds: string[];
  inputFingerprint: string;
  currentCoursePosition: number;
  dueReviewSkillIds: string[];
  recentMastery: AcademySkillRecord[];
  activeLab: {
    id: string;
    title: string;
    route: string;
    status: string;
    blocker: string | null;
  } | null;
}

const skillForUnit = (unitId: string): string =>
  academySkills.find((skill) => skill.unitIds.includes(unitId))?.id ?? "";

const canonicalLessons: CanonicalLesson[] = academyCourses.flatMap((course) =>
  course.unitIds.flatMap((unitId) => {
    const unit = academyUnits.find((candidate) => candidate.id === unitId);
    const seed = academyUnitSeeds.find((candidate) => candidate.id === unitId);
    if (!unit || !seed) return [];
    const skillId = skillForUnit(unit.id);
    return unit.lessonIds.map((lessonId, lessonIndex) => ({
      id: lessonId,
      title: seed.lessonTitles[lessonIndex],
      courseId: course.id,
      unitId: unit.id,
      skillId,
      prerequisiteSkillIds: [...unit.prerequisiteSkillIds],
      position: academyUnits
        .flatMap((candidate) => candidate.lessonIds)
        .indexOf(lessonId)
    }));
  })
);

function aggregatePassed(
  progress: AcademyProgressState,
  assessmentId: string,
  requiredScorePercent: number
): boolean {
  return (progress.assessmentAttempts[assessmentId] ?? []).some(
    (attempt) =>
      Object.prototype.hasOwnProperty.call(attempt.responseSummary, "RESULT")
      && attempt.scorePercent >= requiredScorePercent
  );
}

function recentResponseSignals(
  progress: AcademyProgressState
): RecommendationResponseSignal[] {
  const signals: RecommendationResponseSignal[] = [];
  for (const attempts of Object.values(progress.assessmentAttempts)) {
    for (const attempt of attempts) {
      for (const questionId of Object.keys(attempt.responseSummary)) {
        if (questionId === "RESULT") continue;
        const lessonId = questionId.match(
          /^(EML-E[0-4]-D\d{2}-L0[1-7])-Q\d{2}$/
        )?.[1];
        const lesson = canonicalLessons.find((candidate) => candidate.id === lessonId);
        if (!lesson || !lesson.skillId) continue;
        signals.push({
          questionId,
          skillIds: [lesson.skillId],
          isCorrect: attempt.scorePercent >= 100,
          answeredAt: attempt.submittedAt
        });
      }
    }
  }
  return signals
    .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))
    .slice(0, 100);
}

function fingerprint(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `FNV1A-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function buildAcademyHomeRecommendations(
  progress: AcademyProgressState,
  now: string
): AcademyHomeRecommendationModel {
  const nowMilliseconds = Date.parse(now);
  if (!Number.isFinite(nowMilliseconds)) {
    throw new Error("Academy home recommendations require a valid current timestamp.");
  }
  const firstIncomplete = canonicalLessons.findIndex(
    (lesson) => !progress.lessonRecords[lesson.id]?.completionEarned
  );
  const resumedPosition = canonicalLessons.findIndex(
    (lesson) => lesson.id === progress.resumeCursor?.lessonId
  );
  const currentCoursePosition = resumedPosition >= 0
    ? resumedPosition
    : firstIncomplete >= 0
      ? firstIncomplete
      : Math.max(0, canonicalLessons.length - 1);

  const candidates: RecommendationCandidate[] = canonicalLessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    route: academyLessonRoute(lesson.courseId, lesson.unitId, lesson.id),
    kind: "lesson",
    skillIds: lesson.skillId ? [lesson.skillId] : [],
    prerequisiteSkillIds: lesson.prerequisiteSkillIds,
    coursePosition: lesson.position,
    completed: progress.lessonRecords[lesson.id]?.completionEarned === true
  }));

  for (const unit of academyUnits) {
    const position = canonicalLessons.findIndex((lesson) => lesson.unitId === unit.id)
      + unit.lessonIds.length;
    const skillId = skillForUnit(unit.id);
    for (const [assessment, kind] of [
      [unit.quiz, "quiz"],
      [unit.unitTest, "test"]
    ] as const) {
      candidates.push({
        id: assessment.id,
        title: assessment.title,
        route: academyUnitAssessmentRoute(unit.courseId, unit.id, kind),
        kind: "assessment",
        skillIds: skillId ? [skillId] : [],
        prerequisiteSkillIds: [...unit.prerequisiteSkillIds],
        coursePosition: position + (kind === "quiz" ? 0.25 : 0.5),
        completed: aggregatePassed(
          progress,
          assessment.id,
          assessment.requiredScorePercent
        )
      });
    }
  }

  for (const course of academyCourses) {
    const courseLessons = canonicalLessons.filter((lesson) => lesson.courseId === course.id);
    const courseSkillIds = academySkills
      .filter((skill) => skill.unitIds.some((unitId) => course.unitIds.includes(unitId)))
      .map((skill) => skill.id);
    candidates.push({
      id: course.challenge.id,
      title: course.challenge.title,
      route: academyCourseChallengeRoute(course.id),
      kind: "assessment",
      skillIds: courseSkillIds,
      prerequisiteSkillIds: courseSkillIds,
      coursePosition: (courseLessons.at(-1)?.position ?? 0) + 0.75,
      completed: aggregatePassed(
        progress,
        course.challenge.id,
        course.challenge.requiredScorePercent
      )
    });
  }

  const dueReviewSkillIds = Object.values(progress.skillRecords)
    .filter((record) =>
      record.mastery === "review-due"
      || (record.reviewDueAt !== null && Date.parse(record.reviewDueAt) <= nowMilliseconds)
    )
    .map((record) => record.skillId)
    .sort();
  for (const skillId of dueReviewSkillIds) {
    const skill = academySkills.find((candidate) => candidate.id === skillId);
    if (!skill) continue;
    candidates.push({
      id: `REVIEW-${skillId}`,
      title: `${skill.title} retrieval review`,
      route: "/learn/review",
      kind: "review",
      skillIds: [skillId],
      prerequisiteSkillIds: [],
      coursePosition: currentCoursePosition,
      completed: false
    });
  }

  const unfinishedLabIds: string[] = [];
  for (const lab of Object.values(progress.unfinishedLabs)) {
    const unit = academyUnits.find((candidate) => candidate.id === lab.unitId);
    if (!unit?.laboratoryRoute) continue;
    const position = canonicalLessons.findIndex((lesson) => lesson.unitId === unit.id);
    const skillId = skillForUnit(unit.id);
    candidates.push({
      id: lab.labId,
      title: `${unit.title} laboratory`,
      route: unit.laboratoryRoute,
      kind: "laboratory",
      skillIds: skillId ? [skillId] : [],
      prerequisiteSkillIds: [...unit.prerequisiteSkillIds],
      coursePosition: position,
      completed: false
    });
    unfinishedLabIds.push(lab.labId);
  }

  const recommendationContext = {
    now,
    currentCoursePosition,
    candidates,
    mastery: Object.values(progress.skillRecords).map((record) => ({
      skillId: record.skillId,
      state: record.mastery,
      reviewDueAt: record.reviewDueAt
    })),
    skillLabels: academySkills.map((skill) => ({
      skillId: skill.id,
      title: skill.title
    })),
    recentResponses: recentResponseSignals(progress),
    unfinishedLabIds,
    limit: 5
  } as const;
  const generalRecommendations = recommendNextActivities(recommendationContext);
  const priorityCandidates = candidates.filter(
    (candidate) => candidate.kind === "review" || candidate.kind === "laboratory"
  );
  const priorityRecommendations = priorityCandidates.length === 0
    ? []
    : recommendNextActivities({
        ...recommendationContext,
        candidates: priorityCandidates,
        unfinishedLabIds: unfinishedLabIds.filter((labId) =>
          priorityCandidates.some((candidate) => candidate.id === labId)
        ),
        limit: Math.min(5, priorityCandidates.length)
      });
  const recommendations = [
    ...priorityRecommendations,
    ...generalRecommendations.filter(
      (candidate) =>
        !priorityRecommendations.some(
          (priority) => priority.activityId === candidate.activityId
        )
    )
  ].slice(0, 5);
  const activeLabRecord = Object.values(progress.unfinishedLabs)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const activeLabUnit = activeLabRecord
    ? academyUnits.find((unit) => unit.id === activeLabRecord.unitId)
    : undefined;
  const recentMastery = Object.values(progress.skillRecords)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 3);

  const inputFingerprint = fingerprint({
    day: now.slice(0, 10),
    currentCoursePosition,
    lessons: Object.values(progress.lessonRecords).map((record) => [
      record.lessonId,
      record.completionEarned,
      record.updatedAt
    ]),
    skills: Object.values(progress.skillRecords).map((record) => [
      record.skillId,
      record.mastery,
      record.reviewDueAt,
      record.updatedAt
    ]),
    unfinishedLabs: Object.values(progress.unfinishedLabs).map((record) => [
      record.labId,
      record.status,
      record.updatedAt
    ])
  });

  return {
    recommendations,
    candidateIds: recommendations.map((recommendation) => recommendation.activityId),
    inputFingerprint,
    currentCoursePosition,
    dueReviewSkillIds,
    recentMastery,
    activeLab: activeLabRecord && activeLabUnit?.laboratoryRoute
      ? {
          id: activeLabRecord.labId,
          title: `${activeLabUnit.title} laboratory`,
          route: activeLabUnit.laboratoryRoute,
          status: activeLabRecord.status,
          blocker: activeLabRecord.blocker
        }
      : null
  };
}
