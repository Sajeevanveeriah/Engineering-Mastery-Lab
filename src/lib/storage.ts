export type Theme = "dark" | "light";
export type ExperienceLevel = "foundation" | "intermediate" | "advanced";
export type LearnerGoal = "foundations" | "role" | "refresh" | "project";
export type ProgressItemType = "lab" | "pathway" | "project" | "tool" | "skill";

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

export interface RecentItem {
  id: string;
  type: ProgressItemType;
  title: string;
  route: string;
  visitedAt: string;
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

export interface ProgressState {
  version: 2;
  skillRatings: Record<string, SkillRating>;
  challenges: Record<string, ChallengeResult>;
  reflections: Record<string, string>;
  artefacts: Record<string, boolean>;
  sprintChecklist: Record<string, boolean>;
  theme: Theme;
  profile: LocalLearnerProfile | null;
  onboardingComplete: boolean;
  pathways: Record<string, PathwayProgress>;
  labPositions: Record<string, LabPosition>;
  bookmarks: Record<string, boolean>;
  recentItems: RecentItem[];
  projects: Record<string, ProjectProgress>;
  manualEvidence: ManualEvidence[];
  achievements: string[];
  accessibility: AccessibilityPreferences;
  legacy: Record<string, unknown>;
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

export const emptyProgress: ProgressState = {
  version: 2,
  skillRatings: {},
  challenges: {},
  reflections: {},
  artefacts: {},
  sprintChecklist: {},
  theme: "light",
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
  legacy: {}
};

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
  shortTextCharacters: 240,
  urlCharacters: 2_000,
  legacyDepth: 8
} as const;

const V1_FIELDS = new Set([
  "version", "skillRatings", "challenges", "reflections", "artefacts", "sprintChecklist", "theme"
]);
const V2_FIELDS = new Set([
  ...V1_FIELDS,
  "profile", "onboardingComplete", "pathways", "labPositions", "bookmarks", "recentItems",
  "projects", "manualEvidence", "achievements", "accessibility", "legacy"
]);

export function loadProgress(): ProgressState {
  try {
    const current = localStorage.getItem(KEY_V2);
    if (current && current.length <= PROGRESS_IMPORT_LIMITS.jsonCharacters) {
      return validateProgress(JSON.parse(current));
    }
    const old = localStorage.getItem(KEY_V1);
    if (old && old.length <= PROGRESS_IMPORT_LIMITS.jsonCharacters) {
      return validateProgress(JSON.parse(old));
    }
  } catch {
    // Invalid or unavailable browser storage falls back to a clean in-memory state.
  }
  return structuredClone(emptyProgress);
}

export function saveProgress(state: ProgressState): boolean {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): ProgressState {
  if (json.length > PROGRESS_IMPORT_LIMITS.jsonCharacters) {
    throw new Error(`Progress file exceeds ${PROGRESS_IMPORT_LIMITS.jsonCharacters} characters`);
  }
  return validateProgress(JSON.parse(json) as unknown);
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
    theme: validateTheme(value.theme),
    legacy
  };
}

function validateProgress(value: unknown): ProgressState {
  if (!isRecord(value)) throw new Error("Imported file is not a progress object");
  if (value.version === 1) return migrateProgressV1(value as ProgressStateV1);
  if (value.version !== 2) throw new Error("Unsupported progress file version");
  assertOnlyFields(value, V2_FIELDS, "progress file");

  return {
    version: 2,
    skillRatings: validateSection(value.skillRatings, "skillRatings", validateSkillRating),
    challenges: validateSection(value.challenges, "challenges", validateChallenge),
    reflections: validateSection(value.reflections, "reflections", validateReflection),
    artefacts: validateSection(value.artefacts, "artefacts", validateBooleanItem),
    sprintChecklist: validateSection(value.sprintChecklist, "sprintChecklist", validateBooleanItem),
    theme: validateTheme(value.theme),
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

function validateTheme(value: unknown): Theme {
  if (value === undefined) return "light";
  if (value !== "light" && value !== "dark") throw new Error("theme must be either light or dark");
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

function validateRecentItem(value: unknown, path: string): RecentItem {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  assertOnlyFields(value, new Set(["id", "type", "title", "route", "visitedAt"]), path);
  if (!["lab", "pathway", "project", "tool", "skill"].includes(String(value.type))) throw new Error(`${path}.type is invalid`);
  return {
    id: validateBoundedString(value.id, `${path}.id`, 120),
    type: value.type as ProgressItemType,
    title: validateBoundedString(value.title, `${path}.title`, PROGRESS_IMPORT_LIMITS.shortTextCharacters),
    route: validateRoute(value.route, `${path}.route`),
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

function validateRoute(value: unknown, path: string): string {
  const route = validateBoundedString(value, path, 300);
  if (!route.startsWith("/") || route.startsWith("//")) throw new Error(`${path} must be an internal route`);
  return route;
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
  if (key === "__proto__" || key === "prototype" || key === "constructor" || /[\u0000-\u001f\u007f]/.test(key)) {
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
