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
  "EML-E0-D02-L01",
  "EML-E0-D02-L02",
  "EML-E0-D02-L03",
  "EML-E0-D02-L04",
  "EML-E0-D02-L05",
  "EML-E0-D02-L06",
  "EML-E0-D02-L07"
] as const;

const plans = [
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D02-L01",
    systemModel:
      "An engineering estimate starts from quantities with compatible meanings, chooses a declared reference scale, simplifies them deliberately, combines the simplified values and compares the result with an exact calculation or physical bound.",
    failurePattern:
      "A precise sum can be arithmetically correct while providing no advance expectation, scale judgement or plausibility check.",
    visualExplanation:
      "An estimation graph connects component demands, a reference scale, rounded demands, an estimated total, an exact sum and a plausibility decision.",
    applicationTask:
      "Estimate the combined current demand of several robot subsystems before calculating the exact sum, documenting the common unit, rounding choices and expected range.",
    terms: [
      [
        "engineering-estimate",
        "Engineering estimate",
        "A deliberately simplified calculation used to predict scale, range or plausibility before relying on detailed arithmetic.",
        "An exact sum performed without simplification or a reference scale is a calculation, not by itself an estimate.",
        "choose-scale"
      ],
      [
        "reference-scale",
        "Reference scale",
        "A declared size used to decide sensible rounding and interpret the result.",
        "The reference scale guides approximation; it is not an extra measured quantity.",
        "choose-scale"
      ]
    ],
    entities: [
      [
        "component-demands",
        "input",
        "Robot component demands",
        "The subsystem current values that will contribute to the total."
      ],
      [
        "reference-scale",
        "constraint",
        "Current reference scale",
        "The declared scale used to simplify component demands consistently."
      ],
      [
        "rounded-demands",
        "state",
        "Rounded current demands",
        "The deliberately simplified subsystem values in a common unit."
      ],
      [
        "estimated-total",
        "observation",
        "Estimated current total",
        "The approximate combined demand produced from rounded values."
      ],
      [
        "exact-sum",
        "observation",
        "Exact current sum",
        "The direct addition of the original compatible component values."
      ],
      [
        "plausibility-decision",
        "decision",
        "Current plausibility decision",
        "The decision that the detailed result is or is not consistent with the estimated scale and physical boundary."
      ]
    ],
    relations: [
      [
        "scale-constrains-rounding",
        "constrains",
        ["reference-scale"],
        ["rounded-demands"],
        "the declared current scale constrains how component demands are rounded",
        "directed",
        "one-to-many"
      ],
      [
        "demands-transform-rounded",
        "transforms",
        ["component-demands"],
        ["rounded-demands"],
        "compatible component demands are deliberately transformed into rounded values",
        "directed",
        "one-to-one"
      ],
      [
        "rounded-sum-estimate",
        "causes",
        ["rounded-demands"],
        ["estimated-total"],
        "adding the rounded current demands produces the estimated total",
        "directed",
        "many-to-one"
      ],
      [
        "demands-sum-exact",
        "causes",
        ["component-demands"],
        ["exact-sum"],
        "adding the original compatible current demands produces the exact total",
        "directed",
        "many-to-one"
      ],
      [
        "estimate-compares-exact",
        "compares",
        ["estimated-total"],
        ["exact-sum"],
        "the estimated current scale is compared with the exact sum",
        "undirected",
        "one-to-one"
      ],
      [
        "comparison-supports-plausibility",
        "supports",
        ["estimated-total", "exact-sum"],
        ["plausibility-decision"],
        "agreement within the declared approximation supports the plausibility decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "compatible-current-units",
        "boundary",
        "All combined component demands represent current in one declared unit.",
        ["component-demands", "rounded-demands", "exact-sum"],
        ["demands-transform-rounded", "demands-sum-exact"]
      ],
      [
        "rounding-rule-declared",
        "criterion",
        "The reference scale and rounding direction are declared before the exact sum is inspected.",
        ["reference-scale", "rounded-demands", "estimated-total"],
        ["scale-constrains-rounding", "rounded-sum-estimate"]
      ],
      [
        "exact-sum-called-estimate",
        "assumption",
        "The original values are added exactly and the result is labelled an estimate without prior simplification.",
        ["component-demands", "exact-sum", "plausibility-decision"],
        ["demands-sum-exact", "comparison-supports-plausibility"]
      ]
    ],
    failureBoundary: [
      "precision-without-expectation",
      "rounding-rule-declared",
      "Exact addition supplies a result but does not create an independent expectation against which to judge it.",
      "A mistyped detailed total is accepted because no estimated scale exists for comparison.",
      "Call the work an estimate only when the simplification and reference scale are explicit and independent of the exact result.",
      [
        "reference-scale",
        "rounded-demands",
        "estimated-total",
        "exact-sum",
        "plausibility-decision"
      ],
      [
        "scale-constrains-rounding",
        "estimate-compares-exact",
        "comparison-supports-plausibility"
      ]
    ],
    conceptualModel: [
      [
        "identify-quantities",
        "List the robot subsystem demands and put every value in a compatible current unit.",
        ["component-demands", "rounded-demands"],
        ["demands-transform-rounded"],
        ["compatible-current-units"]
      ],
      [
        "choose-scale",
        "Choose a current reference scale appropriate to the decision and declare the rounding rule.",
        ["reference-scale", "rounded-demands"],
        ["scale-constrains-rounding"],
        ["rounding-rule-declared"]
      ],
      [
        "combine-estimate",
        "Add the rounded demands to create an approximate total and expected range.",
        ["rounded-demands", "estimated-total"],
        ["rounded-sum-estimate"],
        ["rounding-rule-declared"]
      ],
      [
        "calculate-exact",
        "Add the original compatible demands separately to obtain the exact sum.",
        ["component-demands", "exact-sum"],
        ["demands-sum-exact"],
        ["compatible-current-units"]
      ],
      [
        "judge-plausibility",
        "Compare the exact sum with the estimated scale and investigate a material mismatch.",
        ["estimated-total", "exact-sum", "plausibility-decision"],
        ["estimate-compares-exact", "comparison-supports-plausibility"],
        ["rounding-rule-declared"]
      ]
    ],
    reasonedCases: [
      {
        id: "current-estimate-example",
        kind: "example",
        scenario:
          "A learner converts all subsystem demands to one current unit, rounds them against a declared scale, adds the rounded values and then calculates the original-value sum separately.",
        changedConditionIds: ["rounding-rule-declared"],
        givens: [
          [
            "demand-list",
            "Subsystem demand list",
            "Drive, sensing and computing demands are supplied in compatible current units.",
            null,
            "component-demands"
          ]
        ],
        reasoningSteps: [
          [
            "example-scale",
            "The reference scale is chosen before the detailed total can influence rounding.",
            ["reference-scale", "rounded-demands"],
            ["scale-constrains-rounding"],
            ["rounding-rule-declared"]
          ],
          [
            "example-two-paths",
            "Rounded demands produce an estimate while original demands produce an independent exact sum.",
            [
              "component-demands",
              "rounded-demands",
              "estimated-total",
              "exact-sum"
            ],
            [
              "demands-transform-rounded",
              "rounded-sum-estimate",
              "demands-sum-exact"
            ],
            ["compatible-current-units", "rounding-rule-declared"]
          ],
          [
            "example-compare",
            "The two paths are compared to test the detailed result against the expected current scale.",
            ["estimated-total", "exact-sum", "plausibility-decision"],
            ["estimate-compares-exact", "comparison-supports-plausibility"],
            ["rounding-rule-declared"]
          ]
        ],
        outcome:
          "The estimate provides an independent plausibility check for the detailed current calculation.",
        criterionConditionId: "rounding-rule-declared",
        criterion:
          "The scale and simplification must be declared before the exact sum is used.",
        verification:
          "Inspect the note for two separate calculation paths and an explicit explanation of any material mismatch."
      },
      {
        id: "sum-only-counterexample",
        kind: "counterexample",
        scenario:
          "A learner adds the original current values once, reports many digits and labels the result an estimate.",
        changedConditionIds: ["exact-sum-called-estimate"],
        givens: [
          [
            "single-result",
            "Reported work",
            "Only one direct sum of the supplied component values is shown.",
            null,
            "exact-sum"
          ]
        ],
        reasoningSteps: [
          [
            "counter-no-scale",
            "No reference scale constrains a separate approximation path.",
            ["reference-scale", "rounded-demands"],
            ["scale-constrains-rounding"],
            ["exact-sum-called-estimate", "rounding-rule-declared"]
          ],
          [
            "counter-one-path",
            "The original values produce only the exact sum, so there is no independent estimated total.",
            ["component-demands", "exact-sum", "estimated-total"],
            ["demands-sum-exact", "estimate-compares-exact"],
            ["exact-sum-called-estimate"]
          ],
          [
            "counter-no-check",
            "Without an estimated scale, the detailed result cannot support its own plausibility.",
            ["estimated-total", "exact-sum", "plausibility-decision"],
            ["comparison-supports-plausibility"],
            ["exact-sum-called-estimate"]
          ]
        ],
        outcome:
          "The direct sum may be correct, but it is not an engineering estimate or an independent check.",
        criterionConditionId: "rounding-rule-declared",
        criterion:
          "Create a declared simplification path before using the exact result for comparison.",
        verification:
          "Hide the exact total and ask whether the work still predicts a reasonable scale or range."
      }
    ],
    misconception: {
      id: "addition-is-estimation",
      claim:
        "Adding all supplied values is automatically an engineering estimate.",
      mechanism:
        "The sum operation aggregates values, but estimation additionally needs purposeful simplification, a reference scale and a bounded interpretation.",
      correction:
        "Declare compatible units, simplify against a reference scale, combine the approximations and compare with the exact sum.",
      disconfirmingObservation:
        "The learner cannot say what total scale was expected before viewing the detailed answer.",
      entityIds: [
        "component-demands",
        "reference-scale",
        "estimated-total",
        "exact-sum",
        "plausibility-decision"
      ],
      relationIds: [
        "scale-constrains-rounding",
        "demands-sum-exact",
        "estimate-compares-exact"
      ],
      conditionIds: ["exact-sum-called-estimate", "rounding-rule-declared"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the robot-current estimate so it remains independent of the detailed sum:",
            "The current estimate declares units and scale, combines rounded demands and only then checks the exact result.",
            "The current estimate currently lets the exact sum choose the approximation or combines incompatible demands.",
            "Begin with compatible robot-current quantities and a declared reference scale.",
            "Place rounded current demands before the estimated total.",
            "Build the approximate current path without looking at the exact sum.",
            "Finish by comparing the exact current result with the estimated scale."
          ),
          focusRef: reasonedCase("current-estimate-example", "scenario"),
          contextConditionIds: [
            "compatible-current-units",
            "rounding-rule-declared"
          ],
          steps: [
            [
              "round-demands",
              ["demands-transform-rounded", "scale-constrains-rounding"],
              ["compatible-current-units", "rounding-rule-declared"]
            ],
            [
              "sum-rounded",
              ["rounded-sum-estimate"],
              ["rounding-rule-declared"]
            ],
            [
              "sum-original",
              ["demands-sum-exact"],
              ["compatible-current-units"]
            ],
            [
              "compare-paths",
              ["estimate-compares-exact", "comparison-supports-plausibility"],
              ["rounding-rule-declared"]
            ]
          ],
          correctOrder: [
            "round-demands",
            "sum-rounded",
            "sum-original",
            "compare-paths"
          ]
        },
        retry: {
          instruction: instruction(
            "Turn a sum-only current calculation into a genuine engineering estimate:",
            "The repaired current work creates a separate scale prediction before reusing the exact sum.",
            "The repaired current work still renames the exact calculation without adding independent approximation.",
            "Set aside the detailed current result and choose a reference scale.",
            "Simplify each robot demand consistently in the common current unit.",
            "Combine rounded current demands to recover an independent expected total.",
            "Bring back the exact current sum only for the final plausibility comparison."
          ),
          focusRef: reasonedCase("sum-only-counterexample", "scenario"),
          contextConditionIds: [
            "exact-sum-called-estimate",
            "rounding-rule-declared"
          ],
          steps: [
            [
              "set-scale",
              ["scale-constrains-rounding"],
              ["exact-sum-called-estimate", "rounding-rule-declared"]
            ],
            [
              "build-estimate",
              ["demands-transform-rounded", "rounded-sum-estimate"],
              ["compatible-current-units"]
            ],
            [
              "restore-check",
              ["estimate-compares-exact"],
              ["rounding-rule-declared"]
            ]
          ],
          correctOrder: ["set-scale", "build-estimate", "restore-check"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the current-calculation features that make the estimate useful:",
            "The selected current features create a declared approximation and an independent comparison.",
            "A selected current feature confuses precision with estimation or drops unit compatibility.",
            "Look for the current scale chosen before detailed arithmetic.",
            "Look for separate rounded-demand and original-demand paths.",
            "Select the scale-to-rounding relation for the robot demands.",
            "Select the estimate-to-exact comparison that supports plausibility."
          ),
          focusRef: term("engineering-estimate", "definition"),
          contextConditionIds: [
            "compatible-current-units",
            "rounding-rule-declared"
          ],
          options: [
            [
              "declared-scale",
              true,
              relation("scale-constrains-rounding"),
              condition("rounding-rule-declared"),
              ["scale-constrains-rounding", "rounded-sum-estimate"],
              ["rounding-rule-declared"],
              null
            ],
            [
              "independent-check",
              true,
              relation("estimate-compares-exact"),
              reasonedCase("current-estimate-example", "criterion"),
              ["estimate-compares-exact", "comparison-supports-plausibility"],
              ["rounding-rule-declared"],
              null
            ],
            [
              "sum-is-enough",
              false,
              misconception("addition-is-estimation", "claim"),
              misconception("addition-is-estimation", "mechanism"),
              ["demands-sum-exact"],
              ["exact-sum-called-estimate"],
              "addition-is-estimation"
            ],
            [
              "mixed-units",
              false,
              condition("compatible-current-units"),
              reasonedCase("current-estimate-example", "criterion"),
              ["demands-transform-rounded", "demands-sum-exact"],
              ["compatible-current-units"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Identify why a precise robot-current sum still lacks estimating value:",
            "The diagnosis exposes the missing reference scale and missing independent current path.",
            "The diagnosis rejects compatible current arithmetic or assumes rounding alone guarantees correctness.",
            "Ask what current scale was expected before the exact answer appeared.",
            "Ask whether rounded robot demands were combined separately.",
            "Mark the absent current reference scale as an estimation failure.",
            "Mark the single exact current path as a plausibility-check failure."
          ),
          focusRef: reasonedCase("sum-only-counterexample", "verification"),
          contextConditionIds: [
            "exact-sum-called-estimate",
            "rounding-rule-declared"
          ],
          options: [
            [
              "missing-scale",
              true,
              term("reference-scale", "definition"),
              condition("rounding-rule-declared"),
              ["scale-constrains-rounding"],
              ["rounding-rule-declared", "exact-sum-called-estimate"],
              null
            ],
            [
              "missing-estimate",
              true,
              reasonedCase("sum-only-counterexample", "outcome"),
              relation("rounded-sum-estimate"),
              ["rounded-sum-estimate", "estimate-compares-exact"],
              ["exact-sum-called-estimate"],
              null
            ],
            [
              "exact-path-valid",
              true,
              relation("demands-sum-exact"),
              condition("compatible-current-units"),
              ["demands-sum-exact"],
              ["compatible-current-units"],
              null
            ],
            [
              "addition-proves-estimate",
              false,
              misconception("addition-is-estimation", "claim"),
              misconception("addition-is-estimation", "mechanism"),
              ["demands-sum-exact", "estimate-compares-exact"],
              ["exact-sum-called-estimate"],
              "addition-is-estimation"
            ],
            [
              "digits-create-scale",
              false,
              term("engineering-estimate", "boundary"),
              reasonedCase("sum-only-counterexample", "criterion"),
              ["comparison-supports-plausibility"],
              ["rounding-rule-declared"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why the sum operation alone is not an engineering estimate:",
            "The explanation joins compatible current quantities, purposeful simplification and independent comparison.",
            "The explanation omits a current concept group or says any rounded sum is automatically plausible.",
            "Describe what the current reference scale controls.",
            "Distinguish rounded-demand estimation from original-demand addition.",
            "Explain how the exact current sum aggregates compatible values.",
            "Use the estimate-to-exact comparison to make the plausibility decision."
          ),
          focusRef: misconception("addition-is-estimation", "claim"),
          contextConditionIds: [
            "exact-sum-called-estimate",
            "rounding-rule-declared"
          ],
          conceptGroups: [
            [
              "scale-group",
              term("reference-scale", "label"),
              [term("reference-scale", "definition")],
              ["scale-constrains-rounding"],
              ["rounding-rule-declared"]
            ],
            [
              "estimate-group",
              term("engineering-estimate", "label"),
              [term("engineering-estimate", "definition")],
              ["demands-transform-rounded", "rounded-sum-estimate"],
              ["compatible-current-units", "rounding-rule-declared"]
            ],
            [
              "sum-group",
              relation("demands-sum-exact"),
              [relation("demands-sum-exact")],
              ["demands-sum-exact", "estimate-compares-exact"],
              ["compatible-current-units"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["comparison-supports-plausibility"],
          criterionConditionId: "rounding-rule-declared"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match each robot-current calculation relation to its proper role:",
            "The current matches separate simplification, aggregation and plausibility evidence.",
            "One current match still assigns an exact-sum role to the approximation path.",
            "Pair scale-constrained current rounding with the declared rule.",
            "Pair original-demand addition with compatible current units.",
            "Connect rounded current addition to the estimated total.",
            "Connect estimate comparison to the final plausibility judgement."
          ),
          focusRef: reasonedCase("current-estimate-example", "scenario"),
          contextConditionIds: [
            "compatible-current-units",
            "rounding-rule-declared"
          ],
          pairs: [
            [
              "rounding-pair",
              relation("scale-constrains-rounding"),
              condition("rounding-rule-declared"),
              relation("scale-constrains-rounding"),
              ["scale-constrains-rounding"],
              ["rounding-rule-declared"]
            ],
            [
              "sum-pair",
              relation("demands-sum-exact"),
              condition("compatible-current-units"),
              relation("demands-sum-exact"),
              ["demands-sum-exact"],
              ["compatible-current-units"]
            ],
            [
              "check-pair",
              relation("comparison-supports-plausibility"),
              term("engineering-estimate", "definition"),
              relation("comparison-supports-plausibility"),
              ["estimate-compares-exact", "comparison-supports-plausibility"],
              ["rounding-rule-declared"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the current graph when only the exact sum is present:",
            "The current implication keeps the sum but requires a separate scale-based estimate before plausibility is claimed.",
            "The current implication discards correct arithmetic or relabels the exact sum as an estimate.",
            "Trace original robot demands directly into the exact current sum.",
            "Notice that no rounded-current path reaches an estimated total.",
            "Identify the missing comparison needed for current plausibility.",
            "Preserve the exact sum and add an independent current estimate."
          ),
          focusRef: reasonedCase("sum-only-counterexample", "outcome"),
          contextConditionIds: [
            "exact-sum-called-estimate",
            "rounding-rule-declared"
          ],
          positions: [
            ["component-demands", 0, 0],
            ["exact-sum", 1, 0],
            ["estimated-total", 1, 1],
            ["plausibility-decision", 2, 0]
          ],
          relationIds: [
            "demands-sum-exact",
            "estimate-compares-exact",
            "comparison-supports-plausibility"
          ],
          answerRelationIds: ["estimate-compares-exact"],
          options: [
            [
              "add-independent-path",
              true,
              reasonedCase("sum-only-counterexample", "verification"),
              condition("rounding-rule-declared"),
              ["estimate-compares-exact", "comparison-supports-plausibility"],
              ["exact-sum-called-estimate", "rounding-rule-declared"],
              null
            ],
            [
              "rename-sum",
              false,
              misconception("addition-is-estimation", "claim"),
              misconception("addition-is-estimation", "mechanism"),
              ["demands-sum-exact"],
              ["exact-sum-called-estimate"],
              "addition-is-estimation"
            ],
            [
              "discard-exact",
              false,
              term("engineering-estimate", "boundary"),
              reasonedCase("current-estimate-example", "criterion"),
              ["comparison-supports-plausibility"],
              ["rounding-rule-declared"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the complete robot-current graph after both calculation paths exist:",
            "The current graph supports a bounded plausibility judgement from independent approximate and exact totals.",
            "The current graph claims the estimate replaces exact arithmetic or ignores unit compatibility.",
            "Follow rounded robot demands into the estimated current total.",
            "Follow original robot demands into the exact current sum.",
            "Compare both current totals under the declared rounding rule.",
            "Accept the detailed current result only when its scale is plausible."
          ),
          focusRef: reasonedCase("current-estimate-example", "outcome"),
          contextConditionIds: [
            "compatible-current-units",
            "rounding-rule-declared"
          ],
          positions: [
            ["rounded-demands", 0, 1],
            ["estimated-total", 1, 1],
            ["component-demands", 0, 2],
            ["exact-sum", 1, 2],
            ["plausibility-decision", 2, 1]
          ],
          relationIds: [
            "rounded-sum-estimate",
            "demands-sum-exact",
            "estimate-compares-exact",
            "comparison-supports-plausibility"
          ],
          answerRelationIds: ["comparison-supports-plausibility"],
          options: [
            [
              "accept-plausible",
              true,
              reasonedCase("current-estimate-example", "verification"),
              condition("rounding-rule-declared"),
              ["estimate-compares-exact", "comparison-supports-plausibility"],
              ["compatible-current-units", "rounding-rule-declared"],
              null
            ],
            [
              "estimate-replaces-sum",
              false,
              term("engineering-estimate", "boundary"),
              reasonedCase("current-estimate-example", "criterion"),
              ["rounded-sum-estimate"],
              ["rounding-rule-declared"],
              null
            ],
            [
              "ignore-units",
              false,
              misconception("addition-is-estimation", "claim"),
              misconception("addition-is-estimation", "disconfirmingObservation"),
              ["demands-sum-exact", "comparison-supports-plausibility"],
              ["exact-sum-called-estimate", "compatible-current-units"],
              "addition-is-estimation"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("engineering-estimate", "label"),
      focusRef: reasonedCase("current-estimate-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["component-demands", 0, 0],
        ["reference-scale", 0, 1],
        ["rounded-demands", 1, 1],
        ["estimated-total", 2, 1],
        ["exact-sum", 2, 0],
        ["plausibility-decision", 3, 0]
      ],
      visibleEntityIds: [
        "component-demands",
        "reference-scale",
        "rounded-demands",
        "estimated-total",
        "exact-sum",
        "plausibility-decision"
      ],
      visibleRelationIds: [
        "scale-constrains-rounding",
        "demands-transform-rounded",
        "rounded-sum-estimate",
        "demands-sum-exact",
        "estimate-compares-exact",
        "comparison-supports-plausibility"
      ],
      controls: [
        [
          "estimation-path",
          term("reference-scale", "label"),
          ["rounding-rule-declared"],
          ["reference-scale", "rounded-demands", "estimated-total"],
          [
            "scale-constrains-rounding",
            "demands-transform-rounded",
            "rounded-sum-estimate"
          ],
          [],
          [],
          [
            [
              "approximate-path",
              "The declared scale produces a separate approximate current total.",
              ["reference-scale", "rounded-demands", "estimated-total"],
              ["scale-constrains-rounding", "rounded-sum-estimate"]
            ]
          ],
          reasonedCase("current-estimate-example", "verification")
        ],
        [
          "comparison-path",
          term("engineering-estimate", "label"),
          ["compatible-current-units"],
          [
            "component-demands",
            "estimated-total",
            "exact-sum",
            "plausibility-decision"
          ],
          [
            "demands-sum-exact",
            "estimate-compares-exact",
            "comparison-supports-plausibility"
          ],
          ["scale-constrains-rounding"],
          [],
          [
            [
              "plausibility-path",
              "Independent current totals converge on a bounded plausibility decision.",
              ["estimated-total", "exact-sum", "plausibility-decision"],
              ["estimate-compares-exact", "comparison-supports-plausibility"]
            ]
          ],
          reasonedCase("current-estimate-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D02-L02",
    systemModel:
      "Fractions, ratios and percentages describe declared relationships between quantities, while scientific notation changes how a magnitude is written without changing its value or unit.",
    failurePattern:
      "A compact percentage or ratio can look authoritative even when its whole, denominator, unit basis or comparison meaning is missing.",
    visualExplanation:
      "A representation graph connects a battery whole, subsystem part, declared comparison, equivalent fraction and percentage, scientific notation and an engineering interpretation.",
    applicationTask:
      "Express one subsystem's share of a robot battery budget as a fraction and percentage, compare two subsystem demands as a ratio, and rewrite a supplied magnitude in scientific notation without changing its unit.",
    terms: [
      [
        "fraction",
        "Part-whole fraction",
        "A quotient that names a selected part relative to a declared whole.",
        "The numerator and denominator must refer to a compatible part-whole basis.",
        "declare-basis"
      ],
      [
        "ratio",
        "Comparison ratio",
        "A quotient comparing two declared quantities in a stated order.",
        "A numerical ratio compares; by itself it does not explain why the quantities differ.",
        "form-ratio"
      ],
      [
        "percentage",
        "Percentage",
        "A part-whole fraction expressed per hundred with the whole made explicit.",
        "A percentage without its reference whole is incomplete.",
        "convert-percentage"
      ],
      [
        "scientific-notation",
        "Scientific notation",
        "A magnitude written as a coefficient multiplied by an integer power of ten.",
        "Changing notation must not change the physical value or its unit.",
        "rewrite-magnitude"
      ]
    ],
    entities: [
      [
        "battery-whole",
        "input",
        "Declared battery budget",
        "The whole energy or charge budget used for the part-whole statement."
      ],
      [
        "subsystem-part",
        "input",
        "Subsystem battery demand",
        "The selected subsystem quantity compared with the whole or another subsystem."
      ],
      [
        "comparison-order",
        "constraint",
        "Demand comparison order",
        "The declared numerator, denominator and common quantity basis."
      ],
      [
        "equivalent-representations",
        "state",
        "Equivalent demand representations",
        "The fraction, ratio, percentage and scientific-notation forms tied to the same values."
      ],
      [
        "budget-interpretation",
        "decision",
        "Battery budget interpretation",
        "The bounded statement about share, comparison or magnitude supported by the representation."
      ]
    ],
    relations: [
      [
        "part-depends-whole",
        "depends-on",
        ["subsystem-part"],
        ["battery-whole"],
        "the subsystem fraction depends on the declared battery whole",
        "directed",
        "many-to-one"
      ],
      [
        "order-constrains-ratio",
        "constrains",
        ["comparison-order"],
        ["subsystem-part"],
        "the declared comparison order constrains numerator, denominator and quantity basis",
        "directed",
        "one-to-many"
      ],
      [
        "values-transform-representations",
        "transforms",
        ["battery-whole", "subsystem-part"],
        ["equivalent-representations"],
        "the declared values transform into equivalent fraction, percentage and magnitude forms",
        "directed",
        "many-to-one"
      ],
      [
        "representations-compare-values",
        "compares",
        ["equivalent-representations"],
        ["battery-whole", "subsystem-part"],
        "the ratio and percentage compare values on their declared basis",
        "undirected",
        "many-to-many"
      ],
      [
        "representation-supports-interpretation",
        "supports",
        ["equivalent-representations", "comparison-order"],
        ["budget-interpretation"],
        "a correctly bounded representation supports the battery budget interpretation",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "nonzero-denominator",
        "boundary",
        "Every denominator names a nonzero declared quantity.",
        ["battery-whole", "subsystem-part", "comparison-order"],
        ["part-depends-whole", "order-constrains-ratio"]
      ],
      [
        "compatible-quantity-basis",
        "criterion",
        "Compared values share a compatible quantity basis and are converted to compatible units where cancellation is intended.",
        [
          "battery-whole",
          "subsystem-part",
          "comparison-order",
          "equivalent-representations"
        ],
        [
          "order-constrains-ratio",
          "values-transform-representations",
          "representations-compare-values"
        ]
      ],
      [
        "undeclared-whole",
        "assumption",
        "A percentage is reported without naming the battery quantity treated as the whole.",
        ["battery-whole", "equivalent-representations", "budget-interpretation"],
        ["part-depends-whole", "representation-supports-interpretation"]
      ]
    ],
    failureBoundary: [
      "meaningless-compact-number",
      "compatible-quantity-basis",
      "A quotient can be calculated from unrelated or mismatched quantities while lacking the intended engineering meaning.",
      "A percentage or ratio is quoted, but another reader cannot identify its whole, order or unit basis.",
      "Interpret a fraction, ratio or percentage only after the compared quantities, order and basis are explicit.",
      [
        "battery-whole",
        "subsystem-part",
        "comparison-order",
        "equivalent-representations",
        "budget-interpretation"
      ],
      [
        "part-depends-whole",
        "representations-compare-values",
        "representation-supports-interpretation"
      ]
    ],
    conceptualModel: [
      [
        "declare-basis",
        "Name the subsystem part, battery whole and physical quantity used for the comparison.",
        ["subsystem-part", "battery-whole", "comparison-order"],
        ["part-depends-whole", "order-constrains-ratio"],
        ["nonzero-denominator", "compatible-quantity-basis"]
      ],
      [
        "form-ratio",
        "Write the numerator and nonzero denominator in the declared order and compatible basis.",
        ["subsystem-part", "comparison-order"],
        ["order-constrains-ratio"],
        ["nonzero-denominator", "compatible-quantity-basis"]
      ],
      [
        "convert-percentage",
        "Convert the part-whole fraction into a percentage while retaining the named whole.",
        ["battery-whole", "subsystem-part", "equivalent-representations"],
        ["values-transform-representations"],
        ["compatible-quantity-basis"]
      ],
      [
        "rewrite-magnitude",
        "Rewrite a magnitude in scientific notation without changing its value or unit.",
        ["subsystem-part", "equivalent-representations"],
        ["values-transform-representations"],
        ["compatible-quantity-basis"]
      ],
      [
        "interpret-representation",
        "State whether the result describes a share, an ordered comparison or only a rewritten magnitude.",
        [
          "comparison-order",
          "equivalent-representations",
          "budget-interpretation"
        ],
        ["representations-compare-values", "representation-supports-interpretation"],
        ["compatible-quantity-basis"]
      ]
    ],
    reasonedCases: [
      {
        id: "battery-share-example",
        kind: "example",
        scenario:
          "A learner names the total battery budget, selects one subsystem demand, declares the comparison order and presents equivalent fraction and percentage statements.",
        changedConditionIds: ["compatible-quantity-basis"],
        givens: [
          [
            "declared-whole",
            "Reference whole",
            "The complete battery budget is explicitly named as the denominator.",
            null,
            "battery-whole"
          ]
        ],
        reasoningSteps: [
          [
            "example-basis",
            "The subsystem part and battery whole refer to the same physical quantity on a compatible basis.",
            ["subsystem-part", "battery-whole", "comparison-order"],
            ["part-depends-whole", "order-constrains-ratio"],
            ["nonzero-denominator", "compatible-quantity-basis"]
          ],
          [
            "example-equivalence",
            "The fraction and percentage transform the same part-whole relationship without changing its meaning.",
            ["battery-whole", "subsystem-part", "equivalent-representations"],
            ["values-transform-representations"],
            ["compatible-quantity-basis"]
          ],
          [
            "example-interpret",
            "The final statement identifies a subsystem share rather than claiming a cause.",
            ["equivalent-representations", "comparison-order", "budget-interpretation"],
            [
              "representations-compare-values",
              "representation-supports-interpretation"
            ],
            ["compatible-quantity-basis"]
          ]
        ],
        outcome:
          "The fraction, percentage and ratio retain an explicit battery basis and interpretation.",
        criterionConditionId: "compatible-quantity-basis",
        criterion:
          "The whole, comparison order, quantity basis and units must remain recoverable from the result.",
        verification:
          "Translate each compact representation back into a complete sentence naming both compared quantities."
      },
      {
        id: "missing-basis-counterexample",
        kind: "counterexample",
        scenario:
          "A learner reports a battery percentage and a subsystem ratio without naming the reference whole, comparison order or quantity basis.",
        changedConditionIds: ["undeclared-whole"],
        givens: [
          [
            "orphaned-percentage",
            "Reported result",
            "A percentage appears without its named battery whole.",
            null,
            "equivalent-representations"
          ]
        ],
        reasoningSteps: [
          [
            "counter-whole",
            "The subsystem part cannot be interpreted as a share because the battery whole is absent.",
            ["subsystem-part", "battery-whole"],
            ["part-depends-whole"],
            ["undeclared-whole"]
          ],
          [
            "counter-order",
            "The ratio has no recoverable numerator, denominator or compatible basis.",
            ["comparison-order", "subsystem-part", "equivalent-representations"],
            ["order-constrains-ratio", "representations-compare-values"],
            ["undeclared-whole", "compatible-quantity-basis"]
          ],
          [
            "counter-meaning",
            "The compact numbers cannot support a unique battery interpretation.",
            ["equivalent-representations", "budget-interpretation"],
            ["representation-supports-interpretation"],
            ["undeclared-whole"]
          ]
        ],
        outcome:
          "The arithmetic may be recoverable, but the reported percentage and ratio are semantically incomplete.",
        criterionConditionId: "compatible-quantity-basis",
        criterion:
          "Restore the whole, ordered quantities and unit basis before interpreting the result.",
        verification:
          "Ask a second reader to identify numerator, denominator, whole and units using only the reported statement."
      }
    ],
    misconception: {
      id: "any-quotient-is-meaningful",
      claim:
        "Dividing any two engineering numbers produces a meaningful ratio.",
      mechanism:
        "Arithmetic division does not supply the comparison order, compatible quantity basis, nonzero denominator or interpretation.",
      correction:
        "Declare both quantities, convert to a compatible basis where required, state the order and explain what the quotient compares.",
      disconfirmingObservation:
        "Reversing the unnamed numerator and denominator produces a different number while the original statement gives no way to choose.",
      entityIds: [
        "battery-whole",
        "subsystem-part",
        "comparison-order",
        "equivalent-representations",
        "budget-interpretation"
      ],
      relationIds: [
        "order-constrains-ratio",
        "representations-compare-values",
        "representation-supports-interpretation"
      ],
      conditionIds: ["undeclared-whole", "compatible-quantity-basis"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Sequence the battery-share representation from declared whole to interpretation:",
            "The battery sequence fixes the basis, forms the quotient, converts the percentage and explains the result.",
            "The battery sequence currently converts a percentage before declaring its whole or comparison order.",
            "Begin by naming the subsystem demand and complete battery budget.",
            "Place the ordered battery quotient before its percentage representation.",
            "Form the compatible part-whole battery fraction and retain its denominator.",
            "Finish with a battery interpretation that names the share and boundary."
          ),
          focusRef: reasonedCase("battery-share-example", "scenario"),
          contextConditionIds: [
            "nonzero-denominator",
            "compatible-quantity-basis"
          ],
          steps: [
            [
              "bind-whole",
              ["part-depends-whole", "order-constrains-ratio"],
              ["nonzero-denominator", "compatible-quantity-basis"]
            ],
            [
              "transform",
              ["values-transform-representations"],
              ["compatible-quantity-basis"]
            ],
            [
              "compare",
              ["representations-compare-values"],
              ["compatible-quantity-basis"]
            ],
            [
              "interpret",
              ["representation-supports-interpretation"],
              ["compatible-quantity-basis"]
            ]
          ],
          correctOrder: ["bind-whole", "transform", "compare", "interpret"]
        },
        retry: {
          instruction: instruction(
            "Repair an orphaned battery percentage before using it in a design decision:",
            "The repaired battery statement restores the whole, ratio order and compatible quantity basis.",
            "The repaired battery statement still presents a compact number without recoverable meaning.",
            "Ask which battery quantity the subsystem value is part of.",
            "Declare which subsystem demand is numerator and which value is denominator.",
            "Reconstruct the battery fraction before restating its percentage.",
            "Attach a complete battery interpretation to the equivalent representations."
          ),
          focusRef: reasonedCase("missing-basis-counterexample", "scenario"),
          contextConditionIds: ["undeclared-whole", "compatible-quantity-basis"],
          steps: [
            [
              "restore-whole",
              ["part-depends-whole"],
              ["undeclared-whole", "nonzero-denominator"]
            ],
            [
              "restore-order",
              ["order-constrains-ratio"],
              ["compatible-quantity-basis"]
            ],
            [
              "restore-meaning",
              [
                "values-transform-representations",
                "representation-supports-interpretation"
              ],
              ["compatible-quantity-basis"]
            ]
          ],
          correctOrder: ["restore-whole", "restore-order", "restore-meaning"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the battery statements that preserve quantitative meaning:",
            "The selected battery statements retain the whole, order, unit basis and unchanged magnitude.",
            "A selected battery statement loses its denominator or treats notation as a new value.",
            "Look for the battery percentage tied to an explicit whole.",
            "Look for scientific notation that preserves the subsystem unit.",
            "Select the ordered battery ratio with a nonzero denominator.",
            "Select the representation path that supports a complete interpretation."
          ),
          focusRef: term("percentage", "definition"),
          contextConditionIds: [
            "nonzero-denominator",
            "compatible-quantity-basis"
          ],
          options: [
            [
              "declared-share",
              true,
              relation("part-depends-whole"),
              condition("nonzero-denominator"),
              ["part-depends-whole", "values-transform-representations"],
              ["nonzero-denominator", "compatible-quantity-basis"],
              null
            ],
            [
              "preserved-magnitude",
              true,
              relation("values-transform-representations"),
              term("scientific-notation", "boundary"),
              ["values-transform-representations"],
              ["compatible-quantity-basis"],
              null
            ],
            [
              "arbitrary-division",
              false,
              misconception("any-quotient-is-meaningful", "claim"),
              misconception("any-quotient-is-meaningful", "mechanism"),
              ["order-constrains-ratio"],
              ["undeclared-whole"],
              "any-quotient-is-meaningful"
            ],
            [
              "percent-without-whole",
              false,
              term("percentage", "boundary"),
              reasonedCase("battery-share-example", "criterion"),
              ["representation-supports-interpretation"],
              ["undeclared-whole"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose which compact battery numbers cannot yet guide engineering:",
            "The diagnosis exposes missing comparison order, missing whole and altered unit meaning.",
            "The diagnosis rejects a valid battery equivalence or assumes every quotient is unitless.",
            "Try to read the battery ratio aloud with numerator and denominator named.",
            "Try to recover the subsystem unit after rewriting scientific notation.",
            "Flag the unnamed battery whole as a percentage failure.",
            "Flag a mixed-basis subsystem quotient as a ratio failure."
          ),
          focusRef: reasonedCase("missing-basis-counterexample", "verification"),
          contextConditionIds: ["undeclared-whole", "compatible-quantity-basis"],
          options: [
            [
              "missing-whole",
              true,
              condition("undeclared-whole"),
              relation("part-depends-whole"),
              ["part-depends-whole", "representation-supports-interpretation"],
              ["undeclared-whole"],
              null
            ],
            [
              "missing-order",
              true,
              relation("order-constrains-ratio"),
              reasonedCase("missing-basis-counterexample", "outcome"),
              ["order-constrains-ratio", "representations-compare-values"],
              ["compatible-quantity-basis"],
              null
            ],
            [
              "unit-preserved",
              true,
              term("scientific-notation", "boundary"),
              relation("values-transform-representations"),
              ["values-transform-representations"],
              ["compatible-quantity-basis"],
              null
            ],
            [
              "quotient-means-itself",
              false,
              misconception("any-quotient-is-meaningful", "claim"),
              misconception("any-quotient-is-meaningful", "mechanism"),
              ["order-constrains-ratio", "representations-compare-values"],
              ["undeclared-whole"],
              "any-quotient-is-meaningful"
            ],
            [
              "reverse-silently",
              false,
              term("ratio", "boundary"),
              reasonedCase("missing-basis-counterexample", "criterion"),
              ["representation-supports-interpretation"],
              ["compatible-quantity-basis"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: instruction(
            "Match each battery representation relation to the declaration it requires:",
            "The battery matches now connect part-whole, ratio order and equivalent notation to their boundaries.",
            "One battery match assigns a compact representation to the wrong quantitative declaration.",
            "Pair the subsystem fraction with its nonzero battery whole.",
            "Pair the demand ratio with its compatible ordered basis.",
            "Connect equivalent battery forms to value-preserving transformation.",
            "Connect the interpreted battery share to its complete representation."
          ),
          focusRef: reasonedCase("battery-share-example", "scenario"),
          contextConditionIds: [
            "nonzero-denominator",
            "compatible-quantity-basis"
          ],
          pairs: [
            [
              "whole-pair",
              relation("part-depends-whole"),
              condition("nonzero-denominator"),
              relation("part-depends-whole"),
              ["part-depends-whole"],
              ["nonzero-denominator"]
            ],
            [
              "ratio-pair",
              relation("order-constrains-ratio"),
              condition("compatible-quantity-basis"),
              relation("order-constrains-ratio"),
              ["order-constrains-ratio"],
              ["compatible-quantity-basis"]
            ],
            [
              "meaning-pair",
              relation("representation-supports-interpretation"),
              term("percentage", "boundary"),
              relation("representation-supports-interpretation"),
              [
                "values-transform-representations",
                "representation-supports-interpretation"
              ],
              ["compatible-quantity-basis"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instruction(
            "Explain why an unnamed battery percentage cannot be safely reused:",
            "The explanation joins part-whole basis, ordered ratio and value-preserving notation.",
            "The explanation omits a battery concept group or assumes division supplies its own meaning.",
            "Define the battery whole needed by the subsystem fraction.",
            "State how the comparison order controls the subsystem ratio.",
            "Explain how percentage preserves the declared part-whole relationship.",
            "Explain why scientific notation preserves magnitude and unit."
          ),
          focusRef: misconception("any-quotient-is-meaningful", "claim"),
          contextConditionIds: ["undeclared-whole", "compatible-quantity-basis"],
          conceptGroups: [
            [
              "fraction-group",
              term("fraction", "label"),
              [term("fraction", "definition")],
              ["part-depends-whole"],
              ["nonzero-denominator"]
            ],
            [
              "ratio-group",
              term("ratio", "label"),
              [term("ratio", "definition")],
              ["order-constrains-ratio", "representations-compare-values"],
              ["compatible-quantity-basis"]
            ],
            [
              "notation-group",
              term("scientific-notation", "label"),
              [term("scientific-notation", "definition")],
              ["values-transform-representations"],
              ["compatible-quantity-basis"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["representation-supports-interpretation"],
          criterionConditionId: "compatible-quantity-basis"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the battery graph when the percentage has no declared whole:",
            "The battery implication withholds the share interpretation until the missing whole is restored.",
            "The battery implication invents a denominator or treats the orphaned percentage as universal.",
            "Trace the subsystem part toward the absent battery whole.",
            "Use the nonzero-denominator boundary at the battery representation node.",
            "Locate the broken part-whole relation behind the percentage.",
            "Restore the battery basis before making a budget interpretation."
          ),
          focusRef: reasonedCase("missing-basis-counterexample", "outcome"),
          contextConditionIds: ["undeclared-whole", "nonzero-denominator"],
          positions: [
            ["subsystem-part", 0, 0],
            ["battery-whole", 1, 0],
            ["comparison-order", 1, 1],
            ["equivalent-representations", 2, 0],
            ["budget-interpretation", 3, 0]
          ],
          relationIds: [
            "part-depends-whole",
            "values-transform-representations",
            "representation-supports-interpretation"
          ],
          answerRelationIds: ["part-depends-whole"],
          options: [
            [
              "restore-basis",
              true,
              reasonedCase("missing-basis-counterexample", "verification"),
              condition("nonzero-denominator"),
              ["part-depends-whole", "representation-supports-interpretation"],
              ["undeclared-whole", "nonzero-denominator"],
              null
            ],
            [
              "divide-anyway",
              false,
              misconception("any-quotient-is-meaningful", "claim"),
              misconception("any-quotient-is-meaningful", "mechanism"),
              ["part-depends-whole"],
              ["undeclared-whole"],
              "any-quotient-is-meaningful"
            ],
            [
              "guess-whole",
              false,
              term("percentage", "boundary"),
              reasonedCase("battery-share-example", "criterion"),
              ["representation-supports-interpretation"],
              ["compatible-quantity-basis"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the complete battery representation graph after its basis is declared:",
            "The battery graph supports a bounded share and comparison without changing the underlying magnitude.",
            "The battery graph claims notation creates a new physical value or ratio proves causality.",
            "Follow the subsystem part and battery whole into equivalent representations.",
            "Check the declared comparison order before reading the ratio.",
            "Confirm scientific notation preserves the subsystem magnitude and unit.",
            "State whether the battery result is a share, comparison or rewritten magnitude."
          ),
          focusRef: reasonedCase("battery-share-example", "outcome"),
          contextConditionIds: [
            "nonzero-denominator",
            "compatible-quantity-basis"
          ],
          positions: [
            ["battery-whole", 0, 1],
            ["subsystem-part", 0, 2],
            ["comparison-order", 1, 2],
            ["equivalent-representations", 2, 1],
            ["budget-interpretation", 3, 1]
          ],
          relationIds: [
            "part-depends-whole",
            "order-constrains-ratio",
            "values-transform-representations",
            "representation-supports-interpretation"
          ],
          answerRelationIds: ["representation-supports-interpretation"],
          options: [
            [
              "interpret-explicitly",
              true,
              reasonedCase("battery-share-example", "verification"),
              condition("compatible-quantity-basis"),
              [
                "values-transform-representations",
                "representation-supports-interpretation"
              ],
              ["nonzero-denominator", "compatible-quantity-basis"],
              null
            ],
            [
              "notation-changes-value",
              false,
              term("scientific-notation", "boundary"),
              reasonedCase("battery-share-example", "criterion"),
              ["values-transform-representations"],
              ["compatible-quantity-basis"],
              null
            ],
            [
              "ratio-proves-cause",
              false,
              misconception("any-quotient-is-meaningful", "claim"),
              misconception(
                "any-quotient-is-meaningful",
                "disconfirmingObservation"
              ),
              ["order-constrains-ratio", "representation-supports-interpretation"],
              ["undeclared-whole"],
              "any-quotient-is-meaningful"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("percentage", "label"),
      focusRef: reasonedCase("battery-share-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["battery-whole", 0, 0],
        ["subsystem-part", 0, 1],
        ["comparison-order", 1, 1],
        ["equivalent-representations", 2, 0],
        ["budget-interpretation", 3, 0]
      ],
      visibleEntityIds: [
        "battery-whole",
        "subsystem-part",
        "comparison-order",
        "equivalent-representations",
        "budget-interpretation"
      ],
      visibleRelationIds: [
        "part-depends-whole",
        "order-constrains-ratio",
        "values-transform-representations",
        "representations-compare-values",
        "representation-supports-interpretation"
      ],
      controls: [
        [
          "part-whole-view",
          term("fraction", "label"),
          ["nonzero-denominator"],
          ["battery-whole", "subsystem-part", "equivalent-representations"],
          ["part-depends-whole", "values-transform-representations"],
          [],
          [],
          [
            [
              "whole-visible",
              "The subsystem share retains a declared nonzero battery whole.",
              ["battery-whole", "subsystem-part"],
              ["part-depends-whole"]
            ]
          ],
          reasonedCase("battery-share-example", "verification")
        ],
        [
          "comparison-view",
          term("ratio", "label"),
          ["compatible-quantity-basis"],
          [
            "subsystem-part",
            "comparison-order",
            "equivalent-representations",
            "budget-interpretation"
          ],
          [
            "order-constrains-ratio",
            "representations-compare-values",
            "representation-supports-interpretation"
          ],
          ["part-depends-whole"],
          [],
          [
            [
              "order-visible",
              "The demand ratio and interpretation retain their declared comparison order.",
              ["comparison-order", "equivalent-representations"],
              ["order-constrains-ratio"]
            ]
          ],
          reasonedCase("battery-share-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D02-L03",
    systemModel:
      "A measurement statement separates the physical quantity being described from the numerical value and unit used to express it, while derived units preserve how quantities combine.",
    failurePattern:
      "A unit symbol can be manipulated as a label without checking whether the underlying quantity or derived-unit relationship is physically coherent.",
    visualExplanation:
      "A quantity graph connects a robot phenomenon, named quantity, numerical value, SI base-unit expression, derived-unit form and dimension decision.",
    applicationTask:
      "Describe a robot wheel's motion using named quantities, values and units, then express a derived quantity through compatible base-unit factors and verify that the units match the intended quantity.",
    terms: [
      [
        "physical-quantity",
        "Physical quantity",
        "A measurable property such as length, duration, mass or electric current.",
        "A quantity is the property being described, not the unit name or numerical value alone.",
        "name-quantity"
      ],
      [
        "unit",
        "Measurement unit",
        "An agreed reference used to express the magnitude of a physical quantity.",
        "A unit symbol without a quantity and value is not a complete measurement statement.",
        "attach-value-unit"
      ],
      [
        "base-quantity",
        "SI base quantity",
        "A quantity treated as independent when the unit system is constructed.",
        "Base status belongs to the quantity framework, not to how simple a word looks.",
        "identify-base"
      ],
      [
        "derived-unit",
        "Derived unit expression",
        "A unit formed by multiplying or dividing unit factors according to a quantity relationship.",
        "A familiar derived-unit name does not remove the need to check its underlying unit expression.",
        "compose-derived"
      ]
    ],
    entities: [
      [
        "wheel-phenomenon",
        "input",
        "Wheel-motion phenomenon",
        "The physical robot behaviour that the measurement statement describes."
      ],
      [
        "quantity-statement",
        "state",
        "Wheel quantity statement",
        "The named physical quantity together with its value and unit."
      ],
      [
        "base-unit-factors",
        "component",
        "SI base-unit factors",
        "The unit factors used to construct the derived expression."
      ],
      [
        "derived-expression",
        "mechanism",
        "Wheel derived-unit expression",
        "The multiplied or divided unit expression implied by the quantity relationship."
      ],
      [
        "dimension-decision",
        "decision",
        "Quantity-unit consistency decision",
        "The decision that the unit expression does or does not match the intended quantity."
      ]
    ],
    relations: [
      [
        "phenomenon-maps-quantity",
        "maps",
        ["wheel-phenomenon"],
        ["quantity-statement"],
        "the wheel-motion phenomenon maps to a named physical quantity",
        "directed",
        "one-to-many"
      ],
      [
        "quantity-depends-unit",
        "depends-on",
        ["quantity-statement"],
        ["base-unit-factors"],
        "the numerical quantity statement depends on a declared compatible unit",
        "directed",
        "many-to-many"
      ],
      [
        "base-factors-compose-derived",
        "transforms",
        ["base-unit-factors"],
        ["derived-expression"],
        "base-unit factors combine according to the quantity relationship",
        "directed",
        "many-to-one"
      ],
      [
        "derived-compares-quantity",
        "compares",
        ["derived-expression"],
        ["quantity-statement"],
        "the derived-unit expression is compared with the intended physical quantity",
        "undirected",
        "one-to-one"
      ],
      [
        "comparison-supports-dimension",
        "supports",
        ["derived-expression", "quantity-statement"],
        ["dimension-decision"],
        "agreement between quantity relationship and unit expression supports consistency",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "quantity-value-unit-declared",
        "boundary",
        "Every measurement statement names the quantity, numerical value and unit separately.",
        ["wheel-phenomenon", "quantity-statement", "base-unit-factors"],
        ["phenomenon-maps-quantity", "quantity-depends-unit"]
      ],
      [
        "derived-relation-preserved",
        "criterion",
        "The derived-unit factors follow the multiplication and division in the defining quantity relationship.",
        ["base-unit-factors", "derived-expression", "dimension-decision"],
        ["base-factors-compose-derived", "derived-compares-quantity"]
      ],
      [
        "unit-name-substitution",
        "assumption",
        "A familiar unit name is substituted without checking the underlying quantity relationship.",
        ["quantity-statement", "derived-expression", "dimension-decision"],
        ["derived-compares-quantity", "comparison-supports-dimension"]
      ]
    ],
    failureBoundary: [
      "label-without-quantity",
      "derived-relation-preserved",
      "Treating unit symbols as detachable labels can preserve arithmetic while breaking the physical quantity relationship.",
      "The resulting unit expression cannot describe the wheel quantity claimed in the statement.",
      "Accept a derived unit only when its factor structure follows the defining quantity relationship.",
      [
        "quantity-statement",
        "base-unit-factors",
        "derived-expression",
        "dimension-decision"
      ],
      [
        "quantity-depends-unit",
        "base-factors-compose-derived",
        "derived-compares-quantity"
      ]
    ],
    conceptualModel: [
      [
        "name-quantity",
        "Name the measurable wheel property before writing a number or unit.",
        ["wheel-phenomenon", "quantity-statement"],
        ["phenomenon-maps-quantity"],
        ["quantity-value-unit-declared"]
      ],
      [
        "attach-value-unit",
        "Write the numerical value and compatible unit as separate parts of the quantity statement.",
        ["quantity-statement", "base-unit-factors"],
        ["quantity-depends-unit"],
        ["quantity-value-unit-declared"]
      ],
      [
        "identify-base",
        "Identify the base quantities and unit factors present in the defining relationship.",
        ["quantity-statement", "base-unit-factors"],
        ["quantity-depends-unit"],
        ["derived-relation-preserved"]
      ],
      [
        "compose-derived",
        "Multiply and divide the unit factors in the same pattern as the physical quantities.",
        ["base-unit-factors", "derived-expression"],
        ["base-factors-compose-derived"],
        ["derived-relation-preserved"]
      ],
      [
        "check-quantity-unit",
        "Compare the derived expression with the named quantity before accepting the result.",
        ["derived-expression", "quantity-statement", "dimension-decision"],
        ["derived-compares-quantity", "comparison-supports-dimension"],
        ["derived-relation-preserved"]
      ]
    ],
    reasonedCases: [
      {
        id: "wheel-unit-example",
        kind: "example",
        scenario:
          "A learner names wheel speed as a rate, attaches a value and unit, expands the rate into length divided by time and checks the derived expression against the intended quantity.",
        changedConditionIds: ["derived-relation-preserved"],
        givens: [
          [
            "named-rate",
            "Intended quantity",
            "Wheel travel per elapsed duration.",
            null,
            "quantity-statement"
          ]
        ],
        reasoningSteps: [
          [
            "example-quantity",
            "The wheel phenomenon is first mapped to a named rate rather than directly to a unit symbol.",
            ["wheel-phenomenon", "quantity-statement"],
            ["phenomenon-maps-quantity"],
            ["quantity-value-unit-declared"]
          ],
          [
            "example-factors",
            "Length and time unit factors follow the division in the rate relationship.",
            ["quantity-statement", "base-unit-factors", "derived-expression"],
            ["quantity-depends-unit", "base-factors-compose-derived"],
            ["derived-relation-preserved"]
          ],
          [
            "example-check",
            "The resulting unit expression is compared with the wheel-rate meaning.",
            ["derived-expression", "quantity-statement", "dimension-decision"],
            ["derived-compares-quantity", "comparison-supports-dimension"],
            ["derived-relation-preserved"]
          ]
        ],
        outcome:
          "The wheel measurement keeps quantity, value and unit distinct while preserving the derived relationship.",
        criterionConditionId: "derived-relation-preserved",
        criterion:
          "The unit factors must combine in the same multiplication and division pattern as the physical quantities.",
        verification:
          "Read the measurement statement aloud, then expand the derived unit and compare both meanings."
      },
      {
        id: "unit-label-counterexample",
        kind: "counterexample",
        scenario:
          "A learner chooses a familiar motion unit from memory and appends it to a wheel calculation without naming the quantity relationship.",
        changedConditionIds: ["unit-name-substitution"],
        givens: [
          [
            "appended-symbol",
            "Reported notation",
            "A numerical result is followed by an unverified familiar unit symbol.",
            null,
            "quantity-statement"
          ]
        ],
        reasoningSteps: [
          [
            "counter-property",
            "The calculation is not connected to a named wheel quantity.",
            ["wheel-phenomenon", "quantity-statement"],
            ["phenomenon-maps-quantity"],
            ["unit-name-substitution"]
          ],
          [
            "counter-factors",
            "No base-unit factors are derived from the physical relationship.",
            ["quantity-statement", "base-unit-factors", "derived-expression"],
            ["quantity-depends-unit", "base-factors-compose-derived"],
            ["unit-name-substitution", "derived-relation-preserved"]
          ],
          [
            "counter-check",
            "The familiar label cannot support a quantity-unit consistency decision.",
            ["derived-expression", "quantity-statement", "dimension-decision"],
            ["comparison-supports-dimension"],
            ["unit-name-substitution"]
          ]
        ],
        outcome:
          "The appended unit may look plausible but is not justified by the wheel quantity relationship.",
        criterionConditionId: "derived-relation-preserved",
        criterion:
          "Return to the named quantity and rebuild the unit expression from its defining relationship.",
        verification:
          "Remove the appended symbol and ask which unit factors the calculation itself requires."
      }
    ],
    misconception: {
      id: "quantity-is-unit",
      claim:
        "A physical quantity and its unit are the same thing.",
      mechanism:
        "Conflating property, value and unit hides whether the unit expression actually represents the intended phenomenon.",
      correction:
        "Name the physical quantity, keep value and unit distinct, then derive the unit factors from the quantity relationship.",
      disconfirmingObservation:
        "The same wheel quantity can be expressed using different compatible units without becoming a different physical property.",
      entityIds: [
        "wheel-phenomenon",
        "quantity-statement",
        "base-unit-factors",
        "derived-expression"
      ],
      relationIds: [
        "phenomenon-maps-quantity",
        "quantity-depends-unit",
        "derived-compares-quantity"
      ],
      conditionIds: ["unit-name-substitution", "derived-relation-preserved"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Arrange the wheel measurement from physical quantity to verified derived unit:",
            "The wheel sequence names the property, attaches a unit, composes factors and checks consistency.",
            "The wheel sequence currently appends a unit before the quantity relationship is established.",
            "Start with the wheel-motion phenomenon and named physical quantity.",
            "Place the base-unit factors before the derived expression.",
            "Attach value and compatible unit to the named wheel quantity.",
            "Compare the derived unit with the wheel quantity before accepting it."
          ),
          focusRef: reasonedCase("wheel-unit-example", "scenario"),
          contextConditionIds: [
            "quantity-value-unit-declared",
            "derived-relation-preserved"
          ],
          steps: [
            [
              "map-property",
              ["phenomenon-maps-quantity"],
              ["quantity-value-unit-declared"]
            ],
            [
              "bind-unit",
              ["quantity-depends-unit"],
              ["quantity-value-unit-declared"]
            ],
            [
              "compose-unit",
              ["base-factors-compose-derived"],
              ["derived-relation-preserved"]
            ],
            [
              "check-expression",
              ["derived-compares-quantity", "comparison-supports-dimension"],
              ["derived-relation-preserved"]
            ]
          ],
          correctOrder: [
            "map-property",
            "bind-unit",
            "compose-unit",
            "check-expression"
          ]
        },
        retry: {
          instruction: instruction(
            "Replace an appended wheel-unit label with a defensible quantity statement:",
            "The repair rebuilds the wheel unit from the named property and its defining relationship.",
            "The repair still trusts the familiar wheel symbol without deriving its factors.",
            "Remove the wheel unit label and state the physical quantity first.",
            "Write how the wheel quantity combines base quantities.",
            "Construct the derived wheel-unit expression from those factors.",
            "Retain the unit only after the quantity-unit comparison passes."
          ),
          focusRef: reasonedCase("unit-label-counterexample", "scenario"),
          contextConditionIds: [
            "unit-name-substitution",
            "derived-relation-preserved"
          ],
          steps: [
            [
              "remove-label",
              ["phenomenon-maps-quantity"],
              ["unit-name-substitution"]
            ],
            [
              "derive-factors",
              ["quantity-depends-unit", "base-factors-compose-derived"],
              ["derived-relation-preserved"]
            ],
            [
              "verify-unit",
              ["comparison-supports-dimension"],
              ["derived-relation-preserved"]
            ]
          ],
          correctOrder: ["remove-label", "derive-factors", "verify-unit"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the wheel statements that keep quantity and unit coherent:",
            "The selected wheel statements name the property and preserve its derived-unit relationship.",
            "A selected wheel statement treats a unit symbol as the property or ignores factor structure.",
            "Look for a wheel quantity named before its numerical expression.",
            "Look for base-unit factors following the physical relationship.",
            "Select the phenomenon-to-quantity mapping for wheel motion.",
            "Select the derived-expression comparison that supports consistency."
          ),
          focusRef: term("physical-quantity", "definition"),
          contextConditionIds: [
            "quantity-value-unit-declared",
            "derived-relation-preserved"
          ],
          options: [
            [
              "named-property",
              true,
              relation("phenomenon-maps-quantity"),
              condition("quantity-value-unit-declared"),
              ["phenomenon-maps-quantity", "quantity-depends-unit"],
              ["quantity-value-unit-declared"],
              null
            ],
            [
              "derived-check",
              true,
              relation("comparison-supports-dimension"),
              condition("derived-relation-preserved"),
              ["derived-compares-quantity", "comparison-supports-dimension"],
              ["derived-relation-preserved"],
              null
            ],
            [
              "same-thing",
              false,
              misconception("quantity-is-unit", "claim"),
              misconception("quantity-is-unit", "mechanism"),
              ["quantity-depends-unit"],
              ["unit-name-substitution"],
              "quantity-is-unit"
            ],
            [
              "symbol-only",
              false,
              term("unit", "boundary"),
              reasonedCase("wheel-unit-example", "criterion"),
              ["base-factors-compose-derived"],
              ["derived-relation-preserved"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose why a familiar wheel-unit symbol may be physically wrong:",
            "The diagnosis finds the missing quantity name and missing derived-factor proof.",
            "The diagnosis rejects a valid wheel unit merely because it has a special name.",
            "Ask which measurable wheel property the symbol is meant to express.",
            "Expand the wheel unit into base-unit factors before judging it.",
            "Flag the absent wheel-quantity statement as a semantic break.",
            "Flag a mismatched factor structure as a derived-unit break."
          ),
          focusRef: reasonedCase("unit-label-counterexample", "verification"),
          contextConditionIds: [
            "unit-name-substitution",
            "derived-relation-preserved"
          ],
          options: [
            [
              "missing-quantity",
              true,
              term("physical-quantity", "boundary"),
              relation("phenomenon-maps-quantity"),
              ["phenomenon-maps-quantity"],
              ["unit-name-substitution"],
              null
            ],
            [
              "missing-factors",
              true,
              term("derived-unit", "boundary"),
              relation("base-factors-compose-derived"),
              ["base-factors-compose-derived", "derived-compares-quantity"],
              ["derived-relation-preserved"],
              null
            ],
            [
              "same-unit-compatible",
              true,
              condition("quantity-value-unit-declared"),
              relation("quantity-depends-unit"),
              ["quantity-depends-unit"],
              ["quantity-value-unit-declared"],
              null
            ],
            [
              "quantity-equals-symbol",
              false,
              misconception("quantity-is-unit", "claim"),
              misconception("quantity-is-unit", "mechanism"),
              ["phenomenon-maps-quantity", "quantity-depends-unit"],
              ["unit-name-substitution"],
              "quantity-is-unit"
            ],
            [
              "trust-familiarity",
              false,
              reasonedCase("unit-label-counterexample", "outcome"),
              reasonedCase("unit-label-counterexample", "criterion"),
              ["comparison-supports-dimension"],
              ["unit-name-substitution"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why a physical quantity is not identical to its unit:",
            "The explanation distinguishes wheel property, measurement unit and derived-factor relationship.",
            "The explanation omits a wheel concept group or treats the numerical value as the property.",
            "Define the physical wheel quantity before discussing units.",
            "Describe the unit as a reference for expressing magnitude.",
            "Explain how base-unit factors compose the wheel derived unit.",
            "Use the derived comparison to verify the quantity-unit pairing."
          ),
          focusRef: misconception("quantity-is-unit", "claim"),
          contextConditionIds: [
            "unit-name-substitution",
            "derived-relation-preserved"
          ],
          conceptGroups: [
            [
              "quantity-group",
              term("physical-quantity", "label"),
              [term("physical-quantity", "definition")],
              ["phenomenon-maps-quantity"],
              ["quantity-value-unit-declared"]
            ],
            [
              "unit-group",
              term("unit", "label"),
              [term("unit", "definition")],
              ["quantity-depends-unit"],
              ["quantity-value-unit-declared"]
            ],
            [
              "derived-group",
              term("derived-unit", "label"),
              [term("derived-unit", "definition")],
              ["base-factors-compose-derived", "derived-compares-quantity"],
              ["derived-relation-preserved"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["comparison-supports-dimension"],
          criterionConditionId: "derived-relation-preserved"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match each wheel-quantity relation to the declaration that validates it:",
            "The wheel matches now connect property, unit factors and derived expression to their boundaries.",
            "One wheel match assigns a unit factor to the wrong quantity role.",
            "Pair phenomenon mapping with the declared wheel quantity.",
            "Pair unit composition with the preserved derived relationship.",
            "Connect the wheel value to a compatible measurement unit.",
            "Connect the derived expression to the quantity-unit consistency decision."
          ),
          focusRef: reasonedCase("wheel-unit-example", "scenario"),
          contextConditionIds: [
            "quantity-value-unit-declared",
            "derived-relation-preserved"
          ],
          pairs: [
            [
              "quantity-pair",
              relation("phenomenon-maps-quantity"),
              condition("quantity-value-unit-declared"),
              relation("phenomenon-maps-quantity"),
              ["phenomenon-maps-quantity"],
              ["quantity-value-unit-declared"]
            ],
            [
              "factor-pair",
              relation("base-factors-compose-derived"),
              condition("derived-relation-preserved"),
              relation("base-factors-compose-derived"),
              ["base-factors-compose-derived"],
              ["derived-relation-preserved"]
            ],
            [
              "decision-pair",
              relation("comparison-supports-dimension"),
              term("derived-unit", "boundary"),
              relation("comparison-supports-dimension"),
              ["derived-compares-quantity", "comparison-supports-dimension"],
              ["derived-relation-preserved"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the wheel-unit graph when a familiar symbol was appended without derivation:",
            "The wheel implication removes the unsupported label and rebuilds the derived expression.",
            "The wheel implication accepts symbol familiarity or discards the underlying quantity.",
            "Trace the wheel phenomenon into its quantity statement.",
            "Use the derived-relation boundary at the base-unit factors.",
            "Locate the absent wheel unit-composition relation.",
            "Rebuild the wheel expression before making a consistency decision."
          ),
          focusRef: reasonedCase("unit-label-counterexample", "outcome"),
          contextConditionIds: [
            "unit-name-substitution",
            "derived-relation-preserved"
          ],
          positions: [
            ["wheel-phenomenon", 0, 0],
            ["quantity-statement", 1, 0],
            ["base-unit-factors", 2, 0],
            ["derived-expression", 3, 0]
          ],
          relationIds: [
            "phenomenon-maps-quantity",
            "quantity-depends-unit",
            "base-factors-compose-derived"
          ],
          answerRelationIds: ["base-factors-compose-derived"],
          options: [
            [
              "derive-again",
              true,
              reasonedCase("unit-label-counterexample", "verification"),
              condition("derived-relation-preserved"),
              ["quantity-depends-unit", "base-factors-compose-derived"],
              ["unit-name-substitution", "derived-relation-preserved"],
              null
            ],
            [
              "trust-symbol",
              false,
              misconception("quantity-is-unit", "claim"),
              misconception("quantity-is-unit", "mechanism"),
              ["quantity-depends-unit"],
              ["unit-name-substitution"],
              "quantity-is-unit"
            ],
            [
              "remove-quantity",
              false,
              term("unit", "boundary"),
              reasonedCase("wheel-unit-example", "criterion"),
              ["phenomenon-maps-quantity"],
              ["quantity-value-unit-declared"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the verified wheel-quantity graph after the unit factors are composed:",
            "The wheel graph supports the unit because its factor structure matches the named quantity.",
            "The wheel graph claims one unit is the quantity itself or ignores the numerical statement.",
            "Follow the wheel-motion phenomenon into the quantity statement.",
            "Follow base-unit factors into the derived wheel expression.",
            "Compare the wheel derived expression with the named property.",
            "Accept the wheel unit only when the consistency relation is supported."
          ),
          focusRef: reasonedCase("wheel-unit-example", "outcome"),
          contextConditionIds: [
            "quantity-value-unit-declared",
            "derived-relation-preserved"
          ],
          positions: [
            ["wheel-phenomenon", 0, 1],
            ["quantity-statement", 1, 1],
            ["base-unit-factors", 1, 2],
            ["derived-expression", 2, 2],
            ["dimension-decision", 3, 1]
          ],
          relationIds: [
            "phenomenon-maps-quantity",
            "base-factors-compose-derived",
            "derived-compares-quantity",
            "comparison-supports-dimension"
          ],
          answerRelationIds: ["comparison-supports-dimension"],
          options: [
            [
              "accept-coherent",
              true,
              reasonedCase("wheel-unit-example", "verification"),
              condition("derived-relation-preserved"),
              ["derived-compares-quantity", "comparison-supports-dimension"],
              ["quantity-value-unit-declared", "derived-relation-preserved"],
              null
            ],
            [
              "unit-is-property",
              false,
              term("physical-quantity", "boundary"),
              reasonedCase("wheel-unit-example", "criterion"),
              ["comparison-supports-dimension"],
              ["derived-relation-preserved"],
              null
            ],
            [
              "skip-value",
              false,
              misconception("quantity-is-unit", "claim"),
              misconception("quantity-is-unit", "disconfirmingObservation"),
              ["phenomenon-maps-quantity", "derived-compares-quantity"],
              ["unit-name-substitution", "quantity-value-unit-declared"],
              "quantity-is-unit"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("derived-unit", "label"),
      focusRef: reasonedCase("wheel-unit-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["wheel-phenomenon", 0, 0],
        ["quantity-statement", 1, 0],
        ["base-unit-factors", 1, 1],
        ["derived-expression", 2, 1],
        ["dimension-decision", 3, 0]
      ],
      visibleEntityIds: [
        "wheel-phenomenon",
        "quantity-statement",
        "base-unit-factors",
        "derived-expression",
        "dimension-decision"
      ],
      visibleRelationIds: [
        "phenomenon-maps-quantity",
        "quantity-depends-unit",
        "base-factors-compose-derived",
        "derived-compares-quantity",
        "comparison-supports-dimension"
      ],
      controls: [
        [
          "quantity-view",
          term("physical-quantity", "label"),
          ["quantity-value-unit-declared"],
          ["wheel-phenomenon", "quantity-statement", "base-unit-factors"],
          ["phenomenon-maps-quantity", "quantity-depends-unit"],
          [],
          [],
          [
            [
              "property-visible",
              "The wheel property remains distinct from its value and unit.",
              ["wheel-phenomenon", "quantity-statement"],
              ["phenomenon-maps-quantity"]
            ]
          ],
          reasonedCase("wheel-unit-example", "verification")
        ],
        [
          "derived-view",
          term("derived-unit", "label"),
          ["derived-relation-preserved"],
          ["base-unit-factors", "derived-expression", "dimension-decision"],
          [
            "base-factors-compose-derived",
            "derived-compares-quantity",
            "comparison-supports-dimension"
          ],
          ["phenomenon-maps-quantity"],
          [],
          [
            [
              "factor-proof",
              "The wheel derived-unit factors support the consistency decision.",
              ["base-unit-factors", "derived-expression", "dimension-decision"],
              ["base-factors-compose-derived", "comparison-supports-dimension"]
            ]
          ],
          reasonedCase("wheel-unit-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D02-L04",
    systemModel:
      "A dimensional check names each physical quantity, converts values into compatible SI units, follows the formula's quantity structure and compares the result with units and physical scale before acceptance.",
    failurePattern:
      "A calculator can return a clean stress number even when a length was used as an area, an area conversion was missed or the loading assumptions do not support average normal stress.",
    visualExplanation:
      "A stress-check graph connects applied axial force, loaded area, SI-converted inputs, average normal stress and a plausibility decision.",
    applicationTask:
      "Calculate average normal stress using sigma = F/A with force F in newtons and loaded area A in square metres, then state the centred axial-load and average-stress boundary and verify the result's unit and magnitude.",
    terms: [
      [
        "dimension",
        "Physical dimension",
        "The quantity structure represented by factors such as force, length, area and time.",
        "A dimension is not the same as a chosen unit symbol.",
        "name-inputs"
      ],
      [
        "conversion-factor",
        "Unit conversion factor",
        "A ratio equal to one that changes the unit representation without changing the physical quantity.",
        "A valid conversion must preserve both value meaning and dimensional power.",
        "convert-inputs"
      ],
      [
        "average-normal-stress",
        "Average normal stress",
        "The centred axial force divided by the loaded cross-sectional area, sigma = F/A.",
        "This average relation does not describe local stress concentrations, bending or off-centre loading.",
        "apply-stress"
      ]
    ],
    entities: [
      [
        "axial-force",
        "input",
        "Centred axial force",
        "The declared force F acting normal to and through the loaded section."
      ],
      [
        "loaded-area",
        "input",
        "Loaded cross-sectional area",
        "The area A carrying the declared axial force."
      ],
      [
        "si-inputs",
        "state",
        "SI stress inputs",
        "Force expressed in newtons and area expressed in square metres."
      ],
      [
        "stress-result",
        "observation",
        "Average stress result",
        "The quotient sigma = F/A with the derived unit N/m^2."
      ],
      [
        "stress-plausibility",
        "decision",
        "Stress plausibility decision",
        "The decision that the result's dimension, unit, scale and model boundary are coherent."
      ]
    ],
    relations: [
      [
        "force-maps-si",
        "transforms",
        ["axial-force"],
        ["si-inputs"],
        "the axial force is represented in newtons without changing the physical force",
        "directed",
        "one-to-one"
      ],
      [
        "area-maps-si",
        "transforms",
        ["loaded-area"],
        ["si-inputs"],
        "the loaded area is represented in square metres with its squared dimension preserved",
        "directed",
        "one-to-one"
      ],
      [
        "inputs-transform-stress",
        "transforms",
        ["si-inputs"],
        ["stress-result"],
        "dividing force F by loaded area A produces average normal stress sigma",
        "directed",
        "many-to-one"
      ],
      [
        "stress-compares-scale",
        "compares",
        ["stress-result"],
        ["axial-force", "loaded-area"],
        "the stress result is compared with the force and loaded-area scale",
        "undirected",
        "one-to-many"
      ],
      [
        "checks-support-plausibility",
        "supports",
        ["stress-result", "si-inputs"],
        ["stress-plausibility"],
        "dimension, unit, scale and loading-boundary checks support the stress decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "force-area-si",
        "criterion",
        "Force F is in newtons and loaded area A is in square metres before division.",
        ["axial-force", "loaded-area", "si-inputs", "stress-result"],
        ["force-maps-si", "area-maps-si", "inputs-transform-stress"]
      ],
      [
        "centred-average-boundary",
        "boundary",
        "The load is centred and axial, and sigma = F/A is interpreted as average normal stress over the loaded area.",
        ["axial-force", "loaded-area", "stress-result", "stress-plausibility"],
        [
          "inputs-transform-stress",
          "stress-compares-scale",
          "checks-support-plausibility"
        ]
      ],
      [
        "area-treated-as-length",
        "assumption",
        "A single section length or an unconverted area unit is inserted as though it were square metres.",
        ["loaded-area", "si-inputs", "stress-result"],
        ["area-maps-si", "inputs-transform-stress"]
      ]
    ],
    failureBoundary: [
      "dimensionally-invalid-stress",
      "force-area-si",
      "Using a length in place of area or losing the squared conversion changes the physical dimension and stress scale.",
      "The calculator result lacks N/m^2 or changes implausibly when the area unit representation changes.",
      "Accept sigma = F/A only with F in N, A in m^2 and the centred axial average-stress boundary stated.",
      [
        "axial-force",
        "loaded-area",
        "si-inputs",
        "stress-result",
        "stress-plausibility"
      ],
      [
        "area-maps-si",
        "inputs-transform-stress",
        "checks-support-plausibility"
      ]
    ],
    conceptualModel: [
      [
        "name-inputs",
        "Identify F as axial force and A as the loaded cross-sectional area, not a section length.",
        ["axial-force", "loaded-area"],
        ["stress-compares-scale"],
        ["centred-average-boundary"]
      ],
      [
        "convert-inputs",
        "Convert F to newtons and A to square metres while preserving the area's squared conversion.",
        ["axial-force", "loaded-area", "si-inputs"],
        ["force-maps-si", "area-maps-si"],
        ["force-area-si"]
      ],
      [
        "apply-stress",
        "Calculate sigma = F/A using the compatible SI inputs.",
        ["si-inputs", "stress-result"],
        ["inputs-transform-stress"],
        ["force-area-si", "centred-average-boundary"]
      ],
      [
        "check-dimension",
        "Verify that force divided by area produces N/m^2 and that increased area lowers average stress for fixed force.",
        ["stress-result", "axial-force", "loaded-area"],
        ["stress-compares-scale"],
        ["force-area-si"]
      ],
      [
        "state-boundary",
        "State that the result is an average for centred axial loading and does not resolve local concentrations or bending.",
        ["stress-result", "stress-plausibility"],
        ["checks-support-plausibility"],
        ["centred-average-boundary"]
      ]
    ],
    reasonedCases: [
      {
        id: "average-stress-example",
        kind: "example",
        scenario:
          "A learner identifies a centred axial force and loaded cross-sectional area, converts F to newtons and A to square metres, then evaluates sigma = F/A.",
        changedConditionIds: ["force-area-si"],
        givens: [
          [
            "symbolic-inputs",
            "Declared quantities",
            "Force F acts normally through the centre of loaded area A.",
            null,
            "si-inputs"
          ]
        ],
        reasoningSteps: [
          [
            "example-quantities",
            "Force and area are identified by physical meaning before their units are converted.",
            ["axial-force", "loaded-area", "si-inputs"],
            ["force-maps-si", "area-maps-si"],
            ["force-area-si"]
          ],
          [
            "example-formula",
            "The quotient follows sigma = F/A and therefore carries force-per-area units.",
            ["si-inputs", "stress-result"],
            ["inputs-transform-stress"],
            ["force-area-si"]
          ],
          [
            "example-bound",
            "The unit, inverse-area trend and centred axial boundary are used to judge the result.",
            [
              "axial-force",
              "loaded-area",
              "stress-result",
              "stress-plausibility"
            ],
            ["stress-compares-scale", "checks-support-plausibility"],
            ["centred-average-boundary"]
          ]
        ],
        outcome:
          "The result is a dimensionally coherent average normal stress for the declared loading model.",
        criterionConditionId: "centred-average-boundary",
        criterion:
          "The conclusion must retain the centred axial-load and average-over-area assumptions.",
        verification:
          "Check the input units, derive N/m^2, and confirm that increasing A at fixed F lowers the calculated average stress."
      },
      {
        id: "area-dimension-counterexample",
        kind: "counterexample",
        scenario:
          "A learner inserts one section length for A and reports the calculator quotient as stress without checking the squared area unit.",
        changedConditionIds: ["area-treated-as-length"],
        givens: [
          [
            "wrong-area-input",
            "Misidentified input",
            "A single length is entered where loaded cross-sectional area is required.",
            null,
            "loaded-area"
          ]
        ],
        reasoningSteps: [
          [
            "counter-area",
            "The input does not have area dimension and cannot be represented as square metres.",
            ["loaded-area", "si-inputs"],
            ["area-maps-si"],
            ["area-treated-as-length", "force-area-si"]
          ],
          [
            "counter-unit",
            "Dividing force by a length cannot produce the force-per-area unit required for stress.",
            ["si-inputs", "stress-result"],
            ["inputs-transform-stress"],
            ["area-treated-as-length"]
          ],
          [
            "counter-plausibility",
            "A clean calculator display cannot repair the failed dimension or justify the stress conclusion.",
            ["stress-result", "stress-plausibility"],
            ["checks-support-plausibility"],
            ["area-treated-as-length", "centred-average-boundary"]
          ]
        ],
        outcome:
          "The quotient is not average normal stress because the loaded-area dimension is missing.",
        criterionConditionId: "centred-average-boundary",
        criterion:
          "Determine the actual cross-sectional area, convert it to square metres and repeat the bounded calculation.",
        verification:
          "Cancel the input units symbolically before entering numbers and confirm that N/m^2 remains."
      }
    ],
    misconception: {
      id: "conversion-is-symbol-swap",
      claim:
        "Converting an area means changing only the unit symbol while keeping the same numerical value.",
      mechanism:
        "Area carries a squared length dimension, so the length conversion factor must also be squared.",
      correction:
        "Convert the loaded area with its full squared factor, then apply sigma = F/A using N and m^2.",
      disconfirmingObservation:
        "The reported stress changes when the same physical area is written in a different area unit.",
      entityIds: ["loaded-area", "si-inputs", "stress-result", "stress-plausibility"],
      relationIds: [
        "area-maps-si",
        "inputs-transform-stress",
        "checks-support-plausibility"
      ],
      conditionIds: ["area-treated-as-length", "force-area-si"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the average-stress check from physical inputs to bounded conclusion:",
            "The stress sequence identifies area, converts SI inputs, applies F/A and checks the model.",
            "The stress sequence currently divides before converting area or treats a length as A.",
            "Begin by identifying centred axial force and loaded cross-sectional area.",
            "Place the squared area conversion before the stress quotient.",
            "Calculate average stress only after F is in N and A is in m^2.",
            "Finish with unit, trend and centred-load plausibility checks."
          ),
          focusRef: reasonedCase("average-stress-example", "scenario"),
          contextConditionIds: ["force-area-si", "centred-average-boundary"],
          steps: [
            [
              "convert-force",
              ["force-maps-si"],
              ["force-area-si"]
            ],
            [
              "convert-area",
              ["area-maps-si"],
              ["force-area-si"]
            ],
            [
              "calculate-stress",
              ["inputs-transform-stress"],
              ["force-area-si", "centred-average-boundary"]
            ],
            [
              "check-stress",
              ["stress-compares-scale", "checks-support-plausibility"],
              ["centred-average-boundary"]
            ]
          ],
          correctOrder: [
            "convert-force",
            "convert-area",
            "calculate-stress",
            "check-stress"
          ]
        },
        retry: {
          instruction: instruction(
            "Repair a force-divided-by-length result before calling it stress:",
            "The repair replaces the length with loaded area and restores the N/m^2 dimension.",
            "The repair still changes only a unit symbol or ignores the average-stress boundary.",
            "Return to the section geometry and identify the loaded area.",
            "Apply the squared length conversion when producing square metres.",
            "Rebuild the stress inputs as F in N and A in m^2.",
            "Recalculate sigma and state the centred axial average boundary."
          ),
          focusRef: reasonedCase("area-dimension-counterexample", "scenario"),
          contextConditionIds: ["area-treated-as-length", "force-area-si"],
          steps: [
            [
              "recover-area",
              ["area-maps-si"],
              ["area-treated-as-length", "force-area-si"]
            ],
            [
              "recalculate",
              ["inputs-transform-stress"],
              ["force-area-si"]
            ],
            [
              "rebound",
              ["checks-support-plausibility"],
              ["centred-average-boundary"]
            ]
          ],
          correctOrder: ["recover-area", "recalculate", "rebound"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the evidence required to accept the average-stress result:",
            "The selected stress evidence confirms N, m^2, F/A and the centred axial boundary.",
            "A selected stress item trusts a calculator display or loses the squared area dimension.",
            "Look for loaded area explicitly represented in square metres.",
            "Look for the inverse-area stress trend at fixed force.",
            "Select the SI input transformations before the stress quotient.",
            "Select the boundary check supporting the average-stress decision."
          ),
          focusRef: term("average-normal-stress", "definition"),
          contextConditionIds: ["force-area-si", "centred-average-boundary"],
          options: [
            [
              "si-input-proof",
              true,
              condition("force-area-si"),
              relation("inputs-transform-stress"),
              ["force-maps-si", "area-maps-si", "inputs-transform-stress"],
              ["force-area-si"],
              null
            ],
            [
              "model-proof",
              true,
              relation("checks-support-plausibility"),
              condition("centred-average-boundary"),
              ["stress-compares-scale", "checks-support-plausibility"],
              ["centred-average-boundary"],
              null
            ],
            [
              "symbol-swap",
              false,
              misconception("conversion-is-symbol-swap", "claim"),
              misconception("conversion-is-symbol-swap", "mechanism"),
              ["area-maps-si"],
              ["area-treated-as-length"],
              "conversion-is-symbol-swap"
            ],
            [
              "local-stress",
              false,
              term("average-normal-stress", "boundary"),
              reasonedCase("average-stress-example", "criterion"),
              ["checks-support-plausibility"],
              ["centred-average-boundary"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose why a neat force-over-length quotient fails the stress check:",
            "The diagnosis exposes the missing area dimension and unsupported loading model.",
            "The diagnosis rejects valid newton input or assumes every force quotient is stress.",
            "Cancel the stress input units before examining the numerical display.",
            "Check whether the loaded section is an area expressed in m^2.",
            "Flag the force-per-length unit as a dimensional failure.",
            "Flag off-centre or bending behaviour as outside average normal stress."
          ),
          focusRef: reasonedCase("area-dimension-counterexample", "verification"),
          contextConditionIds: ["area-treated-as-length", "centred-average-boundary"],
          options: [
            [
              "wrong-dimension",
              true,
              condition("force-area-si"),
              relation("area-maps-si"),
              ["area-maps-si", "inputs-transform-stress"],
              ["area-treated-as-length", "force-area-si"],
              null
            ],
            [
              "wrong-boundary",
              true,
              condition("centred-average-boundary"),
              relation("checks-support-plausibility"),
              ["stress-compares-scale", "checks-support-plausibility"],
              ["centred-average-boundary"],
              null
            ],
            [
              "force-valid",
              true,
              relation("force-maps-si"),
              condition("force-area-si"),
              ["force-maps-si"],
              ["force-area-si"],
              null
            ],
            [
              "rename-unit",
              false,
              misconception("conversion-is-symbol-swap", "claim"),
              misconception("conversion-is-symbol-swap", "mechanism"),
              ["area-maps-si", "inputs-transform-stress"],
              ["area-treated-as-length"],
              "conversion-is-symbol-swap"
            ],
            [
              "calculator-proof",
              false,
              reasonedCase("area-dimension-counterexample", "outcome"),
              reasonedCase("area-dimension-counterexample", "criterion"),
              ["checks-support-plausibility"],
              ["centred-average-boundary"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: instruction(
            "Match each stress relation to the dimensional or model condition it requires:",
            "The stress matches now connect SI conversion, F/A and average-load interpretation.",
            "One stress match assigns a force or area relation to the wrong boundary.",
            "Pair force and area conversion with the SI input criterion.",
            "Pair the stress plausibility relation with centred axial loading.",
            "Connect loaded-area conversion to the squared dimension.",
            "Connect the F/A quotient to average normal stress."
          ),
          focusRef: reasonedCase("average-stress-example", "scenario"),
          contextConditionIds: ["force-area-si", "centred-average-boundary"],
          pairs: [
            [
              "area-pair",
              relation("area-maps-si"),
              condition("force-area-si"),
              relation("area-maps-si"),
              ["area-maps-si"],
              ["force-area-si"]
            ],
            [
              "formula-pair",
              relation("inputs-transform-stress"),
              term("average-normal-stress", "definition"),
              relation("inputs-transform-stress"),
              ["inputs-transform-stress"],
              ["force-area-si", "centred-average-boundary"]
            ],
            [
              "boundary-pair",
              relation("checks-support-plausibility"),
              condition("centred-average-boundary"),
              relation("checks-support-plausibility"),
              ["stress-compares-scale", "checks-support-plausibility"],
              ["centred-average-boundary"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instruction(
            "Explain why changing only an area-unit symbol corrupts stress:",
            "The explanation joins physical dimension, squared conversion and average-stress boundary.",
            "The explanation omits a stress concept group or treats length as loaded area.",
            "Define the difference between loaded-area dimension and a single length.",
            "Explain why the area conversion factor is squared.",
            "State average stress sigma = F/A with F in N and A in m^2.",
            "Limit the stress result to centred axial average loading."
          ),
          focusRef: misconception("conversion-is-symbol-swap", "claim"),
          contextConditionIds: ["area-treated-as-length", "centred-average-boundary"],
          conceptGroups: [
            [
              "dimension-group",
              term("dimension", "label"),
              [term("dimension", "definition")],
              ["area-maps-si"],
              ["force-area-si"]
            ],
            [
              "conversion-group",
              term("conversion-factor", "label"),
              [term("conversion-factor", "definition")],
              ["force-maps-si", "area-maps-si"],
              ["force-area-si"]
            ],
            [
              "stress-group",
              term("average-normal-stress", "label"),
              [term("average-normal-stress", "definition")],
              ["inputs-transform-stress", "checks-support-plausibility"],
              ["centred-average-boundary"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["inputs-transform-stress"],
          criterionConditionId: "centred-average-boundary"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the stress graph when A was entered as a length:",
            "The stress implication rejects the quotient and returns to loaded-area geometry.",
            "The stress implication changes only the displayed unit or accepts force per length.",
            "Trace the loaded area into its SI representation.",
            "Use the N/m^2 stress criterion at the quotient node.",
            "Locate the broken squared-area transformation.",
            "Recover loaded area A in m^2 before calculating average stress again."
          ),
          focusRef: reasonedCase("area-dimension-counterexample", "outcome"),
          contextConditionIds: ["area-treated-as-length", "force-area-si"],
          positions: [
            ["loaded-area", 0, 0],
            ["si-inputs", 1, 0],
            ["stress-result", 2, 0],
            ["stress-plausibility", 3, 0]
          ],
          relationIds: [
            "area-maps-si",
            "inputs-transform-stress",
            "checks-support-plausibility"
          ],
          answerRelationIds: ["area-maps-si"],
          options: [
            [
              "recover-square-area",
              true,
              reasonedCase("area-dimension-counterexample", "verification"),
              condition("force-area-si"),
              ["area-maps-si", "inputs-transform-stress"],
              ["area-treated-as-length", "force-area-si"],
              null
            ],
            [
              "swap-symbol",
              false,
              misconception("conversion-is-symbol-swap", "claim"),
              misconception("conversion-is-symbol-swap", "mechanism"),
              ["area-maps-si"],
              ["area-treated-as-length"],
              "conversion-is-symbol-swap"
            ],
            [
              "accept-force-length",
              false,
              term("average-normal-stress", "boundary"),
              reasonedCase("average-stress-example", "criterion"),
              ["checks-support-plausibility"],
              ["centred-average-boundary"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the verified stress graph after force and area are in SI units:",
            "The stress graph supports sigma = F/A as a bounded average normal stress.",
            "The stress graph claims local peak stress or ignores the centred-load assumption.",
            "Follow axial force and loaded area into the SI input state.",
            "Follow the F/A transformation into the average stress result.",
            "Check N/m^2 and the inverse-area stress trend.",
            "Accept the result only as an average under centred axial loading."
          ),
          focusRef: reasonedCase("average-stress-example", "outcome"),
          contextConditionIds: ["force-area-si", "centred-average-boundary"],
          positions: [
            ["axial-force", 0, 1],
            ["loaded-area", 0, 2],
            ["si-inputs", 1, 1],
            ["stress-result", 2, 1],
            ["stress-plausibility", 3, 1]
          ],
          relationIds: [
            "force-maps-si",
            "area-maps-si",
            "inputs-transform-stress",
            "checks-support-plausibility"
          ],
          answerRelationIds: ["checks-support-plausibility"],
          options: [
            [
              "accept-average",
              true,
              reasonedCase("average-stress-example", "verification"),
              condition("centred-average-boundary"),
              ["inputs-transform-stress", "checks-support-plausibility"],
              ["force-area-si", "centred-average-boundary"],
              null
            ],
            [
              "claim-local-peak",
              false,
              term("average-normal-stress", "boundary"),
              reasonedCase("average-stress-example", "criterion"),
              ["checks-support-plausibility"],
              ["centred-average-boundary"],
              null
            ],
            [
              "ignore-area-power",
              false,
              misconception("conversion-is-symbol-swap", "claim"),
              misconception(
                "conversion-is-symbol-swap",
                "disconfirmingObservation"
              ),
              ["area-maps-si", "checks-support-plausibility"],
              ["area-treated-as-length", "force-area-si"],
              "conversion-is-symbol-swap"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("average-normal-stress", "label"),
      focusRef: reasonedCase("average-stress-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["axial-force", 0, 0],
        ["loaded-area", 0, 1],
        ["si-inputs", 1, 0],
        ["stress-result", 2, 0],
        ["stress-plausibility", 3, 0]
      ],
      visibleEntityIds: [
        "axial-force",
        "loaded-area",
        "si-inputs",
        "stress-result",
        "stress-plausibility"
      ],
      visibleRelationIds: [
        "force-maps-si",
        "area-maps-si",
        "inputs-transform-stress",
        "stress-compares-scale",
        "checks-support-plausibility"
      ],
      controls: [
        [
          "si-input-view",
          term("conversion-factor", "label"),
          ["force-area-si"],
          ["axial-force", "loaded-area", "si-inputs"],
          ["force-maps-si", "area-maps-si"],
          [],
          [],
          [
            [
              "squared-area",
              "Force is in N and loaded area is in m^2 before division.",
              ["axial-force", "loaded-area", "si-inputs"],
              ["force-maps-si", "area-maps-si"]
            ]
          ],
          reasonedCase("average-stress-example", "verification")
        ],
        [
          "stress-boundary-view",
          term("average-normal-stress", "label"),
          ["centred-average-boundary"],
          ["si-inputs", "stress-result", "stress-plausibility"],
          [
            "inputs-transform-stress",
            "stress-compares-scale",
            "checks-support-plausibility"
          ],
          ["force-maps-si"],
          [],
          [
            [
              "average-only",
              "The stress decision remains bounded to centred axial average loading.",
              ["stress-result", "stress-plausibility"],
              ["checks-support-plausibility"]
            ]
          ],
          reasonedCase("average-stress-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D02-L05",
    systemModel:
      "Measurement resolution constrains which changes a device can distinguish, while reporting precision communicates only the digits justified by the observation method and decision context.",
    failurePattern:
      "Extra displayed or calculated digits can be mistaken for extra measurement information that the sensor never resolved.",
    visualExplanation:
      "A reporting graph connects a position sensor, resolution step, raw reading, justified report, scale comparison and engineering decision.",
    applicationTask:
      "Report a robot position reading using the sensor's declared resolution, explain which digits are supported and use a resolution-to-magnitude ratio only as a scale comparison rather than a universal significant-figures rule.",
    terms: [
      [
        "resolution",
        "Measurement resolution",
        "The smallest change distinguished by the declared measurement method or display state.",
        "Resolution is not automatically the same as accuracy, uncertainty or correctness.",
        "identify-resolution"
      ],
      [
        "significant-figures",
        "Significant figures",
        "Digits retained to communicate the precision supported by the quantity and reporting context.",
        "A fixed count of significant figures is not universally correct for every measurement or calculation.",
        "choose-report"
      ],
      [
        "relative-resolution",
        "Relative resolution",
        "A declared resolution divided by a nonzero magnitude to compare their scales.",
        "The ratio helps compare scales but does not by itself choose a universal significant-figures count.",
        "compare-scale"
      ]
    ],
    entities: [
      [
        "position-sensor",
        "component",
        "Robot position sensor",
        "The device and readout state that produce the position observation."
      ],
      [
        "resolution-step",
        "constraint",
        "Declared position resolution",
        "The smallest position increment distinguished in the stated sensor mode."
      ],
      [
        "raw-reading",
        "observation",
        "Observed position reading",
        "The value shown or recorded before reporting decisions are applied."
      ],
      [
        "reported-position",
        "state",
        "Justified position report",
        "The position value written with digits supported by the method and context."
      ],
      [
        "reporting-decision",
        "decision",
        "Position reporting decision",
        "The decision that the report communicates supported precision without implying more."
      ]
    ],
    relations: [
      [
        "sensor-constrains-resolution",
        "constrains",
        ["position-sensor"],
        ["resolution-step"],
        "the sensor mode constrains the smallest distinguishable position step",
        "directed",
        "one-to-one"
      ],
      [
        "resolution-constrains-reading",
        "constrains",
        ["resolution-step"],
        ["raw-reading"],
        "the declared resolution constrains which changes the reading can distinguish",
        "directed",
        "one-to-many"
      ],
      [
        "reading-transforms-report",
        "transforms",
        ["raw-reading", "resolution-step"],
        ["reported-position"],
        "the observed reading and resolution are transformed into a justified position report",
        "directed",
        "many-to-one"
      ],
      [
        "resolution-compares-magnitude",
        "compares",
        ["resolution-step"],
        ["raw-reading"],
        "the relative-resolution ratio compares the sensor step with a nonzero reading magnitude",
        "undirected",
        "one-to-one"
      ],
      [
        "report-supports-decision",
        "supports",
        ["reported-position", "resolution-step"],
        ["reporting-decision"],
        "the bounded position report and declared resolution support the reporting decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "resolution-state-declared",
        "boundary",
        "The sensor mode and its position resolution are declared with the reading.",
        ["position-sensor", "resolution-step", "raw-reading"],
        ["sensor-constrains-resolution", "resolution-constrains-reading"]
      ],
      [
        "digits-supported",
        "criterion",
        "The reported digits do not imply distinctions finer than the observation method supports.",
        ["resolution-step", "raw-reading", "reported-position", "reporting-decision"],
        ["reading-transforms-report", "report-supports-decision"]
      ],
      [
        "ratio-chooses-digits",
        "assumption",
        "A relative-resolution ratio is treated as a universal algorithm for selecting significant figures.",
        ["resolution-step", "raw-reading", "reported-position"],
        ["resolution-compares-magnitude", "reading-transforms-report"]
      ]
    ],
    failureBoundary: [
      "false-digit-precision",
      "digits-supported",
      "Digits finer than the measurement resolution communicate distinctions that were never observed.",
      "Two reports appear different even though both raw readings occupy the same distinguishable sensor step.",
      "Retain digits from the declared method and context; use a scale ratio as evidence, not as a universal reporting algorithm.",
      [
        "position-sensor",
        "resolution-step",
        "raw-reading",
        "reported-position",
        "reporting-decision"
      ],
      [
        "resolution-constrains-reading",
        "reading-transforms-report",
        "report-supports-decision"
      ]
    ],
    conceptualModel: [
      [
        "identify-resolution",
        "Record the robot position sensor mode and smallest distinguishable step.",
        ["position-sensor", "resolution-step"],
        ["sensor-constrains-resolution"],
        ["resolution-state-declared"]
      ],
      [
        "retain-raw-reading",
        "Keep the observed position reading separately from the final reporting format.",
        ["resolution-step", "raw-reading"],
        ["resolution-constrains-reading"],
        ["resolution-state-declared"]
      ],
      [
        "compare-scale",
        "If useful, compare resolution with a nonzero reading magnitude and state what the ratio means.",
        ["resolution-step", "raw-reading"],
        ["resolution-compares-magnitude"],
        ["ratio-chooses-digits"]
      ],
      [
        "choose-report",
        "Choose reporting digits that communicate the supported position precision and decision need.",
        ["raw-reading", "resolution-step", "reported-position"],
        ["reading-transforms-report"],
        ["digits-supported"]
      ],
      [
        "state-limits",
        "Report the sensor mode and resolution so another reader can interpret the digits.",
        ["resolution-step", "reported-position", "reporting-decision"],
        ["report-supports-decision"],
        ["resolution-state-declared", "digits-supported"]
      ]
    ],
    reasonedCases: [
      {
        id: "position-report-example",
        kind: "example",
        scenario:
          "A learner records a robot position reading, states the active sensor resolution and reports only digits supported by that resolution and the decision context.",
        changedConditionIds: ["digits-supported"],
        givens: [
          [
            "declared-mode",
            "Sensor context",
            "The readout mode and smallest distinguishable position step are recorded.",
            null,
            "resolution-step"
          ]
        ],
        reasoningSteps: [
          [
            "example-bound",
            "The sensor mode establishes the resolution boundary for distinguishable position changes.",
            ["position-sensor", "resolution-step", "raw-reading"],
            ["sensor-constrains-resolution", "resolution-constrains-reading"],
            ["resolution-state-declared"]
          ],
          [
            "example-report",
            "The raw reading is converted into a report that does not imply unsupported finer steps.",
            ["raw-reading", "resolution-step", "reported-position"],
            ["reading-transforms-report"],
            ["digits-supported"]
          ],
          [
            "example-decision",
            "The report retains the resolution context needed for the engineering decision.",
            ["reported-position", "resolution-step", "reporting-decision"],
            ["report-supports-decision"],
            ["resolution-state-declared", "digits-supported"]
          ]
        ],
        outcome:
          "The position report communicates supported precision without claiming extra sensor information.",
        criterionConditionId: "digits-supported",
        criterion:
          "Reported digits must remain consistent with the declared resolution and intended decision.",
        verification:
          "Change only unsupported trailing digits and check that the physical sensor observation would be unchanged."
      },
      {
        id: "ratio-rule-counterexample",
        kind: "counterexample",
        scenario:
          "A learner computes a relative-resolution ratio and applies a fixed significant-figures rule without considering sensor mode, rounding stage or reporting purpose.",
        changedConditionIds: ["ratio-chooses-digits"],
        givens: [
          [
            "ratio-only-rule",
            "Reporting method",
            "The number of retained digits is selected solely from the scale ratio.",
            null,
            "reported-position"
          ]
        ],
        reasoningSteps: [
          [
            "counter-ratio",
            "The ratio compares resolution and reading scale but does not encode the full measurement method.",
            ["resolution-step", "raw-reading"],
            ["resolution-compares-magnitude"],
            ["ratio-chooses-digits"]
          ],
          [
            "counter-report",
            "A fixed digit rule can retain distinctions finer than the active sensor state supports.",
            ["resolution-step", "raw-reading", "reported-position"],
            ["resolution-constrains-reading", "reading-transforms-report"],
            ["ratio-chooses-digits", "digits-supported"]
          ],
          [
            "counter-context",
            "The resulting report omits the evidence needed to interpret its precision.",
            ["reported-position", "resolution-step", "reporting-decision"],
            ["report-supports-decision"],
            ["ratio-chooses-digits"]
          ]
        ],
        outcome:
          "The ratio remains a useful scale comparison, but the automatic significant-figures decision is unsupported.",
        criterionConditionId: "digits-supported",
        criterion:
          "Select digits from the measurement process and reporting purpose, using the ratio only as supporting context.",
        verification:
          "Compare the rule's reported increment with the sensor's smallest distinguishable step."
      }
    ],
    misconception: {
      id: "displayed-digits-are-information",
      claim:
        "Every digit shown by a sensor or calculator is measured information and should be reported.",
      mechanism:
        "Digital display and arithmetic formatting can generate digits finer than the physical observation method distinguishes.",
      correction:
        "Retain the raw reading, identify resolution and report only digits justified by the method and decision context.",
      disconfirmingObservation:
        "Several different trailing-digit reports correspond to the same distinguishable sensor state.",
      entityIds: [
        "position-sensor",
        "resolution-step",
        "raw-reading",
        "reported-position",
        "reporting-decision"
      ],
      relationIds: [
        "resolution-constrains-reading",
        "reading-transforms-report",
        "report-supports-decision"
      ],
      conditionIds: ["ratio-chooses-digits", "digits-supported"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the robot-position report from sensor resolution to justified digits:",
            "The position sequence declares sensor mode, retains the raw reading and then chooses reporting precision.",
            "The position sequence currently rounds before identifying resolution or treats a ratio as the reporting rule.",
            "Begin with the active position-sensor mode and resolution step.",
            "Keep the raw position reading before applying any reporting format.",
            "Compare resolution and magnitude only as supporting scale evidence.",
            "Finish by reporting supported position digits with the resolution context."
          ),
          focusRef: reasonedCase("position-report-example", "scenario"),
          contextConditionIds: ["resolution-state-declared", "digits-supported"],
          steps: [
            [
              "establish-step",
              ["sensor-constrains-resolution", "resolution-constrains-reading"],
              ["resolution-state-declared"]
            ],
            [
              "compare-scale",
              ["resolution-compares-magnitude"],
              ["digits-supported"]
            ],
            [
              "form-report",
              ["reading-transforms-report"],
              ["digits-supported"]
            ],
            [
              "retain-context",
              ["report-supports-decision"],
              ["resolution-state-declared", "digits-supported"]
            ]
          ],
          correctOrder: [
            "establish-step",
            "compare-scale",
            "form-report",
            "retain-context"
          ]
        },
        retry: {
          instruction: instruction(
            "Replace a ratio-only significant-figures rule with measurement evidence:",
            "The repair returns the position report to sensor resolution and decision context.",
            "The repair still lets the relative-resolution ratio dictate every reported digit.",
            "Recover the position-sensor mode behind the raw reading.",
            "Compare the proposed reporting increment with the declared resolution.",
            "Use the resolution ratio only to discuss relative scale.",
            "Choose position digits from distinguishability and reporting purpose."
          ),
          focusRef: reasonedCase("ratio-rule-counterexample", "scenario"),
          contextConditionIds: ["ratio-chooses-digits", "digits-supported"],
          steps: [
            [
              "recover-resolution",
              ["sensor-constrains-resolution"],
              ["resolution-state-declared"]
            ],
            [
              "test-report",
              ["resolution-constrains-reading", "reading-transforms-report"],
              ["ratio-chooses-digits", "digits-supported"]
            ],
            [
              "state-supported",
              ["report-supports-decision"],
              ["digits-supported"]
            ]
          ],
          correctOrder: ["recover-resolution", "test-report", "state-supported"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the position-report evidence that justifies retained digits:",
            "The selected position evidence ties sensor resolution to the final report and decision.",
            "A selected position item treats calculator formatting or a scale ratio as measurement information.",
            "Look for the sensor mode that defines the position step.",
            "Look for a report whose increment is not finer than the supported observation.",
            "Select the resolution-to-reading constraint for the robot sensor.",
            "Select the bounded report relation supporting the position decision."
          ),
          focusRef: term("significant-figures", "definition"),
          contextConditionIds: ["resolution-state-declared", "digits-supported"],
          options: [
            [
              "resolution-evidence",
              true,
              relation("resolution-constrains-reading"),
              condition("resolution-state-declared"),
              ["sensor-constrains-resolution", "resolution-constrains-reading"],
              ["resolution-state-declared"],
              null
            ],
            [
              "report-evidence",
              true,
              relation("report-supports-decision"),
              condition("digits-supported"),
              ["reading-transforms-report", "report-supports-decision"],
              ["digits-supported"],
              null
            ],
            [
              "all-display-digits",
              false,
              misconception("displayed-digits-are-information", "claim"),
              misconception("displayed-digits-are-information", "mechanism"),
              ["reading-transforms-report"],
              ["ratio-chooses-digits"],
              "displayed-digits-are-information"
            ],
            [
              "ratio-algorithm",
              false,
              term("relative-resolution", "boundary"),
              reasonedCase("position-report-example", "criterion"),
              ["resolution-compares-magnitude"],
              ["ratio-chooses-digits"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose which robot-position digits imply observations the sensor never made:",
            "The diagnosis exposes trailing digits below resolution and a ratio-only reporting choice.",
            "The diagnosis removes supported position digits or confuses resolution with accuracy.",
            "Compare the position report increment with the active sensor step.",
            "Check whether the relative-resolution ratio was treated as a universal rule.",
            "Flag unsupported position digits as false distinguishability.",
            "Retain sensor resolution as context rather than a claim of accuracy."
          ),
          focusRef: reasonedCase("ratio-rule-counterexample", "verification"),
          contextConditionIds: ["ratio-chooses-digits", "digits-supported"],
          options: [
            [
              "finer-than-step",
              true,
              condition("digits-supported"),
              relation("resolution-constrains-reading"),
              ["resolution-constrains-reading", "reading-transforms-report"],
              ["digits-supported"],
              null
            ],
            [
              "ratio-overreach",
              true,
              condition("ratio-chooses-digits"),
              relation("resolution-compares-magnitude"),
              ["resolution-compares-magnitude", "reading-transforms-report"],
              ["ratio-chooses-digits"],
              null
            ],
            [
              "mode-context",
              true,
              condition("resolution-state-declared"),
              relation("sensor-constrains-resolution"),
              ["sensor-constrains-resolution"],
              ["resolution-state-declared"],
              null
            ],
            [
              "display-proof",
              false,
              misconception("displayed-digits-are-information", "claim"),
              misconception("displayed-digits-are-information", "mechanism"),
              ["reading-transforms-report", "report-supports-decision"],
              ["ratio-chooses-digits"],
              "displayed-digits-are-information"
            ],
            [
              "resolution-equals-accuracy",
              false,
              term("resolution", "boundary"),
              reasonedCase("ratio-rule-counterexample", "criterion"),
              ["report-supports-decision"],
              ["digits-supported"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why a relative-resolution ratio is not a universal significant-figures algorithm:",
            "The explanation joins sensor resolution, scale comparison and context-dependent reporting.",
            "The explanation omits a position concept group or treats ratio output as measured digits.",
            "Define position resolution as distinguishability in the active sensor mode.",
            "Explain what the resolution-to-magnitude ratio compares.",
            "Describe how significant figures communicate supported precision.",
            "Use the reporting decision and context to choose final position digits."
          ),
          focusRef: reasonedCase("ratio-rule-counterexample", "outcome"),
          contextConditionIds: ["ratio-chooses-digits", "digits-supported"],
          conceptGroups: [
            [
              "resolution-group",
              term("resolution", "label"),
              [term("resolution", "definition")],
              ["sensor-constrains-resolution", "resolution-constrains-reading"],
              ["resolution-state-declared"]
            ],
            [
              "ratio-group",
              term("relative-resolution", "label"),
              [term("relative-resolution", "definition")],
              ["resolution-compares-magnitude"],
              ["ratio-chooses-digits"]
            ],
            [
              "reporting-group",
              term("significant-figures", "label"),
              [term("significant-figures", "definition")],
              ["reading-transforms-report", "report-supports-decision"],
              ["digits-supported"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["reading-transforms-report"],
          criterionConditionId: "digits-supported"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match each position-report relation with the condition that gives it meaning:",
            "The position matches now connect sensor mode, scale ratio and justified reporting.",
            "One position match assigns a reporting boundary to the wrong measurement relation.",
            "Pair sensor resolution with the declared readout mode.",
            "Pair final position reporting with supported digits.",
            "Connect the resolution ratio to a scale comparison only.",
            "Connect the bounded position report to its engineering decision."
          ),
          focusRef: reasonedCase("position-report-example", "scenario"),
          contextConditionIds: ["resolution-state-declared", "digits-supported"],
          pairs: [
            [
              "mode-pair",
              relation("sensor-constrains-resolution"),
              condition("resolution-state-declared"),
              relation("sensor-constrains-resolution"),
              ["sensor-constrains-resolution"],
              ["resolution-state-declared"]
            ],
            [
              "ratio-pair",
              relation("resolution-compares-magnitude"),
              term("relative-resolution", "boundary"),
              relation("resolution-compares-magnitude"),
              ["resolution-compares-magnitude"],
              ["ratio-chooses-digits"]
            ],
            [
              "report-pair",
              relation("report-supports-decision"),
              condition("digits-supported"),
              relation("report-supports-decision"),
              ["reading-transforms-report", "report-supports-decision"],
              ["digits-supported"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the position graph when trailing digits lie below sensor resolution:",
            "The position implication removes unsupported digits while retaining the raw reading and resolution context.",
            "The position implication deletes useful observations or calls every displayed digit measured.",
            "Trace the position resolution into the raw reading boundary.",
            "Use the supported-digits condition at the reporting node.",
            "Locate the transformation that invented finer position distinctions.",
            "Rewrite the position report without altering the retained raw observation."
          ),
          focusRef: reasonedCase("ratio-rule-counterexample", "outcome"),
          contextConditionIds: ["ratio-chooses-digits", "digits-supported"],
          positions: [
            ["resolution-step", 0, 0],
            ["raw-reading", 1, 0],
            ["reported-position", 2, 0],
            ["reporting-decision", 3, 0]
          ],
          relationIds: [
            "resolution-constrains-reading",
            "reading-transforms-report",
            "report-supports-decision"
          ],
          answerRelationIds: ["reading-transforms-report"],
          options: [
            [
              "remove-unsupported",
              true,
              reasonedCase("ratio-rule-counterexample", "verification"),
              condition("digits-supported"),
              ["reading-transforms-report", "report-supports-decision"],
              ["ratio-chooses-digits", "digits-supported"],
              null
            ],
            [
              "keep-display",
              false,
              misconception("displayed-digits-are-information", "claim"),
              misconception("displayed-digits-are-information", "mechanism"),
              ["reading-transforms-report"],
              ["ratio-chooses-digits"],
              "displayed-digits-are-information"
            ],
            [
              "erase-raw-reading",
              false,
              term("resolution", "boundary"),
              reasonedCase("position-report-example", "criterion"),
              ["report-supports-decision"],
              ["resolution-state-declared"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the justified position-report graph after sensor context is restored:",
            "The position graph supports reported digits through declared resolution and measurement context.",
            "The position graph claims resolution proves accuracy or ratio alone fixes significant figures.",
            "Follow the position sensor into its declared resolution step.",
            "Follow the raw position reading into the bounded report.",
            "Compare resolution with magnitude only to discuss relative scale.",
            "Accept the position report when its digits match distinguishable information."
          ),
          focusRef: reasonedCase("position-report-example", "outcome"),
          contextConditionIds: ["resolution-state-declared", "digits-supported"],
          positions: [
            ["position-sensor", 0, 1],
            ["resolution-step", 1, 1],
            ["raw-reading", 1, 2],
            ["reported-position", 2, 1],
            ["reporting-decision", 3, 1]
          ],
          relationIds: [
            "sensor-constrains-resolution",
            "resolution-constrains-reading",
            "reading-transforms-report",
            "report-supports-decision"
          ],
          answerRelationIds: ["report-supports-decision"],
          options: [
            [
              "accept-supported",
              true,
              reasonedCase("position-report-example", "verification"),
              condition("digits-supported"),
              ["reading-transforms-report", "report-supports-decision"],
              ["resolution-state-declared", "digits-supported"],
              null
            ],
            [
              "resolution-is-accuracy",
              false,
              term("resolution", "boundary"),
              reasonedCase("position-report-example", "criterion"),
              ["sensor-constrains-resolution"],
              ["resolution-state-declared"],
              null
            ],
            [
              "ratio-fixes-digits",
              false,
              misconception("displayed-digits-are-information", "claim"),
              misconception(
                "displayed-digits-are-information",
                "disconfirmingObservation"
              ),
              ["resolution-compares-magnitude", "reading-transforms-report"],
              ["ratio-chooses-digits"],
              "displayed-digits-are-information"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("resolution", "label"),
      focusRef: reasonedCase("position-report-example", "verification"),
      modelKind: "state-graph",
      positions: [
        ["position-sensor", 0, 0],
        ["resolution-step", 1, 0],
        ["raw-reading", 1, 1],
        ["reported-position", 2, 0],
        ["reporting-decision", 3, 0]
      ],
      visibleEntityIds: [
        "position-sensor",
        "resolution-step",
        "raw-reading",
        "reported-position",
        "reporting-decision"
      ],
      visibleRelationIds: [
        "sensor-constrains-resolution",
        "resolution-constrains-reading",
        "reading-transforms-report",
        "resolution-compares-magnitude",
        "report-supports-decision"
      ],
      controls: [
        [
          "sensor-state-view",
          term("resolution", "label"),
          ["resolution-state-declared"],
          ["position-sensor", "resolution-step", "raw-reading"],
          ["sensor-constrains-resolution", "resolution-constrains-reading"],
          [],
          [],
          [
            [
              "step-visible",
              "The active robot sensor mode fixes the distinguishable position step.",
              ["position-sensor", "resolution-step", "raw-reading"],
              ["sensor-constrains-resolution", "resolution-constrains-reading"]
            ]
          ],
          reasonedCase("position-report-example", "verification")
        ],
        [
          "report-state-view",
          term("significant-figures", "label"),
          ["digits-supported"],
          ["resolution-step", "reported-position", "reporting-decision"],
          ["reading-transforms-report", "report-supports-decision"],
          ["sensor-constrains-resolution"],
          [],
          [
            [
              "digits-visible",
              "The position report retains only digits supported by the declared resolution.",
              ["resolution-step", "reported-position", "reporting-decision"],
              ["reading-transforms-report", "report-supports-decision"]
            ]
          ],
          reasonedCase("position-report-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D02-L06",
    systemModel:
      "Repeated measurements expose variation, a stated measurement model assigns standard uncertainties to identified contributions and only compatible independent standard uncertainties are combined by root-sum-square.",
    failurePattern:
      "A tight cluster of readings can be mistaken for correctness, while incompatible or dependent uncertainty contributions are combined as if they were independent values in one unit.",
    visualExplanation:
      "An uncertainty graph connects a distance measurand, repeated readings, identified uncertainty contributions, a combined standard uncertainty and a bounded measurement decision.",
    applicationTask:
      "Analyse repeated robot range-sensor readings, distinguish observed variation from unknown measurement error, identify uncertainty contributions and apply root-sum-square only when they are independent standard uncertainties in the same unit.",
    terms: [
      [
        "measurement-error",
        "Measurement error",
        "The difference between a measured value and the relevant reference or true quantity value under the stated model.",
        "The exact error is generally not known merely from repeated readings.",
        "separate-error"
      ],
      [
        "standard-uncertainty",
        "Standard uncertainty",
        "An uncertainty contribution expressed in standard-deviation form for the stated measurement model.",
        "A raw tolerance, range or limit is not automatically a standard uncertainty.",
        "standardise-contributions"
      ],
      [
        "repeatability",
        "Repeatability evidence",
        "Variation observed when measurements are repeated under declared similar conditions.",
        "Low repeatability spread does not prove absence of bias or other uncertainty contributions.",
        "inspect-repeats"
      ],
      [
        "root-sum-square",
        "Root-sum-square combination",
        "The combination u_c = sqrt(sum(u_i^2)) for independent standard uncertainties expressed in the same output unit.",
        "Root-sum-square is not valid for arbitrary values, dependent contributions or mismatched units.",
        "combine-independent"
      ]
    ],
    entities: [
      [
        "distance-measurand",
        "input",
        "Robot distance measurand",
        "The clearly defined distance quantity the range sensor is intended to measure."
      ],
      [
        "repeated-readings",
        "observation",
        "Repeated range readings",
        "The retained sensor observations collected under declared similar conditions."
      ],
      [
        "uncertainty-contributions",
        "component",
        "Distance uncertainty contributions",
        "The identified repeatability, calibration and other standard uncertainty components."
      ],
      [
        "combined-uncertainty",
        "state",
        "Combined distance standard uncertainty",
        "The root-sum-square result for compatible independent standard uncertainty contributions."
      ],
      [
        "measurement-decision",
        "decision",
        "Distance measurement decision",
        "The bounded decision about whether the result and uncertainty support the engineering use."
      ]
    ],
    relations: [
      [
        "readings-measure-distance",
        "measures",
        ["repeated-readings"],
        ["distance-measurand"],
        "the repeated range readings observe the declared distance measurand",
        "directed",
        "many-to-one"
      ],
      [
        "spread-supports-repeatability",
        "supports",
        ["repeated-readings"],
        ["uncertainty-contributions"],
        "the observed reading spread supports the repeatability uncertainty contribution",
        "directed",
        "many-to-one"
      ],
      [
        "model-routes-contributions",
        "routes",
        ["distance-measurand"],
        ["uncertainty-contributions"],
        "the distance measurement model identifies relevant uncertainty contributions",
        "directed",
        "one-to-many"
      ],
      [
        "contributions-transform-combined",
        "transforms",
        ["uncertainty-contributions"],
        ["combined-uncertainty"],
        "independent same-unit standard uncertainties combine through root-sum-square",
        "directed",
        "many-to-one"
      ],
      [
        "uncertainty-supports-decision",
        "supports",
        ["combined-uncertainty", "repeated-readings"],
        ["measurement-decision"],
        "the reported result and bounded standard uncertainty support the measurement decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "repeat-conditions-declared",
        "boundary",
        "Repeated range readings are collected under declared similar measurement conditions.",
        ["distance-measurand", "repeated-readings", "uncertainty-contributions"],
        ["readings-measure-distance", "spread-supports-repeatability"]
      ],
      [
        "independent-same-unit-standard",
        "criterion",
        "Every root-sum-square input is an independent standard uncertainty expressed in the same output unit.",
        ["uncertainty-contributions", "combined-uncertainty", "measurement-decision"],
        [
          "model-routes-contributions",
          "contributions-transform-combined",
          "uncertainty-supports-decision"
        ]
      ],
      [
        "tight-cluster-proves-correct",
        "assumption",
        "A small spread in repeated readings is treated as proof that measurement error is zero.",
        ["repeated-readings", "uncertainty-contributions", "measurement-decision"],
        ["spread-supports-repeatability", "uncertainty-supports-decision"]
      ]
    ],
    failureBoundary: [
      "invalid-rss-combination",
      "independent-same-unit-standard",
      "Squaring and adding dependent or mismatched contributions hides correlation, scale and unit incompatibility.",
      "The combined value has no defensible distance-unit interpretation or understates shared effects.",
      "Use root-sum-square only for independent standard uncertainties in the same output unit; otherwise revise the model.",
      [
        "distance-measurand",
        "uncertainty-contributions",
        "combined-uncertainty",
        "measurement-decision"
      ],
      [
        "model-routes-contributions",
        "contributions-transform-combined",
        "uncertainty-supports-decision"
      ]
    ],
    conceptualModel: [
      [
        "define-measurand",
        "Define the robot distance quantity and the measurement conditions.",
        ["distance-measurand", "repeated-readings"],
        ["readings-measure-distance"],
        ["repeat-conditions-declared"]
      ],
      [
        "inspect-repeats",
        "Retain repeated readings and describe their variation without calling it the total error.",
        ["repeated-readings", "uncertainty-contributions"],
        ["spread-supports-repeatability"],
        ["repeat-conditions-declared"]
      ],
      [
        "separate-error",
        "Distinguish an unknown measurement error from the uncertainty used to describe incomplete knowledge.",
        ["distance-measurand", "repeated-readings", "uncertainty-contributions"],
        ["model-routes-contributions"],
        ["tight-cluster-proves-correct"]
      ],
      [
        "standardise-contributions",
        "Express relevant contributions as standard uncertainties in the same distance unit and examine dependence.",
        ["uncertainty-contributions", "combined-uncertainty"],
        ["model-routes-contributions"],
        ["independent-same-unit-standard"]
      ],
      [
        "combine-independent",
        "Apply u_c = sqrt(sum(u_i^2)) only to independent compatible standard uncertainties and report the boundary.",
        ["uncertainty-contributions", "combined-uncertainty", "measurement-decision"],
        ["contributions-transform-combined", "uncertainty-supports-decision"],
        ["independent-same-unit-standard"]
      ]
    ],
    reasonedCases: [
      {
        id: "distance-uncertainty-example",
        kind: "example",
        scenario:
          "A learner retains repeated range readings, identifies repeatability and calibration contributions, converts each to a same-unit standard uncertainty and checks independence before root-sum-square.",
        changedConditionIds: ["independent-same-unit-standard"],
        givens: [
          [
            "identified-components",
            "Uncertainty model",
            "Each contribution has a source, standard-deviation interpretation, output unit and dependence judgement.",
            null,
            "uncertainty-contributions"
          ]
        ],
        reasoningSteps: [
          [
            "example-repeats",
            "Repeated readings provide evidence about repeatability under the declared conditions.",
            ["repeated-readings", "distance-measurand", "uncertainty-contributions"],
            ["readings-measure-distance", "spread-supports-repeatability"],
            ["repeat-conditions-declared"]
          ],
          [
            "example-model",
            "The measurement model adds other standard uncertainty contributions rather than treating spread as total error.",
            ["distance-measurand", "uncertainty-contributions"],
            ["model-routes-contributions"],
            ["independent-same-unit-standard"]
          ],
          [
            "example-combine",
            "Independent same-unit standard uncertainties combine by root-sum-square and support a bounded decision.",
            ["uncertainty-contributions", "combined-uncertainty", "measurement-decision"],
            ["contributions-transform-combined", "uncertainty-supports-decision"],
            ["independent-same-unit-standard"]
          ]
        ],
        outcome:
          "The combined standard uncertainty has a declared model, unit and independence boundary.",
        criterionConditionId: "independent-same-unit-standard",
        criterion:
          "Every RSS contribution must be independent, in standard form and expressed in the same output unit.",
        verification:
          "Audit each input's source, unit, standardisation and dependence before recomputing the root-sum-square."
      },
      {
        id: "tight-cluster-counterexample",
        kind: "counterexample",
        scenario:
          "A learner observes tightly grouped range readings, declares the sensor error negligible and combines a dependent calibration limit with repeatability by root-sum-square.",
        changedConditionIds: ["tight-cluster-proves-correct"],
        givens: [
          [
            "cluster-only-evidence",
            "Available evidence",
            "Only the spread of repeated readings is used to judge correctness.",
            null,
            "repeated-readings"
          ]
        ],
        reasoningSteps: [
          [
            "counter-repeatability",
            "A tight cluster describes observed repeatability but cannot reveal a shared bias.",
            ["repeated-readings", "uncertainty-contributions"],
            ["spread-supports-repeatability"],
            ["tight-cluster-proves-correct", "repeat-conditions-declared"]
          ],
          [
            "counter-components",
            "The calibration limit is not shown to be an independent same-unit standard uncertainty.",
            ["distance-measurand", "uncertainty-contributions", "combined-uncertainty"],
            ["model-routes-contributions", "contributions-transform-combined"],
            ["tight-cluster-proves-correct", "independent-same-unit-standard"]
          ],
          [
            "counter-decision",
            "The invalid combination cannot justify the distance measurement decision.",
            ["combined-uncertainty", "repeated-readings", "measurement-decision"],
            ["uncertainty-supports-decision"],
            ["tight-cluster-proves-correct"]
          ]
        ],
        outcome:
          "Low observed spread does not prove zero error, and the reported root-sum-square is unsupported.",
        criterionConditionId: "independent-same-unit-standard",
        criterion:
          "Model bias and other contributions, convert them to compatible standard uncertainties and address dependence.",
        verification:
          "Compare the clustered readings with an independent reference and inspect every RSS input definition."
      }
    ],
    misconception: {
      id: "repeatability-proves-accuracy",
      claim:
        "If repeated measurements are close together, the measurement error must be small.",
      mechanism:
        "Shared bias can shift every reading together, producing low spread without closeness to the reference quantity.",
      correction:
        "Use repeats for repeatability evidence, model other contributions and keep error distinct from uncertainty.",
      disconfirmingObservation:
        "A tightly clustered range-sensor result is displaced when compared with an independent reference.",
      entityIds: [
        "distance-measurand",
        "repeated-readings",
        "uncertainty-contributions",
        "measurement-decision"
      ],
      relationIds: [
        "readings-measure-distance",
        "spread-supports-repeatability",
        "uncertainty-supports-decision"
      ],
      conditionIds: [
        "tight-cluster-proves-correct",
        "independent-same-unit-standard"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the range-sensor uncertainty analysis from repeats to bounded combination:",
            "The distance sequence defines the measurand, inspects repeatability, standardises contributions and checks independence.",
            "The distance sequence currently applies RSS before units, standard form or dependence are established.",
            "Begin with the declared distance measurand and repeat conditions.",
            "Place repeatability evidence before the full uncertainty model.",
            "Express each distance contribution as a same-unit standard uncertainty.",
            "Combine only independent distance uncertainty components and attach the result to the measurement decision."
          ),
          focusRef: reasonedCase("distance-uncertainty-example", "scenario"),
          contextConditionIds: [
            "repeat-conditions-declared",
            "independent-same-unit-standard"
          ],
          steps: [
            [
              "collect-repeats",
              ["readings-measure-distance", "spread-supports-repeatability"],
              ["repeat-conditions-declared"]
            ],
            [
              "model-components",
              ["model-routes-contributions"],
              ["independent-same-unit-standard"]
            ],
            [
              "combine-rss",
              ["contributions-transform-combined"],
              ["independent-same-unit-standard"]
            ],
            [
              "support-use",
              ["uncertainty-supports-decision"],
              ["independent-same-unit-standard"]
            ]
          ],
          correctOrder: [
            "collect-repeats",
            "model-components",
            "combine-rss",
            "support-use"
          ]
        },
        retry: {
          instruction: instruction(
            "Repair an uncertainty claim built only from a tight range cluster:",
            "The repair keeps repeatability evidence but adds bias checks and valid standard components.",
            "The repair still calls distance spread total error or combines dependent limits by RSS.",
            "Separate observed range spread from the unknown measurement error.",
            "Classify each distance contribution by unit, standard form and dependence.",
            "Retain the range cluster only as repeatability evidence.",
            "Recompute combined distance uncertainty after the RSS conditions pass."
          ),
          focusRef: reasonedCase("tight-cluster-counterexample", "scenario"),
          contextConditionIds: [
            "tight-cluster-proves-correct",
            "independent-same-unit-standard"
          ],
          steps: [
            [
              "separate-claims",
              ["spread-supports-repeatability"],
              ["tight-cluster-proves-correct"]
            ],
            [
              "audit-components",
              ["model-routes-contributions"],
              ["independent-same-unit-standard"]
            ],
            [
              "recombine",
              ["contributions-transform-combined", "uncertainty-supports-decision"],
              ["independent-same-unit-standard"]
            ]
          ],
          correctOrder: ["separate-claims", "audit-components", "recombine"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the distance-uncertainty evidence that permits root-sum-square:",
            "The selected distance evidence establishes standard form, common unit and independence.",
            "A selected distance item relies only on tight clustering or mixes incompatible contribution types.",
            "Look for each uncertainty contribution expressed in the output distance unit.",
            "Look for an explicit independence judgement before combination.",
            "Select the measurement-model route into standard contributions.",
            "Select the valid transformation into combined distance uncertainty."
          ),
          focusRef: term("root-sum-square", "definition"),
          contextConditionIds: [
            "repeat-conditions-declared",
            "independent-same-unit-standard"
          ],
          options: [
            [
              "standard-components",
              true,
              relation("model-routes-contributions"),
              condition("independent-same-unit-standard"),
              ["model-routes-contributions"],
              ["independent-same-unit-standard"],
              null
            ],
            [
              "valid-rss",
              true,
              relation("contributions-transform-combined"),
              reasonedCase("distance-uncertainty-example", "criterion"),
              ["contributions-transform-combined", "uncertainty-supports-decision"],
              ["independent-same-unit-standard"],
              null
            ],
            [
              "cluster-means-accurate",
              false,
              misconception("repeatability-proves-accuracy", "claim"),
              misconception("repeatability-proves-accuracy", "mechanism"),
              ["spread-supports-repeatability"],
              ["tight-cluster-proves-correct"],
              "repeatability-proves-accuracy"
            ],
            [
              "raw-limit",
              false,
              term("standard-uncertainty", "boundary"),
              reasonedCase("distance-uncertainty-example", "criterion"),
              ["contributions-transform-combined"],
              ["independent-same-unit-standard"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose which range-sensor claims exceed the repeated-measurement evidence:",
            "The distance uncertainty diagnosis exposes hidden bias, nonstandard inputs and unsupported independence.",
            "The diagnosis rejects genuine repeatability evidence or treats uncertainty as the exact error.",
            "Ask what tightly grouped range readings cannot reveal.",
            "Inspect whether every RSS input is a distance standard uncertainty.",
            "Flag the zero-error conclusion as unsupported by repeatability.",
            "Flag dependent calibration and repeatability inputs before recombination."
          ),
          focusRef: reasonedCase("tight-cluster-counterexample", "verification"),
          contextConditionIds: [
            "tight-cluster-proves-correct",
            "independent-same-unit-standard"
          ],
          options: [
            [
              "hidden-bias",
              true,
              term("measurement-error", "boundary"),
              relation("spread-supports-repeatability"),
              ["readings-measure-distance", "spread-supports-repeatability"],
              ["tight-cluster-proves-correct"],
              null
            ],
            [
              "invalid-input-form",
              true,
              term("standard-uncertainty", "boundary"),
              relation("contributions-transform-combined"),
              ["model-routes-contributions", "contributions-transform-combined"],
              ["independent-same-unit-standard"],
              null
            ],
            [
              "repeatability-valid",
              true,
              relation("spread-supports-repeatability"),
              condition("repeat-conditions-declared"),
              ["spread-supports-repeatability"],
              ["repeat-conditions-declared"],
              null
            ],
            [
              "cluster-proves",
              false,
              misconception("repeatability-proves-accuracy", "claim"),
              misconception("repeatability-proves-accuracy", "mechanism"),
              ["spread-supports-repeatability", "uncertainty-supports-decision"],
              ["tight-cluster-proves-correct"],
              "repeatability-proves-accuracy"
            ],
            [
              "rss-any-values",
              false,
              term("root-sum-square", "boundary"),
              reasonedCase("tight-cluster-counterexample", "criterion"),
              ["contributions-transform-combined"],
              ["independent-same-unit-standard"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "matching",
          instruction: instruction(
            "Match each distance-uncertainty relation to its evidence boundary:",
            "The distance matches separate repeatability evidence, modelled components and valid RSS.",
            "One distance match assigns an uncertainty condition to the wrong measurement relation.",
            "Pair repeated range spread with declared repeat conditions.",
            "Pair RSS transformation with independent same-unit standard inputs.",
            "Connect the distance model to identified uncertainty contributions.",
            "Connect combined distance uncertainty to the bounded measurement decision."
          ),
          focusRef: reasonedCase("distance-uncertainty-example", "scenario"),
          contextConditionIds: [
            "repeat-conditions-declared",
            "independent-same-unit-standard"
          ],
          pairs: [
            [
              "repeat-pair",
              relation("spread-supports-repeatability"),
              condition("repeat-conditions-declared"),
              relation("spread-supports-repeatability"),
              ["spread-supports-repeatability"],
              ["repeat-conditions-declared"]
            ],
            [
              "rss-pair",
              relation("contributions-transform-combined"),
              condition("independent-same-unit-standard"),
              relation("contributions-transform-combined"),
              ["contributions-transform-combined"],
              ["independent-same-unit-standard"]
            ],
            [
              "decision-pair",
              relation("uncertainty-supports-decision"),
              term("root-sum-square", "boundary"),
              relation("uncertainty-supports-decision"),
              ["contributions-transform-combined", "uncertainty-supports-decision"],
              ["independent-same-unit-standard"]
            ]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instruction(
            "Explain why tightly grouped range readings do not prove small error:",
            "The explanation joins repeatability, measurement error and bounded standard uncertainty.",
            "The explanation omits a distance concept group or calls RSS valid for arbitrary inputs.",
            "Define what repeated range spread reveals under similar conditions.",
            "Distinguish unknown measurement error from described uncertainty.",
            "State the independent same-unit standard condition for RSS.",
            "Use the measurement model before supporting the range decision."
          ),
          focusRef: misconception("repeatability-proves-accuracy", "claim"),
          contextConditionIds: [
            "tight-cluster-proves-correct",
            "independent-same-unit-standard"
          ],
          conceptGroups: [
            [
              "repeatability-group",
              term("repeatability", "label"),
              [term("repeatability", "definition")],
              ["spread-supports-repeatability"],
              ["repeat-conditions-declared"]
            ],
            [
              "error-group",
              term("measurement-error", "label"),
              [term("measurement-error", "definition")],
              ["readings-measure-distance", "model-routes-contributions"],
              ["tight-cluster-proves-correct"]
            ],
            [
              "rss-group",
              term("root-sum-square", "label"),
              [term("root-sum-square", "definition")],
              ["contributions-transform-combined"],
              ["independent-same-unit-standard"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["uncertainty-supports-decision"],
          criterionConditionId: "independent-same-unit-standard"
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the uncertainty graph when a tight cluster is called error-free:",
            "The distance implication retains repeatability evidence but rejects the zero-error conclusion.",
            "The distance implication discards useful repeats or treats spread as the exact error.",
            "Trace repeated range readings into the repeatability contribution.",
            "Use the measurement model to expose contributions beyond spread.",
            "Locate the unsupported jump from tight cluster to distance decision.",
            "Keep repeatability and reopen the full uncertainty analysis."
          ),
          focusRef: reasonedCase("tight-cluster-counterexample", "outcome"),
          contextConditionIds: [
            "tight-cluster-proves-correct",
            "repeat-conditions-declared"
          ],
          positions: [
            ["distance-measurand", 0, 0],
            ["repeated-readings", 1, 0],
            ["uncertainty-contributions", 2, 0],
            ["measurement-decision", 3, 0]
          ],
          relationIds: [
            "readings-measure-distance",
            "spread-supports-repeatability",
            "model-routes-contributions"
          ],
          answerRelationIds: ["spread-supports-repeatability"],
          options: [
            [
              "retain-and-model",
              true,
              reasonedCase("tight-cluster-counterexample", "verification"),
              condition("repeat-conditions-declared"),
              ["spread-supports-repeatability", "model-routes-contributions"],
              ["tight-cluster-proves-correct", "repeat-conditions-declared"],
              null
            ],
            [
              "declare-zero-error",
              false,
              misconception("repeatability-proves-accuracy", "claim"),
              misconception("repeatability-proves-accuracy", "mechanism"),
              ["spread-supports-repeatability"],
              ["tight-cluster-proves-correct"],
              "repeatability-proves-accuracy"
            ],
            [
              "discard-repeats",
              false,
              term("repeatability", "boundary"),
              reasonedCase("distance-uncertainty-example", "criterion"),
              ["model-routes-contributions"],
              ["repeat-conditions-declared"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the valid distance-uncertainty graph after every RSS input is audited:",
            "The distance graph supports combination through independent same-unit standard uncertainties.",
            "The distance graph claims RSS removes all error or accepts dependent mixed-unit inputs.",
            "Follow the measurand into identified distance uncertainty contributions.",
            "Follow compatible independent contributions into combined uncertainty.",
            "Check standard form, output unit and dependence before RSS.",
            "Support the range decision only with the bounded combined result."
          ),
          focusRef: reasonedCase("distance-uncertainty-example", "outcome"),
          contextConditionIds: [
            "repeat-conditions-declared",
            "independent-same-unit-standard"
          ],
          positions: [
            ["distance-measurand", 0, 1],
            ["repeated-readings", 1, 2],
            ["uncertainty-contributions", 1, 1],
            ["combined-uncertainty", 2, 1],
            ["measurement-decision", 3, 1]
          ],
          relationIds: [
            "spread-supports-repeatability",
            "model-routes-contributions",
            "contributions-transform-combined",
            "uncertainty-supports-decision"
          ],
          answerRelationIds: ["contributions-transform-combined"],
          options: [
            [
              "combine-bounded",
              true,
              reasonedCase("distance-uncertainty-example", "verification"),
              condition("independent-same-unit-standard"),
              [
                "contributions-transform-combined",
                "uncertainty-supports-decision"
              ],
              ["independent-same-unit-standard"],
              null
            ],
            [
              "rss-removes-error",
              false,
              term("root-sum-square", "boundary"),
              reasonedCase("distance-uncertainty-example", "criterion"),
              ["uncertainty-supports-decision"],
              ["independent-same-unit-standard"],
              null
            ],
            [
              "accept-dependence",
              false,
              misconception("repeatability-proves-accuracy", "claim"),
              misconception(
                "repeatability-proves-accuracy",
                "disconfirmingObservation"
              ),
              ["contributions-transform-combined", "uncertainty-supports-decision"],
              ["tight-cluster-proves-correct"],
              "repeatability-proves-accuracy"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("standard-uncertainty", "label"),
      focusRef: reasonedCase("distance-uncertainty-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["distance-measurand", 0, 0],
        ["repeated-readings", 1, 0],
        ["uncertainty-contributions", 2, 0],
        ["combined-uncertainty", 2, 1],
        ["measurement-decision", 3, 0]
      ],
      visibleEntityIds: [
        "distance-measurand",
        "repeated-readings",
        "uncertainty-contributions",
        "combined-uncertainty",
        "measurement-decision"
      ],
      visibleRelationIds: [
        "readings-measure-distance",
        "spread-supports-repeatability",
        "model-routes-contributions",
        "contributions-transform-combined",
        "uncertainty-supports-decision"
      ],
      controls: [
        [
          "repeatability-view",
          term("repeatability", "label"),
          ["repeat-conditions-declared"],
          ["distance-measurand", "repeated-readings", "uncertainty-contributions"],
          [
            "readings-measure-distance",
            "spread-supports-repeatability",
            "model-routes-contributions"
          ],
          [],
          [],
          [
            [
              "spread-only",
              "Repeated range spread contributes repeatability evidence, not total error.",
              ["repeated-readings", "uncertainty-contributions"],
              ["spread-supports-repeatability"]
            ]
          ],
          reasonedCase("distance-uncertainty-example", "verification")
        ],
        [
          "combination-view",
          term("root-sum-square", "label"),
          ["independent-same-unit-standard"],
          ["uncertainty-contributions", "combined-uncertainty", "measurement-decision"],
          ["contributions-transform-combined", "uncertainty-supports-decision"],
          ["readings-measure-distance"],
          [],
          [
            [
              "rss-boundary",
              "Only independent same-unit standard uncertainties enter the distance RSS.",
              ["uncertainty-contributions", "combined-uncertainty"],
              ["contributions-transform-combined"]
            ]
          ],
          reasonedCase("distance-uncertainty-example", "verification")
        ]
      ]
    }
  },
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D02-L07",
    systemModel:
      "A calibration links known reference inputs to sensor outputs, fits a stated model, checks residual behaviour and permits measurement conversion only inside the demonstrated range and operating conditions.",
    failurePattern:
      "A straight line can fit a limited calibration region while extrapolation, changing sensitivity or untraceable references make later converted measurements unsupported.",
    visualExplanation:
      "A calibration graph connects traceable distance references, sensor outputs, a linear model, residual evidence, calibrated range and a bounded measurement decision.",
    applicationTask:
      "Design a distance-sensor calibration plan using traceable references, fit y = mx + b only where sensitivity m is acceptably constant, inspect residual evidence and refuse unsupported extrapolation.",
    terms: [
      [
        "calibration",
        "Measurement calibration",
        "The documented relationship between reference quantity values and corresponding instrument indications under stated conditions.",
        "Calibration establishes a relationship and evidence boundary; it does not automatically adjust hardware or guarantee future correctness.",
        "collect-pairs"
      ],
      [
        "traceability",
        "Measurement traceability",
        "A documented chain connecting a reference value and its uncertainty to recognised references through stated calibrations.",
        "A trusted brand name or undocumented nominal value is not a traceability chain.",
        "qualify-reference"
      ],
      [
        "sensitivity",
        "Sensor sensitivity",
        "The change in sensor output associated with a change in input quantity under the stated model.",
        "Constant sensitivity is a model condition, not a universal property of the sensor.",
        "fit-linear-model"
      ],
      [
        "calibrated-range",
        "Calibrated range",
        "The input interval and operating conditions over which the calibration evidence supports use of the model.",
        "The fitted equation does not justify values outside that demonstrated interval.",
        "bound-use"
      ]
    ],
    entities: [
      [
        "reference-distances",
        "input",
        "Traceable distance references",
        "The known input values and uncertainties used to exercise the sensor."
      ],
      [
        "sensor-indications",
        "observation",
        "Distance-sensor indications",
        "The retained output values corresponding to each reference input."
      ],
      [
        "linear-model",
        "mechanism",
        "Bounded linear calibration model",
        "The relation y = mx + b with sensitivity m and offset b fitted inside a declared range."
      ],
      [
        "residual-evidence",
        "observation",
        "Calibration residual evidence",
        "The differences between observed indications and model predictions across the calibration points."
      ],
      [
        "calibration-decision",
        "decision",
        "Calibration use decision",
        "The decision to use, revise or reject the model for a declared measurement case."
      ]
    ],
    relations: [
      [
        "references-map-indications",
        "maps",
        ["reference-distances"],
        ["sensor-indications"],
        "traceable reference distances map to retained sensor indications",
        "directed",
        "one-to-many"
      ],
      [
        "pairs-transform-model",
        "transforms",
        ["reference-distances", "sensor-indications"],
        ["linear-model"],
        "reference-indication pairs determine the bounded linear calibration model",
        "directed",
        "many-to-one"
      ],
      [
        "model-compares-indications",
        "compares",
        ["linear-model"],
        ["sensor-indications"],
        "linear-model predictions are compared with observed sensor indications",
        "undirected",
        "one-to-many"
      ],
      [
        "comparison-measures-residuals",
        "measures",
        ["sensor-indications"],
        ["residual-evidence"],
        "observed-minus-predicted differences form the residual evidence",
        "directed",
        "many-to-one"
      ],
      [
        "residuals-support-use",
        "supports",
        ["residual-evidence", "linear-model"],
        ["calibration-decision"],
        "residual pattern and model boundary support the calibration use decision",
        "directed",
        "many-to-one"
      ]
    ],
    conditions: [
      [
        "references-traceable",
        "criterion",
        "Every distance reference has documented value, uncertainty and traceability appropriate to the calibration.",
        ["reference-distances", "sensor-indications", "calibration-decision"],
        ["references-map-indications", "pairs-transform-model"]
      ],
      [
        "constant-sensitivity-in-range",
        "boundary",
        "Sensitivity is treated as constant only inside the calibrated range where residual evidence supports y = mx + b.",
        ["linear-model", "residual-evidence", "calibration-decision"],
        [
          "pairs-transform-model",
          "model-compares-indications",
          "residuals-support-use"
        ]
      ],
      [
        "extrapolation-assumed-valid",
        "assumption",
        "The linear model is used outside the calibrated range without additional evidence.",
        ["linear-model", "residual-evidence", "calibration-decision"],
        ["model-compares-indications", "residuals-support-use"]
      ]
    ],
    failureBoundary: [
      "unsupported-linear-extrapolation",
      "constant-sensitivity-in-range",
      "A fitted line has no demonstrated sensitivity or residual behaviour beyond the calibrated input interval.",
      "Converted distances outside the calibration points are reported as though the same slope were proven there.",
      "Use y = mx + b only where constant sensitivity and residual evidence support it; otherwise extend or change the calibration.",
      [
        "reference-distances",
        "sensor-indications",
        "linear-model",
        "residual-evidence",
        "calibration-decision"
      ],
      [
        "pairs-transform-model",
        "model-compares-indications",
        "residuals-support-use"
      ]
    ],
    conceptualModel: [
      [
        "define-calibration",
        "Declare the distance measurand, sensor mode, operating conditions and intended range.",
        ["reference-distances", "sensor-indications", "calibration-decision"],
        ["references-map-indications"],
        ["references-traceable"]
      ],
      [
        "qualify-reference",
        "Record each distance reference value, uncertainty and traceability chain.",
        ["reference-distances", "sensor-indications"],
        ["references-map-indications"],
        ["references-traceable"]
      ],
      [
        "collect-pairs",
        "Collect corresponding sensor indications across the declared range without silent omissions.",
        ["reference-distances", "sensor-indications", "linear-model"],
        ["references-map-indications", "pairs-transform-model"],
        ["references-traceable"]
      ],
      [
        "fit-linear-model",
        "Fit y = mx + b, interpret m as sensitivity and inspect residuals for nonlinearity or changing spread.",
        ["sensor-indications", "linear-model", "residual-evidence"],
        ["model-compares-indications", "comparison-measures-residuals"],
        ["constant-sensitivity-in-range"]
      ],
      [
        "bound-use",
        "Authorise the model only inside the range and conditions supported by references and residual evidence.",
        ["linear-model", "residual-evidence", "calibration-decision"],
        ["residuals-support-use"],
        ["references-traceable", "constant-sensitivity-in-range"]
      ]
    ],
    reasonedCases: [
      {
        id: "bounded-calibration-example",
        kind: "example",
        scenario:
          "A learner records traceable distance-reference and sensor-indication pairs, fits y = mx + b, checks residuals and authorises conversion only inside the demonstrated range.",
        changedConditionIds: ["constant-sensitivity-in-range"],
        givens: [
          [
            "paired-records",
            "Calibration evidence",
            "Reference values, uncertainties, sensor indications and operating conditions are retained.",
            null,
            "reference-distances"
          ]
        ],
        reasoningSteps: [
          [
            "example-references",
            "Traceable references give the calibration inputs a documented value and uncertainty basis.",
            ["reference-distances", "sensor-indications"],
            ["references-map-indications"],
            ["references-traceable"]
          ],
          [
            "example-model",
            "The pairs determine a linear model whose sensitivity is assessed only in the calibration range.",
            ["reference-distances", "sensor-indications", "linear-model"],
            ["pairs-transform-model"],
            ["constant-sensitivity-in-range"]
          ],
          [
            "example-residuals",
            "Residual evidence is inspected before the model supports a bounded use decision.",
            ["sensor-indications", "linear-model", "residual-evidence", "calibration-decision"],
            [
              "model-compares-indications",
              "comparison-measures-residuals",
              "residuals-support-use"
            ],
            ["constant-sensitivity-in-range"]
          ]
        ],
        outcome:
          "The linear calibration is traceable and usable only within its evidenced range and conditions.",
        criterionConditionId: "constant-sensitivity-in-range",
        criterion:
          "Residual evidence must support acceptably constant sensitivity throughout the declared calibrated range.",
        verification:
          "Trace each model input to its reference and inspect residuals across the range before converting a measurement."
      },
      {
        id: "extrapolation-counterexample",
        kind: "counterexample",
        scenario:
          "A learner fits a line to a limited distance range and uses the equation far beyond the calibration points without checking sensitivity or residual behaviour.",
        changedConditionIds: ["extrapolation-assumed-valid"],
        givens: [
          [
            "outside-case",
            "Requested conversion",
            "The sensor indication corresponds to an input outside the demonstrated calibration range.",
            null,
            "calibration-decision"
          ]
        ],
        reasoningSteps: [
          [
            "counter-no-reference",
            "No traceable reference-indication pair supports the requested outside-range conversion.",
            ["reference-distances", "sensor-indications", "calibration-decision"],
            ["references-map-indications"],
            ["extrapolation-assumed-valid", "references-traceable"]
          ],
          [
            "counter-sensitivity",
            "The fitted sensitivity was demonstrated only within the original calibration interval.",
            ["linear-model", "residual-evidence"],
            ["model-compares-indications", "comparison-measures-residuals"],
            ["extrapolation-assumed-valid", "constant-sensitivity-in-range"]
          ],
          [
            "counter-decision",
            "The existing residual evidence cannot support outside-range use of the linear model.",
            ["linear-model", "residual-evidence", "calibration-decision"],
            ["residuals-support-use"],
            ["extrapolation-assumed-valid"]
          ]
        ],
        outcome:
          "The equation remains a mathematical line, but the extrapolated distance is not calibration-supported.",
        criterionConditionId: "constant-sensitivity-in-range",
        criterion:
          "Extend the traceable calibration or select a justified nonlinear model before reporting the outside-range value.",
        verification:
          "Plot the requested indication against the calibration points and show which reference and residual evidence cover it."
      }
    ],
    misconception: {
      id: "line-is-universal",
      claim:
        "Once a straight calibration line is fitted, the sensor is linear everywhere.",
      mechanism:
        "A finite set of points supports a model only over its tested range and conditions; outside behaviour remains unevidenced.",
      correction:
        "Inspect residuals, declare the calibrated range and treat constant sensitivity as a bounded model condition.",
      disconfirmingObservation:
        "Additional reference points outside the original range show a changed slope or curved residual pattern.",
      entityIds: [
        "reference-distances",
        "sensor-indications",
        "linear-model",
        "residual-evidence",
        "calibration-decision"
      ],
      relationIds: [
        "pairs-transform-model",
        "model-compares-indications",
        "residuals-support-use"
      ],
      conditionIds: [
        "extrapolation-assumed-valid",
        "constant-sensitivity-in-range"
      ]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the distance calibration from traceable references to bounded model use:",
            "The calibration sequence qualifies references, collects pairs, fits the line, checks residuals and declares range.",
            "The calibration sequence currently fits before reference evidence or authorises the model before residual inspection.",
            "Begin with traceable distance references and declared operating conditions.",
            "Place sensor-reference pairs before the bounded linear model.",
            "Inspect calibration residuals after fitting y = mx + b.",
            "Finish by limiting sensor conversion to the evidenced calibrated range."
          ),
          focusRef: reasonedCase("bounded-calibration-example", "scenario"),
          contextConditionIds: [
            "references-traceable",
            "constant-sensitivity-in-range"
          ],
          steps: [
            [
              "collect-traceable",
              ["references-map-indications"],
              ["references-traceable"]
            ],
            [
              "fit-bounded",
              ["pairs-transform-model"],
              ["constant-sensitivity-in-range"]
            ],
            [
              "inspect-residuals",
              ["model-compares-indications", "comparison-measures-residuals"],
              ["constant-sensitivity-in-range"]
            ],
            [
              "authorise-range",
              ["residuals-support-use"],
              ["references-traceable", "constant-sensitivity-in-range"]
            ]
          ],
          correctOrder: [
            "collect-traceable",
            "fit-bounded",
            "inspect-residuals",
            "authorise-range"
          ]
        },
        retry: {
          instruction: instruction(
            "Recover a distance conversion that lies outside the calibrated range:",
            "The recovery withholds extrapolation, extends traceable references and reassesses sensitivity.",
            "The recovery still assumes the existing distance line proves outside-range behaviour.",
            "Mark the requested sensor indication against the calibrated range.",
            "Add traceable distance references covering the new measurement case.",
            "Collect new sensor pairs before extending the calibration model.",
            "Inspect residuals and sensitivity again before authorising conversion."
          ),
          focusRef: reasonedCase("extrapolation-counterexample", "scenario"),
          contextConditionIds: [
            "extrapolation-assumed-valid",
            "constant-sensitivity-in-range"
          ],
          steps: [
            [
              "withhold-outside",
              ["residuals-support-use"],
              ["extrapolation-assumed-valid"]
            ],
            [
              "extend-evidence",
              ["references-map-indications", "pairs-transform-model"],
              ["references-traceable"]
            ],
            [
              "recheck-model",
              ["comparison-measures-residuals"],
              ["constant-sensitivity-in-range"]
            ]
          ],
          correctOrder: ["withhold-outside", "extend-evidence", "recheck-model"]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the distance-calibration evidence required to use y = mx + b:",
            "The selected calibration evidence supports traceable pairs, bounded sensitivity and residual behaviour.",
            "A selected calibration item assumes universal linearity or lacks reference provenance.",
            "Look for traceable distance values paired with retained sensor indications.",
            "Look for residual evidence across the declared calibration range.",
            "Select the reference-pair relation forming the bounded linear model.",
            "Select the residual relation supporting the calibration decision."
          ),
          focusRef: term("calibrated-range", "definition"),
          contextConditionIds: [
            "references-traceable",
            "constant-sensitivity-in-range"
          ],
          options: [
            [
              "traceable-pairs",
              true,
              relation("pairs-transform-model"),
              condition("references-traceable"),
              ["references-map-indications", "pairs-transform-model"],
              ["references-traceable"],
              null
            ],
            [
              "residual-bound",
              true,
              relation("residuals-support-use"),
              condition("constant-sensitivity-in-range"),
              [
                "model-compares-indications",
                "comparison-measures-residuals",
                "residuals-support-use"
              ],
              ["constant-sensitivity-in-range"],
              null
            ],
            [
              "line-everywhere",
              false,
              misconception("line-is-universal", "claim"),
              misconception("line-is-universal", "mechanism"),
              ["pairs-transform-model"],
              ["extrapolation-assumed-valid"],
              "line-is-universal"
            ],
            [
              "nominal-reference",
              false,
              term("traceability", "boundary"),
              reasonedCase("bounded-calibration-example", "criterion"),
              ["references-map-indications"],
              ["references-traceable"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose which assumptions invalidate an extrapolated distance result:",
            "The diagnosis exposes the absent reference coverage and untested outside-range sensitivity.",
            "The diagnosis rejects the valid in-range calibration or treats residuals as irrelevant.",
            "Check whether a traceable distance pair covers the requested indication.",
            "Check whether constant sensitivity was demonstrated outside the original range.",
            "Flag missing outside-range references as an evidence gap.",
            "Flag unevaluated residual behaviour as a calibration-model gap."
          ),
          focusRef: reasonedCase("extrapolation-counterexample", "verification"),
          contextConditionIds: [
            "extrapolation-assumed-valid",
            "constant-sensitivity-in-range"
          ],
          options: [
            [
              "missing-coverage",
              true,
              term("calibrated-range", "boundary"),
              relation("references-map-indications"),
              ["references-map-indications", "pairs-transform-model"],
              ["extrapolation-assumed-valid"],
              null
            ],
            [
              "untested-slope",
              true,
              term("sensitivity", "boundary"),
              relation("model-compares-indications"),
              ["model-compares-indications", "comparison-measures-residuals"],
              ["constant-sensitivity-in-range"],
              null
            ],
            [
              "in-range-valid",
              true,
              condition("constant-sensitivity-in-range"),
              relation("residuals-support-use"),
              ["residuals-support-use"],
              ["constant-sensitivity-in-range"],
              null
            ],
            [
              "line-proves-all",
              false,
              misconception("line-is-universal", "claim"),
              misconception("line-is-universal", "mechanism"),
              ["pairs-transform-model", "residuals-support-use"],
              ["extrapolation-assumed-valid"],
              "line-is-universal"
            ],
            [
              "ignore-residuals",
              false,
              reasonedCase("extrapolation-counterexample", "outcome"),
              reasonedCase("extrapolation-counterexample", "criterion"),
              ["comparison-measures-residuals"],
              ["constant-sensitivity-in-range"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why a fitted distance line does not prove universal sensor linearity:",
            "The explanation joins traceable calibration, bounded sensitivity and residual evidence.",
            "The explanation omits a calibration concept group or treats an equation as outside-range evidence.",
            "Define calibration as a relationship under stated conditions.",
            "Explain how sensitivity m is bounded by the calibrated range.",
            "Describe what residual evidence tests about y = mx + b.",
            "Use traceable references before extending the distance model."
          ),
          focusRef: misconception("line-is-universal", "claim"),
          contextConditionIds: [
            "extrapolation-assumed-valid",
            "constant-sensitivity-in-range"
          ],
          conceptGroups: [
            [
              "calibration-group",
              term("calibration", "label"),
              [term("calibration", "definition")],
              ["references-map-indications", "pairs-transform-model"],
              ["references-traceable"]
            ],
            [
              "sensitivity-group",
              term("sensitivity", "label"),
              [term("sensitivity", "definition")],
              ["pairs-transform-model", "model-compares-indications"],
              ["constant-sensitivity-in-range"]
            ],
            [
              "range-group",
              term("calibrated-range", "label"),
              [term("calibrated-range", "definition")],
              ["comparison-measures-residuals", "residuals-support-use"],
              ["constant-sensitivity-in-range"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["residuals-support-use"],
          criterionConditionId: "constant-sensitivity-in-range"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match each distance-calibration relation to its validity boundary:",
            "The calibration matches now connect traceable pairs, residuals and model use to stated conditions.",
            "One calibration match assigns a range or traceability boundary to the wrong relation.",
            "Pair reference-to-indication mapping with traceability.",
            "Pair residual-supported use with constant in-range sensitivity.",
            "Connect calibration pairs to the bounded linear model.",
            "Connect residual evidence to the distance use decision."
          ),
          focusRef: reasonedCase("bounded-calibration-example", "scenario"),
          contextConditionIds: [
            "references-traceable",
            "constant-sensitivity-in-range"
          ],
          pairs: [
            [
              "reference-pair",
              relation("references-map-indications"),
              condition("references-traceable"),
              relation("references-map-indications"),
              ["references-map-indications"],
              ["references-traceable"]
            ],
            [
              "model-pair",
              relation("pairs-transform-model"),
              term("sensitivity", "boundary"),
              relation("pairs-transform-model"),
              ["pairs-transform-model"],
              ["constant-sensitivity-in-range"]
            ],
            [
              "use-pair",
              relation("residuals-support-use"),
              condition("constant-sensitivity-in-range"),
              relation("residuals-support-use"),
              ["comparison-measures-residuals", "residuals-support-use"],
              ["constant-sensitivity-in-range"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Interpret the calibration graph for a requested distance outside the evidenced range:",
            "The calibration implication withholds conversion and requests new traceable reference evidence.",
            "The calibration implication extends the line automatically or discards valid in-range evidence.",
            "Trace the existing distance references into the bounded linear model.",
            "Use the calibrated-range boundary at the conversion decision.",
            "Locate the absent reference and residual coverage for the outside indication.",
            "Extend the calibration before reporting the requested distance."
          ),
          focusRef: reasonedCase("extrapolation-counterexample", "outcome"),
          contextConditionIds: [
            "extrapolation-assumed-valid",
            "constant-sensitivity-in-range"
          ],
          positions: [
            ["reference-distances", 0, 0],
            ["sensor-indications", 1, 0],
            ["linear-model", 2, 0],
            ["residual-evidence", 2, 1],
            ["calibration-decision", 3, 0]
          ],
          relationIds: [
            "references-map-indications",
            "pairs-transform-model",
            "residuals-support-use"
          ],
          answerRelationIds: ["residuals-support-use"],
          options: [
            [
              "withhold-and-extend",
              true,
              reasonedCase("extrapolation-counterexample", "verification"),
              condition("constant-sensitivity-in-range"),
              ["pairs-transform-model", "residuals-support-use"],
              ["extrapolation-assumed-valid", "constant-sensitivity-in-range"],
              null
            ],
            [
              "extend-line",
              false,
              misconception("line-is-universal", "claim"),
              misconception("line-is-universal", "mechanism"),
              ["pairs-transform-model"],
              ["extrapolation-assumed-valid"],
              "line-is-universal"
            ],
            [
              "discard-in-range",
              false,
              term("calibrated-range", "boundary"),
              reasonedCase("bounded-calibration-example", "criterion"),
              ["residuals-support-use"],
              ["constant-sensitivity-in-range"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the complete distance-calibration graph inside its evidenced range:",
            "The calibration graph supports bounded conversion through traceable pairs and residual checks.",
            "The calibration graph claims future correctness or ignores the reference uncertainty chain.",
            "Follow traceable distance references into sensor indications.",
            "Follow calibration pairs into y = mx + b within the declared range.",
            "Inspect residual evidence before using sensitivity m.",
            "Approve distance conversion only for supported range and conditions."
          ),
          focusRef: reasonedCase("bounded-calibration-example", "outcome"),
          contextConditionIds: [
            "references-traceable",
            "constant-sensitivity-in-range"
          ],
          positions: [
            ["reference-distances", 0, 1],
            ["sensor-indications", 1, 1],
            ["linear-model", 2, 1],
            ["residual-evidence", 2, 2],
            ["calibration-decision", 3, 1]
          ],
          relationIds: [
            "references-map-indications",
            "pairs-transform-model",
            "model-compares-indications",
            "comparison-measures-residuals",
            "residuals-support-use"
          ],
          answerRelationIds: ["residuals-support-use"],
          options: [
            [
              "approve-in-range",
              true,
              reasonedCase("bounded-calibration-example", "verification"),
              condition("constant-sensitivity-in-range"),
              ["comparison-measures-residuals", "residuals-support-use"],
              ["references-traceable", "constant-sensitivity-in-range"],
              null
            ],
            [
              "guarantee-future",
              false,
              term("calibration", "boundary"),
              reasonedCase("bounded-calibration-example", "criterion"),
              ["residuals-support-use"],
              ["constant-sensitivity-in-range"],
              null
            ],
            [
              "ignore-traceability",
              false,
              misconception("line-is-universal", "claim"),
              misconception("line-is-universal", "disconfirmingObservation"),
              ["references-map-indications", "residuals-support-use"],
              ["extrapolation-assumed-valid", "references-traceable"],
              "line-is-universal"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("calibrated-range", "label"),
      focusRef: reasonedCase("bounded-calibration-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["reference-distances", 0, 0],
        ["sensor-indications", 1, 0],
        ["linear-model", 2, 0],
        ["residual-evidence", 2, 1],
        ["calibration-decision", 3, 0]
      ],
      visibleEntityIds: [
        "reference-distances",
        "sensor-indications",
        "linear-model",
        "residual-evidence",
        "calibration-decision"
      ],
      visibleRelationIds: [
        "references-map-indications",
        "pairs-transform-model",
        "model-compares-indications",
        "comparison-measures-residuals",
        "residuals-support-use"
      ],
      controls: [
        [
          "traceability-view",
          term("traceability", "label"),
          ["references-traceable"],
          ["reference-distances", "sensor-indications", "linear-model"],
          ["references-map-indications", "pairs-transform-model"],
          [],
          [],
          [
            [
              "reference-chain",
              "Every calibration input retains value, uncertainty and traceability.",
              ["reference-distances", "sensor-indications"],
              ["references-map-indications"]
            ]
          ],
          reasonedCase("bounded-calibration-example", "verification")
        ],
        [
          "range-view",
          term("calibrated-range", "label"),
          ["constant-sensitivity-in-range"],
          ["linear-model", "residual-evidence", "calibration-decision"],
          [
            "model-compares-indications",
            "comparison-measures-residuals",
            "residuals-support-use"
          ],
          ["references-map-indications"],
          [],
          [
            [
              "bounded-slope",
              "Residual evidence bounds constant sensitivity to the calibrated range.",
              ["linear-model", "residual-evidence", "calibration-decision"],
              ["comparison-measures-residuals", "residuals-support-use"]
            ]
          ],
          reasonedCase("bounded-calibration-example", "verification")
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
