import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type {
  AcademyDomainCondition,
  AcademyLessonTeachingProfileV2,
  AcademyMatchingScenario,
  AcademyOrderingScenario,
  AcademyQ4Scenario,
  AcademyQ5Scenario,
  AcademyQuestionFeedback,
  AcademySelectionScenario,
  AcademyShortResponseScenario
} from "../../data/academy/lessonTeachingProfileV2";
import {
  getInitialOrdering,
  type GradeResult
} from "../../lib/academy/assessment";
import {
  academyLessonV2AssessmentId,
  academyLessonV2QuestionId,
  academyLessonV2ScenarioPrompt,
  buildAcademyLessonV2CodeQuestion,
  buildAcademyLessonV2DiagramQuestion,
  buildAcademyLessonV2MatchingQuestion,
  buildAcademyLessonV2OrderingQuestion,
  buildAcademyLessonV2SelectionQuestion,
  gradeAcademyLessonV2Matching,
  gradeAcademyLessonV2Ordering,
  gradeAcademyLessonV2Q5,
  gradeAcademyLessonV2Selection,
  gradeAcademyLessonV2ShortResponse,
  type AcademyLessonV2QuestionIdentity,
  type AcademyLessonV2QuestionKey,
  type AcademyLessonV2ScenarioMode
} from "../../lib/academy/lessonTeachingProfileV2Assessment";
import { AcademyLessonV2DomainGraph } from "./AcademyLessonV2Explorer";

export {
  academyLessonV2AssessmentId,
  academyLessonV2MatchingRightId,
  academyLessonV2QuestionId,
  gradeAcademyLessonV2Matching,
  gradeAcademyLessonV2Ordering,
  gradeAcademyLessonV2Q5,
  gradeAcademyLessonV2Selection,
  gradeAcademyLessonV2ShortResponse
} from "../../lib/academy/lessonTeachingProfileV2Assessment";
export type {
  AcademyLessonV2QuestionIdentity,
  AcademyLessonV2QuestionKey,
  AcademyLessonV2ScenarioMode,
  AcademyLessonV2ShortResponseGrade
} from "../../lib/academy/lessonTeachingProfileV2Assessment";

export interface AcademyLessonV2AssessmentAttemptEvent {
  kind: "attempt";
  eventId: string;
  occurredAt: string;
  lessonId: string;
  assessmentId: string;
  questionKey: AcademyLessonV2QuestionKey;
  questionId: string;
  scenarioMode: AcademyLessonV2ScenarioMode;
  retryIndex: 0 | 1;
  attemptNumber: number;
  scorePercent: number;
  isCorrect: boolean;
  variantSeed: number;
  responseSummary: string;
  hintsUsed: string[];
  solutionRevealed: boolean;
  misconceptionKeys: string[];
}

export interface AcademyLessonV2AssessmentHintEvent {
  kind: "hint";
  eventId: string;
  occurredAt: string;
  lessonId: string;
  assessmentId: string;
  questionKey: AcademyLessonV2QuestionKey;
  questionId: string;
  scenarioMode: AcademyLessonV2ScenarioMode;
  retryIndex: 0 | 1;
  hintId: string;
  hintIndex: number;
}

export interface AcademyLessonV2AssessmentSolutionEvent {
  kind: "solution";
  eventId: string;
  occurredAt: string;
  lessonId: string;
  assessmentId: string;
  questionKey: AcademyLessonV2QuestionKey;
  questionId: string;
  scenarioMode: AcademyLessonV2ScenarioMode;
  retryIndex: 0 | 1;
  solutionId: string;
  explicitReveal: true;
}

export interface AcademyLessonV2AssessmentRetryEvent {
  kind: "retry";
  eventId: string;
  occurredAt: string;
  lessonId: string;
  assessmentId: string;
  questionKey: AcademyLessonV2QuestionKey;
  questionId: string;
  scenarioMode: "retry";
  retryIndex: 1;
}

export type AcademyLessonV2AssessmentEvent =
  | AcademyLessonV2AssessmentAttemptEvent
  | AcademyLessonV2AssessmentHintEvent
  | AcademyLessonV2AssessmentSolutionEvent
  | AcademyLessonV2AssessmentRetryEvent;

export interface AcademyLessonV2AssessmentProgress {
  lessonId: string;
  assessmentId: string;
  attempted: number;
  total: 4;
  scorePercent: number;
  requiredScorePercent: number;
  masteryEligible: boolean;
}

export interface AcademyLessonV2InitialQuestionInteraction {
  revealedHintCount: number;
  solutionRevealed: boolean;
  retryOpened: boolean;
}

export type AcademyLessonV2InitialQuestionInteractions = Readonly<
  Record<string, AcademyLessonV2InitialQuestionInteraction>
>;

export interface AcademyLessonV2AttemptHistoryItem {
  attemptId: string;
  attemptedAt: string;
  isCorrect: boolean;
  scorePercent: number;
  retryIndex: number;
  hintsUsed: readonly string[];
}

export type AcademyLessonV2AttemptHistory = Readonly<
  Record<string, readonly AcademyLessonV2AttemptHistoryItem[]>
>;

export interface AcademyLessonV2AssessmentSuiteProps {
  profile: AcademyLessonTeachingProfileV2;
  sectionId?: string;
  resumeBlockId?: string;
  requiredScorePercent?: number;
  initialScores?: Readonly<Partial<Record<AcademyLessonV2QuestionKey, number>>>;
  initialInteractions?: AcademyLessonV2InitialQuestionInteractions;
  attemptHistory?: AcademyLessonV2AttemptHistory;
  scorePolicy?: "latest" | "best";
  onAssessmentEvent?: (event: AcademyLessonV2AssessmentEvent) => void;
  onAssessmentProgress?: (progress: AcademyLessonV2AssessmentProgress) => void;
  onAssessmentPassed?: (progress: AcademyLessonV2AssessmentProgress) => void;
}

type QuestionIdentity = AcademyLessonV2QuestionIdentity;

interface QuestionInteraction {
  result: GradeResult | null;
  setResult: (result: GradeResult | null) => void;
  hintCount: number;
  hintIds: string[];
  solutionVisible: boolean;
  requestHint: () => void;
  toggleSolution: () => void;
  recordAttempt: (grade: GradeResult, responseSummary: string) => void;
}

const QUESTION_KEYS: readonly AcademyLessonV2QuestionKey[] = [
  "q2",
  "q3",
  "q4",
  "q5"
];

const EMPTY_INITIAL_SCORES: Readonly<
  Partial<Record<AcademyLessonV2QuestionKey, number>>
> = {};

const EMPTY_INITIAL_INTERACTIONS: AcademyLessonV2InitialQuestionInteractions = {};
const EMPTY_ATTEMPT_HISTORY: AcademyLessonV2AttemptHistory = {};

export const academyLessonV2AssessmentEventId = (
  identity: AcademyLessonV2QuestionIdentity,
  kind: AcademyLessonV2AssessmentEvent["kind"],
  ordinal: number,
  occurredAt: string
): string =>
  `${identity.questionId}:${kind}:${ordinal}:${occurredAt}`;

function useQuestionInteraction(
  identity: QuestionIdentity,
  feedback: AcademyQuestionFeedback,
  initialInteraction: AcademyLessonV2InitialQuestionInteraction | undefined,
  onEvent: (event: AcademyLessonV2AssessmentEvent) => void,
  onScore: (questionKey: AcademyLessonV2QuestionKey, score: number) => void
): QuestionInteraction {
  const [result, setResult] = useState<GradeResult | null>(null);
  const [hintCount, setHintCount] = useState(() =>
    Math.min(
      feedback.hints.length,
      Math.max(0, Math.trunc(initialInteraction?.revealedHintCount ?? 0))
    )
  );
  const [solutionVisible, setSolutionVisible] = useState(
    initialInteraction?.solutionRevealed ?? false
  );
  const [attemptNumber, setAttemptNumber] = useState(0);
  const hintIds = feedback.hints
    .slice(0, hintCount)
    .map((_, index) => `${identity.questionId}-H${index + 1}`);

  const requestHint = () => {
    if (hintCount >= feedback.hints.length) return;
    const nextHintIndex = hintCount;
    const occurredAt = new Date().toISOString();
    onEvent({
      kind: "hint",
      eventId: academyLessonV2AssessmentEventId(
        identity,
        "hint",
        nextHintIndex + 1,
        occurredAt
      ),
      occurredAt,
      ...identity,
      hintId: `${identity.questionId}-H${nextHintIndex + 1}`,
      hintIndex: nextHintIndex
    });
    setHintCount(nextHintIndex + 1);
  };

  const toggleSolution = () => {
    if (!solutionVisible) {
      const occurredAt = new Date().toISOString();
      onEvent({
        kind: "solution",
        eventId: academyLessonV2AssessmentEventId(identity, "solution", 1, occurredAt),
        occurredAt,
        ...identity,
        solutionId: `${identity.questionId}-SOLUTION`,
        explicitReveal: true
      });
    }
    setSolutionVisible((current) => !current);
  };

  const recordAttempt = (grade: GradeResult, responseSummary: string) => {
    if (
      !Number.isSafeInteger(grade.variantSeed)
      || grade.variantSeed === null
      || grade.variantSeed < 0
      || grade.variantSeed > 0xffff_ffff
    ) {
      throw new Error("Academy V2 assessment grading did not return a valid variant seed.");
    }
    const nextAttemptNumber = attemptNumber + 1;
    const occurredAt = new Date().toISOString();
    setAttemptNumber(nextAttemptNumber);
    setResult(grade);
    onScore(identity.questionKey, grade.scorePercent);
    onEvent({
      kind: "attempt",
      eventId: academyLessonV2AssessmentEventId(
        identity,
        "attempt",
        nextAttemptNumber,
        occurredAt
      ),
      occurredAt,
      ...identity,
      attemptNumber: nextAttemptNumber,
      scorePercent: grade.scorePercent,
      isCorrect: grade.isCorrect,
      variantSeed: grade.variantSeed,
      responseSummary,
      hintsUsed: hintIds,
      solutionRevealed: solutionVisible,
      misconceptionKeys: [...grade.misconceptionKeys]
    });
  };

  return {
    result,
    setResult,
    hintCount,
    hintIds,
    solutionVisible,
    requestHint,
    toggleSolution,
    recordAttempt
  };
}

function Guidance({
  identity,
  feedback,
  interaction,
  attemptHistory
}: {
  identity: QuestionIdentity;
  feedback: AcademyQuestionFeedback;
  interaction: QuestionInteraction;
  attemptHistory: readonly AcademyLessonV2AttemptHistoryItem[];
}) {
  const nextHintAvailable = interaction.hintCount < feedback.hints.length;
  const hintsId = `${identity.questionId}-HINTS`;
  const solutionId = `${identity.questionId}-SOLUTION`;
  return (
    <div className="academy-v2-guidance">
      {interaction.result !== null && (
        <div
          className={`academy-v2-guidance__feedback ${
            interaction.result.isCorrect ? "is-correct" : "is-incorrect"
          }`}
          role="status"
        >
          <strong>
            {interaction.result.isCorrect ? "Correct" : "Not yet"} -{" "}
            {interaction.result.scorePercent}%
          </strong>
          {interaction.result.feedback.map((message, index) => (
            <p key={`${identity.questionId}-feedback-${index}`}>{message}</p>
          ))}
        </div>
      )}
      <div className="academy-v2-guidance__actions">
        <button
          type="button"
          aria-controls={hintsId}
          disabled={!nextHintAvailable}
          onClick={interaction.requestHint}
        >
          {nextHintAvailable
            ? `Show hint ${interaction.hintCount + 1} of ${
              feedback.hints.length
            }`
            : "All hints shown"}
        </button>
        <button
          type="button"
          aria-expanded={interaction.solutionVisible}
          aria-controls={solutionId}
          onClick={interaction.toggleSolution}
        >
          {interaction.solutionVisible
            ? "Hide worked solution"
            : "Show worked solution"}
        </button>
      </div>
      <div id={hintsId} className="academy-v2-guidance__hints" aria-live="polite">
        {interaction.hintCount > 0 && (
          <>
            <h5>Progressive hints</h5>
            <ol>
              {feedback.hints
                .slice(0, interaction.hintCount)
                .map((hint, index) => (
                  <li key={`${identity.questionId}-hint-${index}`}>{hint}</li>
                ))}
            </ol>
          </>
        )}
      </div>
      {interaction.solutionVisible && (
        <section
          id={solutionId}
          className="academy-v2-guidance__solution"
          aria-label="Worked solution"
        >
          <h5>Worked solution</h5>
          <ol>
            {feedback.solution.map((step, index) => (
              <li key={`${identity.questionId}-solution-${index}`}>{step}</li>
            ))}
          </ol>
        </section>
      )}
      {attemptHistory.length > 0 && (
        <details className="academy-v2-guidance__history">
          <summary>Question attempt history ({attemptHistory.length})</summary>
          <div className="academy-v2-guidance__history-scroll">
            <table>
              <caption>
                Stored attempts for this exact base or changed-condition question.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Attempt</th>
                  <th scope="col">Mode</th>
                  <th scope="col">Result</th>
                  <th scope="col">Score</th>
                  <th scope="col">Hints</th>
                  <th scope="col">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {attemptHistory.map((attempt, index) => (
                  <tr key={attempt.attemptId}>
                    <td>{index + 1}</td>
                    <td>{attempt.retryIndex > 0 ? "Retry" : "Base"}</td>
                    <td>{attempt.isCorrect ? "Correct" : "Review"}</td>
                    <td>{attempt.scorePercent}%</td>
                    <td>{attempt.hintsUsed.length}</td>
                    <td>
                      <time dateTime={attempt.attemptedAt}>
                        {new Date(attempt.attemptedAt).toLocaleString("en-AU")}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

function OrderingQuestionView({
  scenario,
  identity,
  conditions,
  initialInteraction,
  attemptHistory,
  onEvent,
  onScore
}: {
  scenario: AcademyOrderingScenario;
  identity: QuestionIdentity;
  conditions: readonly AcademyDomainCondition[];
  initialInteraction?: AcademyLessonV2InitialQuestionInteraction;
  attemptHistory: readonly AcademyLessonV2AttemptHistoryItem[];
  onEvent: (event: AcademyLessonV2AssessmentEvent) => void;
  onScore: (questionKey: AcademyLessonV2QuestionKey, score: number) => void;
}) {
  const question = useMemo(
    () => buildAcademyLessonV2OrderingQuestion(
      scenario,
      identity,
      conditions
    ),
    [conditions, identity, scenario]
  );
  const initialOrder = useMemo(
    () => getInitialOrdering(question, identity.retryIndex),
    [identity.retryIndex, question]
  );
  const [order, setOrder] = useState(initialOrder);
  const interaction = useQuestionInteraction(
    identity,
    scenario,
    initialInteraction,
    onEvent,
    onScore
  );
  const stepById = new Map(scenario.steps.map((step) => [step.stepId, step]));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((current) => {
      const changed = [...current];
      [changed[index], changed[target]] = [changed[target], changed[index]];
      return changed;
    });
    interaction.setResult(null);
  };
  return (
    <article className="academy-v2-question" aria-labelledby={`${identity.questionId}-HEADING`}>
      <h4 id={`${identity.questionId}-HEADING`}>{question.prompt}</h4>
      <ol className="academy-v2-ordering">
        {order.map((stepId, index) => {
          const step = stepById.get(stepId);
          if (!step) return null;
          return (
            <li key={step.stepId}>
              <div>
                <strong>{step.label}</strong>
                <span>{step.explanation}</span>
              </div>
              <div className="academy-v2-ordering__controls">
                <button
                  type="button"
                  aria-label={`Move ${step.label} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Earlier
                </button>
                <button
                  type="button"
                  aria-label={`Move ${step.label} later`}
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Later
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="academy-v2-question__actions">
        <button
          type="button"
          className="btn"
          onClick={() => {
            const grade = gradeAcademyLessonV2Ordering(
              scenario,
              order,
              identity,
              conditions
            );
            interaction.recordAttempt(grade, JSON.stringify(order));
          }}
        >
          Check order
        </button>
        <button
          type="button"
          onClick={() => {
            setOrder(initialOrder);
            interaction.setResult(null);
          }}
        >
          Reset order
        </button>
      </div>
      <Guidance
        identity={identity}
        feedback={scenario}
        interaction={interaction}
        attemptHistory={attemptHistory}
      />
    </article>
  );
}

function SelectionQuestionView({
  scenario,
  identity,
  conditions,
  initialInteraction,
  attemptHistory,
  onEvent,
  onScore
}: {
  scenario: AcademySelectionScenario;
  identity: QuestionIdentity;
  conditions: readonly AcademyDomainCondition[];
  initialInteraction?: AcademyLessonV2InitialQuestionInteraction;
  attemptHistory: readonly AcademyLessonV2AttemptHistoryItem[];
  onEvent: (event: AcademyLessonV2AssessmentEvent) => void;
  onScore: (questionKey: AcademyLessonV2QuestionKey, score: number) => void;
}) {
  const question = buildAcademyLessonV2SelectionQuestion(
    scenario,
    identity,
    conditions
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const interaction = useQuestionInteraction(
    identity,
    scenario,
    initialInteraction,
    onEvent,
    onScore
  );
  return (
    <article className="academy-v2-question" aria-labelledby={`${identity.questionId}-HEADING`}>
      <h4 id={`${identity.questionId}-HEADING`}>{question.prompt}</h4>
      <fieldset>
        <legend>Choose every answer that the stated conditions support.</legend>
        <div className="academy-v2-options">
          {scenario.options.map((option) => (
            <label key={option.optionId}>
              <input
                type="checkbox"
                checked={selected.has(option.optionId)}
                onChange={(change) => {
                  setSelected((current) => {
                    const changed = new Set(current);
                    if (change.target.checked) changed.add(option.optionId);
                    else changed.delete(option.optionId);
                    return changed;
                  });
                  interaction.setResult(null);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="academy-v2-question__actions">
        <button
          type="button"
          className="btn"
          disabled={selected.size === 0}
          onClick={() => {
            const grade = gradeAcademyLessonV2Selection(
              scenario,
              selected,
              identity,
              conditions
            );
            interaction.recordAttempt(
              grade,
              JSON.stringify([...selected].sort())
            );
          }}
        >
          Check selections
        </button>
        <button
          type="button"
          onClick={() => {
            setSelected(new Set());
            interaction.setResult(null);
          }}
        >
          Clear selections
        </button>
      </div>
      <Guidance
        identity={identity}
        feedback={scenario}
        interaction={interaction}
        attemptHistory={attemptHistory}
      />
    </article>
  );
}

function ShortResponseQuestionView({
  scenario,
  identity,
  profile,
  initialInteraction,
  attemptHistory,
  onEvent,
  onScore
}: {
  scenario: AcademyShortResponseScenario;
  identity: QuestionIdentity;
  profile: AcademyLessonTeachingProfileV2;
  initialInteraction?: AcademyLessonV2InitialQuestionInteraction;
  attemptHistory: readonly AcademyLessonV2AttemptHistoryItem[];
  onEvent: (event: AcademyLessonV2AssessmentEvent) => void;
  onScore: (questionKey: AcademyLessonV2QuestionKey, score: number) => void;
}) {
  const [response, setResponse] = useState("");
  const interaction = useQuestionInteraction(
    identity,
    scenario,
    initialInteraction,
    onEvent,
    onScore
  );
  const requiredRelations = scenario.requiredRelationIds.map(
    (relationId) =>
      profile.relations.find((relation) => relation.relationId === relationId)
        ?.predicate ?? relationId
  );
  const criterion = profile.conditions.find(
    (condition) => condition.conditionId === scenario.criterionConditionId
  )?.statement ?? scenario.criterionConditionId;
  return (
    <article className="academy-v2-question" aria-labelledby={`${identity.questionId}-HEADING`}>
      <h4 id={`${identity.questionId}-HEADING`}>
        {academyLessonV2ScenarioPrompt(
          "Q4 - Explain the relationships",
          scenario.prompt,
          scenario.contextConditionIds,
          profile.conditions
        )}
      </h4>
      <div className="academy-v2-question__criteria">
        <p>
          A supported response covers at least {scenario.minimumConceptGroups}{" "}
          concept groups, states every required relationship and applies the
          decision criterion.
        </p>
        <dl>
          <div>
            <dt>Concept groups</dt>
            <dd>{scenario.conceptGroups.map((group) => group.label).join("; ")}</dd>
          </div>
          <div>
            <dt>Required relationship</dt>
            <dd>{requiredRelations.join("; ")}</dd>
          </div>
          <div>
            <dt>Decision criterion</dt>
            <dd>{criterion}</dd>
          </div>
        </dl>
      </div>
      <label className="academy-question__short-response">
        <span>Your explanation</span>
        <textarea
          rows={6}
          value={response}
          onChange={(change) => {
            setResponse(change.target.value);
            interaction.setResult(null);
          }}
        />
      </label>
      <div className="academy-v2-question__actions">
        <button
          type="button"
          className="btn"
          disabled={response.trim() === ""}
          onClick={() => {
            const grade = gradeAcademyLessonV2ShortResponse(
              scenario,
              response,
              identity,
              profile.relations,
              profile.conditions
            );
            interaction.recordAttempt(grade, response.trim());
          }}
        >
          Check explanation
        </button>
        <button
          type="button"
          onClick={() => {
            setResponse("");
            interaction.setResult(null);
          }}
        >
          Clear response
        </button>
      </div>
      <Guidance
        identity={identity}
        feedback={scenario}
        interaction={interaction}
        attemptHistory={attemptHistory}
      />
    </article>
  );
}

function MatchingQuestionView({
  scenario,
  identity,
  conditions,
  initialInteraction,
  attemptHistory,
  onEvent,
  onScore
}: {
  scenario: AcademyMatchingScenario;
  identity: QuestionIdentity;
  conditions: readonly AcademyDomainCondition[];
  initialInteraction?: AcademyLessonV2InitialQuestionInteraction;
  attemptHistory: readonly AcademyLessonV2AttemptHistoryItem[];
  onEvent: (event: AcademyLessonV2AssessmentEvent) => void;
  onScore: (questionKey: AcademyLessonV2QuestionKey, score: number) => void;
}) {
  const question = buildAcademyLessonV2MatchingQuestion(
    scenario,
    identity,
    conditions
  );
  const [responses, setResponses] = useState<Record<string, string>>({});
  const interaction = useQuestionInteraction(
    identity,
    scenario,
    initialInteraction,
    onEvent,
    onScore
  );
  return (
    <article className="academy-v2-question" aria-labelledby={`${identity.questionId}-HEADING`}>
      <h4 id={`${identity.questionId}-HEADING`}>{question.prompt}</h4>
      <div className="academy-v2-matching">
        {question.left.map((left) => (
          <label key={left.id}>
            <span>{left.label}</span>
            <select
              value={responses[left.id] ?? ""}
              onChange={(change) => {
                setResponses((current) => ({
                  ...current,
                  [left.id]: change.target.value
                }));
                interaction.setResult(null);
              }}
            >
              <option value="">Choose a match</option>
              {question.right.map((right) => (
                <option key={right.id} value={right.id}>{right.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="academy-v2-question__actions">
        <button
          type="button"
          className="btn"
          disabled={question.left.some((left) => !responses[left.id])}
          onClick={() => {
            const grade = gradeAcademyLessonV2Matching(
              scenario,
              responses,
              identity,
              conditions
            );
            interaction.recordAttempt(
              grade,
              JSON.stringify(
                Object.entries(responses).sort(([left], [right]) =>
                  left.localeCompare(right, "en-AU")
                )
              )
            );
          }}
        >
          Check matches
        </button>
        <button
          type="button"
          onClick={() => {
            setResponses({});
            interaction.setResult(null);
          }}
        >
          Clear matches
        </button>
      </div>
      <Guidance
        identity={identity}
        feedback={scenario}
        interaction={interaction}
        attemptHistory={attemptHistory}
      />
    </article>
  );
}

function Q4QuestionView({
  scenario,
  identity,
  profile,
  initialInteraction,
  attemptHistory,
  onEvent,
  onScore
}: {
  scenario: AcademyQ4Scenario;
  identity: QuestionIdentity;
  profile: AcademyLessonTeachingProfileV2;
  initialInteraction?: AcademyLessonV2InitialQuestionInteraction;
  attemptHistory: readonly AcademyLessonV2AttemptHistoryItem[];
  onEvent: (event: AcademyLessonV2AssessmentEvent) => void;
  onScore: (questionKey: AcademyLessonV2QuestionKey, score: number) => void;
}) {
  return scenario.kind === "short-response"
    ? (
        <ShortResponseQuestionView
          scenario={scenario}
          identity={identity}
          profile={profile}
          initialInteraction={initialInteraction}
          attemptHistory={attemptHistory}
          onEvent={onEvent}
          onScore={onScore}
        />
      )
    : (
        <MatchingQuestionView
          scenario={scenario}
          identity={identity}
          conditions={profile.conditions}
          initialInteraction={initialInteraction}
          attemptHistory={attemptHistory}
          onEvent={onEvent}
          onScore={onScore}
        />
      );
}

function Q5QuestionView({
  scenario,
  identity,
  profile,
  initialInteraction,
  attemptHistory,
  onEvent,
  onScore
}: {
  scenario: AcademyQ5Scenario;
  identity: QuestionIdentity;
  profile: AcademyLessonTeachingProfileV2;
  initialInteraction?: AcademyLessonV2InitialQuestionInteraction;
  attemptHistory: readonly AcademyLessonV2AttemptHistoryItem[];
  onEvent: (event: AcademyLessonV2AssessmentEvent) => void;
  onScore: (questionKey: AcademyLessonV2QuestionKey, score: number) => void;
}) {
  const question = scenario.kind === "diagram"
    ? buildAcademyLessonV2DiagramQuestion(scenario, identity, profile)
    : buildAcademyLessonV2CodeQuestion(scenario, identity, profile);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const interaction = useQuestionInteraction(
    identity,
    scenario,
    initialInteraction,
    onEvent,
    onScore
  );
  return (
    <article className="academy-v2-question" aria-labelledby={`${identity.questionId}-HEADING`}>
      <h4 id={`${identity.questionId}-HEADING`}>{question.prompt}</h4>
      {scenario.kind === "diagram"
        ? (
            <AcademyLessonV2DomainGraph
              positions={scenario.positions}
              relationIds={scenario.relationIds}
              entities={profile.entities}
              relations={profile.relations}
              activeRelationIds={scenario.answerRelationIds}
              textEquivalent={scenario.textEquivalent}
            />
          )
        : (
            <figure className="academy-v2-code">
              <figcaption>
                Static {scenario.language} code for analysis. It is displayed
                only and is never executed.
              </figcaption>
              <pre tabIndex={0}>
                <code className={`language-${scenario.language}`}>
                  {scenario.code}
                </code>
              </pre>
            </figure>
          )}
      <fieldset>
        <legend>Choose the implication justified by the represented mechanism.</legend>
        <div className="academy-v2-options">
          {scenario.options.map((option) => (
            <label key={option.optionId}>
              <input
                type="radio"
                name={`${identity.questionId}-OPTION`}
                value={option.optionId}
                checked={selectedOptionId === option.optionId}
                onChange={() => {
                  setSelectedOptionId(option.optionId);
                  interaction.setResult(null);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="academy-v2-question__actions">
        <button
          type="button"
          className="btn"
          disabled={selectedOptionId === ""}
          onClick={() => {
            const grade = gradeAcademyLessonV2Q5(
              scenario,
              selectedOptionId,
              identity,
              profile
            );
            interaction.recordAttempt(grade, selectedOptionId);
          }}
        >
          Check interpretation
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedOptionId("");
            interaction.setResult(null);
          }}
        >
          Clear choice
        </button>
      </div>
      <Guidance
        identity={identity}
        feedback={scenario}
        interaction={interaction}
        attemptHistory={attemptHistory}
      />
    </article>
  );
}

function ScenarioPair({
  identity,
  title,
  description,
  base,
  retry,
  initialRetryOpened,
  onRetryOpened
}: {
  identity: Omit<QuestionIdentity, "scenarioMode" | "retryIndex" | "questionId">;
  title: string;
  description: string;
  base: ReactNode;
  retry: ReactNode;
  initialRetryOpened: boolean;
  onRetryOpened: (event: AcademyLessonV2AssessmentRetryEvent) => void;
}) {
  const retryRecorded = useRef(initialRetryOpened);
  const [retryOpen, setRetryOpen] = useState(initialRetryOpened);
  const retryIdentity: QuestionIdentity = {
    ...identity,
    questionId: academyLessonV2QuestionId(
      identity.lessonId,
      identity.questionKey,
      "retry"
    ),
    scenarioMode: "retry",
    retryIndex: 1
  };
  return (
    <section className="academy-v2-question-pair">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      <details open>
        <summary>Base scenario</summary>
        {base}
      </details>
      <details
        open={retryOpen}
        onToggle={(toggle) => {
          setRetryOpen(toggle.currentTarget.open);
          if (!toggle.currentTarget.open || retryRecorded.current) return;
          retryRecorded.current = true;
          const occurredAt = new Date().toISOString();
          onRetryOpened({
            kind: "retry",
            eventId: academyLessonV2AssessmentEventId(
              retryIdentity,
              "retry",
              1,
              occurredAt
            ),
            occurredAt,
            lessonId: retryIdentity.lessonId,
            assessmentId: retryIdentity.assessmentId,
            questionKey: retryIdentity.questionKey,
            questionId: retryIdentity.questionId,
            scenarioMode: "retry",
            retryIndex: 1
          });
        }}
      >
        <summary>Retry with changed conditions</summary>
        {retry}
      </details>
    </section>
  );
}

export function AcademyLessonV2AssessmentSuite({
  profile,
  sectionId,
  resumeBlockId,
  requiredScorePercent = 80,
  initialScores = EMPTY_INITIAL_SCORES,
  initialInteractions = EMPTY_INITIAL_INTERACTIONS,
  attemptHistory = EMPTY_ATTEMPT_HISTORY,
  scorePolicy = "latest",
  onAssessmentEvent,
  onAssessmentProgress,
  onAssessmentPassed
}: AcademyLessonV2AssessmentSuiteProps) {
  const assessmentId = academyLessonV2AssessmentId(profile.lessonId);
  const headingId = `${assessmentId}-HEADING`;
  const [scores, setScores] = useState<
    Partial<Record<AcademyLessonV2QuestionKey, number>>
  >({ ...initialScores });
  const initialAttempted = QUESTION_KEYS.filter(
    (questionKey) => initialScores[questionKey] !== undefined
  ).length;
  const initialScorePercent = Math.round(
    QUESTION_KEYS.reduce(
      (total, questionKey) => total + (initialScores[questionKey] ?? 0),
      0
    ) / QUESTION_KEYS.length
  );
  const passedRef = useRef(
    initialAttempted === QUESTION_KEYS.length
    && initialScorePercent >= requiredScorePercent
  );
  const attempted = QUESTION_KEYS.filter(
    (questionKey) => scores[questionKey] !== undefined
  ).length;
  const scorePercent = Math.round(
    QUESTION_KEYS.reduce(
      (total, questionKey) => total + (scores[questionKey] ?? 0),
      0
    ) / QUESTION_KEYS.length
  );
  const progress = useMemo<AcademyLessonV2AssessmentProgress>(
    () => ({
      lessonId: profile.lessonId,
      assessmentId,
      attempted,
      total: 4,
      scorePercent,
      requiredScorePercent,
      masteryEligible:
        attempted === QUESTION_KEYS.length
        && scorePercent >= requiredScorePercent
    }),
    [
      assessmentId,
      attempted,
      profile.lessonId,
      requiredScorePercent,
      scorePercent
    ]
  );
  const emitEvent = useCallback(
    (event: AcademyLessonV2AssessmentEvent) => {
      onAssessmentEvent?.(event);
    },
    [onAssessmentEvent]
  );
  const recordScore = useCallback(
    (questionKey: AcademyLessonV2QuestionKey, score: number) => {
      setScores((current) => ({
        ...current,
        [questionKey]: scorePolicy === "best"
          ? Math.max(current[questionKey] ?? 0, score)
          : score
      }));
    },
    [scorePolicy]
  );

  useEffect(() => {
    setScores({ ...initialScores });
  }, [initialScores]);

  useEffect(() => {
    onAssessmentProgress?.(progress);
    if (progress.masteryEligible && !passedRef.current) {
      passedRef.current = true;
      onAssessmentPassed?.(progress);
    }
    if (!progress.masteryEligible) passedRef.current = false;
  }, [
    onAssessmentPassed,
    onAssessmentProgress,
    progress
  ]);

  const identity = (
    questionKey: AcademyLessonV2QuestionKey,
    scenarioMode: AcademyLessonV2ScenarioMode
  ): QuestionIdentity => ({
    lessonId: profile.lessonId,
    assessmentId,
    questionKey,
    questionId: academyLessonV2QuestionId(
      profile.lessonId,
      questionKey,
      scenarioMode
    ),
    scenarioMode,
    retryIndex: scenarioMode === "retry" ? 1 : 0
  });
  const pairIdentity = (questionKey: AcademyLessonV2QuestionKey) => ({
    lessonId: profile.lessonId,
    assessmentId,
    questionKey
  });
  const initialInteraction = (
    questionKey: AcademyLessonV2QuestionKey,
    scenarioMode: AcademyLessonV2ScenarioMode
  ): AcademyLessonV2InitialQuestionInteraction | undefined =>
    initialInteractions[
      academyLessonV2QuestionId(profile.lessonId, questionKey, scenarioMode)
    ];
  const historyFor = (
    questionKey: AcademyLessonV2QuestionKey,
    scenarioMode: AcademyLessonV2ScenarioMode
  ): readonly AcademyLessonV2AttemptHistoryItem[] =>
    attemptHistory[
      academyLessonV2QuestionId(profile.lessonId, questionKey, scenarioMode)
    ] ?? [];

  return (
    <section
      id={sectionId}
      className="academy-v2-assessments"
      aria-labelledby={headingId}
      data-academy-resume-block={resumeBlockId}
    >
      <header>
        <p className="eyebrow">Guided practice and assessment</p>
        <h2 id={headingId}>Reason through the model</h2>
        <p>
          Try each base scenario first. Every question includes an authored
          changed-condition retry, progressive hints and a worked solution.
          Hint, solution, retry and attempt actions expose persistence-ready
          events to the lesson page.
        </p>
      </header>
      <div className="academy-v2-assessments__progress" aria-live="polite">
        <div>
          <strong>{attempted}/4 assessed</strong>
          <span>{scorePercent}% current score</span>
        </div>
        <progress
          max={100}
          value={scorePercent}
          aria-label={`V2 lesson assessment score: ${scorePercent}%`}
        >
          {scorePercent}%
        </progress>
        <p>
          Mastery evidence becomes eligible after all four questions are
          attempted and the score reaches {requiredScorePercent}%.
        </p>
      </div>
      <ScenarioPair
        identity={pairIdentity("q2")}
        title="Q2 - Put the mechanism in order"
        description="Sequence the subject-specific steps under the stated conditions."
        initialRetryOpened={initialInteraction("q2", "retry")?.retryOpened ?? false}
        onRetryOpened={emitEvent}
        base={(
          <OrderingQuestionView
            scenario={profile.assessments.q2.base}
            identity={identity("q2", "base")}
            conditions={profile.conditions}
            initialInteraction={initialInteraction("q2", "base")}
            attemptHistory={historyFor("q2", "base")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
        retry={(
          <OrderingQuestionView
            scenario={profile.assessments.q2.retry}
            identity={identity("q2", "retry")}
            conditions={profile.conditions}
            initialInteraction={initialInteraction("q2", "retry")}
            attemptHistory={historyFor("q2", "retry")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
      />
      <ScenarioPair
        identity={pairIdentity("q3")}
        title="Q3 - Select every supported claim"
        description="Separate evidence-backed statements from the declared misconception."
        initialRetryOpened={initialInteraction("q3", "retry")?.retryOpened ?? false}
        onRetryOpened={emitEvent}
        base={(
          <SelectionQuestionView
            scenario={profile.assessments.q3.base}
            identity={identity("q3", "base")}
            conditions={profile.conditions}
            initialInteraction={initialInteraction("q3", "base")}
            attemptHistory={historyFor("q3", "base")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
        retry={(
          <SelectionQuestionView
            scenario={profile.assessments.q3.retry}
            identity={identity("q3", "retry")}
            conditions={profile.conditions}
            initialInteraction={initialInteraction("q3", "retry")}
            attemptHistory={historyFor("q3", "retry")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
      />
      <ScenarioPair
        identity={pairIdentity("q4")}
        title="Q4 - Explain or match the relationships"
        description="Use bounded terms, explicit relations and the declared criterion."
        initialRetryOpened={initialInteraction("q4", "retry")?.retryOpened ?? false}
        onRetryOpened={emitEvent}
        base={(
          <Q4QuestionView
            scenario={profile.assessments.q4.base}
            identity={identity("q4", "base")}
            profile={profile}
            initialInteraction={initialInteraction("q4", "base")}
            attemptHistory={historyFor("q4", "base")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
        retry={(
          <Q4QuestionView
            scenario={profile.assessments.q4.retry}
            identity={identity("q4", "retry")}
            profile={profile}
            initialInteraction={initialInteraction("q4", "retry")}
            attemptHistory={historyFor("q4", "retry")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
      />
      <ScenarioPair
        identity={pairIdentity("q5")}
        title="Q5 - Interpret the represented mechanism"
        description="Read the diagram or static code and choose only the supported implication."
        initialRetryOpened={initialInteraction("q5", "retry")?.retryOpened ?? false}
        onRetryOpened={emitEvent}
        base={(
          <Q5QuestionView
            scenario={profile.assessments.q5.base}
            identity={identity("q5", "base")}
            profile={profile}
            initialInteraction={initialInteraction("q5", "base")}
            attemptHistory={historyFor("q5", "base")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
        retry={(
          <Q5QuestionView
            scenario={profile.assessments.q5.retry}
            identity={identity("q5", "retry")}
            profile={profile}
            initialInteraction={initialInteraction("q5", "retry")}
            attemptHistory={historyFor("q5", "retry")}
            onEvent={emitEvent}
            onScore={recordScore}
          />
        )}
      />
    </section>
  );
}
