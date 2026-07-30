import type { MasteryState } from "./types";
import type { AchievementState } from "./mastery";

export type RecommendationActivityKind =
  | "lesson"
  | "practice"
  | "assessment"
  | "review"
  | "laboratory";

export interface RecommendationCandidate {
  id: string;
  title: string;
  route: string;
  kind: RecommendationActivityKind;
  skillIds: string[];
  prerequisiteSkillIds: string[];
  coursePosition: number;
  completed: boolean;
}

export interface RecommendationMasterySnapshot {
  skillId: string;
  state: MasteryState;
  achievementState?: AchievementState;
  reviewDueAt?: string | null;
}

export interface RecommendationResponseSignal {
  questionId: string;
  skillIds: string[];
  isCorrect: boolean;
  confidence?: "low" | "medium" | "high";
  answeredAt: string;
}

export interface RecommendationSkillLabel {
  skillId: string;
  title: string;
}

export interface RecommendationContext {
  now: string;
  currentCoursePosition: number;
  candidates: readonly RecommendationCandidate[];
  mastery: readonly RecommendationMasterySnapshot[];
  recentResponses: readonly RecommendationResponseSignal[];
  unfinishedLabIds: readonly string[];
  skillLabels?: readonly RecommendationSkillLabel[];
  includeLowConfidenceCorrect?: boolean;
  limit?: number;
}

export type RecommendationReasonCode =
  | "prerequisite-gap"
  | "recent-incorrect"
  | "low-confidence-correct"
  | "review-due"
  | "unfinished-lab"
  | "mastery-gap"
  | "course-position";

export interface AcademyRecommendation {
  id: string;
  activityId: string;
  title: string;
  route: string;
  kind: RecommendationActivityKind;
  priorityScore: number;
  summary: string;
  reason: string;
  reasonCodes: RecommendationReasonCode[];
  matchedSkillIds: string[];
  coursePosition: number;
}

export const DEFAULT_RECOMMENDATION_LIMIT = 5;
export const MAX_RECOMMENDATION_LIMIT = 20;
export const MAX_RECENT_RESPONSE_SIGNALS = 100;
export const MAX_RECOMMENDATION_SUMMARY_CHARACTERS = 240;

export const RECOMMENDATION_WEIGHTS = {
  prerequisiteGap: 100,
  recentIncorrect: 80,
  lowConfidenceCorrect: 35,
  reviewDue: 90,
  unfinishedLab: 85,
  masteryNotStarted: 55,
  masteryIntroduced: 45,
  masteryPractising: 35,
  masteryProficient: 10,
  coursePositionMaximum: 25
} as const;

export class RecommendationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecommendationValidationError";
  }
}

interface ScoredRecommendation {
  recommendation: AcademyRecommendation;
  courseDistance: number;
}

function assertTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (value.trim() === "" || !Number.isFinite(parsed)) {
    throw new RecommendationValidationError(
      `${label} must be a valid timestamp.`
    );
  }
  return parsed;
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RecommendationValidationError(
      `${label} must be a finite number.`
    );
  }
}

function uniqueStrings(values: readonly string[], label: string): string[] {
  const trimmed = values.map((value) => value.trim());
  if (trimmed.some((value) => value === "")) {
    throw new RecommendationValidationError(
      `${label} must not contain blank values.`
    );
  }
  if (new Set(trimmed).size !== trimmed.length) {
    throw new RecommendationValidationError(
      `${label} must not contain duplicate values.`
    );
  }
  return trimmed;
}

function effectiveAchievement(
  snapshot: RecommendationMasterySnapshot | undefined
): AchievementState {
  if (snapshot === undefined) return "not-started";
  if (snapshot.state === "review-due") {
    return snapshot.achievementState ?? "proficient";
  }
  return snapshot.state;
}

function masteryGapScore(state: AchievementState): number {
  switch (state) {
    case "not-started":
      return RECOMMENDATION_WEIGHTS.masteryNotStarted;
    case "introduced":
      return RECOMMENDATION_WEIGHTS.masteryIntroduced;
    case "practising":
      return RECOMMENDATION_WEIGHTS.masteryPractising;
    case "proficient":
      return RECOMMENDATION_WEIGHTS.masteryProficient;
    case "mastered":
      return 0;
  }
}

function stateLabel(state: AchievementState): string {
  return state === "not-started" ? "not started" : state;
}

function stableCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function activityKindRank(kind: RecommendationActivityKind): number {
  switch (kind) {
    case "review":
      return 0;
    case "laboratory":
      return 1;
    case "assessment":
      return 2;
    case "practice":
      return 3;
    case "lesson":
      return 4;
  }
}

function skillLabel(
  skillId: string,
  skillTitleById: ReadonlyMap<string, string>
): string {
  return skillTitleById.get(skillId) ?? skillId;
}

function skillListLabel(
  skillIds: readonly string[],
  skillTitleById: ReadonlyMap<string, string>
): string {
  const labels = skillIds.map((skillId) => skillLabel(skillId, skillTitleById));
  if (labels.length <= 2) return labels.join(" and ");
  return `${labels[0]}, ${labels[1]}, and ${labels.length - 2} more skill areas`;
}

function boundedSummary(value: string): string {
  if (value.length <= MAX_RECOMMENDATION_SUMMARY_CHARACTERS) return value;
  const candidate = value.slice(0, MAX_RECOMMENDATION_SUMMARY_CHARACTERS - 3);
  const lastSpace = candidate.lastIndexOf(" ");
  const boundary = lastSpace > 0 ? lastSpace : candidate.length;
  return `${candidate.slice(0, boundary).trimEnd()}...`;
}

function validateContext(context: RecommendationContext): {
  nowMilliseconds: number;
  limit: number;
  unfinishedLabs: Set<string>;
  masteryBySkill: Map<string, RecommendationMasterySnapshot>;
  recentResponses: RecommendationResponseSignal[];
  skillTitleById: Map<string, string>;
} {
  const nowMilliseconds = assertTimestamp(context.now, "now");
  assertFinite(context.currentCoursePosition, "currentCoursePosition");
  const limit = context.limit ?? DEFAULT_RECOMMENDATION_LIMIT;
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_RECOMMENDATION_LIMIT
  ) {
    throw new RecommendationValidationError(
      `limit must be an integer from 1 to ${MAX_RECOMMENDATION_LIMIT}.`
    );
  }

  const candidateIds = new Set<string>();
  for (const candidate of context.candidates) {
    if (
      candidate.id.trim() === "" ||
      candidate.title.trim() === "" ||
      candidate.route.trim() === ""
    ) {
      throw new RecommendationValidationError(
        "Recommendation candidates require non-blank id, title and route."
      );
    }
    if (candidateIds.has(candidate.id)) {
      throw new RecommendationValidationError(
        `Recommendation candidate id "${candidate.id}" is duplicated.`
      );
    }
    candidateIds.add(candidate.id);
    assertFinite(
      candidate.coursePosition,
      `Course position for ${candidate.id}`
    );
    uniqueStrings(candidate.skillIds, `Skill ids for ${candidate.id}`);
    uniqueStrings(
      candidate.prerequisiteSkillIds,
      `Prerequisite skill ids for ${candidate.id}`
    );
  }

  const unfinishedLabIds = uniqueStrings(
    context.unfinishedLabIds,
    "Unfinished laboratory ids"
  );
  for (const labId of unfinishedLabIds) {
    const candidate = context.candidates.find((item) => item.id === labId);
    if (candidate === undefined || candidate.kind !== "laboratory") {
      throw new RecommendationValidationError(
        `Unfinished laboratory id "${labId}" does not identify a laboratory candidate.`
      );
    }
  }

  const masteryBySkill = new Map<string, RecommendationMasterySnapshot>();
  for (const snapshot of context.mastery) {
    if (snapshot.skillId.trim() === "") {
      throw new RecommendationValidationError(
        "Mastery snapshot skillId must not be blank."
      );
    }
    if (masteryBySkill.has(snapshot.skillId)) {
      throw new RecommendationValidationError(
        `Mastery snapshot for "${snapshot.skillId}" is duplicated.`
      );
    }
    if (snapshot.reviewDueAt !== undefined && snapshot.reviewDueAt !== null) {
      assertTimestamp(
        snapshot.reviewDueAt,
        `Review due date for ${snapshot.skillId}`
      );
    }
    masteryBySkill.set(snapshot.skillId, { ...snapshot });
  }

  const recentResponses = context.recentResponses.map((signal) => {
    if (signal.questionId.trim() === "") {
      throw new RecommendationValidationError(
        "Response signal questionId must not be blank."
      );
    }
    const answeredAt = assertTimestamp(
      signal.answeredAt,
      `Response time for ${signal.questionId}`
    );
    if (answeredAt > nowMilliseconds) {
      throw new RecommendationValidationError(
        `Response signal "${signal.questionId}" occurs after now.`
      );
    }
    uniqueStrings(
      signal.skillIds,
      `Response skill ids for ${signal.questionId}`
    );
    return { ...signal, skillIds: [...signal.skillIds] };
  });
  recentResponses.sort((left, right) => {
    const timeDifference =
      Date.parse(right.answeredAt) - Date.parse(left.answeredAt);
    if (timeDifference !== 0) return timeDifference;
    return stableCompare(left.questionId, right.questionId);
  });

  const skillTitleById = new Map<string, string>();
  for (const skill of context.skillLabels ?? []) {
    const skillId = skill.skillId.trim();
    const title = skill.title.trim();
    if (skillId === "" || title === "") {
      throw new RecommendationValidationError(
        "Recommendation skill labels require non-blank skillId and title."
      );
    }
    if (skillTitleById.has(skillId)) {
      throw new RecommendationValidationError(
        `Recommendation skill label "${skillId}" is duplicated.`
      );
    }
    skillTitleById.set(skillId, title);
  }

  return {
    nowMilliseconds,
    limit,
    unfinishedLabs: new Set(unfinishedLabIds),
    masteryBySkill,
    recentResponses: recentResponses.slice(0, MAX_RECENT_RESPONSE_SIGNALS),
    skillTitleById
  };
}

function relevantSignalSkills(
  candidate: RecommendationCandidate,
  signals: readonly RecommendationResponseSignal[],
  predicate: (signal: RecommendationResponseSignal) => boolean
): string[] {
  const candidateSkills = new Set(candidate.skillIds);
  return [
    ...new Set(
      signals
        .filter(predicate)
        .flatMap((signal) =>
          signal.skillIds.filter((skillId) => candidateSkills.has(skillId))
        )
    )
  ].sort(stableCompare);
}

export function recommendNextActivities(
  context: RecommendationContext
): AcademyRecommendation[] {
  const {
    nowMilliseconds,
    limit,
    unfinishedLabs,
    masteryBySkill,
    recentResponses,
    skillTitleById
  } = validateContext(context);

  const prerequisiteNeedBySkill = new Map<string, Set<string>>();
  for (const candidate of context.candidates) {
    if (candidate.completed) continue;
    for (const skillId of candidate.prerequisiteSkillIds) {
      const state = effectiveAchievement(masteryBySkill.get(skillId));
      if (state === "proficient" || state === "mastered") continue;
      const dependents = prerequisiteNeedBySkill.get(skillId) ?? new Set<string>();
      dependents.add(candidate.title);
      prerequisiteNeedBySkill.set(skillId, dependents);
    }
  }

  const scored: ScoredRecommendation[] = [];
  for (const candidate of context.candidates) {
    const unfinishedLab = unfinishedLabs.has(candidate.id);
    if (candidate.completed && !unfinishedLab) continue;

    let priorityScore = 0;
    const reasons: string[] = [];
    let primarySummary = "";
    const reasonCodes: RecommendationReasonCode[] = [];
    const matchedSkills = new Set<string>();

    const unresolvedCandidatePrerequisites = candidate.prerequisiteSkillIds
      .filter((skillId) => {
        const state = effectiveAchievement(masteryBySkill.get(skillId));
        return state !== "proficient" && state !== "mastered";
      });
    if (unresolvedCandidatePrerequisites.length > 0 && !unfinishedLab) {
      continue;
    }

    const prerequisiteSkillsTaught = candidate.skillIds
      .filter((skillId) => prerequisiteNeedBySkill.has(skillId))
      .sort(stableCompare);
    if (prerequisiteSkillsTaught.length > 0) {
      priorityScore +=
        prerequisiteSkillsTaught.length * RECOMMENDATION_WEIGHTS.prerequisiteGap;
      reasonCodes.push("prerequisite-gap");
      for (const skillId of prerequisiteSkillsTaught) matchedSkills.add(skillId);
      const dependentTitles = [
        ...new Set(
          prerequisiteSkillsTaught.flatMap(
            (skillId) => [...(prerequisiteNeedBySkill.get(skillId) ?? [])]
          )
        )
      ].sort(stableCompare);
      const prerequisiteLabel = skillListLabel(
        prerequisiteSkillsTaught,
        skillTitleById
      );
      reasons.push(
        `This activity develops prerequisite ${prerequisiteLabel} needed before ${dependentTitles.join(", ")}.`
      );
      const laterActivityCount = Math.max(0, dependentTitles.length - 1);
      primarySummary =
        `This activity develops ${prerequisiteLabel} for ${dependentTitles[0]}`
        + (
          laterActivityCount > 0
            ? ` and ${laterActivityCount} later ${laterActivityCount === 1 ? "activity" : "activities"}.`
            : "."
        );
    }

    const incorrectSkills = relevantSignalSkills(
      candidate,
      recentResponses,
      (signal) => !signal.isCorrect
    );
    if (incorrectSkills.length > 0) {
      priorityScore +=
        incorrectSkills.length * RECOMMENDATION_WEIGHTS.recentIncorrect;
      reasonCodes.push("recent-incorrect");
      for (const skillId of incorrectSkills) matchedSkills.add(skillId);
      const reason =
        `Recent incorrect responses involved ${skillListLabel(incorrectSkills, skillTitleById)}.`;
      reasons.push(reason);
      if (primarySummary === "") primarySummary = reason;
    }

    const lowConfidenceSkills = context.includeLowConfidenceCorrect
      ? relevantSignalSkills(
          candidate,
          recentResponses,
          (signal) => signal.isCorrect && signal.confidence === "low"
        )
      : [];
    if (lowConfidenceSkills.length > 0) {
      priorityScore +=
        lowConfidenceSkills.length *
        RECOMMENDATION_WEIGHTS.lowConfidenceCorrect;
      reasonCodes.push("low-confidence-correct");
      for (const skillId of lowConfidenceSkills) matchedSkills.add(skillId);
      const reason =
        `Correct responses for ${skillListLabel(lowConfidenceSkills, skillTitleById)} were marked low confidence.`;
      reasons.push(reason);
      if (primarySummary === "") primarySummary = reason;
    }

    const dueSkills = candidate.skillIds
      .filter((skillId) => {
        const snapshot = masteryBySkill.get(skillId);
        if (snapshot === undefined) return false;
        return (
          snapshot.state === "review-due" ||
          (snapshot.reviewDueAt !== undefined &&
            snapshot.reviewDueAt !== null &&
            Date.parse(snapshot.reviewDueAt) <= nowMilliseconds)
        );
      })
      .sort(stableCompare);
    if (dueSkills.length > 0) {
      priorityScore += dueSkills.length * RECOMMENDATION_WEIGHTS.reviewDue;
      reasonCodes.push("review-due");
      for (const skillId of dueSkills) matchedSkills.add(skillId);
      const reason =
        `Retrieval review is due for ${skillListLabel(dueSkills, skillTitleById)}.`;
      reasons.push(reason);
      if (primarySummary === "") primarySummary = reason;
    }

    if (unfinishedLab) {
      priorityScore += RECOMMENDATION_WEIGHTS.unfinishedLab;
      reasonCodes.push("unfinished-lab");
      const reason = "This laboratory has been started but is not finished.";
      reasons.push(reason);
      if (primarySummary === "") primarySummary = reason;
    }

    const candidateMastery = candidate.skillIds
      .map((skillId) => ({
        skillId,
        state: effectiveAchievement(masteryBySkill.get(skillId))
      }))
      .filter(({ state }) => state !== "mastered");
    if (candidateMastery.length > 0) {
      priorityScore += candidateMastery.reduce(
        (total, { state }) => total + masteryGapScore(state),
        0
      );
      reasonCodes.push("mastery-gap");
      for (const item of candidateMastery) matchedSkills.add(item.skillId);
      const reason =
        `Current mastery: ${candidateMastery
          .slice(0, 2)
          .map(
            ({ skillId, state }) =>
              `${skillLabel(skillId, skillTitleById)} is ${stateLabel(state)}`
          )
          .join(", ")}${
            candidateMastery.length > 2
              ? `, and ${candidateMastery.length - 2} more skill areas need work`
              : ""
          }.`;
      reasons.push(reason);
      if (primarySummary === "") primarySummary = reason;
    }

    const courseDistance = Math.abs(
      candidate.coursePosition - context.currentCoursePosition
    );
    const coursePositionScore = Math.max(
      0,
      RECOMMENDATION_WEIGHTS.coursePositionMaximum -
        Math.min(
          courseDistance,
          RECOMMENDATION_WEIGHTS.coursePositionMaximum
        )
    );
    if (coursePositionScore > 0) {
      priorityScore += coursePositionScore;
      reasonCodes.push("course-position");
      const reason =
        candidate.coursePosition === context.currentCoursePosition
          ? "This activity is at the learner's current course position."
          : `This activity is ${courseDistance} course position${courseDistance === 1 ? "" : "s"} from the learner's current position.`;
      reasons.push(reason);
      if (primarySummary === "") primarySummary = reason;
    }

    scored.push({
      courseDistance,
      recommendation: {
        id: `recommendation:${candidate.id}`,
        activityId: candidate.id,
        title: candidate.title,
        route: candidate.route,
        kind: candidate.kind,
        priorityScore,
        summary: boundedSummary(
          primarySummary
            || "This unfinished activity is available as the next course step."
        ),
        reason:
          reasons.length > 0
            ? reasons.join(" ")
            : "This unfinished activity is available as the next course step.",
        reasonCodes,
        matchedSkillIds: [...matchedSkills].sort(stableCompare),
        coursePosition: candidate.coursePosition
      }
    });
  }

  scored.sort((left, right) => {
    const scoreDifference =
      right.recommendation.priorityScore -
      left.recommendation.priorityScore;
    if (scoreDifference !== 0) return scoreDifference;
    const kindDifference = activityKindRank(left.recommendation.kind)
      - activityKindRank(right.recommendation.kind);
    if (kindDifference !== 0) return kindDifference;
    if (left.courseDistance !== right.courseDistance) {
      return left.courseDistance - right.courseDistance;
    }
    if (
      left.recommendation.coursePosition !==
      right.recommendation.coursePosition
    ) {
      return (
        left.recommendation.coursePosition -
        right.recommendation.coursePosition
      );
    }
    return stableCompare(
      left.recommendation.activityId,
      right.recommendation.activityId
    );
  });

  return scored.slice(0, limit).map(({ recommendation }) => ({
    ...recommendation,
    reasonCodes: [...recommendation.reasonCodes],
    matchedSkillIds: [...recommendation.matchedSkillIds]
  }));
}
