import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AcademyLessonBlockView } from "../components/academy/AcademyLessonBlock";
import { AcademyQuestionSet } from "../components/academy/AcademyQuestion";
import {
  Equation,
  academyKatexOptions,
  academyMathLimits,
  academyMathPolicyFingerprint,
  renderReviewedMathToString,
  trustRequiringTexCommand,
  verifyReviewedMathExpression
} from "../components/AcademyMath";
import {
  allReviewedMathExpressions,
  calculatorMathExpressions,
  engineeringUnitMathExpressions,
  flagshipMathExpressions,
  flagshipVariableMathExpressions,
  labMathExpressions,
  masteryDimensionalCheckMathExpressions,
  masteryEquationMathExpressions,
  masterySubstitutionMathExpressions,
  masteryVariableMathExpressions,
  moduleMathExpressions,
  workspaceMathExpressions,
  type ReviewedMathExpression
} from "../data/mathExpressions";
import {
  buildAcademyReviewedInstruction,
  sourceContainsUnreviewedMathNotation
} from "../data/academy/authoring";
import { masteryModules } from "../data/masteryCurriculum";
import { loadAllAcademyStages } from "../lib/academy/curriculum";
import type {
  AcademyInstruction,
  AcademyReviewedMath,
  FormulaSpec,
  LessonBlock,
  SourceReference
} from "../lib/academy/types";
import { calculatorDefinitions } from "../lib/engineering/calculators";
import { flagshipWorkflowSpecifications } from "../lib/flagships";

function sortedKeys(value: Readonly<Record<string, unknown>>): string[] {
  return Object.keys(value).sort();
}

const expectedProseUnitDescriptions = [
  "actuator input unit",
  "actuator unit",
  "actuator unit per measured unit",
  "actuator unit per measured unit s",
  "actuator unit per process unit",
  "actuator unit per process unit per s",
  "actuator unit s per measured unit",
  "actuator unit s per process unit",
  "application-dependent SI unit",
  "command/error-unit",
  "command",
  "cost unit",
  "descriptor distance unit",
  "error-unit",
  "input unit",
  "input unit per output unit",
  "loss unit per parameter unit",
  "measured unit",
  "measurement unit",
  "measurement unit per state unit",
  "measurement unit squared",
  "output unit",
  "output unit per input unit",
  "output unit/s",
  "output unit/s^2",
  "parameter unit",
  "parameter unit squared per loss unit",
  "process-variable unit",
  "quantity unit",
  "quantity/s",
  "rate unit times s",
  "same as actuator command",
  "same as x",
  "same unit as a",
  "same unit as a and b",
  "same unit as b",
  "same unit as d1",
  "same unit as q_i",
  "same unit as q_total",
  "same unit as u_c",
  "same unit as x_i",
  "same unit as x_n",
  "signal unit",
  "state unit",
  "state unit per measurement unit",
  "state unit squared",
  "state unit/(input unit s)",
  "state unit/s",
  "target SI unit"
] as const;

function reviewedAcademyFormula(formula: FormulaSpec): ReviewedMathExpression {
  return {
    id: formula.id,
    plainText: formula.latex,
    tex: formula.latex,
    screenReaderText: formula.spoken
  };
}

function reviewedAcademyVariable(
  formula: FormulaSpec,
  variable: FormulaSpec["variables"][number]
): ReviewedMathExpression {
  return {
    id: `${formula.id}:variable:${variable.symbol}`,
    plainText: variable.symbol,
    tex: variable.symbol,
    screenReaderText: `Variable ${variable.meaning}.`
  };
}

function reviewedInstructionMath(
  expression: AcademyReviewedMath
): ReviewedMathExpression {
  return {
    id: expression.id,
    plainText: expression.plainText,
    tex: expression.latex,
    screenReaderText: expression.spoken
  };
}

function instructionIsReviewed(instruction: AcademyInstruction): boolean {
  return instruction.length > 0 && instruction.every((part) => part.kind === "text"
    ? part.text.trim().length > 0
    : (
        part.expression.id.trim().length > 0
        && part.expression.plainText.trim().length > 0
        && part.expression.latex.trim().length > 0
        && part.expression.spoken.trim().length > 0
      ));
}

const unreviewedInstructionalMathPattern =
  /\s=\s|[\u222B\u221A\u00B7\u00D7\u2212\u03C4\u03B6\u03C9\u03C3\u03C0\u00B2\u00B3\u2264\u2265\u2248\u00B1]|(?:^|\s)[<>](?:\s|$)|\+\/-|\^[0-9A-Za-z(]|\\(?:frac|sqrt|begin|mathrm|Delta|sum|int)\b/u;

function renderAcademyMathBlock(
  lesson: Parameters<typeof AcademyLessonBlockView>[0]["lesson"],
  block: LessonBlock
): string {
  return renderToStaticMarkup(createElement(AcademyLessonBlockView, {
    lesson,
    block,
    sources: new Map<string, SourceReference>(),
    initialScores: {},
    attemptHistory: {},
    onQuestionAttempt: () => undefined,
    onKnowledgePassed: () => undefined,
    onPracticePassed: () => undefined,
    onLaboratoryOpen: () => undefined
  }));
}

describe("reviewed Academy math coverage", () => {
  it("covers every calculator equation with no missing or orphan mapping", () => {
    expect(calculatorDefinitions).toHaveLength(12);
    expect(sortedKeys(calculatorMathExpressions))
      .toEqual(calculatorDefinitions.map((definition) => definition.id).sort());
    for (const definition of calculatorDefinitions) {
      expect(
        calculatorMathExpressions[
          definition.id as keyof typeof calculatorMathExpressions
        ].plainText
      ).toBe(definition.equation);
    }
  });

  it("covers every mastery equation, substitution, and dimensional check exactly", () => {
    expect(masteryModules).toHaveLength(25);
    const moduleIds = masteryModules.map((module) => module.id).sort();
    expect(sortedKeys(masteryEquationMathExpressions)).toEqual(moduleIds);
    expect(sortedKeys(masterySubstitutionMathExpressions)).toEqual(moduleIds);
    expect(sortedKeys(masteryDimensionalCheckMathExpressions)).toEqual(moduleIds);

    for (const module of masteryModules) {
      expect(module.equations).toHaveLength(1);
      const key = module.id as keyof typeof masteryEquationMathExpressions;
      expect(masteryEquationMathExpressions[key].plainText)
        .toBe(module.equations[0].expression);
      expect(masterySubstitutionMathExpressions[key].plainText)
        .toBe(module.workedExample.substitution);
      expect(masteryDimensionalCheckMathExpressions[key].plainText)
        .toBe(module.equations[0].dimensionalCheck);
      expect(module.workedExample.prompt, `${module.id} worked-example prompt`)
        .not.toMatch(unreviewedInstructionalMathPattern);
      expect(module.workedExample.check.independentMethod, `${module.id} independent check`)
        .not.toMatch(unreviewedInstructionalMathPattern);
    }
  });

  it("covers every legacy Mastery variable symbol with reviewed TeX", () => {
    const symbols = [...new Set(
      masteryModules.flatMap((module) =>
        module.equations.flatMap((equation) =>
          equation.variables.map((variable) => variable.symbol)
        )
      )
    )].sort();
    expect(sortedKeys(masteryVariableMathExpressions)).toEqual(symbols);
    for (const symbol of symbols) {
      const expression = masteryVariableMathExpressions[
        symbol as keyof typeof masteryVariableMathExpressions
      ];
      expect(expression.plainText).toBe(symbol);
      expect(renderReviewedMathToString(expression, false), symbol).toContain("<math");
    }
  });

  it("covers every flagship equation with no missing or orphan mapping", () => {
    const equations = flagshipWorkflowSpecifications.flatMap((workflow) => workflow.equations);
    expect(equations).toHaveLength(15);
    expect(sortedKeys(flagshipMathExpressions))
      .toEqual(equations.map((equation) => equation.id).sort());
    for (const equation of equations) {
      expect(
        flagshipMathExpressions[
          equation.id as keyof typeof flagshipMathExpressions
        ].plainText
      ).toBe(equation.expression);
    }
  });

  it("renders symbolic units and explicitly classifies prose unit descriptions", async () => {
    const stages = await loadAllAcademyStages();
    const usedUnits = new Set([
      ...stages.flatMap((stage) =>
        stage.lessons.flatMap((lesson) =>
          lesson.formulae.flatMap((formula) =>
            formula.variables.map((variable) => variable.siUnit)
          )
        )
      ),
      ...masteryModules.flatMap((module) =>
        module.equations.flatMap((equation) =>
          equation.variables.map((variable) => variable.unit)
        ).concat(module.workedExample.unit)
      ),
      ...flagshipWorkflowSpecifications.flatMap((workflow) =>
        workflow.equations.flatMap((equation) =>
          equation.variables.map((variable) => variable.siUnit)
        )
      )
    ]);
    const mappedUnits = Object.keys(engineeringUnitMathExpressions);
    for (const unit of mappedUnits) {
      expect(usedUnits.has(unit), `orphan unit mapping: ${unit}`).toBe(true);
      expect(
        renderReviewedMathToString(
          engineeringUnitMathExpressions[
            unit as keyof typeof engineeringUnitMathExpressions
          ],
          false
        ),
        unit
      ).toContain("<math");
    }
    expect(
      [...usedUnits].filter((unit) => !(unit in engineeringUnitMathExpressions)).sort()
    ).toEqual([...expectedProseUnitDescriptions].sort());
  });
});

describe("strict accessible KaTeX rendering", () => {
  it("uses the bounded non-trusting HTML and MathML policy", () => {
    expect(academyKatexOptions).toMatchObject({
      output: "htmlAndMathml",
      trust: false,
      throwOnError: true,
      strict: "error",
      globalGroup: false
    });
    expect(academyKatexOptions.maxExpand).toBe(academyMathLimits.maxExpand);
    expect(academyKatexOptions.maxSize).toBe(academyMathLimits.maxSize);
    expect(academyMathLimits.inputLength).toBeGreaterThan(0);
    expect(academyMathLimits.outputLength).toBeGreaterThan(academyMathLimits.inputLength);
    expect(Number.isFinite(academyMathLimits.maxExpand)).toBe(true);
  });

  it("compiles all 309 reviewed mappings with exceptions enabled and MathML present", () => {
    const expectedExpressions = [
      ...Object.values(calculatorMathExpressions),
      ...Object.values(masteryEquationMathExpressions),
      ...Object.values(masterySubstitutionMathExpressions),
      ...Object.values(masteryDimensionalCheckMathExpressions),
      ...Object.values(masteryVariableMathExpressions),
      ...Object.values(engineeringUnitMathExpressions),
      ...Object.values(flagshipMathExpressions),
      ...Object.values(moduleMathExpressions),
      ...Object.values(labMathExpressions),
      ...Object.values(flagshipVariableMathExpressions),
      ...Object.values(workspaceMathExpressions)
    ];
    expect(allReviewedMathExpressions).toEqual(expectedExpressions);
    expect(allReviewedMathExpressions).toHaveLength(309);
    expect(new Set(allReviewedMathExpressions.map((expression) => expression.id)).size)
      .toBe(allReviewedMathExpressions.length);

    for (const expression of allReviewedMathExpressions) {
      const html = renderReviewedMathToString(expression, true);
      expect(html, expression.id).toContain('class="katex');
      expect(html, expression.id).toContain("<math");
      expect(html.length, expression.id).toBeLessThanOrEqual(academyMathLimits.outputLength);
    }
  });

  it("rejects invalid TeX instead of rendering it as source text", () => {
    const invalid: ReviewedMathExpression = {
      id: "test:invalid",
      plainText: "invalid fraction",
      tex: String.raw`\frac{`,
      screenReaderText: "Invalid fraction"
    };
    expect(() => renderReviewedMathToString(invalid, true)).toThrow();
    expect(verifyReviewedMathExpression("test:invalid:strict-render", invalid, true)).toEqual(
      expect.objectContaining({
        verificationId: "test:invalid:strict-render",
        status: "fail",
        outputMode: "htmlAndMathml",
        strictMode: "error",
        trustEnabled: false,
        mathMlPresent: false
      })
    );
  });

  it("derives machine-readable strict-render status from actual KaTeX and MathML output", () => {
    const expression = allReviewedMathExpressions[0];
    const verification = verifyReviewedMathExpression(
      `${expression.id}:strict-render`,
      expression,
      true
    );
    expect(verification).toEqual({
      verificationId: `${expression.id}:strict-render`,
      renderer: "KaTeX",
      policyFingerprint: academyMathPolicyFingerprint,
      status: "pass",
      outputMode: "htmlAndMathml",
      strictMode: "error",
      trustEnabled: false,
      mathMlPresent: true,
      error: null
    });
  });

  it("rejects trust-requiring commands before KaTeX rendering", () => {
    const trustRequest: ReviewedMathExpression = {
      id: "test:trust-request",
      plainText: "external link",
      tex: String.raw`\href{https://example.invalid}{x}`,
      screenReaderText: "External link"
    };
    expect(() => renderReviewedMathToString(trustRequest, true))
      .toThrow(/Trust-requiring TeX commands are prohibited/);
    for (const expression of allReviewedMathExpressions) {
      expect(trustRequiringTexCommand.test(expression.tex), expression.id).toBe(false);
    }
  });

  it("uses escaped authoritative plain text when runtime rendering fails", () => {
    const invalid: ReviewedMathExpression = {
      id: "test:runtime-fallback",
      plainText: "x < y & z",
      tex: String.raw`\notARealAcademyCommand{`,
      screenReaderText: "x is less than y and z"
    };
    const html = renderToStaticMarkup(createElement(Equation, {
      expression: invalid,
      fallbackText: invalid.plainText,
      label: "Runtime fallback equation"
    }));
    expect(html).toContain('data-math-render-status="fallback"');
    expect(html).toContain('data-math-fallback="true"');
    expect(html).toContain("x &lt; y &amp; z");
    expect(html).not.toContain('class="katex');
  });

  it("does not accept a raw ASCII fallback as TeX", () => {
    const html = renderToStaticMarkup(createElement(Equation, {
      expression: undefined,
      fallbackText: "F = m a",
      label: "Unmapped equation"
    }));
    expect(html).toContain('data-math-render-status="fallback"');
    expect(html).toContain("F = m a");
    expect(html).not.toContain('class="katex');
  });

  it("provides labelled scroll regions, copyable plain text, and screen-reader wording", () => {
    const expression = calculatorMathExpressions["beam-bending"];
    const html = renderToStaticMarkup(createElement(Equation, {
      expression,
      fallbackText: expression.plainText,
      label: "Beam equations"
    }));
    expect(html).toContain('role="region"');
    expect(html).toContain(
      'aria-label="Beam equations. Horizontally scrollable when needed. Formula instance '
    );
    expect(html).toContain('role="math"');
    expect(html).toContain("Copy plain-text form");
    expect(html).toContain(expression.plainText);
  });

  it("gives repeated formula scroll landmarks unique accessible names", () => {
    const expression = calculatorMathExpressions["beam-bending"];
    const html = renderToStaticMarkup(createElement(
      "div",
      null,
      createElement(Equation, {
        expression,
        fallbackText: expression.plainText,
        label: "Repeated beam equations"
      }),
      createElement(Equation, {
        expression,
        fallbackText: expression.plainText,
        label: "Repeated beam equations"
      })
    ));
    const regionLabels = [...html.matchAll(
      /class="academy-math__scroll-region"[^>]*aria-label="([^"]+)"/gu
    )].map((match) => match[1]);

    expect(regionLabels).toHaveLength(2);
    expect(new Set(regionLabels).size).toBe(2);
    expect(
      regionLabels.every((value) =>
        value.startsWith(
          "Repeated beam equations. Horizontally scrollable when needed."
        )
      )
    ).toBe(true);
  });

  it("contains no Unicode en dash or em dash in any mapped text", () => {
    const mappedText = allReviewedMathExpressions
      .flatMap((expression) => [
        expression.id,
        expression.plainText,
        expression.tex,
        expression.screenReaderText
      ])
      .join("\n");
    expect(mappedText).not.toMatch(/[\u2013\u2014]/u);
  });
});

describe("lazy Academy formula integration", () => {
  it("renders every stage formula and derivation through the strict accessible path", async () => {
    const stages = await loadAllAcademyStages();
    expect(stages.map((stage) => stage.stage)).toEqual(["E0", "E1", "E2", "E3", "E4"]);

    const lessons = stages.flatMap((stage) => stage.lessons);
    const formulae = lessons.flatMap((lesson) => lesson.formulae);
    const derivations = lessons.flatMap((lesson) =>
      lesson.blocks
        .filter((block): block is Extract<LessonBlock, { kind: "derivation" }> =>
          block.kind === "derivation"
        )
        .map((block) => ({ lesson, block }))
    );

    expect(formulae.length).toBeGreaterThan(100);
    expect(derivations).toHaveLength(formulae.length);
    expect(new Set(formulae.map((formula) => formula.id)).size).toBe(formulae.length);

    for (const lesson of lessons) {
      const formulaById = new Map(lesson.formulae.map((formula) => [formula.id, formula]));
      const presentationBlocks = lesson.blocks.filter(
        (
          block
        ): block is Extract<LessonBlock, { kind: "inline-math" | "display-math" }> =>
          block.kind === "inline-math" || block.kind === "display-math"
      );

      for (const formula of lesson.formulae) {
        const expression = reviewedAcademyFormula(formula);
        expect(formula.spoken.trim(), `${formula.id} screen-reader wording`).not.toBe("");
        expect(trustRequiringTexCommand.test(formula.latex), formula.id).toBe(false);

        const strictHtml = renderReviewedMathToString(expression, formula.displayMode);
        expect(strictHtml, formula.id).toContain("<math");
        expect(strictHtml, formula.id).toContain('encoding="application/x-tex"');
        for (const variable of formula.variables) {
          const variableExpression = reviewedAcademyVariable(formula, variable);
          expect(
            renderReviewedMathToString(variableExpression, false),
            `${formula.id}: ${variable.symbol}`
          ).toContain("<math");
        }

        const formulaBlocks = presentationBlocks.filter((block) => block.formulaId === formula.id);
        expect(formulaBlocks.length, `${formula.id} presentation block`).toBeGreaterThan(0);
        for (const block of formulaBlocks) {
          const markup = renderAcademyMathBlock(lesson, block);
          expect(markup, block.id).toContain('data-math-render-status="rendered"');
          expect(markup, block.id).not.toContain('data-math-fallback="true"');
          expect(markup, block.id).toContain("<math");
          expect(markup, block.id).toContain('role="math"');
          expect(markup, block.id).toContain("aria-label=");
          expect(markup, block.id).toContain('data-copy-text=');
          const renderedMathCount = markup.match(
            /data-math-render-status="rendered"/g
          )?.length ?? 0;
          const mappedUnitCount = formula.variables.filter((variable) =>
            variable.siUnit in engineeringUnitMathExpressions
          ).length;
          expect(renderedMathCount, `${block.id} equation and variable symbols`)
            .toBe(
              block.kind === "display-math"
                ? formula.variables.length + mappedUnitCount + 1
                : 1
            );
        }
      }

      for (const block of lesson.blocks) {
        if (block.kind !== "derivation") continue;
        const formula = formulaById.get(block.formulaId);
        expect(formula, `${block.id} formula reference`).toBeDefined();
        if (!formula) continue;
        expect(block.steps).toEqual(formula.derivationSteps);
        expect(block.steps.every(instructionIsReviewed), block.id).toBe(true);
        expect(trustRequiringTexCommand.test(formula.latex), block.id).toBe(false);

        const markup = renderAcademyMathBlock(lesson, block);
        expect(markup, block.id).toContain('data-math-render-status="rendered"');
        expect(markup, block.id).not.toContain('data-math-fallback="true"');
        expect(markup, block.id).toContain("<math");
        expect(markup, block.id).toContain('role="math"');
        expect(markup, block.id).toContain("aria-label=");
        expect(markup, block.id).toContain("Copy plain-text form");
        expect(markup, block.id).toContain("<ol>");
      }
    }
  });

  it("renders every reviewed calculation, check, hint and solution through KaTeX with MathML", async () => {
    const stages = await loadAllAcademyStages();
    const lessons = stages.flatMap((stage) => stage.lessons);
    const instructions: AcademyInstruction[] = [];

    for (const lesson of lessons) {
      for (const formula of lesson.formulae) {
        instructions.push(...formula.derivationSteps);
      }
      for (const block of lesson.blocks) {
        if (block.kind === "derivation") {
          instructions.push(...block.steps);
        }
        if (block.kind === "worked-example") {
          instructions.push(
            block.example.problem,
            ...block.example.steps,
            block.example.result,
            block.example.dimensionalCheck,
            block.example.independentCheck
          );
          const markup = renderAcademyMathBlock(lesson, block);
          expect(markup, block.id).toContain('data-math-render-status="rendered"');
          expect(markup, block.id).not.toContain('data-math-fallback="true"');
          expect(markup, block.id).toContain("<math");
          expect(markup, `${block.id} standalone punctuation`)
            .not.toMatch(/<p>[,.;:!?]+<\/p>/u);
        }
      }
      for (const question of lesson.questions) {
        if (!question.mathSupport) continue;
        instructions.push(
          question.mathSupport.prompt,
          ...question.mathSupport.hints.filter(
            (instruction): instruction is AcademyInstruction =>
              instruction !== null
          ),
          ...question.mathSupport.solution.filter(
            (instruction): instruction is AcademyInstruction =>
              instruction !== null
          )
        );
      }
    }

    expect(instructions.length).toBeGreaterThan(2_000);
    const mathParts = instructions.flatMap((instruction) =>
      instruction.filter(
        (
          part
        ): part is Extract<AcademyInstruction[number], { kind: "math" }> =>
          part.kind === "math"
      )
    );
    const textParts = instructions.flatMap((instruction) =>
      instruction.filter(
        (
          part
        ): part is Extract<AcademyInstruction[number], { kind: "text" }> =>
          part.kind === "text"
      )
    );
    const mixedInstructions = instructions.filter((instruction) =>
      instruction.some((part) => part.kind === "text")
      && instruction.some((part) => part.kind === "math")
    );

    expect(instructions.every(instructionIsReviewed)).toBe(true);
    expect(mathParts.length).toBeGreaterThan(1_900);
    expect(textParts.length).toBeGreaterThan(500);
    expect(mixedInstructions.length).toBeGreaterThan(100);
    const rawVisibleTextPattern =
      /(?:sqrt|diag|exp|unit)\s*\(|\^[0-9A-Za-z(]|\[[^\]]+\]\^T|\bx_dot\b|[A-Za-z][A-Za-z0-9_]*\s*(?:=|<=|>=)/u;
    for (const part of textParts) {
      expect(
        part.text,
        `native text part must not leak source-like mathematics: ${part.text}`
      ).not.toMatch(rawVisibleTextPattern);
    }

    for (const part of mathParts) {
      const { expression } = part;
      expect(trustRequiringTexCommand.test(expression.latex), expression.id)
        .toBe(false);
      const html = renderReviewedMathToString(
        reviewedInstructionMath(expression),
        expression.displayMode
      );
      expect(html, expression.id).toContain("<math");
      expect(html, expression.id).toContain('encoding="application/x-tex"');
    }

    const authoredLatex = mathParts
      .map((part) => part.expression.latex)
      .join("\n");
    expect(authoredLatex).toContain(String.raw`\frac{`);
    expect(authoredLatex).toContain("^2");
    expect(authoredLatex).toContain("_");
    expect(authoredLatex).toContain(String.raw`\frac{\mathrm{d}`);
    expect(authoredLatex).toContain(String.raw`\begin{bmatrix}`);
    expect(authoredLatex).toContain(String.raw`\mathbf`);
    expect(authoredLatex).toContain(String.raw`\operatorname{unit}`);
    expect(authoredLatex).toContain(String.raw`\mathrm{m\,s^{-1}}`);

    const sourceLikeLatex = /(?:sqrt|diag|exp|unit)\s*\(|(?:^|[^\\])(?:x_dot|Delta\s|\[[^\]]+\]\^T)|\s+x\s+/u;
    for (const part of mathParts) {
      expect(
        part.expression.latex,
        `${part.expression.id} contains source-like visible mathematics`
      ).not.toMatch(sourceLikeLatex);
    }
  });

  it("fails closed when source-like mathematics lacks exact authored metadata", () => {
    expect(sourceContainsUnreviewedMathNotation("Substitute x = sqrt(y^2)."))
      .toBe(true);
    expect(() =>
      buildAcademyReviewedInstruction(
        "UNREVIEWED-MATH",
        "Substitute x = sqrt(y^2).",
        "negative raw-source regression"
      )
    ).toThrow(/Missing explicit semantic mathematics authoring/u);
  });

  it("materialises an authored seeded prompt through the accessible question renderer", async () => {
    const stages = await loadAllAcademyStages();
    const seededQuestion = stages
      .flatMap((stage) => stage.lessons)
      .flatMap((lesson) => lesson.questions)
      .find((question) => question.type === "seeded-calculation");
    expect(seededQuestion).toBeDefined();
    if (!seededQuestion) return;

    const markup = renderToStaticMarkup(createElement(AcademyQuestionSet, {
      identity: "academy-seeded-math-render",
      title: "Generated engineering practice",
      questions: [seededQuestion],
      onAttempt: () => undefined,
      onPassed: () => undefined
    }));

    expect(markup).not.toContain("{{input}}");
    expect(markup).not.toContain("{{expected}}");
    expect(markup).toContain('data-math-render-status="rendered"');
    expect(markup).not.toContain('data-math-fallback="true"');
    expect(markup).toContain("<math");
    expect(markup).toContain('role="math"');
    expect(markup).toContain("Copy plain-text form");
    expect(markup).not.toMatch(/<p>[,.;:!?]+<\/p>/u);
  });
});
