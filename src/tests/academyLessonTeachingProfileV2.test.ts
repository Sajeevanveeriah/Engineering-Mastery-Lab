import { describe, expect, it } from "vitest";
import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyLessonTeachingProfileV2Seed
} from "../data/academy/lessonTeachingProfileV2";
import {
  AcademyLessonProfileV2ValidationError,
  academyLessonTeachingProfileV2InformationSignature,
  expandAcademyLessonTeachingProfileV2Seed,
  normaliseAcademyAssessmentV2Shell,
  profileUsesRejectedGenericShell,
  validateAcademyLessonTeachingProfileV2,
  validateAcademyLessonTeachingProfileV2Registry,
  validateAcademyLessonTeachingProfileV2Seed
} from "../data/academy/lessonTeachingProfileV2Validation";

const feedback = (subject: string) => ({
  feedbackCorrect: `Correct. ${subject} follows the declared domain relationship.`,
  feedbackIncorrect: `Recheck the entities, conditions and relation that govern ${subject}.`,
  hints: [
    `Identify the condition that changes ${subject}.`,
    `Trace the declared relation before deciding ${subject}.`
  ],
  solution: [
    `Resolve the relevant domain entities for ${subject}.`,
    `Apply the declared relation and compare the result with its criterion for ${subject}.`
  ]
});

const validProfileSeed = (): AcademyLessonTeachingProfileV2Seed => ({
  schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  lessonId: "EML-E0-D01-L01",
  systemModel:
    "An unaided robotics explanation reveals a knowledge gap, targeted corrective feedback changes the explanation and a delayed no-notes check tests retention.",
  failurePattern:
    "Prompted recognition can appear fluent while the learner cannot reconstruct the robotics mechanism after a delay.",
  visualExplanation:
    "A learning loop connects a robotics question, unaided recall, corrective feedback, a revised explanation and a delayed retention decision.",
  applicationTask:
    "Record a no-notes explanation of a robotics sensing concept, correct the first missing mechanism and compare a delayed answer with the original gap.",
  terms: [
    [
      "retrieval",
      "Unaided retrieval",
      "Reconstruction of the robotics explanation before feedback is shown.",
      "A prompted or copied answer is outside the unaided retrieval boundary.",
      "question-to-recall"
    ],
    [
      "retention",
      "Delayed retention",
      "Reconstruction that remains available after a declared delay.",
      "An immediate corrected answer alone does not establish delayed retention.",
      "recall-to-check"
    ]
  ],
  entities: [
    [
      "robotics-question",
      "input",
      "Robotics mechanism question",
      "A bounded prompt asking how the sensing mechanism changes the decision."
    ],
    [
      "unaided-recall",
      "state",
      "Unaided mechanism recall",
      "The explanation reconstructed before notes or corrective prompts."
    ],
    [
      "corrective-feedback",
      "mechanism",
      "Targeted corrective feedback",
      "Feedback directed at the first missing causal link."
    ],
    [
      "delayed-check",
      "observation",
      "Delayed no-notes check",
      "A later explanation recorded under the same no-notes boundary."
    ],
    [
      "retention-decision",
      "decision",
      "Retention decision",
      "The decision to retain or revisit the robotics concept."
    ]
  ],
  relations: [
    [
      "question-prompts-recall",
      "causes",
      ["robotics-question"],
      ["unaided-recall"],
      "prompts reconstruction before feedback",
      "directed",
      "one-to-one"
    ],
    [
      "recall-reveals-gap",
      "measures",
      ["unaided-recall"],
      ["corrective-feedback"],
      "reveals the first missing causal link",
      "directed",
      "one-to-one"
    ],
    [
      "feedback-revises-recall",
      "feeds-back",
      ["corrective-feedback"],
      ["unaided-recall"],
      "changes the next reconstructed explanation",
      "directed",
      "one-to-one"
    ],
    [
      "recall-compares-check",
      "compares",
      ["unaided-recall"],
      ["delayed-check"],
      "compares immediate reconstruction with delayed reconstruction",
      "undirected",
      "one-to-one"
    ],
    [
      "check-supports-decision",
      "supports",
      ["delayed-check"],
      ["retention-decision"],
      "supports retention only when the causal link remains reconstructable",
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
      "A worked explanation remains visible while the learner answers.",
      ["unaided-recall"],
      ["question-prompts-recall"]
    ]
  ],
  failureBoundary: [
    "recognition-failure",
    "declared-delay",
    "Visible prompts support recognition but do not exercise unaided reconstruction.",
    "The delayed answer omits the sensing mechanism or cannot connect it to the decision.",
    "Retain the concept only when the delayed no-notes explanation reconstructs the causal link.",
    ["unaided-recall", "delayed-check", "retention-decision"],
    ["recall-compares-check", "check-supports-decision"]
  ],
  conceptualModel: [
    [
      "question-to-recall",
      "Ask the bounded robotics question before opening the worked explanation.",
      ["robotics-question", "unaided-recall"],
      ["question-prompts-recall"],
      ["no-notes"]
    ],
    [
      "locate-causal-gap",
      "Compare the unaided explanation with the mechanism and locate the first missing causal link.",
      ["unaided-recall", "corrective-feedback"],
      ["recall-reveals-gap"],
      ["no-notes"]
    ],
    [
      "revise-explanation",
      "Apply feedback only to the missing link, then reconstruct the complete mechanism again.",
      ["corrective-feedback", "unaided-recall"],
      ["feedback-revises-recall"],
      ["no-notes"]
    ],
    [
      "recall-to-check",
      "Repeat the reconstruction after the declared delay and compare both explanations.",
      ["unaided-recall", "delayed-check"],
      ["recall-compares-check"],
      ["declared-delay"]
    ],
    [
      "check-to-decision",
      "Retain or revisit the concept from the delayed mechanism evidence.",
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
        "A learner explains how an encoder pulse changes the estimated wheel displacement.",
      changedConditionIds: ["no-notes"],
      givens: [
        [
          "baseline-explanation",
          "Initial mechanism explanation",
          "Encoder pulses are counted but wheel circumference is omitted.",
          null,
          "unaided-recall"
        ]
      ],
      reasoningSteps: [
        [
          "example-gap",
          "The first explanation exposes the missing pulse-to-distance relation.",
          ["unaided-recall", "corrective-feedback"],
          ["recall-reveals-gap"],
          ["no-notes"]
        ],
        [
          "example-feedback",
          "Feedback restores the missing circumference relation without supplying the whole answer.",
          ["corrective-feedback", "unaided-recall"],
          ["feedback-revises-recall"],
          ["no-notes"]
        ],
        [
          "example-delay",
          "The delayed explanation reconstructs pulse count, circumference and displacement.",
          ["unaided-recall", "delayed-check"],
          ["recall-compares-check"],
          ["declared-delay"]
        ]
      ],
      outcome: "The delayed explanation retains the complete encoder mechanism.",
      criterionConditionId: "declared-delay",
      criterion:
        "The delayed no-notes response must reconstruct the pulse-to-distance link.",
      verification:
        "Compare the causal links in the baseline and delayed explanations without using confidence ratings."
    },
    {
      id: "prompted-counterexample",
      kind: "counterexample",
      scenario:
        "A worked encoder explanation remains visible during every answer attempt.",
      changedConditionIds: ["prompt-visible"],
      givens: [
        [
          "visible-solution",
          "Prompt state",
          "The complete pulse-to-distance explanation remains on screen.",
          null,
          "unaided-recall"
        ]
      ],
      reasoningSteps: [
        [
          "counter-prompt",
          "The visible solution changes the task from reconstruction to recognition.",
          ["robotics-question", "unaided-recall"],
          ["question-prompts-recall"],
          ["prompt-visible"]
        ],
        [
          "counter-gap-hidden",
          "Recognition hides whether the learner can supply the missing causal link.",
          ["unaided-recall", "corrective-feedback"],
          ["recall-reveals-gap"],
          ["prompt-visible"]
        ],
        [
          "counter-delay",
          "A later no-notes attempt can still omit wheel circumference despite fluent prompted answers.",
          ["unaided-recall", "delayed-check"],
          ["recall-compares-check"],
          ["declared-delay", "prompt-visible"]
        ]
      ],
      outcome: "The prompted attempts do not establish delayed retention.",
      criterionConditionId: "declared-delay",
      criterion:
        "A no-notes delayed answer must reconstruct the mechanism before retention is accepted.",
      verification:
        "Remove the worked explanation and repeat the same mechanism question after the declared interval."
    }
  ],
  misconception: {
    id: "fluency-is-retention",
    claim: "A fluent answer beside the worked explanation proves retention.",
    mechanism:
      "Visible wording cues recognition and bypasses unaided reconstruction of the causal link.",
    correction:
      "Remove the prompt, reconstruct the mechanism and repeat the check after a declared delay.",
    disconfirmingObservation:
      "The learner omits wheel circumference when the same encoder question is asked without notes.",
    entityIds: ["robotics-question", "unaided-recall", "delayed-check"],
    relationIds: ["question-prompts-recall", "recall-compares-check"],
    conditionIds: ["prompt-visible", "declared-delay"]
  },
  assessments: {
    q2: {
      base: {
        prompt:
          "Order the encoder learning steps from the unaided question to the delayed retention decision.",
        contextConditionIds: ["no-notes", "declared-delay"],
        steps: [
          [
            "ask-question",
            "Ask for the pulse-to-distance mechanism without notes.",
            "The question must precede corrective feedback.",
            ["robotics-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["no-notes"]
          ],
          [
            "find-gap",
            "Locate the first missing encoder relation.",
            "The unaided explanation reveals the bounded gap.",
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"]
          ],
          [
            "apply-feedback",
            "Correct the missing relation and reconstruct the explanation.",
            "Targeted feedback changes the next recall state.",
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["no-notes"]
          ],
          [
            "delay-check",
            "Repeat the no-notes mechanism explanation after the interval.",
            "The delayed comparison determines retention.",
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["recall-compares-check", "check-supports-decision"],
            ["declared-delay"]
          ]
        ],
        correctOrder: ["ask-question", "find-gap", "apply-feedback", "delay-check"],
        ...feedback("the encoder retention workflow")
      },
      retry: {
        prompt:
          "Order the recovery steps after a prompted encoder answer fails the delayed no-notes check.",
        contextConditionIds: ["prompt-visible", "declared-delay"],
        steps: [
          [
            "remove-prompt",
            "Remove the visible worked encoder explanation.",
            "The prompt-visible assumption must be removed first.",
            ["robotics-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"]
          ],
          [
            "reconstruct-cause",
            "Reconstruct the pulse, circumference and displacement link.",
            "Unaided recall now exposes the actual causal gap.",
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"]
          ],
          [
            "target-feedback",
            "Correct only the first missing causal link.",
            "Feedback changes the next reconstruction without replacing it.",
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["no-notes"]
          ],
          [
            "repeat-delay",
            "Repeat the no-notes check after the declared interval.",
            "The delayed evidence supports or rejects retention.",
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["recall-compares-check", "check-supports-decision"],
            ["declared-delay"]
          ]
        ],
        correctOrder: [
          "remove-prompt",
          "reconstruct-cause",
          "target-feedback",
          "repeat-delay"
        ],
        ...feedback("the prompted-answer recovery workflow")
      }
    },
    q3: {
      base: {
        prompt:
          "Select the records that demonstrate delayed encoder-mechanism retention.",
        contextConditionIds: ["no-notes", "declared-delay"],
        options: [
          [
            "baseline",
            "The unaided baseline identifies the missing pulse-to-distance link.",
            true,
            "This record exposes the mechanism gap before feedback.",
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"],
            null
          ],
          [
            "delayed",
            "The delayed no-notes explanation reconstructs pulse count, circumference and displacement.",
            true,
            "This observation directly meets the retention criterion.",
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["recall-compares-check", "check-supports-decision"],
            ["declared-delay"],
            null
          ],
          [
            "fluent",
            "The answer was fluent while the worked explanation remained visible.",
            false,
            "Prompted fluency does not test reconstruction.",
            ["robotics-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"],
            "fluency-is-retention"
          ],
          [
            "confidence",
            "The learner reports high confidence immediately after reading.",
            false,
            "Confidence is not a delayed mechanism observation.",
            ["unaided-recall", "retention-decision"],
            ["check-supports-decision"],
            ["prompt-visible"],
            null
          ]
        ],
        ...feedback("the delayed retention record")
      },
      retry: {
        prompt:
          "Select the findings that require the encoder concept to be revisited.",
        contextConditionIds: ["prompt-visible", "declared-delay"],
        options: [
          [
            "omission",
            "The delayed answer omits wheel circumference.",
            true,
            "The observable consequence matches the failure boundary.",
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["declared-delay"],
            null
          ],
          [
            "prompt-dependence",
            "The complete mechanism appears only while the solution is visible.",
            true,
            "The changed prompt condition exposes recognition dependence.",
            ["robotics-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"],
            "fluency-is-retention"
          ],
          [
            "retained",
            "The later no-notes answer reconstructs every causal link.",
            false,
            "This finding supports retention rather than revision.",
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"],
            null
          ],
          [
            "targeted",
            "Feedback was limited to the first missing relation.",
            false,
            "Targeted feedback does not itself prove failure.",
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["no-notes"],
            null
          ],
          [
            "comparison",
            "The baseline and delayed explanations are retained for comparison.",
            false,
            "A reviewable comparison is supporting process evidence.",
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["declared-delay"],
            null
          ]
        ],
        ...feedback("the encoder revision decision")
      }
    },
    q4: {
      base: {
        kind: "short-response",
        prompt:
          "Explain why a prompted encoder answer cannot establish delayed mechanism retention.",
        contextConditionIds: ["prompt-visible", "declared-delay"],
        conceptGroups: [
          [
            "recognition",
            "Prompted recognition",
            ["prompted recognition", "visible wording cue"],
            ["robotics-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"]
          ],
          [
            "mechanism",
            "Pulse-to-distance causal link",
            ["pulse-to-distance link", "wheel circumference relation"],
            ["unaided-recall", "corrective-feedback"],
            ["recall-reveals-gap"],
            ["no-notes"]
          ],
          [
            "delay",
            "Delayed no-notes comparison",
            ["delayed no-notes check", "delayed reconstruction"],
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["declared-delay"]
          ]
        ],
        minimumConceptGroups: 3,
        requiredRelationIds: ["recall-compares-check"],
        criterionConditionId: "declared-delay",
        exemplarResponse:
          "Prompted recognition can copy the visible wording without reconstructing the pulse-to-distance link, so retention requires a delayed no-notes comparison.",
        ...feedback("the prompted-recognition explanation")
      },
      retry: {
        kind: "short-response",
        prompt:
          "Explain what evidence justifies retaining the encoder mechanism after corrective feedback.",
        contextConditionIds: ["no-notes", "declared-delay"],
        conceptGroups: [
          [
            "targeted-correction",
            "Targeted causal correction",
            ["targeted corrective feedback", "first missing causal link"],
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["no-notes"]
          ],
          [
            "complete-mechanism",
            "Complete encoder mechanism",
            ["pulse count and circumference", "pulse-to-distance mechanism"],
            ["robotics-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["no-notes"]
          ],
          [
            "retention-check",
            "Delayed retention check",
            ["delayed no-notes explanation", "delayed mechanism check"],
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["declared-delay"]
          ],
          [
            "decision",
            "Evidence-based retention decision",
            ["retention decision", "retain the concept"],
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"]
          ]
        ],
        minimumConceptGroups: 3,
        requiredRelationIds: ["feedback-revises-recall", "check-supports-decision"],
        criterionConditionId: "declared-delay",
        exemplarResponse:
          "Targeted feedback restores the pulse-to-distance mechanism, but retention is justified only when a delayed no-notes explanation supports the retention decision.",
        ...feedback("the retained encoder mechanism")
      }
    },
    q5: {
      base: {
        kind: "diagram",
        prompt:
          "Which implication follows when the delayed no-notes check omits wheel circumference?",
        contextConditionIds: ["no-notes", "declared-delay"],
        positions: [
          ["robotics-question", 0, 0],
          ["unaided-recall", 1, 0],
          ["corrective-feedback", 1, 1],
          ["delayed-check", 2, 0]
        ],
        relationIds: [
          "question-prompts-recall",
          "recall-reveals-gap",
          "feedback-revises-recall",
          "recall-compares-check"
        ],
        answerRelationIds: ["recall-compares-check"],
        options: [
          [
            "revisit",
            "The missing causal link blocks retention and the encoder explanation must be revisited.",
            true,
            "The delayed comparison exposes the declared failure consequence.",
            ["unaided-recall", "delayed-check"],
            ["recall-compares-check"],
            ["declared-delay"],
            null
          ],
          [
            "accept-prompt",
            "The earlier prompted fluency is sufficient to retain the concept.",
            false,
            "This repeats the recognition misconception.",
            ["robotics-question", "unaided-recall"],
            ["question-prompts-recall"],
            ["prompt-visible"],
            "fluency-is-retention"
          ],
          [
            "ignore-delay",
            "The delayed omission can be ignored because feedback was previously shown.",
            false,
            "Feedback does not replace the delayed criterion.",
            ["corrective-feedback", "delayed-check"],
            ["feedback-revises-recall", "recall-compares-check"],
            ["declared-delay"],
            null
          ]
        ],
        textEquivalent:
          "The robotics question prompts unaided recall, the gap selects corrective feedback and the revised explanation is compared with a delayed no-notes check.",
        ...feedback("the delayed diagram implication")
      },
      retry: {
        kind: "diagram",
        prompt:
          "Which implication follows when the revised explanation survives the delayed check?",
        contextConditionIds: ["no-notes", "declared-delay"],
        positions: [
          ["corrective-feedback", 0, 1],
          ["unaided-recall", 1, 1],
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
            "The delayed reconstruction supports retention within the declared no-notes boundary.",
            true,
            "The observed mechanism meets the retention criterion.",
            ["unaided-recall", "delayed-check", "retention-decision"],
            ["recall-compares-check", "check-supports-decision"],
            ["no-notes", "declared-delay"],
            null
          ],
          [
            "unbounded",
            "The concept is permanently mastered under every prompt condition.",
            false,
            "The result is bounded to the declared conditions.",
            ["delayed-check", "retention-decision"],
            ["check-supports-decision"],
            ["declared-delay"],
            null
          ],
          [
            "feedback-alone",
            "Showing corrective feedback alone proves retention.",
            false,
            "The delayed observation remains necessary.",
            ["corrective-feedback", "unaided-recall"],
            ["feedback-revises-recall"],
            ["prompt-visible"],
            "fluency-is-retention"
          ]
        ],
        textEquivalent:
          "Corrective feedback changes unaided recall, the revised explanation is compared after a delay and the delayed observation supports the bounded retention decision.",
        ...feedback("the retained diagram implication")
      }
    }
  },
  explorer: {
    title: "Encoder mechanism retention state graph",
    description:
      "Change the prompt and delay conditions to inspect how the evidence path and retention decision change.",
    modelKind: "state-graph",
    controls: [
      {
        id: "unaided-state",
        label: "No-notes reconstruction",
        changedConditionIds: ["no-notes"],
        state: {
          kind: "state-graph",
          positions: [
            ["robotics-question", 0, 0],
            ["unaided-recall", 1, 0],
            ["corrective-feedback", 1, 1],
            ["delayed-check", 2, 0],
            ["retention-decision", 3, 0]
          ],
          visibleEntityIds: [
            "robotics-question",
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
          activeEntityIds: ["robotics-question", "unaided-recall"],
          activeRelationIds: ["question-prompts-recall", "recall-reveals-gap"],
          suppressedRelationIds: [],
          reversedRelationIds: [],
          annotations: [
            [
              "gap-visible",
              "The first missing causal link is observable.",
              ["unaided-recall", "corrective-feedback"],
              ["recall-reveals-gap"]
            ]
          ]
        },
        outcome:
          "Removing prompts makes the missing encoder mechanism observable before feedback.",
        requiredAction:
          "Record the unaided explanation and identify the first missing causal link.",
        retainedEvidence:
          "Keep the exact baseline wording and the relation selected for correction.",
        textEquivalent:
          "The no-notes state activates the question-to-recall and gap-revelation relations; no relation is suppressed."
      },
      {
        id: "delayed-state",
        label: "Delayed retention comparison",
        changedConditionIds: ["declared-delay"],
        state: {
          kind: "state-graph",
          positions: [
            ["robotics-question", 0, 0],
            ["unaided-recall", 1, 0],
            ["corrective-feedback", 1, 1],
            ["delayed-check", 2, 0],
            ["retention-decision", 3, 0]
          ],
          visibleEntityIds: [
            "robotics-question",
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
              "criterion-applied",
              "The delayed mechanism is compared before retention is accepted.",
              ["delayed-check", "retention-decision"],
              ["check-supports-decision"]
            ]
          ]
        },
        outcome:
          "The delayed check becomes the active evidence and earlier feedback no longer decides retention by itself.",
        requiredAction:
          "Compare the delayed no-notes mechanism with the baseline gap.",
        retainedEvidence:
          "Keep both explanations and the bounded retention decision.",
        textEquivalent:
          "The delayed state activates comparison and decision relations and marks the feedback-to-recall relation as suppressed for the final decision."
      }
    ]
  }
});

const issueCodes = (action: () => unknown) => {
  try {
    action();
    return [];
  } catch (error) {
    if (!(error instanceof AcademyLessonProfileV2ValidationError)) throw error;
    return error.issues.map((issue) => issue.code);
  }
};

describe("Academy lesson teaching profile V2 contract", () => {
  it("losslessly expands one explicit lesson-owned profile and passes both gates", () => {
    const seed = validProfileSeed();
    expect(validateAcademyLessonTeachingProfileV2Seed(seed)).toEqual([]);
    const profile = expandAcademyLessonTeachingProfileV2Seed(seed);
    expect(validateAcademyLessonTeachingProfileV2(profile)).toEqual([]);
    expect(profile.terms[0]).toMatchObject({
      termId: "retrieval",
      firstUseStepId: "question-to-recall"
    });
    expect(profile.relations[3]).toMatchObject({
      relationId: "recall-compares-check",
      direction: "undirected"
    });
    expect(profile.assessments.q4.base.kind).toBe("short-response");
    expect(profile.explorer.controls.map((control) => control.state.kind))
      .toEqual(["state-graph", "state-graph"]);
    expect(profileUsesRejectedGenericShell(profile)).toBe(false);
  });

  it("fails raw omissions, tuple truncation and tuple-position type changes before expansion", () => {
    const missing = structuredClone(validProfileSeed()) as unknown as Record<string, unknown>;
    delete missing.entities;
    expect(validateAcademyLessonTeachingProfileV2Seed(missing)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "v2-seed-required-field" })
      ])
    );

    const truncated = structuredClone(validProfileSeed()) as unknown as {
      terms: unknown[][];
    };
    truncated.terms[0] = truncated.terms[0].slice(0, 4);
    expect(validateAcademyLessonTeachingProfileV2Seed(truncated)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "v2-seed-tuple-shape" })
      ])
    );

    const shifted = structuredClone(validProfileSeed()) as unknown as {
      relations: unknown[][];
    };
    shifted.relations[0][2] = "robotics-question";
    expect(validateAcademyLessonTeachingProfileV2Seed(shifted)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "v2-seed-field-type" })
      ])
    );
  });

  it("fails closed on orphan references, generic meta entities and missing lesson depth", () => {
    const orphan = structuredClone(validProfileSeed()) as unknown as {
      relations: unknown[][];
    };
    orphan.relations[0][2] = ["missing-entity"];
    expect(issueCodes(() => expandAcademyLessonTeachingProfileV2Seed(orphan)))
      .toContain("v2-domain-reference");

    const generic = structuredClone(validProfileSeed());
    generic.entities = [
      ["system", "state", "System", "Generic system role."],
      ["application", "input", "Application", "Generic application role."],
      ["relationship", "mechanism", "Relationship", "Generic relationship role."],
      ["failure", "observation", "Failure", "Generic failure role."],
      ["decision", "decision", "Decision", "Generic decision role."]
    ];
    expect(issueCodes(() => expandAcademyLessonTeachingProfileV2Seed(generic)))
      .toContain("v2-generic-domain-model");

    const shallow = structuredClone(validProfileSeed());
    shallow.conceptualModel = shallow.conceptualModel.slice(0, 3);
    shallow.reasonedCases = shallow.reasonedCases.slice(0, 1);
    const shallowCodes = issueCodes(
      () => expandAcademyLessonTeachingProfileV2Seed(shallow)
    );
    expect(shallowCodes).toContain("v2-conceptual-model");
    expect(shallowCodes).toContain("v2-reasoned-cases");
  });

  it("rejects the current generic assessment shells and weak short-response grader", () => {
    const generic = expandAcademyLessonTeachingProfileV2Seed(validProfileSeed());
    generic.assessments.q2.base.steps.forEach((step, index) => {
      step.label = [
        "Observe and bound the need",
        "Select a concept or model",
        "Apply a check or test",
        "Interpret and retain evidence"
      ][index] ?? step.label;
    });
    expect(profileUsesRejectedGenericShell(generic)).toBe(true);
    expect(validateAcademyLessonTeachingProfileV2(generic)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "v2-generic-question-shell" })
      ])
    );

    const weakQ4 = structuredClone(validProfileSeed());
    if (weakQ4.assessments.q4.base.kind !== "short-response") {
      throw new Error("Expected short-response fixture.");
    }
    weakQ4.assessments.q4.base.conceptGroups =
      weakQ4.assessments.q4.base.conceptGroups.slice(0, 2);
    weakQ4.assessments.q4.base.minimumConceptGroups = 2;
    weakQ4.assessments.q4.base.requiredRelationIds = [];
    expect(issueCodes(() => expandAcademyLessonTeachingProfileV2Seed(weakQ4)))
      .toContain("v2-q4-contract");
  });

  it("rejects copied diagram labels, duplicate retries and text-only state changes", () => {
    const copied = structuredClone(validProfileSeed()) as unknown as {
      assessments: {
        q5: {
          base: {
            options: unknown[][];
          };
        };
      };
    };
    copied.assessments.q5.base.options[0][1] =
      "compares immediate reconstruction with delayed reconstruction";
    expect(issueCodes(() => expandAcademyLessonTeachingProfileV2Seed(copied)))
      .toContain("v2-diagram-answer-copy");

    const duplicateRetry = structuredClone(validProfileSeed());
    duplicateRetry.assessments.q2.retry =
      structuredClone(duplicateRetry.assessments.q2.base);
    expect(issueCodes(
      () => expandAcademyLessonTeachingProfileV2Seed(duplicateRetry)
    )).toContain("v2-base-retry-duplicate");

    const duplicateVisual = structuredClone(validProfileSeed());
    duplicateVisual.explorer.controls[1].state =
      structuredClone(duplicateVisual.explorer.controls[0].state);
    duplicateVisual.explorer.controls[1].textEquivalent =
      duplicateVisual.explorer.controls[0].textEquivalent;
    expect(issueCodes(
      () => expandAcademyLessonTeachingProfileV2Seed(duplicateVisual)
    )).toContain("v2-explorer-state-duplicate");

    const textOnly = structuredClone(validProfileSeed()) as unknown as {
      explorer: {
        modelKind: string;
        controls: Array<{ state: { kind: string } }>;
      };
    };
    textOnly.explorer.modelKind = "text-only";
    textOnly.explorer.controls[0].state = { kind: "text-only" };
    expect(validateAcademyLessonTeachingProfileV2Seed(textOnly)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "v2-seed-field-type" })
      ])
    );
  });

  it("normalises free text while retaining structural reference and answer patterns", () => {
    const first = expandAcademyLessonTeachingProfileV2Seed(validProfileSeed());
    const changedText = structuredClone(first);
    changedText.systemModel = "Completely different authored system prose.";
    changedText.applicationTask = "Completely different authored task prose.";
    changedText.assessments.q2.base.prompt = "Different prompt wording.";
    changedText.assessments.q2.base.steps[0].label = "Different step wording.";
    expect(normaliseAcademyAssessmentV2Shell(first, "q2"))
      .toBe(normaliseAcademyAssessmentV2Shell(changedText, "q2"));
    expect(academyLessonTeachingProfileV2InformationSignature(first))
      .not.toBe(academyLessonTeachingProfileV2InformationSignature(changedText));
  });

  it("rejects duplicate normalised Q2-Q4 shells within one seven-lesson unit", () => {
    const first = expandAcademyLessonTeachingProfileV2Seed(validProfileSeed());
    const second = structuredClone(first);
    second.lessonId = "EML-E0-D01-L02";
    second.systemModel =
      "A different retrieval system description keeps the substantive information signature distinct.";
    const issues = validateAcademyLessonTeachingProfileV2Registry({
      [first.lessonId]: first,
      [second.lessonId]: second
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "v2-duplicate-unit-shell",
          path: expect.stringContaining("assessments.q2")
        }),
        expect.objectContaining({
          code: "v2-duplicate-unit-shell",
          path: expect.stringContaining("assessments.q3")
        }),
        expect.objectContaining({
          code: "v2-duplicate-unit-shell",
          path: expect.stringContaining("assessments.q4")
        })
      ])
    );
  });
});
