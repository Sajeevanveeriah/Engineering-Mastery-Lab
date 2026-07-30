import type { MasteryState } from "./types";

export type AchievementState = Exclude<MasteryState, "review-due">;

export type MasteryEvidenceKind =
  | "instructional"
  | "knowledge-check"
  | "guided-practice"
  | "scored-activity"
  | "delayed-review"
  | "applied-evidence";

export interface MasteryEvidence {
  id: string;
  skillId: string;
  kind: MasteryEvidenceKind;
  occurredAt: string;
  scorePercent?: number;
  activityId?: string;
  passed?: boolean;
}

export interface ReviewHeuristic {
  description: string;
  intervalDays: Partial<
    Record<AchievementState, readonly [number, ...number[]]>
  >;
}

export interface MasteryPolicy {
  guidedPracticeThresholdPercent: number;
  guidedPracticeWindow: number;
  proficientThresholdPercent: number;
  proficientIndependentActivities: number;
  masteredDelayedReviewThresholdPercent: number;
  maxEvidenceHistory: number;
  reviewHeuristic: ReviewHeuristic;
}

export interface MasteryProgress {
  skillId: string;
  state: MasteryState;
  achievementState: AchievementState;
  highestState: AchievementState;
  reviewDueAt: string | null;
  reasons: string[];
  declineReasons: string[];
  evidence: MasteryEvidence[];
  updatedAt: string;
}

export interface MasteryEvaluationInput {
  skillId: string;
  evidence: readonly MasteryEvidence[];
  now: string;
  requiresAppliedEvidence: boolean;
  previous?: MasteryProgress;
}

export interface ApplyMasteryEvidenceOptions {
  now: string;
  requiresAppliedEvidence: boolean;
}

export const DEFAULT_SPACED_REVIEW_HEURISTIC: ReviewHeuristic = {
  description:
    "A configurable retrieval-spacing heuristic for this application, not a scientifically perfect memory model.",
  intervalDays: {
    proficient: [7, 14, 30],
    mastered: [14, 30, 60, 120]
  }
};

export const DEFAULT_MASTERY_POLICY: MasteryPolicy = {
  guidedPracticeThresholdPercent: 60,
  guidedPracticeWindow: 3,
  proficientThresholdPercent: 80,
  proficientIndependentActivities: 2,
  masteredDelayedReviewThresholdPercent: 90,
  maxEvidenceHistory: 100,
  reviewHeuristic: DEFAULT_SPACED_REVIEW_HEURISTIC
};

const ACHIEVEMENT_RANK: Record<AchievementState, number> = {
  "not-started": 0,
  introduced: 1,
  practising: 2,
  proficient: 3,
  mastered: 4
};

class MasteryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MasteryValidationError";
  }
}

interface EvidenceSummary {
  achievementState: AchievementState;
  reasons: string[];
  declineEvidenceReasons: string[];
  reviewAnchorAt: string | null;
  successfulDelayedReviews: number;
}

function assertTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (value.trim() === "" || !Number.isFinite(parsed)) {
    throw new MasteryValidationError(`${label} must be a valid timestamp.`);
  }
  return parsed;
}

function assertPercent(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new MasteryValidationError(
      `${label} must be a finite percentage from 0 to 100.`
    );
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new MasteryValidationError(`${label} must be a positive integer.`);
  }
}

function validatePolicy(policy: MasteryPolicy): void {
  assertPercent(
    policy.guidedPracticeThresholdPercent,
    "Guided-practice threshold"
  );
  assertPercent(policy.proficientThresholdPercent, "Proficient threshold");
  assertPercent(
    policy.masteredDelayedReviewThresholdPercent,
    "Mastered delayed-review threshold"
  );
  assertPositiveInteger(
    policy.guidedPracticeWindow,
    "Guided-practice window"
  );
  assertPositiveInteger(
    policy.proficientIndependentActivities,
    "Independent activity count"
  );
  assertPositiveInteger(policy.maxEvidenceHistory, "Evidence history limit");
  if (policy.maxEvidenceHistory > 1_000) {
    throw new MasteryValidationError(
      "Evidence history limit must not exceed 1,000."
    );
  }
  if (policy.reviewHeuristic.description.trim() === "") {
    throw new MasteryValidationError(
      "Review heuristic must include a transparent description."
    );
  }
  for (const [state, intervals] of Object.entries(
    policy.reviewHeuristic.intervalDays
  )) {
    if (!(state in ACHIEVEMENT_RANK) || intervals === undefined) {
      throw new MasteryValidationError(
        `Review heuristic contains unsupported state "${state}".`
      );
    }
    for (const interval of intervals) {
      if (!Number.isFinite(interval) || interval <= 0) {
        throw new MasteryValidationError(
          `Review interval for ${state} must be greater than zero days.`
        );
      }
    }
  }
}

function cloneEvidence(evidence: MasteryEvidence): MasteryEvidence {
  return { ...evidence };
}

function validateAndSortEvidence(
  skillId: string,
  evidence: readonly MasteryEvidence[],
  maxLength: number
): MasteryEvidence[] {
  if (skillId.trim() === "") {
    throw new MasteryValidationError("skillId must not be blank.");
  }
  const ids = new Set<string>();
  const sorted = evidence.map((entry) => {
    if (entry.id.trim() === "") {
      throw new MasteryValidationError("Evidence id must not be blank.");
    }
    if (ids.has(entry.id)) {
      throw new MasteryValidationError(
        `Evidence id "${entry.id}" is duplicated.`
      );
    }
    ids.add(entry.id);
    if (entry.skillId !== skillId) {
      throw new MasteryValidationError(
        `Evidence "${entry.id}" belongs to skill "${entry.skillId}", not "${skillId}".`
      );
    }
    assertTimestamp(entry.occurredAt, `Evidence timestamp for ${entry.id}`);

    if (
      entry.kind === "guided-practice" ||
      entry.kind === "scored-activity" ||
      entry.kind === "delayed-review"
    ) {
      if (entry.scorePercent === undefined) {
        throw new MasteryValidationError(
          `Evidence "${entry.id}" requires scorePercent.`
        );
      }
      assertPercent(entry.scorePercent, `Score for ${entry.id}`);
    } else if (entry.scorePercent !== undefined) {
      assertPercent(entry.scorePercent, `Score for ${entry.id}`);
    }

    if (
      entry.kind === "scored-activity" &&
      (entry.activityId === undefined || entry.activityId.trim() === "")
    ) {
      throw new MasteryValidationError(
        `Scored activity evidence "${entry.id}" requires activityId.`
      );
    }
    if (entry.kind === "applied-evidence" && entry.passed === undefined) {
      throw new MasteryValidationError(
        `Applied evidence "${entry.id}" requires passed.`
      );
    }
    return cloneEvidence(entry);
  });

  sorted.sort((left, right) => {
    const timeDifference =
      Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
    if (timeDifference !== 0) return timeDifference;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
  return sorted.slice(-maxLength);
}

function average(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function latestByActivity(
  evidence: readonly MasteryEvidence[]
): MasteryEvidence[] {
  const byActivity = new Map<string, MasteryEvidence>();
  for (const entry of evidence) {
    if (entry.kind !== "scored-activity" || entry.activityId === undefined) {
      continue;
    }
    byActivity.set(entry.activityId, entry);
  }
  return [...byActivity.values()].sort((left, right) => {
    const timeDifference =
      Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
    if (timeDifference !== 0) return timeDifference;
    const leftActivity = left.activityId as string;
    const rightActivity = right.activityId as string;
    return leftActivity < rightActivity
      ? -1
      : leftActivity > rightActivity
        ? 1
        : 0;
  });
}

function summariseEvidence(
  evidence: readonly MasteryEvidence[],
  requiresAppliedEvidence: boolean,
  policy: MasteryPolicy
): EvidenceSummary {
  if (evidence.length === 0) {
    return {
      achievementState: "not-started",
      reasons: ["No instructional or assessment evidence has been recorded."],
      declineEvidenceReasons: [],
      reviewAnchorAt: null,
      successfulDelayedReviews: 0
    };
  }

  let achievementState: AchievementState = "introduced";
  const reasons = [
    "At least one instructional, knowledge-check or assessment attempt has been recorded."
  ];
  const declineEvidenceReasons: string[] = [];
  let reviewAnchorAt: string | null = null;

  const guided = evidence
    .filter((entry) => entry.kind === "guided-practice")
    .slice(-policy.guidedPracticeWindow);
  const guidedScores = guided.map((entry) => entry.scorePercent as number);
  const guidedAverage =
    guidedScores.length > 0 ? average(guidedScores) : null;
  if (
    guidedAverage !== null &&
    guidedAverage >= policy.guidedPracticeThresholdPercent
  ) {
    achievementState = "practising";
    reasons.push(
      `Recent guided-practice average is ${guidedAverage.toFixed(2)}%, meeting the ${policy.guidedPracticeThresholdPercent}% practising threshold.`
    );
  } else if (guidedAverage !== null) {
    declineEvidenceReasons.push(
      `Recent guided-practice average is ${guidedAverage.toFixed(2)}%, below the ${policy.guidedPracticeThresholdPercent}% practising threshold.`
    );
  }

  const independentActivities = latestByActivity(evidence).slice(
    -policy.proficientIndependentActivities
  );
  const hasIndependentCount =
    independentActivities.length >= policy.proficientIndependentActivities;
  const allIndependentScoresPass =
    hasIndependentCount &&
    independentActivities.every(
      (entry) =>
        (entry.scorePercent as number) >= policy.proficientThresholdPercent
    );
  if (allIndependentScoresPass) {
    achievementState = "proficient";
    reviewAnchorAt = independentActivities.at(-1)?.occurredAt ?? null;
    reasons.push(
      `${policy.proficientIndependentActivities} independent scored activities each meet the ${policy.proficientThresholdPercent}% proficiency threshold.`
    );
  } else if (hasIndependentCount) {
    const failing = independentActivities.filter(
      (entry) =>
        (entry.scorePercent as number) < policy.proficientThresholdPercent
    );
    for (const entry of failing) {
      declineEvidenceReasons.push(
        `Recent scored activity "${entry.activityId as string}" is ${(entry.scorePercent as number).toFixed(2)}%, below the ${policy.proficientThresholdPercent}% proficiency threshold.`
      );
    }
  }

  const delayedReviews = evidence.filter(
    (entry) => entry.kind === "delayed-review"
  );
  const latestDelayedReview = delayedReviews.at(-1);
  const successfulDelayedReviews = delayedReviews.filter(
    (entry) =>
      (entry.scorePercent as number) >=
      policy.masteredDelayedReviewThresholdPercent
  ).length;
  const latestAppliedEvidence = evidence
    .filter((entry) => entry.kind === "applied-evidence")
    .at(-1);
  const delayedReviewPass =
    latestDelayedReview !== undefined &&
    (latestDelayedReview.scorePercent as number) >=
      policy.masteredDelayedReviewThresholdPercent;
  const appliedEvidencePass =
    !requiresAppliedEvidence || latestAppliedEvidence?.passed === true;

  if (
    achievementState === "proficient" &&
    delayedReviewPass &&
    appliedEvidencePass
  ) {
    achievementState = "mastered";
    reviewAnchorAt = latestDelayedReview.occurredAt;
    reasons.push(
      `Latest delayed review is ${(latestDelayedReview.scorePercent as number).toFixed(2)}%, meeting the ${policy.masteredDelayedReviewThresholdPercent}% mastery threshold.`
    );
    reasons.push(
      requiresAppliedEvidence
        ? "Required learner-attested local applied evidence is present and marked passed; the app has not independently verified it."
        : "This skill does not require separate applied evidence."
    );
  } else {
    if (
      latestDelayedReview !== undefined &&
      !delayedReviewPass
    ) {
      declineEvidenceReasons.push(
        `Latest delayed review is ${(latestDelayedReview.scorePercent as number).toFixed(2)}%, below the ${policy.masteredDelayedReviewThresholdPercent}% mastery threshold.`
      );
    }
    if (
      requiresAppliedEvidence &&
      latestAppliedEvidence !== undefined &&
      latestAppliedEvidence.passed === false
    ) {
      declineEvidenceReasons.push(
        `Latest learner-attested local applied evidence "${latestAppliedEvidence.id}" was not marked passed.`
      );
    }
    if (
      achievementState === "proficient" &&
      delayedReviewPass &&
      requiresAppliedEvidence &&
      latestAppliedEvidence === undefined
    ) {
      reasons.push(
        "Mastery is waiting for the required learner-attested local applied evidence."
      );
    }
  }

  return {
    achievementState,
    reasons,
    declineEvidenceReasons,
    reviewAnchorAt,
    successfulDelayedReviews
  };
}

function reviewDueAt(
  state: AchievementState,
  anchorAt: string | null,
  successfulDelayedReviews: number,
  heuristic: ReviewHeuristic
): string | null {
  const intervals = heuristic.intervalDays[state];
  if (anchorAt === null || intervals === undefined || intervals.length === 0) {
    return null;
  }
  const intervalIndex = Math.min(
    Math.max(0, successfulDelayedReviews - 1),
    intervals.length - 1
  );
  const intervalDays = intervals[intervalIndex] as number;
  const dueMilliseconds =
    assertTimestamp(anchorAt, "Review anchor") +
    intervalDays * 24 * 60 * 60 * 1_000;
  return new Date(dueMilliseconds).toISOString();
}

function higherState(
  left: AchievementState,
  right: AchievementState
): AchievementState {
  return ACHIEVEMENT_RANK[left] >= ACHIEVEMENT_RANK[right] ? left : right;
}

export function createMasteryProgress(
  skillId: string,
  now: string
): MasteryProgress {
  assertTimestamp(now, "now");
  if (skillId.trim() === "") {
    throw new MasteryValidationError("skillId must not be blank.");
  }
  return {
    skillId,
    state: "not-started",
    achievementState: "not-started",
    highestState: "not-started",
    reviewDueAt: null,
    reasons: ["No instructional or assessment evidence has been recorded."],
    declineReasons: [],
    evidence: [],
    updatedAt: now
  };
}

export function evaluateMastery(
  input: MasteryEvaluationInput,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY
): MasteryProgress {
  validatePolicy(policy);
  const nowMilliseconds = assertTimestamp(input.now, "now");
  if (input.previous !== undefined && input.previous.skillId !== input.skillId) {
    throw new MasteryValidationError(
      "Previous mastery progress belongs to a different skill."
    );
  }
  const evidence = validateAndSortEvidence(
    input.skillId,
    input.evidence,
    policy.maxEvidenceHistory
  );
  const futureEvidence = evidence.find(
    (entry) => Date.parse(entry.occurredAt) > nowMilliseconds
  );
  if (futureEvidence !== undefined) {
    throw new MasteryValidationError(
      `Evidence "${futureEvidence.id}" occurs after the evaluation time.`
    );
  }
  const summary = summariseEvidence(
    evidence,
    input.requiresAppliedEvidence,
    policy
  );
  const dueAt = reviewDueAt(
    summary.achievementState,
    summary.reviewAnchorAt,
    summary.successfulDelayedReviews,
    policy.reviewHeuristic
  );
  const isReviewDue =
    dueAt !== null && nowMilliseconds >= Date.parse(dueAt);
  const state: MasteryState = isReviewDue
    ? "review-due"
    : summary.achievementState;
  const previousAchievement = input.previous?.achievementState;
  const declined =
    previousAchievement !== undefined &&
    ACHIEVEMENT_RANK[summary.achievementState] <
      ACHIEVEMENT_RANK[previousAchievement];
  const declineReasons = declined
    ? summary.declineEvidenceReasons.length > 0
      ? summary.declineEvidenceReasons
      : [
          `Current evidence no longer meets the thresholds for ${previousAchievement}.`
        ]
    : [];
  const reasons = [...summary.reasons];
  if (isReviewDue) {
    reasons.push(
      `Retrieval review became due at ${dueAt as string}; ${summary.achievementState} achievement is retained.`
    );
  } else if (dueAt !== null) {
    reasons.push(`Next retrieval review is scheduled for ${dueAt}.`);
  }
  if (declined) {
    reasons.push(
      `Achievement declined from ${previousAchievement as AchievementState} to ${summary.achievementState} because of current evidence.`
    );
  }

  return {
    skillId: input.skillId,
    state,
    achievementState: summary.achievementState,
    highestState:
      input.previous === undefined
        ? summary.achievementState
        : higherState(input.previous.highestState, summary.achievementState),
    reviewDueAt: dueAt,
    reasons,
    declineReasons,
    evidence,
    updatedAt: input.now
  };
}

export function applyMasteryEvidence(
  previous: MasteryProgress,
  newEvidence: MasteryEvidence | readonly MasteryEvidence[],
  options: ApplyMasteryEvidenceOptions,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY
): MasteryProgress {
  const additions = Array.isArray(newEvidence)
    ? newEvidence
    : [newEvidence];
  return evaluateMastery(
    {
      skillId: previous.skillId,
      evidence: [...previous.evidence, ...additions],
      now: options.now,
      requiresAppliedEvidence: options.requiresAppliedEvidence,
      previous
    },
    policy
  );
}

export function refreshMasteryReviewStatus(
  previous: MasteryProgress,
  options: ApplyMasteryEvidenceOptions,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY
): MasteryProgress {
  return evaluateMastery(
    {
      skillId: previous.skillId,
      evidence: previous.evidence,
      now: options.now,
      requiresAppliedEvidence: options.requiresAppliedEvidence,
      previous
    },
    policy
  );
}

export { MasteryValidationError };
