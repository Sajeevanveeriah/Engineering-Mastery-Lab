import type { AcademyStageContent } from "./types";
import {
  getAcademyFormulaRenderVerificationId,
  type AcademyFormulaRenderLink
} from "./formulaRenderVerificationContract";
import {
  academyMathPolicyFingerprint,
  verifyReviewedMathExpression,
  type ReviewedMathVerification
} from "./mathRendering";

export interface AcademyFormulaRenderVerificationEntry
  extends ReviewedMathVerification {
  formulaId: string;
  lessonId: string;
}

export interface AcademyFormulaRenderVerificationIssue {
  code:
    | "formula-render-link"
    | "formula-render-duplicate"
    | "formula-render-orphan"
    | "formula-render-policy"
    | "formula-render-failed";
  path: string;
  message: string;
}

export { getAcademyFormulaRenderVerificationId };

export const buildAcademyFormulaRenderVerificationManifest = (
  stageContents: readonly AcademyStageContent[]
): AcademyFormulaRenderVerificationEntry[] =>
  stageContents.flatMap((stage) =>
    stage.lessons.flatMap((lesson) =>
      lesson.formulae.map((formula) => {
        const verificationId = getAcademyFormulaRenderVerificationId(lesson.id, formula.id);
        return {
          formulaId: formula.id,
          lessonId: lesson.id,
          ...verifyReviewedMathExpression(
            verificationId,
            {
              id: formula.id,
              plainText: formula.latex,
              tex: formula.latex,
              screenReaderText: formula.spoken
            },
            formula.displayMode
          )
        };
      })
    )
  );

export const validateAcademyFormulaRenderVerificationManifest = (
  formulaManifest: readonly AcademyFormulaRenderLink[],
  renderManifest: readonly AcademyFormulaRenderVerificationEntry[]
): AcademyFormulaRenderVerificationIssue[] => {
  const issues: AcademyFormulaRenderVerificationIssue[] = [];
  const linkedIds = new Set(formulaManifest.map((entry) => entry.renderVerificationId));
  const verificationById = new Map<string, AcademyFormulaRenderVerificationEntry[]>();

  for (const verification of renderManifest) {
    const entries = verificationById.get(verification.verificationId) ?? [];
    entries.push(verification);
    verificationById.set(verification.verificationId, entries);
  }

  for (const formula of formulaManifest) {
    const expectedId = getAcademyFormulaRenderVerificationId(
      formula.lessonId,
      formula.formulaId
    );
    const matches = verificationById.get(formula.renderVerificationId) ?? [];
    if (
      formula.renderVerificationId !== expectedId
      || matches.length !== 1
      || matches[0]?.formulaId !== formula.formulaId
      || matches[0]?.lessonId !== formula.lessonId
    ) {
      issues.push({
        code: "formula-render-link",
        path: `formulaManifest.${formula.formulaId}.renderVerificationId`,
        message: "Formula must link to exactly one matching strict-render verification."
      });
      continue;
    }

    const verification = matches[0];
    if (
      verification.outputMode !== "htmlAndMathml"
      || verification.strictMode !== "error"
      || verification.trustEnabled !== false
      || verification.policyFingerprint !== academyMathPolicyFingerprint
      || verification.renderer !== "KaTeX"
      || verification.mathMlPresent !== true
    ) {
      issues.push({
        code: "formula-render-policy",
        path: `formulaRenderManifest.${verification.verificationId}`,
        message: "Formula render verification does not match the Academy strict-render policy."
      });
    }
    if (verification.status !== "pass" || verification.error !== null) {
      issues.push({
        code: "formula-render-failed",
        path: `formulaRenderManifest.${verification.verificationId}`,
        message: verification.error ?? "Formula strict-render verification failed."
      });
    }
  }

  for (const [verificationId, entries] of verificationById) {
    if (entries.length > 1) {
      issues.push({
        code: "formula-render-duplicate",
        path: `formulaRenderManifest.${verificationId}`,
        message: "Formula strict-render verification ID is duplicated."
      });
    }
    if (!linkedIds.has(verificationId)) {
      issues.push({
        code: "formula-render-orphan",
        path: `formulaRenderManifest.${verificationId}`,
        message: "Formula strict-render verification is not linked from the formula manifest."
      });
    }
  }

  return issues;
};
