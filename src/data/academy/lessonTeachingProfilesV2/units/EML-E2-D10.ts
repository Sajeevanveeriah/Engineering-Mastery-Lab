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
      `Build a manufacturing route from ${firstTerm} to ${evidence} by ${move}:`,
      `${evidence} supports the route when ${firstTerm} and ${secondTerm} survive every manufacturing filter during ${move}.`,
      `${evidence} cannot release the route when ${secondTerm} is inserted after the manufacturing decision.`,
      `List the ${firstTerm} requirement before comparing manufacturing routes through ${move}.`,
      `Locate the ${secondTerm} capability that changes the expected ${evidence}.`,
      `Screen ${firstTerm}, apply ${secondTerm}, then record ${evidence} while completing ${move}.`,
      `Release the manufacturing route only after ${evidence} confirms ${firstTerm} during ${move}.`
    ],
    [
      `Recover a rejected manufacturing route for ${firstTerm} after ${move}:`,
      `The recovery is credible when changed ${secondTerm} conditions produce new ${evidence} rather than a renamed decision.`,
      `A recovery fails when ${firstTerm} is retained but the manufacturing cause of ${evidence} remains hidden.`,
      `Circle the first ${secondTerm} limit contradicted by ${evidence} during ${move}.`,
      `Return to the ${firstTerm} requirement affected by that manufacturing limit.`,
      `Change one bounded ${secondTerm} choice and repeat ${move} against ${firstTerm}.`,
      `Keep the route only when fresh ${evidence} resolves the earlier manufacturing rejection.`
    ],
    [
      `Qualify the manufacturing claims about ${firstTerm} using ${secondTerm} while ${move}:`,
      `Qualified claims connect the declared ${firstTerm} requirement to measured ${evidence} through a feasible manufacturing route.`,
      `An unqualified claim quotes ${evidence} without showing which ${secondTerm} condition produced it.`,
      `Sort each ${firstTerm} claim by requirement, manufacturing mechanism and ${evidence}.`,
      `Retain the ${secondTerm} statement whose scope matches the manufacturing trial.`,
      `Cross out the ${firstTerm} shortcut that bypasses route capability during ${move}.`,
      `Sign off only the ${evidence} claim whose manufacturing condition is still active.`
    ],
    [
      `Investigate the failed ${evidence} before revising ${firstTerm} through ${move}:`,
      `The investigation is complete when ${evidence} identifies the manufacturing change between ${firstTerm} and ${secondTerm}.`,
      `The investigation is incomplete when ${evidence} is labelled as failure but no ${secondTerm} mechanism is tested.`,
      `Begin with the exact ${evidence} defect or mismatch observed during ${move}.`,
      `Work upstream from ${evidence} to the ${secondTerm} manufacturing condition.`,
      `Compare the failed ${secondTerm} state with the bounded ${firstTerm} route.`,
      `Choose the manufacturing explanation that reproduces ${evidence} without weakening ${firstTerm}.`
    ],
    [
      `Write a manufacturing justification joining ${firstTerm}, ${secondTerm} and ${evidence} through ${move}:`,
      `The justification distinguishes what ${firstTerm} requires, what ${secondTerm} changes and what ${evidence} demonstrates.`,
      `The justification is only a glossary when ${firstTerm} and ${secondTerm} never explain the manufacturing ${evidence}.`,
      `Open with the functional boundary attached to ${firstTerm}.`,
      `Describe the manufacturing action represented by ${secondTerm} and its effect on ${evidence}.`,
      `Use a because statement to connect ${firstTerm} with ${secondTerm} during ${move}.`,
      `End with the measured ${evidence} that accepts or rejects the manufacturing route.`
    ],
    [
      `Pair the manufacturing role of ${firstTerm} with ${secondTerm} and ${evidence} while ${move}:`,
      `A sound pair states which ${secondTerm} condition governs the ${firstTerm} route and which ${evidence} verifies it.`,
      `A weak pair attaches ${evidence} to a manufacturing condition that never changes ${firstTerm}.`,
      `Match ${firstTerm} first to the manufacturing requirement it constrains.`,
      `Match ${secondTerm} next to the process response visible in ${evidence}.`,
      `Read each ${firstTerm} pair aloud as requirement, manufacturing cause and ${evidence}.`,
      `Reject any ${secondTerm} pair that cannot predict the observed ${evidence}.`
    ],
    [
      `Audit the manufacturing flow diagram from ${firstTerm} to ${evidence} during ${move}:`,
      `The acceptable flow carries ${firstTerm} through the active ${secondTerm} process before reaching ${evidence}.`,
      `The rejected flow jumps from ${firstTerm} to ${evidence} after the governing ${secondTerm} process is suppressed.`,
      `Mark the ${firstTerm} requirement at the entrance to the manufacturing flow.`,
      `Trace the ${secondTerm} operation whose output becomes ${evidence}.`,
      `Pause where ${move} changes the manufacturing route between ${firstTerm} and ${secondTerm}.`,
      `Approve only the flow whose ${evidence} remains connected to ${firstTerm}.`
    ],
    [
      `Compare the alternate manufacturing state of ${secondTerm} with ${evidence} after ${move}:`,
      `The alternate state is defensible when its ${secondTerm} route still meets ${firstTerm} and predicts ${evidence}.`,
      `The alternate state is unsafe when ${evidence} is reused after ${firstTerm} has left the manufacturing capability window.`,
      `Anchor the comparison at the changed ${secondTerm} manufacturing condition.`,
      `Identify which ${firstTerm} requirement loses support in the alternate state.`,
      `Redraw the manufacturing path from ${secondTerm} to new ${evidence}.`,
      `Retain the alternate route only if ${evidence} re-establishes the ${firstTerm} criterion.`
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
    lessonId: "EML-E2-D10-L01",
    systemModel:
      "Manufacturing process selection converts material, geometry, quantity, tolerance, surface, lead-time and lifecycle requirements into capability filters before comparing feasible routes.",
    failurePattern:
      "Choosing the cheapest quoted process before checking capability makes price look decisive even when geometry, tolerance or quantity lies outside the supplier's proven window.",
    visualExplanation:
      "A process-selection funnel moves from part requirements through material and geometry compatibility, capability evidence and volume economics to a qualified route.",
    applicationTask:
      "Select a process family for a robot enclosure and justify the decision using geometry, quantity, tolerance, finish, lead time and lifecycle evidence.",
    terms: [
      [
        "t1",
        "process capability",
        "Process capability is the demonstrated ability of a manufacturing route to produce a feature within stated limits under controlled conditions.",
        "A general machine specification is not proof of capability for every material, geometry, setup or production volume."
      ],
      [
        "t2",
        "production volume",
        "Production volume is the required quantity over a declared time horizon and strongly affects tooling and unit-cost choices.",
        "Volume alone does not override geometry, tolerance, material or lead-time feasibility."
      ],
      [
        "t3",
        "lifecycle requirement",
        "A lifecycle requirement covers production, use, repair, reuse and end-of-life consequences relevant to the part.",
        "A low purchase price is not a complete lifecycle assessment."
      ]
    ],
    entities: [
      ["e1", "input", "Enclosure requirements", "Material, geometry, quantity, tolerance, finish, lead time and lifecycle needs."],
      ["e2", "constraint", "Process capability window", "Evidence-backed combinations of material, geometry and achievable output."],
      ["e3", "observation", "Route evidence", "Supplier trials, capability data, tooling assumptions, costs and lead times."],
      ["e4", "decision", "Feasible route shortlist", "Processes satisfying every mandatory requirement under declared assumptions."],
      ["e5", "decision", "Qualified manufacturing route", "Selected process plus tooling, inspection and lifecycle rationale."]
    ],
    relations: [
      ["r1", "maps", "Enclosure requirements map into a process capability window.", "directed", "one-to-many"],
      ["r2", "compares", "The capability window compares candidate routes under common requirements.", "directed", "many-to-many"],
      ["r3", "supports", "Route evidence supports inclusion in the feasible shortlist.", "directed", "many-to-many"],
      ["r4", "constrains", "The feasible shortlist constrains the qualified manufacturing route.", "directed", "many-to-one"],
      ["r5", "invalidates", "A route outside any mandatory capability limit invalidates early cost selection.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Part requirements and forecast quantity are explicit before route comparison."],
      ["c2", "operating-state", "Capability, cost and lead-time evidence refer to compatible material and geometry."],
      ["c3", "criterion", "The selected route satisfies all mandatory requirements with an inspection and lifecycle plan."],
      ["c4", "boundary", "An unsupported material, geometry, tolerance or quantity condition removes a route."]
    ],
    failureMechanism:
      "Quoted cost is compared before technical feasibility, causing unsupported routes to remain in the decision set.",
    failureConsequence:
      "Tooling changes, scrap, rework or late redesign erase the apparent saving and delay production.",
    failureCriterion:
      "Reject any route that lacks evidence for one mandatory material, geometry, capability or delivery requirement.",
    conceptualSteps: [
      "State material, geometry, quantity, tolerance, finish, lead-time and lifecycle requirements.",
      "Filter candidate processes by material and geometry compatibility.",
      "Compare capability and route evidence under equivalent assumptions.",
      "Shortlist only routes satisfying every mandatory requirement.",
      "Select the route with tooling, inspection, cost and lifecycle rationale attached."
    ],
    example: {
      scenario:
        "A low-volume folded aluminium electronics enclosure needs rapid delivery, accessible bends and moderate dimensional control.",
      givenLabel: "Production context",
      givenValue: "low volume with short lead time",
      givenUnit: null,
      reasoning: [
        "The enclosure requirements make material compatibility, bend access and lead time mandatory filters.",
        "Laser cutting and press-brake forming have relevant route evidence without dedicated mould tooling.",
        "The route remains feasible after tolerance, finish and inspection needs are added."
      ],
      outcome:
        "Cut-and-fold sheet fabrication is shortlisted and qualified for the declared low-volume enclosure duty.",
      criterion:
        "The route must satisfy material, geometry, output, lead-time and inspection requirements.",
      verification:
        "Review the flat pattern with the fabricator and compare a first article with the controlled drawing."
    },
    counterexample: {
      scenario:
        "Injection moulding is selected from a low unit-price estimate before tooling lead time, polymer choice and the small forecast quantity are checked.",
      givenLabel: "Decision evidence",
      givenValue: "unit price only",
      givenUnit: null,
      reasoning: [
        "The quoted unit price excludes the tooling and quantity assumptions that create it.",
        "Material and geometry capability remain unverified for the enclosure.",
        "An incomplete route cannot enter the feasible shortlist."
      ],
      outcome:
        "The moulding quote does not establish a qualified manufacturing route.",
      criterion:
        "Technical feasibility and whole-route assumptions must be established before economic comparison.",
      verification:
        "Add tooling, volume, material, geometry and lead-time evidence, then rerun the route screen."
    },
    misconception: {
      claim: "The manufacturing process with the lowest unit price is the best choice.",
      mechanism:
        "Tooling, capability, quality, lead time, repair and end-of-life effects are excluded from the comparison.",
      correction:
        "Filter for complete technical feasibility first, then compare whole-route cost and lifecycle consequences.",
      disconfirmingObservation:
        "The cheapest quoted process requires tooling whose lead time exceeds the project deadline."
    },
    assessmentMoves: [
      "ordering requirements, capability filters, route evidence and selection",
      "reopening a price-first choice after missing tooling assumptions appear",
      "screening route claims through material and geometry capability",
      "diagnosing which unsupported requirement removes a candidate process",
      "explaining why capability and production volume answer different questions",
      "matching route evidence to the requirement it proves",
      "reading the process funnel from part need to qualified route",
      "rejecting unit-price ranking before technical feasibility is established"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D10-L02",
    systemModel:
      "Machining combines tool-work relative motion, cutting speed, feed, depth of cut, tool geometry and workholding to create features within time, finish and accuracy limits.",
    failurePattern:
      "Copying spindle speed without matching tool diameter, material, feed and machine limits can overheat the cut or produce rubbing, chatter and poor dimensional output.",
    visualExplanation:
      "A machining chain links material and cutter diameter to cutting speed and spindle speed, then feed, chip formation, force, temperature and measured feature quality.",
    applicationTask:
      "Set an initial milling speed for a known cutter and material, then explain the feed, workholding and verification checks required before production.",
    terms: [
      [
        "t1",
        "cutting speed",
        "Cutting speed is the tangential velocity between a cutting edge and the work surface.",
        "It must be converted through cutter diameter before it becomes spindle speed."
      ],
      [
        "t2",
        "feed per tooth",
        "Feed per tooth is the commanded advance for each cutting edge engagement.",
        "It does not by itself set material removal rate without tooth count, spindle speed and engagement."
      ],
      [
        "t3",
        "workholding rigidity",
        "Workholding rigidity is resistance to unwanted part and fixture displacement under cutting force.",
        "Clamping force alone does not guarantee rigidity or safe support."
      ]
    ],
    entities: [
      ["e1", "input", "Material and cutter data", "Work material, tool material, cutter diameter, teeth and recommended cutting range."],
      ["e2", "mechanism", "Speed-feed setup", "Spindle speed, feed per tooth, feed rate and depth of cut."],
      ["e3", "state", "Chip and thermal state", "Chip formation, cutting force, heat, vibration and tool condition."],
      ["e4", "observation", "Machined feature evidence", "Measured size, finish, cycle time, burrs and tool wear."],
      ["e5", "decision", "Released machining setup", "Bounded parameters and workholding accepted for controlled production."]
    ],
    relations: [
      ["r1", "maps", "Material and cutter data map into an initial speed-feed setup.", "directed", "one-to-many"],
      ["r2", "causes", "The speed-feed setup causes the chip, force and thermal state.", "directed", "many-to-many"],
      ["r3", "measures", "The chip and thermal state are reflected in feature and tool evidence.", "directed", "many-to-many"],
      ["r4", "supports", "Conforming feature evidence supports release of the machining setup.", "directed", "many-to-one"],
      ["r5", "invalidates", "A mismatched diameter, feed or workholding state invalidates copied parameters.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Material, cutter diameter, edge count, machine range and units are known."],
      ["c2", "operating-state", "Feed, engagement, cooling and workholding keep chip formation stable."],
      ["c3", "criterion", "Measured feature, finish, cycle and tool-condition evidence meet the process plan."],
      ["c4", "boundary", "Chatter, rubbing, overload, overheating or part movement blocks release."]
    ],
    failureMechanism:
      "A parameter from another diameter or cutting condition is copied without preserving tangential speed and chip load.",
    failureConsequence:
      "The process may rub, chatter, overheat, overload the tool or miss dimensional and finish requirements.",
    failureCriterion:
      "Reject the setup when its units, cutter basis, chip formation, workholding or measured output are unresolved.",
    conceptualSteps: [
      "Confirm material, cutter diameter, tooth count, units and machine limits.",
      "Convert the target cutting speed into spindle speed for the actual diameter.",
      "Set feed from tooth load and inspect workholding and engagement.",
      "Measure feature size, finish, cycle, vibration and tool condition.",
      "Adjust one bounded parameter at a time and release only conforming evidence."
    ],
    example: {
      scenario:
        "A 10 mm milling cutter uses an initial cutting speed of 120 m/min for a documented work-material condition.",
      givenLabel: "Cutting speed and cutter diameter",
      givenValue: "120 m/min with 10 mm diameter",
      givenUnit: null,
      reasoning: [
        "Spindle speed equals cutting speed times 1000 divided by pi times cutter diameter in millimetres.",
        "120,000 divided by pi times 10 gives about 3,820 revolutions per minute.",
        "The initial speed is checked against machine limits, then paired with tooth load, workholding and first-article evidence."
      ],
      outcome:
        "The calculated initial spindle speed is approximately 3,820 r/min for the stated diameter and cutting speed.",
      criterion:
        "The released setup must keep stable chip formation and produce conforming measured features.",
      verification:
        "Substitute 3,820 r/min into pi times 0.010 m times speed to recover approximately 120 m/min."
    },
    counterexample: {
      scenario:
        "The 3,820 r/min value is reused with a 4 mm cutter while feed and engagement remain unchanged.",
      givenLabel: "Changed cutter diameter",
      givenValue: "4",
      givenUnit: "mm",
      reasoning: [
        "Reducing diameter at unchanged spindle speed reduces tangential cutting speed.",
        "Unchanged feed may no longer create the intended chip load and thermal state.",
        "Copied settings without recomputation cannot satisfy the process criterion."
      ],
      outcome:
        "The reused setup is not equivalent and requires a new bounded calculation and trial.",
      criterion:
        "Speed and feed must be derived for the actual cutter and verified by output evidence.",
      verification:
        "Recompute tangential speed for 4 mm and inspect chip, finish, sound and tool condition during a controlled trial."
    },
    misconception: {
      claim: "Spindle speed is a material property that can be copied between cutters.",
      mechanism:
        "Cutter diameter is removed from the relation between rotation and tangential cutting speed.",
      correction:
        "Start from a relevant cutting-speed range and convert it for the actual diameter before setting feed.",
      disconfirmingObservation:
        "Two cutter diameters at the same spindle speed have different edge velocities and chip behaviour."
    },
    assessmentMoves: [
      "sequencing cutter data, spindle conversion, chip state and inspection",
      "repairing copied speed after cutter diameter changes",
      "screening machining claims for speed, feed and workholding evidence",
      "diagnosing whether rubbing, chatter or movement caused poor output",
      "explaining the difference between cutting speed and feed per tooth",
      "matching process parameters to chip and feature observations",
      "reading the cutting chain from material data to released setup",
      "rejecting spindle-speed copying without diameter conversion"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D10-L03",
    systemModel:
      "Sheet-metal fabrication transforms a flat blank through cutting and bending while bend radius, material thickness, grain, tooling and springback govern the final geometry.",
    failurePattern:
      "Using finished outside dimensions as a flat pattern without bend allowance or tooling access shifts hole locations and can crack or distort the part.",
    visualExplanation:
      "A bend map connects finished flange geometry to neutral-axis allowance, flat length, tooling clearance, formed angle and first-article correction.",
    applicationTask:
      "Develop and verify a simple right-angle bracket flat pattern with explicit bend radius, allowance, grain and tooling assumptions.",
    terms: [
      [
        "t1",
        "bend allowance",
        "Bend allowance is the neutral-axis arc length included in the flat pattern for a bend.",
        "It depends on angle, inside radius, thickness and the chosen neutral-axis factor."
      ],
      [
        "t2",
        "springback",
        "Springback is elastic angle and radius recovery after forming force is removed.",
        "Its magnitude depends on material state, geometry and tooling and must be verified."
      ],
      [
        "t3",
        "minimum bend radius",
        "Minimum bend radius is the smallest inside radius allowed without unacceptable cracking or damage for the stated material condition.",
        "It is not universal across alloys, tempers, thicknesses or grain directions."
      ]
    ],
    entities: [
      ["e1", "input", "Finished bracket geometry", "Required flange lengths, bend angle, radius, holes and interfaces."],
      ["e2", "mechanism", "Neutral-axis bend model", "Thickness, radius and factor used to calculate bend allowance."],
      ["e3", "state", "Flat pattern and tooling state", "Blank dimensions, grain direction, edge distances and tool access."],
      ["e4", "observation", "Formed first article", "Measured flange lengths, angle, radius, cracks and hole positions."],
      ["e5", "decision", "Released fabrication definition", "Corrected flat pattern and forming instructions supported by inspection."]
    ],
    relations: [
      ["r1", "maps", "Finished bracket geometry maps into a neutral-axis bend model.", "directed", "one-to-one"],
      ["r2", "transforms", "The bend model transforms finished dimensions into a flat pattern and tooling state.", "directed", "one-to-one"],
      ["r3", "causes", "Flat-pattern and tooling choices cause the formed first-article geometry.", "directed", "many-to-one"],
      ["r4", "compares", "The first article is compared with drawing and damage criteria.", "directed", "one-to-one"],
      ["r5", "invalidates", "Missing allowance, access or material limits invalidate the released flat pattern.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Thickness, material condition, grain, inside radius and finished datum scheme are known."],
      ["c2", "operating-state", "Bend allowance and tool access use the intended press-brake setup."],
      ["c3", "criterion", "First-article angle, flange, radius, hole position and surface condition conform."],
      ["c4", "boundary", "Cracking, inaccessible tooling or uncorrected springback blocks release."]
    ],
    failureMechanism:
      "The bend zone is treated as having zero developed length and forming recovery is ignored.",
    failureConsequence:
      "The formed bracket misses flange, angle or hole-location requirements and may crack at the bend.",
    failureCriterion:
      "Reject a flat pattern lacking traceable bend allowance, feasible tooling and conforming first-article evidence.",
    conceptualSteps: [
      "Define finished datums, thickness, material condition, grain and inside radius.",
      "Calculate bend allowance from angle, radius, thickness and neutral-axis factor.",
      "Create the flat pattern with edge distances and tool clearance.",
      "Form and inspect a first article for dimensions, springback and damage.",
      "Correct the fabrication definition and release only after conformance."
    ],
    example: {
      scenario:
        "A 90 degree bend uses 1.5 mm sheet, 2.0 mm inside radius and a neutral-axis factor of 0.33.",
      givenLabel: "Bend geometry",
      givenValue: "90 deg, R 2.0 mm, t 1.5 mm, K 0.33",
      givenUnit: null,
      reasoning: [
        "The bend angle in radians is pi divided by 2.",
        "The neutral-axis radius is 2.0 plus 0.33 times 1.5, which is 2.495 mm.",
        "Multiplying gives a bend allowance of approximately 3.92 mm before trial correction."
      ],
      outcome:
        "The initial flat pattern includes approximately 3.92 mm of developed length through the bend.",
      criterion:
        "Final release depends on a conforming first article using the intended material and tooling.",
      verification:
        "Recalculate as 1.5708 times 2.495 mm and compare the formed flange dimensions with the drawing."
    },
    counterexample: {
      scenario:
        "Two finished flange lengths are simply added to define the blank while bend allowance and springback are omitted.",
      givenLabel: "Flat-pattern method",
      givenValue: "finished flanges added directly",
      givenUnit: null,
      reasoning: [
        "The bend occupies finite developed length along the neutral axis.",
        "The finished angle also changes after tool load is removed.",
        "A zero-bend model cannot preserve the finished datum geometry."
      ],
      outcome:
        "The flat pattern is not a controlled predictor of the formed bracket.",
      criterion:
        "Bend development and first-article correction must be included.",
      verification:
        "Apply a documented allowance, form a trial and compare flange, angle and hole locations."
    },
    misconception: {
      claim: "A folded part can be flattened by adding its finished straight dimensions.",
      mechanism:
        "The neutral-axis arc and elastic recovery are removed from the geometry.",
      correction:
        "Develop each bend with the intended material, radius, thickness and tooling, then verify springback on a first article.",
      disconfirmingObservation:
        "The formed flange remains short even though the two finished dimensions were added exactly."
    },
    assessmentMoves: [
      "ordering finished geometry, bend development, forming and inspection",
      "repairing a zero-allowance flat pattern after flange error appears",
      "screening bend claims through material and tooling evidence",
      "diagnosing whether allowance, springback or access caused mismatch",
      "explaining why bend allowance and minimum radius are different limits",
      "matching flat-pattern features to forming and inspection conditions",
      "reading the bend map from finished datum to released definition",
      "rejecting direct dimension addition across a finite bend zone"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D10-L04",
    systemModel:
      "Casting and moulding fill a shaped cavity while flow, cooling, shrinkage, draft, parting and gas removal govern whether the solidified part can be released and meet requirements.",
    failurePattern:
      "Copying the finished geometry directly into a mould ignores filling, solidification, shrinkage and release, creating short fill, porosity, warpage or trapped tooling.",
    visualExplanation:
      "A cavity-flow graph links material entry to filling fronts, vents, cooling and shrinkage, then ejection and inspected part geometry.",
    applicationTask:
      "Review a small housing for mould flow, draft, parting, shrinkage and defect-control decisions before tooling release.",
    terms: [
      [
        "t1",
        "draft angle",
        "Draft angle is a small taper that permits a formed part to leave its mould or die without damaging surfaces.",
        "Required draft depends on depth, texture, material, process and release direction."
      ],
      [
        "t2",
        "shrinkage allowance",
        "Shrinkage allowance changes cavity dimensions to account for material contraction through processing and cooling.",
        "A single allowance is incomplete when geometry, flow direction and process condition change shrinkage."
      ],
      [
        "t3",
        "parting strategy",
        "Parting strategy defines how tooling separates and where seams, gates, vents and undercut actions can occur.",
        "A convenient visual seam is not necessarily a feasible or low-risk parting line."
      ]
    ],
    entities: [
      ["e1", "input", "Housing requirements", "Material, geometry, surface, tolerance, production and functional needs."],
      ["e2", "mechanism", "Cavity and parting design", "Draft, gates, runners, vents, cores, seams and release direction."],
      ["e3", "state", "Flow-cooling state", "Filling fronts, pressure, temperature, gas removal and solidification."],
      ["e4", "observation", "Moulded-part evidence", "Fill, porosity, sink, warp, dimensions, surface and ejection marks."],
      ["e5", "decision", "Released tooling concept", "Tool geometry and controls supported by trial and inspection evidence."]
    ],
    relations: [
      ["r1", "constrains", "Housing requirements constrain cavity, parting and release decisions.", "directed", "one-to-many"],
      ["r2", "maps", "Cavity and parting design map the intended material flow and cooling state.", "directed", "many-to-many"],
      ["r3", "causes", "Flow and cooling behaviour cause the observed moulded-part evidence.", "directed", "many-to-many"],
      ["r4", "supports", "Conforming part evidence supports release of the tooling concept.", "directed", "many-to-one"],
      ["r5", "invalidates", "Trapped geometry, poor venting or uncontrolled shrinkage invalidates direct tooling release.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Material, process, release direction, critical surfaces and tolerances are declared."],
      ["c2", "operating-state", "Flow, venting, cooling, shrinkage and ejection are assessed as one process."],
      ["c3", "criterion", "Trial parts fill, release and meet defect, dimension and surface limits."],
      ["c4", "boundary", "An undercut, trapped gas, short fill or unstable shrinkage blocks release."]
    ],
    failureMechanism:
      "The cavity is treated as a passive copy of the finished part instead of a flow, cooling and release system.",
    failureConsequence:
      "Tooling can trap the part or repeatedly create voids, sink, warp and dimensional error.",
    failureCriterion:
      "Reject tooling when release geometry or process evidence cannot control filling, cooling and shrinkage defects.",
    conceptualSteps: [
      "Define material, critical geometry, surfaces, tolerances and production needs.",
      "Choose parting, draft, gates, vents, cores and release direction.",
      "Assess filling, cooling and shrinkage through the complete cavity.",
      "Inspect trial parts for defects, dimensions, surface and ejection.",
      "Correct tooling and process controls before release."
    ],
    example: {
      scenario:
        "A polymer sensor housing is split along a plane that avoids functional sealing faces and allows both deep walls to receive draft in the opening direction.",
      givenLabel: "Release strategy",
      givenValue: "single opening direction with drafted walls",
      givenUnit: null,
      reasoning: [
        "Functional surfaces and release direction establish feasible parting locations.",
        "Drafted walls and accessible vents support ejection and complete filling.",
        "Trial inspection can now separate flow, cooling and shrinkage corrections."
      ],
      outcome:
        "The tooling concept has a coherent parting and release path ready for process trial.",
      criterion:
        "The part must fill, cool and eject without unacceptable defects or functional-surface damage.",
      verification:
        "Perform a tooling-direction check, then inspect first shots for fill, seam, warp and ejection evidence."
    },
    counterexample: {
      scenario:
        "A deep textured wall has zero draft and an internal undercut, but the tooling concept shows only straight opening halves.",
      givenLabel: "Release conflict",
      givenValue: "zero draft plus trapped undercut",
      givenUnit: null,
      reasoning: [
        "The textured wall creates release friction without taper.",
        "The undercut mechanically blocks straight tool separation.",
        "A cavity that cannot open and eject cannot satisfy the tooling criterion."
      ],
      outcome:
        "The direct two-half tooling concept is infeasible.",
      criterion:
        "Every surface must have a feasible forming and release path.",
      verification:
        "Run a release-direction analysis and redesign the geometry or add a justified side action."
    },
    misconception: {
      claim: "A mould cavity should be an exact negative copy of the finished part.",
      mechanism:
        "Draft, shrinkage, flow, cooling, parting and ejection are omitted from the geometry.",
      correction:
        "Design the cavity as a controlled process system and verify it with trial-part evidence.",
      disconfirmingObservation:
        "The exact-copy cavity traps the part and the cooled dimensions miss the finished definition."
    },
    assessmentMoves: [
      "sequencing requirements, tooling geometry, process state and trial evidence",
      "repairing an exact-copy cavity after a release conflict appears",
      "screening tooling claims for flow, shrinkage and ejection evidence",
      "diagnosing whether parting, venting or cooling caused the defect",
      "explaining why draft and shrinkage solve different process needs",
      "matching observed moulding defects to their governing conditions",
      "reading the cavity-flow graph from gate to inspected housing",
      "rejecting finished-shape copying without a process and release model"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D10-L05",
    systemModel:
      "Additive manufacturing slices a digital model into deposited or fused layers, while orientation, support, thermal history and post-processing shape strength, accuracy and surface.",
    failurePattern:
      "Orienting only to reduce build time can place weak layer interfaces across the main load, create inaccessible support scars or exceed overhang capability.",
    visualExplanation:
      "A build-orientation map links part loads and datum surfaces to layers, supports, thermal distortion, post-processing and inspected output.",
    applicationTask:
      "Orient and plan an additively manufactured robot bracket using load direction, support access, surface, tolerance and post-processing evidence.",
    terms: [
      [
        "t1",
        "build orientation",
        "Build orientation is the placement of a part relative to the machine's layer and build directions.",
        "The smallest build height is not automatically the strongest or most inspectable orientation."
      ],
      [
        "t2",
        "support structure",
        "A support structure anchors or carries regions that the process cannot build freely.",
        "Support removal can damage surfaces and may be impossible inside closed passages."
      ],
      [
        "t3",
        "process anisotropy",
        "Process anisotropy is direction-dependent behaviour created by layers, thermal history or material deposition.",
        "Its magnitude depends on the process, material, parameters and post-processing evidence."
      ]
    ],
    entities: [
      ["e1", "input", "Bracket loads and datums", "Functional load directions, interfaces, tolerances and critical surfaces."],
      ["e2", "decision", "Build orientation and supports", "Part placement, layer direction, anchors and removable support regions."],
      ["e3", "state", "Layer and thermal history", "Bonding, heat accumulation, residual stress and distortion during the build."],
      ["e4", "observation", "Printed and finished evidence", "Strength direction, dimensions, surface, support scars and post-process result."],
      ["e5", "decision", "Qualified additive route", "Orientation, parameters and finishing plan accepted for the bracket duty."]
    ],
    relations: [
      ["r1", "constrains", "Bracket loads and datums constrain build orientation and support placement.", "directed", "one-to-many"],
      ["r2", "causes", "Orientation and supports cause a particular layer and thermal history.", "directed", "many-to-one"],
      ["r3", "measures", "Layer and thermal history are reflected in printed and finished evidence.", "directed", "many-to-many"],
      ["r4", "supports", "Conforming evidence supports qualification of the additive route.", "directed", "many-to-one"],
      ["r5", "invalidates", "Unverified anisotropy or inaccessible supports invalidate convenience-only orientation.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Load directions, critical datums, surface needs and post-process access are declared."],
      ["c2", "operating-state", "Orientation, support, parameters and thermal controls are assessed together."],
      ["c3", "criterion", "Printed and finished evidence meets directional strength, dimension and surface needs."],
      ["c4", "boundary", "Weak orientation, trapped support or unacceptable distortion blocks qualification."]
    ],
    failureMechanism:
      "Build convenience is optimised while directional material behaviour and post-processing access are excluded.",
    failureConsequence:
      "The part can delaminate across the main load or remain dimensionally and cosmetically unusable.",
    failureCriterion:
      "Reject an orientation lacking evidence for directional strength, support removal, tolerance and surface requirements.",
    conceptualSteps: [
      "Map bracket loads, interfaces, datums and critical surfaces.",
      "Choose an orientation and support strategy consistent with those requirements.",
      "Predict layer direction, heat accumulation and distortion risks.",
      "Print, post-process and inspect directional, dimensional and surface evidence.",
      "Qualify the route only within the tested material and parameter window."
    ],
    example: {
      scenario:
        "A polymer bracket is oriented so its main tensile load lies largely within layers while support remains accessible on a non-datum face.",
      givenLabel: "Orientation priorities",
      givenValue: "load within layers and removable support",
      givenUnit: null,
      reasoning: [
        "Load direction and datum protection are stated before build-height optimisation.",
        "The chosen orientation reduces reliance on weaker inter-layer tension and keeps support removal accessible.",
        "Coupons and finished-part inspection provide directional and dimensional evidence."
      ],
      outcome:
        "The orientation is a defensible candidate for qualification within its tested build window.",
      criterion:
        "Directional strength, support access, datum quality and dimensions must all conform.",
      verification:
        "Test representative coupons in the governing direction and inspect the bracket after support removal."
    },
    counterexample: {
      scenario:
        "A hollow passage is placed below a large unsupported roof, leaving support material trapped inside the finished part.",
      givenLabel: "Support access",
      givenValue: "closed and inaccessible",
      givenUnit: null,
      reasoning: [
        "The roof requires support under the chosen process and orientation.",
        "The closed passage prevents that support from being removed or inspected.",
        "A trapped support state violates the finished-part criterion."
      ],
      outcome:
        "The orientation and geometry combination is not a qualified additive route.",
      criterion:
        "All required support must be avoidable, removable or intentionally retained with evidence.",
      verification:
        "Review every supported region along the removal path and reorient or redesign the passage."
    },
    misconception: {
      claim: "Additive manufacturing makes orientation irrelevant because any shape can be printed.",
      mechanism:
        "Layer bonding, support access, distortion, surface and inspection constraints are hidden by geometric freedom.",
      correction:
        "Treat orientation as a structural and process decision and qualify the complete print-and-finish route.",
      disconfirmingObservation:
        "The same model passes in one orientation and cracks across layer interfaces in another."
    },
    assessmentMoves: [
      "sequencing bracket needs, orientation, layer state and qualification",
      "repairing a trapped-support build by restoring removal access",
      "screening additive claims through directional and finished evidence",
      "diagnosing whether anisotropy, heat or support caused rejection",
      "explaining why orientation and support are coupled decisions",
      "matching printed defects to layer and post-process conditions",
      "reading the build map from load direction to qualified output",
      "rejecting geometric freedom claims outside the tested process window"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D10-L06",
    systemModel:
      "Design for manufacture and assembly preserves function while reducing avoidable operations, orientation ambiguity, inaccessible work and tolerance sensitivity across production and service.",
    failurePattern:
      "Removing parts or tolerances without tracing their function can simplify the drawing while creating difficult assembly, poor location or unsafe service.",
    visualExplanation:
      "An assembly-flow graph links functional interfaces to part orientation, joining actions, tolerance accumulation, inspection and service access.",
    applicationTask:
      "Redesign a small sensor module assembly to reduce operations while preserving location, sealing, fastening and repair requirements.",
    terms: [
      [
        "t1",
        "assembly datum",
        "An assembly datum is a controlled feature used to locate a part consistently during joining and inspection.",
        "A visually convenient edge is not a datum unless its geometry and use are controlled."
      ],
      [
        "t2",
        "tolerance stack",
        "A tolerance stack combines permitted dimensional variation along a functional path.",
        "Adding all worst cases is conservative but must still follow the correct datum and direction chain."
      ],
      [
        "t3",
        "mistake-proofing",
        "Mistake-proofing uses geometry or process controls to prevent or reveal incorrect assembly.",
        "Colour or written instruction alone may not prevent physically possible wrong orientation."
      ]
    ],
    entities: [
      ["e1", "input", "Module functions and interfaces", "Location, sealing, electrical connection, fastening and service needs."],
      ["e2", "mechanism", "Part and datum architecture", "Parts, locating features, joining directions and tolerance paths."],
      ["e3", "state", "Assembly operation flow", "Handling, orientation, fastening, access and inspection sequence."],
      ["e4", "observation", "Build and service evidence", "Cycle steps, errors, fit, seal, access and repeatability observations."],
      ["e5", "decision", "DFMA module definition", "Simplified design that preserves every verified function."]
    ],
    relations: [
      ["r1", "maps", "Module functions and interfaces map into part and datum architecture.", "directed", "one-to-many"],
      ["r2", "constrains", "Part and datum architecture constrains the assembly operation flow.", "directed", "many-to-many"],
      ["r3", "compares", "Assembly flow is compared through build and service evidence.", "directed", "many-to-many"],
      ["r4", "supports", "Conforming evidence supports the simplified DFMA definition.", "directed", "many-to-one"],
      ["r5", "invalidates", "A removed functional feature or inaccessible operation invalidates simplification.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Every part, feature and tolerance is linked to a declared function or process need."],
      ["c2", "operating-state", "Assembly and service are trialled with intended tools, access and operator viewpoint."],
      ["c3", "criterion", "The simplified design preserves location, fit, sealing, connection, safety and repair."],
      ["c4", "boundary", "Ambiguous orientation, inaccessible work or lost function blocks release."]
    ],
    failureMechanism:
      "Part-count or operation reduction is pursued without preserving the functional interface and datum logic.",
    failureConsequence:
      "The module becomes quicker to model but harder to assemble, inspect, seal or repair reliably.",
    failureCriterion:
      "Reject a simplification that removes required function or lacks repeatable build and service evidence.",
    conceptualSteps: [
      "Map each part, feature and tolerance to its function or process need.",
      "Define a clear datum path, preferred orientation and joining direction.",
      "Remove or combine only operations whose function is preserved.",
      "Trial assembly, inspection and service with representative tools and access.",
      "Release the simplified definition only after every function is reverified."
    ],
    example: {
      scenario:
        "Two symmetric covers that can be fitted incorrectly are replaced by one keyed cover using the same controlled sealing datum.",
      givenLabel: "Changed architecture",
      givenValue: "symmetric covers to keyed cover",
      givenUnit: null,
      reasoning: [
        "The sealing and location functions are retained as mandatory interfaces.",
        "A keyed feature removes the physically possible wrong orientation without adding a separate inspection step.",
        "Assembly trials confirm repeatable fit, seal compression and service access."
      ],
      outcome:
        "The keyed cover reduces orientation error while preserving the controlled functional interfaces.",
      criterion:
        "Simplification is acceptable only when function and repeatability are demonstrated.",
      verification:
        "Run repeated assembly and removal trials and inspect datum seating and seal condition."
    },
    counterexample: {
      scenario:
        "A locating pin is removed to reduce part count, leaving two screws to pull a clearance-hole cover into position.",
      givenLabel: "Removed feature",
      givenValue: "locating pin",
      givenUnit: null,
      reasoning: [
        "The locating pin carried a datum function rather than only adding part count.",
        "Clearance holes allow cover position to vary before screw tightening.",
        "The simplified assembly no longer guarantees interface alignment."
      ],
      outcome:
        "The part-count reduction loses a required location function.",
      criterion:
        "Every removed feature must have its function preserved elsewhere and verified.",
      verification:
        "Measure repeated cover position across builds or restore a controlled locating feature."
    },
    misconception: {
      claim: "DFMA means minimising part count and tolerances as far as possible.",
      mechanism:
        "Functional location, joining, mistake-proofing, inspection and service needs are treated as waste.",
      correction:
        "Reduce avoidable complexity only after every function and datum path is explicit and reverified.",
      disconfirmingObservation:
        "A lower-part-count assembly shows greater positional variation and more rework."
    },
    assessmentMoves: [
      "sequencing function mapping, datum design, operation flow and trial",
      "repairing part-count reduction after a locating function disappears",
      "screening DFMA claims through assembly and service evidence",
      "diagnosing whether datum, orientation or access caused build variation",
      "explaining why tolerance stack and mistake-proofing are distinct controls",
      "matching assembly operations to their retained functions",
      "reading module architecture from interfaces to verified simplification",
      "rejecting numerical part reduction when functional evidence worsens"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D10-L07",
    systemModel:
      "Metrology compares a manufactured result with specification using a calibrated measurement chain, while quality and lifecycle decisions consider variation, energy, repair, reuse and end-of-life evidence.",
    failurePattern:
      "Declaring conformance from a displayed number without uncertainty, sampling or traceability can hide an incapable process and drive premature scrap or release.",
    visualExplanation:
      "A quality-loop map links specification to measurement method, calibrated result, uncertainty-aware decision, process response and lifecycle consequence.",
    applicationTask:
      "Plan a dimensional acceptance check for a manufactured robot part and connect the result to process improvement and lifecycle decisions.",
    terms: [
      [
        "t1",
        "measurement uncertainty",
        "Measurement uncertainty describes the quantified doubt associated with a measurement result.",
        "It is not the same as manufacturing tolerance or instrument display resolution."
      ],
      [
        "t2",
        "traceability",
        "Measurement traceability is a documented chain of calibrations linking a result to recognised references.",
        "A calibration sticker alone does not prove the method is suitable for the measured feature."
      ],
      [
        "t3",
        "lifecycle evidence",
        "Lifecycle evidence records material, energy, durability, repair, reuse and end-of-life consequences within a declared boundary.",
        "One environmental label cannot represent every lifecycle trade-off."
      ]
    ],
    entities: [
      ["e1", "input", "Part specification", "Feature definition, tolerance, surface, sampling and lifecycle requirements."],
      ["e2", "mechanism", "Measurement and sampling plan", "Instrument, fixturing, calibration, environment and sample logic."],
      ["e3", "observation", "Results with uncertainty", "Measured values, uncertainty, traceability and process variation evidence."],
      ["e4", "decision", "Quality and lifecycle response", "Accept, contain, adjust, repair, reuse or redesign action."],
      ["e5", "decision", "Controlled product release", "Documented release supported by measurement and lifecycle evidence."]
    ],
    relations: [
      ["r1", "constrains", "The part specification constrains the measurement and sampling plan.", "directed", "one-to-many"],
      ["r2", "measures", "The measurement plan produces results with uncertainty and traceability.", "directed", "one-to-many"],
      ["r3", "supports", "Results support a quality and lifecycle response within the declared scope.", "directed", "many-to-many"],
      ["r4", "supports", "A resolved response supports controlled product release.", "directed", "many-to-one"],
      ["r5", "invalidates", "Unsuitable uncertainty, sampling or traceability invalidates display-only conformance.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Specification, datum, environment, sampling scope and lifecycle boundary are explicit."],
      ["c2", "operating-state", "The measurement method is calibrated, suitable and stable for the feature."],
      ["c3", "criterion", "Release follows a declared decision rule using results, uncertainty and resolved quality actions."],
      ["c4", "boundary", "Unresolved measurement doubt or quality containment blocks product release."]
    ],
    failureMechanism:
      "Instrument display, manufacturing tolerance and product decision are collapsed into one unsupported pass-or-fail number.",
    failureConsequence:
      "Conforming parts may be scrapped, nonconforming parts released or process drift left uncorrected.",
    failureCriterion:
      "Reject release when method suitability, uncertainty, sampling or quality response remains unresolved.",
    conceptualSteps: [
      "Define the feature, datum, tolerance, sampling and lifecycle scope.",
      "Choose a traceable method whose uncertainty is suitable for the decision.",
      "Record results, uncertainty and process variation without hiding pending data.",
      "Apply a declared rule and resolve containment, repair or process action.",
      "Release only after quality and lifecycle consequences are documented."
    ],
    example: {
      scenario:
        "A shaft diameter is measured with a calibrated method whose uncertainty is small relative to the drawing tolerance and whose datum and temperature match the plan.",
      givenLabel: "Measurement state",
      givenValue: "traceable and uncertainty-suitable",
      givenUnit: null,
      reasoning: [
        "The drawing definition determines the datum, method and decision rule.",
        "The calibrated result is interpreted together with its uncertainty and sample scope.",
        "A resolved quality decision can then support controlled release and process feedback."
      ],
      outcome:
        "The diameter decision is traceable to both the specification and the measurement evidence.",
      criterion:
        "Release requires a suitable method, declared uncertainty and completed quality response.",
      verification:
        "Audit calibration traceability, repeat the setup and apply the documented decision rule to the recorded result."
    },
    counterexample: {
      scenario:
        "A display reading lies near the specification limit, but instrument uncertainty is comparable with the remaining acceptance margin.",
      givenLabel: "Decision state",
      givenValue: "result near limit with material uncertainty",
      givenUnit: null,
      reasoning: [
        "The display alone does not locate the measurand precisely relative to the limit.",
        "Measurement uncertainty materially overlaps the pass-or-fail boundary.",
        "An immediate unconditional release is not supported by this evidence."
      ],
      outcome:
        "The part requires the declared guard-band, remeasurement or containment rule.",
      criterion:
        "Decision uncertainty must be resolved according to the quality plan before release.",
      verification:
        "Use a more capable method or apply the documented uncertainty-aware decision rule."
    },
    misconception: {
      claim: "A digital measurement inside tolerance proves the process and product conform.",
      mechanism:
        "Resolution, uncertainty, method suitability, sampling and process variation disappear behind the displayed digits.",
      correction:
        "Interpret results through a traceable method, uncertainty-aware decision rule and appropriate sampling scope.",
      disconfirmingObservation:
        "Repeated suitable measurements cross the limit even though the first display appeared inside tolerance."
    },
    assessmentMoves: [
      "sequencing specification, method, uncertain result and release response",
      "repairing a display-only decision when uncertainty overlaps the limit",
      "screening conformance claims through traceability and sampling evidence",
      "diagnosing whether method or process variation caused uncertainty",
      "explaining why measurement uncertainty and tolerance are not interchangeable",
      "matching measurement and lifecycle evidence to release actions",
      "reading the quality loop from specification to controlled product",
      "rejecting display digits as complete proof of product conformity"
    ],
    variant: 6
  }
] satisfies readonly AcademyE2LessonSource[];

const d10 = buildAcademyE2UnitProfiles("D10", lessonSources);

export const academyLessonTeachingProfileV2PlansE2D10 = d10.plans;
export const academyLessonTeachingProfileV2LessonIdsE2D10 = d10.lessonIds;
export const academyLessonTeachingProfilesV2E2D10 = d10.profiles;

export default academyLessonTeachingProfilesV2E2D10;
