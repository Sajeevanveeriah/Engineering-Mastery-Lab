import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  academyFormulaTemplates
} from "../data/academy/authoring";
import {
  quantitativeLessonFormulaAssignments,
  quantitativeFormulaSequenceByUnit,
  workedExampleVerificationFamilies,
  workedExampleVerificationInstances,
  workedExampleVerificationQualityManifest
} from "../data/academy/workedExampleVerificationCases";
import {
  EXPECTED_QUANTITATIVE_LESSON_COUNT,
  EXPECTED_WORKED_EXAMPLE_CASE_COUNT,
  EXPECTED_WORKED_EXAMPLE_FAMILY_COUNT,
  EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT,
  EXPECTED_WORKED_EXAMPLE_TYPED_DISPLAY_CLAIM_COUNT,
  buildWorkedExampleTypedClaimSources,
  buildWorkedExampleVerificationQualityManifest,
  evaluateIndependentWorkedExampleOracle,
  extractWorkedExampleNumericDisplayClaims,
  fingerprintWorkedExampleNumericDisplayClaims,
  fingerprintWorkedExampleDisplaySource,
  fingerprintWorkedExampleTypedDisplayClaims,
  independentWorkedExampleOracleUnitContracts,
  independentWorkedExampleOracles,
  resolveWorkedExampleTypedDisplayClaims,
  validateWorkedExampleDisplayBindings,
  validateWorkedExampleProductionBindings,
  validateWorkedExampleVerification,
  type IndependentWorkedExampleCase,
  type QuantitativeLessonFormulaAssignment,
  type WorkedExampleDisplaySource,
  type WorkedExampleFamilyRegistry,
  type WorkedExampleFamilyVerification,
  type WorkedExampleInput,
  type WorkedExampleOutputAssertion,
  type WorkedExampleTypedClaimBinding,
  type WorkedExampleTypedClaimSource
} from "../lib/academy/workedExampleVerification";
import {
  buildAcademyFormulaManifest,
  loadAllAcademyStages
} from "../lib/academy/curriculum";

type MutableWorkedExampleCase = Omit<
  IndependentWorkedExampleCase,
  | "inputs"
  | "assertions"
  | "displayTypedClaimBindings"
  | "displayUnitImplicitClaimIds"
> & {
  inputs: Record<string, WorkedExampleInput>;
  assertions: WorkedExampleOutputAssertion[];
  displayTypedClaimBindings: WorkedExampleTypedClaimBinding[];
  displayUnitImplicitClaimIds: string[];
};

type MutableWorkedExampleFamily = Omit<
  WorkedExampleFamilyVerification,
  "cases"
> & {
  cases: MutableWorkedExampleCase[];
};

type MutableWorkedExampleRegistry = Record<
  string,
  MutableWorkedExampleFamily
>;

type MutableDisplaySource = Omit<WorkedExampleDisplaySource, "steps"> & {
  steps: string[];
};

type MutableDisplayRegistry = Record<string, MutableDisplaySource[]>;

type MutableTypedClaimSource = Omit<
  WorkedExampleTypedClaimSource,
  "dependencyIds" | "claimIds" | "acceptedDisplayUnits"
> & {
  dependencyIds: string[];
  claimIds: string[];
  acceptedDisplayUnits: string[];
};

const displayedFormulaExamples = Object.fromEntries(
  Object.entries(academyFormulaTemplates).map(([familyId, template]) => [
    familyId,
    template.examples.map((example) => ({
      problem: example.problem,
      steps: example.steps,
      result: example.result,
      independentCheck: example.independentCheck
    }))
  ])
);

const cloneFamilies = (): MutableWorkedExampleRegistry =>
  structuredClone(workedExampleVerificationFamilies) as unknown as
    MutableWorkedExampleRegistry;

const cloneAssignments = (): QuantitativeLessonFormulaAssignment[] =>
  structuredClone(quantitativeLessonFormulaAssignments);

const cloneDisplays = (): MutableDisplayRegistry =>
  structuredClone(displayedFormulaExamples);

const cloneTypedSources = (
  verificationCase: IndependentWorkedExampleCase
): MutableTypedClaimSource[] =>
  structuredClone(
    buildWorkedExampleTypedClaimSources(verificationCase)
  ) as MutableTypedClaimSource[];

const syncDisplayDerivedContracts = (
  verificationCase: MutableWorkedExampleCase,
  displaySource: WorkedExampleDisplaySource
): void => {
  verificationCase.displayFingerprint =
    fingerprintWorkedExampleDisplaySource(displaySource);
  verificationCase.displayNumericClaimCount =
    extractWorkedExampleNumericDisplayClaims(displaySource).length;
  verificationCase.displayNumericClaimsFingerprint =
    fingerprintWorkedExampleNumericDisplayClaims(displaySource);
};

const coreIssueCodes = (
  families: MutableWorkedExampleRegistry = cloneFamilies(),
  assignments: readonly QuantitativeLessonFormulaAssignment[] =
    cloneAssignments()
): string[] =>
  validateWorkedExampleVerification(
    families as unknown as WorkedExampleFamilyRegistry,
    assignments
  ).map((verificationIssue) => verificationIssue.code);

const stages = await loadAllAcademyStages();
const productionWorkedExamples = stages
  .flatMap((stage) => stage.lessons)
  .flatMap((lesson) =>
    lesson.blocks.flatMap((block) =>
      block.kind === "worked-example" ? [block.example] : []
    )
  );

describe("Academy exact displayed worked-example verification", () => {
  it("covers all exact template cases, lessons and worked-example instances", () => {
    expect(validateWorkedExampleVerification(
      workedExampleVerificationFamilies,
      quantitativeLessonFormulaAssignments
    )).toEqual([]);
    expect(validateWorkedExampleDisplayBindings(
      workedExampleVerificationFamilies,
      displayedFormulaExamples
    )).toEqual([]);

    const allCases = Object.values(workedExampleVerificationFamilies).flatMap(
      (family) => family.cases
    );
    expect(Object.keys(workedExampleVerificationFamilies))
      .toHaveLength(EXPECTED_WORKED_EXAMPLE_FAMILY_COUNT);
    expect(Object.keys(academyFormulaTemplates))
      .toHaveLength(EXPECTED_WORKED_EXAMPLE_FAMILY_COUNT);
    expect(allCases).toHaveLength(EXPECTED_WORKED_EXAMPLE_CASE_COUNT);
    expect(Object.keys(independentWorkedExampleOracles))
      .toHaveLength(EXPECTED_WORKED_EXAMPLE_CASE_COUNT);
    expect(Object.keys(independentWorkedExampleOracleUnitContracts))
      .toHaveLength(EXPECTED_WORKED_EXAMPLE_CASE_COUNT);
    expect(quantitativeLessonFormulaAssignments)
      .toHaveLength(EXPECTED_QUANTITATIVE_LESSON_COUNT);
    expect(workedExampleVerificationInstances)
      .toHaveLength(EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT);
    expect(quantitativeFormulaSequenceByUnit["EML-E0-D02"][3])
      .toBe("stress");
    expect(quantitativeLessonFormulaAssignments).toContainEqual(
      expect.objectContaining({
        lessonId: "EML-E0-D02-L04",
        familyId: "stress"
      })
    );
  });

  it("binds all 1,136 visible numeric claims to independent typed sources", () => {
    let visibleClaimCount = 0;
    const resolvedKinds = new Set<string>();
    const justifiedInputOmissions: string[] = [];

    for (const family of Object.values(workedExampleVerificationFamilies)) {
      for (const verificationCase of family.cases) {
        const displaySource = displayedFormulaExamples[
          verificationCase.familyId
        ][verificationCase.sourceExampleIndex - 1];
        const numericClaims =
          extractWorkedExampleNumericDisplayClaims(displaySource);
        const resolution = resolveWorkedExampleTypedDisplayClaims(
          verificationCase,
          displaySource
        );
        expect(resolution.issues, verificationCase.id).toEqual([]);
        expect(resolution.claims, verificationCase.id)
          .toHaveLength(numericClaims.length);
        expect(verificationCase.displayNumericClaimCount)
          .toBe(numericClaims.length);
        expect(verificationCase.displayTypedClaimCount)
          .toBe(numericClaims.length);
        expect(
          fingerprintWorkedExampleNumericDisplayClaims(displaySource)
        ).toBe(verificationCase.displayNumericClaimsFingerprint);
        expect(
          fingerprintWorkedExampleTypedDisplayClaims(resolution.claims)
        ).toBe(verificationCase.displayTypedClaimsFingerprint);
        expect(
          resolution.claims.map((claim) => claim.claimId)
        ).toEqual(numericClaims.map((claim) => claim.claimId));
        expect(new Set(
          resolution.claims.map((claim) => claim.claimId)
        ).size).toBe(numericClaims.length);

        const sourceIds = new Set(
          resolution.sources.map((source) => source.sourceId)
        );
        for (const claim of resolution.claims) {
          resolvedKinds.add(claim.kind);
          expect(claim.sourceId.trim(), claim.claimId).not.toBe("");
          expect(claim.canonicalUnit.trim(), claim.claimId).not.toBe("");
          expect(Number.isFinite(claim.expectedValue), claim.claimId).toBe(true);
          expect(claim.absoluteTolerance, claim.claimId)
            .toBeGreaterThanOrEqual(0);
          expect(claim.relativeTolerance, claim.claimId)
            .toBeGreaterThanOrEqual(0);
          for (const dependencyId of claim.dependencyIds) {
            expect(sourceIds.has(dependencyId), claim.claimId).toBe(true);
          }
        }

        const resolvedSourceIds = new Set(
          resolution.claims.map((claim) => claim.sourceId)
        );
        for (const [inputId, inputDefinition] of Object.entries(
          verificationCase.inputs
        )) {
          if (inputDefinition.displayedValueRequired === false) {
            justifiedInputOmissions.push(
              `${verificationCase.id}:${inputId}:`
              + inputDefinition.displayOmissionReason
            );
          } else {
            expect(
              resolvedSourceIds.has(`input:${inputId}`),
              `${verificationCase.id}:${inputId}`
            ).toBe(true);
          }
        }
        visibleClaimCount += resolution.claims.length;
      }
    }

    expect(visibleClaimCount)
      .toBe(EXPECTED_WORKED_EXAMPLE_TYPED_DISPLAY_CLAIM_COUNT);
    expect([...resolvedKinds].sort()).toEqual([
      "check",
      "constant",
      "conversion",
      "input",
      "intermediate",
      "output"
    ]);
    expect(justifiedInputOmissions).toHaveLength(5);
    expect(justifiedInputOmissions.every((entry) =>
      !entry.endsWith(":undefined") && !entry.endsWith(":")
    )).toBe(true);
  });

  it("parses case-sensitive compound display units exactly", () => {
    const claims = extractWorkedExampleNumericDisplayClaims({
      problem: "Eigen expression uses 2 v.",
      steps: [
        "Voltage is 2 V.",
        "Gain is 3 V per rad/s.",
        "Thermal conductivity is 4 W/(m K).",
        "A timer supplies 5 cycles per millisecond.",
        "A gain of 6 percent per deg C is used.",
        "The radicand is 7 ohm squared.",
        "ADC substitution = (10 V)/(11 levels)."
      ],
      result: "Jacobian scale is 8 m/rad.",
      independentCheck: "Surface speed is 9 m/min."
    });

    expect(claims.map((claim) => [
      claim.rawNumber,
      claim.displayUnit
    ])).toEqual([
      ["2", ""],
      ["2", "V"],
      ["3", "V/(rad/s)"],
      ["4", "W/(m K)"],
      ["5", "cycles/ms"],
      ["6", "percent/deg C"],
      ["7", "ohm^2"],
      ["10", "V"],
      ["11", "levels"],
      ["8", "m/rad"],
      ["9", "m/min"]
    ]);
    expect(
      claims
        .filter((claim) => claim.rawNumber === "10" || claim.rawNumber === "11")
        .map((claim) => claim.relation)
    ).toEqual(["stated", "stated"]);
  });

  it("rejects substituted equal inputs and requires evaluated output occurrences", () => {
    const changedSharedInput = cloneFamilies().robot.cases[0];
    changedSharedInput.displayTypedClaimBindings[0].sourceId =
      "input:rightWheelSpeed";
    const sharedIssues = resolveWorkedExampleTypedDisplayClaims(
      changedSharedInput as unknown as IndependentWorkedExampleCase,
      displayedFormulaExamples.robot[0]
    ).issues.map((currentIssue) => currentIssue.code);
    expect(sharedIssues).toEqual(expect.arrayContaining([
      "typed-source-binding-disagreement",
      "invalid-shared-input-binding"
    ]));

    const changedEqualOutput = cloneFamilies().robot.cases[0];
    const linearOutputBinding =
      changedEqualOutput.displayTypedClaimBindings.find(
        (binding) => binding.claimId === "RESULT-NUMERIC-001"
      );
    if (!linearOutputBinding) {
      throw new Error("Expected robot linear-speed result binding.");
    }
    linearOutputBinding.sourceId = "input:rightWheelSpeed";
    const outputIssues = resolveWorkedExampleTypedDisplayClaims(
      changedEqualOutput as unknown as IndependentWorkedExampleCase,
      displayedFormulaExamples.robot[0]
    ).issues.map((currentIssue) => currentIssue.code);
    expect(outputIssues).toContain("missing-explicit-output-binding");

    const unequalSharedInputs = cloneFamilies().robot.cases[0];
    unequalSharedInputs.inputs.leftWheelSpeed.value = 0.5;
    expect(resolveWorkedExampleTypedDisplayClaims(
      unequalSharedInputs as unknown as IndependentWorkedExampleCase,
      displayedFormulaExamples.robot[0]
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "typed-claim-source-evaluation" })
    ]));
  });

  it("keeps equal-valued production claims bound to their semantic roles", () => {
    const sourceIdFor = (
      verificationCase: IndependentWorkedExampleCase,
      claimId: string
    ): string | undefined =>
      verificationCase.displayTypedClaimBindings.find(
        (binding) => binding.claimId === claimId
      )?.sourceId;

    expect(sourceIdFor(
      workedExampleVerificationFamilies.eigen.cases[0],
      "STEP-01-NUMERIC-001"
    )).toBe("intermediate:matrix-vector-first");
    expect(sourceIdFor(
      workedExampleVerificationFamilies.eigen.cases[0],
      "CHECK-NUMERIC-002"
    )).toBe("check:eigen-residual-first");
    expect(sourceIdFor(
      workedExampleVerificationFamilies.heatConduction.cases[0],
      "STEP-02-NUMERIC-001"
    )).toBe("input:conductivity");
    expect(sourceIdFor(
      workedExampleVerificationFamilies.neuron.cases[1],
      "STEP-02-NUMERIC-005"
    )).toBe("intermediate:bias-subtraction-magnitude");
    expect(sourceIdFor(
      workedExampleVerificationFamilies.extendedKalmanUpdate.cases[0],
      "PROBLEM-NUMERIC-008"
    )).toBe("constant:fourth-power-exponent");
    expect(sourceIdFor(
      workedExampleVerificationFamilies.extendedKalmanUpdate.cases[0],
      "STEP-02-NUMERIC-005"
    )).toBe("constant:square-exponent");
  });

  it("rejects duplicate, orphaned and cyclic typed source contracts", () => {
    const verificationCase = workedExampleVerificationFamilies.sum.cases[0];
    const displaySource = displayedFormulaExamples.sum[0];

    const duplicateSources = cloneTypedSources(verificationCase);
    duplicateSources.push(structuredClone(duplicateSources[0]));
    expect(resolveWorkedExampleTypedDisplayClaims(
      verificationCase,
      displaySource,
      duplicateSources
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "duplicate-typed-claim-source" })
    ]));

    const duplicateBinding = cloneFamilies().sum.cases[0];
    duplicateBinding.displayTypedClaimBindings.push(
      structuredClone(duplicateBinding.displayTypedClaimBindings[0])
    );
    expect(resolveWorkedExampleTypedDisplayClaims(
      duplicateBinding as unknown as IndependentWorkedExampleCase,
      displaySource
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "duplicate-typed-claim-binding" })
    ]));

    const orphanedBinding = cloneFamilies().sum.cases[0];
    orphanedBinding.displayTypedClaimBindings[0].sourceId =
      "input:missing";
    expect(resolveWorkedExampleTypedDisplayClaims(
      orphanedBinding as unknown as IndependentWorkedExampleCase,
      displaySource
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "orphan-typed-claim-source-binding"
      })
    ]));

    const orphanedClaim = cloneFamilies().sum.cases[0];
    orphanedClaim.displayTypedClaimBindings[0].claimId =
      "PROBLEM-NUMERIC-999";
    expect(resolveWorkedExampleTypedDisplayClaims(
      orphanedClaim as unknown as IndependentWorkedExampleCase,
      displaySource
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "orphan-typed-claim-binding" }),
      expect.objectContaining({ code: "missing-typed-claim-binding" })
    ]));

    const cyclicSources = cloneTypedSources(verificationCase);
    const totalMinutes = cyclicSources.find(
      (source) => source.sourceId === "output:totalMinutes"
    );
    const pairedSubtotal = cyclicSources.find(
      (source) => source.sourceId === "intermediate:paired-subtotal"
    );
    if (!totalMinutes || !pairedSubtotal) {
      throw new Error("Expected sum output and supplemental sources.");
    }
    totalMinutes.dependencyIds = ["intermediate:paired-subtotal"];
    pairedSubtotal.dependencyIds = ["output:totalMinutes"];
    expect(resolveWorkedExampleTypedDisplayClaims(
      verificationCase,
      displaySource,
      cyclicSources
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "typed-claim-source-cycle" })
    ]));
  });

  it("rejects incompatible unit metadata and unregistered unit removal", () => {
    const verificationCase = workedExampleVerificationFamilies.sum.cases[0];
    const displaySource = displayedFormulaExamples.sum[0];
    const incompatibleUnits = cloneTypedSources(verificationCase);
    const inputA = incompatibleUnits.find(
      (source) => source.sourceId === "input:a"
    );
    if (!inputA) throw new Error("Expected sum input source.");
    inputA.acceptedDisplayUnits.push("kg");
    expect(resolveWorkedExampleTypedDisplayClaims(
      verificationCase,
      displaySource,
      incompatibleUnits
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "typed-claim-source-unit-contract"
      })
    ]));

    const removedUnitDisplay = cloneDisplays().sum[0];
    removedUnitDisplay.problem = removedUnitDisplay.problem.replace(
      "10 min",
      "10"
    );
    const removedUnitCase = cloneFamilies().sum.cases[0];
    removedUnitCase.displayTypedClaimBindings[0].expectedDisplayUnit = "";
    syncDisplayDerivedContracts(removedUnitCase, removedUnitDisplay);
    expect(validateWorkedExampleDisplayBindings(
      {
        ...workedExampleVerificationFamilies,
        sum: {
          ...workedExampleVerificationFamilies.sum,
          cases: [
            removedUnitCase,
            workedExampleVerificationFamilies.sum.cases[1]
          ]
        }
      },
      {
        ...displayedFormulaExamples,
        sum: [removedUnitDisplay, displayedFormulaExamples.sum[1]]
      }
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "missing-unit-implicit-contract"
      })
    ]));
  });

  it("caps widened source and binding tolerances at displayed precision", () => {
    const changedDisplay = cloneDisplays().sum[0];
    changedDisplay.problem = changedDisplay.problem.replace(
      "10 min",
      "11 min"
    );
    const changedCase = cloneFamilies().sum.cases[0];
    changedCase.displayTypedClaimBindings[0].absoluteTolerance = 100;
    const widenedSources = cloneTypedSources(changedCase);
    const inputA = widenedSources.find(
      (source) => source.sourceId === "input:a"
    );
    if (!inputA) throw new Error("Expected sum input source.");
    inputA.absoluteTolerance = 100;

    expect(resolveWorkedExampleTypedDisplayClaims(
      changedCase as unknown as IndependentWorkedExampleCase,
      changedDisplay,
      widenedSources
    ).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "typed-claim-tolerance-ceiling" }),
      expect.objectContaining({
        code: "typed-claim-source-tolerance-ceiling"
      }),
      expect.objectContaining({ code: "typed-claim-value" })
    ]));
  });

  it("joins every production worked-example ID one-to-one to a verifier instance", () => {
    const quantitativeLessons = stages
      .flatMap((stage) => stage.lessons)
      .filter((lesson) => lesson.formulae.length > 0);
    const quantitativeWorkedExamples = quantitativeLessons.flatMap((lesson) =>
      lesson.blocks.flatMap((block) =>
        block.kind === "worked-example" ? [block.example] : []
      )
    );
    const productionIds = quantitativeWorkedExamples
      .map((example) => example.id)
      .sort();
    const verificationIds = workedExampleVerificationInstances
      .map((verificationInstance) => verificationInstance.id)
      .sort();

    expect(quantitativeLessons)
      .toHaveLength(EXPECTED_QUANTITATIVE_LESSON_COUNT);
    expect(quantitativeWorkedExamples)
      .toHaveLength(EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT);
    expect(new Set(productionIds).size)
      .toBe(EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT);
    expect(productionIds).toEqual(verificationIds);

    for (const verificationInstance of workedExampleVerificationInstances) {
      expect(verificationInstance.id).toBe(verificationInstance.workedExampleId);
      expect(verificationInstance.id).toMatch(
        new RegExp(`^${verificationInstance.lessonId}-EX0[12]$`, "u")
      );
    }

    expect(validateWorkedExampleProductionBindings(
      workedExampleVerificationFamilies,
      workedExampleVerificationInstances,
      quantitativeWorkedExamples
    )).toEqual([]);

    const formulaManifest = buildAcademyFormulaManifest(stages);
    expect(formulaManifest).toHaveLength(EXPECTED_QUANTITATIVE_LESSON_COUNT);
    expect(
      formulaManifest.flatMap((entry) => entry.exampleVerificationIds).sort()
    ).toEqual(verificationIds);
    for (const entry of formulaManifest) {
      expect(entry.exampleVerificationIds, entry.formulaId).toHaveLength(2);
    }
  });

  it("recomputes every named output with exact value and unit key sets", () => {
    for (const family of Object.values(workedExampleVerificationFamilies)) {
      for (const verificationCase of family.cases) {
        const oracleOutput = evaluateIndependentWorkedExampleOracle(
          verificationCase.oracleId,
          verificationCase.inputs
        );
        const unitContract: Readonly<Record<string, string>> = (
          independentWorkedExampleOracleUnitContracts[
            verificationCase.oracleId
          ]
        );
        const assertionIds = verificationCase.assertions
          .map((assertion) => assertion.outputId)
          .sort();

        expect(Object.keys(oracleOutput).sort(), verificationCase.id)
          .toEqual(assertionIds);
        expect(Object.keys(unitContract).sort(), verificationCase.id)
          .toEqual(assertionIds);
        for (const outputAssertion of verificationCase.assertions) {
          const oracleValue = oracleOutput[outputAssertion.outputId];
          const tolerance = Math.max(
            outputAssertion.absoluteTolerance,
            outputAssertion.relativeTolerance * Math.abs(oracleValue)
          );
          expect(
            Math.abs(outputAssertion.expectedValue - oracleValue),
            `${verificationCase.id}:${outputAssertion.outputId}`
          ).toBeLessThanOrEqual(
            tolerance
            + Number.EPSILON
              * Math.max(
                1,
                Math.abs(outputAssertion.expectedValue),
                Math.abs(oracleValue),
                tolerance
              )
              * 4
          );
          expect(
            outputAssertion.canonicalUnit,
            `${verificationCase.id}:${outputAssertion.outputId}`
          ).toBe(unitContract[outputAssertion.outputId]);
        }
      }
    }
  });

  it("requires the mandatory multi-output and equivalent-unit bundles", () => {
    const caseById = new Map(
      Object.values(workedExampleVerificationFamilies).flatMap(
        (family) => family.cases.map((verificationCase) => [
          verificationCase.id,
          verificationCase
        ] as const)
      )
    );
    const outputIds = (caseId: string): string[] =>
      caseById.get(caseId)?.assertions
        .map((outputAssertion) => outputAssertion.outputId)
        .sort() ?? [];

    expect(outputIds("robot-CASE-01"))
      .toEqual(["angularSpeed", "linearSpeed"]);
    expect(outputIds("robot-CASE-02"))
      .toEqual(["angularSpeed", "linearSpeed"]);
    expect(outputIds("kalmanUpdate-CASE-01"))
      .toEqual(["gain", "posteriorState", "posteriorVariance"]);
    expect(outputIds("extendedKalmanUpdate-CASE-02")).toEqual([
      "gain",
      "innovationCovariance",
      "observationJacobian",
      "posteriorState"
    ]);
    expect(outputIds("pwmDuty-CASE-02"))
      .toEqual(["dutyPercent", "dutyRatio", "periodMilliseconds"]);
    expect(outputIds("sum-CASE-02"))
      .toEqual(["totalMinutes", "totalSeconds"]);
    expect(outputIds("timing-CASE-01"))
      .toEqual(["durationMilliseconds", "durationSeconds"]);
    expect(outputIds("metric-CASE-01"))
      .toEqual(["precision", "precisionPercent"]);
    expect(outputIds("adcResolution-CASE-01"))
      .toEqual(["resolutionMillivolts", "resolutionVolts"]);
  });

  it("publishes a deterministic passing quality manifest", () => {
    const rebuiltManifest = buildWorkedExampleVerificationQualityManifest(
      workedExampleVerificationFamilies,
      quantitativeLessonFormulaAssignments
    );
    expect(rebuiltManifest).toEqual(workedExampleVerificationQualityManifest);
    expect(rebuiltManifest).toEqual({
      schemaVersion: "3",
      fingerprint: expect.stringMatching(/^fnv1a32:[0-9a-f]{8}$/u),
      status: "pass",
      familyCount: EXPECTED_WORKED_EXAMPLE_FAMILY_COUNT,
      caseCount: EXPECTED_WORKED_EXAMPLE_CASE_COUNT,
      outputAssertionCount: expect.any(Number),
      typedDisplayClaimCount:
        EXPECTED_WORKED_EXAMPLE_TYPED_DISPLAY_CLAIM_COUNT,
      quantitativeLessonCount: EXPECTED_QUANTITATIVE_LESSON_COUNT,
      instanceCount: EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT,
      issueCount: 0
    });
    expect(rebuiltManifest.outputAssertionCount)
      .toBeGreaterThan(EXPECTED_WORKED_EXAMPLE_CASE_COUNT);
  });

  it("keeps the verifier independent and one-way from production authoring", () => {
    const oracleSource = readFileSync(
      new URL("../lib/academy/workedExampleVerification.ts", import.meta.url),
      "utf8"
    );
    const caseSource = readFileSync(
      new URL(
        "../data/academy/workedExampleVerificationCases.ts",
        import.meta.url
      ),
      "utf8"
    );
    const authoringSource = readFileSync(
      new URL("../data/academy/authoring.ts", import.meta.url),
      "utf8"
    );
    const independentSource = `${oracleSource}\n${caseSource}`;

    expect(independentSource).not.toMatch(
      /\b(?:numericExpected|solutionSteps|displayResult|resultString)\b/u
    );
    expect(independentSource).not.toMatch(
      /from\s+["'][^"']*(?:authoring|curriculum|grader)[^"']*["']/u
    );
    expect(independentSource).not.toMatch(/\b(?:eval|Function)\s*\(/u);
    expect(authoringSource).not.toMatch(
      /from\s+["'][^"']*workedExampleVerification[^"']*["']/u
    );
  });

  it("fails closed for changed expected values, signs, units and output keys", () => {
    const wrongExpected = cloneFamilies();
    wrongExpected.sum.cases[0].assertions[0].expectedValue = 51;
    expect(coreIssueCodes(wrongExpected)).toContain("assertion-magnitude");

    const wrongSign = cloneFamilies();
    wrongSign.force.cases[0].assertions[0].expectedValue = -6;
    expect(coreIssueCodes(wrongSign)).toEqual(expect.arrayContaining([
      "assertion-sign",
      "assertion-magnitude"
    ]));

    const wrongUnit = cloneFamilies();
    wrongUnit.sum.cases[0].assertions[0].canonicalUnit = "s";
    expect(coreIssueCodes(wrongUnit)).toContain("assertion-unit");

    const missingOutput = cloneFamilies();
    missingOutput.robot.cases[0].assertions.pop();
    expect(coreIssueCodes(missingOutput)).toContain("case-output-keys");
  });

  it("fails closed for nonfinite inputs, missing cases and swapped case IDs", () => {
    const nonfiniteInput = cloneFamilies();
    nonfiniteInput.force.cases[0].inputs.mass.value = Number.NaN;
    expect(coreIssueCodes(nonfiniteInput)).toEqual(expect.arrayContaining([
      "case-input-finite",
      "case-oracle-evaluation"
    ]));

    const missingCase = cloneFamilies();
    missingCase.sum.cases.pop();
    expect(coreIssueCodes(missingCase)).toEqual(expect.arrayContaining([
      "family-identity",
      "case-count",
      "instance-count",
      "lesson-instance-count"
    ]));

    const swappedCases = cloneFamilies();
    const firstCase = swappedCases.sum.cases[0];
    swappedCases.sum.cases[0] = swappedCases.sum.cases[1];
    swappedCases.sum.cases[1] = firstCase;
    expect(coreIssueCodes(swappedCases)).toContain("case-identity");
  });

  it("fails closed for displayed production result drift and missing displays", () => {
    const changedResult = cloneDisplays();
    changedResult.sum[0].result = "q_total = 51 min";
    expect(validateWorkedExampleDisplayBindings(
      workedExampleVerificationFamilies,
      changedResult
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "display-fingerprint" }),
      expect.objectContaining({ code: "display-assertion-fragment" })
    ]));

    const missingDisplay = cloneDisplays();
    missingDisplay.sum.pop();
    expect(validateWorkedExampleDisplayBindings(
      workedExampleVerificationFamilies,
      missingDisplay
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "display-case-count" })
    ]));

    const swappedDisplay = cloneDisplays();
    swappedDisplay.sum.reverse();
    expect(validateWorkedExampleDisplayBindings(
      workedExampleVerificationFamilies,
      swappedDisplay
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "display-fingerprint" })
    ]));
  });

  it("still fails after both display-derived fingerprints are updated", () => {
    const changedInput = cloneDisplays();
    changedInput.sum[0].problem = changedInput.sum[0].problem.replace(
      "10 min",
      "11 min"
    );
    const inputFingerprintUpdated = cloneFamilies();
    syncDisplayDerivedContracts(
      inputFingerprintUpdated.sum.cases[0],
      changedInput.sum[0]
    );
    const inputIssues = validateWorkedExampleDisplayBindings(
      {
        sum: inputFingerprintUpdated.sum
      } as unknown as WorkedExampleFamilyRegistry,
      {
        sum: changedInput.sum
      }
    );
    expect(inputIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "typed-claim-value" })
    ]));
    expect(inputIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-fingerprint");
    expect(inputIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-numeric-claims");
    expect(inputIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-typed-claims");

    const changedIntermediate = cloneDisplays();
    changedIntermediate.sum[0].steps[1] = "Add 10 + 15 + 21 + 5.";
    const intermediateFingerprintUpdated = cloneFamilies();
    syncDisplayDerivedContracts(
      intermediateFingerprintUpdated.sum.cases[0],
      changedIntermediate.sum[0]
    );
    const intermediateIssues = validateWorkedExampleDisplayBindings(
      {
        sum: intermediateFingerprintUpdated.sum
      } as unknown as WorkedExampleFamilyRegistry,
      {
        sum: changedIntermediate.sum
      }
    );
    expect(intermediateIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "typed-claim-value" })
    ]));
    expect(intermediateIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-fingerprint");
    expect(intermediateIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-numeric-claims");
    expect(intermediateIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-typed-claims");
  });

  it("keeps relation metadata independent of coordinated display edits", () => {
    const changedDisplay = cloneDisplays();
    changedDisplay.sum[0].result =
      "q_total approximately 50 min";
    const changedFamilies = cloneFamilies();
    const resultBinding =
      changedFamilies.sum.cases[0].displayTypedClaimBindings.find(
        (binding) => binding.claimId === "RESULT-NUMERIC-001"
      );
    if (!resultBinding) throw new Error("Expected sum result binding.");
    resultBinding.expectedRelation = "approximately-equals";
    syncDisplayDerivedContracts(
      changedFamilies.sum.cases[0],
      changedDisplay.sum[0]
    );

    const relationIssues = validateWorkedExampleDisplayBindings(
      {
        sum: changedFamilies.sum
      } as unknown as WorkedExampleFamilyRegistry,
      {
        sum: changedDisplay.sum
      }
    );
    expect(relationIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "display-typed-claims" })
    ]));
    expect(relationIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("typed-claim-relation");
    expect(relationIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-fingerprint");
    expect(relationIssues.map((currentIssue) => currentIssue.code))
      .not.toContain("display-numeric-claims");
  });

  it("fails closed for changed production named output values and units", () => {
    const changedValue = structuredClone(productionWorkedExamples);
    changedValue[0].verificationOutputs[0].value += 1;
    expect(validateWorkedExampleProductionBindings(
      workedExampleVerificationFamilies,
      workedExampleVerificationInstances,
      changedValue
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "production-output-value" })
    ]));

    const changedUnit = structuredClone(productionWorkedExamples);
    changedUnit[0].verificationOutputs[0].canonicalUnit = "wrong-unit";
    expect(validateWorkedExampleProductionBindings(
      workedExampleVerificationFamilies,
      workedExampleVerificationInstances,
      changedUnit
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "production-output-unit" })
    ]));
  });

  it("fails closed for duplicate and orphan lesson assignments", () => {
    const duplicateAssignment = cloneAssignments();
    duplicateAssignment.push(structuredClone(duplicateAssignment[0]));
    expect(coreIssueCodes(cloneFamilies(), duplicateAssignment)).toEqual(
      expect.arrayContaining([
        "assignment-count",
        "duplicate-assignment",
        "instance-count",
        "duplicate-instance",
        "lesson-instance-count"
      ])
    );

    const orphanAssignment = cloneAssignments();
    const soleEigenAssignment = orphanAssignment.find(
      (assignment) => assignment.familyId === "eigen"
    );
    if (!soleEigenAssignment) {
      throw new Error("Expected the unique eigen formula assignment.");
    }
    soleEigenAssignment.familyId = "orphan-family";
    expect(coreIssueCodes(cloneFamilies(), orphanAssignment)).toEqual(
      expect.arrayContaining([
        "orphan-assignment",
        "orphan-family",
        "instance-count",
        "lesson-instance-count"
      ])
    );
  });
});
