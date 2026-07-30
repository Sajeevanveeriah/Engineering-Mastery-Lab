import { useEffect, useMemo, useRef, useState } from "react";
import type { ReviewedMathExpression } from "../../data/mathExpressions";
import type {
  AcademyInstruction,
  AcademyQuestion,
  AcademyReviewedMath,
  DiagramQuestion
} from "../../lib/academy/types";
import {
  appendAttemptHistory,
  buildQuestionSetIdentity,
  createAttemptRecord,
  generateAcademyQuestionRetry,
  getInitialOrdering,
  getProgressiveHint,
  getQuestionRetryLimit,
  getSolutionReveal,
  gradeQuestion,
  recentQuestionAttempts,
  reconcileQuestionSetScoreState,
  recordFirstAttemptScore,
  type AssessmentAttemptRecord,
  type AssessmentResponse,
  type GradeResult,
  type QuestionSetScoreState
} from "../../lib/academy/assessment";
import { BlockMath, InlineMath } from "../AcademyMath";

export interface AcademyQuestionAttempt {
  question: AcademyQuestion;
  response: AssessmentResponse;
  grade: GradeResult;
  attempt: AssessmentAttemptRecord;
  hintIds: string[];
  retryIndex: number;
  presentationVariantSeed: number;
}

export interface AcademyQuestionHistoryEntry extends AssessmentAttemptRecord {
  attemptId?: string;
  contextId?: string;
  hintsUsed?: string[];
}

interface AcademyQuestionCardProps {
  question: AcademyQuestion;
  initialAttemptHistory?: readonly AcademyQuestionHistoryEntry[];
  headingLevel?: 3 | 4;
  onAttempt: (result: AcademyQuestionAttempt) => void;
}

const EMPTY_ATTEMPT_HISTORY: readonly AcademyQuestionHistoryEntry[] = [];

function AcademyDiagramFigure({ question }: { question: DiagramQuestion }) {
  const nodesById = new Map(
    question.diagram.nodes.map((node) => [node.id, node])
  );

  return (
    <figure className="academy-question__diagram">
      <div
        className={`academy-question__diagram-plot academy-question__diagram-plot--${question.diagram.layout}`}
        data-layout={question.diagram.layout}
        aria-hidden="true"
      >
        <ol className="academy-question__diagram-nodes">
          {question.diagram.nodes.map((node, nodeIndex) => (
            <li
              key={node.id}
              className="academy-question__diagram-node"
              data-node-id={node.id}
              data-node-role={node.role}
            >
              <span className="academy-question__diagram-node-index">
                Node {nodeIndex + 1}
              </span>
              <strong>{node.label}</strong>
              <span>{node.detail}</span>
            </li>
          ))}
        </ol>
        <ol className="academy-question__diagram-edges">
          {question.diagram.edges.map((edge, edgeIndex) => {
            const from = nodesById.get(edge.fromNodeId);
            const to = nodesById.get(edge.toNodeId);
            const connector = edge.direction === "directed" ? "->" : "<->";
            return (
              <li
                key={edge.id}
                data-edge-id={edge.id}
                data-edge-direction={edge.direction}
              >
                <span>
                  <small>Edge {edgeIndex + 1} from</small>
                  <strong>{from?.label ?? edge.fromNodeId}</strong>
                </span>
                <span className="academy-question__diagram-connector">
                  <small>{edge.direction} relationship</small>
                  <strong>{connector} {edge.label} {connector}</strong>
                </span>
                <span>
                  <small>to</small>
                  <strong>{to?.label ?? edge.toNodeId}</strong>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption>
        <strong>Diagram text equivalent:</strong>
        <p>{question.diagramDescription}</p>
        <ol>
          {question.diagram.edges.map((edge) => {
            const from = nodesById.get(edge.fromNodeId);
            const to = nodesById.get(edge.toNodeId);
            const relationship = edge.direction === "directed"
              ? "directed to"
              : "linked in both directions with";
            return (
              <li key={`${edge.id}-text`}>
                {from?.label ?? edge.fromNodeId} is {relationship}{" "}
                {to?.label ?? edge.toNodeId} through &quot;{edge.label}&quot;.
              </li>
            );
          })}
        </ol>
      </figcaption>
    </figure>
  );
}
const EMPTY_ATTEMPT_HISTORY_BY_QUESTION: Readonly<
  Record<string, readonly AcademyQuestionHistoryEntry[]>
> = {};

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

function substituteInstructionToken(
  value: string,
  token: string,
  replacement: string
): string {
  return value.replaceAll(token, replacement);
}

function materialiseInstruction(
  instruction: AcademyInstruction,
  inputValue: number | null,
  expectedValue: number | null
): AcademyInstruction {
  if (inputValue === null && expectedValue === null) return instruction;
  const replacements = [
    ["{{input}}", inputValue === null ? null : String(inputValue)],
    ["{{expected}}", expectedValue === null ? null : String(expectedValue)]
  ] as const;
  const apply = (value: string): string => replacements.reduce(
    (current, [token, replacement]) => replacement === null
      ? current
      : substituteInstructionToken(current, token, replacement),
    value
  );
  return instruction.map((part) => part.kind === "text"
    ? { ...part, text: apply(part.text) }
    : {
        ...part,
        expression: {
          ...part.expression,
          id: `${part.expression.id}:input-${inputValue ?? "fixed"}:expected-${expectedValue ?? "fixed"}`,
          plainText: apply(part.expression.plainText),
          latex: apply(part.expression.latex),
          spoken: apply(part.expression.spoken)
        }
      });
}

function QuestionInstruction({
  instruction,
  inputValue,
  expectedValue
}: {
  instruction: AcademyInstruction;
  inputValue: number | null;
  expectedValue: number | null;
}) {
  const materialised = materialiseInstruction(
    instruction,
    inputValue,
    expectedValue
  );
  return (
    <div className="academy-question__math-instruction">
      {materialised.map((part, index) => {
        if (part.kind === "text") {
          if (punctuationConsumedByMath(materialised, index)) return null;
          return <p key={`text-${index}`}>{part.text}</p>;
        }
        const expression = reviewedInstructionMath(part.expression);
        if (part.expression.displayMode) {
          return (
            <BlockMath
              key={part.expression.id}
              expression={expression}
              fallbackText={part.expression.plainText}
              label={part.expression.spoken}
              trailingPunctuation={trailingMathPunctuation(
                materialised,
                index
              )}
            />
          );
        }
        return (
          <p key={part.expression.id}>
            <InlineMath
              expression={expression}
              fallbackText={part.expression.plainText}
              label={part.expression.spoken}
            />
            {trailingMathPunctuation(materialised, index)}
          </p>
        );
      })}
    </div>
  );
}

function availableUnits(question: AcademyQuestion): string[] {
  if (question.type !== "numeric" && question.type !== "seeded-calculation") return [];
  const units = Object.keys(question.acceptedUnits);
  return units.includes(question.canonicalUnit)
    ? units
    : [question.canonicalUnit, ...units];
}

function responseSummary(response: AssessmentResponse): string {
  switch (response.type) {
    case "single-choice":
    case "diagram":
    case "code-analysis":
      return response.optionId;
    case "multiple-selection":
      return response.optionIds.join(", ");
    case "numeric":
    case "seeded-calculation":
      return `${response.value} ${response.unit}`;
    case "ordering":
      return response.itemIds.join(" > ");
    case "matching":
      return Object.entries(response.pairs).map(([left, right]) => `${left}:${right}`).join(", ");
    case "short-response":
      return response.text;
  }
}

export function AcademyQuestionCard({
  question,
  initialAttemptHistory = EMPTY_ATTEMPT_HISTORY,
  headingLevel = 4,
  onAttempt
}: AcademyQuestionCardProps) {
  const [retryIndex, setRetryIndex] = useState(0);
  const generatedRetry = useMemo(
    () => generateAcademyQuestionRetry(question, retryIndex),
    [question, retryIndex]
  );
  const activeQuestion = generatedRetry.question;
  const [optionId, setOptionId] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [numericValue, setNumericValue] = useState("");
  const units = useMemo(
    () => availableUnits(activeQuestion),
    [activeQuestion]
  );
  const [unit, setUnit] = useState(units[0] ?? "");
  const [order, setOrder] = useState<string[]>(
    activeQuestion.type === "ordering"
      ? getInitialOrdering(activeQuestion, retryIndex)
      : []
  );
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [shortText, setShortText] = useState("");
  const [shownHints, setShownHints] = useState<string[]>([]);
  const persistedHistory = useMemo(
    () => recentQuestionAttempts(
      initialAttemptHistory,
      question.id
    ) as AcademyQuestionHistoryEntry[],
    [initialAttemptHistory, question.id]
  );
  const [history, setHistory] = useState<AcademyQuestionHistoryEntry[]>(
    persistedHistory
  );
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [submittedSummary, setSubmittedSummary] = useState("");
  const [solution, setSolution] = useState<string[]>([]);
  const [error, setError] = useState("");
  const promptRef = useRef<HTMLHeadingElement>(null);
  const QuestionHeading = headingLevel === 3 ? "h3" : "h4";

  const prompt = activeQuestion.prompt;
  const variantInputValue = generatedRetry.inputValue;
  const variantExpectedValue = generatedRetry.expectedValue;
  const retryLimit = getQuestionRetryLimit(question);

  useEffect(() => {
    const initialQuestion = generateAcademyQuestionRetry(question, 0).question;
    const initialUnits = availableUnits(initialQuestion);
    setOptionId("");
    setSelectedOptions([]);
    setNumericValue("");
    setUnit(initialUnits[0] ?? "");
    setOrder(
      initialQuestion.type === "ordering"
        ? getInitialOrdering(initialQuestion, 0)
        : []
    );
    setPairs({});
    setShortText("");
    setRetryIndex(0);
    setShownHints([]);
    setGrade(null);
    setSubmittedSummary("");
    setSolution([]);
    setError("");
  }, [question]);

  useEffect(() => {
    setHistory(persistedHistory);
  }, [persistedHistory]);

  useEffect(() => {
    if (retryIndex > 0) promptRef.current?.focus();
  }, [retryIndex]);

  const createResponse = (): AssessmentResponse => {
    switch (activeQuestion.type) {
      case "single-choice":
        if (!optionId) throw new Error("Choose one answer before checking.");
        return { type: "single-choice", optionId };
      case "multiple-selection":
        if (selectedOptions.length === 0) {
          throw new Error("Choose at least one answer before checking.");
        }
        return { type: "multiple-selection", optionIds: selectedOptions };
      case "numeric": {
        if (numericValue.trim() === "") throw new Error("Enter a numeric answer before checking.");
        return { type: "numeric", value: Number(numericValue), unit };
      }
      case "ordering":
        return { type: "ordering", itemIds: order };
      case "matching":
        if (activeQuestion.left.some((item) => !pairs[item.id])) {
          throw new Error("Complete every match before checking.");
        }
        return { type: "matching", pairs };
      case "short-response":
        if (shortText.trim() === "") throw new Error("Write a response before checking.");
        return { type: "short-response", text: shortText };
      case "diagram":
        if (!optionId) throw new Error("Choose one interpretation before checking.");
        return { type: "diagram", optionId };
      case "code-analysis":
        if (!optionId) throw new Error("Choose one code analysis before checking.");
        return { type: "code-analysis", optionId };
      case "seeded-calculation":
        if (numericValue.trim() === "") throw new Error("Enter a numeric answer before checking.");
        return { type: "seeded-calculation", value: Number(numericValue), unit };
    }
  };

  const submit = () => {
    try {
      const response = createResponse();
      const result = gradeQuestion(activeQuestion, response, { retryIndex });
      const attemptedAt = new Date().toISOString();
      const attempt = {
        ...createAttemptRecord(
          activeQuestion,
          response,
          result,
          attemptedAt,
          retryIndex
        ),
        variantSeed: generatedRetry.variantSeed
      };
      const nextHistory = appendAttemptHistory(
        history,
        attempt
      ) as AcademyQuestionHistoryEntry[];
      setHistory(nextHistory);
      setGrade(result);
      setSubmittedSummary(responseSummary(response));
      setSolution([]);
      setError("");
      onAttempt({
        question: activeQuestion,
        response,
        grade: result,
        attempt,
        hintIds: shownHints.map(
          (_, index) => `${activeQuestion.id}-H${index + 1}`
        ),
        retryIndex,
        presentationVariantSeed: generatedRetry.variantSeed
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This answer could not be checked.");
    }
  };

  const requestHint = () => {
    const result = getProgressiveHint(activeQuestion, shownHints.length);
    if (result.hint) setShownHints((current) => [...current, result.hint!]);
  };

  const revealSolution = () => {
    const result = getSolutionReveal(activeQuestion, {
      attemptHistory: history,
      explicitReveal: false
    });
    if (result.revealed) setSolution(result.solution);
    else setError(result.reason);
  };

  const moveOrderItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const startNewVariant = () => {
    const nextRetryIndex = Math.min(
      retryLimit,
      retryIndex + 1
    );
    const nextQuestion = generateAcademyQuestionRetry(
      question,
      nextRetryIndex
    ).question;
    setRetryIndex(nextRetryIndex);
    setOptionId("");
    setSelectedOptions([]);
    setNumericValue("");
    setUnit(availableUnits(nextQuestion)[0] ?? "");
    setOrder(
      nextQuestion.type === "ordering"
        ? getInitialOrdering(nextQuestion, nextRetryIndex)
        : []
    );
    setPairs({});
    setShortText("");
    setGrade(null);
    setSubmittedSummary("");
    setSolution([]);
    setShownHints([]);
    setError("");
  };

  return (
    <article className="academy-question" aria-labelledby={`${question.id}-prompt`}>
      <div className="academy-question__number">
        <span>{activeQuestion.type.replaceAll("-", " ")}</span>
        <small>
          {retryIndex === 0 ? "Base case" : `Retry case ${retryIndex}`} -{" "}
          {activeQuestion.skillIds.length} linked skill
          {activeQuestion.skillIds.length === 1 ? "" : "s"}
        </small>
      </div>
      <QuestionHeading
        id={`${question.id}-prompt`}
        ref={promptRef}
        tabIndex={-1}
        aria-live="polite"
      >
        {prompt}
      </QuestionHeading>
      {activeQuestion.mathSupport && (
        <QuestionInstruction
          instruction={activeQuestion.mathSupport.prompt}
          inputValue={variantInputValue}
          expectedValue={variantExpectedValue}
        />
      )}

      {(
        activeQuestion.type === "single-choice"
        || activeQuestion.type === "diagram"
        || activeQuestion.type === "code-analysis"
      ) && (
        <>
          {activeQuestion.type === "diagram" && (
            <AcademyDiagramFigure question={activeQuestion} />
          )}
          {activeQuestion.type === "code-analysis" && (
            <figure className="academy-question__code-analysis">
              <figcaption>
                Static {activeQuestion.language} code for analysis. It is displayed only and is never executed.
              </figcaption>
              <pre tabIndex={0}>
                <code className={`language-${activeQuestion.language}`}>{activeQuestion.code}</code>
              </pre>
            </figure>
          )}
          <fieldset>
            <legend>
              {activeQuestion.type === "code-analysis"
                ? "Choose the best analysis"
                : "Choose one answer"}
            </legend>
            {activeQuestion.options.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name={`${question.id}-option`}
                  value={option.id}
                  checked={optionId === option.id}
                  onChange={() => setOptionId(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        </>
      )}

      {activeQuestion.type === "multiple-selection" && (
        <fieldset>
          <legend>Choose every answer that applies</legend>
          {activeQuestion.options.map((option) => (
            <label key={option.id}>
              <input
                type="checkbox"
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={(event) => setSelectedOptions((current) => (
                  event.target.checked
                    ? [...current, option.id]
                    : current.filter((id) => id !== option.id)
                ))}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      )}

      {(activeQuestion.type === "numeric" || activeQuestion.type === "seeded-calculation") && (
        <div className="academy-question__numeric">
          <label>
            <span>Numeric answer</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={numericValue}
              onChange={(event) => setNumericValue(event.target.value)}
            />
          </label>
          <label>
            <span>Unit</span>
            <select value={unit} onChange={(event) => setUnit(event.target.value)}>
              {units.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      )}

      {activeQuestion.type === "ordering" && (
        <ol className="academy-question__ordering">
          {order.map((itemId, index) => {
            const item = activeQuestion.items.find((candidate) => candidate.id === itemId)!;
            return (
              <li key={itemId}>
                <span>{item.label}</span>
                <div>
                  <button
                    type="button"
                    aria-label={`Move ${item.label} earlier`}
                    disabled={index === 0}
                    onClick={() => moveOrderItem(index, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${item.label} later`}
                    disabled={index === order.length - 1}
                    onClick={() => moveOrderItem(index, 1)}
                  >
                    Down
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {activeQuestion.type === "matching" && (
        <div className="academy-question__matching">
          {activeQuestion.left.map((left) => (
            <label key={left.id}>
              <span>{left.label}</span>
              <select
                value={pairs[left.id] ?? ""}
                onChange={(event) => setPairs((current) => ({
                  ...current,
                  [left.id]: event.target.value
                }))}
              >
                <option value="">Choose a match</option>
                {activeQuestion.right.map((right) => (
                  <option key={right.id} value={right.id}>{right.label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      {activeQuestion.type === "short-response" && (
        <label className="academy-question__short-response">
          <span>Your explanation</span>
          <textarea
            rows={5}
            value={shortText}
            onChange={(event) => setShortText(event.target.value)}
          />
        </label>
      )}

      <div className="academy-question__actions">
        <button className="btn" type="button" onClick={submit}>Check answer</button>
        <button
          className="btn secondary"
          type="button"
          disabled={shownHints.length >= activeQuestion.hints.length}
          onClick={requestHint}
        >
          {shownHints.length === 0 ? "Show first hint" : "Show next hint"}
        </button>
        {grade && (
          <button className="btn secondary" type="button" onClick={revealSolution}>
            Show worked solution
          </button>
        )}
        {grade && retryIndex < retryLimit && (
          <button className="btn secondary" type="button" onClick={startNewVariant}>
            Try a different answer case
          </button>
        )}
      </div>

      {shownHints.length > 0 && (
        <aside className="academy-question__hints" aria-label="Progressive hints">
          <h5>Hints used</h5>
          <ol>
            {shownHints.map((hint, index) => (
              <li key={`${activeQuestion.id}-hint-${index}`}>
                <p>{hint}</p>
                {activeQuestion.mathSupport?.hints[index] && (
                  <QuestionInstruction
                    instruction={activeQuestion.mathSupport.hints[index]}
                    inputValue={variantInputValue}
                    expectedValue={variantExpectedValue}
                  />
                )}
              </li>
            ))}
          </ol>
        </aside>
      )}

      {error && <p className="academy-question__error" role="alert">{error}</p>}

      {grade && (
        <div
          className={`academy-question__feedback academy-question__feedback--${grade.isCorrect ? "correct" : "retry"}`}
          role="status"
        >
          <strong>{grade.isCorrect ? "Correct" : "Not yet"}</strong>
          <span>{grade.scorePercent}%</span>
          {grade.feedback.map((message) => <p key={message}>{message}</p>)}
          <small>Recorded response: {submittedSummary}</small>
        </div>
      )}

      {solution.length > 0 && (
        <section className="academy-question__solution" aria-label="Worked solution">
          <h5>Worked solution</h5>
          <ol>
            {solution.map((step, index) => (
              <li key={`${activeQuestion.id}-solution-${index}`}>
                <p>{step}</p>
                {activeQuestion.mathSupport?.solution[index] && (
                  <QuestionInstruction
                    instruction={activeQuestion.mathSupport.solution[index]}
                    inputValue={variantInputValue}
                    expectedValue={variantExpectedValue}
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <details className="academy-attempt-history academy-question__attempt-history">
        <summary>Question attempt history ({history.length})</summary>
        {history.length === 0 ? (
          <p>No response has been recorded for this question on this device.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Attempted</th>
                  <th scope="col">Context</th>
                  <th scope="col">Case</th>
                  <th scope="col">Score</th>
                  <th scope="col">Response</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((attempt, index) => (
                  <tr
                    key={attempt.attemptId ?? `${
                      attempt.attemptedAt
                    }:${attempt.responseSummary}:${index}`}
                  >
                    <td>{new Date(attempt.attemptedAt).toLocaleString("en-AU")}</td>
                    <td>{attempt.contextId ?? "Current question set"}</td>
                    <td>
                      {(attempt.retryIndex ?? 0) === 0
                        ? "Base"
                        : `Retry ${attempt.retryIndex}`}
                    </td>
                    <td>{attempt.scorePercent}%</td>
                    <td>{attempt.responseSummary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </article>
  );
}

interface AcademyQuestionSetProps {
  identity?: string;
  title: string;
  questions: AcademyQuestion[];
  requiredScorePercent?: number;
  initialScores?: Readonly<Record<string, number>>;
  attemptHistory?: Readonly<
    Record<string, readonly AcademyQuestionHistoryEntry[]>
  >;
  headingLevel?: 2 | 3;
  scorePolicy?: "first-attempt" | "latest";
  onAttempt: (result: AcademyQuestionAttempt) => void;
  onPassed: (scorePercent: number) => void;
  onProgress?: (progress: {
    attempted: number;
    total: number;
    scorePercent: number;
  }) => void;
}

export function AcademyQuestionSet({
  identity,
  title,
  questions,
  requiredScorePercent = 100,
  initialScores = {},
  attemptHistory = EMPTY_ATTEMPT_HISTORY_BY_QUESTION,
  headingLevel = 3,
  scorePolicy = "latest",
  onAttempt,
  onPassed,
  onProgress
}: AcademyQuestionSetProps) {
  const questionSignature = JSON.stringify([
    identity ?? title,
    questions.map((question) => [question.id, question.type])
  ]);
  const identityBaselineRef = useRef<{
    questionSignature: string;
    setIdentity: string;
  } | null>(null);
  if (
    identityBaselineRef.current === null
    || identityBaselineRef.current.questionSignature !== questionSignature
  ) {
    identityBaselineRef.current = {
      questionSignature,
      setIdentity: buildQuestionSetIdentity(
        identity ?? title,
        questions,
        initialScores
      )
    };
  }
  const setIdentity = identityBaselineRef.current.setIdentity;
  const SetHeading = headingLevel === 2 ? "h2" : "h3";
  const [scoreState, setScoreState] = useState<QuestionSetScoreState>(() => ({
    identity: setIdentity,
    scores: { ...initialScores }
  }));
  const scores = scoreState.identity === setIdentity
    ? scoreState.scores
    : { ...initialScores };
  const passedIdentityRef = useRef<string | null>(null);
  const attempted = questions.filter((question) => scores[question.id] !== undefined).length;
  const scorePercent = questions.length === 0
    ? 100
    : Math.round(
      questions.reduce((total, question) => total + (scores[question.id] ?? 0), 0)
      / questions.length
    );

  useEffect(() => {
    setScoreState((current) =>
      reconcileQuestionSetScoreState(current, setIdentity, initialScores)
    );
  }, [initialScores, setIdentity]);

  useEffect(() => {
    if (
      passedIdentityRef.current !== setIdentity
      && attempted === questions.length
      && scorePercent >= requiredScorePercent
    ) {
      passedIdentityRef.current = setIdentity;
      onPassed(scorePercent);
    }
  }, [
    attempted,
    onPassed,
    questions.length,
    requiredScorePercent,
    scorePercent,
    setIdentity
  ]);

  useEffect(() => {
    onProgress?.({ attempted, total: questions.length, scorePercent });
  }, [attempted, onProgress, questions.length, scorePercent]);

  const handleAttempt = (result: AcademyQuestionAttempt) => {
    setScoreState((current) => {
      const reconciled = reconcileQuestionSetScoreState(
        current,
        setIdentity,
        initialScores
      );
      const currentScores = reconciled.scores;
      const nextScores = scorePolicy === "first-attempt"
        ? recordFirstAttemptScore(
            currentScores,
            result.question.id,
            result.grade.scorePercent
          )
        : {
            ...currentScores,
            [result.question.id]: result.grade.scorePercent
          };
      if (
        reconciled === current
        && nextScores === current.scores
      ) {
        return current;
      }
      return { identity: setIdentity, scores: nextScores };
    });
    onAttempt(result);
  };

  return (
    <section className="academy-question-set" aria-labelledby={`${questions[0]?.id ?? "empty"}-set-title`}>
      <div className="academy-question-set__heading">
        <div>
          <p className="eyebrow">Active recall</p>
          <SetHeading id={`${questions[0]?.id ?? "empty"}-set-title`}>
            {title}
          </SetHeading>
        </div>
        <div>
          <strong>{attempted}/{questions.length}</strong>
          <span>
            answered, {scorePercent}% {scorePolicy === "first-attempt" ? "first-attempt" : "current"} score
          </span>
        </div>
      </div>
      <progress
        value={scorePercent}
        max={100}
        aria-label={`${title} ${scorePolicy === "first-attempt" ? "first-attempt" : "current"} score`}
      >
        {scorePercent}%
      </progress>
      {questions.map((question) => (
        <AcademyQuestionCard
          key={`${setIdentity}:${question.id}`}
          question={question}
          initialAttemptHistory={
            attemptHistory[question.id] ?? EMPTY_ATTEMPT_HISTORY
          }
          headingLevel={headingLevel === 2 ? 3 : 4}
          onAttempt={handleAttempt}
        />
      ))}
      {attempted === questions.length && scorePercent < requiredScorePercent && (
        <p className="academy-question-set__retry" role="status">
          {scorePolicy === "first-attempt"
            ? `First-attempt score: ${scorePercent}%. Feedback and retries remain available for learning, but later responses do not replace this score.`
            : `Current score: ${scorePercent}%. Reach ${requiredScorePercent}% by revisiting the feedback and retrying.`}
        </p>
      )}
    </section>
  );
}
