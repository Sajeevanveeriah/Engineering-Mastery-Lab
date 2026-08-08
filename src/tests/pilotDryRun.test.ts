import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertSyntheticPilotDryRunResult,
  createSyntheticCohortFixture,
  formatSyntheticPilotDryRunSummary,
  runSyntheticPilotDryRun,
  validateCohortSnapshot
} from "../lib/ecosystem";
import { noOpProductEventProvider } from "../lib/providers";

describe("paid-pilot synthetic cohort dry run", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("is byte-repeatable for deterministic fixed inputs and timestamps", () => {
    expect(runSyntheticPilotDryRun).toHaveLength(0);
    expect(JSON.stringify(runSyntheticPilotDryRun())).toBe(
      JSON.stringify(runSyntheticPilotDryRun())
    );
  });

  it("retains the exact five-learner aggregate and maximum boundary", () => {
    const result = runSyntheticPilotDryRun();
    expect(result.scenarios[0].aggregate).toMatchObject({
      status: "released",
      participantCount: 5,
      completeCount: 1,
      inProgressCount: 1,
      notStartedCount: 3,
      completionRate: 0.2,
      meanProgress: 0.3
    });
    expect(result.scenarios[2].aggregate).toMatchObject({
      status: "released",
      participantCount: 10,
      completeCount: 1,
      inProgressCount: 1,
      notStartedCount: 8,
      completionRate: 0.1,
      meanProgress: 0.15
    });
  });

  it("suppresses the four-learner aggregate without participant or outcome counts", () => {
    const aggregate = runSyntheticPilotDryRun().scenarios[1].aggregate;
    expect(aggregate).toMatchObject({
      status: "suppressed",
      minimumGroupSize: 5,
      reason: "group-below-privacy-threshold"
    });
    expect(aggregate).not.toHaveProperty("participantCount");
    expect(aggregate).not.toHaveProperty("completeCount");
    expect(aggregate).not.toHaveProperty("completionRate");
    expect(aggregate).not.toHaveProperty("meanProgress");
  });

  it("releases no actor identifiers or personal-looking fields", () => {
    const result = runSyntheticPilotDryRun();
    expect(JSON.stringify(result)).not.toMatch(/actor:|@|"(?:name|email|phone|address)"/i);
    for (const personalField of [
      "name",
      "fullName",
      "mobile",
      "dateOfBirth",
      "organisation",
      "participantIds"
    ]) {
      const candidate = structuredClone(result) as typeof result & Record<string, unknown>;
      candidate[personalField] = "not-collected";
      expect(() => assertSyntheticPilotDryRunResult(candidate))
        .toThrow(/pilot dry-run result keys invariant failed/);
    }
    const nestedCandidate = structuredClone(result);
    const scenario = nestedCandidate.scenarios[0] as typeof nestedCandidate.scenarios[number] & Record<string, unknown>;
    scenario.participantIds = ["learner-001"];
    expect(() => assertSyntheticPilotDryRunResult(nestedCandidate))
      .toThrow(/scenario .* keys invariant failed/);

    for (const [scenarioIndex, expectedDiagnostic] of [
      [0, /five-learner aggregate invariant failed/],
      [1, /four-learner suppression invariant failed/],
      [2, /ten-learner aggregate invariant failed/]
    ] as const) {
      const assignmentCandidate = structuredClone(result);
      const aggregate = assignmentCandidate.scenarios[scenarioIndex]
        .aggregate as unknown as { assignmentId: string };
      aggregate.assignmentId = "Example Learner Name";
      expect(() => assertSyntheticPilotDryRunResult(assignmentCandidate))
        .toThrow(expectedDiagnostic);
    }

    const fixture = createSyntheticCohortFixture();
    expect(fixture.assignments[0]?.title).toBe("Synthetic motor-sizing evidence review");
    const membership = fixture.memberships[0] as unknown as Record<string, unknown>;
    membership.fullName = "not-collected";
    expect(() => validateCohortSnapshot(fixture)).toThrow(/unsupported field/);
  });

  it("keeps hosted capabilities unavailable in the pure runner", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const eventSpy = vi.spyOn(noOpProductEventProvider, "record");
    const result = runSyntheticPilotDryRun();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(eventSpy).not.toHaveBeenCalled();
    expect(result.executionBoundary).toEqual({
      networkRequests: 0,
      telemetryEvents: 0,
      accountsCreated: 0,
      billingConnections: 0,
      hostedProvidersConnected: 0
    });
    for (const capability of result.hostedCapabilities) {
      expect(capability).toMatchObject({
        status: "unavailable",
        executionBoundary: "none",
        networkAccess: false,
        hostedService: false,
        dataUse: "none"
      });
    }
  });

  it("rejects a deliberately corrupted aggregate through the production validator", () => {
    const result = structuredClone(runSyntheticPilotDryRun());
    const scenario = result.scenarios.find(
      ({ id }) => id === "standard-five-learner-release"
    );
    if (scenario?.aggregate.status !== "released") {
      throw new Error("five-learner scenario fixture missing");
    }
    scenario.aggregate.completionRate = 0.4;
    expect(() => assertSyntheticPilotDryRunResult(result))
      .toThrow(/five-learner aggregate invariant failed/);
  });

  it("provides a complete accessible text summary matching all three scenarios", () => {
    const summary = formatSyntheticPilotDryRunSummary(runSyntheticPilotDryRun());
    expect(summary).toContain("Synthetic pilot dry run: PASS");
    expect(summary).toContain("Five learners: thresholded aggregate released");
    expect(summary).toContain("1 complete, 1 in progress, 3 not started");
    expect(summary).toContain("evidence accepted 1, changes requested 1, pending 3");
    expect(summary).toContain("Four learners: aggregate suppressed");
    expect(summary).toContain("Ten learners: thresholded aggregate released");
    expect(summary).toContain("1 complete, 1 in progress, 8 not started");
    expect(summary).toContain("billing=unavailable");
    expect(summary).toContain("telemetry=unavailable");
    expect(summary).toContain("network requests 0; telemetry events 0");
  });
});
