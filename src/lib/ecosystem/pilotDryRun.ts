import {
  SMALL_GROUP_SUPPRESSION_MINIMUM,
  aggregateCohortProgress,
  createSyntheticCohortFixture,
  type PrivacySafeProgressAggregate
} from "./cohorts";
import { hostedCapabilityStates, type ProviderCapabilityState } from "./providers";
import { compareCanonicalText } from "./validation";

export const PILOT_DRY_RUN_SCHEMA_VERSION = 1 as const;
export const PILOT_DRY_RUN_TIMESTAMP = "2026-01-16T00:00:00.000Z";

const PERSONAL_FIELD_PATTERN = /^(?:address|dateOfBirth|email|firstName|fullName|lastName|mobile|name|organisation|organization|participantIds?|phone|surname)$/i;
const ACTOR_IDENTIFIER_PATTERN = /actor:[a-z2-7]{16,32}/i;
const PILOT_SYNTHETIC_ASSIGNMENT_ID = "assignment:aaaaaaaaaaaaaaab";
const PILOT_SYNTHETIC_ASSIGNMENT_TITLE = "Synthetic motor-sizing evidence review";

export interface SyntheticPilotDryRunScenario {
  id: "standard-five-learner-release" | "below-threshold-four-learner-suppression" | "maximum-ten-learner-release";
  aggregate: PrivacySafeProgressAggregate;
}

export interface SyntheticPilotDryRunResult {
  schemaVersion: typeof PILOT_DRY_RUN_SCHEMA_VERSION;
  generatedAt: typeof PILOT_DRY_RUN_TIMESTAMP;
  dataClassification: "synthetic-fixture";
  executionBoundary: {
    networkRequests: 0;
    telemetryEvents: 0;
    accountsCreated: 0;
    billingConnections: 0;
    hostedProvidersConnected: 0;
  };
  hostedCapabilities: Array<Pick<
    ProviderCapabilityState,
    "id" | "status" | "executionBoundary" | "networkAccess" | "hostedService" | "dataUse"
  >>;
  scenarios: SyntheticPilotDryRunScenario[];
}

function assertExactValue(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} invariant failed`);
  }
}

function assertExactKeys(
  value: object,
  expectedKeys: readonly string[],
  label: string
): void {
  const actual = Object.keys(value).sort(compareCanonicalText);
  const expected = [...expectedKeys].sort(compareCanonicalText);
  assertExactValue(actual, expected, `${label} keys`);
}

function assertSuppressedAggregate(aggregate: PrivacySafeProgressAggregate): void {
  if (aggregate.status !== "suppressed") {
    throw new Error("four-learner aggregate must be suppressed");
  }
  assertExactValue(aggregate, {
    status: "suppressed",
    assignmentId: PILOT_SYNTHETIC_ASSIGNMENT_ID,
    minimumGroupSize: SMALL_GROUP_SUPPRESSION_MINIMUM,
    reason: "group-below-privacy-threshold"
  }, "four-learner suppression");
  for (const forbiddenField of [
    "participantCount",
    "completeCount",
    "inProgressCount",
    "notStartedCount",
    "completionRate",
    "meanProgress",
    "acceptedEvidenceCount",
    "changesRequestedEvidenceCount",
    "pendingEvidenceCount"
  ]) {
    if (forbiddenField in aggregate) {
      throw new Error(`suppressed aggregate exposed ${forbiddenField}`);
    }
  }
}

function assertPilotDryRunPublicPayload(value: unknown): void {
  const visit = (candidate: unknown): void => {
    if (typeof candidate === "string") {
      if (candidate.includes("@") || ACTOR_IDENTIFIER_PATTERN.test(candidate)) {
        throw new Error("pilot dry-run output contains personal-looking or actor data");
      }
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (candidate === null || typeof candidate !== "object") return;
    for (const [key, nested] of Object.entries(candidate)) {
      if (PERSONAL_FIELD_PATTERN.test(key)) {
        throw new Error(`pilot dry-run output contains unsupported personal field ${key}`);
      }
      visit(nested);
    }
  };
  visit(value);
}

function assertPilotSyntheticFixture(
  fixture: ReturnType<typeof createSyntheticCohortFixture>,
  expectedLearnerCount: number
): void {
  assertExactValue(fixture.dataClassification, "synthetic-fixture", "fixture data classification");
  assertExactValue(fixture.assignments.length, 1, "fixture assignment count");
  assertExactValue(
    fixture.assignments[0]?.id,
    PILOT_SYNTHETIC_ASSIGNMENT_ID,
    "fixture assignment id"
  );
  assertExactValue(
    fixture.assignments[0]?.title,
    PILOT_SYNTHETIC_ASSIGNMENT_TITLE,
    "fixture assignment title"
  );
  assertExactValue(
    fixture.memberships.filter(({ role }) => role === "learner").length,
    expectedLearnerCount,
    "fixture learner count"
  );
}

function scenarioById(
  result: SyntheticPilotDryRunResult,
  id: SyntheticPilotDryRunScenario["id"]
): SyntheticPilotDryRunScenario {
  const matches = result.scenarios.filter((scenario) => scenario.id === id);
  if (matches.length !== 1) {
    throw new Error(`pilot dry-run requires exactly one ${id} scenario`);
  }
  return matches[0];
}

export function assertSyntheticPilotDryRunResult(
  result: SyntheticPilotDryRunResult
): void {
  assertExactKeys(result, [
    "dataClassification",
    "executionBoundary",
    "generatedAt",
    "hostedCapabilities",
    "scenarios",
    "schemaVersion"
  ], "pilot dry-run result");
  assertExactValue(result.schemaVersion, PILOT_DRY_RUN_SCHEMA_VERSION, "schema version");
  assertExactValue(result.generatedAt, PILOT_DRY_RUN_TIMESTAMP, "fixed timestamp");
  assertExactValue(result.dataClassification, "synthetic-fixture", "data classification");
  assertExactValue(result.executionBoundary, {
    networkRequests: 0,
    telemetryEvents: 0,
    accountsCreated: 0,
    billingConnections: 0,
    hostedProvidersConnected: 0
  }, "execution boundary");
  assertExactValue(result.scenarios.length, 3, "scenario count");
  for (const scenario of result.scenarios) {
    assertExactKeys(scenario, ["aggregate", "id"], `scenario ${scenario.id}`);
  }

  const fiveLearnerAggregate = scenarioById(
    result,
    "standard-five-learner-release"
  ).aggregate;
  const fourLearnerAggregate = scenarioById(
    result,
    "below-threshold-four-learner-suppression"
  ).aggregate;
  const tenLearnerAggregate = scenarioById(
    result,
    "maximum-ten-learner-release"
  ).aggregate;

  if (fiveLearnerAggregate.status !== "released") {
    throw new Error("five-learner aggregate must be released");
  }
  assertExactValue(fiveLearnerAggregate, {
    status: "released",
    assignmentId: PILOT_SYNTHETIC_ASSIGNMENT_ID,
    minimumGroupSize: SMALL_GROUP_SUPPRESSION_MINIMUM,
    participantCount: 5,
    completeCount: 1,
    inProgressCount: 1,
    notStartedCount: 3,
    completionRate: 0.2,
    meanProgress: 0.3,
    acceptedEvidenceCount: 1,
    changesRequestedEvidenceCount: 1,
    pendingEvidenceCount: 3
  }, "five-learner aggregate");
  assertSuppressedAggregate(fourLearnerAggregate);
  if (tenLearnerAggregate.status !== "released") {
    throw new Error("ten-learner aggregate must be released");
  }
  assertExactValue(tenLearnerAggregate, {
    status: "released",
    assignmentId: PILOT_SYNTHETIC_ASSIGNMENT_ID,
    minimumGroupSize: SMALL_GROUP_SUPPRESSION_MINIMUM,
    participantCount: 10,
    completeCount: 1,
    inProgressCount: 1,
    notStartedCount: 8,
    completionRate: 0.1,
    meanProgress: 0.15,
    acceptedEvidenceCount: 1,
    changesRequestedEvidenceCount: 1,
    pendingEvidenceCount: 8
  }, "ten-learner aggregate");

  const expectedCapabilities = Object.values(hostedCapabilityStates)
    .map(({ id, status, executionBoundary, networkAccess, hostedService, dataUse }) => ({
      id,
      status,
      executionBoundary,
      networkAccess,
      hostedService,
      dataUse
    }))
    .sort((left, right) => compareCanonicalText(left.id, right.id));
  assertExactValue(result.hostedCapabilities, expectedCapabilities, "hosted capabilities");
  for (const capability of result.hostedCapabilities) {
    if (
      capability.status !== "unavailable" ||
      capability.executionBoundary !== "none" ||
      capability.networkAccess ||
      capability.hostedService ||
      capability.dataUse !== "none"
    ) {
      throw new Error(`hosted capability ${capability.id} must remain unavailable`);
    }
  }
  assertPilotDryRunPublicPayload(result);
}

export function runSyntheticPilotDryRun(): SyntheticPilotDryRunResult {
  const fiveLearnerFixture = createSyntheticCohortFixture(5);
  const fourLearnerFixture = createSyntheticCohortFixture(4);
  const tenLearnerFixture = createSyntheticCohortFixture(10);
  assertPilotSyntheticFixture(fiveLearnerFixture, 5);
  assertPilotSyntheticFixture(fourLearnerFixture, 4);
  assertPilotSyntheticFixture(tenLearnerFixture, 10);

  const fiveLearnerAggregate = aggregateCohortProgress(
    fiveLearnerFixture,
    fiveLearnerFixture.assignments[0].id
  );
  const fourLearnerAggregate = aggregateCohortProgress(
    fourLearnerFixture,
    fourLearnerFixture.assignments[0].id
  );
  const tenLearnerAggregate = aggregateCohortProgress(
    tenLearnerFixture,
    tenLearnerFixture.assignments[0].id
  );

  const capabilities = Object.values(hostedCapabilityStates)
    .map(({ id, status, executionBoundary, networkAccess, hostedService, dataUse }) => ({
      id,
      status,
      executionBoundary,
      networkAccess,
      hostedService,
      dataUse
    }))
    .sort((left, right) => compareCanonicalText(left.id, right.id));
  const result: SyntheticPilotDryRunResult = {
    schemaVersion: PILOT_DRY_RUN_SCHEMA_VERSION,
    generatedAt: PILOT_DRY_RUN_TIMESTAMP,
    dataClassification: "synthetic-fixture",
    executionBoundary: {
      networkRequests: 0,
      telemetryEvents: 0,
      accountsCreated: 0,
      billingConnections: 0,
      hostedProvidersConnected: 0
    },
    hostedCapabilities: capabilities,
    scenarios: [
      { id: "standard-five-learner-release", aggregate: fiveLearnerAggregate },
      { id: "below-threshold-four-learner-suppression", aggregate: fourLearnerAggregate },
      { id: "maximum-ten-learner-release", aggregate: tenLearnerAggregate }
    ]
  };
  assertSyntheticPilotDryRunResult(result);
  return result;
}

export function formatSyntheticPilotDryRunSummary(
  result: SyntheticPilotDryRunResult
): string {
  assertSyntheticPilotDryRunResult(result);
  const five = scenarioById(result, "standard-five-learner-release");
  const four = scenarioById(result, "below-threshold-four-learner-suppression");
  const ten = scenarioById(result, "maximum-ten-learner-release");
  if (five.aggregate.status !== "released" || four.aggregate.status !== "suppressed" || ten.aggregate.status !== "released") {
    throw new Error("pilot dry-run summary received unexpected scenario states");
  }
  const capabilities = result.hostedCapabilities
    .map((capability) => `${capability.id}=${capability.status}`)
    .join(", ");
  const boundary = result.executionBoundary;
  return [
    "Synthetic pilot dry run: PASS",
    `Schema version: ${result.schemaVersion}`,
    `Fixed timestamp: ${result.generatedAt}`,
    `Data classification: ${result.dataClassification}`,
    `Five learners: thresholded aggregate released at configured minimum ${five.aggregate.minimumGroupSize}; ${five.aggregate.participantCount} participants; ${five.aggregate.completeCount} complete, ${five.aggregate.inProgressCount} in progress, ${five.aggregate.notStartedCount} not started; completion rate ${five.aggregate.completionRate}; mean progress ${five.aggregate.meanProgress}; evidence accepted ${five.aggregate.acceptedEvidenceCount}, changes requested ${five.aggregate.changesRequestedEvidenceCount}, pending ${five.aggregate.pendingEvidenceCount}.`,
    `Four learners: aggregate suppressed below configured minimum ${four.aggregate.minimumGroupSize}; participant and outcome counts withheld; reason ${four.aggregate.reason}.`,
    `Ten learners: thresholded aggregate released at configured minimum ${ten.aggregate.minimumGroupSize}; ${ten.aggregate.participantCount} participants; ${ten.aggregate.completeCount} complete, ${ten.aggregate.inProgressCount} in progress, ${ten.aggregate.notStartedCount} not started; completion rate ${ten.aggregate.completionRate}; mean progress ${ten.aggregate.meanProgress}; evidence accepted ${ten.aggregate.acceptedEvidenceCount}, changes requested ${ten.aggregate.changesRequestedEvidenceCount}, pending ${ten.aggregate.pendingEvidenceCount}.`,
    `Hosted capabilities: ${capabilities}.`,
    `Observed during the instrumented command: network requests ${boundary.networkRequests}; telemetry events ${boundary.telemetryEvents}; accounts created ${boundary.accountsCreated}; billing connections ${boundary.billingConnections}; hosted providers connected ${boundary.hostedProvidersConnected}.`
  ].join("\n");
}
