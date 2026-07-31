import {
  academyCourses,
  academyUnitSeeds,
  academyUnits
} from "../../data/academy/catalogue";
import type { AcademyProgressState } from "../storage";
import { academyLessonRoute } from "./navigation";

export interface GuidedAcademyEntry {
  mode: "new" | "returning";
  primaryLabel: "Start from the beginning" | "Continue learning";
  primaryRoute: string;
  courseId: string;
  courseTitle: string;
  unitId: string;
  unitTitle: string;
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  dueReviewCount: number;
}

const sectionTitles: Readonly<Record<string, string>> = {
  learn: "Learn",
  watch: "Watch",
  "worked-example": "Worked example",
  practise: "Practise",
  practice: "Practise",
  check: "Check",
  apply: "Apply",
  complete: "Complete and continue"
};

const v2SectionTitles: Readonly<Record<string, string>> = {
  overview: "Learn",
  terms: "Learn",
  "conceptual-model": "Learn",
  "reasoned-cases": "Worked example",
  "failure-boundary": "Check",
  misconception: "Check",
  explorer: "Apply",
  assessment: "Practise"
};

function humaniseSection(blockId: string): string {
  const v2Marker = "-V2-";
  const v2MarkerIndex = blockId.indexOf(v2Marker);
  if (v2MarkerIndex >= 0) {
    const sectionKey = blockId
      .slice(v2MarkerIndex + v2Marker.length)
      .toLocaleLowerCase("en-AU");
    const v2Title = v2SectionTitles[sectionKey];
    if (v2Title) return v2Title;
  }
  return sectionTitles[blockId]
    ?? blockId
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
      .join(" ");
}

function lessonTitle(unitId: string, lessonId: string): string | null {
  const seed = academyUnitSeeds.find((candidate) => candidate.id === unitId);
  const unit = academyUnits.find((candidate) => candidate.id === unitId);
  const index = unit?.lessonIds.indexOf(lessonId) ?? -1;
  return seed && index >= 0 ? seed.lessonTitles[index] ?? null : null;
}

function dueReviewCount(
  academy: AcademyProgressState,
  nowMilliseconds: number
): number {
  const dueTargets = new Set<string>();
  for (const record of Object.values(academy.skillRecords)) {
    if (
      record.mastery === "review-due"
      || (
        record.reviewDueAt !== null
        && Date.parse(record.reviewDueAt) <= nowMilliseconds
      )
    ) {
      dueTargets.add(record.skillId);
    }
  }
  for (const review of Object.values(academy.reviewStates)) {
    if (
      review.state === "due"
      || (
        review.state === "scheduled"
        && Date.parse(review.dueAt) <= nowMilliseconds
      )
    ) {
      dueTargets.add(review.targetId);
    }
  }
  return dueTargets.size;
}

export function buildGuidedAcademyEntry(
  academy: AcademyProgressState,
  nowIso: string
): GuidedAcademyEntry {
  const nowMilliseconds = Date.parse(nowIso);
  const firstCourse = academyCourses[0];
  const firstUnit = academyUnits.find((unit) => unit.id === firstCourse.unitIds[0]);
  const firstLessonId = firstUnit?.lessonIds[0];
  if (!firstCourse || !firstUnit || !firstLessonId) {
    throw new Error("The Academy catalogue does not contain a first lesson.");
  }

  const resume = academy.resumeCursor;
  const resumeCourse = resume
    ? academyCourses.find((course) => course.id === resume.courseId)
    : null;
  const resumeUnit = resume
    ? academyUnits.find((unit) => (
        unit.id === resume.unitId
        && resumeCourse?.unitIds.includes(unit.id)
      ))
    : null;
  const resumeLessonTitle = resume && resumeUnit
    ? lessonTitle(resumeUnit.id, resume.lessonId)
    : null;
  const returning = Boolean(
    resume
    && resumeCourse
    && resumeUnit
    && resumeLessonTitle
    && resumeUnit.lessonIds.includes(resume.lessonId)
  );

  if (returning && resume && resumeCourse && resumeUnit && resumeLessonTitle) {
    return {
      mode: "returning",
      primaryLabel: "Continue learning",
      primaryRoute: `${resume.route}?resume=${encodeURIComponent(resume.blockId)}`,
      courseId: resumeCourse.id,
      courseTitle: resumeCourse.title,
      unitId: resumeUnit.id,
      unitTitle: resumeUnit.title,
      lessonId: resume.lessonId,
      lessonTitle: resumeLessonTitle,
      sectionTitle: humaniseSection(resume.blockId),
      dueReviewCount: dueReviewCount(academy, nowMilliseconds)
    };
  }

  return {
    mode: "new",
    primaryLabel: "Start from the beginning",
    primaryRoute: academyLessonRoute(firstCourse.id, firstUnit.id, firstLessonId),
    courseId: firstCourse.id,
    courseTitle: firstCourse.title,
    unitId: firstUnit.id,
    unitTitle: firstUnit.title,
    lessonId: firstLessonId,
    lessonTitle: lessonTitle(firstUnit.id, firstLessonId) ?? firstLessonId,
    sectionTitle: "Learn",
    dueReviewCount: dueReviewCount(academy, nowMilliseconds)
  };
}
