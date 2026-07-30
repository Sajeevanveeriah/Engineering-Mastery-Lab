import { useId } from "react";
import {
  engineeringUnitMathExpressions,
  type ReviewedMathExpression
} from "../data/mathExpressions";
import { renderReviewedMathToString } from "../lib/academy/mathRendering";

export {
  academyKatexOptions,
  academyMathLimits,
  academyMathPolicyFingerprint,
  renderReviewedMathToString,
  trustRequiringTexCommand,
  verifyReviewedMathExpression
} from "../lib/academy/mathRendering";

interface MathPresentationProps {
  expression: ReviewedMathExpression | undefined;
  fallbackText: string;
  label?: string;
  className?: string;
}

interface BlockMathProps extends MathPresentationProps {
  trailingPunctuation?: string;
}

interface RenderedMath {
  html: string | null;
  status: "rendered" | "fallback";
  screenReaderText: string;
}

function joinClassNames(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(" ");
}

function renderMappedMath(
  expression: ReviewedMathExpression | undefined,
  fallbackText: string,
  displayMode: boolean
): RenderedMath {
  const fallbackWording = `Plain-text equation: ${fallbackText}`;
  try {
    if (!expression) throw new Error("Reviewed math mapping is missing.");
    if (expression.plainText !== fallbackText) {
      throw new Error("Reviewed math mapping does not match the authoritative plain text.");
    }
    return {
      html: renderReviewedMathToString(expression, displayMode),
      status: "rendered",
      screenReaderText: expression.screenReaderText
    };
  } catch {
    return {
      html: null,
      status: "fallback",
      screenReaderText: fallbackWording
    };
  }
}

function MathMarkup({
  rendered,
  fallbackText
}: {
  rendered: RenderedMath;
  fallbackText: string;
}) {
  if (rendered.html === null) {
    return (
      <code className="academy-math__fallback" data-math-fallback="true">
        {fallbackText}
      </code>
    );
  }
  return (
    <span
      className="academy-math__rendered"
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}

export function InlineMath({
  expression,
  fallbackText,
  label,
  className
}: MathPresentationProps) {
  const rendered = renderMappedMath(expression, fallbackText, false);
  return (
    <span
      className={joinClassNames("academy-math", "academy-math--inline", className)}
      role="math"
      aria-label={label ?? rendered.screenReaderText}
      data-copy-text={fallbackText}
      data-math-render-status={rendered.status}
    >
      <MathMarkup rendered={rendered} fallbackText={fallbackText} />
    </span>
  );
}

export function BlockMath({
  expression,
  fallbackText,
  label,
  className,
  trailingPunctuation
}: BlockMathProps) {
  const regionInstanceId = useId().replace(/[^A-Za-z0-9]+/gu, "");
  const rendered = renderMappedMath(expression, fallbackText, true);
  const regionLabel = label ?? rendered.screenReaderText;
  return (
    <div className={joinClassNames("academy-math", "academy-math--block", className)}>
      <div
        className="academy-math__scroll-region"
        role="region"
        aria-label={
          `${regionLabel}. Horizontally scrollable when needed. Formula instance ${regionInstanceId}.`
        }
        tabIndex={0}
        data-copy-text={fallbackText}
        data-math-render-status={rendered.status}
      >
        <span className="academy-math__math" role="math" aria-label={rendered.screenReaderText}>
          <MathMarkup rendered={rendered} fallbackText={fallbackText} />
        </span>
        {trailingPunctuation && (
          <span className="academy-math__trailing-punctuation" aria-hidden="true">
            {trailingPunctuation}
          </span>
        )}
      </div>
      <details className="academy-math__plain-text">
        <summary>Copy plain-text form</summary>
        <code>{fallbackText}</code>
      </details>
    </div>
  );
}

export function Equation(props: MathPresentationProps) {
  return <BlockMath {...props} className={joinClassNames("academy-math--equation", props.className)} />;
}

export function AlignedDerivation(props: MathPresentationProps) {
  return (
    <BlockMath
      {...props}
      className={joinClassNames("academy-math--derivation", props.className)}
    />
  );
}

interface VariableDefinitionProps {
  symbol: string;
  meaning: string;
  unit: string;
  symbolExpression?: ReviewedMathExpression;
}

export function VariableDefinition({
  symbol,
  meaning,
  unit,
  symbolExpression
}: VariableDefinitionProps) {
  const unitExpression = engineeringUnitMathExpressions[
    unit as keyof typeof engineeringUnitMathExpressions
  ];
  return (
    <div className="academy-math__variable-definition">
      <dt>
        {symbolExpression
          ? (
              <InlineMath
                expression={symbolExpression}
                fallbackText={symbol}
                label={symbolExpression.screenReaderText}
              />
            )
          : <code>{symbol}</code>}
      </dt>
      <dd>
        {meaning} [
        {unitExpression
          ? (
              <InlineMath
                expression={unitExpression}
                fallbackText={unit}
                label={unitExpression.screenReaderText}
              />
            )
          : unit}
        ]
      </dd>
    </div>
  );
}

export function DimensionalCheck({
  expression,
  fallbackText,
  label,
  className
}: MathPresentationProps) {
  return (
    <div className={joinClassNames("academy-math__dimensional-check", className)}>
      <strong>Dimensional check</strong>
      <BlockMath
        expression={expression}
        fallbackText={fallbackText}
        label={label ?? `Dimensional check: ${fallbackText}`}
      />
    </div>
  );
}
