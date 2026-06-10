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
  theme: "dark"
};

const KEY = "engineering-mastery-lab/progress/v1";

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(emptyProgress);
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return mergeProgress(parsed);
  } catch {
    return structuredClone(emptyProgress);
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); the app keeps working in memory.
  }
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

/** Validate + merge imported JSON onto a clean state. Throws on invalid input. */
export function importProgress(json: string): ProgressState {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Imported file is not a progress object");
  }
  const p = parsed as Partial<ProgressState>;
  if (p.version !== 1) throw new Error("Unsupported progress file version");
  return mergeProgress(p);
}

function mergeProgress(p: Partial<ProgressState>): ProgressState {
  return {
    version: 1,
    skillRatings: isRecord(p.skillRatings) ? (p.skillRatings as ProgressState["skillRatings"]) : {},
    challenges: isRecord(p.challenges) ? (p.challenges as ProgressState["challenges"]) : {},
    reflections: isRecord(p.reflections) ? (p.reflections as ProgressState["reflections"]) : {},
    artefacts: isRecord(p.artefacts) ? (p.artefacts as ProgressState["artefacts"]) : {},
    sprintChecklist: isRecord(p.sprintChecklist) ? (p.sprintChecklist as ProgressState["sprintChecklist"]) : {},
    theme: p.theme === "light" ? "light" : "dark"
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
