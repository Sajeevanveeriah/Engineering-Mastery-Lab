// Local progress persistence. Designed so a Supabase adapter can later
// implement the same ProgressStore shape against a cloud backend.

export interface SkillRating {
  level: number; // 0..5 self rating
  evidence: string;
}

export interface ChallengeResult {
  passed: boolean;
  completedAt: string;
  notes?: string;
}

export interface ProgressState {
  version: 1;
  skillRatings: Record<string, SkillRating>;
  challenges: Record<string, ChallengeResult>;
  reflections: Record<string, string>;
  artefacts: Record<string, boolean>;
  sprintChecklist: Record<string, boolean>;
  theme: "dark" | "light";
}

export const emptyProgress: ProgressState = {
  version: 1,
  skillRatings: {},
  challenges: {},
  reflections: {},
  artefacts: {},
  sprintChecklist: {},
  theme: "light"
};

const KEY = "engineering-mastery-lab/progress/v1";

export const PROGRESS_IMPORT_LIMITS = {
  jsonCharacters: 1_000_000,
  entriesPerSection: 512,
  keyCharacters: 160,
  evidenceCharacters: 20_000,
  challengeNotesCharacters: 20_000,
  reflectionCharacters: 20_000
} as const;

const ROOT_FIELDS = new Set([
  "version",
  "skillRatings",
  "challenges",
  "reflections",
  "artefacts",
  "sprintChecklist",
  "theme"
]);

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(emptyProgress);
    if (raw.length > PROGRESS_IMPORT_LIMITS.jsonCharacters) return structuredClone(emptyProgress);
    return validateProgress(JSON.parse(raw));
  } catch {
    return structuredClone(emptyProgress);
  }
}

export function saveProgress(state: ProgressState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    // Storage may be unavailable (private mode); the app keeps working in memory.
    return false;
  }
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

/** Validate + merge imported JSON onto a clean state. Throws on invalid input. */
export function importProgress(json: string): ProgressState {
  if (json.length > PROGRESS_IMPORT_LIMITS.jsonCharacters) {
    throw new Error(`Progress file exceeds ${PROGRESS_IMPORT_LIMITS.jsonCharacters} characters`);
  }
  const parsed: unknown = JSON.parse(json);
  return validateProgress(parsed);
}

function validateProgress(value: unknown): ProgressState {
  if (!isRecord(value)) throw new Error("Imported file is not a progress object");
  assertOnlyFields(value, ROOT_FIELDS, "progress file");
  if (value.version !== 1) throw new Error("Unsupported progress file version");
  if (value.theme !== undefined && value.theme !== "dark" && value.theme !== "light") {
    throw new Error("theme must be either light or dark");
  }

  return {
    version: 1,
    skillRatings: validateSection(value.skillRatings, "skillRatings", validateSkillRating),
    challenges: validateSection(value.challenges, "challenges", validateChallenge),
    reflections: validateSection(value.reflections, "reflections", validateReflection),
    artefacts: validateSection(value.artefacts, "artefacts", validateBooleanItem),
    sprintChecklist: validateSection(value.sprintChecklist, "sprintChecklist", validateBooleanItem),
    theme: value.theme === "dark" ? "dark" : "light"
  };
}

function validateSection<T>(
  value: unknown,
  section: string,
  validateEntry: (value: unknown, path: string) => T
): Record<string, T> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`${section} must be an object`);
  const keys = Object.keys(value);
  if (keys.length > PROGRESS_IMPORT_LIMITS.entriesPerSection) {
    throw new Error(`${section} exceeds ${PROGRESS_IMPORT_LIMITS.entriesPerSection} entries`);
  }

  const result: Record<string, T> = {};
  for (const key of keys) {
    validateEntryKey(key, section);
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value: validateEntry(value[key], `${section}.${key}`),
      writable: true
    });
  }
  return result;
}

function validateEntryKey(key: string, section: string): void {
  if (key.trim() === "" || key.length > PROGRESS_IMPORT_LIMITS.keyCharacters) {
    throw new Error(`${section} contains an invalid key`);
  }
  if (key === "__proto__" || key === "prototype" || key === "constructor" || /[\u0000-\u001f\u007f]/.test(key)) {
    throw new Error(`${section} contains an unsafe key`);
  }
}

function validateSkillRating(value: unknown, path: string): SkillRating {
  if (!isRecord(value)) throw new Error(`${path} must be a skill rating object`);
  assertOnlyFields(value, new Set(["level", "evidence"]), path);
  if (typeof value.level !== "number" || !Number.isInteger(value.level) || value.level < 0 || value.level > 5) {
    throw new Error(`${path}.level must be an integer from 0 to 5`);
  }
  const evidence = validateBoundedString(value.evidence, `${path}.evidence`, PROGRESS_IMPORT_LIMITS.evidenceCharacters);
  return { level: value.level, evidence };
}

function validateChallenge(value: unknown, path: string): ChallengeResult {
  if (!isRecord(value)) throw new Error(`${path} must be a challenge result object`);
  assertOnlyFields(value, new Set(["passed", "completedAt", "notes"]), path);
  if (typeof value.passed !== "boolean") throw new Error(`${path}.passed must be a boolean`);
  if (typeof value.completedAt !== "string" || !isValidUtcTimestamp(value.completedAt)) {
    throw new Error(`${path}.completedAt must be a valid UTC ISO timestamp`);
  }
  if (value.notes === undefined) return { passed: value.passed, completedAt: value.completedAt };
  return {
    passed: value.passed,
    completedAt: value.completedAt,
    notes: validateBoundedString(value.notes, `${path}.notes`, PROGRESS_IMPORT_LIMITS.challengeNotesCharacters)
  };
}

function validateReflection(value: unknown, path: string): string {
  return validateBoundedString(value, path, PROGRESS_IMPORT_LIMITS.reflectionCharacters);
}

function validateBooleanItem(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${path} must be a boolean`);
  return value;
}

function validateBoundedString(value: unknown, path: string, maximum: number): string {
  if (typeof value !== "string") throw new Error(`${path} must be text`);
  if (value.length > maximum) throw new Error(`${path} exceeds ${maximum} characters`);
  return value;
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
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date.getUTCHours() === hour
    && date.getUTCMinutes() === minute
    && date.getUTCSeconds() === second
    && date.getUTCMilliseconds() === millisecond;
}

function assertOnlyFields(value: Record<string, unknown>, allowed: ReadonlySet<string>, path: string): void {
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) throw new Error(`${path} contains unsupported field ${field}`);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
