import katex, { type KatexOptions } from "katex";
import type { ReviewedMathExpression } from "../../data/mathExpressions";

export const academyMathLimits = Object.freeze({
  inputLength: 4_096,
  outputLength: 250_000,
  maxExpand: 500,
  maxSize: 24
});

export const academyKatexOptions: Readonly<KatexOptions> = Object.freeze({
  output: "htmlAndMathml",
  trust: false,
  throwOnError: true,
  strict: "error",
  maxExpand: academyMathLimits.maxExpand,
  maxSize: academyMathLimits.maxSize,
  globalGroup: false
});

export const academyMathPolicyFingerprint = [
  "renderer=katex",
  `output=${String(academyKatexOptions.output)}`,
  `strict=${String(academyKatexOptions.strict)}`,
  `trust=${String(academyKatexOptions.trust)}`,
  `throwOnError=${String(academyKatexOptions.throwOnError)}`,
  `maxExpand=${String(academyKatexOptions.maxExpand)}`,
  `maxSize=${String(academyKatexOptions.maxSize)}`,
  `inputLength=${academyMathLimits.inputLength}`,
  `outputLength=${academyMathLimits.outputLength}`
].join(";");

export const trustRequiringTexCommand =
  /\\(?:href|url|includegraphics|htmlClass|htmlId|htmlStyle|htmlData)\b/;

export interface ReviewedMathVerification {
  verificationId: string;
  renderer: "KaTeX";
  policyFingerprint: string;
  status: "pass" | "fail";
  outputMode: "htmlAndMathml";
  strictMode: "error";
  trustEnabled: false;
  mathMlPresent: boolean;
  error: string | null;
}

export function renderReviewedMathToString(
  expression: ReviewedMathExpression,
  displayMode = false
): string {
  if (
    !expression
    || typeof expression.tex !== "string"
    || typeof expression.plainText !== "string"
    || typeof expression.screenReaderText !== "string"
  ) {
    throw new TypeError("A reviewed math-expression mapping is required.");
  }
  if (expression.tex.length === 0 || expression.tex.length > academyMathLimits.inputLength) {
    throw new RangeError(`TeX input must contain 1 to ${academyMathLimits.inputLength} characters.`);
  }
  if (
    expression.plainText.length === 0
    || expression.plainText.length > academyMathLimits.inputLength
    || expression.screenReaderText.length === 0
    || expression.screenReaderText.length > academyMathLimits.inputLength
  ) {
    throw new RangeError("Plain-text and screen-reader math wording must be present and bounded.");
  }
  if (trustRequiringTexCommand.test(expression.tex)) {
    throw new Error("Trust-requiring TeX commands are prohibited.");
  }

  const html = katex.renderToString(expression.tex, {
    ...academyKatexOptions,
    displayMode
  });
  if (html.length > academyMathLimits.outputLength) {
    throw new RangeError(`KaTeX output exceeded ${academyMathLimits.outputLength} characters.`);
  }
  if (!html.includes("<math")) {
    throw new Error("KaTeX output did not include MathML.");
  }
  return html;
}

export function verifyReviewedMathExpression(
  verificationId: string,
  expression: ReviewedMathExpression,
  displayMode = false
): ReviewedMathVerification {
  try {
    const html = renderReviewedMathToString(expression, displayMode);
    return {
      verificationId,
      renderer: "KaTeX",
      policyFingerprint: academyMathPolicyFingerprint,
      status: "pass",
      outputMode: "htmlAndMathml",
      strictMode: "error",
      trustEnabled: false,
      mathMlPresent: html.includes("<math"),
      error: null
    };
  } catch (error) {
    return {
      verificationId,
      renderer: "KaTeX",
      policyFingerprint: academyMathPolicyFingerprint,
      status: "fail",
      outputMode: "htmlAndMathml",
      strictMode: "error",
      trustEnabled: false,
      mathMlPresent: false,
      error: error instanceof Error ? error.message : "Unknown strict mathematics rendering failure."
    };
  }
}
