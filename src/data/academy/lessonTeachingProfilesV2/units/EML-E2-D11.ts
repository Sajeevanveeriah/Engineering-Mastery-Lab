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
      `Trace the electrical path for ${firstTerm} through ${secondTerm} until ${evidence} is predicted during ${move}:`,
      `The trace closes when ${firstTerm}, ${secondTerm} and ${evidence} obey the same circuit references throughout ${move}.`,
      `The trace remains open when ${evidence} is asserted before the ${secondTerm} relation is solved.`,
      `Draw the ${firstTerm} source, polarity or direction before applying ${move}.`,
      `Carry the ${secondTerm} electrical relation towards the expected ${evidence}.`,
      `Solve the ${firstTerm} path in circuit order and annotate ${secondTerm}.`,
      `Close the trace by reconciling ${evidence} with the original ${firstTerm} reference.`
    ],
    [
      `Debug the altered circuit by walking from ${evidence} back to ${firstTerm} during ${move}:`,
      `The circuit repair is supported when the changed ${evidence} leads to one corrected ${secondTerm} condition and a consistent ${firstTerm}.`,
      `The circuit repair is unsupported when ${evidence} changes but the ${secondTerm} electrical cause is never identified.`,
      `Freeze the measured ${evidence} and inspect its circuit reference first.`,
      `Walk backwards through ${secondTerm} until the invalid ${firstTerm} assumption appears.`,
      `Correct the ${firstTerm} reference or limit before recalculating ${secondTerm}.`,
      `Repeat ${move} and require the new ${evidence} to close the circuit check.`
    ],
    [
      `Test each electrical claim about ${firstTerm} against ${secondTerm} and ${evidence} while ${move}:`,
      `A passing claim conserves the ${firstTerm} reference through ${secondTerm} and agrees with ${evidence}.`,
      `A failing claim quotes ${evidence} while discarding the circuit condition attached to ${secondTerm}.`,
      `Write the ${firstTerm} polarity, direction or state beside every candidate claim.`,
      `Check whether ${secondTerm} remains valid at the operating point shown by ${evidence}.`,
      `Eliminate the ${firstTerm} claim that cannot close its electrical path during ${move}.`,
      `Retain only the claim whose predicted ${evidence} matches the circuit observation.`
    ],
    [
      `Localise the circuit fault revealed by ${evidence} as ${move} challenges ${firstTerm}:`,
      `The fault is localised when ${evidence} distinguishes the broken ${secondTerm} relation from a valid ${firstTerm} reference.`,
      `The fault remains vague when ${evidence} is named without an electrical mechanism involving ${secondTerm}.`,
      `Measure where ${evidence} first departs from the bounded circuit prediction.`,
      `Follow that departure through ${secondTerm} towards ${firstTerm}.`,
      `Separate the conducting or active ${secondTerm} path from the blocked path.`,
      `Select the ${firstTerm} diagnosis that reproduces ${evidence} under ${move}.`
    ],
    [
      `Explain the circuit mechanism by relating ${firstTerm}, ${secondTerm} and ${evidence} during ${move}:`,
      `A complete circuit explanation states how ${firstTerm} drives or constrains ${secondTerm} before ${evidence} is observed.`,
      `A circuit explanation is incomplete when ${firstTerm} and ${secondTerm} are defined but no electrical path reaches ${evidence}.`,
      `State the voltage, current, logic or energy boundary represented by ${firstTerm}.`,
      `Describe how ${secondTerm} changes the circuit quantity visible in ${evidence}.`,
      `Link ${firstTerm} to ${secondTerm} with the governing electrical relation during ${move}.`,
      `Finish by applying the ${evidence} limit that accepts the circuit state.`
    ],
    [
      `Match the circuit evidence for ${firstTerm} and ${secondTerm} while ${move}:`,
      `Each correct match couples a ${firstTerm} condition to the ${secondTerm} relation measured by ${evidence}.`,
      `A wrong match assigns ${evidence} to an electrical condition that cannot influence ${secondTerm}.`,
      `Pair the ${firstTerm} reference with the first circuit relation it governs.`,
      `Pair ${secondTerm} with the operating limit visible in ${evidence}.`,
      `Check every ${firstTerm} pair by substituting it into the ${secondTerm} circuit relation.`,
      `Reject the pair when its predicted ${evidence} violates the electrical observation.`
    ],
    [
      `Follow the circuit diagram from ${firstTerm} through ${secondTerm} to ${evidence} during ${move}:`,
      `The valid circuit path reaches ${evidence} without changing the declared ${firstTerm} reference or bypassing ${secondTerm}.`,
      `The invalid circuit path treats a suppressed ${secondTerm} branch as though it still carries ${firstTerm}.`,
      `Place the ${firstTerm} reference on the source or input node.`,
      `Follow the conducting ${secondTerm} relation towards the measurement node ${evidence}.`,
      `Mark the branch that ${move} opens, closes or limits between ${firstTerm} and ${secondTerm}.`,
      `Choose the circuit path whose terminal ${evidence} agrees with ${firstTerm}.`
    ],
    [
      `Recalculate the alternate electrical state of ${secondTerm} after ${move}:`,
      `The recalculated state is credible when ${secondTerm} still relates ${firstTerm} to the observed ${evidence}.`,
      `The recalculated state is false when the original ${evidence} is reused after ${firstTerm} leaves its electrical limit.`,
      `Write the altered ${secondTerm} state beside the circuit element.`,
      `Identify which ${firstTerm} assumption no longer supplies or constrains ${secondTerm}.`,
      `Propagate the altered ${secondTerm} value or state forward to new ${evidence}.`,
      `Accept the alternate circuit only when ${evidence} satisfies the remaining ${firstTerm} boundary.`
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
    lessonId: "EML-E2-D11-L01",
    systemModel:
      "A DC circuit relates charge flow, voltage, resistance and power through a declared network and reference directions, while conservation connects source energy to component dissipation.",
    failurePattern:
      "Substituting numbers into Ohm's law without identifying the component voltage, current direction or power sign can produce a plausible value for the wrong electrical quantity.",
    visualExplanation:
      "A circuit-energy graph links source voltage through resistor current and voltage drop to dissipated power, temperature evidence and an accepted operating point.",
    applicationTask:
      "Analyse a simple resistive robot load from voltage and resistance to current and power, including reference directions and component limits.",
    terms: [
      [
        "t1",
        "electric current",
        "Electric current is the rate of charge flow through a defined surface and reference direction.",
        "A current value has no complete sign meaning until its reference direction is declared."
      ],
      [
        "t2",
        "voltage",
        "Voltage is electric potential energy difference per unit charge between two points.",
        "Voltage is measured across two nodes, not at one isolated point without a reference."
      ],
      [
        "t3",
        "electrical power",
        "Electrical power is the rate at which a component absorbs or delivers electrical energy.",
        "The sign depends on voltage polarity and current reference under the chosen convention."
      ]
    ],
    entities: [
      ["e1", "input", "DC source and load data", "Source voltage, load resistance, polarity and component ratings."],
      ["e2", "state", "Load current", "Charge-flow rate established by the applied load voltage and resistance."],
      ["e3", "mechanism", "Resistive voltage-current relation", "Ohm's-law relation connecting voltage, current and resistance."],
      ["e4", "observation", "Power and thermal evidence", "Calculated absorption plus measured voltage, current and temperature."],
      ["e5", "decision", "Accepted DC operating point", "Network state that satisfies electrical and thermal component limits."]
    ],
    relations: [
      ["r1", "maps", "DC source and load data map into a referenced load current.", "directed", "one-to-one"],
      ["r2", "constrains", "The load current is constrained by the resistive voltage-current relation.", "directed", "one-to-one"],
      ["r3", "transforms", "The voltage-current relation transforms electrical input into power and thermal evidence.", "directed", "one-to-many"],
      ["r4", "compares", "Power and thermal evidence are compared with the component ratings.", "directed", "many-to-one"],
      ["r5", "invalidates", "A wrong polarity, branch or unit invalidates the accepted operating point.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "The network, voltage polarity, current direction, resistance and units are explicit."],
      ["c2", "operating-state", "The resistor is treated within its stated approximately ohmic operating range."],
      ["c3", "criterion", "Calculated and measured current, power and temperature remain within ratings."],
      ["c4", "boundary", "Wrong references, non-ohmic behaviour or exceeded ratings block acceptance."]
    ],
    failureMechanism:
      "A formula is detached from the component terminals, references and operating range that give it meaning.",
    failureConsequence:
      "Current or power is assigned to the wrong branch and an overloaded component can be accepted.",
    failureCriterion:
      "Reject a DC result whose branch, polarity, direction, units or component rating cannot be traced.",
    conceptualSteps: [
      "Draw the network and mark voltage polarity and current reference.",
      "Apply the voltage-current relation to the correct component terminals.",
      "Calculate current and power with units and sign convention intact.",
      "Compare electrical and thermal evidence with component ratings.",
      "Reject operation when the model range or any rating is exceeded."
    ],
    example: {
      scenario:
        "A 12 V DC source is applied across a 6 ohm resistor under an ohmic steady-state assumption.",
      givenLabel: "Source voltage and resistance",
      givenValue: "12 V across 6 ohm",
      givenUnit: null,
      reasoning: [
        "The resistor current is voltage divided by resistance, so 12 divided by 6 gives 2 A.",
        "Absorbed power is voltage times current, so 12 times 2 gives 24 W.",
        "The 2 A and 24 W state is compared with source, resistor and thermal ratings."
      ],
      outcome:
        "The ideal steady-state current is 2 A and the resistor absorbs 24 W.",
      criterion:
        "The operating point is acceptable only if voltage, current, power and temperature ratings are satisfied.",
      verification:
        "Recompute power independently as current squared times resistance: 2 squared times 6 also gives 24 W."
    },
    counterexample: {
      scenario:
        "The source voltage is divided by a resistor from another parallel branch and the result is labelled total circuit current.",
      givenLabel: "Mismatched quantities",
      givenValue: "source voltage with other-branch resistance",
      givenUnit: null,
      reasoning: [
        "Ohm's law requires voltage and current belonging to the same element.",
        "A parallel network's total current is the sum of branch currents, not one unrelated quotient.",
        "The mismatched branch calculation cannot satisfy the network criterion."
      ],
      outcome:
        "The reported total current has no valid circuit binding.",
      criterion:
        "Every voltage-current relation must be tied to the same component or equivalent network.",
      verification:
        "Label branch voltages and currents, solve each compatible relation and reconcile source current by conservation."
    },
    misconception: {
      claim: "Any voltage divided by any resistance in a circuit gives the circuit current.",
      mechanism:
        "The topological relationship between component terminals, branches and reference directions is omitted.",
      correction:
        "Bind voltage, current and resistance to the same element or proven equivalent network before calculating.",
      disconfirmingObservation:
        "Different parallel branches share voltage but carry different currents because their resistances differ."
    },
    assessmentMoves: [
      "ordering references, Ohm relation, power calculation and rating checks",
      "repairing a branch-mismatched current calculation",
      "screening DC claims through terminal and unit bindings",
      "diagnosing whether topology, polarity or model range caused error",
      "explaining how voltage and current combine into signed power",
      "matching electrical relations to their component evidence",
      "reading source energy through the resistor to thermal acceptance",
      "rejecting formula substitution detached from circuit topology"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D11-L02",
    systemModel:
      "Kirchhoff current law conserves charge at nodes and Kirchhoff voltage law conserves energy around closed loops, producing sign-consistent equations for a connected network.",
    failurePattern:
      "Changing current or voltage signs between the diagram and equations makes conservation appear violated and can hide an algebraically self-consistent but physically wrong solution.",
    visualExplanation:
      "A network map follows referenced branch currents into a node balance, then referenced element voltages around a loop and finally reconciles both equation sets.",
    applicationTask:
      "Write and check node and loop equations for a small robot power network using one consistent sign convention.",
    terms: [
      [
        "t1",
        "node equation",
        "A node equation sets the signed sum of currents at one connected electrical node to zero.",
        "Its signs depend on declared current reference directions, not on whether a solved value later becomes negative."
      ],
      [
        "t2",
        "loop equation",
        "A loop equation sets the signed sum of voltage rises and drops around a closed path to zero.",
        "Element polarity and traversal direction must remain consistent through the entire path."
      ],
      [
        "t3",
        "reference direction",
        "A reference direction is an assumed positive direction used to define current or voltage signs.",
        "A negative solution reverses the actual direction; it does not make the original reference invalid."
      ]
    ],
    entities: [
      ["e1", "input", "Referenced circuit graph", "Nodes, branches, element values, current arrows and voltage polarities."],
      ["e2", "mechanism", "Charge balance equations", "Kirchhoff current equations written at independent nodes."],
      ["e3", "mechanism", "Energy balance equations", "Kirchhoff voltage equations written around independent loops."],
      ["e4", "observation", "Solved branch state", "Currents and voltages with signs relative to the declared references."],
      ["e5", "decision", "Conserved network solution", "Solution accepted after node, loop, units and element relations reconcile."]
    ],
    relations: [
      ["r1", "routes", "The referenced circuit graph routes branch currents into charge-balance equations.", "directed", "one-to-many"],
      ["r2", "depends-on", "Charge-balance equations depend on compatible energy-balance and element equations.", "directed", "many-to-many"],
      ["r3", "supports", "The combined conservation equations support the solved branch state.", "directed", "many-to-one"],
      ["r4", "compares", "The solved branch state is compared back with every node and loop equation.", "directed", "many-to-many"],
      ["r5", "invalidates", "A changed sign convention invalidates the claimed conserved solution.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Every branch current and element voltage has one fixed reference."],
      ["c2", "operating-state", "Independent node, loop and element equations describe the same circuit graph."],
      ["c3", "criterion", "The solved state satisfies charge, energy, units and element relations."],
      ["c4", "boundary", "An omitted branch or inconsistent sign blocks acceptance."]
    ],
    failureMechanism:
      "Reference arrows and polarities are silently changed while equations are assembled or interpreted.",
    failureConsequence:
      "Residual current or voltage appears at a node or loop and the reported branch direction is unreliable.",
    failureCriterion:
      "Reject a solution that does not resubstitute to zero residual in every independent conservation equation.",
    conceptualSteps: [
      "Mark one current arrow and voltage polarity for every branch element.",
      "Write signed current balances at independent nodes.",
      "Write signed voltage balances around independent loops.",
      "Solve and interpret negative values relative to the original references.",
      "Resubstitute the solution into node, loop and element equations."
    ],
    example: {
      scenario:
        "At a node, 5 A enters while a known 2 A branch and an unknown branch leave.",
      givenLabel: "Referenced node currents",
      givenValue: "5 A in, 2 A out, unknown out",
      givenUnit: null,
      reasoning: [
        "Using entering positive, the node equation is 5 minus 2 minus the unknown equal to zero.",
        "Solving gives an unknown leaving current of 3 A.",
        "The check is 5 A entering equals 2 A plus 3 A leaving."
      ],
      outcome:
        "The unknown branch carries 3 A in the declared leaving direction.",
      criterion:
        "The signed current sum at the node must equal zero.",
      verification:
        "Reconcile independently by total inflow equals total outflow: 5 A equals 5 A."
    },
    counterexample: {
      scenario:
        "The unknown branch arrow points out of the node in the diagram but is treated as entering halfway through the algebra.",
      givenLabel: "Sign handling",
      givenValue: "reference changed mid-solution",
      givenUnit: null,
      reasoning: [
        "The equation no longer represents the arrows on the circuit graph.",
        "A positive result cannot be interpreted consistently against the original branch.",
        "The node residual check exposes the sign change."
      ],
      outcome:
        "The branch result is not a conserved, interpretable solution.",
      criterion:
        "References remain fixed from diagram through verification.",
      verification:
        "Restore the original arrow, rewrite the equation once and resubstitute every solved current."
    },
    misconception: {
      claim: "A negative current answer means the circuit equations are wrong.",
      mechanism:
        "The assumed reference direction is mistaken for a prediction that actual current must follow it.",
      correction:
        "Keep references fixed and interpret a negative value as actual flow opposite the arrow.",
      disconfirmingObservation:
        "The negative referenced current makes every node and loop residual exactly zero."
    },
    assessmentMoves: [
      "sequencing graph references, node equations, loop equations and residuals",
      "repairing a solution after a branch sign changes mid-calculation",
      "screening network claims through charge and energy conservation",
      "diagnosing the first inconsistent arrow or polarity",
      "explaining how a negative solution retains its reference meaning",
      "matching node and loop equations to their graph paths",
      "reading a circuit graph into a conserved branch state",
      "rejecting algebra that cannot be resubstituted into the original network"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D11-L03",
    systemModel:
      "Capacitors and inductors store field energy, and their voltage-current relations create frequency-dependent magnitude and phase represented through AC impedance.",
    failurePattern:
      "Treating a capacitor or inductor as a fixed resistor removes frequency and phase, so a filter or transient prediction can be correct only at an accidental operating point.",
    visualExplanation:
      "A frequency-response graph links sinusoidal input frequency through component impedance and phase to output magnitude, cutoff evidence and an accepted operating band.",
    applicationTask:
      "Predict and verify the cutoff behaviour of a first-order RC filter used ahead of a robot sensor input.",
    terms: [
      [
        "t1",
        "capacitive reactance",
        "Capacitive reactance magnitude decreases as frequency or capacitance increases.",
        "It is part of a complex impedance and does not describe phase by magnitude alone."
      ],
      [
        "t2",
        "inductive reactance",
        "Inductive reactance magnitude increases as frequency or inductance increases.",
        "A real inductor also has resistance, parasitics and saturation limits."
      ],
      [
        "t3",
        "cutoff frequency",
        "Cutoff frequency is a defined transition point in a frequency response, commonly where power ratio is one half for a first-order filter.",
        "It does not separate perfect pass and complete rejection."
      ]
    ],
    entities: [
      ["e1", "input", "AC source and component values", "Input amplitude, frequency, resistance, capacitance and inductance."],
      ["e2", "state", "Frequency-dependent impedance", "Complex opposition and phase contributed by circuit elements."],
      ["e3", "mechanism", "Voltage division and field storage", "Network relation producing magnitude, phase and transient energy exchange."],
      ["e4", "observation", "Frequency-response evidence", "Measured gain, phase and transition across frequency."],
      ["e5", "decision", "Accepted filter band", "Operating band satisfying attenuation, phase and component limits."]
    ],
    relations: [
      ["r1", "causes", "AC source frequency and component values cause a frequency-dependent impedance state.", "directed", "many-to-one"],
      ["r2", "transforms", "The impedance state transforms voltage division and field energy exchange.", "directed", "one-to-many"],
      ["r3", "maps", "The network mechanism maps input frequency to measured gain and phase.", "directed", "many-to-many"],
      ["r4", "compares", "Frequency-response evidence is compared with the required filter band.", "directed", "many-to-one"],
      ["r5", "invalidates", "Ignoring frequency, phase or non-ideal limits invalidates the accepted band.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Waveform, frequency range, component values and output node are explicit."],
      ["c2", "operating-state", "Linear component models remain valid within voltage, current and frequency limits."],
      ["c3", "criterion", "Measured gain and phase meet the requirement across the declared band."],
      ["c4", "boundary", "Parasitics, saturation or omitted phase outside the model block acceptance."]
    ],
    failureMechanism:
      "Reactive component behaviour is collapsed into one frequency-independent scalar.",
    failureConsequence:
      "The predicted gain and phase differ from the physical filter as frequency changes.",
    failureCriterion:
      "Reject a filter claim lacking a declared frequency band, output node and applicable component model.",
    conceptualSteps: [
      "Define input waveform, frequency band, component values and output node.",
      "Calculate frequency-dependent impedance with magnitude and phase.",
      "Apply network division and field-energy relations.",
      "Measure gain and phase across the required band.",
      "Limit conclusions where non-ideal component behaviour becomes material."
    ],
    example: {
      scenario:
        "A first-order RC low-pass filter uses 10 kOhm and 1 microfarad.",
      givenLabel: "Resistance and capacitance",
      givenValue: "10 kOhm and 1 uF",
      givenUnit: null,
      reasoning: [
        "The time constant is 10,000 ohm times 0.000001 F, which is 0.010 s.",
        "Cutoff frequency is one divided by 2 pi times 0.010, giving about 15.9 Hz.",
        "Measured gain and phase around 15.9 Hz are compared with the first-order model."
      ],
      outcome:
        "The ideal first-order cutoff frequency is approximately 15.9 Hz.",
      criterion:
        "The filter is accepted only if measured response meets the required band and component limits.",
      verification:
        "Check independently that angular cutoff is 1 divided by 0.010 s, or 100 rad/s, then divide by 2 pi."
    },
    counterexample: {
      scenario:
        "The capacitor is replaced by its low-frequency reactance value and that fixed resistance is used across the entire frequency sweep.",
      givenLabel: "Altered model",
      givenValue: "fixed capacitor resistance",
      givenUnit: null,
      reasoning: [
        "Capacitive impedance changes inversely with frequency.",
        "A fixed scalar also removes the capacitor's phase relation.",
        "The resulting sweep cannot reproduce the actual response."
      ],
      outcome:
        "The predicted filter band is invalid away from the chosen frequency.",
      criterion:
        "Reactive impedance must retain frequency and phase over the assessed band.",
      verification:
        "Calculate impedance at two separated frequencies and compare with measured gain and phase."
    },
    misconception: {
      claim: "A capacitor is just a resistor whose value is set once.",
      mechanism:
        "Frequency, phase and stored electric-field energy are removed from the component model.",
      correction:
        "Use the voltage-current relation or complex impedance over the stated frequency range.",
      disconfirmingObservation:
        "The same capacitor passes high-frequency changes differently from low-frequency changes."
    },
    assessmentMoves: [
      "sequencing source frequency, impedance, division and response checks",
      "repairing a fixed-reactance model across a frequency sweep",
      "screening AC claims for magnitude, phase and model range",
      "diagnosing whether parasitic or omitted frequency caused mismatch",
      "explaining how field storage creates frequency response",
      "matching impedance relations to measured gain and phase",
      "reading the response graph from source frequency to accepted band",
      "rejecting fixed-resistor substitution for a reactive component"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D11-L04",
    systemModel:
      "Diodes conduct asymmetrically and transistors use a control signal to regulate current, enabling rectification, switching and amplification within voltage, current, power and thermal limits.",
    failurePattern:
      "Treating a diode as an ideal one-way wire or a transistor as a lossless switch hides forward drop, drive requirements, switching transitions and dissipation.",
    visualExplanation:
      "A switching-path graph follows source and control through semiconductor state, load current, device voltage and thermal evidence to a protected operating decision.",
    applicationTask:
      "Design and check a beginner transistor-controlled load with a diode path, explicit drive, current limiting and device ratings.",
    terms: [
      [
        "t1",
        "forward bias",
        "Forward bias is a polarity condition that encourages diode conduction according to its device characteristic.",
        "It does not imply zero voltage drop or unlimited current."
      ],
      [
        "t2",
        "transistor drive",
        "Transistor drive is the gate or base condition used to establish a desired switching or analogue state.",
        "A logic voltage alone is insufficient unless charge, current and threshold margins are verified."
      ],
      [
        "t3",
        "safe operating area",
        "Safe operating area bounds simultaneous device voltage, current, power and time conditions.",
        "Separate maximum ratings cannot always be reached at the same time."
      ]
    ],
    entities: [
      ["e1", "input", "Source, control and load duty", "Supply voltage, load current, switching rate and control capability."],
      ["e2", "component", "Diode-transistor path", "Semiconductor arrangement, current limiting and protective path."],
      ["e3", "state", "Conduction and switching state", "Device voltage, current, charge and transition behaviour."],
      ["e4", "observation", "Load and thermal evidence", "Measured current, waveform, device drop and temperature."],
      ["e5", "decision", "Protected semiconductor stage", "Circuit accepted within electrical, timing and thermal ratings."]
    ],
    relations: [
      ["r1", "constrains", "Source, control and load duty constrain the diode-transistor path.", "directed", "many-to-many"],
      ["r2", "causes", "The semiconductor path causes a conduction and switching state under drive.", "directed", "one-to-many"],
      ["r3", "transforms", "The switching state transforms source energy into load and thermal evidence.", "directed", "one-to-many"],
      ["r4", "supports", "Bounded load and thermal evidence support the protected-stage decision.", "directed", "many-to-one"],
      ["r5", "invalidates", "Excess current, voltage, transition loss or temperature invalidates ideal-switch acceptance.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Supply, load, control drive, switching rate and references are declared."],
      ["c2", "operating-state", "Device models include relevant forward drop, drive and transition behaviour."],
      ["c3", "criterion", "Waveform, current, voltage, power and temperature remain inside rated limits."],
      ["c4", "boundary", "Avalanche, insufficient drive, excess dissipation or missing current limit blocks acceptance."]
    ],
    failureMechanism:
      "Finite semiconductor voltage, drive and switching energy are removed from an idealised state model.",
    failureConsequence:
      "Load current can be uncontrolled and the device can overheat or fail during steady or transient operation.",
    failureCriterion:
      "Reject a stage without current limiting, adequate drive and simultaneous electrical-thermal rating evidence.",
    conceptualSteps: [
      "Define source, load, control, switching and protective requirements.",
      "Choose diode-transistor topology and explicit current-limiting paths.",
      "Predict conduction voltage, current, drive and switching transitions.",
      "Measure load waveform, device drop and temperature.",
      "Compare the complete trajectory with safe operating limits."
    ],
    example: {
      scenario:
        "A 5 V source drives an indicator diode approximated at 0.7 V through a 330 ohm resistor.",
      givenLabel: "Source, diode drop and resistance",
      givenValue: "5 V, 0.7 V, 330 ohm",
      givenUnit: null,
      reasoning: [
        "The resistor voltage is 5 minus 0.7, which is 4.3 V.",
        "Current is 4.3 divided by 330, giving approximately 0.0130 A or 13.0 mA.",
        "The current, diode dissipation and resistor power are compared with component ratings."
      ],
      outcome:
        "The constant-drop estimate gives approximately 13.0 mA in the forward path.",
      criterion:
        "Measured current and all semiconductor, resistor and thermal ratings must remain satisfied.",
      verification:
        "Recombine the estimated drops: 0.7 V across the diode plus about 4.3 V across the resistor equals 5 V."
    },
    counterexample: {
      scenario:
        "The diode is connected directly across the 5 V source because it is described as conducting in only one direction.",
      givenLabel: "Current limiting",
      givenValue: "none",
      givenUnit: null,
      reasoning: [
        "Forward direction does not establish a safe current value.",
        "The source and diode dynamic behaviour can permit destructive current.",
        "Missing current control violates the protected-stage criterion."
      ],
      outcome:
        "The direct connection is not a safe rectifying or indicator circuit.",
      criterion:
        "A bounded current path and device ratings are required.",
      verification:
        "Add a calculated limiting element and measure current and temperature under worst-case source conditions."
    },
    misconception: {
      claim: "A diode is a perfect one-way wire and a transistor is a perfect logic switch.",
      mechanism:
        "Forward voltage, drive, transition time, leakage, dissipation and rating interactions are omitted.",
      correction:
        "Use bounded device models and verify current, voltage, timing and thermal evidence.",
      disconfirmingObservation:
        "The device shows measurable voltage and heating while nominally on."
    },
    assessmentMoves: [
      "sequencing duty, semiconductor path, switching state and ratings",
      "repairing a direct diode connection with current control",
      "screening switch claims through drive and thermal evidence",
      "diagnosing whether bias, transition or rating caused failure",
      "explaining why forward bias and safe operating area differ",
      "matching semiconductor states to waveform and temperature checks",
      "reading the switching path from control to protected load",
      "rejecting ideal one-way and lossless-switch assumptions"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D11-L05",
    systemModel:
      "An operational amplifier with negative feedback adjusts its output to reduce input difference while supply rails, input range, output current, bandwidth and stability permit.",
    failurePattern:
      "Applying the ideal closed-loop gain after the output saturates or the input leaves common-mode range predicts a value the amplifier cannot produce.",
    visualExplanation:
      "A feedback graph links input and resistor network to differential error, output response, returned feedback and measured rail, bandwidth and stability evidence.",
    applicationTask:
      "Set and verify the gain of a non-inverting sensor amplifier while checking supply, output swing, loading and bandwidth.",
    terms: [
      [
        "t1",
        "negative feedback",
        "Negative feedback returns part of the output in a direction that reduces the input error.",
        "It produces the intended closed-loop behaviour only while the amplifier remains stable and unsaturated."
      ],
      [
        "t2",
        "closed-loop gain",
        "Closed-loop gain is the input-to-output gain established mainly by the external feedback network.",
        "It is bounded by finite open-loop gain, bandwidth, slew rate, rails and loading."
      ],
      [
        "t3",
        "output saturation",
        "Output saturation occurs when the demanded output lies outside the amplifier's available output swing.",
        "A saturated amplifier no longer follows the ideal linear gain relation."
      ]
    ],
    entities: [
      ["e1", "input", "Sensor signal and gain need", "Input range, source impedance, required gain and frequency content."],
      ["e2", "mechanism", "Feedback network", "Amplifier and resistor path setting the intended closed-loop relation."],
      ["e3", "state", "Error and output state", "Differential input, output voltage, current, slew and stability."],
      ["e4", "observation", "Conditioned-signal evidence", "Measured gain, offset, clipping, noise and frequency response."],
      ["e5", "decision", "Accepted analogue stage", "Conditioner satisfying range, accuracy, drive and stability limits."]
    ],
    relations: [
      ["r1", "maps", "Sensor signal and gain need map into a feedback-network design.", "directed", "one-to-many"],
      ["r2", "feeds-back", "The feedback network returns output information to reduce input error.", "directed", "one-to-one"],
      ["r3", "transforms", "The error and output state transform the sensor signal into conditioned evidence.", "directed", "one-to-many"],
      ["r4", "supports", "Conforming conditioned evidence supports acceptance of the analogue stage.", "directed", "many-to-one"],
      ["r5", "invalidates", "Saturation, unstable feedback or exceeded input range invalidates ideal gain.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Input range, gain, frequency, source, load and supply rails are declared."],
      ["c2", "operating-state", "Negative feedback remains stable and the amplifier operates in its linear ranges."],
      ["c3", "criterion", "Measured gain, offset, swing, bandwidth and load drive meet the signal need."],
      ["c4", "boundary", "Saturation, slew limiting, instability or common-mode violation blocks acceptance."]
    ],
    failureMechanism:
      "The ideal gain equation is used after a supply, range, speed or stability assumption has failed.",
    failureConsequence:
      "The conditioned signal clips, oscillates, distorts or carries an incorrect gain and offset.",
    failureCriterion:
      "Reject a gain claim without evidence that input, output, load, bandwidth and stability limits remain valid.",
    conceptualSteps: [
      "Define sensor input range, required output, load, supply and bandwidth.",
      "Choose a feedback network and calculate the intended closed-loop gain.",
      "Predict output swing, input range, current, bandwidth and stability.",
      "Measure gain, offset, clipping, noise and frequency response.",
      "Accept the stage only inside its verified linear operating region."
    ],
    example: {
      scenario:
        "A non-inverting stage uses 9 kOhm feedback and 1 kOhm to reference, with a 0.20 V input and adequate supply headroom.",
      givenLabel: "Resistors and input",
      givenValue: "9 kOhm, 1 kOhm, 0.20 V",
      givenUnit: null,
      reasoning: [
        "The ideal non-inverting gain is 1 plus 9 divided by 1, which is 10.",
        "The demanded output is 10 times 0.20 V, which is 2.0 V.",
        "The 2.0 V output is accepted only after swing, load, input range and bandwidth checks."
      ],
      outcome:
        "The intended linear output is 2.0 V with closed-loop gain 10.",
      criterion:
        "The measured output must follow gain 10 without clipping, instability or range violation.",
      verification:
        "Check independently that the feedback fraction is 1 divided by 10, so the 2.0 V output returns 0.20 V."
    },
    counterexample: {
      scenario:
        "The same gain is applied to a 1.0 V input even though the available output swing ends below 10 V.",
      givenLabel: "Demanded output",
      givenValue: "10 V beyond available swing",
      givenUnit: null,
      reasoning: [
        "The ideal relation demands an output outside the available rail-limited range.",
        "Negative feedback cannot reduce the error by producing an impossible voltage.",
        "The amplifier saturates and no longer realises gain 10."
      ],
      outcome:
        "The ideal 10 V output claim is invalid under the stated supply.",
      criterion:
        "Demanded output and current must remain within the verified linear swing.",
      verification:
        "Measure output clipping and reduce input, gain or change the supply-qualified device."
    },
    misconception: {
      claim: "An op-amp with negative feedback always forces its inputs equal.",
      mechanism:
        "Supply, output, input-range, speed and stability conditions are hidden behind the virtual-short approximation.",
      correction:
        "Use near-equal inputs only after confirming stable negative feedback and linear operating limits.",
      disconfirmingObservation:
        "The output clips at a rail while a measurable differential input remains."
    },
    assessmentMoves: [
      "sequencing signal need, feedback design, output state and verification",
      "repairing ideal gain after output saturation appears",
      "screening amplifier claims through rail and bandwidth evidence",
      "diagnosing whether range, loading or stability caused distortion",
      "explaining how feedback and closed-loop gain interact",
      "matching amplifier limits to measured signal behaviour",
      "reading the feedback graph from sensor input to accepted output",
      "rejecting virtual-short reasoning outside linear operation"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D11-L06",
    systemModel:
      "Combinational logic maps present inputs to outputs, while sequential logic also retains state through clocked or feedback storage with reset and timing conditions.",
    failurePattern:
      "Reading a sequential circuit as a truth table with no prior state ignores clock edges, setup, hold and reset, so the predicted output can be wrong or indeterminate.",
    visualExplanation:
      "A logic-state graph links present inputs and prior state through timing and clock edge to next state, output and reset recovery evidence.",
    applicationTask:
      "Trace a small clocked safety-state circuit and distinguish combinational output logic from stored state and timing requirements.",
    terms: [
      [
        "t1",
        "combinational logic",
        "Combinational logic produces outputs determined by the current input values and propagation delay.",
        "It has no intended stored state, although real gates still have finite delay and hazards."
      ],
      [
        "t2",
        "sequential state",
        "Sequential state is information retained by storage elements and used with inputs to determine future behaviour.",
        "The state is meaningful only with defined clock, reset and valid transition conditions."
      ],
      [
        "t3",
        "setup and hold",
        "Setup and hold intervals bound when an input must remain stable around a sampling clock edge.",
        "Meeting nominal logic levels does not remove timing requirements."
      ]
    ],
    entities: [
      ["e1", "input", "Inputs, clock and reset", "Present logic values plus clock edge and reset condition."],
      ["e2", "mechanism", "Combinational next-state logic", "Boolean network calculating outputs and requested next state."],
      ["e3", "state", "Stored sequential state", "Retained bit pattern before and after a valid sampling event."],
      ["e4", "observation", "Timing and output trace", "Waveforms showing propagation, sampling, reset and state transitions."],
      ["e5", "decision", "Valid logic behaviour", "Circuit accepted across declared input, clock, reset and timing cases."]
    ],
    relations: [
      ["r1", "maps", "Inputs, clock and reset map into combinational next-state logic.", "directed", "many-to-one"],
      ["r2", "transforms", "The next-state logic transforms a valid clock event into stored state.", "directed", "many-to-one"],
      ["r3", "feeds-back", "Stored sequential state feeds back into future logic and the timing trace.", "directed", "one-to-many"],
      ["r4", "compares", "The timing and output trace is compared with the required state behaviour.", "directed", "many-to-one"],
      ["r5", "invalidates", "Timing violation or undefined reset invalidates deterministic state prediction.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Logic levels, Boolean function, initial state, clock edge and reset are explicit."],
      ["c2", "operating-state", "Inputs satisfy setup, hold and propagation conditions around sampling."],
      ["c3", "criterion", "Measured next state and output trace match every specified transition."],
      ["c4", "boundary", "Timing violation, invalid state or uncontrolled reset blocks acceptance."]
    ],
    failureMechanism:
      "Prior state and sampling time are removed, collapsing a dynamic state machine into static input logic.",
    failureConsequence:
      "Outputs can transition unexpectedly, retain the wrong state or become metastable.",
    failureCriterion:
      "Reject a state prediction lacking initial state, valid clock event, reset and timing evidence.",
    conceptualSteps: [
      "Define inputs, logic levels, prior state, clock edge and reset.",
      "Evaluate combinational outputs and requested next state.",
      "Apply the state change only at the declared valid sampling event.",
      "Inspect timing and output traces for every specified transition.",
      "Treat invalid timing or reset as a boundary on deterministic behaviour."
    ],
    example: {
      scenario:
        "A positive-edge D flip-flop is reset to 0, then D is held at 1 across a valid rising clock edge.",
      givenLabel: "Initial and sampled state",
      givenValue: "Q 0, D 1 at valid rising edge",
      givenUnit: null,
      reasoning: [
        "Reset establishes the known prior state Q equals 0.",
        "D remains stable through setup and hold around the rising edge.",
        "The valid edge transfers D to the stored state, so Q becomes 1 after propagation delay."
      ],
      outcome:
        "The next stored state is Q equals 1 after the valid clock event.",
      criterion:
        "The transition is valid only with defined reset, edge and timing margins.",
      verification:
        "Inspect the waveform and confirm D is stable across the specified setup and hold window."
    },
    counterexample: {
      scenario:
        "D changes at the sampling edge, yet the logic trace labels Q deterministically as 1 from the static truth table.",
      givenLabel: "Timing state",
      givenValue: "D changes inside sampling window",
      givenUnit: null,
      reasoning: [
        "The flip-flop input violates the required timing interval.",
        "The sampled internal state is not guaranteed by the static logic value.",
        "A deterministic Q prediction is unsupported for this event."
      ],
      outcome:
        "The transition is invalid or indeterminate until timing is restored.",
      criterion:
        "Input timing must satisfy the storage element specification.",
      verification:
        "Move the input transition away from the sampling edge and repeat the waveform capture."
    },
    misconception: {
      claim: "Digital outputs change instantly and depend only on the current input bits.",
      mechanism:
        "Propagation delay, stored state, clock sampling, reset and invalid timing are omitted.",
      correction:
        "Separate combinational evaluation from state storage and verify timing around each transition.",
      disconfirmingObservation:
        "The same present input gives different output because the stored prior state differs."
    },
    assessmentMoves: [
      "sequencing reset, combinational evaluation, clock sampling and trace",
      "repairing a static prediction after setup-and-hold violation",
      "screening logic claims through prior state and timing evidence",
      "diagnosing whether reset, clock or propagation caused mismatch",
      "explaining how combinational logic and sequential state differ",
      "matching state transitions to waveform conditions",
      "reading the logic-state graph across a sampled event",
      "rejecting truth-table-only reasoning for a clocked circuit"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D11-L07",
    systemModel:
      "A power system routes bounded energy from supply or battery through protection and switched drive paths, while PCB geometry, grounding and thermal design shape fault and normal current return.",
    failurePattern:
      "Selecting a supply from nominal voltage alone ignores current, transient, energy, return-path, protection and thermal limits, allowing wiring or copper to become the unintended fuse.",
    visualExplanation:
      "A power-path graph follows source energy through fuse and switch, PCB forward and return paths, load, heat and fault containment to an accepted power stage.",
    applicationTask:
      "Define and verify the source, protection, PCB current path and thermal checks for a small robot motor drive.",
    terms: [
      [
        "t1",
        "power budget",
        "A power budget reconciles source capability with load demand, conversion loss and operating schedule.",
        "Summing nominal watts alone does not capture startup, regenerative or fault conditions."
      ],
      [
        "t2",
        "return path",
        "A return path is the physical route current follows back to its source.",
        "A ground symbol does not guarantee a short, quiet or safe physical return."
      ],
      [
        "t3",
        "fault protection",
        "Fault protection detects or limits abnormal current, voltage, temperature or energy before damage spreads.",
        "A protective rating is useful only when placement and interruption capability match the fault path."
      ]
    ],
    entities: [
      ["e1", "input", "Source and motor duty", "Supply or battery range, motor current, transients, direction and schedule."],
      ["e2", "component", "Protection and switched drive", "Fuse, current limit, switching devices and energy-clamp paths."],
      ["e3", "mechanism", "PCB forward and return network", "Copper geometry, grounding, connectors and current-loop area."],
      ["e4", "observation", "Electrical and thermal evidence", "Voltage droop, current waveform, noise, temperature and fault response."],
      ["e5", "decision", "Contained power stage", "Drive accepted for normal duty and declared fault conditions."]
    ],
    relations: [
      ["r1", "routes", "Source and motor duty route through protection and switched-drive elements.", "directed", "one-to-many"],
      ["r2", "transforms", "Protection and switching transform energy through the PCB forward and return network.", "directed", "many-to-many"],
      ["r3", "causes", "The physical current network causes electrical and thermal evidence.", "directed", "many-to-many"],
      ["r4", "supports", "Bounded electrical, thermal and fault evidence support the contained-stage decision.", "directed", "many-to-one"],
      ["r5", "invalidates", "An unprotected or uncontrolled return path invalidates nominal-power acceptance.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Source range, motor duty, transients, wiring and fault cases are declared."],
      ["c2", "operating-state", "Forward and return paths, switching, protection and cooling are assessed physically."],
      ["c3", "criterion", "Voltage, current, noise, temperature and fault response remain within limits."],
      ["c4", "boundary", "Uncontained fault energy, unsafe temperature or return-path disturbance blocks acceptance."]
    ],
    failureMechanism:
      "The power path is represented by nominal voltage and schematic ground symbols while physical current and fault energy are omitted.",
    failureConsequence:
      "Voltage collapses, noise corrupts signals, copper overheats or a fault damages the source and load.",
    failureCriterion:
      "Reject a stage without verified normal, transient, return-path, thermal and fault containment evidence.",
    conceptualSteps: [
      "Define source range, motor demand, operating schedule and faults.",
      "Place protection and switching along the actual energy path.",
      "Route forward and return current with suitable copper, connectors and grounding.",
      "Measure droop, current, noise, temperature and protective response.",
      "Accept only when normal and fault conditions are contained."
    ],
    example: {
      scenario:
        "A motor drive draws 3 A from a 24 V supply at one declared steady operating point.",
      givenLabel: "Supply voltage and current",
      givenValue: "24 V and 3 A",
      givenUnit: null,
      reasoning: [
        "Input electrical power at the point is 24 times 3, which is 72 W.",
        "The source, connector, copper and switch path must carry 3 A while conversion loss becomes heat.",
        "Startup current, fault energy and return-path noise are checked separately from the 72 W steady state."
      ],
      outcome:
        "The declared operating point draws 72 W, but it is only one case in the power and protection assessment.",
      criterion:
        "All normal, transient, thermal and fault cases must remain within source and path limits.",
      verification:
        "Measure voltage and current simultaneously at the drive input and reconcile input power with motor output and losses."
    },
    counterexample: {
      scenario:
        "A 24 V supply is accepted because its nominal voltage matches the motor, while its current limit is below startup demand.",
      givenLabel: "Selection basis",
      givenValue: "voltage match only",
      givenUnit: null,
      reasoning: [
        "Nominal voltage does not establish available transient current.",
        "The supply enters current limit and its output voltage collapses during startup.",
        "A source that cannot support the declared transient fails the drive criterion."
      ],
      outcome:
        "The voltage-matched supply is not qualified for the motor duty.",
      criterion:
        "Source dynamic capability and protection must cover the complete demand envelope.",
      verification:
        "Capture startup voltage and current, then compare them with source limit and motor requirements."
    },
    misconception: {
      claim: "Matching the supply voltage is enough to power a motor drive safely.",
      mechanism:
        "Current, energy, loss, transient, PCB return and protection requirements are removed.",
      correction:
        "Build a complete power path and verify steady, transient, thermal and fault behaviour.",
      disconfirmingObservation:
        "The matched-voltage supply collapses or trips when the motor starts."
    },
    assessmentMoves: [
      "sequencing source duty, protection, current paths and containment evidence",
      "repairing voltage-only selection after startup collapse",
      "screening drive claims through current, return and thermal evidence",
      "diagnosing whether source limit, copper or fault path caused failure",
      "explaining how power budget and return path constrain the stage",
      "matching protection devices to physical energy paths",
      "reading source energy through the PCB to contained motor output",
      "rejecting nominal-voltage selection without dynamic capability"
    ],
    variant: 6
  }
] satisfies readonly AcademyE2LessonSource[];

const d11 = buildAcademyE2UnitProfiles("D11", lessonSources);

export const academyLessonTeachingProfileV2PlansE2D11 = d11.plans;
export const academyLessonTeachingProfileV2LessonIdsE2D11 = d11.lessonIds;
export const academyLessonTeachingProfilesV2E2D11 = d11.profiles;

export default academyLessonTeachingProfilesV2E2D11;
