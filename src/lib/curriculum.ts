import {
  capabilityStages,
  masteryModules,
  type MasteryModule,
  type NumericCheckOperation,
  type WorkedExample
} from "../data/masteryCurriculum";
import { masteryContentIdAliases } from "../data/curriculumMetadata";
import {
  rebootDiagnostics,
  rebootMilestones,
  rebootProjectReleases,
  rebootResources,
  rebootSessions,
  rebootWeeklyReviewTemplate,
  type RebootSession
} from "../data/rebootCurriculum";
import type { LearningRecord, ProgressState, WeeklyReviewRecord } from "./storage";

export interface ProgressDimensionSummary {
  exposure: number;
  practice: number;
  evidence: number;
  mastery: number;
  total: number;
}

export interface CurriculumValidationResult {
  valid: boolean;
  errors: string[];
}

export const milestoneSessionCounts = {
  M0: 6,
  M1: 10,
  M2: 12,
  M3: 12,
  M4: 12,
  M5: 14,
  M6: 12,
  M7: 12,
  M8: 10,
  M9: 10
} as const;

export const optionalRebootResourceIds = ["MIG01", "ADV01", "ADV02"] as const;

export function evaluateNumericCheck(check: WorkedExample["check"]): number {
  const operation: NumericCheckOperation = check.operation;
  if (check.inputs.length === 0 || check.inputs.some((value) => !Number.isFinite(value))) {
    throw new Error("Numeric check inputs must be finite and non-empty");
  }
  switch (operation) {
    case "sum":
      return check.inputs.reduce((total, value) => total + value, 0);
    case "subtract":
      if (check.inputs.length !== 2) throw new Error("Subtract checks require two inputs");
      return check.inputs[0] - check.inputs[1];
    case "product":
      return check.inputs.reduce((total, value) => total * value, 1);
    case "quotient":
      if (check.inputs.length !== 2 || check.inputs[1] === 0) {
        throw new Error("Quotient checks require a non-zero divisor");
      }
      return check.inputs[0] / check.inputs[1];
    case "mean":
      return check.inputs.reduce((total, value) => total + value, 0) / check.inputs.length;
    case "root-sum-squares":
      return Math.sqrt(check.inputs.reduce((total, value) => total + value ** 2, 0));
    case "product-quotient":
      if (check.divisor === undefined || check.divisor === 0) {
        throw new Error("Product-quotient checks require a non-zero divisor");
      }
      return check.inputs.reduce((total, value) => total * value, 1) / check.divisor;
    case "maximum":
      return Math.max(...check.inputs);
  }
}

export function numericCheckPasses(example: WorkedExample): boolean {
  const calculated = evaluateNumericCheck(example.check);
  return Math.abs(calculated - example.check.expected) <= example.check.tolerance
    && Math.abs(calculated - example.answer) <= example.check.tolerance;
}

export function canonicalContentId(id: string): string {
  return masteryContentIdAliases[id] ?? id;
}

export function isProofSession(session: RebootSession): boolean {
  return session.mode === "Proof" || session.mode === "Release";
}

export function canSkipAfterDiagnostic(session: RebootSession, diagnosticScore: number): boolean {
  return diagnosticScore >= 3 && diagnosticScore <= 4 && !isProofSession(session);
}

export function nextUnfinishedSession(records: Record<string, LearningRecord>): RebootSession | null {
  return rebootSessions.find((session) => {
    const record = records[session.id];
    const status = record?.status ?? "not-started";
    const completionRecorded = status === "done" || status === "skipped-diagnostic";
    return !completionRecorded || (isProofSession(session) && record?.gateResult !== "passed");
  }) ?? null;
}

export function currentMilestone(records: Record<string, LearningRecord>) {
  const next = nextUnfinishedSession(records);
  return rebootMilestones.find((milestone) => milestone.id === (next?.milestoneId ?? "M9"))
    ?? rebootMilestones[0];
}

export function currentProjectRelease(records: Record<string, LearningRecord>) {
  const sequence = nextUnfinishedSession(records)?.sequence ?? rebootSessions.length;
  return rebootProjectReleases.find((release) => {
    const range = /^S(\d{3})-S(\d{3})$/.exec(release.sessions);
    return range !== null && sequence >= Number(range[1]) && sequence <= Number(range[2]);
  }) ?? rebootProjectReleases[rebootProjectReleases.length - 1];
}

export function progressDimensions(
  ids: readonly string[],
  records: Record<string, LearningRecord>
): ProgressDimensionSummary {
  const total = ids.length;
  if (total === 0) return { exposure: 0, practice: 0, evidence: 0, mastery: 0, total: 0 };
  const selected = ids.map((id) => records[id]).filter((record): record is LearningRecord => Boolean(record));
  const percentage = (count: number) => Math.round((count / total) * 100);
  return {
    exposure: percentage(selected.filter((record) => record.status !== "not-started").length),
    practice: percentage(selected.filter((record) => record.actualMinutes > 0 || record.attemptCount > 0).length),
    evidence: percentage(selected.filter((record) => record.evidenceReferences.length > 0).length),
    mastery: percentage(selected.filter((record) => record.gateResult === "passed").length),
    total
  };
}

export function rebootProgress(state: ProgressState): ProgressDimensionSummary {
  return progressDimensions(rebootSessions.map((session) => session.id), state.curriculumRecords);
}

export function stageProgress(
  state: ProgressState,
  stageId: MasteryModule["stageId"]
): ProgressDimensionSummary {
  return progressDimensions(
    masteryModules.filter((module) => module.stageId === stageId).map((module) => module.id),
    state.curriculumRecords
  );
}

export function domainProgress(state: ProgressState, domainNumber: number): ProgressDimensionSummary {
  const module = masteryModules.find((candidate) => candidate.domainNumber === domainNumber);
  return progressDimensions(module ? [module.id] : [], state.curriculumRecords);
}

export function evidenceCompletedSince(
  records: Record<string, LearningRecord>,
  startIso: string
): number {
  const start = Date.parse(startIso);
  if (!Number.isFinite(start)) return 0;
  return Object.values(records).filter((record) =>
    record.evidenceReferences.length > 0
    && record.completedAt !== null
    && Date.parse(record.completedAt) >= start
  ).length;
}

export function weeklyReviewDue(
  reviews: Record<string, WeeklyReviewRecord>,
  now: Date
): {
  due: boolean;
  calendarWeek: number;
  templateWeek: number;
  weekKey: string;
  plannedBlocks: number;
} {
  const thursday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const isoDay = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + 4 - isoDay);
  const isoYear = thursday.getUTCFullYear();
  const firstDayOfIsoYear = new Date(Date.UTC(isoYear, 0, 1));
  const calendarWeek = Math.ceil(
    ((thursday.getTime() - firstDayOfIsoYear.getTime()) / 86_400_000 + 1) / 7
  );
  const templateWeek = ((calendarWeek - 1) % rebootWeeklyReviewTemplate.length) + 1;
  const template = rebootWeeklyReviewTemplate[templateWeek - 1];
  const weekKey = `${isoYear}-W${String(calendarWeek).padStart(2, "0")}`;
  return {
    due: reviews[weekKey] === undefined,
    calendarWeek,
    templateWeek,
    weekKey,
    plannedBlocks: template?.plannedBlocks ?? 12
  };
}

export function validateCurriculum(): CurriculumValidationResult {
  const errors: string[] = [];
  const sessionIds = rebootSessions.map((session) => session.id);
  const expectedIds = Array.from({ length: 110 }, (_, index) => `S${String(index + 1).padStart(3, "0")}`);
  if (rebootSessions.length !== 110) errors.push(`Expected 110 reboot sessions, found ${rebootSessions.length}`);
  if (new Set(sessionIds).size !== sessionIds.length) errors.push("Reboot session IDs are not unique");
  if (sessionIds.join("|") !== expectedIds.join("|")) errors.push("Reboot session IDs are not exactly S001-S110 in order");
  if (rebootSessions.reduce((total, session) => total + session.plannedMinutes, 0) !== 2750) {
    errors.push("Reboot planned minutes do not total 2750");
  }

  for (const [milestoneId, expected] of Object.entries(milestoneSessionCounts)) {
    const actual = rebootSessions.filter((session) => session.milestoneId === milestoneId).length;
    if (actual !== expected) errors.push(`${milestoneId} expected ${expected} sessions, found ${actual}`);
  }
  const expectedMilestoneIds = Object.keys(milestoneSessionCounts) as Array<
    keyof typeof milestoneSessionCounts
  >;
  if (
    rebootMilestones.length !== expectedMilestoneIds.length
    || rebootMilestones.map((milestone) => milestone.id).join("|") !== expectedMilestoneIds.join("|")
  ) {
    errors.push("Reboot milestones are not exactly M0-M9 in order");
  }

  const resourceIds = rebootResources.map((resource) => resource.id);
  const referencedResourceIds = new Set(rebootSessions.flatMap((session) => session.resourceIds));
  if (resourceIds.length !== 64 || new Set(resourceIds).size !== 64) {
    errors.push("Reboot resources are not 64 unique records");
  }
  for (const resourceId of referencedResourceIds) {
    if (!resourceIds.includes(resourceId)) errors.push(`Missing reboot resource ${resourceId}`);
  }
  if (referencedResourceIds.size !== 61) errors.push(`Expected 61 referenced resources, found ${referencedResourceIds.size}`);
  const unreferenced = resourceIds.filter((id) => !referencedResourceIds.has(id)).sort();
  if (unreferenced.join("|") !== [...optionalRebootResourceIds].sort().join("|")) {
    errors.push(`Unexpected optional resource set: ${unreferenced.join(", ")}`);
  }
  for (const resource of rebootResources) {
    if (!isSafeExternalUrl(resource.originalUrl)) {
      errors.push(`Reboot resource ${resource.id} does not use a valid HTTPS URL`);
    }
  }

  const diagnosticMilestones = rebootDiagnostics.map((diagnostic) => diagnostic.milestoneId);
  if (
    rebootDiagnostics.length !== expectedMilestoneIds.length
    || new Set(diagnosticMilestones).size !== expectedMilestoneIds.length
    || expectedMilestoneIds.some((id) => !diagnosticMilestones.includes(id))
  ) {
    errors.push("Reboot diagnostics do not cover M0-M9 exactly once");
  }
  const expectedReleaseIds = ["P1", "P2", "P3", "P4"];
  if (
    rebootProjectReleases.length !== expectedReleaseIds.length
    || rebootProjectReleases.map((release) => release.id).join("|") !== expectedReleaseIds.join("|")
  ) {
    errors.push("Reboot releases are not exactly P1-P4 in order");
  }
  for (const release of rebootProjectReleases) {
    const range = /^S(\d{3})-S(\d{3})$/.exec(release.sessions);
    if (
      range === null
      || Number(range[1]) > Number(range[2])
      || !sessionIds.includes(`S${range[1]}`)
      || !sessionIds.includes(`S${range[2]}`)
    ) {
      errors.push(`${release.id} has an invalid session range ${release.sessions}`);
    }
  }
  if (
    rebootWeeklyReviewTemplate.length !== 12
    || rebootWeeklyReviewTemplate.some((week, index) =>
      week.week !== index + 1
      || !Number.isInteger(week.plannedBlocks)
      || week.plannedBlocks < 0
    )
  ) {
    errors.push("Weekly review template is not exactly 12 ordered bounded rows");
  }

  const moduleIds = masteryModules.map((module) => module.id);
  if (masteryModules.length !== 25 || new Set(moduleIds).size !== 25) {
    errors.push("Mastery curriculum must contain 25 unique domain modules");
  }
  if (new Set(masteryModules.map((module) => module.domainNumber)).size !== 25) {
    errors.push("Mastery curriculum domain numbers are not unique");
  }
  for (const module of masteryModules) {
    validateModule(module, moduleIds, errors);
  }
  validatePrerequisiteGraph(masteryModules, errors);

  const stageIds = new Set(capabilityStages.map((stage) => stage.id));
  for (const module of masteryModules) {
    if (!stageIds.has(module.stageId)) errors.push(`${module.id} has unknown stage ${module.stageId}`);
  }
  return { valid: errors.length === 0, errors };
}

function validateModule(module: MasteryModule, moduleIds: string[], errors: string[]): void {
  const requiredTexts = [
    module.title,
    module.beginnerExplanation,
    module.retrievalTask,
    module.practicalTask,
    module.diagnosticGuidance,
    module.evidenceRequirement,
    module.masteryGate,
    module.textEquivalent
  ];
  if (requiredTexts.some((value) => value.trim().length < 12)) {
    errors.push(`${module.id} has an empty or generic required learning-object field`);
  }
  if (
    module.outcomes.length === 0
    || module.vocabulary.length === 0
    || module.equations.length === 0
    || module.commonMistakes.length === 0
    || module.resources.length === 0
    || module.provenance.length === 0
    || module.engineersAustraliaStage1.length === 0
  ) {
    errors.push(`${module.id} is missing required structured learning content`);
  }
  for (const prerequisite of module.prerequisites) {
    if (!moduleIds.includes(prerequisite)) errors.push(`${module.id} has missing prerequisite ${prerequisite}`);
  }
  for (const resource of module.resources) {
    if (!isSafeExternalUrl(resource.url)) {
      errors.push(`${module.id} resource ${resource.label} does not use a valid HTTPS URL`);
    }
  }
  if (!numericCheckPasses(module.workedExample)) {
    errors.push(`${module.id} worked example failed its independent numeric check`);
  }
}

function isSafeExternalUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validatePrerequisiteGraph(modules: MasteryModule[], errors: string[]): void {
  const byId = new Map(modules.map((module) => [module.id, module]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): void => {
    if (visiting.has(id)) {
      errors.push(`Prerequisite cycle contains ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  };
  for (const module of modules) visit(module.id);

  for (const module of modules) {
    if (module.prerequisites.length === 0 && module.stageId !== "E0") {
      errors.push(`${module.id} is not reachable from an E0 entry module`);
    }
  }
}
