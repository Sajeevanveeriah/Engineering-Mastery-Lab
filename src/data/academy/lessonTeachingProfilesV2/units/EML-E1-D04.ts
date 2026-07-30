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

type LessonSource = Readonly<{
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

const instructionPlan = (
  source: LessonSource,
  slot: number
): AcademyLessonV2InstructionPlan => {
  const firstTerm = source.terms[0][1];
  const secondTerm = source.terms[1][1];
  const evidence = source.entities[3][2];
  const move = source.assessmentMoves[slot];
  const plans: readonly (
    readonly [string, string, string, string, string, string, string]
  )[] = [
    [
      `Sequence ${firstTerm}, ${secondTerm} and ${evidence} while ${move}:`,
      `${firstTerm} is ordered soundly because ${move} keeps ${secondTerm} connected to ${evidence}.`,
      `${secondTerm} is out of order until ${move} reconciles ${firstTerm} with ${evidence}.`,
      `Begin from ${firstTerm}, then continue by ${move} around ${secondTerm}.`,
      `Use ${evidence} to check the last ${secondTerm} transition during ${move}.`,
      `Place ${firstTerm} before ${secondTerm} and explicitly describe ${move}.`,
      `Finish at ${evidence}; accept the sequence only when ${move} preserves ${firstTerm}.`
    ],
    [
      `Rebuild ${secondTerm} from ${evidence} and ${firstTerm} by ${move}:`,
      `${evidence} now supports ${secondTerm} because ${move} restores the ${firstTerm} boundary.`,
      `${firstTerm} remains unsupported if ${move} bypasses ${secondTerm} or ${evidence}.`,
      `Locate the altered ${evidence} condition before ${move} through ${firstTerm}.`,
      `Ask which ${secondTerm} link changes when ${move} is applied to ${evidence}.`,
      `Recover ${firstTerm} first, then use ${move} to reconstruct ${secondTerm}.`,
      `Retest ${evidence} after ${move} and state the surviving ${firstTerm} limit.`
    ],
    [
      `Select the ${firstTerm} claims that survive ${move} with ${secondTerm} and ${evidence}:`,
      `Those ${secondTerm} claims are defensible because ${move} retains ${firstTerm} evidence.`,
      `At least one ${evidence} claim fails because ${move} was not applied to ${secondTerm}.`,
      `Screen each ${firstTerm} statement for the ${secondTerm} boundary during ${move}.`,
      `Keep only ${evidence} statements whose relation remains valid while ${move}.`,
      `Mark the ${firstTerm} and ${secondTerm} statements supported by ${move}.`,
      `Reject the ${evidence} statement that contradicts ${firstTerm} after ${move}.`
    ],
    [
      `Diagnose the altered ${evidence} case by ${move} across ${firstTerm} and ${secondTerm}:`,
      `${firstTerm} and ${secondTerm} identify the changed ${evidence} mechanism under ${move}.`,
      `${evidence} has been accepted too early if ${move} ignores the ${firstTerm} condition.`,
      `Find where ${secondTerm} first departs from ${firstTerm} while ${move}.`,
      `Compare the altered ${evidence} with the bounded ${firstTerm} case before ${move}.`,
      `Retain the ${secondTerm} relation that explains ${evidence} during ${move}.`,
      `Discard the ${firstTerm} claim whose ${evidence} cannot survive ${move}.`
    ],
    [
      `Explain ${firstTerm} in relation to ${secondTerm} and ${evidence} by ${move}:`,
      `The explanation joins ${firstTerm}, ${secondTerm} and ${evidence} through ${move}.`,
      `The explanation is incomplete when ${move} omits either ${secondTerm} or ${evidence}.`,
      `Name the ${firstTerm} boundary before ${move} towards ${secondTerm}.`,
      `State how ${evidence} tests ${secondTerm} as part of ${move}.`,
      `Connect ${firstTerm} to ${secondTerm} and narrate ${move} explicitly.`,
      `Close with the ${evidence} criterion that limits ${firstTerm} after ${move}.`
    ],
    [
      `Match ${secondTerm} evidence to ${firstTerm} conditions while ${move} through ${evidence}:`,
      `Each ${secondTerm} relation meets the ${firstTerm} condition that governs it during ${move}.`,
      `A ${evidence} pair is mismatched because ${move} assigns the wrong ${firstTerm} boundary.`,
      `Pair the earliest ${secondTerm} link with its ${firstTerm} assumption before ${move}.`,
      `Reserve the ${evidence} criterion for the relation concluded after ${move}.`,
      `Align ${firstTerm} and ${secondTerm} according to the dependency exposed by ${move}.`,
      `Verify every ${evidence} pair by reading ${move} back towards ${firstTerm}.`
    ],
    [
      `Read the ${firstTerm} diagram by ${move} from ${secondTerm} to ${evidence}:`,
      `The chosen implication follows ${secondTerm} into ${evidence} without leaving the ${firstTerm} boundary.`,
      `The diagram is misread if ${move} skips the ${secondTerm} relation controlling ${evidence}.`,
      `Trace ${firstTerm} to the first ${secondTerm} node while ${move}.`,
      `Inspect which ${evidence} edge remains active after ${move} changes the condition.`,
      `Follow the ${secondTerm} arrows and apply ${move} before judging ${firstTerm}.`,
      `Select the ${evidence} implication whose path preserves ${firstTerm} during ${move}.`
    ],
    [
      `Interpret the alternate ${evidence} diagram by ${move} around ${firstTerm} and ${secondTerm}:`,
      `${evidence} supports the implication because ${move} retains the required ${secondTerm} path.`,
      `${firstTerm} is overclaimed when ${move} treats a suppressed ${secondTerm} path as active.`,
      `Start at the altered ${evidence} node and identify how ${move} changes ${firstTerm}.`,
      `Contrast the active ${secondTerm} edge with the suppressed one while ${move}.`,
      `Use ${evidence} to reconstruct the path produced when ${move} acts on ${secondTerm}.`,
      `Accept ${firstTerm} only if the final ${evidence} route agrees with ${move}.`
    ]
  ];
  const plan = plans[slot];
  if (!plan) {
    throw new Error(`Missing D04 instruction plan ${slot}.`);
  }
  return [
    plan[0],
    plan[1],
    plan[2],
    [plan[3], plan[4]],
    [plan[5], plan[6]]
  ];
};

const orderingPatterns = [
  {
    base: [
      ["b-observe", ["r1"], ["c1"]],
      ["b-relate", ["r2"], ["c2"]],
      ["b-transform", ["r3"], ["c2"]],
      ["b-decide", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-bound", ["r5"], ["c4"]],
      ["r-rebuild", ["r2", "r3"], ["c2"]],
      ["r-check", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-source", ["r1"], ["c1"]],
      ["b-accumulate", ["r2", "r3"], ["c2"]],
      ["b-test", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-locate", ["r5"], ["c4"]],
      ["r-resample", ["r1", "r2"], ["c1"]],
      ["r-recompute", ["r3"], ["c2"]],
      ["r-verify", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-declare", ["r1"], ["c1"]],
      ["b-isolate", ["r2"], ["c2"]],
      ["b-project", ["r3", "r4"], ["c2"]],
      ["b-compare", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-change", ["r5"], ["c4"]],
      ["r-hold", ["r1"], ["c1"]],
      ["r-recombine", ["r3"], ["c2"]],
      ["r-judge", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-state", ["r1"], ["c1"]],
      ["b-law", ["r2"], ["c2"]],
      ["b-evolve", ["r3"], ["c2"]],
      ["b-constrain", ["r4"], ["c3"]],
      ["b-review", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-expose", ["r5"], ["c4"]],
      ["r-restore", ["r1", "r2"], ["c1"]],
      ["r-integrate", ["r3", "r4"], ["c2", "c3"]]
    ]
  },
  {
    base: [
      ["b-vector", ["r1"], ["c1"]],
      ["b-map", ["r2"], ["c2"]],
      ["b-direction", ["r3"], ["c2"]],
      ["b-scale", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-reject", ["r5"], ["c4"]],
      ["r-remap", ["r2"], ["c2"]],
      ["r-compare", ["r3", "r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-domain", ["r1"], ["c1"]],
      ["b-forward", ["r2"], ["c2"]],
      ["b-reverse", ["r3"], ["c2"]],
      ["b-slope", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-detect", ["r5"], ["c4"]],
      ["r-restrict", ["r1"], ["c1"]],
      ["r-invert", ["r3"], ["c2"]],
      ["r-confirm", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-sample", ["r1"], ["c1"]],
      ["b-estimate", ["r2"], ["c2"]],
      ["b-iterate", ["r3"], ["c2"]],
      ["b-constrain", ["r4"], ["c3"]],
      ["b-report", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-bias", ["r5"], ["c4"]],
      ["r-resample", ["r1"], ["c1"]],
      ["r-restart", ["r3", "r4"], ["c2", "c3"]]
    ]
  }
] as const;

const makePlan = (source: LessonSource): AcademyLessonTeachingProfileV2CompactPlan => {
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
        throw new Error(`Missing D04 relation endpoints ${index}.`);
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
  const conditions = source.conditions.map(
    (value, index): AcademyDomainConditionTuple => {
      const bindings = [
        [["e1", "e2"], ["r1"]],
        [["e2", "e3"], ["r2", "r3"]],
        [["e4", "e5"], ["r4"]],
        [["e1", "e5"], ["r5"]]
      ] as const;
      const binding = bindings[index];
      if (!binding) {
        throw new Error(`Missing D04 condition binding ${index}.`);
      }
      return [value[0], value[1], value[2], binding[0], binding[1]];
    }
  );
  const pattern = orderingPatterns[source.variant];
  if (!pattern) {
    throw new Error(`Missing D04 ordering pattern ${source.variant}.`);
  }
  const mapOrdering = (
    values: readonly (
      readonly [string, readonly string[], readonly string[]]
    )[]
  ) => values.map((value) => [value[0], value[1], value[2]] as const);
  const baseOrdering = mapOrdering(pattern.base);
  const retryOrdering = mapOrdering(pattern.retry);

  const plan: AcademyLessonTeachingProfileV2CompactPlan = {
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
          instruction: instructionPlan(source, 0),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3"],
          steps: baseOrdering,
          correctOrder: baseOrdering.map((value) => value[0])
        },
        retry: {
          instruction: instructionPlan(source, 1),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3"],
          steps: retryOrdering,
          correctOrder: retryOrdering.map((value) => value[0])
        }
      },
      q3: {
        base: {
          instruction: instructionPlan(source, 2),
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
          instruction: instructionPlan(source, 3),
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
          instruction: instructionPlan(source, 4),
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
          instruction: instructionPlan(source, 5),
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
          instruction: instructionPlan(source, 6),
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
          instruction: instructionPlan(source, 7),
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
  return plan;
};

const lessonSources = [
  {
    lessonId: "EML-E1-D04-L01",
    systemModel:
      "A derivative connects a small input change to the resulting output change, then takes the limit of the secant slope while retaining output-unit per input-unit dimensions.",
    failurePattern:
      "Substituting a zero input interval into a difference quotient creates division by zero, while treating one large interval as local change hides variation inside that interval.",
    visualExplanation:
      "A five-node graph moves from a time increment through a displacement increment and secant slope to a tangent estimate and a unit-checked rate decision.",
    applicationTask:
      "Explain how a robot position trace in metres yields local velocity in metres per second, including the limiting assumption and sign.",
    terms: [
      [
        "t1",
        "Derivative",
        "The limiting ratio of output change to input change at a stated input value.",
        "It describes local change where the limit exists; it is not the quotient formed with a zero denominator."
      ],
      [
        "t2",
        "Secant slope",
        "The finite ratio of output difference to nonzero input difference between two samples.",
        "It is an interval average and need not equal the tangent slope over a wide interval."
      ],
      [
        "t3",
        "Derivative unit",
        "The output unit divided by the input unit, such as metres per second.",
        "A bare number without the inherited unit cannot support an engineering interpretation."
      ]
    ],
    entities: [
      ["e1", "input", "Time increment", "A nonzero sampling interval measured in seconds."],
      ["e2", "state", "Position increment", "The signed change in robot position measured in metres."],
      ["e3", "mechanism", "Secant calculation", "Division of position increment by time increment before taking a limit."],
      ["e4", "observation", "Tangent estimate", "The local velocity approached as the time interval shrinks."],
      ["e5", "decision", "Velocity interpretation", "A signed local rate reported in metres per second."]
    ],
    relations: [
      ["r1", "maps", "the time increment selects the paired position increment", "directed", "one-to-one"],
      ["r2", "transforms", "the paired increments form a finite secant slope", "directed", "many-to-one"],
      ["r3", "transforms", "shrinking nonzero secants approaches the tangent estimate", "directed", "many-to-one"],
      ["r4", "supports", "the tangent estimate supports the local velocity interpretation", "directed", "one-to-one"],
      ["r5", "invalidates", "a zero denominator or wide interval invalidates the claimed local velocity", "directed", "many-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Position is defined on both sides of the stated time and all time values use seconds."],
      ["c2", "boundary", "Each secant uses a nonzero time increment that approaches zero; zero itself is never used as the divisor."],
      ["c3", "criterion", "The accepted derivative has the correct sign and is reported in metres per second."],
      ["c4", "operating-state", "The altered case uses either a zero denominator or an interval too wide to represent local change."]
    ],
    failureMechanism:
      "The quotient is evaluated outside its nonzero-interval boundary or is mistaken for a local limit.",
    failureConsequence:
      "The reported velocity is undefined or describes only a coarse average rather than the requested instant.",
    failureCriterion:
      "Reject a local velocity claim unless the nonzero interval, limiting argument, sign and metres-per-second unit are explicit.",
    conceptualSteps: [
      "Pair one time increment in seconds with the signed position increment in metres.",
      "Form the secant slope only while the time increment remains nonzero.",
      "Compare successively smaller secants to identify the tangent estimate.",
      "Interpret that tangent estimate as signed local velocity in metres per second.",
      "Reject calculations that divide by zero or use a coarse interval as an instantaneous result."
    ],
    example: {
      scenario:
        "A robot position record is sampled around a stated time, with displacement in metres and time in seconds.",
      givenLabel: "Local sample pair",
      givenValue: "signed position change over a shrinking nonzero time interval",
      givenUnit: "m and s",
      reasoning: [
        "Pair each signed position change with its matching nonzero time interval.",
        "Form secant slopes and inspect their trend as the interval narrows.",
        "Retain the limiting sign and convert the inherited dimensions to metres per second."
      ],
      outcome:
        "The local velocity is the limiting secant trend, stated with sign and metres-per-second units.",
      criterion:
        "The result must arise from nonzero intervals approaching zero and keep output-unit per input-unit dimensions.",
      verification:
        "Compare secants from both sides of the time and confirm they approach the same signed metres-per-second value."
    },
    counterexample: {
      scenario:
        "A learner inserts a zero time increment directly into the quotient and calls the resulting expression the derivative.",
      givenLabel: "Altered interval",
      givenValue: "zero divisor",
      givenUnit: "s",
      reasoning: [
        "The altered interval violates the nonzero denominator condition.",
        "No finite secant value exists at the substituted zero divisor.",
        "An undefined quotient cannot satisfy the signed metres-per-second derivative criterion."
      ],
      outcome:
        "Direct substitution produces no derivative value and supplies no local velocity evidence.",
      criterion:
        "A valid derivative uses a limit of defined secants, not division by zero.",
      verification:
        "Return to nonzero intervals on both sides and inspect whether their slopes converge."
    },
    misconception: {
      claim: "A derivative is obtained by setting the input increment equal to zero in the difference quotient.",
      mechanism:
        "The slogan about an infinitely small interval is misread as permission to divide by zero.",
      correction:
        "Keep the interval nonzero while computing secants, then reason about their limit as the interval approaches zero.",
      disconfirmingObservation:
        "At a zero time increment the quotient is undefined, even when nearby secant slopes approach a stable value."
    },
    assessmentMoves: [
      "staging the shrinking-secant argument before interpreting the quotient",
      "reconstructing local velocity after a zero-divisor attempt",
      "screening statements by sign, locality and inherited units",
      "separating a tangent conclusion from a wide-interval average",
      "showing why zero is a limit target rather than a permitted divisor",
      "pairing each local-change link with its mathematical boundary",
      "following the rate path from sampled interval to signed velocity",
      "exposing unit loss in the alternate local-change route"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E1-D04-L02",
    systemModel:
      "A definite integral accumulates many signed rate-times-width contributions across a declared interval, producing the quantity unit implied by integrand unit multiplied by input unit.",
    failurePattern:
      "Adding raw rate samples without multiplying by interval width breaks dimensions, and replacing signed contributions with absolute areas changes net accumulation.",
    visualExplanation:
      "A graph connects an integration interval, sampled rate, slice contribution, running signed sum and final accumulated displacement.",
    applicationTask:
      "Build a displacement estimate from a velocity trace, explain the refinement limit and distinguish net displacement from total distance.",
    terms: [
      ["t1", "Definite integral", "The limit of signed weighted sums over a stated interval.", "It returns net accumulation; it does not automatically return total magnitude."],
      ["t2", "Integrand", "The rate or density being accumulated, with its own physical unit.", "Its sample value must be multiplied by an input width before contributing to the total."],
      ["t3", "Signed accumulation", "Positive and negative slice contributions combined with their signs retained.", "Using absolute values answers a different question such as total distance."]
    ],
    entities: [
      ["e1", "input", "Time interval", "The start and end times, measured in seconds, over which velocity is accumulated."],
      ["e2", "state", "Velocity sample", "A signed velocity value measured in metres per second."],
      ["e3", "mechanism", "Weighted slice", "Velocity multiplied by a time width to produce a displacement contribution in metres."],
      ["e4", "observation", "Running signed sum", "The cumulative sum of positive and negative displacement slices."],
      ["e5", "decision", "Net displacement", "The definite-integral result reported in metres."]
    ],
    relations: [
      ["r1", "measures", "the time interval locates each signed velocity sample", "directed", "one-to-many"],
      ["r2", "transforms", "a velocity sample times its slice width becomes a displacement contribution", "directed", "many-to-one"],
      ["r3", "causes", "each weighted slice updates the running signed sum", "directed", "many-to-one"],
      ["r4", "compares", "refined running sums are compared for convergence", "undirected", "many-to-many"],
      ["r5", "supports", "a converged signed sum supports the net displacement decision", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "boundary", "The integration bounds are ordered in seconds and every velocity sample belongs to that interval."],
      ["c2", "assumption", "Each weighted contribution uses velocity in metres per second times a slice width in seconds."],
      ["c3", "criterion", "The accepted net accumulation is stable under refinement and is reported in metres with sign retained."],
      ["c4", "operating-state", "The altered calculation adds unweighted velocities or removes negative signs before accumulation."]
    ],
    failureMechanism:
      "The calculation discards slice width or sign, so it no longer represents the stated definite integral.",
    failureConsequence:
      "The total has the wrong dimensions or answers total distance instead of net displacement.",
    failureCriterion:
      "Reject the accumulation unless every sample is weighted by seconds, signs are retained and refinement is checked.",
    conceptualSteps: [
      "Declare the time interval and locate signed velocity samples inside it.",
      "Multiply each metres-per-second sample by its time width in seconds.",
      "Add the resulting metre-valued slices while preserving their signs.",
      "Compare successively refined running sums for stable net displacement.",
      "Reject an unweighted or absolute-only sum as a different mathematical quantity."
    ],
    example: {
      scenario:
        "A mobile robot velocity log crosses zero while displacement is required over a declared time interval.",
      givenLabel: "Velocity trace",
      givenValue: "signed samples with matching slice widths",
      givenUnit: "m/s and s",
      reasoning: [
        "Keep only samples inside the declared time bounds.",
        "Multiply every signed velocity sample by its associated time width.",
        "Sum the metre-valued slices and compare the result after refining the partition."
      ],
      outcome:
        "The converged signed sum represents net displacement in metres, including backward motion.",
      criterion:
        "Every contribution must have metre units and retain the velocity sign.",
      verification:
        "Refine the time slices and confirm that the signed displacement changes by less than the stated acceptance tolerance."
    },
    counterexample: {
      scenario:
        "A learner adds velocity samples directly and then reports the sum as displacement in metres.",
      givenLabel: "Unweighted samples",
      givenValue: "velocity values without time widths",
      givenUnit: "m/s",
      reasoning: [
        "The altered sum violates the rate-times-width condition.",
        "Adding metres-per-second values leaves metres-per-second dimensions rather than metres.",
        "A quantity with rate units cannot meet the displacement criterion."
      ],
      outcome:
        "The unweighted total is not a displacement and cannot be compared with a metre-valued result.",
      criterion:
        "A displacement contribution must equal velocity multiplied by elapsed time.",
      verification:
        "Inspect the unit of every summand before adding it and require metres for each slice."
    },
    misconception: {
      claim: "A definite integral of sampled velocity is found by adding the velocity values alone.",
      mechanism:
        "The graphical idea of area is remembered without the slice width that gives each rectangle its physical quantity.",
      correction:
        "Multiply each signed rate sample by its interval width, add the contributions and test refinement.",
      disconfirmingObservation:
        "The raw sample sum still has metres-per-second units, whereas displacement must have metre units."
    },
    assessmentMoves: [
      "assembling weighted slices before interpreting net accumulation",
      "repairing an unweighted velocity sum through dimensional tracing",
      "sorting claims by sign retention, interval membership and refinement",
      "diagnosing when total distance has replaced net displacement",
      "explaining how rate-times-width creates a metre-valued contribution",
      "aligning accumulation relations with bounds and convergence conditions",
      "tracing the signed-sum diagram across a zero crossing",
      "contrasting an absolute-area route with the net-displacement route"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E1-D04-L03",
    systemModel:
      "Partial derivatives isolate one input sensitivity at a time, then a declared direction or uncertainty model combines those local sensitivities into an output-change estimate.",
    failurePattern:
      "Changing several inputs while calling the result a partial derivative mixes effects, and combining sensitivities without compatible input scales or covariance assumptions overstates certainty.",
    visualExplanation:
      "A graph moves from an input vector to a held-variable slice, individual partial sensitivities, a direction or uncertainty description and the predicted output change.",
    applicationTask:
      "Explain how wheel radius and encoder scale separately affect a distance estimate, then combine them for a stated perturbation or uncertainty case.",
    terms: [
      ["t1", "Partial derivative", "The local output sensitivity to one input while the other declared inputs are held fixed.", "It is not a simultaneous finite change in every input."],
      ["t2", "Directional sensitivity", "The rate of output change along a stated direction in input space.", "The direction and coordinate scaling must be declared before the value is interpreted."],
      ["t3", "Uncertainty propagation", "A stated model that combines input uncertainties with local sensitivities.", "The combination depends on assumptions such as independence or covariance; it is not universal."]
    ],
    entities: [
      ["e1", "input", "Parameter vector", "Wheel radius and encoder scale expressed with their physical units."],
      ["e2", "constraint", "Held-variable slice", "The local comparison in which all but one parameter are fixed."],
      ["e3", "mechanism", "Partial sensitivities", "Output-per-input derivatives for radius and encoder scale."],
      ["e4", "state", "Direction or uncertainty model", "A declared perturbation direction or covariance assumption."],
      ["e5", "observation", "Predicted distance change", "The locally estimated change in metres with its stated basis."]
    ],
    relations: [
      ["r1", "constrains", "the parameter vector is restricted by the held-variable slice", "directed", "many-to-one"],
      ["r2", "measures", "the held-variable slice reveals each partial sensitivity", "directed", "one-to-many"],
      ["r3", "transforms", "the sensitivity set and declared direction produce a local change estimate", "directed", "many-to-one"],
      ["r4", "compares", "the predicted distance change is compared with a perturbed calculation", "undirected", "one-to-one"],
      ["r5", "invalidates", "an undeclared simultaneous change invalidates a claimed partial derivative", "directed", "many-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "When one partial derivative is taken, the other input coordinates and their units are held fixed."],
      ["c2", "boundary", "The perturbation is local enough that first-order sensitivity is an adequate approximation."],
      ["c3", "criterion", "The predicted distance change states metres and names either the direction or the uncertainty dependence assumption."],
      ["c4", "operating-state", "The altered case changes radius and encoder scale together without declaring a direction or covariance model."]
    ],
    failureMechanism:
      "Mixed input changes are attributed to one partial derivative and the combination rule is left unstated.",
    failureConsequence:
      "The reported sensitivity cannot be traced to one input and the predicted metre change lacks a defensible uncertainty basis.",
    failureCriterion:
      "Reject the estimate unless held variables, input units, local range and combination assumption are explicit.",
    conceptualSteps: [
      "Write the parameter vector with radius and encoder-scale units.",
      "Hold every non-target coordinate fixed to define one partial derivative.",
      "Repeat for the other coordinate and retain each output-per-input unit.",
      "Combine sensitivities only with a declared direction or uncertainty model.",
      "Reject a mixed perturbation that is presented as an isolated partial derivative."
    ],
    example: {
      scenario:
        "A distance model depends on wheel radius in metres and encoder scale in counts per revolution.",
      givenLabel: "Local parameter change",
      givenValue: "one coordinate perturbed while the other is fixed",
      givenUnit: "m and count/rev",
      reasoning: [
        "Freeze encoder scale while forming the radius partial sensitivity.",
        "Freeze radius while forming the encoder-scale partial sensitivity.",
        "Combine the two sensitivities with the explicitly stated perturbation direction."
      ],
      outcome:
        "The resulting first-order distance change is traceable to separate sensitivities and stated in metres.",
      criterion:
        "Each partial must hold the other coordinate fixed and the combination must name its direction or uncertainty assumption.",
      verification:
        "Perturb each input separately, compare predicted and recomputed distance changes, then test the declared combined case."
    },
    counterexample: {
      scenario:
        "Both wheel radius and encoder scale are changed together, but the output difference is labelled the radius partial derivative.",
      givenLabel: "Mixed perturbation",
      givenValue: "two coordinates changed simultaneously",
      givenUnit: "m and count/rev",
      reasoning: [
        "The altered case violates the held-variable condition.",
        "The output difference contains effects from both partial sensitivities.",
        "A mixed effect cannot satisfy the criterion for a radius-only partial derivative."
      ],
      outcome:
        "The calculation is a finite combined perturbation, not an isolated partial derivative.",
      criterion:
        "A partial derivative attributes local change to one coordinate while declared others remain fixed.",
      verification:
        "Restore encoder scale, repeat the radius perturbation alone and compare the result with the mixed change."
    },
    misconception: {
      claim: "A partial derivative can be estimated while every model input changes, because only the chosen numerator matters.",
      mechanism:
        "The held-variable definition is lost, so coupled output changes are assigned to one coordinate.",
      correction:
        "Vary one input at a time for each partial, then combine sensitivities using an explicit direction or uncertainty model.",
      disconfirmingObservation:
        "Restoring the non-target input changes the estimated partial, showing that the earlier value contained another input effect."
    },
    assessmentMoves: [
      "isolating one coordinate before composing the local sensitivity map",
      "recovering held-variable logic after a mixed perturbation",
      "filtering statements by coordinate units and declared combination rules",
      "distinguishing a directional change from a single-coordinate partial",
      "showing how separate sensitivities enter one bounded prediction",
      "matching sensitivity links to fixed-coordinate and local-range assumptions",
      "reading the parameter-to-prediction graph under independent perturbations",
      "revealing the mixed-input path that invalidates a partial claim"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E1-D04-L04",
    systemModel:
      "An ordinary differential equation supplies a derivative law for a state, while sufficient initial or boundary data select a particular trajectory with state units preserved over time.",
    failurePattern:
      "A derivative law without enough conditions describes a family rather than one prediction, and an inconsistent condition can select no valid trajectory.",
    visualExplanation:
      "A state graph links time, current state, derivative law, supplied condition and the resulting trajectory.",
    applicationTask:
      "Explain how a first-order motor-speed model and an initial speed determine one time response, including seconds and radians per second.",
    terms: [
      ["t1", "Ordinary differential equation", "A relation between one independent variable, a state and one or more derivatives of that state.", "It is a governing relation, not by itself a unique trajectory."],
      ["t2", "Initial condition", "A state value specified at a stated initial time.", "It selects a trajectory only when the differential problem is well posed and enough independent conditions are supplied."],
      ["t3", "Trajectory", "A state history that satisfies both the derivative law and all supplied conditions.", "A curve satisfying only the condition or only the law is incomplete."]
    ],
    entities: [
      ["e1", "input", "Time coordinate", "Elapsed time measured in seconds."],
      ["e2", "state", "Motor speed state", "Angular speed measured in radians per second."],
      ["e3", "mechanism", "Derivative law", "The first-order relationship that determines speed change per second."],
      ["e4", "constraint", "Initial speed condition", "The angular speed fixed at the declared initial time."],
      ["e5", "observation", "Speed trajectory", "The candidate radians-per-second history over time."]
    ],
    relations: [
      ["r1", "maps", "the time coordinate indexes the motor speed state", "directed", "one-to-one"],
      ["r2", "depends-on", "the speed derivative depends on the state through the governing law", "directed", "many-to-one"],
      ["r3", "transforms", "integrating the derivative law generates a family of speed trajectories", "directed", "one-to-many"],
      ["r4", "constrains", "the initial speed condition selects one member of the trajectory family", "directed", "one-to-one"],
      ["r5", "invalidates", "missing or inconsistent conditions invalidate a unique speed prediction", "directed", "many-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Time uses seconds and motor speed uses radians per second throughout the derivative law."],
      ["c2", "boundary", "The first-order model is applied only over the operating range where its stated parameters are treated as constant."],
      ["c3", "criterion", "An accepted trajectory satisfies the derivative law and the initial speed at the declared initial time."],
      ["c4", "operating-state", "The altered problem omits the initial speed or supplies a value inconsistent with the candidate trajectory."]
    ],
    failureMechanism:
      "The solver treats a family generated by the differential law as a unique response without applying sufficient consistent conditions.",
    failureConsequence:
      "Several different speed histories remain possible, or the proposed history violates the stated initial speed.",
    failureCriterion:
      "Reject a claimed motor response unless the derivative law, units, model range and selecting condition all agree.",
    conceptualSteps: [
      "Name time as the independent variable and motor speed as the state with units.",
      "Write the first-order derivative law that links speed to its time rate of change.",
      "Recognise that integrating the law initially produces a family of trajectories.",
      "Apply the initial speed to select and check one trajectory.",
      "Reject uniqueness when the condition is missing or inconsistent."
    ],
    example: {
      scenario:
        "A first-order motor model is given together with angular speed at time zero.",
      givenLabel: "Initial speed",
      givenValue: "declared state at the initial time",
      givenUnit: "rad/s at s",
      reasoning: [
        "Confirm that every term in the derivative law has radians-per-second-per-second dimensions.",
        "Use the law to describe the family of candidate speed trajectories.",
        "Apply the initial speed and verify the selected trajectory at the initial time."
      ],
      outcome:
        "One speed trajectory remains, and it satisfies both the first-order law and the initial speed.",
      criterion:
        "The trajectory must satisfy the differential equation over the stated range and the condition at its stated time.",
      verification:
        "Differentiate the candidate trajectory, substitute it into the law and separately evaluate its initial value."
    },
    counterexample: {
      scenario:
        "A first-order speed equation is supplied without any initial speed, yet one numerical trajectory is asserted.",
      givenLabel: "Missing selector",
      givenValue: "no initial state",
      givenUnit: null,
      reasoning: [
        "The altered problem leaves the trajectory-selection condition absent.",
        "The derivative law therefore permits a family distinguished by an integration constant.",
        "No single family member can meet a condition that was never supplied."
      ],
      outcome:
        "The governing law is meaningful, but the claimed unique speed history is unsupported.",
      criterion:
        "A first-order initial-value problem needs one independent initial state to select a unique candidate.",
      verification:
        "Exhibit two distinct trajectories that satisfy the same derivative law but have different initial speeds."
    },
    misconception: {
      claim: "Writing an ordinary differential equation automatically determines one complete time response.",
      mechanism:
        "The integration constant or equivalent free state is overlooked when the derivative law is integrated.",
      correction:
        "Count the independent conditions required, apply them at declared locations and verify both law and conditions.",
      disconfirmingObservation:
        "Two trajectories with different initial speeds can satisfy the same first-order derivative law."
    },
    assessmentMoves: [
      "ordering state definition, derivative law and trajectory selection",
      "restoring uniqueness after an initial condition is omitted",
      "screening trajectories against both differential and initial constraints",
      "diagnosing a curve that meets the start value but violates the law",
      "explaining why a governing equation describes a family before selection",
      "pairing each response relation with its unit or well-posedness condition",
      "following the state-law-condition graph to one admissible response",
      "exposing the free-constant route in the condition-free graph"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E1-D04-L05",
    systemModel:
      "A matrix maps an input vector to an output vector, while an eigenvector is a nonzero direction preserved by that mapping and its eigenvalue is the corresponding scale factor.",
    failurePattern:
      "Treating every vector as an eigenvector ignores direction change, and accepting the zero vector makes the scale equation true without identifying a direction.",
    visualExplanation:
      "A graph connects an input vector, matrix action, transformed vector, direction comparison and eigenpair decision.",
    applicationTask:
      "Test whether a candidate mode shape is an eigenvector of a coupled linear model and state the dimensionless or unit-bearing scale interpretation.",
    terms: [
      ["t1", "Matrix transformation", "A linear mapping from an input vector to an output vector with declared coordinates and units.", "Matrix entries must be dimensionally compatible with the vector components they combine."],
      ["t2", "Eigenvector", "A nonzero vector whose direction is retained by a matrix transformation.", "The zero vector is excluded and a rotated direction is not an eigenvector."],
      ["t3", "Eigenvalue", "The scalar by which an eigenvector is stretched, reversed or collapsed under the transformation.", "Its unit follows the mapping and cannot be assumed dimensionless without checking."]
    ],
    entities: [
      ["e1", "input", "Candidate vector", "A nonzero coordinate vector proposed as a retained direction."],
      ["e2", "component", "Transformation matrix", "The linear operator with declared coordinate ordering and compatible units."],
      ["e3", "state", "Transformed vector", "The result of multiplying the matrix by the candidate vector."],
      ["e4", "observation", "Direction comparison", "A proportionality check between transformed and candidate vectors."],
      ["e5", "decision", "Eigenpair classification", "The accepted or rejected direction and its scale factor."]
    ],
    relations: [
      ["r1", "transforms", "the matrix acts on the candidate vector", "directed", "many-to-one"],
      ["r2", "maps", "matrix multiplication produces the transformed vector", "directed", "many-to-one"],
      ["r3", "compares", "the transformed direction is compared with the nonzero candidate direction", "undirected", "one-to-one"],
      ["r4", "supports", "a common proportional scale supports the eigenpair classification", "directed", "many-to-one"],
      ["r5", "invalidates", "a zero candidate or inconsistent component ratio invalidates the eigenvector claim", "directed", "many-to-one"]
    ],
    conditions: [
      ["c1", "boundary", "The candidate vector is nonzero and its component order matches the matrix coordinates."],
      ["c2", "assumption", "All matrix-vector products combine dimensionally compatible component quantities."],
      ["c3", "criterion", "One scalar must reproduce every transformed component from the candidate vector, including sign."],
      ["c4", "operating-state", "The altered case uses the zero vector or component ratios that do not share one scale factor."]
    ],
    failureMechanism:
      "The proportionality test is replaced by mere matrix multiplication, or the excluded zero vector is admitted.",
    failureConsequence:
      "A direction-changing vector is misclassified as a natural mode and its alleged eigenvalue differs by component.",
    failureCriterion:
      "Reject the eigenpair unless the vector is nonzero and one unit-consistent scalar satisfies every component.",
    conceptualSteps: [
      "Declare the nonzero candidate vector, coordinate order and component units.",
      "Multiply the transformation matrix by that vector.",
      "Compare transformed and original directions component by component.",
      "Accept one eigenvalue only when a common scalar explains every component.",
      "Reject the zero vector or inconsistent component ratios."
    ],
    example: {
      scenario:
        "A coupled two-coordinate model supplies a matrix and a nonzero candidate mode direction.",
      givenLabel: "Candidate mode",
      givenValue: "nonzero ordered component vector",
      givenUnit: "declared coordinate units",
      reasoning: [
        "Check that the candidate component order matches the matrix columns.",
        "Multiply the matrix by the candidate and retain signs and units.",
        "Compare each transformed component with the corresponding candidate component for one common scale."
      ],
      outcome:
        "The candidate is an eigenvector only if every component supports the same eigenvalue.",
      criterion:
        "The transformed vector must equal one scalar times the original nonzero vector.",
      verification:
        "Compute the residual between the transformed vector and the proposed scalar multiple and require every component to vanish within the stated tolerance."
    },
    counterexample: {
      scenario:
        "The zero vector is submitted as an eigenvector because multiplying it by any matrix returns zero.",
      givenLabel: "Candidate direction",
      givenValue: "all components zero",
      givenUnit: "declared coordinate units",
      reasoning: [
        "The altered candidate violates the nonzero-vector boundary.",
        "Its multiplication result contains no direction to compare.",
        "An arbitrary scalar equality cannot meet the one-direction eigenpair criterion."
      ],
      outcome:
        "The zero vector satisfies a trivial equality but is not an eigenvector.",
      criterion:
        "An eigenvector must represent a nonzero direction before scale can be interpreted.",
      verification:
        "Attempt to normalise the candidate; the zero norm prevents a direction from being formed."
    },
    misconception: {
      claim: "Every vector has an eigenvalue after it is multiplied by a matrix.",
      mechanism:
        "A transformed vector is mistaken for a scalar multiple without checking whether its direction changed.",
      correction:
        "Exclude the zero vector, compute the transform and require one scalar relation across every component.",
      disconfirmingObservation:
        "Different transformed-to-original component ratios show that no single eigenvalue exists for that vector."
    },
    assessmentMoves: [
      "sequencing matrix action before the proportional-direction test",
      "recovering a valid mode check after a zero-vector shortcut",
      "filtering eigenpair claims by coordinate order and common scale",
      "diagnosing inconsistent component ratios in a proposed mode",
      "explaining why direction preservation is stricter than obtaining an output",
      "matching transform relations to nonzero and proportionality conditions",
      "reading the candidate-transform-comparison diagram as one scale test",
      "revealing the directionless route created by the zero vector"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E1-D04-L06",
    systemModel:
      "A one-to-one forward function pairs each allowed input with a unique output so an inverse can reverse the mapping; where the forward slope is nonzero, the inverse slope is its reciprocal at the corresponding points.",
    failurePattern:
      "Inverting a many-to-one mapping without restricting its domain creates ambiguous outputs, while taking a reciprocal at a zero forward slope produces no finite inverse derivative.",
    visualExplanation:
      "A graph links a restricted domain point, forward function, output point, inverse function and corresponding reciprocal-slope decision.",
    applicationTask:
      "Explain when a calibrated sensor transfer can be inverted and how volts-per-unit slope becomes unit-per-volt inverse sensitivity.",
    terms: [
      ["t1", "Inverse function", "A mapping that returns the unique original input associated with an output of a one-to-one forward function.", "It requires a declared domain on which the forward mapping is one-to-one."],
      ["t2", "One-to-one mapping", "A mapping in which distinct allowed inputs do not share the same output.", "Global one-to-one behaviour is not implied by a locally monotonic patch unless that patch is the declared domain."],
      ["t3", "Inverse derivative", "The reciprocal of the nonzero forward derivative evaluated at corresponding input and output points.", "It is undefined as a finite reciprocal when the forward derivative is zero."]
    ],
    entities: [
      ["e1", "input", "Restricted sensor input", "The physical input on a domain where the calibration output is unique."],
      ["e2", "mechanism", "Forward calibration", "The mapping from physical input units to volts."],
      ["e3", "state", "Measured voltage", "The forward output that becomes the inverse input."],
      ["e4", "mechanism", "Inverse calibration", "The reverse mapping from volts to physical input units."],
      ["e5", "decision", "Inverse sensitivity", "The local physical-unit-per-volt slope at corresponding points."]
    ],
    relations: [
      ["r1", "maps", "the restricted sensor input enters the forward calibration", "directed", "one-to-one"],
      ["r2", "depends-on", "the measured voltage depends uniquely on the allowed forward input", "directed", "one-to-one"],
      ["r3", "transforms", "the inverse calibration maps measured voltage back to the unique input", "directed", "one-to-one"],
      ["r4", "measures", "the reciprocal forward slope determines inverse sensitivity at corresponding points", "directed", "one-to-one"],
      ["r5", "invalidates", "a repeated output or zero forward slope invalidates the claimed finite inverse derivative", "directed", "many-to-one"]
    ],
    conditions: [
      ["c1", "boundary", "The declared forward domain is one-to-one and all paired points lie inside it."],
      ["c2", "assumption", "The forward calibration is differentiable at the corresponding input and its local slope is nonzero."],
      ["c3", "criterion", "The inverse returns the original input and its slope unit is physical-input unit per volt."],
      ["c4", "operating-state", "The altered case includes repeated voltages from different inputs or a zero forward slope."]
    ],
    failureMechanism:
      "The reverse lookup is attempted where output does not identify one input or where reciprocal differentiation divides by zero.",
    failureConsequence:
      "The inverse gives multiple possible physical inputs or an unbounded rather than finite local sensitivity.",
    failureCriterion:
      "Reject the inverse claim unless the domain is one-to-one, points correspond and the forward slope is nonzero.",
    conceptualSteps: [
      "Restrict the physical-input domain until each measured voltage identifies at most one input.",
      "Apply the forward calibration to establish the corresponding input-voltage pair.",
      "Reverse that pair with the inverse calibration and recover the original input.",
      "Take the reciprocal of the nonzero forward slope and reverse its units.",
      "Reject ambiguity or a finite inverse slope claim at a zero forward derivative."
    ],
    example: {
      scenario:
        "A monotonic sensor calibration maps a restricted physical range to voltage with a nonzero local slope.",
      givenLabel: "Corresponding calibration point",
      givenValue: "one physical input paired with one voltage",
      givenUnit: "physical unit and V",
      reasoning: [
        "Confirm that no other allowed input produces the same voltage.",
        "Apply the inverse mapping and recover the original physical input.",
        "Reciprocate the nonzero forward slope and reverse volts-per-unit to unit-per-volt."
      ],
      outcome:
        "The inverse calibration is single-valued and its local sensitivity has physical-unit-per-volt dimensions.",
      criterion:
        "Forward then inverse composition must recover the input and the slope product must equal one in reciprocal units.",
      verification:
        "Compose both mappings at the calibration point and multiply their local slopes."
    },
    counterexample: {
      scenario:
        "Two allowed sensor inputs produce the same voltage, but one inverse value is selected without a domain restriction.",
      givenLabel: "Repeated output",
      givenValue: "one voltage paired with two inputs",
      givenUnit: "V and physical units",
      reasoning: [
        "The altered mapping violates the one-to-one domain condition.",
        "The measured voltage cannot select a unique original input.",
        "An ambiguous reverse lookup cannot satisfy the inverse recovery criterion."
      ],
      outcome:
        "No single inverse function exists on the stated domain.",
      criterion:
        "Every voltage in the inverse range must correspond to exactly one allowed forward input.",
      verification:
        "List all forward inputs that produce the chosen voltage and check whether more than one remains."
    },
    misconception: {
      claim: "Any formula can be inverted by swapping input and output symbols.",
      mechanism:
        "Symbol rearrangement hides repeated outputs and ignores the declared domain needed for a function.",
      correction:
        "Check one-to-one behaviour on a stated domain, verify composition and require a nonzero forward slope for reciprocal differentiation.",
      disconfirmingObservation:
        "The same measured voltage returns two possible physical inputs when the unrestricted forward mapping folds back."
    },
    assessmentMoves: [
      "ordering domain restriction before reverse calibration and slope reciprocity",
      "repairing an ambiguous lookup by isolating a one-to-one branch",
      "screening inverse claims through composition, correspondence and units",
      "diagnosing a reciprocal-slope claim at a flat forward point",
      "explaining why symbol exchange does not establish a reverse function",
      "matching forward and inverse links to uniqueness and nonzero-slope limits",
      "following a calibration pair through forward and reverse mappings",
      "showing how a repeated voltage splits the supposed inverse path"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E1-D04-L07",
    systemModel:
      "Sample evidence feeds a stated probability or statistical estimate, a numerical method approximates a defined model, and an optimiser compares feasible candidates against a declared objective.",
    failurePattern:
      "Treating a sample statistic as certainty, accepting an unconverged numerical iterate or optimising outside the feasible set produces a precise-looking but unsupported engineering decision.",
    visualExplanation:
      "A graph connects sampled observations, an uncertainty summary, a numerical model update, a constrained objective comparison and a reported decision.",
    applicationTask:
      "Frame a noisy range-sensor calibration as sampled evidence, numerical fitting and constrained optimisation with explicit units and stopping rules.",
    terms: [
      ["t1", "Statistical estimate", "A quantity calculated from sampled data to describe or infer an uncertain population feature.", "It inherits sampling assumptions and is not a guarantee about every future observation."],
      ["t2", "Numerical approximation", "A computed estimate produced by a finite algorithm for a model not solved exactly.", "Its credibility depends on error behaviour, stopping rules and problem conditioning."],
      ["t3", "Constrained optimum", "The feasible candidate with the best declared objective value among those considered by the model.", "It is relative to the objective, constraints and search evidence; it is not universal perfection."]
    ],
    entities: [
      ["e1", "input", "Range samples", "Repeated sensor errors measured in metres under a declared sampling procedure."],
      ["e2", "observation", "Uncertainty summary", "A sample centre and spread with metre-based units and sampling context."],
      ["e3", "mechanism", "Numerical model update", "One bounded iteration that changes calibration parameters."],
      ["e4", "constraint", "Feasible objective", "The loss comparison evaluated only for candidates satisfying declared bounds."],
      ["e5", "decision", "Calibration selection", "The chosen parameter set with residual evidence and stopping status."]
    ],
    relations: [
      ["r1", "measures", "the range samples determine the sample uncertainty summary", "directed", "many-to-one"],
      ["r2", "compares", "the uncertainty summary is compared with the calibration residual model", "undirected", "many-to-many"],
      ["r3", "transforms", "a numerical update changes the candidate calibration parameters", "directed", "many-to-one"],
      ["r4", "constrains", "the feasible objective excludes candidates outside declared parameter bounds", "directed", "many-to-one"],
      ["r5", "supports", "converged feasible residual evidence supports the calibration selection", "directed", "many-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Range errors are sampled in metres under the stated operating procedure without silently dropping valid observations."],
      ["c2", "boundary", "The numerical update remains inside the declared parameter bounds and uses a stated convergence or iteration stopping rule."],
      ["c3", "criterion", "The selected calibration is feasible, reports residual units and records why the numerical search stopped."],
      ["c4", "operating-state", "The altered case uses a biased sample, an unconverged iterate or a candidate outside the feasible bounds."]
    ],
    failureMechanism:
      "Uncertainty, approximation error or feasibility is omitted while a single candidate is treated as certain and final.",
    failureConsequence:
      "The calibration may fit a biased subset, still be changing materially or violate a physical parameter limit.",
    failureCriterion:
      "Reject the choice unless sampling scope, residual units, feasibility and the stopping basis are all recorded.",
    conceptualSteps: [
      "Describe how metre-valued range errors were sampled before calculating a statistic.",
      "Use the uncertainty summary to frame what the residual evidence can and cannot claim.",
      "Apply a bounded numerical update to the calibration parameters.",
      "Compare only feasible candidates under the declared objective and stopping rule.",
      "Reject a precise-looking result that hides bias, non-convergence or constraint violation."
    ],
    example: {
      scenario:
        "A set of range errors is used to fit a calibration parameter inside a physically allowed interval.",
      givenLabel: "Calibration dataset",
      givenValue: "sampled residuals with a bounded parameter search",
      givenUnit: "m",
      reasoning: [
        "State the sample procedure and calculate an uncertainty summary in metres.",
        "Update the calibration model while retaining the feasible parameter interval.",
        "Stop only at the declared criterion and compare residual evidence for the feasible candidate."
      ],
      outcome:
        "The selected calibration is a bounded numerical estimate with recorded uncertainty and stopping evidence.",
      criterion:
        "Selection requires representative sample scope, feasible parameters and a declared convergence or stopping result.",
      verification:
        "Re-run from a second admissible starting point and compare the final feasible objective and residual pattern."
    },
    counterexample: {
      scenario:
        "An optimiser returns a lower loss outside the allowed calibration range, and that infeasible candidate is reported as best.",
      givenLabel: "Out-of-range candidate",
      givenValue: "objective reduced beyond the physical bound",
      givenUnit: "parameter unit",
      reasoning: [
        "The altered candidate violates the feasible-parameter operating state.",
        "Its lower objective is not comparable within the constrained decision set.",
        "An infeasible point cannot satisfy the calibration-selection criterion."
      ],
      outcome:
        "The reported point may minimise an unconstrained expression but is not a constrained optimum.",
      criterion:
        "Only candidates satisfying every declared constraint can compete for the optimum.",
      verification:
        "Project the candidate against each bound and repeat the objective comparison using feasible points only."
    },
    misconception: {
      claim: "The smallest objective value returned by a program is automatically the true engineering optimum.",
      mechanism:
        "The numerical stopping state, sample uncertainty and feasibility conditions are hidden behind one scalar output.",
      correction:
        "Inspect sampling assumptions, convergence evidence and every constraint before interpreting the best feasible objective.",
      disconfirmingObservation:
        "A lower reported loss lies outside the allowed parameter interval and changes again when the iteration continues."
    },
    assessmentMoves: [
      "sequencing sample description, bounded iteration and feasible selection",
      "recovering a defensible result after an infeasible minimum appears",
      "screening claims through sampling scope, residual units and stopping status",
      "diagnosing whether bias, non-convergence or infeasibility caused the failure",
      "explaining how uncertainty and numerical error limit an optimisation claim",
      "matching estimation, update and objective links to their governing checks",
      "reading the evidence-to-selection graph within parameter bounds",
      "exposing the shortcut from lower loss to an infeasible decision"
    ],
    variant: 6
  }
] satisfies readonly LessonSource[];

export const academyLessonTeachingProfileV2PlansE1D04 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE1D04 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE1D04,
    academyLessonTeachingProfileV2PlansE1D04
  );

export const academyLessonTeachingProfilesV2E1D04 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE1D04.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (!seed) {
        throw new Error(`Missing materialised D04 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E1D04;
