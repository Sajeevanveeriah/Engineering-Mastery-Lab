import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AcademyQuestionSet } from "../components/academy/AcademyQuestion";
import {
  AssessmentValidationError,
  MAX_RETRY_INDEX,
  appendAttemptHistory,
  assertDistinctQuestionRetryAnswers,
  bestCompletedAssessmentScore,
  buildQuestionSetIdentity,
  createAttemptRecord,
  currentAssessmentSessionAttempts,
  firstAttemptQuestionScores,
  generateQuestionVariant,
  getInitialOrdering,
  getProgressiveHint,
  getQuestionVariantExpectedValue,
  getSolutionReveal,
  gradeQuestion,
  recentQuestionAttempts,
  reconcileQuestionSetScoreState,
  recordFirstAttemptScore,
  type AssessmentScoreRecord
} from "../lib/academy/assessment";
import type {
  AcademyQuestion,
  CodeAnalysisQuestion,
  DiagramQuestion,
  MatchingQuestion,
  MultipleSelectionQuestion,
  NumericQuestion,
  OrderingQuestion,
  SeededCalculationQuestion,
  ShortResponseQuestion,
  SingleChoiceQuestion
} from "../lib/academy/types";

const common = {
  id: "question-1",
  skillIds: ["skill-1"],
  prompt: "Choose carefully.",
  feedbackCorrect: "Correct.",
  feedbackIncorrect: "Not correct yet.",
  misconceptionFeedback: {
    wrong: "That option reverses cause and effect.",
    sign: "The positive axis points in the opposite direction.",
    magnitude: "The SI prefix has been applied incorrectly.",
    zero: "The reference is not zero for this case.",
    damping: "Damping dissipates energy."
  },
  hints: ["Identify the governing relationship.", "Check units and sign."],
  solution: ["Write the governing relationship.", "Substitute and evaluate."],
  variantSeed: 173
};

describe("academy assessment choice and structured grading", () => {
  it("grades single choice and returns keyed misconception feedback", () => {
    const question: SingleChoiceQuestion = {
      ...common,
      type: "single-choice",
      options: [
        { id: "right", label: "Right" },
        { id: "wrong", label: "Wrong" }
      ],
      correctOptionId: "right"
    };

    const correct = gradeQuestion(question, {
      type: "single-choice",
      optionId: "right"
    });
    const incorrect = gradeQuestion(question, {
      type: "single-choice",
      optionId: "wrong"
    });

    expect(correct).toMatchObject({
      isCorrect: true,
      scorePercent: 100,
      variantSeed: common.variantSeed
    });
    expect(incorrect).toMatchObject({
      isCorrect: false,
      scorePercent: 0,
      misconceptionKeys: ["wrong"]
    });
    expect(incorrect.feedback).toContain(
      "That option reverses cause and effect."
    );
    expect(incorrect).not.toHaveProperty("solution");
  });

  it("scores multiple selection by set overlap without duplicate credit", () => {
    const question: MultipleSelectionQuestion = {
      ...common,
      type: "multiple-selection",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "wrong", label: "C" }
      ],
      correctOptionIds: ["a", "b"]
    };

    expect(
      gradeQuestion(question, {
        type: "multiple-selection",
        optionIds: ["a", "wrong"]
      })
    ).toMatchObject({
      isCorrect: false,
      scorePercent: 33.33,
      misconceptionKeys: ["wrong"]
    });
    expect(() =>
      gradeQuestion(question, {
        type: "multiple-selection",
        optionIds: ["a", "a"]
      })
    ).toThrow(/duplicate ids/);
  });

  it("grades ordering, matching, short structured responses and diagrams", () => {
    const ordering: OrderingQuestion = {
      ...common,
      type: "ordering",
      items: [
        { id: "sense", label: "Sense" },
        { id: "estimate", label: "Estimate" },
        { id: "plan", label: "Plan" }
      ],
      correctOrder: ["sense", "estimate", "plan"]
    };
    const matching: MatchingQuestion = {
      ...common,
      type: "matching",
      left: [
        { id: "encoder", label: "Encoder" },
        { id: "imu", label: "IMU" }
      ],
      right: [
        { id: "rotation", label: "Rotation" },
        { id: "inertial", label: "Inertial motion" }
      ],
      correctPairs: { encoder: "rotation", imu: "inertial" }
    };
    const short: ShortResponseQuestion = {
      ...common,
      type: "short-response",
      requiredTerms: ["negative feedback", "damping", "stability"],
      minimumTerms: 2
    };
    const diagram: DiagramQuestion = {
      ...common,
      type: "diagram",
      diagramDescription: "A closed-loop block diagram.",
      diagram: {
        layout: "chain",
        nodes: [
          { id: "reference", label: "Reference", detail: "Requested response", role: "system" },
          { id: "controller", label: "Controller", detail: "Control law", role: "relationship" },
          { id: "plant", label: "Plant", detail: "Physical response", role: "application" }
        ],
        edges: [
          {
            id: "feedback-edge",
            fromNodeId: "reference",
            toNodeId: "controller",
            label: "drives the error calculation",
            direction: "directed"
          },
          {
            id: "plant-edge",
            fromNodeId: "controller",
            toNodeId: "plant",
            label: "commands",
            direction: "directed"
          }
        ],
        answerEdgeId: "feedback-edge"
      },
      options: [
        { id: "right", label: "Feedback path" },
        { id: "wrong", label: "Feed-forward path" }
      ],
      correctOptionId: "right"
    };

    expect(
      gradeQuestion(ordering, {
        type: "ordering",
        itemIds: ["sense", "plan", "estimate"]
      }).scorePercent
    ).toBe(33.33);
    expect(
      gradeQuestion(matching, {
        type: "matching",
        pairs: { encoder: "rotation", imu: "rotation" }
      }).scorePercent
    ).toBe(50);
    expect(
      gradeQuestion(short, {
        type: "short-response",
        text: "Negative-feedback adds damping to the response."
      })
    ).toMatchObject({ isCorrect: true, scorePercent: 100 });
    expect(
      gradeQuestion(short, {
        type: "short-response",
        text: "Damping changes the response."
      })
    ).toMatchObject({
      isCorrect: false,
      scorePercent: 50,
      misconceptionKeys: []
    });
    expect(
      gradeQuestion(diagram, { type: "diagram", optionId: "wrong" })
    ).toMatchObject({ isCorrect: false, misconceptionKeys: ["wrong"] });
  });

  it("grades static code analysis without executing the displayed source", () => {
    const marker = "__academyCodeAnalysisExecuted";
    Reflect.deleteProperty(globalThis, marker);
    const question: CodeAnalysisQuestion = {
      ...common,
      id: "code-analysis",
      type: "code-analysis",
      language: "typescript",
      code: `globalThis.${marker} = true;`,
      options: [
        { id: "right", label: "The assignment would mutate global state if an external runtime executed it." },
        { id: "wrong", label: "Displaying the snippet executes it automatically." }
      ],
      correctOptionId: "right"
    };

    expect(
      gradeQuestion(question, {
        type: "code-analysis",
        optionId: "right"
      })
    ).toMatchObject({ isCorrect: true, scorePercent: 100 });
    expect(Reflect.has(globalThis, marker)).toBe(false);
    expect(
      gradeQuestion(question, {
        type: "code-analysis",
        optionId: "wrong"
      })
    ).toMatchObject({
      isCorrect: false,
      misconceptionKeys: ["wrong"]
    });
  });
});

describe("question-set first-attempt and identity helpers", () => {
  it("keeps the first score while allowing a fresh set identity to reset", () => {
    const first = recordFirstAttemptScore({}, "q1", 25);
    const retry = recordFirstAttemptScore(first, "q1", 100);

    expect(first).toEqual({ q1: 25 });
    expect(retry).toBe(first);
    expect(
      buildQuestionSetIdentity(
        "review:skill-a",
        [{ id: "q1", type: "single-choice" }],
        first
      )
    ).not.toBe(
      buildQuestionSetIdentity(
        "review:skill-b",
        [{ id: "q1", type: "single-choice" }],
        first
      )
    );
  });

  it("resets scores for a new set but ignores ordinary same-set initial-score rerenders", () => {
    const current = {
      identity: "set-a",
      scores: { q1: 25 }
    };
    const sameSet = reconcileQuestionSetScoreState(
      current,
      "set-a",
      { q1: 100 }
    );
    const nextSet = reconcileQuestionSetScoreState(
      current,
      "set-b",
      { q2: 80 }
    );

    expect(sameSet).toBe(current);
    expect(nextSet).toEqual({
      identity: "set-b",
      scores: { q2: 80 }
    });
  });

  it("resumes only the unfinished session and reports completed aggregate scores", () => {
    const attempts: AssessmentScoreRecord[] = [
      { responseSummary: { q1: "A" }, scorePercent: 0 },
      { responseSummary: { q1: "B" }, scorePercent: 100 },
      { responseSummary: { RESULT: "50%" }, scorePercent: 50 },
      { responseSummary: { q1: "B" }, scorePercent: 100 }
    ];

    expect(currentAssessmentSessionAttempts(attempts)).toEqual([
      attempts[3]
    ]);
    expect(
      firstAttemptQuestionScores(
        currentAssessmentSessionAttempts(attempts),
        ["q1"]
      )
    ).toEqual({ q1: 100 });
    expect(bestCompletedAssessmentScore(attempts)).toBe(50);
  });

  it("starts ordering questions in a deterministic non-answer order", () => {
    const question: OrderingQuestion = {
      ...common,
      id: "ordering-start",
      type: "ordering",
      items: [
        { id: "observe", label: "Observe" },
        { id: "model", label: "Model" },
        { id: "test", label: "Test" },
        { id: "interpret", label: "Interpret" }
      ],
      correctOrder: ["observe", "model", "test", "interpret"]
    };

    const first = getInitialOrdering(question);
    expect(getInitialOrdering(question)).toEqual(first);
    expect(first).not.toEqual(question.correctOrder);
    expect(new Set(first)).toEqual(new Set(question.correctOrder));
  });
});

describe("academy numeric grading", () => {
  const numeric: NumericQuestion = {
    ...common,
    type: "numeric",
    expectedValue: -2,
    canonicalUnit: "m/s",
    acceptedUnits: { "cm/s": 0.01 },
    absoluteTolerance: 0.05,
    relativeTolerance: 0.02
  };

  it("converts SI units and accepts the exact tolerance boundary", () => {
    const result = gradeQuestion(numeric, {
      type: "numeric",
      value: -195,
      unit: "cm/s"
    });

    expect(result).toMatchObject({
      isCorrect: true,
      scorePercent: 100,
      convertedValue: -1.95
    });
  });

  it("distinguishes sign, magnitude, unknown-unit and non-finite failures", () => {
    expect(
      gradeQuestion(numeric, {
        type: "numeric",
        value: 2,
        unit: "m/s"
      })
    ).toMatchObject({ isCorrect: false, misconceptionKeys: ["sign"] });
    expect(
      gradeQuestion(numeric, {
        type: "numeric",
        value: -2_000,
        unit: "m/s"
      })
    ).toMatchObject({ isCorrect: false, misconceptionKeys: ["magnitude"] });
    expect(
      gradeQuestion(numeric, {
        type: "numeric",
        value: -2,
        unit: "km/h"
      })
    ).toMatchObject({ isCorrect: false, convertedValue: null });
    expect(() =>
      gradeQuestion(numeric, {
        type: "numeric",
        value: Number.NaN,
        unit: "m/s"
      })
    ).toThrow(AssessmentValidationError);
  });

  it("handles zero and negative values without relative-tolerance division", () => {
    const zeroQuestion: NumericQuestion = {
      ...numeric,
      id: "zero-question",
      expectedValue: 0,
      absoluteTolerance: 0.01,
      relativeTolerance: 0.5
    };

    expect(
      gradeQuestion(zeroQuestion, {
        type: "numeric",
        value: 0.01,
        unit: "m/s"
      }).isCorrect
    ).toBe(true);
    expect(
      gradeQuestion(zeroQuestion, {
        type: "numeric",
        value: -0.0101,
        unit: "m/s"
      })
    ).toMatchObject({ isCorrect: false, misconceptionKeys: ["zero"] });
    expect(
      gradeQuestion(numeric, {
        type: "numeric",
        value: -2,
        unit: "m/s"
      }).isCorrect
    ).toBe(true);
  });

  it("rejects unsafe conversion factors", () => {
    const invalidQuestion: NumericQuestion = {
      ...numeric,
      acceptedUnits: { mm: 0 }
    };
    expect(() =>
      gradeQuestion(invalidQuestion, {
        type: "numeric",
        value: 1,
        unit: "mm"
      })
    ).toThrow(/greater than zero/);
  });
});

describe("seeded calculation variants", () => {
  const seeded: SeededCalculationQuestion = {
    ...common,
    id: "seeded",
    prompt: "Calculate the output for input {{input}}.",
    type: "seeded-calculation",
    generator: {
      algorithm: "inverse-scale",
      minimum: -1,
      maximum: 1,
      step: 1,
      coefficient: 10,
      offset: 0
    },
    canonicalUnit: "m",
    acceptedUnits: { cm: 0.01 },
    absoluteTolerance: 1e-9,
    relativeTolerance: 1e-9
  };

  it("generates deterministic, bounded non-zero inverse variants", () => {
    const first = generateQuestionVariant(seeded, 0);
    const repeat = generateQuestionVariant(seeded, 0);
    const retry = generateQuestionVariant(seeded, 1);

    expect(repeat).toEqual(first);
    expect(first.inputValue).not.toBe(0);
    expect(retry.inputValue).not.toBe(0);
    expect(first.prompt).toContain(String(first.inputValue));
    expect(first).not.toHaveProperty("expectedValue");
    expect(() =>
      generateQuestionVariant(seeded, MAX_RETRY_INDEX + 1)
    ).toThrow(/retryIndex/);
  });

  it("grades against the same deterministic variant and rejects divide by zero grids", () => {
    const retryIndex = 1;
    const variant = generateQuestionVariant(seeded, retryIndex);
    const expected = 10 / variant.inputValue;
    expect(getQuestionVariantExpectedValue(seeded, retryIndex)).toBe(expected);
    expect(
      gradeQuestion(
        seeded,
        { type: "seeded-calculation", value: expected, unit: "m" },
        { retryIndex }
      )
    ).toMatchObject({
      isCorrect: true,
      variantSeed: variant.variantSeed
    });

    const zeroOnly: SeededCalculationQuestion = {
      ...seeded,
      generator: { ...seeded.generator, minimum: 0, maximum: 0 }
    };
    expect(() => generateQuestionVariant(zeroOnly, 0)).toThrow(
      /at least one finite, gradeable expected response/
    );
  });

  it.each([
    ["linear-scale", 14],
    ["sum", 11],
    ["difference", -1],
    ["product", 25]
  ] as const)("grades the %s algorithm transparently", (algorithm, expected) => {
    const question: SeededCalculationQuestion = {
      ...seeded,
      generator: {
        algorithm,
        minimum: 4,
        maximum: 4,
        step: 1,
        coefficient: 6,
        offset: algorithm === "linear-scale" ? -10 : 1
      }
    };
    expect(
      gradeQuestion(question, {
        type: "seeded-calculation",
        value: expected,
        unit: "m"
      }).isCorrect
    ).toBe(true);
  });
});

describe("semantic retry answer validation", () => {
  it("rejects an authored retry that repeats the visible expected response", () => {
    const retry: SingleChoiceQuestion = {
      ...common,
      id: "same-answer-retry",
      type: "single-choice",
      variantSeed: 174,
      options: [
        { id: "retry-right", label: "The same expected response" },
        { id: "retry-wrong-a", label: "A changed distractor" },
        { id: "retry-wrong-b", label: "Another changed distractor" }
      ],
      correctOptionId: "retry-right"
    };
    const question: SingleChoiceQuestion = {
      ...common,
      id: "same-answer-retry",
      type: "single-choice",
      options: [
        { id: "base-right", label: "The same expected response" },
        { id: "base-wrong-a", label: "First distractor" },
        { id: "base-wrong-b", label: "Second distractor" }
      ],
      correctOptionId: "base-right",
      retryVariants: [retry]
    };

    expect(() => assertDistinctQuestionRetryAnswers(question)).toThrow(
      /retry 1 repeats the expected response from case 0/
    );
  });
});

describe("hints, reveal eligibility and bounded attempt history", () => {
  const question: SingleChoiceQuestion = {
    ...common,
    type: "single-choice",
    options: [
      { id: "right", label: "Right" },
      { id: "wrong", label: "Wrong" }
    ],
    correctOptionId: "right"
  };

  it("provides progressive hints without exposing the solution", () => {
    expect(getProgressiveHint(question, 0)).toMatchObject({
      hint: common.hints[0],
      hintIndex: 0,
      remainingHints: 1,
      exhausted: false
    });
    expect(getProgressiveHint(question, 1)).toMatchObject({
      hint: common.hints[1],
      hintIndex: 1,
      remainingHints: 0,
      exhausted: true
    });
    expect(getProgressiveHint(question, 2)).toMatchObject({
      hint: null,
      exhausted: true
    });
  });

  it("does not reveal a solution before an attempt unless explicitly requested", () => {
    expect(
      getSolutionReveal(question, {
        attemptHistory: [],
        explicitReveal: false
      })
    ).toEqual({
      questionId: question.id,
      eligible: false,
      revealed: false,
      reason:
        "Submit a genuine attempt or explicitly request the worked solution.",
      solution: []
    });
    expect(
      getSolutionReveal(question, {
        attemptHistory: [],
        explicitReveal: true
      })
    ).toMatchObject({
      eligible: true,
      revealed: true,
      solution: [...common.solution]
    });
  });

  it("recognises a genuine attempt and keeps only the configured recent history", () => {
    const response = { type: "single-choice", optionId: "wrong" } as const;
    const grade = gradeQuestion(question, response);
    const first = createAttemptRecord(
      question,
      response,
      grade,
      "2026-07-30T08:00:00.000Z"
    );
    const second = {
      ...first,
      attemptedAt: "2026-07-30T08:01:00.000Z"
    };
    const third = {
      ...first,
      attemptedAt: "2026-07-30T08:02:00.000Z"
    };
    const history = appendAttemptHistory(
      appendAttemptHistory(appendAttemptHistory([], first, 2), second, 2),
      third,
      2
    );

    expect(history.map((attempt) => attempt.attemptedAt)).toEqual([
      second.attemptedAt,
      third.attemptedAt
    ]);
    expect(recentQuestionAttempts(history, question.id, 1)).toEqual([third]);
    expect(
      getSolutionReveal(question, {
        attemptHistory: history,
        explicitReveal: false
      })
    ).toMatchObject({
      eligible: true,
      revealed: true,
      solution: [...common.solution]
    });
  });
});

describe("academy question UI static rendering", () => {
  it("renders every question type accessibly without exposing gated content", () => {
    const marker = "__academyStaticUiExecuted";
    Reflect.deleteProperty(globalThis, marker);
    const questions: AcademyQuestion[] = [
      {
        ...common,
        id: "ui-single",
        prompt: "Single prompt",
        type: "single-choice",
        options: [
          { id: "right", label: "Right" },
          { id: "wrong", label: "Wrong" }
        ],
        correctOptionId: "right"
      },
      {
        ...common,
        id: "ui-multiple",
        prompt: "Multiple prompt",
        type: "multiple-selection",
        options: [
          { id: "right", label: "Right" },
          { id: "also-right", label: "Also right" },
          { id: "wrong", label: "Wrong" }
        ],
        correctOptionIds: ["right", "also-right"]
      },
      {
        ...common,
        id: "ui-numeric",
        prompt: "Numeric prompt",
        type: "numeric",
        expectedValue: 1,
        canonicalUnit: "m",
        acceptedUnits: { cm: 0.01 },
        absoluteTolerance: 0.01,
        relativeTolerance: 0.01
      },
      {
        ...common,
        id: "ui-ordering",
        prompt: "Ordering prompt",
        type: "ordering",
        items: [
          { id: "first", label: "First" },
          { id: "second", label: "Second" },
          { id: "third", label: "Third" }
        ],
        correctOrder: ["first", "second", "third"]
      },
      {
        ...common,
        id: "ui-matching",
        prompt: "Matching prompt",
        type: "matching",
        left: [
          { id: "left-a", label: "Left A" },
          { id: "left-b", label: "Left B" }
        ],
        right: [
          { id: "right-a", label: "Right A" },
          { id: "right-b", label: "Right B" }
        ],
        correctPairs: {
          "left-a": "right-a",
          "left-b": "right-b"
        }
      },
      {
        ...common,
        id: "ui-short",
        prompt: "Short prompt",
        type: "short-response",
        requiredTerms: ["evidence"],
        minimumTerms: 1
      },
      {
        ...common,
        id: "ui-diagram",
        prompt: "Diagram prompt",
        type: "diagram",
        diagramDescription: "A static diagram description.",
        diagram: {
          layout: "branch",
          nodes: [
            { id: "input", label: "Input", detail: "Observed condition", role: "system" },
            { id: "model", label: "Model", detail: "Static relationship", role: "relationship" },
            { id: "check", label: "Check", detail: "Acceptance comparison", role: "failure" }
          ],
          edges: [
            {
              id: "input-model",
              fromNodeId: "input",
              toNodeId: "model",
              label: "enters",
              direction: "directed"
            },
            {
              id: "model-check",
              fromNodeId: "model",
              toNodeId: "check",
              label: "is compared at",
              direction: "undirected"
            }
          ],
          answerEdgeId: "model-check"
        },
        options: [
          { id: "right", label: "Right" },
          { id: "wrong", label: "Wrong" }
        ],
        correctOptionId: "right"
      },
      {
        ...common,
        id: "ui-seeded",
        prompt: "Seeded input {{input}}",
        type: "seeded-calculation",
        generator: {
          algorithm: "linear-scale",
          minimum: 2,
          maximum: 2,
          step: 1,
          coefficient: 3,
          offset: 0
        },
        canonicalUnit: "m",
        acceptedUnits: {},
        absoluteTolerance: 0,
        relativeTolerance: 0
      },
      {
        ...common,
        id: "ui-code",
        prompt: "Code prompt",
        type: "code-analysis",
        language: "typescript",
        code: `<script>globalThis.${marker} = true</script>`,
        options: [
          { id: "right", label: "It is static text." },
          { id: "wrong", label: "It executes while rendering." }
        ],
        correctOptionId: "right"
      }
    ];

    const markup = renderToStaticMarkup(
      createElement(AcademyQuestionSet, {
        identity: "ui-all-types",
        title: "All question types",
        questions,
        scorePolicy: "first-attempt",
        onAttempt: () => undefined,
        onPassed: () => undefined
      })
    );

    expect(markup).toContain(
      'aria-label="All question types first-attempt score"'
    );
    expect(markup).toContain("Static typescript code for analysis");
    expect(markup).toContain("&lt;script&gt;");
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("Write the governing relationship.");
    expect(markup).not.toContain("Identify the governing relationship.");
    expect(markup).not.toContain("{{input}}");
    expect(Reflect.has(globalThis, marker)).toBe(false);
    const diagramStart = markup.indexOf(
      '<figure class="academy-question__diagram">'
    );
    const diagramEnd = markup.indexOf("</figure>", diagramStart);
    const diagramMarkup = markup.slice(diagramStart, diagramEnd);
    expect(diagramStart).toBeGreaterThanOrEqual(0);
    expect(diagramEnd).toBeGreaterThan(diagramStart);
    expect(diagramMarkup).toContain('data-layout="branch"');
    expect(diagramMarkup).toContain('aria-hidden="true"');
    expect(diagramMarkup).toContain('data-node-id="input"');
    expect(diagramMarkup).toContain('data-node-id="model"');
    expect(diagramMarkup).toContain('data-node-id="check"');
    expect(diagramMarkup).toContain('data-edge-id="input-model"');
    expect(diagramMarkup).toContain('data-edge-direction="undirected"');
    expect(diagramMarkup).toContain("<figcaption>");
    expect(diagramMarkup).toContain("Diagram text equivalent:");
    expect(diagramMarkup).toContain(
      "Model is linked in both directions with Check through &quot;is compared at&quot;."
    );
    expect(diagramMarkup).not.toContain("tabindex");
    expect(diagramMarkup.indexOf('data-node-id="input"')).toBeLessThan(
      diagramMarkup.indexOf('data-node-id="model"')
    );
    expect(diagramMarkup.indexOf('data-node-id="model"')).toBeLessThan(
      diagramMarkup.indexOf('data-node-id="check"')
    );
    expect(diagramMarkup.indexOf('data-node-id="check"')).toBeLessThan(
      diagramMarkup.indexOf('data-edge-id="input-model"')
    );
    expect(diagramMarkup.match(/A static diagram description\./gu)).toHaveLength(1);
    for (const question of questions) {
      const visiblePrompt = question.type === "seeded-calculation"
        ? "Seeded input 2"
        : question.prompt;
      expect(markup).toContain(visiblePrompt);
    }
  });
});
