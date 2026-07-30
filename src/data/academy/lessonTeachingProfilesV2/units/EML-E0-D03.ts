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

type FoundationTermSpec = readonly [
  label: string,
  definition: string,
  boundary: string
];

type FoundationEntitySpec = readonly [
  label: string,
  definition: string
];

type FoundationGivenSpec = readonly [
  label: string,
  value: string,
  unit: string | null
];

interface FoundationReasonedCaseSpec {
  scenario: string;
  givens: readonly FoundationGivenSpec[];
  reasoning: readonly [string, string, string];
  outcome: string;
  criterion: string;
  verification: string;
}

interface FoundationMisconceptionSpec {
  claim: string;
  mechanism: string;
  correction: string;
  disconfirmingObservation: string;
}

interface FoundationLessonPlanSpec {
  lessonId: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  primary: FoundationTermSpec;
  supporting: FoundationTermSpec;
  boundary: FoundationTermSpec;
  given: FoundationEntitySpec;
  model: FoundationEntitySpec;
  result: FoundationEntitySpec;
  decision: FoundationEntitySpec;
  failure: FoundationEntitySpec;
  mapPredicate: string;
  transformPredicate: string;
  supportPredicate: string;
  constrainPredicate: string;
  invalidatePredicate: string;
  validStatement: string;
  scopeStatement: string;
  criterionStatement: string;
  brokenStatement: string;
  failureMechanism: string;
  failureConsequence: string;
  failureCriterion: string;
  conceptualSteps: readonly [string, string, string, string, string];
  example: FoundationReasonedCaseSpec;
  counterexample: FoundationReasonedCaseSpec;
  misconception: FoundationMisconceptionSpec;
  scenarioMarkers: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];
  assessmentVariant: 0 | 1 | 2 | 3 | 4 | 5;
  codeSample: string;
  validAnnotation: string;
  brokenAnnotation: string;
}

const rotateFoundationValues = <Value>(
  values: readonly Value[],
  offset: number
): readonly Value[] => {
  const normalisedOffset = offset % values.length;
  return [
    ...values.slice(normalisedOffset),
    ...values.slice(0, normalisedOffset)
  ];
};

const foundationInstruction = (
  spec: FoundationLessonPlanSpec,
  marker: string,
  action: string
): AcademyLessonV2InstructionPlan => instruction(
  `${marker}: ${action} the ${spec.primary[0]} evidence:`,
  `The ${spec.primary[0]} choice is supported by the ${spec.decision[0]} because ${spec.criterionStatement}`,
  `The ${spec.primary[0]} choice fails at the ${spec.boundary[0]} because ${spec.brokenStatement}`,
  `Inspect the ${spec.supporting[0]} before changing the ${spec.model[0]}.`,
  `Compare the ${spec.boundary[0]} with the ${spec.failure[0]} evidence.`,
  `First trace the ${spec.supporting[0]} through the ${spec.model[0]}.`,
  `Then test the ${spec.result[0]} against the ${spec.decision[0]} criterion.`
);

const createFoundationLessonPlan = (
  spec: FoundationLessonPlanSpec
): AcademyLessonTeachingProfileV2CompactPlan => ({
  schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  lessonId: spec.lessonId,
  systemModel: spec.systemModel,
  failurePattern: spec.failurePattern,
  visualExplanation: spec.visualExplanation,
  applicationTask: spec.applicationTask,
  terms: [
    [
      "core-term",
      spec.primary[0],
      spec.primary[1],
      spec.primary[2],
      "name-model"
    ],
    [
      "supporting-term",
      spec.supporting[0],
      spec.supporting[1],
      spec.supporting[2],
      "apply-relation"
    ],
    [
      "boundary-term",
      spec.boundary[0],
      spec.boundary[1],
      spec.boundary[2],
      "check-boundary"
    ]
  ],
  entities: [
    ["given-state", "input", spec.given[0], spec.given[1]],
    ["model-state", "mechanism", spec.model[0], spec.model[1]],
    ["result-state", "observation", spec.result[0], spec.result[1]],
    ["decision-state", "decision", spec.decision[0], spec.decision[1]],
    ["failure-state", "constraint", spec.failure[0], spec.failure[1]]
  ],
  relations: [
    [
      "givens-map-model",
      "maps",
      ["given-state"],
      ["model-state"],
      spec.mapPredicate,
      "directed",
      "many-to-one"
    ],
    [
      "model-causes-result",
      "transforms",
      ["model-state"],
      ["result-state"],
      spec.transformPredicate,
      "directed",
      "one-to-one"
    ],
    [
      "result-supports-decision",
      "supports",
      ["result-state"],
      ["decision-state"],
      spec.supportPredicate,
      "directed",
      "one-to-one"
    ],
    [
      "model-constrains-boundary",
      "constrains",
      ["model-state"],
      ["failure-state"],
      spec.constrainPredicate,
      "directed",
      "one-to-one"
    ],
    [
      "boundary-invalidates-decision",
      "invalidates",
      ["failure-state"],
      ["decision-state"],
      spec.invalidatePredicate,
      "directed",
      "one-to-one"
    ]
  ],
  conditions: [
    [
      "valid-context",
      "assumption",
      spec.validStatement,
      ["given-state", "model-state"],
      ["givens-map-model"]
    ],
    [
      "scope-condition",
      "operating-state",
      spec.scopeStatement,
      ["model-state", "result-state"],
      ["model-causes-result"]
    ],
    [
      "acceptance-criterion",
      "criterion",
      spec.criterionStatement,
      ["result-state", "decision-state"],
      ["result-supports-decision"]
    ],
    [
      "broken-context",
      "boundary",
      spec.brokenStatement,
      ["model-state", "failure-state", "decision-state"],
      [
        "model-constrains-boundary",
        "boundary-invalidates-decision"
      ]
    ]
  ],
  failureBoundary: [
    "lesson-boundary",
    "broken-context",
    spec.failureMechanism,
    spec.failureConsequence,
    spec.failureCriterion,
    ["model-state", "failure-state", "decision-state"],
    ["model-constrains-boundary", "boundary-invalidates-decision"]
  ],
  conceptualModel: [
    [
      "name-model",
      spec.conceptualSteps[0],
      ["given-state", "model-state"],
      ["givens-map-model"],
      ["valid-context"]
    ],
    [
      "apply-relation",
      spec.conceptualSteps[1],
      ["model-state", "result-state"],
      ["model-causes-result"],
      ["scope-condition"]
    ],
    [
      "inspect-result",
      spec.conceptualSteps[2],
      ["result-state", "decision-state"],
      ["result-supports-decision"],
      ["acceptance-criterion"]
    ],
    [
      "check-boundary",
      spec.conceptualSteps[3],
      ["model-state", "failure-state"],
      ["model-constrains-boundary"],
      ["broken-context"]
    ],
    [
      "make-decision",
      spec.conceptualSteps[4],
      ["failure-state", "decision-state"],
      [
        "result-supports-decision",
        "boundary-invalidates-decision"
      ],
      ["acceptance-criterion", "broken-context"]
    ]
  ],
  reasonedCases: [
    {
      id: "worked-example",
      kind: "example",
      scenario: spec.example.scenario,
      changedConditionIds: ["valid-context"],
      givens: spec.example.givens.map((given, index) => [
        `example-given-${index + 1}`,
        given[0],
        given[1],
        given[2],
        "given-state"
      ]),
      reasoningSteps: [
        [
          "example-model",
          spec.example.reasoning[0],
          ["given-state", "model-state"],
          ["givens-map-model"],
          ["valid-context"]
        ],
        [
          "example-result",
          spec.example.reasoning[1],
          ["model-state", "result-state"],
          ["model-causes-result"],
          ["scope-condition"]
        ],
        [
          "example-decision",
          spec.example.reasoning[2],
          ["result-state", "decision-state"],
          ["result-supports-decision"],
          ["acceptance-criterion"]
        ]
      ],
      outcome: spec.example.outcome,
      criterionConditionId: "acceptance-criterion",
      criterion: spec.example.criterion,
      verification: spec.example.verification
    },
    {
      id: "boundary-counterexample",
      kind: "counterexample",
      scenario: spec.counterexample.scenario,
      changedConditionIds: ["broken-context"],
      givens: spec.counterexample.givens.map((given, index) => [
        `counter-given-${index + 1}`,
        given[0],
        given[1],
        given[2],
        "given-state"
      ]),
      reasoningSteps: [
        [
          "counter-boundary",
          spec.counterexample.reasoning[0],
          ["given-state", "model-state", "failure-state"],
          ["givens-map-model", "model-constrains-boundary"],
          ["valid-context", "broken-context"]
        ],
        [
          "counter-result",
          spec.counterexample.reasoning[1],
          ["model-state", "result-state", "failure-state"],
          ["model-causes-result", "model-constrains-boundary"],
          ["scope-condition", "broken-context"]
        ],
        [
          "counter-decision",
          spec.counterexample.reasoning[2],
          ["failure-state", "decision-state"],
          ["boundary-invalidates-decision"],
          ["acceptance-criterion", "broken-context"]
        ]
      ],
      outcome: spec.counterexample.outcome,
      criterionConditionId: "acceptance-criterion",
      criterion: spec.counterexample.criterion,
      verification: spec.counterexample.verification
    }
  ],
  misconception: {
    id: "shortcut-claim",
    claim: spec.misconception.claim,
    mechanism: spec.misconception.mechanism,
    correction: spec.misconception.correction,
    disconfirmingObservation: spec.misconception.disconfirmingObservation,
    entityIds: [
      "given-state",
      "model-state",
      "result-state",
      "failure-state",
      "decision-state"
    ],
    relationIds: [
      "givens-map-model",
      "model-causes-result",
      "model-constrains-boundary",
      "boundary-invalidates-decision"
    ],
    conditionIds: ["valid-context", "broken-context"]
  },
  assessmentPlans: {
    q2: {
      base: {
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[0],
          "order"
        ),
        focusRef: reasonedCase("worked-example", "scenario"),
        contextConditionIds: rotateFoundationValues(
          [
            "valid-context",
            "scope-condition",
            "acceptance-criterion"
          ],
          spec.assessmentVariant % 3
        ),
        steps: [
          ["base-map", ["givens-map-model"], ["valid-context"]],
          ["base-transform", ["model-causes-result"], ["scope-condition"]],
          [
            "base-decide",
            ["result-supports-decision"],
            ["acceptance-criterion"]
          ]
        ],
        correctOrder: ["base-map", "base-transform", "base-decide"]
      },
      retry: {
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[1],
          "repair"
        ),
        focusRef: reasonedCase("boundary-counterexample", "scenario"),
        contextConditionIds: rotateFoundationValues(
          [
            "broken-context",
            "valid-context",
            "scope-condition",
            "acceptance-criterion"
          ],
          spec.assessmentVariant % 4
        ),
        steps: [
          [
            "retry-expose",
            ["model-constrains-boundary"],
            ["broken-context"]
          ],
          ["retry-remap", ["givens-map-model"], ["valid-context"]],
          [
            "retry-recalculate",
            ["model-causes-result"],
            ["scope-condition"]
          ],
          [
            "retry-decide",
            ["result-supports-decision"],
            ["acceptance-criterion"]
          ]
        ],
        correctOrder: [
          "retry-expose",
          "retry-remap",
          "retry-recalculate",
          "retry-decide"
        ]
      }
    },
    q3: {
      base: {
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[2],
          "select"
        ),
        focusRef: reasonedCase("worked-example", "criterion"),
        contextConditionIds: rotateFoundationValues(
          ["valid-context", "acceptance-criterion"],
          Math.floor(spec.assessmentVariant / 4)
        ),
        options: rotateFoundationValues(
          [
            [
              "base-example",
              true,
              reasonedCase("worked-example", "outcome"),
              reasonedCase("worked-example", "verification"),
              ["givens-map-model", "model-causes-result"],
              ["valid-context", "scope-condition"],
              null
            ],
            [
              "base-criterion",
              true,
              condition("acceptance-criterion"),
              relation("result-supports-decision"),
              ["result-supports-decision"],
              ["acceptance-criterion"],
              null
            ],
            [
              "base-shortcut",
              false,
              misconception("shortcut-claim", "claim"),
              misconception("shortcut-claim", "mechanism"),
              ["boundary-invalidates-decision"],
              ["broken-context"],
              "shortcut-claim"
            ],
            [
              "base-beyond-boundary",
              false,
              term("boundary-term", "boundary"),
              condition("broken-context"),
              ["model-constrains-boundary"],
              ["broken-context"],
              null
            ]
          ] as const,
          spec.assessmentVariant % 4
        )
      },
      retry: {
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[3],
          "diagnose"
        ),
        focusRef: reasonedCase("boundary-counterexample", "criterion"),
        contextConditionIds: ["broken-context", "acceptance-criterion"],
        options: [
          [
            "retry-boundary",
            true,
            relation("boundary-invalidates-decision"),
            reasonedCase("boundary-counterexample", "verification"),
            [
              "model-constrains-boundary",
              "boundary-invalidates-decision"
            ],
            ["broken-context"],
            null
          ],
          [
            "retry-correction",
            true,
            condition("valid-context"),
            reasonedCase("worked-example", "verification"),
            ["givens-map-model", "result-supports-decision"],
            ["valid-context", "acceptance-criterion"],
            null
          ],
          [
            "retry-shortcut",
            false,
            misconception("shortcut-claim", "claim"),
            misconception("shortcut-claim", "mechanism"),
            ["boundary-invalidates-decision"],
            ["broken-context"],
            "shortcut-claim"
          ],
          [
            "retry-unchecked",
            false,
            term("supporting-term", "boundary"),
            condition("scope-condition"),
            ["model-causes-result"],
            ["scope-condition"],
            null
          ]
        ]
      }
    },
    q4: {
      base: {
        kind: "matching",
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[4],
          "match"
        ),
        focusRef: reasonedCase("worked-example", "verification"),
        contextConditionIds: rotateFoundationValues(
          [
            "valid-context",
            "scope-condition",
            "acceptance-criterion"
          ],
          Math.floor(spec.assessmentVariant / 3)
        ),
        pairs: rotateFoundationValues(
          [
            [
              "core-pair",
              term("core-term", "label"),
              term("core-term", "definition"),
              relation("givens-map-model"),
              ["givens-map-model"],
              ["valid-context"]
            ],
            [
              "support-pair",
              term("supporting-term", "label"),
              term("supporting-term", "definition"),
              relation("model-causes-result"),
              ["model-causes-result"],
              ["scope-condition"]
            ],
            [
              "boundary-pair",
              term("boundary-term", "label"),
              term("boundary-term", "boundary"),
              relation("boundary-invalidates-decision"),
              ["boundary-invalidates-decision"],
              ["broken-context"]
            ]
          ] as const,
          spec.assessmentVariant % 3
        )
      },
      retry: {
        kind: "short-response",
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[5],
          "explain"
        ),
        focusRef: reasonedCase("boundary-counterexample", "verification"),
        contextConditionIds: [
          "valid-context",
          "scope-condition",
          "acceptance-criterion",
          "broken-context"
        ],
        conceptGroups: [
          [
            "core-concept",
            term("core-term", "label"),
            [term("core-term", "label")],
            ["givens-map-model"],
            ["valid-context"]
          ],
          [
            "support-concept",
            term("supporting-term", "label"),
            [term("supporting-term", "label")],
            ["model-causes-result"],
            ["scope-condition"]
          ],
          [
            "boundary-concept",
            term("boundary-term", "label"),
            [term("boundary-term", "label")],
            ["boundary-invalidates-decision"],
            ["broken-context"]
          ]
        ],
        minimumConceptGroups: 3,
        requiredRelationIds: [
          "givens-map-model",
          "model-causes-result",
          "result-supports-decision"
        ],
        criterionConditionId: "acceptance-criterion"
      }
    },
    q5: {
      base: {
        kind: "diagram",
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[6],
          "interpret"
        ),
        focusRef: reasonedCase("worked-example", "scenario"),
        contextConditionIds: [
          "valid-context",
          "scope-condition",
          "acceptance-criterion"
        ],
        positions: [
          ["given-state", 0, 0],
          ["model-state", 1, 0],
          ["result-state", 2, 0],
          ["decision-state", 3, 0],
          ["failure-state", 2, 1]
        ],
        relationIds: [
          "givens-map-model",
          "model-causes-result",
          "result-supports-decision",
          "model-constrains-boundary",
          "boundary-invalidates-decision"
        ],
        answerRelationIds: [
          "givens-map-model",
          "model-causes-result",
          "result-supports-decision"
        ],
        options: [
          [
            "diagram-valid",
            true,
            reasonedCase("worked-example", "outcome"),
            reasonedCase("worked-example", "verification"),
            [
              "givens-map-model",
              "model-causes-result",
              "result-supports-decision"
            ],
            [
              "valid-context",
              "scope-condition",
              "acceptance-criterion"
            ],
            null
          ],
          [
            "diagram-shortcut",
            false,
            misconception("shortcut-claim", "claim"),
            misconception("shortcut-claim", "mechanism"),
            ["boundary-invalidates-decision"],
            ["broken-context"],
            "shortcut-claim"
          ],
          [
            "diagram-boundary",
            false,
            condition("broken-context"),
            reasonedCase("boundary-counterexample", "verification"),
            [
              "model-constrains-boundary",
              "boundary-invalidates-decision"
            ],
            ["broken-context"],
            null
          ]
        ]
      },
      retry: {
        kind: "code-analysis",
        instruction: foundationInstruction(
          spec,
          spec.scenarioMarkers[7],
          "audit"
        ),
        focusRef: reasonedCase("boundary-counterexample", "outcome"),
        contextConditionIds: ["broken-context", "scope-condition"],
        language: "text",
        code: spec.codeSample,
        options: [
          [
            "code-invalidates",
            true,
            relation("boundary-invalidates-decision"),
            reasonedCase("boundary-counterexample", "verification"),
            [
              "model-constrains-boundary",
              "boundary-invalidates-decision"
            ],
            ["broken-context"],
            null
          ],
          [
            "code-accepts",
            false,
            reasonedCase("worked-example", "outcome"),
            condition("acceptance-criterion"),
            ["result-supports-decision"],
            ["acceptance-criterion"],
            null
          ],
          [
            "code-shortcut",
            false,
            misconception("shortcut-claim", "claim"),
            misconception("shortcut-claim", "mechanism"),
            ["boundary-invalidates-decision"],
            ["broken-context"],
            "shortcut-claim"
          ]
        ]
      }
    }
  },
  explorerPlan: {
    kind: "shared-graph",
    titleRef: term("core-term", "label"),
    focusRef: reasonedCase("worked-example", "verification"),
    modelKind: "causal-graph",
    positions: [
      ["given-state", 0, 0],
      ["model-state", 1, 0],
      ["result-state", 2, 0],
      ["decision-state", 3, 0],
      ["failure-state", 2, 1]
    ],
    visibleEntityIds: [
      "given-state",
      "model-state",
      "result-state",
      "decision-state",
      "failure-state"
    ],
    visibleRelationIds: [
      "givens-map-model",
      "model-causes-result",
      "result-supports-decision",
      "model-constrains-boundary",
      "boundary-invalidates-decision"
    ],
    controls: [
      [
        "valid-model",
        condition("valid-context"),
        ["valid-context"],
        ["given-state", "model-state", "result-state", "decision-state"],
        [
          "givens-map-model",
          "model-causes-result",
          "result-supports-decision"
        ],
        [
          "model-constrains-boundary",
          "boundary-invalidates-decision"
        ],
        [],
        [
          [
            "valid-note",
            spec.validAnnotation,
            ["model-state", "result-state", "decision-state"],
            ["model-causes-result", "result-supports-decision"]
          ]
        ],
        reasonedCase("worked-example", "verification")
      ],
      [
        "broken-model",
        condition("broken-context"),
        ["broken-context"],
        ["given-state", "model-state", "failure-state", "decision-state"],
        [
          "model-constrains-boundary",
          "boundary-invalidates-decision"
        ],
        [
          "model-causes-result",
          "result-supports-decision"
        ],
        [],
        [
          [
            "broken-note",
            spec.brokenAnnotation,
            ["model-state", "failure-state", "decision-state"],
            [
              "model-constrains-boundary",
              "boundary-invalidates-decision"
            ]
          ]
        ],
        reasonedCase("boundary-counterexample", "verification")
      ]
    ]
  }
});

const expectedLessonIds = [
  "EML-E0-D03-L01",
  "EML-E0-D03-L02",
  "EML-E0-D03-L03",
  "EML-E0-D03-L04",
  "EML-E0-D03-L05",
  "EML-E0-D03-L06",
  "EML-E0-D03-L07"
] as const;

const plans = [
  {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: "EML-E0-D03-L01",
    systemModel:
      "An algebraic expression combines numbers, symbols and operations only after every symbol has a declared quantity, unit and permitted range.",
    failurePattern:
      "A symbol is reused for a different quantity or incompatible units are combined, so correct-looking arithmetic no longer represents the declared engineering system.",
    visualExplanation:
      "An expression graph links defined robot masses to symbolic terms, applies coefficients, combines compatible terms and checks the evaluated total against its unit and range.",
    applicationTask:
      "Define and evaluate a robot mass expression while keeping every symbol, coefficient, unit and permitted value explicit.",
    terms: [
      [
        "algebraic-expression",
        "Algebraic expression",
        "A combination of numbers, symbols and operations that represents a quantity without asserting an equality.",
        "An expression is meaningful only while each symbol keeps one definition, compatible unit and permitted value.",
        "define-symbols"
      ],
      [
        "variable-symbol",
        "Variable symbol",
        "A letter or mark assigned to one quantity whose value may vary inside a declared domain.",
        "The same symbol cannot silently represent two different quantities in one model.",
        "define-symbols"
      ],
      [
        "coefficient",
        "Coefficient",
        "A number multiplying a variable or term in an algebraic expression.",
        "A coefficient scales its attached term and does not replace the term's physical unit.",
        "evaluate-terms"
      ]
    ],
    entities: [
      [
        "declared-quantities",
        "input",
        "Declared robot quantities",
        "Wheel-module mass and battery mass with symbols, values, units and permitted ranges."
      ],
      [
        "symbol-table",
        "state",
        "Symbol definition table",
        "One stable quantity definition for every symbol used in the expression."
      ],
      [
        "mass-expression",
        "mechanism",
        "Robot mass expression",
        "The symbolic rule M equals 2 times m_w plus m_b."
      ],
      [
        "evaluated-mass",
        "observation",
        "Evaluated robot mass",
        "The numerical expression result with its retained kilogram unit."
      ],
      [
        "expression-decision",
        "decision",
        "Expression validity decision",
        "The decision that the symbolic and evaluated forms preserve meaning, unit and range."
      ]
    ],
    relations: [
      [
        "quantities-map-symbols",
        "maps",
        ["declared-quantities"],
        ["symbol-table"],
        "declared robot quantities map to stable variable symbols",
        "directed",
        "one-to-one"
      ],
      [
        "symbols-transform-expression",
        "transforms",
        ["symbol-table"],
        ["mass-expression"],
        "defined symbols and coefficients transform into the robot mass expression",
        "directed",
        "many-to-one"
      ],
      [
        "expression-causes-value",
        "causes",
        ["mass-expression"],
        ["evaluated-mass"],
        "substitution and compatible operations cause the evaluated mass value",
        "directed",
        "one-to-one"
      ],
      [
        "value-supports-decision",
        "supports",
        ["evaluated-mass"],
        ["expression-decision"],
        "the unit-labelled evaluated mass supports the expression validity decision",
        "directed",
        "one-to-one"
      ],
      [
        "undefined-symbol-invalidates",
        "invalidates",
        ["declared-quantities"],
        ["expression-decision"],
        "an undefined or redefined symbol invalidates the expression decision",
        "directed",
        "one-to-one"
      ]
    ],
    conditions: [
      [
        "symbols-defined-once",
        "assumption",
        "Every symbol has one quantity, unit and permitted range before evaluation.",
        ["declared-quantities", "symbol-table"],
        ["quantities-map-symbols"]
      ],
      [
        "compatible-mass-terms",
        "operating-state",
        "Only compatible mass terms are added and coefficients remain dimensionless counts.",
        ["symbol-table", "mass-expression", "evaluated-mass"],
        ["symbols-transform-expression", "expression-causes-value"]
      ],
      [
        "mass-result-bounded",
        "criterion",
        "The evaluated result retains kilograms and lies inside the declared quantity ranges.",
        ["evaluated-mass", "expression-decision"],
        ["value-supports-decision"]
      ],
      [
        "symbol-meaning-broken",
        "boundary",
        "An undefined symbol, changed meaning or incompatible unit blocks evaluation.",
        ["declared-quantities", "expression-decision"],
        ["undefined-symbol-invalidates"]
      ]
    ],
    failureBoundary: [
      "expression-boundary",
      "symbol-meaning-broken",
      "a symbol loses its declared meaning or an operation combines incompatible quantities",
      "the evaluated number no longer represents the robot mass expression",
      "reject the expression until every symbol and operation has a compatible definition",
      ["symbol-table", "mass-expression", "expression-decision"],
      ["symbols-transform-expression", "undefined-symbol-invalidates"]
    ],
    conceptualModel: [
      [
        "define-symbols",
        "List each robot quantity and bind it to one symbol, unit and permitted range.",
        ["declared-quantities", "symbol-table"],
        ["quantities-map-symbols"],
        ["symbols-defined-once"]
      ],
      [
        "build-expression",
        "Write the mass expression from the defined symbols and explicit coefficients.",
        ["symbol-table", "mass-expression"],
        ["symbols-transform-expression"],
        ["compatible-mass-terms"]
      ],
      [
        "evaluate-terms",
        "Substitute values into each mass term before combining compatible terms.",
        ["mass-expression", "evaluated-mass"],
        ["expression-causes-value"],
        ["compatible-mass-terms"]
      ],
      [
        "retain-unit",
        "Carry the kilogram unit from every mass term into the evaluated result.",
        ["evaluated-mass", "expression-decision"],
        ["value-supports-decision"],
        ["mass-result-bounded"]
      ],
      [
        "check-boundary",
        "Reject the expression if a symbol changes meaning, lacks a unit or leaves its permitted range.",
        ["declared-quantities", "expression-decision"],
        ["undefined-symbol-invalidates"],
        ["symbol-meaning-broken"]
      ]
    ],
    reasonedCases: [
      {
        id: "defined-mass-example",
        kind: "example",
        scenario:
          "A mobile robot uses two identical wheel modules of mass m_w and one battery of mass m_b, so their combined mass is represented by M = 2m_w + m_b.",
        changedConditionIds: ["symbols-defined-once"],
        givens: [
          [
            "wheel-mass",
            "Wheel-module mass m_w",
            "0.40",
            "kg",
            "declared-quantities"
          ],
          [
            "battery-mass",
            "Battery mass m_b",
            "1.20",
            "kg",
            "declared-quantities"
          ]
        ],
        reasoningSteps: [
          [
            "example-bind",
            "The symbol table binds m_w to one 0.40 kg wheel-module mass and m_b to the 1.20 kg battery mass.",
            ["declared-quantities", "symbol-table"],
            ["quantities-map-symbols"],
            ["symbols-defined-once"]
          ],
          [
            "example-evaluate",
            "The coefficient 2 counts two wheel modules, so 2 times 0.40 kg plus 1.20 kg equals 2.00 kg.",
            ["symbol-table", "mass-expression", "evaluated-mass"],
            ["symbols-transform-expression", "expression-causes-value"],
            ["compatible-mass-terms"]
          ],
          [
            "example-check",
            "Every term is a mass in kilograms, so the 2.00 kg evaluated mass preserves the expression meaning.",
            ["evaluated-mass", "expression-decision"],
            ["value-supports-decision"],
            ["mass-result-bounded"]
          ]
        ],
        outcome:
          "The expression evaluates to M = 2.00 kg with stable symbol meanings and compatible units.",
        criterionConditionId: "mass-result-bounded",
        criterion:
          "Accept the result only when each symbol retains its definition and every added term is a compatible mass.",
        verification:
          "Rebuild the total directly as 0.40 kg + 0.40 kg + 1.20 kg and confirm the same 2.00 kg result."
      },
      {
        id: "redefined-symbol-counterexample",
        kind: "counterexample",
        scenario:
          "The symbol m_b first means battery mass in kilograms but is later reused for battery voltage while the expression M = 2m_w + m_b is left unchanged.",
        changedConditionIds: ["symbol-meaning-broken"],
        givens: [
          [
            "conflicting-symbol",
            "Second meaning assigned to m_b",
            "battery voltage",
            "V",
            "declared-quantities"
          ]
        ],
        reasoningSteps: [
          [
            "counter-conflict",
            "The symbol table can no longer assign one stable quantity and unit to m_b.",
            ["declared-quantities", "symbol-table"],
            ["quantities-map-symbols", "undefined-symbol-invalidates"],
            ["symbols-defined-once", "symbol-meaning-broken"]
          ],
          [
            "counter-unit",
            "The mass expression would add a voltage term to kilogram mass terms, which is not a compatible operation.",
            ["symbol-table", "mass-expression"],
            ["symbols-transform-expression", "undefined-symbol-invalidates"],
            ["compatible-mass-terms", "symbol-meaning-broken"]
          ],
          [
            "counter-reject",
            "No evaluated robot mass can support the expression decision until the conflicting symbol is renamed and rebound.",
            ["mass-expression", "evaluated-mass", "expression-decision"],
            ["expression-causes-value", "value-supports-decision"],
            ["mass-result-bounded", "symbol-meaning-broken"]
          ]
        ],
        outcome:
          "The unchanged expression is invalid because m_b no longer has one quantity or one unit.",
        criterionConditionId: "mass-result-bounded",
        criterion:
          "A valid expression requires every symbol to retain one compatible quantity definition.",
        verification:
          "Rename the voltage symbol, restore m_b as battery mass and repeat the unit-labelled evaluation."
      }
    ],
    misconception: {
      id: "letters-are-unitless-placeholders",
      claim:
        "Algebraic letters are unitless placeholders that can change meaning whenever the arithmetic still works.",
      mechanism:
        "The written symbol is treated as decoration, so its quantity, unit and permitted range are detached from the represented system.",
      correction:
        "Bind every symbol once, carry its unit through each operation and rename any genuinely different quantity.",
      disconfirmingObservation:
        "Reusing m_b for voltage makes the expression attempt to add volts to kilograms.",
      entityIds: [
        "declared-quantities",
        "symbol-table",
        "mass-expression",
        "expression-decision"
      ],
      relationIds: [
        "quantities-map-symbols",
        "symbols-transform-expression",
        "undefined-symbol-invalidates"
      ],
      conditionIds: ["symbols-defined-once", "symbol-meaning-broken"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(
            "Order the robot mass expression from declared quantities to a checked value:",
            "The mass expression sequence defines symbols, evaluates compatible terms and checks the kilogram result.",
            "The mass expression sequence evaluates a symbol before its quantity or unit is defined.",
            "Start with the declared robot quantities and the symbol table.",
            "Place the mass expression before the evaluated mass.",
            "Bind m_w and m_b before applying the coefficient 2.",
            "Finish by checking the evaluated mass and expression decision."
          ),
          focusRef: reasonedCase("defined-mass-example", "scenario"),
          contextConditionIds: [
            "symbols-defined-once",
            "compatible-mass-terms",
            "mass-result-bounded"
          ],
          steps: [
            [
              "bind-symbols",
              ["quantities-map-symbols"],
              ["symbols-defined-once"]
            ],
            [
              "form-expression",
              ["symbols-transform-expression"],
              ["compatible-mass-terms"]
            ],
            [
              "evaluate-mass",
              ["expression-causes-value"],
              ["compatible-mass-terms"]
            ],
            [
              "check-mass",
              ["value-supports-decision"],
              ["mass-result-bounded"]
            ]
          ],
          correctOrder: [
            "bind-symbols",
            "form-expression",
            "evaluate-mass",
            "check-mass"
          ]
        },
        retry: {
          instruction: instruction(
            "Repair the robot mass expression after m_b changes meaning:",
            "The repaired mass expression restores one m_b definition before any kilogram calculation.",
            "The repaired mass expression still combines the voltage meaning of m_b with mass terms.",
            "Locate the conflicting m_b definition in the symbol table.",
            "Restore a unique battery-mass symbol before rebuilding the mass expression.",
            "Rename the voltage quantity and rebind m_b to battery mass.",
            "Re-evaluate the mass expression and check the kilogram result."
          ),
          focusRef: reasonedCase("redefined-symbol-counterexample", "scenario"),
          contextConditionIds: [
            "symbol-meaning-broken",
            "symbols-defined-once",
            "mass-result-bounded"
          ],
          steps: [
            [
              "expose-conflict",
              ["undefined-symbol-invalidates"],
              ["symbol-meaning-broken"]
            ],
            [
              "restore-symbol",
              ["quantities-map-symbols"],
              ["symbols-defined-once"]
            ],
            [
              "rebuild-value",
              ["symbols-transform-expression", "expression-causes-value"],
              ["compatible-mass-terms"]
            ],
            [
              "recheck-result",
              ["value-supports-decision"],
              ["mass-result-bounded"]
            ]
          ],
          correctOrder: [
            "expose-conflict",
            "restore-symbol",
            "rebuild-value",
            "recheck-result"
          ]
        }
      },
      q3: {
        base: {
          instruction: instruction(
            "Select the features that make the robot mass expression meaningful:",
            "The selected expression features preserve symbol definitions, compatible mass units and the bounded result.",
            "A selected expression feature treats a changed symbol or incompatible unit as harmless.",
            "Look for one variable-symbol definition for each robot quantity.",
            "Look for kilogram terms before the evaluated mass is accepted.",
            "Select the symbol-table relation that stabilises m_w and m_b.",
            "Select the evaluated-mass check that supports expression validity."
          ),
          focusRef: term("algebraic-expression", "definition"),
          contextConditionIds: [
            "symbols-defined-once",
            "compatible-mass-terms",
            "mass-result-bounded"
          ],
          options: [
            [
              "stable-symbols",
              true,
              relation("quantities-map-symbols"),
              condition("symbols-defined-once"),
              ["quantities-map-symbols"],
              ["symbols-defined-once"],
              null
            ],
            [
              "compatible-value",
              true,
              relation("expression-causes-value"),
              condition("compatible-mass-terms"),
              ["expression-causes-value", "value-supports-decision"],
              ["compatible-mass-terms", "mass-result-bounded"],
              null
            ],
            [
              "redefine-letter",
              false,
              misconception("letters-are-unitless-placeholders", "claim"),
              misconception("letters-are-unitless-placeholders", "mechanism"),
              ["undefined-symbol-invalidates"],
              ["symbol-meaning-broken"],
              "letters-are-unitless-placeholders"
            ],
            [
              "drop-kilograms",
              false,
              term("coefficient", "boundary"),
              condition("mass-result-bounded"),
              ["symbols-transform-expression"],
              ["compatible-mass-terms", "mass-result-bounded"],
              null
            ]
          ]
        },
        retry: {
          instruction: instruction(
            "Diagnose why the redefined m_b expression cannot produce robot mass:",
            "The diagnosis identifies the symbol conflict and the incompatible voltage-to-mass operation.",
            "The diagnosis blames the coefficient even though the changed m_b meaning is the expression failure.",
            "Trace m_b from the declared quantities into the symbol table.",
            "Compare the voltage unit with every mass-expression term.",
            "Mark the m_b definition conflict as the first invalid relation.",
            "Reject the evaluated mass until the symbol table is repaired."
          ),
          focusRef: reasonedCase(
            "redefined-symbol-counterexample",
            "verification"
          ),
          contextConditionIds: [
            "symbol-meaning-broken",
            "symbols-defined-once",
            "compatible-mass-terms"
          ],
          options: [
            [
              "meaning-conflict",
              true,
              relation("undefined-symbol-invalidates"),
              condition("symbol-meaning-broken"),
              ["quantities-map-symbols", "undefined-symbol-invalidates"],
              ["symbols-defined-once", "symbol-meaning-broken"],
              null
            ],
            [
              "unit-conflict",
              true,
              reasonedCase("redefined-symbol-counterexample", "outcome"),
              condition("compatible-mass-terms"),
              ["symbols-transform-expression"],
              ["compatible-mass-terms", "symbol-meaning-broken"],
              null
            ],
            [
              "coefficient-fault",
              false,
              term("coefficient", "definition"),
              reasonedCase("defined-mass-example", "verification"),
              ["expression-causes-value"],
              ["compatible-mass-terms"],
              null
            ],
            [
              "letters-can-change",
              false,
              misconception("letters-are-unitless-placeholders", "claim"),
              misconception(
                "letters-are-unitless-placeholders",
                "mechanism"
              ),
              ["undefined-symbol-invalidates"],
              ["symbol-meaning-broken"],
              "letters-are-unitless-placeholders"
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(
            "Explain why M = 2m_w + m_b remains an engineering mass expression:",
            "The expression explanation connects stable symbols, the coefficient and compatible kilogram terms.",
            "The expression explanation lists arithmetic but omits symbol meaning or mass units.",
            "State what m_w and m_b mean in the symbol table.",
            "Describe how coefficient 2 changes the wheel-module mass term.",
            "Connect the variable symbols to the robot mass expression.",
            "Use the evaluated mass and kilogram criterion to close the explanation."
          ),
          focusRef: misconception(
            "letters-are-unitless-placeholders",
            "claim"
          ),
          contextConditionIds: [
            "symbols-defined-once",
            "compatible-mass-terms",
            "mass-result-bounded"
          ],
          conceptGroups: [
            [
              "symbol-group",
              term("variable-symbol", "label"),
              [term("variable-symbol", "definition")],
              ["quantities-map-symbols"],
              ["symbols-defined-once"]
            ],
            [
              "coefficient-group",
              term("coefficient", "label"),
              [term("coefficient", "definition")],
              ["symbols-transform-expression", "expression-causes-value"],
              ["compatible-mass-terms"]
            ],
            [
              "unit-group",
              condition("mass-result-bounded"),
              [reasonedCase("defined-mass-example", "criterion")],
              ["value-supports-decision"],
              ["mass-result-bounded"]
            ]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["symbols-transform-expression"],
          criterionConditionId: "mass-result-bounded"
        },
        retry: {
          kind: "matching",
          instruction: instruction(
            "Match each mass-expression feature to its governing meaning:",
            "The expression matches bind symbols, coefficients and evaluated mass to their proper checks.",
            "One expression match assigns a voltage meaning or unitless result to a mass feature.",
            "Pair the symbol table with the one-definition assumption.",
            "Pair the coefficient with the mass-expression transformation.",
            "Match m_w and m_b definitions before matching the evaluated mass.",
            "Match the kilogram result with the expression validity criterion."
          ),
          focusRef: reasonedCase("defined-mass-example", "verification"),
          contextConditionIds: [
            "symbols-defined-once",
            "compatible-mass-terms",
            "mass-result-bounded"
          ],
          pairs: [
            [
              "symbol-pair",
              relation("quantities-map-symbols"),
              condition("symbols-defined-once"),
              relation("quantities-map-symbols"),
              ["quantities-map-symbols"],
              ["symbols-defined-once"]
            ],
            [
              "coefficient-pair",
              relation("symbols-transform-expression"),
              term("coefficient", "definition"),
              relation("symbols-transform-expression"),
              ["symbols-transform-expression"],
              ["compatible-mass-terms"]
            ],
            [
              "result-pair",
              relation("value-supports-decision"),
              condition("mass-result-bounded"),
              relation("value-supports-decision"),
              ["value-supports-decision"],
              ["mass-result-bounded"]
            ]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instruction(
            "Read the robot mass diagram when m_b has conflicting meanings:",
            "The expression diagram shows the symbol conflict suppressing a valid path to evaluated mass.",
            "The expression diagram treats the voltage meaning of m_b as a compatible mass term.",
            "Trace m_b from declared quantities into the symbol table.",
            "Notice where the mass-expression path loses compatible units.",
            "Select the invalidating relation attached to the variable symbol conflict.",
            "Restore one battery-mass definition before evaluating robot mass."
          ),
          focusRef: reasonedCase(
            "redefined-symbol-counterexample",
            "outcome"
          ),
          contextConditionIds: [
            "symbol-meaning-broken",
            "symbols-defined-once"
          ],
          positions: [
            ["declared-quantities", 0, 0],
            ["symbol-table", 1, 0],
            ["mass-expression", 2, 0],
            ["evaluated-mass", 3, 0],
            ["expression-decision", 4, 0]
          ],
          relationIds: [
            "quantities-map-symbols",
            "symbols-transform-expression",
            "undefined-symbol-invalidates"
          ],
          answerRelationIds: ["undefined-symbol-invalidates"],
          options: [
            [
              "restore-definition",
              true,
              reasonedCase(
                "redefined-symbol-counterexample",
                "verification"
              ),
              condition("symbols-defined-once"),
              ["quantities-map-symbols", "undefined-symbol-invalidates"],
              ["symbols-defined-once", "symbol-meaning-broken"],
              null
            ],
            [
              "keep-voltage",
              false,
              misconception(
                "letters-are-unitless-placeholders",
                "claim"
              ),
              misconception(
                "letters-are-unitless-placeholders",
                "mechanism"
              ),
              ["symbols-transform-expression"],
              ["symbol-meaning-broken"],
              "letters-are-unitless-placeholders"
            ],
            [
              "remove-coefficient",
              false,
              term("coefficient", "boundary"),
              reasonedCase("defined-mass-example", "criterion"),
              ["expression-causes-value"],
              ["compatible-mass-terms"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(
            "Read the repaired mass-expression diagram from symbols to result:",
            "The expression diagram preserves stable m_w and m_b meanings through the 2.00 kg decision.",
            "The expression diagram skips the symbol table or drops kilograms from evaluated mass.",
            "Follow declared quantities into the repaired symbol table.",
            "Follow the coefficient and symbols into the mass expression.",
            "Trace the mass expression into the evaluated mass.",
            "Accept the expression only after the kilogram criterion is checked."
          ),
          focusRef: reasonedCase("defined-mass-example", "outcome"),
          contextConditionIds: [
            "symbols-defined-once",
            "compatible-mass-terms",
            "mass-result-bounded"
          ],
          positions: [
            ["declared-quantities", 0, 1],
            ["symbol-table", 1, 1],
            ["mass-expression", 2, 1],
            ["evaluated-mass", 3, 1],
            ["expression-decision", 4, 1]
          ],
          relationIds: [
            "quantities-map-symbols",
            "symbols-transform-expression",
            "expression-causes-value",
            "value-supports-decision"
          ],
          answerRelationIds: ["value-supports-decision"],
          options: [
            [
              "accept-mass",
              true,
              reasonedCase("defined-mass-example", "verification"),
              condition("mass-result-bounded"),
              ["expression-causes-value", "value-supports-decision"],
              ["compatible-mass-terms", "mass-result-bounded"],
              null
            ],
            [
              "skip-symbols",
              false,
              term("variable-symbol", "boundary"),
              condition("symbols-defined-once"),
              ["symbols-transform-expression"],
              ["symbols-defined-once"],
              null
            ],
            [
              "drop-unit",
              false,
              misconception(
                "letters-are-unitless-placeholders",
                "claim"
              ),
              misconception(
                "letters-are-unitless-placeholders",
                "disconfirmingObservation"
              ),
              ["value-supports-decision"],
              ["mass-result-bounded"],
              "letters-are-unitless-placeholders"
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("algebraic-expression", "label"),
      focusRef: reasonedCase("defined-mass-example", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["declared-quantities", 0, 0],
        ["symbol-table", 1, 0],
        ["mass-expression", 2, 0],
        ["evaluated-mass", 3, 0],
        ["expression-decision", 4, 0]
      ],
      visibleEntityIds: [
        "declared-quantities",
        "symbol-table",
        "mass-expression",
        "evaluated-mass",
        "expression-decision"
      ],
      visibleRelationIds: [
        "quantities-map-symbols",
        "symbols-transform-expression",
        "expression-causes-value",
        "value-supports-decision",
        "undefined-symbol-invalidates"
      ],
      controls: [
        [
          "defined-symbol-state",
          term("variable-symbol", "label"),
          ["symbols-defined-once"],
          [
            "declared-quantities",
            "symbol-table",
            "mass-expression",
            "evaluated-mass"
          ],
          [
            "quantities-map-symbols",
            "symbols-transform-expression",
            "expression-causes-value"
          ],
          ["undefined-symbol-invalidates"],
          [],
          [
            [
              "defined-path-note",
              "Stable m_w and m_b definitions keep every robot mass term in kilograms.",
              ["symbol-table", "mass-expression", "evaluated-mass"],
              ["symbols-transform-expression", "expression-causes-value"]
            ]
          ],
          reasonedCase("defined-mass-example", "verification")
        ],
        [
          "conflicting-symbol-state",
          condition("symbol-meaning-broken"),
          ["symbol-meaning-broken"],
          [
            "declared-quantities",
            "symbol-table",
            "expression-decision"
          ],
          ["undefined-symbol-invalidates"],
          ["expression-causes-value", "value-supports-decision"],
          [],
          [
            [
              "conflict-note",
              "The voltage meaning of m_b breaks the robot mass expression before evaluation.",
              ["symbol-table", "mass-expression", "expression-decision"],
              ["undefined-symbol-invalidates"]
            ]
          ],
          reasonedCase("redefined-symbol-counterexample", "verification")
        ]
      ]
    }
  },
  createFoundationLessonPlan({
    lessonId: "EML-E0-D03-L02",
    systemModel:
      "Equation rearrangement preserves equality by applying the same reversible operation to both sides while recording restrictions such as a divisor that must not be zero.",
    failurePattern:
      "Cancelling across addition or dividing by a quantity that may be zero creates a new statement that is not equivalent to the original engineering relationship.",
    visualExplanation:
      "A balance path starts with P = tau times omega, applies division by the non-zero angular speed to both sides and finishes with a substitution check in the original equation.",
    applicationTask:
      "Isolate motor torque from a power relationship, state every domain restriction and substitute the calculated torque into the original equation.",
    primary: [
      "Equation rearrangement",
      "A sequence of reversible operations applied equally to both sides of an equation to isolate a chosen quantity.",
      "A rearrangement is equivalent to the original equation only for values allowed by every operation used."
    ],
    supporting: [
      "Inverse operation",
      "An operation that undoes another operation, such as division undoing multiplication.",
      "An inverse operation must be valid for the value on which it acts and must be applied to both sides."
    ],
    boundary: [
      "Domain restriction",
      "A declared value or range that keeps every rearrangement operation defined.",
      "Division by zero and an even root of a negative real value are outside the relevant real-number domain."
    ],
    given: [
      "Motor power equation",
      "The declared relationship P = tau times omega with power, torque and angular speed identified."
    ],
    model: [
      "Balance-preserving isolation",
      "The two-sided sequence that divides P = tau times omega by a declared non-zero omega."
    ],
    result: [
      "Isolated torque",
      "The result tau = P divided by omega with unit newton metre."
    ],
    decision: [
      "Substitution check",
      "The comparison between the original power equation and the recomputed product of torque and angular speed."
    ],
    failure: [
      "Illegal algebra step",
      "A zero divisor or cancellation across addition that breaks equivalence."
    ],
    mapPredicate:
      "declared power and angular speed map to the motor power equation",
    transformPredicate:
      "the same valid inverse operation on both sides transforms the power equation into isolated torque",
    supportPredicate:
      "substitution of the isolated torque into the original equation supports the rearrangement decision",
    constrainPredicate:
      "the chosen inverse operation constrains the permitted angular-speed domain",
    invalidatePredicate:
      "a zero divisor or cancellation across addition invalidates the claimed isolated torque",
    validStatement:
      "Power P and angular speed omega retain their declared meanings and omega is not zero.",
    scopeStatement:
      "Division by omega is applied to both sides of P = tau times omega only while omega is non-zero.",
    criterionStatement:
      "The isolated torque must reproduce the original power when multiplied by the stated angular speed.",
    brokenStatement:
      "Omega equals zero, or a term is cancelled across addition without a valid factorisation.",
    failureMechanism:
      "an inverse operation is undefined or is applied to only part of an additive expression",
    failureConsequence:
      "the apparent torque expression admits values that the original motor power equation does not",
    failureCriterion:
      "reject the rearrangement until every operation is reversible on the stated domain and substitution restores the original equation",
    conceptualSteps: [
      "Name P, tau and omega, retain their units and identify torque as the target quantity.",
      "Divide both sides of P = tau times omega by the same non-zero omega.",
      "Simplify to tau = P divided by omega and retain the newton metre unit.",
      "Record omega not equal to zero and reject cancellation that crosses addition.",
      "Substitute the torque into P = tau times omega before accepting the rearrangement."
    ],
    example: {
      scenario:
        "A motor delivers P = 480 W at omega = 40 rad/s, and torque tau must be isolated from P = tau times omega.",
      givens: [
        ["Motor power P", "480", "W"],
        ["Angular speed omega", "40", "rad/s"]
      ],
      reasoning: [
        "The power equation binds P to 480 W and omega to the non-zero value 40 rad/s.",
        "Dividing both sides by 40 rad/s gives tau = 480 divided by 40 = 12 N m.",
        "Multiplying 12 N m by 40 rad/s reproduces 480 W, so the isolated torque passes the original equation."
      ],
      outcome:
        "The valid rearrangement gives tau = 12 N m for the declared non-zero angular speed.",
      criterion:
        "Accept tau only when omega is non-zero and substitution returns P = 480 W.",
      verification:
        "Evaluate 12 times 40 independently and confirm the original 480 W power."
    },
    counterexample: {
      scenario:
        "At a stated instant P = 0 W and omega = 0 rad/s, a learner divides 0 = tau times 0 by omega and reports tau = 0 N m.",
      givens: [
        ["Power P", "0", "W"],
        ["Angular speed omega", "0", "rad/s"]
      ],
      reasoning: [
        "The attempted isolation selects division by omega even though the declared value is zero.",
        "The expression 0 = tau times 0 is true for any finite tau, so it cannot determine one torque value.",
        "The zero divisor invalidates the reported torque and the original equation supplies no unique solution."
      ],
      outcome:
        "Tau = 0 N m is not justified because division by zero destroyed equivalence.",
      criterion:
        "A unique isolated torque requires a non-zero angular speed and a reversible two-sided operation.",
      verification:
        "Try tau = 5 N m and tau = 20 N m in 0 = tau times 0; both fit, proving that tau is undetermined."
    },
    misconception: {
      claim:
        "Any matching symbol can be cancelled wherever it appears in an equation.",
      mechanism:
        "A learner treats a term inside addition as though it were a common non-zero factor of the entire side.",
      correction:
        "Factor first when valid, apply the same reversible operation to both complete sides and state every non-zero restriction.",
      disconfirmingObservation:
        "Cancelling x from x + 2 = 5 would give 1 + 2 = 5 divided by x, which is not equivalent to the original equation."
    },
    scenarioMarkers: [
      "In the 480 W isolation pass",
      "During the zero-speed repair",
      "For the 12 N m evidence review",
      "At the omega equals zero diagnosis",
      "Across the two-sided balance match",
      "In the inverse-operation explanation",
      "On the P equals tau omega diagram",
      "Within the forbidden-division audit"
    ],
    assessmentVariant: 0,
    codeSample:
      "P = 0 W\nomega = 0 rad/s\ntau = P / omega\nclaim = \"tau is 0 N m\"",
    validAnnotation:
      "Both sides are divided by the same non-zero omega and 12 N m restores 480 W.",
    brokenAnnotation:
      "Division by omega at zero cannot isolate torque and blocks the decision."
  }),
  createFoundationLessonPlan({
    lessonId: "EML-E0-D03-L03",
    systemModel:
      "A function maps each permitted input to one output; an average rate uses a finite interval, while an instantaneous derivative describes the limiting local slope at one input.",
    failurePattern:
      "A learner calls a wide-interval average rate an instantaneous derivative or extrapolates a graph outside its supported input domain.",
    visualExplanation:
      "A sensor graph shows two points joined by a secant for average rate, a tangent at one point for instantaneous rate and a shaded interval where measurements support the model.",
    applicationTask:
      "Plot an input-output relation, calculate an average rate, estimate a local rate from nearby readings and mark the unsupported domain without requiring prior calculus.",
    primary: [
      "Function",
      "A rule that assigns each permitted input exactly one output.",
      "A function model is used only on its declared input domain and under its stated operating conditions."
    ],
    supporting: [
      "Average and instantaneous rate",
      "Average rate is output change divided by input change across a finite interval; instantaneous rate is the limiting local slope at one input.",
      "A finite secant slope is not automatically the instantaneous derivative, although closer intervals can estimate it."
    ],
    boundary: [
      "Valid input domain",
      "The input interval over which evidence and operating assumptions support the function model.",
      "Smooth algebra beyond the measured interval does not make extrapolated output trustworthy."
    ],
    given: [
      "Sensor input-output readings",
      "Measured input x and output y values with units and a declared supported range."
    ],
    model: [
      "Function graph",
      "The plotted mapping y = x squared over the demonstrated interval from x = 0 to x = 3."
    ],
    result: [
      "Rate comparison",
      "A finite-interval average slope and a local slope estimate kept as different quantities."
    ],
    decision: [
      "Model-use decision",
      "The judgement that a stated slope meaning and input lie inside the supported graph domain."
    ],
    failure: [
      "Slope or domain confusion",
      "The use of an average as an instantaneous value or an unsupported extrapolation."
    ],
    mapPredicate:
      "measured inputs and outputs map to points on the supported function graph",
    transformPredicate:
      "selected graph intervals transform output changes into average or local rate estimates",
    supportPredicate:
      "a labelled interval and slope meaning support the model-use decision",
    constrainPredicate:
      "the measured interval constrains where the function and its rates are supported",
    invalidatePredicate:
      "conflating average with instantaneous rate or extrapolating outside the domain invalidates the slope claim",
    validStatement:
      "Each x value from 0 to 3 maps to one y value under the same sensor model and units.",
    scopeStatement:
      "Average rate uses two finite endpoints, while an instantaneous derivative refers to one point and may be estimated from progressively closer endpoints.",
    criterionStatement:
      "Every reported rate states its interval or point, units and whether it is average, estimated local or calculus-derived.",
    brokenStatement:
      "A finite wide-interval slope is labelled instantaneous, or the graph is used beyond x = 3 without evidence.",
    failureMechanism:
      "two distinct slope meanings or two distinct evidence regions are treated as interchangeable",
    failureConsequence:
      "the reported sensor sensitivity can be numerically plausible while describing the wrong location or unsupported input",
    failureCriterion:
      "reject the slope claim until its interval or point and the function domain are explicit",
    conceptualSteps: [
      "Declare the function input, output, units and supported domain before reading the graph.",
      "Calculate average rate as change in y divided by change in x across named endpoints.",
      "Estimate local rate from nearby points and distinguish it from the wider secant slope.",
      "Mark extrapolated inputs outside the measured domain as unsupported.",
      "Accept a rate only when its meaning, location, units and evidence range are all stated."
    ],
    example: {
      scenario:
        "For y = x squared on 0 to 3, compare the average rate from x = 2 to x = 3 with a local estimate around x = 2 using x = 1.9 and x = 2.1.",
      givens: [
        ["Output y at x = 2", "4.00", "V"],
        ["Output y at x = 3", "9.00", "V"],
        ["Outputs at x = 1.9 and 2.1", "3.61 and 4.41", "V"]
      ],
      reasoning: [
        "All four readings lie inside the supported input interval and map to y = x squared.",
        "The average rate from 2 to 3 is (9 - 4) divided by (3 - 2) = 5 V per input unit, while the nearby estimate is (4.41 - 3.61) divided by 0.2 = 4 V per input unit.",
        "The two numbers differ because one describes a finite interval and the other estimates the slope at x = 2."
      ],
      outcome:
        "The average rate is 5 V per input unit and the estimated instantaneous rate at x = 2 is 4 V per input unit.",
      criterion:
        "Accept the comparison only when the finite interval and local point are labelled separately.",
      verification:
        "A later calculus lesson can derive dy/dx = 2x and confirm 4 at x = 2; that derivative rule is a later application, not a prerequisite here."
    },
    counterexample: {
      scenario:
        "A learner uses the average slope from x = 0 to x = 3, obtains 3 V per input unit and labels it the instantaneous derivative at x = 2.",
      givens: [
        ["Output change from x = 0 to 3", "9", "V"],
        ["Input change", "3", "input units"]
      ],
      reasoning: [
        "The calculation selects a wide finite interval rather than readings close to x = 2.",
        "Dividing 9 by 3 correctly gives the interval average 3, but it does not become a local derivative by relabelling.",
        "The slope meaning mismatch invalidates the claimed instantaneous value at x = 2."
      ],
      outcome:
        "The number 3 is a correct average over 0 to 3 but an incorrect instantaneous derivative at x = 2.",
      criterion:
        "An instantaneous rate must refer to one input and be justified by a limiting or sufficiently local method.",
      verification:
        "Compare the claim with nearby values at 1.9 and 2.1, which produce the local estimate 4 rather than 3."
    },
    misconception: {
      claim:
        "A graph has one slope, so any two points reveal the instantaneous derivative everywhere.",
      mechanism:
        "Secant and tangent slopes are merged and curvature is ignored.",
      correction:
        "Label each finite interval, use nearby points for a local estimate and reserve derivative rules for the later calculus application.",
      disconfirmingObservation:
        "The same y = x squared graph gives average slope 5 from 2 to 3 but local slope about 4 at x = 2."
    },
    scenarioMarkers: [
      "Across the 2-to-3 secant",
      "During the 0-to-3 relabelling repair",
      "For the 5 versus 4 rate selection",
      "At the x equals 2 local diagnosis",
      "Between the secant and tangent meanings",
      "In the supported-domain explanation",
      "On the y equals x squared graph",
      "Within the extrapolated x equals 4 audit"
    ],
    assessmentVariant: 1,
    codeSample:
      "average = (y(3) - y(0)) / (3 - 0)\nlabel = \"instantaneous derivative at x = 2\"\ndomain = [0, 3]",
    validAnnotation:
      "The secant interval and the local point remain labelled, so 5 and 4 retain different meanings.",
    brokenAnnotation:
      "A wide average or an x value beyond 3 cannot support the local derivative claim."
  }),
  createFoundationLessonPlan({
    lessonId: "EML-E0-D03-L04",
    systemModel:
      "A planar displacement of magnitude d at a declared angle theta measured counter-clockwise from the positive horizontal axis has components dx = d cos theta and dy = d sin theta.",
    failurePattern:
      "Using an angle from a different axis, swapping sine and cosine or changing metres into force units produces components that no longer reconstruct the declared displacement.",
    visualExplanation:
      "A right triangle labels a 5.00 m displacement as the hypotenuse, a 30 degree angle above positive x and horizontal and vertical legs whose squared lengths reconstruct 5.00 m.",
    applicationTask:
      "Resolve a 5.00 m displacement at 30 degrees above positive x into horizontal and vertical metre components, then reconstruct its magnitude.",
    primary: [
      "Displacement triangle",
      "A right triangle whose hypotenuse is a displacement magnitude and whose legs are orthogonal displacement components in metres.",
      "It represents displacement geometry, not force, unless a separate force quantity is explicitly declared."
    ],
    supporting: [
      "Declared angle convention",
      "A statement naming the reference axis, positive turning direction and angle unit.",
      "Sine and cosine component roles depend on which axis the angle is measured from."
    ],
    boundary: [
      "Magnitude reconstruction",
      "The check d = square root of dx squared plus dy squared using components in the same length unit.",
      "A reconstruction mismatch indicates an angle, unit, sign or arithmetic error."
    ],
    given: [
      "Displacement magnitude and angle",
      "A 5.00 m displacement at 30 degrees counter-clockwise from positive horizontal x."
    ],
    model: [
      "Right-triangle component model",
      "The geometric mapping dx = d cos theta and dy = d sin theta for the declared angle convention."
    ],
    result: [
      "Horizontal and vertical displacement",
      "The component pair dx = 4.33 m and dy = 2.50 m."
    ],
    decision: [
      "Reconstructed displacement check",
      "The comparison of square root of dx squared plus dy squared with the original 5.00 m magnitude."
    ],
    failure: [
      "Angle or quantity mismatch",
      "A swapped reference axis, wrong angle unit or force label applied to a displacement."
    ],
    mapPredicate:
      "the declared displacement and angle map to one labelled right triangle",
    transformPredicate:
      "cosine and sine transform the displacement magnitude into horizontal and vertical metre components",
    supportPredicate:
      "reconstruction of 5.00 m from the components supports the displacement solution",
    constrainPredicate:
      "the angle convention constrains which triangle leg is adjacent and which is opposite",
    invalidatePredicate:
      "a swapped axis convention or force-unit substitution invalidates the displacement interpretation",
    validStatement:
      "Theta is 30 degrees counter-clockwise from positive x and every triangle length is in metres.",
    scopeStatement:
      "The right-triangle relations apply to one planar displacement resolved on orthogonal horizontal and vertical axes.",
    criterionStatement:
      "The component signs follow the declared quadrant and their squared sum reconstructs 5.00 m within rounding.",
    brokenStatement:
      "Theta is silently measured from positive y, degrees are treated as radians, or the displacement is relabelled as a force.",
    failureMechanism:
      "the component equations use a different reference convention or physical quantity from the declared triangle",
    failureConsequence:
      "the calculated pair may be numerically neat but does not describe the stated 5.00 m displacement",
    failureCriterion:
      "reject the components until the angle reference, turn direction, units and magnitude reconstruction agree",
    conceptualSteps: [
      "Draw the 5.00 m displacement and declare 30 degrees counter-clockwise from positive x.",
      "Use dx = d cos theta for the adjacent horizontal leg and dy = d sin theta for the opposite vertical leg.",
      "Calculate dx = 4.33 m and dy = 2.50 m with positive signs in the first quadrant.",
      "Reject swapped components, radian misuse and any conversion of displacement into force.",
      "Reconstruct square root of 4.33 squared plus 2.50 squared and compare it with 5.00 m."
    ],
    example: {
      scenario:
        "A robot moves 5.00 m at 30 degrees counter-clockwise from the positive horizontal axis.",
      givens: [
        ["Displacement magnitude d", "5.00", "m"],
        ["Angle theta from positive x", "30", "degree"]
      ],
      reasoning: [
        "The declared positive-x angle makes the horizontal leg adjacent and the vertical leg opposite.",
        "The components are dx = 5 cos 30 = 4.33 m and dy = 5 sin 30 = 2.50 m.",
        "The reconstruction square root of 4.33 squared plus 2.50 squared is 5.00 m to the shown precision."
      ],
      outcome:
        "The displacement components are approximately (4.33, 2.50) m and reconstruct the original 5.00 m.",
      criterion:
        "Accept the components only with the positive-x convention, metre units and a successful magnitude reconstruction.",
      verification:
        "Square the two metre components, add them and take the non-negative square root to recover 5.00 m."
    },
    counterexample: {
      scenario:
        "A learner uses dx = 5 sin 30 and dy = 5 cos 30 while still claiming the angle is measured from positive x, then labels the answers in newtons.",
      givens: [
        ["Claimed horizontal component", "2.50", "N"],
        ["Claimed vertical component", "4.33", "N"]
      ],
      reasoning: [
        "The formula pair corresponds to an angle referenced from positive y, not the declared positive-x convention.",
        "Newtons describe force and cannot label components of the 5.00 m displacement.",
        "The convention and quantity mismatches invalidate the component interpretation even though the squared numbers still total 25."
      ],
      outcome:
        "The numbers are swapped for the declared angle and their force units do not represent displacement.",
      criterion:
        "Component equations, reference axis and length units must all describe the same displacement triangle.",
      verification:
        "Restore metre units and positive-x adjacency; dx must be the larger 4.33 m component at 30 degrees."
    },
    misconception: {
      claim:
        "Sine always gives x, cosine always gives y and the same triangle can represent force or displacement without relabelling.",
      mechanism:
        "The reference angle and physical quantity are ignored in favour of memorised button presses.",
      correction:
        "Draw the triangle, name the adjacent and opposite legs for the declared angle and retain the original quantity and unit.",
      disconfirmingObservation:
        "At 30 degrees above positive x, the horizontal component is 4.33 m, not 2.50 N."
    },
    scenarioMarkers: [
      "Across the 5.00 m component order",
      "During the swapped-axis repair",
      "For the 4.33 m and 2.50 m selection",
      "At the newton-label diagnosis",
      "Between angle and triangle labels",
      "In the positive-x convention explanation",
      "On the displacement reconstruction diagram",
      "Within the degree-radian audit"
    ],
    assessmentVariant: 2,
    codeSample:
      "d = 5.00 m\ntheta = 30 degrees from +x\ndx = d * sin(theta)\ndy = d * cos(theta)\nunit = N",
    validAnnotation:
      "The positive-x angle produces 4.33 m horizontally and 2.50 m vertically, then reconstructs 5.00 m.",
    brokenAnnotation:
      "Swapping the reference axis or using newtons blocks the displacement decision."
  }),
  createFoundationLessonPlan({
    lessonId: "EML-E0-D03-L05",
    systemModel:
      "A coordinate representation has meaning only with its reference frame: the frame declares an origin, axis directions and units, while vector components describe a displacement relative to that frame.",
    failurePattern:
      "Combining one component from a body frame with another from a world frame creates a plausible pair that refers to no single origin or set of axes.",
    visualExplanation:
      "A body frame at world position (10, 5) m and a parallel world frame show the same landmark as (2, 1) m relative to the robot and (12, 6) m in world coordinates.",
    applicationTask:
      "Express one landmark in body and world frames, retain both origins and axis labels, and verify that the landmark displacement from the robot remains square root of 5 metres.",
    primary: [
      "Reference frame",
      "A declared observer with an origin, axis directions, handedness and units used to interpret coordinates.",
      "Coordinates from different frames cannot be combined until a stated transformation puts them in one frame."
    ],
    supporting: [
      "Coordinate origin",
      "The point assigned zero coordinates from which position components are measured.",
      "Changing the origin changes position coordinates even when the physical point does not move."
    ],
    boundary: [
      "Frame-labelled vector",
      "A magnitude-and-direction quantity whose components carry an explicit source or destination frame label.",
      "An unlabelled or mixed-frame component pair has no unique physical interpretation."
    ],
    given: [
      "Robot and landmark coordinates",
      "A robot body origin at world (10, 5) m and a landmark at body coordinates (2, 1) m with parallel axes."
    ],
    model: [
      "Frame translation map",
      "The same-axis relation p_world = origin_world_body + p_body for this declared example."
    ],
    result: [
      "World landmark coordinates",
      "The coordinate pair (12, 6) m together with the retained body displacement (2, 1) m."
    ],
    decision: [
      "Frame consistency check",
      "The judgement that every addition and distance calculation uses coordinates referenced to one declared frame."
    ],
    failure: [
      "Mixed-frame component pair",
      "A pair such as body x = 2 m combined with world y = 6 m."
    ],
    mapPredicate:
      "declared origins and axis labels map each coordinate pair to its reference frame",
    transformPredicate:
      "adding the world position of the body origin transforms body landmark coordinates into world coordinates",
    supportPredicate:
      "subtracting the body origin and recovering the original displacement supports frame consistency",
    constrainPredicate:
      "the chosen origin and axis directions constrain the meaning of every vector component",
    invalidatePredicate:
      "combining components from different frames invalidates the coordinate result",
    validStatement:
      "Body and world origins, parallel axis directions, metre units and every coordinate frame label are explicit.",
    scopeStatement:
      "This example uses parallel axes and a known translation; any rotation would require an additional declared rotation transformation.",
    criterionStatement:
      "World landmark minus world body origin must recover body displacement (2, 1) m and magnitude square root of 5 m.",
    brokenStatement:
      "A component from the body frame is combined directly with a component from the world frame.",
    failureMechanism:
      "numbers referenced to different origins or axes are treated as though they share one coordinate basis",
    failureConsequence:
      "the mixed pair cannot locate the landmark or preserve its displacement from the robot",
    failureCriterion:
      "reject the vector until every component is transformed into and labelled with one common frame",
    conceptualSteps: [
      "Declare body and world origins, positive axes and metre units before using any coordinate.",
      "Apply p_world = (10, 5) m + (2, 1) m to obtain the landmark in the world frame.",
      "Subtract the world body origin from (12, 6) m to recover body displacement (2, 1) m.",
      "Reject any pair assembled from body x and world y or from undeclared axis directions.",
      "Accept the transformation only when the round trip preserves square root of 5 m from robot to landmark."
    ],
    example: {
      scenario:
        "A robot body frame has origin (10, 5) m in the world frame, parallel axes and a landmark at (2, 1) m in the body frame.",
      givens: [
        ["Body origin in world frame", "(10, 5)", "m"],
        ["Landmark in body frame", "(2, 1)", "m"]
      ],
      reasoning: [
        "The origin, axes and frame labels show that the world position is found by adding two world-oriented component pairs.",
        "The landmark becomes (10 + 2, 5 + 1) = (12, 6) m in the world frame.",
        "Subtracting (10, 5) from (12, 6) returns (2, 1) m and preserves distance square root of 5 m."
      ],
      outcome:
        "The same landmark is represented by body (2, 1) m and world (12, 6) m without changing its physical displacement from the robot.",
      criterion:
        "Accept the coordinates when the origin and frame labels make the forward and reverse mapping unambiguous.",
      verification:
        "Round-trip from world back to body and recompute square root of 2 squared plus 1 squared."
    },
    counterexample: {
      scenario:
        "A learner constructs (2, 6) m from the body-frame x component and the world-frame y component, then calls it a landmark vector.",
      givens: [
        ["Body-frame x component", "2", "m"],
        ["World-frame y component", "6", "m"]
      ],
      reasoning: [
        "The two supplied components are referenced to different origins and therefore do not form one declared coordinate pair.",
        "No valid forward or reverse frame transformation produces the mixed pair (2, 6) m.",
        "The frame mismatch invalidates the landmark location and any distance calculated from it."
      ],
      outcome:
        "The mixed pair (2, 6) m is not a vector in either the body frame or the world frame.",
      criterion:
        "Every component in a vector must share one origin, axis basis and frame label.",
      verification:
        "Write the two valid complete pairs side by side: body (2, 1) m and world (12, 6) m; neither equals (2, 6) m."
    },
    misconception: {
      claim:
        "Coordinate numbers are universal, so components from any frames can be combined directly.",
      mechanism:
        "The origin and axes are treated as drawing decoration rather than part of each coordinate's definition.",
      correction:
        "Attach a frame label to every coordinate and transform complete vectors into one common frame before combining them.",
      disconfirmingObservation:
        "Body (2, 1) m and world (12, 6) m describe the same point, proving that the numbers depend on the frame."
    },
    scenarioMarkers: [
      "Across the body-to-world order",
      "During the mixed-pair repair",
      "For the (12, 6) m selection",
      "At the body-x world-y diagnosis",
      "Between origin and frame labels",
      "In the common-frame explanation",
      "On the two-origin coordinate diagram",
      "Within the (2, 6) m audit"
    ],
    assessmentVariant: 3,
    codeSample:
      "body_point = (2, 1) m\nworld_point = (12, 6) m\nmixed = (body_point.x, world_point.y)\nclaim = \"mixed is a world vector\"",
    validAnnotation:
      "The world mapping adds the declared body origin and round-trips to the body displacement.",
    brokenAnnotation:
      "The pair (2, 6) m mixes origins and cannot support a frame-consistent landmark."
  }),
  createFoundationLessonPlan({
    lessonId: "EML-E0-D03-L06",
    systemModel:
      "An active counter-clockwise planar rotation moves a vector through angle theta about a shared origin using R = [[cos theta, -sin theta], [sin theta, cos theta]].",
    failurePattern:
      "Using a passive or clockwise sign convention, adding translation or claiming a full rigid transform changes the stated operation even when the matrix dimensions still fit.",
    visualExplanation:
      "A point (2, 1) rotates actively by 90 degrees counter-clockwise about the same origin to (-1, 2), with equal pre- and post-rotation distances square root of 5.",
    applicationTask:
      "Apply one explicitly active 90 degree counter-clockwise planar rotation between frames sharing an origin and verify distance preservation without introducing translation.",
    primary: [
      "Active planar rotation",
      "A transformation that moves a vector counter-clockwise about a fixed origin while the coordinate axes stay fixed.",
      "This lesson covers one two-dimensional rotation only, not translation or a complete rigid-body pose transform."
    ],
    supporting: [
      "Rotation matrix",
      "For an active counter-clockwise angle theta, the matrix has rows [cos theta, -sin theta] and [sin theta, cos theta].",
      "Changing active to passive interpretation or reversing angle sign changes the transformed coordinates."
    ],
    boundary: [
      "Distance invariance",
      "A pure rotation preserves distance from the shared origin, so x squared plus y squared is unchanged.",
      "Distance preservation checks rotation arithmetic but does not by itself prove that the chosen direction convention is correct."
    ],
    given: [
      "Point and rotation convention",
      "The point p = (2, 1), a shared origin and an active 90 degree counter-clockwise angle."
    ],
    model: [
      "Counter-clockwise rotation map",
      "The multiplication p_prime = R p with R = [[0, -1], [1, 0]]."
    ],
    result: [
      "Rotated point",
      "The component pair p_prime = (-1, 2) after the declared active rotation."
    ],
    decision: [
      "Rotation verification",
      "The joint check of expected counter-clockwise direction and preserved distance square root of 5."
    ],
    failure: [
      "Convention or scope substitution",
      "A clockwise or passive sign pattern, a translation term or a full rigid-transform claim."
    ],
    mapPredicate:
      "the active counter-clockwise convention maps theta to one signed planar rotation matrix",
    transformPredicate:
      "matrix multiplication transforms point (2, 1) into rotated point (-1, 2)",
    supportPredicate:
      "counter-clockwise direction and preserved distance support the rotation decision",
    constrainPredicate:
      "the shared-origin pure-rotation scope constrains the transformation to two dimensions with no translation",
    invalidatePredicate:
      "a reversed convention or added translation invalidates the claimed active rotation",
    validStatement:
      "The operation is an active 90 degree counter-clockwise rotation in a plane whose two frames share the same origin.",
    scopeStatement:
      "Only the 2 by 2 rotation matrix acts on the point; no translation, homogeneous coordinate or full pose transform is included.",
    criterionStatement:
      "The transformed point is (-1, 2), turns counter-clockwise and retains squared distance 5 from the origin.",
    brokenStatement:
      "The matrix is interpreted passively or clockwise, or a translation is inserted despite the shared-origin pure-rotation scope.",
    failureMechanism:
      "a different direction convention or a different transformation class is substituted for the declared active rotation",
    failureConsequence:
      "the output point can preserve distance yet occupy the wrong side of the plane, or it can move the origin",
    failureCriterion:
      "reject the result unless direction, shared origin, matrix signs and distance preservation all match the declared rotation",
    conceptualSteps: [
      "Declare an active 90 degree counter-clockwise rotation and confirm the frames share an origin.",
      "Build R = [[0, -1], [1, 0]] from the declared active convention.",
      "Multiply R by (2, 1) to obtain (-1, 2).",
      "Reject clockwise, passive, translated or full rigid-transform interpretations.",
      "Confirm the direction and compare 2 squared plus 1 squared with (-1) squared plus 2 squared."
    ],
    example: {
      scenario:
        "Actively rotate p = (2, 1) by 90 degrees counter-clockwise about the shared origin.",
      givens: [
        ["Original point p", "(2, 1)", null],
        ["Active angle theta", "90", "degree"]
      ],
      reasoning: [
        "The active counter-clockwise convention at 90 degrees gives R = [[0, -1], [1, 0]].",
        "Multiplication yields p_prime = (0 times 2 - 1 times 1, 1 times 2 + 0 times 1) = (-1, 2).",
        "Both points have squared distance 5, and (-1, 2) lies counter-clockwise from (2, 1)."
      ],
      outcome:
        "The declared rotation produces p_prime = (-1, 2) with unchanged distance square root of 5.",
      criterion:
        "Accept the output only when its direction and norm match the active shared-origin rotation.",
      verification:
        "Plot both points and independently compare their squared distances, 5 and 5."
    },
    counterexample: {
      scenario:
        "A learner uses [[0, 1], [-1, 0]], obtains (1, -2) and calls it the same active 90 degree counter-clockwise rotation.",
      givens: [
        ["Used matrix", "[[0, 1], [-1, 0]]", null],
        ["Reported point", "(1, -2)", null]
      ],
      reasoning: [
        "The sign pattern represents an active 90 degree clockwise rotation, not the declared counter-clockwise map.",
        "The result preserves squared distance 5, showing that norm preservation alone cannot resolve the direction convention.",
        "The clockwise output invalidates the counter-clockwise claim even though the distance check passes."
      ],
      outcome:
        "The point (1, -2) is distance-preserving but belongs to the opposite active rotation.",
      criterion:
        "A valid rotation result must satisfy both the declared direction convention and distance invariance.",
      verification:
        "Track the positive x-axis: an active counter-clockwise 90 degree rotation must send (1, 0) to (0, 1), not (0, -1)."
    },
    misconception: {
      claim:
        "Any 2 by 2 matrix that preserves distance is the requested rotation and also represents a complete rigid transform.",
      mechanism:
        "Direction convention, determinant, shared origin and the absence of translation are omitted.",
      correction:
        "State active or passive meaning, angle sign and origin, then use the 2 by 2 matrix only for pure planar rotation.",
      disconfirmingObservation:
        "Both (-1, 2) and (1, -2) preserve distance from (2, 1), but only the first is the declared active counter-clockwise result."
    },
    scenarioMarkers: [
      "Across the 90 degree matrix order",
      "During the clockwise-sign repair",
      "For the (-1, 2) selection",
      "At the (1, -2) convention diagnosis",
      "Between matrix and direction labels",
      "In the shared-origin explanation",
      "On the counter-clockwise rotation diagram",
      "Within the added-translation audit"
    ],
    assessmentVariant: 4,
    codeSample:
      "p = (2, 1)\nR = [[0, 1], [-1, 0]]\np_prime = R * p\nclaim = \"active 90 degree counter-clockwise full rigid transform\"",
    validAnnotation:
      "The active matrix turns (2, 1) to (-1, 2) counter-clockwise and preserves squared distance 5.",
    brokenAnnotation:
      "The opposite sign convention or any translation lies outside the declared shared-origin rotation."
  }),
  createFoundationLessonPlan({
    lessonId: "EML-E0-D03-L07",
    systemModel:
      "A complex number z = a + jb stores two orthogonal rectangular components with the same physical unit, where engineers use j for the imaginary unit and magnitude is the non-negative square root of a squared plus b squared.",
    failurePattern:
      "Combining components with different units, returning a negative magnitude or claiming automatic phase, phasor or impedance meaning exceeds what the rectangular pair establishes.",
    visualExplanation:
      "A rectangular plane places a on the horizontal axis and b on the vertical j axis, forming a right triangle whose non-negative length is square root of a squared plus b squared.",
    applicationTask:
      "Represent z = 3 + j4 volts, calculate its non-negative magnitude as 5 volts and state precisely what is and is not established by that rectangular representation.",
    primary: [
      "Complex number",
      "A rectangular quantity z = a + jb with a real component a and an imaginary component b.",
      "The representation alone does not establish time dependence, phase convention, phasor status or impedance."
    ],
    supporting: [
      "Engineering j convention",
      "Electrical and control engineering commonly use j for the imaginary unit so i can remain available for current.",
      "The symbol j marks the orthogonal imaginary component; it does not change that component's physical unit."
    ],
    boundary: [
      "Complex magnitude",
      "The non-negative value |z| = square root of a squared plus b squared for same-unit rectangular components.",
      "A magnitude cannot be negative and cannot be formed meaningfully from components with incompatible physical units."
    ],
    given: [
      "Rectangular components",
      "The same-unit values a = 3 V and b = 4 V in z = a + jb."
    ],
    model: [
      "Rectangular complex representation",
      "The orthogonal component pair z = 3 + j4 V with no additional phasor or impedance claim."
    ],
    result: [
      "Non-negative magnitude",
      "The value |z| = square root of 3 squared plus 4 squared = 5 V."
    ],
    decision: [
      "Representation boundary check",
      "The judgement that units, j notation, magnitude sign and claimed meaning stay within the rectangular model."
    ],
    failure: [
      "Unit or interpretation overreach",
      "Different component units, a negative magnitude or an undeclared phase, phasor or impedance interpretation."
    ],
    mapPredicate:
      "same-unit real and imaginary components map to the rectangular complex number z = a + jb",
    transformPredicate:
      "the Pythagorean square root transforms the two rectangular components into a non-negative magnitude",
    supportPredicate:
      "same units and a 3-4-5 check support the reported 5 V magnitude",
    constrainPredicate:
      "the rectangular same-unit model constrains what physical meaning may be claimed",
    invalidatePredicate:
      "incompatible units, a negative magnitude or undeclared phasor meaning invalidates the representation decision",
    validStatement:
      "Components a and b both use volts and j denotes the engineering imaginary unit.",
    scopeStatement:
      "The lesson uses only rectangular components and magnitude; phase, phasors and impedance require additional definitions not supplied here.",
    criterionStatement:
      "Magnitude is the non-negative 5 V result and every statement remains limited to the declared rectangular representation.",
    brokenStatement:
      "The two components use different units, magnitude is assigned a negative sign or rectangular notation is treated as proof of phasor or impedance meaning.",
    failureMechanism:
      "orthogonal numerical components are combined without compatible units or are given physical semantics that were never declared",
    failureConsequence:
      "the square-root value or the engineering interpretation no longer follows from z = a + jb",
    failureCriterion:
      "reject the claim until both components share a unit, magnitude is non-negative and any wider interpretation is separately defined",
    conceptualSteps: [
      "Declare z = a + jb, define j and confirm that a and b carry the same physical unit.",
      "Substitute a = 3 V and b = 4 V into the rectangular representation.",
      "Calculate the non-negative magnitude square root of 3 squared plus 4 squared = 5 V.",
      "Reject different component units, negative magnitude and undeclared phase, phasor or impedance claims.",
      "Accept only the rectangular component and magnitude statements actually supported by the givens."
    ],
    example: {
      scenario:
        "An engineering quantity is declared as z = 3 + j4 V with both rectangular components measured in volts.",
      givens: [
        ["Real component a", "3", "V"],
        ["Imaginary component b", "4", "V"]
      ],
      reasoning: [
        "The shared volt unit permits the two orthogonal components to form one rectangular complex quantity.",
        "Magnitude is square root of 3 squared plus 4 squared = square root of 25 = 5 V.",
        "The principal square root is non-negative, and no phase, phasor or impedance meaning is inferred."
      ],
      outcome:
        "The supported statements are z = 3 + j4 V and |z| = 5 V.",
      criterion:
        "Accept the result when both components share volts, j is explicit and magnitude is non-negative.",
      verification:
        "Square 5 V to obtain 25 V squared and confirm that 3 squared plus 4 squared gives the same value."
    },
    counterexample: {
      scenario:
        "A learner writes z = 3 V + j4 A, reports |z| = -5 and calls z an impedance phasor without defining voltage-current ratio or a time convention.",
      givens: [
        ["Real component", "3", "V"],
        ["Imaginary component", "4", "A"],
        ["Claimed magnitude", "-5", null]
      ],
      reasoning: [
        "Volts and amperes are incompatible component units, so they cannot form one rectangular magnitude.",
        "A magnitude is non-negative, and rectangular notation alone supplies no phasor or impedance definition.",
        "The unit, sign and interpretation failures invalidate every claimed result beyond the two separate givens."
      ],
      outcome:
        "Neither -5 nor the impedance-phasor label follows from components 3 V and 4 A.",
      criterion:
        "A valid complex magnitude requires same-unit components and a non-negative square root; wider meanings require explicit definitions.",
      verification:
        "Replace 4 A with 4 V and remove the undeclared interpretation; only then does the 3-4-5 magnitude check apply."
    },
    misconception: {
      claim:
        "Any expression containing j is automatically a phasor or impedance, and its magnitude may take either square-root sign.",
      mechanism:
        "Notation is mistaken for a physical definition and magnitude is confused with solutions of a squared equation.",
      correction:
        "Declare units and representation first, use the non-negative magnitude, and introduce phase, phasor or impedance only with their own conventions.",
      disconfirmingObservation:
        "The pair 3 V and 4 A contains numbers and j but has no same-unit magnitude and cannot by itself define impedance."
    },
    scenarioMarkers: [
      "Across the 3 plus j4 order",
      "During the volt-ampere repair",
      "For the 5 V magnitude selection",
      "At the negative-root diagnosis",
      "Between j notation and unit labels",
      "In the rectangular-scope explanation",
      "On the 3-4-5 complex diagram",
      "Within the phasor-impedance audit"
    ],
    assessmentVariant: 5,
    codeSample:
      "a = 3 V\nb = 4 A\nz = a + j*b\nmagnitude = -sqrt(a*a + b*b)\nclaim = \"z is an impedance phasor\"",
    validAnnotation:
      "Same-unit components 3 V and 4 V produce the non-negative rectangular magnitude 5 V.",
    brokenAnnotation:
      "Mixed units, a negative magnitude or undeclared phasor meaning blocks the representation decision."
  })
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
