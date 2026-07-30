import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(
  repositoryRoot,
  "dist",
  "academy-formula-quality.json"
);

const expectedCounts = Object.freeze({
  legacyReviewedExpressions: 309,
  embeddedByteExpressions: 256,
  academyFormulae: 113
});

const issue = (issues, code, path, message) => {
  issues.push({ code, path, message });
};

const sha256 = (value) =>
  `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;

const stableExpressionPayload = (entries) =>
  JSON.stringify(
    [...entries]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((entry) => ({
        id: entry.id,
        source: entry.source,
        plainText: entry.expression.plainText,
        tex: entry.expression.tex,
        screenReaderText: entry.expression.screenReaderText,
        displayMode: entry.displayMode
      }))
  );

const containsUnicodeDash = (value) => /[\u2013\u2014]/u.test(value);

const reviewedInstructionExpression = (expression) => ({
  id: expression.id,
  plainText: expression.plainText,
  tex: expression.latex,
  screenReaderText: expression.spoken
});

const displayedFormulaExamples = (academyFormulaTemplates) =>
  Object.fromEntries(
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

const collectStageInstructionMath = (
  value,
  visit,
  path = "stages",
  seen = new WeakSet()
) => {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);

  if (
    value.kind === "math"
    && value.expression
    && typeof value.expression === "object"
  ) {
    visit(value.expression, path);
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectStageInstructionMath(entry, visit, `${path}.${index}`, seen)
    );
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    collectStageInstructionMath(entry, visit, `${path}.${key}`, seen);
  }
};

let viteServer;

try {
  viteServer = await createServer({
    configFile: false,
    root: repositoryRoot,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });

  const [
    mathExpressions,
    curriculum,
    mathRendering,
    formulaRenderVerification,
    authoring,
    verificationCases,
    workedExampleVerification
  ] = await Promise.all([
    viteServer.ssrLoadModule("/src/data/mathExpressions.ts"),
    viteServer.ssrLoadModule("/src/lib/academy/curriculum.ts"),
    viteServer.ssrLoadModule("/src/lib/academy/mathRendering.ts"),
    viteServer.ssrLoadModule(
      "/src/lib/academy/formulaRenderVerification.ts"
    ),
    viteServer.ssrLoadModule("/src/data/academy/authoring.ts"),
    viteServer.ssrLoadModule(
      "/src/data/academy/workedExampleVerificationCases.ts"
    ),
    viteServer.ssrLoadModule(
      "/src/lib/academy/workedExampleVerification.ts"
    )
  ]);

  const stages = await curriculum.loadAllAcademyStages();
  const issues = [];
  const expressionsById = new Map();
  const sourceCounts = {
    legacyReviewedExpressions: 0,
    embeddedByteExpressions: 0,
    academyFormulae: 0,
    academyInstructionExpressions: 0,
    academyInstructionOccurrences: 0
  };

  const registerExpression = (
    source,
    expression,
    displayMode,
    allowEquivalentDuplicate = false
  ) => {
    if (
      !expression
      || typeof expression.id !== "string"
      || typeof expression.plainText !== "string"
      || typeof expression.tex !== "string"
      || typeof expression.screenReaderText !== "string"
    ) {
      issue(
        issues,
        "formula-metadata",
        source,
        "Reviewed mathematics metadata is incomplete."
      );
      return;
    }

    const entry = { source, expression, displayMode };
    const previous = expressionsById.get(expression.id);
    if (previous) {
      const equivalent = (
        previous.expression.plainText === expression.plainText
        && previous.expression.tex === expression.tex
        && previous.expression.screenReaderText
          === expression.screenReaderText
        && previous.displayMode === displayMode
      );
      if (!allowEquivalentDuplicate || !equivalent) {
        issue(
          issues,
          "formula-id",
          expression.id,
          equivalent
            ? "Reviewed mathematics ID is duplicated."
            : "Reviewed mathematics ID resolves to conflicting metadata."
        );
      }
      return;
    }
    expressionsById.set(expression.id, entry);
  };

  for (const expression of mathExpressions.allReviewedMathExpressions) {
    sourceCounts.legacyReviewedExpressions += 1;
    registerExpression("legacy-reviewed", expression, false);
  }

  for (let byte = 0; byte <= 255; byte += 1) {
    sourceCounts.embeddedByteExpressions += 1;
    registerExpression(
      "embedded-byte",
      mathExpressions.buildEmbeddedByteMathExpression(byte),
      false
    );
  }

  for (const stage of stages) {
    for (const lesson of stage.lessons) {
      for (const formula of lesson.formulae) {
        sourceCounts.academyFormulae += 1;
        registerExpression(
          `academy-formula:${lesson.id}`,
          {
            id: formula.id,
            plainText: formula.latex,
            tex: formula.latex,
            screenReaderText: formula.spoken
          },
          formula.displayMode
        );
      }
    }
  }

  const stageInstructionIds = new Set();
  collectStageInstructionMath(stages, (expression, expressionPath) => {
    sourceCounts.academyInstructionOccurrences += 1;
    if (!stageInstructionIds.has(expression.id)) {
      sourceCounts.academyInstructionExpressions += 1;
      stageInstructionIds.add(expression.id);
    }
    registerExpression(
      `academy-instruction:${expressionPath}`,
      reviewedInstructionExpression(expression),
      expression.displayMode,
      true
    );
  });

  for (const [countName, expected] of Object.entries(expectedCounts)) {
    if (sourceCounts[countName] !== expected) {
      issue(
        issues,
        "formula-count",
        `counts.${countName}`,
        `Expected ${expected}, found ${sourceCounts[countName]}.`
      );
    }
  }

  const curriculumIssues = curriculum.validateAcademyCurriculum(stages);
  issues.push(...curriculumIssues.map((entry) => ({
    code: `curriculum:${entry.code}`,
    path: entry.path,
    message: entry.message
  })));

  const formulaManifest = curriculum.buildAcademyFormulaManifest(stages);
  const formulaRenderManifest =
    formulaRenderVerification.buildAcademyFormulaRenderVerificationManifest(
      stages
    );
  const formulaRenderIssues =
    formulaRenderVerification.validateAcademyFormulaRenderVerificationManifest(
      formulaManifest,
      formulaRenderManifest
    );
  issues.push(...formulaRenderIssues.map((entry) => ({
    code: `formula-render:${entry.code}`,
    path: entry.path,
    message: entry.message
  })));

  const strictRenderFailures = [];
  for (const [expressionId, entry] of expressionsById) {
    if (
      containsUnicodeDash(entry.expression.plainText)
      || containsUnicodeDash(entry.expression.tex)
      || containsUnicodeDash(entry.expression.screenReaderText)
    ) {
      issue(
        issues,
        "unicode-dash",
        expressionId,
        "Reviewed mathematics contains a prohibited Unicode dash."
      );
    }
    const verification = mathRendering.verifyReviewedMathExpression(
      `build:${expressionId}`,
      entry.expression,
      entry.displayMode
    );
    if (
      verification.status !== "pass"
      || verification.mathMlPresent !== true
      || verification.error !== null
    ) {
      strictRenderFailures.push({
        expressionId,
        error: verification.error ?? "Strict MathML rendering failed."
      });
      issue(
        issues,
        "strict-render",
        expressionId,
        verification.error ?? "Strict MathML rendering failed."
      );
    }
  }

  const displayRegistry = displayedFormulaExamples(
    authoring.academyFormulaTemplates
  );
  const productionWorkedExamples = stages
    .flatMap((stage) => stage.lessons)
    .flatMap((lesson) =>
      lesson.blocks.flatMap((block) =>
        block.kind === "worked-example" ? [block.example] : []
      )
    );

  const numericCoreIssues =
    workedExampleVerification.validateWorkedExampleVerification(
      verificationCases.workedExampleVerificationFamilies,
      verificationCases.quantitativeLessonFormulaAssignments
    );
  const numericDisplayIssues =
    workedExampleVerification.validateWorkedExampleDisplayBindings(
      verificationCases.workedExampleVerificationFamilies,
      displayRegistry
    );
  const numericProductionIssues =
    workedExampleVerification.validateWorkedExampleProductionBindings(
      verificationCases.workedExampleVerificationFamilies,
      verificationCases.workedExampleVerificationInstances,
      productionWorkedExamples
    );
  const numericIssues = [
    ...numericCoreIssues,
    ...numericDisplayIssues,
    ...numericProductionIssues
  ];
  issues.push(...numericIssues.map((entry) => ({
    code: `numeric:${entry.code}`,
    path: entry.path,
    message: entry.message
  })));

  const recomputedNumericQuality =
    workedExampleVerification.buildWorkedExampleVerificationQualityManifest(
      verificationCases.workedExampleVerificationFamilies,
      verificationCases.quantitativeLessonFormulaAssignments
    );
  if (
    JSON.stringify(recomputedNumericQuality)
    !== JSON.stringify(
      verificationCases.workedExampleVerificationQualityManifest
    )
  ) {
    issue(
      issues,
      "numeric-quality",
      "numericVerification.qualityManifest",
      "Stored numeric quality manifest differs from the recomputed manifest."
    );
  }

  const expressionEntries = [...expressionsById.values()];
  const expressionFingerprint = sha256(
    stableExpressionPayload(
      expressionEntries.map((entry) => ({
        id: entry.expression.id,
        ...entry
      }))
    )
  );
  const totalReviewedExpressions = expressionsById.size;
  const manifestCore = {
    schemaVersion: "1",
    status: issues.length === 0 ? "pass" : "fail",
    renderer: {
      name: "KaTeX",
      policyFingerprint: mathRendering.academyMathPolicyFingerprint,
      outputMode: "htmlAndMathml",
      strictMode: "error",
      trustEnabled: false
    },
    counts: {
      ...sourceCounts,
      totalReviewedExpressions,
      formulaRenderManifestEntries: formulaRenderManifest.length,
      numericFamilies: recomputedNumericQuality.familyCount,
      numericCases: recomputedNumericQuality.caseCount,
      numericTypedDisplayClaims:
        recomputedNumericQuality.typedDisplayClaimCount,
      numericLessons: recomputedNumericQuality.quantitativeLessonCount,
      numericInstances: recomputedNumericQuality.instanceCount
    },
    fingerprints: {
      reviewedExpressions: expressionFingerprint,
      numericVerification: recomputedNumericQuality.fingerprint
    },
    validation: {
      issueCount: issues.length,
      curriculumIssueCount: curriculumIssues.length,
      formulaRenderIssueCount: formulaRenderIssues.length,
      strictRenderFailureCount: strictRenderFailures.length,
      numericIssueCount: numericIssues.length
    }
  };
  const manifest = {
    ...manifestCore,
    fingerprints: {
      ...manifestCore.fingerprints,
      qualityManifest: sha256(JSON.stringify(manifestCore))
    }
  };
  const serialisedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
  if (containsUnicodeDash(serialisedManifest)) {
    issue(
      issues,
      "unicode-dash",
      "academy-formula-quality.json",
      "Generated quality manifest contains a prohibited Unicode dash."
    );
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serialisedManifest, "utf8");

  if (issues.length > 0) {
    const summary = issues
      .slice(0, 25)
      .map((entry) =>
        `${entry.code} at ${entry.path}: ${entry.message}`
      )
      .join("\n");
    throw new Error(
      `Academy formula quality gate failed with ${issues.length} issue(s).\n${summary}`
    );
  }

  console.log(
    [
      "Academy formula quality gate: PASS",
      `Reviewed expressions: ${totalReviewedExpressions}`,
      `Legacy mappings: ${sourceCounts.legacyReviewedExpressions}`,
      `Embedded byte expressions: ${sourceCounts.embeddedByteExpressions}`,
      `Academy formulae: ${sourceCounts.academyFormulae}`,
      `Academy instruction expressions: ${sourceCounts.academyInstructionExpressions}`,
      `Academy instruction occurrences: ${sourceCounts.academyInstructionOccurrences}`,
      `Numeric typed display claims: ${recomputedNumericQuality.typedDisplayClaimCount}`,
      `Manifest: ${outputPath}`
    ].join("\n")
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await viteServer?.close();
}
