import type {
  AcademyProgressState,
  AcademySkillEvidence,
  RecordAcademySkillEvidenceInput
} from "../storage";
import {
  evaluateMastery,
  type MasteryEvidence,
  type MasteryEvidenceKind
} from "./mastery";
import type { Skill } from "./types";

const legacyKindMap: Record<
  Extract<AcademySkillEvidence["kind"], "assessment" | "lab" | "project" | "manual">,
  MasteryEvidenceKind
> = {
  assessment: "knowledge-check",
  lab: "instructional",
  project: "instructional",
  manual: "instructional"
};

function toMasteryEvidence(
  skillId: string,
  evidence: AcademySkillEvidence
): MasteryEvidence {
  const kind = evidence.kind in legacyKindMap
    ? legacyKindMap[evidence.kind as keyof typeof legacyKindMap]
    : evidence.kind as MasteryEvidenceKind;
  const converted: MasteryEvidence = {
    id: evidence.evidenceId,
    skillId,
    kind,
    occurredAt: evidence.recordedAt
  };
  if (evidence.scorePercent !== undefined) converted.scorePercent = evidence.scorePercent;
  if (evidence.activityId !== undefined) converted.activityId = evidence.activityId;
  if (evidence.passed !== undefined) converted.passed = evidence.passed;
  return converted;
}

export interface AcademyMasteryEvidenceDraft {
  evidenceId: string;
  kind: MasteryEvidenceKind;
  referenceId: string;
  summary: string;
  recordedAt: string;
  scorePercent?: number;
  activityId?: string;
  passed?: boolean;
}

export function planAcademyMasteryEvidence(
  progress: AcademyProgressState,
  skill: Skill,
  draft: AcademyMasteryEvidenceDraft,
  now: string
): RecordAcademySkillEvidenceInput {
  const storedEvidence: AcademySkillEvidence = {
    evidenceId: draft.evidenceId,
    kind: draft.kind,
    referenceId: draft.referenceId,
    summary: draft.summary,
    recordedAt: draft.recordedAt,
    ...(draft.scorePercent === undefined ? {} : { scorePercent: draft.scorePercent }),
    ...(draft.activityId === undefined ? {} : { activityId: draft.activityId }),
    ...(draft.passed === undefined ? {} : { passed: draft.passed })
  };
  const existingRecord = progress.skillRecords[skill.id];
  const existing = existingRecord?.evidence ?? [];
  const previous = existingRecord === undefined
    ? undefined
    : evaluateMastery({
        skillId: skill.id,
        evidence: existing.map((entry) => toMasteryEvidence(skill.id, entry)),
        now: existingRecord.updatedAt,
        requiresAppliedEvidence: skill.requiresAppliedEvidence
      });
  const mastery = evaluateMastery({
    skillId: skill.id,
    evidence: [
      ...existing.map((entry) => toMasteryEvidence(skill.id, entry)),
      toMasteryEvidence(skill.id, storedEvidence)
    ],
    now,
    requiresAppliedEvidence: skill.requiresAppliedEvidence,
    ...(previous === undefined ? {} : { previous })
  });
  if (mastery.state === "not-started") {
    throw new Error("Recorded academy evidence must move mastery beyond not-started.");
  }
  const nextMastery = existingRecord === undefined
    ? "introduced"
    : mastery.state;
  const clampedInitialState = existingRecord === undefined && mastery.state !== "introduced";
  const evidenceReason = draft.kind === "applied-evidence"
    ? "Learner-attested local applied evidence was recorded and marked passed by the learner; it is not independently verified proof."
    : mastery.declineReasons[0]
      ?? mastery.reasons.at(-1)
      ?? `Evidence recorded for ${skill.title}.`;
  return {
    skillId: skill.id,
    evidence: storedEvidence,
    nextMastery,
    reason: clampedInitialState
      ? `${evidenceReason} Initial evidence is stored at introduced before higher states can be earned.`
      : evidenceReason,
    reviewDueAt: mastery.reviewDueAt,
    timestamp: now
  };
}
