import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyLessonTeachingProfileV2,
  type AcademyLessonTeachingProfileV2Registry
} from "../../lessonTeachingProfileV2";
import {
  academyLessonV2TextRef,
  materialiseAcademyLessonTeachingProfileV2Registry,
  type AcademyLessonTeachingProfileV2CompactPlan,
  type AcademyLessonV2InstructionPlan
} from "../../lessonTeachingProfileV2Authoring";
import {
  expandAcademyLessonTeachingProfileV2Seed
} from "../../lessonTeachingProfileV2Validation";

const term = academyLessonV2TextRef.term;
const relation = academyLessonV2TextRef.relation;
const condition = academyLessonV2TextRef.condition;
const reasonedCase = academyLessonV2TextRef.reasonedCase;
const misconception = academyLessonV2TextRef.misconception;

const instruction = (
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

const expectedLessonIds = [
  "EML-E0-D01-L01",
  "EML-E0-D01-L02",
  "EML-E0-D01-L03",
  "EML-E0-D01-L04",
  "EML-E0-D01-L05",
  "EML-E0-D01-L06",
  "EML-E0-D01-L07"
] as const;

const plans = [
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D01-L01",
    systemModel:
      "A beginner learns a technical idea by exposing an initial prediction, comparing it with evidence, revising the mental model and testing that revision on a varied task.",
    failurePattern:
      "Reading a polished explanation can create familiarity while leaving the learner unable to predict or explain a new case.",
    visualExplanation:
      "A learning loop runs from an unfamiliar engineering task to an initial prediction, targeted feedback, a varied transfer task and a bounded learning decision.",
    applicationTask:
      "Predict what will happen when a mobile robot loses one wheel encoder, explain the mechanism, inspect feedback and then reason about a different encoder fault without copying the worked explanation.",
    terms: [
      [
        "prior-model",
        "Prior model",
        "The learner's current explanation before corrective feedback is shown.",
        "A guess copied from visible teaching is not an exposed prior model.",
        "expose-prediction"
      ],
      [
        "transfer-check",
        "Transfer check",
        "A new task that uses the same underlying idea in a meaningfully different setting.",
        "Repeating the worked wording is practice, but it is not a transfer check.",
        "apply-transfer"
      ]
    ],
    entities: [
      [
        "unfamiliar-task",
        "input",
        "Unfamiliar encoder task",
        "A concrete question about robot behaviour under an encoder fault."
      ],
      [
        "initial-prediction",
        "state",
        "Initial fault prediction",
        "The learner's mechanism and expected robot motion before feedback."
      ],
      [
        "targeted-feedback",
        "mechanism",
        "Targeted mechanism feedback",
        "A correction aimed at the first missing causal link."
      ],
      [
        "varied-task",
        "input",
        "Varied encoder task",
        "A different fault case that requires the same sensing principle."
      ],
      [
        "learning-decision",
        "decision",
        "Learning decision",
        "A bounded decision to continue, review or attempt a harder case."
      ]
    ],
    relations: [
      [
        "task-elicits-prediction",
        "causes",
        ["unfamiliar-task"],
        ["initial-prediction"],
        "the unfamiliar encoder task elicits a prediction before teaching is revealed",
        "directed",
        "one-to-one"
      ],
      [
        "prediction-directs-feedback",
        "routes",
        ["initial-prediction"],
        ["targeted-feedback"],
        "the first incorrect causal link directs the targeted feedback",
        "directed",
        "one-to-one"
      ],
      [
        "feedback-revises-model",
        "feeds-back",
        ["targeted-feedback"],
        ["initial-prediction"],
        "targeted feedback revises the learner's encoder fault model",
        "directed",
        "one-to-one"
      ],
      [
        "model-maps-transfer",
        "maps",
        ["initial-prediction"],
        ["varied-task"],
        "the revised encoder model is mapped onto the varied fault task",
        "directed",
        "one-to-one"
      ],
      [
        "transfer-supports-decision",
        "supports",
        ["varied-task"],
        ["learning-decision"],
        "the independently explained transfer task supports the learning decision",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "attempt-before-feedback",
        "boundary",
        "The initial fault prediction is recorded before targeted feedback appears.",
        ["initial-prediction", "targeted-feedback"],
        ["task-elicits-prediction", "prediction-directs-feedback"]
      ],
      [
        "shared-principle",
        "criterion",
        "The varied task uses the same encoder sensing principle without repeating the worked wording.",
        ["initial-prediction", "varied-task", "learning-decision"],
        ["model-maps-transfer", "transfer-supports-decision"]
      ],
      [
        "solution-first",
        "assumption",
        "The polished explanation is shown before the learner makes a prediction.",
        ["unfamiliar-task", "initial-prediction"],
        ["task-elicits-prediction"]
      ]
    ],
    failureBoundary: [
      "familiarity-without-transfer",
      "shared-principle",
      "Visible explanations can cue recognition without changing the learner's own causal model.",
      "The learner repeats the worked fault explanation but cannot explain the varied encoder task.",
      "Count the idea as learned only when the varied task is explained from the shared sensing principle.",
      ["initial-prediction", "varied-task", "learning-decision"],
      ["model-maps-transfer", "transfer-supports-decision"]
    ],
    conceptualModel: [
      [
        "expose-prediction",
        "Record the expected robot motion and mechanism before opening the explanation.",
        ["unfamiliar-task", "initial-prediction"],
        ["task-elicits-prediction"],
        ["attempt-before-feedback"]
      ],
      [
        "locate-causal-gap",
        "Compare the prediction with evidence and locate the first missing encoder link.",
        ["initial-prediction", "targeted-feedback"],
        ["prediction-directs-feedback"],
        ["attempt-before-feedback"]
      ],
      [
        "revise-model",
        "Use the targeted feedback to repair that link in the fault model.",
        ["targeted-feedback", "initial-prediction"],
        ["feedback-revises-model"],
        ["attempt-before-feedback"]
      ],
      [
        "apply-transfer",
        "Apply the repaired model to a varied encoder task without copying the worked case.",
        ["initial-prediction", "varied-task"],
        ["model-maps-transfer"],
        ["shared-principle"]
      ],
      [
        "decide-next-step",
        "Use the transfer explanation to choose continued practice, review or progression.",
        ["varied-task", "learning-decision"],
        ["transfer-supports-decision"],
        ["shared-principle"]
      ]
    ],
    reasonedCases: [
      {
        id: "encoder-transfer-example",
        kind: "example",
        scenario:
          "A learner first predicts that a missing left encoder signal makes the controller misjudge left-wheel travel, then explains a different intermittent-signal case.",
        changedConditionIds: ["attempt-before-feedback"],
        givens: [
          [
            "first-prediction",
            "Recorded prediction",
            "The controller receives incomplete left-wheel motion evidence.",
            null,
            "initial-prediction"
          ]
        ],
        reasoningSteps: [
          [
            "example-expose",
            "The prediction exists before feedback, so the learner's starting model is observable.",
            ["unfamiliar-task", "initial-prediction"],
            ["task-elicits-prediction"],
            ["attempt-before-feedback"]
          ],
          [
            "example-repair",
            "Feedback repairs the link between encoder evidence and estimated wheel travel.",
            ["targeted-feedback", "initial-prediction"],
            ["feedback-revises-model"],
            ["attempt-before-feedback"]
          ],
          [
            "example-transfer",
            "The learner uses that repaired link to reason about intermittent evidence in the varied task.",
            ["initial-prediction", "varied-task", "learning-decision"],
            ["model-maps-transfer", "transfer-supports-decision"],
            ["shared-principle"]
          ]
        ],
        outcome:
          "The varied explanation demonstrates a usable encoder fault model within the stated boundary.",
        criterionConditionId: "shared-principle",
        criterion:
          "The varied answer must use the shared sensing principle and not merely repeat the worked wording.",
        verification:
          "Compare the causal links in the first prediction, repaired model and varied explanation."
      },
      {
        id: "solution-first-counterexample",
        kind: "counterexample",
        scenario:
          "A learner reads the complete encoder fault explanation first and then reproduces its sentences.",
        changedConditionIds: ["solution-first"],
        givens: [
          [
            "visible-explanation",
            "Visible teaching",
            "The full mechanism remains beside the response.",
            null,
            "unfamiliar-task"
          ]
        ],
        reasoningSteps: [
          [
            "counter-cue",
            "Showing the solution first removes evidence of the learner's initial prediction.",
            ["unfamiliar-task", "initial-prediction"],
            ["task-elicits-prediction"],
            ["solution-first"]
          ],
          [
            "counter-feedback",
            "Without an exposed gap, the displayed feedback cannot be targeted to the learner's model.",
            ["initial-prediction", "targeted-feedback"],
            ["prediction-directs-feedback"],
            ["solution-first"]
          ],
          [
            "counter-transfer",
            "The copied response gives no evidence that the model can map to a varied encoder task.",
            ["initial-prediction", "varied-task", "learning-decision"],
            ["model-maps-transfer", "transfer-supports-decision"],
            ["solution-first", "shared-principle"]
          ]
        ],
        outcome:
          "Accurate copied wording establishes familiarity, not independent technical learning.",
        criterionConditionId: "shared-principle",
        criterion:
          "A separate transfer explanation is still required before progression.",
        verification:
          "Hide the worked explanation and ask for the mechanism in the varied encoder case."
      }
    ],
    misconception: {
      id: "reading-equals-learning",
      claim:
        "Understanding every sentence in a worked explanation means the technical idea has been learned.",
      mechanism:
        "Visible wording supplies recognition cues and bypasses prediction, repair and transfer.",
      correction:
        "Make a prediction first, repair one causal gap and test the revised model on a varied task.",
      disconfirmingObservation:
        "When the explanation is hidden, the learner cannot connect intermittent encoder evidence to controller behaviour.",
      entityIds: [
        "unfamiliar-task",
        "initial-prediction",
        "targeted-feedback",
        "varied-task"
      ],
      relationIds: [
        "task-elicits-prediction",
        "feedback-revises-model",
        "model-maps-transfer"
      ],
      conditionIds: ["solution-first", "shared-principle"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Build the attempt-first encoder learning loop in causal order:",
            "The encoder loop exposes a prediction, repairs its first gap and reaches a varied task.",
            "The encoder loop currently reveals teaching too early or tests transfer before the model is repaired.",
            "Begin with the unfamiliar encoder task while the prediction is still unaided.",
            "Place targeted feedback after the prediction has exposed a causal gap.",
            "Order the encoder task, prediction and targeted feedback around the attempt-first boundary.",
            "Finish by mapping the revised model to the varied task and learning decision."
          ),
          focusRef: reasonedCase("encoder-transfer-example", "scenario"),
          contextConditionIds: ["attempt-before-feedback", "shared-principle"],
          steps: [
            ["predict", ["task-elicits-prediction"], ["attempt-before-feedback"]],
            [
              "target",
              ["prediction-directs-feedback"],
              ["attempt-before-feedback"]
            ],
            ["repair", ["feedback-revises-model"], ["attempt-before-feedback"]],
            [
              "transfer",
              ["model-maps-transfer", "transfer-supports-decision"],
              ["shared-principle"]
            ]
          ],
          correctOrder: ["predict", "target", "repair", "transfer"]
        },
        retry: {
          instruction: instruction(
            "Recover independent encoder reasoning after solution-first familiarity:",
            "The recovery hides the encoder solution, exposes the model and earns a bounded transfer decision.",
            "The recovery still treats visible encoder wording as evidence or omits the varied task.",
            "Remove the encoder explanation before requesting another prediction.",
            "Use the newly exposed encoder gap to choose focused feedback.",
            "Recreate an unaided encoder prediction and route only its first gap to feedback.",
            "Require the varied encoder explanation before making the learning decision."
          ),
          focusRef: reasonedCase("solution-first-counterexample", "scenario"),
          contextConditionIds: ["solution-first", "shared-principle"],
          steps: [
            ["hide-and-predict", ["task-elicits-prediction"], ["solution-first"]],
            ["repair-gap", ["feedback-revises-model"], ["attempt-before-feedback"]],
            [
              "verify-transfer",
              ["transfer-supports-decision"],
              ["shared-principle"]
            ]
          ],
          correctOrder: ["hide-and-predict", "repair-gap", "verify-transfer"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the encoder evidence that justifies a learning decision:",
            "The chosen encoder evidence shows an attempt-first repair and independent transfer.",
            "At least one chosen encoder item is recognition evidence or lacks the shared-principle check.",
            "Look for the encoder relation that changes the learner's own prediction.",
            "Keep the varied encoder task tied to the learning decision.",
            "Select the feedback relation only when an initial encoder model was exposed.",
            "Select the transfer evidence only when the shared encoder principle is applied independently."
          ),
          focusRef: term("transfer-check", "definition"),
          contextConditionIds: ["attempt-before-feedback", "shared-principle"],
          options: [
            [
              "revised-model",
              true,
              relation("feedback-revises-model"),
              condition("attempt-before-feedback"),
              ["feedback-revises-model"],
              ["attempt-before-feedback"],
              null
            ],
            [
              "independent-transfer",
              true,
              relation("transfer-supports-decision"),
              condition("shared-principle"),
              ["model-maps-transfer", "transfer-supports-decision"],
              ["shared-principle"],
              null
            ],
            [
              "recognition",
              false,
              misconception("reading-equals-learning", "claim"),
              misconception("reading-equals-learning", "mechanism"),
              ["task-elicits-prediction"],
              ["solution-first"],
              "reading-equals-learning"
            ],
            [
              "copied-wording",
              false,
              reasonedCase("solution-first-counterexample", "outcome"),
              reasonedCase("solution-first-counterexample", "criterion"),
              ["model-maps-transfer"],
              ["solution-first", "shared-principle"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Identify the encoder findings that demand another learning cycle:",
            "The selected encoder findings expose solution dependence and a missing transfer link.",
            "The selected encoder findings accept copied fluency or discard useful feedback.",
            "Find where the encoder prediction disappears because teaching was visible.",
            "Find where the varied encoder task still cannot be explained.",
            "Mark solution-first encoder recognition as inadequate evidence.",
            "Route the missing encoder transfer link back through targeted feedback."
          ),
          focusRef: reasonedCase(
            "solution-first-counterexample",
            "verification"
          ),
          contextConditionIds: ["solution-first", "shared-principle"],
          options: [
            [
              "missing-prior",
              true,
              condition("solution-first"),
              reasonedCase("solution-first-counterexample", "outcome"),
              ["task-elicits-prediction"],
              ["solution-first"],
              null
            ],
            [
              "failed-transfer",
              true,
              term("transfer-check", "boundary"),
              condition("shared-principle"),
              ["model-maps-transfer", "transfer-supports-decision"],
              ["shared-principle"],
              null
            ],
            [
              "targeted-repair",
              true,
              relation("prediction-directs-feedback"),
              condition("attempt-before-feedback"),
              ["prediction-directs-feedback", "feedback-revises-model"],
              ["attempt-before-feedback"],
              null
            ],
            [
              "reading-proof",
              false,
              misconception("reading-equals-learning", "claim"),
              misconception("reading-equals-learning", "mechanism"),
              ["task-elicits-prediction", "model-maps-transfer"],
              ["solution-first"],
              "reading-equals-learning"
            ],
            [
              "skip-variation",
              false,
              reasonedCase("encoder-transfer-example", "outcome"),
              reasonedCase("encoder-transfer-example", "criterion"),
              ["transfer-supports-decision"],
              ["shared-principle"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why a polished encoder explanation is not sufficient learning evidence:",
            "The explanation distinguishes a prior model, targeted repair and transfer check.",
            "The explanation omits one encoder evidence group or treats recognition as an exposed model.",
            "State what the initial encoder prediction makes observable.",
            "Connect targeted encoder feedback to the varied task rather than to copied wording.",
            "Describe how solution-first encoder teaching hides the causal gap.",
            "Apply the shared-principle encoder criterion before approving progression."
          ),
          focusRef: misconception("reading-equals-learning", "claim"),
          contextConditionIds: ["solution-first", "shared-principle"],
          conceptGroups: [
            [
              "prior-model-group",
              term("prior-model", "label"),
              [term("prior-model", "definition")],
              ["task-elicits-prediction"],
              ["attempt-before-feedback"]
            ],
            [
              "repair-group",
              relation("feedback-revises-model"),
              [relation("feedback-revises-model")],
              ["feedback-revises-model"],
              ["attempt-before-feedback"]
            ],
            [
              "transfer-group",
              term("transfer-check", "label"),
              [term("transfer-check", "definition")],
              ["model-maps-transfer", "transfer-supports-decision"],
              ["shared-principle"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["model-maps-transfer"],
          criterionConditionId: "shared-principle"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match each encoder learning relation to the boundary that gives it meaning:",
            "Every encoder relation now sits beside its proper attempt or transfer boundary.",
            "One encoder relation is still paired with a condition that cannot justify it.",
            "Pair the first encoder prediction with feedback remaining hidden.",
            "Pair the varied encoder explanation with the shared sensing principle.",
            "Link targeted encoder repair to the attempt-before-feedback boundary.",
            "Link the encoder learning decision to evidence from the transfer check."
          ),
          focusRef: reasonedCase("encoder-transfer-example", "scenario"),
          contextConditionIds: ["attempt-before-feedback", "shared-principle"],
          pairs: [
            [
              "prediction-pair",
              relation("task-elicits-prediction"),
              condition("attempt-before-feedback"),
              relation("task-elicits-prediction"),
              ["task-elicits-prediction"],
              ["attempt-before-feedback"]
            ],
            [
              "repair-pair",
              relation("feedback-revises-model"),
              term("prior-model", "boundary"),
              relation("feedback-revises-model"),
              ["feedback-revises-model"],
              ["attempt-before-feedback"]
            ],
            [
              "transfer-pair",
              relation("transfer-supports-decision"),
              condition("shared-principle"),
              relation("transfer-supports-decision"),
              ["transfer-supports-decision"],
              ["shared-principle"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the encoder learning graph when the varied task cannot be explained:",
            "The encoder graph implication correctly returns the learner to an exposed prediction and targeted repair.",
            "The encoder graph implication approves recognition or ignores the failed transfer evidence.",
            "Trace the encoder model from the first prediction toward the varied task.",
            "Use the shared encoder principle to judge the blocked learning decision.",
            "Locate the encoder transfer relation that lacks independent support.",
            "Reopen the encoder learning loop at the earliest unsupported causal link."
          ),
          focusRef: reasonedCase("solution-first-counterexample", "outcome"),
          contextConditionIds: ["solution-first", "shared-principle"],
          positions: [
            ["unfamiliar-task", 0, 0],
            ["initial-prediction", 1, 0],
            ["varied-task", 2, 0],
            ["learning-decision", 3, 0]
          ],
          relationIds: [
            "task-elicits-prediction",
            "model-maps-transfer",
            "transfer-supports-decision"
          ],
          answerRelationIds: ["model-maps-transfer"],
          options: [
            [
              "reopen-loop",
              true,
              reasonedCase("solution-first-counterexample", "verification"),
              condition("shared-principle"),
              ["model-maps-transfer", "transfer-supports-decision"],
              ["solution-first", "shared-principle"],
              null
            ],
            [
              "approve-reading",
              false,
              misconception("reading-equals-learning", "claim"),
              misconception("reading-equals-learning", "mechanism"),
              ["task-elicits-prediction"],
              ["solution-first"],
              "reading-equals-learning"
            ],
            [
              "drop-transfer",
              false,
              term("transfer-check", "boundary"),
              reasonedCase("encoder-transfer-example", "criterion"),
              ["transfer-supports-decision"],
              ["shared-principle"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the repaired encoder graph and decide whether progression is bounded:",
            "The repaired encoder graph reaches a learning decision through an independently explained transfer task.",
            "The repaired encoder graph overstates permanent mastery or credits feedback without transfer.",
            "Follow targeted encoder feedback back into the learner's prediction.",
            "Check that the varied encoder task uses the same sensing principle.",
            "Confirm that the encoder repair changes the model before transfer begins.",
            "Grant bounded encoder progression only through transfer-supported evidence."
          ),
          focusRef: reasonedCase("encoder-transfer-example", "outcome"),
          contextConditionIds: ["attempt-before-feedback", "shared-principle"],
          positions: [
            ["targeted-feedback", 0, 1],
            ["initial-prediction", 1, 1],
            ["varied-task", 2, 1],
            ["learning-decision", 3, 1]
          ],
          relationIds: [
            "feedback-revises-model",
            "model-maps-transfer",
            "transfer-supports-decision"
          ],
          answerRelationIds: ["transfer-supports-decision"],
          options: [
            [
              "bounded-progress",
              true,
              reasonedCase("encoder-transfer-example", "verification"),
              condition("shared-principle"),
              ["model-maps-transfer", "transfer-supports-decision"],
              ["attempt-before-feedback", "shared-principle"],
              null
            ],
            [
              "permanent-mastery",
              false,
              term("transfer-check", "boundary"),
              reasonedCase("encoder-transfer-example", "criterion"),
              ["transfer-supports-decision"],
              ["shared-principle"],
              null
            ],
            [
              "feedback-is-proof",
              false,
              misconception("reading-equals-learning", "claim"),
              misconception(
                "reading-equals-learning",
                "disconfirmingObservation"
              ),
              ["feedback-revises-model", "model-maps-transfer"],
              ["solution-first", "shared-principle"],
              "reading-equals-learning"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("transfer-check", "label"),
      focusRef: reasonedCase("encoder-transfer-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["unfamiliar-task", 0, 0],
        ["initial-prediction", 1, 0],
        ["targeted-feedback", 1, 1],
        ["varied-task", 2, 0],
        ["learning-decision", 3, 0]
      ],
      visibleEntityIds: [
        "unfamiliar-task",
        "initial-prediction",
        "targeted-feedback",
        "varied-task",
        "learning-decision"
      ],
      visibleRelationIds: [
        "task-elicits-prediction",
        "prediction-directs-feedback",
        "feedback-revises-model",
        "model-maps-transfer",
        "transfer-supports-decision"
      ],
      controls: [
        [
          "attempt-first-view",
          term("prior-model", "label"),
          ["attempt-before-feedback"],
          ["unfamiliar-task", "initial-prediction", "targeted-feedback"],
          ["task-elicits-prediction", "prediction-directs-feedback"],
          [],
          [],
          [
            [
              "visible-gap",
              "The learner's first encoder gap is available for targeted repair.",
              ["initial-prediction", "targeted-feedback"],
              ["prediction-directs-feedback"]
            ]
          ],
          reasonedCase("encoder-transfer-example", "verification")
        ],
        [
          "transfer-view",
          term("transfer-check", "label"),
          ["shared-principle"],
          ["initial-prediction", "varied-task", "learning-decision"],
          ["model-maps-transfer", "transfer-supports-decision"],
          ["task-elicits-prediction"],
          [],
          [
            [
              "bounded-decision",
              "The varied encoder explanation controls the learning decision.",
              ["varied-task", "learning-decision"],
              ["transfer-supports-decision"]
            ]
          ],
          reasonedCase("encoder-transfer-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D01-L02",
    systemModel:
      "A retrieval cue triggers an unaided response, the response exposes a specific gap, a later review revisits that gap and delayed evidence informs the next review decision.",
    failurePattern:
      "Repeated rereading can make notes feel fluent while the idea remains unavailable when the notes are closed.",
    visualExplanation:
      "A review state graph connects a concept cue, closed-notes response, gap record, later retrieval and retention judgement.",
    applicationTask:
      "Recall the purpose of a robot emergency-stop circuit with notes closed, record the first missing safety link, revisit it after a declared interval and compare the later explanation.",
    terms: [
      [
        "retrieval-cue",
        "Retrieval cue",
        "A prompt that asks the learner to reconstruct an idea without displaying the answer.",
        "A prompt containing the full explanation is a recognition cue, not a retrieval cue.",
        "present-cue"
      ],
      [
        "spaced-review",
        "Spaced review",
        "A later retrieval attempt separated from the initial correction by a declared interval.",
        "The interval creates another evidence point; it does not guarantee permanent memory.",
        "run-later-recall"
      ]
    ],
    entities: [
      [
        "safety-cue",
        "input",
        "Emergency-stop cue",
        "A closed-notes prompt about why an emergency-stop path removes hazardous motion."
      ],
      [
        "unaided-response",
        "state",
        "Unaided safety response",
        "The explanation reconstructed before notes or feedback appear."
      ],
      [
        "gap-record",
        "observation",
        "Safety gap record",
        "A record of the first missing causal link in the response."
      ],
      [
        "later-retrieval",
        "state",
        "Later safety retrieval",
        "A new closed-notes explanation after the declared interval."
      ],
      [
        "review-decision",
        "decision",
        "Review scheduling decision",
        "The decision to extend, maintain or shorten the next review interval."
      ]
    ],
    relations: [
      [
        "cue-triggers-response",
        "causes",
        ["safety-cue"],
        ["unaided-response"],
        "the emergency-stop cue triggers a closed-notes explanation",
        "directed",
        "one-to-one"
      ],
      [
        "response-measures-gap",
        "measures",
        ["unaided-response"],
        ["gap-record"],
        "the unaided response exposes the first missing safety link",
        "directed",
        "one-to-one"
      ],
      [
        "gap-routes-review",
        "routes",
        ["gap-record"],
        ["later-retrieval"],
        "the recorded safety gap determines the focus of later retrieval",
        "directed",
        "one-to-one"
      ],
      [
        "later-compares-baseline",
        "compares",
        ["later-retrieval"],
        ["unaided-response"],
        "the later explanation is compared with the initial closed-notes response",
        "undirected",
        "one-to-one"
      ],
      [
        "later-supports-schedule",
        "supports",
        ["later-retrieval"],
        ["review-decision"],
        "the later safety explanation supports the next scheduling decision",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "notes-closed",
        "boundary",
        "Notes and worked explanations remain hidden during each retrieval attempt.",
        ["safety-cue", "unaided-response", "later-retrieval"],
        ["cue-triggers-response", "later-compares-baseline"]
      ],
      [
        "declared-interval",
        "criterion",
        "The later retrieval occurs after an interval declared before the check.",
        ["later-retrieval", "review-decision"],
        ["gap-routes-review", "later-supports-schedule"]
      ],
      [
        "rereading-only",
        "operating-state",
        "The learner repeatedly reads the safety explanation without attempting recall.",
        ["safety-cue", "unaided-response", "gap-record"],
        ["cue-triggers-response", "response-measures-gap"]
      ]
    ],
    failureBoundary: [
      "fluent-rereading",
      "declared-interval",
      "Continuous exposure increases familiarity but never tests whether the safety mechanism can be reconstructed later.",
      "The closed-notes response omits how the emergency-stop path interrupts hazardous motion.",
      "Adjust the schedule from delayed closed-notes evidence, not from comfort while rereading.",
      ["unaided-response", "later-retrieval", "review-decision"],
      ["later-compares-baseline", "later-supports-schedule"]
    ],
    conceptualModel: [
      [
        "present-cue",
        "Present the emergency-stop question while the notes remain closed.",
        ["safety-cue", "unaided-response"],
        ["cue-triggers-response"],
        ["notes-closed"]
      ],
      [
        "capture-gap",
        "Record the first missing safety link instead of scoring only right or wrong.",
        ["unaided-response", "gap-record"],
        ["response-measures-gap"],
        ["notes-closed"]
      ],
      [
        "route-review",
        "Use the gap record to choose the focus of the later retrieval attempt.",
        ["gap-record", "later-retrieval"],
        ["gap-routes-review"],
        ["declared-interval"]
      ],
      [
        "run-later-recall",
        "Reconstruct the safety mechanism after the declared interval with notes closed.",
        ["later-retrieval", "unaided-response"],
        ["later-compares-baseline"],
        ["notes-closed", "declared-interval"]
      ],
      [
        "schedule-next",
        "Set the next review from the later explanation and its remaining gaps.",
        ["later-retrieval", "review-decision"],
        ["later-supports-schedule"],
        ["declared-interval"]
      ]
    ],
    reasonedCases: [
      {
        id: "safety-retrieval-example",
        kind: "example",
        scenario:
          "A learner closes the lesson, explains the emergency-stop path, records a missing actuator-isolation link and later reconstructs the complete mechanism.",
        changedConditionIds: ["notes-closed"],
        givens: [
          [
            "baseline-gap",
            "Initial safety gap",
            "The first response names the stop button but omits actuator isolation.",
            null,
            "gap-record"
          ]
        ],
        reasoningSteps: [
          [
            "example-retrieve",
            "The closed-notes response exposes what the learner can reconstruct unaided.",
            ["safety-cue", "unaided-response"],
            ["cue-triggers-response"],
            ["notes-closed"]
          ],
          [
            "example-route",
            "The actuator-isolation omission becomes the explicit target for later retrieval.",
            ["gap-record", "later-retrieval"],
            ["gap-routes-review"],
            ["declared-interval"]
          ],
          [
            "example-compare",
            "The later response now connects the stop request to removal of hazardous actuation.",
            ["later-retrieval", "unaided-response", "review-decision"],
            ["later-compares-baseline", "later-supports-schedule"],
            ["notes-closed", "declared-interval"]
          ]
        ],
        outcome:
          "Delayed closed-notes evidence supports extending the review while retaining future checks.",
        criterionConditionId: "declared-interval",
        criterion:
          "The later attempt must occur after the declared interval and reconstruct the missing safety link.",
        verification:
          "Compare the causal links present in the initial and later closed-notes explanations."
      },
      {
        id: "rereading-counterexample",
        kind: "counterexample",
        scenario:
          "A learner repeatedly rereads the emergency-stop page and judges readiness from how familiar it feels.",
        changedConditionIds: ["rereading-only"],
        givens: [
          [
            "visible-notes",
            "Review mode",
            "The complete safety mechanism stays visible throughout review.",
            null,
            "safety-cue"
          ]
        ],
        reasoningSteps: [
          [
            "counter-recognition",
            "Rereading keeps the safety answer visible, so the cue never triggers unaided reconstruction.",
            ["safety-cue", "unaided-response"],
            ["cue-triggers-response"],
            ["rereading-only"]
          ],
          [
            "counter-gap",
            "Without an unaided response, the missing actuator-isolation link is not recorded.",
            ["unaided-response", "gap-record"],
            ["response-measures-gap"],
            ["rereading-only"]
          ],
          [
            "counter-schedule",
            "Familiarity provides no delayed evidence for the review scheduling decision.",
            ["later-retrieval", "review-decision"],
            ["later-supports-schedule"],
            ["rereading-only", "declared-interval"]
          ]
        ],
        outcome:
          "Rereading comfort cannot establish retrieval strength or set the next review interval.",
        criterionConditionId: "declared-interval",
        criterion:
          "A later closed-notes reconstruction is required before changing the review schedule.",
        verification:
          "Close the page and request the emergency-stop mechanism after the predeclared interval."
      }
    ],
    misconception: {
      id: "familiarity-is-recall",
      claim:
        "If the emergency-stop explanation feels familiar during rereading, it will be available later.",
      mechanism:
        "Visible safety wording supports recognition while bypassing unaided reconstruction and gap detection.",
      correction:
        "Close the notes, retrieve the mechanism, record the first gap and repeat retrieval after a declared interval.",
      disconfirmingObservation:
        "The learner cannot explain actuator isolation once the familiar safety page is hidden.",
      entityIds: [
        "safety-cue",
        "unaided-response",
        "gap-record",
        "later-retrieval"
      ],
      relationIds: [
        "cue-triggers-response",
        "response-measures-gap",
        "later-compares-baseline"
      ],
      conditionIds: ["rereading-only", "declared-interval"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Arrange the safety review cycle from cue to scheduling evidence:",
            "The safety cycle retrieves before feedback, records a gap and uses a later check.",
            "The safety cycle currently schedules from familiarity or places the gap after the later check.",
            "Start with the emergency-stop cue while safety notes are closed.",
            "Place the safety gap record before choosing the later review focus.",
            "Link the unaided safety response to its first missing mechanism.",
            "End with the later safety explanation supporting the scheduling decision."
          ),
          focusRef: reasonedCase("safety-retrieval-example", "scenario"),
          contextConditionIds: ["notes-closed", "declared-interval"],
          steps: [
            [
              "closed-cue",
              ["cue-triggers-response", "response-measures-gap"],
              ["notes-closed"]
            ],
            ["target-gap", ["gap-routes-review"], ["declared-interval"]],
            [
              "compare-later",
              ["later-compares-baseline"],
              ["notes-closed", "declared-interval"]
            ],
            ["schedule", ["later-supports-schedule"], ["declared-interval"]]
          ],
          correctOrder: ["closed-cue", "target-gap", "compare-later", "schedule"]
        },
        retry: {
          instruction: instruction(
            "Replace rereading with an evidence-producing safety review:",
            "The replacement converts visible safety familiarity into a closed-notes baseline and later comparison.",
            "The replacement still leaves the safety answer visible or chooses a schedule without delayed evidence.",
            "Close the emergency-stop notes before presenting the safety cue.",
            "Carry only the recorded safety gap into the later retrieval.",
            "Create a closed-notes safety baseline and name its first omission.",
            "Compare a later safety reconstruction before changing the schedule."
          ),
          focusRef: reasonedCase("rereading-counterexample", "scenario"),
          contextConditionIds: ["rereading-only", "declared-interval"],
          steps: [
            ["close-notes", ["cue-triggers-response"], ["rereading-only"]],
            ["record-gap", ["response-measures-gap"], ["notes-closed"]],
            [
              "delayed-evidence",
              ["later-compares-baseline", "later-supports-schedule"],
              ["declared-interval"]
            ]
          ],
          correctOrder: ["close-notes", "record-gap", "delayed-evidence"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Choose the safety records that support a spaced-review decision:",
            "The selected safety records contain closed-notes baseline and later mechanism evidence.",
            "A selected safety record relies on visible notes or lacks a declared later check.",
            "Find the safety evidence created before notes reopen.",
            "Find the later safety explanation that can be compared with that baseline.",
            "Select the gap record produced by unaided emergency-stop recall.",
            "Select the later comparison that supports the review schedule."
          ),
          focusRef: term("spaced-review", "definition"),
          contextConditionIds: ["notes-closed", "declared-interval"],
          options: [
            [
              "gap-evidence",
              true,
              relation("response-measures-gap"),
              condition("notes-closed"),
              ["response-measures-gap"],
              ["notes-closed"],
              null
            ],
            [
              "later-evidence",
              true,
              relation("later-supports-schedule"),
              condition("declared-interval"),
              ["later-compares-baseline", "later-supports-schedule"],
              ["declared-interval"],
              null
            ],
            [
              "familiar-page",
              false,
              misconception("familiarity-is-recall", "claim"),
              misconception("familiarity-is-recall", "mechanism"),
              ["cue-triggers-response"],
              ["rereading-only"],
              "familiarity-is-recall"
            ],
            [
              "immediate-only",
              false,
              term("spaced-review", "boundary"),
              reasonedCase("safety-retrieval-example", "criterion"),
              ["later-supports-schedule"],
              ["declared-interval"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose which safety review observations should shorten the next interval:",
            "The diagnosis uses a missing closed-notes link and weak later reconstruction.",
            "The diagnosis treats safety familiarity as retention or ignores a recorded omission.",
            "Inspect whether the emergency-stop response names actuator isolation.",
            "Inspect whether the later safety response repairs the same gap.",
            "Mark a persistent safety omission as evidence for earlier review.",
            "Keep the safety schedule tied to later retrieval rather than rereading comfort."
          ),
          focusRef: reasonedCase("rereading-counterexample", "verification"),
          contextConditionIds: ["rereading-only", "declared-interval"],
          options: [
            [
              "persistent-gap",
              true,
              reasonedCase("safety-retrieval-example", "criterion"),
              relation("gap-routes-review"),
              ["response-measures-gap", "gap-routes-review"],
              ["notes-closed", "declared-interval"],
              null
            ],
            [
              "weak-later",
              true,
              term("spaced-review", "boundary"),
              condition("declared-interval"),
              ["later-compares-baseline", "later-supports-schedule"],
              ["declared-interval"],
              null
            ],
            [
              "closed-baseline",
              true,
              condition("notes-closed"),
              relation("response-measures-gap"),
              ["cue-triggers-response", "response-measures-gap"],
              ["notes-closed"],
              null
            ],
            [
              "felt-familiar",
              false,
              misconception("familiarity-is-recall", "claim"),
              misconception("familiarity-is-recall", "mechanism"),
              ["cue-triggers-response", "response-measures-gap"],
              ["rereading-only"],
              "familiarity-is-recall"
            ],
            [
              "discard-gap",
              false,
              reasonedCase("rereading-counterexample", "outcome"),
              reasonedCase("rereading-counterexample", "criterion"),
              ["gap-routes-review"],
              ["rereading-only", "declared-interval"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: instruction(
            "Pair each safety-review relation with its evidential condition:",
            "The safety pairs now distinguish closed-notes evidence from declared-interval evidence.",
            "At least one safety pair assigns evidence to the wrong review boundary.",
            "Match the emergency-stop gap with the notes-closed condition.",
            "Match the later safety decision with the declared interval.",
            "Connect the safety gap target to the later review route.",
            "Connect the delayed safety response to the scheduling criterion."
          ),
          focusRef: reasonedCase("safety-retrieval-example", "scenario"),
          contextConditionIds: ["notes-closed", "declared-interval"],
          pairs: [
            [
              "closed-pair",
              relation("response-measures-gap"),
              condition("notes-closed"),
              relation("response-measures-gap"),
              ["response-measures-gap"],
              ["notes-closed"]
            ],
            [
              "route-pair",
              relation("gap-routes-review"),
              term("spaced-review", "definition"),
              relation("gap-routes-review"),
              ["gap-routes-review"],
              ["declared-interval"]
            ],
            [
              "schedule-pair",
              relation("later-supports-schedule"),
              condition("declared-interval"),
              relation("later-supports-schedule"),
              ["later-supports-schedule"],
              ["declared-interval"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instruction(
            "Justify why safety rereading cannot set a spaced-review schedule:",
            "The justification joins retrieval cue, gap evidence and a declared later comparison.",
            "The justification omits a safety evidence group or calls visible wording a retrieval attempt.",
            "Define what the emergency-stop retrieval cue must withhold.",
            "Explain how the safety gap shapes the later retrieval.",
            "Contrast visible safety familiarity with a closed-notes response.",
            "Use delayed safety evidence to justify the next scheduling decision."
          ),
          focusRef: misconception("familiarity-is-recall", "claim"),
          contextConditionIds: ["rereading-only", "declared-interval"],
          conceptGroups: [
            [
              "cue-group",
              term("retrieval-cue", "label"),
              [term("retrieval-cue", "definition")],
              ["cue-triggers-response"],
              ["notes-closed"]
            ],
            [
              "gap-group",
              relation("response-measures-gap"),
              [relation("response-measures-gap")],
              ["response-measures-gap", "gap-routes-review"],
              ["notes-closed"]
            ],
            [
              "interval-group",
              condition("declared-interval"),
              [condition("declared-interval")],
              ["later-compares-baseline", "later-supports-schedule"],
              ["declared-interval"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["later-compares-baseline"],
          criterionConditionId: "declared-interval"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Read the safety review graph when the later explanation repeats the original omission:",
            "The safety graph implication routes the persistent gap to an earlier review decision.",
            "The safety graph implication rewards rereading or overlooks the failed later comparison.",
            "Trace the emergency-stop gap into the later retrieval state.",
            "Use the declared safety interval only as a check point, not proof.",
            "Identify the safety comparison showing that the omission remains.",
            "Choose a safety schedule that responds to the observed retrieval evidence."
          ),
          focusRef: reasonedCase("rereading-counterexample", "outcome"),
          contextConditionIds: ["rereading-only", "declared-interval"],
          positions: [
            ["unaided-response", 0, 0],
            ["gap-record", 1, 0],
            ["later-retrieval", 2, 0],
            ["review-decision", 3, 0]
          ],
          relationIds: [
            "response-measures-gap",
            "gap-routes-review",
            "later-supports-schedule"
          ],
          answerRelationIds: ["gap-routes-review"],
          options: [
            [
              "review-sooner",
              true,
              reasonedCase("rereading-counterexample", "verification"),
              reasonedCase("safety-retrieval-example", "criterion"),
              ["gap-routes-review", "later-supports-schedule"],
              ["rereading-only", "declared-interval"],
              null
            ],
            [
              "trust-familiarity",
              false,
              misconception("familiarity-is-recall", "claim"),
              misconception("familiarity-is-recall", "mechanism"),
              ["response-measures-gap"],
              ["rereading-only"],
              "familiarity-is-recall"
            ],
            [
              "interval-proves-memory",
              false,
              term("spaced-review", "boundary"),
              condition("declared-interval"),
              ["later-supports-schedule"],
              ["declared-interval"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the safety pathway after the later response repairs the recorded gap:",
            "The safety pathway permits a cautious interval extension while retaining future retrieval.",
            "The safety pathway claims permanent retention or treats the original gap as irrelevant.",
            "Compare the later emergency-stop response with the closed-notes baseline.",
            "Follow the repaired safety explanation into the scheduling decision.",
            "Confirm that the later safety retrieval contains the formerly missing link.",
            "Extend the safety interval only as a bounded next review choice."
          ),
          focusRef: reasonedCase("safety-retrieval-example", "outcome"),
          contextConditionIds: ["notes-closed", "declared-interval"],
          positions: [
            ["safety-cue", 0, 1],
            ["unaided-response", 1, 1],
            ["later-retrieval", 2, 1],
            ["review-decision", 3, 1]
          ],
          relationIds: [
            "cue-triggers-response",
            "later-compares-baseline",
            "later-supports-schedule"
          ],
          answerRelationIds: ["later-supports-schedule"],
          options: [
            [
              "extend-cautiously",
              true,
              reasonedCase("safety-retrieval-example", "verification"),
              condition("declared-interval"),
              ["later-compares-baseline", "later-supports-schedule"],
              ["notes-closed", "declared-interval"],
              null
            ],
            [
              "stop-reviewing",
              false,
              term("spaced-review", "boundary"),
              reasonedCase("safety-retrieval-example", "criterion"),
              ["later-supports-schedule"],
              ["declared-interval"],
              null
            ],
            [
              "credit-rereading",
              false,
              misconception("familiarity-is-recall", "claim"),
              misconception(
                "familiarity-is-recall",
                "disconfirmingObservation"
              ),
              ["cue-triggers-response", "later-compares-baseline"],
              ["rereading-only", "declared-interval"],
              "familiarity-is-recall"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("spaced-review", "label"),
      focusRef: reasonedCase("safety-retrieval-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["safety-cue", 0, 0],
        ["unaided-response", 1, 0],
        ["gap-record", 1, 1],
        ["later-retrieval", 2, 0],
        ["review-decision", 3, 0]
      ],
      visibleEntityIds: [
        "safety-cue",
        "unaided-response",
        "gap-record",
        "later-retrieval",
        "review-decision"
      ],
      visibleRelationIds: [
        "cue-triggers-response",
        "response-measures-gap",
        "gap-routes-review",
        "later-compares-baseline",
        "later-supports-schedule"
      ],
      controls: [
        [
          "closed-notes-state",
          term("retrieval-cue", "label"),
          ["notes-closed"],
          ["safety-cue", "unaided-response", "gap-record"],
          ["cue-triggers-response", "response-measures-gap"],
          [],
          [],
          [
            [
              "gap-visible",
              "The first missing emergency-stop link becomes review evidence.",
              ["unaided-response", "gap-record"],
              ["response-measures-gap"]
            ]
          ],
          reasonedCase("safety-retrieval-example", "verification")
        ],
        [
          "later-review-state",
          term("spaced-review", "label"),
          ["declared-interval"],
          ["gap-record", "later-retrieval", "review-decision"],
          [
            "gap-routes-review",
            "later-compares-baseline",
            "later-supports-schedule"
          ],
          ["cue-triggers-response"],
          [],
          [
            [
              "schedule-evidence",
              "The later safety mechanism controls the next review interval.",
              ["later-retrieval", "review-decision"],
              ["later-supports-schedule"]
            ]
          ],
          reasonedCase("safety-retrieval-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D01-L03",
    systemModel:
      "An engineering problem becomes tractable when the overall need is split into bounded subproblems, their interfaces are made explicit, assumptions are attached to those interfaces and verification is allocated before solutions are chosen.",
    failurePattern:
      "A component-by-component task list can look organised while hiding interactions, duplicated responsibilities and uncovered system behaviour.",
    visualExplanation:
      "A decomposition graph maps a robot mission brief into subproblems, interface contracts, declared assumptions, verification checks and a coverage decision.",
    applicationTask:
      "Decompose a small mobile robot navigation brief into sensing, localisation, planning and actuation responsibilities, then define the information crossing each interface before selecting implementations.",
    terms: [
      [
        "subproblem-boundary",
        "Subproblem boundary",
        "A declared responsibility with inputs, outputs and exclusions.",
        "A vague component name without responsibility or exclusions is not a boundary.",
        "split-need"
      ],
      [
        "interface-contract",
        "Interface contract",
        "The meaning, units, timing and ownership of information crossing between subproblems.",
        "A wire or software topic alone does not define an interface contract.",
        "define-interfaces"
      ]
    ],
    entities: [
      [
        "mission-brief",
        "input",
        "Navigation mission brief",
        "The required robot behaviour and its operating limits."
      ],
      [
        "subproblem-map",
        "state",
        "Navigation subproblem map",
        "The bounded sensing, localisation, planning and actuation responsibilities."
      ],
      [
        "interface-set",
        "constraint",
        "Navigation interface set",
        "The declared information exchanged between neighbouring responsibilities."
      ],
      [
        "assumption-register",
        "observation",
        "Decomposition assumption register",
        "The conditions each boundary and interface currently relies upon."
      ],
      [
        "verification-allocation",
        "decision",
        "Verification allocation",
        "The planned check for every required behaviour and critical interface."
      ]
    ],
    relations: [
      [
        "brief-maps-subproblems",
        "maps",
        ["mission-brief"],
        ["subproblem-map"],
        "the navigation brief is mapped into bounded behavioural responsibilities",
        "directed",
        "one-to-many"
      ],
      [
        "subproblems-constrain-interfaces",
        "constrains",
        ["subproblem-map"],
        ["interface-set"],
        "subproblem responsibilities constrain the required information interfaces",
        "directed",
        "one-to-many"
      ],
      [
        "interfaces-reveal-assumptions",
        "measures",
        ["interface-set"],
        ["assumption-register"],
        "interface definitions reveal hidden unit, timing and ownership assumptions",
        "directed",
        "one-to-many"
      ],
      [
        "assumptions-route-checks",
        "routes",
        ["assumption-register"],
        ["verification-allocation"],
        "declared assumptions route risk-based interface checks",
        "directed",
        "many-to-one"
      ],
      [
        "checks-compare-brief",
        "compares",
        ["verification-allocation"],
        ["mission-brief"],
        "allocated checks are compared with every required behaviour in the mission brief",
        "undirected",
        "many-to-many"
      ]
    ],
    conditions: [
      [
        "complete-responsibility",
        "boundary",
        "Every required behaviour has one owning subproblem and explicit exclusions.",
        ["mission-brief", "subproblem-map"],
        ["brief-maps-subproblems"]
      ],
      [
        "defined-interface-meaning",
        "criterion",
        "Each cross-boundary value declares meaning, units, timing and ownership.",
        ["subproblem-map", "interface-set", "assumption-register"],
        ["subproblems-constrain-interfaces", "interfaces-reveal-assumptions"]
      ],
      [
        "component-list-only",
        "assumption",
        "Listing hardware and software components is treated as complete decomposition.",
        ["mission-brief", "subproblem-map", "interface-set"],
        ["brief-maps-subproblems", "subproblems-constrain-interfaces"]
      ]
    ],
    failureBoundary: [
      "hidden-interface-failure",
      "defined-interface-meaning",
      "Component labels do not expose what information crosses boundaries or which assumptions control it.",
      "Localisation outputs an undeclared frame or unit that planning interprets differently.",
      "Accept the decomposition only when responsibilities and cross-boundary meanings are both explicit.",
      ["subproblem-map", "interface-set", "assumption-register"],
      ["subproblems-constrain-interfaces", "interfaces-reveal-assumptions"]
    ],
    conceptualModel: [
      [
        "split-need",
        "Translate the mission brief into behavioural responsibilities before naming components.",
        ["mission-brief", "subproblem-map"],
        ["brief-maps-subproblems"],
        ["complete-responsibility"]
      ],
      [
        "bound-responsibilities",
        "Give each navigation subproblem inputs, outputs, ownership and exclusions.",
        ["subproblem-map", "mission-brief"],
        ["brief-maps-subproblems"],
        ["complete-responsibility"]
      ],
      [
        "define-interfaces",
        "Declare the meaning, units, timing and ownership of every cross-boundary value.",
        ["subproblem-map", "interface-set"],
        ["subproblems-constrain-interfaces"],
        ["defined-interface-meaning"]
      ],
      [
        "surface-assumptions",
        "Record the assumptions revealed by each navigation interface.",
        ["interface-set", "assumption-register"],
        ["interfaces-reveal-assumptions"],
        ["defined-interface-meaning"]
      ],
      [
        "allocate-checks",
        "Allocate a verification check to each required behaviour and risky interface.",
        ["assumption-register", "verification-allocation", "mission-brief"],
        ["assumptions-route-checks", "checks-compare-brief"],
        ["complete-responsibility", "defined-interface-meaning"]
      ]
    ],
    reasonedCases: [
      {
        id: "navigation-decomposition-example",
        kind: "example",
        scenario:
          "A robot navigation brief is split by behavioural responsibility, and the localisation-to-planning interface declares pose meaning, frame, units, update timing and owner.",
        changedConditionIds: ["defined-interface-meaning"],
        givens: [
          [
            "pose-interface",
            "Cross-boundary value",
            "Localisation supplies a robot pose to planning.",
            null,
            "interface-set"
          ]
        ],
        reasoningSteps: [
          [
            "example-responsibilities",
            "The mission behaviour is allocated to bounded sensing, localisation, planning and actuation responsibilities.",
            ["mission-brief", "subproblem-map"],
            ["brief-maps-subproblems"],
            ["complete-responsibility"]
          ],
          [
            "example-interface",
            "The pose interface declares the frame, units, timing and ownership that planning relies upon.",
            ["subproblem-map", "interface-set", "assumption-register"],
            [
              "subproblems-constrain-interfaces",
              "interfaces-reveal-assumptions"
            ],
            ["defined-interface-meaning"]
          ],
          [
            "example-checks",
            "Frame and timing assumptions are routed to integration checks and traced back to the mission behaviour.",
            ["assumption-register", "verification-allocation", "mission-brief"],
            ["assumptions-route-checks", "checks-compare-brief"],
            ["complete-responsibility", "defined-interface-meaning"]
          ]
        ],
        outcome:
          "The decomposition supports independent work without hiding the localisation-planning dependency.",
        criterionConditionId: "defined-interface-meaning",
        criterion:
          "Every critical interface must declare meaning, units, timing and ownership.",
        verification:
          "Trace each mission behaviour to one owner, every owner to its interfaces and each risky interface to a planned check."
      },
      {
        id: "component-list-counterexample",
        kind: "counterexample",
        scenario:
          "The project is divided into camera, computer, motors and software without defining behavioural ownership or exchanged information.",
        changedConditionIds: ["component-list-only"],
        givens: [
          [
            "parts-list",
            "Proposed breakdown",
            "Camera, computer, motors and software.",
            null,
            "subproblem-map"
          ]
        ],
        reasoningSteps: [
          [
            "counter-ownership",
            "Component names do not show which part owns localisation accuracy or navigation recovery.",
            ["mission-brief", "subproblem-map"],
            ["brief-maps-subproblems"],
            ["component-list-only"]
          ],
          [
            "counter-interface",
            "The parts list does not declare the pose frame, units or timing passed into planning.",
            ["subproblem-map", "interface-set"],
            ["subproblems-constrain-interfaces"],
            ["component-list-only", "defined-interface-meaning"]
          ],
          [
            "counter-checks",
            "Hidden interface assumptions cannot be allocated to an integration check.",
            ["interface-set", "assumption-register", "verification-allocation"],
            ["interfaces-reveal-assumptions", "assumptions-route-checks"],
            ["component-list-only"]
          ]
        ],
        outcome:
          "The component list leaves behavioural gaps and integration risks despite appearing organised.",
        criterionConditionId: "defined-interface-meaning",
        criterion:
          "Replace component-only labels with responsibilities and explicit interface contracts.",
        verification:
          "Ask who owns each required behaviour and what exact information crosses every proposed boundary."
      }
    ],
    misconception: {
      id: "components-are-decomposition",
      claim:
        "A list of robot components is already a complete engineering decomposition.",
      mechanism:
        "Component names hide behavioural ownership, exclusions and information dependencies.",
      correction:
        "Decompose the mission by responsibility, define every interface contract and allocate verification before selecting implementations.",
      disconfirmingObservation:
        "Two teams can agree on the component list while using incompatible pose frames at the localisation-planning interface.",
      entityIds: [
        "mission-brief",
        "subproblem-map",
        "interface-set",
        "verification-allocation"
      ],
      relationIds: [
        "brief-maps-subproblems",
        "subproblems-constrain-interfaces",
        "checks-compare-brief"
      ],
      conditionIds: ["component-list-only", "defined-interface-meaning"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Sequence the navigation decomposition from mission need to verification coverage:",
            "The navigation sequence establishes responsibilities before interfaces, assumptions and checks.",
            "The navigation sequence selects parts too early or allocates checks before dependencies are visible.",
            "Begin with required robot behaviour rather than a navigation component list.",
            "Place navigation interface meaning after responsibility boundaries are declared.",
            "Map the navigation mission to owned subproblems and expose their interfaces.",
            "Route navigation assumptions into checks and compare coverage with the brief."
          ),
          focusRef: reasonedCase("navigation-decomposition-example", "scenario"),
          contextConditionIds: [
            "complete-responsibility",
            "defined-interface-meaning"
          ],
          steps: [
            ["map-need", ["brief-maps-subproblems"], ["complete-responsibility"]],
            [
              "bind-interface",
              ["subproblems-constrain-interfaces"],
              ["defined-interface-meaning"]
            ],
            [
              "record-assumptions",
              ["interfaces-reveal-assumptions"],
              ["defined-interface-meaning"]
            ],
            [
              "cover-checks",
              ["assumptions-route-checks", "checks-compare-brief"],
              ["complete-responsibility", "defined-interface-meaning"]
            ]
          ],
          correctOrder: [
            "map-need",
            "bind-interface",
            "record-assumptions",
            "cover-checks"
          ]
        },
        retry: {
          instruction: instruction(
            "Repair a component-list breakdown by exposing navigation dependencies:",
            "The repair gives each navigation subproblem an owner, defines exchanged information and creates interface checks.",
            "The repair still groups navigation parts without clarifying responsibility or data meaning.",
            "Ask which navigation behaviour each proposed component actually owns.",
            "Interrogate every navigation interface contract for meaning, units, timing and ownership.",
            "Replace the navigation parts list with behavioural responsibilities.",
            "Use the discovered navigation assumptions to allocate integration checks."
          ),
          focusRef: reasonedCase("component-list-counterexample", "scenario"),
          contextConditionIds: [
            "component-list-only",
            "defined-interface-meaning"
          ],
          steps: [
            [
              "replace-parts",
              ["brief-maps-subproblems"],
              ["component-list-only"]
            ],
            [
              "expose-data",
              ["subproblems-constrain-interfaces", "interfaces-reveal-assumptions"],
              ["defined-interface-meaning"]
            ],
            [
              "test-risk",
              ["assumptions-route-checks"],
              ["complete-responsibility"]
            ]
          ],
          correctOrder: ["replace-parts", "expose-data", "test-risk"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the navigation artefacts that make decomposition testable:",
            "The selected navigation artefacts define interface meaning and connect risk to verification.",
            "A selected navigation artefact is only a parts label or leaves behaviour unowned.",
            "Look for navigation information whose frame, units and timing are declared.",
            "Look for a navigation check traced back to mission behaviour.",
            "Select the interface definition that reveals navigation assumptions.",
            "Select the verification allocation that closes navigation coverage."
          ),
          focusRef: term("interface-contract", "definition"),
          contextConditionIds: [
            "complete-responsibility",
            "defined-interface-meaning"
          ],
          options: [
            [
              "defined-interface",
              true,
              relation("interfaces-reveal-assumptions"),
              condition("defined-interface-meaning"),
              [
                "subproblems-constrain-interfaces",
                "interfaces-reveal-assumptions"
              ],
              ["defined-interface-meaning"],
              null
            ],
            [
              "coverage-link",
              true,
              relation("checks-compare-brief"),
              condition("complete-responsibility"),
              ["assumptions-route-checks", "checks-compare-brief"],
              ["complete-responsibility"],
              null
            ],
            [
              "parts-only",
              false,
              misconception("components-are-decomposition", "claim"),
              misconception("components-are-decomposition", "mechanism"),
              ["brief-maps-subproblems"],
              ["component-list-only"],
              "components-are-decomposition"
            ],
            [
              "unnamed-owner",
              false,
              term("subproblem-boundary", "boundary"),
              reasonedCase("navigation-decomposition-example", "criterion"),
              ["brief-maps-subproblems"],
              ["complete-responsibility"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Find the navigation omissions that invalidate an apparently neat breakdown:",
            "The selected navigation omissions expose missing ownership and ambiguous interface meaning.",
            "The selected navigation omissions confuse implementation detail with decomposition evidence.",
            "Check whether every navigation behaviour has one explicit owner.",
            "Check whether the navigation interface lets planning interpret the localisation pose without guessing.",
            "Flag an unowned navigation behaviour as a boundary failure.",
            "Flag an undeclared navigation frame as an interface-contract failure."
          ),
          focusRef: reasonedCase("component-list-counterexample", "verification"),
          contextConditionIds: [
            "component-list-only",
            "defined-interface-meaning"
          ],
          options: [
            [
              "missing-owner",
              true,
              condition("complete-responsibility"),
              relation("brief-maps-subproblems"),
              ["brief-maps-subproblems"],
              ["complete-responsibility"],
              null
            ],
            [
              "ambiguous-pose",
              true,
              condition("defined-interface-meaning"),
              relation("interfaces-reveal-assumptions"),
              ["subproblems-constrain-interfaces", "interfaces-reveal-assumptions"],
              ["defined-interface-meaning"],
              null
            ],
            [
              "unallocated-risk",
              true,
              relation("assumptions-route-checks"),
              reasonedCase("component-list-counterexample", "outcome"),
              ["assumptions-route-checks", "checks-compare-brief"],
              ["component-list-only"],
              null
            ],
            [
              "component-proof",
              false,
              misconception("components-are-decomposition", "claim"),
              misconception("components-are-decomposition", "mechanism"),
              ["brief-maps-subproblems", "subproblems-constrain-interfaces"],
              ["component-list-only"],
              "components-are-decomposition"
            ],
            [
              "select-hardware",
              false,
              reasonedCase("navigation-decomposition-example", "outcome"),
              term("subproblem-boundary", "boundary"),
              ["brief-maps-subproblems"],
              ["complete-responsibility"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why a navigation parts list cannot stand in for decomposition:",
            "The explanation joins behavioural ownership, interface meaning and verification allocation.",
            "The explanation omits a navigation concept group or treats component names as boundaries.",
            "Describe what a navigation subproblem owns and excludes.",
            "Describe what the navigation interface must tell planning about a localisation output.",
            "Show how navigation interface assumptions become explicit checks.",
            "Trace the resulting navigation coverage back to the mission brief."
          ),
          focusRef: misconception("components-are-decomposition", "claim"),
          contextConditionIds: [
            "component-list-only",
            "defined-interface-meaning"
          ],
          conceptGroups: [
            [
              "boundary-group",
              term("subproblem-boundary", "label"),
              [term("subproblem-boundary", "definition")],
              ["brief-maps-subproblems"],
              ["complete-responsibility"]
            ],
            [
              "contract-group",
              term("interface-contract", "label"),
              [term("interface-contract", "definition")],
              [
                "subproblems-constrain-interfaces",
                "interfaces-reveal-assumptions"
              ],
              ["defined-interface-meaning"]
            ],
            [
              "verification-group",
              relation("assumptions-route-checks"),
              [relation("assumptions-route-checks")],
              ["assumptions-route-checks", "checks-compare-brief"],
              ["complete-responsibility"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["checks-compare-brief"],
          criterionConditionId: "defined-interface-meaning"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match navigation decomposition evidence to the question it resolves:",
            "The navigation matches now connect mission ownership, interface assumptions and planned checks.",
            "One navigation match still pairs a relation with an unrelated decomposition boundary.",
            "Pair mission mapping with complete navigation responsibility.",
            "Pair interface revelation with declared navigation meaning.",
            "Connect navigation assumption routing to its verification purpose.",
            "Connect navigation coverage comparison to the mission requirement."
          ),
          focusRef: reasonedCase("navigation-decomposition-example", "scenario"),
          contextConditionIds: [
            "complete-responsibility",
            "defined-interface-meaning"
          ],
          pairs: [
            [
              "mission-pair",
              relation("brief-maps-subproblems"),
              condition("complete-responsibility"),
              relation("brief-maps-subproblems"),
              ["brief-maps-subproblems"],
              ["complete-responsibility"]
            ],
            [
              "interface-pair",
              relation("interfaces-reveal-assumptions"),
              condition("defined-interface-meaning"),
              relation("interfaces-reveal-assumptions"),
              ["interfaces-reveal-assumptions"],
              ["defined-interface-meaning"]
            ],
            [
              "check-pair",
              relation("checks-compare-brief"),
              reasonedCase("navigation-decomposition-example", "verification"),
              relation("checks-compare-brief"),
              ["assumptions-route-checks", "checks-compare-brief"],
              ["complete-responsibility"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the navigation graph when planning receives a pose in an undeclared frame:",
            "The navigation implication returns the interface to definition before integration proceeds.",
            "The navigation implication accepts a component boundary or postpones the ambiguity until testing.",
            "Trace the localisation-planning interface into the assumption register.",
            "Use the declared navigation meaning criterion to judge integration readiness.",
            "Locate where the navigation frame assumption becomes observable.",
            "Route the ambiguous navigation interface to a verification allocation."
          ),
          focusRef: reasonedCase("component-list-counterexample", "outcome"),
          contextConditionIds: [
            "component-list-only",
            "defined-interface-meaning"
          ],
          positions: [
            ["subproblem-map", 0, 0],
            ["interface-set", 1, 0],
            ["assumption-register", 2, 0],
            ["verification-allocation", 3, 0]
          ],
          relationIds: [
            "subproblems-constrain-interfaces",
            "interfaces-reveal-assumptions",
            "assumptions-route-checks"
          ],
          answerRelationIds: ["interfaces-reveal-assumptions"],
          options: [
            [
              "define-before-integrating",
              true,
              reasonedCase("component-list-counterexample", "verification"),
              condition("defined-interface-meaning"),
              ["interfaces-reveal-assumptions", "assumptions-route-checks"],
              ["component-list-only", "defined-interface-meaning"],
              null
            ],
            [
              "parts-are-enough",
              false,
              misconception("components-are-decomposition", "claim"),
              misconception("components-are-decomposition", "mechanism"),
              ["subproblems-constrain-interfaces"],
              ["component-list-only"],
              "components-are-decomposition"
            ],
            [
              "defer-interface",
              false,
              term("interface-contract", "boundary"),
              reasonedCase("navigation-decomposition-example", "criterion"),
              ["assumptions-route-checks"],
              ["defined-interface-meaning"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the navigation coverage graph after every critical interface is declared:",
            "The navigation coverage graph supports proceeding because checks trace to the mission brief.",
            "The navigation coverage graph claims implementation choice proves coverage or drops interface risk.",
            "Follow navigation assumptions into their allocated checks.",
            "Compare the navigation check set with required mission behaviour.",
            "Confirm every risky navigation interface has a named verification route.",
            "Proceed only when navigation coverage closes against the original brief."
          ),
          focusRef: reasonedCase("navigation-decomposition-example", "outcome"),
          contextConditionIds: [
            "complete-responsibility",
            "defined-interface-meaning"
          ],
          positions: [
            ["mission-brief", 0, 1],
            ["assumption-register", 1, 1],
            ["verification-allocation", 2, 1],
            ["subproblem-map", 1, 2]
          ],
          relationIds: [
            "brief-maps-subproblems",
            "assumptions-route-checks",
            "checks-compare-brief"
          ],
          answerRelationIds: ["checks-compare-brief"],
          options: [
            [
              "coverage-complete",
              true,
              reasonedCase("navigation-decomposition-example", "verification"),
              condition("complete-responsibility"),
              ["assumptions-route-checks", "checks-compare-brief"],
              ["complete-responsibility", "defined-interface-meaning"],
              null
            ],
            [
              "implementation-proves",
              false,
              misconception("components-are-decomposition", "claim"),
              misconception(
                "components-are-decomposition",
                "disconfirmingObservation"
              ),
              ["brief-maps-subproblems", "checks-compare-brief"],
              ["component-list-only"],
              "components-are-decomposition"
            ],
            [
              "ignore-assumptions",
              false,
              term("subproblem-boundary", "boundary"),
              reasonedCase("navigation-decomposition-example", "criterion"),
              ["assumptions-route-checks"],
              ["complete-responsibility"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("interface-contract", "label"),
      focusRef: reasonedCase("navigation-decomposition-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["mission-brief", 0, 0],
        ["subproblem-map", 1, 0],
        ["interface-set", 2, 0],
        ["assumption-register", 2, 1],
        ["verification-allocation", 3, 0]
      ],
      visibleEntityIds: [
        "mission-brief",
        "subproblem-map",
        "interface-set",
        "assumption-register",
        "verification-allocation"
      ],
      visibleRelationIds: [
        "brief-maps-subproblems",
        "subproblems-constrain-interfaces",
        "interfaces-reveal-assumptions",
        "assumptions-route-checks",
        "checks-compare-brief"
      ],
      controls: [
        [
          "responsibility-view",
          term("subproblem-boundary", "label"),
          ["complete-responsibility"],
          ["mission-brief", "subproblem-map", "interface-set"],
          ["brief-maps-subproblems", "subproblems-constrain-interfaces"],
          [],
          [],
          [
            [
              "owned-behaviour",
              "Each navigation behaviour has a bounded owner.",
              ["mission-brief", "subproblem-map"],
              ["brief-maps-subproblems"]
            ]
          ],
          reasonedCase("navigation-decomposition-example", "verification")
        ],
        [
          "interface-view",
          term("interface-contract", "label"),
          ["defined-interface-meaning"],
          ["interface-set", "assumption-register", "verification-allocation"],
          [
            "interfaces-reveal-assumptions",
            "assumptions-route-checks",
            "checks-compare-brief"
          ],
          ["brief-maps-subproblems"],
          [],
          [
            [
              "declared-pose",
              "The navigation pose meaning is connected to an integration check.",
              ["interface-set", "assumption-register", "verification-allocation"],
              ["interfaces-reveal-assumptions", "assumptions-route-checks"]
            ]
          ],
          reasonedCase("navigation-decomposition-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D01-L04",
    systemModel:
      "A scientific engineering question connects a controllable condition to a defined observation, predicts what should be seen and leaves a plausible result that would count against the hypothesis.",
    failurePattern:
      "A broad claim can sound scientific while resisting measurement, alternative outcomes and revision.",
    visualExplanation:
      "A hypothesis graph links an engineering claim, changed condition, predicted observation, measured outcome and evidence-based update.",
    applicationTask:
      "Turn a concern about mobile robot wheel slip into a question about a declared surface condition and a defined path-tracking observation, then state a result that would count against the prediction.",
    terms: [
      [
        "operational-observation",
        "Operational observation",
        "A named observation with a declared method for deciding what was seen.",
        "A vague judgement such as better or worse is not operational until its observation rule is stated.",
        "define-observation"
      ],
      [
        "falsifiable-hypothesis",
        "Falsifiable hypothesis",
        "A prediction that could conflict with at least one plausible observation under the stated conditions.",
        "Being testable does not mean the hypothesis is certainly true or false after one result.",
        "state-prediction"
      ]
    ],
    entities: [
      [
        "slip-claim",
        "input",
        "Wheel-slip claim",
        "The proposed relationship between surface condition and robot path behaviour."
      ],
      [
        "surface-condition",
        "constraint",
        "Declared surface condition",
        "The surface state deliberately compared while other relevant setup choices are held."
      ],
      [
        "path-prediction",
        "state",
        "Path-error prediction",
        "The expected change in the defined tracking observation."
      ],
      [
        "path-observation",
        "observation",
        "Measured path observation",
        "The recorded tracking evidence produced by the declared observation rule."
      ],
      [
        "hypothesis-update",
        "decision",
        "Hypothesis update",
        "The bounded decision to retain, revise or reject the prediction for this test boundary."
      ]
    ],
    relations: [
      [
        "claim-constrains-change",
        "constrains",
        ["slip-claim"],
        ["surface-condition"],
        "the wheel-slip claim identifies the surface condition that must be compared",
        "directed",
        "one-to-one"
      ],
      [
        "condition-causes-prediction",
        "causes",
        ["surface-condition"],
        ["path-prediction"],
        "the declared surface change leads to a directional path-error prediction",
        "directed",
        "one-to-one"
      ],
      [
        "observation-measures-prediction",
        "measures",
        ["path-observation"],
        ["path-prediction"],
        "the path observation measures the behaviour named by the prediction",
        "directed",
        "one-to-one"
      ],
      [
        "outcome-compares-prediction",
        "compares",
        ["path-observation"],
        ["path-prediction"],
        "the recorded outcome is compared with the predicted direction of change",
        "undirected",
        "one-to-one"
      ],
      [
        "comparison-supports-update",
        "supports",
        ["path-observation"],
        ["hypothesis-update"],
        "the bounded comparison supports retaining, revising or rejecting the hypothesis",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "observation-rule-declared",
        "criterion",
        "The path-tracking observation and its interpretation rule are declared before the test.",
        ["path-prediction", "path-observation"],
        ["observation-measures-prediction", "outcome-compares-prediction"]
      ],
      [
        "alternative-outcome-possible",
        "boundary",
        "At least one plausible measured outcome would conflict with the path-error prediction.",
        ["path-prediction", "path-observation", "hypothesis-update"],
        ["outcome-compares-prediction", "comparison-supports-update"]
      ],
      [
        "self-protecting-claim",
        "assumption",
        "Every possible result is reinterpreted as support for the wheel-slip claim.",
        ["slip-claim", "path-observation", "hypothesis-update"],
        ["claim-constrains-change", "comparison-supports-update"]
      ]
    ],
    failureBoundary: [
      "unfalsifiable-slip-claim",
      "alternative-outcome-possible",
      "If every observation is labelled supportive, the comparison cannot challenge the prediction.",
      "Opposite path behaviour is dismissed without revising the wheel-slip claim.",
      "Accept the hypothesis as scientific only when a plausible conflicting observation is stated in advance.",
      ["slip-claim", "path-prediction", "path-observation", "hypothesis-update"],
      ["outcome-compares-prediction", "comparison-supports-update"]
    ],
    conceptualModel: [
      [
        "bound-question",
        "Name the surface condition that changes and the robot behaviour being investigated.",
        ["slip-claim", "surface-condition"],
        ["claim-constrains-change"],
        ["observation-rule-declared"]
      ],
      [
        "define-observation",
        "Specify how path tracking will be observed before collecting evidence.",
        ["path-prediction", "path-observation"],
        ["observation-measures-prediction"],
        ["observation-rule-declared"]
      ],
      [
        "state-prediction",
        "State the expected direction of path behaviour under the declared surface change.",
        ["surface-condition", "path-prediction"],
        ["condition-causes-prediction"],
        ["alternative-outcome-possible"]
      ],
      [
        "name-conflict",
        "Write down a plausible observation that would count against the prediction.",
        ["path-prediction", "path-observation"],
        ["outcome-compares-prediction"],
        ["alternative-outcome-possible"]
      ],
      [
        "update-hypothesis",
        "Compare the measured outcome with the prediction and make a bounded evidence update.",
        ["path-prediction", "path-observation", "hypothesis-update"],
        ["outcome-compares-prediction", "comparison-supports-update"],
        ["observation-rule-declared", "alternative-outcome-possible"]
      ]
    ],
    reasonedCases: [
      {
        id: "slip-hypothesis-example",
        kind: "example",
        scenario:
          "A learner predicts a directional change in path-tracking error when the declared surface condition changes and states that an opposite or absent change would count against the prediction.",
        changedConditionIds: ["alternative-outcome-possible"],
        givens: [
          [
            "declared-change",
            "Changed condition",
            "The compared runs use different declared surface states.",
            null,
            "surface-condition"
          ]
        ],
        reasoningSteps: [
          [
            "example-observable",
            "The path-tracking outcome has a declared observation rule rather than a vague quality judgement.",
            ["path-prediction", "path-observation"],
            ["observation-measures-prediction"],
            ["observation-rule-declared"]
          ],
          [
            "example-direction",
            "The surface condition is connected to a directional prediction before evidence is viewed.",
            ["surface-condition", "path-prediction"],
            ["condition-causes-prediction"],
            ["alternative-outcome-possible"]
          ],
          [
            "example-update",
            "A conflicting outcome would change the bounded hypothesis decision.",
            ["path-prediction", "path-observation", "hypothesis-update"],
            ["outcome-compares-prediction", "comparison-supports-update"],
            ["alternative-outcome-possible"]
          ]
        ],
        outcome:
          "The wheel-slip hypothesis can be compared with evidence and revised within the declared test boundary.",
        criterionConditionId: "alternative-outcome-possible",
        criterion:
          "A plausible conflicting path observation must be named before testing.",
        verification:
          "Check that the question names the changed condition, observation rule, prediction and disconfirming outcome."
      },
      {
        id: "self-protecting-counterexample",
        kind: "counterexample",
        scenario:
          "A claim says the robot slips whenever its path looks wrong and also says a straight path merely hides the same slipping.",
        changedConditionIds: ["self-protecting-claim"],
        givens: [
          [
            "all-results-support",
            "Interpretation rule",
            "Both expected and conflicting path observations are called supporting evidence.",
            null,
            "hypothesis-update"
          ]
        ],
        reasoningSteps: [
          [
            "counter-vague",
            "The path observation is redefined after the outcome rather than fixed operationally.",
            ["path-observation", "path-prediction"],
            ["observation-measures-prediction"],
            ["self-protecting-claim"]
          ],
          [
            "counter-no-conflict",
            "No plausible observation can count against the wheel-slip claim.",
            ["slip-claim", "path-prediction", "path-observation"],
            ["outcome-compares-prediction"],
            ["self-protecting-claim", "alternative-outcome-possible"]
          ],
          [
            "counter-no-update",
            "The hypothesis decision cannot respond to evidence because every result is protected.",
            ["path-observation", "hypothesis-update"],
            ["comparison-supports-update"],
            ["self-protecting-claim"]
          ]
        ],
        outcome:
          "The self-protecting wheel-slip claim is not falsifiable under its current wording.",
        criterionConditionId: "alternative-outcome-possible",
        criterion:
          "Rewrite the claim so a declared path observation could conflict with it.",
        verification:
          "Ask what specific observation would make the learner revise the wheel-slip prediction."
      }
    ],
    misconception: {
      id: "testable-means-falsifiable",
      claim:
        "A claim is falsifiable simply because an experiment can be performed.",
      mechanism:
        "An experiment may produce measurements while the claim protects itself by treating every possible result as support.",
      correction:
        "Declare the observation rule, directional prediction and a plausible result that would count against it.",
      disconfirmingObservation:
        "The learner cannot name any path outcome that would lead to revising the wheel-slip claim.",
      entityIds: [
        "slip-claim",
        "surface-condition",
        "path-prediction",
        "path-observation",
        "hypothesis-update"
      ],
      relationIds: [
        "claim-constrains-change",
        "outcome-compares-prediction",
        "comparison-supports-update"
      ],
      conditionIds: ["self-protecting-claim", "alternative-outcome-possible"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the wheel-slip hypothesis from bounded question to evidence update:",
            "The wheel-slip sequence defines observation, predicts direction and preserves a conflicting outcome.",
            "The wheel-slip sequence currently interprets evidence before defining the observation or prediction.",
            "Start by bounding the wheel-slip claim around a declared surface condition.",
            "Define the path observation before reading any measured outcome.",
            "Connect the surface condition to a directional path prediction.",
            "Finish by comparing the path observation and updating the hypothesis."
          ),
          focusRef: reasonedCase("slip-hypothesis-example", "scenario"),
          contextConditionIds: [
            "observation-rule-declared",
            "alternative-outcome-possible"
          ],
          steps: [
            ["bound", ["claim-constrains-change"], ["observation-rule-declared"]],
            [
              "predict",
              ["condition-causes-prediction"],
              ["alternative-outcome-possible"]
            ],
            [
              "observe",
              ["observation-measures-prediction"],
              ["observation-rule-declared"]
            ],
            [
              "update",
              ["outcome-compares-prediction", "comparison-supports-update"],
              ["alternative-outcome-possible"]
            ]
          ],
          correctOrder: ["bound", "predict", "observe", "update"]
        },
        retry: {
          instruction: instruction(
            "Convert a protected wheel-slip claim into a refutable prediction:",
            "The converted wheel-slip claim now exposes one path observation that can challenge it.",
            "The converted wheel-slip claim still treats every path outcome as confirming evidence.",
            "Fix the path observation rule before rewording the wheel-slip prediction.",
            "Name an alternative path outcome that would force a hypothesis update.",
            "Tie the wheel-slip claim to one declared surface change and observable response.",
            "State the conflicting path result before running the comparison."
          ),
          focusRef: reasonedCase("self-protecting-counterexample", "scenario"),
          contextConditionIds: [
            "self-protecting-claim",
            "alternative-outcome-possible"
          ],
          steps: [
            [
              "fix-observation",
              ["observation-measures-prediction"],
              ["observation-rule-declared"]
            ],
            [
              "allow-conflict",
              ["outcome-compares-prediction"],
              ["self-protecting-claim", "alternative-outcome-possible"]
            ],
            [
              "permit-revision",
              ["comparison-supports-update"],
              ["alternative-outcome-possible"]
            ]
          ],
          correctOrder: ["fix-observation", "allow-conflict", "permit-revision"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the wheel-slip statements that make the hypothesis scientifically useful:",
            "The selected wheel-slip statements define a measurable observation and preserve revision.",
            "A selected wheel-slip statement is vague or makes the claim immune to path evidence.",
            "Look for a path observation whose interpretation rule is fixed in advance.",
            "Look for a wheel-slip outcome that could reverse the hypothesis decision.",
            "Select the declared observation relation for robot path behaviour.",
            "Select the evidence comparison that can change the wheel-slip update."
          ),
          focusRef: term("falsifiable-hypothesis", "definition"),
          contextConditionIds: [
            "observation-rule-declared",
            "alternative-outcome-possible"
          ],
          options: [
            [
              "operational-path",
              true,
              relation("observation-measures-prediction"),
              condition("observation-rule-declared"),
              ["observation-measures-prediction"],
              ["observation-rule-declared"],
              null
            ],
            [
              "revisable-comparison",
              true,
              relation("comparison-supports-update"),
              condition("alternative-outcome-possible"),
              ["outcome-compares-prediction", "comparison-supports-update"],
              ["alternative-outcome-possible"],
              null
            ],
            [
              "any-test",
              false,
              misconception("testable-means-falsifiable", "claim"),
              misconception("testable-means-falsifiable", "mechanism"),
              ["claim-constrains-change"],
              ["self-protecting-claim"],
              "testable-means-falsifiable"
            ],
            [
              "vague-better",
              false,
              term("operational-observation", "boundary"),
              reasonedCase("slip-hypothesis-example", "criterion"),
              ["observation-measures-prediction"],
              ["observation-rule-declared"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Identify the wheel-slip wording that blocks disconfirmation:",
            "The chosen wheel-slip wording exposes a moving observation rule and an evidence-proof claim.",
            "The chosen wheel-slip wording mistakes a clear prediction for a protected one.",
            "Find where the path observation changes meaning after the result.",
            "Find where the wheel-slip claim refuses every possible hypothesis update.",
            "Mark post-result path reinterpretation as an operational failure.",
            "Mark an all-results-support wheel-slip rule as a falsifiability failure."
          ),
          focusRef: reasonedCase("self-protecting-counterexample", "verification"),
          contextConditionIds: [
            "self-protecting-claim",
            "alternative-outcome-possible"
          ],
          options: [
            [
              "moving-rule",
              true,
              condition("observation-rule-declared"),
              reasonedCase("self-protecting-counterexample", "outcome"),
              ["observation-measures-prediction"],
              ["observation-rule-declared", "self-protecting-claim"],
              null
            ],
            [
              "no-disconfirmation",
              true,
              condition("alternative-outcome-possible"),
              relation("outcome-compares-prediction"),
              ["outcome-compares-prediction", "comparison-supports-update"],
              ["alternative-outcome-possible", "self-protecting-claim"],
              null
            ],
            [
              "declared-change",
              true,
              relation("claim-constrains-change"),
              condition("observation-rule-declared"),
              ["claim-constrains-change", "condition-causes-prediction"],
              ["observation-rule-declared"],
              null
            ],
            [
              "experiment-alone",
              false,
              misconception("testable-means-falsifiable", "claim"),
              misconception("testable-means-falsifiable", "mechanism"),
              ["claim-constrains-change", "comparison-supports-update"],
              ["self-protecting-claim"],
              "testable-means-falsifiable"
            ],
            [
              "ignore-opposite",
              false,
              reasonedCase("self-protecting-counterexample", "outcome"),
              reasonedCase("self-protecting-counterexample", "criterion"),
              ["outcome-compares-prediction"],
              ["alternative-outcome-possible"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: instruction(
            "Match each wheel-slip hypothesis element to its controlling rule:",
            "The wheel-slip matches now connect prediction, observation and revision to their proper boundaries.",
            "One wheel-slip element is paired with a rule that cannot give it scientific meaning.",
            "Pair the path measurement with the declared observation rule.",
            "Pair the hypothesis update with the possible conflicting outcome.",
            "Connect the surface change to the directional wheel-slip prediction.",
            "Connect the path comparison to the bounded update decision."
          ),
          focusRef: reasonedCase("slip-hypothesis-example", "scenario"),
          contextConditionIds: [
            "observation-rule-declared",
            "alternative-outcome-possible"
          ],
          pairs: [
            [
              "observation-pair",
              relation("observation-measures-prediction"),
              condition("observation-rule-declared"),
              relation("observation-measures-prediction"),
              ["observation-measures-prediction"],
              ["observation-rule-declared"]
            ],
            [
              "prediction-pair",
              relation("condition-causes-prediction"),
              term("falsifiable-hypothesis", "definition"),
              relation("condition-causes-prediction"),
              ["condition-causes-prediction"],
              ["alternative-outcome-possible"]
            ],
            [
              "update-pair",
              relation("comparison-supports-update"),
              condition("alternative-outcome-possible"),
              relation("comparison-supports-update"),
              ["outcome-compares-prediction", "comparison-supports-update"],
              ["alternative-outcome-possible"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instruction(
            "Diagnose why the protected wheel-slip claim is not falsifiable:",
            "The diagnosis names the operational observation, conflicting outcome and evidence update.",
            "The diagnosis omits a wheel-slip concept group or says running a test is sufficient.",
            "Define the path observation before judging the wheel-slip result.",
            "State which path outcome would oppose the wheel-slip prediction.",
            "Explain how the self-protecting wheel-slip rule blocks comparison.",
            "Show how a conflicting path observation should change the hypothesis update."
          ),
          focusRef: misconception("testable-means-falsifiable", "claim"),
          contextConditionIds: [
            "self-protecting-claim",
            "alternative-outcome-possible"
          ],
          conceptGroups: [
            [
              "operational-group",
              term("operational-observation", "label"),
              [term("operational-observation", "definition")],
              ["observation-measures-prediction"],
              ["observation-rule-declared"]
            ],
            [
              "conflict-group",
              condition("alternative-outcome-possible"),
              [condition("alternative-outcome-possible")],
              ["outcome-compares-prediction"],
              ["alternative-outcome-possible"]
            ],
            [
              "update-group",
              relation("comparison-supports-update"),
              [relation("comparison-supports-update")],
              ["comparison-supports-update"],
              ["alternative-outcome-possible"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["outcome-compares-prediction"],
          criterionConditionId: "alternative-outcome-possible"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the wheel-slip graph when every path result is called supportive:",
            "The wheel-slip implication rejects the protected wording and restores a disconfirming path outcome.",
            "The wheel-slip implication accepts the experiment merely because observations were collected.",
            "Trace the path observation into its comparison with the prediction.",
            "Use the alternative-outcome wheel-slip boundary at the update node.",
            "Identify the path comparison that has lost its ability to challenge the claim.",
            "Rewrite the wheel-slip criterion before accepting any hypothesis decision."
          ),
          focusRef: reasonedCase("self-protecting-counterexample", "outcome"),
          contextConditionIds: [
            "self-protecting-claim",
            "alternative-outcome-possible"
          ],
          positions: [
            ["surface-condition", 0, 0],
            ["path-prediction", 1, 0],
            ["path-observation", 2, 0],
            ["hypothesis-update", 3, 0]
          ],
          relationIds: [
            "condition-causes-prediction",
            "outcome-compares-prediction",
            "comparison-supports-update"
          ],
          answerRelationIds: ["outcome-compares-prediction"],
          options: [
            [
              "restore-conflict",
              true,
              reasonedCase("self-protecting-counterexample", "verification"),
              condition("alternative-outcome-possible"),
              ["outcome-compares-prediction", "comparison-supports-update"],
              ["self-protecting-claim", "alternative-outcome-possible"],
              null
            ],
            [
              "test-is-enough",
              false,
              misconception("testable-means-falsifiable", "claim"),
              misconception("testable-means-falsifiable", "mechanism"),
              ["condition-causes-prediction"],
              ["self-protecting-claim"],
              "testable-means-falsifiable"
            ],
            [
              "keep-moving-rule",
              false,
              term("operational-observation", "boundary"),
              reasonedCase("slip-hypothesis-example", "criterion"),
              ["comparison-supports-update"],
              ["observation-rule-declared"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the wheel-slip graph after a conflicting observation is declared:",
            "The wheel-slip graph now supports a bounded evidence update rather than certainty.",
            "The wheel-slip graph claims one comparison proves a universal law or ignores the observation rule.",
            "Follow the declared surface condition into the path prediction.",
            "Check that the measured path observation uses the predeclared rule.",
            "Compare the wheel-slip prediction with the recorded outcome before updating.",
            "Retain or revise the wheel-slip hypothesis only inside this test boundary."
          ),
          focusRef: reasonedCase("slip-hypothesis-example", "outcome"),
          contextConditionIds: [
            "observation-rule-declared",
            "alternative-outcome-possible"
          ],
          positions: [
            ["surface-condition", 0, 1],
            ["path-prediction", 1, 1],
            ["path-observation", 2, 1],
            ["hypothesis-update", 3, 1]
          ],
          relationIds: [
            "condition-causes-prediction",
            "observation-measures-prediction",
            "comparison-supports-update"
          ],
          answerRelationIds: ["comparison-supports-update"],
          options: [
            [
              "bounded-update",
              true,
              reasonedCase("slip-hypothesis-example", "verification"),
              condition("alternative-outcome-possible"),
              ["observation-measures-prediction", "comparison-supports-update"],
              ["observation-rule-declared", "alternative-outcome-possible"],
              null
            ],
            [
              "universal-proof",
              false,
              term("falsifiable-hypothesis", "boundary"),
              reasonedCase("slip-hypothesis-example", "criterion"),
              ["comparison-supports-update"],
              ["alternative-outcome-possible"],
              null
            ],
            [
              "ignore-rule",
              false,
              misconception("testable-means-falsifiable", "claim"),
              misconception(
                "testable-means-falsifiable",
                "disconfirmingObservation"
              ),
              ["observation-measures-prediction", "comparison-supports-update"],
              ["self-protecting-claim", "observation-rule-declared"],
              "testable-means-falsifiable"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("falsifiable-hypothesis", "label"),
      focusRef: reasonedCase("slip-hypothesis-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["slip-claim", 0, 0],
        ["surface-condition", 1, 0],
        ["path-prediction", 2, 0],
        ["path-observation", 2, 1],
        ["hypothesis-update", 3, 0]
      ],
      visibleEntityIds: [
        "slip-claim",
        "surface-condition",
        "path-prediction",
        "path-observation",
        "hypothesis-update"
      ],
      visibleRelationIds: [
        "claim-constrains-change",
        "condition-causes-prediction",
        "observation-measures-prediction",
        "outcome-compares-prediction",
        "comparison-supports-update"
      ],
      controls: [
        [
          "operational-view",
          term("operational-observation", "label"),
          ["observation-rule-declared"],
          ["surface-condition", "path-prediction", "path-observation"],
          ["condition-causes-prediction", "observation-measures-prediction"],
          [],
          [],
          [
            [
              "declared-measure",
              "The path observation is fixed before the wheel-slip outcome is known.",
              ["path-prediction", "path-observation"],
              ["observation-measures-prediction"]
            ]
          ],
          reasonedCase("slip-hypothesis-example", "verification")
        ],
        [
          "falsifiability-view",
          term("falsifiable-hypothesis", "label"),
          ["alternative-outcome-possible"],
          ["path-prediction", "path-observation", "hypothesis-update"],
          ["outcome-compares-prediction", "comparison-supports-update"],
          ["claim-constrains-change"],
          [],
          [
            [
              "conflicting-outcome",
              "A plausible opposite path result can change the hypothesis update.",
              ["path-observation", "hypothesis-update"],
              ["comparison-supports-update"]
            ]
          ],
          reasonedCase("slip-hypothesis-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D01-L05",
    systemModel:
      "A fair engineering comparison deliberately changes one named factor, holds relevant setup choices consistently, observes a defined response and records enough context to interpret the comparison without overstating causality.",
    failurePattern:
      "Two test runs can produce different response values while simultaneous setup changes make the responsible mechanism unknowable.",
    visualExplanation:
      "An experiment graph connects a traction question, manipulated tyre condition, controlled robot setup, measured travel response and bounded comparison conclusion.",
    applicationTask:
      "Design a bench comparison of two tyre-surface conditions for a small mobile robot, declaring the changed factor, held setup, response observation and evidence needed before drawing a bounded conclusion.",
    terms: [
      [
        "manipulated-variable",
        "Manipulated variable",
        "The factor deliberately changed between comparison conditions.",
        "A factor that drifts unnoticed is not a controlled manipulation.",
        "declare-factor"
      ],
      [
        "response-variable",
        "Response variable",
        "The defined observation used to compare how the system behaved.",
        "The response records an association under the test boundary; by itself it does not prove causality.",
        "define-response"
      ],
      [
        "fair-comparison",
        "Fair comparison",
        "A comparison where relevant competing changes are controlled or explicitly accounted for.",
        "Fair does not mean identical outcomes, perfect equipment or universal proof.",
        "hold-setup"
      ]
    ],
    entities: [
      [
        "traction-question",
        "input",
        "Robot traction question",
        "The bounded question about tyre-surface condition and robot travel."
      ],
      [
        "tyre-condition",
        "input",
        "Manipulated tyre condition",
        "The one declared tyre-surface factor changed between comparison runs."
      ],
      [
        "controlled-setup",
        "constraint",
        "Controlled robot setup",
        "The load, command, starting state and observation method kept consistent or recorded."
      ],
      [
        "travel-record",
        "observation",
        "Robot travel response",
        "The defined travel observation collected using the same procedure."
      ],
      [
        "comparison-conclusion",
        "decision",
        "Bounded traction conclusion",
        "The conclusion limited to the tested conditions and available evidence."
      ]
    ],
    relations: [
      [
        "question-routes-factor",
        "routes",
        ["traction-question"],
        ["tyre-condition"],
        "the traction question identifies the tyre condition to manipulate",
        "directed",
        "one-to-one"
      ],
      [
        "setup-constrains-factor",
        "constrains",
        ["controlled-setup"],
        ["tyre-condition"],
        "the controlled robot setup limits competing changes around the tyre comparison",
        "directed",
        "one-to-one"
      ],
      [
        "record-measures-response",
        "measures",
        ["travel-record"],
        ["tyre-condition"],
        "the travel record measures the response associated with each tyre condition",
        "directed",
        "many-to-one"
      ],
      [
        "responses-compare-conditions",
        "compares",
        ["travel-record"],
        ["tyre-condition"],
        "travel responses are compared across the declared tyre conditions",
        "undirected",
        "many-to-many"
      ],
      [
        "comparison-supports-conclusion",
        "supports",
        ["travel-record", "controlled-setup"],
        ["comparison-conclusion"],
        "the response comparison and controlled setup support a bounded traction conclusion",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "one-declared-factor",
        "boundary",
        "The tyre-surface condition is the only deliberately changed test factor.",
        ["tyre-condition", "controlled-setup"],
        ["question-routes-factor", "setup-constrains-factor"]
      ],
      [
        "same-response-procedure",
        "criterion",
        "Each run uses the same declared travel observation and interpretation procedure.",
        ["controlled-setup", "travel-record", "comparison-conclusion"],
        ["record-measures-response", "responses-compare-conditions"]
      ],
      [
        "multiple-setup-changes",
        "operating-state",
        "Tyre condition, robot load and command profile all change together.",
        ["tyre-condition", "controlled-setup", "travel-record"],
        ["setup-constrains-factor", "comparison-supports-conclusion"]
      ]
    ],
    failureBoundary: [
      "confounded-traction-comparison",
      "one-declared-factor",
      "Simultaneous setup changes provide several plausible explanations for any response difference.",
      "Different travel is observed, but tyre condition cannot be separated from load or command changes.",
      "Attribute the comparison only when the declared factor is isolated or competing changes are explicitly modelled.",
      ["tyre-condition", "controlled-setup", "travel-record", "comparison-conclusion"],
      [
        "setup-constrains-factor",
        "responses-compare-conditions",
        "comparison-supports-conclusion"
      ]
    ],
    conceptualModel: [
      [
        "declare-factor",
        "Translate the traction question into one deliberately changed tyre condition.",
        ["traction-question", "tyre-condition"],
        ["question-routes-factor"],
        ["one-declared-factor"]
      ],
      [
        "hold-setup",
        "Keep the relevant robot load, command and starting state consistent or explicitly recorded.",
        ["controlled-setup", "tyre-condition"],
        ["setup-constrains-factor"],
        ["one-declared-factor"]
      ],
      [
        "define-response",
        "Declare how robot travel will be observed and interpreted before testing.",
        ["travel-record", "controlled-setup"],
        ["record-measures-response"],
        ["same-response-procedure"]
      ],
      [
        "compare-responses",
        "Compare response records across tyre conditions using the same procedure.",
        ["travel-record", "tyre-condition"],
        ["responses-compare-conditions"],
        ["same-response-procedure"]
      ],
      [
        "bound-conclusion",
        "Limit the traction conclusion to the tested setup and acknowledge remaining alternatives.",
        ["travel-record", "controlled-setup", "comparison-conclusion"],
        ["comparison-supports-conclusion"],
        ["one-declared-factor", "same-response-procedure"]
      ]
    ],
    reasonedCases: [
      {
        id: "traction-comparison-example",
        kind: "example",
        scenario:
          "Two tyre-surface conditions are compared while robot load, command, starting state and travel observation procedure remain declared and consistent.",
        changedConditionIds: ["one-declared-factor"],
        givens: [
          [
            "changed-tyre-state",
            "Declared manipulation",
            "Only the tyre-surface condition is deliberately changed.",
            null,
            "tyre-condition"
          ]
        ],
        reasoningSteps: [
          [
            "example-factor",
            "The traction question routes one named tyre condition into the experiment.",
            ["traction-question", "tyre-condition"],
            ["question-routes-factor"],
            ["one-declared-factor"]
          ],
          [
            "example-procedure",
            "The controlled setup and response procedure limit competing explanations.",
            ["controlled-setup", "travel-record", "tyre-condition"],
            ["setup-constrains-factor", "record-measures-response"],
            ["one-declared-factor", "same-response-procedure"]
          ],
          [
            "example-bound",
            "The recorded responses support a comparison limited to the tested robot setup.",
            ["travel-record", "controlled-setup", "comparison-conclusion"],
            ["responses-compare-conditions", "comparison-supports-conclusion"],
            ["same-response-procedure"]
          ]
        ],
        outcome:
          "The result supports a bounded association between the tested tyre condition and travel response.",
        criterionConditionId: "same-response-procedure",
        criterion:
          "Every compared run must use the same declared response procedure and controlled setup.",
        verification:
          "Audit the run sheet for the single manipulated factor, held settings, response definition and bounded conclusion."
      },
      {
        id: "confounded-test-counterexample",
        kind: "counterexample",
        scenario:
          "The second tyre run also changes robot load and command profile, then attributes the different travel entirely to tyre condition.",
        changedConditionIds: ["multiple-setup-changes"],
        givens: [
          [
            "changed-setup",
            "Undeclared competing changes",
            "Tyre condition, load and command profile differ together.",
            null,
            "controlled-setup"
          ]
        ],
        reasoningSteps: [
          [
            "counter-isolation",
            "The controlled setup no longer constrains competing changes around the tyre factor.",
            ["controlled-setup", "tyre-condition"],
            ["setup-constrains-factor"],
            ["multiple-setup-changes", "one-declared-factor"]
          ],
          [
            "counter-response",
            "A travel difference remains measurable, but several changed inputs could explain it.",
            ["travel-record", "tyre-condition", "controlled-setup"],
            ["record-measures-response", "responses-compare-conditions"],
            ["multiple-setup-changes"]
          ],
          [
            "counter-conclusion",
            "The evidence cannot support a tyre-specific causal conclusion.",
            ["travel-record", "controlled-setup", "comparison-conclusion"],
            ["comparison-supports-conclusion"],
            ["multiple-setup-changes"]
          ]
        ],
        outcome:
          "The confounded runs can be compared descriptively but cannot isolate the tyre condition.",
        criterionConditionId: "same-response-procedure",
        criterion:
          "Repeat or redesign the comparison so competing setup changes are controlled or separately represented.",
        verification:
          "List every setting that differs between runs and test whether more than the declared factor changed."
      }
    ],
    misconception: {
      id: "difference-proves-cause",
      claim:
        "If two robot runs have different response values, the deliberately named variable caused the difference.",
      mechanism:
        "A numerical difference can coexist with uncontrolled changes, measurement differences and alternative mechanisms.",
      correction:
        "Isolate one declared factor, standardise the response procedure and bound the conclusion to the tested setup.",
      disconfirmingObservation:
        "Changing robot load while holding tyre condition fixed also changes the travel response.",
      entityIds: [
        "tyre-condition",
        "controlled-setup",
        "travel-record",
        "comparison-conclusion"
      ],
      relationIds: [
        "setup-constrains-factor",
        "responses-compare-conditions",
        "comparison-supports-conclusion"
      ],
      conditionIds: ["multiple-setup-changes", "one-declared-factor"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Construct the traction experiment from factor declaration to bounded conclusion:",
            "The traction experiment isolates the tyre condition, fixes the response procedure and compares evidence.",
            "The traction experiment currently measures before defining the response or changes several robot settings.",
            "Begin by turning the traction question into one manipulated tyre condition.",
            "Place the controlled robot setup before collecting travel records.",
            "Define the travel response under the same observation procedure.",
            "Compare tyre conditions and bound the traction conclusion to the tested setup."
          ),
          focusRef: reasonedCase("traction-comparison-example", "scenario"),
          contextConditionIds: [
            "one-declared-factor",
            "same-response-procedure"
          ],
          steps: [
            [
              "choose-factor",
              ["question-routes-factor"],
              ["one-declared-factor"]
            ],
            [
              "control-setup",
              ["setup-constrains-factor"],
              ["one-declared-factor"]
            ],
            [
              "record-response",
              ["record-measures-response"],
              ["same-response-procedure"]
            ],
            [
              "compare-and-bound",
              ["responses-compare-conditions", "comparison-supports-conclusion"],
              ["same-response-procedure"]
            ]
          ],
          correctOrder: [
            "choose-factor",
            "control-setup",
            "record-response",
            "compare-and-bound"
          ]
        },
        retry: {
          instruction: instruction(
            "Untangle a confounded traction test before repeating it:",
            "The traction redesign separates tyre condition from load and command changes.",
            "The traction redesign still permits several robot inputs to move together.",
            "Inventory every robot setup change in the confounded runs.",
            "Choose which tyre condition remains the single deliberate manipulation.",
            "Restore a controlled robot setup around the selected tyre comparison.",
            "Collect travel responses with one procedure before reconsidering the conclusion."
          ),
          focusRef: reasonedCase("confounded-test-counterexample", "scenario"),
          contextConditionIds: [
            "multiple-setup-changes",
            "one-declared-factor"
          ],
          steps: [
            [
              "inventory-changes",
              ["setup-constrains-factor"],
              ["multiple-setup-changes"]
            ],
            [
              "isolate-factor",
              ["question-routes-factor"],
              ["one-declared-factor"]
            ],
            [
              "recollect",
              ["record-measures-response", "responses-compare-conditions"],
              ["same-response-procedure"]
            ]
          ],
          correctOrder: ["inventory-changes", "isolate-factor", "recollect"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the traction records required for a fair tyre comparison:",
            "The selected traction records expose the single factor and common response procedure.",
            "A selected traction record supports causality without controlling the robot setup.",
            "Look for the tyre manipulation separated from load and command settings.",
            "Look for travel observations gathered through the same procedure.",
            "Select the controlled-setup relation surrounding the tyre factor.",
            "Select the response comparison that remains inside the tested traction boundary."
          ),
          focusRef: term("fair-comparison", "definition"),
          contextConditionIds: [
            "one-declared-factor",
            "same-response-procedure"
          ],
          options: [
            [
              "controlled-factor",
              true,
              relation("setup-constrains-factor"),
              condition("one-declared-factor"),
              ["question-routes-factor", "setup-constrains-factor"],
              ["one-declared-factor"],
              null
            ],
            [
              "common-procedure",
              true,
              relation("responses-compare-conditions"),
              condition("same-response-procedure"),
              ["record-measures-response", "responses-compare-conditions"],
              ["same-response-procedure"],
              null
            ],
            [
              "difference-cause",
              false,
              misconception("difference-proves-cause", "claim"),
              misconception("difference-proves-cause", "mechanism"),
              ["responses-compare-conditions"],
              ["multiple-setup-changes"],
              "difference-proves-cause"
            ],
            [
              "ratio-alone",
              false,
              term("response-variable", "boundary"),
              reasonedCase("traction-comparison-example", "criterion"),
              ["comparison-supports-conclusion"],
              ["same-response-procedure"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Mark the traction observations that reveal experimental confounding:",
            "The marked traction observations show simultaneous setup changes and an unsupported tyre attribution.",
            "The marked traction observations reject a valid control or confuse a response record with a cause.",
            "Check whether robot load and command changed beside tyre condition.",
            "Check whether the travel procedure stayed common across traction runs.",
            "Flag several moving robot inputs as a confounding mechanism.",
            "Flag a tyre-specific conclusion that exceeds the available travel evidence."
          ),
          focusRef: reasonedCase("confounded-test-counterexample", "verification"),
          contextConditionIds: [
            "multiple-setup-changes",
            "same-response-procedure"
          ],
          options: [
            [
              "simultaneous-changes",
              true,
              condition("multiple-setup-changes"),
              relation("setup-constrains-factor"),
              ["setup-constrains-factor"],
              ["multiple-setup-changes"],
              null
            ],
            [
              "procedure-check",
              true,
              condition("same-response-procedure"),
              relation("record-measures-response"),
              ["record-measures-response", "responses-compare-conditions"],
              ["same-response-procedure"],
              null
            ],
            [
              "overclaim",
              true,
              reasonedCase("confounded-test-counterexample", "outcome"),
              relation("comparison-supports-conclusion"),
              ["comparison-supports-conclusion"],
              ["multiple-setup-changes"],
              null
            ],
            [
              "values-prove",
              false,
              misconception("difference-proves-cause", "claim"),
              misconception("difference-proves-cause", "mechanism"),
              ["responses-compare-conditions", "comparison-supports-conclusion"],
              ["multiple-setup-changes"],
              "difference-proves-cause"
            ],
            [
              "ignore-control",
              false,
              term("fair-comparison", "boundary"),
              reasonedCase("confounded-test-counterexample", "criterion"),
              ["setup-constrains-factor"],
              ["one-declared-factor"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why a travel-response ratio cannot by itself prove tyre causality:",
            "The explanation joins manipulated tyre condition, controlled robot setup and bounded response comparison.",
            "The explanation omits a traction concept group or treats the response ratio as a causal mechanism.",
            "Name the manipulated tyre condition before interpreting travel.",
            "Describe which robot setup choices must remain controlled.",
            "Explain what the travel response compares under the common procedure.",
            "Limit the traction conclusion to the tested conditions and competing explanations."
          ),
          focusRef: misconception("difference-proves-cause", "claim"),
          contextConditionIds: [
            "multiple-setup-changes",
            "same-response-procedure"
          ],
          conceptGroups: [
            [
              "manipulation-group",
              term("manipulated-variable", "label"),
              [term("manipulated-variable", "definition")],
              ["question-routes-factor"],
              ["one-declared-factor"]
            ],
            [
              "control-group",
              term("fair-comparison", "label"),
              [term("fair-comparison", "definition")],
              ["setup-constrains-factor"],
              ["one-declared-factor"]
            ],
            [
              "response-group",
              term("response-variable", "label"),
              [term("response-variable", "definition")],
              ["record-measures-response", "responses-compare-conditions"],
              ["same-response-procedure"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["comparison-supports-conclusion"],
          criterionConditionId: "same-response-procedure"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match the traction experiment relations to their validity conditions:",
            "The traction matches connect factor isolation, response consistency and bounded inference.",
            "One traction match assigns a robot condition to the wrong experimental role.",
            "Pair tyre-factor constraint with the single-change boundary.",
            "Pair travel-response comparison with the common procedure.",
            "Connect the traction question to its manipulated condition.",
            "Connect the bounded traction conclusion to controlled setup evidence."
          ),
          focusRef: reasonedCase("traction-comparison-example", "scenario"),
          contextConditionIds: [
            "one-declared-factor",
            "same-response-procedure"
          ],
          pairs: [
            [
              "factor-pair",
              relation("setup-constrains-factor"),
              condition("one-declared-factor"),
              relation("setup-constrains-factor"),
              ["setup-constrains-factor"],
              ["one-declared-factor"]
            ],
            [
              "response-pair",
              relation("responses-compare-conditions"),
              condition("same-response-procedure"),
              relation("responses-compare-conditions"),
              ["record-measures-response", "responses-compare-conditions"],
              ["same-response-procedure"]
            ],
            [
              "conclusion-pair",
              relation("comparison-supports-conclusion"),
              term("fair-comparison", "boundary"),
              relation("comparison-supports-conclusion"),
              ["comparison-supports-conclusion"],
              ["one-declared-factor", "same-response-procedure"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the traction graph when tyre, load and command change together:",
            "The traction implication rejects tyre-specific attribution while retaining the descriptive travel record.",
            "The traction implication deletes useful measurements or treats a response difference as proof.",
            "Trace controlled robot setup into the manipulated tyre condition.",
            "Use the multiple-change traction state when judging the conclusion.",
            "Locate the relation that should constrain competing robot changes.",
            "Keep the travel comparison but withdraw the unsupported tyre cause."
          ),
          focusRef: reasonedCase("confounded-test-counterexample", "outcome"),
          contextConditionIds: [
            "multiple-setup-changes",
            "same-response-procedure"
          ],
          positions: [
            ["controlled-setup", 0, 0],
            ["tyre-condition", 1, 0],
            ["travel-record", 2, 0],
            ["comparison-conclusion", 3, 0]
          ],
          relationIds: [
            "setup-constrains-factor",
            "responses-compare-conditions",
            "comparison-supports-conclusion"
          ],
          answerRelationIds: ["setup-constrains-factor"],
          options: [
            [
              "withdraw-attribution",
              true,
              reasonedCase("confounded-test-counterexample", "verification"),
              condition("multiple-setup-changes"),
              ["setup-constrains-factor", "comparison-supports-conclusion"],
              ["multiple-setup-changes", "same-response-procedure"],
              null
            ],
            [
              "difference-is-cause",
              false,
              misconception("difference-proves-cause", "claim"),
              misconception("difference-proves-cause", "mechanism"),
              ["responses-compare-conditions"],
              ["multiple-setup-changes"],
              "difference-proves-cause"
            ],
            [
              "discard-records",
              false,
              term("response-variable", "boundary"),
              reasonedCase("confounded-test-counterexample", "criterion"),
              ["comparison-supports-conclusion"],
              ["same-response-procedure"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the repaired traction graph after the tyre factor is isolated:",
            "The traction graph supports a bounded condition comparison under the declared robot setup.",
            "The traction graph claims universal causality or ignores response-procedure consistency.",
            "Follow the traction question into the single manipulated tyre condition.",
            "Check that robot travel is measured through one declared procedure.",
            "Compare the tyre-condition response records without adding hidden setup changes.",
            "State the traction conclusion only for the tested robot configuration."
          ),
          focusRef: reasonedCase("traction-comparison-example", "outcome"),
          contextConditionIds: [
            "one-declared-factor",
            "same-response-procedure"
          ],
          positions: [
            ["traction-question", 0, 1],
            ["tyre-condition", 1, 1],
            ["controlled-setup", 1, 2],
            ["travel-record", 2, 1],
            ["comparison-conclusion", 3, 1]
          ],
          relationIds: [
            "question-routes-factor",
            "record-measures-response",
            "comparison-supports-conclusion"
          ],
          answerRelationIds: ["comparison-supports-conclusion"],
          options: [
            [
              "bounded-comparison",
              true,
              reasonedCase("traction-comparison-example", "verification"),
              condition("same-response-procedure"),
              ["record-measures-response", "comparison-supports-conclusion"],
              ["one-declared-factor", "same-response-procedure"],
              null
            ],
            [
              "universal-cause",
              false,
              term("response-variable", "boundary"),
              reasonedCase("traction-comparison-example", "criterion"),
              ["comparison-supports-conclusion"],
              ["same-response-procedure"],
              null
            ],
            [
              "skip-controls",
              false,
              misconception("difference-proves-cause", "claim"),
              misconception(
                "difference-proves-cause",
                "disconfirmingObservation"
              ),
              ["question-routes-factor", "comparison-supports-conclusion"],
              ["multiple-setup-changes", "one-declared-factor"],
              "difference-proves-cause"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("fair-comparison", "label"),
      focusRef: reasonedCase("traction-comparison-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["traction-question", 0, 0],
        ["tyre-condition", 1, 0],
        ["controlled-setup", 1, 1],
        ["travel-record", 2, 0],
        ["comparison-conclusion", 3, 0]
      ],
      visibleEntityIds: [
        "traction-question",
        "tyre-condition",
        "controlled-setup",
        "travel-record",
        "comparison-conclusion"
      ],
      visibleRelationIds: [
        "question-routes-factor",
        "setup-constrains-factor",
        "record-measures-response",
        "responses-compare-conditions",
        "comparison-supports-conclusion"
      ],
      controls: [
        [
          "isolated-factor-view",
          term("manipulated-variable", "label"),
          ["one-declared-factor"],
          ["traction-question", "tyre-condition", "controlled-setup"],
          ["question-routes-factor", "setup-constrains-factor"],
          [],
          [],
          [
            [
              "single-change",
              "The tyre condition is isolated from competing robot setup changes.",
              ["tyre-condition", "controlled-setup"],
              ["setup-constrains-factor"]
            ]
          ],
          reasonedCase("traction-comparison-example", "verification")
        ],
        [
          "response-view",
          term("response-variable", "label"),
          ["same-response-procedure"],
          ["tyre-condition", "travel-record", "comparison-conclusion"],
          [
            "record-measures-response",
            "responses-compare-conditions",
            "comparison-supports-conclusion"
          ],
          ["question-routes-factor"],
          [],
          [
            [
              "bounded-association",
              "The response comparison supports only a bounded traction conclusion.",
              ["travel-record", "comparison-conclusion"],
              ["comparison-supports-conclusion"]
            ]
          ],
          reasonedCase("traction-comparison-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D01-L06",
    systemModel:
      "A technical evidence trail connects the question being answered to dated observations, the exact configuration, transparent transformations and a conclusion that can be checked or revised.",
    failurePattern:
      "A neat conclusion without raw observations or configuration context cannot be reproduced, challenged or safely reused.",
    visualExplanation:
      "A traceability graph links a motor-current question, timestamped observation, firmware configuration, calculation record and bounded engineering conclusion.",
    applicationTask:
      "Create a technical note for a mobile robot motor-current anomaly that lets another engineer trace the conclusion back to raw observations, configuration and each calculation step.",
    terms: [
      [
        "traceability",
        "Evidence traceability",
        "The ability to follow a conclusion back through transformations to its source observations and context.",
        "A polished summary without navigable source links is not traceable evidence.",
        "state-question"
      ],
      [
        "provenance",
        "Record provenance",
        "The origin, time, configuration and handling history of an engineering record.",
        "A filename alone does not establish provenance.",
        "capture-context"
      ]
    ],
    entities: [
      [
        "current-question",
        "input",
        "Motor-current question",
        "The bounded question the technical note is intended to answer."
      ],
      [
        "timestamped-observation",
        "observation",
        "Timestamped current observation",
        "The retained motor-current record with acquisition time and source."
      ],
      [
        "configuration-snapshot",
        "constraint",
        "Robot configuration snapshot",
        "The firmware, parameters, wiring state and operating context for the observation."
      ],
      [
        "calculation-record",
        "mechanism",
        "Current calculation record",
        "The explicit transformations from source observations to interpreted quantities."
      ],
      [
        "bounded-conclusion",
        "decision",
        "Bounded anomaly conclusion",
        "The engineering judgement tied to the recorded evidence and configuration."
      ]
    ],
    relations: [
      [
        "question-routes-observation",
        "routes",
        ["current-question"],
        ["timestamped-observation"],
        "the motor-current question determines which source observations must be retained",
        "directed",
        "one-to-many"
      ],
      [
        "configuration-constrains-observation",
        "constrains",
        ["configuration-snapshot"],
        ["timestamped-observation"],
        "the robot configuration constrains how the current observation may be interpreted",
        "directed",
        "one-to-many"
      ],
      [
        "observation-feeds-calculation",
        "transforms",
        ["timestamped-observation"],
        ["calculation-record"],
        "the retained observation is transformed through explicit calculation steps",
        "directed",
        "many-to-one"
      ],
      [
        "configuration-maps-calculation",
        "maps",
        ["configuration-snapshot"],
        ["calculation-record"],
        "the recorded configuration maps scaling and parameter meaning into the calculation",
        "directed",
        "one-to-many"
      ],
      [
        "calculation-supports-conclusion",
        "supports",
        ["calculation-record", "timestamped-observation"],
        ["bounded-conclusion"],
        "the auditable calculation and source observation support the bounded conclusion",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "source-and-time-declared",
        "criterion",
        "Each observation declares its acquisition source and timestamp.",
        ["timestamped-observation", "calculation-record"],
        ["question-routes-observation", "observation-feeds-calculation"]
      ],
      [
        "configuration-retained",
        "boundary",
        "The configuration needed to interpret the observation is retained with the note.",
        ["configuration-snapshot", "timestamped-observation", "bounded-conclusion"],
        [
          "configuration-constrains-observation",
          "configuration-maps-calculation"
        ]
      ],
      [
        "undocumented-edit",
        "operating-state",
        "A current value or firmware parameter is changed without recording the edit or its origin.",
        ["timestamped-observation", "configuration-snapshot", "calculation-record"],
        [
          "configuration-constrains-observation",
          "observation-feeds-calculation"
        ]
      ]
    ],
    failureBoundary: [
      "orphaned-conclusion",
      "configuration-retained",
      "Removing configuration or raw records breaks the path needed to reproduce the calculation.",
      "Another engineer cannot tell whether the conclusion used the current firmware scaling.",
      "Retain the conclusion only when every transformation resolves to a source observation and applicable configuration.",
      [
        "timestamped-observation",
        "configuration-snapshot",
        "calculation-record",
        "bounded-conclusion"
      ],
      [
        "configuration-maps-calculation",
        "calculation-supports-conclusion"
      ]
    ],
    conceptualModel: [
      [
        "state-question",
        "Write the motor-current question and the decision it is meant to support.",
        ["current-question", "bounded-conclusion"],
        ["question-routes-observation"],
        ["source-and-time-declared"]
      ],
      [
        "retain-observation",
        "Preserve the raw current observation with source and timestamp.",
        ["current-question", "timestamped-observation"],
        ["question-routes-observation"],
        ["source-and-time-declared"]
      ],
      [
        "capture-context",
        "Snapshot the firmware, parameters and operating context needed for interpretation.",
        ["configuration-snapshot", "timestamped-observation"],
        ["configuration-constrains-observation"],
        ["configuration-retained"]
      ],
      [
        "show-transformations",
        "Record each calculation and the configuration-dependent meaning it uses.",
        [
          "timestamped-observation",
          "configuration-snapshot",
          "calculation-record"
        ],
        ["observation-feeds-calculation", "configuration-maps-calculation"],
        ["source-and-time-declared", "configuration-retained"]
      ],
      [
        "link-conclusion",
        "Tie the anomaly conclusion to the calculation, source evidence and stated boundary.",
        ["calculation-record", "timestamped-observation", "bounded-conclusion"],
        ["calculation-supports-conclusion"],
        ["configuration-retained"]
      ]
    ],
    reasonedCases: [
      {
        id: "traceable-note-example",
        kind: "example",
        scenario:
          "A motor-current note retains the timestamped source record, active firmware configuration, explicit scaling calculation and a conclusion limited to that run.",
        changedConditionIds: ["configuration-retained"],
        givens: [
          [
            "source-record",
            "Retained source",
            "The raw current observation and acquisition timestamp are linked from the note.",
            null,
            "timestamped-observation"
          ]
        ],
        reasoningSteps: [
          [
            "example-origin",
            "The question routes to a timestamped current observation with identifiable provenance.",
            ["current-question", "timestamped-observation"],
            ["question-routes-observation"],
            ["source-and-time-declared"]
          ],
          [
            "example-context",
            "The configuration snapshot fixes how the source value is scaled and interpreted.",
            [
              "configuration-snapshot",
              "timestamped-observation",
              "calculation-record"
            ],
            [
              "configuration-constrains-observation",
              "configuration-maps-calculation"
            ],
            ["configuration-retained"]
          ],
          [
            "example-conclusion",
            "The visible transformation chain supports a conclusion bounded to the retained run.",
            ["timestamped-observation", "calculation-record", "bounded-conclusion"],
            ["observation-feeds-calculation", "calculation-supports-conclusion"],
            ["source-and-time-declared", "configuration-retained"]
          ]
        ],
        outcome:
          "Another engineer can reproduce the interpretation and challenge any step without guessing the configuration.",
        criterionConditionId: "configuration-retained",
        criterion:
          "Every conclusion must resolve to source observations, explicit transformations and the applicable configuration.",
        verification:
          "Follow the conclusion backwards and confirm that each link opens a retained record with source, time and context."
      },
      {
        id: "edited-note-counterexample",
        kind: "counterexample",
        scenario:
          "A summary value is copied into a note, manually corrected later and presented without the original observation or firmware configuration.",
        changedConditionIds: ["undocumented-edit"],
        givens: [
          [
            "orphaned-value",
            "Displayed result",
            "A corrected current value appears without an edit record or source link.",
            null,
            "calculation-record"
          ]
        ],
        reasoningSteps: [
          [
            "counter-source",
            "The edited value cannot be connected to a timestamped source observation.",
            ["timestamped-observation", "calculation-record"],
            ["observation-feeds-calculation"],
            ["undocumented-edit", "source-and-time-declared"]
          ],
          [
            "counter-config",
            "Missing firmware context leaves the scaling used by the calculation unknown.",
            ["configuration-snapshot", "calculation-record"],
            ["configuration-maps-calculation"],
            ["undocumented-edit", "configuration-retained"]
          ],
          [
            "counter-decision",
            "The unsupported value cannot justify the anomaly conclusion.",
            ["calculation-record", "bounded-conclusion"],
            ["calculation-supports-conclusion"],
            ["undocumented-edit"]
          ]
        ],
        outcome:
          "The neat summary is an orphaned assertion rather than an engineering evidence trail.",
        criterionConditionId: "configuration-retained",
        criterion:
          "Recover the source and configuration or mark the conclusion unsupported.",
        verification:
          "Attempt to reproduce the displayed value using only records linked from the note."
      }
    ],
    misconception: {
      id: "summary-is-evidence",
      claim:
        "A clear technical summary is sufficient evidence even when raw records and configuration are absent.",
      mechanism:
        "Readable prose can hide missing provenance, undocumented transformations and obsolete configuration.",
      correction:
        "Link the question, source observations, context, transformations and bounded conclusion into one traceable chain.",
      disconfirmingObservation:
        "Two engineers obtain different current interpretations because the note does not identify the active firmware scaling.",
      entityIds: [
        "current-question",
        "timestamped-observation",
        "configuration-snapshot",
        "calculation-record",
        "bounded-conclusion"
      ],
      relationIds: [
        "question-routes-observation",
        "configuration-maps-calculation",
        "calculation-supports-conclusion"
      ],
      conditionIds: ["undocumented-edit", "configuration-retained"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Assemble the motor-current evidence trail from question to conclusion:",
            "The motor-current trail preserves source, configuration, transformation and bounded judgement.",
            "The motor-current trail currently jumps from a summary value to a conclusion without provenance.",
            "Begin with the motor-current question and its required source observations.",
            "Place the robot configuration before interpreting or scaling the current record.",
            "Transform the timestamped current observation through explicit calculation steps.",
            "Attach the anomaly conclusion only after its evidence links are complete."
          ),
          focusRef: reasonedCase("traceable-note-example", "scenario"),
          contextConditionIds: [
            "source-and-time-declared",
            "configuration-retained"
          ],
          steps: [
            [
              "route-source",
              ["question-routes-observation"],
              ["source-and-time-declared"]
            ],
            [
              "bind-context",
              [
                "configuration-constrains-observation",
                "configuration-maps-calculation"
              ],
              ["configuration-retained"]
            ],
            [
              "show-work",
              ["observation-feeds-calculation"],
              ["source-and-time-declared"]
            ],
            [
              "support-decision",
              ["calculation-supports-conclusion"],
              ["configuration-retained"]
            ]
          ],
          correctOrder: [
            "route-source",
            "bind-context",
            "show-work",
            "support-decision"
          ]
        },
        retry: {
          instruction: instruction(
            "Repair an orphaned motor-current summary before anyone reuses it:",
            "The repair restores current provenance, applicable configuration and an auditable transformation.",
            "The repair merely rewrites the motor-current conclusion without recovering its missing links.",
            "Locate the original timestamped current observation or mark it missing.",
            "Identify which robot configuration made the displayed scaling meaningful.",
            "Rebuild the current calculation from retained source records.",
            "Revise or withdraw the anomaly conclusion if traceability cannot be restored."
          ),
          focusRef: reasonedCase("edited-note-counterexample", "scenario"),
          contextConditionIds: ["undocumented-edit", "configuration-retained"],
          steps: [
            [
              "recover-source",
              ["observation-feeds-calculation"],
              ["undocumented-edit", "source-and-time-declared"]
            ],
            [
              "recover-context",
              ["configuration-maps-calculation"],
              ["configuration-retained"]
            ],
            [
              "reassess",
              ["calculation-supports-conclusion"],
              ["undocumented-edit"]
            ]
          ],
          correctOrder: ["recover-source", "recover-context", "reassess"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the motor-current records needed for a reproducible note:",
            "The selected current records preserve acquisition provenance and configuration-dependent calculation.",
            "A selected current record is merely a readable conclusion or lacks source context.",
            "Look for the timestamped current observation behind the calculation.",
            "Look for the robot configuration that fixes scaling meaning.",
            "Select the source-to-calculation current relation.",
            "Select the calculation-to-conclusion relation only with retained context."
          ),
          focusRef: term("traceability", "definition"),
          contextConditionIds: [
            "source-and-time-declared",
            "configuration-retained"
          ],
          options: [
            [
              "source-link",
              true,
              relation("observation-feeds-calculation"),
              condition("source-and-time-declared"),
              ["question-routes-observation", "observation-feeds-calculation"],
              ["source-and-time-declared"],
              null
            ],
            [
              "configuration-link",
              true,
              relation("configuration-maps-calculation"),
              condition("configuration-retained"),
              [
                "configuration-constrains-observation",
                "configuration-maps-calculation"
              ],
              ["configuration-retained"],
              null
            ],
            [
              "summary-alone",
              false,
              misconception("summary-is-evidence", "claim"),
              misconception("summary-is-evidence", "mechanism"),
              ["calculation-supports-conclusion"],
              ["undocumented-edit"],
              "summary-is-evidence"
            ],
            [
              "filename-only",
              false,
              term("provenance", "boundary"),
              reasonedCase("traceable-note-example", "criterion"),
              ["question-routes-observation"],
              ["source-and-time-declared"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Identify which broken motor-current links prevent reproduction:",
            "The identified current links expose the missing source, configuration and edit history.",
            "The identified current links discard a valid record or mistake polished prose for provenance.",
            "Test whether the current value resolves to a timestamped source.",
            "Test whether the calculation resolves to the active robot configuration.",
            "Flag the undocumented current edit as a transformation break.",
            "Flag the unsupported anomaly conclusion as a decision break."
          ),
          focusRef: reasonedCase("edited-note-counterexample", "verification"),
          contextConditionIds: ["undocumented-edit", "configuration-retained"],
          options: [
            [
              "missing-source",
              true,
              condition("source-and-time-declared"),
              relation("observation-feeds-calculation"),
              ["observation-feeds-calculation"],
              ["source-and-time-declared", "undocumented-edit"],
              null
            ],
            [
              "missing-config",
              true,
              condition("configuration-retained"),
              relation("configuration-maps-calculation"),
              ["configuration-maps-calculation"],
              ["configuration-retained", "undocumented-edit"],
              null
            ],
            [
              "unsupported-conclusion",
              true,
              reasonedCase("edited-note-counterexample", "outcome"),
              relation("calculation-supports-conclusion"),
              ["calculation-supports-conclusion"],
              ["undocumented-edit"],
              null
            ],
            [
              "clear-summary",
              false,
              misconception("summary-is-evidence", "claim"),
              misconception("summary-is-evidence", "mechanism"),
              ["question-routes-observation", "calculation-supports-conclusion"],
              ["undocumented-edit"],
              "summary-is-evidence"
            ],
            [
              "ignore-history",
              false,
              term("provenance", "boundary"),
              reasonedCase("edited-note-counterexample", "criterion"),
              ["observation-feeds-calculation"],
              ["source-and-time-declared"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: instruction(
            "Match each motor-current evidence link with the record that controls it:",
            "The current-evidence matches now connect source, configuration and conclusion to traceability conditions.",
            "One current-evidence match links a transformation to the wrong provenance control.",
            "Pair the source observation with declared time and acquisition origin.",
            "Pair current scaling with the retained robot configuration.",
            "Connect the motor-current calculation to its raw observation.",
            "Connect the anomaly conclusion to the auditable calculation chain."
          ),
          focusRef: reasonedCase("traceable-note-example", "scenario"),
          contextConditionIds: [
            "source-and-time-declared",
            "configuration-retained"
          ],
          pairs: [
            [
              "source-pair",
              relation("question-routes-observation"),
              condition("source-and-time-declared"),
              relation("question-routes-observation"),
              ["question-routes-observation"],
              ["source-and-time-declared"]
            ],
            [
              "config-pair",
              relation("configuration-maps-calculation"),
              condition("configuration-retained"),
              relation("configuration-maps-calculation"),
              ["configuration-maps-calculation"],
              ["configuration-retained"]
            ],
            [
              "conclusion-pair",
              relation("calculation-supports-conclusion"),
              term("traceability", "definition"),
              relation("calculation-supports-conclusion"),
              ["observation-feeds-calculation", "calculation-supports-conclusion"],
              ["source-and-time-declared", "configuration-retained"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instruction(
            "Explain why an attractive motor-current summary can still be unusable evidence:",
            "The explanation joins current provenance, configuration context and transparent transformation.",
            "The explanation omits a current evidence group or assumes readability supplies traceability.",
            "Define what provenance adds to the timestamped current observation.",
            "Explain why robot configuration changes the meaning of current scaling.",
            "Describe how the current calculation preserves each transformation.",
            "Tie the anomaly conclusion to records another engineer can reproduce."
          ),
          focusRef: misconception("summary-is-evidence", "claim"),
          contextConditionIds: ["undocumented-edit", "configuration-retained"],
          conceptGroups: [
            [
              "provenance-group",
              term("provenance", "label"),
              [term("provenance", "definition")],
              ["question-routes-observation"],
              ["source-and-time-declared"]
            ],
            [
              "configuration-group",
              condition("configuration-retained"),
              [condition("configuration-retained")],
              [
                "configuration-constrains-observation",
                "configuration-maps-calculation"
              ],
              ["configuration-retained"]
            ],
            [
              "trace-group",
              term("traceability", "label"),
              [term("traceability", "definition")],
              ["observation-feeds-calculation", "calculation-supports-conclusion"],
              ["source-and-time-declared"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["configuration-maps-calculation"],
          criterionConditionId: "configuration-retained"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the current-evidence graph after an undocumented manual edit:",
            "The current graph implication withholds the anomaly conclusion until provenance is repaired.",
            "The current graph implication accepts the edited value because the summary is clear.",
            "Trace the timestamped current observation into its calculation record.",
            "Use the retained robot configuration to evaluate the undocumented edit.",
            "Locate the broken current transformation rather than rewriting the conclusion.",
            "Mark the anomaly conclusion unsupported if the source chain cannot be recovered."
          ),
          focusRef: reasonedCase("edited-note-counterexample", "outcome"),
          contextConditionIds: ["undocumented-edit", "configuration-retained"],
          positions: [
            ["timestamped-observation", 0, 0],
            ["configuration-snapshot", 0, 1],
            ["calculation-record", 1, 0],
            ["bounded-conclusion", 2, 0]
          ],
          relationIds: [
            "observation-feeds-calculation",
            "configuration-maps-calculation",
            "calculation-supports-conclusion"
          ],
          answerRelationIds: ["observation-feeds-calculation"],
          options: [
            [
              "withhold-conclusion",
              true,
              reasonedCase("edited-note-counterexample", "verification"),
              condition("configuration-retained"),
              ["observation-feeds-calculation", "calculation-supports-conclusion"],
              ["undocumented-edit", "configuration-retained"],
              null
            ],
            [
              "accept-summary",
              false,
              misconception("summary-is-evidence", "claim"),
              misconception("summary-is-evidence", "mechanism"),
              ["calculation-supports-conclusion"],
              ["undocumented-edit"],
              "summary-is-evidence"
            ],
            [
              "erase-source",
              false,
              term("traceability", "boundary"),
              reasonedCase("traceable-note-example", "criterion"),
              ["configuration-maps-calculation"],
              ["configuration-retained"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the restored current-evidence graph from source to bounded conclusion:",
            "The current graph now supports the conclusion through source, configuration and calculation.",
            "The current graph claims the conclusion is timeless or treats a filename as provenance.",
            "Follow the motor-current question to the retained observation.",
            "Follow the current observation and robot configuration into the calculation.",
            "Confirm every current transformation has an inspectable input.",
            "Accept the anomaly conclusion only within the retained configuration boundary."
          ),
          focusRef: reasonedCase("traceable-note-example", "outcome"),
          contextConditionIds: [
            "source-and-time-declared",
            "configuration-retained"
          ],
          positions: [
            ["current-question", 0, 1],
            ["timestamped-observation", 1, 1],
            ["calculation-record", 2, 1],
            ["bounded-conclusion", 3, 1],
            ["configuration-snapshot", 2, 2]
          ],
          relationIds: [
            "question-routes-observation",
            "observation-feeds-calculation",
            "configuration-maps-calculation",
            "calculation-supports-conclusion"
          ],
          answerRelationIds: ["calculation-supports-conclusion"],
          options: [
            [
              "accept-bounded",
              true,
              reasonedCase("traceable-note-example", "verification"),
              condition("configuration-retained"),
              ["observation-feeds-calculation", "calculation-supports-conclusion"],
              ["source-and-time-declared", "configuration-retained"],
              null
            ],
            [
              "timeless-result",
              false,
              term("traceability", "boundary"),
              reasonedCase("traceable-note-example", "criterion"),
              ["calculation-supports-conclusion"],
              ["configuration-retained"],
              null
            ],
            [
              "filename-proof",
              false,
              misconception("summary-is-evidence", "claim"),
              misconception("summary-is-evidence", "disconfirmingObservation"),
              ["question-routes-observation", "configuration-maps-calculation"],
              ["undocumented-edit", "source-and-time-declared"],
              "summary-is-evidence"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("traceability", "label"),
      focusRef: reasonedCase("traceable-note-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["current-question", 0, 0],
        ["timestamped-observation", 1, 0],
        ["configuration-snapshot", 1, 1],
        ["calculation-record", 2, 0],
        ["bounded-conclusion", 3, 0]
      ],
      visibleEntityIds: [
        "current-question",
        "timestamped-observation",
        "configuration-snapshot",
        "calculation-record",
        "bounded-conclusion"
      ],
      visibleRelationIds: [
        "question-routes-observation",
        "configuration-constrains-observation",
        "observation-feeds-calculation",
        "configuration-maps-calculation",
        "calculation-supports-conclusion"
      ],
      controls: [
        [
          "provenance-view",
          term("provenance", "label"),
          ["source-and-time-declared"],
          ["current-question", "timestamped-observation", "calculation-record"],
          ["question-routes-observation", "observation-feeds-calculation"],
          [],
          [],
          [
            [
              "source-visible",
              "The motor-current calculation resolves to a timestamped source.",
              ["timestamped-observation", "calculation-record"],
              ["observation-feeds-calculation"]
            ]
          ],
          reasonedCase("traceable-note-example", "verification")
        ],
        [
          "configuration-view",
          term("traceability", "label"),
          ["configuration-retained"],
          ["configuration-snapshot", "calculation-record", "bounded-conclusion"],
          ["configuration-maps-calculation", "calculation-supports-conclusion"],
          ["question-routes-observation"],
          [],
          [
            [
              "context-visible",
              "The robot configuration controls calculation meaning and conclusion scope.",
              ["configuration-snapshot", "calculation-record", "bounded-conclusion"],
              ["configuration-maps-calculation", "calculation-supports-conclusion"]
            ]
          ],
          reasonedCase("traceable-note-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D01-L07",
    systemModel:
      "A technical document is interpreted by resolving symbols through its legend, connecting values to their stated operating conditions, checking the applicable revision and translating only supported information into an engineering decision.",
    failurePattern:
      "A prominent number or familiar-looking symbol can be reused outside its documented condition, unit, note or revision.",
    visualExplanation:
      "A documentation graph connects a wiring symbol, legend definition, datasheet rating, operating-condition note and bounded component decision.",
    applicationTask:
      "Read a motor-driver connection diagram and rating table to decide whether one declared robot operating case is supported, citing the symbol definition, rating condition, unit and document revision.",
    terms: [
      [
        "document-legend",
        "Document legend",
        "The document's own mapping from symbols, abbreviations or line styles to declared meaning.",
        "Visual resemblance to a familiar symbol is not a substitute for the supplied legend.",
        "resolve-symbol"
      ],
      [
        "rated-condition",
        "Rated condition",
        "The operating boundary and test context attached to a published value.",
        "A headline value without its duration, temperature, supply or other stated condition is incomplete.",
        "bind-rating"
      ],
      [
        "applicable-revision",
        "Applicable revision",
        "The document issue that corresponds to the component and configuration being assessed.",
        "A newer date is not automatically applicable to an older hardware variant.",
        "confirm-revision"
      ]
    ],
    entities: [
      [
        "connection-symbol",
        "component",
        "Motor-driver connection symbol",
        "A symbol or labelled node appearing in the supplied connection diagram."
      ],
      [
        "legend-entry",
        "constraint",
        "Diagram legend entry",
        "The authoritative meaning assigned to the connection symbol in this document."
      ],
      [
        "published-rating",
        "input",
        "Published driver rating",
        "A table value presented with units and qualifying notes."
      ],
      [
        "operating-note",
        "constraint",
        "Driver operating-condition note",
        "The temperature, duration, supply or configuration boundary attached to the rating."
      ],
      [
        "component-decision",
        "decision",
        "Motor-driver suitability decision",
        "A decision limited to the declared robot case and applicable document evidence."
      ]
    ],
    relations: [
      [
        "legend-maps-symbol",
        "maps",
        ["legend-entry"],
        ["connection-symbol"],
        "the document legend maps the connection symbol to its declared electrical meaning",
        "directed",
        "one-to-many"
      ],
      [
        "symbol-routes-connection",
        "routes",
        ["connection-symbol"],
        ["component-decision"],
        "the resolved symbol meaning routes the proposed motor-driver connection decision",
        "directed",
        "many-to-one"
      ],
      [
        "rating-depends-condition",
        "depends-on",
        ["published-rating"],
        ["operating-note"],
        "the published driver rating depends on its attached operating-condition note",
        "directed",
        "many-to-one"
      ],
      [
        "condition-constrains-decision",
        "constrains",
        ["operating-note"],
        ["component-decision"],
        "the operating-condition note constrains use of the rating in the robot decision",
        "directed",
        "many-to-one"
      ],
      [
        "rating-supports-decision",
        "supports",
        ["published-rating", "operating-note"],
        ["component-decision"],
        "the conditioned rating supports a bounded motor-driver suitability decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "revision-confirmed",
        "boundary",
        "The diagram and datasheet revision apply to the assessed motor-driver variant.",
        ["connection-symbol", "legend-entry", "published-rating"],
        ["legend-maps-symbol", "rating-depends-condition"]
      ],
      [
        "operating-case-matches",
        "criterion",
        "The declared robot case lies within every cited condition attached to the rating.",
        ["published-rating", "operating-note", "component-decision"],
        ["condition-constrains-decision", "rating-supports-decision"]
      ],
      [
        "headline-value-only",
        "assumption",
        "The largest visible driver value is treated as universally available without its notes.",
        ["published-rating", "operating-note", "component-decision"],
        ["rating-depends-condition", "rating-supports-decision"]
      ]
    ],
    failureBoundary: [
      "rating-outside-condition",
      "operating-case-matches",
      "Detaching a rating from its notes removes the boundary that gives the value engineering meaning.",
      "The selected motor driver is justified by a headline value that applies only under a different operating condition.",
      "Use a published value only when its unit, note, revision and operating boundary match the declared robot case.",
      ["published-rating", "operating-note", "component-decision"],
      [
        "rating-depends-condition",
        "condition-constrains-decision",
        "rating-supports-decision"
      ]
    ],
    conceptualModel: [
      [
        "confirm-revision",
        "Confirm that the drawing and datasheet issue match the assessed motor-driver variant.",
        ["connection-symbol", "legend-entry", "published-rating"],
        ["legend-maps-symbol", "rating-depends-condition"],
        ["revision-confirmed"]
      ],
      [
        "resolve-symbol",
        "Resolve each connection symbol through the document legend rather than visual memory.",
        ["legend-entry", "connection-symbol"],
        ["legend-maps-symbol"],
        ["revision-confirmed"]
      ],
      [
        "bind-rating",
        "Read the driver value together with its unit and attached operating-condition note.",
        ["published-rating", "operating-note"],
        ["rating-depends-condition"],
        ["operating-case-matches"]
      ],
      [
        "compare-case",
        "Compare every cited condition with the declared robot operating case.",
        ["operating-note", "component-decision"],
        ["condition-constrains-decision"],
        ["operating-case-matches"]
      ],
      [
        "make-bounded-decision",
        "State whether the evidence supports the connection and rating only for that case.",
        [
          "connection-symbol",
          "published-rating",
          "operating-note",
          "component-decision"
        ],
        ["symbol-routes-connection", "rating-supports-decision"],
        ["revision-confirmed", "operating-case-matches"]
      ]
    ],
    reasonedCases: [
      {
        id: "conditioned-document-example",
        kind: "example",
        scenario:
          "A learner resolves the motor-driver symbol through the applicable diagram legend and cites a table rating together with its unit and operating note before deciding.",
        changedConditionIds: ["revision-confirmed"],
        givens: [
          [
            "declared-robot-case",
            "Assessment case",
            "The robot operating state and driver variant are declared before document lookup.",
            null,
            "component-decision"
          ]
        ],
        reasoningSteps: [
          [
            "example-revision",
            "The applicable document revision is matched to the assessed driver variant.",
            ["connection-symbol", "legend-entry", "published-rating"],
            ["legend-maps-symbol", "rating-depends-condition"],
            ["revision-confirmed"]
          ],
          [
            "example-meaning",
            "The symbol meaning and rating condition are taken from the document rather than memory.",
            [
              "legend-entry",
              "connection-symbol",
              "published-rating",
              "operating-note"
            ],
            ["legend-maps-symbol", "rating-depends-condition"],
            ["revision-confirmed", "operating-case-matches"]
          ],
          [
            "example-decision",
            "The conditioned rating and resolved connection support a decision bounded to the declared robot case.",
            [
              "connection-symbol",
              "published-rating",
              "operating-note",
              "component-decision"
            ],
            [
              "symbol-routes-connection",
              "condition-constrains-decision",
              "rating-supports-decision"
            ],
            ["operating-case-matches"]
          ]
        ],
        outcome:
          "The motor-driver decision is traceable to the applicable symbol meaning and conditioned rating.",
        criterionConditionId: "operating-case-matches",
        criterion:
          "Every cited value and symbol must resolve to the applicable revision and matching operating boundary.",
        verification:
          "Read the citation backwards from the decision to the table row, note, unit, legend and document revision."
      },
      {
        id: "headline-rating-counterexample",
        kind: "counterexample",
        scenario:
          "A learner selects the largest visible motor-driver value and assumes a familiar symbol meaning without reading notes or confirming the hardware revision.",
        changedConditionIds: ["headline-value-only"],
        givens: [
          [
            "isolated-headline",
            "Copied document value",
            "The largest printed driver value is copied without its qualifying note.",
            null,
            "published-rating"
          ]
        ],
        reasoningSteps: [
          [
            "counter-symbol",
            "The connection symbol is interpreted from familiarity rather than the applicable legend.",
            ["legend-entry", "connection-symbol"],
            ["legend-maps-symbol"],
            ["headline-value-only", "revision-confirmed"]
          ],
          [
            "counter-rating",
            "The published rating is detached from the condition that limits its use.",
            ["published-rating", "operating-note"],
            ["rating-depends-condition"],
            ["headline-value-only"]
          ],
          [
            "counter-decision",
            "The unsupported symbol and unconditioned value cannot justify component suitability.",
            [
              "connection-symbol",
              "published-rating",
              "operating-note",
              "component-decision"
            ],
            [
              "symbol-routes-connection",
              "condition-constrains-decision",
              "rating-supports-decision"
            ],
            ["headline-value-only", "operating-case-matches"]
          ]
        ],
        outcome:
          "The document lookup produces an unsafe overclaim rather than a bounded motor-driver decision.",
        criterionConditionId: "operating-case-matches",
        criterion:
          "Return to the applicable revision and re-evaluate the rating with every attached condition.",
        verification:
          "Ask which note, unit, revision and operating boundary support the copied driver value."
      }
    ],
    misconception: {
      id: "headline-rating-is-universal",
      claim:
        "The largest number in a datasheet table is the capability available in any design.",
      mechanism:
        "The number is separated from the units, duration, temperature, supply, configuration and revision that define it.",
      correction:
        "Resolve the applicable revision, read the complete table entry and compare every attached condition with the declared operating case.",
      disconfirmingObservation:
        "The table note places the headline rating outside the robot's declared operating condition.",
      entityIds: [
        "published-rating",
        "operating-note",
        "component-decision",
        "connection-symbol"
      ],
      relationIds: [
        "rating-depends-condition",
        "condition-constrains-decision",
        "rating-supports-decision"
      ],
      conditionIds: ["headline-value-only", "operating-case-matches"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the motor-driver document reading path from revision to decision:",
            "The document path resolves revision and symbol before applying a conditioned driver rating.",
            "The document path currently uses a headline value before its note or skips symbol meaning.",
            "Begin by confirming the applicable motor-driver document revision.",
            "Resolve the connection symbol through the diagram legend.",
            "Bind the published driver rating to its operating-condition note.",
            "Compare the robot case and state a bounded motor-driver suitability decision."
          ),
          focusRef: reasonedCase("conditioned-document-example", "scenario"),
          contextConditionIds: [
            "revision-confirmed",
            "operating-case-matches"
          ],
          steps: [
            [
              "resolve-meaning",
              ["legend-maps-symbol"],
              ["revision-confirmed"]
            ],
            [
              "route-connection",
              ["symbol-routes-connection"],
              ["revision-confirmed"]
            ],
            [
              "bind-condition",
              ["rating-depends-condition", "condition-constrains-decision"],
              ["operating-case-matches"]
            ],
            [
              "support-choice",
              ["rating-supports-decision"],
              ["operating-case-matches"]
            ]
          ],
          correctOrder: [
            "resolve-meaning",
            "route-connection",
            "bind-condition",
            "support-choice"
          ]
        },
        retry: {
          instruction: instruction(
            "Recover a motor-driver decision built from a detached headline value:",
            "The recovery reconnects driver value, operating note, symbol legend and applicable revision.",
            "The recovery still treats the motor-driver headline as universal or trusts symbol resemblance.",
            "Find the table note attached to the copied driver rating.",
            "Confirm which diagram legend applies to the actual motor-driver variant.",
            "Rebind the driver value to its unit and operating condition.",
            "Reassess the robot case before retaining the motor-driver suitability decision."
          ),
          focusRef: reasonedCase("headline-rating-counterexample", "scenario"),
          contextConditionIds: ["headline-value-only", "revision-confirmed"],
          steps: [
            [
              "recover-legend",
              ["legend-maps-symbol"],
              ["revision-confirmed"]
            ],
            [
              "recover-note",
              ["rating-depends-condition"],
              ["headline-value-only"]
            ],
            [
              "reassess-case",
              ["condition-constrains-decision", "rating-supports-decision"],
              ["operating-case-matches"]
            ]
          ],
          correctOrder: ["recover-legend", "recover-note", "reassess-case"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the document evidence that supports the motor-driver decision:",
            "The selected driver evidence includes authoritative symbol meaning and a condition-matched rating.",
            "A selected driver item is detached from its note or assumes the wrong document revision.",
            "Look for the legend entry that defines the motor-driver connection symbol.",
            "Look for the operating note that bounds the published driver rating.",
            "Select the document mapping from legend to connection meaning.",
            "Select the condition-constrained rating path into the component decision."
          ),
          focusRef: term("rated-condition", "definition"),
          contextConditionIds: [
            "revision-confirmed",
            "operating-case-matches"
          ],
          options: [
            [
              "legend-evidence",
              true,
              relation("legend-maps-symbol"),
              condition("revision-confirmed"),
              ["legend-maps-symbol", "symbol-routes-connection"],
              ["revision-confirmed"],
              null
            ],
            [
              "conditioned-rating",
              true,
              relation("rating-supports-decision"),
              condition("operating-case-matches"),
              [
                "rating-depends-condition",
                "condition-constrains-decision",
                "rating-supports-decision"
              ],
              ["operating-case-matches"],
              null
            ],
            [
              "largest-number",
              false,
              misconception("headline-rating-is-universal", "claim"),
              misconception("headline-rating-is-universal", "mechanism"),
              ["rating-supports-decision"],
              ["headline-value-only"],
              "headline-rating-is-universal"
            ],
            [
              "familiar-symbol",
              false,
              term("document-legend", "boundary"),
              reasonedCase("conditioned-document-example", "criterion"),
              ["legend-maps-symbol"],
              ["revision-confirmed"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose the document-reading failures behind an unsupported driver choice:",
            "The diagnosis exposes a detached rating, unverified revision and guessed symbol meaning.",
            "The diagnosis rejects valid motor-driver evidence or treats the robot case as irrelevant.",
            "Check whether the copied driver value retains every qualifying note.",
            "Check whether the connection symbol resolves in the applicable legend.",
            "Flag the missing operating condition as a rating failure.",
            "Flag the unconfirmed motor-driver revision as a symbol-mapping failure."
          ),
          focusRef: reasonedCase("headline-rating-counterexample", "verification"),
          contextConditionIds: ["headline-value-only", "revision-confirmed"],
          options: [
            [
              "detached-note",
              true,
              condition("headline-value-only"),
              relation("rating-depends-condition"),
              ["rating-depends-condition", "condition-constrains-decision"],
              ["headline-value-only"],
              null
            ],
            [
              "wrong-revision",
              true,
              condition("revision-confirmed"),
              relation("legend-maps-symbol"),
              ["legend-maps-symbol", "symbol-routes-connection"],
              ["revision-confirmed"],
              null
            ],
            [
              "unsupported-choice",
              true,
              reasonedCase("headline-rating-counterexample", "outcome"),
              relation("rating-supports-decision"),
              ["rating-supports-decision"],
              ["headline-value-only", "operating-case-matches"],
              null
            ],
            [
              "headline-proof",
              false,
              misconception("headline-rating-is-universal", "claim"),
              misconception("headline-rating-is-universal", "mechanism"),
              ["rating-depends-condition", "rating-supports-decision"],
              ["headline-value-only"],
              "headline-rating-is-universal"
            ],
            [
              "drop-notes",
              false,
              term("rated-condition", "boundary"),
              reasonedCase("headline-rating-counterexample", "criterion"),
              ["condition-constrains-decision"],
              ["operating-case-matches"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why a motor-driver headline value cannot be used alone:",
            "The explanation joins applicable revision, document legend and matched operating condition.",
            "The explanation omits a driver evidence group or treats the largest number as universal.",
            "State why the motor-driver revision must match the assessed variant.",
            "Describe how the diagram legend fixes connection-symbol meaning.",
            "Explain how the operating note bounds the published driver rating.",
            "Compare the complete driver evidence with the declared robot case."
          ),
          focusRef: misconception("headline-rating-is-universal", "claim"),
          contextConditionIds: ["headline-value-only", "operating-case-matches"],
          conceptGroups: [
            [
              "revision-group",
              term("applicable-revision", "label"),
              [term("applicable-revision", "definition")],
              ["legend-maps-symbol"],
              ["revision-confirmed"]
            ],
            [
              "legend-group",
              term("document-legend", "label"),
              [term("document-legend", "definition")],
              ["legend-maps-symbol", "symbol-routes-connection"],
              ["revision-confirmed"]
            ],
            [
              "rating-group",
              term("rated-condition", "label"),
              [term("rated-condition", "definition")],
              [
                "rating-depends-condition",
                "condition-constrains-decision"
              ],
              ["operating-case-matches"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["rating-supports-decision"],
          criterionConditionId: "operating-case-matches"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match each motor-driver document relation to its interpretation boundary:",
            "The driver matches now pair symbol, rating and decision with applicable conditions.",
            "One driver match links document evidence to the wrong technical boundary.",
            "Pair legend-to-symbol mapping with the confirmed revision.",
            "Pair rating-to-condition dependence with the matched robot case.",
            "Connect the motor-driver symbol to its bounded connection decision.",
            "Connect the conditioned driver rating to suitability evidence."
          ),
          focusRef: reasonedCase("conditioned-document-example", "scenario"),
          contextConditionIds: [
            "revision-confirmed",
            "operating-case-matches"
          ],
          pairs: [
            [
              "legend-pair",
              relation("legend-maps-symbol"),
              condition("revision-confirmed"),
              relation("legend-maps-symbol"),
              ["legend-maps-symbol"],
              ["revision-confirmed"]
            ],
            [
              "condition-pair",
              relation("rating-depends-condition"),
              condition("operating-case-matches"),
              relation("rating-depends-condition"),
              ["rating-depends-condition", "condition-constrains-decision"],
              ["operating-case-matches"]
            ],
            [
              "decision-pair",
              relation("rating-supports-decision"),
              term("rated-condition", "boundary"),
              relation("rating-supports-decision"),
              ["rating-supports-decision"],
              ["operating-case-matches"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the driver-document graph when a rating note does not match the robot case:",
            "The driver implication withholds suitability while preserving the published value as conditioned information.",
            "The driver implication discards the document or applies the headline value without its note.",
            "Trace the published driver rating into the operating-condition note.",
            "Use the robot-case criterion at the motor-driver suitability decision.",
            "Locate where the operating note blocks use of the driver rating.",
            "Reject only the unsupported suitability claim, not the documented rating itself."
          ),
          focusRef: reasonedCase("headline-rating-counterexample", "outcome"),
          contextConditionIds: ["headline-value-only", "operating-case-matches"],
          positions: [
            ["published-rating", 0, 0],
            ["operating-note", 1, 0],
            ["component-decision", 2, 0],
            ["connection-symbol", 1, 1]
          ],
          relationIds: [
            "rating-depends-condition",
            "condition-constrains-decision",
            "rating-supports-decision"
          ],
          answerRelationIds: ["condition-constrains-decision"],
          options: [
            [
              "withhold-suitability",
              true,
              reasonedCase("headline-rating-counterexample", "verification"),
              condition("operating-case-matches"),
              ["condition-constrains-decision", "rating-supports-decision"],
              ["headline-value-only", "operating-case-matches"],
              null
            ],
            [
              "apply-headline",
              false,
              misconception("headline-rating-is-universal", "claim"),
              misconception("headline-rating-is-universal", "mechanism"),
              ["rating-supports-decision"],
              ["headline-value-only"],
              "headline-rating-is-universal"
            ],
            [
              "erase-rating",
              false,
              term("rated-condition", "boundary"),
              reasonedCase("conditioned-document-example", "criterion"),
              ["rating-depends-condition"],
              ["operating-case-matches"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the complete driver-document path after revision and conditions are confirmed:",
            "The driver path supports a bounded connection and suitability decision for the declared robot case.",
            "The driver path claims universal capability or substitutes symbol familiarity for the legend.",
            "Follow the applicable legend into the motor-driver connection symbol.",
            "Follow the conditioned driver rating into the component decision.",
            "Confirm that symbol meaning and rating condition share the applicable revision.",
            "Approve the motor-driver use only within the matched operating case."
          ),
          focusRef: reasonedCase("conditioned-document-example", "outcome"),
          contextConditionIds: [
            "revision-confirmed",
            "operating-case-matches"
          ],
          positions: [
            ["legend-entry", 0, 1],
            ["connection-symbol", 1, 1],
            ["published-rating", 1, 2],
            ["operating-note", 2, 2],
            ["component-decision", 3, 1]
          ],
          relationIds: [
            "legend-maps-symbol",
            "symbol-routes-connection",
            "rating-depends-condition",
            "rating-supports-decision"
          ],
          answerRelationIds: ["rating-supports-decision"],
          options: [
            [
              "approve-bounded",
              true,
              reasonedCase("conditioned-document-example", "verification"),
              condition("operating-case-matches"),
              ["symbol-routes-connection", "rating-supports-decision"],
              ["revision-confirmed", "operating-case-matches"],
              null
            ],
            [
              "universal-rating",
              false,
              term("rated-condition", "boundary"),
              reasonedCase("conditioned-document-example", "criterion"),
              ["rating-supports-decision"],
              ["operating-case-matches"],
              null
            ],
            [
              "guess-symbol",
              false,
              misconception("headline-rating-is-universal", "claim"),
              misconception(
                "headline-rating-is-universal",
                "disconfirmingObservation"
              ),
              ["legend-maps-symbol", "rating-supports-decision"],
              ["headline-value-only", "revision-confirmed"],
              "headline-rating-is-universal"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("rated-condition", "label"),
      focusRef: reasonedCase("conditioned-document-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["legend-entry", 0, 0],
        ["connection-symbol", 1, 0],
        ["published-rating", 1, 1],
        ["operating-note", 2, 1],
        ["component-decision", 3, 0]
      ],
      visibleEntityIds: [
        "legend-entry",
        "connection-symbol",
        "published-rating",
        "operating-note",
        "component-decision"
      ],
      visibleRelationIds: [
        "legend-maps-symbol",
        "symbol-routes-connection",
        "rating-depends-condition",
        "condition-constrains-decision",
        "rating-supports-decision"
      ],
      controls: [
        [
          "legend-view",
          term("document-legend", "label"),
          ["revision-confirmed"],
          ["legend-entry", "connection-symbol", "component-decision"],
          ["legend-maps-symbol", "symbol-routes-connection"],
          [],
          [],
          [
            [
              "resolved-symbol",
              "The applicable legend supplies the motor-driver connection meaning.",
              ["legend-entry", "connection-symbol"],
              ["legend-maps-symbol"]
            ]
          ],
          reasonedCase("conditioned-document-example", "verification")
        ],
        [
          "condition-view",
          term("rated-condition", "label"),
          ["operating-case-matches"],
          ["published-rating", "operating-note", "component-decision"],
          [
            "rating-depends-condition",
            "condition-constrains-decision",
            "rating-supports-decision"
          ],
          ["legend-maps-symbol"],
          [],
          [
            [
              "conditioned-value",
              "The driver value reaches the decision only with its matching note.",
              ["published-rating", "operating-note", "component-decision"],
              ["rating-depends-condition", "rating-supports-decision"]
            ]
          ],
          reasonedCase("conditioned-document-example", "verification")
        ]
      ]
    }
  }
] satisfies readonly AcademyLessonTeachingProfileV2CompactPlan[];

const seeds = materialiseAcademyLessonTeachingProfileV2Registry(
  expectedLessonIds,
  plans
);
const expanded: Record<string, AcademyLessonTeachingProfileV2> = {};
expectedLessonIds.forEach((lessonId) => {
  const seed = seeds[lessonId];
  if (!seed) {
    throw new Error(`Missing materialised lesson teaching profile ${lessonId}.`);
  }
  expanded[lessonId] = expandAcademyLessonTeachingProfileV2Seed(seed);
});

const registry: AcademyLessonTeachingProfileV2Registry =
  Object.freeze(expanded);

export default registry;
