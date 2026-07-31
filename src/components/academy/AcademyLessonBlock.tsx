import { useId, useState } from "react";
import { Link } from "react-router";
import {
  AlignedDerivation,
  BlockMath,
  Equation,
  InlineMath,
  VariableDefinition
} from "../AcademyMath";
import { ThirdPartyMedia } from "../ThirdPartyMedia";
import { getAcademyMedia } from "../../data/academyMedia";
import type { ReviewedMathExpression } from "../../data/mathExpressions";
import type {
  AcademyConceptExplorerControl,
  AcademyInstruction,
  AcademyReviewedMath,
  FormulaSpec,
  Lesson,
  LessonBlock,
  SourceReference
} from "../../lib/academy/types";
import {
  AcademyQuestionSet,
  type AcademyQuestionAttempt,
  type AcademyQuestionHistoryEntry
} from "./AcademyQuestion";
import { buildAcademyHandoffRoute } from "../../lib/academy/handoff";

interface AcademyLessonBlockProps {
  lesson: Lesson;
  block: LessonBlock;
  sources: ReadonlyMap<string, SourceReference>;
  initialScores: Readonly<Record<string, number>>;
  attemptHistory: Readonly<
    Record<string, readonly AcademyQuestionHistoryEntry[]>
  >;
  onQuestionAttempt: (blockId: string, attempt: AcademyQuestionAttempt) => void;
  onKnowledgePassed: () => void;
  onPracticePassed: () => void;
  academyReturn?: string;
  appliedEvidenceSatisfied?: boolean;
  onLaboratoryOpen?: (blockId: string) => void;
  onAppliedEvidence?: () => void;
  initialVideoPositions?: Readonly<Record<string, number>>;
  onVideoPosition?: (
    mediaId: string,
    positionSeconds: number,
    durationSeconds: number | null
  ) => void;
}

function reviewedFormula(formula: FormulaSpec): ReviewedMathExpression {
  return {
    id: formula.id,
    plainText: formula.latex,
    tex: formula.latex,
    screenReaderText: formula.spoken
  };
}

function reviewedFormulaVariable(
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

const trailingPunctuationPattern = /^[,.;:!?]+$/u;

function trailingMathPunctuation(
  instruction: AcademyInstruction,
  index: number
): string | undefined {
  const nextPart = instruction[index + 1];
  if (nextPart?.kind !== "text") return undefined;
  const punctuation = nextPart.text.trim();
  return trailingPunctuationPattern.test(punctuation) ? punctuation : undefined;
}

function punctuationConsumedByMath(
  instruction: AcademyInstruction,
  index: number
): boolean {
  const part = instruction[index];
  const previousPart = instruction[index - 1];
  return (
    part?.kind === "text"
    && trailingPunctuationPattern.test(part.text.trim())
    && previousPart?.kind === "math"
  );
}

function InstructionView({
  instruction
}: {
  instruction: AcademyInstruction;
}) {
  return (
    <div className="academy-instruction">
      {instruction.map((part, index) => {
        if (part.kind === "text") {
          if (punctuationConsumedByMath(instruction, index)) return null;
          return <p key={`text-${index}`}>{part.text}</p>;
        }
        const expression = reviewedInstructionMath(part.expression);
        if (!part.expression.displayMode) {
          return (
            <p key={part.expression.id}>
              <InlineMath
              expression={expression}
              fallbackText={part.expression.plainText}
              label={part.expression.spoken}
            />
            {trailingMathPunctuation(instruction, index)}
          </p>
        );
        }
        return (
          <BlockMath
            key={part.expression.id}
            expression={expression}
            fallbackText={part.expression.plainText}
            label={part.expression.spoken}
            trailingPunctuation={trailingMathPunctuation(
              instruction,
              index
            )}
          />
        );
      })}
    </div>
  );
}

function findFormula(lesson: Lesson, formulaId: string): FormulaSpec | null {
  return lesson.formulae.find((formula) => formula.id === formulaId) ?? null;
}

function FormulaPresentation({
  formula,
  inline = false
}: {
  formula: FormulaSpec;
  inline?: boolean;
}) {
  const expression = reviewedFormula(formula);
  if (inline) {
    return (
      <InlineMath
        expression={expression}
        fallbackText={formula.latex}
        label={formula.spoken}
      />
    );
  }
  return (
    <div className="academy-formula">
      <Equation
        expression={expression}
        fallbackText={formula.latex}
        label={formula.spoken}
      />
      {formula.variables.length > 0 && (
        <dl className="academy-formula__variables">
          {formula.variables.map((variable) => (
            <VariableDefinition
              key={`${formula.id}-${variable.symbol}`}
              symbol={variable.symbol}
              meaning={variable.meaning}
              unit={variable.siUnit}
              symbolExpression={reviewedFormulaVariable(formula, variable)}
            />
          ))}
        </dl>
      )}
      {formula.assumptions.length > 0 && (
        <details>
          <summary>Assumptions</summary>
          <ul>{formula.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
        </details>
      )}
    </div>
  );
}

function ConceptExplorer({
  title,
  description,
  controls,
  textEquivalent
}: {
  title: string;
  description: string;
  controls: AcademyConceptExplorerControl[];
  textEquivalent: string;
}) {
  const [selectedControlId, setSelectedControlId] = useState(
    controls[0]?.id ?? ""
  );
  const headingId = useId();
  const resultId = useId();
  const selectedControl = controls.find(
    (control) => control.id === selectedControlId
  ) ?? controls[0];
  return (
    <section className="academy-concept-explorer" aria-labelledby={headingId}>
      <div>
        <p className="eyebrow">Native concept explorer</p>
        <h3 id={headingId}>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="academy-concept-explorer__controls" aria-label="Choose a factor to inspect">
        {controls.map((control) => (
          <button
            key={control.id}
            type="button"
            className={selectedControl?.id === control.id ? "active" : ""}
            aria-pressed={selectedControl?.id === control.id}
            aria-controls={resultId}
            onClick={() => setSelectedControlId(control.id)}
          >
            {control.label}
          </button>
        ))}
      </div>
      <div
        id={resultId}
        className="academy-concept-explorer__result"
        aria-live="polite"
      >
        <strong>{selectedControl?.label ?? "Relationship"}</strong>
        <p>
          {selectedControl?.outcome
            ?? "No authored relationship control is available for this lesson."}
        </p>
        <dl>
          <div>
            <dt>Required action</dt>
            <dd>{selectedControl?.requiredAction ?? "Review the lesson relationship."}</dd>
          </div>
          <div>
            <dt>Retained evidence</dt>
            <dd>{selectedControl?.retainedEvidence ?? textEquivalent}</dd>
          </div>
          <div><dt>Text-equivalent model</dt><dd>{textEquivalent}</dd></div>
        </dl>
      </div>
    </section>
  );
}

export function AcademyLessonBlockView({
  lesson,
  block,
  sources,
  initialScores,
  attemptHistory,
  onQuestionAttempt,
  onKnowledgePassed,
  onPracticePassed,
  academyReturn,
  appliedEvidenceSatisfied = false,
  onLaboratoryOpen = () => undefined,
  initialVideoPositions = {},
  onVideoPosition
}: AcademyLessonBlockProps) {
  switch (block.kind) {
    case "prose":
      return (
        <section className="academy-lesson-block academy-lesson-block--prose">
          <h2>{block.heading}</h2>
          {block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      );
    case "definition":
      return (
        <aside className="academy-lesson-block academy-definition">
          <p className="eyebrow">Definition</p>
          <h3>{block.term}</h3>
          <p>{block.definition}</p>
        </aside>
      );
    case "inline-math":
    case "display-math": {
      const formula = findFormula(lesson, block.formulaId);
      return (
        <section className="academy-lesson-block academy-lesson-block--math">
          <p>{block.context}</p>
          {formula
            ? <FormulaPresentation formula={formula} inline={block.kind === "inline-math"} />
            : <p role="alert">The reviewed formula mapping is unavailable.</p>}
        </section>
      );
    }
    case "derivation": {
      const formula = findFormula(lesson, block.formulaId);
      return (
        <section className="academy-lesson-block academy-derivation">
          <h2>{block.heading}</h2>
          {formula && (
            <AlignedDerivation
              expression={reviewedFormula(formula)}
              fallbackText={formula.latex}
              label={formula.spoken}
            />
          )}
          {!formula && (
            <p role="alert">The reviewed derivation formula mapping is unavailable.</p>
          )}
          <ol>
            {block.steps.map((step, index) => (
              <li key={`${block.id}-step-${index + 1}`}>
                <InstructionView instruction={step} />
              </li>
            ))}
          </ol>
        </section>
      );
    }
    case "worked-example": {
      const formula = block.example.governingFormulaId
        ? findFormula(lesson, block.example.governingFormulaId)
        : null;
      return (
        <section className="academy-lesson-block academy-worked-example">
          <p className="eyebrow">Worked example</p>
          <h2>{block.example.title}</h2>
          <div>
            <strong>Problem</strong>
            <InstructionView instruction={block.example.problem} />
          </div>
          {formula && <FormulaPresentation formula={formula} />}
          <h3>Assumptions</h3>
          <ul>{block.example.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
          <h3>Reasoning and calculation</h3>
          <ol>
            {block.example.steps.map((step, index) => (
              <li key={`${block.example.id}-step-${index + 1}`}>
                <InstructionView instruction={step} />
              </li>
            ))}
          </ol>
          <div className="academy-worked-example__result">
            <strong>Result</strong>
            <InstructionView instruction={block.example.result} />
          </div>
          <dl className="academy-worked-example__checks">
            <div>
              <dt>Dimensional check</dt>
              <dd>
                <InstructionView instruction={block.example.dimensionalCheck} />
              </dd>
            </div>
            <div>
              <dt>Independent check</dt>
              <dd><InstructionView instruction={block.example.independentCheck} /></dd>
            </div>
          </dl>
        </section>
      );
    }
    case "diagram":
      return (
        <figure className="academy-lesson-block academy-diagram">
          <h2>{block.title}</h2>
          <div className="academy-diagram__flow" aria-hidden="true">
            <span>Known input</span><b>to</b><span>Engineering model</span><b>to</b><span>Checked output</span>
          </div>
          <p>{block.description}</p>
          <figcaption><strong>Text equivalent:</strong> {block.textEquivalent}</figcaption>
        </figure>
      );
    case "image":
      return (
        <figure className="academy-lesson-block academy-lesson-image">
          <img
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            loading="lazy"
            decoding="async"
          />
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
    case "media": {
      const media = getAcademyMedia(block.mediaId);
      return (
        <div className="academy-lesson-block">
          {media
            ? (
                <ThirdPartyMedia
                  media={media}
                  initialPositionSeconds={Math.max(
                    block.startSeconds ?? 0,
                    initialVideoPositions[media.id] ?? 0
                  )}
                  segmentEndSeconds={block.endSeconds}
                  onPositionChange={(positionSeconds, durationSeconds) =>
                    onVideoPosition?.(media.id, positionSeconds, durationSeconds)}
                />
              )
            : <p role="alert">This optional media item is unavailable. Continue with the native lesson.</p>}
        </div>
      );
    }
    case "interactive-visual":
      return (
        <div className="academy-lesson-block">
          <ConceptExplorer
            title={block.title}
            description={block.description}
            controls={block.controls}
            textEquivalent={block.textEquivalent}
          />
        </div>
      );
    case "warning":
      return (
        <aside className="academy-lesson-block academy-warning">
          <p className="eyebrow">Engineering caution</p>
          <h3>{block.heading}</h3>
          <p>{block.body}</p>
        </aside>
      );
    case "misconception":
      return (
        <aside className="academy-lesson-block academy-misconception">
          <p className="eyebrow">Common misconception</p>
          <p><strong>Claim:</strong> {block.claim}</p>
          <p><strong>Correction:</strong> {block.correction}</p>
        </aside>
      );
    case "knowledge-check":
    case "practice-set": {
      const questions = block.questionIds
        .map((questionId) => lesson.questions.find((question) => question.id === questionId))
        .filter((question): question is Lesson["questions"][number] => question !== undefined);
      return (
        <div className="academy-lesson-block">
          <AcademyQuestionSet
            identity={`${lesson.id}:${block.id}`}
            title={block.kind === "knowledge-check" ? "Guided knowledge check" : "Lesson practice"}
            questions={questions}
            requiredScorePercent={block.kind === "knowledge-check" ? 100 : 80}
            initialScores={initialScores}
            attemptHistory={attemptHistory}
            onAttempt={(attempt) => onQuestionAttempt(block.id, attempt)}
            onPassed={block.kind === "knowledge-check" ? onKnowledgePassed : onPracticePassed}
          />
        </div>
      );
    }
    case "laboratory-callout": {
      const stage = /^EML-(E[0-4])-D\d{2}$/.exec(lesson.unitId)?.[1];
      if (!stage) {
        throw new Error(`Lesson ${lesson.id} has an invalid Academy unit identity.`);
      }
      const resolvedAcademyReturn = academyReturn
        ?? `/learn/courses/ACADEMY-${stage}/units/${lesson.unitId}/lessons/${lesson.id}?${
          new URLSearchParams({ resume: block.id }).toString()
        }`;
      const handoffRoute = buildAcademyHandoffRoute({
        destinationRoute: block.route,
        academyReturn: resolvedAcademyReturn,
        lessonId: lesson.id,
        blockId: block.id,
        task: block.task,
        expectedOutcome: block.expectedOutcome
      });
      return (
        <aside className="academy-lesson-block academy-laboratory-callout">
          <p className="eyebrow">Applied laboratory</p>
          <h2>{block.title}</h2>
          <p>{block.task}</p>
          <p><strong>Expected outcome:</strong> {block.expectedOutcome}</p>
          <p>
            Opening the activity records unfinished work only and awards nothing. The applied gate
            changes only after learner-attested local evidence is recorded in the exact destination
            context; the app does not independently verify that evidence.
          </p>
          <div>
            <Link
              className="btn"
              to={handoffRoute}
              onClick={() => onLaboratoryOpen(block.id)}
            >
              Open the laboratory
            </Link>
            <span className={`badge ${appliedEvidenceSatisfied ? "success" : ""}`}>
              {appliedEvidenceSatisfied
                ? "Learner-attested evidence recorded"
                : "Learner-attested evidence still required"}
            </span>
          </div>
        </aside>
      );
    }
    case "summary":
      return (
        <section className="academy-lesson-block academy-summary">
          <p className="eyebrow">Lesson summary</p>
          <h2>What to retain</h2>
          <ul>{block.points.map((point) => <li key={point}>{point}</li>)}</ul>
        </section>
      );
    case "source-note": {
      const resolved = block.sourceIds
        .map((sourceId) => sources.get(sourceId))
        .filter((source): source is SourceReference => source !== undefined);
      return (
        <section className="academy-lesson-block academy-sources">
          <details>
            <summary>Sources and attribution</summary>
            <div>
              <h2>Reviewed sources and further context</h2>
              <p>
                These sources support the lesson. They are optional because the native lesson is
                complete.
              </p>
              <ul>
                {resolved.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noreferrer noopener">
                      {source.title}
                    </a>
                    <span>
                      {source.organisation}. {source.licence}. Validated {source.lastValidated}.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </section>
      );
    }
  }
}
