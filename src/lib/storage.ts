import {
  mandatoryRebootProofSessionIds,
  masteryContentIdAliases
} from "../data/curriculumMetadata";
import type { MasteryEvidenceKind } from "./academy/mastery";
import type { AcademyQuestion, MasteryState } from "./academy/types";

export type Theme = "dark" | "light";
export type ThemePreference = "system" | Theme;
export type ExperienceLevel = "foundation" | "intermediate" | "advanced";
export type LearnerGoal = "foundations" | "role" | "refresh" | "project";
export type ProgressItemTypeV4 = "lab" | "pathway" | "project" | "tool" | "skill";
export type ProgressItemType =
  | ProgressItemTypeV4
  | "course"
  | "unit"
  | "lesson"
  | "review";
export type LearningStatus = "not-started" | "in-progress" | "done" | "skipped-diagnostic";
export type MasteryGateResult = "not-assessed" | "passed" | "study-required";

export interface SkillRating {
  level: number;
  evidence: string;
}

export interface ChallengeResult {
  passed: boolean;
  completedAt: string;
  notes?: string;
}

export interface LocalLearnerProfile {
  version: 1;
  displayName?: string;
  goal: LearnerGoal;
  disciplines: string[];
  experience: ExperienceLevel;
  weeklyEffortHours: number;
  recommendedPathwayId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PathwayProgress {
  status: "enrolled" | "completed";
  enrolledAt: string;
  lastStepId: string;
  completedStepIds: string[];
}

export interface LabPosition {
  stageId: string;
  visitedStageIds: string[];
  updatedAt: string;
}

export interface RecentItemV4 {
  id: string;
  type: ProgressItemTypeV4;
  title: string;
  route: string;
  visitedAt: string;
}

export interface RecentItem extends Omit<RecentItemV4, "type"> {
  type: ProgressItemType;
}

export interface ProjectProgress {
  status: "active" | "paused" | "completed";
  startedAt: string;
  updatedAt: string;
  completedMilestoneIds: string[];
  checkedEvidenceIds: string[];
  notes: string;
}

export interface ManualEvidence {
  id: string;
  title: string;
  description: string;
  url?: string;
  linkedSkills: string[];
  discipline: string;
  createdAt: string;
}

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface EngineeringWorkspaceRecord {
  schemaVersion: 1;
  projectId: string;
  bundleJson: string;
  updatedAt: string;
}

export interface LearningRecord {
  status: LearningStatus;
  blocker: string | null;
  confidence: number | null;
  actualMinutes: number;
  notes: string;
  evidenceReferences: string[];
  attemptCount: number;
  diagnosticScore: number | null;
  gateResult: MasteryGateResult;
  completedAt: string | null;
  contentVersion: string;
}

export interface WeeklyReviewRecord {
  weekKey: string;
  plannedBlocks: number;
  completedBlocks: number;
  evidenceCount: number;
  reflection: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressStateV4 {
  version: 4;
  skillRatings: Record<string, SkillRating>;
  challenges: Record<string, ChallengeResult>;
  reflections: Record<string, string>;
  artefacts: Record<string, boolean>;
  sprintChecklist: Record<string, boolean>;
  themePreference: ThemePreference;
  profile: LocalLearnerProfile | null;
  onboardingComplete: boolean;
  pathways: Record<string, PathwayProgress>;
  labPositions: Record<string, LabPosition>;
  bookmarks: Record<string, boolean>;
  recentItems: RecentItemV4[];
  projects: Record<string, ProjectProgress>;
  manualEvidence: ManualEvidence[];
  achievements: string[];
  accessibility: AccessibilityPreferences;
  engineeringWorkspaces: Record<string, EngineeringWorkspaceRecord>;
  curriculumRecords: Record<string, LearningRecord>;
  weeklyReviews: Record<string, WeeklyReviewRecord>;
  legacy: Record<string, unknown>;
}

export interface AcademyLessonRequirements {
  knowledgeChecksPassed: boolean;
  practiceCompleted: boolean;
  appliedEvidenceSatisfied: boolean;
}

export interface AcademyVideoPosition {
  positionSeconds: number;
  durationSeconds: number | null;
  updatedAt: string;
}

export interface AcademyLessonRecord {
  courseId: string;
  unitId: string;
  lessonId: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  lastBlockId: string | null;
  scrollPosition: number;
  videoPositions: Record<string, AcademyVideoPosition>;
  notes: string;
  bookmarked: boolean;
  requirements: AcademyLessonRequirements;
  completionEarned: boolean;
}

export type AcademyFeedbackState = "pending" | "shown";
export type AcademyRevealState = "hidden" | "revealed";

export interface AcademyAssessmentAttempt {
  attemptId: string;
  assessmentId: string;
  responseSummary: Record<string, string>;
  scorePercent: number;
  hintsUsed: string[];
  feedbackState: AcademyFeedbackState;
  revealState: AcademyRevealState;
  startedAt: string;
  submittedAt: string;
}

export interface AcademyQuestionAttemptRecord {
  attemptId: string;
  contextId: string;
  questionId: string;
  questionType: AcademyQuestion["type"];
  attemptedAt: string;
  responseSummary: string;
  isCorrect: boolean;
  scorePercent: number;
  misconceptionKeys: string[];
  variantSeed: number;
  retryIndex: number;
  hintsUsed: string[];
}

export type AcademyQuestionInteractionScenarioMode = "base" | "retry";

export interface AcademyQuestionInteractionRecord {
  questionId: string;
  contextId: string;
  scenarioMode: AcademyQuestionInteractionScenarioMode;
  retryIndex: 0 | 1;
  revealedHintIds: string[];
  revealedHintCount: number;
  solutionRevealed: boolean;
  retryOpened: boolean;
  lastAttemptScorePercent: number | null;
  lastAttemptIsCorrect: boolean | null;
  updatedAt: string;
}

interface UpdateAcademyQuestionInteractionBase {
  questionId: string;
  contextId: string;
  scenarioMode: AcademyQuestionInteractionScenarioMode;
  retryIndex: 0 | 1;
  timestamp: string;
}

export type UpdateAcademyQuestionInteractionInput =
  | (UpdateAcademyQuestionInteractionBase & {
      kind: "hint";
      hintId: string;
    })
  | (UpdateAcademyQuestionInteractionBase & {
      kind: "solution";
    })
  | (UpdateAcademyQuestionInteractionBase & {
      kind: "retry";
    })
  | (UpdateAcademyQuestionInteractionBase & {
      kind: "attempt";
      scorePercent: number;
      isCorrect: boolean;
      revealedHintIds: string[];
      solutionRevealed: boolean;
    });

export type AcademySkillEvidenceKind =
  | MasteryEvidenceKind
  | "assessment"
  | "lab"
  | "project"
  | "manual";

export interface AcademySkillEvidence {
  evidenceId: string;
  kind: AcademySkillEvidenceKind;
  referenceId: string;
  summary: string;
  recordedAt: string;
  scorePercent?: number;
  activityId?: string;
  passed?: boolean;
}

export interface AcademySkillTransition {
  from: MasteryState;
  to: MasteryState;
  reason: string;
  at: string;
}

export interface AcademySkillRecord {
  skillId: string;
  mastery: MasteryState;
  evidence: AcademySkillEvidence[];
  transitions: AcademySkillTransition[];
  historyTruncated: boolean;
  reviewDueAt: string | null;
  updatedAt: string;
}

export interface AcademyUnfinishedLabRecord {
  labId: string;
  courseId: string;
  unitId: string;
  lessonId: string | null;
  status: "in-progress" | "paused" | "blocked";
  lastStepId: string | null;
  blocker: string | null;
  notes: string;
  startedAt: string;
  updatedAt: string;
}

export interface AcademyRecommendationReceipt {
  receiptId: string;
  algorithmVersion: string;
  inputFingerprint: string;
  candidateIds: string[];
  recommendationIds: string[];
  reasonCodes: string[];
  generatedAt: string;
}

export interface AcademyReviewState {
  reviewId: string;
  targetType: "lesson" | "unit" | "skill";
  targetId: string;
  state: "scheduled" | "due" | "completed" | "snoozed";
  dueAt: string;
  lastReviewedAt: string | null;
  updatedAt: string;
}

export interface AcademyResumeCursor {
  courseId: string;
  unitId: string;
  lessonId: string;
  blockId: string;
  route: string;
  updatedAt: string;
}

export interface AcademyProgressState {
  lessonRecords: Record<string, AcademyLessonRecord>;
  assessmentAttempts: Record<string, AcademyAssessmentAttempt[]>;
  questionAttempts: Record<string, AcademyQuestionAttemptRecord[]>;
  questionInteractions: Record<string, AcademyQuestionInteractionRecord>;
  skillRecords: Record<string, AcademySkillRecord>;
  unfinishedLabs: Record<string, AcademyUnfinishedLabRecord>;
  recommendationReceipts: AcademyRecommendationReceipt[];
  reviewStates: Record<string, AcademyReviewState>;
  resumeCursor: AcademyResumeCursor | null;
}

export interface ProgressState extends Omit<ProgressStateV4, "version" | "recentItems"> {
  version: 5;
  recentItems: RecentItem[];
  academy: AcademyProgressState;
}

export interface ProgressStateV1 {
  version: 1;
  skillRatings?: Record<string, SkillRating>;
  challenges?: Record<string, ChallengeResult>;
  reflections?: Record<string, string>;
  artefacts?: Record<string, boolean>;
  sprintChecklist?: Record<string, boolean>;
  theme?: Theme;
  [key: string]: unknown;
}

type LegacyProgressFields = Omit<
  ProgressStateV4,
  "version" | "themePreference" | "engineeringWorkspaces" | "curriculumRecords" | "weeklyReviews"
>;

export interface ProgressStateV2 extends LegacyProgressFields {
  version: 2;
  theme: Theme;
}

export interface ProgressStateV3 extends LegacyProgressFields {
  version: 3;
  theme: Theme;
  engineeringWorkspaces: Record<string, EngineeringWorkspaceRecord>;
}

export const emptyAcademyProgress: AcademyProgressState = {
  lessonRecords: {},
  assessmentAttempts: {},
  questionAttempts: {},
  questionInteractions: {},
  skillRecords: {},
  unfinishedLabs: {},
  recommendationReceipts: [],
  reviewStates: {},
  resumeCursor: null
};

export const emptyProgress: ProgressState = {
  version: 5,
  skillRatings: {},
  challenges: {},
  reflections: {},
  artefacts: {},
  sprintChecklist: {},
  themePreference: "system",
  profile: null,
  onboardingComplete: false,
  pathways: {},
  labPositions: {},
  bookmarks: {},
  recentItems: [],
  projects: {},
  manualEvidence: [],
  achievements: [],
  accessibility: { reducedMotion: false, highContrast: false },
  engineeringWorkspaces: {},
  curriculumRecords: {},
  weeklyReviews: {},
  academy: structuredClone(emptyAcademyProgress),
  legacy: {}
};

export const KEY_V5 = "engineering-mastery-lab/progress/v5";
const KEY_V4 = "engineering-mastery-lab/progress/v4";
const KEY_V3 = "engineering-mastery-lab/progress/v3";
const KEY_V2 = "engineering-mastery-lab/progress/v2";
const KEY_V1 = "engineering-mastery-lab/progress/v1";

export const PROGRESS_IMPORT_LIMITS = {
  jsonCharacters: 1_000_000,
  entriesPerSection: 512,
  arrayEntries: 512,
  keyCharacters: 160,
  evidenceCharacters: 20_000,
  challengeNotesCharacters: 20_000,
  reflectionCharacters: 20_000,
  notesCharacters: 40_000,
  bundleCharacters: 750_000,
  shortTextCharacters: 240,
  urlCharacters: 2_000,
  legacyDepth: 8,
  academyLessons: 256,
  academyAssessmentHistories: 512,
  academyAttemptsPerAssessment: 20,
  academyQuestionHistories: 512,
  academyQuestionAttemptsPerQuestion: 20,
  academyQuestionInteractions: 512,
  academyRevealedHintsPerQuestion: 16,
  academyResponseSummaryEntries: 128,
  academyVideoPositionsPerLesson: 32,
  academySkills: 512,
  academySkillEvidence: 64,
  academySkillTransitions: 64,
  academyUnfinishedLabs: 128,
  academyRecommendationReceipts: 100,
  academyReviews: 512
} as const;

const V1_FIELDS = new Set([
  "version", "skillRatings", "challenges", "reflections", "artefacts", "sprintChecklist", "theme"
]);
const V2_FIELDS = new Set([
  ...V1_FIELDS,
  "profile", "onboardingComplete", "pathways", "labPositions", "bookmarks", "recentItems",
  "projects", "manualEvidence", "achievements", "accessibility", "legacy"
]);
const V3_FIELDS = new Set([...V2_FIELDS, "engineeringWorkspaces"]);
const V4_FIELDS = new Set([
  ...[...V3_FIELDS].filter((field) => field !== "theme"),
  "themePreference",
  "curriculumRecords",
  "weeklyReviews"
]);
const V5_FIELDS = new Set([...V4_FIELDS, "academy"]);

export type ProgressLoadSource = "v5" | "v4" | "v3" | "v2" | "v1" | "empty";

export interface ProgressLoadResult {
  progress: ProgressState;
  source: ProgressLoadSource;
  recoveryRequired: boolean;
  invalidCurrentBytes: string | null;
}

export function loadProgress(): ProgressState {
  return loadProgressWithStatus().progress;
}

export function loadProgressWithStatus(): ProgressLoadResult {
  const current = readStoredProgress(KEY_V5);
  if (current.status === "valid") {
    return {
      progress: current.progress,
      source: "v5",
      recoveryRequired: false,
      invalidCurrentBytes: null
    };
  }

  const historicalKeys = [
    ["v4", KEY_V4],
    ["v3", KEY_V3],
    ["v2", KEY_V2],
    ["v1", KEY_V1]
  ] as const;
  for (const [source, key] of historicalKeys) {
    const historical = readStoredProgress(key);
    if (historical.status === "valid") {
      return {
        progress: historical.progress,
        source,
        recoveryRequired: current.status === "invalid",
        invalidCurrentBytes: current.status === "invalid" ? current.raw : null
      };
    }
  }

  return {
    progress: structuredClone(emptyProgress),
    source: "empty",
    recoveryRequired: current.status === "invalid",
    invalidCurrentBytes: current.status === "invalid" ? current.raw : null
  };
}

type StoredProgressRead =
  | { status: "absent" | "unavailable" }
  | { status: "invalid"; raw: string | null }
  | { status: "valid"; progress: ProgressState };

function readStoredProgress(key: string): StoredProgressRead {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return { status: "absent" };
    if (value.length === 0 || value.length > PROGRESS_IMPORT_LIMITS.jsonCharacters) {
      return {
        status: "invalid",
        raw: value.length <= PROGRESS_IMPORT_LIMITS.jsonCharacters ? value : null
      };
    }
    try {
      return {
        status: "valid",
        progress: validateProgressState(JSON.parse(value))
      };
    } catch {
      return { status: "invalid", raw: value };
    }
  } catch {
    return { status: "unavailable" };
  }
}

export function saveProgress(state: ProgressState): boolean {
  try {
    const validated = validateProgressState(state);
    const json = JSON.stringify(validated);
    if (json.length > PROGRESS_IMPORT_LIMITS.jsonCharacters) return false;
    localStorage.setItem(KEY_V5, json);
    return true;
  } catch {
    return false;
  }
}

export function exportProgress(state: ProgressState): string {
  const json = JSON.stringify(validateProgressState(state), null, 2);
  if (json.length > PROGRESS_IMPORT_LIMITS.jsonCharacters) {
    throw new Error(`Progress file exceeds ${PROGRESS_IMPORT_LIMITS.jsonCharacters} characters`);
  }
  return json;
}

export function importProgress(json: string): ProgressState {
  if (json.length > PROGRESS_IMPORT_LIMITS.jsonCharacters) {
    throw new Error(`Progress file exceeds ${PROGRESS_IMPORT_LIMITS.jsonCharacters} characters`);
  }
  return validateProgressState(JSON.parse(json) as unknown);
}

export function migrateProgressV1(value: ProgressStateV1): ProgressState {
  const legacy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!V1_FIELDS.has(key)) {
      validateEntryKey(key, "legacy");
      legacy[key] = validateLegacyValue(item, `legacy.${key}`, 0);
    }
  }
  return {
    ...structuredClone(emptyProgress),
    onboardingComplete: true,
    skillRatings: validateSection(value.skillRatings, "skillRatings", validateSkillRating),
    challenges: validateSection(value.challenges, "challenges", validateChallenge),
    reflections: validateSection(value.reflections, "reflections", validateReflection),
    artefacts: validateSection(value.artefacts, "artefacts", validateBooleanItem),
    sprintChecklist: validateSection(value.sprintChecklist, "sprintChecklist", validateBooleanItem),
    themePreference: migrateLegacyTheme(value.theme),
    legacy
  };
}

export function migrateProgressV2(value: ProgressStateV2): ProgressState {
  assertOnlyFields(value as unknown as Record<string, unknown>, V2_FIELDS, "progress file");
  return upgradeProgressV4(
    validateLegacyProgressFieldsV4(value as unknown as Record<string, unknown>, true)
  );
}

export function migrateProgressV3(value: ProgressStateV3): ProgressState {
  assertOnlyFields(value as unknown as Record<string, unknown>, V3_FIELDS, "progress file");
  const migrated: ProgressStateV4 = {
    ...validateLegacyProgressFieldsV4(value as unknown as Record<string, unknown>),
    engineeringWorkspaces: validateSection(
      value.engineeringWorkspaces,
      "engineeringWorkspaces",
      validateEngineeringWorkspaceRecord
    )
  };
  return upgradeProgressV4(migrated);
}

export function migrateProgressV4(value: ProgressStateV4): ProgressState {
  return upgradeProgressV4(validateProgressStateV4(value));
}

export function validateProgressState(value: unknown): ProgressState {
  if (!isRecord(value)) throw new Error("Imported file is not a progress object");
  if (value.version === 1) return migrateProgressV1(value as ProgressStateV1);
  if (value.version === 2) return migrateProgressV2(value as unknown as ProgressStateV2);
  if (value.version === 3) return migrateProgressV3(value as unknown as ProgressStateV3);
  if (value.version === 4) return migrateProgressV4(value as unknown as ProgressStateV4);
  if (value.version !== 5) throw new Error("Unsupported progress file version");
  assertOnlyFields(value, V5_FIELDS, "progress file");
  assertRequiredFields(value, V5_FIELDS, "progress file");
  const common = validateCommonProgressFieldsV5(value);
  return {
    version: 5,
    skillRatings: common.skillRatings,
    challenges: common.challenges,
    reflections: common.reflections,
    artefacts: common.artefacts,
    sprintChecklist: common.sprintChecklist,
    themePreference: validateThemePreference(value.themePreference),
    profile: common.profile,
    onboardingComplete: common.onboardingComplete,
    pathways: common.pathways,
    labPositions: common.labPositions,
    bookmarks: common.bookmarks,
    recentItems: common.recentItems,
    projects: common.projects,
    manualEvidence: common.manualEvidence,
    achievements: common.achievements,
    accessibility: common.accessibility,
    engineeringWorkspaces: validateSection(
      value.engineeringWorkspaces,
      "engineeringWorkspaces",
      validateEngineeringWorkspaceRecord
    ),
    curriculumRecords: validateCurriculumRecords(value.curriculumRecords),
    weeklyReviews: validateSection(
      value.weeklyReviews,
      "weeklyReviews",
      validateWeeklyReviewRecord
    ),
    academy: validateAcademyProgress(value.academy),
    legacy: common.legacy
  };
}

export function validateProgressStateV4(value: unknown): ProgressStateV4 {
  if (!isRecord(value)) throw new Error("Imported file is not a progress object");
  if (value.version !== 4) throw new Error("Unsupported progress file version");
  assertOnlyFields(value, V4_FIELDS, "progress file");
  return assembleProgressStateV4(
    validateCommonProgressFieldsV4(value),
    validateThemePreference(value.themePreference),
    validateSection(
      value.engineeringWorkspaces,
      "engineeringWorkspaces",
      validateEngineeringWorkspaceRecord
    ),
    validateCurriculumRecords(value.curriculumRecords),
    validateSection(value.weeklyReviews, "weeklyReviews", validateWeeklyReviewRecord)
  );
}

function validateLegacyProgressFieldsV4(
  value: Record<string, unknown>,
  allowLegacyLabStageRoute = false
): ProgressStateV4 {
  return assembleProgressStateV4(
    validateCommonProgressFieldsV4(value, allowLegacyLabStageRoute),
    migrateLegacyTheme(value.theme),
    {},
    {},
    {}
  );
}

function assembleProgressStateV4(
  common: Omit<
    ProgressStateV4,
    "version" | "themePreference" | "engineeringWorkspaces" | "curriculumRecords" | "weeklyReviews"
  >,
  themePreference: ThemePreference,
  engineeringWorkspaces: Record<string, EngineeringWorkspaceRecord>,
  curriculumRecords: Record<string, LearningRecord>,
  weeklyReviews: Record<string, WeeklyReviewRecord>
): ProgressStateV4 {
  return {
    version: 4,
    skillRatings: common.skillRatings,
    challenges: common.challenges,
    reflections: common.reflections,
    artefacts: common.artefacts,
    sprintChecklist: common.sprintChecklist,
    themePreference,
    profile: common.profile,
    onboardingComplete: common.onboardingComplete,
    pathways: common.pathways,
    labPositions: common.labPositions,
    bookmarks: common.bookmarks,
    recentItems: common.recentItems,
    projects: common.projects,
    manualEvidence: common.manualEvidence,
    achievements: common.achievements,
    accessibility: common.accessibility,
    engineeringWorkspaces,
    curriculumRecords,
    weeklyReviews,
    legacy: common.legacy
  };
}

function upgradeProgressV4(value: ProgressStateV4): ProgressState {
  return {
    version: 5,
    skillRatings: value.skillRatings,
    challenges: value.challenges,
    reflections: value.reflections,
    artefacts: value.artefacts,
    sprintChecklist: value.sprintChecklist,
    themePreference: value.themePreference,
    profile: value.profile,
    onboardingComplete: value.onboardingComplete,
    pathways: value.pathways,
    labPositions: value.labPositions,
    bookmarks: value.bookmarks,
    recentItems: value.recentItems,
    projects: value.projects,
    manualEvidence: value.manualEvidence,
    achievements: value.achievements,
    accessibility: value.accessibility,
    engineeringWorkspaces: value.engineeringWorkspaces,
    curriculumRecords: value.curriculumRecords,
    weeklyReviews: value.weeklyReviews,
    academy: structuredClone(emptyAcademyProgress),
    legacy: value.legacy
  };
}

function validateCommonProgressFieldsV4(
  value: Record<string, unknown>,
  allowLegacyLabStageRoute = false
): Omit<
  ProgressStateV4,
  "version" | "themePreference" | "engineeringWorkspaces" | "curriculumRecords" | "weeklyReviews"
> {
  return {
    skillRatings: validateSection(value.skillRatings, "skillRatings", validateSkillRating),
    challenges: validateSection(value.challenges, "challenges", validateChallenge),
    reflections: validateSection(value.reflections, "reflections", validateReflection),
    artefacts: validateSection(value.artefacts, "artefacts", validateBooleanItem),
    sprintChecklist: validateSection(value.sprintChecklist, "sprintChecklist", validateBooleanItem),
    profile: validateProfile(value.profile),
    onboardingComplete: validateOptionalBoolean(value.onboardingComplete, "onboardingComplete"),
    pathways: validateSection(value.pathways, "pathways", validatePathwayProgress),
    labPositions: validateSection(value.labPositions, "labPositions", validateLabPosition),
    bookmarks: validateSection(value.bookmarks, "bookmarks", validateBooleanItem),
    recentItems: validateArray(value.recentItems, "recentItems", (item, path) =>
      validateRecentItemV4(item, path, allowLegacyLabStageRoute)
    ),
    projects: validateSection(value.projects, "projects", validateProjectProgress),
    manualEvidence: validateArray(value.manualEvidence, "manualEvidence", validateManualEvidence),
    achievements: validateArray(value.achievements, "achievements", (item, path) =>
      validateBoundedString(item, path, PROGRESS_IMPORT_LIMITS.shortTextCharacters)
    ),
    accessibility: validateAccessibility(value.accessibility),
    legacy: validateLegacyRecord(value.legacy, "legacy")
  };
}

function validateCommonProgressFieldsV5(
  value: Record<string, unknown>
): Omit<
  ProgressState,
  | "version"
  | "themePreference"
  | "engineeringWorkspaces"
  | "curriculumRecords"
  | "weeklyReviews"
  | "academy"
> {
  return {
    skillRatings: validateSection(value.skillRatings, "skillRatings", validateSkillRating),
    challenges: validateSection(value.challenges, "challenges", validateChallenge),
    reflections: validateSection(value.reflections, "reflections", validateReflection),
    artefacts: validateSection(value.artefacts, "artefacts", validateBooleanItem),
    sprintChecklist: validateSection(value.sprintChecklist, "sprintChecklist", validateBooleanItem),
    profile: validateProfile(value.profile),
    onboardingComplete: validateOptionalBoolean(value.onboardingComplete, "onboardingComplete"),
    pathways: validateSection(value.pathways, "pathways", validatePathwayProgress),
    labPositions: validateSection(value.labPositions, "labPositions", validateLabPosition),
    bookmarks: validateSection(value.bookmarks, "bookmarks", validateBooleanItem),
    recentItems: validateArray(value.recentItems, "recentItems", validateRecentItem),
    projects: validateSection(value.projects, "projects", validateProjectProgress),
    manualEvidence: validateArray(value.manualEvidence, "manualEvidence", validateManualEvidence),
    achievements: validateArray(value.achievements, "achievements", (item, path) =>
      validateBoundedString(item, path, PROGRESS_IMPORT_LIMITS.shortTextCharacters)
    ),
    accessibility: validateAccessibility(value.accessibility),
    legacy: validateLegacyRecord(value.legacy, "legacy")
  };
}

function migrateLegacyTheme(value: unknown): ThemePreference {
  if (value === undefined) return "system";
  if (value !== "light" && value !== "dark") throw new Error("theme must be either light or dark");
  return value;
}

function validateThemePreference(value: unknown): ThemePreference {
  if (value === undefined) return "system";
  if (value !== "system" && value !== "light" && value !== "dark") {
    throw new Error("themePreference must be system, light or dark");
  }
  return value;
}

function validateProfile(value: unknown): LocalLearnerProfile | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) throw new Error("profile must be an object or null");
  assertOnlyFields(value, new Set([
    "version", "displayName", "goal", "disciplines", "experience", "weeklyEffortHours",
    "recommendedPathwayId", "createdAt", "updatedAt"
  ]), "profile");
  if (value.version !== 1) throw new Error("Unsupported local profile version");
  if (!["foundations", "role", "refresh", "project"].includes(String(value.goal))) throw new Error("profile.goal is invalid");
  if (!["foundation", "intermediate", "advanced"].includes(String(value.experience))) throw new Error("profile.experience is invalid");
  if (typeof value.weeklyEffortHours !== "number" || !Number.isInteger(value.weeklyEffortHours) || value.weeklyEffortHours < 1 || value.weeklyEffortHours > 40) {
    throw new Error("profile.weeklyEffortHours must be an integer from 1 to 40");
  }
  const displayName = value.displayName === undefined ? undefined :
    validateBoundedString(value.displayName, "profile.displayName", 80);
  return {
    version: 1,
    ...(displayName ? { displayName } : {}),
    goal: value.goal as LearnerGoal,
    disciplines: validateStringArray(value.disciplines, "profile.disciplines"),
    experience: value.experience as ExperienceLevel,
    weeklyEffortHours: value.weeklyEffortHours,
    recommendedPathwayId: validateBoundedString(value.recommendedPathwayId, "profile.recommendedPathwayId", 80),
    createdAt: validateTimestamp(value.createdAt, "profile.createdAt"),
    updatedAt: validateTimestamp(value.updatedAt, "profile.updatedAt")
  };
}

function validatePathwayProgress(value: unknown, path: string): PathwayProgress {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set(["status", "enrolledAt", "lastStepId", "completedStepIds"]), path);
  if (value.status !== "enrolled" && value.status !== "completed") throw new Error(`${path}.status is invalid`);
  return {
    status: value.status,
    enrolledAt: validateTimestamp(value.enrolledAt, `${path}.enrolledAt`),
    lastStepId: validateBoundedString(value.lastStepId, `${path}.lastStepId`, 120),
    completedStepIds: validateStringArray(value.completedStepIds, `${path}.completedStepIds`)
  };
}

function validateLabPosition(value: unknown, path: string): LabPosition {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set(["stageId", "visitedStageIds", "updatedAt"]), path);
  return {
    stageId: validateBoundedString(value.stageId, `${path}.stageId`, 40),
    visitedStageIds: validateStringArray(value.visitedStageIds, `${path}.visitedStageIds`),
    updatedAt: validateTimestamp(value.updatedAt, `${path}.updatedAt`)
  };
}

function validateRecentItemV4(
  value: unknown,
  path: string,
  allowLegacyLabStageRoute = false
): RecentItemV4 {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set(["id", "type", "title", "route", "visitedAt"]), path);
  if (!["lab", "pathway", "project", "tool", "skill"].includes(String(value.type))) throw new Error(`${path}.type is invalid`);
  return {
    id: validateBoundedString(value.id, `${path}.id`, 120),
    type: value.type as ProgressItemTypeV4,
    title: validateBoundedString(value.title, `${path}.title`, PROGRESS_IMPORT_LIMITS.shortTextCharacters),
    route: validateRoute(
      value.route,
      `${path}.route`,
      allowLegacyLabStageRoute && value.type === "lab"
    ),
    visitedAt: validateTimestamp(value.visitedAt, `${path}.visitedAt`)
  };
}

function validateRecentItem(value: unknown, path: string): RecentItem {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set(["id", "type", "title", "route", "visitedAt"]), path);
  if (![
    "lab",
    "pathway",
    "project",
    "tool",
    "skill",
    "course",
    "unit",
    "lesson",
    "review"
  ].includes(String(value.type))) {
    throw new Error(`${path}.type is invalid`);
  }
  const type = value.type as ProgressItemType;
  const id = validateBoundedString(value.id, `${path}.id`, 120);
  const route = type === "course" || type === "unit" || type === "lesson" || type === "review"
    ? validateAcademyRecentRoute(value.route, type, id, `${path}.route`)
    : validateRoute(value.route, `${path}.route`);
  return {
    id,
    type,
    title: validateBoundedString(
      value.title,
      `${path}.title`,
      PROGRESS_IMPORT_LIMITS.shortTextCharacters
    ),
    route,
    visitedAt: validateTimestamp(value.visitedAt, `${path}.visitedAt`)
  };
}

function validateProjectProgress(value: unknown, path: string): ProjectProgress {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set([
    "status", "startedAt", "updatedAt", "completedMilestoneIds", "checkedEvidenceIds", "notes"
  ]), path);
  if (!["active", "paused", "completed"].includes(String(value.status))) throw new Error(`${path}.status is invalid`);
  return {
    status: value.status as ProjectProgress["status"],
    startedAt: validateTimestamp(value.startedAt, `${path}.startedAt`),
    updatedAt: validateTimestamp(value.updatedAt, `${path}.updatedAt`),
    completedMilestoneIds: validateStringArray(value.completedMilestoneIds, `${path}.completedMilestoneIds`),
    checkedEvidenceIds: validateStringArray(value.checkedEvidenceIds, `${path}.checkedEvidenceIds`),
    notes: validateBoundedString(value.notes, `${path}.notes`, PROGRESS_IMPORT_LIMITS.notesCharacters)
  };
}

function validateManualEvidence(value: unknown, path: string): ManualEvidence {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set(["id", "title", "description", "url", "linkedSkills", "discipline", "createdAt"]), path);
  const url = value.url === undefined ? undefined : validateUrl(value.url, `${path}.url`);
  return {
    id: validateBoundedString(value.id, `${path}.id`, 120),
    title: validateBoundedString(value.title, `${path}.title`, PROGRESS_IMPORT_LIMITS.shortTextCharacters),
    description: validateBoundedString(value.description, `${path}.description`, PROGRESS_IMPORT_LIMITS.evidenceCharacters),
    ...(url ? { url } : {}),
    linkedSkills: validateStringArray(value.linkedSkills, `${path}.linkedSkills`),
    discipline: validateBoundedString(value.discipline, `${path}.discipline`, 120),
    createdAt: validateTimestamp(value.createdAt, `${path}.createdAt`)
  };
}

function validateAccessibility(value: unknown): AccessibilityPreferences {
  if (value === undefined) return structuredClone(emptyProgress.accessibility);
  if (!isRecord(value)) throw new Error("accessibility must be an object");
  assertOnlyFields(value, new Set(["reducedMotion", "highContrast"]), "accessibility");
  return {
    reducedMotion: validateOptionalBoolean(value.reducedMotion, "accessibility.reducedMotion"),
    highContrast: validateOptionalBoolean(value.highContrast, "accessibility.highContrast")
  };
}

function validateEngineeringWorkspaceRecord(value: unknown, path: string): EngineeringWorkspaceRecord {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set(["schemaVersion", "projectId", "bundleJson", "updatedAt"]), path);
  if (value.schemaVersion !== 1) throw new Error(`${path}.schemaVersion is unsupported`);
  return {
    schemaVersion: 1,
    projectId: validateBoundedString(value.projectId, `${path}.projectId`, 120),
    bundleJson: validateBoundedString(
      value.bundleJson,
      `${path}.bundleJson`,
      PROGRESS_IMPORT_LIMITS.bundleCharacters
    ),
    updatedAt: validateTimestamp(value.updatedAt, `${path}.updatedAt`)
  };
}

function validateCurriculumRecords(value: unknown): Record<string, LearningRecord> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error("curriculumRecords must be an object");
  const keys = Object.keys(value);
  if (keys.length > PROGRESS_IMPORT_LIMITS.entriesPerSection) {
    throw new Error(`curriculumRecords exceeds ${PROGRESS_IMPORT_LIMITS.entriesPerSection} entries`);
  }
  const result: Record<string, LearningRecord> = {};
  for (const sourceId of keys) {
    validateEntryKey(sourceId, "curriculumRecords");
    const canonicalId = masteryContentIdAliases[sourceId] ?? sourceId;
    const record = validateLearningRecord(value[sourceId], `curriculumRecords.${sourceId}`);
    if (record.status === "skipped-diagnostic") {
      if (record.diagnosticScore === null || record.diagnosticScore < 3) {
        throw new Error(`curriculumRecords.${sourceId} cannot skip without diagnostic score 3 or 4`);
      }
      if (mandatoryRebootProofSessionIds.has(canonicalId)) {
        throw new Error(`curriculumRecords.${sourceId} cannot skip a mandatory proof session`);
      }
    }
    if (result[canonicalId] !== undefined && JSON.stringify(result[canonicalId]) !== JSON.stringify(record)) {
      throw new Error(`curriculumRecords has conflicting records for ${canonicalId}`);
    }
    Object.defineProperty(result, canonicalId, {
      configurable: true,
      enumerable: true,
      value: record,
      writable: true
    });
  }
  return result;
}

function validateLearningRecord(value: unknown, path: string): LearningRecord {
  if (!isRecord(value)) throw new Error(`${path} must be a learning record object`);
  assertOnlyFields(value, new Set([
    "status",
    "blocker",
    "confidence",
    "actualMinutes",
    "notes",
    "evidenceReferences",
    "attemptCount",
    "diagnosticScore",
    "gateResult",
    "completedAt",
    "contentVersion"
  ]), path);
  if (!["not-started", "in-progress", "done", "skipped-diagnostic"].includes(String(value.status))) {
    throw new Error(`${path}.status is invalid`);
  }
  if (
    typeof value.actualMinutes !== "number"
    || !Number.isInteger(value.actualMinutes)
    || value.actualMinutes < 0
    || value.actualMinutes > 100_000
  ) {
    throw new Error(`${path}.actualMinutes must be an integer from 0 to 100000`);
  }
  if (
    typeof value.attemptCount !== "number"
    || !Number.isInteger(value.attemptCount)
    || value.attemptCount < 0
    || value.attemptCount > 10_000
  ) {
    throw new Error(`${path}.attemptCount must be an integer from 0 to 10000`);
  }
  const confidence = validateNullableInteger(value.confidence, `${path}.confidence`, 1, 5);
  const diagnosticScore = validateNullableInteger(value.diagnosticScore, `${path}.diagnosticScore`, 0, 4);
  if (!["not-assessed", "passed", "study-required"].includes(String(value.gateResult))) {
    throw new Error(`${path}.gateResult is invalid`);
  }
  const completedAt = value.completedAt === null
    ? null
    : validateTimestamp(value.completedAt, `${path}.completedAt`);
  if ((value.status === "done" || value.status === "skipped-diagnostic") && completedAt === null) {
    throw new Error(`${path}.completedAt is required for a completed state`);
  }
  const contentVersion = validateBoundedString(
    value.contentVersion,
    `${path}.contentVersion`,
    PROGRESS_IMPORT_LIMITS.shortTextCharacters
  );
  if (contentVersion.trim() === "") throw new Error(`${path}.contentVersion is required`);
  return {
    status: value.status as LearningStatus,
    blocker: value.blocker === null
      ? null
      : validateBoundedString(value.blocker, `${path}.blocker`, PROGRESS_IMPORT_LIMITS.notesCharacters),
    confidence,
    actualMinutes: value.actualMinutes,
    notes: validateBoundedString(value.notes, `${path}.notes`, PROGRESS_IMPORT_LIMITS.notesCharacters),
    evidenceReferences: validateStringArray(value.evidenceReferences, `${path}.evidenceReferences`),
    attemptCount: value.attemptCount,
    diagnosticScore,
    gateResult: value.gateResult as MasteryGateResult,
    completedAt,
    contentVersion
  };
}

function validateWeeklyReviewRecord(value: unknown, path: string): WeeklyReviewRecord {
  if (!isRecord(value)) throw new Error(`${path} must be a weekly review object`);
  assertOnlyFields(value, new Set([
    "weekKey",
    "plannedBlocks",
    "completedBlocks",
    "evidenceCount",
    "reflection",
    "createdAt",
    "updatedAt"
  ]), path);
  const weekKey = validateBoundedString(value.weekKey, `${path}.weekKey`, 20);
  if (!/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(weekKey)) {
    throw new Error(`${path}.weekKey must use YYYY-Www`);
  }
  return {
    weekKey,
    plannedBlocks: validateBoundedInteger(value.plannedBlocks, `${path}.plannedBlocks`, 0, 100),
    completedBlocks: validateBoundedInteger(value.completedBlocks, `${path}.completedBlocks`, 0, 100),
    evidenceCount: validateBoundedInteger(value.evidenceCount, `${path}.evidenceCount`, 0, 100),
    reflection: validateBoundedString(
      value.reflection,
      `${path}.reflection`,
      PROGRESS_IMPORT_LIMITS.reflectionCharacters
    ),
    createdAt: validateTimestamp(value.createdAt, `${path}.createdAt`),
    updatedAt: validateTimestamp(value.updatedAt, `${path}.updatedAt`)
  };
}

const ACADEMY_REQUIRED_FIELDS = new Set([
  "lessonRecords",
  "assessmentAttempts",
  "skillRecords",
  "unfinishedLabs",
  "recommendationReceipts",
  "reviewStates",
  "resumeCursor"
]);
const ACADEMY_FIELDS = new Set([
  ...ACADEMY_REQUIRED_FIELDS,
  "questionAttempts",
  "questionInteractions"
]);
const ACADEMY_LESSON_FIELDS = new Set([
  "courseId",
  "unitId",
  "lessonId",
  "startedAt",
  "updatedAt",
  "completedAt",
  "lastBlockId",
  "scrollPosition",
  "videoPositions",
  "notes",
  "bookmarked",
  "requirements",
  "completionEarned"
]);
const ACADEMY_MASTERY_STATES: readonly MasteryState[] = [
  "not-started",
  "introduced",
  "practising",
  "proficient",
  "mastered",
  "review-due"
];
const ACADEMY_QUESTION_TYPES: readonly AcademyQuestion["type"][] = [
  "single-choice",
  "multiple-selection",
  "numeric",
  "ordering",
  "matching",
  "short-response",
  "diagram",
  "seeded-calculation",
  "code-analysis"
];
const ACADEMY_MASTERY_TRANSITIONS: Readonly<Record<MasteryState, readonly MasteryState[]>> = {
  "not-started": ["introduced"],
  introduced: ["introduced", "practising", "proficient"],
  practising: ["introduced", "practising", "proficient", "review-due"],
  proficient: ["introduced", "practising", "proficient", "mastered", "review-due"],
  mastered: ["introduced", "practising", "proficient", "mastered", "review-due"],
  "review-due": ["introduced", "practising", "proficient", "mastered", "review-due"]
};

export interface AcademyLessonIdentity {
  courseId: string;
  unitId: string;
  lessonId: string;
}

export interface StartAcademyLessonInput extends AcademyLessonIdentity {
  timestamp: string;
  blockId?: string;
}

export interface UpdateAcademyLessonInput extends AcademyLessonIdentity {
  timestamp: string;
  lastBlockId?: string | null;
  scrollPosition?: number;
  videoPosition?: {
    mediaId: string;
    positionSeconds: number;
    durationSeconds: number | null;
  };
  requirements?: Partial<AcademyLessonRequirements>;
}

export interface SetAcademyLessonNotesInput extends AcademyLessonIdentity {
  timestamp: string;
  notes: string;
}

export interface SetAcademyLessonBookmarkInput extends AcademyLessonIdentity {
  timestamp: string;
  bookmarked: boolean;
}

export interface SetAcademyResumeCursorInput extends AcademyLessonIdentity {
  timestamp: string;
  blockId: string;
}

export interface RecordAcademySkillEvidenceInput {
  skillId: string;
  evidence: AcademySkillEvidence;
  nextMastery: MasteryState;
  reason: string;
  reviewDueAt: string | null;
  timestamp: string;
}

export interface StartAcademyLabHandoffInput extends AcademyLessonIdentity {
  labId: string;
  blockId: string;
  timestamp: string;
}

export interface AcademyAppliedEvidenceReceipt {
  observedResult: string;
  criterionComparison: string;
  evidenceReference: string;
}

export interface RecordAcademyLabEvidenceInput extends AcademyLessonIdentity {
  labId: string;
  blockId: string;
  evidence: AcademyAppliedEvidenceReceipt;
  skillEvidencePlans: RecordAcademySkillEvidenceInput[];
  timestamp: string;
}

export function buildAcademyLessonRoute(
  courseId: string,
  unitId: string,
  lessonId: string
): string {
  const identity = validateAcademyLessonIdentity(
    { courseId, unitId, lessonId },
    "academy route"
  );
  return `${buildAcademyUnitRoute(identity.courseId, identity.unitId)}/lessons/${identity.lessonId}`;
}

export function buildAcademyCourseRoute(courseId: string): string {
  const canonicalCourseId = validateAcademyCourseId(courseId, "academy route.courseId");
  return `/learn/courses/${canonicalCourseId}`;
}

export function buildAcademyUnitRoute(courseId: string, unitId: string): string {
  const canonicalCourseId = validateAcademyCourseId(courseId, "academy route.courseId");
  const canonicalUnitId = validateAcademyUnitId(
    unitId,
    "academy route.unitId",
    canonicalCourseId
  );
  return `${buildAcademyCourseRoute(canonicalCourseId)}/units/${canonicalUnitId}`;
}

export function startAcademyLesson(
  state: ProgressState,
  input: StartAcademyLessonInput
): ProgressState {
  const identity = validateAcademyLessonIdentity(input, "startLesson");
  const timestamp = validateTimestamp(input.timestamp, "startLesson.timestamp");
  const blockId = input.blockId === undefined
    ? null
    : validateAcademyIdentifier(input.blockId, "startLesson.blockId");
  return transitionProgress(state, (next) => {
    const current = next.academy.lessonRecords[identity.lessonId];
    if (current) {
      assertMatchingLessonIdentity(current, identity, "startLesson");
      assertTimestampNotBefore(timestamp, current.updatedAt, "startLesson.timestamp");
      current.updatedAt = timestamp;
      if (blockId !== null) {
        current.lastBlockId = blockId;
        if (next.academy.resumeCursor?.lessonId === identity.lessonId) {
          next.academy.resumeCursor.blockId = blockId;
          next.academy.resumeCursor.updatedAt = timestamp;
        }
      }
      return;
    }
    Object.defineProperty(next.academy.lessonRecords, identity.lessonId, {
      configurable: true,
      enumerable: true,
      value: {
        ...identity,
        startedAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
        lastBlockId: blockId,
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
      } satisfies AcademyLessonRecord,
      writable: true
    });
  });
}

export function updateAcademyLesson(
  state: ProgressState,
  input: UpdateAcademyLessonInput
): ProgressState {
  const identity = validateAcademyLessonIdentity(input, "updateLesson");
  const timestamp = validateTimestamp(input.timestamp, "updateLesson.timestamp");
  return transitionProgress(state, (next) => {
    const lesson = next.academy.lessonRecords[identity.lessonId];
    if (!lesson) throw new Error(`updateLesson requires started lesson ${identity.lessonId}`);
    assertMatchingLessonIdentity(lesson, identity, "updateLesson");
    assertTimestampNotBefore(timestamp, lesson.updatedAt, "updateLesson.timestamp");
    if (Object.prototype.hasOwnProperty.call(input, "lastBlockId")) {
      lesson.lastBlockId = input.lastBlockId === null
        ? null
        : validateAcademyIdentifier(input.lastBlockId, "updateLesson.lastBlockId");
      if (next.academy.resumeCursor?.lessonId === identity.lessonId) {
        if (lesson.lastBlockId === null) {
          next.academy.resumeCursor = null;
        } else {
          next.academy.resumeCursor.blockId = lesson.lastBlockId;
          next.academy.resumeCursor.updatedAt = timestamp;
        }
      }
    }
    if (input.scrollPosition !== undefined) {
      lesson.scrollPosition = validateBoundedNumber(
        input.scrollPosition,
        "updateLesson.scrollPosition",
        0,
        1
      );
    }
    if (input.videoPosition !== undefined) {
      const mediaId = validateAcademyIdentifier(
        input.videoPosition.mediaId,
        "updateLesson.videoPosition.mediaId"
      );
      Object.defineProperty(lesson.videoPositions, mediaId, {
        configurable: true,
        enumerable: true,
        value: validateAcademyVideoPosition({
          positionSeconds: input.videoPosition.positionSeconds,
          durationSeconds: input.videoPosition.durationSeconds,
          updatedAt: timestamp
        }, `updateLesson.videoPosition.${mediaId}`),
        writable: true
      });
    }
    if (input.requirements !== undefined) {
      assertOnlyFields(
        input.requirements as Record<string, unknown>,
        new Set(["knowledgeChecksPassed", "practiceCompleted", "appliedEvidenceSatisfied"]),
        "updateLesson.requirements"
      );
      for (const field of [
        "knowledgeChecksPassed",
        "practiceCompleted",
        "appliedEvidenceSatisfied"
      ] as const) {
        const value = input.requirements[field];
        if (value === undefined) continue;
        if (typeof value !== "boolean") {
          throw new Error(`updateLesson.requirements.${field} must be a boolean`);
        }
        if (lesson.requirements[field] && !value) {
          throw new Error(`updateLesson.requirements.${field} cannot regress`);
        }
        lesson.requirements[field] = value;
      }
    }
    const earned = academyLessonRequirementsMet(lesson.requirements);
    if (!lesson.completionEarned && earned) {
      lesson.completionEarned = true;
      lesson.completedAt = timestamp;
    }
    lesson.updatedAt = timestamp;
  });
}

export function setAcademyLessonNotes(
  state: ProgressState,
  input: SetAcademyLessonNotesInput
): ProgressState {
  const started = startAcademyLesson(state, input);
  const notes = validateBoundedString(
    input.notes,
    "setLessonNotes.notes",
    PROGRESS_IMPORT_LIMITS.notesCharacters
  );
  return transitionProgress(started, (next) => {
    const lesson = next.academy.lessonRecords[input.lessonId];
    if (!lesson) throw new Error("setLessonNotes could not start the lesson");
    lesson.notes = notes;
    lesson.updatedAt = validateTimestamp(input.timestamp, "setLessonNotes.timestamp");
  });
}

export function setAcademyLessonBookmarked(
  state: ProgressState,
  input: SetAcademyLessonBookmarkInput
): ProgressState {
  const started = startAcademyLesson(state, input);
  if (typeof input.bookmarked !== "boolean") {
    throw new Error("setLessonBookmarked.bookmarked must be a boolean");
  }
  return transitionProgress(started, (next) => {
    const lesson = next.academy.lessonRecords[input.lessonId];
    if (!lesson) throw new Error("setLessonBookmarked could not start the lesson");
    lesson.bookmarked = input.bookmarked;
    lesson.updatedAt = validateTimestamp(input.timestamp, "setLessonBookmarked.timestamp");
  });
}

export function recordAcademyAssessmentAttempt(
  state: ProgressState,
  input: AcademyAssessmentAttempt
): ProgressState {
  const attempt = validateAcademyAssessmentAttempt(input, "recordAssessmentAttempt");
  return transitionProgress(state, (next) => {
    const existing = next.academy.assessmentAttempts[attempt.assessmentId] ?? [];
    const existingAttempt = existing.find(
      (item) => item.attemptId === attempt.attemptId
    );
    if (existingAttempt) {
      if (JSON.stringify(existingAttempt) === JSON.stringify(attempt)) return;
      throw new Error(
        `recordAssessmentAttempt conflicting attempt ${attempt.attemptId}`
      );
    }
    const previous = existing.at(-1);
    if (previous) {
      assertTimestampNotBefore(
        attempt.submittedAt,
        previous.submittedAt,
        "recordAssessmentAttempt.submittedAt"
      );
    }
    const bounded = [...existing, attempt].slice(
      -PROGRESS_IMPORT_LIMITS.academyAttemptsPerAssessment
    );
    Object.defineProperty(next.academy.assessmentAttempts, attempt.assessmentId, {
      configurable: true,
      enumerable: true,
      value: bounded,
      writable: true
    });
  });
}

export function recordAcademyQuestionAttempt(
  state: ProgressState,
  input: AcademyQuestionAttemptRecord
): ProgressState {
  const attempt = validateAcademyQuestionAttemptRecord(
    input,
    "recordQuestionAttempt"
  );
  return transitionProgress(state, (next) => {
    const existing = next.academy.questionAttempts[attempt.questionId] ?? [];
    const existingAttempt = existing.find(
      (item) => item.attemptId === attempt.attemptId
    );
    if (existingAttempt) {
      if (JSON.stringify(existingAttempt) === JSON.stringify(attempt)) return;
      throw new Error(
        `recordQuestionAttempt conflicting attempt ${attempt.attemptId}`
      );
    }
    const previous = existing.at(-1);
    if (previous) {
      assertTimestampNotBefore(
        attempt.attemptedAt,
        previous.attemptedAt,
        "recordQuestionAttempt.attemptedAt"
      );
    }
    Object.defineProperty(next.academy.questionAttempts, attempt.questionId, {
      configurable: true,
      enumerable: true,
      value: [...existing, attempt].slice(
        -PROGRESS_IMPORT_LIMITS.academyQuestionAttemptsPerQuestion
      ),
      writable: true
    });
  });
}

export function updateAcademyQuestionInteraction(
  state: ProgressState,
  input: UpdateAcademyQuestionInteractionInput
): ProgressState {
  const event = validateAcademyQuestionInteractionUpdate(
    input,
    "updateQuestionInteraction"
  );
  return transitionProgress(state, (next) => {
    const current = next.academy.questionInteractions[event.questionId];
    if (current) {
      if (
        current.contextId !== event.contextId
        || current.scenarioMode !== event.scenarioMode
        || current.retryIndex !== event.retryIndex
      ) {
        throw new Error(
          "updateQuestionInteraction conflicts with the existing question identity"
        );
      }
      assertTimestampNotBefore(
        event.timestamp,
        current.updatedAt,
        "updateQuestionInteraction.timestamp"
      );
    }

    const eventHintIds = event.kind === "hint"
      ? [event.hintId]
      : event.kind === "attempt"
        ? event.revealedHintIds
        : [];
    const revealedHintIds = mergeAcademyQuestionInteractionHintIds(
      current?.revealedHintIds ?? [],
      eventHintIds
    );
    const scorePercent = event.kind === "attempt"
      ? event.scorePercent
      : current?.lastAttemptScorePercent ?? null;
    const isCorrect = event.kind === "attempt"
      ? event.isCorrect
      : current?.lastAttemptIsCorrect ?? null;
    const record = validateAcademyQuestionInteractionRecord({
      questionId: event.questionId,
      contextId: event.contextId,
      scenarioMode: event.scenarioMode,
      retryIndex: event.retryIndex,
      revealedHintIds,
      revealedHintCount: revealedHintIds.length,
      solutionRevealed: (current?.solutionRevealed ?? false)
        || event.kind === "solution"
        || (event.kind === "attempt" && event.solutionRevealed),
      retryOpened: (current?.retryOpened ?? false) || event.kind === "retry",
      lastAttemptScorePercent: scorePercent,
      lastAttemptIsCorrect: isCorrect,
      updatedAt: event.timestamp
    }, `academy.questionInteractions.${event.questionId}`);

    Object.defineProperty(next.academy.questionInteractions, event.questionId, {
      configurable: true,
      enumerable: true,
      value: record,
      writable: true
    });
    next.academy.questionInteractions = boundAcademyQuestionInteractions(
      next.academy.questionInteractions
    );
  });
}

export function recordAcademyRecommendationReceipt(
  state: ProgressState,
  input: AcademyRecommendationReceipt
): ProgressState {
  const receipt = validateAcademyRecommendationReceipt(
    input,
    "recordRecommendationReceipt"
  );
  return transitionProgress(state, (next) => {
    const receipts = next.academy.recommendationReceipts;
    const existing = receipts.find((item) => item.receiptId === receipt.receiptId);
    if (existing) {
      if (JSON.stringify(existing) === JSON.stringify(receipt)) return;
      throw new Error(
        `recordRecommendationReceipt has conflicting receipt ID ${receipt.receiptId}`
      );
    }
    if (receipts.some(
      (item) =>
        item.algorithmVersion === receipt.algorithmVersion
        && item.inputFingerprint === receipt.inputFingerprint
    )) {
      throw new Error("recordRecommendationReceipt has conflicting deterministic input");
    }
    const previous = receipts.at(-1);
    if (previous) {
      assertTimestampNotBefore(
        receipt.generatedAt,
        previous.generatedAt,
        "recordRecommendationReceipt.generatedAt"
      );
    }
    next.academy.recommendationReceipts = [...receipts, receipt].slice(
      -PROGRESS_IMPORT_LIMITS.academyRecommendationReceipts
    );
  });
}

export function recordAcademySkillEvidence(
  state: ProgressState,
  input: RecordAcademySkillEvidenceInput
): ProgressState {
  const skillId = validateAcademyIdentifier(input.skillId, "recordSkillEvidence.skillId");
  const evidence = validateAcademySkillEvidence(
    input.evidence,
    "recordSkillEvidence.evidence"
  );
  const nextMastery = validateMasteryState(
    input.nextMastery,
    "recordSkillEvidence.nextMastery"
  );
  const reason = validateRequiredShortText(input.reason, "recordSkillEvidence.reason");
  const timestamp = validateTimestamp(input.timestamp, "recordSkillEvidence.timestamp");
  const reviewDueAt = input.reviewDueAt === null
    ? null
    : validateTimestamp(input.reviewDueAt, "recordSkillEvidence.reviewDueAt");
  assertTimestampNotBefore(timestamp, evidence.recordedAt, "recordSkillEvidence.timestamp");
  if (nextMastery === "review-due" && reviewDueAt === null) {
    throw new Error("recordSkillEvidence.reviewDueAt is required for review-due mastery");
  }
  return transitionProgress(state, (next) => {
    const current = next.academy.skillRecords[skillId];
    if (current) {
      assertTimestampNotBefore(timestamp, current.updatedAt, "recordSkillEvidence.timestamp");
      const existingEvidence = current.evidence.find(
        (item) => item.evidenceId === evidence.evidenceId
      );
      const lastTransition = current.transitions.at(-1);
      if (existingEvidence) {
        const isIdempotent = JSON.stringify(existingEvidence) === JSON.stringify(evidence)
          && current.mastery === nextMastery
          && current.reviewDueAt === reviewDueAt
          && lastTransition?.to === nextMastery
          && lastTransition.reason === reason
          && lastTransition.at === timestamp;
        if (isIdempotent) return;
        throw new Error(
          `recordSkillEvidence has conflicting evidence ID ${evidence.evidenceId}`
        );
      }
      if (!ACADEMY_MASTERY_TRANSITIONS[current.mastery].includes(nextMastery)) {
        throw new Error(
          `recordSkillEvidence cannot transition ${current.mastery} to ${nextMastery}`
        );
      }
      const nextEvidence = [...current.evidence, evidence];
      const nextTransitions = [...current.transitions, {
        from: current.mastery,
        to: nextMastery,
        reason,
        at: timestamp
      } satisfies AcademySkillTransition];
      current.historyTruncated = current.historyTruncated
        || nextEvidence.length > PROGRESS_IMPORT_LIMITS.academySkillEvidence
        || nextTransitions.length > PROGRESS_IMPORT_LIMITS.academySkillTransitions;
      current.evidence = nextEvidence.slice(-PROGRESS_IMPORT_LIMITS.academySkillEvidence);
      current.transitions = nextTransitions.slice(
        -PROGRESS_IMPORT_LIMITS.academySkillTransitions
      );
      current.mastery = nextMastery;
      current.reviewDueAt = reviewDueAt;
      current.updatedAt = timestamp;
      return;
    }
    if (!ACADEMY_MASTERY_TRANSITIONS["not-started"].includes(nextMastery)) {
      throw new Error(
        `recordSkillEvidence cannot transition not-started to ${nextMastery}`
      );
    }
    Object.defineProperty(next.academy.skillRecords, skillId, {
      configurable: true,
      enumerable: true,
      value: {
        skillId,
        mastery: nextMastery,
        evidence: [evidence],
        transitions: [{
          from: "not-started",
          to: nextMastery,
          reason,
          at: timestamp
        }],
        historyTruncated: false,
        reviewDueAt,
        updatedAt: timestamp
      } satisfies AcademySkillRecord,
      writable: true
    });
  });
}

export function startAcademyLabHandoff(
  state: ProgressState,
  input: StartAcademyLabHandoffInput
): ProgressState {
  const identity = validateAcademyLessonIdentity(input, "startLabHandoff");
  const labId = validateAcademyIdentifier(input.labId, "startLabHandoff.labId");
  const blockId = validateAcademyIdentifier(input.blockId, "startLabHandoff.blockId");
  const timestamp = validateTimestamp(input.timestamp, "startLabHandoff.timestamp");
  const started = startAcademyLesson(state, {
    ...identity,
    timestamp,
    blockId
  });
  return transitionProgress(started, (next) => {
    const current = next.academy.unfinishedLabs[labId];
    if (current) {
      if (
        current.courseId !== identity.courseId
        || current.unitId !== identity.unitId
        || current.lessonId !== identity.lessonId
        || current.lastStepId !== blockId
      ) {
        throw new Error(`startLabHandoff conflicts with unfinished laboratory ${labId}`);
      }
      assertTimestampNotBefore(timestamp, current.updatedAt, "startLabHandoff.timestamp");
      current.status = "in-progress";
      current.blocker = null;
      current.updatedAt = timestamp;
      return;
    }
    Object.defineProperty(next.academy.unfinishedLabs, labId, {
      configurable: true,
      enumerable: true,
      value: {
        labId,
        ...identity,
        status: "in-progress",
        lastStepId: blockId,
        blocker: null,
        notes: "",
        startedAt: timestamp,
        updatedAt: timestamp
      } satisfies AcademyUnfinishedLabRecord,
      writable: true
    });
  });
}

function normaliseAcademyEvidenceNarrative(
  value: unknown,
  path: string,
  label: string
): string {
  const text = validateBoundedString(
    value,
    path,
    PROGRESS_IMPORT_LIMITS.evidenceCharacters
  ).trim();
  const wordCount = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (text.length < 12 || wordCount < 3) {
    throw new Error(`${label} must contain at least 12 characters and three words.`);
  }
  const normalised = text
    .toLocaleLowerCase("en-AU")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (
    /^(?:the )?(?:activity|evidence|output|result|task|test) (?:has been |is |was )?(?:complete|completed|done|good|passed|passed successfully|recorded|successful)$/.test(normalised)
    || /^(?:everything|it) (?:passed|worked|works)(?: as expected)?$/.test(normalised)
    || /^no (?:errors|issues|problems) (?:found|observed|were found)$/.test(normalised)
  ) {
    throw new Error(
      `${label} must state a specific learner-observed value, state change or bounded finding.`
    );
  }
  return text;
}

export function normaliseAcademyAppliedEvidenceReceipt(
  value: unknown
): AcademyAppliedEvidenceReceipt {
  if (!isRecord(value)) {
    throw new Error(
      "Learner-attested local applied evidence must be a structured receipt."
    );
  }
  const fields = new Set([
    "observedResult",
    "criterionComparison",
    "evidenceReference"
  ]);
  assertOnlyFields(value, fields, "recordLabEvidence.evidence");
  assertRequiredFields(value, fields, "recordLabEvidence.evidence");
  const observedResult = normaliseAcademyEvidenceNarrative(
    value.observedResult,
    "recordLabEvidence.evidence.observedResult",
    "Observed result"
  );
  const criterionComparison = normaliseAcademyEvidenceNarrative(
    value.criterionComparison,
    "recordLabEvidence.evidence.criterionComparison",
    "Acceptance-criterion comparison"
  );
  const evidenceReference = validateBoundedString(
    value.evidenceReference,
    "recordLabEvidence.evidence.evidenceReference",
    PROGRESS_IMPORT_LIMITS.urlCharacters
  ).trim();
  if (
    evidenceReference.length < 4
    || !/[A-Za-z0-9]/.test(evidenceReference)
    || /^(?:done|none|n\/?a|complete|completed|recorded|yes|no)$/i.test(evidenceReference)
  ) {
    throw new Error(
      "Evidence reference must identify a saved record, screenshot, file, report or test ID."
    );
  }
  if (observedResult === criterionComparison) {
    throw new Error("Observed result and acceptance-criterion comparison must be distinct.");
  }
  return {
    observedResult,
    criterionComparison,
    evidenceReference
  };
}

export function formatAcademyAppliedEvidenceSummary(
  value: AcademyAppliedEvidenceReceipt
): string {
  const receipt = normaliseAcademyAppliedEvidenceReceipt(value);
  return [
    "Evidence status: learner-attested local record; not independently verified.",
    `Observed result: ${receipt.observedResult}`,
    `Acceptance-criterion comparison: ${receipt.criterionComparison}`,
    `Evidence reference: ${receipt.evidenceReference}`
  ].join("\n");
}

export function recordAcademyLabEvidence(
  state: ProgressState,
  input: RecordAcademyLabEvidenceInput
): ProgressState {
  const identity = validateAcademyLessonIdentity(input, "recordLabEvidence");
  const labId = validateAcademyIdentifier(input.labId, "recordLabEvidence.labId");
  const blockId = validateAcademyIdentifier(input.blockId, "recordLabEvidence.blockId");
  const timestamp = validateTimestamp(input.timestamp, "recordLabEvidence.timestamp");
  const evidenceReceipt = normaliseAcademyAppliedEvidenceReceipt(input.evidence);
  const evidenceSummary = formatAcademyAppliedEvidenceSummary(evidenceReceipt);
  const validatedState = validateProgressState(state);
  const unfinished = validatedState.academy.unfinishedLabs[labId];
  if (!unfinished) {
    throw new Error("recordLabEvidence requires an unfinished laboratory handoff.");
  }
  if (
    unfinished.courseId !== identity.courseId
    || unfinished.unitId !== identity.unitId
    || unfinished.lessonId !== identity.lessonId
    || unfinished.lastStepId !== blockId
  ) {
    throw new Error("recordLabEvidence does not match the unfinished laboratory context.");
  }
  assertTimestampNotBefore(timestamp, unfinished.updatedAt, "recordLabEvidence.timestamp");
  if (
    !Array.isArray(input.skillEvidencePlans)
    || input.skillEvidencePlans.length === 0
    || input.skillEvidencePlans.length > PROGRESS_IMPORT_LIMITS.academySkills
  ) {
    throw new Error("recordLabEvidence requires at least one bounded skill evidence plan.");
  }
  const planSkillIds = input.skillEvidencePlans.map((plan) => plan.skillId);
  const planEvidenceIds = input.skillEvidencePlans.map((plan) => plan.evidence.evidenceId);
  assertUnique(planSkillIds, "recordLabEvidence skill IDs");
  assertUnique(planEvidenceIds, "recordLabEvidence evidence IDs");

  let next = validatedState;
  for (const plan of input.skillEvidencePlans) {
    if (
      plan.timestamp !== timestamp
      || plan.evidence.kind !== "applied-evidence"
      || plan.evidence.referenceId !== blockId
      || plan.evidence.summary !== evidenceSummary
      || plan.evidence.recordedAt !== timestamp
      || plan.evidence.passed !== true
    ) {
      throw new Error(
        "recordLabEvidence skill plans must contain matching passed applied evidence."
      );
    }
    next = recordAcademySkillEvidence(next, plan);
  }
  next = updateAcademyLesson(next, {
    ...identity,
    timestamp,
    lastBlockId: blockId,
    requirements: { appliedEvidenceSatisfied: true }
  });
  return transitionProgress(next, (completed) => {
    const lesson = completed.academy.lessonRecords[identity.lessonId];
    const recordedEvidence = Object.values(completed.academy.skillRecords).some(
      (record) => record.evidence.some(
        (evidence) =>
          evidence.kind === "applied-evidence"
          && evidence.referenceId === blockId
          && evidence.summary === evidenceSummary
          && evidence.passed === true
      )
    );
    if (!lesson?.requirements.appliedEvidenceSatisfied || !recordedEvidence) {
      throw new Error("recordLabEvidence cannot clear the handoff before evidence is recorded.");
    }
    delete completed.academy.unfinishedLabs[labId];
  });
}

export function setAcademyResumeCursor(
  state: ProgressState,
  input: SetAcademyResumeCursorInput | null
): ProgressState {
  if (input === null) {
    return transitionProgress(state, (next) => {
      next.academy.resumeCursor = null;
    });
  }
  const identity = validateAcademyLessonIdentity(input, "setResumeCursor");
  const timestamp = validateTimestamp(input.timestamp, "setResumeCursor.timestamp");
  const blockId = validateAcademyIdentifier(input.blockId, "setResumeCursor.blockId");
  const started = startAcademyLesson(state, {
    ...identity,
    timestamp,
    blockId
  });
  return transitionProgress(started, (next) => {
    const lesson = next.academy.lessonRecords[identity.lessonId];
    if (!lesson) throw new Error("setResumeCursor could not start the lesson");
    lesson.lastBlockId = blockId;
    lesson.updatedAt = timestamp;
    next.academy.resumeCursor = {
      ...identity,
      blockId,
      route: buildAcademyLessonRoute(identity.courseId, identity.unitId, identity.lessonId),
      updatedAt: timestamp
    };
  });
}

export function setAcademyReviewState(
  state: ProgressState,
  input: AcademyReviewState
): ProgressState {
  const review = validateAcademyReviewState(input, "setReviewState");
  return transitionProgress(state, (next) => {
    const current = next.academy.reviewStates[review.reviewId];
    if (current) {
      assertTimestampNotBefore(review.updatedAt, current.updatedAt, "setReviewState.updatedAt");
      const allowed = ACADEMY_REVIEW_TRANSITIONS[current.state];
      if (review.state !== current.state && !allowed.includes(review.state)) {
        throw new Error(`setReviewState cannot transition ${current.state} to ${review.state}`);
      }
    }
    Object.defineProperty(next.academy.reviewStates, review.reviewId, {
      configurable: true,
      enumerable: true,
      value: review,
      writable: true
    });
  });
}

const ACADEMY_REVIEW_TRANSITIONS: Readonly<
  Record<AcademyReviewState["state"], readonly AcademyReviewState["state"][]>
> = {
  scheduled: ["due", "snoozed", "completed"],
  due: ["snoozed", "completed"],
  snoozed: ["scheduled", "due", "completed"],
  completed: ["scheduled"]
};

function transitionProgress(
  state: ProgressState,
  mutate: (next: ProgressState) => void
): ProgressState {
  const next = structuredClone(validateProgressState(state));
  mutate(next);
  return validateProgressState(next);
}

function validateAcademyProgress(value: unknown): AcademyProgressState {
  if (!isRecord(value)) throw new Error("academy must be an object");
  assertOnlyFields(value, ACADEMY_FIELDS, "academy");
  assertRequiredFields(value, ACADEMY_REQUIRED_FIELDS, "academy");

  const lessonRecords = validateBoundedSection(
    value.lessonRecords,
    "academy.lessonRecords",
    PROGRESS_IMPORT_LIMITS.academyLessons,
    validateAcademyLessonRecord
  );
  for (const [lessonId, record] of Object.entries(lessonRecords)) {
    if (record.lessonId !== lessonId) {
      throw new Error(`academy.lessonRecords.${lessonId}.lessonId must match its record key`);
    }
  }

  const assessmentAttempts = validateBoundedSection(
    value.assessmentAttempts,
    "academy.assessmentAttempts",
    PROGRESS_IMPORT_LIMITS.academyAssessmentHistories,
    validateAcademyAssessmentHistory
  );
  for (const [assessmentId, attempts] of Object.entries(assessmentAttempts)) {
    if (attempts.some((attempt) => attempt.assessmentId !== assessmentId)) {
      throw new Error(`academy.assessmentAttempts.${assessmentId} must match its record key`);
    }
  }

  const questionAttempts = value.questionAttempts === undefined
    ? {}
    : validateBoundedSection(
        value.questionAttempts,
        "academy.questionAttempts",
        PROGRESS_IMPORT_LIMITS.academyQuestionHistories,
        validateAcademyQuestionAttemptHistory
      );
  for (const [questionId, attempts] of Object.entries(questionAttempts)) {
    if (attempts.some((attempt) => attempt.questionId !== questionId)) {
      throw new Error(
        `academy.questionAttempts.${questionId} must match its record key`
      );
    }
  }

  const questionInteractions = value.questionInteractions === undefined
    ? {}
    : validateBoundedSection(
        value.questionInteractions,
        "academy.questionInteractions",
        PROGRESS_IMPORT_LIMITS.academyQuestionInteractions,
        validateAcademyQuestionInteractionRecord
      );
  for (const [questionId, interaction] of Object.entries(questionInteractions)) {
    if (interaction.questionId !== questionId) {
      throw new Error(
        `academy.questionInteractions.${questionId}.questionId must match its record key`
      );
    }
  }

  const skillRecords = validateBoundedSection(
    value.skillRecords,
    "academy.skillRecords",
    PROGRESS_IMPORT_LIMITS.academySkills,
    validateAcademySkillRecord
  );
  for (const [skillId, record] of Object.entries(skillRecords)) {
    if (record.skillId !== skillId) {
      throw new Error(`academy.skillRecords.${skillId}.skillId must match its record key`);
    }
  }

  const unfinishedLabs = validateBoundedSection(
    value.unfinishedLabs,
    "academy.unfinishedLabs",
    PROGRESS_IMPORT_LIMITS.academyUnfinishedLabs,
    validateAcademyUnfinishedLabRecord
  );
  for (const [labId, record] of Object.entries(unfinishedLabs)) {
    if (record.labId !== labId) {
      throw new Error(`academy.unfinishedLabs.${labId}.labId must match its record key`);
    }
  }

  const recommendationReceipts = validateBoundedArray(
    value.recommendationReceipts,
    "academy.recommendationReceipts",
    PROGRESS_IMPORT_LIMITS.academyRecommendationReceipts,
    validateAcademyRecommendationReceipt
  );
  assertUnique(
    recommendationReceipts.map((receipt) => receipt.receiptId),
    "academy.recommendationReceipts receiptId"
  );
  assertUnique(
    recommendationReceipts.map(
      (receipt) => `${receipt.algorithmVersion}:${receipt.inputFingerprint}`
    ),
    "academy.recommendationReceipts deterministic input"
  );
  for (let index = 1; index < recommendationReceipts.length; index += 1) {
    assertTimestampNotBefore(
      recommendationReceipts[index].generatedAt,
      recommendationReceipts[index - 1].generatedAt,
      `academy.recommendationReceipts[${index}].generatedAt`
    );
  }

  const reviewStates = validateBoundedSection(
    value.reviewStates,
    "academy.reviewStates",
    PROGRESS_IMPORT_LIMITS.academyReviews,
    validateAcademyReviewState
  );
  for (const [reviewId, record] of Object.entries(reviewStates)) {
    if (record.reviewId !== reviewId) {
      throw new Error(`academy.reviewStates.${reviewId}.reviewId must match its record key`);
    }
  }

  const resumeCursor = value.resumeCursor === null
    ? null
    : validateAcademyResumeCursor(value.resumeCursor, "academy.resumeCursor");
  if (resumeCursor) {
    const lesson = lessonRecords[resumeCursor.lessonId];
    if (!lesson) {
      throw new Error("academy.resumeCursor must reference a started lesson");
    }
    assertMatchingLessonIdentity(lesson, resumeCursor, "academy.resumeCursor");
    if (lesson.lastBlockId !== resumeCursor.blockId) {
      throw new Error("academy.resumeCursor.blockId must match the lesson lastBlockId");
    }
    assertTimestampNotBefore(
      lesson.updatedAt,
      resumeCursor.updatedAt,
      "academy.lessonRecords updatedAt"
    );
  }

  return {
    lessonRecords,
    assessmentAttempts,
    questionAttempts,
    questionInteractions,
    skillRecords,
    unfinishedLabs,
    recommendationReceipts,
    reviewStates,
    resumeCursor
  };
}

function validateAcademyLessonRecord(value: unknown, path: string): AcademyLessonRecord {
  if (!isRecord(value)) throw new Error(`${path} must be a lesson record object`);
  assertOnlyFields(value, ACADEMY_LESSON_FIELDS, path);
  assertRequiredFields(value, ACADEMY_LESSON_FIELDS, path);
  const identity = validateAcademyLessonIdentity(value, path);
  const startedAt = validateTimestamp(value.startedAt, `${path}.startedAt`);
  const updatedAt = validateTimestamp(value.updatedAt, `${path}.updatedAt`);
  assertTimestampNotBefore(updatedAt, startedAt, `${path}.updatedAt`);
  const completedAt = value.completedAt === null
    ? null
    : validateTimestamp(value.completedAt, `${path}.completedAt`);
  if (completedAt !== null) {
    assertTimestampNotBefore(completedAt, startedAt, `${path}.completedAt`);
    assertTimestampNotBefore(updatedAt, completedAt, `${path}.updatedAt`);
  }
  const requirements = validateAcademyLessonRequirements(
    value.requirements,
    `${path}.requirements`
  );
  const completionEarned = validateBooleanItem(
    value.completionEarned,
    `${path}.completionEarned`
  );
  if (completionEarned !== academyLessonRequirementsMet(requirements)) {
    throw new Error(`${path}.completionEarned must be derived from all completion requirements`);
  }
  if (completionEarned !== (completedAt !== null)) {
    throw new Error(`${path}.completedAt must exist exactly when completion is earned`);
  }
  const videoPositions = validateBoundedSection(
    value.videoPositions,
    `${path}.videoPositions`,
    PROGRESS_IMPORT_LIMITS.academyVideoPositionsPerLesson,
    validateAcademyVideoPosition
  );
  for (const [mediaId, position] of Object.entries(videoPositions)) {
    validateAcademyIdentifier(mediaId, `${path}.videoPositions mediaId`);
    assertTimestampNotBefore(position.updatedAt, startedAt, `${path}.videoPositions.${mediaId}.updatedAt`);
    assertTimestampNotBefore(updatedAt, position.updatedAt, `${path}.updatedAt`);
  }
  return {
    ...identity,
    startedAt,
    updatedAt,
    completedAt,
    lastBlockId: value.lastBlockId === null
      ? null
      : validateAcademyIdentifier(value.lastBlockId, `${path}.lastBlockId`),
    scrollPosition: validateBoundedNumber(value.scrollPosition, `${path}.scrollPosition`, 0, 1),
    videoPositions,
    notes: validateBoundedString(value.notes, `${path}.notes`, PROGRESS_IMPORT_LIMITS.notesCharacters),
    bookmarked: validateBooleanItem(value.bookmarked, `${path}.bookmarked`),
    requirements,
    completionEarned
  };
}

function validateAcademyLessonRequirements(
  value: unknown,
  path: string
): AcademyLessonRequirements {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  const fields = new Set([
    "knowledgeChecksPassed",
    "practiceCompleted",
    "appliedEvidenceSatisfied"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  return {
    knowledgeChecksPassed: validateBooleanItem(
      value.knowledgeChecksPassed,
      `${path}.knowledgeChecksPassed`
    ),
    practiceCompleted: validateBooleanItem(
      value.practiceCompleted,
      `${path}.practiceCompleted`
    ),
    appliedEvidenceSatisfied: validateBooleanItem(
      value.appliedEvidenceSatisfied,
      `${path}.appliedEvidenceSatisfied`
    )
  };
}

function academyLessonRequirementsMet(value: AcademyLessonRequirements): boolean {
  return value.knowledgeChecksPassed
    && value.practiceCompleted
    && value.appliedEvidenceSatisfied;
}

function validateAcademyVideoPosition(value: unknown, path: string): AcademyVideoPosition {
  if (!isRecord(value)) throw new Error(`${path} must be a video position object`);
  const fields = new Set(["positionSeconds", "durationSeconds", "updatedAt"]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  const positionSeconds = validateBoundedNumber(
    value.positionSeconds,
    `${path}.positionSeconds`,
    0,
    604_800
  );
  const durationSeconds = value.durationSeconds === null
    ? null
    : validateBoundedNumber(value.durationSeconds, `${path}.durationSeconds`, 0, 604_800);
  if (durationSeconds !== null && positionSeconds > durationSeconds) {
    throw new Error(`${path}.positionSeconds cannot exceed durationSeconds`);
  }
  return {
    positionSeconds,
    durationSeconds,
    updatedAt: validateTimestamp(value.updatedAt, `${path}.updatedAt`)
  };
}

function validateAcademyAssessmentHistory(
  value: unknown,
  path: string
): AcademyAssessmentAttempt[] {
  const attempts = validateBoundedArray(
    value,
    path,
    PROGRESS_IMPORT_LIMITS.academyAttemptsPerAssessment,
    validateAcademyAssessmentAttempt
  );
  assertUnique(attempts.map((attempt) => attempt.attemptId), `${path} attemptId`);
  for (let index = 1; index < attempts.length; index += 1) {
    assertTimestampNotBefore(
      attempts[index].submittedAt,
      attempts[index - 1].submittedAt,
      `${path}[${index}].submittedAt`
    );
  }
  return attempts;
}

function validateAcademyAssessmentAttempt(
  value: unknown,
  path: string
): AcademyAssessmentAttempt {
  if (!isRecord(value)) throw new Error(`${path} must be an assessment attempt object`);
  const fields = new Set([
    "attemptId",
    "assessmentId",
    "responseSummary",
    "scorePercent",
    "hintsUsed",
    "feedbackState",
    "revealState",
    "startedAt",
    "submittedAt"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  const responseSummary = validateBoundedSection(
    value.responseSummary,
    `${path}.responseSummary`,
    PROGRESS_IMPORT_LIMITS.academyResponseSummaryEntries,
    (item, itemPath) => validateBoundedString(item, itemPath, 2_000)
  );
  const hintsUsed = validateBoundedArray(
    value.hintsUsed,
    `${path}.hintsUsed`,
    PROGRESS_IMPORT_LIMITS.academySkillEvidence,
    (item, itemPath) => validateAcademyIdentifier(item, itemPath)
  );
  assertUnique(hintsUsed, `${path}.hintsUsed`);
  if (value.feedbackState !== "pending" && value.feedbackState !== "shown") {
    throw new Error(`${path}.feedbackState is invalid`);
  }
  if (value.revealState !== "hidden" && value.revealState !== "revealed") {
    throw new Error(`${path}.revealState is invalid`);
  }
  if (value.revealState === "revealed" && value.feedbackState !== "shown") {
    throw new Error(`${path}.revealState cannot be revealed before feedback is shown`);
  }
  const startedAt = validateTimestamp(value.startedAt, `${path}.startedAt`);
  const submittedAt = validateTimestamp(value.submittedAt, `${path}.submittedAt`);
  assertTimestampNotBefore(submittedAt, startedAt, `${path}.submittedAt`);
  const assessmentId = validateAcademyIdentifier(
    value.assessmentId,
    `${path}.assessmentId`
  );
  const v2AssessmentMatch = /^(EML-E[0-4]-D(?:0[1-9]|1[0-9]|2[0-5])-L0[1-7])-V2-ASSESSMENT$/u
    .exec(assessmentId);
  if (v2AssessmentMatch) {
    const responseQuestionIds = Object.keys(responseSummary);
    if (responseQuestionIds.length !== 1) {
      throw new Error(
        `${path}.responseSummary must contain one Academy V2 question response`
      );
    }
    const questionId = responseQuestionIds[0];
    if (
      !new RegExp(
        `^${escapeRegExp(v2AssessmentMatch[1])}-V2-Q[2-5]-(?:BASE|RETRY)$`,
        "u"
      ).test(questionId)
    ) {
      throw new Error(
        `${path}.responseSummary must match the canonical Academy V2 assessment`
      );
    }
    validateAcademyQuestionInteractionHintIds(
      questionId,
      hintsUsed,
      `${path}.hintsUsed`
    );
  }
  return {
    attemptId: validateAcademyIdentifier(value.attemptId, `${path}.attemptId`),
    assessmentId,
    responseSummary,
    scorePercent: validateBoundedNumber(value.scorePercent, `${path}.scorePercent`, 0, 100),
    hintsUsed,
    feedbackState: value.feedbackState,
    revealState: value.revealState,
    startedAt,
    submittedAt
  };
}

function validateAcademyQuestionAttemptHistory(
  value: unknown,
  path: string
): AcademyQuestionAttemptRecord[] {
  const attempts = validateBoundedArray(
    value,
    path,
    PROGRESS_IMPORT_LIMITS.academyQuestionAttemptsPerQuestion,
    validateAcademyQuestionAttemptRecord
  );
  assertUnique(attempts.map((attempt) => attempt.attemptId), `${path} attemptId`);
  for (let index = 1; index < attempts.length; index += 1) {
    assertTimestampNotBefore(
      attempts[index].attemptedAt,
      attempts[index - 1].attemptedAt,
      `${path}[${index}].attemptedAt`
    );
  }
  return attempts;
}

function validateAcademyQuestionAttemptRecord(
  value: unknown,
  path: string
): AcademyQuestionAttemptRecord {
  if (!isRecord(value)) {
    throw new Error(`${path} must be a question attempt object`);
  }
  const fields = new Set([
    "attemptId",
    "contextId",
    "questionId",
    "questionType",
    "attemptedAt",
    "responseSummary",
    "isCorrect",
    "scorePercent",
    "misconceptionKeys",
    "variantSeed",
    "retryIndex",
    "hintsUsed"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  if (!ACADEMY_QUESTION_TYPES.includes(value.questionType as AcademyQuestion["type"])) {
    throw new Error(`${path}.questionType is invalid`);
  }
  const responseSummary = validateBoundedString(
    value.responseSummary,
    `${path}.responseSummary`,
    2_000
  );
  if (responseSummary.trim() === "") {
    throw new Error(`${path}.responseSummary is required`);
  }
  const misconceptionKeys = validateBoundedArray(
    value.misconceptionKeys,
    `${path}.misconceptionKeys`,
    PROGRESS_IMPORT_LIMITS.academySkillEvidence,
    (item, itemPath) => validateRequiredShortText(item, itemPath)
  );
  const hintsUsed = validateBoundedArray(
    value.hintsUsed,
    `${path}.hintsUsed`,
    PROGRESS_IMPORT_LIMITS.academySkillEvidence,
    (item, itemPath) => validateAcademyIdentifier(item, itemPath)
  );
  assertUnique(misconceptionKeys, `${path}.misconceptionKeys`);
  assertUnique(hintsUsed, `${path}.hintsUsed`);
  const isCorrect = validateBooleanItem(value.isCorrect, `${path}.isCorrect`);
  const scorePercent = validateBoundedNumber(
    value.scorePercent,
    `${path}.scorePercent`,
    0,
    100
  );
  if (isCorrect !== (scorePercent === 100)) {
    throw new Error(
      `${path}.isCorrect must agree with whether scorePercent is 100`
    );
  }
  const contextId = validateAcademyIdentifier(value.contextId, `${path}.contextId`);
  const questionId = validateAcademyIdentifier(value.questionId, `${path}.questionId`);
  const retryIndex = validateBoundedInteger(
    value.retryIndex,
    `${path}.retryIndex`,
    0,
    20
  );
  if (questionId.includes("-V2-") || contextId.endsWith("-V2-ASSESSMENT")) {
    if (retryIndex !== 0 && retryIndex !== 1) {
      throw new Error(`${path}.retryIndex must be 0 or 1 for an Academy V2 question`);
    }
    validateAcademyQuestionInteractionIdentity(
      questionId,
      contextId,
      retryIndex === 1 ? "retry" : "base",
      path
    );
    validateAcademyQuestionInteractionHintIds(
      questionId,
      hintsUsed,
      `${path}.hintsUsed`
    );
  }
  return {
    attemptId: validateAcademyIdentifier(value.attemptId, `${path}.attemptId`),
    contextId,
    questionId,
    questionType: value.questionType as AcademyQuestion["type"],
    attemptedAt: validateTimestamp(value.attemptedAt, `${path}.attemptedAt`),
    responseSummary,
    isCorrect,
    scorePercent,
    misconceptionKeys,
    variantSeed: validateBoundedInteger(
      value.variantSeed,
      `${path}.variantSeed`,
      0,
      0xffff_ffff
    ),
    retryIndex,
    hintsUsed
  };
}

function validateAcademyQuestionInteractionRecord(
  value: unknown,
  path: string
): AcademyQuestionInteractionRecord {
  if (!isRecord(value)) {
    throw new Error(`${path} must be a question interaction object`);
  }
  const fields = new Set([
    "questionId",
    "contextId",
    "scenarioMode",
    "retryIndex",
    "revealedHintIds",
    "revealedHintCount",
    "solutionRevealed",
    "retryOpened",
    "lastAttemptScorePercent",
    "lastAttemptIsCorrect",
    "updatedAt"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);

  const scenarioMode = validateAcademyQuestionInteractionScenarioMode(
    value.scenarioMode,
    `${path}.scenarioMode`
  );
  const retryIndex = validateAcademyQuestionInteractionRetryIndex(
    value.retryIndex,
    scenarioMode,
    `${path}.retryIndex`
  );
  const questionId = validateAcademyIdentifier(
    value.questionId,
    `${path}.questionId`
  );
  const contextId = validateAcademyIdentifier(
    value.contextId,
    `${path}.contextId`
  );
  validateAcademyQuestionInteractionIdentity(
    questionId,
    contextId,
    scenarioMode,
    path
  );
  const revealedHintIds = validateBoundedArray(
    value.revealedHintIds,
    `${path}.revealedHintIds`,
    PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion,
    (item, itemPath) => validateAcademyIdentifier(item, itemPath)
  );
  assertUnique(revealedHintIds, `${path}.revealedHintIds`);
  validateAcademyQuestionInteractionHintIds(
    questionId,
    revealedHintIds,
    `${path}.revealedHintIds`
  );
  const revealedHintCount = validateBoundedInteger(
    value.revealedHintCount,
    `${path}.revealedHintCount`,
    0,
    PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion
  );
  if (revealedHintCount !== revealedHintIds.length) {
    throw new Error(`${path}.revealedHintCount must match revealedHintIds`);
  }

  const solutionRevealed = validateBooleanItem(
    value.solutionRevealed,
    `${path}.solutionRevealed`
  );
  const retryOpened = validateBooleanItem(
    value.retryOpened,
    `${path}.retryOpened`
  );
  if (scenarioMode === "base" && retryOpened) {
    throw new Error(`${path}.retryOpened can only be true for a retry scenario`);
  }

  const lastAttemptScorePercent = value.lastAttemptScorePercent === null
    ? null
    : validateBoundedNumber(
        value.lastAttemptScorePercent,
        `${path}.lastAttemptScorePercent`,
        0,
        100
      );
  const lastAttemptIsCorrect = value.lastAttemptIsCorrect === null
    ? null
    : validateBooleanItem(
        value.lastAttemptIsCorrect,
        `${path}.lastAttemptIsCorrect`
      );
  if ((lastAttemptScorePercent === null) !== (lastAttemptIsCorrect === null)) {
    throw new Error(
      `${path}.lastAttemptScorePercent and lastAttemptIsCorrect must both be available or null`
    );
  }
  if (
    lastAttemptScorePercent !== null
    && lastAttemptIsCorrect !== (lastAttemptScorePercent === 100)
  ) {
    throw new Error(
      `${path}.lastAttemptIsCorrect must agree with whether lastAttemptScorePercent is 100`
    );
  }

  return {
    questionId,
    contextId,
    scenarioMode,
    retryIndex,
    revealedHintIds,
    revealedHintCount,
    solutionRevealed,
    retryOpened,
    lastAttemptScorePercent,
    lastAttemptIsCorrect,
    updatedAt: validateTimestamp(value.updatedAt, `${path}.updatedAt`)
  };
}

function validateAcademyQuestionInteractionUpdate(
  value: unknown,
  path: string
): UpdateAcademyQuestionInteractionInput {
  if (!isRecord(value)) {
    throw new Error(`${path} must be a question interaction event`);
  }
  const baseFields = [
    "kind",
    "questionId",
    "contextId",
    "scenarioMode",
    "retryIndex",
    "timestamp"
  ];
  if (
    value.kind !== "hint"
    && value.kind !== "solution"
    && value.kind !== "retry"
    && value.kind !== "attempt"
  ) {
    throw new Error(`${path}.kind is invalid`);
  }
  const kind = value.kind as UpdateAcademyQuestionInteractionInput["kind"];
  const fields = new Set([
    ...baseFields,
    ...(kind === "hint"
      ? ["hintId"]
      : kind === "attempt"
        ? ["scorePercent", "isCorrect", "revealedHintIds", "solutionRevealed"]
        : [])
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);

  const scenarioMode = validateAcademyQuestionInteractionScenarioMode(
    value.scenarioMode,
    `${path}.scenarioMode`
  );
  const retryIndex = validateAcademyQuestionInteractionRetryIndex(
    value.retryIndex,
    scenarioMode,
    `${path}.retryIndex`
  );
  if (kind === "retry" && scenarioMode !== "retry") {
    throw new Error(`${path}.kind retry requires a retry scenario`);
  }
  const questionId = validateAcademyIdentifier(
    value.questionId,
    `${path}.questionId`
  );
  const contextId = validateAcademyIdentifier(
    value.contextId,
    `${path}.contextId`
  );
  validateAcademyQuestionInteractionIdentity(
    questionId,
    contextId,
    scenarioMode,
    path
  );
  const common = {
    questionId,
    contextId,
    scenarioMode,
    retryIndex,
    timestamp: validateTimestamp(value.timestamp, `${path}.timestamp`)
  };

  if (kind === "hint") {
    const hintId = validateAcademyIdentifier(value.hintId, `${path}.hintId`);
    validateAcademyQuestionInteractionHintIds(
      questionId,
      [hintId],
      `${path}.hintId`
    );
    return {
      ...common,
      kind,
      hintId
    };
  }
  if (kind === "attempt") {
    const scorePercent = validateBoundedNumber(
      value.scorePercent,
      `${path}.scorePercent`,
      0,
      100
    );
    const isCorrect = validateBooleanItem(value.isCorrect, `${path}.isCorrect`);
    if (isCorrect !== (scorePercent === 100)) {
      throw new Error(
        `${path}.isCorrect must agree with whether scorePercent is 100`
      );
    }
    const revealedHintIds = validateBoundedArray(
      value.revealedHintIds,
      `${path}.revealedHintIds`,
      PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion,
      (item, itemPath) => validateAcademyIdentifier(item, itemPath)
    );
    assertUnique(revealedHintIds, `${path}.revealedHintIds`);
    validateAcademyQuestionInteractionHintIds(
      questionId,
      revealedHintIds,
      `${path}.revealedHintIds`
    );
    return {
      ...common,
      kind,
      scorePercent,
      isCorrect,
      revealedHintIds,
      solutionRevealed: validateBooleanItem(
        value.solutionRevealed,
        `${path}.solutionRevealed`
      )
    };
  }
  return {
    ...common,
    kind
  };
}

function validateAcademyQuestionInteractionScenarioMode(
  value: unknown,
  path: string
): AcademyQuestionInteractionScenarioMode {
  if (value !== "base" && value !== "retry") {
    throw new Error(`${path} must be base or retry`);
  }
  return value;
}

function validateAcademyQuestionInteractionIdentity(
  questionId: string,
  contextId: string,
  scenarioMode: AcademyQuestionInteractionScenarioMode,
  path: string
): void {
  const match = /^(EML-(E[0-4])-D(?:0[1-9]|1[0-9]|2[0-5])-L0[1-7])-V2-Q[2-5]-(BASE|RETRY)$/u
    .exec(questionId);
  if (!match) {
    throw new Error(
      `${path}.questionId must be a canonical Academy V2 question identifier`
    );
  }
  const lessonId = match[1];
  const expectedScenario = match[3]?.toLocaleLowerCase("en-AU");
  if (expectedScenario !== scenarioMode) {
    throw new Error(
      `${path}.questionId scenario must match scenarioMode`
    );
  }
  const expectedContextId = `${lessonId}-V2-ASSESSMENT`;
  if (contextId !== expectedContextId) {
    throw new Error(
      `${path}.contextId must match the canonical V2 assessment identifier`
    );
  }
}

function validateAcademyQuestionInteractionHintIds(
  questionId: string,
  hintIds: readonly string[],
  path: string
): void {
  const escapedQuestionId = escapeRegExp(questionId);
  const hintPattern = new RegExp(`^${escapedQuestionId}-H(?:[1-9]|1[0-6])$`);
  if (hintIds.some((hintId) => !hintPattern.test(hintId))) {
    throw new Error(`${path} must contain canonical hint ids for the question`);
  }
}

function validateAcademyQuestionInteractionRetryIndex(
  value: unknown,
  scenarioMode: AcademyQuestionInteractionScenarioMode,
  path: string
): 0 | 1 {
  const retryIndex = validateBoundedInteger(value, path, 0, 1);
  const expected = scenarioMode === "retry" ? 1 : 0;
  if (retryIndex !== expected) {
    throw new Error(`${path} must be ${expected} for ${scenarioMode} scenario`);
  }
  return retryIndex as 0 | 1;
}

function mergeAcademyQuestionInteractionHintIds(
  current: readonly string[],
  incoming: readonly string[]
): string[] {
  return [...new Set([...current, ...incoming])]
    .sort(compareCanonicalIdentifiers)
    .slice(0, PROGRESS_IMPORT_LIMITS.academyRevealedHintsPerQuestion);
}

function boundAcademyQuestionInteractions(
  records: Record<string, AcademyQuestionInteractionRecord>
): Record<string, AcademyQuestionInteractionRecord> {
  const entries = Object.entries(records);
  if (entries.length <= PROGRESS_IMPORT_LIMITS.academyQuestionInteractions) {
    return records;
  }
  const retained = entries
    .sort((left, right) => {
      const timestampDifference = Date.parse(left[1].updatedAt)
        - Date.parse(right[1].updatedAt);
      return timestampDifference === 0
        ? compareCanonicalIdentifiers(left[0], right[0])
        : timestampDifference;
    })
    .slice(-PROGRESS_IMPORT_LIMITS.academyQuestionInteractions);
  const bounded: Record<string, AcademyQuestionInteractionRecord> = {};
  for (const [questionId, record] of retained) {
    Object.defineProperty(bounded, questionId, {
      configurable: true,
      enumerable: true,
      value: record,
      writable: true
    });
  }
  return bounded;
}

function compareCanonicalIdentifiers(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function validateAcademySkillRecord(value: unknown, path: string): AcademySkillRecord {
  if (!isRecord(value)) throw new Error(`${path} must be a skill record object`);
  const fields = new Set([
    "skillId",
    "mastery",
    "evidence",
    "transitions",
    "historyTruncated",
    "reviewDueAt",
    "updatedAt"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  const skillId = validateAcademyIdentifier(value.skillId, `${path}.skillId`);
  const mastery = validateMasteryState(value.mastery, `${path}.mastery`);
  const evidence = validateBoundedArray(
    value.evidence,
    `${path}.evidence`,
    PROGRESS_IMPORT_LIMITS.academySkillEvidence,
    validateAcademySkillEvidence
  );
  assertUnique(evidence.map((item) => item.evidenceId), `${path}.evidence evidenceId`);
  const transitions = validateBoundedArray(
    value.transitions,
    `${path}.transitions`,
    PROGRESS_IMPORT_LIMITS.academySkillTransitions,
    validateAcademySkillTransition
  );
  const historyTruncated = validateBooleanItem(
    value.historyTruncated,
    `${path}.historyTruncated`
  );
  if (transitions.length === 0 && mastery !== "not-started") {
    throw new Error(`${path}.mastery requires a transition history`);
  }
  if (transitions.length > 0) {
    if (!historyTruncated && transitions[0].from !== "not-started") {
      throw new Error(`${path}.transitions must start at not-started`);
    }
    for (let index = 0; index < transitions.length; index += 1) {
      const transition = transitions[index];
      if (!ACADEMY_MASTERY_TRANSITIONS[transition.from].includes(transition.to)) {
        throw new Error(`${path}.transitions[${index}] is not an allowed mastery transition`);
      }
      if (index > 0) {
        if (transition.from !== transitions[index - 1].to) {
          throw new Error(`${path}.transitions[${index}] does not continue the prior state`);
        }
        assertTimestampNotBefore(
          transition.at,
          transitions[index - 1].at,
          `${path}.transitions[${index}].at`
        );
      }
    }
    if (transitions.at(-1)?.to !== mastery) {
      throw new Error(`${path}.mastery must equal the latest transition`);
    }
  }
  if ((mastery === "proficient" || mastery === "mastered") && evidence.length === 0) {
    throw new Error(`${path}.mastery requires evidence`);
  }
  const updatedAt = validateTimestamp(value.updatedAt, `${path}.updatedAt`);
  for (let index = 0; index < evidence.length; index += 1) {
    if (index > 0) {
      assertTimestampNotBefore(
        evidence[index].recordedAt,
        evidence[index - 1].recordedAt,
        `${path}.evidence[${index}].recordedAt`
      );
    }
    assertTimestampNotBefore(
      updatedAt,
      evidence[index].recordedAt,
      `${path}.updatedAt`
    );
  }
  const lastTransition = transitions.at(-1);
  if (lastTransition) {
    assertTimestampNotBefore(updatedAt, lastTransition.at, `${path}.updatedAt`);
  }
  const reviewDueAt = value.reviewDueAt === null
    ? null
    : validateTimestamp(value.reviewDueAt, `${path}.reviewDueAt`);
  if (mastery === "review-due" && reviewDueAt === null) {
    throw new Error(`${path}.reviewDueAt is required when mastery is review-due`);
  }
  return {
    skillId,
    mastery,
    evidence,
    transitions,
    historyTruncated,
    reviewDueAt,
    updatedAt
  };
}

function validateAcademySkillEvidence(value: unknown, path: string): AcademySkillEvidence {
  if (!isRecord(value)) throw new Error(`${path} must be a skill evidence object`);
  const fields = new Set([
    "evidenceId",
    "kind",
    "referenceId",
    "summary",
    "recordedAt",
    "scorePercent",
    "activityId",
    "passed"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(
    value,
    new Set(["evidenceId", "kind", "referenceId", "summary", "recordedAt"]),
    path
  );
  const masteryKinds: readonly MasteryEvidenceKind[] = [
    "instructional",
    "knowledge-check",
    "guided-practice",
    "scored-activity",
    "delayed-review",
    "applied-evidence"
  ];
  const legacyKinds = ["assessment", "lab", "project", "manual"] as const;
  if (
    !masteryKinds.includes(value.kind as MasteryEvidenceKind)
    && !legacyKinds.includes(value.kind as typeof legacyKinds[number])
  ) {
    throw new Error(`${path}.kind is invalid`);
  }
  const kind = value.kind as AcademySkillEvidenceKind;
  const scoreRequired = kind === "guided-practice"
    || kind === "scored-activity"
    || kind === "delayed-review";
  if (scoreRequired && value.scorePercent === undefined) {
    throw new Error(`${path}.scorePercent is required for ${kind}`);
  }
  if (
    value.scorePercent !== undefined
    && (kind === "lab" || kind === "project" || kind === "manual")
  ) {
    throw new Error(`${path}.scorePercent is not valid for legacy ${kind} evidence`);
  }
  const scorePercent = value.scorePercent === undefined
    ? undefined
    : validateBoundedNumber(value.scorePercent, `${path}.scorePercent`, 0, 100);
  if (kind === "scored-activity" && value.activityId === undefined) {
    throw new Error(`${path}.activityId is required for scored-activity`);
  }
  if (kind !== "scored-activity" && value.activityId !== undefined) {
    throw new Error(`${path}.activityId is only valid for scored-activity`);
  }
  const activityId = value.activityId === undefined
    ? undefined
    : validateAcademyIdentifier(value.activityId, `${path}.activityId`);
  if (kind === "applied-evidence" && value.passed === undefined) {
    throw new Error(`${path}.passed is required for applied-evidence`);
  }
  if (kind !== "applied-evidence" && value.passed !== undefined) {
    throw new Error(`${path}.passed is only valid for applied-evidence`);
  }
  const passed = value.passed === undefined
    ? undefined
    : validateBooleanItem(value.passed, `${path}.passed`);
  return {
    evidenceId: validateAcademyIdentifier(value.evidenceId, `${path}.evidenceId`),
    kind,
    referenceId: validateAcademyIdentifier(value.referenceId, `${path}.referenceId`),
    summary: validateBoundedString(
      value.summary,
      `${path}.summary`,
      PROGRESS_IMPORT_LIMITS.evidenceCharacters
    ),
    recordedAt: validateTimestamp(value.recordedAt, `${path}.recordedAt`),
    ...(scorePercent !== undefined ? { scorePercent } : {}),
    ...(activityId !== undefined ? { activityId } : {}),
    ...(passed !== undefined ? { passed } : {})
  };
}

function validateAcademySkillTransition(
  value: unknown,
  path: string
): AcademySkillTransition {
  if (!isRecord(value)) throw new Error(`${path} must be a skill transition object`);
  const fields = new Set(["from", "to", "reason", "at"]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  return {
    from: validateMasteryState(value.from, `${path}.from`),
    to: validateMasteryState(value.to, `${path}.to`),
    reason: validateBoundedString(
      value.reason,
      `${path}.reason`,
      PROGRESS_IMPORT_LIMITS.shortTextCharacters
    ),
    at: validateTimestamp(value.at, `${path}.at`)
  };
}

function validateAcademyUnfinishedLabRecord(
  value: unknown,
  path: string
): AcademyUnfinishedLabRecord {
  if (!isRecord(value)) throw new Error(`${path} must be an unfinished lab object`);
  const fields = new Set([
    "labId",
    "courseId",
    "unitId",
    "lessonId",
    "status",
    "lastStepId",
    "blocker",
    "notes",
    "startedAt",
    "updatedAt"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  const courseId = validateAcademyCourseId(value.courseId, `${path}.courseId`);
  const unitId = validateAcademyUnitId(value.unitId, `${path}.unitId`, courseId);
  const lessonId = value.lessonId === null
    ? null
    : validateAcademyLessonId(value.lessonId, `${path}.lessonId`, unitId);
  if (!["in-progress", "paused", "blocked"].includes(String(value.status))) {
    throw new Error(`${path}.status is invalid`);
  }
  const blocker = value.blocker === null
    ? null
    : validateBoundedString(value.blocker, `${path}.blocker`, PROGRESS_IMPORT_LIMITS.notesCharacters);
  if (value.status === "blocked" && (blocker === null || blocker.trim() === "")) {
    throw new Error(`${path}.blocker is required for a blocked lab`);
  }
  if (value.status !== "blocked" && blocker !== null) {
    throw new Error(`${path}.blocker is only valid for a blocked lab`);
  }
  const startedAt = validateTimestamp(value.startedAt, `${path}.startedAt`);
  const updatedAt = validateTimestamp(value.updatedAt, `${path}.updatedAt`);
  assertTimestampNotBefore(updatedAt, startedAt, `${path}.updatedAt`);
  return {
    labId: validateAcademyIdentifier(value.labId, `${path}.labId`),
    courseId,
    unitId,
    lessonId,
    status: value.status as AcademyUnfinishedLabRecord["status"],
    lastStepId: value.lastStepId === null
      ? null
      : validateAcademyIdentifier(value.lastStepId, `${path}.lastStepId`),
    blocker,
    notes: validateBoundedString(value.notes, `${path}.notes`, PROGRESS_IMPORT_LIMITS.notesCharacters),
    startedAt,
    updatedAt
  };
}

function validateAcademyRecommendationReceipt(
  value: unknown,
  path: string
): AcademyRecommendationReceipt {
  if (!isRecord(value)) throw new Error(`${path} must be a recommendation receipt object`);
  const fields = new Set([
    "receiptId",
    "algorithmVersion",
    "inputFingerprint",
    "candidateIds",
    "recommendationIds",
    "reasonCodes",
    "generatedAt"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  const candidateIds = validateBoundedArray(
    value.candidateIds,
    `${path}.candidateIds`,
    PROGRESS_IMPORT_LIMITS.academyLessons,
    (item, itemPath) => validateAcademyIdentifier(item, itemPath)
  );
  const recommendationIds = validateBoundedArray(
    value.recommendationIds,
    `${path}.recommendationIds`,
    PROGRESS_IMPORT_LIMITS.academyLessons,
    (item, itemPath) => validateAcademyIdentifier(item, itemPath)
  );
  const reasonCodes = validateBoundedArray(
    value.reasonCodes,
    `${path}.reasonCodes`,
    PROGRESS_IMPORT_LIMITS.academySkillEvidence,
    (item, itemPath) => validateAcademyIdentifier(item, itemPath)
  );
  assertUnique(candidateIds, `${path}.candidateIds`);
  assertUnique(recommendationIds, `${path}.recommendationIds`);
  assertUnique(reasonCodes, `${path}.reasonCodes`);
  if (recommendationIds.length === 0) {
    throw new Error(`${path}.recommendationIds must not be empty`);
  }
  const candidates = new Set(candidateIds);
  if (recommendationIds.some((id) => !candidates.has(id))) {
    throw new Error(`${path}.recommendationIds must be selected from candidateIds`);
  }
  return {
    receiptId: validateAcademyIdentifier(value.receiptId, `${path}.receiptId`),
    algorithmVersion: validateRequiredShortText(
      value.algorithmVersion,
      `${path}.algorithmVersion`
    ),
    inputFingerprint: validateRequiredShortText(
      value.inputFingerprint,
      `${path}.inputFingerprint`
    ),
    candidateIds,
    recommendationIds,
    reasonCodes,
    generatedAt: validateTimestamp(value.generatedAt, `${path}.generatedAt`)
  };
}

function validateAcademyReviewState(value: unknown, path: string): AcademyReviewState {
  if (!isRecord(value)) throw new Error(`${path} must be a review state object`);
  const fields = new Set([
    "reviewId",
    "targetType",
    "targetId",
    "state",
    "dueAt",
    "lastReviewedAt",
    "updatedAt"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  if (!["lesson", "unit", "skill"].includes(String(value.targetType))) {
    throw new Error(`${path}.targetType is invalid`);
  }
  if (!["scheduled", "due", "completed", "snoozed"].includes(String(value.state))) {
    throw new Error(`${path}.state is invalid`);
  }
  const updatedAt = validateTimestamp(value.updatedAt, `${path}.updatedAt`);
  const lastReviewedAt = value.lastReviewedAt === null
    ? null
    : validateTimestamp(value.lastReviewedAt, `${path}.lastReviewedAt`);
  if (lastReviewedAt !== null) {
    assertTimestampNotBefore(updatedAt, lastReviewedAt, `${path}.updatedAt`);
  }
  if (value.state === "completed" && lastReviewedAt === null) {
    throw new Error(`${path}.lastReviewedAt is required for a completed review`);
  }
  const targetId = validateAcademyIdentifier(value.targetId, `${path}.targetId`);
  if (
    value.targetType === "lesson"
    && !/^EML-E[0-4]-D(?:0[1-9]|1\d|2[0-5])-L0[1-7]$/.test(targetId)
  ) {
    throw new Error(`${path}.targetId must be a canonical lesson ID`);
  }
  if (
    value.targetType === "unit"
    && !/^EML-E[0-4]-D(?:0[1-9]|1\d|2[0-5])$/.test(targetId)
  ) {
    throw new Error(`${path}.targetId must be a canonical unit ID`);
  }
  return {
    reviewId: validateAcademyIdentifier(value.reviewId, `${path}.reviewId`),
    targetType: value.targetType as AcademyReviewState["targetType"],
    targetId,
    state: value.state as AcademyReviewState["state"],
    dueAt: validateTimestamp(value.dueAt, `${path}.dueAt`),
    lastReviewedAt,
    updatedAt
  };
}

function validateAcademyResumeCursor(value: unknown, path: string): AcademyResumeCursor {
  if (!isRecord(value)) throw new Error(`${path} must be a resume cursor object`);
  const fields = new Set([
    "courseId",
    "unitId",
    "lessonId",
    "blockId",
    "route",
    "updatedAt"
  ]);
  assertOnlyFields(value, fields, path);
  assertRequiredFields(value, fields, path);
  const identity = validateAcademyLessonIdentity(value, path);
  const expectedRoute = buildAcademyLessonRoute(
    identity.courseId,
    identity.unitId,
    identity.lessonId
  );
  const route = validateRoute(value.route, `${path}.route`);
  if (route !== expectedRoute) {
    throw new Error(`${path}.route must be rebuilt from its academy IDs`);
  }
  return {
    ...identity,
    blockId: validateAcademyIdentifier(value.blockId, `${path}.blockId`),
    route,
    updatedAt: validateTimestamp(value.updatedAt, `${path}.updatedAt`)
  };
}

function validateAcademyLessonIdentity(
  value: object,
  path: string
): AcademyLessonIdentity {
  const source = value as {
    courseId?: unknown;
    unitId?: unknown;
    lessonId?: unknown;
  };
  const courseId = validateAcademyCourseId(source.courseId, `${path}.courseId`);
  const unitId = validateAcademyUnitId(source.unitId, `${path}.unitId`, courseId);
  const lessonId = validateAcademyLessonId(source.lessonId, `${path}.lessonId`, unitId);
  return { courseId, unitId, lessonId };
}

function validateAcademyCourseId(value: unknown, path: string): string {
  const id = validateAcademyIdentifier(value, path);
  if (!/^ACADEMY-E[0-4]$/.test(id)) {
    throw new Error(`${path} must use ACADEMY-E0 through ACADEMY-E4`);
  }
  return id;
}

function validateAcademyUnitId(value: unknown, path: string, courseId: string): string {
  const id = validateAcademyIdentifier(value, path);
  const match = /^EML-E([0-4])-D(?:0[1-9]|1\d|2[0-5])$/.exec(id);
  if (!match) throw new Error(`${path} must use EML-E{stage}-D01 through D25`);
  if (courseId !== `ACADEMY-E${match[1]}`) {
    throw new Error(`${path} stage must match courseId`);
  }
  return id;
}

function validateAcademyLessonId(value: unknown, path: string, unitId: string): string {
  const id = validateAcademyIdentifier(value, path);
  if (!new RegExp(`^${escapeRegExp(unitId)}-L0[1-7]$`).test(id)) {
    throw new Error(`${path} must use {unitId}-L01 through L07`);
  }
  return id;
}

function validateAcademyIdentifier(value: unknown, path: string): string {
  const id = validateBoundedString(value, path, 120);
  validateEntryKey(id, path);
  if (!/^[A-Za-z0-9][A-Za-z0-9._~-]*$/.test(id) || id === "." || id === "..") {
    throw new Error(`${path} must be a canonical identifier`);
  }
  return id;
}

function validateAcademyRecentRoute(
  value: unknown,
  type: "course" | "unit" | "lesson" | "review",
  itemId: string,
  path: string
): string {
  const route = validateRoute(value, path);
  if (type === "course") {
    const match = /^\/learn\/courses\/([^/]+)$/.exec(route);
    if (!match) throw new Error(`${path} must be a canonical academy course route`);
    const courseId = validateAcademyCourseId(match[1], `${path}.courseId`);
    if (courseId !== itemId) throw new Error(`${path} must match the recent course ID`);
    return route;
  }
  if (type === "unit") {
    const match = /^\/learn\/courses\/([^/]+)\/units\/([^/]+)$/.exec(route);
    if (!match) throw new Error(`${path} must be a canonical academy unit route`);
    const courseId = validateAcademyCourseId(match[1], `${path}.courseId`);
    const unitId = validateAcademyUnitId(match[2], `${path}.unitId`, courseId);
    if (unitId !== itemId) throw new Error(`${path} must match the recent unit ID`);
    return route;
  }
  if (type === "lesson") {
    const match = /^\/learn\/courses\/([^/]+)\/units\/([^/]+)\/lessons\/([^/]+)$/.exec(route);
    if (!match) throw new Error(`${path} must be a canonical academy lesson route`);
    const expected = buildAcademyLessonRoute(match[1], match[2], match[3]);
    if (route !== expected || match[3] !== itemId) {
      throw new Error(`${path} must match the recent lesson ID`);
    }
    return route;
  }
  const match = /^\/learn\/reviews\/([^/]+)$/.exec(route);
  if (!match || validateAcademyIdentifier(match[1], `${path}.reviewId`) !== itemId) {
    throw new Error(`${path} must be a canonical academy review route`);
  }
  return route;
}

function validateMasteryState(value: unknown, path: string): MasteryState {
  if (!ACADEMY_MASTERY_STATES.includes(value as MasteryState)) {
    throw new Error(`${path} is invalid`);
  }
  return value as MasteryState;
}

function assertMatchingLessonIdentity(
  lesson: AcademyLessonRecord,
  identity: AcademyLessonIdentity,
  path: string
): void {
  if (
    lesson.courseId !== identity.courseId
    || lesson.unitId !== identity.unitId
    || lesson.lessonId !== identity.lessonId
  ) {
    throw new Error(`${path} conflicts with the existing lesson identity`);
  }
}

function assertTimestampNotBefore(value: string, floor: string, path: string): void {
  if (Date.parse(value) < Date.parse(floor)) {
    throw new Error(`${path} cannot be earlier than ${floor}`);
  }
}

function validateBoundedNumber(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number
): number {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < minimum
    || value > maximum
  ) {
    throw new Error(`${path} must be a finite number from ${minimum} to ${maximum}`);
  }
  return value;
}

function validateRequiredShortText(value: unknown, path: string): string {
  const text = validateBoundedString(
    value,
    path,
    PROGRESS_IMPORT_LIMITS.shortTextCharacters
  );
  if (text.trim() === "") throw new Error(`${path} is required`);
  return text;
}

function assertUnique(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${path} contains duplicates`);
  }
}

function assertRequiredFields(
  value: Record<string, unknown>,
  required: ReadonlySet<string>,
  path: string
): void {
  for (const field of required) {
    if (!Object.prototype.hasOwnProperty.call(value, field)) {
      throw new Error(`${path} is missing required field ${field}`);
    }
  }
}

function validateBoundedSection<T>(
  value: unknown,
  section: string,
  maximum: number,
  validator: (item: unknown, path: string) => T
): Record<string, T> {
  if (!isRecord(value)) throw new Error(`${section} must be an object`);
  const keys = Object.keys(value);
  if (keys.length > maximum) throw new Error(`${section} exceeds ${maximum} entries`);
  const result: Record<string, T> = {};
  for (const key of keys) {
    validateEntryKey(key, section);
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value: validator(value[key], `${section}.${key}`),
      writable: true
    });
  }
  return result;
}

function validateBoundedArray<T>(
  value: unknown,
  path: string,
  maximum: number,
  validator: (item: unknown, itemPath: string) => T
): T[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  if (value.length > maximum) throw new Error(`${path} exceeds ${maximum} entries`);
  return value.map((item, index) => validator(item, `${path}[${index}]`));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateNullableInteger(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number
): number | null {
  if (value === null) return null;
  return validateBoundedInteger(value, path, minimum, maximum);
}

function validateBoundedInteger(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${path} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function validateSection<T>(value: unknown, section: string, validator: (item: unknown, path: string) => T): Record<string, T> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`${section} must be an object`);
  const keys = Object.keys(value);
  if (keys.length > PROGRESS_IMPORT_LIMITS.entriesPerSection) throw new Error(`${section} exceeds ${PROGRESS_IMPORT_LIMITS.entriesPerSection} entries`);
  const result: Record<string, T> = {};
  for (const key of keys) {
    validateEntryKey(key, section);
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value: validator(value[key], `${section}.${key}`),
      writable: true
    });
  }
  return result;
}

function validateArray<T>(value: unknown, path: string, validator: (item: unknown, itemPath: string) => T): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  if (value.length > PROGRESS_IMPORT_LIMITS.arrayEntries) throw new Error(`${path} exceeds ${PROGRESS_IMPORT_LIMITS.arrayEntries} entries`);
  return value.map((item, index) => validator(item, `${path}[${index}]`));
}

function validateStringArray(value: unknown, path: string): string[] {
  return validateArray(value, path, (item, itemPath) =>
    validateBoundedString(item, itemPath, PROGRESS_IMPORT_LIMITS.shortTextCharacters)
  );
}

function validateSkillRating(value: unknown, path: string): SkillRating {
  if (!isRecord(value)) throw new Error(`${path} must be a skill rating object`);
  assertOnlyFields(value, new Set(["level", "evidence"]), path);
  if (typeof value.level !== "number" || !Number.isInteger(value.level) || value.level < 0 || value.level > 5) {
    throw new Error(`${path}.level must be an integer from 0 to 5`);
  }
  return { level: value.level, evidence: validateBoundedString(value.evidence, `${path}.evidence`, PROGRESS_IMPORT_LIMITS.evidenceCharacters) };
}

function validateChallenge(value: unknown, path: string): ChallengeResult {
  if (!isRecord(value)) throw new Error(`${path} must be a challenge result object`);
  assertOnlyFields(value, new Set(["passed", "completedAt", "notes"]), path);
  if (typeof value.passed !== "boolean") throw new Error(`${path}.passed must be a boolean`);
  const notes = value.notes === undefined ? undefined :
    validateBoundedString(value.notes, `${path}.notes`, PROGRESS_IMPORT_LIMITS.challengeNotesCharacters);
  return {
    passed: value.passed,
    completedAt: validateTimestamp(value.completedAt, `${path}.completedAt`),
    ...(notes !== undefined ? { notes } : {})
  };
}

function validateReflection(value: unknown, path: string): string {
  return validateBoundedString(value, path, PROGRESS_IMPORT_LIMITS.reflectionCharacters);
}

function validateBooleanItem(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${path} must be a boolean`);
  return value;
}

function validateOptionalBoolean(value: unknown, path: string): boolean {
  if (value === undefined) return false;
  return validateBooleanItem(value, path);
}

function validateRoute(
  value: unknown,
  path: string,
  allowLegacyLabStageRoute = false
): string {
  const route = validateBoundedString(value, path, 300);
  if (
    /^(?:\/|\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*\/?)$/.test(route) &&
    !containsDotPathSegment(route)
  ) {
    return route;
  }
  if (allowLegacyLabStageRoute) {
    const legacy = /^(\/learn\/labs\/[A-Za-z0-9._~-]+)\?stage=(learn|simulate|challenge|diagnose|build|evidence|reflect|next)$/
      .exec(route);
    if (legacy && !containsDotPathSegment(legacy[1])) return legacy[1];
  }
  throw new Error(`${path} must be a canonical internal route`);
}

function containsDotPathSegment(route: string): boolean {
  return route.split("/").some((segment) => segment === "." || segment === "..");
}

function validateUrl(value: unknown, path: string): string {
  const url = validateBoundedString(value, path, PROGRESS_IMPORT_LIMITS.urlCharacters);
  if (!/^https?:\/\//i.test(url)) throw new Error(`${path} must use http or https`);
  return url;
}

function validateTimestamp(value: unknown, path: string): string {
  if (typeof value !== "string" || !isValidUtcTimestamp(value)) throw new Error(`${path} must be a valid UTC ISO timestamp`);
  return value;
}

function validateBoundedString(value: unknown, path: string, maximum: number): string {
  if (typeof value !== "string") throw new Error(`${path} must be text`);
  if (value.length > maximum) throw new Error(`${path} exceeds ${maximum} characters`);
  return value;
}

function validateLegacyRecord(value: unknown, path: string): Record<string, unknown> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  if (Object.keys(value).length > PROGRESS_IMPORT_LIMITS.entriesPerSection) throw new Error(`${path} has too many entries`);
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    validateEntryKey(key, path);
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value: validateLegacyValue(item, `${path}.${key}`, 0),
      writable: true
    });
  }
  return result;
}

function validateLegacyValue(value: unknown, path: string, depth: number): unknown {
  if (depth > PROGRESS_IMPORT_LIMITS.legacyDepth) throw new Error(`${path} is nested too deeply`);
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path} contains a non-finite number`);
    return value;
  }
  if (typeof value === "string") return validateBoundedString(value, path, PROGRESS_IMPORT_LIMITS.notesCharacters);
  if (Array.isArray(value)) {
    if (value.length > PROGRESS_IMPORT_LIMITS.arrayEntries) throw new Error(`${path} has too many entries`);
    return value.map((item, index) => validateLegacyValue(item, `${path}[${index}]`, depth + 1));
  }
  if (isRecord(value)) {
    if (Object.keys(value).length > PROGRESS_IMPORT_LIMITS.entriesPerSection) throw new Error(`${path} has too many entries`);
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      validateEntryKey(key, path);
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: validateLegacyValue(item, `${path}.${key}`, depth + 1),
        writable: true
      });
    }
    return result;
  }
  throw new Error(`${path} contains an unsupported value`);
}

function validateEntryKey(key: string, section: string): void {
  if (key.trim() === "" || key.length > PROGRESS_IMPORT_LIMITS.keyCharacters) throw new Error(`${section} contains an invalid key`);
  const hasControlCharacter = [...key].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
  if (key === "__proto__" || key === "prototype" || key === "constructor" || hasControlCharacter) {
    throw new Error(`${section} contains an unsafe key`);
  }
}

function isValidUtcTimestamp(value: string): boolean {
  if (value.length > 32) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const millisecond = Number((match[7] ?? "").padEnd(3, "0"));
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second
    && date.getUTCMilliseconds() === millisecond;
}

function assertOnlyFields(value: Record<string, unknown>, allowed: ReadonlySet<string>, path: string): void {
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) throw new Error(`${path} contains unsupported field ${field}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
