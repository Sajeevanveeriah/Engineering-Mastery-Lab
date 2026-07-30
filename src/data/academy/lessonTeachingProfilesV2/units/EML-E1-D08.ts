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

type CadSource = Readonly<{
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
  source: CadSource,
  slot: number
): AcademyLessonV2InstructionPlan => {
  const first = source.terms[0][0];
  const second = source.terms[1][0];
  const release = source.entities[4][1];
  const move = source.moves[slot];
  const copies: readonly (
    readonly [string, string, string, string, string, string, string]
  )[] = [
    [
      `Lay out ${first}, ${second} and ${release} by ${move}:`,
      `${first} reaches ${release} coherently because ${move} preserves ${second}.`,
      `${second} is ordered wrongly if ${move} reaches ${release} before ${first} is fixed.`,
      `Begin with ${first} and mark the first geometric dependency used while ${move}.`,
      `Check the millimetre meaning carried by ${second} before ${release}.`,
      `Sequence ${first} through ${second}, explicitly performing ${move}.`,
      `Finish at ${release} only after ${move} retains the ${first} intent.`
    ],
    [
      `Repair ${release} by ${move} between ${second} and ${first}:`,
      `${release} is repaired because ${move} restores a controlled ${first} to ${second} path.`,
      `${first} remains fragile if ${move} hides the altered ${release} condition.`,
      `Locate the first failed ${second} reference before ${move} restores ${first}.`,
      `Inspect which ${release} dimension or relation changes during ${move}.`,
      `Rebuild ${first}, then use ${move} to reconnect ${second}.`,
      `Recheck ${release} and record why ${move} now satisfies ${first}.`
    ],
    [
      `Select ${first} and ${second} claims that survive ${move} at ${release}:`,
      `The selected ${first} claims preserve ${second} and remain valid while ${move}.`,
      `A ${release} claim fails because ${move} bypasses the ${first} boundary.`,
      `Read each ${second} claim with its reference and unit before ${move}.`,
      `Keep ${release} only where ${first} evidence remains inspectable during ${move}.`,
      `Choose relations that carry ${second} intent through ${move}.`,
      `Reject the ${first} shortcut contradicted by ${release} after ${move}.`
    ],
    [
      `Classify altered ${release} by ${move} across ${first} and ${second}:`,
      `${second} reveals the altered ${release} because ${move} honours ${first}.`,
      `${release} is misclassified if ${move} silently changes the ${first} datum or boundary.`,
      `Find which ${second} condition changes before ${move}.`,
      `Contrast controlled ${first} evidence with altered ${release} while ${move}.`,
      `Retain the ${second} relation that makes the defect visible during ${move}.`,
      `Remove the ${first} claim that cannot reproduce ${release} after ${move}.`
    ],
    [
      `Explain ${first} through ${second} and ${release} by ${move}:`,
      `The explanation is complete because ${move} links ${first}, ${second} and ${release}.`,
      `The ${first} account is incomplete when ${move} omits the ${second} boundary.`,
      `Define ${first} before ${move} introduces ${second}.`,
      `State what ${release} would show if ${move} broke ${second}.`,
      `Connect ${first} to ${second} by describing ${move} without hidden geometry.`,
      `Close with the ${release} criterion limiting ${first} after ${move}.`
    ],
    [
      `Match ${first} relations to ${second} controls by ${move} around ${release}:`,
      `Each ${first} relation meets the ${second} control governing it during ${move}.`,
      `A ${release} pair is incorrect because ${move} assigns the wrong ${first} reference.`,
      `Pair the first ${second} link with its ${first} assumption before ${move}.`,
      `Reserve the ${release} acceptance rule for the final relation reached by ${move}.`,
      `Align ${first} and ${second} through the functional dependency exposed by ${move}.`,
      `Read every ${release} pair backwards to verify ${move} and ${first}.`
    ],
    [
      `Read the ${first} diagram by ${move} through ${second} to ${release}:`,
      `${release} follows because ${move} retains the ${second} relation around ${first}.`,
      `The ${first} diagram is misread if ${move} skips the ${second} dependency.`,
      `Start at the functional ${first} input and follow the first edge used while ${move}.`,
      `Inspect which ${release} reference remains active under ${second}.`,
      `Trace ${first} through ${move}, retaining ${second} units and direction.`,
      `Choose ${release} from the path supported by ${move}, not visual appearance.`
    ],
    [
      `Inspect the alternate ${second} diagram by ${move} from ${first} to ${release}:`,
      `${release} is justified because ${move} leaves an inspectable ${first} path through ${second}.`,
      `${first} is overclaimed if ${move} assumes a suppressed ${second} relation.`,
      `Begin at altered ${second} and locate its effect on ${first} during ${move}.`,
      `Contrast accepted and rejected ${release} paths while ${move}.`,
      `Rebuild ${first} evidence from ${second} checks retained by ${move}.`,
      `Accept ${release} only where ${move} meets the ${first} criterion.`
    ]
  ];
  const selected = copies[slot];
  if (!selected) throw new Error(`Missing D08 instruction ${slot}.`);
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

const q2Patterns = [
  [
    [["b1", ["r1"], ["c1"]], ["b2", ["r2"], ["c2"]], ["b3", ["r3"], ["c2"]], ["b4", ["r4"], ["c3"]]],
    [["x1", ["r5"], ["c4"]], ["x2", ["r2", "r3"], ["c2"]], ["x3", ["r4"], ["c3"]]]
  ],
  [
    [["b1", ["r1", "r2"], ["c1"]], ["b2", ["r3"], ["c2"]], ["b3", ["r4"], ["c3"]]],
    [["x1", ["r5"], ["c4"]], ["x2", ["r1"], ["c1"]], ["x3", ["r2"], ["c2"]], ["x4", ["r4"], ["c3"]]]
  ],
  [
    [["b1", ["r1"], ["c1"]], ["b2", ["r2", "r3"], ["c2"]], ["b3", ["r4"], ["c3"]], ["b4", ["r5"], ["c3"]]],
    [["x1", ["r5"], ["c4"]], ["x2", ["r2"], ["c2"]], ["x3", ["r3", "r4"], ["c2", "c3"]]]
  ],
  [
    [["b1", ["r1"], ["c1"]], ["b2", ["r2"], ["c2"]], ["b3", ["r3"], ["c2"]], ["b4", ["r4"], ["c3"]], ["b5", ["r5"], ["c3"]]],
    [["x1", ["r5"], ["c4"]], ["x2", ["r1", "r2"], ["c1"]], ["x3", ["r3", "r4"], ["c2", "c3"]]]
  ],
  [
    [["b1", ["r1"], ["c1"]], ["b2", ["r2"], ["c1"]], ["b3", ["r3", "r4"], ["c2", "c3"]]],
    [["x1", ["r5"], ["c4"]], ["x2", ["r2"], ["c2"]], ["x3", ["r3"], ["c2"]], ["x4", ["r4"], ["c3"]]]
  ],
  [
    [["b1", ["r1"], ["c1"]], ["b2", ["r2"], ["c2"]], ["b3", ["r3"], ["c2"]], ["b4", ["r4", "r5"], ["c3"]]],
    [["x1", ["r5"], ["c4"]], ["x2", ["r1"], ["c1"]], ["x3", ["r3", "r4"], ["c2", "c3"]]]
  ],
  [
    [["b1", ["r1", "r2"], ["c1", "c2"]], ["b2", ["r3"], ["c2"]], ["b3", ["r4"], ["c3"]], ["b4", ["r5"], ["c3"]]],
    [["x1", ["r5"], ["c4"]], ["x2", ["r1"], ["c1"]], ["x3", ["r2", "r3"], ["c2"]], ["x4", ["r4"], ["c3"]]]
  ]
] as const;

const makePlan = (
  source: CadSource
): AcademyLessonTeachingProfileV2CompactPlan => {
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
      if (!endpoints || !kind) throw new Error(`Missing D08 relation ${index}.`);
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
      if (!binding) throw new Error(`Missing D08 condition ${index}.`);
      return [`c${index + 1}`, value[0], value[1], binding[0], binding[1]];
    }
  );
  const patterns = q2Patterns[source.variant];
  if (!patterns) throw new Error(`Missing D08 pattern ${source.variant}.`);
  const baseSteps = patterns[0];
  const retrySteps = patterns[1];

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
        givens: [["worked-given", "Declared design evidence", source.worked.given, source.worked.unit, "e1"]],
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
        givens: [["counter-given", "Altered design evidence", source.counter.given, source.counter.unit, "e1"]],
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
          steps: baseSteps.map((value) => [value[0], value[1], value[2]]),
          correctOrder: baseSteps.map((value) => value[0])
        },
        retry: {
          instruction: instruction(source, 1),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3"],
          steps: retrySteps.map((value) => [value[0], value[1], value[2]]),
          correctOrder: retrySteps.map((value) => value[0])
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
        ["controlled", term("t2", "label"), ["c1"], ["e1", "e2", "e3"], ["r1", "r2"], ["r5"], [], [["controlled-note", source.visualExplanation, ["e1", "e2"], ["r1"]]], reasonedCase("worked", "verification")],
        ["altered", term("t3", "label"), ["c4"], ["e1", "e4", "e5"], ["r4", "r5"], ["r1"], [], [["altered-note", source.failure[1], ["e1", "e5"], ["r5"]]], reasonedCase("counter", "verification")]
      ]
    }
  };
};

const sources = [
  {
    lessonId: "EML-E1-D08-L01",
    systemModel:
      "A design sketch turns a functional requirement into geometry whose degrees of freedom are controlled by dimensions and constraints so later parameter changes preserve design intent.",
    failurePattern:
      "Tracing a desired shape without identifying functional references leaves under-constrained motion, while redundant constraints can make legitimate edits impossible.",
    visualExplanation:
      "A graph links a functional requirement, sketch geometry, constraint set, parameter edit and an intent-preservation check.",
    applicationTask:
      "Sketch a sensor bracket profile in millimetres and explain which relations preserve mounting centres, symmetry and clearance when width changes.",
    terms: [
      ["Design intent", "The functional relationships a model should preserve when dimensions or configuration change.", "The original visible shape alone does not reveal which relationships are intentional."],
      ["Geometric constraint", "A relation such as coincident, parallel, perpendicular, tangent or symmetric that removes selected freedom.", "A constraint should encode function; indiscriminate additions can conflict or over-constrain."],
      ["Degree of freedom", "An independent translation, rotation or size change still available to sketch geometry.", "A fully controlled sketch need not pin every point to the global origin if a functional reference provides the needed frame."]
    ],
    entities: [
      ["input", "Functional requirement", "Mounting centres, symmetry, clearance and adjustable width stated in millimetres."],
      ["state", "Sketch geometry", "Lines, arcs, points and centre-lines forming the bracket profile."],
      ["constraint", "Constraint set", "Dimensions and geometric relations that encode function."],
      ["mechanism", "Parameter edit", "A deliberate change to one named millimetre dimension."],
      ["observation", "Intent check", "The rebuilt sketch inspected for preserved centres, symmetry and clearance."]
    ],
    relationKinds: ["maps", "constrains", "depends-on", "transforms", "invalidates"],
    relationText: [
      "functional requirements map into named sketch references and dimensions",
      "the constraint set constrains intended geometric degrees of freedom",
      "the parameter edit depends on stable functional references",
      "the edit transforms geometry while the intent check observes retained relations",
      "under-constraint or conflicting redundancy invalidates the intent check"
    ],
    conditions: [
      ["assumption", "All sketch dimensions use millimetres and mounting references and adjustable dimensions are named."],
      ["boundary", "Constraints remove only the freedom required by function and do not create redundant conflict."],
      ["criterion", "Changing the named width preserves mounting centres, symmetry and required clearance."],
      ["operating-state", "The altered sketch has a drifting centre or a redundant constraint that blocks the intended width edit."]
    ],
    failure: [
      "Geometry is controlled by incidental coordinates or contradictory rules rather than functional references.",
      "A parameter edit moves a mounting centre, breaks symmetry or fails to regenerate.",
      "Reject the sketch unless remaining freedom, functional constraints, units and edit behaviour are explicit."
    ],
    steps: [
      "Extract mounting, symmetry, clearance and adjustment requirements.",
      "Create simple sketch geometry around functional centre-lines and references.",
      "Apply dimensions and constraints deliberately while monitoring degrees of freedom.",
      "Edit the named width and inspect the preserved relationships.",
      "Reject drifting or over-constrained geometry."
    ],
    worked: {
      scenario:
        "A symmetric bracket sketch must widen while two mounting-hole centres stay fixed.",
      given: "fixed hole-centre spacing and adjustable overall width",
      unit: "mm",
      reasoning: [
        "Reference both hole centres from a shared centre-line and fixed spacing dimension.",
        "Constrain outer edges symmetrically about the centre-line.",
        "Change only the named width and inspect centre positions and clearance."
      ],
      outcome:
        "The profile widens symmetrically while functional hole centres remain fixed.",
      criterion:
        "The edit changes only the intended width degree of freedom and preserves mounting geometry.",
      verification:
        "Apply smaller and larger allowed widths and compare centre coordinates, symmetry and clearance."
    },
    counter: {
      scenario:
        "One mounting centre is left free and drifts when the bracket width is edited.",
      given: "under-constrained hole centre",
      unit: "mm",
      reasoning: [
        "The altered sketch violates the functional-reference condition.",
        "The free centre can translate as the solver rebuilds the width.",
        "A drifting mounting interface fails the intent criterion."
      ],
      outcome:
        "The sketch may regenerate, but it no longer preserves the required mounting relationship.",
      criterion:
        "Regeneration success is insufficient unless functional references remain invariant.",
      verification:
        "Display remaining degrees of freedom and compare the hole-centre coordinates before and after the edit."
    },
    misconception: [
      "A fully constrained sketch automatically has good design intent.",
      "Constraint count is mistaken for functional meaning, so arbitrary coordinates can freeze the wrong relationships.",
      "Derive constraints from function and test named parameter changes against required invariants.",
      "A zero-degree-of-freedom sketch can still move a mounting interface incorrectly when a dimension changes."
    ],
    moves: [
      "mapping function to references before removing sketch freedom",
      "repairing a drifting mounting centre after a width edit",
      "screening sketch claims by units, remaining freedom and invariants",
      "diagnosing whether under-constraint or redundancy caused failure",
      "explaining why constraint count is not design intent",
      "matching geometric relations to functional edit conditions",
      "reading the sketch graph from requirement to regeneration evidence",
      "inspecting an altered centre reference through a second edit"
    ],
    variant: 0
  },
  {
    lessonId: "EML-E1-D08-L02",
    systemModel:
      "A parametric CAD model uses named dimensions, stable datum references and ordered features to rebuild geometry when parameters change, while avoiding fragile references to transient edges or faces.",
    failurePattern:
      "Referencing an edge created by another feature's current topology can redirect or break later features when that topology changes.",
    visualExplanation:
      "A graph links a named dimension, datum geometry, feature sequence, parameter variation and the regenerated solid.",
    applicationTask:
      "Build a parametric sensor boss whose location references origin datums and whose diameter and height vary in millimetres without feature failure.",
    terms: [
      ["Parametric feature", "A model operation controlled by named dimensions and references.", "A parameter has value only within combinations the feature can regenerate."],
      ["Stable reference", "A datum, origin plane, axis or intentional sketch entity expected to persist across edits.", "A convenient generated edge may not remain the same topological entity after a rebuild."],
      ["Regeneration", "Re-evaluation of sketches and features in dependency order after a change.", "A visually unchanged final shape does not prove all references and design intent remain correct."]
    ],
    entities: [
      ["input", "Named dimension", "Boss diameter or height in millimetres with an allowed range."],
      ["constraint", "Datum reference", "Origin plane, axis or functional sketch entity used for location."],
      ["mechanism", "Feature sequence", "Ordered sketch, extrusion, cut and fillet dependencies."],
      ["state", "Parameter variation", "A smaller or larger allowed dimension set."],
      ["observation", "Regenerated solid", "The rebuilt model inspected for feature success and intended location."]
    ],
    relationKinds: ["maps", "supports", "depends-on", "transforms", "invalidates"],
    relationText: [
      "the named dimension maps design input into feature size",
      "datum references support persistent feature location",
      "later features depend on earlier feature and reference state",
      "parameter variation transforms the regenerated solid through dependency order",
      "a transient edge reference invalidates robust regeneration"
    ],
    conditions: [
      ["assumption", "Dimensions use millimetres, have names and remain inside declared manufacturable ranges."],
      ["boundary", "Functional locations reference datums or intentional sketch entities rather than incidental generated edges."],
      ["criterion", "All allowed parameter sets regenerate and preserve boss location, orientation and required interfaces."],
      ["operating-state", "The altered case changes topology so a downstream edge or face reference disappears or resolves elsewhere."]
    ],
    failure: [
      "A downstream feature depends on transient topology rather than stable design references.",
      "The model fails to rebuild or places a feature on the wrong edge after a parameter change.",
      "Reject robustness unless reference choice, dependency order, ranges and rebuild tests are explicit."
    ],
    steps: [
      "Name the functional dimensions and their millimetre ranges.",
      "Locate sketches and features from origin datums or intentional references.",
      "Order features so each dependency expresses design intent.",
      "Regenerate at representative boundary and intermediate parameter sets.",
      "Reject fragile topology references or impossible combinations."
    ],
    worked: {
      scenario:
        "A cylindrical sensor boss is centred from an origin axis and controlled by named diameter and height parameters.",
      given: "datum axis and bounded diameter-height parameters",
      unit: "mm",
      reasoning: [
        "Locate the boss centre on the persistent datum axis.",
        "Drive sketch diameter and extrusion height with named dimensions.",
        "Regenerate several allowed combinations and inspect interfaces and feature order."
      ],
      outcome:
        "The boss changes size while remaining centred and fully regenerated.",
      criterion:
        "Every allowed parameter combination retains the functional reference and successful feature sequence.",
      verification:
        "Test lower, nominal and upper allowed values and inspect dependency and geometry results."
    },
    counter: {
      scenario:
        "A hole is positioned from a fillet edge that disappears when the boss diameter decreases.",
      given: "downstream feature referenced to transient edge",
      unit: "mm",
      reasoning: [
        "The altered diameter changes the topology that produced the selected edge.",
        "The downstream hole loses or redirects its location reference.",
        "A failed or misplaced rebuild cannot satisfy the robust-regeneration criterion."
      ],
      outcome:
        "The model is fragile even though the nominal parameter set looked correct.",
      criterion:
        "Functional feature location must survive every allowed topology-preserving design edit.",
      verification:
        "Replace the edge reference with a datum or sketch reference and repeat the boundary-value regeneration test."
    },
    misconception: [
      "Any selectable CAD edge is a suitable permanent reference.",
      "Current visual availability is confused with topological identity across regeneration.",
      "Prefer datums and intentional sketch references, then test parameter ranges for rebuild stability.",
      "A fillet edge can vanish or receive a different identity after a preceding dimension changes."
    ],
    moves: [
      "naming parameters and datums before building the feature chain",
      "repairing a hole that depends on a disappearing fillet edge",
      "screening CAD claims by range, dependency and reference stability",
      "diagnosing which topology change broke regeneration",
      "explaining why selectable geometry is not necessarily persistent",
      "matching feature dependencies to stable-reference conditions",
      "reading the feature graph through several parameter values",
      "inspecting a datum-based retry at boundary dimensions"
    ],
    variant: 1
  },
  {
    lessonId: "EML-E1-D08-L03",
    systemModel:
      "An engineering drawing uses selected orthographic and sectional views, line conventions, dimensions, notes and revision data to communicate a part independently of the CAD software.",
    failurePattern:
      "Duplicated, missing or view-dependent dimensions and absent revision status leave manufacture and inspection with conflicting interpretations.",
    visualExplanation:
      "A graph links part geometry, chosen views, visible and hidden line meaning, dimensions and notes, and the released drawing.",
    applicationTask:
      "Prepare a millimetre drawing for a machined bracket with enough views, unambiguous dimensions, material note and revision evidence.",
    terms: [
      ["Orthographic view", "A projection showing geometry from a declared direction without perspective.", "One view may not reveal depth or internal form; extra views should add necessary information."],
      ["Dimension", "A controlled statement of size or location with unit and tolerance context.", "Scaling the printed image is not a substitute for an explicit dimension."],
      ["Revision control", "Identification of the released drawing state and its authorised changes.", "A filename alone does not establish which geometry, notes and approvals belong together."]
    ],
    entities: [
      ["input", "Part geometry", "The three-dimensional bracket and its functional surfaces and holes."],
      ["state", "Drawing views", "Selected front, top, side or section projections."],
      ["mechanism", "Line conventions", "Visible, hidden, centre and section lines with distinct meanings."],
      ["constraint", "Dimensions and notes", "Millimetre sizes, tolerances, material, finish and manufacturing requirements."],
      ["observation", "Released drawing", "The revision-identified communication used for manufacture and inspection."]
    ],
    relationKinds: ["maps", "transforms", "supports", "constrains", "invalidates"],
    relationText: [
      "part geometry maps into selected orthographic and sectional views",
      "line conventions transform hidden and centre geometry into readable marks",
      "views and line meaning support unambiguous dimension placement",
      "dimensions, notes and revision data constrain the released drawing",
      "duplicate dimensions or stale revision data invalidates release"
    ],
    conditions: [
      ["assumption", "Drawing units are millimetres unless explicitly stated, and projection and line conventions are declared."],
      ["boundary", "Each functional size and location is defined once from appropriate references without relying on scale."],
      ["criterion", "Manufacture and inspection can determine geometry, tolerance, material and current revision without CAD access."],
      ["operating-state", "The altered drawing duplicates a dimension, dimensions a hidden line or omits revision and unit context."]
    ],
    failure: [
      "The drawing communicates contradictory or incomplete geometry across views and revisions.",
      "Two readers can manufacture different parts while believing they followed the same sheet.",
      "Reject release unless views, lines, dimensions, notes, units and revision status are mutually consistent."
    ],
    steps: [
      "Identify functional geometry that manufacture and inspection must understand.",
      "Choose the minimum views and sections that reveal that geometry.",
      "Apply visible, hidden, centre and section line conventions consistently.",
      "Place each required dimension and note once with millimetre and revision context.",
      "Reject ambiguity, duplication or stale release information."
    ],
    worked: {
      scenario:
        "A machined bracket has two through holes, a pocket and one datum mounting face.",
      given: "functional faces, hole centres, pocket depth and material requirement",
      unit: "mm",
      reasoning: [
        "Choose orthographic and section views that expose hole location and pocket depth.",
        "Use centre and section lines so each dimension attaches to visible intended geometry.",
        "Add material, general tolerance and revision data before release review."
      ],
      outcome:
        "The drawing communicates one inspectable interpretation of the bracket without the native CAD file.",
      criterion:
        "Every functional feature is visible or sectioned, dimensioned once and tied to current release data.",
      verification:
        "Ask an independent reader to reconstruct feature sizes and locations using the drawing alone and compare results."
    },
    counter: {
      scenario:
        "The same hole spacing is dimensioned differently in front and top views.",
      given: "conflicting duplicate hole-centre dimensions",
      unit: "mm",
      reasoning: [
        "The altered sheet violates the one-definition dimension boundary.",
        "Manufacture cannot know which spacing controls the hole pattern.",
        "Conflicting values cannot meet the single released-interpretation criterion."
      ],
      outcome:
        "The drawing is not releasable until the duplicate conflict is removed and revision evidence updated.",
      criterion:
        "A functional dimension must have one authoritative value and reference scheme.",
      verification:
        "Trace each feature to every dimension occurrence and reconcile the sheet against the model and revision change."
    },
    misconception: [
      "More views and repeated dimensions always make a drawing clearer.",
      "Redundancy is mistaken for clarity even though duplicated values can conflict and obscure authority.",
      "Choose only necessary views and define each functional size or location once from appropriate references.",
      "Two copies of one hole-spacing dimension can disagree after only one is updated."
    ],
    moves: [
      "selecting views before lines, dimensions and release data",
      "repairing conflicting hole spacing across two views",
      "screening drawing claims by unit, authority and inspectability",
      "diagnosing whether view choice or duplicated definition caused ambiguity",
      "explaining why repeated dimensions can reduce clarity",
      "matching view and notation links to release constraints",
      "reading the drawing graph from solid geometry to controlled sheet",
      "inspecting a single-authority retry after revision update"
    ],
    variant: 2
  },
  {
    lessonId: "EML-E1-D08-L04",
    systemModel:
      "Limits bound each feature size, a fit describes the clearance or interference between mating features, and a tolerance stack combines signed contributors to bound an assembly's functional gap.",
    failurePattern:
      "Adding only nominal dimensions, dropping signs or mixing worst-case and statistical assumptions produces a clearance claim that cannot cover manufactured extremes.",
    visualExplanation:
      "A graph links mating feature limits, signed stack contributors, minimum and maximum clearance, assembly function and acceptance.",
    applicationTask:
      "Build a symbolic millimetre tolerance stack for a shaft-hole or sensor-gap assembly and state worst-case assumptions.",
    terms: [
      ["Size limit", "The maximum or minimum permissible feature size derived from nominal size and tolerance.", "A nominal value alone is not an acceptance boundary."],
      ["Fit", "The clearance or interference relationship produced by limits of mating features.", "The same nominal sizes can yield different fits when tolerance zones change."],
      ["Tolerance stack", "A signed combination of dimension variations that bounds a functional assembly result.", "Worst-case and statistical combinations answer different risk questions and require declared assumptions."]
    ],
    entities: [
      ["input", "Mating feature limits", "Minimum and maximum hole and shaft sizes in millimetres."],
      ["mechanism", "Signed stack contributors", "Dimensions that increase or decrease the functional gap."],
      ["state", "Clearance interval", "The calculated minimum-to-maximum assembly gap in millimetres."],
      ["criterion", "Assembly function", "The required clearance, interference or positional gap range."],
      ["decision", "Fit acceptance", "The pass, fail or redesign decision under the stated stack model."]
    ],
    relationKinds: ["maps", "transforms", "compares", "constrains", "invalidates"],
    relationText: [
      "feature tolerances map nominal sizes into minimum and maximum limits",
      "signed contributors transform feature limits into a clearance interval",
      "minimum and maximum clearance are compared with assembly function",
      "functional requirements constrain acceptable fit and stack results",
      "lost signs or mixed combination assumptions invalidates fit acceptance"
    ],
    conditions: [
      ["assumption", "All dimensions use millimetres, share a declared direction and use either explicit worst-case or justified statistical combination."],
      ["boundary", "Every contributor in the functional loop appears once with the sign by which it changes the gap."],
      ["criterion", "Both minimum and maximum clearance satisfy the declared assembly function and combination model."],
      ["operating-state", "The altered stack uses nominal values only, drops a contributor or changes combination assumptions without stating it."]
    ],
    failure: [
      "The dimensional loop no longer represents all manufactured extreme states under one model.",
      "Assemblies bind or become excessively loose despite a nominal gap that appeared acceptable.",
      "Reject the fit unless limits, signs, contributors, method and functional interval are explicit."
    ],
    steps: [
      "Convert each nominal feature and tolerance into millimetre limits.",
      "Draw the functional loop and assign a sign to each contributor.",
      "Combine contributor extremes under the declared worst-case or statistical method.",
      "Compare minimum and maximum result with the functional fit requirement.",
      "Reject nominal-only or method-mixed acceptance."
    ],
    worked: {
      scenario:
        "A shaft must enter a hole while the smallest possible clearance remains non-negative.",
      given: "hole minimum and maximum plus shaft minimum and maximum",
      unit: "mm",
      reasoning: [
        "Calculate minimum clearance from the smallest hole minus the largest shaft.",
        "Calculate maximum clearance from the largest hole minus the smallest shaft.",
        "Compare both endpoints with the functional clearance interval."
      ],
      outcome:
        "The fit decision is based on the complete clearance interval rather than nominal size.",
      criterion:
        "The worst-case minimum and maximum clearances must both meet assembly requirements.",
      verification:
        "Recompute from the opposite extreme pairing and independently trace every sign in the dimensional loop."
    },
    counter: {
      scenario:
        "Nominal hole minus nominal shaft is positive, so guaranteed clearance is claimed without checking limits.",
      given: "positive nominal clearance with overlapping tolerance ranges",
      unit: "mm",
      reasoning: [
        "The altered calculation violates the extreme-limit condition.",
        "Largest shaft and smallest hole can reduce clearance below the nominal result.",
        "A nominal value cannot meet the guaranteed-fit criterion."
      ],
      outcome:
        "Some manufactured assemblies can interfere even though the nominal pair clears.",
      criterion:
        "Guaranteed clearance is controlled by feature limits, not nominal values alone.",
      verification:
        "Pair the smallest hole with the largest shaft and inspect the signed result."
    },
    misconception: [
      "A positive nominal clearance guarantees every manufactured pair will clear.",
      "Nominal geometry is treated as manufactured reality while tolerance-zone extremes are ignored.",
      "Calculate feature limits and pair the worst-case extremes before claiming guaranteed clearance.",
      "The smallest allowed hole can be smaller than the largest allowed shaft even when nominal clearance is positive."
    ],
    moves: [
      "forming feature limits before closing the signed dimensional loop",
      "repairing a nominal-only clearance claim with extreme pairs",
      "screening fit statements by signs, limits and combination model",
      "diagnosing which contributor or assumption changed the gap interval",
      "explaining why nominal clearance is not guaranteed clearance",
      "matching stack contributors to direction and function conditions",
      "reading the limit-to-clearance diagram across both extremes",
      "inspecting a worst-case retry that exposes interference"
    ],
    variant: 3
  },
  {
    lessonId: "EML-E1-D08-L05",
    systemModel:
      "Geometric dimensioning and tolerancing establishes a datum reference frame from functional contacts and controls a feature within a form, orientation or location tolerance zone relative to that frame.",
    failurePattern:
      "Choosing convenient rather than functional datums or reading a positional tolerance as a plus-minus coordinate creates an inspection result unrelated to assembly.",
    visualExplanation:
      "A graph links functional contact surfaces, datum reference frame, controlled feature, geometric tolerance zone and the inspection decision.",
    applicationTask:
      "Explain a mounting-hole position control relative to primary, secondary and tertiary functional datums in millimetres.",
    terms: [
      ["Datum reference frame", "The ordered planes or axes that establish part orientation and location for geometric controls.", "A datum feature is physical; the ideal datum used for evaluation is derived from contact under stated rules."],
      ["Feature control frame", "The symbolic specification naming geometric characteristic, tolerance, modifiers and datum sequence.", "Its compartments form one control and cannot be interpreted as independent plus-minus dimensions."],
      ["Tolerance zone", "The ideal region within which the controlled feature element or axis must lie.", "Zone shape and orientation depend on the named geometric characteristic and datum references."]
    ],
    entities: [
      ["input", "Functional contact surfaces", "The faces and holes that locate the part in its assembly."],
      ["constraint", "Datum reference frame", "Primary, secondary and tertiary references established in functional order."],
      ["state", "Controlled feature", "The hole axis or surface being toleranced."],
      ["mechanism", "Geometric tolerance zone", "The allowable form, orientation or location region in millimetres."],
      ["decision", "Inspection decision", "Conformance based on the datum setup and observed feature relative to the zone."]
    ],
    relationKinds: ["supports", "constrains", "depends-on", "measures", "invalidates"],
    relationText: [
      "functional contact surfaces support the ordered datum reference frame",
      "the datum frame constrains part orientation and location",
      "the tolerance zone depends on characteristic, value and datum sequence",
      "inspection measures the controlled feature relative to that zone",
      "non-functional datum setup invalidates the assembly-related decision"
    ],
    conditions: [
      ["assumption", "Drawing units are millimetres and the functional locating contacts and datum order are declared."],
      ["boundary", "Inspection establishes datums in the specified sequence before evaluating the controlled feature."],
      ["criterion", "The complete controlled feature lies within the stated geometric tolerance zone relative to the datum frame."],
      ["operating-state", "The altered inspection uses a convenient surface in place of a specified functional datum or treats position as separate coordinate limits."]
    ],
    failure: [
      "The evaluation frame differs from the functional assembly frame or the zone shape is misread.",
      "A part passes inspection yet cannot assemble, or fails despite meeting the intended positional zone.",
      "Reject the conformance decision unless datum establishment, characteristic, zone and feature evaluation are explicit."
    ],
    steps: [
      "Identify the surfaces that functionally establish the part in assembly.",
      "Build the datum reference frame in primary, secondary and tertiary order.",
      "Interpret the feature control frame and its tolerance-zone geometry.",
      "Measure the controlled feature relative to the established frame.",
      "Reject substituted datums or coordinate-only interpretation."
    ],
    worked: {
      scenario:
        "A bracket mounting-hole axis is controlled in position relative to three functional locating datums.",
      given: "ordered datum features and a positional tolerance zone",
      unit: "mm",
      reasoning: [
        "Establish the primary contact plane, then secondary and tertiary locators.",
        "Construct the stated positional zone around the basic hole location.",
        "Evaluate the entire derived hole axis relative to the datum frame."
      ],
      outcome:
        "The inspection decision reflects how the bracket is located and assembled.",
      criterion:
        "The controlled axis remains inside its full positional zone after the specified datum sequence is established.",
      verification:
        "Repeat the datum setup and feature evaluation with an independent fixture or coordinate strategy that realises the same frame."
    },
    counter: {
      scenario:
        "A visually flat but non-functional surface replaces the primary datum during inspection.",
      given: "substituted datum surface",
      unit: "mm",
      reasoning: [
        "The altered setup violates the specified datum-reference boundary.",
        "Part orientation changes before the hole axis is evaluated.",
        "A result in the substituted frame cannot meet the functional-zone criterion."
      ],
      outcome:
        "The measured position is not the drawing's position requirement.",
      criterion:
        "Conformance must be evaluated in the datum frame named by the feature control frame.",
      verification:
        "Measure the hole in both specified and substituted setups and compare the derived axis location."
    },
    misconception: [
      "A datum is simply any convenient flat surface used to start measurement.",
      "Measurement convenience is substituted for the functional reference sequence on the drawing.",
      "Derive datums from specified features in order and evaluate the tolerance zone in that frame.",
      "Changing the primary contact surface changes the measured orientation and apparent hole position."
    ],
    moves: [
      "establishing functional datums before constructing the tolerance zone",
      "repairing an inspection that substituted a convenient surface",
      "screening geometric claims by datum order, zone shape and feature",
      "diagnosing which frame change altered the conformance result",
      "explaining why a datum is not an arbitrary measurement origin",
      "matching feature-control relations to setup conditions",
      "reading the datum-to-zone graph for a hole-axis decision",
      "inspecting a retry in the specified functional reference frame"
    ],
    variant: 4
  },
  {
    lessonId: "EML-E1-D08-L06",
    systemModel:
      "Metrology matches a measurand and tolerance decision to an instrument whose range, resolution, calibration and uncertainty support a traceable result without false precision.",
    failurePattern:
      "Choosing an instrument because its display has many digits, ignoring setup and calibration or comparing a nominal reading directly with a tolerance boundary makes conformance unreliable.",
    visualExplanation:
      "A graph links the required dimension, tolerance decision, instrument capability, measured result with uncertainty and conformance decision.",
    applicationTask:
      "Plan measurement of a millimetre feature by selecting instrument range and resolution and recording uncertainty, setup and decision rule.",
    terms: [
      ["Measurand", "The specifically defined quantity intended to be measured under stated conditions.", "A vague feature name does not define where, how or under which state measurement occurs."],
      ["Resolution", "The smallest displayed or distinguishable increment of an instrument.", "Resolution alone is not accuracy and does not include calibration, repeatability or setup effects."],
      ["Measurement uncertainty", "A quantified interval or distribution expressing doubt about the measured value under stated conditions.", "Uncertainty is not an admission of error; it is required context for a defensible decision."]
    ],
    entities: [
      ["input", "Required dimension", "The specified feature size and tolerance in millimetres."],
      ["criterion", "Tolerance decision", "The conformance question and decision rule at the specification limits."],
      ["component", "Instrument capability", "Range, resolution, calibration status and contact or optical method."],
      ["observation", "Measurement result", "The measured value in millimetres with uncertainty and setup record."],
      ["decision", "Conformance decision", "Pass, fail or indeterminate status under the declared rule."]
    ],
    relationKinds: ["constrains", "depends-on", "measures", "compares", "invalidates"],
    relationText: [
      "the required dimension and tolerance constrain instrument selection",
      "instrument capability depends on range, resolution, calibration and setup",
      "the instrument measures the declared measurand under controlled conditions",
      "the result and uncertainty are compared with tolerance limits and decision rule",
      "false precision or unsupported capability invalidates conformance"
    ],
    conditions: [
      ["assumption", "Measurand, millimetre unit, tolerance limits, surface condition and measurement method are declared."],
      ["boundary", "Instrument range covers the feature and its uncertainty is sufficiently small for the stated decision rule."],
      ["criterion", "The reported result includes value, millimetres, uncertainty, instrument identity and pass-fail-indeterminate rule."],
      ["operating-state", "The altered case uses display resolution as accuracy or makes a conformance decision while uncertainty overlaps a limit."]
    ],
    failure: [
      "Instrument digits are treated as measurement truth without capability and uncertainty evidence.",
      "A feature near the limit is accepted or rejected even though the measurement cannot distinguish the decision.",
      "Reject conformance unless measurand, capability, calibration, uncertainty, setup and rule are explicit."
    ],
    steps: [
      "Define the measurand, millimetre tolerance and decision required.",
      "Select an instrument with suitable range, resolution and calibration.",
      "Control setup and repeat measurement enough to estimate relevant uncertainty.",
      "Compare the result and uncertainty with limits using the declared rule.",
      "Reject false precision or unsupported pass-fail certainty."
    ],
    worked: {
      scenario:
        "A machined width must be assessed against two millimetre limits using a calibrated instrument.",
      given: "defined contact locations, tolerance limits and instrument capability",
      unit: "mm",
      reasoning: [
        "Define where and under what contact condition the width is measured.",
        "Confirm instrument range, calibration and uncertainty support the required decision.",
        "Report the repeated result with uncertainty and apply the stated conformance rule."
      ],
      outcome:
        "The result is traceable and the conformance status reflects measurement capability.",
      criterion:
        "Decision confidence must follow the declared rule when the uncertainty interval approaches either limit.",
      verification:
        "Repeat with an independent calibrated method and reconcile values within their stated uncertainties."
    },
    counter: {
      scenario:
        "An instrument displays three decimal places, so its reading is treated as exact at a tight tolerance limit.",
      given: "fine display increment without calibration or uncertainty evidence",
      unit: "mm",
      reasoning: [
        "The altered claim violates the instrument-capability condition.",
        "Display resolution does not bound bias, repeatability or setup effects.",
        "An exact conformance claim cannot meet the uncertainty-reporting criterion."
      ],
      outcome:
        "The digits provide apparent precision but no defensible pass or fail decision.",
      criterion:
        "Resolution must be supported by calibration and uncertainty appropriate to the tolerance decision.",
      verification:
        "Repeat measurements, inspect calibration evidence and compare with a higher-capability reference method."
    },
    misconception: [
      "An instrument is accurate to its last displayed digit.",
      "Digital resolution is confused with total measurement accuracy and uncertainty.",
      "Evaluate range, calibration, repeatability, setup and uncertainty before interpreting displayed digits.",
      "Repeated readings and a reference instrument can disagree by more than one display increment."
    ],
    moves: [
      "defining the measurand before selecting instrument capability",
      "repairing an exact decision based only on display digits",
      "screening measurement claims by range, calibration and uncertainty",
      "diagnosing which setup or capability term controls the decision",
      "explaining why resolution is not accuracy",
      "matching instrument and result links to tolerance conditions",
      "reading the measurement graph from feature to decision rule",
      "inspecting an uncertainty-overlap retry that yields indeterminate status"
    ],
    variant: 5
  },
  {
    lessonId: "EML-E1-D08-L07",
    systemModel:
      "A manufacturable parametric mount connects functional interfaces through a continuous load path while preserving assembly clearances, process limits, service access and inspectable critical dimensions.",
    failurePattern:
      "Optimising nominal shape without tool access, tolerance stack, material process or inspection plan creates a model that renders well but cannot be made, assembled or verified.",
    visualExplanation:
      "A graph links functional interfaces, load path, parametric mount geometry, process and clearance constraints, and the inspection-ready release.",
    applicationTask:
      "Design a robot sensor mount in millimetres with named interfaces, load path, fastener access, manufacturing process and critical inspection characteristics.",
    terms: [
      ["Functional interface", "A surface, hole, connector or clearance region through which the mount locates, attaches or interacts.", "Cosmetic geometry is not an interface unless it carries a declared function."],
      ["Load path", "The route by which force and moment pass from the supported component to the base.", "A thick local feature does not guarantee a continuous or suitably stiff path."],
      ["Design for manufacture and inspection", "Geometry and tolerances chosen so the part can be produced and critical requirements can be verified.", "Manufacturability without inspectability still leaves acceptance unresolved."]
    ],
    entities: [
      ["input", "Functional interfaces", "Sensor, robot frame, fastener and cable interfaces with millimetre locations."],
      ["mechanism", "Load path", "The connected material route carrying newtons and newton-metres to the base."],
      ["component", "Parametric mount", "Named thickness, offsets, holes, fillets and clearances."],
      ["constraint", "Process and inspection constraints", "Tool access, minimum feature, tolerance and measurable datum requirements."],
      ["observation", "Inspection-ready release", "The model and drawing evidence used to manufacture, assemble and verify the mount."]
    ],
    relationKinds: ["maps", "routes", "depends-on", "constrains", "invalidates"],
    relationText: [
      "functional interfaces map assembly requirements into named mount geometry",
      "the load path routes forces and moments through connected material",
      "the parametric mount depends on clearances, feature references and material process",
      "process and inspection constraints constrain the released geometry and dimensions",
      "blocked access, broken load path or uninspectable tolerance invalidates release"
    ],
    conditions: [
      ["assumption", "Interfaces, loads, millimetre units, material and candidate manufacturing process are declared."],
      ["boundary", "Every allowed parameter set retains fastener and cable clearance, continuous load path and process capability."],
      ["criterion", "The released mount can be manufactured, assembled, serviced and inspected against named critical characteristics."],
      ["operating-state", "The altered design blocks tool access, creates a thin load-path interruption or specifies an unmeasurable tolerance."]
    ],
    failure: [
      "A geometric edit satisfies nominal appearance while breaking assembly, load transfer, process or inspection.",
      "The mount cannot be tightened, carries load through a weak discontinuity or has no practical conformance check.",
      "Reject release unless interfaces, load path, clearances, process and inspection evidence are explicit."
    ],
    steps: [
      "Declare every functional interface, load and service clearance.",
      "Sketch a continuous load path from sensor to robot frame.",
      "Build named mount parameters from stable interface references.",
      "Apply process, tool-access, tolerance and inspection constraints.",
      "Reject any allowed edit that cannot be made, assembled or verified."
    ],
    worked: {
      scenario:
        "A sensor mount attaches to a robot frame with two fasteners while preserving connector and wrench clearance.",
      given: "interface locations, load direction, clearance envelopes and process",
      unit: "mm, N and N m",
      reasoning: [
        "Reference sensor and frame holes from functional datums and trace load between them.",
        "Set named thickness, fillet and clearance parameters within process limits.",
        "Create critical drawing dimensions and an inspection method for interfaces and clearance."
      ],
      outcome:
        "The mount is parametrically editable while remaining load-connected, assemblable and inspectable.",
      criterion:
        "Every approved parameter state preserves interfaces, load path, tool access, process feasibility and measurable characteristics.",
      verification:
        "Regenerate boundary parameter sets, inspect clearances and load continuity, then execute the planned dimensional checks."
    },
    counter: {
      scenario:
        "A large cosmetic fillet blocks wrench access to a fastener although the mount still looks smooth and strong.",
      given: "fillet intruding into service clearance envelope",
      unit: "mm",
      reasoning: [
        "The altered fillet violates the assembly and service-clearance boundary.",
        "The fastener cannot be tightened with the declared tool envelope.",
        "An unassemblable parameter state cannot meet the inspection-ready release criterion."
      ],
      outcome:
        "The model remains geometrically valid but the product cannot be assembled as intended.",
      criterion:
        "Functional clearance envelopes constrain cosmetic and structural features.",
      verification:
        "Model the wrench envelope, run an interference check and repeat at all allowed fillet values."
    },
    misconception: [
      "A CAD model that regenerates and looks strong is ready to manufacture.",
      "Geometric validity and visual mass are mistaken for process, assembly, load-path and inspection evidence.",
      "Test interfaces, loads, clearances, process limits and inspection plans across the allowed parameter space.",
      "A regenerated fillet can block the only fastener tool path while producing no CAD error."
    ],
    moves: [
      "connecting interfaces and load path before shaping the mount",
      "repairing a fillet that blocks the fastener tool envelope",
      "screening release claims by process, assembly and inspection",
      "diagnosing which interface or load-path constraint failed",
      "explaining why regeneration is not manufacturability",
      "matching geometry links to clearance and inspection conditions",
      "reading the mount graph from functional interface to release evidence",
      "inspecting a boundary-parameter retry with tool clearance restored"
    ],
    variant: 6
  }
] satisfies readonly CadSource[];

export const academyLessonTeachingProfileV2PlansE1D08 = sources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE1D08 =
  sources.map((source) => source.lessonId);

const seeds = materialiseAcademyLessonTeachingProfileV2Registry(
  academyLessonTeachingProfileV2LessonIdsE1D08,
  academyLessonTeachingProfileV2PlansE1D08
);

export const academyLessonTeachingProfilesV2E1D08 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE1D08.map((lessonId) => {
      const seed = seeds[lessonId];
      if (!seed) throw new Error(`Missing materialised D08 seed ${lessonId}.`);
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E1D08;
