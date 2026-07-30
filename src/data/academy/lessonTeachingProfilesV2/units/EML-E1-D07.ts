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

type SoftwareSource = Readonly<{
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
  language: string;
  baseCode: string;
  retryCode: string;
  variant: number;
}>;

const instruction = (
  source: SoftwareSource,
  slot: number
): AcademyLessonV2InstructionPlan => {
  const first = source.terms[0][0];
  const second = source.terms[1][0];
  const outcome = source.entities[4][1];
  const move = source.moves[slot];
  const variants: readonly (
    readonly [string, string, string, string, string, string, string]
  )[] = [
    [
      `Compose the ${first} workflow towards ${outcome} by ${move} through ${second}:`,
      `${outcome} is reached coherently because ${move} keeps ${first} and ${second} explicit.`,
      `${second} is ordered incorrectly if ${move} reaches ${outcome} before ${first} is established.`,
      `Write the ${first} precondition first, then proceed by ${move}.`,
      `Track the ${second} state before deciding whether ${outcome} follows.`,
      `Sequence ${first} into ${second}, carrying out ${move} without an implicit jump.`,
      `Accept ${outcome} only after ${move} preserves the ${first} contract.`
    ],
    [
      `Reconstruct ${outcome} after the defect by ${move} between ${first} and ${second}:`,
      `${outcome} is corrected because ${move} restores the bounded ${first} to ${second} path.`,
      `${first} remains defective if ${move} hides the changed ${outcome} condition.`,
      `Locate the first ${second} divergence before ${move} repairs ${first}.`,
      `Inspect which ${outcome} trace changes when ${move} is applied.`,
      `Restore ${first}, then use ${move} to rebuild ${second}.`,
      `Repeat the ${outcome} check and record why ${move} now satisfies ${first}.`
    ],
    [
      `Select ${first} and ${second} statements that survive ${move} at ${outcome}:`,
      `The selected ${first} statements retain the ${second} contract while ${move}.`,
      `At least one ${outcome} claim fails because ${move} skips a ${first} condition.`,
      `Read each ${second} claim at the declared input and state boundary before ${move}.`,
      `Keep ${outcome} only where ${first} evidence remains observable during ${move}.`,
      `Choose relations that carry ${second} meaning through ${move}.`,
      `Reject the ${first} shortcut contradicted by ${outcome} after ${move}.`
    ],
    [
      `Determine the altered ${outcome} state by ${move} across ${second} and ${first}:`,
      `${second} reveals the altered ${outcome} because ${move} retains ${first}.`,
      `${outcome} is misclassified if ${move} silently changes the ${first} boundary.`,
      `Find which ${second} condition changed before ${move}.`,
      `Contrast bounded ${first} behaviour with altered ${outcome} while ${move}.`,
      `Keep the ${second} relation that makes the defect observable during ${move}.`,
      `Discard the ${first} claim that cannot reproduce ${outcome} after ${move}.`
    ],
    [
      `Teach ${first} with ${second} and ${outcome} by ${move}:`,
      `The explanation is complete because ${move} links ${first}, ${second} and ${outcome}.`,
      `The ${first} explanation is incomplete if ${move} omits the ${second} boundary.`,
      `Define ${first} at its first use before ${move} introduces ${second}.`,
      `State what ${outcome} would show if ${move} broke the ${second} relation.`,
      `Connect ${first} to ${second} by describing ${move} line by line.`,
      `Finish with the ${outcome} criterion limiting ${first} after ${move}.`
    ],
    [
      `Associate ${first} relations with ${second} constraints by ${move} around ${outcome}:`,
      `Each ${first} relation meets the ${second} condition controlling it while ${move}.`,
      `An ${outcome} association fails because ${move} assigns the wrong ${first} scope.`,
      `Pair the earliest ${second} operation with its ${first} precondition before ${move}.`,
      `Save the ${outcome} acceptance rule for the final relation reached by ${move}.`,
      `Align ${first} and ${second} through the dependency exposed by ${move}.`,
      `Read every ${outcome} pair backwards to verify ${move} and ${first}.`
    ],
    [
      `Trace the ${first} program by ${move} through ${second} to ${outcome}:`,
      `${outcome} follows because ${move} preserves the ${second} condition around ${first}.`,
      `The ${first} program is misread if ${move} bypasses the ${second} transition.`,
      `Start with the first ${first} value and step through ${move}.`,
      `Observe how ${second} changes before choosing ${outcome}.`,
      `Execute ${first} conceptually while ${move}, retaining ${second} evidence.`,
      `Choose ${outcome} from the path supported by ${move}, not from syntax shape.`
    ],
    [
      `Inspect the retry ${second} program by ${move} from ${first} to ${outcome}:`,
      `${outcome} is justified because ${move} leaves an observable ${first} trace through ${second}.`,
      `${first} is overclaimed if ${move} assumes an untested ${second} path.`,
      `Begin at the altered ${second} input and locate its effect on ${first} during ${move}.`,
      `Contrast accepted and rejected ${outcome} paths while ${move}.`,
      `Rebuild ${first} evidence from the ${second} checks retained by ${move}.`,
      `Accept ${outcome} only where ${move} meets the ${first} criterion.`
    ]
  ];
  const selected = variants[slot];
  if (!selected) throw new Error(`Missing D07 instruction ${slot}.`);
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
  source: SoftwareSource
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
      if (!endpoints || !kind) throw new Error(`Missing D07 relation ${index}.`);
      return [
        `r${index + 1}`,
        kind,
        endpoints[0],
        endpoints[1],
        predicate,
        "directed",
        index === 1 || index === 4 ? "many-to-one" : "one-to-one"
      ];
    }
  );
  const conditions = source.conditions.map(
    (value, index): AcademyDomainConditionTuple => {
      const binding = conditionBindings[index];
      if (!binding) throw new Error(`Missing D07 condition ${index}.`);
      return [`c${index + 1}`, value[0], value[1], binding[0], binding[1]];
    }
  );
  const patterns = q2Patterns[source.variant];
  if (!patterns) throw new Error(`Missing D07 pattern ${source.variant}.`);
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
        givens: [["worked-given", "Declared software evidence", source.worked.given, source.worked.unit, "e1"]],
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
        givens: [["counter-given", "Altered software evidence", source.counter.given, source.counter.unit, "e1"]],
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
          kind: "code-analysis",
          instruction: instruction(source, 6),
          focusRef: term("t2", "definition"),
          contextConditionIds: ["c1", "c2", "c3"],
          language: source.language,
          code: source.baseCode,
          options: [
            ["base-correct", true, reasonedCase("worked", "verification"), condition("c3"), ["r3", "r4"], ["c2", "c3"], null],
            ["base-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["base-boundary", false, term("t1", "boundary"), condition("c1"), ["r1"], ["c1"], null]
          ]
        },
        retry: {
          kind: "code-analysis",
          instruction: instruction(source, 7),
          focusRef: term("t3", "definition"),
          contextConditionIds: ["c3", "c4"],
          language: source.language,
          code: source.retryCode,
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
      modelKind: "state-graph",
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
    lessonId: "EML-E1-D07-L01",
    systemModel:
      "A program turns an algorithm into named data, explicit control flow and functions; Python executes those statements in order while types and tests constrain what each value means.",
    failurePattern:
      "Using a variable before establishing its meaning, confusing assignment with comparison or omitting an empty-input case creates output that looks plausible only for one path.",
    visualExplanation:
      "A state graph links input values, named variables, branch or loop state, a function boundary and tested output.",
    applicationTask:
      "Build and explain a Python function that averages metre-valued sensor readings while rejecting empty or non-numeric input.",
    terms: [
      ["Algorithm", "A finite, explicit sequence of steps that transforms allowed inputs into specified outputs.", "A vague intention or an endless process is not an executable algorithm."],
      ["Control flow", "The order in which statements, branches, loops and calls execute.", "Indentation in Python changes block membership and therefore behaviour."],
      ["Function contract", "The accepted inputs, returned output, units, errors and side effects of a function.", "A name alone does not define behaviour for empty, invalid or boundary input."]
    ],
    entities: [
      ["input", "Sensor readings", "A list of numeric distances in metres supplied to the program."],
      ["state", "Accumulator state", "The running sum and count updated by the loop."],
      ["mechanism", "Branch and loop", "The control flow that rejects empty input and visits each reading."],
      ["component", "Average function", "A bounded unit of code with explicit input and return behaviour."],
      ["observation", "Tested mean", "The metre-valued result or explicit validation error."]
    ],
    relationKinds: ["maps", "transforms", "routes", "supports", "invalidates"],
    relationText: [
      "the function contract maps sensor readings into allowed or rejected input",
      "the loop transforms accumulator state once per valid reading",
      "control flow routes empty input to an explicit error path",
      "example and boundary tests support the tested mean",
      "undefined variables or an unhandled empty list invalidates the result"
    ],
    conditions: [
      ["assumption", "Each accepted reading is numeric and represents metres under the function contract."],
      ["boundary", "The list may be empty, so division occurs only after a positive count is established."],
      ["criterion", "The function either returns the arithmetic mean in metres or raises the documented validation error."],
      ["operating-state", "The altered case divides by list length without handling zero or admits a non-numeric value."]
    ],
    failure: [
      "Control flow reaches arithmetic outside the function's declared input boundary.",
      "Empty input causes division by zero or mixed types make the accumulator fail mid-loop.",
      "Reject the program unless input, empty case, loop update, return unit and tests are explicit."
    ],
    steps: [
      "State the list input, numeric metre unit and expected error behaviour.",
      "Check the empty-list branch before any division.",
      "Loop over valid readings and update sum and count predictably.",
      "Return the metre-valued mean and test normal and boundary cases.",
      "Reject code that depends on an undefined or invalid path."
    ],
    worked: {
      scenario:
        "A Python function receives a non-empty list of metre-valued range readings.",
      given: "numeric list and documented metre unit",
      unit: "m",
      reasoning: [
        "Validate that the list is non-empty and every element is numeric.",
        "Accumulate each reading exactly once and retain a positive count.",
        "Divide the sum by count and compare the result with a hand-worked example."
      ],
      outcome:
        "The function returns a tested arithmetic mean with metre units.",
      criterion:
        "Every accepted reading contributes once and the empty case cannot reach division.",
      verification:
        "Use a small list with a manually computed mean, then test empty and wrong-type inputs separately."
    },
    counter: {
      scenario:
        "The function divides the sum of an empty list by its zero length.",
      given: "empty reading list",
      unit: "m",
      reasoning: [
        "The altered input activates the declared empty boundary.",
        "The loop contributes no readings and leaves the count at zero.",
        "Division by zero cannot satisfy the documented return-or-error criterion."
      ],
      outcome:
        "The function fails accidentally instead of returning the declared validation error.",
      criterion:
        "Boundary input must follow an explicit branch before arithmetic.",
      verification:
        "Call the function with an empty list and assert the exact documented error."
    },
    misconception: [
      "If a Python function works for one sample list, its algorithm is correct.",
      "A single happy-path execution is mistaken for a complete input and control-flow contract.",
      "Define allowed and boundary inputs, trace every branch and test representative and failure cases.",
      "The same function that averages one list raises division-by-zero on an empty list."
    ],
    moves: [
      "declaring the function contract before loop and return",
      "repairing the zero-count path before division",
      "screening claims by input type, branch reachability and unit",
      "diagnosing which boundary input bypassed validation",
      "teaching how data and control flow form one algorithm",
      "associating loop transitions with empty-input and return checks",
      "tracing the averaging code through validation and accumulation",
      "inspecting a retry that routes empty input to a named error"
    ],
    language: "Python",
    baseCode: "def mean_distance(readings_m):\n    if not readings_m:\n        raise ValueError(\"readings required\")\n    total_m = 0.0\n    for reading_m in readings_m:\n        total_m += reading_m\n    return total_m / len(readings_m)",
    retryCode: "def mean_distance(readings_m):\n    if any(not isinstance(value, (int, float)) for value in readings_m):\n        raise TypeError(\"numeric metres required\")\n    if len(readings_m) == 0:\n        raise ValueError(\"readings required\")",
    variant: 0
  },
  {
    lessonId: "EML-E1-D07-L02",
    systemModel:
      "C exposes addresses and manual resource boundaries, while modern C++ uses object lifetime, ownership types and deterministic cleanup to make one component responsible for each resource.",
    failurePattern:
      "Returning an address to a destroyed local object, using a pointer after its owner releases memory or allowing several ambiguous owners creates undefined behaviour.",
    visualExplanation:
      "A state graph links input bytes, an allocated object, its owner, lexical scope and the observable resource release.",
    applicationTask:
      "Explain buffer lifetime in C and a single-owner C++ alternative without relying on external documentation.",
    terms: [
      ["Object lifetime", "The interval during which storage contains a valid object that may legally be accessed.", "Allocated bytes outside an object's lifetime are not a valid object merely because an address remains."],
      ["Ownership", "The responsibility for keeping a resource alive and releasing it exactly once.", "A raw pointer can observe a resource without proving ownership or extending lifetime."],
      ["RAII", "A C++ pattern that acquires a resource in an object's construction and releases it in destruction.", "RAII controls lifetime; it does not remove bounds, aliasing or concurrency obligations."]
    ],
    entities: [
      ["input", "Input bytes", "The byte sequence to be stored with a declared length."],
      ["state", "Allocated object", "The buffer or container holding valid elements."],
      ["mechanism", "Resource owner", "The object or code path responsible for one release."],
      ["constraint", "Lexical scope", "The program region in which automatic objects remain alive."],
      ["observation", "Release evidence", "The absence of use-after-lifetime, leaks and double release in tests and analysis."]
    ],
    relationKinds: ["transforms", "depends-on", "constrains", "supports", "invalidates"],
    relationText: [
      "input bytes transform into elements of the allocated object",
      "object lifetime depends on its resource owner",
      "lexical scope constrains automatic object lifetime",
      "single-owner destruction supports deterministic release evidence",
      "a dangling access or double release invalidates the ownership model"
    ],
    conditions: [
      ["assumption", "Byte count, element type, allocation source and intended owner are declared."],
      ["boundary", "No pointer or reference is dereferenced outside the referred object's lifetime or bounds."],
      ["criterion", "Exactly one owner releases each resource and every access occurs while the object is alive."],
      ["operating-state", "The altered case returns a pointer to a local object or accesses a buffer after its owner releases it."]
    ],
    failure: [
      "An address remains visible after the object lifetime or ownership responsibility has ended.",
      "Reads become undefined, data changes unexpectedly or release occurs zero or multiple times.",
      "Reject the design unless allocation, owner, scope, bounds and release are traceable."
    ],
    steps: [
      "Declare byte count, element type and allocation or construction point.",
      "Assign one owner and distinguish non-owning observers.",
      "Track scope and lifetime across every return and call boundary.",
      "Release deterministically and test bounds and lifetime behaviour.",
      "Reject dangling access, double ownership or unexplained manual cleanup."
    ],
    worked: {
      scenario:
        "A C++ function copies input bytes into a returned standard container that owns its storage.",
      given: "input pointer plus declared byte count",
      unit: "byte",
      reasoning: [
        "Validate the source range before copying.",
        "Construct the owning container so its lifetime transfers with the returned value.",
        "Allow container destruction to release storage exactly once after the last owner ends."
      ],
      outcome:
        "The returned bytes remain valid because the container owns storage beyond the function's local scope.",
      criterion:
        "Every access is in bounds and the resource owner remains alive for the required interval.",
      verification:
        "Exercise empty and non-empty buffers under lifetime and bounds instrumentation and inspect for leaks or invalid access."
    },
    counter: {
      scenario:
        "A function returns a pointer to a local array whose scope ends when the function returns.",
      given: "address of automatic local storage",
      unit: "byte",
      reasoning: [
        "The altered pointer crosses the lexical-scope boundary.",
        "The local array's lifetime ends before the caller dereferences the address.",
        "A surviving numeric address cannot meet the valid-object criterion."
      ],
      outcome:
        "The caller holds a dangling pointer and any dereference has undefined behaviour.",
      criterion:
        "A pointer is usable only while the referred object remains alive and in bounds.",
      verification:
        "Replace the local array with an owning return type and compare lifetime-instrumented execution."
    },
    misconception: [
      "A non-null pointer always refers to a live object.",
      "Address value is confused with object lifetime, ownership and bounds.",
      "Track who owns storage, when the object lifetime starts and ends, and whether each access is in bounds.",
      "A pointer to a destroyed local array can remain non-null while no valid array object exists there."
    ],
    moves: [
      "establishing owner and scope before exposing an address",
      "repairing a return path that leaks a local lifetime",
      "screening pointer claims by owner, bounds and destruction",
      "diagnosing whether alias, scope or release ended validity",
      "teaching why address presence is not object existence",
      "associating allocation and cleanup links with lifetime constraints",
      "tracing an owning-container return through construction and release",
      "inspecting a dangling-pointer retry with an explicit owner"
    ],
    language: "C++",
    baseCode: "std::vector<std::byte> copy_bytes(const std::byte* data, std::size_t count) {\n    return {data, data + count};\n}",
    retryCode: "std::span<const std::byte> view(const BufferOwner& owner) {\n    return owner.bytes();\n}\n// The view is used only while owner remains alive.",
    variant: 1
  },
  {
    lessonId: "EML-E1-D07-L03",
    systemModel:
      "A data structure organises values for particular operations, an algorithm performs a defined transformation, and complexity describes how operation count or storage grows with input size.",
    failurePattern:
      "Choosing a container by familiarity, quoting complexity without defining the operation or input model, or measuring one tiny case hides poor growth and unsuitable semantics.",
    visualExplanation:
      "A graph links input size, selected container, target operation, counted cost and the data-structure decision.",
    applicationTask:
      "Choose between a list, queue and keyed map for a robotics task while explaining operation semantics, worst or average case and memory trade-off.",
    terms: [
      ["Data structure", "An organisation of values chosen to support particular access and update operations.", "No structure is universally best; ordering, uniqueness and memory needs matter."],
      ["Algorithm", "A finite procedure that operates on the structure to produce a specified result.", "The structure name alone does not specify the search or update procedure."],
      ["Complexity", "A growth description for time or storage as input size increases under a stated operation and case.", "Big-O notation hides constants and does not replace measurement or correctness."]
    ],
    entities: [
      ["input", "Input size", "The number of stored items or processed elements, denoted by a declared count."],
      ["component", "Selected container", "A list, queue, heap or keyed map with defined semantics."],
      ["mechanism", "Target operation", "Search, insertion, removal or traversal required by the task."],
      ["observation", "Operation count", "Comparisons, moves or allocations counted for a stated case."],
      ["decision", "Structure choice", "The selected semantics and complexity trade-off for the actual workload."]
    ],
    relationKinds: ["constrains", "depends-on", "transforms", "compares", "invalidates"],
    relationText: [
      "input size and required semantics constrain the candidate containers",
      "operation cost depends on both the selected container and algorithm",
      "the target operation transforms stored state while consuming counted work",
      "measured and asymptotic costs are compared for the expected workload",
      "an undefined operation or case invalidates the complexity claim"
    ],
    conditions: [
      ["assumption", "Input size, operation, ordering requirements and average or worst case are stated."],
      ["boundary", "Complexity is compared only for algorithms that implement the same required semantics correctly."],
      ["criterion", "The chosen structure meets ordering and update needs with defensible time and storage growth."],
      ["operating-state", "The altered case calls linear search constant-time or compares operations with different semantics."]
    ],
    failure: [
      "A complexity label is detached from the operation, case or correctness contract.",
      "Performance degrades with growing input or the container cannot preserve required ordering.",
      "Reject the choice unless semantics, input model, operation, case and growth evidence are explicit."
    ],
    steps: [
      "State input size and the exact operations and ordering semantics required.",
      "Choose candidate containers that can implement those semantics.",
      "Describe the algorithm and count its dominant work as size grows.",
      "Compare time, storage and measured workload evidence.",
      "Reject complexity slogans without a defined operation and case."
    ],
    worked: {
      scenario:
        "A planner repeatedly removes the earliest enqueued waypoint while preserving arrival order.",
      given: "ordered stream of waypoints and repeated front removal",
      unit: "item",
      reasoning: [
        "Define first-in-first-out removal as the required semantics.",
        "Select a queue representation whose front removal does not shift every remaining item.",
        "Compare operation count as the number of stored waypoints grows."
      ],
      outcome:
        "The structure choice follows from queue semantics and bounded front-removal growth.",
      criterion:
        "The implementation must preserve arrival order and justify its repeated-operation cost.",
      verification:
        "Run the same operation across increasing item counts and compare order and counted work."
    },
    counter: {
      scenario:
        "A linear scan through an unsorted list is described as constant-time because the desired item happened to be first once.",
      given: "one favourable search in a growing unsorted list",
      unit: "item",
      reasoning: [
        "The altered claim changes the case from general search to one favourable observation.",
        "Later target positions require more comparisons as input size grows.",
        "One first-item result cannot meet the stated search-complexity criterion."
      ],
      outcome:
        "The observation is a best-case event, not evidence of constant-time general search.",
      criterion:
        "A complexity statement must name the operation, input model and case it bounds.",
      verification:
        "Place the target at first, middle, last and absent positions while counting comparisons."
    },
    misconception: [
      "An operation is constant-time if it was fast on one small input.",
      "Elapsed time for one favourable sample is confused with growth as input size and position vary.",
      "Define the operation and case, count dominant work and test several input sizes after correctness.",
      "Moving the target from the first to the final list position increases the comparison count."
    ],
    moves: [
      "declaring workload semantics before comparing container costs",
      "repairing a constant-time claim based on one favourable search",
      "screening complexity statements by operation, case and input size",
      "diagnosing whether semantics or growth evidence mismatched",
      "teaching why a fast sample is not a growth bound",
      "associating container operations with workload constraints",
      "tracing a queue algorithm and its counted front-removal work",
      "inspecting a last-item retry that exposes linear comparisons"
    ],
    language: "Python",
    baseCode: "from collections import deque\nwaypoints = deque(initial_waypoints)\nnext_waypoint = waypoints.popleft()",
    retryCode: "comparisons = 0\nfor item in items:\n    comparisons += 1\n    if item == target:\n        break",
    variant: 2
  },
  {
    lessonId: "EML-E1-D07-L04",
    systemModel:
      "Object-oriented design groups state with behaviour behind an interface, while functional design emphasises explicit inputs, returned outputs and controlled mutation; either can express the same domain model.",
    failurePattern:
      "Hiding mutable global state inside methods or forcing every operation into an object can obscure dependencies just as an unbounded functional pipeline can obscure state ownership.",
    visualExplanation:
      "A graph links robot state, method or pure function, explicit inputs, returned next state and the design trade-off decision.",
    applicationTask:
      "Implement and compare an object method and a pure function for updating a robot pose in metres and radians.",
    terms: [
      ["Object encapsulation", "Grouping state with operations and exposing a bounded interface that preserves invariants.", "Encapsulation is not achieved merely by placing global or public mutable data inside a class."],
      ["Pure function", "A function whose output depends only on explicit inputs and that does not mutate external state.", "Purity does not forbid all stateful systems; state can be passed and returned explicitly."],
      ["Mutation", "A change to existing program state.", "Mutation is not automatically wrong, but its owner, timing and observable effects must be controlled."]
    ],
    entities: [
      ["state", "Robot pose state", "Position in metres and heading in radians."],
      ["component", "Method or pure function", "The operation implementing a pose update."],
      ["input", "Explicit motion input", "Translation in metres and rotation in radians."],
      ["state", "Returned next pose", "The resulting pose value after one bounded update."],
      ["decision", "Design trade-off", "The choice based on invariants, testability, ownership and change pattern."]
    ],
    relationKinds: ["constrains", "depends-on", "transforms", "compares", "invalidates"],
    relationText: [
      "pose invariants constrain the permitted method or function behaviour",
      "the update depends on current pose and explicit motion input",
      "the operation transforms current state into the next pose",
      "object and functional implementations are compared through the same tests",
      "hidden global mutation invalidates the explicit-dependency claim"
    ],
    conditions: [
      ["assumption", "Pose fields and motion inputs use metres and radians with one coordinate convention."],
      ["boundary", "The update may change only the pose state owned by the declared component or returned value."],
      ["criterion", "Both designs preserve pose invariants and produce the same tested next state from identical inputs."],
      ["operating-state", "The altered implementation reads or writes hidden global pose data outside its declared inputs."]
    ],
    failure: [
      "A dependency or mutation escapes the visible interface and ownership boundary.",
      "The same explicit inputs produce different results depending on unrelated call history.",
      "Reject the design claim unless dependencies, mutation owner, invariants and test equivalence are visible."
    ],
    steps: [
      "Define pose state, units, coordinate convention and invariants.",
      "Express the update as either a bounded method or explicit-input function.",
      "Control mutation or return a new state while preserving invariants.",
      "Compare both forms with identical input-output tests.",
      "Reject hidden globals or style labels used without behavioural evidence."
    ],
    worked: {
      scenario:
        "A pose update is implemented once as an owning object method and once as a pure state-transform function.",
      given: "current pose and explicit translation and rotation",
      unit: "m and rad",
      reasoning: [
        "Pass the same pose and motion values under one coordinate convention.",
        "Let the method update only its owned state while the function returns a new pose.",
        "Compare outputs and invariant checks rather than judging by style name."
      ],
      outcome:
        "Both designs are valid when dependencies and state effects are bounded and their results agree.",
      criterion:
        "The chosen style must make ownership and dependencies clear while preserving tested behaviour.",
      verification:
        "Apply identical normal and boundary inputs to both implementations and compare next-pose values and unchanged external state."
    },
    counter: {
      scenario:
        "A method ignores its parameters and updates a module-level global pose shared by unrelated tests.",
      given: "hidden global pose and call-order-dependent result",
      unit: "m and rad",
      reasoning: [
        "The altered method violates the declared state-ownership boundary.",
        "Its output depends on hidden call history rather than explicit state and input.",
        "Call-order dependence cannot meet the same-input behavioural criterion."
      ],
      outcome:
        "The class wrapper does not provide encapsulation and makes tests interfere.",
      criterion:
        "Encapsulation requires controlled owned state, not merely class syntax.",
      verification:
        "Run the same test in isolation and after another update; a changed result exposes hidden shared mutation."
    },
    misconception: [
      "Code inside a class is automatically object-oriented and well encapsulated.",
      "Class syntax is mistaken for bounded ownership, invariants and a clear interface.",
      "Inspect where state lives, which operation may mutate it and whether dependencies are explicit and testable.",
      "A method that changes global pose data causes unrelated instances and tests to influence each other."
    ],
    moves: [
      "defining state ownership before choosing method or function form",
      "repairing a class method that mutates hidden global pose",
      "screening style claims by invariants, dependencies and effects",
      "diagnosing whether ownership or explicit input was lost",
      "teaching why syntax labels do not determine design quality",
      "associating update links with state and mutation boundaries",
      "tracing equivalent object and functional pose updates",
      "inspecting a retry that removes call-order-dependent global state"
    ],
    language: "Python",
    baseCode: "def next_pose(pose, translation_m, rotation_rad):\n    return Pose(pose.x_m + translation_m, pose.heading_rad + rotation_rad)",
    retryCode: "class RobotPose:\n    def advance(self, translation_m, rotation_rad):\n        self.x_m += translation_m\n        self.heading_rad += rotation_rad",
    variant: 3
  },
  {
    lessonId: "EML-E1-D07-L05",
    systemModel:
      "Debugging turns an observed discrepancy into a minimal reproducible case, uses instrumentation to test one causal hypothesis at a time and preserves the corrected behaviour with deterministic regression tests.",
    failurePattern:
      "Changing several variables at once, fixing only the visible symptom or writing a test that cannot fail leaves the cause unknown and the defect free to return.",
    visualExplanation:
      "A state graph links observed discrepancy, controlled failing input, instrumentation, causal hypothesis and a regression test.",
    applicationTask:
      "Diagnose an off-by-one sensor-buffer defect and convert the failing input into a deterministic automated test.",
    terms: [
      ["Minimal reproducer", "The smallest controlled input and procedure that still demonstrates the discrepancy.", "Removing too much can remove the cause; keeping unrelated state makes causal tests noisy."],
      ["Causal hypothesis", "A specific proposed mechanism that predicts an observable change under a controlled experiment.", "A guess without a distinguishing prediction is not yet a useful debugging hypothesis."],
      ["Regression test", "A deterministic check that fails for the defect and passes for the corrected intended behaviour.", "A test that passed before the fix does not prove it protects against the original defect."]
    ],
    entities: [
      ["observation", "Observed discrepancy", "The difference between expected and actual buffer behaviour."],
      ["input", "Controlled failing input", "A small sensor sequence that reliably reaches the boundary index."],
      ["mechanism", "Instrumentation trace", "Recorded index, length and branch values around the failure."],
      ["state", "Causal hypothesis", "The proposed off-by-one mechanism and its predicted trace."],
      ["decision", "Regression test", "The retained assertion for corrected boundary behaviour."]
    ],
    relationKinds: ["constrains", "measures", "supports", "compares", "invalidates"],
    relationText: [
      "the minimal reproducer constrains the failing input and procedure",
      "instrumentation measures the boundary state without changing intended behaviour",
      "the observed trace supports or contradicts the causal hypothesis",
      "the corrected output is compared with the regression assertion",
      "multi-change experiments or non-failing tests invalidates the causal conclusion"
    ],
    conditions: [
      ["assumption", "Expected output, actual output and deterministic input sequence are recorded before editing code."],
      ["boundary", "One hypothesis is tested per experiment and instrumentation does not alter timing-sensitive behaviour."],
      ["criterion", "The retained test fails on the original defect, passes after correction and covers the exact boundary input."],
      ["operating-state", "The altered attempt changes several conditions or writes an assertion unrelated to the original failure."]
    ],
    failure: [
      "The experiment cannot distinguish the proposed cause from other simultaneous changes.",
      "The symptom disappears temporarily but the original failing input is not protected.",
      "Reject the fix claim unless original failure, causal experiment and regression evidence are all retained."
    ],
    steps: [
      "Capture expected and actual behaviour for one deterministic failing input.",
      "Minimise the case while preserving the discrepancy.",
      "Instrument relevant boundary state and test one causal hypothesis.",
      "Correct the cause and retain a regression test that previously failed.",
      "Reject symptom-only changes or tests that never exercised the defect."
    ],
    worked: {
      scenario:
        "A fixed-length sensor buffer drops one extra sample exactly when it becomes full.",
      given: "small input sequence reaching the capacity boundary",
      unit: "sample",
      reasoning: [
        "Record expected and actual sequences at the first capacity crossing.",
        "Trace length and removal condition to test the greater-than-or-equal hypothesis.",
        "Correct the boundary condition and retain the exact sequence as a regression test."
      ],
      outcome:
        "The fix is linked to the off-by-one cause and protected by a formerly failing boundary test.",
      criterion:
        "The buffer keeps exactly its declared capacity and removes only the intended oldest sample.",
      verification:
        "Run the regression against the original and corrected implementations and inspect its fail-then-pass result."
    },
    counter: {
      scenario:
        "Several loop and data-structure changes are applied together until the symptom disappears, without retaining the failing input.",
      given: "multiple simultaneous edits and no stable reproducer",
      unit: null,
      reasoning: [
        "The altered method violates the one-hypothesis experiment boundary.",
        "No observation distinguishes which edit affected the discrepancy.",
        "A disappearing symptom cannot satisfy the causal regression criterion."
      ],
      outcome:
        "The cause remains unknown and later changes can restore the defect unnoticed.",
      criterion:
        "A fix requires a controlled causal explanation and a test tied to the original failure.",
      verification:
        "Restore the original failing input, revert unrelated edits and test one change at a time."
    },
    misconception: [
      "If a code change makes the symptom disappear, the bug is fixed.",
      "Visible outcome is accepted without showing that the causal mechanism changed or that the original input is protected.",
      "Preserve a reproducer, test one hypothesis, correct the cause and retain a fail-then-pass regression.",
      "The symptom returns when unrelated state changes because no test captured the original boundary condition."
    ],
    moves: [
      "capturing failure before minimising and testing one hypothesis",
      "repairing a multi-edit attempt without causal evidence",
      "screening fix claims by reproducer, prediction and regression",
      "diagnosing which boundary trace distinguishes the cause",
      "teaching why symptom removal is not causal proof",
      "associating observations and hypotheses with experiment constraints",
      "tracing the buffer code at the exact capacity boundary",
      "inspecting a corrected condition with fail-then-pass evidence"
    ],
    language: "Python",
    baseCode: "def append_sample(buffer, sample, capacity):\n    buffer.append(sample)\n    if len(buffer) >= capacity:\n        buffer.pop(0)",
    retryCode: "def append_sample(buffer, sample, capacity):\n    buffer.append(sample)\n    if len(buffer) > capacity:\n        buffer.pop(0)\n    assert len(buffer) <= capacity",
    variant: 4
  },
  {
    lessonId: "EML-E1-D07-L06",
    systemModel:
      "Software architecture allocates responsibilities behind interfaces, and a finite state machine makes current state, accepted events, guarded transitions, side effects and rejected events explicit.",
    failurePattern:
      "Scattered Boolean flags permit impossible combinations, while performing side effects before a transition is validated lets rejected events change the system.",
    visualExplanation:
      "A state graph links incoming event, current state, transition table, bounded side effect and the resulting architecture decision.",
    applicationTask:
      "Design a robot docking controller with explicit Idle, Approaching, Docked and Fault states and deterministic rejected-event behaviour.",
    terms: [
      ["Component boundary", "The responsibility and interface separating one software component from its callers and dependencies.", "A file or class boundary is not meaningful if internal state is freely mutated from outside."],
      ["Finite state machine", "A finite set of states and event-driven transition rules with defined current state.", "A list of state names without permitted and rejected transitions is incomplete."],
      ["Transition guard", "A condition that must hold before an event may cause a state transition.", "A guard must be checked before transition side effects are committed."]
    ],
    entities: [
      ["input", "Docking event", "A typed request or sensor event entering the controller."],
      ["state", "Current docking state", "Exactly one of Idle, Approaching, Docked or Fault."],
      ["mechanism", "Transition table", "The permitted next state and guard for each state-event pair."],
      ["component", "Bounded side effect", "The actuator command emitted only after a valid transition is selected."],
      ["decision", "Architecture result", "The next state, emitted effect and retained rejection evidence."]
    ],
    relationKinds: ["routes", "depends-on", "constrains", "supports", "invalidates"],
    relationText: [
      "the component boundary routes typed docking events to the controller",
      "the next state depends on current state and event",
      "transition guards constrain which side effects may execute",
      "the explicit transition table supports the architecture result",
      "flag combinations or pre-guard side effects invalidates deterministic behaviour"
    ],
    conditions: [
      ["assumption", "Exactly one current state and one typed event are supplied to each transition evaluation."],
      ["boundary", "No actuator side effect occurs until a declared state-event transition and guard are accepted."],
      ["criterion", "Every state-event pair has a deterministic next state, bounded effect or explicit rejection."],
      ["operating-state", "The altered controller combines independent flags or commands an actuator before checking the guard."]
    ],
    failure: [
      "State representation permits contradiction or side effects escape the transition boundary.",
      "The robot can be both Docked and Approaching or move after an event should be rejected.",
      "Reject the architecture unless state exclusivity, guards, effects and rejection paths are explicit."
    ],
    steps: [
      "Declare component responsibility, typed events and mutually exclusive states.",
      "Look up the current state-event pair in the transition table.",
      "Evaluate the guard before changing state or issuing an actuator command.",
      "Commit the next state and bounded side effect or retain a rejection.",
      "Reject scattered flags or effects emitted before validation."
    ],
    worked: {
      scenario:
        "The controller in Approaching receives a contact-confirmed event while the docking guard is true.",
      given: "current state, typed event and guard result",
      unit: null,
      reasoning: [
        "Use the Approaching and contact-confirmed pair to locate the declared transition.",
        "Evaluate the contact and alignment guard before any actuator effect.",
        "Commit Docked and stop-drive effects together, retaining transition evidence."
      ],
      outcome:
        "The controller reaches one Docked state and emits only the effect attached to the accepted transition.",
      criterion:
        "State, guard and side effect must correspond to one declared transition-table row.",
      verification:
        "Enumerate all state-event pairs and assert expected next state, effect or rejection."
    },
    counter: {
      scenario:
        "Separate is_docked and is_approaching flags are both true, and a drive command is emitted before contact validation.",
      given: "contradictory flags with pre-guard side effect",
      unit: null,
      reasoning: [
        "The altered representation violates the one-current-state condition.",
        "The drive effect crosses the boundary before the transition guard is evaluated.",
        "Contradictory state and premature effect cannot meet deterministic transition criteria."
      ],
      outcome:
        "The controller has no unambiguous state and can move during an invalid event.",
      criterion:
        "Exactly one state is current and rejected transitions have no prohibited side effect.",
      verification:
        "Replace flags with one state value and assert that every rejected event leaves state and actuator output unchanged."
    },
    misconception: [
      "Several Boolean flags are equivalent to one well-defined state machine.",
      "Independent flags allow combinations that were never designed as legitimate states.",
      "Represent one current state and enumerate guarded transitions, effects and rejections.",
      "Both Docked and Approaching flags can become true even though no valid docking state has that meaning."
    ],
    moves: [
      "routing one event through state lookup, guard and effect",
      "repairing contradictory flags and a pre-guard command",
      "screening architecture claims by responsibility and transition completeness",
      "diagnosing which illegal state-event pair escaped",
      "teaching why Boolean combinations are not a transition model",
      "associating state-machine links with guard and effect boundaries",
      "tracing docking pseudocode from event to committed transition",
      "inspecting a rejected-event retry with unchanged actuator output"
    ],
    language: "TypeScript",
    baseCode: "const transition = table[currentState]?.[event.type];\nif (!transition || !transition.guard(context)) return reject();\nconst nextState = transition.next;\nemit(transition.effect);",
    retryCode: "const before = {state: currentState, command: actuatorCommand};\nconst result = handle({type: \"CONTACT_LOST\"});\nassertRejected(result);\nassertEqual({state: currentState, command: actuatorCommand}, before);",
    variant: 5
  },
  {
    lessonId: "EML-E1-D07-L07",
    systemModel:
      "Concurrent tasks interleave around shared state, synchronisation establishes ordering, network messages cross a trust boundary and secure code validates input while granting only the authority required for one operation.",
    failurePattern:
      "A check-then-act race lets state change between validation and update, while trusting network text or sharing broad authority turns timing and input errors into unintended effects.",
    visualExplanation:
      "A state graph links shared resource state, concurrent tasks, synchronisation, untrusted network input and the secure operation decision.",
    applicationTask:
      "Explain an atomic robot-command queue update that validates a network message and applies one allowlisted command without a race.",
    terms: [
      ["Race condition", "A defect in which behaviour depends on uncontrolled ordering between concurrent operations.", "Nondeterminism alone is not a defect when all permitted interleavings preserve the contract."],
      ["Synchronisation", "A mechanism establishing mutual exclusion, ordering or visibility between concurrent tasks.", "A lock is not automatically correct if its scope, ordering or blocking behaviour is wrong."],
      ["Secure coding boundary", "The point where untrusted input is validated and converted into a least-authority typed operation.", "Authentication and locking do not make malformed fields or excessive authority safe."]
    ],
    entities: [
      ["state", "Shared command queue", "The bounded queue state observed and modified by concurrent tasks."],
      ["mechanism", "Concurrent producers", "Tasks that may validate and enqueue commands at overlapping times."],
      ["constraint", "Atomic update", "The synchronised capacity check and enqueue operation."],
      ["input", "Untrusted network message", "External bytes requesting one robot command."],
      ["decision", "Secure queue action", "The accepted enqueue or explicit rejection with bounded authority."]
    ],
    relationKinds: ["depends-on", "feeds-back", "constrains", "routes", "invalidates"],
    relationText: [
      "queue result depends on the interleaving of concurrent producers",
      "each enqueue feeds back into the shared capacity state",
      "the atomic update constrains check and enqueue to one synchronised action",
      "validated network input routes only an allowlisted command to the queue",
      "check-then-act separation or unchecked input invalidates the secure queue action"
    ],
    conditions: [
      ["assumption", "Queue capacity, permitted command types and producer concurrency are declared."],
      ["boundary", "Message validation occurs before one atomic capacity-check-and-enqueue operation with no broad command execution."],
      ["criterion", "Every interleaving preserves queue capacity and every accepted item is a typed allowlisted command."],
      ["operating-state", "The altered case checks capacity outside synchronisation or concatenates network text into executable behaviour."]
    ],
    failure: [
      "Shared state changes between validation and effect, or untrusted data crosses into excess authority.",
      "The queue exceeds capacity or a non-allowlisted command gains an effect.",
      "Reject the design unless validation, atomicity, interleavings, capacity and authority are explicit."
    ],
    steps: [
      "Parse and validate the network message into a typed allowlisted command.",
      "Enter the synchronisation boundary before reading shared queue capacity.",
      "Perform capacity check and enqueue as one atomic operation.",
      "Return accepted or rejected evidence without executing arbitrary input.",
      "Reject split check-then-act logic or broad shared authority."
    ],
    worked: {
      scenario:
        "Two producer tasks receive valid robot commands while one queue slot remains.",
      given: "two overlapping enqueue attempts and one available slot",
      unit: "command",
      reasoning: [
        "Validate each message independently into an allowlisted command.",
        "Serialise the capacity check and enqueue inside one atomic boundary.",
        "Accept one command and reject the other while retaining capacity and audit evidence."
      ],
      outcome:
        "All interleavings keep the queue within capacity and admit only validated command types.",
      criterion:
        "The capacity invariant and command allowlist hold before and after every concurrent operation.",
      verification:
        "Exercise controlled interleavings repeatedly and assert capacity, accepted count and command type."
    },
    counter: {
      scenario:
        "Both producers observe one free slot before either enqueues, then both add a command.",
      given: "capacity check separated from enqueue",
      unit: "command",
      reasoning: [
        "The altered sequence violates the atomic check-and-act boundary.",
        "Each producer's observation becomes stale before its enqueue.",
        "The resulting over-capacity queue fails the invariant criterion."
      ],
      outcome:
        "A race allows more accepted commands than the queue can hold.",
      criterion:
        "A shared-state precondition and its update must be protected as one operation.",
      verification:
        "Insert a scheduler barrier after both checks and show the overflow, then move both steps inside one lock and repeat."
    },
    misconception: [
      "Checking a shared condition immediately before an update makes the update thread-safe.",
      "The gap between check and action is ignored even though another task can change state there.",
      "Protect the precondition and state change in one atomic region and validate external input before it enters.",
      "Two producers can both observe one free slot and then both enqueue, exceeding capacity."
    ],
    moves: [
      "validating input before one atomic capacity update",
      "repairing a split check-and-enqueue race",
      "screening concurrency claims by invariant, interleaving and authority",
      "diagnosing the stale observation that enabled overflow",
      "teaching why immediate check does not imply atomicity",
      "associating shared-state links with synchronisation boundaries",
      "tracing a locked enqueue from typed message to decision",
      "inspecting a barrier-controlled retry that proves the race is removed"
    ],
    language: "TypeScript-like pseudocode",
    baseCode: "const command = validateAllowlisted(message);\nawait queueLock.runExclusive(() => {\n  if (queue.length >= capacity) throw new QueueFull();\n  queue.push(command);\n});",
    retryCode: "await runTwoProducersAtBarrier();\nassert(queue.length <= capacity);\nassert(queue.every(isAllowlistedCommand));",
    variant: 6
  }
] satisfies readonly SoftwareSource[];

export const academyLessonTeachingProfileV2PlansE1D07 = sources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE1D07 =
  sources.map((source) => source.lessonId);

const seeds = materialiseAcademyLessonTeachingProfileV2Registry(
  academyLessonTeachingProfileV2LessonIdsE1D07,
  academyLessonTeachingProfileV2PlansE1D07
);

export const academyLessonTeachingProfilesV2E1D07 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE1D07.map((lessonId) => {
      const seed = seeds[lessonId];
      if (!seed) throw new Error(`Missing materialised D07 seed ${lessonId}.`);
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E1D07;
