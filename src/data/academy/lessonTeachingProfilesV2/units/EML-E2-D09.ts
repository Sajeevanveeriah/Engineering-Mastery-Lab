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

export type AcademyE2LessonSource = Readonly<{
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
      `For ${unitLabel}, order the ${firstTerm} reasoning while ${move}:`,
      `The sequence is sound because ${move} connects ${firstTerm}, ${secondTerm} and ${evidence}.`,
      `The sequence is incomplete when ${move} leaves ${evidence} outside the ${secondTerm} boundary.`,
      `Begin with the condition governing ${firstTerm}.`,
      `Trace the change through ${secondTerm} before using ${evidence}.`,
      `Place the ${firstTerm} relation steps in their physical order.`,
      `Finish by checking ${evidence} against the stated criterion.`
    ],
    [
      `Repair the altered ${firstTerm} case by ${move}:`,
      `The repair works because ${move} rebuilds the path from ${firstTerm} to ${evidence}.`,
      `A repair that skips ${secondTerm} cannot explain the changed ${evidence}.`,
      `Locate the failed ${firstTerm} condition before choosing a remedy.`,
      `Use ${secondTerm} to identify the first invalid relation.`,
      `Restore the bounded ${firstTerm} relation before the final decision.`,
      `Retest ${evidence} under the acceptance condition.`
    ],
    [
      `Select the ${firstTerm} claims supported while ${move}:`,
      `The selected claims retain the evidence chain from ${firstTerm} through ${secondTerm}.`,
      `At least one rejected claim treats ${evidence} as proof without its governing condition.`,
      `Read every ${firstTerm} claim against the declared operating state.`,
      `Keep relations that remain active under ${secondTerm}.`,
      `Reject the ${firstTerm} shortcut identified by the misconception.`,
      `Use ${evidence} only where the criterion is satisfied.`
    ],
    [
      `Diagnose the ${firstTerm} counter-case by ${move}:`,
      `The diagnosis identifies how ${firstTerm} changes ${secondTerm} and the observed ${evidence}.`,
      `The diagnosis fails if it names ${evidence} without the failed relation.`,
      `Start at the disconfirming ${evidence} observation.`,
      `Trace ${firstTerm} backwards to the changed condition.`,
      `Separate the active ${secondTerm} relation from the suppressed relation.`,
      `Choose only ${evidence} claims consistent with the recovered mechanism.`
    ],
    [
      `Explain why ${firstTerm} and ${secondTerm} matter while ${move}:`,
      `A complete ${firstTerm} explanation connects the definition, mechanism and acceptance criterion.`,
      `An explanation is incomplete when it lists terms without linking them to ${evidence}.`,
      `State the bounded meaning of ${firstTerm}.`,
      `Describe the physical role of ${secondTerm}.`,
      `Connect ${firstTerm} and ${secondTerm} through the governing relation.`,
      `Close with the measurable ${evidence} criterion.`
    ],
    [
      `Match each ${firstTerm} relation to its condition while ${move}:`,
      `Each ${firstTerm} match is correct because the condition governs the named physical relation.`,
      `A mismatched pair assigns ${evidence} to a condition that does not affect it.`,
      `Pair the ${firstTerm} input relation before the downstream relation.`,
      `Keep the ${secondTerm} boundary attached to its mechanism.`,
      `Reserve the ${evidence} decision criterion for the final relation.`,
      `Read each ${secondTerm} pair back as a cause-and-check statement.`
    ],
    [
      `Read the ${firstTerm} diagram while ${move}:`,
      `The correct path reaches ${evidence} through the active ${secondTerm} relation.`,
      `The wrong ${secondTerm} path follows a relation suppressed by the changed condition.`,
      `Start at the physical ${firstTerm} input node.`,
      `Follow only ${firstTerm} relations active in the bounded state.`,
      `Check where ${secondTerm} changes the path.`,
      `Select the implication that reaches ${evidence} as acceptance evidence.`
    ],
    [
      `Interpret the alternate ${secondTerm} state while ${move}:`,
      `The alternate path is defensible because it preserves the required relation to ${evidence}.`,
      `The ${firstTerm} shortcut is invalid because it treats the failure relation as normal operation.`,
      `Begin at the altered ${secondTerm} condition.`,
      `Identify the ${firstTerm} relation that no longer holds.`,
      `Reconstruct the remaining path to ${evidence}.`,
      `Accept ${evidence} only when the final criterion remains true.`
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

export const buildAcademyE2UnitProfiles = (
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
    lessonId: "EML-E2-D09-L01",
    systemModel:
      "Material selection begins with the component function, translates that function into measurable property limits and compares candidate evidence before a material and process route are chosen.",
    failurePattern:
      "Choosing the material with the largest single property value ignores density, environment, manufacturability and evidence variability, so the selected material can fail the actual duty.",
    visualExplanation:
      "A selection map links bracket duty to stiffness and mass limits, then to tested property data, feasible candidates and a documented material-process decision.",
    applicationTask:
      "Choose a material family for a lightweight mobile-robot sensor bracket and explain the function, governing properties, environment, process route and evidence limits.",
    terms: [
      [
        "t1",
        "material index",
        "A material index combines the properties that control a stated function so candidates can be compared on the same duty.",
        "An index is useful only for its declared geometry, loading and objective; it is not a universal ranking."
      ],
      [
        "t2",
        "specific stiffness",
        "Specific stiffness is elastic modulus divided by density and indicates stiffness available per unit mass.",
        "It does not by itself prove adequate strength, toughness, temperature resistance or manufacturability."
      ],
      [
        "t3",
        "allowable property",
        "An allowable property is a conservative design value derived from relevant test data and declared uncertainty or safety margin.",
        "A catalogue typical value is not automatically an allowable value for a critical component."
      ]
    ],
    entities: [
      ["e1", "input", "Bracket duty", "Required load, deflection, mass, environment and service life for the sensor bracket."],
      ["e2", "constraint", "Property limits", "Minimum stiffness and strength plus maximum density and environmental limits."],
      ["e3", "observation", "Candidate evidence", "Comparable property data, process evidence and variability for each material family."],
      ["e4", "decision", "Feasible shortlist", "Candidates that satisfy every mandatory limit under the same assumptions."],
      ["e5", "decision", "Material-process choice", "Selected material and manufacturing route with stated evidence and residual risks."]
    ],
    relations: [
      ["r1", "maps", "The bracket duty maps into explicit property and process limits.", "directed", "one-to-many"],
      ["r2", "compares", "Property limits compare candidates on common units and operating conditions.", "directed", "many-to-many"],
      ["r3", "supports", "Candidate evidence supports or removes each candidate from the feasible shortlist.", "directed", "many-to-many"],
      ["r4", "constrains", "The feasible shortlist constrains the material-process choice.", "directed", "many-to-one"],
      ["r5", "invalidates", "A choice made without the full duty can invalidate the required bracket function.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Loads, deflection, mass, environment and production quantity are stated before comparison."],
      ["c2", "operating-state", "Candidate data use compatible units, temperature, condition and process state."],
      ["c3", "criterion", "The chosen material-process route satisfies every mandatory limit with traceable evidence."],
      ["c4", "boundary", "A candidate is rejected when one mandatory property or process limit is unsupported."]
    ],
    failureMechanism:
      "A single attractive property is treated as the whole requirement and conflicting limits disappear from the comparison.",
    failureConsequence:
      "The bracket may be light yet too flexible, brittle in service, incompatible with its process or unsupported by relevant evidence.",
    failureCriterion:
      "Reject any choice that cannot demonstrate all mandatory property, environment and process limits.",
    conceptualSteps: [
      "State the bracket function and convert its duty into measurable requirements.",
      "Identify the properties and environmental limits that govern success.",
      "Compare candidate data only after aligning units, condition and evidence quality.",
      "Shortlist candidates satisfying every mandatory limit and compatible process route.",
      "Document the selected material-process pair and the boundary that would invalidate it."
    ],
    example: {
      scenario:
        "A low-volume indoor robot bracket needs modest stiffness, low mass and easy machining, so aluminium alloy and glass-filled polymer evidence are compared under the same room-temperature duty.",
      givenLabel: "Maximum bracket mass",
      givenValue: "0.30",
      givenUnit: "kg",
      reasoning: [
        "The duty is translated into a mass ceiling plus stiffness, strength and indoor-environment requirements.",
        "Comparable conditioned data show which candidates satisfy all property limits and suit low-volume manufacture.",
        "The selected aluminium route remains inside every mandatory limit and retains a documented machining path."
      ],
      outcome:
        "Machined aluminium alloy is selected for this duty because it satisfies the complete requirement set, not because one property is largest.",
      criterion:
        "Selection is acceptable when every mandatory limit and the intended process route are supported by comparable evidence.",
      verification:
        "Audit the selection table row by row and confirm the chosen candidate has no unsupported mandatory cell."
    },
    counterexample: {
      scenario:
        "A designer chooses the lowest-density polymer from a marketing table without checking temperature-conditioned stiffness or whether the thin boss can be moulded reliably.",
      givenLabel: "Published density rank",
      givenValue: "lowest candidate only",
      givenUnit: null,
      reasoning: [
        "Density is only one part of the bracket duty and cannot establish structural or process feasibility.",
        "Missing conditioned stiffness and boss-process evidence leave mandatory limits unresolved.",
        "An unresolved mandatory limit prevents this polymer from entering the feasible shortlist."
      ],
      outcome:
        "The low-density candidate is not a defensible material choice for the bracket.",
      criterion:
        "Every mandatory property and process limit must be supported before selection.",
      verification:
        "Request conditioned mechanical data and a moulding feasibility check, then repeat the complete comparison."
    },
    misconception: {
      claim: "The strongest available material is always the safest engineering choice.",
      mechanism:
        "One property is maximised while mass, stiffness, toughness, environment, process variability and service needs are ignored.",
      correction:
        "Select against the complete function and use conservative evidence for every governing limit.",
      disconfirmingObservation:
        "The highest-strength candidate exceeds the mass limit and cannot be produced in the required thin geometry."
    },
    assessmentMoves: [
      "translating bracket function into a property-led selection sequence",
      "reopening a density-only choice after missing limits are exposed",
      "screening candidate claims with compatible property evidence",
      "locating the unsupported limit behind an attractive catalogue value",
      "explaining why material index and allowable property answer different questions",
      "matching selection evidence to the limit it actually supports",
      "tracing duty through evidence to a feasible material-process choice",
      "rejecting a one-property ranking when the full bracket duty is restored"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E2-D09-L02",
    systemModel:
      "External loads create internal force intensity and deformation, while a failure criterion compares the resulting stress state with an observed material limit.",
    failurePattern:
      "Using total force as though it were stress, omitting cross-sectional area or mixing tensile and shear limits produces a dimensionally wrong failure claim.",
    visualExplanation:
      "A load-path diagram moves from axial force through area and normal stress to strain response, material limit and a pass-or-fail decision.",
    applicationTask:
      "Calculate the nominal tensile stress in a robot tie and explain how strain evidence and an appropriate failure limit complete the assessment.",
    terms: [
      [
        "t1",
        "normal stress",
        "Normal stress is force perpendicular to a section divided by the loaded area.",
        "Nominal stress does not capture every local concentration, residual stress or multi-axial effect."
      ],
      [
        "t2",
        "engineering strain",
        "Engineering strain is change in length divided by original gauge length.",
        "It uses the original dimension and becomes incomplete for very large deformation."
      ],
      [
        "t3",
        "failure criterion",
        "A failure criterion maps a relevant stress state to a material limit and declared acceptable margin.",
        "The criterion must match the material behaviour, loading state and consequence being assessed."
      ]
    ],
    entities: [
      ["e1", "input", "Applied axial load", "External tensile force carried by the tie."],
      ["e2", "mechanism", "Internal section force", "Equal and opposite internal force crossing the chosen cut."],
      ["e3", "state", "Stress-strain state", "Normal stress and corresponding material deformation under the load."],
      ["e4", "criterion", "Material failure limit", "Relevant tensile or yield limit with the required margin."],
      ["e5", "decision", "Tie assessment", "Accepted or rejected tie design with stated local-effect assumptions."]
    ],
    relations: [
      ["r1", "causes", "The applied axial load causes an internal section force along the load path.", "directed", "one-to-one"],
      ["r2", "transforms", "Dividing internal force by loaded area transforms force into nominal normal stress.", "directed", "one-to-one"],
      ["r3", "maps", "Material response maps nominal stress to strain within its constitutive range.", "directed", "one-to-one"],
      ["r4", "compares", "The stress-strain state is compared with the relevant material failure limit.", "directed", "one-to-one"],
      ["r5", "invalidates", "Ignoring area or the correct criterion invalidates the tie assessment.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "The axial load and the minimum load-carrying area are known in consistent units."],
      ["c2", "operating-state", "The nominal uniaxial model is used only away from unresolved stress concentrations."],
      ["c3", "criterion", "The applicable stress measure remains below its allowable material limit."],
      ["c4", "boundary", "The assessment fails if area, load direction or material criterion is mismatched."]
    ],
    failureMechanism:
      "Force is compared directly with a stress limit or the wrong area and stress measure are used.",
    failureConsequence:
      "The reported margin has the wrong magnitude or meaning and may accept an overstressed tie.",
    failureCriterion:
      "Reject a stress assessment whose load, area, stress state and material limit are not explicitly compatible.",
    conceptualSteps: [
      "Draw the external load and identify the internal force crossing a section.",
      "Divide the normal force by the minimum loaded area using consistent units.",
      "Relate the stress to strain only within the applicable material-response range.",
      "Compare the relevant stress measure with the corresponding allowable limit.",
      "State local effects and other loading states that bound the nominal conclusion."
    ],
    example: {
      scenario:
        "A tie carries a tensile load of 12 kN through a minimum area of 120 square millimetres.",
      givenLabel: "Axial load divided by area",
      givenValue: "12 kN / 120 mm^2",
      givenUnit: null,
      reasoning: [
        "The load path crosses the minimum section in tension, so normal stress is the relevant nominal measure.",
        "12,000 N divided by 120 mm^2 equals 100 N/mm^2, which is 100 MPa.",
        "The 100 MPa result is compared with the allowable tensile limit after local concentration assumptions are declared."
      ],
      outcome:
        "The nominal tensile stress is 100 MPa; acceptance still depends on the applicable allowable limit and local effects.",
      criterion:
        "The tie passes only if the relevant allowable stress exceeds 100 MPa with the required design margin.",
      verification:
        "Recompute in SI base units: 12,000 N divided by 0.00012 m^2 also gives 100,000,000 Pa."
    },
    counterexample: {
      scenario:
        "A report compares 12 kN directly with a material yield value stated in MPa and declares the tie safe.",
      givenLabel: "Compared quantities",
      givenValue: "12 kN versus yield MPa",
      givenUnit: null,
      reasoning: [
        "Force and stress have different dimensions and cannot be compared directly.",
        "Without the minimum area, the stress state is unknown.",
        "A dimensionally invalid comparison cannot satisfy the failure criterion."
      ],
      outcome:
        "The report provides no defensible stress margin.",
      criterion:
        "Load must be converted to the relevant stress measure before comparison with a stress limit.",
      verification:
        "Record the minimum area, calculate stress and check units before applying the material criterion."
    },
    misconception: {
      claim: "Stress and force are interchangeable descriptions of how hard a part is loaded.",
      mechanism:
        "The area normalising internal force is omitted, so geometry disappears from the claim.",
      correction:
        "Trace internal force through a defined section and divide by the appropriate area before applying a stress-based limit.",
      disconfirmingObservation:
        "The same force produces different stresses in two ties with different cross-sectional areas."
    },
    assessmentMoves: [
      "sequencing load, section force, stress and failure comparison",
      "repairing a force-versus-MPa comparison with the missing area",
      "screening stress claims for unit and criterion consistency",
      "diagnosing whether area, load direction or failure measure is wrong",
      "explaining the boundary between nominal stress and local response",
      "matching stress-strain relations to their governing assumptions",
      "reading the load-to-limit diagram through a consistent section",
      "replacing a force-only shortcut with a dimensioned stress assessment"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E2-D09-L03",
    systemModel:
      "Supports and joints establish a load path through beams, shafts and fasteners, and each element transforms that load into bending, shear, torque or clamp demand.",
    failurePattern:
      "Sizing an isolated component without drawing supports and interfaces hides the actual load path, so the wrong action or boundary condition is analysed.",
    visualExplanation:
      "A drivetrain support map follows motor reaction from mount through beam, shaft and clamped joint to the chassis, with each interface labelled by its governing action.",
    applicationTask:
      "Trace the load path through a small motor mount and identify where beam bending, shaft torque and fastener clamp checks are required.",
    terms: [
      [
        "t1",
        "load path",
        "A load path is the connected route by which applied forces and moments reach supports.",
        "A path is incomplete if an interface, reaction or change of load type is omitted."
      ],
      [
        "t2",
        "bending moment",
        "Bending moment is the internal moment that curves a beam section under transverse loading.",
        "Its value depends on the load position and support boundary conditions."
      ],
      [
        "t3",
        "preload",
        "Fastener preload is the intentional tensile force that clamps joined parts together.",
        "Applied bolt torque is only an indirect and friction-sensitive way to establish preload."
      ]
    ],
    entities: [
      ["e1", "input", "Motor force and torque", "External actions delivered by the motor and drivetrain."],
      ["e2", "component", "Mount and support interfaces", "Contact locations that redirect actions into the structure."],
      ["e3", "mechanism", "Beam, shaft and joint actions", "Bending, shear, torsion and clamp transfer inside components."],
      ["e4", "criterion", "Element capacity checks", "Stress, deflection, slip and clamp criteria for each action."],
      ["e5", "decision", "Supported drivetrain", "Accepted assembly whose complete load path satisfies every element check."]
    ],
    relations: [
      ["r1", "routes", "Motor force and torque route through the declared mount and support interfaces.", "directed", "one-to-many"],
      ["r2", "transforms", "Interfaces transform external actions into beam, shaft and joint internal actions.", "directed", "many-to-many"],
      ["r3", "maps", "Each internal action maps to an element-specific stress, deformation or slip check.", "directed", "many-to-many"],
      ["r4", "supports", "Passing element checks supports acceptance of the complete drivetrain assembly.", "directed", "many-to-one"],
      ["r5", "invalidates", "A missing interface or reaction invalidates the claimed load path and capacity.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "All applied actions, supports, contacts and fastener interfaces are drawn."],
      ["c2", "operating-state", "Each element model uses the action and boundary conditions actually reaching it."],
      ["c3", "criterion", "Every element on the path satisfies its stress, deformation and joint-function limits."],
      ["c4", "boundary", "An omitted reaction, eccentricity or interface blocks assembly acceptance."]
    ],
    failureMechanism:
      "The analysis jumps from the external load to one favoured component and omits interfaces that redirect or amplify the action.",
    failureConsequence:
      "Beam bending, shaft torsion or fastener slip can govern even though the isolated calculation appears safe.",
    failureCriterion:
      "Reject the assembly model when any applied action cannot be traced continuously to a support through checked interfaces.",
    conceptualSteps: [
      "Draw every applied force, torque, contact and support reaction.",
      "Trace how each interface redirects the action through the assembly.",
      "Assign beam, shaft and fastener models to the internal actions they carry.",
      "Check capacity, deformation and joint function at every governing location.",
      "Reject any assembly conclusion with an unclosed or unchecked load path."
    ],
    example: {
      scenario:
        "A cantilevered motor bracket transfers motor weight and reaction torque through a plate and four preloaded bolts into a rigid chassis.",
      givenLabel: "Declared interfaces",
      givenValue: "motor, bracket, four-bolt joint, chassis",
      givenUnit: null,
      reasoning: [
        "Motor actions first enter the bracket at the mounting face and reach the chassis through the bolt-clamped interface.",
        "The bracket carries bending and shear while the joint must retain clamp and resist slip or bearing.",
        "Separate bracket and fastener checks close the path from motor to chassis."
      ],
      outcome:
        "The assembly model includes the bracket bending check and the preloaded-joint function check.",
      criterion:
        "Every action reaches the chassis through an interface with a compatible capacity and deformation check.",
      verification:
        "Mark each free-body reaction and confirm the vector sum of external actions closes for every isolated part."
    },
    counterexample: {
      scenario:
        "Only the motor shaft torsion is calculated while the offset motor mass, bracket bending and bolt-group reaction are omitted.",
      givenLabel: "Checked component",
      givenValue: "shaft torsion only",
      givenUnit: null,
      reasoning: [
        "The offset weight introduces a bracket moment before any shaft calculation is considered.",
        "The joint must transfer the bracket reactions into the chassis.",
        "An isolated shaft check does not establish bracket or joint capacity."
      ],
      outcome:
        "The drivetrain support remains unverified despite a passing shaft calculation.",
      criterion:
        "All branches of the load path require compatible checks.",
      verification:
        "Redraw the complete assembly free-body diagram and list one governing check at every interface."
    },
    misconception: {
      claim: "If the main shaft is strong enough, the mounted drivetrain is structurally safe.",
      mechanism:
        "Support reactions, bracket deformation and fastener clamp behaviour are excluded from the system boundary.",
      correction:
        "Trace every force and moment through the complete assembly before checking each element with its actual action.",
      disconfirmingObservation:
        "The shaft remains elastic while the flexible bracket rotates and the joint begins to slip."
    },
    assessmentMoves: [
      "ordering supports, interfaces, internal actions and element checks",
      "recovering an omitted bracket-and-joint branch of the path",
      "screening capacity claims against the actions each element carries",
      "diagnosing the first missing reaction in an incomplete free-body model",
      "explaining why load path and preload are system properties",
      "matching beam, shaft and fastener checks to actual boundaries",
      "reading the drivetrain path from motor actions to chassis reactions",
      "rejecting shaft-only acceptance when support actions remain unchecked"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E2-D09-L04",
    systemModel:
      "Bearings constrain shaft motion while gears, belts or chains transmit and transform rotary speed and torque between supported shafts.",
    failurePattern:
      "Applying an ideal speed ratio without checking bearing reactions, alignment, efficiency, lubrication or tension treats transmission geometry as the complete machine.",
    visualExplanation:
      "A power-flow diagram shows input shaft, supports, transmission element, output shaft and service check, with speed and torque annotations on both sides.",
    applicationTask:
      "Choose and assess a simple speed-reduction transmission for a robot wheel, including ratio, support, alignment and maintenance reasoning.",
    terms: [
      [
        "t1",
        "transmission ratio",
        "Transmission ratio relates input and output angular speed through gear teeth, pulley diameters or sprocket teeth.",
        "The ideal kinematic ratio does not include slip, elastic deflection, efficiency loss or control dynamics."
      ],
      [
        "t2",
        "bearing reaction",
        "A bearing reaction is the force a support applies to constrain shaft motion under radial or axial load.",
        "A bearing type supports only the load directions and misalignment allowed by its geometry and rating."
      ],
      [
        "t3",
        "pitch element",
        "A pitch circle or pitch line is the ideal rolling geometry used to relate motion in gears, belts or chains.",
        "Pitch geometry is a kinematic model and does not by itself prove tooth, belt or chain capacity."
      ]
    ],
    entities: [
      ["e1", "input", "Motor shaft duty", "Input speed, torque, radial loads and operating schedule."],
      ["e2", "component", "Bearing-supported input", "Input shaft and bearings establishing alignment and load reactions."],
      ["e3", "mechanism", "Gear, belt or chain stage", "Transmission element that carries power and changes speed and torque."],
      ["e4", "observation", "Output motion and loads", "Resulting speed, torque, tension and bearing reactions at the output."],
      ["e5", "decision", "Serviceable transmission", "Selected stage meeting duty, support, lubrication and maintenance criteria."]
    ],
    relations: [
      ["r1", "constrains", "The motor shaft duty is constrained by the input bearing arrangement.", "directed", "one-to-one"],
      ["r2", "routes", "The supported input routes power into the chosen transmission stage.", "directed", "one-to-one"],
      ["r3", "transforms", "The transmission stage transforms input speed and torque into output motion and loads.", "directed", "one-to-many"],
      ["r4", "compares", "Output motion, reactions and service needs are compared with the full duty.", "directed", "many-to-one"],
      ["r5", "invalidates", "Misalignment, slip or inadequate service provision invalidates ideal-ratio acceptance.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Input duty includes speed, torque, direction, radial load and operating schedule."],
      ["c2", "operating-state", "Ratio, efficiency, alignment, tension and support reactions are evaluated together."],
      ["c3", "criterion", "Output duty and bearing or transmission ratings remain within allowed service limits."],
      ["c4", "boundary", "Uncontrolled slip, misalignment, lubrication loss or overload blocks acceptance."]
    ],
    failureMechanism:
      "The ideal geometric ratio is accepted while the forces and service conditions needed to realise it are omitted.",
    failureConsequence:
      "Output speed may drift, bearings may overload, teeth may wear or a belt or chain may lose engagement.",
    failureCriterion:
      "Reject a transmission whose ratio is correct but support, capacity or maintenance evidence is absent.",
    conceptualSteps: [
      "State input and required output speed, torque and operating schedule.",
      "Choose bearing constraints that support the shaft loads and alignment.",
      "Apply the gear, belt or chain ratio and trace the accompanying forces.",
      "Check output duty, transmission capacity, support ratings and service needs.",
      "Treat slip, misalignment or lubrication loss as boundaries on ideal behaviour."
    ],
    example: {
      scenario:
        "A 20-tooth input gear drives a 60-tooth output gear from a motor turning at 900 revolutions per minute.",
      givenLabel: "Gear tooth counts and input speed",
      givenValue: "20 driving 60 at 900",
      givenUnit: "r/min",
      reasoning: [
        "The external gear pair has a reduction ratio of 60 divided by 20, which is 3.",
        "Ideal output speed is 900 divided by 3, which is 300 r/min, with opposite rotation direction.",
        "Bearing reactions, tooth capacity, efficiency and lubrication are then checked at the resulting duty."
      ],
      outcome:
        "The ideal output speed is 300 r/min; the physical transmission is accepted only after support and service checks.",
      criterion:
        "The stage must meet ratio, tooth-load, bearing, alignment and lubrication limits.",
      verification:
        "Confirm three input revolutions produce one output revolution in the pitch-geometry model and separately audit reaction loads."
    },
    counterexample: {
      scenario:
        "A belt drive is declared equivalent to the ideal pulley-diameter ratio even though the belt slips during peak acceleration.",
      givenLabel: "Observed peak behaviour",
      givenValue: "belt slip",
      givenUnit: null,
      reasoning: [
        "Slip breaks the no-slip relation used by the ideal diameter ratio.",
        "The output speed and torque no longer follow the predicted kinematic transformation.",
        "A ratio calculation cannot pass the service criterion while slip persists."
      ],
      outcome:
        "The ideal ratio is not a valid prediction during the peak event.",
      criterion:
        "The selected transmission must retain engagement and support loads across the declared duty.",
      verification:
        "Measure input and output speed through the acceleration event and inspect tension, wrap and alignment."
    },
    misconception: {
      claim: "Matching the required gear or pulley ratio completes the transmission design.",
      mechanism:
        "Kinematic geometry is mistaken for proof of load capacity, support, efficiency and service life.",
      correction:
        "Use ratio to establish motion, then calculate forces and check bearings, transmission capacity, alignment and maintenance.",
      disconfirmingObservation:
        "The calculated output speed is correct at no load but changes when the belt slips under acceleration."
    },
    assessmentMoves: [
      "sequencing input duty, support, transmission and output service checks",
      "repairing an ideal-ratio claim after slip or misalignment appears",
      "screening speed and torque claims through engagement evidence",
      "diagnosing whether support reaction or transmission contact caused loss",
      "explaining the boundary between pitch geometry and real service",
      "matching bearings and transmission elements to their governing loads",
      "reading rotary power flow from motor shaft to wheel output",
      "replacing ratio-only selection with a supported service decision"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E2-D09-L05",
    systemModel:
      "Mechanisms constrain relative motion through geometry, springs store and return energy, and couplings transfer rotation while accommodating only bounded misalignment.",
    failurePattern:
      "Treating a spring, coupling or linkage as an unconstrained motion source ignores travel limits, singular positions, stored energy and reaction forces.",
    visualExplanation:
      "A motion-state graph links actuator input to linkage geometry, spring deflection, coupling accommodation and the resulting bounded output path.",
    applicationTask:
      "Explain how a spring-assisted linkage changes actuator motion and identify travel, energy and alignment limits before testing.",
    terms: [
      [
        "t1",
        "mechanical linkage",
        "A mechanical linkage is a connected set of members and joints that constrains motion through geometry.",
        "Its motion relation changes with configuration and may become singular or reach a hard stop."
      ],
      [
        "t2",
        "spring rate",
        "Spring rate is the change in spring force per unit deflection within the stated operating range.",
        "A constant rate model does not cover coil bind, yielding, friction or geometric nonlinearity."
      ],
      [
        "t3",
        "coupling misalignment",
        "Coupling misalignment is the offset or angular error accommodated between connected rotating shafts.",
        "Every coupling has finite angular, parallel and axial limits plus reaction loads."
      ]
    ],
    entities: [
      ["e1", "input", "Actuator motion", "Commanded displacement and force entering the mechanism."],
      ["e2", "mechanism", "Linkage geometry", "Joint locations and member lengths constraining the motion path."],
      ["e3", "state", "Spring and coupling state", "Stored spring energy and bounded shaft-alignment accommodation."],
      ["e4", "observation", "Output path and force", "Resulting position, mechanical advantage and reaction force."],
      ["e5", "decision", "Bounded mechanism", "Accepted mechanism operating away from hard stops, singularity and overload."]
    ],
    relations: [
      ["r1", "transforms", "Actuator motion is transformed by the linkage geometry.", "directed", "one-to-one"],
      ["r2", "constrains", "Linkage geometry constrains spring deflection and coupling alignment state.", "directed", "one-to-many"],
      ["r3", "causes", "Spring and coupling state causes output force and reaction changes.", "directed", "many-to-many"],
      ["r4", "compares", "The output path and force are compared with travel, load and alignment limits.", "directed", "many-to-one"],
      ["r5", "invalidates", "A hard stop, singularity, coil bind or excess misalignment invalidates the motion model.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Joint geometry, actuator travel, spring datum and shaft alignment are measured."],
      ["c2", "operating-state", "Motion remains within the spring-rate range and coupling accommodation limits."],
      ["c3", "criterion", "The full path clears hard stops and satisfies output force and reaction limits."],
      ["c4", "boundary", "Singularity, coil bind or excessive misalignment blocks continued motion."]
    ],
    failureMechanism:
      "The geometric and stored-energy boundaries are omitted from an otherwise correct local motion relation.",
    failureConsequence:
      "Force can rise sharply, motion can lock or coupling reactions can overload bearings.",
    failureCriterion:
      "Reject operation when any configuration reaches a hard stop, singularity, spring limit or coupling misalignment limit.",
    conceptualSteps: [
      "Define actuator input, joint geometry, spring datum and shaft alignment.",
      "Use linkage geometry to map input motion through each configuration.",
      "Calculate spring deflection and identify coupling reaction changes along the path.",
      "Compare output motion and force with travel, load and alignment criteria.",
      "Stop the model at singularity, coil bind, hard contact or excess misalignment."
    ],
    example: {
      scenario:
        "A linear spring with rate 800 N/m is compressed 0.050 m within its rated travel to assist a small linkage.",
      givenLabel: "Spring rate and compression",
      givenValue: "800 N/m at 0.050 m",
      givenUnit: null,
      reasoning: [
        "Within the linear range, spring force is 800 multiplied by 0.050, which is 40 N.",
        "Stored energy is one half multiplied by 800 multiplied by 0.050 squared, which is 1.0 J.",
        "The linkage path is then checked to keep this force and energy away from hard stops and singular positions."
      ],
      outcome:
        "The spring contributes 40 N at the stated position and stores 1.0 J within the bounded linear model.",
      criterion:
        "The spring and linkage must remain within rated travel, force, energy and geometric limits.",
      verification:
        "Integrate force from zero to 0.050 m as the triangle under the linear force-deflection graph to recover 1.0 J."
    },
    counterexample: {
      scenario:
        "The linear spring equation is extrapolated beyond rated travel until the coils touch, while the linkage model continues to predict motion.",
      givenLabel: "Altered state",
      givenValue: "coil bind reached",
      givenUnit: null,
      reasoning: [
        "Coil contact removes the free deflection assumed by the linear spring model.",
        "The mechanism encounters a hard motion boundary and reaction force rises outside the predicted path.",
        "A model that continues through coil bind cannot satisfy the motion criterion."
      ],
      outcome:
        "Predicted motion and force beyond coil bind are invalid.",
      criterion:
        "Motion must stop before spring, linkage or coupling bounds are exceeded.",
      verification:
        "Measure available travel, mark the coil-bind position and replay the full linkage path against that limit."
    },
    misconception: {
      claim: "A flexible coupling or spring removes alignment and travel constraints.",
      mechanism:
        "Accommodation is treated as unlimited and the resulting reactions or stored energy are ignored.",
      correction:
        "Use the rated motion range and calculate force, energy and reaction changes throughout the mechanism path.",
      disconfirmingObservation:
        "Bearing reaction rises and the linkage stalls when the coupling or spring reaches its finite limit."
    },
    assessmentMoves: [
      "ordering actuator motion, linkage geometry, stored energy and output checks",
      "repairing a motion prediction after coil bind or singularity appears",
      "screening force claims within the spring and coupling ranges",
      "diagnosing the first geometric or energy boundary crossed",
      "explaining how a linkage and spring jointly shape motion",
      "matching configuration changes to force and alignment conditions",
      "reading the motion-state graph across the full actuator path",
      "rejecting unlimited-compliance reasoning at a finite mechanism boundary"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E2-D09-L06",
    systemModel:
      "Machine design carries a declared duty through transmission ratio, power flow, losses, contact, lubrication, tolerance and service access before a complete assembly is accepted.",
    failurePattern:
      "Selecting each element from peak power alone ignores duty cycle, efficiency, thermal accumulation, contact conditions and maintainability.",
    visualExplanation:
      "A machine-duty graph follows motor input through transmission loss and contact state to delivered output, temperature and a serviceable assembly decision.",
    applicationTask:
      "Assess a small robot gearbox from motor power to delivered output and explain how efficiency, thermal duty, lubrication and tolerance bound the design.",
    terms: [
      [
        "t1",
        "duty cycle",
        "Duty cycle describes how load and rest intervals repeat over the operating schedule.",
        "A single percentage is incomplete unless load level, interval duration and thermal starting state are declared."
      ],
      [
        "t2",
        "transmission efficiency",
        "Transmission efficiency is useful output power divided by input power for a stated operating point.",
        "Efficiency varies with speed, load, temperature, lubrication and component condition."
      ],
      [
        "t3",
        "tribological contact",
        "A tribological contact is an interacting surface pair whose friction, wear and lubrication affect function.",
        "A lubricant choice is valid only for the contact regime, materials, temperature and service interval."
      ]
    ],
    entities: [
      ["e1", "input", "Motor duty", "Input power, speed, torque and repeated operating schedule."],
      ["e2", "mechanism", "Transmission ratio and contact", "Gear geometry and surface contacts carrying load."],
      ["e3", "state", "Loss and thermal state", "Frictional power loss, lubricant condition and accumulated temperature."],
      ["e4", "observation", "Delivered output and wear evidence", "Output power plus temperature, noise, backlash and wear observations."],
      ["e5", "decision", "Serviceable machine design", "Assembly satisfying output, thermal, tolerance, safety and access requirements."]
    ],
    relations: [
      ["r1", "maps", "Motor duty maps into transmission speed, torque and repeated contact loading.", "directed", "one-to-many"],
      ["r2", "causes", "Transmission contact causes power loss and thermal or lubricant state changes.", "directed", "one-to-many"],
      ["r3", "measures", "Loss and thermal state are reflected in delivered output and wear evidence.", "directed", "many-to-many"],
      ["r4", "supports", "Bounded output and wear evidence support the serviceable machine decision.", "directed", "many-to-one"],
      ["r5", "invalidates", "Unmodelled duty, loss or service constraint invalidates isolated element sizing.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Motor load, speed, duration, repetition and ambient conditions are declared."],
      ["c2", "operating-state", "Efficiency and contact behaviour are evaluated at the actual duty and lubricant state."],
      ["c3", "criterion", "Delivered output, temperature, wear, tolerance and service access remain acceptable."],
      ["c4", "boundary", "Thermal runaway, lubrication loss, excessive wear or inaccessible service blocks acceptance."]
    ],
    failureMechanism:
      "Peak rating is substituted for the time-dependent machine duty and the associated loss and contact state.",
    failureConsequence:
      "The gearbox can meet a brief power check yet overheat, wear rapidly or become unserviceable.",
    failureCriterion:
      "Reject the assembly when delivered output or any thermal, tribological, tolerance or service limit is unsupported.",
    conceptualSteps: [
      "Define motor power, speed, torque and the complete operating schedule.",
      "Map the duty through transmission ratio and contact loading.",
      "Calculate delivered power and losses at the relevant operating points.",
      "Compare temperature, wear, tolerance and output evidence with criteria.",
      "Include lubrication and service access before accepting the assembly."
    ],
    example: {
      scenario:
        "A motor supplies 500 W to a gearbox whose measured efficiency at the stated duty is 0.80.",
      givenLabel: "Input power and efficiency",
      givenValue: "500 W at 0.80",
      givenUnit: null,
      reasoning: [
        "Useful output power equals 500 W multiplied by 0.80, giving 400 W.",
        "The remaining 100 W is loss at this operating point and contributes to the thermal state.",
        "The design is checked for 400 W output, 100 W loss, duty duration, lubrication and service access."
      ],
      outcome:
        "The gearbox delivers 400 W and dissipates 100 W at the stated operating point.",
      criterion:
        "Output duty must be met while temperature, lubrication, wear and service limits remain satisfied.",
      verification:
        "Reconcile the power balance: 500 W input equals 400 W useful output plus 100 W loss."
    },
    counterexample: {
      scenario:
        "A gearbox rated for the motor peak power is accepted without checking that repeated operation accumulates heat faster than it can be removed.",
      givenLabel: "Evidence used",
      givenValue: "peak power rating only",
      givenUnit: null,
      reasoning: [
        "Peak capacity does not specify repeated duration or thermal recovery.",
        "Accumulated loss can raise temperature even while instantaneous tooth load remains below rating.",
        "An unbounded thermal state prevents machine acceptance."
      ],
      outcome:
        "The peak rating alone does not establish gearbox suitability for the repeated duty.",
      criterion:
        "Power, thermal and tribological limits must hold across the complete operating schedule.",
      verification:
        "Measure temperature through repeated cycles and compare the stabilised state with lubricant and component limits."
    },
    misconception: {
      claim: "A gearbox is suitable whenever its catalogue power rating exceeds motor power.",
      mechanism:
        "Duty cycle, operating-point efficiency, thermal rejection, lubrication and service conditions are hidden behind one rating.",
      correction:
        "Trace power and loss through the declared schedule and verify contact, temperature, tolerance and maintenance limits.",
      disconfirmingObservation:
        "The gearbox passes a brief load test but temperature continues rising during repeated cycles."
    },
    assessmentMoves: [
      "sequencing declared duty through power flow, loss and service evidence",
      "repairing peak-rating acceptance after thermal accumulation appears",
      "screening gearbox claims with operating-point efficiency and contact data",
      "diagnosing whether duty, loss or lubrication caused the observed drift",
      "explaining why useful output and tribological state must be reconciled",
      "matching power, thermal and wear evidence to their criteria",
      "reading motor input through contacts to a serviceable output",
      "replacing isolated rating selection with whole-machine duty reasoning"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E2-D09-L07",
    systemModel:
      "Mechanical safety identifies hazardous energy, isolates and contains it, then uses inspection evidence and acceptance criteria to authorise operation or maintenance.",
    failurePattern:
      "A machine is treated as safe because it is switched off or recently serviced, while stored energy, moving parts and degradation evidence remain uncontrolled.",
    visualExplanation:
      "A safety-state map moves from hazard identification through isolation and verification to inspection findings, acceptance decision and controlled return to service.",
    applicationTask:
      "Prepare a beginner inspection and isolation rationale for a robot lift mechanism with gravity, spring and rotating-drive hazards.",
    terms: [
      [
        "t1",
        "hazardous energy",
        "Hazardous energy is stored or moving energy capable of causing harm if released or contacted.",
        "Electrical disconnection alone does not remove gravity, pressure, spring, thermal or rotational energy."
      ],
      [
        "t2",
        "positive isolation",
        "Positive isolation physically prevents energy transmission and is verified before exposure.",
        "A control command or indicator light is not by itself verified isolation."
      ],
      [
        "t3",
        "inspection criterion",
        "An inspection criterion states the observable condition that permits continued service, repair or rejection.",
        "An interval without a measurable acceptance limit cannot determine component condition."
      ]
    ],
    entities: [
      ["e1", "input", "Lift hazard inventory", "Gravity, spring, electrical and rotational energy plus accessible moving zones."],
      ["e2", "mechanism", "Isolation and restraint", "Disconnects, blocks and restraints preventing energy release."],
      ["e3", "observation", "Verified zero-energy state", "Measured or physically demonstrated absence of dangerous motion and energy."],
      ["e4", "observation", "Inspection evidence", "Wear, cracks, looseness, leakage, guard and function observations."],
      ["e5", "decision", "Return-to-service authority", "Documented accept, repair or reject decision after controls and checks."]
    ],
    relations: [
      ["r1", "maps", "The hazard inventory maps each energy source to an isolation or restraint method.", "directed", "one-to-many"],
      ["r2", "causes", "Correct isolation and restraint create a verified zero-energy state.", "directed", "many-to-one"],
      ["r3", "supports", "The verified state supports safe access for the specified inspection.", "directed", "one-to-one"],
      ["r4", "compares", "Inspection evidence is compared with explicit return-to-service criteria.", "directed", "many-to-one"],
      ["r5", "invalidates", "Uncontrolled energy or unresolved degradation invalidates return-to-service authority.", "directed", "one-to-one"]
    ],
    conditions: [
      ["c1", "assumption", "Every electrical, gravitational, elastic and rotational energy source is identified."],
      ["c2", "operating-state", "Isolation, restraint and zero-energy verification precede access."],
      ["c3", "criterion", "Inspection evidence satisfies explicit accept, repair or reject limits before release."],
      ["c4", "boundary", "Any uncontrolled energy or unresolved reject condition prevents access or return to service."]
    ],
    failureMechanism:
      "A switch state or elapsed service interval substitutes for verified energy control and observed component condition.",
    failureConsequence:
      "Unexpected motion or an undetected degraded part can injure a person or cause mechanical failure.",
    failureCriterion:
      "Do not access or release the lift while any hazardous energy or rejection criterion remains unresolved.",
    conceptualSteps: [
      "List all energy sources and accessible motion zones for the lift.",
      "Assign a physical isolation or restraint to every hazardous source.",
      "Verify the resulting zero-energy state before inspection begins.",
      "Compare observed condition with explicit acceptance and rejection limits.",
      "Authorise return to service only after controls are removed in a defined sequence."
    ],
    example: {
      scenario:
        "Before inspecting a robot lift chain, the supply is isolated, the raised carriage is mechanically blocked and spring tension is released and verified.",
      givenLabel: "Controlled energy sources",
      givenValue: "electrical, gravity and spring",
      givenUnit: null,
      reasoning: [
        "The inventory distinguishes three energy forms requiring different controls.",
        "Disconnection, a rated mechanical block and spring release prevent each identified energy path.",
        "A try-test and physical stability check establish the bounded state before chain inspection."
      ],
      outcome:
        "The chain can be inspected only after all three energy controls are independently verified.",
      criterion:
        "Safe access requires every identified energy source to be isolated, restrained or dissipated and verified.",
      verification:
        "Trace each hazard to its control and perform the specified zero-energy check before entering the motion zone."
    },
    counterexample: {
      scenario:
        "The lift is switched off at the control panel and immediate access begins while the raised carriage remains supported only by the drive.",
      givenLabel: "Observed control state",
      givenValue: "panel switched off",
      givenUnit: null,
      reasoning: [
        "A panel command does not physically restrain gravitational potential energy.",
        "Drive or brake failure can release the carriage into the access zone.",
        "Uncontrolled gravity violates the zero-energy access boundary."
      ],
      outcome:
        "The switched-off state is not safe isolation for work beneath the carriage.",
      criterion:
        "A rated physical restraint and verification are required before access.",
      verification:
        "Install the specified mechanical block, verify load transfer and repeat the energy inventory."
    },
    misconception: {
      claim: "If a machine is off and within its maintenance interval, it is safe to inspect.",
      mechanism:
        "Control state and elapsed time replace physical isolation, condition evidence and explicit acceptance limits.",
      correction:
        "Control every hazardous energy source, verify the safe state and inspect against measurable criteria.",
      disconfirmingObservation:
        "The switched-off lift descends when a holding brake loses pressure."
    },
    assessmentMoves: [
      "sequencing hazard inventory, isolation, verification and release",
      "repairing panel-only shutdown with gravity and spring controls",
      "screening safety claims against physical isolation evidence",
      "diagnosing the uncontrolled energy behind an unsafe access state",
      "explaining why inspection interval and condition criterion differ",
      "matching energy sources and degradation findings to controls",
      "reading the safety state from hazard to return-to-service authority",
      "rejecting switched-off reassurance while stored energy remains"
    ],
    variant: 6
  }
] satisfies readonly AcademyE2LessonSource[];

const d09 = buildAcademyE2UnitProfiles("D09", lessonSources);

export const academyLessonTeachingProfileV2PlansE2D09 = d09.plans;
export const academyLessonTeachingProfileV2LessonIdsE2D09 = d09.lessonIds;
export const academyLessonTeachingProfilesV2E2D09 = d09.profiles;

export default academyLessonTeachingProfilesV2E2D09;
