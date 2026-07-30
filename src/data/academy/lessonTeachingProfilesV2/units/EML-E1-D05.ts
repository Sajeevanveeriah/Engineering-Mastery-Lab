import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyDomainConditionTuple,
  type AcademyDomainEntityTuple,
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

type PhysicsSource = Readonly<{
  lessonId: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: readonly [
    readonly [string, string, string],
    readonly [string, string, string],
    readonly [string, string, string]
  ];
  entities: readonly [
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string]
  ];
  relationKinds: readonly [
    AcademyDomainRelationTuple[1],
    AcademyDomainRelationTuple[1],
    AcademyDomainRelationTuple[1],
    AcademyDomainRelationTuple[1],
    AcademyDomainRelationTuple[1]
  ];
  relationText: readonly [string, string, string, string, string];
  conditions: readonly [
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string]
  ];
  failure: readonly [string, string, string];
  steps: readonly [string, string, string, string, string];
  worked: Readonly<{
    scenario: string;
    given: string;
    unit: string | null;
    reasoning: readonly [string, string, string];
    outcome: string;
    criterion: string;
    verification: string;
  }>;
  counter: Readonly<{
    scenario: string;
    given: string;
    unit: string | null;
    reasoning: readonly [string, string, string];
    outcome: string;
    criterion: string;
    verification: string;
  }>;
  misconception: readonly [string, string, string, string];
  moves: readonly [string, string, string, string, string, string, string, string];
  variant: number;
}>;

const instruction = (
  source: PhysicsSource,
  slot: number
): AcademyLessonV2InstructionPlan => {
  const first = source.terms[0][0];
  const second = source.terms[1][0];
  const observation = source.entities[3][1];
  const move = source.moves[slot];
  const copy: readonly (
    readonly [string, string, string, string, string, string, string]
  )[] = [
    [
      `Arrange ${first}, ${second} and ${observation} by ${move}:`,
      `${first} reaches ${observation} coherently because ${move} keeps ${second} vector-aware.`,
      `${second} is misplaced if ${move} reaches ${observation} before the ${first} boundary.`,
      `Sketch ${first} first and then proceed by ${move} towards ${second}.`,
      `Check the unit carried into ${observation} while ${move} uses ${second}.`,
      `Order the ${first} relations, explicitly ${move}, and retain ${second} signs.`,
      `End at ${observation} only after ${move} has respected the ${first} frame.`
    ],
    [
      `Repair ${observation} using ${first} and ${second} while ${move}:`,
      `${observation} is repaired when ${move} reconnects ${first} with ${second}.`,
      `${first} remains physically unsupported if ${move} ignores the altered ${observation}.`,
      `Locate the first broken ${second} link before ${move} restores ${first}.`,
      `Ask which ${observation} unit or direction changes as ${move} proceeds.`,
      `Reconstruct ${second} from ${first}, then apply ${move} to ${observation}.`,
      `Retest ${observation} against the ${first} criterion after ${move}.`
    ],
    [
      `Choose the ${first} and ${second} statements justified by ${move} at ${observation}:`,
      `The chosen ${first} statements preserve ${second} units and survive ${move}.`,
      `One ${observation} statement fails because ${move} breaks the ${first} mechanism.`,
      `Read every ${second} statement with its vector or scalar role before ${move}.`,
      `Keep the ${observation} claim only if ${first} remains bounded during ${move}.`,
      `Select relations that carry ${second} consistently through ${move}.`,
      `Reject the ${first} shortcut contradicted by ${observation} after ${move}.`
    ],
    [
      `Classify the altered ${observation} case by ${move} between ${second} and ${first}:`,
      `${second} exposes the altered ${observation} because ${move} honours ${first}.`,
      `${observation} is misclassified if ${move} silently changes the ${first} boundary.`,
      `Find the ${second} quantity whose condition changes before ${move}.`,
      `Contrast bounded ${first} evidence with altered ${observation} while ${move}.`,
      `Retain the ${second} relation that makes ${observation} observable during ${move}.`,
      `Remove the ${first} claim that cannot satisfy ${move} at ${observation}.`
    ],
    [
      `Explain ${first}, ${second} and ${observation} through ${move}:`,
      `The account is complete because ${move} links ${first} to ${second} and ${observation}.`,
      `The ${first} account is incomplete when ${move} omits the ${second} boundary.`,
      `State the unit and frame for ${first} before ${move} introduces ${second}.`,
      `Describe what ${observation} would show if ${move} failed at ${second}.`,
      `Connect ${first} to ${second} with the mechanism used while ${move}.`,
      `Conclude with the ${observation} criterion limiting ${first} after ${move}.`
    ],
    [
      `Pair ${first} relations with ${second} conditions by ${move} around ${observation}:`,
      `Each ${first} relation meets the ${second} condition that controls it during ${move}.`,
      `A ${observation} pairing fails because ${move} assigns the wrong ${first} limit.`,
      `Match the first ${second} transfer to its ${first} assumption before ${move}.`,
      `Keep the ${observation} criterion for the final relation reached by ${move}.`,
      `Align ${first} and ${second} according to the physical dependency exposed by ${move}.`,
      `Read each ${observation} pair backwards to verify ${move} and ${first}.`
    ],
    [
      `Trace the ${first} diagram by ${move} across ${second} and ${observation}:`,
      `The implication is physical because ${move} carries ${second} into ${observation} within ${first}.`,
      `The ${first} diagram is misread when ${move} skips the ${second} path.`,
      `Begin at the ${first} input and follow the first edge used while ${move}.`,
      `Inspect the ${observation} edge whose direction or unit is controlled by ${second}.`,
      `Follow ${second} through ${move} before evaluating ${observation}.`,
      `Choose the ${observation} implication that preserves ${first} under ${move}.`
    ],
    [
      `Interrogate the alternate ${observation} graph by ${move} with ${first} and ${second}:`,
      `${observation} supports the answer because ${move} retains the active ${second} path.`,
      `${first} is overclaimed if ${move} treats a suppressed ${second} relation as active.`,
      `Start from altered ${observation} and locate the ${first} condition changed by ${move}.`,
      `Compare active and suppressed ${second} edges while ${move} acts.`,
      `Rebuild the ${first} route from the ${observation} evidence left by ${move}.`,
      `Accept ${second} only when the final ${observation} route agrees with ${move}.`
    ]
  ];
  const selected = copy[slot];
  if (!selected) throw new Error(`Missing D05 instruction ${slot}.`);
  return [
    selected[0],
    selected[1],
    selected[2],
    [selected[3], selected[4]],
    [selected[5], selected[6]]
  ];
};

const relationEndpoints = [
  [["e1"], ["e2"]],
  [["e2"], ["e3"]],
  [["e3"], ["e4"]],
  [["e4"], ["e5"]],
  [["e1"], ["e5"]]
] as const;

const conditionBindings = [
  [["e1", "e2"], ["r1"]],
  [["e2", "e3"], ["r2", "r3"]],
  [["e4", "e5"], ["r4"]],
  [["e1", "e5"], ["r5"]]
] as const;

const orderingPatterns = [
  [
    [["base-1", ["r1"], ["c1"]], ["base-2", ["r2"], ["c2"]], ["base-3", ["r3"], ["c2"]], ["base-4", ["r4"], ["c3"]]],
    [["retry-1", ["r5"], ["c4"]], ["retry-2", ["r2", "r3"], ["c2"]], ["retry-3", ["r4"], ["c3"]]]
  ],
  [
    [["base-1", ["r1", "r2"], ["c1"]], ["base-2", ["r3"], ["c2"]], ["base-3", ["r4", "r5"], ["c3"]]],
    [["retry-1", ["r5"], ["c4"]], ["retry-2", ["r1"], ["c1"]], ["retry-3", ["r2"], ["c2"]], ["retry-4", ["r4"], ["c3"]]]
  ],
  [
    [["base-1", ["r1"], ["c1"]], ["base-2", ["r2", "r3"], ["c2"]], ["base-3", ["r4"], ["c3"]], ["base-4", ["r5"], ["c3"]]],
    [["retry-1", ["r5"], ["c4"]], ["retry-2", ["r3"], ["c2"]], ["retry-3", ["r4"], ["c3"]]]
  ],
  [
    [["base-1", ["r1"], ["c1"]], ["base-2", ["r2"], ["c2"]], ["base-3", ["r3"], ["c2"]], ["base-4", ["r4"], ["c3"]], ["base-5", ["r5"], ["c3"]]],
    [["retry-1", ["r5"], ["c4"]], ["retry-2", ["r1", "r2"], ["c1"]], ["retry-3", ["r3", "r4"], ["c2", "c3"]]]
  ],
  [
    [["base-1", ["r1"], ["c1"]], ["base-2", ["r2"], ["c1"]], ["base-3", ["r3", "r4"], ["c2", "c3"]]],
    [["retry-1", ["r5"], ["c4"]], ["retry-2", ["r2"], ["c2"]], ["retry-3", ["r3"], ["c2"]], ["retry-4", ["r4"], ["c3"]]]
  ],
  [
    [["base-1", ["r1"], ["c1"]], ["base-2", ["r2"], ["c2"]], ["base-3", ["r3"], ["c2"]], ["base-4", ["r4", "r5"], ["c3"]]],
    [["retry-1", ["r5"], ["c4"]], ["retry-2", ["r1"], ["c1"]], ["retry-3", ["r3", "r4"], ["c2", "c3"]]]
  ],
  [
    [["base-1", ["r1", "r2"], ["c1", "c2"]], ["base-2", ["r3"], ["c2"]], ["base-3", ["r4"], ["c3"]], ["base-4", ["r5"], ["c3"]]],
    [["retry-1", ["r5"], ["c4"]], ["retry-2", ["r1"], ["c1"]], ["retry-3", ["r2", "r3"], ["c2"]], ["retry-4", ["r4"], ["c3"]]]
  ]
] as const;

const makePlan = (source: PhysicsSource): AcademyLessonTeachingProfileV2CompactPlan => {
  const terms = source.terms.map(
    (value, index): AcademyDomainTermTuple => [
      `t${index + 1}`,
      value[0],
      value[1],
      value[2],
      index === 0 ? "s1" : index === 1 ? "s2" : "s4"
    ]
  );
  const entities = source.entities.map(
    (value, index): AcademyDomainEntityTuple => [
      `e${index + 1}`,
      value[0],
      value[1],
      value[2]
    ]
  );
  const relations = source.relationText.map(
    (predicate, index): AcademyDomainRelationTuple => {
      const endpoints = relationEndpoints[index];
      const kind = source.relationKinds[index];
      if (!endpoints || !kind) throw new Error(`Missing D05 relation ${index}.`);
      return [
        `r${index + 1}`,
        kind,
        endpoints[0],
        endpoints[1],
        predicate,
        index === 2 ? "undirected" : "directed",
        index === 1 || index === 4 ? "many-to-one" : "one-to-one"
      ];
    }
  );
  const conditions = source.conditions.map(
    (value, index): AcademyDomainConditionTuple => {
      const binding = conditionBindings[index];
      if (!binding) throw new Error(`Missing D05 condition ${index}.`);
      return [`c${index + 1}`, value[0], value[1], binding[0], binding[1]];
    }
  );
  const patterns = orderingPatterns[source.variant];
  if (!patterns) throw new Error(`Missing D05 ordering pattern ${source.variant}.`);
  const q2Base = patterns[0];
  const q2Retry = patterns[1];

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
    failureBoundary: ["f1", "c4", source.failure[0], source.failure[1], source.failure[2], ["e1", "e5"], ["r5"]],
    conceptualModel: [
      ["s1", source.steps[0], ["e1", "e2"], ["r1"], ["c1"]],
      ["s2", source.steps[1], ["e2", "e3"], ["r2"], ["c2"]],
      ["s3", source.steps[2], ["e3", "e4"], ["r3"], ["c2"]],
      ["s4", source.steps[3], ["e4", "e5"], ["r4"], ["c3"]],
      ["s5", source.steps[4], ["e1", "e5"], ["r5"], ["c4"]]
    ],
    reasonedCases: [
      {
        id: "worked",
        kind: "example",
        scenario: source.worked.scenario,
        changedConditionIds: ["c1"],
        givens: [["worked-given", "Declared physical evidence", source.worked.given, source.worked.unit, "e1"]],
        reasoningSteps: [
          ["worked-1", source.worked.reasoning[0], ["e1", "e2"], ["r1"], ["c1"]],
          ["worked-2", source.worked.reasoning[1], ["e2", "e4"], ["r2", "r3"], ["c2"]],
          ["worked-3", source.worked.reasoning[2], ["e4", "e5"], ["r4"], ["c3"]]
        ],
        outcome: source.worked.outcome,
        criterionConditionId: "c3",
        criterion: source.worked.criterion,
        verification: source.worked.verification
      },
      {
        id: "counter",
        kind: "counterexample",
        scenario: source.counter.scenario,
        changedConditionIds: ["c4"],
        givens: [["counter-given", "Altered physical evidence", source.counter.given, source.counter.unit, "e1"]],
        reasoningSteps: [
          ["counter-1", source.counter.reasoning[0], ["e1", "e5"], ["r5"], ["c4"]],
          ["counter-2", source.counter.reasoning[1], ["e2", "e5"], ["r2", "r5"], ["c2", "c4"]],
          ["counter-3", source.counter.reasoning[2], ["e4", "e5"], ["r4", "r5"], ["c3", "c4"]]
        ],
        outcome: source.counter.outcome,
        criterionConditionId: "c3",
        criterion: source.counter.criterion,
        verification: source.counter.verification
      }
    ],
    misconception: {
      id: "misconception",
      claim: source.misconception[0],
      mechanism: source.misconception[1],
      correction: source.misconception[2],
      disconfirmingObservation: source.misconception[3],
      entityIds: ["e1", "e3", "e5"],
      relationIds: ["r2", "r5"],
      conditionIds: ["c2", "c4"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instruction(source, 0),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3"],
          steps: q2Base.map((value) => [value[0], value[1], value[2]]),
          correctOrder: q2Base.map((value) => value[0])
        },
        retry: {
          instruction: instruction(source, 1),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3"],
          steps: q2Retry.map((value) => [value[0], value[1], value[2]]),
          correctOrder: q2Retry.map((value) => value[0])
        }
      },
      q3: {
        base: {
          instruction: instruction(source, 2),
          focusRef: term("t1", "definition"),
          contextConditionIds: ["c1", "c2", "c3"],
          options: [
            ["base-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
            ["base-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
            ["base-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["base-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
          ]
        },
        retry: {
          instruction: instruction(source, 3),
          focusRef: reasonedCase("counter", "scenario"),
          contextConditionIds: ["c4", "c2", "c3"],
          options: [
            ["retry-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
            ["retry-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
            ["retry-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
            ["retry-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["retry-boundary", false, term("t3", "boundary"), condition("c3"), ["r4"], ["c3"], null]
          ]
        }
      },
      q4: {
        base: {
          kind: "short-response",
          instruction: instruction(source, 4),
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
          instruction: instruction(source, 5),
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
          instruction: instruction(source, 6),
          focusRef: reasonedCase("counter", "outcome"),
          contextConditionIds: ["c2", "c3", "c4"],
          positions: [["e1", 0, 0], ["e2", 1, 0], ["e3", 2, 0], ["e4", 3, 0], ["e5", 4, 0]],
          relationIds: ["r1", "r2", "r3"],
          answerRelationIds: ["r3"],
          options: [
            ["base-correct", true, reasonedCase("worked", "verification"), condition("c3"), ["r3", "r4"], ["c2", "c3"], null],
            ["base-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["base-boundary", false, term("t2", "boundary"), condition("c1"), ["r1"], ["c1"], null]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instruction(source, 7),
          focusRef: term("t3", "definition"),
          contextConditionIds: ["c1", "c3"],
          positions: [["e1", 0, 1], ["e2", 1, 1], ["e3", 2, 1], ["e4", 3, 1], ["e5", 4, 1]],
          relationIds: ["r3", "r4", "r5"],
          answerRelationIds: ["r4"],
          options: [
            ["retry-correct", true, reasonedCase("worked", "outcome"), reasonedCase("worked", "verification"), ["r4"], ["c3"], null],
            ["retry-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r5"], ["c4"], "misconception"],
            ["retry-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r3", "r5"], ["c2", "c4"], null]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("t1", "label"),
      focusRef: reasonedCase("worked", "verification"),
      modelKind: "causal-graph",
      positions: [["e1", 0, 0], ["e2", 1, 0], ["e3", 2, 0], ["e4", 3, 0], ["e5", 4, 0]],
      visibleEntityIds: ["e1", "e2", "e3", "e4", "e5"],
      visibleRelationIds: ["r1", "r2", "r3", "r4", "r5"],
      controls: [
        ["bounded", term("t2", "label"), ["c1"], ["e1", "e2", "e3"], ["r1", "r2"], ["r5"], [], [["bounded-note", source.visualExplanation, ["e1", "e2"], ["r1"]]], reasonedCase("worked", "verification")],
        ["altered", term("t3", "label"), ["c4"], ["e1", "e4", "e5"], ["r4", "r5"], ["r1"], [], [["altered-note", source.failure[1], ["e1", "e5"], ["r5"]]], reasonedCase("counter", "verification")]
      ]
    }
  };
};

const sources = [
  {
    lessonId: "EML-E1-D05-L01",
    systemModel:
      "Kinematics describes position, velocity and acceleration in a chosen frame; Newtonian mechanics then maps the vector sum of external forces on a bounded body to mass times acceleration.",
    failurePattern:
      "Mixing frames, treating velocity as force or omitting an external interaction makes a motion explanation dimensionally or causally incomplete.",
    visualExplanation:
      "A causal graph connects time-stamped position, velocity and acceleration, a free-body force sum and the resulting motion judgement.",
    applicationTask:
      "Explain a mobile robot's straight-line acceleration from a position trace and a free-body diagram using seconds, metres, metres per second, metres per second squared and newtons.",
    terms: [
      ["Kinematics", "Description of motion using position, velocity and acceleration without assigning its cause.", "It requires a stated reference frame and consistent time coordinate."],
      ["Net force", "The vector sum of external forces acting on the chosen body, measured in newtons.", "It excludes internal force pairs within the chosen system boundary."],
      ["Free-body model", "A representation of one bounded body and every external force acting on it.", "It is incomplete if contacts, gravity or actuator interactions crossing the boundary are omitted."]
    ],
    entities: [
      ["input", "Time-stamped position", "Robot position in metres at declared times in seconds and in one frame."],
      ["state", "Velocity and acceleration", "Signed motion rates in metres per second and metres per second squared."],
      ["mechanism", "External force sum", "The vector total of forces on the bounded robot in newtons."],
      ["observation", "Measured acceleration", "The acceleration inferred from the position record in the same frame."],
      ["decision", "Newtonian motion judgement", "A comparison of net force with mass times measured acceleration."]
    ],
    relationKinds: ["maps", "transforms", "causes", "compares", "invalidates"],
    relationText: [
      "the declared frame maps time-stamped position into a motion state",
      "time differences transform position changes into velocity and acceleration",
      "the external force sum causes acceleration of the bounded mass",
      "predicted acceleration is compared with measured acceleration in the same frame",
      "a missing force or mixed frame invalidates the Newtonian motion judgement"
    ],
    conditions: [
      ["assumption", "All positions use metres, all times use seconds and one inertial frame is retained."],
      ["boundary", "The robot mass is treated as constant and every force crossing the chosen body boundary is included in newtons."],
      ["criterion", "The accepted explanation matches vector direction and metres-per-second-squared acceleration on both kinematic and force paths."],
      ["operating-state", "The altered case changes frame or omits a contact force while retaining the original acceleration claim."]
    ],
    failure: [
      "The observed motion and the force model no longer describe the same bounded body in the same frame.",
      "Force balance and measured acceleration point in incompatible directions or carry incompatible units.",
      "Reject the explanation unless frame, mass, force boundary, vector signs and SI units are explicit."
    ],
    steps: [
      "Declare the position frame and pair metre values with second-valued times.",
      "Form velocity and acceleration from signed changes without assigning a cause yet.",
      "Draw the bounded robot and sum every external force vector in newtons.",
      "Compare net force divided by mass with measured acceleration in one frame.",
      "Reject a mixed-frame or missing-contact explanation."
    ],
    worked: {
      scenario:
        "A robot accelerates along a straight track while drive, rolling resistance and gravity are represented on one bounded body.",
      given: "signed position history and complete external force arrows",
      unit: "m, s and N",
      reasoning: [
        "Differentiate the position evidence within one stated frame to obtain signed acceleration.",
        "Sum drive and resistance forces along the same axis and retain their directions.",
        "Compare the measured acceleration with the net-force-over-mass prediction."
      ],
      outcome:
        "The motion and force descriptions agree when both predict the same signed acceleration in metres per second squared.",
      criterion:
        "Kinematic and Newtonian paths must refer to the same body, time interval, frame and direction.",
      verification:
        "Independently reconstruct acceleration from position samples and from the external force sum, then compare signs and SI units."
    },
    counter: {
      scenario:
        "A robot moves at constant velocity, yet a forward net force is asserted solely because it is moving.",
      given: "unchanging velocity in one inertial frame",
      unit: "m/s",
      reasoning: [
        "The altered claim confuses nonzero velocity with nonzero acceleration.",
        "Constant velocity gives zero acceleration in the declared inertial frame.",
        "A nonzero net force cannot satisfy the zero-acceleration comparison for constant mass."
      ],
      outcome:
        "Motion can continue with zero net force; velocity alone does not establish an unbalanced force.",
      criterion:
        "Net force is linked to acceleration, not to the mere presence of velocity.",
      verification:
        "Check successive velocity samples for change and sum the external force vectors rather than inferring force from motion."
    },
    misconception: [
      "A body moving forward must have a forward net force.",
      "Everyday resistance is generalised into a rule that force sustains velocity, so acceleration is overlooked.",
      "Separate kinematics from causes and relate net external force to acceleration in a stated inertial frame.",
      "A low-resistance cart continues at nearly constant velocity while the measured net horizontal force is near zero."
    ],
    moves: [
      "deriving acceleration before consulting the free-body cause",
      "repairing a constant-velocity claim that invents net force",
      "testing motion statements for frame, vector direction and SI dimensions",
      "separating evidence of velocity from evidence of acceleration",
      "explaining why a free-body boundary controls the force sum",
      "matching kinematic and dynamic links to frame and mass conditions",
      "reading position, acceleration and force as two converging paths",
      "exposing the omitted-contact route in the altered force graph"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E1-D05-L02",
    systemModel:
      "Statics requires zero resultant force and zero resultant moment, while dynamics permits acceleration and momentum tracks mass times velocity so impulse reconciles a change in motion.",
    failurePattern:
      "Checking force balance without moment balance can miss rotation, and applying a static equilibrium model during an impact suppresses momentum change.",
    visualExplanation:
      "A graph links a bounded body, external force set, moment reference, momentum change and the choice between equilibrium and dynamic analysis.",
    applicationTask:
      "Classify a robot bracket or collision as static or dynamic, then apply newtons, newton-metres and kilogram-metres per second consistently.",
    terms: [
      ["Static equilibrium", "A body state with zero vector force sum and zero moment sum about a declared point.", "Zero translational force alone does not exclude rotational acceleration."],
      ["Moment", "The rotational effect of a force about a point or axis, measured in newton-metres.", "It depends on perpendicular lever arm and sign convention, not force magnitude alone."],
      ["Momentum", "Mass times velocity, a vector measured in kilogram-metres per second.", "It is conserved only for a stated system when external impulse is negligible or accounted for."]
    ],
    entities: [
      ["component", "Bounded body", "The bracket, robot or colliding pair selected as the analysis system."],
      ["input", "External force set", "Applied, contact and weight forces in newtons with directions and application points."],
      ["mechanism", "Moment reference", "The chosen point and sign convention for newton-metre moments."],
      ["state", "Momentum change", "Initial-to-final kilogram-metre-per-second vector change during a time interval."],
      ["decision", "Regime classification", "The decision to use equilibrium, acceleration or impulse-momentum reasoning."]
    ],
    relationKinds: ["constrains", "causes", "maps", "compares", "invalidates"],
    relationText: [
      "the bounded body determines which forces are external",
      "external forces produce both resultant force and moments about the reference",
      "the chosen reference maps force application points into signed moments",
      "force and moment evidence is compared with momentum change to classify the regime",
      "an ignored moment or impact duration invalidates a static-equilibrium conclusion"
    ],
    conditions: [
      ["boundary", "One body or system is declared, and every interaction crossing that boundary is external."],
      ["assumption", "Static analysis requires negligible acceleration; impulse analysis retains the stated collision interval in seconds."],
      ["criterion", "Equilibrium requires both zero newton force sum and zero newton-metre moment sum, while dynamics reconciles momentum change."],
      ["operating-state", "The altered case has a nonzero couple or short impact even though the net-force-only check appears balanced."]
    ],
    failure: [
      "The selected regime omits rotational or transient evidence that crosses the body boundary.",
      "A supposedly static part rotates, or collision momentum changes without a matching external impulse.",
      "Reject equilibrium unless force and moment sums vanish; reject an impact model unless momentum and interval boundaries are explicit."
    ],
    steps: [
      "Draw the chosen body and identify every external force and application point.",
      "Sum force vectors in newtons and signed moments in newton-metres.",
      "Check whether acceleration is negligible or whether momentum changes over a finite interval.",
      "Classify the case as equilibrium, continuous dynamics or impulse-momentum.",
      "Reject a force-only static check when a moment or impact remains."
    ],
    worked: {
      scenario:
        "A wall bracket supports a stationary sensor through multiple contact forces at known application points.",
      given: "external forces with lever arms about one reference",
      unit: "N and m",
      reasoning: [
        "Bound the bracket and list reactions, weight and applied loads.",
        "Resolve vector forces and compute signed force-times-perpendicular-distance moments.",
        "Require both sums to vanish before classifying the bracket as static."
      ],
      outcome:
        "The bracket is in static equilibrium only when translational and rotational balances both close.",
      criterion:
        "The resultant force is zero newtons and the resultant moment is zero newton-metres about the declared reference.",
      verification:
        "Repeat the moment balance about a second point and confirm it agrees once the force balance is satisfied."
    },
    counter: {
      scenario:
        "Two equal and opposite forces form a couple, but the body is called static because the net force is zero.",
      given: "equal opposite forces at separated lines of action",
      unit: "N and m",
      reasoning: [
        "The altered force pair creates a nonzero signed moment despite zero resultant force.",
        "The separated lines of action produce rotational tendency about the chosen reference.",
        "A nonzero newton-metre sum fails the complete equilibrium criterion."
      ],
      outcome:
        "The force sum is balanced but the body is not in static equilibrium because a couple remains.",
      criterion:
        "Static equilibrium demands simultaneous force and moment balance.",
      verification:
        "Calculate the couple magnitude from force and perpendicular separation and inspect its sign."
    },
    misconception: [
      "Zero resultant force is sufficient to prove static equilibrium.",
      "Translation is checked while the separate rotational effect of force application points is ignored.",
      "Check both vector force balance and signed moment balance about a declared point.",
      "A pair of equal opposite forces can leave zero net force while producing visible angular acceleration."
    ],
    moves: [
      "classifying the body only after force, moment and momentum checks",
      "repairing a zero-force verdict that overlooks a couple",
      "screening regime claims through boundary, lever arm and time interval",
      "distinguishing an equilibrium load from a transient impulse",
      "explaining why translation and rotation require separate balances",
      "matching force, moment and momentum links to their regimes",
      "following the bounded-body graph into a static or dynamic decision",
      "revealing the nonzero-couple path hidden by force cancellation"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E1-D05-L03",
    systemModel:
      "Work transfers energy when a force has a component along displacement, power measures transfer rate, and rotational motion uses torque, angular displacement and rotational inertia.",
    failurePattern:
      "Multiplying force magnitude by path length without the directional component invents work, while confusing energy with power removes the time unit.",
    visualExplanation:
      "A graph connects force and displacement, work transfer, elapsed time, torque-angle transfer and an energy-power interpretation.",
    applicationTask:
      "Explain energy and power for a motor-driven lift or wheel using joules, watts, newton-metres, radians and seconds.",
    terms: [
      ["Work", "Energy transferred by the component of force along displacement, measured in joules.", "A perpendicular force does no translational work on that displacement."],
      ["Power", "The rate of energy transfer, measured in watts or joules per second.", "An energy value alone does not determine power without elapsed time."],
      ["Rotational energy", "Energy associated with angular motion and rotational inertia.", "Torque in newton-metres and angular displacement in radians must not be confused with power."]
    ],
    entities: [
      ["input", "Force-displacement pair", "A force vector in newtons and a displacement vector in metres."],
      ["state", "Work transfer", "The signed force-along-displacement energy transfer in joules."],
      ["input", "Elapsed time", "The seconds over which an energy transfer occurs."],
      ["mechanism", "Torque-angle transfer", "Rotational work from torque and angular displacement with consistent sign."],
      ["decision", "Energy-power judgement", "A unit-checked comparison of joules, seconds and watts."]
    ],
    relationKinds: ["maps", "transforms", "measures", "compares", "invalidates"],
    relationText: [
      "the force-displacement geometry maps force into its path-aligned component",
      "the aligned force component times displacement becomes work transfer",
      "elapsed time measures the rate at which work is transferred",
      "torque-angle work is compared with translational energy accounting",
      "a perpendicular force or missing time invalidates the claimed work or power"
    ],
    conditions: [
      ["assumption", "Force, displacement and torque signs share declared axes, and radians are used for angular displacement."],
      ["boundary", "Energy transfer is evaluated over the same path and time interval used by the motion description."],
      ["criterion", "Accepted work is in joules and accepted average power is in watts with direction and elapsed seconds stated."],
      ["operating-state", "The altered case uses total force magnitude for a perpendicular displacement or reports joules as watts."]
    ],
    failure: [
      "Directional projection or elapsed time is omitted from the energy-transfer model.",
      "Non-working constraint force appears to add energy, or a power claim carries joule rather than watt dimensions.",
      "Reject work without a force-displacement component and reject power without an energy interval in seconds."
    ],
    steps: [
      "Declare force and displacement vectors with their shared axis and units.",
      "Project force along displacement before calculating joule-valued work.",
      "Divide the energy transfer by the matching elapsed seconds to obtain average power.",
      "Relate torque-angle transfer to the same energy account without confusing torque and watts.",
      "Reject perpendicular-force work or energy-labelled power."
    ],
    worked: {
      scenario:
        "A motor lifts a payload while a shaft turns through a declared angle during a measured time interval.",
      given: "force, vertical displacement, shaft torque, angle and elapsed time",
      unit: "N, m, N m, rad and s",
      reasoning: [
        "Use the force component parallel to lift displacement to calculate transferred joules.",
        "Use torque times angular displacement as a second rotational work account.",
        "Divide consistent energy transfer by elapsed seconds to interpret average watts."
      ],
      outcome:
        "Work and rotational transfer reconcile in joules, while power reports the transfer rate in watts.",
      criterion:
        "The same system boundary and interval must support both energy and power statements.",
      verification:
        "Check dimensions independently and compare mechanical energy transfer measured from the linear and shaft sides."
    },
    counter: {
      scenario:
        "A centripetal force perpendicular to instantaneous velocity is multiplied by path length and reported as positive work.",
      given: "force perpendicular to each local displacement",
      unit: "N and m",
      reasoning: [
        "The altered case violates the path-aligned force condition.",
        "The force projection along each instantaneous displacement is zero.",
        "Zero aligned component cannot meet a positive-joule work claim."
      ],
      outcome:
        "The perpendicular force changes direction of motion but performs no translational work on that path.",
      criterion:
        "Only the force component parallel or antiparallel to displacement contributes translational work.",
      verification:
        "Evaluate the force-displacement dot product and confirm its local value is zero."
    },
    misconception: [
      "Any force acting while an object moves performs force times path length work.",
      "Force magnitude and distance are multiplied without checking the angle between their vectors.",
      "Project force along displacement, retain sign and then distinguish joule-valued work from watt-valued power.",
      "Uniform circular motion can have a substantial inward force while kinetic energy remains unchanged."
    ],
    moves: [
      "projecting force onto displacement before forming energy transfer",
      "repairing a power claim that has lost its elapsed seconds",
      "screening statements by vector angle, joule dimensions and interval",
      "diagnosing whether torque, energy or power has been substituted",
      "explaining why a perpendicular force redirects motion without work",
      "matching linear and rotational transfer links to unit conditions",
      "reading the force-to-work-to-power route beside the shaft route",
      "exposing the false energy path created by force magnitude alone"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E1-D05-L04",
    systemModel:
      "An oscillator exchanges stored kinetic and potential energy around equilibrium, damping removes energy, forcing supplies energy, and a wave carries a disturbance with speed equal to frequency times wavelength.",
    failurePattern:
      "Equating amplitude with frequency, ignoring damping or combining frequency and wavelength from different modes produces an unsupported vibration or wave prediction.",
    visualExplanation:
      "A graph links displacement from equilibrium, restoring and damping actions, forcing input, measured response and a resonance or wave decision.",
    applicationTask:
      "Interpret a robot-frame vibration or travelling sensor cable disturbance using metres, seconds, hertz, newtons and metres per second.",
    terms: [
      ["Oscillation", "Repeated variation of a state around an equilibrium position.", "Periodic motion requires a time scale; displacement amplitude alone does not define frequency."],
      ["Damping", "A mechanism that removes mechanical energy from an oscillatory response.", "It changes decay and resonance response but is not identical to stiffness."],
      ["Wave speed", "The propagation speed of a disturbance, equal to compatible frequency times wavelength.", "Frequency and wavelength must describe the same wave in the same medium and frame."]
    ],
    entities: [
      ["state", "Equilibrium displacement", "Signed displacement in metres from the chosen equilibrium position."],
      ["mechanism", "Restoring and damping action", "Forces in newtons tied to displacement and velocity under a stated model."],
      ["input", "Periodic forcing", "An applied force with a declared frequency in hertz."],
      ["observation", "Measured response", "Amplitude and phase observed as functions of forcing frequency."],
      ["decision", "Resonance or wave judgement", "A bounded interpretation of response peak, decay or propagation speed."]
    ],
    relationKinds: ["depends-on", "feeds-back", "causes", "compares", "invalidates"],
    relationText: [
      "restoring and damping action depends on displacement and velocity from equilibrium",
      "the mechanical actions feed back into the next oscillatory state",
      "periodic forcing supplies energy to the measured response",
      "response amplitude and phase are compared across forcing frequency",
      "mixed modes or omitted damping invalidates the resonance or wave judgement"
    ],
    conditions: [
      ["assumption", "Displacement uses metres, time uses seconds and forcing frequency uses hertz in one measured mode."],
      ["boundary", "The linear restoring and damping model is used only over its stated small-motion operating range."],
      ["criterion", "A resonance or wave claim states mode, frequency, wavelength or decay evidence and compatible SI units."],
      ["operating-state", "The altered case mixes amplitude with frequency, removes damping or combines measurements from different modes."]
    ],
    failure: [
      "Quantities from different mechanisms or modes are combined as though they described one oscillation.",
      "The predicted peak, decay rate or metres-per-second wave speed disagrees with measured response.",
      "Reject the claim unless equilibrium, mode, damping, frequency and compatible measurements are identified."
    ],
    steps: [
      "Measure signed displacement relative to a declared equilibrium in metres.",
      "Relate restoring and damping forces to displacement and velocity within the model range.",
      "Apply periodic forcing and observe amplitude and phase rather than amplitude alone.",
      "Compare response across frequency or combine matching frequency and wavelength for wave speed.",
      "Reject mixed-mode or damping-free reasoning outside the stated boundary."
    ],
    worked: {
      scenario:
        "A robot frame is excited over a frequency sweep while displacement amplitude and phase are measured.",
      given: "forcing frequency with corresponding response amplitude and phase",
      unit: "Hz, m and rad",
      reasoning: [
        "Reference displacement to one equilibrium and retain the selected vibration mode.",
        "Track how damping and forcing alter amplitude and phase across the sweep.",
        "Identify a bounded resonance region from the response pattern rather than one amplitude value."
      ],
      outcome:
        "The resonance judgement is tied to a stated mode, damping model and measured frequency-response evidence.",
      criterion:
        "The response comparison must use one mode, compatible units and the same forcing and measurement conditions.",
      verification:
        "Repeat the sweep in both frequency directions and compare peak location, phase trend and decay after forcing stops."
    },
    counter: {
      scenario:
        "A larger measured amplitude is described as a higher frequency even though the period is unchanged.",
      given: "amplitude increased while successive peak timing is unchanged",
      unit: "m and s",
      reasoning: [
        "The altered claim treats displacement size as a time-rate quantity.",
        "Unchanged period means unchanged cycles per second in the measured mode.",
        "Amplitude growth alone cannot satisfy a higher-hertz criterion."
      ],
      outcome:
        "The oscillation is larger but not faster.",
      criterion:
        "Frequency is determined from repeated timing, while amplitude is measured displacement from equilibrium.",
      verification:
        "Measure time between successive matching peaks and compare it before and after the amplitude change."
    },
    misconception: [
      "A larger vibration amplitude means a higher vibration frequency.",
      "Two visible features of a waveform are conflated even though one has metre units and the other has hertz units.",
      "Measure amplitude from equilibrium and frequency from cycle timing, then analyse damping and forcing separately.",
      "The peak displacement can double while the time between peaks remains unchanged."
    ],
    moves: [
      "ordering equilibrium, mechanical feedback and frequency response",
      "repairing a frequency claim inferred from amplitude alone",
      "screening vibration statements by mode, unit and damping evidence",
      "diagnosing whether forcing, damping or mode mixing changed the response",
      "explaining how energy input and loss shape an oscillation",
      "matching response links to small-motion and same-mode conditions",
      "following the feedback graph through a frequency sweep",
      "revealing the amplitude-frequency substitution in the altered graph"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E1-D05-L05",
    systemModel:
      "Charge and voltage establish electric conditions, current is charge flow, a magnetic field acts on moving charge or current, and their vector interaction produces measurable sensor signals or actuator force.",
    failurePattern:
      "Treating voltage as current, omitting circuit closure or ignoring magnetic-field and current directions predicts energy transfer or force with the wrong mechanism.",
    visualExplanation:
      "A graph links charge or voltage source, circuit current, magnetic field, conductor interaction and an electromagnetic device decision.",
    applicationTask:
      "Explain a motor coil or magnetic sensor using coulombs, volts, amperes, teslas and newtons with explicit direction conventions.",
    terms: [
      ["Electric current", "Rate of charge flow through a declared surface, measured in amperes.", "Voltage can drive current through a circuit model but is not itself charge flow."],
      ["Magnetic field", "A vector field measured in teslas that influences moving charge, current and magnetic moments.", "Field magnitude alone does not determine force direction."],
      ["Electromagnetic force", "Force produced by the interaction of charge motion or current with electric or magnetic fields.", "Its direction depends on the declared vector orientation and sign conventions."]
    ],
    entities: [
      ["input", "Voltage and charge source", "The electrical source with volts, polarity and available charge path."],
      ["state", "Circuit current", "Charge flow in amperes through a closed conducting path."],
      ["input", "Magnetic field", "Field vector in teslas at the conductor or sensing element."],
      ["mechanism", "Conductor-field interaction", "The vector coupling that produces force, torque or induced signal."],
      ["decision", "Device response", "The predicted actuator direction or sensor polarity with stated limits."]
    ],
    relationKinds: ["causes", "routes", "depends-on", "transforms", "invalidates"],
    relationText: [
      "the voltage source can cause current only through a closed circuit path",
      "the closed conductor routes charge flow through the magnetic region",
      "the conductor-field interaction depends on current and magnetic-field directions",
      "the interaction transforms electrical conditions into force, torque or signal polarity",
      "an open circuit or reversed vector convention invalidates the claimed device response"
    ],
    conditions: [
      ["assumption", "Voltage polarity, conventional-current direction and magnetic-field direction use one declared coordinate frame."],
      ["boundary", "The circuit path is closed and the conductor remains inside the stated magnetic-field region."],
      ["criterion", "The accepted response states force, torque or signal direction and uses compatible volts, amperes, teslas and newtons."],
      ["operating-state", "The altered case opens the circuit or reverses current or field while retaining the original response direction."]
    ],
    failure: [
      "The model asserts current or electromagnetic force without the circuit and vector conditions that create it.",
      "The device predicts force with zero current or the wrong polarity after a current or field reversal.",
      "Reject the response unless circuit closure, vector directions, polarity and unit-bearing quantities are explicit."
    ],
    steps: [
      "Declare source voltage polarity and the available closed circuit path.",
      "Identify conventional current in amperes through the conductor.",
      "Combine current direction with the magnetic-field vector at the interaction region.",
      "Predict actuator force, torque or sensor polarity with compatible units.",
      "Reject unchanged response after an open circuit or vector reversal."
    ],
    worked: {
      scenario:
        "A current-carrying motor conductor lies in a known magnetic-field direction inside a closed circuit.",
      given: "current direction, field direction and conductor orientation",
      unit: "A, T and m",
      reasoning: [
        "Confirm circuit closure and conventional-current direction.",
        "Apply the declared vector rule to current and magnetic field.",
        "Carry the resulting force direction into the motor torque interpretation."
      ],
      outcome:
        "The conductor force and motor torque direction follow from current-field orientation, not from voltage magnitude alone.",
      criterion:
        "The response must change consistently if either current or magnetic-field direction reverses.",
      verification:
        "Reverse current while retaining the field and observe whether the measured torque direction reverses."
    },
    counter: {
      scenario:
        "The circuit is open, but the supply voltage is used to predict the same magnetic force as the closed-circuit case.",
      given: "voltage present with no closed current path",
      unit: "V",
      reasoning: [
        "The altered case violates the closed-path condition.",
        "Without circuit current, the conductor-field interaction has no current term.",
        "A nonzero magnetic actuator force cannot satisfy the device-response criterion."
      ],
      outcome:
        "Applied voltage without a current path does not establish the claimed conductor force.",
      criterion:
        "The electromagnetic-force model requires the relevant charge motion or current as well as the field.",
      verification:
        "Measure circuit current and compare device force between open and closed path states."
    },
    misconception: [
      "Voltage flowing through a wire directly creates magnetic force.",
      "Voltage, current and force are collapsed into one idea, hiding circuit closure and vector coupling.",
      "Separate voltage difference from charge-flow rate, verify the closed path and then apply current-field direction rules.",
      "An open circuit can retain terminal voltage while measured current and motor torque fall to zero."
    ],
    moves: [
      "sequencing source, closed-path current and vector interaction",
      "repairing a force prediction made with an open circuit",
      "screening electromagnetic claims by polarity, current and field direction",
      "diagnosing which vector reversal changes the device response",
      "explaining why voltage difference is not charge flow",
      "matching circuit and field links to closure and frame conditions",
      "following electrical input through the conductor-field interaction",
      "exposing the zero-current route hidden by terminal voltage"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E1-D05-L06",
    systemModel:
      "A control volume tracks mass and energy across a boundary; heat transfer occurs by stated modes, thermodynamic state carries temperature and pressure, and fluid flow transports mass, momentum and energy.",
    failurePattern:
      "Treating temperature as heat, ignoring mass-flow energy or changing the control boundary mid-balance creates an apparent gain or loss without a physical path.",
    visualExplanation:
      "A graph links a control boundary, thermal transfer, fluid state, mass-flow and work interactions, and an energy-balance decision.",
    applicationTask:
      "Explain cooling of an electronics enclosure with airflow using kelvins, pascals, kilograms per second, watts and joules.",
    terms: [
      ["Control volume", "A declared region whose mass and energy crossings are tracked through its boundary.", "Changing the boundary changes which flows and work terms are external."],
      ["Heat transfer", "Energy transferred because of temperature difference by conduction, convection or radiation, measured in joules or watts over time.", "Temperature in kelvins is a state quantity, not an amount of heat."],
      ["Fluid flow", "Motion of a fluid that transports mass, momentum and energy through a surface.", "Pressure alone does not specify flow without geometry, properties and boundary conditions."]
    ],
    entities: [
      ["constraint", "Control boundary", "The enclosure region and inlet, outlet, wall and shaft crossings."],
      ["mechanism", "Thermal transfer", "Conduction, convection or radiation across the boundary in watts."],
      ["state", "Fluid thermodynamic state", "Air temperature in kelvins, pressure in pascals and other stated properties."],
      ["input", "Mass-flow and work paths", "Air mass flow in kilograms per second and electrical or shaft work rates in watts."],
      ["decision", "Energy-balance judgement", "The conclusion about heating, cooling or steady operation from all boundary terms."]
    ],
    relationKinds: ["constrains", "routes", "depends-on", "compares", "invalidates"],
    relationText: [
      "the control boundary determines which energy and mass paths cross the system",
      "thermal transfer routes energy across walls through declared heat-transfer modes",
      "outlet energy depends on fluid state and mass-flow rate",
      "incoming and outgoing energy rates are compared with stored-energy change",
      "temperature-as-heat or a moved boundary invalidates the energy-balance judgement"
    ],
    conditions: [
      ["boundary", "One control volume and positive crossing directions are fixed for the entire balance."],
      ["assumption", "Air properties and steady or transient treatment are stated over the declared operating range."],
      ["criterion", "Every energy-rate term is in watts, mass flow is in kilograms per second and the signed balance closes within stated uncertainty."],
      ["operating-state", "The altered case treats a kelvin temperature as joules or omits an inlet, outlet, heat or work path."]
    ],
    failure: [
      "A state value is substituted for transferred energy or a crossing disappears when the control volume changes.",
      "The watt-valued balance fails to close and predicts cooling without a corresponding energy outlet.",
      "Reject the thermal-fluid conclusion unless boundary, modes, mass flow, work and SI units reconcile."
    ],
    steps: [
      "Draw one control volume and assign signs to every crossing.",
      "Identify conduction, convection and radiation paths without double-counting.",
      "Describe inlet and outlet fluid states with mass-flow rate and consistent units.",
      "Compare all energy rates with stored-energy change or a steady-state criterion.",
      "Reject temperature-as-heat reasoning or a balance with a missing path."
    ],
    worked: {
      scenario:
        "A fan moves air through an electronics enclosure while wall heat transfer and electrical dissipation are tracked.",
      given: "fixed enclosure boundary with inlet, outlet and heat paths",
      unit: "K, Pa, kg/s and W",
      reasoning: [
        "Mark electrical input, wall transfer and air mass-flow energy across one boundary.",
        "Use fluid state differences with kilograms-per-second flow to represent carried energy rate.",
        "Compare signed watt terms with stored-energy change or steady operation."
      ],
      outcome:
        "The cooling judgement identifies where every watt enters, leaves or accumulates.",
      criterion:
        "The same control volume and sign convention must make all energy-rate terms reconcile.",
      verification:
        "Repeat the balance from measured inlet, outlet, electrical and wall terms and inspect the residual with stated uncertainty."
    },
    counter: {
      scenario:
        "An outlet air temperature in kelvins is entered directly as an energy amount in joules.",
      given: "temperature reading used as transferred energy",
      unit: "K",
      reasoning: [
        "The altered term violates the heat-transfer and energy dimensions.",
        "Kelvins describe thermal state and do not carry joule or watt units.",
        "The resulting sum cannot meet the watt-valued energy-balance criterion."
      ],
      outcome:
        "The calculation mixes state and transfer quantities and has no meaningful energy balance.",
      criterion:
        "Energy or energy rate requires a transfer or storage model, not temperature alone.",
      verification:
        "Annotate every balance term with units and remove any term that cannot be expressed as joules or watts."
    },
    misconception: [
      "A higher temperature means the system contains a directly proportional amount of heat.",
      "Temperature, stored internal energy and heat transfer are treated as interchangeable quantities.",
      "Use temperature as a state input to a material or flow model, then calculate energy storage or transfer with a declared boundary.",
      "Two bodies at the same temperature can store different energy because their mass and material properties differ."
    ],
    moves: [
      "fixing the control boundary before listing energy and mass paths",
      "repairing a balance that inserts kelvins as joules",
      "screening thermal-fluid claims by state, transfer and watt dimensions",
      "diagnosing a missing flow, heat or work crossing",
      "explaining why temperature is not an energy-transfer amount",
      "matching boundary paths to steady or transient assumptions",
      "reading the enclosure graph as one signed energy balance",
      "exposing the unit-breaking shortcut from temperature to heat"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E1-D05-L07",
    systemModel:
      "Load and geometry create stress and strain in a material, while sensors and actuators convert physical quantities through finite ranges, gains, losses and failure boundaries.",
    failurePattern:
      "Assuming a material or transducer remains linear beyond its range hides yielding, saturation, hysteresis or damage and produces a plausible but unusable command or measurement.",
    visualExplanation:
      "A graph links applied load, material section, physical deformation, transducer conversion and a range-checked engineering decision.",
    applicationTask:
      "Explain a strain-based load measurement or actuator mount using newtons, pascals, strain, volts and declared calibration range.",
    terms: [
      ["Stress and strain", "Stress is force per area in pascals, while strain is relative deformation and is dimensionless.", "A linear stress-strain relation is limited to its stated material range and loading history."],
      ["Sensor transfer", "A bounded mapping from a physical input to an electrical or digital output.", "Gain is meaningful only with input-output units, range, resolution and uncertainty."],
      ["Actuator saturation", "The state in which additional command no longer produces proportional physical output.", "A saturated actuator cannot be represented by the same small-signal gain used inside its linear region."]
    ],
    entities: [
      ["input", "Applied load", "Force or torque entering the structure in newtons or newton-metres."],
      ["component", "Material section", "Geometry and material through which stress and deformation develop."],
      ["state", "Physical response", "Stress in pascals, strain, displacement or temperature inside the allowed regime."],
      ["mechanism", "Transducer conversion", "Sensor or actuator mapping between physical and electrical domains."],
      ["decision", "Range-checked design", "The accepted measurement or command with material and transducer limits recorded."]
    ],
    relationKinds: ["causes", "depends-on", "maps", "measures", "invalidates"],
    relationText: [
      "the applied load causes stress through the declared material section",
      "physical response depends on material behaviour, geometry and loading history",
      "the transducer conversion maps physical response to voltage or commanded output",
      "calibration evidence measures the response within the declared operating range",
      "yielding, saturation or hysteresis invalidates an unrestricted linear design"
    ],
    conditions: [
      ["assumption", "Load direction, section area and all newton, pascal, strain and voltage units are declared."],
      ["boundary", "The material remains in the stated regime and the transducer stays within calibrated range and loading history."],
      ["criterion", "The accepted design reports physical and electrical units, uncertainty and margin to material or transducer limits."],
      ["operating-state", "The altered case exceeds elastic, sensor or actuator range while continuing the same linear gain."]
    ],
    failure: [
      "A local linear relation is extrapolated across a regime change in the material or transducer.",
      "Predicted voltage, force or deformation continues increasing while the real output saturates, yields or follows a hysteresis loop.",
      "Reject the design unless material regime, calibration range, loading history, uncertainty and units are explicit."
    ],
    steps: [
      "Declare applied load direction and the section carrying it.",
      "Relate load to stress and strain only within the stated material regime.",
      "Map the physical response through the sensor or actuator transfer.",
      "Compare calibration evidence with range, uncertainty and design margin.",
      "Reject extrapolation through yielding, saturation or unmodelled hysteresis."
    ],
    worked: {
      scenario:
        "A strain sensor measures load on a mount while both material and sensor remain inside their calibrated linear regions.",
      given: "load path, section area and in-range sensor output",
      unit: "N, m^2, Pa, strain and V",
      reasoning: [
        "Use the load path and area to interpret stress in pascals.",
        "Relate stress to strain only inside the declared material regime.",
        "Apply the sensor transfer and retain voltage units, calibration uncertainty and range margin."
      ],
      outcome:
        "The inferred load is traceable through material response and sensor conversion within both boundaries.",
      criterion:
        "Neither the material nor the transducer may cross its declared regime, and the output must carry uncertainty.",
      verification:
        "Apply independent in-range reference loads on increasing and decreasing paths and compare residuals and hysteresis."
    },
    counter: {
      scenario:
        "A sensor output has reached its voltage ceiling, but the last linear calibration slope is extrapolated to infer a larger load.",
      given: "output fixed at the upper range limit",
      unit: "V",
      reasoning: [
        "The altered state exceeds the calibrated sensor-transfer boundary.",
        "Equal saturated voltages can correspond to several larger physical inputs.",
        "An ambiguous out-of-range output cannot meet the range-checked design criterion."
      ],
      outcome:
        "The display ceiling provides only an out-of-range indication, not a proportional load estimate.",
      criterion:
        "A sensor value is quantitative only where calibration demonstrates a unique bounded transfer.",
      verification:
        "Reduce the load until output leaves saturation and compare the recovery path with the increasing-load calibration."
    },
    misconception: [
      "A calibrated linear sensor or actuator keeps the same gain for any input magnitude.",
      "A locally fitted straight line is extrapolated beyond physical material and transducer limits.",
      "State range and loading history, detect saturation or yielding and treat out-of-range outputs as bounded evidence.",
      "Additional input produces no additional output after saturation, and the return path can differ under hysteresis."
    ],
    moves: [
      "sequencing load path, material response and transducer conversion",
      "repairing an estimate made beyond the output ceiling",
      "screening transfer claims by range, history, units and uncertainty",
      "diagnosing whether yielding, saturation or hysteresis broke linearity",
      "explaining why local gain cannot authorise unlimited extrapolation",
      "matching structural and conversion links to their calibrated limits",
      "following force through deformation into an electrical reading",
      "revealing the many-inputs-to-one-output state created by saturation"
    ],
    variant: 6
  }
] satisfies readonly PhysicsSource[];

export const academyLessonTeachingProfileV2PlansE1D05 = sources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE1D05 =
  sources.map((source) => source.lessonId);

const seeds = materialiseAcademyLessonTeachingProfileV2Registry(
  academyLessonTeachingProfileV2LessonIdsE1D05,
  academyLessonTeachingProfileV2PlansE1D05
);

export const academyLessonTeachingProfilesV2E1D05 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE1D05.map((lessonId) => {
      const seed = seeds[lessonId];
      if (!seed) throw new Error(`Missing materialised D05 seed ${lessonId}.`);
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E1D05;
