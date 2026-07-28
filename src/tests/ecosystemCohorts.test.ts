import { describe, expect, it } from "vitest";
import {
  SMALL_GROUP_SUPPRESSION_MINIMUM,
  aggregateCohortProgress,
  createSyntheticCohortFixture,
  validateCohortSnapshot
} from "../lib/ecosystem";

describe("ecosystem cohort and analytics foundations", () => {
  it("builds deterministic synthetic fixtures without personal profile fields", () => {
    const first = createSyntheticCohortFixture();
    const second = createSyntheticCohortFixture();
    expect(first).toEqual(second);
    expect(first.dataClassification).toBe("synthetic-fixture");
    expect(first.memberships.filter((item) => item.role === "learner")).toHaveLength(5);
    expect(first.memberships.some((item) => item.role === "educator")).toBe(true);
    expect(first.memberships.some((item) => item.role === "reviewer")).toBe(true);

    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain("@");
    expect(serialized).not.toMatch(/"name"|"email"|"phone"|"address"/i);
    for (const membership of first.memberships) {
      expect(membership.actorId).toMatch(/^actor:[a-z2-7]{16,32}$/);
    }
  });

  it("releases only aggregate progress at or above the privacy threshold", () => {
    const fixture = createSyntheticCohortFixture(5);
    const assignmentId = fixture.assignments[0].id;
    const aggregate = aggregateCohortProgress(fixture, assignmentId);
    expect(aggregate).toEqual({
      status: "released",
      assignmentId,
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
    });
    expect(JSON.stringify(aggregate)).not.toContain("actor:");
  });

  it("suppresses small-group counts without disclosing the actual group size", () => {
    const fixture = createSyntheticCohortFixture(4);
    const assignmentId = fixture.assignments[0].id;
    const aggregate = aggregateCohortProgress(fixture, assignmentId);
    expect(aggregate).toEqual({
      status: "suppressed",
      assignmentId,
      minimumGroupSize: SMALL_GROUP_SUPPRESSION_MINIMUM,
      reason: "group-below-privacy-threshold"
    });
    expect(aggregate).not.toHaveProperty("participantCount");
    expect(aggregate).not.toHaveProperty("completeCount");
    expect(JSON.stringify(aggregate)).not.toContain("actor:");
  });

  it("treats learners without completion records as not started", () => {
    const fixture = createSyntheticCohortFixture(5);
    fixture.completions = fixture.completions.slice(0, 2);
    const aggregate = aggregateCohortProgress(
      fixture,
      fixture.assignments[0].id
    );
    expect(aggregate.status).toBe("released");
    if (aggregate.status !== "released") throw new Error("expected released aggregate");
    expect(aggregate.notStartedCount).toBe(3);
    expect(aggregate.meanProgress).toBe(0.3);
  });

  it("rejects inconsistent roles, completion counts, review decisions, and thresholds", () => {
    const nonLearnerCompletion = createSyntheticCohortFixture();
    nonLearnerCompletion.completions[0].actorId =
      nonLearnerCompletion.memberships.find((item) => item.role === "educator")!.actorId;
    expect(() => validateCohortSnapshot(nonLearnerCompletion)).toThrow(/learner/);

    const inconsistentCompletion = createSyntheticCohortFixture();
    inconsistentCompletion.completions[0].state = "complete";
    inconsistentCompletion.completions[0].completedItems = 3;
    expect(() => validateCohortSnapshot(inconsistentCompletion)).toThrow(
      /state does not match/
    );

    const inconsistentReview = createSyntheticCohortFixture();
    inconsistentReview.evidenceReviews[0].decisionCode = "revision-needed";
    expect(() => validateCohortSnapshot(inconsistentReview)).toThrow(
      /state does not match/
    );

    const fixture = createSyntheticCohortFixture();
    expect(() =>
      aggregateCohortProgress(fixture, fixture.assignments[0].id, 2)
    ).toThrow(/minimum group size/);
  });

  it("rejects unsafe nested keys before processing a cohort fixture", () => {
    const fixture = createSyntheticCohortFixture();
    const withProfileField = structuredClone(fixture) as unknown as {
      memberships: Array<Record<string, unknown>>;
    };
    withProfileField.memberships[0].email = "not-collected";
    expect(() => validateCohortSnapshot(withProfileField)).toThrow(
      /unsupported field/
    );

    const unsafe = JSON.parse(
      JSON.stringify(fixture).replace(
        '"cohort":{',
        '"cohort":{"__proto__":{"polluted":true},'
      )
    ) as unknown;
    expect(() => validateCohortSnapshot(unsafe)).toThrow(/unsafe key/);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});
