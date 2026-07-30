import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyDomainCardinality,
  type AcademyDomainConditionTuple,
  type AcademyDomainEntityTuple,
  type AcademyDomainRelationKind,
  type AcademyDomainRelationTuple,
  type AcademyDomainTermTuple,
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

type TermSource = readonly [
  id: string,
  label: string,
  definition: string,
  boundary: string
];

type EntitySource = readonly [
  id: string,
  type: AcademyDomainEntityTuple[1],
  label: string,
  definition: string
];

type RelationSource = readonly [
  id: string,
  kind: AcademyDomainRelationKind,
  predicate: string,
  direction: AcademyDomainRelationTuple[5],
  cardinality: AcademyDomainCardinality
];

type ConditionSource = readonly [
  id: string,
  type: AcademyDomainConditionTuple[1],
  statement: string
];

type CaseSource = Readonly<{
  scenario: string;
  givenLabel: string;
  givenValue: string;
  givenUnit: string | null;
  reasoning: readonly [string, string, string];
  outcome: string;
  criterion: string;
  verification: string;
}>;

type AcademyE2LessonSource = Readonly<{
  lessonId: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: readonly [TermSource, TermSource, TermSource];
  entities: readonly [
    EntitySource,
    EntitySource,
    EntitySource,
    EntitySource,
    EntitySource
  ];
  relations: readonly [
    RelationSource,
    RelationSource,
    RelationSource,
    RelationSource,
    RelationSource
  ];
  conditions: readonly [
    ConditionSource,
    ConditionSource,
    ConditionSource,
    ConditionSource
  ];
  failureMechanism: string;
  failureConsequence: string;
  failureCriterion: string;
  conceptualSteps: readonly [string, string, string, string, string];
  example: CaseSource;
  counterexample: CaseSource;
  misconception: Readonly<{
    claim: string;
    mechanism: string;
    correction: string;
    disconfirmingObservation: string;
  }>;
  assessmentMoves: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];
  variant: number;
}>;

const relationEndpoints = [
  [["e1"], ["e2"]],
  [["e2"], ["e3"]],
  [["e3"], ["e4"]],
  [["e4"], ["e5"]],
  [["e1"], ["e5"]]
] as const;

const orderingPatterns = [
  {
    base: [
      ["b-function", ["r1"], ["c1"]],
      ["b-property", ["r2"], ["c2"]],
      ["b-evidence", ["r3"], ["c2"]],
      ["b-select", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-expose", ["r5"], ["c4"]],
      ["r-restate", ["r1"], ["c1"]],
      ["r-compare", ["r2", "r3"], ["c2"]],
      ["r-decide", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-load", ["r1"], ["c1"]],
      ["b-stress", ["r2"], ["c2"]],
      ["b-response", ["r3"], ["c2"]],
      ["b-limit", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-failure", ["r5"], ["c4"]],
      ["r-sign", ["r1"], ["c1"]],
      ["r-state", ["r2", "r3"], ["c2"]],
      ["r-criterion", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-support", ["r1"], ["c1"]],
      ["b-path", ["r2"], ["c2"]],
      ["b-action", ["r3"], ["c2"]],
      ["b-check", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-break", ["r5"], ["c4"]],
      ["r-boundary", ["r1"], ["c1"]],
      ["r-trace", ["r2", "r3"], ["c2"]],
      ["r-size", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-source", ["r1"], ["c1"]],
      ["b-transmit", ["r2"], ["c2"]],
      ["b-transform", ["r3"], ["c2"]],
      ["b-service", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-slip", ["r5"], ["c4"]],
      ["r-align", ["r1"], ["c1"]],
      ["r-recover", ["r2", "r3"], ["c2"]],
      ["r-inspect", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-motion", ["r1"], ["c1"]],
      ["b-geometry", ["r2"], ["c2"]],
      ["b-energy", ["r3"], ["c2"]],
      ["b-output", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-bind", ["r5"], ["c4"]],
      ["r-reset", ["r1"], ["c1"]],
      ["r-replay", ["r2", "r3"], ["c2"]],
      ["r-confirm", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-duty", ["r1"], ["c1"]],
      ["b-power", ["r2"], ["c2"]],
      ["b-loss", ["r3"], ["c2"]],
      ["b-design", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-overheat", ["r5"], ["c4"]],
      ["r-restore", ["r1"], ["c1"]],
      ["r-derate", ["r2", "r3"], ["c2"]],
      ["r-accept", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-hazard", ["r1"], ["c1"]],
      ["b-isolate", ["r2"], ["c2"]],
      ["b-inspect", ["r3"], ["c2"]],
      ["b-release", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-degrade", ["r5"], ["c4"]],
      ["r-contain", ["r1"], ["c1"]],
      ["r-evidence", ["r2", "r3"], ["c2"]],
      ["r-authorise", ["r4"], ["c3"]]
    ]
  }
] as const;

const instructionPlan = (
  source: AcademyE2LessonSource,
  slot: number,
  unitLabel: string
): AcademyLessonV2InstructionPlan => {
  const firstTerm = source.terms[0][1];
  const secondTerm = source.terms[1][1];
  const evidence = source.entities[3][2];
  const move = source.assessmentMoves[slot];
  const plans = [
    [
      `Assemble the measurement chain for ${firstTerm}, ${secondTerm} and ${evidence} while ${move}:`,
      `The measurement chain is traceable when ${firstTerm} passes through ${secondTerm} before producing ${evidence}.`,
      `The measurement chain is incomplete when ${evidence} appears without the ${secondTerm} conversion or ${firstTerm} boundary.`,
      `Write the ${firstTerm} measurand, range and condition at the start of ${move}.`,
      `Place ${secondTerm} at the stage where the measurement signal changes.`,
      `Carry ${firstTerm} through each measurement stage until ${secondTerm} produces ${evidence}.`,
      `Validate the chain by comparing ${evidence} with the declared ${firstTerm} criterion.`
    ],
    [
      `Reconstruct the measurement after ${evidence} disconfirms ${firstTerm} during ${move}:`,
      `The reconstruction succeeds when the altered ${evidence} reveals which ${secondTerm} stage broke the ${firstTerm} trace.`,
      `The reconstruction fails when ${evidence} is corrected numerically but the ${secondTerm} measurement mechanism remains unknown.`,
      `Preserve the raw ${evidence} before changing the measurement setup.`,
      `Walk from ${evidence} through ${secondTerm} back to the original ${firstTerm}.`,
      `Repair the first untraceable ${secondTerm} stage and repeat ${move}.`,
      `Use new ${evidence} to confirm that ${firstTerm} is again measured within its boundary.`
    ],
    [
      `Evaluate the measurement claims for ${firstTerm} by using ${secondTerm} and ${evidence} during ${move}:`,
      `A defensible claim keeps the ${firstTerm} definition, the ${secondTerm} transfer and the scope of ${evidence} together.`,
      `An indefensible claim treats ${evidence} as complete measurement proof after omitting the ${secondTerm} condition.`,
      `Underline the ${firstTerm} range, unit or bandwidth in each measurement claim.`,
      `Check whether ${secondTerm} was calibrated or configured for the ${evidence} being cited.`,
      `Remove the ${firstTerm} claim that cannot be traced through ${secondTerm}.`,
      `Retain the claim only when ${evidence} remains valid for the stated measurement scope.`
    ],
    [
      `Diagnose the measurement anomaly in ${evidence} before changing ${firstTerm} through ${move}:`,
      `The diagnosis is supported when ${evidence} locates a specific ${secondTerm} mechanism between the measurand ${firstTerm} and the record.`,
      `The diagnosis is unsupported when ${evidence} is labelled noise but no ${secondTerm} path is tested.`,
      `Record when and where ${evidence} departs from the expected measurement.`,
      `Trace the anomaly backwards through ${secondTerm} towards ${firstTerm}.`,
      `Compare the active ${secondTerm} path with the bounded reference path for ${firstTerm}.`,
      `Select the measurement mechanism that reproduces ${evidence} under ${move}.`
    ],
    [
      `Explain the measurement result by joining ${firstTerm}, ${secondTerm} and ${evidence} during ${move}:`,
      `A complete explanation states what ${firstTerm} means, how ${secondTerm} acts and why ${evidence} is sufficient.`,
      `A measurement explanation is incomplete when ${firstTerm} and ${secondTerm} are named without a trace to ${evidence}.`,
      `Define the ${firstTerm} quantity and the condition under which it is measured.`,
      `Describe the transfer, conversion or disturbance represented by ${secondTerm}.`,
      `Show how ${secondTerm} changes the signal that becomes ${evidence}.`,
      `Conclude with the uncertainty, range or quality boundary attached to ${evidence}.`
    ],
    [
      `Pair every measurement condition for ${firstTerm} with ${secondTerm} and ${evidence} during ${move}:`,
      `A correct pair states which ${secondTerm} stage carries ${firstTerm} and which ${evidence} checks that stage.`,
      `An incorrect pair attaches ${evidence} to a condition outside the ${secondTerm} measurement path.`,
      `Pair ${firstTerm} with the assumption defining its measurement input.`,
      `Pair ${secondTerm} with the operating condition visible in ${evidence}.`,
      `Read each ${firstTerm} pair from measurand through ${secondTerm} to record.`,
      `Reject the pair when its predicted ${evidence} disagrees with the measurement condition.`
    ],
    [
      `Inspect the measurement diagram from ${firstTerm} through ${secondTerm} to ${evidence} while ${move}:`,
      `The valid diagram retains a traceable ${firstTerm} path through the active ${secondTerm} stage into ${evidence}.`,
      `The invalid diagram follows a suppressed ${secondTerm} link and still labels ${evidence} as a measurement of ${firstTerm}.`,
      `Mark the physical ${firstTerm} at the measurement-chain input.`,
      `Follow the ${secondTerm} conversion, loading or timing relation towards ${evidence}.`,
      `Identify the diagram edge that ${move} changes between ${firstTerm} and ${secondTerm}.`,
      `Choose the path whose ${evidence} still carries the declared ${firstTerm} meaning.`
    ],
    [
      `Requalify ${evidence} after the measurement state of ${secondTerm} changes during ${move}:`,
      `The requalified result is usable when the altered ${secondTerm} path still maps ${firstTerm} into bounded ${evidence}.`,
      `The requalified result is misleading when old ${evidence} is retained after ${firstTerm} leaves the measured range.`,
      `State the changed ${secondTerm} configuration, environment or timing condition.`,
      `Identify which ${firstTerm} range or assumption no longer passes through ${secondTerm}.`,
      `Generate the expected new ${evidence} from the altered measurement path.`,
      `Accept the result only if new ${evidence} restores the ${firstTerm} quality criterion.`
    ]
  ] as const;
  const plan = plans[slot];
  if (!plan) {
    throw new Error(`Missing ${unitLabel} instruction plan ${slot}.`);
  }
  return [
    plan[0],
    plan[1],
    plan[2],
    [plan[3], plan[4]],
    [plan[5], plan[6]]
  ];
};

const makePlan = (
  source: AcademyE2LessonSource,
  unitLabel: string
): AcademyLessonTeachingProfileV2CompactPlan => {
  const terms = source.terms.map(
    (value, index): AcademyDomainTermTuple => [
      value[0],
      value[1],
      value[2],
      value[3],
      index === 0 ? "s1" : index === 1 ? "s2" : "s4"
    ]
  );
  const entities = source.entities.map(
    (value): AcademyDomainEntityTuple => [value[0], value[1], value[2], value[3]]
  );
  const relations = source.relations.map(
    (value, index): AcademyDomainRelationTuple => {
      const endpoints = relationEndpoints[index];
      if (!endpoints) {
        throw new Error(`Missing ${unitLabel} relation endpoints ${index}.`);
      }
      return [
        value[0],
        value[1],
        endpoints[0],
        endpoints[1],
        value[2],
        value[3],
        value[4]
      ];
    }
  );
  const conditionBindings = [
    [["e1", "e2"], ["r1"]],
    [["e2", "e3"], ["r2", "r3"]],
    [["e4", "e5"], ["r4"]],
    [["e1", "e5"], ["r5"]]
  ] as const;
  const conditions = source.conditions.map(
    (value, index): AcademyDomainConditionTuple => {
      const binding = conditionBindings[index];
      if (!binding) {
        throw new Error(`Missing ${unitLabel} condition binding ${index}.`);
      }
      return [value[0], value[1], value[2], binding[0], binding[1]];
    }
  );
  const pattern = orderingPatterns[source.variant];
  if (!pattern) {
    throw new Error(`Missing ${unitLabel} ordering pattern ${source.variant}.`);
  }
  const mapOrdering = (
    values: readonly (
      readonly [string, readonly string[], readonly string[]]
    )[]
  ) => values.map((value) => [value[0], value[1], value[2]] as const);
  const baseOrdering = mapOrdering(pattern.base);
  const retryOrdering = mapOrdering(pattern.retry);

  return {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: source.lessonId,
    systemModel: source.systemModel,
    failurePattern: source.failurePattern,
    visualExplanation: source.visualExplanation,
    applicationTask: source.applicationTask,
    terms,
    entities,
    relations,
    conditions,
    failureBoundary: [
      "f1",
      "c4",
      source.failureMechanism,
      source.failureConsequence,
      source.failureCriterion,
      ["e1", "e5"],
      ["r5"]
    ],
    conceptualModel: [
      ["s1", source.conceptualSteps[0], ["e1", "e2"], ["r1"], ["c1"]],
      ["s2", source.conceptualSteps[1], ["e2", "e3"], ["r2"], ["c2"]],
      ["s3", source.conceptualSteps[2], ["e3", "e4"], ["r3"], ["c2"]],
      ["s4", source.conceptualSteps[3], ["e4", "e5"], ["r4"], ["c3"]],
      ["s5", source.conceptualSteps[4], ["e1", "e5"], ["r5"], ["c4"]]
    ],
    reasonedCases: [
      {
        id: "worked",
        kind: "example",
        scenario: source.example.scenario,
        changedConditionIds: ["c1"],
        givens: [
          [
            "worked-given",
            source.example.givenLabel,
            source.example.givenValue,
            source.example.givenUnit,
            "e1"
          ]
        ],
        reasoningSteps: [
          ["worked-1", source.example.reasoning[0], ["e1", "e2"], ["r1"], ["c1"]],
          ["worked-2", source.example.reasoning[1], ["e2", "e4"], ["r2", "r3"], ["c2"]],
          ["worked-3", source.example.reasoning[2], ["e4", "e5"], ["r4"], ["c3"]]
        ],
        outcome: source.example.outcome,
        criterionConditionId: "c3",
        criterion: source.example.criterion,
        verification: source.example.verification
      },
      {
        id: "counter",
        kind: "counterexample",
        scenario: source.counterexample.scenario,
        changedConditionIds: ["c4"],
        givens: [
          [
            "counter-given",
            source.counterexample.givenLabel,
            source.counterexample.givenValue,
            source.counterexample.givenUnit,
            "e1"
          ]
        ],
        reasoningSteps: [
          ["counter-1", source.counterexample.reasoning[0], ["e1", "e5"], ["r5"], ["c4"]],
          ["counter-2", source.counterexample.reasoning[1], ["e2", "e5"], ["r2", "r5"], ["c2", "c4"]],
          ["counter-3", source.counterexample.reasoning[2], ["e4", "e5"], ["r4", "r5"], ["c3", "c4"]]
        ],
        outcome: source.counterexample.outcome,
        criterionConditionId: "c3",
        criterion: source.counterexample.criterion,
        verification: source.counterexample.verification
      }
    ],
    misconception: {
      id: "misconception",
      claim: source.misconception.claim,
      mechanism: source.misconception.mechanism,
      correction: source.misconception.correction,
      disconfirmingObservation: source.misconception.disconfirmingObservation,
      entityIds: ["e1", "e3", "e5"],
      relationIds: ["r2", "r5"],
      conditionIds: ["c2", "c4"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instructionPlan(source, 0, unitLabel),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3"],
          steps: baseOrdering,
          correctOrder: baseOrdering.map((value) => value[0])
        },
        retry: {
          instruction: instructionPlan(source, 1, unitLabel),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3"],
          steps: retryOrdering,
          correctOrder: retryOrdering.map((value) => value[0])
        }
      },
      q3: {
        base: {
          instruction: instructionPlan(source, 2, unitLabel),
          focusRef: term("t1", "definition"),
          contextConditionIds: ["c1", "c2", "c3"],
          options: [
            ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
            ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
            [
              "b-misconception",
              false,
              misconception("misconception", "claim"),
              misconception("misconception", "mechanism"),
              ["r2", "r5"],
              ["c4"],
              "misconception"
            ],
            [
              "b-counter",
              false,
              reasonedCase("counter", "outcome"),
              reasonedCase("counter", "criterion"),
              ["r5"],
              ["c3", "c4"],
              null
            ]
          ]
        },
        retry: {
          instruction: instructionPlan(source, 3, unitLabel),
          focusRef: reasonedCase("counter", "scenario"),
          contextConditionIds: ["c4", "c2", "c3"],
          options: [
            ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
            ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
            ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
            [
              "r-misconception",
              false,
              misconception("misconception", "claim"),
              misconception("misconception", "mechanism"),
              ["r2", "r5"],
              ["c4"],
              "misconception"
            ],
            [
              "r-criterion",
              false,
              term("t3", "boundary"),
              condition("c3"),
              ["r4"],
              ["c3"],
              null
            ]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4, unitLabel),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: ["c2", "c3", "c4"],
          conceptGroups: [
            ["definition", term("t1", "label"), [term("t1", "definition")], ["r1"], ["c1"]],
            ["mechanism", relation("r3"), [relation("r3")], ["r3"], ["c2"]],
            ["criterion", condition("c3"), [condition("c3")], ["r4"], ["c3"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r3"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5, unitLabel),
          focusRef: reasonedCase("worked", "verification"),
          contextConditionIds: ["c1", "c2", "c3"],
          pairs: [
            ["pair-1", relation("r1"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", relation("r3"), term("t2", "boundary"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", relation("r4"), condition("c3"), relation("r4"), ["r4"], ["c3"]]
          ]
        }
      },
      q5: {
        base: {
          kind: "diagram",
          instruction: instructionPlan(source, 6, unitLabel),
          focusRef: reasonedCase("counter", "outcome"),
          contextConditionIds: ["c2", "c3", "c4"],
          positions: [
            ["e1", 0, 0],
            ["e2", 1, 0],
            ["e3", 2, 0],
            ["e4", 3, 0],
            ["e5", 4, 0]
          ],
          relationIds: ["r1", "r2", "r3"],
          answerRelationIds: ["r3"],
          options: [
            [
              "diagram-correct",
              true,
              reasonedCase("worked", "verification"),
              condition("c3"),
              ["r3", "r4"],
              ["c2", "c3"],
              null
            ],
            [
              "diagram-misconception",
              false,
              misconception("misconception", "claim"),
              misconception("misconception", "mechanism"),
              ["r2", "r5"],
              ["c4"],
              "misconception"
            ],
            [
              "diagram-boundary",
              false,
              term("t2", "boundary"),
              condition("c1"),
              ["r1"],
              ["c1"],
              null
            ]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instructionPlan(source, 7, unitLabel),
          focusRef: term("t3", "definition"),
          contextConditionIds: ["c1", "c3"],
          positions: [
            ["e1", 0, 1],
            ["e2", 1, 1],
            ["e3", 2, 1],
            ["e4", 3, 1],
            ["e5", 4, 1]
          ],
          relationIds: ["r3", "r4", "r5"],
          answerRelationIds: ["r4"],
          options: [
            [
              "retry-correct",
              true,
              reasonedCase("worked", "outcome"),
              reasonedCase("worked", "verification"),
              ["r4"],
              ["c3"],
              null
            ],
            [
              "retry-misconception",
              false,
              misconception("misconception", "claim"),
              misconception("misconception", "mechanism"),
              ["r5"],
              ["c4"],
              "misconception"
            ],
            [
              "retry-counter",
              false,
              reasonedCase("counter", "outcome"),
              reasonedCase("counter", "criterion"),
              ["r3", "r5"],
              ["c2", "c4"],
              null
            ]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("t1", "label"),
      focusRef: reasonedCase("worked", "verification"),
      modelKind: "causal-graph",
      positions: [
        ["e1", 0, 0],
        ["e2", 1, 0],
        ["e3", 2, 0],
        ["e4", 3, 0],
        ["e5", 4, 0]
      ],
      visibleEntityIds: ["e1", "e2", "e3", "e4", "e5"],
      visibleRelationIds: ["r1", "r2", "r3", "r4", "r5"],
      controls: [
        [
          "bounded",
          term("t2", "label"),
          ["c1"],
          ["e1", "e2", "e3"],
          ["r1", "r2"],
          ["r5"],
          [],
          [["bounded-note", source.visualExplanation, ["e1", "e2"], ["r1"]]],
          reasonedCase("worked", "verification")
        ],
        [
          "altered",
          term("t3", "label"),
          ["c4"],
          ["e1", "e4", "e5"],
          ["r4", "r5"],
          ["r1"],
          [],
          [["altered-note", source.failureConsequence, ["e1", "e5"], ["r5"]]],
          reasonedCase("counter", "verification")
        ]
      ]
    }
  };
};

const buildAcademyE2UnitProfiles = (
  unitLabel: string,
  lessonSources: readonly AcademyE2LessonSource[]
) => {
  const plans = lessonSources.map((source) => makePlan(source, unitLabel));
  const lessonIds = lessonSources.map((source) => source.lessonId);
  const seeds = materialiseAcademyLessonTeachingProfileV2Registry(
    lessonIds,
    plans
  );
  const profiles = Object.fromEntries(
    lessonIds.map((lessonId) => {
      const seed = seeds[lessonId];
      if (!seed) {
        throw new Error(`Missing materialised ${unitLabel} seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;
  return { plans, lessonIds, profiles };
};

const lessonSources = [
  {
    lessonId: "EML-E2-D12-L01",
    systemModel:
      "A sensor transduces a physical measurand into an electrical signal while sensitivity, range, bandwidth, loading and environment bound the information it can carry.",
    failurePattern:
      "Choosing a sensor from nominal range alone ignores sensitivity, response speed, cross-sensitivity and loading, so the output can be measurable but unrelated to the required state.",
    visualExplanation:
      "A transduction graph links physical input through the sensing mechanism to electrical output, environmental influence, calibration evidence and a valid measurement decision.",
    applicationTask:
      "Select and check a sensor for a robot contact-force measurement using range, sensitivity, bandwidth, loading and environmental limits.",
    terms: [
      [
        "t1",
        "measurand",
        "A measurand is the specific physical quantity intended to be measured under stated conditions.",
        "A broad label such as force is incomplete without direction, location, bandwidth and operating range."
      ],
      [
        "t2",
        "sensitivity",
        "Sensitivity is the change in sensor output divided by the corresponding change in measurand.",
        "A sensitivity value applies only over the stated range, environment and transduction state."
      ],
      [
        "t3",
        "sensor loading",
        "Sensor loading is the change a sensor introduces into the system being measured.",
        "A small sensor does not guarantee negligible mechanical, electrical or thermal disturbance."
      ]
    ],
    entities: [
      ["e1", "input", "Contact-force measurand", "Force direction, location, range, variation rate and environment."],
      ["e2", "mechanism", "Sensor transduction element", "Physical mechanism converting force into an electrical signal."],
      ["e3", "state", "Raw sensor response", "Output level, sensitivity, bandwidth, loading and cross-sensitivity."],
      ["e4", "observation", "Reference comparison", "Sensor output compared with known input across relevant conditions."],
      ["e5", "decision", "Suitable force sensor", "Sensor accepted within verified range, response and disturbance limits."]
    ],
    relations: [
      ["r1", "maps", "The contact-force measurand maps into the chosen transduction mechanism.", "directed", "one-to-one"],
      ["r2", "causes", "The transduction element causes a raw electrical response under load.", "directed", "one-to-many"],
      ["r3", "measures", "The raw response measures force only through a reference comparison.", "directed", "one-to-one"],
      ["r4", "compares", "Reference evidence is compared with range, sensitivity and loading needs.", "directed", "many-to-one"],
      ["r5", "invalidates", "Saturation, slow response or material loading invalidates sensor suitability.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Force direction, range, bandwidth, mounting and environment are declared."],
      ["c2", "operating-state", "Transduction remains within its calibrated range and acceptable loading state."],
      ["c3", "criterion", "Reference evidence meets accuracy, sensitivity, response and disturbance needs."],
      ["c4", "boundary", "Saturation, excessive loading or unresolved cross-sensitivity blocks acceptance."]
    ],
    failureMechanism:
      "Nominal range is treated as complete sensor performance while transduction dynamics and system disturbance are omitted.",
    failureConsequence:
      "The sensor clips, misses fast contact or changes the mechanics enough to bias the force being measured.",
    failureCriterion:
      "Reject a sensor without evidence for the declared measurand, range, bandwidth, environment and loading.",
    conceptualSteps: [
      "Define the contact force by direction, location, range, rate and environment.",
      "Choose a transduction mechanism compatible with the mechanical interface.",
      "Predict sensitivity, bandwidth, loading and cross-sensitivity.",
      "Compare sensor response with known reference forces across conditions.",
      "Accept the sensor only within the verified measurement boundary."
    ],
    example: {
      scenario:
        "A force sensor has a verified sensitivity of 20 mV/N over the relevant range and produces its zero-corrected output under a 50 N reference load.",
      givenLabel: "Sensitivity and reference force",
      givenValue: "20 mV/N at 50 N",
      givenUnit: null,
      reasoning: [
        "Within the verified linear range, output change is sensitivity multiplied by force.",
        "20 mV/N multiplied by 50 N gives 1,000 mV, or 1.0 V.",
        "The 1.0 V result is accepted only if bandwidth, loading and environmental conditions also match."
      ],
      outcome:
        "The zero-corrected ideal output change is 1.0 V at the 50 N reference force.",
      criterion:
        "The sensor must reproduce reference forces without saturation or unacceptable loading.",
      verification:
        "Divide the 1,000 mV output change by 20 mV/N to recover the 50 N reference."
    },
    counterexample: {
      scenario:
        "A sensor covers the force range but its mechanical stiffness changes the compliant contact and its bandwidth misses the impact peak.",
      givenLabel: "Unverified limits",
      givenValue: "loading and bandwidth",
      givenUnit: null,
      reasoning: [
        "Range says only that the magnitude may be representable.",
        "Mechanical loading changes the measurand while insufficient bandwidth attenuates the peak.",
        "A range-only match cannot satisfy the force-measurement criterion."
      ],
      outcome:
        "The sensor is unsuitable despite its nominal range.",
      criterion:
        "Range, response and system disturbance must all remain acceptable.",
      verification:
        "Compare contact mechanics with and without the sensor and apply a traceable dynamic reference input."
    },
    misconception: {
      claim: "A sensor is suitable whenever its measurement range covers the expected value.",
      mechanism:
        "Sensitivity, bandwidth, loading, environment and cross-sensitivity disappear from selection.",
      correction:
        "Match the full measurand and verify transduction performance under representative conditions.",
      disconfirmingObservation:
        "The range is adequate but the sensor attenuates the impact peak and changes the contact stiffness."
    },
    assessmentMoves: [
      "sequencing measurand definition, transduction, response and reference check",
      "repairing range-only selection after loading and bandwidth appear",
      "screening sensor claims through sensitivity and environmental evidence",
      "diagnosing whether saturation, loading or response caused bias",
      "explaining how measurand and sensor loading define the boundary",
      "matching transduction effects to reference observations",
      "reading physical force through the sensor to suitability",
      "rejecting nominal range as a complete sensor specification"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D12-L02",
    systemModel:
      "An instrumentation chain carries a measurand through sensing, conditioning, conversion and calibration into an engineering-unit result with traceable uncertainty.",
    failurePattern:
      "Applying a calibration equation without its units, reference conditions or uncertainty makes a precise-looking engineering value that cannot be traced to the physical input.",
    visualExplanation:
      "A measurement-chain diagram follows reference mass through sensor voltage, linear calibration, converted mass, residual evidence and a traceable reported result.",
    applicationTask:
      "Build and verify a two-point calibration model for a simple load measurement, then state what the model does not prove.",
    terms: [
      [
        "t1",
        "calibration model",
        "A calibration model relates instrument indication to reference values under stated conditions.",
        "It does not remove uncertainty, drift or behaviour outside the calibrated range."
      ],
      [
        "t2",
        "zero offset",
        "Zero offset is the indication present when the defined measurand value is zero.",
        "Removing one offset does not correct gain error, nonlinearity or temperature drift."
      ],
      [
        "t3",
        "measurement traceability",
        "Measurement traceability is a documented unbroken calibration chain linking a result to recognised references.",
        "Traceability does not by itself guarantee that uncertainty is small enough for the decision."
      ]
    ],
    entities: [
      ["e1", "input", "Reference loads and conditions", "Known load values, units, environment and application method."],
      ["e2", "mechanism", "Instrumentation chain", "Sensor, excitation, conditioning, converter and data path."],
      ["e3", "mechanism", "Calibration relation", "Model mapping raw indication into load with residual and uncertainty."],
      ["e4", "observation", "Engineering-unit result", "Converted load plus uncertainty, range and traceability statement."],
      ["e5", "decision", "Accepted measurement chain", "Chain suitable for the intended load decision within its calibrated scope."]
    ],
    relations: [
      ["r1", "routes", "Reference loads route through the complete instrumentation chain.", "directed", "one-to-many"],
      ["r2", "transforms", "The chain transforms reference input into raw indications for calibration.", "directed", "many-to-many"],
      ["r3", "supports", "The calibration relation supports an engineering-unit result with residual evidence.", "directed", "one-to-many"],
      ["r4", "compares", "The reported result is compared with the intended decision need.", "directed", "many-to-one"],
      ["r5", "invalidates", "Missing units, reference conditions or uncertainty invalidate the accepted chain.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Reference values, units, environment and loading method are controlled."],
      ["c2", "operating-state", "The complete chain remains stable throughout calibration and use."],
      ["c3", "criterion", "Residual, uncertainty, range and traceability are suitable for the intended decision."],
      ["c4", "boundary", "Extrapolation, drift or an altered chain blocks use of the calibration."]
    ],
    failureMechanism:
      "A fitted equation is separated from the reference data, units, chain configuration and uncertainty that support it.",
    failureConsequence:
      "Converted values appear authoritative while being biased, out of range or incomparable with the decision limit.",
    failureCriterion:
      "Reject a calibrated result when its raw input, units, conditions, range or uncertainty cannot be traced.",
    conceptualSteps: [
      "Control reference values, units, environment and the complete signal chain.",
      "Record raw indications at suitable reference points and repeats.",
      "Fit a calibration relation and inspect residuals and uncertainty.",
      "Convert an indication into engineering units within the calibrated range.",
      "Report the result with traceability, uncertainty and validity boundary."
    ],
    example: {
      scenario:
        "A load chain reads 0.2 V at 0 kg and 4.2 V at 10 kg, with a linear model accepted between those references.",
      givenLabel: "Two calibration points",
      givenValue: "0.2 V at 0 kg; 4.2 V at 10 kg",
      givenUnit: null,
      reasoning: [
        "Sensitivity is the 4.0 V output change divided by 10 kg, giving 0.4 V/kg.",
        "A 2.2 V indication is 2.0 V above zero, so the linear estimate is 2.0 divided by 0.4, or 5 kg.",
        "The 5 kg result remains conditional on residual, repeatability and uncertainty evidence."
      ],
      outcome:
        "The two-point linear model maps 2.2 V to an estimated 5 kg within the calibrated interval.",
      criterion:
        "The model is acceptable only within range and with uncertainty suitable for the load decision.",
      verification:
        "Forward-check 5 kg: 0.2 V plus 0.4 V/kg times 5 kg returns 2.2 V."
    },
    counterexample: {
      scenario:
        "The same equation is used after excitation voltage changes and for a load above the largest reference point.",
      givenLabel: "Altered use",
      givenValue: "changed chain plus extrapolation",
      givenUnit: null,
      reasoning: [
        "Changing excitation alters the chain configuration underlying the voltage relation.",
        "The load also lies outside the evidence-backed calibration interval.",
        "Both changes break the validity conditions of the fitted model."
      ],
      outcome:
        "The converted load is not traceable to the original calibration.",
      criterion:
        "Chain configuration and input must remain inside the calibrated scope.",
      verification:
        "Restore the configuration and recalibrate with references spanning the intended range."
    },
    misconception: {
      claim: "Once a calibration equation is fitted, it converts any future reading accurately.",
      mechanism:
        "Range, uncertainty, drift, environment and instrumentation configuration are omitted.",
      correction:
        "Apply the model only within its validated scope and reverify the chain when conditions change.",
      disconfirmingObservation:
        "The same reference load produces a different voltage after excitation changes."
    },
    assessmentMoves: [
      "sequencing references, signal chain, calibration and reported result",
      "repairing a conversion after excitation or range changes",
      "screening calibration claims through residual and uncertainty evidence",
      "diagnosing whether offset, gain, drift or extrapolation caused error",
      "explaining how calibration model and traceability differ",
      "matching reference data to conversion and decision conditions",
      "reading the instrumentation chain from load to engineering units",
      "rejecting equation reuse outside the calibrated configuration"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D12-L03",
    systemModel:
      "Signal conditioning shifts, scales, filters, protects and sometimes linearises a sensor signal so the converter receives informative content without clipping or distortion.",
    failurePattern:
      "Maximising gain without accounting for offset, tolerance, noise and transient range makes the nominal signal fill the converter while real signals clip.",
    visualExplanation:
      "A conditioning graph maps sensor minimum and maximum through offset and gain to converter range, with filter, protection and clipping evidence.",
    applicationTask:
      "Design a linear shift-and-scale stage that maps a bounded sensor voltage into an ADC range, then reserve realistic headroom.",
    terms: [
      [
        "t1",
        "signal span",
        "Signal span is the difference between maximum and minimum expected signal values.",
        "Span does not include the absolute offset and must include worst-case operating variation."
      ],
      [
        "t2",
        "headroom",
        "Headroom is reserved distance between expected signal extremes and circuit or converter limits.",
        "Unused nominal range is not waste when it contains tolerance, noise and transient variation."
      ],
      [
        "t3",
        "anti-alias filter",
        "An anti-alias filter attenuates frequency content that cannot be represented by the chosen sampling process.",
        "It cannot reconstruct information that has already aliased after sampling."
      ]
    ],
    entities: [
      ["e1", "input", "Sensor voltage envelope", "Minimum, maximum, tolerance, noise, bandwidth and transient levels."],
      ["e2", "constraint", "ADC input limits", "Reference range, input protection and allowable drive conditions."],
      ["e3", "mechanism", "Shift-scale-filter stage", "Offset, gain, filtering and protection applied to the sensor signal."],
      ["e4", "observation", "Conditioned waveform evidence", "Measured range, clipping, noise, settling and frequency response."],
      ["e5", "decision", "Accepted conditioning design", "Stage preserving useful signal within converter and circuit limits."]
    ],
    relations: [
      ["r1", "constrains", "The sensor envelope and ADC limits constrain conditioning requirements.", "directed", "many-to-many"],
      ["r2", "transforms", "The input limits are transformed through the shift-scale-filter stage.", "directed", "many-to-one"],
      ["r3", "maps", "The conditioning stage maps sensor input into a measured converter waveform.", "directed", "one-to-one"],
      ["r4", "supports", "Unclipped, settled waveform evidence supports acceptance of the design.", "directed", "many-to-one"],
      ["r5", "invalidates", "Clipping, aliasing or protection conduction invalidates nominal-range mapping.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Sensor extremes, tolerance, noise, bandwidth, transients and ADC range are declared."],
      ["c2", "operating-state", "Amplifier, filter and protection remain linear over the required envelope."],
      ["c3", "criterion", "Useful signal settles and remains inside converter range with justified headroom."],
      ["c4", "boundary", "Clipping, slew limit, aliasing or overload blocks acceptance."]
    ],
    failureMechanism:
      "Conditioning is designed from nominal endpoints while real variation and dynamic limits are ignored.",
    failureConsequence:
      "The converter loses peak information, distorts timing or records aliased content.",
    failureCriterion:
      "Reject a conditioning design lacking worst-case range, dynamic, protection and sampling evidence.",
    conceptualSteps: [
      "Bound sensor minimum, maximum, tolerance, noise, bandwidth and transients.",
      "Bound ADC range, reference, protection and input-drive requirements.",
      "Calculate shift, gain and filter while reserving justified headroom.",
      "Measure range, clipping, settling, noise and frequency response.",
      "Accept only the envelope proven to remain informative and protected."
    ],
    example: {
      scenario:
        "A nominal sensor spans 0.5 V to 2.5 V and is linearly mapped to 0 V to 3.3 V before headroom is added.",
      givenLabel: "Sensor and ADC spans",
      givenValue: "0.5-2.5 V to 0-3.3 V",
      givenUnit: null,
      reasoning: [
        "Sensor span is 2.0 V and ADC span is 3.3 V, so ideal gain is 3.3 divided by 2.0, or 1.65.",
        "Mapping 0.5 V to zero requires an output offset of negative 0.825 V in the form output equals 1.65 input minus 0.825.",
        "The nominal mapping is then reduced or shifted to provide tolerance, noise and transient headroom."
      ],
      outcome:
        "The endpoint-only linear map has gain 1.65 and offset negative 0.825 V before headroom design.",
      criterion:
        "The final stage must keep worst-case signals within ADC and amplifier limits.",
      verification:
        "Check both endpoints: 1.65 times 0.5 minus 0.825 equals 0, and 1.65 times 2.5 minus 0.825 equals 3.3."
    },
    counterexample: {
      scenario:
        "The endpoint-only map is released even though sensor tolerance can drive below 0.5 V and above 2.5 V.",
      givenLabel: "Unmodelled variation",
      givenValue: "sensor endpoints exceeded",
      givenUnit: null,
      reasoning: [
        "The ideal map places nominal endpoints exactly on converter rails.",
        "Any outward variation demands voltage beyond the converter range.",
        "Clipping destroys the one-to-one relation between sensor and recorded value."
      ],
      outcome:
        "The nominal full-scale mapping is not robust enough for release.",
      criterion:
        "Worst-case signal plus transients must remain inside the verified range.",
      verification:
        "Propagate endpoint tolerances, reserve headroom and repeat an over-range waveform test."
    },
    misconception: {
      claim: "Using every ADC code at nominal conditions always maximises measurement quality.",
      mechanism:
        "Tolerance, noise, offset drift, transients and analogue limits are excluded from the range calculation.",
      correction:
        "Reserve evidence-based headroom so real signals remain informative rather than clipping.",
      disconfirmingObservation:
        "Nominal resolution improves while occasional peaks flatten at the ADC rails."
    },
    assessmentMoves: [
      "sequencing signal envelope, converter bounds, conditioning and waveform checks",
      "repairing an endpoint map after worst-case clipping appears",
      "screening gain claims through headroom and dynamic evidence",
      "diagnosing whether offset, bandwidth or protection caused distortion",
      "explaining why signal span and headroom are complementary",
      "matching conditioning functions to waveform observations",
      "reading sensor voltage through the stage to valid ADC input",
      "rejecting nominal full-scale use without tolerance allowance"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D12-L04",
    systemModel:
      "An ADC quantises sampled analogue input against a reference, while a DAC reconstructs commanded levels with finite resolution, settling, linearity and range.",
    failurePattern:
      "Calling bit count accuracy ignores reference uncertainty, analogue noise, quantisation, missing codes, sampling and settling, so displayed precision exceeds measured information.",
    visualExplanation:
      "A conversion graph links reference and analogue input through sample and quantise operations to code, reconstructed level, error evidence and a valid resolution claim.",
    applicationTask:
      "Calculate an ideal ADC code step and explain the additional reference, noise, sampling and settling evidence needed for a real measurement.",
    terms: [
      [
        "t1",
        "quantisation step",
        "Quantisation step is the ideal analogue interval represented by one adjacent-code change.",
        "It is not the same as total measurement accuracy or effective noise-free resolution."
      ],
      [
        "t2",
        "reference voltage",
        "Reference voltage sets the analogue scale used by an ADC or DAC.",
        "Reference tolerance, noise and drift directly affect converted engineering values."
      ],
      [
        "t3",
        "settling time",
        "Settling time is the time required for a converter or driven node to enter and remain within a defined error band.",
        "A new code or sample command is not valid evidence before the specified settling condition."
      ]
    ],
    entities: [
      ["e1", "input", "Analogue range and sample need", "Input range, bandwidth, timing and required decision resolution."],
      ["e2", "mechanism", "Reference and converter", "ADC or DAC architecture, bit count, reference and sample interface."],
      ["e3", "state", "Quantised code or output level", "Finite digital code and its associated analogue interval or output."],
      ["e4", "observation", "Conversion error evidence", "Noise, offset, gain, linearity, timing and settling observations."],
      ["e5", "decision", "Valid conversion claim", "Resolution and accuracy statement bounded by measured converter behaviour."]
    ],
    relations: [
      ["r1", "maps", "Analogue range and sample need map into reference and converter selection.", "directed", "one-to-many"],
      ["r2", "transforms", "The converter transforms analogue input or code into a quantised state.", "directed", "one-to-one"],
      ["r3", "measures", "The quantised state is measured against conversion error evidence.", "directed", "one-to-many"],
      ["r4", "supports", "Bounded error evidence supports a valid conversion claim.", "directed", "many-to-one"],
      ["r5", "invalidates", "Reference, timing or noise outside bounds invalidates bit-count accuracy.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Input range, reference, bandwidth, timing and required decision are explicit."],
      ["c2", "operating-state", "The source settles and drives the converter within its electrical limits."],
      ["c3", "criterion", "Measured conversion error and timing are suitable for the intended decision."],
      ["c4", "boundary", "Clipping, unsettled input, reference error or excessive noise blocks the claim."]
    ],
    failureMechanism:
      "Nominal code count is substituted for a measured end-to-end conversion uncertainty.",
    failureConsequence:
      "Reported digits suggest distinctions the analogue path and reference cannot reliably resolve.",
    failureCriterion:
      "Reject an accuracy claim based only on bits or ideal code width.",
    conceptualSteps: [
      "Define analogue range, bandwidth, timing and the decision resolution needed.",
      "Choose converter bits and reference, then calculate ideal code step.",
      "Account for source drive, sampling, quantisation and settling.",
      "Measure reference, noise, offset, gain, linearity and timing errors.",
      "Report resolution separately from verified conversion accuracy."
    ],
    example: {
      scenario:
        "An ideal 12-bit ADC uses a 0 V to 3.3 V input range.",
      givenLabel: "ADC range and code count",
      givenValue: "3.3 V over 4096 codes",
      givenUnit: null,
      reasoning: [
        "A 12-bit converter has 2 to the power 12, or 4096, ideal code intervals.",
        "3.3 V divided by 4096 gives approximately 0.0008057 V.",
        "The ideal step is about 0.806 mV, before reference, noise and analogue errors."
      ],
      outcome:
        "The ideal quantisation step is approximately 0.806 mV per code.",
      criterion:
        "A real accuracy claim must include reference, noise, drive, timing and linearity evidence.",
      verification:
        "Multiply 0.0008057 V by 4096 and recover approximately 3.3 V."
    },
    counterexample: {
      scenario:
        "The 0.806 mV ideal step is reported as guaranteed measurement accuracy while input noise spans several codes.",
      givenLabel: "Observed noise",
      givenValue: "multiple ADC codes",
      givenUnit: null,
      reasoning: [
        "Ideal code width describes quantisation scale, not total uncertainty.",
        "Multi-code noise prevents stable discrimination at one-code spacing.",
        "The guaranteed-accuracy claim exceeds observed information."
      ],
      outcome:
        "The converter has 12 nominal bits but lower effective decision resolution in this chain.",
      criterion:
        "Resolution and accuracy must reflect measured end-to-end error.",
      verification:
        "Record a stable reference input, analyse code spread and include reference and analogue uncertainty."
    },
    misconception: {
      claim: "A 12-bit ADC gives 12-bit accurate measurements.",
      mechanism:
        "Reference, noise, analogue drive, offset, linearity, sampling and timing errors are ignored.",
      correction:
        "Use bit count for ideal quantisation and verify effective resolution and accuracy separately.",
      disconfirmingObservation:
        "A constant input produces a distribution spanning several adjacent codes."
    },
    assessmentMoves: [
      "sequencing range need, converter selection, quantisation and error evidence",
      "repairing a bit-count claim after multi-code noise appears",
      "screening conversion claims through reference and timing evidence",
      "diagnosing whether noise, settling or range caused code error",
      "explaining why quantisation step and accuracy differ",
      "matching converter errors to observed code behaviour",
      "reading analogue input through quantisation to a valid claim",
      "rejecting nominal bits as guaranteed measurement information"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D12-L05",
    systemModel:
      "Grounding, shielding and EMC control physical current return and electromagnetic coupling so wanted measurement signals remain distinguishable from interference.",
    failurePattern:
      "Connecting every ground symbol at convenient points can create large shared loops and voltage drops that inject motor current into sensitive sensor references.",
    visualExplanation:
      "A current-return map follows motor and sensor currents through forward and return conductors, coupling paths, shield termination and measured noise.",
    applicationTask:
      "Trace and improve the return and shielding paths for a robot sensor located near a switched motor drive.",
    terms: [
      [
        "t1",
        "common impedance",
        "Common impedance is a shared path whose voltage drop couples one circuit current into another circuit reference.",
        "A conductor labelled ground can still have material resistance and inductance."
      ],
      [
        "t2",
        "shield termination",
        "Shield termination connects a cable shield to a reference or chassis so coupled current follows an intended path.",
        "The best termination depends on frequency, safety, cable and system architecture."
      ],
      [
        "t3",
        "loop area",
        "Loop area is the enclosed area between forward and return current paths and affects magnetic coupling.",
        "A short wire can still form a large loop when its return path is remote."
      ]
    ],
    entities: [
      ["e1", "input", "Motor and sensor currents", "Wanted sensor signal plus switching, return and fault currents."],
      ["e2", "mechanism", "Physical return and shield paths", "Conductors, planes, chassis bonds, cable pair and shield terminations."],
      ["e3", "state", "Coupled interference", "Common-impedance, electric-field and magnetic-field disturbance."],
      ["e4", "observation", "Sensor noise evidence", "Waveform, spectrum and operating-state correlation at the receiver."],
      ["e5", "decision", "EMC-bounded measurement path", "Routing and termination accepted across representative motor states."]
    ],
    relations: [
      ["r1", "routes", "Motor and sensor currents route through physical return and shield paths.", "directed", "many-to-many"],
      ["r2", "causes", "Return geometry and terminations cause or limit coupled interference.", "directed", "many-to-many"],
      ["r3", "compares", "Coupled interference is compared through measured sensor noise evidence.", "directed", "one-to-many"],
      ["r4", "supports", "Bounded noise evidence supports the EMC measurement-path decision.", "directed", "many-to-one"],
      ["r5", "invalidates", "An uncontrolled shared return or shield current invalidates schematic-only grounding.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Forward, return, shield, chassis and fault-current paths are physically identified."],
      ["c2", "operating-state", "Noise is measured across representative motor switching and cable configurations."],
      ["c3", "criterion", "Sensor error remains below the measurement limit without compromising safety."],
      ["c4", "boundary", "Unsafe bonding or uncontrolled coupling blocks acceptance."]
    ],
    failureMechanism:
      "Symbolic ground equality is assumed despite physical shared impedance and field coupling.",
    failureConsequence:
      "Motor current shifts the sensor reference or induces voltage that appears as a false measurement.",
    failureCriterion:
      "Reject an EMC claim that cannot trace current paths and reproduce bounded noise in representative states.",
    conceptualSteps: [
      "Draw wanted, return, shield, chassis and fault-current paths physically.",
      "Identify shared impedance, loop area and electric-field coupling paths.",
      "Choose routing, pairing, filtering and shield termination consistent with safety.",
      "Measure sensor noise while switching representative motor states.",
      "Accept the path only when measurement error remains bounded."
    ],
    example: {
      scenario:
        "A differential sensor pair is routed together away from the motor switching loop, with its return and shield termination defined at the receiver.",
      givenLabel: "Routing controls",
      givenValue: "paired conductors, separated loop, defined shield end",
      givenUnit: null,
      reasoning: [
        "Keeping signal and return together reduces loop area and magnetic pickup.",
        "Separating the pair from the switching loop reduces field coupling while the defined termination controls shield current.",
        "Motor-on and motor-off captures test whether remaining interference stays below the sensor limit."
      ],
      outcome:
        "The routing is a testable EMC candidate with explicit current and shield paths.",
      criterion:
        "Representative interference must remain below the permitted measurement error.",
      verification:
        "Compare time and frequency captures across motor states and repeat after deliberate cable repositioning."
    },
    counterexample: {
      scenario:
        "Sensor return shares a narrow PCB path with pulsed motor current before reaching the converter reference.",
      givenLabel: "Shared path",
      givenValue: "sensor and motor return",
      givenUnit: null,
      reasoning: [
        "Pulsed motor current produces a changing voltage across the shared impedance.",
        "That voltage shifts the sensor reference at the converter.",
        "The measured signal now includes motor-current error."
      ],
      outcome:
        "The shared return invalidates the assumption of an unchanged sensor reference.",
      criterion:
        "Motor return disturbance must remain outside the sensitive measurement reference path.",
      verification:
        "Measure voltage along the shared return and reroute the high-current path before retesting."
    },
    misconception: {
      claim: "All points marked ground are at exactly the same voltage.",
      mechanism:
        "Physical conductor resistance, inductance, current and coupling are removed from the schematic symbol.",
      correction:
        "Trace real current return and shield paths and verify reference disturbance under operating conditions.",
      disconfirmingObservation:
        "A voltage appears between two ground-labelled points when motor current switches."
    },
    assessmentMoves: [
      "sequencing current identification, coupling model, control and noise test",
      "repairing symbolic grounding after shared-return disturbance appears",
      "screening EMC claims through physical routing and waveform evidence",
      "diagnosing whether impedance, loop area or shield path caused noise",
      "explaining how common impedance and loop area create different coupling",
      "matching grounding controls to measured interference paths",
      "reading motor and sensor currents through the return network",
      "rejecting equal-ground assumptions without physical evidence"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D12-L06",
    systemModel:
      "A multimeter, oscilloscope or logic analyser connects a finite-input measurement system to a circuit, and probe choice, reference, bandwidth and setup determine what evidence is captured.",
    failurePattern:
      "Treating an instrument as an invisible observer ignores input impedance, probe capacitance, ground connection, bandwidth and trigger, so the act of measurement changes or hides the signal.",
    visualExplanation:
      "A diagnostic graph links circuit node and expected signal through probe loading and instrument setup to displayed waveform, cross-check and fault decision.",
    applicationTask:
      "Choose and configure an instrument for a robot signal fault, then explain loading, grounding, bandwidth and trigger checks.",
    terms: [
      [
        "t1",
        "probe loading",
        "Probe loading is the change in circuit behaviour caused by instrument input resistance, capacitance and connection geometry.",
        "A high resistance does not guarantee negligible high-frequency capacitive loading."
      ],
      [
        "t2",
        "oscilloscope trigger",
        "An oscilloscope trigger defines the event used to align waveform acquisitions in time.",
        "A stable display does not prove the trigger event is the fault event of interest."
      ],
      [
        "t3",
        "logic threshold",
        "A logic threshold is the voltage boundary an analyser uses to classify a sampled level.",
        "A digital 0 or 1 display hides analogue margin, ringing and threshold uncertainty."
      ]
    ],
    entities: [
      ["e1", "input", "Circuit node and expected signal", "Source impedance, voltage, bandwidth, reference and suspected event."],
      ["e2", "constraint", "Instrument and probe interface", "Input resistance, capacitance, ground, attenuation, bandwidth and safety."],
      ["e3", "mechanism", "Acquisition setup", "Range, sample rate, coupling, trigger and threshold choices."],
      ["e4", "observation", "Displayed measurement evidence", "Voltage, waveform, timing or logic record plus setup metadata."],
      ["e5", "decision", "Supported diagnostic conclusion", "Fault claim accepted after loading and independent checks are bounded."]
    ],
    relations: [
      ["r1", "constrains", "The circuit node and expected signal constrain instrument and probe choice.", "directed", "one-to-many"],
      ["r2", "measures", "The instrument interface measures the node through a finite loading path.", "directed", "one-to-one"],
      ["r3", "transforms", "Acquisition setup transforms the connected signal into displayed evidence.", "directed", "one-to-many"],
      ["r4", "compares", "Displayed evidence is compared with the expected signal and an independent check.", "directed", "many-to-many"],
      ["r5", "invalidates", "Unsafe reference, material loading or inadequate acquisition invalidates the diagnosis.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Node voltage, source impedance, bandwidth, reference and safety category are known."],
      ["c2", "operating-state", "Probe and acquisition settings are suitable and recorded."],
      ["c3", "criterion", "The conclusion survives loading assessment and an independent or altered-setup check."],
      ["c4", "boundary", "Unsafe grounding, aliasing, saturation or material loading blocks the conclusion."]
    ],
    failureMechanism:
      "Instrument connection and acquisition settings are omitted from interpretation of the display.",
    failureConsequence:
      "The signal changes under probe load or a transient is aliased, missed or falsely stabilised.",
    failureCriterion:
      "Reject a diagnostic claim lacking safe connection, recorded setup, loading assessment and corroboration.",
    conceptualSteps: [
      "Predict node voltage, impedance, bandwidth, reference and fault event.",
      "Choose a safe instrument and probe with suitable loading and bandwidth.",
      "Set range, sample rate, coupling, threshold and trigger deliberately.",
      "Capture evidence and vary one setup feature to seek disconfirmation.",
      "Report the conclusion with instrument and loading boundaries."
    ],
    example: {
      scenario:
        "A 10 MOhm meter measures a divider node whose lower resistance is 1 MOhm, so loading must be assessed.",
      givenLabel: "Meter and node resistance",
      givenValue: "10 MOhm meter across 1 MOhm lower leg",
      givenUnit: null,
      reasoning: [
        "The meter appears in parallel with the 1 MOhm lower resistance.",
        "Their equivalent is 10 times 1 divided by 11 MOhm, approximately 0.909 MOhm.",
        "The divider must be recalculated with 0.909 MOhm before interpreting the displayed voltage."
      ],
      outcome:
        "The meter reduces the effective lower resistance by about 9.1 percent and can materially shift the node.",
      criterion:
        "Probe loading must be small enough for the diagnostic decision or explicitly corrected.",
      verification:
        "Compare the indicated voltage with a higher-impedance method or repeat the divider calculation including the meter."
    },
    counterexample: {
      scenario:
        "A long oscilloscope ground lead is clipped to a fast switching node without checking reference safety or loop inductance.",
      givenLabel: "Probe setup",
      givenValue: "long ground lead on fast node",
      givenUnit: null,
      reasoning: [
        "The reference connection may be unsafe for the node topology.",
        "The large probe loop can add ringing not present at the compact node.",
        "The displayed transient cannot support a circuit conclusion."
      ],
      outcome:
        "The capture is unsafe or measurement-induced and must be discarded.",
      criterion:
        "Connection safety and probe geometry must be valid before waveform interpretation.",
      verification:
        "Use an appropriate isolated or differential method and a low-inductance connection, then recapture."
    },
    misconception: {
      claim: "A measuring instrument reports the circuit without changing it.",
      mechanism:
        "Finite input resistance, capacitance, ground path, bandwidth and acquisition settings are ignored.",
      correction:
        "Model the instrument as part of the circuit and corroborate important observations.",
      disconfirmingObservation:
        "The node voltage or ringing changes when probe impedance or connection geometry changes."
    },
    assessmentMoves: [
      "sequencing signal prediction, probe choice, acquisition and diagnosis",
      "repairing a display claim after probe loading is calculated",
      "screening instrument evidence through setup and safety metadata",
      "diagnosing whether loading, aliasing or trigger caused the display",
      "explaining how probe loading and logic threshold hide analogue behaviour",
      "matching instruments and probes to node conditions",
      "reading the measurement path from circuit node to conclusion",
      "rejecting invisible-observer assumptions in diagnostic work"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D12-L07",
    systemModel:
      "A data-acquisition system coordinates range, conditioning, sampling, timestamps, calibration, quality flags and storage so recorded values remain interpretable as a time series.",
    failurePattern:
      "Logging values without calibration version, units, timestamps or quality state creates a dense file that cannot distinguish physical change from clipping, dropout or clock error.",
    visualExplanation:
      "A logger pipeline links sensor envelope through conditioning and sample clock to calibrated records, quality flags, storage and replay verification.",
    applicationTask:
      "Define and verify a calibrated sensor logger for a robot test, including sampling, timestamps, metadata and data-quality handling.",
    terms: [
      [
        "t1",
        "sampling rate",
        "Sampling rate is the number of samples acquired per unit time.",
        "A rate above twice the highest frequency prevents ideal alias overlap only when input bandwidth is actually limited."
      ],
      [
        "t2",
        "timestamp integrity",
        "Timestamp integrity is confidence that recorded times preserve ordering, interval and clock reference within stated bounds.",
        "Sequential row numbers do not prove accurate elapsed time."
      ],
      [
        "t3",
        "quality flag",
        "A quality flag records a known condition such as clipping, dropout, invalid calibration or unsettled input.",
        "A flag must not silently replace or fabricate the underlying measurement."
      ]
    ],
    entities: [
      ["e1", "input", "Test measurand and bandwidth", "Physical range, frequency content, duration and decision purpose."],
      ["e2", "mechanism", "Conditioning and sample clock", "Analogue range control, filtering, sampling rate and timing source."],
      ["e3", "observation", "Calibrated timestamped records", "Raw and converted values with units, time, calibration and quality state."],
      ["e4", "observation", "Replay and quality evidence", "Gap, clipping, timing, range and reference checks over the dataset."],
      ["e5", "decision", "Usable test dataset", "Data accepted for the declared analysis with limitations retained."]
    ],
    relations: [
      ["r1", "maps", "Test measurand and bandwidth map into conditioning and sample-clock requirements.", "directed", "one-to-many"],
      ["r2", "routes", "Conditioning and timing route samples into calibrated timestamped records.", "directed", "one-to-many"],
      ["r3", "supports", "Recorded metadata support replay and data-quality checks.", "directed", "many-to-many"],
      ["r4", "compares", "Replay and quality evidence are compared with the intended analysis need.", "directed", "many-to-one"],
      ["r5", "invalidates", "Clipping, aliasing or unknown timing invalidates unqualified dataset use.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Measurand range, bandwidth, duration, units and analysis purpose are explicit."],
      ["c2", "operating-state", "Conditioning, sampling, clock and calibration configuration remain recorded."],
      ["c3", "criterion", "Replay confirms bounded timing, range, calibration and quality for the analysis."],
      ["c4", "boundary", "Unmarked clipping, aliasing, dropout or timestamp failure blocks use."]
    ],
    failureMechanism:
      "Values are stored without the metadata and quality state required to reconstruct how and when they were measured.",
    failureConsequence:
      "Analysis can interpret acquisition faults as robot behaviour and cannot reproduce the engineering-unit conversion.",
    failureCriterion:
      "Reject a dataset whose timebase, units, calibration or material quality gaps are unknown.",
    conceptualSteps: [
      "Define measurand range, bandwidth, duration and analysis purpose.",
      "Choose conditioning, anti-alias filtering, sampling and clock.",
      "Store raw and calibrated values with units, timestamps and configuration.",
      "Flag clipping, dropout, invalid calibration and unsettled states explicitly.",
      "Replay the dataset against reference events before analysis release."
    ],
    example: {
      scenario:
        "A sensor signal contains useful content through 40 Hz and is logged at 200 samples per second after appropriate input filtering.",
      givenLabel: "Signal bandwidth and sampling rate",
      givenValue: "40 Hz bandwidth at 200 samples/s",
      givenUnit: null,
      reasoning: [
        "The sample rate is five times the highest declared useful frequency.",
        "An input filter is still required to limit content above the representable band before sampling.",
        "Timestamp intervals, clipping and a known event are checked during replay."
      ],
      outcome:
        "The 200 samples/s plan provides five samples per 40 Hz period within the declared filtered bandwidth.",
      criterion:
        "Sampling, filtering, timing and range evidence must support the intended analysis.",
      verification:
        "Replay a known 40 Hz reference and confirm amplitude, timing and sample intervals without clipped or missing records."
    },
    counterexample: {
      scenario:
        "A logger stores engineering values but omits timestamps, calibration version and flags during intermittent ADC clipping.",
      givenLabel: "Missing record context",
      givenValue: "time, calibration and clipping state absent",
      givenUnit: null,
      reasoning: [
        "Without timestamps, interval and event order cannot be verified.",
        "Without calibration version, engineering values cannot be reproduced from raw data.",
        "Unflagged clipping makes saturated values look like real plateaus."
      ],
      outcome:
        "The file is not a trustworthy dataset for dynamic robot analysis.",
      criterion:
        "Time, calibration and material quality state must be recoverable for every analysed record.",
      verification:
        "Repeat acquisition with raw values, timestamps, configuration identifiers and explicit quality flags."
    },
    misconception: {
      claim: "More logged samples automatically create a better dataset.",
      mechanism:
        "Input bandwidth, calibration, time integrity, clipping, dropout and metadata are excluded from quality.",
      correction:
        "Choose sampling from the measurand and preserve the context required to reproduce and qualify every record.",
      disconfirmingObservation:
        "A high-rate file still aliases interference and cannot align with the reference event because its clock drift is unknown."
    },
    assessmentMoves: [
      "sequencing measurand bounds, sampling design, records and replay",
      "repairing a values-only log with timing and quality context",
      "screening dataset claims through calibration and clock evidence",
      "diagnosing whether aliasing, clipping or dropout caused artefacts",
      "explaining how sampling rate and timestamp integrity differ",
      "matching data-quality flags to acquisition conditions",
      "reading the logger pipeline from physical signal to usable dataset",
      "rejecting sample count as a substitute for measurement quality"
    ],
    variant: 6
  }
] satisfies readonly AcademyE2LessonSource[];

const d12 = buildAcademyE2UnitProfiles("D12", lessonSources);

export const academyLessonTeachingProfileV2PlansE2D12 = d12.plans;
export const academyLessonTeachingProfileV2LessonIdsE2D12 = d12.lessonIds;
export const academyLessonTeachingProfilesV2E2D12 = d12.profiles;

export default academyLessonTeachingProfilesV2E2D12;
