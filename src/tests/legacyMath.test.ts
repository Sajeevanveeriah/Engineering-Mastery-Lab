import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Equation,
  InlineMath,
  renderReviewedMathToString
} from "../components/AcademyMath";
import {
  buildEmbeddedByteMathExpression,
  flagshipVariableMathExpressions,
  labMathExpressions,
  moduleMathExpressions,
  workspaceMathExpressions,
  type ReviewedMathExpression
} from "../data/mathExpressions";
import { modules } from "../data/modules";
import { flagshipWorkflowSpecifications } from "../lib/flagships";

const expectedModuleMathKeys = [
  "electrical:0",
  "electrical:1",
  "electrical:2",
  "electrical:3",
  "embedded:2",
  "mechanical:0",
  "mechanical:1",
  "mechanical:2",
  "ml:0",
  "ml:2",
  "ml:3",
  "pid:0",
  "pid:2",
  "plc:0",
  "practice:1",
  "robotics:0"
] as const;

const labExpressionReferences = {
  "../pages/PidLab.tsx": ["pid-first-order", "pid-second-order"],
  "../pages/ElectricalLab.tsx": [
    "electrical-ohm",
    "electrical-rc-charge",
    "electrical-rc-filter",
    "electrical-rlc",
    "electrical-divider-adc"
  ],
  "../pages/MlLab.tsx": ["ml-regression", "ml-classification", "ml-z-score"],
  "../pages/EmbeddedLab.tsx": ["embedded-latency"],
  "../pages/RoboticsLab.tsx": ["robotics-differential-drive"],
  "../pages/MechanicalLab.tsx": [
    "mechanical-gear",
    "mechanical-smd",
    "mechanical-vibration"
  ],
  "../pages/PracticeLab.tsx": ["practice-rpn"]
} as const;

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function expectRenderedMath(expression: ReviewedMathExpression): void {
  const strictHtml = renderReviewedMathToString(expression, true);
  expect(strictHtml, expression.id).toContain("<math");
  const componentHtml = renderToStaticMarkup(createElement(Equation, {
    expression,
    fallbackText: expression.plainText,
    label: expression.screenReaderText
  }));
  expect(componentHtml, expression.id).toContain('role="math"');
  expect(componentHtml, expression.id).toContain('data-math-render-status="rendered"');
  expect(componentHtml, expression.id).toContain("<math");
  expect(componentHtml, expression.id).not.toContain('data-math-fallback="true"');
}

describe("legacy instructional math migration", () => {
  it("maps every reviewed ModuleShell lesson paragraph explicitly", () => {
    expect(Object.keys(moduleMathExpressions).sort()).toEqual(expectedModuleMathKeys);
    for (const key of expectedModuleMathKeys) {
      const [moduleId, paragraphIndexText] = key.split(":");
      const module = modules.find((candidate) => candidate.id === moduleId);
      const paragraphIndex = Number(paragraphIndexText);
      expect(module, key).toBeDefined();
      expect(module?.learn[paragraphIndex], key).toBeTruthy();
      expectRenderedMath(moduleMathExpressions[key]);
    }
  });

  it("keeps raw equation syntax out of ModuleShell teaching prose", () => {
    const rawEquationGlyph =
      /[=\u222B\u221A\u00B7\u00D7\u2212\u03C4\u03B6\u03C9\u03C3\u00B2]/u;
    for (const module of modules) {
      for (const [index, paragraph] of module.learn.entries()) {
        expect(rawEquationGlyph.test(paragraph), `${module.id}:${index} ${paragraph}`).toBe(false);
      }
    }
  });

  it("renders every lab and engineering-workspace expression as accessible MathML", () => {
    for (const expression of [
      ...Object.values(labMathExpressions),
      ...Object.values(workspaceMathExpressions)
    ]) {
      expectRenderedMath(expression);
    }
  });

  it("renders every bounded embedded byte value and rejects values outside the byte domain", () => {
    for (let byte = 0; byte <= 255; byte += 1) {
      const expression = buildEmbeddedByteMathExpression(byte);
      expect(expression.plainText).toMatch(
        /^byte = 0x[0-9A-F]{2} = 0b[01]{8}$/u
      );
      expectRenderedMath(expression);
    }
    for (const invalid of [-1, 0.5, 256, Number.NaN]) {
      expect(() => buildEmbeddedByteMathExpression(invalid)).toThrow(
        /integer from 0 to 255/u
      );
    }
  });

  it("keeps every lab expression connected to its intended simulator surface", () => {
    const referencedKeys: string[] = [];
    for (const [relativePath, keys] of Object.entries(labExpressionReferences)) {
      const pageSource = source(relativePath);
      expect(pageSource, relativePath).toContain('from "../components/AcademyMath"');
      for (const key of keys) {
        expect(pageSource, `${relativePath}: ${key}`)
          .toContain(`labMathExpressions["${key}"]`);
        referencedKeys.push(key);
      }
    }
    expect(referencedKeys.sort()).toEqual(Object.keys(labMathExpressions).sort());

    const workspaceSource = source("../pages/EngineeringWorkspacePage.tsx");
    expect(workspaceSource).toContain(
      'workspaceMathExpressions["motor-sizing-power"]'
    );
  });

  it("covers and renders every flagship variable symbol", () => {
    const expectedSymbols = [...new Set(
      flagshipWorkflowSpecifications.flatMap((workflow) =>
        workflow.equations.flatMap((equation) =>
          equation.variables.map((variable) => variable.symbol)
        )
      )
    )].sort();
    expect(Object.keys(flagshipVariableMathExpressions).sort())
      .toEqual(expectedSymbols);

    for (const symbol of expectedSymbols) {
      const expression = flagshipVariableMathExpressions[
        symbol as keyof typeof flagshipVariableMathExpressions
      ];
      const html = renderToStaticMarkup(createElement(InlineMath, {
        expression,
        fallbackText: symbol,
        label: expression.screenReaderText
      }));
      expect(html, symbol).toContain('role="math"');
      expect(html, symbol).toContain('data-math-render-status="rendered"');
      expect(html, symbol).toContain("<math");
    }
  });

  it("routes Academy and legacy Mastery variable definitions through reviewed symbols", () => {
    const academyLessonSource = source(
      "../components/academy/AcademyLessonBlock.tsx"
    );
    expect(academyLessonSource).toContain(
      "symbolExpression={reviewedFormulaVariable(formula, variable)}"
    );

    const masterySource = source("../pages/MasteryModulePage.tsx");
    expect(masterySource).toContain("masteryVariableMathExpressions[");
    expect(masterySource).toContain("symbolExpression={");
    expect(masterySource).toContain("engineeringUnitMathExpressions[");
    expect(masterySource).toContain("<MasteryMeasurement");

    const mathComponentSource = source("../components/AcademyMath.tsx");
    expect(mathComponentSource).toContain(
      "label={symbolExpression.screenReaderText}"
    );
  });

  it("guards the legacy visible strings that previously bypassed reviewed math", () => {
    const legacyVisiblePatterns: Array<[string, RegExp]> = [
      ["../pages/PidLab.tsx", /First-order \(\u03C4|Damping ratio \u03B6|Plant time constant \u03C4/u],
      ["../pages/ElectricalLab.tsx", /\u03C4 = RC|\u03C9\u2080|Damping \u03B6/u],
      ["../pages/MlLab.tsx", /True relationship y =|Test R\u00B2/u],
      ["../pages/EmbeddedLab.tsx", /Polling worst case =|Byte = 0x/u],
      ["../pages/RoboticsLab.tsx", /Odometry noise \u03C3|\u03B8=/u],
      ["../pages/MechanicalLab.tsx", /label="fn"|>\u03B6<|Natural freq fn/u],
      ["../pages/PracticeLab.tsx", /RPN = Severity/u],
      ["../pages/EngineeringWorkspacePage.tsx", /<code>omega =/u],
      ["../pages/FlagshipWorkflowPage.tsx", /Variables for \$\{equation\.expression\}/u]
    ];
    for (const [relativePath, pattern] of legacyVisiblePatterns) {
      expect(source(relativePath), `${relativePath}: ${pattern}`).not.toMatch(pattern);
    }
  });
});
