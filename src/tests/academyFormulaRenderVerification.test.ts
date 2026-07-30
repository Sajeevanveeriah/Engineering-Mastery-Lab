import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildAcademyFormulaManifest,
  loadAllAcademyStages
} from "../lib/academy/curriculum";
import {
  buildAcademyFormulaRenderVerificationManifest,
  validateAcademyFormulaRenderVerificationManifest,
  type AcademyFormulaRenderVerificationEntry
} from "../lib/academy/formulaRenderVerification";
import { academyMathPolicyFingerprint } from "../lib/academy/mathRendering";

const stages = await loadAllAcademyStages();

describe("Academy formula strict-render verification", () => {
  it("computes exactly one strict KaTeX and MathML verification for every formula", () => {
    const formulaManifest = buildAcademyFormulaManifest(stages);
    const renderManifest = buildAcademyFormulaRenderVerificationManifest(stages);

    expect(formulaManifest).toHaveLength(113);
    expect(renderManifest).toHaveLength(formulaManifest.length);
    expect(new Set(renderManifest.map((entry) => entry.verificationId)).size)
      .toBe(renderManifest.length);
    expect(validateAcademyFormulaRenderVerificationManifest(
      formulaManifest,
      renderManifest
    )).toEqual([]);

    for (const formula of formulaManifest) {
      const matches = renderManifest.filter(
        (entry) => entry.verificationId === formula.renderVerificationId
      );
      expect(matches, formula.formulaId).toHaveLength(1);
      expect(matches[0]).toEqual(expect.objectContaining({
        formulaId: formula.formulaId,
        lessonId: formula.lessonId,
        renderer: "KaTeX",
        policyFingerprint: academyMathPolicyFingerprint,
        status: "pass",
        outputMode: "htmlAndMathml",
        strictMode: "error",
        trustEnabled: false,
        mathMlPresent: true,
        error: null
      }));
      expect(Object.hasOwn(matches[0], "html"), formula.formulaId).toBe(false);
    }
  });

  it("fails closed when a formula cannot be rendered by the UI renderer", () => {
    const invalidStages = structuredClone(stages);
    const invalidLesson = invalidStages
      .flatMap((stage) => stage.lessons)
      .find((lesson) => lesson.formulae.length > 0);
    if (!invalidLesson) throw new Error("Expected at least one quantitative lesson.");
    invalidLesson.formulae[0].latex = String.raw`\notARealAcademyCommand{`;

    const formulaManifest = buildAcademyFormulaManifest(invalidStages);
    const renderManifest = buildAcademyFormulaRenderVerificationManifest(invalidStages);
    const invalidVerification = renderManifest.find(
      (entry) => entry.formulaId === invalidLesson.formulae[0].id
    );
    expect(invalidVerification).toEqual(expect.objectContaining({
      status: "fail",
      mathMlPresent: false
    }));
    expect(invalidVerification?.error).not.toBeNull();
    expect(validateAcademyFormulaRenderVerificationManifest(
      formulaManifest,
      renderManifest
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "formula-render-failed" })
    ]));
  });

  it("rejects missing, duplicate, orphaned and policy-tampered verification entries", () => {
    const formulaManifest = buildAcademyFormulaManifest(stages);
    const renderManifest = buildAcademyFormulaRenderVerificationManifest(stages);

    expect(validateAcademyFormulaRenderVerificationManifest(
      formulaManifest,
      renderManifest.slice(1)
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "formula-render-link" })
    ]));

    expect(validateAcademyFormulaRenderVerificationManifest(
      formulaManifest,
      [...renderManifest, structuredClone(renderManifest[0])]
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "formula-render-duplicate" })
    ]));

    const orphan: AcademyFormulaRenderVerificationEntry = {
      ...structuredClone(renderManifest[0]),
      verificationId: "academy-formula-render:orphan-lesson:orphan-formula",
      lessonId: "orphan-lesson",
      formulaId: "orphan-formula"
    };
    expect(validateAcademyFormulaRenderVerificationManifest(
      formulaManifest,
      [...renderManifest, orphan]
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "formula-render-orphan" })
    ]));

    const tampered = structuredClone(renderManifest);
    (tampered[0] as unknown as { trustEnabled: boolean }).trustEnabled = true;
    expect(validateAcademyFormulaRenderVerificationManifest(
      formulaManifest,
      tampered
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "formula-render-policy" })
    ]));
  });

  it("keeps the KaTeX implementation out of the broad curriculum import path", () => {
    const source = readFileSync(
      new URL("../lib/academy/curriculum.ts", import.meta.url),
      "utf8"
    );
    expect(source).toContain('from "./formulaRenderVerificationContract"');
    expect(source).not.toMatch(/from "\.\/(?:mathRendering|formulaRenderVerification)"/u);
  });
});
