import { describe, expect, it } from "vitest";
import {
  academyLessonV2TextRef,
  AcademyLessonV2AuthoringError,
  materialiseAcademyLessonTeachingProfileV2Registry,
  type AcademyLessonTeachingProfileV2CompactAuthoring,
  type AcademyLessonTeachingProfileV2CompactPlan,
  type AcademyLessonV2AuthoredTextRef,
  type AcademyLessonV2InstructionPlan,
  type AcademyLessonV2QuestionCopyPlan
} from "../data/academy/lessonTeachingProfileV2Authoring";
import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION
} from "../data/academy/lessonTeachingProfileV2";
import {
  AcademyLessonProfileV2ValidationError,
  expandAcademyLessonTeachingProfileV2Seed,
  normaliseAcademyAssessmentV2Shell,
  profileUsesRejectedGenericShell,
  validateAcademyLessonTeachingProfileV2,
  validateAcademyLessonTeachingProfileV2Seed
} from "../data/academy/lessonTeachingProfileV2Validation";
import {
  academyLessonV2AssessmentId,
  academyLessonV2QuestionId,
  gradeAcademyLessonV2ShortResponse
} from "../lib/academy/lessonTeachingProfileV2Assessment";

const term = academyLessonV2TextRef.term;
const relation = academyLessonV2TextRef.relation;
const condition = academyLessonV2TextRef.condition;
const reasonedCase = academyLessonV2TextRef.reasonedCase;
const misconception = academyLessonV2TextRef.misconception;

const copyPlan = (
  promptRef: AcademyLessonV2AuthoredTextRef,
  correctRef: AcademyLessonV2AuthoredTextRef,
  incorrectRef: AcademyLessonV2AuthoredTextRef,
  firstHintRef: AcademyLessonV2AuthoredTextRef,
  secondHintRef: AcademyLessonV2AuthoredTextRef,
  firstSolutionRef: AcademyLessonV2AuthoredTextRef,
  secondSolutionRef: AcademyLessonV2AuthoredTextRef
): AcademyLessonV2QuestionCopyPlan => [
  [promptRef],
  [correctRef],
  [incorrectRef],
  [firstHintRef, secondHintRef],
  [firstSolutionRef, secondSolutionRef]
];

const instructionPlan = (
  promptLead: string,
  feedbackCorrect: string,
  feedbackIncorrect: string,
  firstHint: string,
  secondHint: string,
  firstSolutionStep: string,
  secondSolutionStep: string
): AcademyLessonV2InstructionPlan => [
  promptLead,
  feedbackCorrect,
  feedbackIncorrect,
  [firstHint, secondHint],
  [firstSolutionStep, secondSolutionStep]
];

const explicitProfileFixture = () => ({
  schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  lessonId: "EML-E0-D01-L01",
  systemModel:
    "Unaided recall exposes an encoder gap, targeted feedback revises it and a delayed no-notes check tests retention.",
  failurePattern:
    "Prompted fluency can hide failure to reconstruct the encoder mechanism later.",
  visualExplanation:
    "A state graph links an encoder question, recall, feedback, a delayed check and a retention decision.",
  applicationTask:
    "Explain pulse-to-distance conversion without notes, correct the first gap and compare a delayed answer.",
  terms: [
    [
      "retrieval",
      "Unaided retrieval",
      "Encoder explanation reconstructed before feedback.",
      "Copied or prompted answers are outside this boundary.",
      "question-to-recall"
    ],
    [
      "retention",
      "Delayed retention",
      "Reconstruction that remains available after a delay.",
      "An immediate correction alone does not establish retention.",
      "recall-to-check"
    ]
  ],
  entities: [
    [
      "encoder-question",
      "input",
      "Encoder mechanism question",
      "A prompt asking how counted pulses become wheel travel."
    ],
    [
      "unaided-recall",
      "state",
      "Unaided encoder recall",
      "The explanation reconstructed without notes."
    ],
    [
      "corrective-feedback",
      "mechanism",
      "Targeted encoder feedback",
      "Feedback on the first missing pulse-to-distance link."
    ],
    [
      "delayed-check",
      "observation",
      "Delayed encoder check",
      "A later explanation under the same no-notes boundary."
    ],
    [
      "retention-decision",
      "decision",
      "Encoder retention decision",
      "The decision to retain or revisit the concept."
    ]
  ],
  relations: [
    [
      "question-prompts-recall",
      "causes",
      ["encoder-question"],
      ["unaided-recall"],
      "the encoder question prompts reconstruction before feedback",
      "directed",
      "one-to-one"
    ],
    [
      "recall-reveals-gap",
      "measures",
      ["unaided-recall"],
      ["corrective-feedback"],
      "unaided recall reveals the first missing pulse-to-distance link",
      "directed",
      "one-to-one"
    ],
    [
      "feedback-revises-recall",
      "feeds-back",
      ["corrective-feedback"],
      ["unaided-recall"],
      "targeted feedback changes the next reconstructed explanation",
      "directed",
      "one-to-one"
    ],
    [
      "recall-compares-check",
      "compares",
      ["unaided-recall"],
      ["delayed-check"],
      "the delayed explanation is compared with the unaided baseline",
      "undirected",
      "one-to-one"
    ],
    [
      "check-supports-decision",
      "supports",
      ["delayed-check"],
      ["retention-decision"],
      "the delayed mechanism supports a bounded retention decision",
      "directed",
      "one-to-one"
    ]
  ],
  conditions: [
    [
      "no-notes",
      "boundary",
      "No notes or corrective prompts are visible during reconstruction.",
      ["unaided-recall", "delayed-check"],
      ["question-prompts-recall", "recall-compares-check"]
    ],
    [
      "declared-delay",
      "criterion",
      "The second explanation occurs after the declared review interval.",
      ["delayed-check", "retention-decision"],
      ["recall-compares-check", "check-supports-decision"]
    ],
    [
      "prompt-visible",
      "assumption",
      "A worked encoder explanation remains visible while the learner answers.",
      ["unaided-recall"],
      ["question-prompts-recall"]
    ]
  ],
  failureBoundary: [
    "recognition-failure",
    "declared-delay",
    "Visible wording supports recognition but bypasses unaided reconstruction.",
    "The delayed answer omits wheel circumference or cannot connect it to travel.",
    "Retain the concept only when a delayed no-notes answer reconstructs the causal link.",
    ["unaided-recall", "delayed-check", "retention-decision"],
    ["recall-compares-check", "check-supports-decision"]
  ],
  conceptualModel: [
    [
      "question-to-recall",
      "Ask for the encoder mechanism before opening the worked explanation.",
      ["encoder-question", "unaided-recall"],
      ["question-prompts-recall"],
      ["no-notes"]
    ],
    [
      "locate-gap",
      "Use unaided recall to locate the first missing pulse-to-distance link.",
      ["unaided-recall", "corrective-feedback"],
      ["recall-reveals-gap"],
      ["no-notes"]
    ],
    [
      "revise-recall",
      "Apply targeted feedback and reconstruct the encoder explanation again.",
      ["corrective-feedback", "unaided-recall"],
      ["feedback-revises-recall"],
      ["no-notes"]
    ],
    [
      "recall-to-check",
      "Repeat the mechanism explanation after the declared delay.",
      ["unaided-recall", "delayed-check"],
      ["recall-compares-check"],
      ["declared-delay"]
    ],
    [
      "check-to-decision",
      "Use the delayed mechanism evidence to retain or revisit the concept.",
      ["delayed-check", "retention-decision"],
      ["check-supports-decision"],
      ["declared-delay"]
    ]
  ],
  reasonedCases: [
    {
      id: "encoder-example",
      kind: "example",
      scenario:
        "A learner explains how pulse count and circumference determine wheel travel.",
      changedConditionIds: ["no-notes"],
      givens: [
        [
          "baseline-explanation",
          "Initial explanation",
          "Pulse count is present but wheel circumference is omitted.",
          null,
          "unaided-recall"
        ]
      ],
      reasoningSteps: [
        [
          "example-gap",
          "The no-notes explanation exposes the missing circumference relation.",
          ["unaided-recall", "corrective-feedback"],
          ["recall-reveals-gap"],
          ["no-notes"]
        ],
        [
          "example-feedback",
          "Targeted feedback restores the relation without supplying the whole answer.",
          ["corrective-feedback", "unaided-recall"],
          ["feedback-revises-recall"],
          ["no-notes"]
        ],
        [
          "example-delay",
          "The delayed answer reconstructs pulse count, circumference and travel.",
          ["unaided-recall", "delayed-check"],
          ["recall-compares-check"],
          ["declared-delay"]
        ]
      ],
      outcome:
        "The delayed answer retains the complete encoder mechanism.",
      criterionConditionId: "declared-delay",
      criterion:
        "The delayed answer must reconstruct the pulse-to-distance causal link.",
      verification:
        "Compare causal links in the baseline and delayed explanations."
    },
    {
      id: "prompted-counterexample",
      kind: "counterexample",
      scenario:
        "The complete encoder explanation stays visible during every attempt.",
      changedConditionIds: ["prompt-visible"],
      givens: [
        [
          "visible-solution",
          "Prompt state",
          "The worked pulse-to-distance explanation remains on screen.",
          null,
          "unaided-recall"
        ]
      ],
      reasoningSteps: [
        [
          "counter-prompt",
          "Visible wording changes reconstruction into recognition.",
          ["encoder-question", "unaided-recall"],
          ["question-prompts-recall"],
          ["prompt-visible"]
        ],
        [
          "counter-gap",
          "Recognition hides whether the causal gap remains.",
          ["unaided-recall", "corrective-feedback"],
          ["recall-reveals-gap"],
          ["prompt-visible"]
        ],
        [
          "counter-delay",
          "A later no-notes answer can still omit wheel circumference.",
          ["unaided-recall", "delayed-check"],
          ["recall-compares-check"],
          ["declared-delay", "prompt-visible"]
        ]
      ],
      outcome:
        "Prompted answers do not establish delayed retention.",
      criterionConditionId: "declared-delay",
      criterion:
        "A delayed no-notes answer must reconstruct the mechanism before retention is accepted.",
      verification:
        "Remove the worked explanation and repeat the mechanism question after the interval."
    }
  ],
  misconception: {
    id: "fluency-is-retention",
    claim: "A fluent answer beside the worked explanation proves retention.",
    mechanism:
      "Visible wording cues recognition and bypasses reconstruction of the causal link.",
    correction:
      "Remove the prompt, reconstruct the mechanism and repeat after a declared delay.",
    disconfirmingObservation:
      "The learner omits wheel circumference when the prompt is removed.",
    entityIds: ["encoder-question", "unaided-recall", "delayed-check"],
    relationIds: ["question-prompts-recall", "recall-compares-check"],
    conditionIds: ["prompt-visible", "declared-delay"]
  },
  assessmentPlans: {
    q2: {
      base: {
        copy: copyPlan(
          reasonedCase("encoder-example", "scenario"),
          reasonedCase("encoder-example", "outcome"),
          misconception("fluency-is-retention", "claim"),
          term("retrieval", "boundary"),
          relation("recall-reveals-gap"),
          relation("feedback-revises-recall"),
          condition("declared-delay")
        ),
        contextConditionIds: ["no-notes", "declared-delay"],
        steps: [
          [
            "ask",
            relation("question-prompts-recall"),
            condition("no-notes"),
            ["encoder-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["no-notes"]
          ],
          [
            "find-gap",
            relation("recall-reveals-gap"),
            condition("no-notes"),
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"]
          ],
          [
            "revise",
            relation("feedback-revises-recall"),
            condition("no-notes"),
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["no-notes"]
          ],
          [
            "delay",
            relation("recall-compares-check"),
            condition("declared-delay"),
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["recall-compares-check", "check-supports-decision"],
            ["declared-delay"]
          ]
        ],
        correctOrder: ["ask", "find-gap", "revise", "delay"]
      },
      retry: {
        copy: copyPlan(
          reasonedCase("prompted-counterexample", "scenario"),
          misconception("fluency-is-retention", "correction"),
          reasonedCase("prompted-counterexample", "outcome"),
          condition("prompt-visible"),
          term("retrieval", "definition"),
          relation("recall-reveals-gap"),
          reasonedCase("encoder-example", "verification")
        ),
        contextConditionIds: ["prompt-visible", "declared-delay"],
        steps: [
          [
            "remove-prompt",
            relation("question-prompts-recall"),
            condition("prompt-visible"),
            ["encoder-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"]
          ],
          [
            "reveal-gap",
            relation("recall-reveals-gap"),
            condition("no-notes"),
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"]
          ],
          [
            "repeat-check",
            relation("check-supports-decision"),
            condition("declared-delay"),
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"]
          ]
        ],
        correctOrder: ["remove-prompt", "reveal-gap", "repeat-check"]
      }
    },
    q3: {
      base: {
        copy: copyPlan(
          term("retention", "definition"),
          reasonedCase("encoder-example", "outcome"),
          misconception("fluency-is-retention", "claim"),
          condition("no-notes"),
          condition("declared-delay"),
          relation("recall-compares-check"),
          relation("check-supports-decision")
        ),
        contextConditionIds: ["no-notes", "declared-delay"],
        options: [
          [
            "compare",
            relation("recall-compares-check"),
            true,
            condition("declared-delay"),
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["declared-delay"],
            null
          ],
          [
            "decide",
            relation("check-supports-decision"),
            true,
            condition("declared-delay"),
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"],
            null
          ],
          [
            "fluent",
            misconception("fluency-is-retention", "claim"),
            false,
            misconception("fluency-is-retention", "mechanism"),
            ["encoder-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"],
            "fluency-is-retention"
          ],
          [
            "prompted-case",
            reasonedCase("prompted-counterexample", "outcome"),
            false,
            reasonedCase("prompted-counterexample", "criterion"),
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["prompt-visible", "declared-delay"],
            null
          ]
        ]
      },
      retry: {
        copy: copyPlan(
          reasonedCase("prompted-counterexample", "verification"),
          misconception("fluency-is-retention", "correction"),
          reasonedCase("prompted-counterexample", "outcome"),
          condition("prompt-visible"),
          relation("recall-reveals-gap"),
          relation("feedback-revises-recall"),
          condition("declared-delay")
        ),
        contextConditionIds: ["prompt-visible", "declared-delay"],
        options: [
          [
            "prompt-risk",
            condition("prompt-visible"),
            true,
            misconception("fluency-is-retention", "mechanism"),
            ["encoder-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"],
            "fluency-is-retention"
          ],
          [
            "gap",
            relation("recall-reveals-gap"),
            true,
            condition("no-notes"),
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"],
            null
          ],
          [
            "feedback",
            relation("feedback-revises-recall"),
            true,
            condition("no-notes"),
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["no-notes"],
            null
          ],
          [
            "accept-fluency",
            misconception("fluency-is-retention", "claim"),
            false,
            misconception("fluency-is-retention", "disconfirmingObservation"),
            ["encoder-question", "unaided-recall", "delayed-check"],
            ["question-prompts-recall", "recall-compares-check"],
            ["prompt-visible", "declared-delay"],
            "fluency-is-retention"
          ],
          [
            "ignore-delay",
            reasonedCase("prompted-counterexample", "outcome"),
            false,
            condition("declared-delay"),
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"],
            null
          ]
        ]
      }
    },
    q4: {
      base: {
        kind: "short-response",
        copy: copyPlan(
          misconception("fluency-is-retention", "claim"),
          misconception("fluency-is-retention", "correction"),
          misconception("fluency-is-retention", "mechanism"),
          term("retrieval", "boundary"),
          term("retention", "boundary"),
          relation("recall-compares-check"),
          condition("declared-delay")
        ),
        contextConditionIds: ["prompt-visible", "declared-delay"],
        conceptGroups: [
          [
            "retrieval-boundary",
            term("retrieval", "label"),
            [term("retrieval", "definition"), term("retrieval", "boundary")],
            ["encoder-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"]
          ],
          [
            "delayed-comparison",
            relation("recall-compares-check"),
            [relation("recall-compares-check")],
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["declared-delay"]
          ],
          [
            "retention-criterion",
            condition("declared-delay"),
            [condition("declared-delay"), term("retention", "boundary")],
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"]
          ]
        ],
        minimumConceptGroups: 3,
        requiredRelationIds: ["recall-compares-check"],
        criterionConditionId: "declared-delay",
        exemplarRefs: [
          misconception("fluency-is-retention", "mechanism"),
          relation("recall-compares-check"),
          condition("declared-delay")
        ]
      },
      retry: {
        kind: "matching",
        copy: copyPlan(
          reasonedCase("encoder-example", "scenario"),
          reasonedCase("encoder-example", "outcome"),
          reasonedCase("prompted-counterexample", "outcome"),
          relation("recall-reveals-gap"),
          relation("feedback-revises-recall"),
          relation("recall-compares-check"),
          relation("check-supports-decision")
        ),
        contextConditionIds: ["no-notes", "declared-delay"],
        pairs: [
          [
            "gap-pair",
            relation("recall-reveals-gap"),
            condition("no-notes"),
            relation("recall-reveals-gap"),
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"]
          ],
          [
            "revision-pair",
            relation("feedback-revises-recall"),
            condition("no-notes"),
            relation("feedback-revises-recall"),
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["no-notes"]
          ],
          [
            "decision-pair",
            relation("check-supports-decision"),
            condition("declared-delay"),
            relation("check-supports-decision"),
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"]
          ]
        ]
      }
    },
    q5: {
      base: {
        kind: "diagram",
        copy: copyPlan(
          reasonedCase("prompted-counterexample", "outcome"),
          misconception("fluency-is-retention", "correction"),
          misconception("fluency-is-retention", "claim"),
          relation("recall-compares-check"),
          condition("declared-delay"),
          reasonedCase("prompted-counterexample", "verification"),
          relation("check-supports-decision")
        ),
        contextConditionIds: ["prompt-visible", "declared-delay"],
        positions: [
          ["encoder-question", 0, 0],
          ["unaided-recall", 1, 0],
          ["corrective-feedback", 1, 1],
          ["delayed-check", 2, 0],
          ["retention-decision", 3, 0]
        ],
        relationIds: [
          "question-prompts-recall",
          "recall-reveals-gap",
          "feedback-revises-recall",
          "recall-compares-check",
          "check-supports-decision"
        ],
        answerRelationIds: ["recall-compares-check"],
        options: [
          [
            "revisit",
            reasonedCase("prompted-counterexample", "outcome"),
            true,
            condition("declared-delay"),
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["recall-compares-check", "check-supports-decision"],
            ["prompt-visible", "declared-delay"],
            null
          ],
          [
            "accept-fluency",
            misconception("fluency-is-retention", "claim"),
            false,
            misconception("fluency-is-retention", "mechanism"),
            ["encoder-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"],
            "fluency-is-retention"
          ],
          [
            "ignore-delay",
            term("retention", "boundary"),
            false,
            condition("declared-delay"),
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"],
            null
          ]
        ],
        textEquivalentRefs: [
          relation("question-prompts-recall"),
          relation("recall-compares-check"),
          relation("check-supports-decision")
        ]
      },
      retry: {
        kind: "diagram",
        copy: copyPlan(
          reasonedCase("encoder-example", "outcome"),
          reasonedCase("encoder-example", "criterion"),
          misconception("fluency-is-retention", "claim"),
          relation("feedback-revises-recall"),
          relation("recall-compares-check"),
          relation("check-supports-decision"),
          condition("declared-delay")
        ),
        contextConditionIds: ["no-notes", "declared-delay"],
        positions: [
          ["encoder-question", 0, 1],
          ["unaided-recall", 1, 1],
          ["corrective-feedback", 1, 0],
          ["delayed-check", 2, 1],
          ["retention-decision", 3, 1]
        ],
        relationIds: [
          "question-prompts-recall",
          "recall-reveals-gap",
          "feedback-revises-recall",
          "recall-compares-check",
          "check-supports-decision"
        ],
        answerRelationIds: ["check-supports-decision"],
        options: [
          [
            "retain",
            reasonedCase("encoder-example", "outcome"),
            true,
            condition("declared-delay"),
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["recall-compares-check", "check-supports-decision"],
            ["no-notes", "declared-delay"],
            null
          ],
          [
            "permanent",
            term("retention", "boundary"),
            false,
            reasonedCase("encoder-example", "criterion"),
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"],
            null
          ],
          [
            "feedback-alone",
            misconception("fluency-is-retention", "claim"),
            false,
            misconception("fluency-is-retention", "disconfirmingObservation"),
            ["corrective-feedback", "unaided-recall", "delayed-check"],
            ["feedback-revises-recall", "recall-compares-check"],
            ["prompt-visible", "declared-delay"],
            "fluency-is-retention"
          ]
        ],
        textEquivalentRefs: [
          relation("feedback-revises-recall"),
          relation("recall-compares-check"),
          relation("check-supports-decision")
        ]
      }
    }
  },
  explorerPlan: {
    titleRef: term("retention", "label"),
    descriptionRefs: [
      relation("recall-compares-check"),
      relation("check-supports-decision")
    ],
    modelKind: "state-graph",
    controls: [
      {
        id: "unaided",
        labelRef: term("retrieval", "label"),
        changedConditionIds: ["no-notes"],
        state: {
          kind: "state-graph",
          positions: [
            ["encoder-question", 0, 0],
            ["unaided-recall", 1, 0],
            ["corrective-feedback", 1, 1],
            ["delayed-check", 2, 0],
            ["retention-decision", 3, 0]
          ],
          visibleEntityIds: [
            "encoder-question",
            "unaided-recall",
            "corrective-feedback",
            "delayed-check",
            "retention-decision"
          ],
          visibleRelationIds: [
            "question-prompts-recall",
            "recall-reveals-gap",
            "feedback-revises-recall",
            "recall-compares-check",
            "check-supports-decision"
          ],
          activeEntityIds: ["encoder-question", "unaided-recall"],
          activeRelationIds: ["question-prompts-recall", "recall-reveals-gap"],
          suppressedRelationIds: [],
          reversedRelationIds: [],
          annotations: [
            [
              "gap",
              "The missing encoder link is observable.",
              ["unaided-recall", "corrective-feedback"],
              ["recall-reveals-gap"]
            ]
          ]
        },
        outcomeRefs: [reasonedCase("encoder-example", "scenario")],
        requiredActionRefs: [relation("recall-reveals-gap")],
        retainedEvidenceRefs: [reasonedCase("encoder-example", "verification")],
        textEquivalentRefs: [
          relation("question-prompts-recall"),
          relation("recall-reveals-gap")
        ]
      },
      {
        id: "delayed",
        labelRef: term("retention", "label"),
        changedConditionIds: ["declared-delay"],
        state: {
          kind: "state-graph",
          positions: [
            ["encoder-question", 0, 0],
            ["unaided-recall", 1, 0],
            ["corrective-feedback", 1, 1],
            ["delayed-check", 2, 0],
            ["retention-decision", 3, 0]
          ],
          visibleEntityIds: [
            "encoder-question",
            "unaided-recall",
            "corrective-feedback",
            "delayed-check",
            "retention-decision"
          ],
          visibleRelationIds: [
            "question-prompts-recall",
            "recall-reveals-gap",
            "feedback-revises-recall",
            "recall-compares-check",
            "check-supports-decision"
          ],
          activeEntityIds: ["delayed-check", "retention-decision"],
          activeRelationIds: ["recall-compares-check", "check-supports-decision"],
          suppressedRelationIds: ["feedback-revises-recall"],
          reversedRelationIds: [],
          annotations: [
            [
              "criterion",
              "The delayed encoder mechanism controls the decision.",
              ["delayed-check", "retention-decision"],
              ["check-supports-decision"]
            ]
          ]
        },
        outcomeRefs: [reasonedCase("encoder-example", "outcome")],
        requiredActionRefs: [condition("declared-delay")],
        retainedEvidenceRefs: [reasonedCase("encoder-example", "verification")],
        textEquivalentRefs: [
          relation("recall-compares-check"),
          relation("check-supports-decision")
        ]
      }
    ]
  }
} as unknown as AcademyLessonTeachingProfileV2CompactAuthoring);

const compactProfile = (): AcademyLessonTeachingProfileV2CompactPlan => {
  const source = explicitProfileFixture();
  return {
    schemaVersion: source.schemaVersion,
    lessonId: source.lessonId,
    systemModel: source.systemModel,
    failurePattern: source.failurePattern,
    visualExplanation: source.visualExplanation,
    applicationTask: source.applicationTask,
    terms: source.terms,
    entities: source.entities,
    relations: source.relations,
    conditions: source.conditions,
    failureBoundary: source.failureBoundary,
    conceptualModel: source.conceptualModel,
    reasonedCases: source.reasonedCases,
    misconception: source.misconception,
    assessmentPlans: {
      q2: {
        base: {
          instruction: instructionPlan(
            "Order the encoder recall sequence that exposes and repairs the causal gap:",
            "The encoder sequence reaches the delayed retention decision in causal order.",
            "The encoder sequence is not yet ordered from unaided recall to delayed evidence.",
            "Start the encoder sequence before corrective feedback is visible.",
            "Place the encoder gap observation before the targeted correction.",
            "Order encoder questioning, gap detection and targeted feedback first.",
            "Finish the encoder sequence with the delayed comparison and decision."
          ),
          focusRef: reasonedCase("encoder-example", "scenario"),
          contextConditionIds: ["no-notes", "declared-delay"],
          steps: [
            ["ask", ["question-prompts-recall"], ["no-notes"]],
            ["find-gap", ["recall-reveals-gap"], ["no-notes"]],
            ["revise", ["feedback-revises-recall"], ["no-notes"]],
            [
              "delay",
              ["recall-compares-check", "check-supports-decision"],
              ["declared-delay"]
            ]
          ],
          correctOrder: ["ask", "find-gap", "revise", "delay"]
        },
        retry: {
          instruction: instructionPlan(
            "Order the encoder recovery sequence after prompted fluency fails:",
            "The encoder recovery removes the prompt before rebuilding delayed evidence.",
            "The encoder recovery still relies on recognition or skips the delayed check.",
            "Remove the visible encoder explanation before testing recall.",
            "Use the encoder gap to choose the smallest corrective feedback.",
            "Reconstruct the encoder mechanism without the visible prompt.",
            "Repeat the encoder explanation after the declared delay."
          ),
          focusRef: reasonedCase("prompted-counterexample", "scenario"),
          contextConditionIds: ["prompt-visible", "declared-delay"],
          steps: [
            ["remove-prompt", ["question-prompts-recall"], ["prompt-visible"]],
            ["reveal-gap", ["recall-reveals-gap"], ["no-notes"]],
            ["repeat-check", ["check-supports-decision"], ["declared-delay"]]
          ],
          correctOrder: ["remove-prompt", "reveal-gap", "repeat-check"]
        }
      },
      q3: {
        base: {
          instruction: instructionPlan(
            "Select the encoder records that support delayed retention:",
            "The selected encoder records compare unaided and delayed mechanism evidence.",
            "At least one selected encoder record relies on prompted fluency or lacks delayed evidence.",
            "Look for an encoder comparison made after the declared delay.",
            "Keep the encoder decision tied to a no-notes mechanism explanation.",
            "Select the encoder baseline-to-delay comparison.",
            "Select the encoder decision supported by the delayed mechanism."
          ),
          focusRef: term("retention", "definition"),
          contextConditionIds: ["no-notes", "declared-delay"],
          options: [
            [
              "compare",
              true,
              relation("recall-compares-check"),
              condition("declared-delay"),
              ["recall-compares-check"],
              ["declared-delay"],
              null
            ],
            [
              "decide",
              true,
              relation("check-supports-decision"),
              condition("declared-delay"),
              ["check-supports-decision"],
              ["declared-delay"],
              null
            ],
            [
              "fluent",
              false,
              misconception("fluency-is-retention", "claim"),
              misconception("fluency-is-retention", "mechanism"),
              ["question-prompts-recall"],
              ["prompt-visible"],
              "fluency-is-retention"
            ],
            [
              "prompted-case",
              false,
              reasonedCase("prompted-counterexample", "outcome"),
              reasonedCase("prompted-counterexample", "criterion"),
              ["recall-compares-check"],
              ["prompt-visible", "declared-delay"],
              null
            ]
          ]
        },
        retry: {
          instruction: instructionPlan(
            "Select the encoder findings that require another retrieval attempt:",
            "The selected encoder findings identify prompt dependence and a recoverable causal gap.",
            "The selected encoder findings accept fluency or ignore the delayed boundary.",
            "Find the encoder result that changes when the prompt is removed.",
            "Find the encoder relation that reveals the missing causal link.",
            "Mark the encoder prompt dependence as a revision trigger.",
            "Mark the encoder gap and targeted feedback as the recovery path."
          ),
          focusRef: reasonedCase("prompted-counterexample", "verification"),
          contextConditionIds: ["prompt-visible", "declared-delay"],
          options: [
            [
              "prompt-risk",
              true,
              condition("prompt-visible"),
              condition("prompt-visible"),
              ["question-prompts-recall"],
              ["prompt-visible"],
              null
            ],
            [
              "gap",
              true,
              relation("recall-reveals-gap"),
              condition("no-notes"),
              ["recall-reveals-gap"],
              ["no-notes"],
              null
            ],
            [
              "feedback",
              true,
              relation("feedback-revises-recall"),
              condition("no-notes"),
              ["feedback-revises-recall"],
              ["no-notes"],
              null
            ],
            [
              "accept-fluency",
              false,
              misconception("fluency-is-retention", "claim"),
              misconception("fluency-is-retention", "mechanism"),
              ["question-prompts-recall", "recall-compares-check"],
              ["prompt-visible", "declared-delay"],
              "fluency-is-retention"
            ],
            [
              "ignore-delay",
              false,
              reasonedCase("prompted-counterexample", "outcome"),
              condition("declared-delay"),
              ["check-supports-decision"],
              ["declared-delay"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instructionPlan(
            "Explain why prompted encoder fluency cannot establish retention:",
            "The encoder explanation connects unaided retrieval, delayed comparison and the retention criterion.",
            "The encoder explanation omits a required causal group or treats recognition as retrieval.",
            "Name the encoder retrieval boundary before discussing fluency.",
            "Connect the encoder baseline with the delayed no-notes comparison.",
            "Explain how the encoder prompt hides the causal gap.",
            "Apply the encoder delayed criterion before accepting retention."
          ),
          focusRef: misconception("fluency-is-retention", "claim"),
          contextConditionIds: ["prompt-visible", "declared-delay"],
          conceptGroups: [
            [
              "retrieval-boundary",
              term("retrieval", "label"),
              [term("retrieval", "definition"), term("retrieval", "boundary")],
              ["question-prompts-recall"],
              ["prompt-visible"]
            ],
            [
              "delayed-comparison",
              relation("recall-compares-check"),
              [relation("recall-compares-check")],
              ["recall-compares-check"],
              ["declared-delay"]
            ],
            [
              "retention-criterion",
              condition("declared-delay"),
              [condition("declared-delay"), term("retention", "boundary")],
              ["check-supports-decision"],
              ["declared-delay"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["recall-compares-check"],
          criterionConditionId: "declared-delay"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(
            "Match each encoder evidence relation with its controlling condition:",
            "Each encoder relation is matched to the condition that gives it evidential meaning.",
            "At least one encoder relation is paired with the wrong boundary or criterion.",
            "Match encoder gap detection with the no-notes boundary.",
            "Match the encoder decision with the declared delay.",
            "Pair encoder feedback with unaided reconstruction.",
            "Pair encoder retention evidence with the delayed criterion."
          ),
          focusRef: reasonedCase("encoder-example", "scenario"),
          contextConditionIds: ["no-notes", "declared-delay"],
          pairs: [
            [
              "gap-pair",
              relation("recall-reveals-gap"),
              condition("no-notes"),
              relation("recall-reveals-gap"),
              ["recall-reveals-gap"],
              ["no-notes"]
            ],
            [
              "revision-pair",
              relation("feedback-revises-recall"),
              term("retrieval", "boundary"),
              relation("feedback-revises-recall"),
              ["feedback-revises-recall"],
              ["no-notes"]
            ],
            [
              "decision-pair",
              relation("check-supports-decision"),
              condition("declared-delay"),
              relation("check-supports-decision"),
              ["check-supports-decision"],
              ["declared-delay"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instructionPlan(
            "Interpret the encoder graph when the delayed answer remains prompt-dependent:",
            "The encoder graph implication correctly requires another unaided retrieval attempt.",
            "The encoder graph implication accepts recognition or discards the delayed criterion.",
            "Trace the encoder recall node to the delayed-check node.",
            "Use the encoder prompt-visible condition when judging the omission.",
            "Identify the encoder comparison relation that exposes the failure.",
            "Apply the encoder delayed criterion to the retention decision."
          ),
          focusRef: reasonedCase("prompted-counterexample", "outcome"),
          contextConditionIds: ["prompt-visible", "declared-delay"],
          positions: [
            ["encoder-question", 0, 0],
            ["unaided-recall", 1, 0],
            ["delayed-check", 2, 0],
            ["retention-decision", 3, 0]
          ],
          relationIds: [
            "question-prompts-recall",
            "recall-compares-check",
            "check-supports-decision"
          ],
          answerRelationIds: ["recall-compares-check"],
          options: [
            [
              "revisit",
              true,
              reasonedCase("prompted-counterexample", "verification"),
              condition("declared-delay"),
              ["recall-compares-check", "check-supports-decision"],
              ["prompt-visible", "declared-delay"],
              null
            ],
            [
              "accept-fluency",
              false,
              misconception("fluency-is-retention", "claim"),
              misconception("fluency-is-retention", "mechanism"),
              ["question-prompts-recall"],
              ["prompt-visible"],
              "fluency-is-retention"
            ],
            [
              "ignore-delay",
              false,
              term("retention", "boundary"),
              condition("declared-delay"),
              ["check-supports-decision"],
              ["declared-delay"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instructionPlan(
            "Interpret the encoder graph when the delayed mechanism is reconstructed:",
            "The encoder graph implication retains the concept within the declared boundary.",
            "The encoder graph implication overclaims permanent mastery or treats feedback as evidence.",
            "Trace the encoder revision into the delayed comparison.",
            "Check that the encoder decision is supported by delayed reconstruction.",
            "Follow the encoder feedback relation into unaided recall.",
            "Accept encoder retention only through the delayed decision relation."
          ),
          focusRef: reasonedCase("encoder-example", "outcome"),
          contextConditionIds: ["no-notes", "declared-delay"],
          positions: [
            ["unaided-recall", 1, 1],
            ["corrective-feedback", 1, 0],
            ["delayed-check", 2, 1],
            ["retention-decision", 3, 1]
          ],
          relationIds: [
            "feedback-revises-recall",
            "recall-compares-check",
            "check-supports-decision"
          ],
          answerRelationIds: ["check-supports-decision"],
          options: [
            [
              "retain",
              true,
              reasonedCase("encoder-example", "verification"),
              condition("declared-delay"),
              ["recall-compares-check", "check-supports-decision"],
              ["no-notes", "declared-delay"],
              null
            ],
            [
              "permanent",
              false,
              term("retention", "boundary"),
              reasonedCase("encoder-example", "criterion"),
              ["check-supports-decision"],
              ["declared-delay"],
              null
            ],
            [
              "feedback-alone",
              false,
              misconception("fluency-is-retention", "claim"),
              misconception(
                "fluency-is-retention",
                "disconfirmingObservation"
              ),
              ["feedback-revises-recall", "recall-compares-check"],
              ["prompt-visible", "declared-delay"],
              "fluency-is-retention"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("retention", "label"),
      focusRef: reasonedCase("encoder-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["encoder-question", 0, 0],
        ["unaided-recall", 1, 0],
        ["corrective-feedback", 1, 1],
        ["delayed-check", 2, 0],
        ["retention-decision", 3, 0]
      ],
      visibleEntityIds: [
        "encoder-question",
        "unaided-recall",
        "corrective-feedback",
        "delayed-check",
        "retention-decision"
      ],
      visibleRelationIds: [
        "question-prompts-recall",
        "recall-reveals-gap",
        "feedback-revises-recall",
        "recall-compares-check",
        "check-supports-decision"
      ],
      controls: [
        [
          "unaided",
          term("retrieval", "label"),
          ["no-notes"],
          ["encoder-question", "unaided-recall"],
          ["question-prompts-recall", "recall-reveals-gap"],
          [],
          [],
          [
            [
              "gap",
              "The missing encoder link is observable.",
              ["unaided-recall", "corrective-feedback"],
              ["recall-reveals-gap"]
            ]
          ],
          reasonedCase("encoder-example", "verification")
        ],
        [
          "delayed",
          term("retention", "label"),
          ["declared-delay"],
          ["delayed-check", "retention-decision"],
          ["recall-compares-check", "check-supports-decision"],
          ["feedback-revises-recall"],
          [],
          [
            [
              "criterion",
              "The delayed encoder mechanism controls the decision.",
              ["delayed-check", "retention-decision"],
              ["check-supports-decision"]
            ]
          ],
          reasonedCase("encoder-example", "verification")
        ]
      ]
    }
  };
};

const materialiseAcademyLessonTeachingProfileV2Seed = (
  input: AcademyLessonTeachingProfileV2CompactPlan
) => {
  const registry = materialiseAcademyLessonTeachingProfileV2Registry(
    [input.lessonId],
    [input]
  );
  const seed = registry[input.lessonId];
  if (!seed) throw new Error(`Missing materialised seed ${input.lessonId}.`);
  return seed;
};

const validationCodes = (action: () => unknown): string[] => {
  try {
    action();
    return [];
  } catch (error) {
    if (!(error instanceof AcademyLessonProfileV2ValidationError)) throw error;
    return error.issues.map((issue) => issue.code);
  }
};

const authoringCode = (action: () => unknown): string | null => {
  try {
    action();
    return null;
  } catch (error) {
    if (!(error instanceof AcademyLessonV2AuthoringError)) throw error;
    return error.code;
  }
};

describe("Academy lesson V2 compact authoring", () => {
  it("materialises one compact plan into the unchanged validated full seed", () => {
    const compact = compactProfile();
    const seed = materialiseAcademyLessonTeachingProfileV2Seed(compact);
    const compactBytes = Buffer.byteLength(JSON.stringify(compact), "utf8");
    const fullSeedBytes = Buffer.byteLength(JSON.stringify(seed), "utf8");
    expect(compactBytes).toBeLessThanOrEqual(18 * 1024);
    expect(compactBytes).toBeLessThan(fullSeedBytes);
    expect(validateAcademyLessonTeachingProfileV2Seed(seed)).toEqual([]);
    const profile = expandAcademyLessonTeachingProfileV2Seed(seed);
    expect(validateAcademyLessonTeachingProfileV2(profile)).toEqual([]);
    expect(profileUsesRejectedGenericShell(profile)).toBe(false);
    expect(seed.assessments.q2.base.steps.map((step) => step[0])).toEqual([
      "ask",
      "find-gap",
      "revise",
      "delay"
    ]);
    expect(seed.explorer.controls[0].state).not.toEqual(
      seed.explorer.controls[1].state
    );
    const q4 = profile.assessments.q4.base;
    if (q4.kind !== "short-response") throw new Error("Expected short Q4.");
    q4.conceptGroups.forEach((group) =>
      expect(
        group.acceptedPhrases.some((phrase) =>
          q4.exemplarResponse.includes(phrase)
        )
      ).toBe(true)
    );
    expect(q4.exemplarResponse).toContain(
      "the delayed explanation is compared with the unaided baseline"
    );
    expect(
      gradeAcademyLessonV2ShortResponse(
        q4,
        q4.exemplarResponse,
        {
          lessonId: profile.lessonId,
          assessmentId: academyLessonV2AssessmentId(profile.lessonId),
          questionKey: "q4",
          questionId: academyLessonV2QuestionId(
            profile.lessonId,
            "q4",
            "base"
          ),
          scenarioMode: "base",
          retryIndex: 0
        },
        profile.relations,
        profile.conditions
      ).isCorrect
    ).toBe(true);
    expect(seed.assessments.q5.base.kind).toBe("diagram");
    if (seed.assessments.q5.base.kind !== "diagram") {
      throw new Error("Expected diagram Q5.");
    }
    expect(seed.assessments.q5.base.textEquivalent).toContain(
      "Nodes and positions:"
    );
    expect(seed.assessments.q5.base.textEquivalent).toContain(
      "Encoder mechanism question at column 0, row 0"
    );
    expect(seed.assessments.q5.base.textEquivalent).toContain(
      "Answer relation state:"
    );
    expect(seed.explorer.controls[0].textEquivalent).toContain(
      "state-graph nodes and positions:"
    );
    expect(seed.explorer.controls[0].textEquivalent).toContain(
      "Reversed relations: none"
    );
    expect(seed.explorer.controls[0].textEquivalent).toContain(
      "Active relations:"
    );
    expect(seed.explorer.controls[0].textEquivalent).not.toMatch(
      /relations: [^.]+ (?:Suppressed|Reversed) relations:/u
    );
  });

  it("fails closed when a text reference or required plan array is missing", () => {
    const unknownRef = structuredClone(compactProfile()) as unknown as {
      assessmentPlans: {
        q3: {
          base: {
            options: unknown[];
          };
        };
      };
    };
    unknownRef.assessmentPlans.q3.base.options[0] = [
      "compare",
      true,
      relation("not-a-relation"),
      condition("declared-delay"),
      ["not-a-relation"],
      ["declared-delay"],
      null
    ];
    expect(
      () => materialiseAcademyLessonTeachingProfileV2Seed(
        unknownRef as unknown as AcademyLessonTeachingProfileV2CompactPlan
      )
    ).toThrowError(
      expect.objectContaining({
        code: "v2-authoring-reference"
      })
    );

    const missingSteps = structuredClone(compactProfile()) as unknown as {
      assessmentPlans: { q2: { base: Record<string, unknown> } };
    };
    delete missingSteps.assessmentPlans.q2.base.steps;
    expect(
      () => materialiseAcademyLessonTeachingProfileV2Seed(
        missingSteps as unknown as AcademyLessonTeachingProfileV2CompactPlan
      )
    ).toThrowError(AcademyLessonV2AuthoringError);
  });

  it("requires a causally changed and visibly distinct counterexample", () => {
    const sameCondition = structuredClone(compactProfile());
    const sameCounterexample = sameCondition.reasonedCases.find(
      (reasonedCase) => reasonedCase.kind === "counterexample"
    );
    if (!sameCounterexample) throw new Error("Expected counterexample.");
    sameCounterexample.changedConditionIds = ["no-notes"];
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(sameCondition)
      )
    ).toBe("v2-authoring-reasoned-case");

    const missingReason = structuredClone(compactProfile());
    const unreasonedCounterexample = missingReason.reasonedCases.find(
      (reasonedCase) => reasonedCase.kind === "counterexample"
    );
    if (!unreasonedCounterexample) throw new Error("Expected counterexample.");
    unreasonedCounterexample.reasoningSteps =
      unreasonedCounterexample.reasoningSteps.map((step) => [
        step[0],
        step[1],
        step[2],
        step[3],
        step[4].filter((conditionId) => conditionId !== "prompt-visible")
      ] as const);
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(missingReason)
      )
    ).toBe("v2-authoring-reasoned-case");

    const duplicateRendering = structuredClone(compactProfile());
    const example = duplicateRendering.reasonedCases.find(
      (reasonedCase) => reasonedCase.kind === "example"
    );
    const duplicateCounterexample = duplicateRendering.reasonedCases.find(
      (reasonedCase) => reasonedCase.kind === "counterexample"
    );
    if (!example || !duplicateCounterexample) {
      throw new Error("Expected example and counterexample.");
    }
    duplicateCounterexample.scenario = example.scenario;
    duplicateCounterexample.givens = example.givens;
    duplicateCounterexample.reasoningSteps = example.reasoningSteps.map(
      (step, index) => [
        step[0],
        step[1],
        step[2],
        step[3],
        index === 0 ? [...step[4], "prompt-visible"] : step[4]
      ] as const
    );
    duplicateCounterexample.outcome = example.outcome;
    duplicateCounterexample.criterion = example.criterion;
    duplicateCounterexample.verification = example.verification;
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(
          duplicateRendering
        )
      )
    ).toBe("v2-authoring-reasoned-case");
  });

  it("requires lesson-specific instruction copy beyond a generic noun swap", () => {
    const generic = structuredClone(compactProfile());
    generic.assessmentPlans.q2.base.instruction = instructionPlan(
      "Order these steps:",
      "The response is correct.",
      "The response is incorrect.",
      "Start with the first step.",
      "Continue with the next step.",
      "Put the steps in order.",
      "Finish with the final step."
    );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(generic)
      )
    ).toBe("v2-authoring-instruction");

    const nounSwap = structuredClone(compactProfile());
    nounSwap.assessmentPlans.q2.base.instruction = instructionPlan(
      "Order the encoder steps:",
      "The encoder answer is correct.",
      "The encoder answer is incorrect.",
      "Start with the encoder step.",
      "Continue with the encoder step.",
      "Put the encoder steps in order.",
      "Finish with the encoder step."
    );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(nounSwap)
      )
    ).toBe("v2-authoring-instruction");

    const repeatedTemplate = structuredClone(compactProfile());
    repeatedTemplate.assessmentPlans.q2.base.instruction = instructionPlan(
      "Order the encoder retrieval feedback sequence:",
      "The encoder retrieval feedback sequence is supported.",
      "The encoder retrieval feedback sequence is unsupported.",
      "Start the encoder retrieval feedback sequence.",
      "Continue the encoder retrieval feedback sequence.",
      "Check the encoder retrieval feedback sequence.",
      "Finish the encoder retrieval feedback sequence."
    );
    repeatedTemplate.assessmentPlans.q2.retry.instruction = instructionPlan(
      "Order the delayed retention mechanism sequence:",
      "The delayed retention mechanism sequence is supported.",
      "The delayed retention mechanism sequence is unsupported.",
      "Start the delayed retention mechanism sequence.",
      "Continue the delayed retention mechanism sequence.",
      "Check the delayed retention mechanism sequence.",
      "Finish the delayed retention mechanism sequence."
    );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(repeatedTemplate)
      )
    ).toBe("v2-authoring-instruction");
  });

  it("rejects a semantically duplicate retry after IDs and copy change", () => {
    const duplicate = structuredClone(compactProfile());
    const base = duplicate.assessmentPlans.q2.base;
    const retryInstruction =
      duplicate.assessmentPlans.q2.retry.instruction;
    const renamedSteps = base.steps.map((step, index) => [
      `retry-step-${index + 1}`,
      step[1],
      step[2]
    ] as const);
    duplicate.assessmentPlans.q2.retry = {
      ...base,
      instruction: retryInstruction,
      steps: renamedSteps,
      correctOrder: renamedSteps.map((step) => step[0])
    };
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(duplicate)
      )
    ).toBe("v2-authoring-semantic-duplicate");

    const focusOnly = structuredClone(compactProfile());
    const retryFocus = focusOnly.assessmentPlans.q2.retry.focusRef;
    const retryCopy = focusOnly.assessmentPlans.q2.retry.instruction;
    focusOnly.assessmentPlans.q2.retry = {
      ...focusOnly.assessmentPlans.q2.base,
      instruction: retryCopy,
      focusRef: retryFocus
    };
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(focusOnly)
      )
    ).toBe("v2-authoring-semantic-duplicate");

    const q2Permutation = structuredClone(compactProfile());
    const q2RetryInstruction =
      q2Permutation.assessmentPlans.q2.retry.instruction;
    const q2RetryFocus = q2Permutation.assessmentPlans.q2.retry.focusRef;
    q2Permutation.assessmentPlans.q2.retry = {
      ...q2Permutation.assessmentPlans.q2.base,
      instruction: q2RetryInstruction,
      focusRef: q2RetryFocus,
      steps: [...q2Permutation.assessmentPlans.q2.base.steps].reverse()
    };

    const q3Permutation = structuredClone(compactProfile());
    const q3RetryInstruction =
      q3Permutation.assessmentPlans.q3.retry.instruction;
    const q3RetryFocus = q3Permutation.assessmentPlans.q3.retry.focusRef;
    q3Permutation.assessmentPlans.q3.retry = {
      ...q3Permutation.assessmentPlans.q3.base,
      instruction: q3RetryInstruction,
      focusRef: q3RetryFocus,
      options: [...q3Permutation.assessmentPlans.q3.base.options].reverse()
    };

    const q4Permutation = structuredClone(compactProfile());
    const q4Base = q4Permutation.assessmentPlans.q4.base;
    if (q4Base.kind !== "short-response") {
      throw new Error("Expected short-response Q4.");
    }
    const q4RetryInstruction =
      q4Permutation.assessmentPlans.q4.retry.instruction;
    const q4RetryFocus = q4Permutation.assessmentPlans.q4.retry.focusRef;
    q4Permutation.assessmentPlans.q4.retry = {
      ...q4Base,
      instruction: q4RetryInstruction,
      focusRef: q4RetryFocus,
      conceptGroups: [...q4Base.conceptGroups].reverse()
    };

    const q5Permutation = structuredClone(compactProfile());
    const q5Base = q5Permutation.assessmentPlans.q5.base;
    if (q5Base.kind !== "diagram") throw new Error("Expected diagram Q5.");
    const q5RetryInstruction =
      q5Permutation.assessmentPlans.q5.retry.instruction;
    const q5RetryFocus = q5Permutation.assessmentPlans.q5.retry.focusRef;
    q5Permutation.assessmentPlans.q5.retry = {
      ...q5Base,
      instruction: q5RetryInstruction,
      focusRef: q5RetryFocus,
      positions: [...q5Base.positions].reverse(),
      relationIds: [...q5Base.relationIds].reverse(),
      answerRelationIds: [...q5Base.answerRelationIds].reverse(),
      options: [...q5Base.options].reverse()
    };

    [q2Permutation, q3Permutation, q4Permutation, q5Permutation].forEach(
      (permutation) => {
        expect(
          authoringCode(
            () => materialiseAcademyLessonTeachingProfileV2Seed(permutation)
          )
        ).toBe("v2-authoring-semantic-duplicate");
      }
    );
  });

  it("requires every Q3 misconception binding to be a false distractor", () => {
    const invalid = structuredClone(compactProfile());
    invalid.assessmentPlans.q3.base.options =
      invalid.assessmentPlans.q3.base.options.map((option, index) =>
        index === 2
          ? [
              option[0],
              true,
              option[2],
              option[3],
              option[4],
              option[5],
              option[6]
            ] as const
          : option
      );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(invalid)
      )
    ).toBe("v2-authoring-reference-binding");

    const wrongText = structuredClone(compactProfile());
    wrongText.assessmentPlans.q3.base.options =
      wrongText.assessmentPlans.q3.base.options.map((option, index) =>
        index === 2
          ? [
              option[0],
              option[1],
              option[2],
              misconception(
                "fluency-is-retention",
                "disconfirmingObservation"
              ),
              option[4],
              option[5],
              option[6]
            ] as const
          : option
      );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(wrongText)
      )
    ).toBe("v2-authoring-reference-binding");
  });

  it("requires unique nested relation sets for diagram questions", () => {
    const invalid = structuredClone(compactProfile());
    const diagram = invalid.assessmentPlans.q5.base;
    if (diagram.kind !== "diagram") throw new Error("Expected diagram Q5.");
    diagram.relationIds = [
      "recall-compares-check",
      "recall-compares-check"
    ];
    diagram.answerRelationIds = ["recall-compares-check"];
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(invalid)
      )
    ).toBe("v2-authoring-relation-set");
  });

  it("rejects prompts that reveal the rendered Q2 through Q5 answers", () => {
    const q2 = structuredClone(compactProfile());
    const q2Instruction = q2.assessmentPlans.q2.base.instruction;
    q2.assessmentPlans.q2.base.instruction = [
      "Order the encoder sequence: the encoder question prompts reconstruction before feedback; unaided recall reveals the first missing pulse-to-distance link; targeted feedback changes the next reconstructed explanation; the delayed explanation is compared with the unaided baseline.",
      q2Instruction[1],
      q2Instruction[2],
      q2Instruction[3],
      q2Instruction[4]
    ];

    const q3 = structuredClone(compactProfile());
    q3.assessmentPlans.q3.base.focusRef =
      relation("recall-compares-check");

    const q4 = structuredClone(compactProfile());
    const q4Scenario = q4.assessmentPlans.q4.base;
    if (q4Scenario.kind !== "short-response") {
      throw new Error("Expected short-response Q4.");
    }
    const q4Instruction = q4Scenario.instruction;
    q4Scenario.instruction = [
      "Explain the encoder answer: Encoder explanation reconstructed before feedback. The delayed explanation is compared with the unaided baseline. The second explanation occurs after the declared review interval.",
      q4Instruction[1],
      q4Instruction[2],
      q4Instruction[3],
      q4Instruction[4]
    ];

    const q5 = structuredClone(compactProfile());
    q5.assessmentPlans.q5.base.focusRef =
      reasonedCase("prompted-counterexample", "verification");

    [q2, q3, q4, q5].forEach((plan) => {
      expect(
        authoringCode(
          () => materialiseAcademyLessonTeachingProfileV2Seed(plan)
        )
      ).toBe("v2-authoring-answer-leakage");
    });
  });

  it("rejects overlapping graph states and incomplete comparison matrices", () => {
    const overlap = structuredClone(compactProfile());
    const graph = overlap.explorerPlan;
    if (graph.kind !== "shared-graph") {
      throw new Error("Expected shared graph explorer.");
    }
    graph.controls = graph.controls.map((control, index) =>
      index === 0
        ? [
            control[0],
            control[1],
            control[2],
            control[3],
            control[4],
            control[4].slice(0, 1),
            control[6],
            control[7],
            control[8]
          ] as const
        : control
    );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(overlap)
      )
    ).toBe("v2-authoring-explorer-integrity");

    const matrix = structuredClone(compactProfile());
    matrix.explorerPlan = {
      kind: "explicit-states",
      titleRef: term("retention", "label"),
      focusRef: reasonedCase("encoder-example", "verification"),
      modelKind: "comparison-matrix",
      controls: [
        [
          "matrix",
          term("retention", "label"),
          ["no-notes"],
          {
            kind: "comparison-matrix",
            rowEntityIds: ["unaided-recall", "delayed-check"],
            columnConditionIds: ["no-notes"],
            cells: [
              [
                "unaided-recall",
                "no-notes",
                "supported",
                "Unaided encoder recall is observed."
              ],
              [
                "unaided-recall",
                "no-notes",
                "contradicted",
                "The duplicate encoder cell must be rejected."
              ]
            ]
          },
          reasonedCase("encoder-example", "verification"),
          [relation("recall-compares-check")]
        ]
      ]
    };
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(matrix)
      )
    ).toBe("v2-authoring-explorer-integrity");
  });

  it("requires explorer condition effects and non-degenerate coordinates", () => {
    const noEffect = structuredClone(compactProfile());
    const graph = noEffect.explorerPlan;
    if (graph.kind !== "shared-graph") {
      throw new Error("Expected shared graph explorer.");
    }
    graph.controls = graph.controls.map((control, index) =>
      index === 0
        ? [
            control[0],
            control[1],
            ["declared-delay"],
            control[3],
            control[4],
            control[5],
            control[6],
            control[7],
            control[8]
          ] as const
        : control
    );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(noEffect)
      )
    ).toBe("v2-authoring-explorer-integrity");

    const geometry = structuredClone(compactProfile());
    geometry.explorerPlan = {
      kind: "explicit-states",
      titleRef: term("retrieval", "label"),
      focusRef: reasonedCase("encoder-example", "verification"),
      modelKind: "geometry-transform",
      controls: [
        [
          "geometry",
          term("retrieval", "label"),
          ["no-notes"],
          {
            kind: "geometry-transform",
            frameEntityId: "encoder-question",
            points: [
              ["question", "Encoder question", 0, 0, "encoder-question"],
              ["recall", "Encoder recall", 0, 0, "unaided-recall"],
              ["check", "Encoder check", 2, 0, "delayed-check"]
            ],
            segments: [
              [
                "question-recall",
                "question",
                "recall",
                "question-prompts-recall"
              ],
              [
                "recall-check",
                "recall",
                "check",
                "recall-compares-check"
              ]
            ],
            verification:
              "The encoder geometry must keep every rendered point distinct."
          },
          reasonedCase("encoder-example", "verification"),
          [relation("recall-compares-check")]
        ]
      ]
    };
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(geometry)
      )
    ).toBe("v2-authoring-explorer-integrity");

    const parameter = structuredClone(compactProfile());
    parameter.explorerPlan = {
      kind: "explicit-states",
      titleRef: term("retention", "label"),
      focusRef: reasonedCase("encoder-example", "verification"),
      modelKind: "parameter-sweep",
      controls: [
        [
          "parameter",
          term("retention", "label"),
          ["no-notes"],
          {
            kind: "parameter-sweep",
            axes: [
              ["delay", "Encoder delay", null, "delayed-check"],
              ["recall", "Encoder recall", null, "unaided-recall"]
            ],
            points: [
              ["first", 0, 0, "First encoder point", ["no-notes"]],
              ["second", 0, 0, "Second encoder point", ["no-notes"]],
              ["third", 1, 1, "Third encoder point", ["declared-delay"]]
            ],
            highlightedPointId: "first",
            verification:
              "The encoder parameter sweep must compare distinct points."
          },
          reasonedCase("encoder-example", "verification"),
          [condition("no-notes")]
        ]
      ]
    };
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(parameter)
      )
    ).toBe("v2-authoring-explorer-integrity");
  });

  it("rejects duplicate rendered learner labels in Q2 through Q5", () => {
    const q2 = structuredClone(compactProfile());
    const firstStep = q2.assessmentPlans.q2.base.steps[0];
    if (!firstStep) throw new Error("Expected first Q2 step.");
    q2.assessmentPlans.q2.base.steps =
      q2.assessmentPlans.q2.base.steps.map((step, index) =>
        index === 1
          ? [step[0], firstStep[1], step[2]] as const
          : step
      );

    const q3 = structuredClone(compactProfile());
    const firstOption = q3.assessmentPlans.q3.base.options[0];
    if (!firstOption) throw new Error("Expected first Q3 option.");
    q3.assessmentPlans.q3.base.options =
      q3.assessmentPlans.q3.base.options.map((option, index) =>
        index === 1
          ? [
              option[0],
              option[1],
              firstOption[2],
              option[3],
              [...option[4], "recall-compares-check"],
              option[5],
              option[6]
            ] as const
          : option
      );

    const q4 = structuredClone(compactProfile());
    const shortResponse = q4.assessmentPlans.q4.base;
    if (shortResponse.kind !== "short-response") {
      throw new Error("Expected short-response Q4.");
    }
    const firstGroup = shortResponse.conceptGroups[0];
    if (!firstGroup) throw new Error("Expected first Q4 concept group.");
    shortResponse.conceptGroups = shortResponse.conceptGroups.map(
      (group, index) =>
        index === 1
          ? [
              group[0],
              firstGroup[1],
              group[2],
              group[3],
              group[4]
            ] as const
          : group
    );

    const q5 = structuredClone(compactProfile());
    const diagram = q5.assessmentPlans.q5.base;
    if (diagram.kind !== "diagram") throw new Error("Expected diagram Q5.");
    const firstImplication = diagram.options[0];
    if (!firstImplication) throw new Error("Expected first Q5 option.");
    diagram.options = diagram.options.map((option, index) =>
      index === 1
        ? [
            option[0],
            option[1],
            firstImplication[2],
            option[3],
            option[4],
            option[5],
            option[6]
          ] as const
        : option
    );

    [q2, q3, q4, q5].forEach((plan) => {
      expect(
        authoringCode(
          () => materialiseAcademyLessonTeachingProfileV2Seed(plan)
        )
      ).toBe("v2-authoring-rendered-duplicate");
    });
  });

  it("keeps short-Q4 accepted phrases disjoint and self-grades both modes", () => {
    const overlap = structuredClone(compactProfile());
    const overlappingScenario = overlap.assessmentPlans.q4.base;
    if (overlappingScenario.kind !== "short-response") {
      throw new Error("Expected short-response Q4.");
    }
    const firstGroup = overlappingScenario.conceptGroups[0];
    if (!firstGroup) throw new Error("Expected first Q4 concept group.");
    overlappingScenario.conceptGroups =
      overlappingScenario.conceptGroups.map((group, index) =>
        index === 1
          ? [
              group[0],
              group[1],
              firstGroup[2],
              group[3],
              group[4]
            ] as const
          : group
      );
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Seed(overlap)
      )
    ).toBe("v2-authoring-q4-integrity");

    const bothModes = structuredClone(compactProfile());
    const base = bothModes.assessmentPlans.q4.base;
    if (base.kind !== "short-response") {
      throw new Error("Expected short-response Q4.");
    }
    const reversedGroups = [...base.conceptGroups].reverse();
    bothModes.assessmentPlans.q4.retry = {
      kind: "short-response",
      instruction: instructionPlan(
        "Explain how the encoder recovery establishes delayed retention:",
        "The encoder recovery satisfies retrieval, comparison and retention boundaries.",
        "The encoder recovery omits a retrieval group or delayed retention criterion.",
        "State the encoder retrieval boundary without the visible prompt.",
        "Connect encoder recall to the delayed retention comparison.",
        "Explain the encoder mechanism using every evidence group.",
        "Finish with the encoder delayed retention criterion."
      ),
      focusRef: reasonedCase("prompted-counterexample", "verification"),
      contextConditionIds: ["prompt-visible", "declared-delay"],
      conceptGroups: reversedGroups,
      minimumConceptGroups: 3,
      requiredRelationIds: ["check-supports-decision"],
      criterionConditionId: "declared-delay"
    };
    const profile = expandAcademyLessonTeachingProfileV2Seed(
      materialiseAcademyLessonTeachingProfileV2Seed(bothModes)
    );
    (["base", "retry"] as const).forEach((mode) => {
      const scenario = profile.assessments.q4[mode];
      if (scenario.kind !== "short-response") {
        throw new Error(`Expected short-response Q4 ${mode}.`);
      }
      const result = gradeAcademyLessonV2ShortResponse(
        scenario,
        scenario.exemplarResponse,
        {
          lessonId: profile.lessonId,
          assessmentId: academyLessonV2AssessmentId(profile.lessonId),
          questionKey: "q4",
          questionId: academyLessonV2QuestionId(
            profile.lessonId,
            "q4",
            mode
          ),
          scenarioMode: mode,
          retryIndex: mode === "base" ? 0 : 1
        },
        profile.relations,
        profile.conditions
      );
      expect(result.isCorrect).toBe(true);
      expect(result.matchedConceptGroupIds).toHaveLength(
        scenario.conceptGroups.length
      );
      expect(result.missingRelationIds).toEqual([]);
      expect(result.criterionMatched).toBe(true);
    });
  });

  it("validates sibling lessons only through the public aggregate API", () => {
    const first = compactProfile();
    const second = structuredClone(first);
    second.lessonId = "EML-E0-D01-L02";
    second.systemModel =
      "A distinct encoder system description keeps the substantive information signature separate.";
    const codes = validationCodes(
      () => materialiseAcademyLessonTeachingProfileV2Registry(
        [first.lessonId, second.lessonId],
        [first, second]
      )
    );
    expect(
      codes.filter((code) => code === "v2-duplicate-unit-shell")
    ).toHaveLength(3);
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Registry(
          [first.lessonId, second.lessonId],
          [first]
        )
      )
    ).toBe("v2-authoring-registry");

    const nounSwapSibling = structuredClone(first);
    nounSwapSibling.lessonId = "EML-E0-D02-L01";
    nounSwapSibling.systemModel =
      "A different unit-level encoder description avoids an information duplicate while retaining a copied template.";
    expect(
      authoringCode(
        () => materialiseAcademyLessonTeachingProfileV2Registry(
          [first.lessonId, nounSwapSibling.lessonId],
          [first, nounSwapSibling]
        )
      )
    ).toBe("v2-authoring-instruction");
  });

  it("cannot materialise the rejected generic Q2 shell", () => {
    const generic = structuredClone(compactProfile());
    const labels = [
      "Observe and bound the need",
      "Select a concept or model",
      "Apply a check or test",
      "Interpret and retain evidence"
    ];
    generic.relations = generic.relations.map((entry, index) => {
      if (index > 3) return entry;
      return [
        entry[0],
        entry[1],
        entry[2],
        entry[3],
        labels[index],
        entry[5],
        entry[6]
      ];
    });
    expect(
      validationCodes(
        () => materialiseAcademyLessonTeachingProfileV2Seed(generic)
      )
    ).toContain("v2-generic-question-shell");
  });

  it("produces different normalised shells from different explicit reference plans", () => {
    const first = expandAcademyLessonTeachingProfileV2Seed(
      materialiseAcademyLessonTeachingProfileV2Seed(compactProfile())
    );
    const changed = structuredClone(compactProfile());
    changed.assessmentPlans.q2.base.correctOrder = [
      "delay",
      "revise",
      "find-gap",
      "ask"
    ];
    const second = expandAcademyLessonTeachingProfileV2Seed(
      materialiseAcademyLessonTeachingProfileV2Seed(changed)
    );
    expect(normaliseAcademyAssessmentV2Shell(first, "q2")).not.toBe(
      normaliseAcademyAssessmentV2Shell(second, "q2")
    );
  });
});
