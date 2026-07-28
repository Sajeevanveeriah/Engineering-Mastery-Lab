import {
  ECOSYSTEM_LIMITS,
  assertBoundedText,
  assertIsoTimestamp,
  assertOpaqueIdentifier,
  assertSafeInteger,
  assertSafeJsonValue,
  compareCanonicalText,
  type ActorId,
  type AssignmentId,
  type CohortId,
  type ContentId,
  type EvidenceId
} from "./validation";

export const COHORT_SCHEMA_VERSION = 1 as const;

/**
 * Aggregates are withheld below this group size. The suppressed result omits
 * the actual participant count and all outcome counts.
 */
export const SMALL_GROUP_SUPPRESSION_MINIMUM = 5;

export type CohortRole = "educator" | "reviewer" | "learner";
export type CompletionState = "not-started" | "in-progress" | "complete";
export type EvidenceReviewState = "pending" | "accepted" | "changes-requested";
export type EvidenceDecisionCode = "meets-criteria" | "revision-needed";
export type CohortDataClassification = "synthetic-fixture" | "provider-managed";

export interface Cohort {
  id: CohortId;
  createdAt: string;
}

export interface CohortMembership {
  cohortId: CohortId;
  actorId: ActorId;
  role: CohortRole;
  joinedAt: string;
}

export interface CohortAssignment {
  id: AssignmentId;
  cohortId: CohortId;
  contentId: ContentId;
  title: string;
  requiredItems: number;
  assignedAt: string;
  dueAt: string | null;
}

export interface CompletionSummary {
  assignmentId: AssignmentId;
  actorId: ActorId;
  state: CompletionState;
  completedItems: number;
  totalItems: number;
  updatedAt: string;
}

export interface EvidenceReview {
  evidenceId: EvidenceId;
  assignmentId: AssignmentId;
  subjectActorId: ActorId;
  state: EvidenceReviewState;
  reviewerActorId: ActorId | null;
  decisionCode: EvidenceDecisionCode | null;
  updatedAt: string;
}

export interface CohortSnapshot {
  schemaVersion: typeof COHORT_SCHEMA_VERSION;
  dataClassification: CohortDataClassification;
  cohort: Cohort;
  memberships: CohortMembership[];
  assignments: CohortAssignment[];
  completions: CompletionSummary[];
  evidenceReviews: EvidenceReview[];
}

export interface ReleasedProgressAggregate {
  status: "released";
  assignmentId: AssignmentId;
  minimumGroupSize: number;
  participantCount: number;
  completeCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionRate: number;
  meanProgress: number;
  acceptedEvidenceCount: number;
  changesRequestedEvidenceCount: number;
  pendingEvidenceCount: number;
}

export interface SuppressedProgressAggregate {
  status: "suppressed";
  assignmentId: AssignmentId;
  minimumGroupSize: number;
  reason: "group-below-privacy-threshold";
}

export type PrivacySafeProgressAggregate =
  | ReleasedProgressAggregate
  | SuppressedProgressAggregate;

const SNAPSHOT_KEYS = new Set([
  "schemaVersion",
  "dataClassification",
  "cohort",
  "memberships",
  "assignments",
  "completions",
  "evidenceReviews"
]);
const COHORT_KEYS = new Set(["id", "createdAt"]);
const MEMBERSHIP_KEYS = new Set(["cohortId", "actorId", "role", "joinedAt"]);
const ASSIGNMENT_KEYS = new Set([
  "id",
  "cohortId",
  "contentId",
  "title",
  "requiredItems",
  "assignedAt",
  "dueAt"
]);
const COMPLETION_KEYS = new Set([
  "assignmentId",
  "actorId",
  "state",
  "completedItems",
  "totalItems",
  "updatedAt"
]);
const EVIDENCE_KEYS = new Set([
  "evidenceId",
  "assignmentId",
  "subjectActorId",
  "state",
  "reviewerActorId",
  "decisionCode",
  "updatedAt"
]);

function assertArray(value: unknown, label: string, maximum: number): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  if (value.length > maximum) throw new Error(`${label} exceeds its entry limit`);
  return value;
}

function assertObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label} contains unsupported field ${key}`);
  }
}

function assertRole(value: unknown): CohortRole {
  if (value !== "educator" && value !== "reviewer" && value !== "learner") {
    throw new Error("cohort membership has an invalid role");
  }
  return value;
}

function assertCompletionState(value: unknown): CompletionState {
  if (value !== "not-started" && value !== "in-progress" && value !== "complete") {
    throw new Error("completion summary has an invalid state");
  }
  return value;
}

function assertEvidenceState(value: unknown): EvidenceReviewState {
  if (value !== "pending" && value !== "accepted" && value !== "changes-requested") {
    throw new Error("evidence review has an invalid state");
  }
  return value;
}

export function validateCohortSnapshot(value: unknown): CohortSnapshot {
  const safe = assertSafeJsonValue(value, "cohort snapshot");
  const root = assertObject(safe, "cohort snapshot");
  assertOnlyKeys(root, SNAPSHOT_KEYS, "cohort snapshot");
  if (root.schemaVersion !== COHORT_SCHEMA_VERSION) {
    throw new Error(`unsupported cohort schema version ${String(root.schemaVersion)}`);
  }
  if (
    root.dataClassification !== "synthetic-fixture" &&
    root.dataClassification !== "provider-managed"
  ) {
    throw new Error("cohort snapshot must declare its data classification");
  }

  const cohortValue = assertObject(root.cohort, "cohort");
  assertOnlyKeys(cohortValue, COHORT_KEYS, "cohort");
  const cohort: Cohort = {
    id: assertOpaqueIdentifier(cohortValue.id, "cohort"),
    createdAt: assertIsoTimestamp(cohortValue.createdAt, "cohort createdAt")
  };

  const memberships: CohortMembership[] = [];
  const membershipActors = new Map<string, CohortRole>();
  for (const item of assertArray(
    root.memberships,
    "cohort memberships",
    ECOSYSTEM_LIMITS.cohortMembers
  )) {
    const candidate = assertObject(item, "cohort membership");
    assertOnlyKeys(candidate, MEMBERSHIP_KEYS, "cohort membership");
    const membership: CohortMembership = {
      cohortId: assertOpaqueIdentifier(candidate.cohortId, "cohort"),
      actorId: assertOpaqueIdentifier(candidate.actorId, "actor"),
      role: assertRole(candidate.role),
      joinedAt: assertIsoTimestamp(candidate.joinedAt, "membership joinedAt")
    };
    if (membership.cohortId !== cohort.id) {
      throw new Error("membership references another cohort");
    }
    if (membershipActors.has(membership.actorId)) {
      throw new Error("cohort membership contains a duplicate actor");
    }
    membershipActors.set(membership.actorId, membership.role);
    memberships.push(membership);
  }
  if (![...membershipActors.values()].includes("educator")) {
    throw new Error("cohort fixture requires an educator role");
  }

  const assignments: CohortAssignment[] = [];
  const assignmentsById = new Map<string, CohortAssignment>();
  for (const item of assertArray(
    root.assignments,
    "cohort assignments",
    ECOSYSTEM_LIMITS.cohortAssignments
  )) {
    const candidate = assertObject(item, "cohort assignment");
    assertOnlyKeys(candidate, ASSIGNMENT_KEYS, "cohort assignment");
    const assignedAt = assertIsoTimestamp(candidate.assignedAt, "assignment assignedAt");
    const dueAt = candidate.dueAt === null
      ? null
      : assertIsoTimestamp(candidate.dueAt, "assignment dueAt");
    if (dueAt !== null && dueAt < assignedAt) {
      throw new Error("assignment dueAt must not precede assignedAt");
    }
    const assignment: CohortAssignment = {
      id: assertOpaqueIdentifier(candidate.id, "assignment"),
      cohortId: assertOpaqueIdentifier(candidate.cohortId, "cohort"),
      contentId: assertOpaqueIdentifier(candidate.contentId, "content"),
      title: assertBoundedText(candidate.title, "assignment title"),
      requiredItems: assertSafeInteger(candidate.requiredItems, "requiredItems", 1, 10_000),
      assignedAt,
      dueAt
    };
    if (assignment.cohortId !== cohort.id) {
      throw new Error("assignment references another cohort");
    }
    if (assignmentsById.has(assignment.id)) {
      throw new Error("cohort contains a duplicate assignment");
    }
    assignmentsById.set(assignment.id, assignment);
    assignments.push(assignment);
  }

  const completions: CompletionSummary[] = [];
  const completionKeys = new Set<string>();
  for (const item of assertArray(
    root.completions,
    "completion summaries",
    ECOSYSTEM_LIMITS.completionRecords
  )) {
    const candidate = assertObject(item, "completion summary");
    assertOnlyKeys(candidate, COMPLETION_KEYS, "completion summary");
    const assignmentId = assertOpaqueIdentifier(candidate.assignmentId, "assignment");
    const actorId = assertOpaqueIdentifier(candidate.actorId, "actor");
    const assignment = assignmentsById.get(assignmentId);
    if (assignment === undefined) {
      throw new Error("completion references an unknown assignment");
    }
    if (membershipActors.get(actorId) !== "learner") {
      throw new Error("completion subject must be a learner in the cohort");
    }
    const state = assertCompletionState(candidate.state);
    const totalItems = assertSafeInteger(candidate.totalItems, "completion totalItems", 1, 10_000);
    const completedItems = assertSafeInteger(
      candidate.completedItems,
      "completion completedItems",
      0,
      totalItems
    );
    if (totalItems !== assignment.requiredItems) {
      throw new Error("completion totalItems must match the assignment");
    }
    if (
      (state === "not-started" && completedItems !== 0) ||
      (state === "in-progress" && (completedItems === 0 || completedItems === totalItems)) ||
      (state === "complete" && completedItems !== totalItems)
    ) {
      throw new Error("completion state does not match its item counts");
    }
    const key = `${assignmentId}|${actorId}`;
    if (completionKeys.has(key)) {
      throw new Error("cohort contains a duplicate completion summary");
    }
    completionKeys.add(key);
    const updatedAt = assertIsoTimestamp(candidate.updatedAt, "completion updatedAt");
    if (updatedAt < assignment.assignedAt) {
      throw new Error("completion updatedAt must not precede assignment");
    }
    completions.push({
      assignmentId,
      actorId,
      state,
      completedItems,
      totalItems,
      updatedAt
    });
  }

  const evidenceReviews: EvidenceReview[] = [];
  const evidenceIds = new Set<string>();
  for (const item of assertArray(
    root.evidenceReviews,
    "evidence reviews",
    ECOSYSTEM_LIMITS.evidenceReviews
  )) {
    const candidate = assertObject(item, "evidence review");
    assertOnlyKeys(candidate, EVIDENCE_KEYS, "evidence review");
    const assignmentId = assertOpaqueIdentifier(candidate.assignmentId, "assignment");
    const subjectActorId = assertOpaqueIdentifier(candidate.subjectActorId, "actor");
    const state = assertEvidenceState(candidate.state);
    if (!assignmentsById.has(assignmentId)) {
      throw new Error("evidence review references an unknown assignment");
    }
    if (membershipActors.get(subjectActorId) !== "learner") {
      throw new Error("evidence subject must be a learner in the cohort");
    }
    const reviewerActorId = candidate.reviewerActorId === null
      ? null
      : assertOpaqueIdentifier(candidate.reviewerActorId, "actor");
    if (
      reviewerActorId !== null &&
      membershipActors.get(reviewerActorId) !== "educator" &&
      membershipActors.get(reviewerActorId) !== "reviewer"
    ) {
      throw new Error("evidence reviewer must have an educator or reviewer role");
    }
    const decisionCode = candidate.decisionCode;
    if (
      decisionCode !== null &&
      decisionCode !== "meets-criteria" &&
      decisionCode !== "revision-needed"
    ) {
      throw new Error("evidence review has an invalid decision code");
    }
    if (
      (state === "pending" && (reviewerActorId !== null || decisionCode !== null)) ||
      (state === "accepted" &&
        (reviewerActorId === null || decisionCode !== "meets-criteria")) ||
      (state === "changes-requested" &&
        (reviewerActorId === null || decisionCode !== "revision-needed"))
    ) {
      throw new Error("evidence review state does not match its decision fields");
    }
    const evidenceId = assertOpaqueIdentifier(candidate.evidenceId, "evidence");
    if (evidenceIds.has(evidenceId)) {
      throw new Error("cohort contains a duplicate evidence review");
    }
    evidenceIds.add(evidenceId);
    const assignment = assignmentsById.get(assignmentId);
    if (assignment === undefined) {
      throw new Error("evidence review references an unknown assignment");
    }
    const updatedAt = assertIsoTimestamp(candidate.updatedAt, "evidence review updatedAt");
    if (updatedAt < assignment.assignedAt) {
      throw new Error("evidence review updatedAt must not precede assignment");
    }
    evidenceReviews.push({
      evidenceId,
      assignmentId,
      subjectActorId,
      state,
      reviewerActorId,
      decisionCode,
      updatedAt
    });
  }

  return {
    schemaVersion: COHORT_SCHEMA_VERSION,
    dataClassification: root.dataClassification,
    cohort,
    memberships: memberships.sort((left, right) =>
      compareCanonicalText(left.actorId, right.actorId)
    ),
    assignments: assignments.sort((left, right) =>
      compareCanonicalText(left.id, right.id)
    ),
    completions: completions.sort((left, right) =>
      compareCanonicalText(
        `${left.assignmentId}|${left.actorId}`,
        `${right.assignmentId}|${right.actorId}`
      )
    ),
    evidenceReviews: evidenceReviews.sort((left, right) =>
      compareCanonicalText(left.evidenceId, right.evidenceId)
    )
  };
}

export function aggregateCohortProgress(
  snapshotValue: CohortSnapshot,
  assignmentIdValue: AssignmentId,
  minimumGroupSize = SMALL_GROUP_SUPPRESSION_MINIMUM
): PrivacySafeProgressAggregate {
  const snapshot = validateCohortSnapshot(snapshotValue);
  const assignmentId = assertOpaqueIdentifier(assignmentIdValue, "assignment");
  const assignment = snapshot.assignments.find((item) => item.id === assignmentId);
  if (assignment === undefined) throw new Error("assignment is not in the cohort");
  assertSafeInteger(
    minimumGroupSize,
    "minimum group size",
    SMALL_GROUP_SUPPRESSION_MINIMUM,
    100
  );

  const learnerIds = snapshot.memberships
    .filter((membership) => membership.role === "learner")
    .map((membership) => membership.actorId);
  if (learnerIds.length < minimumGroupSize) {
    return {
      status: "suppressed",
      assignmentId,
      minimumGroupSize,
      reason: "group-below-privacy-threshold"
    };
  }

  const completions = new Map(
    snapshot.completions
      .filter((item) => item.assignmentId === assignmentId)
      .map((item) => [item.actorId, item])
  );
  let completeCount = 0;
  let inProgressCount = 0;
  let completedItems = 0;
  for (const learnerId of learnerIds) {
    const completion = completions.get(learnerId);
    if (completion?.state === "complete") completeCount += 1;
    if (completion?.state === "in-progress") inProgressCount += 1;
    completedItems += completion?.completedItems ?? 0;
  }
  const notStartedCount = learnerIds.length - completeCount - inProgressCount;

  let acceptedEvidenceCount = 0;
  let changesRequestedEvidenceCount = 0;
  let pendingEvidenceCount = 0;
  for (const review of snapshot.evidenceReviews) {
    if (review.assignmentId !== assignmentId) continue;
    if (review.state === "accepted") acceptedEvidenceCount += 1;
    if (review.state === "changes-requested") changesRequestedEvidenceCount += 1;
    if (review.state === "pending") pendingEvidenceCount += 1;
  }

  return {
    status: "released",
    assignmentId,
    minimumGroupSize,
    participantCount: learnerIds.length,
    completeCount,
    inProgressCount,
    notStartedCount,
    completionRate: completeCount / learnerIds.length,
    meanProgress: completedItems / (learnerIds.length * assignment.requiredItems),
    acceptedEvidenceCount,
    changesRequestedEvidenceCount,
    pendingEvidenceCount
  };
}

const SYNTHETIC_TOKENS = [
  "aaaaaaaaaaaaaaab",
  "aaaaaaaaaaaaaaac",
  "aaaaaaaaaaaaaaad",
  "aaaaaaaaaaaaaaae",
  "aaaaaaaaaaaaaaaf",
  "aaaaaaaaaaaaaaag",
  "aaaaaaaaaaaaaaah",
  "aaaaaaaaaaaaaaai",
  "aaaaaaaaaaaaaaaj",
  "aaaaaaaaaaaaaaak",
  "aaaaaaaaaaaaaaal",
  "aaaaaaaaaaaaaaam"
] as const;

export function createSyntheticCohortFixture(learnerCount = 5): CohortSnapshot {
  assertSafeInteger(learnerCount, "synthetic learner count", 1, 10);
  const cohortId = assertOpaqueIdentifier("cohort:aaaaaaaaaaaaaaab", "cohort");
  const assignmentId = assertOpaqueIdentifier(
    "assignment:aaaaaaaaaaaaaaab",
    "assignment"
  );
  const educatorId = assertOpaqueIdentifier("actor:aaaaaaaaaaaaaaab", "actor");
  const reviewerId = assertOpaqueIdentifier("actor:aaaaaaaaaaaaaaac", "actor");
  const learnerIds = SYNTHETIC_TOKENS
    .slice(2, learnerCount + 2)
    .map((token) => assertOpaqueIdentifier(`actor:${token}`, "actor"));
  const timestamp = "2026-01-01T00:00:00.000Z";

  return validateCohortSnapshot({
    schemaVersion: COHORT_SCHEMA_VERSION,
    dataClassification: "synthetic-fixture",
    cohort: { id: cohortId, createdAt: timestamp },
    memberships: [
      { cohortId, actorId: educatorId, role: "educator", joinedAt: timestamp },
      { cohortId, actorId: reviewerId, role: "reviewer", joinedAt: timestamp },
      ...learnerIds.map((actorId) => ({
        cohortId,
        actorId,
        role: "learner" as const,
        joinedAt: timestamp
      }))
    ],
    assignments: [
      {
        id: assignmentId,
        cohortId,
        contentId: assertOpaqueIdentifier("content:aaaaaaaaaaaaaaab", "content"),
        title: "Synthetic motor-sizing evidence review",
        requiredItems: 4,
        assignedAt: timestamp,
        dueAt: "2026-01-15T00:00:00.000Z"
      }
    ],
    completions: learnerIds.map((actorId, index) => {
      const completedItems = index === 0 ? 4 : index === 1 ? 2 : 0;
      return {
        assignmentId,
        actorId,
        state: index === 0
          ? "complete" as const
          : index === 1
            ? "in-progress" as const
            : "not-started" as const,
        completedItems,
        totalItems: 4,
        updatedAt: timestamp
      };
    }),
    evidenceReviews: learnerIds.map((subjectActorId, index) => ({
      evidenceId: assertOpaqueIdentifier(`evidence:${SYNTHETIC_TOKENS[index + 2]}`, "evidence"),
      assignmentId,
      subjectActorId,
      state: index === 0
        ? "accepted" as const
        : index === 1
          ? "changes-requested" as const
          : "pending" as const,
      reviewerActorId: index < 2 ? reviewerId : null,
      decisionCode: index === 0
        ? "meets-criteria" as const
        : index === 1
          ? "revision-needed" as const
          : null,
      updatedAt: timestamp
    }))
  });
}
