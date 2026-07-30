import type {
  AcademyCatalogue,
  AcademyInstruction,
  AcademyQuestion,
  AcademyStage,
  AcademyStageContent,
  Course,
  Lesson,
  LessonBlock,
  Unit
} from "./types";
import {
  academyAssessmentsManifest,
  academyCatalogue,
  academyCourseCatalogue,
  academyMandatoryCoverageRequirements,
  academyMediaManifest,
  academyMediaPlacementManifest,
  academyMilestoneMappings,
  academyRouteManifest,
  academySessionMappings,
  academySkillsManifest,
  academySourcesManifest,
  academyUnitCatalogue
} from "../../data/academy/manifests";
import { academyUnitSourceMap } from "../../data/academy/catalogue";
import { mandatoryAcademyProofSessionIds } from "../../data/academy/rebootMappings";
import {
  getQuestionExpectedResponseFingerprint,
  getQuestionRetryLimit
} from "./assessment";
import { getAcademyFormulaRenderVerificationId } from "./formulaRenderVerificationContract";

export {
  academyAssessmentsManifest,
  academyCatalogue,
  academyCourseCatalogue,
  academyMandatoryCoverageRequirements,
  academyMediaManifest,
  academyMediaPlacementManifest,
  academyMilestoneMappings,
  academyRouteManifest,
  academySessionMappings,
  academySkillsManifest,
  academySourcesManifest,
  academyUnitCatalogue
};
export { academyCoverageManifest } from "../../data/academy/coverage";
export {
  academyRebootMappings,
  academyRebootSessionPlan
} from "../../data/academy/rebootMappings";

export interface LoadedAcademyCourse {
  course: Course;
  units: Unit[];
  lessons: Lesson[];
}

export interface AcademyValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface AcademyFormulaManifestEntry {
  formulaId: string;
  lessonId: string;
  renderVerificationId: string;
  latex: string;
  spoken: string;
  variableSymbols: string[];
  variableUnits: string[];
  derivationStepCount: number;
  workedExampleCount: number;
  exampleVerificationIds: string[];
  structuralStatus: "pass" | "fail";
}

export interface AcademySkillAssessmentManifestEntry {
  skillId: string;
  practiceQuestionIds: string[];
  quizIds: string[];
  unitTestIds: string[];
  courseChallengeIds: string[];
  appliedRoutes: string[];
  masteryPolicy: {
    practisingScorePercent: 60;
    proficientScorePercent: 80;
    masteredDelayedReviewPercent: 90;
    appliedEvidenceRequired: boolean;
  };
}

export const academyStageLoaders: Record<AcademyStage, () => Promise<AcademyStageContent>> = {
  E0: () => import("../../data/academy/stages/E0").then((module) => module.academyStageE0),
  E1: () => import("../../data/academy/stages/E1").then((module) => module.academyStageE1),
  E2: () => import("../../data/academy/stages/E2").then((module) => module.academyStageE2),
  E3: () => import("../../data/academy/stages/E3").then((module) => module.academyStageE3),
  E4: () => import("../../data/academy/stages/E4").then((module) => module.academyStageE4)
};

export const getAcademyLessonStage = (lessonId: string): AcademyStage | null => {
  const unit = academyUnitCatalogue.find((candidate) => candidate.lessonIds.includes(lessonId));
  if (!unit) return null;
  const course = academyCourseCatalogue.find((candidate) => candidate.id === unit.courseId);
  return course?.stage ?? null;
};

export const loadAcademyStage = async (stage: AcademyStage): Promise<AcademyStageContent> =>
  academyStageLoaders[stage]();

export const loadAllAcademyStages = async (): Promise<AcademyStageContent[]> =>
  Promise.all((["E0", "E1", "E2", "E3", "E4"] as AcademyStage[]).map(loadAcademyStage));

export const loadAcademyCourse = async (courseId: string): Promise<LoadedAcademyCourse | null> => {
  const course = academyCourseCatalogue.find((candidate) => candidate.id === courseId);
  if (!course) return null;
  const stageContent = await loadAcademyStage(course.stage);
  const units = academyUnitCatalogue.filter((unit) => course.unitIds.includes(unit.id));
  const unitIds = new Set(units.map((unit) => unit.id));
  return {
    course,
    units,
    lessons: stageContent.lessons.filter((lesson) => unitIds.has(lesson.unitId))
  };
};

export const loadAcademyLesson = async (lessonId: string): Promise<Lesson | null> => {
  const stage = getAcademyLessonStage(lessonId);
  if (!stage) return null;
  const stageContent = await loadAcademyStage(stage);
  return stageContent.lessons.find((lesson) => lesson.id === lessonId) ?? null;
};

const issue = (
  issues: AcademyValidationIssue[],
  code: string,
  path: string,
  message: string
): void => {
  issues.push({ code, path, message });
};

const duplicates = (values: string[]): string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
};

const graphHasCycle = (edges: Map<string, string[]>): boolean => {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const prerequisite of edges.get(node) ?? []) {
      if (visit(prerequisite)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...edges.keys()].some(visit);
};

const isInternalRoute = (route: string | null): route is string =>
  typeof route === "string" && route.startsWith("/") && !route.startsWith("//");

const safeAcademyImageSourcePattern =
  /^\.\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:avif|gif|jpe?g|png|svg|webp)$/u;

const prohibitedContentPattern =
  /\b(?:TODO|TBD|placeholder|lorem ipsum|coming soon|read the documentation|read external documentation|visit the website|external reading)\b/i;
const unicodeDashPattern = /[\u2013\u2014]/u;

const instructionIsComplete = (
  instruction: AcademyInstruction
): boolean =>
  instruction.length > 0
  && instruction.every((part) => {
    if (part.kind === "text") return part.text.trim().length > 0;
    const { expression } = part;
    return (
      expression.id.trim().length > 0
      && expression.plainText.trim().length > 0
      && expression.latex.trim().length > 0
      && expression.spoken.trim().length > 0
    );
  });

export const validateAcademyRouteResolution = (
  resolvableRoutes: ReadonlySet<string>,
  catalogue: AcademyCatalogue = academyCatalogue
): AcademyValidationIssue[] => {
  const issues: AcademyValidationIssue[] = [];
  const references = [
    ...catalogue.units.flatMap((unit) => [
      { path: `units.${unit.id}.laboratoryRoute`, route: unit.laboratoryRoute },
      { path: `units.${unit.id}.projectRoute`, route: unit.projectRoute }
    ]),
    ...catalogue.coverage.map((entry) => ({
      path: `coverage.${entry.requirementId}.appliedRoute`,
      route: entry.appliedRoute
    })),
    ...catalogue.rebootMappings.flatMap((mapping) =>
      mapping.appliedRoutes.map((route, index) => ({
        path: `rebootMappings.${mapping.sessionId}.appliedRoutes.${index}`,
        route
      }))
    ),
    ...academyRouteManifest.map((entry) => ({
      path: `routes.${entry.id}`,
      route: entry.route
    }))
  ];

  for (const reference of references) {
    if (
      reference.route !== null
      && (!isInternalRoute(reference.route) || !resolvableRoutes.has(reference.route))
    ) {
      issue(
        issues,
        "unresolved-internal-route",
        reference.path,
        `Mapped internal route ${reference.route} is absent from the supplied live route registry.`
      );
    }
  }
  return issues;
};

export const validateAcademyMediaPlacements = (
  stageContents: AcademyStageContent[],
  placementManifest = academyMediaPlacementManifest
): AcademyValidationIssue[] => {
  const issues: AcademyValidationIssue[] = [];
  const lessons = stageContents.flatMap((stage) => stage.lessons);
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const mediaIds = new Set(academyMediaManifest.map((media) => media.id));
  const placementByMediaId = new Map(
    placementManifest.map((entry) => [entry.mediaId, entry])
  );

  for (const duplicate of duplicates(placementManifest.map((entry) => entry.mediaId))) {
    issue(issues, "duplicate-media-placement", `mediaPlacements.${duplicate}`, "Media placement ID is duplicated.");
  }
  if (
    placementManifest.length !== mediaIds.size
    || [...mediaIds].some((mediaId) => !placementByMediaId.has(mediaId))
  ) {
    issue(
      issues,
      "media-placement-count",
      "mediaPlacements",
      "Media placement manifest must contain every registered media ID exactly once."
    );
  }

  for (const entry of placementManifest) {
    const path = `mediaPlacements.${entry.mediaId}`;
    const uniqueLessonIds = new Set(entry.lessonIds);
    const expectedLessonIds = lessons
      .filter((lesson) => lesson.mediaIds.includes(entry.mediaId))
      .map((lesson) => lesson.id)
      .sort();
    const declaredLessonIds = [...entry.lessonIds].sort();
    if (
      !mediaIds.has(entry.mediaId)
      || entry.lessonIds.length === 0
      || uniqueLessonIds.size !== entry.lessonIds.length
      || entry.lessonIds.some((lessonId) => !lessonById.has(lessonId))
      || JSON.stringify(declaredLessonIds) !== JSON.stringify(expectedLessonIds)
    ) {
      issue(
        issues,
        "media-placement",
        path,
        "Media placement must resolve to every and only the lessons that declare the media ID."
      );
    }
  }

  return issues;
};

const validateQuestion = (
  question: AcademyQuestion,
  lesson: Lesson,
  issues: AcademyValidationIssue[],
  retryVariantIndex: number | null = null
): void => {
  const path = `lessons.${lesson.id}.questions.${question.id}${
    retryVariantIndex === null
      ? ""
      : `.retryVariants.${retryVariantIndex}`
  }`;
  if (!question.prompt.trim()) issue(issues, "question-prompt", path, "Question prompt is empty.");
  if (!question.feedbackCorrect.trim() || !question.feedbackIncorrect.trim()) {
    issue(issues, "question-feedback", path, "Question requires specific correct and incorrect feedback.");
  }
  if (question.hints.length < 2 || question.hints.some((hint) => !hint.trim())) {
    issue(issues, "question-hints", path, "Question requires at least two progressive non-empty hints.");
  }
  if (question.solution.length < 2 || question.solution.some((step) => !step.trim())) {
    issue(issues, "question-solution", path, "Question requires a multi-step worked solution.");
  }
  if (
    question.mathSupport
    && (
      !instructionIsComplete(question.mathSupport.prompt)
      || question.mathSupport.hints.length !== question.hints.length
      || question.mathSupport.solution.length !== question.solution.length
      || question.mathSupport.hints.some(
        (instruction) => instruction !== null && !instructionIsComplete(instruction)
      )
      || question.mathSupport.solution.some(
        (instruction) => instruction !== null && !instructionIsComplete(instruction)
      )
    )
  ) {
    issue(
      issues,
      "question-math-support",
      path,
      "Reviewed question mathematics must provide a complete prompt and index-aligned hint and solution mappings."
    );
  }
  if (Object.keys(question.misconceptionFeedback).length === 0) {
    issue(issues, "question-misconception", path, "Question requires misconception-aware feedback.");
  }
  if (question.skillIds.length === 0) {
    issue(issues, "question-skill", path, "Question must map to a skill.");
  }

  switch (question.type) {
    case "single-choice":
    case "diagram": {
      if (question.options.length < 3 || !question.options.some((option) => option.id === question.correctOptionId)) {
        issue(issues, "question-options", path, "Choice question requires at least three options and a resolved answer.");
      }
      break;
    }
    case "code-analysis": {
      if (
        !question.language.trim()
        || !question.code.trim()
        || question.options.length < 3
        || !question.options.some((option) => option.id === question.correctOptionId)
      ) {
        issue(issues, "question-code-analysis", path, "Code analysis requires static code, a language and a resolved choice answer.");
      }
      break;
    }
    case "multiple-selection": {
      const optionIds = new Set(question.options.map((option) => option.id));
      if (
        question.options.length < 3
        || question.correctOptionIds.length < 2
        || question.correctOptionIds.some((id) => !optionIds.has(id))
      ) {
        issue(issues, "question-options", path, "Multiple-selection answer does not resolve to its option set.");
      }
      break;
    }
    case "numeric": {
      if (
        !Number.isFinite(question.expectedValue)
        || question.absoluteTolerance < 0
        || question.relativeTolerance < 0
        || !question.canonicalUnit.trim()
        || Object.values(question.acceptedUnits).some((factor) => !Number.isFinite(factor) || factor <= 0)
        || !question.mathSupport
      ) {
        issue(issues, "question-numeric", path, "Numeric grading and reviewed mathematics contract is invalid.");
      }
      break;
    }
    case "ordering": {
      const itemIds = new Set(question.items.map((item) => item.id));
      if (
        question.items.length < 3
        || question.correctOrder.length !== question.items.length
        || question.correctOrder.some((id) => !itemIds.has(id))
      ) {
        issue(issues, "question-ordering", path, "Ordering answer must contain every item exactly once.");
      }
      break;
    }
    case "matching": {
      const rightIds = new Set(question.right.map((option) => option.id));
      if (
        question.left.length < 2
        || question.right.length < 2
        || question.left.some((option) => !rightIds.has(question.correctPairs[option.id]))
      ) {
        issue(issues, "question-matching", path, "Matching answer must resolve every left item.");
      }
      break;
    }
    case "short-response": {
      if (
        question.requiredTerms.length === 0
        || question.minimumTerms < 1
        || question.minimumTerms > question.requiredTerms.length
      ) {
        issue(issues, "question-short-response", path, "Short response term threshold is invalid.");
      }
      break;
    }
    case "seeded-calculation": {
      const gridSize = Math.floor((question.generator.maximum - question.generator.minimum) / question.generator.step) + 1;
      if (
        !question.prompt.includes("{{input}}")
        || question.generator.step <= 0
        || question.generator.maximum < question.generator.minimum
        || !Number.isFinite(gridSize)
        || gridSize < 1
        || gridSize > 10000
        || !question.mathSupport
      ) {
        issue(
          issues,
          "question-seeded",
          path,
          "Seeded calculation requires a bounded grid, {{input}} prompt token and reviewed mathematics."
        );
      }
      break;
    }
  }

  if (retryVariantIndex !== null) return;
  try {
    const firstFingerprint = getQuestionExpectedResponseFingerprint(question, 0);
    const fingerprints = new Set([firstFingerprint]);
    if (question.type === "seeded-calculation") {
      const retryLimit = getQuestionRetryLimit(question);
      if (retryLimit < 1) {
        issue(
          issues,
          "question-retry-missing",
          path,
          "Generated question requires at least one distinct retry answer."
        );
        return;
      }
      for (let retryIndex = 1; retryIndex <= retryLimit; retryIndex += 1) {
        const retryFingerprint = getQuestionExpectedResponseFingerprint(
          question,
          retryIndex
        );
        if (fingerprints.has(retryFingerprint)) {
          issue(
            issues,
            "question-retry-answer",
            path,
            `Generated retry ${retryIndex} repeats an earlier expected response.`
          );
        }
        fingerprints.add(retryFingerprint);
      }
      return;
    }

    const retryVariants = question.retryVariants ?? [];
    if (retryVariants.length === 0) {
      issue(
        issues,
        "question-retry-missing",
        path,
        "Automatically scored question requires an authored same-skill retry variant."
      );
      return;
    }
    for (const [index, retry] of retryVariants.entries()) {
      if (
        retry.id !== question.id
        || JSON.stringify([...retry.skillIds].sort())
          !== JSON.stringify([...question.skillIds].sort())
      ) {
        issue(
          issues,
          "question-retry-contract",
          `${path}.retryVariants.${index}`,
          "Retry must preserve the source question identity and linked skills."
        );
        continue;
      }
      validateQuestion(retry, lesson, issues, index);
      const retryFingerprint = getQuestionExpectedResponseFingerprint(
        question,
        index + 1
      );
      if (fingerprints.has(retryFingerprint)) {
        issue(
          issues,
          "question-retry-answer",
          `${path}.retryVariants.${index}`,
          "Retry repeats an earlier expected response."
        );
      }
      fingerprints.add(retryFingerprint);
    }
  } catch (caught) {
    issue(
      issues,
      "question-retry-invalid",
      path,
      caught instanceof Error
        ? caught.message
        : "Question retry validation failed."
    );
  }
};

export const validateAcademyCatalogue = (
  catalogue: AcademyCatalogue = academyCatalogue
): AcademyValidationIssue[] => {
  const issues: AcademyValidationIssue[] = [];
  if (catalogue.courses.length !== 5) {
    issue(issues, "course-count", "courses", `Expected 5 courses, found ${catalogue.courses.length}.`);
  }
  if (catalogue.units.length !== 25) {
    issue(issues, "unit-count", "units", `Expected 25 retained units, found ${catalogue.units.length}.`);
  }
  const stageCounts = new Map<AcademyStage, number>([
    ["E0", 3],
    ["E1", 5],
    ["E2", 8],
    ["E3", 7],
    ["E4", 2]
  ]);
  for (const [stage, expected] of stageCounts) {
    const course = catalogue.courses.find((candidate) => candidate.stage === stage);
    if (!course || course.unitIds.length !== expected) {
      issue(issues, "stage-unit-count", `courses.${stage}`, `Expected ${expected} units for ${stage}.`);
    }
  }

  for (const duplicate of duplicates(catalogue.courses.map((course) => course.id))) {
    issue(issues, "duplicate-course", `courses.${duplicate}`, "Course ID is duplicated.");
  }
  for (const duplicate of duplicates(catalogue.units.map((unit) => unit.id))) {
    issue(issues, "duplicate-unit", `units.${duplicate}`, "Unit ID is duplicated.");
  }
  for (const duplicate of duplicates(catalogue.skills.map((skill) => skill.id))) {
    issue(issues, "duplicate-skill", `skills.${duplicate}`, "Skill ID is duplicated.");
  }
  for (const duplicate of duplicates(catalogue.coverage.map((entry) => entry.requirementId))) {
    issue(issues, "duplicate-coverage", `coverage.${duplicate}`, "Coverage requirement ID is duplicated.");
  }
  for (const duplicate of duplicates(catalogue.rebootMappings.map((mapping) => mapping.sessionId))) {
    issue(issues, "duplicate-session", `rebootMappings.${duplicate}`, "Reboot session mapping is duplicated.");
  }
  for (const duplicate of duplicates(catalogue.sources.map((source) => source.id))) {
    issue(issues, "duplicate-source", `sources.${duplicate}`, "Source ID is duplicated.");
  }
  for (const duplicate of duplicates(catalogue.media.map((media) => media.id))) {
    issue(issues, "duplicate-media", `media.${duplicate}`, "Media ID is duplicated.");
  }

  const courseIds = new Set(catalogue.courses.map((course) => course.id));
  const unitIds = new Set(catalogue.units.map((unit) => unit.id));
  const skillIds = new Set(catalogue.skills.map((skill) => skill.id));
  const sourceIds = new Set(catalogue.sources.map((source) => source.id));
  const assessmentIds = new Set(academyAssessmentsManifest.map((assessment) => assessment.id));
  const lessonIds = new Set(catalogue.units.flatMap((unit) => unit.lessonIds));
  const expectedLegacyUnitIds = Array.from({ length: 25 }, (_, index) => {
    const domain = index + 1;
    const stage = domain <= 3 ? "E0" : domain <= 8 ? "E1" : domain <= 16 ? "E2" : domain <= 23 ? "E3" : "E4";
    return `EML-${stage}-D${String(domain).padStart(2, "0")}`;
  });
  if (catalogue.units.some((unit, index) => unit.id !== expectedLegacyUnitIds[index])) {
    issue(issues, "legacy-module-set", "units", "Canonical E0-E4 legacy module IDs or ordering changed.");
  }

  for (const course of catalogue.courses) {
    if (course.unitIds.length === 0 || course.unitIds.some((unitId) => !unitIds.has(unitId))) {
      issue(issues, "course-units", `courses.${course.id}`, "Course has an empty or unresolved unit reference.");
    }
    if (course.prerequisiteCourseIds.some((courseId) => !courseIds.has(courseId))) {
      issue(issues, "course-prerequisite", `courses.${course.id}`, "Course prerequisite does not resolve.");
    }
    if (course.sourceIds.some((sourceId) => !sourceIds.has(sourceId))) {
      issue(issues, "course-source", `courses.${course.id}`, "Course source does not resolve.");
    }
    if (course.estimatedMinutes <= 0 || course.outcomes.length < 2) {
      issue(issues, "course-contract", `courses.${course.id}`, "Course outcomes or duration are incomplete.");
    }
  }

  for (const unit of catalogue.units) {
    if (!courseIds.has(unit.courseId)) {
      issue(issues, "unit-course", `units.${unit.id}`, "Unit course does not resolve.");
    }
    const owningCourses = catalogue.courses.filter((course) => course.unitIds.includes(unit.id));
    if (owningCourses.length !== 1 || owningCourses[0].id !== unit.courseId) {
      issue(issues, "unit-course-membership", `units.${unit.id}`, "Unit must belong to exactly its declared course.");
    }
    if (unit.legacyModuleId !== unit.id || !/^EML-E[0-4]-D\d{2}$/.test(unit.legacyModuleId)) {
      issue(issues, "legacy-module", `units.${unit.id}`, "Retained legacy module ID is missing or changed.");
    }
    if (unit.lessonIds.length !== 7 || duplicates(unit.lessonIds).length > 0) {
      issue(issues, "unit-lessons", `units.${unit.id}`, "Every retained unit must contain exactly seven unique lessons.");
    }
    if (unit.prerequisiteSkillIds.some((skillId) => !skillIds.has(skillId))) {
      issue(issues, "unit-prerequisite", `units.${unit.id}`, "Unit prerequisite skill does not resolve.");
    }
    if (!isInternalRoute(unit.laboratoryRoute) && !isInternalRoute(unit.projectRoute)) {
      issue(issues, "unit-application", `units.${unit.id}`, "Unit requires an internal laboratory or project route.");
    }
    const mappedSourceIds = academyUnitSourceMap[unit.id];
    if (
      !mappedSourceIds
      || mappedSourceIds.length === 0
      || mappedSourceIds.some((sourceId) => !sourceIds.has(sourceId))
    ) {
      issue(issues, "unit-sources", `units.${unit.id}`, "Unit source mapping is empty or unresolved.");
    }
    for (const assessment of [unit.quiz, unit.unitTest]) {
      if (
        assessment.requiredScorePercent < 0
        || assessment.requiredScorePercent > 100
        || assessment.questionIds.length === 0
      ) {
        issue(issues, "unit-assessment", `units.${unit.id}.${assessment.id}`, "Unit assessment contract is invalid.");
      }
    }
  }

  if (lessonIds.size !== 175) {
    issue(issues, "lesson-catalogue-count", "units.lessonIds", `Expected 175 unique lesson IDs, found ${lessonIds.size}.`);
  }
  for (const mappedUnitId of Object.keys(academyUnitSourceMap)) {
    if (!unitIds.has(mappedUnitId)) {
      issue(issues, "unit-source-orphan", `unitSources.${mappedUnitId}`, "Source mapping refers to an unknown unit.");
    }
  }

  for (const skill of catalogue.skills) {
    if (
      skill.unitIds.length === 0
      || skill.lessonIds.length === 0
      || skill.unitIds.some((unitId) => !unitIds.has(unitId))
      || skill.lessonIds.some((lessonId) => !lessonIds.has(lessonId))
      || skill.prerequisiteSkillIds.some((skillId) => !skillIds.has(skillId))
    ) {
      issue(issues, "skill-references", `skills.${skill.id}`, "Skill references are empty or unresolved.");
    }
  }
  if (graphHasCycle(new Map(catalogue.skills.map((skill) => [skill.id, skill.prerequisiteSkillIds])))) {
    issue(issues, "skill-cycle", "skills", "Skill prerequisite graph contains a cycle.");
  }

  if (catalogue.coverage.length !== academyMandatoryCoverageRequirements.length) {
    issue(issues, "coverage-count", "coverage", "Coverage manifest does not match the mandatory requirement registry.");
  }
  for (const entry of catalogue.coverage) {
    if (
      !courseIds.has(entry.courseId)
      || !unitIds.has(entry.unitId)
      || !lessonIds.has(entry.lessonId)
      || entry.skillIds.some((skillId) => !skillIds.has(skillId))
      || entry.assessmentIds.some((assessmentId) => !assessmentIds.has(assessmentId))
      || !isInternalRoute(entry.appliedRoute)
      || entry.status !== "mapped"
    ) {
      issue(issues, "coverage-references", `coverage.${entry.requirementId}`, "Coverage entry is incomplete or unresolved.");
    }
  }

  if (catalogue.rebootMappings.length !== 110) {
    issue(issues, "session-count", "rebootMappings", `Expected 110 session mappings, found ${catalogue.rebootMappings.length}.`);
  }
  const expectedProofIds = new Set<string>(mandatoryAcademyProofSessionIds);
  for (let index = 0; index < 110; index += 1) {
    const expectedId = `S${String(index + 1).padStart(3, "0")}`;
    const mapping = catalogue.rebootMappings[index];
    if (!mapping || mapping.sessionId !== expectedId) {
      issue(issues, "session-order", `rebootMappings.${index}`, `Expected ordered session ${expectedId}.`);
      continue;
    }
    if (
      mapping.lessonIds.length === 0
      || mapping.assessmentIds.length === 0
      || mapping.reviewSkillIds.length === 0
      || mapping.appliedRoutes.length === 0
      || mapping.lessonIds.some((lessonId) => !lessonIds.has(lessonId))
      || mapping.assessmentIds.some((assessmentId) => !assessmentIds.has(assessmentId))
      || mapping.reviewSkillIds.some((skillId) => !skillIds.has(skillId))
      || mapping.appliedRoutes.some((route) => !isInternalRoute(route))
    ) {
      issue(issues, "session-references", `rebootMappings.${mapping.sessionId}`, "Session mapping is incomplete or unresolved.");
    }
    if (mapping.mandatoryProof !== expectedProofIds.has(mapping.sessionId)) {
      issue(issues, "session-proof", `rebootMappings.${mapping.sessionId}`, "Mandatory proof flag does not match the proof registry.");
    }
  }

  const mappedRoutes = new Set(catalogue.rebootMappings.flatMap((mapping) => mapping.appliedRoutes));
  for (const required of academyRouteManifest) {
    if (!mappedRoutes.has(required.route)) {
      issue(issues, "required-route", `routes.${required.id}`, `Required ${required.category} route is not reachable from a session mapping.`);
    }
  }

  for (const source of catalogue.sources) {
    if (
      !source.title.trim()
      || !source.organisation.trim()
      || !source.url.startsWith("https://")
      || !source.licence.trim()
      || !source.attribution.trim()
      || !/^\d{4}-\d{2}-\d{2}$/.test(source.lastValidated)
    ) {
      issue(issues, "source-contract", `sources.${source.id}`, "Source metadata is incomplete or invalid.");
    }
  }

  for (const media of catalogue.media) {
    if (
      !media.creator.trim()
      || !media.title.trim()
      || !media.learningOutcome.trim()
      || !media.licence.trim()
      || !media.attribution.trim()
      || !media.nativeSummaryFallback.trim()
      || !media.offlineFallback.trim()
      || !media.privacyBehaviour.trim()
      || (
        media.provider === "youtube"
        && (
          media.alternativeSourceId === null
          || !sourceIds.has(media.alternativeSourceId)
        )
      )
    ) {
      issue(
        issues,
        "media-contract",
        `media.${media.id}`,
        "Media metadata, native fallback or reviewed alternative source is incomplete."
      );
    }
  }

  return issues;
};

export const validateAcademyStageContent = (
  stageContent: AcademyStageContent,
  catalogue: AcademyCatalogue = academyCatalogue
): AcademyValidationIssue[] => {
  const issues: AcademyValidationIssue[] = [];
  const course = catalogue.courses.find((candidate) => candidate.stage === stageContent.stage);
  if (!course) {
    issue(issues, "stage-course", `stages.${stageContent.stage}`, "Stage has no course.");
    return issues;
  }
  const unitIds = new Set(course.unitIds);
  const expectedLessonIds = new Set(
    catalogue.units.filter((unit) => unitIds.has(unit.id)).flatMap((unit) => unit.lessonIds)
  );
  if (stageContent.lessons.length !== expectedLessonIds.size) {
    issue(
      issues,
      "stage-lesson-count",
      `stages.${stageContent.stage}`,
      `Expected ${expectedLessonIds.size} lessons, found ${stageContent.lessons.length}.`
    );
  }
  if (stageContent.lessons.some((lesson) => !expectedLessonIds.has(lesson.id))) {
    issue(issues, "stage-lesson-membership", `stages.${stageContent.stage}`, "Stage contains a lesson from another course.");
  }
  return issues;
};

export const buildAcademyFormulaManifest = (
  stageContents: AcademyStageContent[]
): AcademyFormulaManifestEntry[] =>
  stageContents.flatMap((stage) =>
    stage.lessons.flatMap((lesson) =>
      lesson.formulae.map((formula) => {
        const variableSymbols = formula.variables.map((variable) => variable.symbol);
        const variableUnits = formula.variables.map((variable) => variable.siUnit);
        const workedExamples = lesson.blocks.filter(
          (
            block
          ): block is Extract<LessonBlock, { kind: "worked-example" }> =>
            block.kind === "worked-example"
            && block.example.governingFormulaId === formula.id
        );
        const structuralStatus = (
          formula.id.trim().length > 0
          && formula.latex.trim().length > 0
          && formula.spoken.trim().length > 0
          && formula.variables.length > 0
          && new Set(variableSymbols).size === variableSymbols.length
          && formula.variables.every((variable) =>
            variable.symbol.trim().length > 0
            && variable.meaning.trim().length > 0
            && variable.siUnit.trim().length > 0
          )
          && formula.assumptions.length > 0
          && formula.assumptions.every((assumption) => assumption.trim().length > 0)
          && formula.derivationSteps.length >= 2
          && formula.derivationSteps.every(instructionIsComplete)
          && workedExamples.length >= 2
          && workedExamples.every((block) =>
            block.kind === "worked-example"
            && block.example.assumptions.length > 0
            && block.example.assumptions.every((assumption) => assumption.trim().length > 0)
            && instructionIsComplete(block.example.problem)
            && block.example.steps.length >= 3
            && block.example.steps.every(instructionIsComplete)
            && instructionIsComplete(block.example.result)
            && instructionIsComplete(block.example.dimensionalCheck)
            && instructionIsComplete(block.example.independentCheck)
          )
        ) ? "pass" as const : "fail" as const;
        return {
          formulaId: formula.id,
          lessonId: lesson.id,
          renderVerificationId: getAcademyFormulaRenderVerificationId(lesson.id, formula.id),
          latex: formula.latex,
          spoken: formula.spoken,
          variableSymbols,
          variableUnits,
          derivationStepCount: formula.derivationSteps.length,
          workedExampleCount: workedExamples.length,
          exampleVerificationIds: workedExamples.map(
            (block) => block.example.id
          ),
          structuralStatus
        };
      })
    )
  );

export const buildAcademySkillAssessmentManifest = (
  stageContents: AcademyStageContent[],
  catalogue: AcademyCatalogue = academyCatalogue
): AcademySkillAssessmentManifestEntry[] => {
  const lessons = stageContents.flatMap((stage) => stage.lessons);
  return catalogue.skills.map((skill) => {
    const skillLessons = lessons.filter((lesson) => lesson.skillIds.includes(skill.id));
    const units = catalogue.units.filter((unit) => skill.unitIds.includes(unit.id));
    const courseIds = new Set(units.map((unit) => unit.courseId));
    return {
      skillId: skill.id,
      practiceQuestionIds: skillLessons.flatMap((lesson) => lesson.questions.map((question) => question.id)),
      quizIds: units.map((unit) => unit.quiz.id),
      unitTestIds: units.map((unit) => unit.unitTest.id),
      courseChallengeIds: catalogue.courses
        .filter((course) => courseIds.has(course.id))
        .map((course) => course.challenge.id),
      appliedRoutes: [
        ...new Set(units.flatMap((unit) => [unit.laboratoryRoute, unit.projectRoute]).filter(isInternalRoute))
      ],
      masteryPolicy: {
        practisingScorePercent: 60,
        proficientScorePercent: 80,
        masteredDelayedReviewPercent: 90,
        appliedEvidenceRequired: skill.requiresAppliedEvidence
      }
    };
  });
};

export const validateAcademyCurriculum = (
  stageContents: AcademyStageContent[],
  catalogue: AcademyCatalogue = academyCatalogue
): AcademyValidationIssue[] => {
  const issues = [
    ...validateAcademyCatalogue(catalogue),
    ...stageContents.flatMap((stage) => validateAcademyStageContent(stage, catalogue))
  ];
  const lessons = stageContents.flatMap((stage) => stage.lessons);
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const questionById = new Map<string, AcademyQuestion>();
  const formulaIds = new Set<string>();
  const sourceIds = new Set(catalogue.sources.map((source) => source.id));
  const mediaIds = new Set(catalogue.media.map((media) => media.id));
  const skillIds = new Set(catalogue.skills.map((skill) => skill.id));
  const referencedSourceIds = new Set<string>();
  const referencedMediaIds = new Set<string>();

  if (stageContents.length !== 5 || duplicates(stageContents.map((stage) => stage.stage)).length > 0) {
    issue(issues, "stage-set", "stages", "Curriculum requires one payload for each of the five stages.");
  }
  if (lessons.length !== 175 || lessonById.size !== 175) {
    issue(issues, "lesson-count", "lessons", `Expected 175 unique lessons, found ${lessonById.size}.`);
  }
  if (graphHasCycle(new Map(lessons.map((lesson) => [lesson.id, lesson.prerequisites])))) {
    issue(issues, "lesson-cycle", "lessons", "Lesson prerequisite graph contains a cycle.");
  }

  for (const lesson of lessons) {
    const path = `lessons.${lesson.id}`;
    const unit = catalogue.units.find((candidate) => candidate.id === lesson.unitId);
    if (!unit || !unit.lessonIds.includes(lesson.id)) {
      issue(issues, "lesson-unit", path, "Lesson does not resolve through its owning unit.");
    }
    if (lesson.objectives.length < 2 || lesson.objectives.length > 5 || lesson.objectives.some((objective) => !objective.trim())) {
      issue(issues, "lesson-objectives", path, "Lesson requires two to five measurable objectives.");
    }
    if (lesson.estimatedMinutes < 30 || lesson.estimatedMinutes > 60) {
      issue(issues, "lesson-duration", path, "Lesson estimate must be from 30 to 60 minutes.");
    }
    if (lesson.prerequisites.some((lessonId) => !lessonById.has(lessonId) || lessonId === lesson.id)) {
      issue(issues, "lesson-prerequisite", path, "Lesson prerequisite is unresolved or self-referential.");
    }
    if (lesson.skillIds.length === 0 || lesson.skillIds.some((skillId) => !skillIds.has(skillId))) {
      issue(issues, "lesson-skill", path, "Lesson skill reference is empty or unresolved.");
    }
    if (lesson.sourceIds.length === 0 || lesson.sourceIds.some((sourceId) => !sourceIds.has(sourceId))) {
      issue(issues, "lesson-source", path, "Lesson source reference is empty or unresolved.");
    }
    lesson.sourceIds.forEach((sourceId) => referencedSourceIds.add(sourceId));
    if (lesson.mediaIds.some((mediaId) => !mediaIds.has(mediaId))) {
      issue(issues, "lesson-media", path, "Lesson media reference does not resolve.");
    }
    lesson.mediaIds.forEach((mediaId) => referencedMediaIds.add(mediaId));
    if (!isInternalRoute(lesson.laboratoryRoute)) {
      issue(issues, "lesson-application", path, "Lesson lacks an internal applied route.");
    }

    const requiredBlockKinds = [
      "prose",
      "definition",
      "interactive-visual",
      "misconception",
      "knowledge-check",
      "practice-set",
      "laboratory-callout",
      "summary",
      "source-note"
    ] as const;
    for (const kind of requiredBlockKinds) {
      if (!lesson.blocks.some((block) => block.kind === kind)) {
        issue(issues, "lesson-block", `${path}.blocks`, `Lesson is missing required ${kind} content.`);
      }
    }
    const proseWordCount = lesson.blocks
      .filter((block) => block.kind === "prose")
      .flatMap((block) => block.paragraphs)
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
    if (proseWordCount < 120) {
      issue(issues, "lesson-depth", path, `Native prose is too short at ${proseWordCount} words.`);
    }
    if (lesson.questions.length < 4 || lesson.questions.length > 7) {
      issue(issues, "lesson-practice-count", path, "Guided practice must contain four to seven questions.");
    }
    const practiceBlocks = lesson.blocks.filter((block) => block.kind === "practice-set");
    if (
      practiceBlocks.length !== 1
      || practiceBlocks[0].questionIds.length < 4
      || practiceBlocks[0].questionIds.length > 7
    ) {
      issue(issues, "lesson-practice-block", path, "Lesson practice block must reference four to seven questions.");
    }
    for (const question of lesson.questions) {
      if (questionById.has(question.id)) {
        issue(issues, "duplicate-question", `${path}.questions.${question.id}`, "Question ID is duplicated.");
      }
      questionById.set(question.id, question);
      validateQuestion(question, lesson, issues);
    }
    const localQuestionIds = new Set(lesson.questions.map((question) => question.id));
    for (const block of lesson.blocks) {
      if (
        (block.kind === "knowledge-check" || block.kind === "practice-set")
        && block.questionIds.some((questionId) => !localQuestionIds.has(questionId))
      ) {
        issue(issues, "lesson-question-reference", `${path}.blocks.${block.id}`, "Question block reference does not resolve locally.");
      }
      if (block.kind === "laboratory-callout" && !isInternalRoute(block.route)) {
        issue(issues, "lesson-callout-route", `${path}.blocks.${block.id}`, "Laboratory callout route is not internal.");
      }
      if (
        block.kind === "image"
        && (
          !safeAcademyImageSourcePattern.test(block.src)
          || !block.alt.trim()
          || !block.caption.trim()
          || !Number.isSafeInteger(block.width)
          || !Number.isSafeInteger(block.height)
          || block.width <= 0
          || block.height <= 0
        )
      ) {
        issue(
          issues,
          "lesson-image",
          `${path}.blocks.${block.id}`,
          "Lesson image requires a safe local asset path, meaningful alt and caption text, and positive integer dimensions."
        );
      }
    }

    if (lesson.formulae.length > 0) {
      const localFormulaIds = new Set(lesson.formulae.map((formula) => formula.id));
      const workedExamples = lesson.blocks.filter((block) => block.kind === "worked-example");
      if (workedExamples.length < 2 || !lesson.blocks.some((block) => block.kind === "derivation")) {
        issue(issues, "quantitative-contract", path, "Quantitative lesson requires a derivation and two worked examples.");
      }
      for (const formula of lesson.formulae) {
        if (formulaIds.has(formula.id)) {
          issue(issues, "duplicate-formula", `${path}.formulae.${formula.id}`, "Formula ID is duplicated.");
        }
        formulaIds.add(formula.id);
        if (
          !formula.latex.trim()
          || !formula.spoken.trim()
          || formula.variables.length === 0
          || formula.variables.some((variable) => !variable.symbol.trim() || !variable.meaning.trim() || !variable.siUnit.trim())
          || formula.assumptions.length === 0
          || formula.derivationSteps.length < 2
          || formula.derivationSteps.some(
            (instruction) => !instructionIsComplete(instruction)
          )
        ) {
          issue(issues, "formula-contract", `${path}.formulae.${formula.id}`, "Formula structure is incomplete.");
        }
      }
      for (const block of lesson.blocks) {
        if (
          (block.kind === "inline-math" || block.kind === "display-math" || block.kind === "derivation")
          && !localFormulaIds.has(block.formulaId)
        ) {
          issue(issues, "formula-block-reference", `${path}.blocks.${block.id}`, "Formula block reference does not resolve locally.");
        }
        if (
          block.kind === "worked-example"
          && block.example.governingFormulaId !== null
          && !localFormulaIds.has(block.example.governingFormulaId)
        ) {
          issue(issues, "example-formula-reference", `${path}.blocks.${block.id}`, "Worked example formula reference does not resolve locally.");
        }
        if (
          block.kind === "worked-example"
          && (
            !instructionIsComplete(block.example.problem)
            || block.example.steps.length < 3
            || block.example.steps.some(
              (instruction) => !instructionIsComplete(instruction)
            )
            || !instructionIsComplete(block.example.result)
            || !instructionIsComplete(block.example.dimensionalCheck)
            || !instructionIsComplete(block.example.independentCheck)
          )
        ) {
          issue(
            issues,
            "example-math-contract",
            `${path}.blocks.${block.id}`,
            "Worked example calculations require complete reviewed mathematics for the problem, steps, result and checks."
          );
        }
      }
    }

    const serialised = JSON.stringify(lesson);
    if (prohibitedContentPattern.test(serialised)) {
      issue(issues, "prohibited-content", path, "Lesson contains placeholder or outbound-only learning language.");
    }
    if (unicodeDashPattern.test(serialised)) {
      issue(issues, "unicode-dash", path, "Lesson contains a prohibited Unicode en dash or em dash.");
    }
  }

  for (const mediaId of mediaIds) {
    if (!referencedMediaIds.has(mediaId)) {
      issue(issues, "orphan-media", `media.${mediaId}`, "Media record is not referenced by a lesson.");
    }
  }
  for (const media of catalogue.media) {
    if (media.alternativeSourceId !== null) {
      referencedSourceIds.add(media.alternativeSourceId);
    }
  }
  for (const sourceId of sourceIds) {
    if (
      !referencedSourceIds.has(sourceId)
      && !catalogue.courses.some((course) => course.sourceIds.includes(sourceId))
    ) {
      issue(issues, "orphan-source", `sources.${sourceId}`, "Source record is not referenced by a lesson or course.");
    }
  }

  const orderedIds = catalogue.units.flatMap((unit) => unit.lessonIds);
  for (let index = 0; index < orderedIds.length; index += 1) {
    const lesson = lessonById.get(orderedIds[index]);
    if (!lesson) continue;
    const expectedPrevious = index === 0 ? null : orderedIds[index - 1];
    const expectedNext = index === orderedIds.length - 1 ? null : orderedIds[index + 1];
    if (lesson.previousLessonId !== expectedPrevious || lesson.nextLessonId !== expectedNext) {
      issue(issues, "lesson-navigation", `lessons.${lesson.id}`, "Previous or next lesson link does not match canonical order.");
    }
  }

  const assessmentIds = new Set(academyAssessmentsManifest.map((assessment) => assessment.id));
  for (const assessment of academyAssessmentsManifest) {
    if (assessment.questionIds.some((questionId) => !questionById.has(questionId))) {
      issue(issues, "assessment-question", `assessments.${assessment.id}`, "Assessment question reference does not resolve.");
    }
  }
  for (const mapping of catalogue.rebootMappings) {
    if (mapping.assessmentIds.some((assessmentId) => !assessmentIds.has(assessmentId))) {
      issue(issues, "session-assessment", `rebootMappings.${mapping.sessionId}`, "Session assessment does not resolve.");
    }
  }

  const formulaManifest = buildAcademyFormulaManifest(stageContents);
  if (
    formulaManifest.some((entry) =>
      entry.structuralStatus === "fail"
    )
  ) {
    issue(issues, "formula-manifest", "formulaManifest", "Formula manifest contains incomplete verification coverage.");
  }

  issues.push(...validateAcademyMediaPlacements(stageContents));

  const skillAssessmentManifest = buildAcademySkillAssessmentManifest(stageContents, catalogue);
  if (
    skillAssessmentManifest.length !== catalogue.skills.length
    || skillAssessmentManifest.some((entry) =>
      entry.practiceQuestionIds.length === 0
      || entry.quizIds.length === 0
      || entry.unitTestIds.length === 0
      || entry.courseChallengeIds.length === 0
      || entry.appliedRoutes.length === 0
    )
  ) {
    issue(issues, "skill-assessment-manifest", "skillAssessmentManifest", "Skill assessment coverage is incomplete.");
  }

  return issues;
};

export const loadAndValidateAcademyCurriculum = async (): Promise<{
  stages: AcademyStageContent[];
  issues: AcademyValidationIssue[];
}> => {
  const stages = await loadAllAcademyStages();
  return {
    stages,
    issues: validateAcademyCurriculum(stages)
  };
};
