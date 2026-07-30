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

type ComputingSource = Readonly<{
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
  source: ComputingSource,
  slot: number
): AcademyLessonV2InstructionPlan => {
  const first = source.terms[0][0];
  const second = source.terms[1][0];
  const result = source.entities[4][1];
  const move = source.moves[slot];
  const copies: readonly (
    readonly [string, string, string, string, string, string, string]
  )[] = [
    [
      `Put ${first}, ${second} and ${result} in operational order by ${move}:`,
      `${first} reaches ${result} correctly because ${move} preserves the ${second} boundary.`,
      `${second} is sequenced wrongly when ${move} reaches ${result} before ${first} is resolved.`,
      `Start with ${first} and mark the first dependency used while ${move}.`,
      `Inspect how ${second} changes before ${result} is accepted during ${move}.`,
      `Order ${first} through ${second}, explicitly carrying out ${move}.`,
      `Close at ${result} only after ${move} retains the declared ${first} meaning.`
    ],
    [
      `Recover ${result} after failure by ${move} across ${second} and ${first}:`,
      `${result} is recoverable because ${move} restores a bounded ${second} route from ${first}.`,
      `${first} remains unsafe or ambiguous if ${move} skips the altered ${result} state.`,
      `Locate the failing ${second} transition before ${move} touches ${first}.`,
      `Ask which ${result} evidence changes once ${move} restores the boundary.`,
      `Reconstruct ${first}, then use ${move} to re-establish ${second}.`,
      `Retest ${result} and record why ${move} now satisfies ${first}.`
    ],
    [
      `Select ${first} and ${second} claims supported by ${move} at ${result}:`,
      `The selected ${first} claims survive ${move} and retain the ${second} contract.`,
      `A ${result} claim is unsupported because ${move} bypasses the ${first} check.`,
      `Read each ${second} claim against its declared type or scope before ${move}.`,
      `Keep ${result} only when ${first} evidence remains explicit during ${move}.`,
      `Choose the ${second} links that preserve meaning while ${move}.`,
      `Reject the ${first} shortcut disproved by ${result} after ${move}.`
    ],
    [
      `Diagnose altered ${result} by ${move} between ${first} and ${second}:`,
      `${second} exposes the altered ${result} because ${move} respects ${first}.`,
      `${result} is misdiagnosed if ${move} silently broadens the ${first} boundary.`,
      `Find the first ${second} condition changed before ${move}.`,
      `Compare bounded ${first} evidence with altered ${result} while ${move}.`,
      `Retain the ${second} relation that makes the failure visible during ${move}.`,
      `Remove the ${first} claim that cannot reproduce ${result} after ${move}.`
    ],
    [
      `Explain ${first} with ${second} and ${result} while ${move}:`,
      `The explanation is complete because ${move} links ${first}, ${second} and ${result}.`,
      `The ${first} account is incomplete if ${move} omits the ${second} contract.`,
      `Define ${first} before ${move} introduces the ${second} mechanism.`,
      `State what ${result} would show if ${move} broke ${second}.`,
      `Connect ${first} to ${second} by narrating ${move} without hidden steps.`,
      `Finish with the ${result} criterion that bounds ${first} after ${move}.`
    ],
    [
      `Match ${first} relations to ${second} constraints by ${move} around ${result}:`,
      `Each ${first} relation meets the ${second} constraint governing it during ${move}.`,
      `A ${result} pair is wrong because ${move} attaches the wrong ${first} scope.`,
      `Pair the first ${second} operation with its ${first} precondition before ${move}.`,
      `Reserve the ${result} acceptance rule for the last link reached by ${move}.`,
      `Align ${first} and ${second} using the dependency revealed by ${move}.`,
      `Read each ${result} pair backwards to verify ${move} and ${first}.`
    ],
    [
      `Analyse the ${first} snippet by ${move} through ${second} to ${result}:`,
      `The chosen ${result} follows because ${move} preserves the ${second} boundary around ${first}.`,
      `The ${first} snippet is misread when ${move} skips the ${second} transformation.`,
      `Trace the first ${first} value before ${move} applies ${second}.`,
      `Inspect which ${result} is possible under the declared ${second} condition.`,
      `Execute ${first} conceptually while ${move}, retaining ${second} meaning.`,
      `Choose the ${result} implication supported by ${move} rather than syntax alone.`
    ],
    [
      `Review the alternate ${second} snippet by ${move} from ${first} to ${result}:`,
      `${result} is justified because ${move} leaves a checkable ${first} trace through ${second}.`,
      `${first} is overclaimed if ${move} assumes an unchecked ${second} state.`,
      `Start from the altered ${second} input and locate how ${move} affects ${first}.`,
      `Contrast accepted and rejected ${result} paths while ${move}.`,
      `Reconstruct ${first} evidence from the ${second} checks retained by ${move}.`,
      `Accept ${result} only when ${move} satisfies the stated ${first} criterion.`
    ]
  ];
  const selected = copies[slot];
  if (!selected) throw new Error(`Missing D06 instruction ${slot}.`);
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
  source: ComputingSource
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
      if (!endpoints || !kind) throw new Error(`Missing D06 relation ${index}.`);
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
      if (!binding) throw new Error(`Missing D06 condition ${index}.`);
      return [`c${index + 1}`, value[0], value[1], binding[0], binding[1]];
    }
  );
  const patterns = q2Patterns[source.variant];
  if (!patterns) throw new Error(`Missing D06 pattern ${source.variant}.`);
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
        givens: [["worked-given", "Declared computing evidence", source.worked.given, source.worked.unit, "e1"]],
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
        givens: [["counter-given", "Altered computing evidence", source.counter.given, source.counter.unit, "e1"]],
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
    lessonId: "EML-E1-D06-L01",
    systemModel:
      "Bits encode two states, Boolean operations transform those states, memory retains addressed values, a processor executes instructions and input-output interfaces connect digital state to external devices.",
    failurePattern:
      "Reading a multi-bit word as one Boolean value, confusing a stored address with its contents or ignoring input-output timing produces the wrong machine state.",
    visualExplanation:
      "A state graph connects an input bit pattern, Boolean mask, memory register, processor instruction and observed output word.",
    applicationTask:
      "Explain how a processor reads a sensor-status byte, tests one bit and writes a bounded output without assuming that every nonzero word means the same state.",
    terms: [
      ["Bit", "A binary digit representing one of two declared states, conventionally zero or one.", "A bit has meaning only through its assigned position and interpretation."],
      ["Boolean mask", "A bit pattern used with Boolean operations to select, set, clear or compare chosen positions.", "A mask does not convert an entire word into one undifferentiated truth value."],
      ["Instruction cycle", "The ordered fetch, decode and execute process by which a processor changes architectural state.", "External input-output may have timing and side effects beyond an ordinary memory read."]
    ],
    entities: [
      ["input", "Status word", "An eight-bit input in which each bit position has a documented meaning."],
      ["mechanism", "Boolean mask", "A bitwise selector that isolates the declared status position."],
      ["state", "Memory register", "An addressed location retaining the current word value."],
      ["component", "Processor instruction", "The operation that reads, transforms and writes architectural state."],
      ["observation", "Output word", "The observable bit pattern after the instruction sequence."]
    ],
    relationKinds: ["maps", "transforms", "routes", "measures", "invalidates"],
    relationText: [
      "the documented bit layout maps the status word to individual meanings",
      "the Boolean mask transforms the word into an isolated bit result",
      "the processor routes values between input, registers and output",
      "the output word measures whether the intended bit operation occurred",
      "a word-level truth shortcut invalidates the bit-specific interpretation"
    ],
    conditions: [
      ["assumption", "The status word is eight bits wide and bit numbering and zero-one polarity are documented."],
      ["boundary", "Only the declared mask position controls the output decision; all other bits are retained as unrelated state."],
      ["criterion", "The output is accepted only when the isolated bit, register transition and final eight-bit pattern agree."],
      ["operating-state", "The altered case treats any nonzero byte as though the selected bit were one."]
    ],
    failure: [
      "A word-level nonzero check bypasses the documented bit position and polarity.",
      "An unrelated active bit triggers the output even though the selected sensor-status bit is clear.",
      "Reject the logic unless word width, mask, bit numbering and before-after patterns are explicit."
    ],
    steps: [
      "Write the eight-bit status word with documented bit positions.",
      "Apply the Boolean mask to isolate only the required status bit.",
      "Carry the isolated value through the processor register transition.",
      "Compare the final output word with the expected bit-level effect.",
      "Reject any-nonzero reasoning that ignores the selected position."
    ],
    worked: {
      scenario:
        "A status byte contains several flags, and one mask is used to test the motor-ready position.",
      given: "documented eight-bit word and one-bit mask",
      unit: "bit",
      reasoning: [
        "Align the mask with the documented motor-ready bit position.",
        "Apply bitwise AND and compare the isolated result with zero.",
        "Trace the resulting branch to the output word while leaving unrelated flags uninterpreted."
      ],
      outcome:
        "The processor decision depends only on the documented motor-ready bit.",
      criterion:
        "Changing an unrelated bit must not change the motor-ready decision.",
      verification:
        "Toggle each unrelated bit independently and confirm the output changes only when the masked position changes."
    },
    counter: {
      scenario:
        "A nonzero status byte is treated as motor-ready even though only an unrelated warning bit is set.",
      given: "one unrelated bit set and selected bit clear",
      unit: "bit",
      reasoning: [
        "The altered check violates the selected-bit boundary.",
        "Nonzero word state reveals no information about which bit is active.",
        "The output cannot meet the isolated-bit criterion."
      ],
      outcome:
        "The processor asserts motor-ready from an unrelated warning flag.",
      criterion:
        "A bit-specific decision must test the documented mask position rather than byte truthiness.",
      verification:
        "Display the binary word and evaluate the masked result separately from the whole-word nonzero result."
    },
    misconception: [
      "A nonzero binary word means every Boolean flag in that word is true.",
      "Whole-value truthiness is confused with the meaning of individual bit positions.",
      "Document the layout and use an explicit mask for each flag decision.",
      "A byte with only the warning bit set is nonzero while the motor-ready bit remains zero."
    ],
    moves: [
      "mapping documented positions before executing the mask",
      "repairing a branch driven by whole-byte truthiness",
      "screening statements by word width, bit position and polarity",
      "diagnosing which unrelated flag caused the false output",
      "explaining why binary representation and Boolean meaning are separate",
      "matching bit transformations to layout and isolation constraints",
      "tracing the mask snippet from status byte to output word",
      "reviewing a toggled-bit variant that tests isolation"
    ],
    language: "pseudocode",
    baseCode: "masked = status AND MOTOR_READY_MASK\nready = masked != 0\nwrite_output(ready)",
    retryCode: "warning_only = WARNING_MASK\nmasked = warning_only AND MOTOR_READY_MASK\nwrite_output(masked != 0)",
    variant: 0
  },
  {
    lessonId: "EML-E1-D06-L02",
    systemModel:
      "A shell resolves a program and explicit arguments from a working directory, paths locate filesystem objects, permissions constrain access, and standard streams carry input, output and diagnostics between processes.",
    failurePattern:
      "Assuming a relative path is globally fixed, merging diagnostic output with data or granting broad permissions to overcome one error makes command behaviour irreproducible or unsafe.",
    visualExplanation:
      "A state graph links working directory, command arguments, resolved file path, process streams and the observed command result.",
    applicationTask:
      "Explain a read-only command pipeline that resolves one project file, keeps diagnostics separate and fails clearly when permissions deny access.",
    terms: [
      ["Path", "A filesystem location interpreted as absolute or relative to a declared base directory.", "A relative path has no stable target without its working-directory context."],
      ["Permission", "An operating-system rule controlling which identity may read, write or execute an object.", "A permission error does not authorise widening access beyond the required operation."],
      ["Standard stream", "A conventional process channel for input, normal output or diagnostic output.", "Combining diagnostic and data streams changes the meaning of downstream input."]
    ],
    entities: [
      ["state", "Working directory", "The directory used as the base for relative path resolution."],
      ["input", "Command arguments", "The program name and separately bounded argument values."],
      ["component", "Resolved file path", "The normalised target checked against the intended project root."],
      ["mechanism", "Process streams", "Standard input, standard output and standard error kept by purpose."],
      ["observation", "Command result", "Exit status, data output and diagnostics considered together."]
    ],
    relationKinds: ["depends-on", "constrains", "routes", "maps", "invalidates"],
    relationText: [
      "relative path resolution depends on the declared working directory",
      "permissions constrain which operation the process identity may perform",
      "standard streams route data and diagnostics through separate channels",
      "exit status and stream content map execution into the command result",
      "an escaped path or merged diagnostic stream invalidates the intended pipeline"
    ],
    conditions: [
      ["boundary", "Every relative path is resolved from the declared project directory and remains inside that root."],
      ["assumption", "The process identity has only the read or execute permission required by the stated command."],
      ["criterion", "Success requires the intended path, zero exit status, parseable standard output and separately retained diagnostics."],
      ["operating-state", "The altered case changes working directory, escapes the root or feeds standard error into a data parser."]
    ],
    failure: [
      "Context or stream purpose is lost while the command text still appears plausible.",
      "A different file is read, a parser consumes diagnostics or access is broadened beyond need.",
      "Reject the pipeline unless base path, containment, least permission, exit status and stream separation are explicit."
    ],
    steps: [
      "Declare the working directory before resolving any relative path.",
      "Pass the program and each argument as separate bounded values.",
      "Normalise the target and verify containment and required permission.",
      "Interpret exit status, standard output and standard error by their distinct roles.",
      "Reject path escape, permission widening or diagnostic-data mixing."
    ],
    worked: {
      scenario:
        "A read-only tool receives a relative data path inside a declared project directory and emits machine-readable output.",
      given: "working directory, bounded relative path and separate streams",
      unit: null,
      reasoning: [
        "Resolve the relative path against the declared project directory.",
        "Verify that the normalised target remains inside the project root and requires only read access.",
        "Parse standard output only after checking exit status and retain standard error as diagnostic evidence."
      ],
      outcome:
        "The command result is traceable to one contained file and its data is not contaminated by diagnostics.",
      criterion:
        "Target, permission, exit status and stream purpose must all match the command contract.",
      verification:
        "Repeat from another ambient directory while supplying the same explicit working directory and compare resolved target and output."
    },
    counter: {
      scenario:
        "A relative path is run from an unexpected directory and standard error is piped into a JSON parser.",
      given: "changed working directory and merged output channels",
      unit: null,
      reasoning: [
        "The altered base violates the declared path-resolution boundary.",
        "Diagnostic text no longer has a separate channel from structured data.",
        "The parser result cannot meet the path and stream criterion."
      ],
      outcome:
        "The pipeline may read the wrong file and fail with a misleading parse error.",
      criterion:
        "Relative paths and standard streams require explicit context before downstream interpretation.",
      verification:
        "Print the normalised target, preserve each stream separately and compare exit status before parsing."
    },
    misconception: [
      "A relative path always names the same file wherever a command is started.",
      "The working directory is treated as invisible even though it supplies the base location.",
      "Declare or resolve the base path, verify containment and pass data and diagnostics through separate channels.",
      "Starting the identical command one directory higher resolves the relative text to a different object."
    ],
    moves: [
      "resolving context before invoking the bounded command",
      "repairing a parser fed from the wrong directory and stream",
      "screening shell claims by containment, permission and exit status",
      "diagnosing whether path context or channel mixing caused failure",
      "explaining why relative text is not an absolute location",
      "matching resolution and stream links to their operating constraints",
      "tracing a read-only shell snippet through path and channel checks",
      "reviewing an escaped-path variant without broadening permissions"
    ],
    language: "shell pseudocode",
    baseCode: "base = declared_project_directory\ntarget = resolve_inside(base, relative_path)\nrun_read_only(tool, target, stdout=data, stderr=diagnostics)",
    retryCode: "if exit_status != 0:\n  report(diagnostics)\nelse:\n  parse(data)",
    variant: 1
  },
  {
    lessonId: "EML-E1-D06-L03",
    systemModel:
      "Git stores content-addressed objects, a tree names a project snapshot, a commit points to a tree and parent history, and a branch is a movable reference to a commit rather than a separate folder copy.",
    failurePattern:
      "Treating a branch as duplicated files, confusing uncommitted working-tree state with a commit or rewriting a shared reference without understanding ancestry loses provenance.",
    visualExplanation:
      "A graph links working-tree content, blob and tree objects, a commit, a branch reference and inspectable history evidence.",
    applicationTask:
      "Explain how one source change becomes a content-addressed snapshot and how two branches can diverge and later merge without external links.",
    terms: [
      ["Content-addressed object", "Stored content whose identifier is derived from its bytes and object type.", "Identical identifiers imply identical addressed object content under the repository's hash contract, not identical whole repositories."],
      ["Commit", "An immutable object naming one tree, parent commit references and authored metadata.", "A commit does not include untracked or unstaged working-tree changes unless they enter the recorded tree."],
      ["Branch reference", "A movable name pointing to a commit.", "It is not a second physical working tree or an immutable historical object."]
    ],
    entities: [
      ["input", "Working-tree content", "Current files that may differ from the recorded index and commit."],
      ["state", "Blob and tree objects", "Content-addressed file data and directory mappings forming a snapshot."],
      ["state", "Commit object", "The tree reference, parent references and metadata for one history node."],
      ["mechanism", "Branch reference", "A named pointer advanced to selected commits."],
      ["observation", "History evidence", "The inspectable object graph showing ancestry, divergence and merge parents."]
    ],
    relationKinds: ["transforms", "supports", "maps", "depends-on", "invalidates"],
    relationText: [
      "recorded working-tree content transforms into blob and tree objects",
      "the tree snapshot supports the content recorded by a commit",
      "the branch reference maps a human name to one commit object",
      "history evidence depends on commit parent links rather than branch-folder copies",
      "uncommitted state or misunderstood ancestry invalidates a provenance claim"
    ],
    conditions: [
      ["assumption", "The repository object type, exact content bytes and parent relationships are distinguished."],
      ["boundary", "Only content included in the recorded tree belongs to the commit; other working-tree state remains outside."],
      ["criterion", "A provenance claim identifies the commit, tree content, parent edge and current branch reference separately."],
      ["operating-state", "The altered case treats a branch as copied files or assumes an uncommitted edit is already in history."]
    ],
    failure: [
      "Mutable workspace or branch names are confused with immutable snapshot and ancestry objects.",
      "History evidence omits a file change or attributes content to the wrong commit.",
      "Reject the provenance claim unless object content, tree membership, commit parents and reference position are explicit."
    ],
    steps: [
      "Separate current working-tree bytes from content selected for recording.",
      "Form content-addressed blobs and a tree describing the snapshot.",
      "Create a commit that names the tree and its parent history.",
      "Move a branch reference to the new commit and inspect ancestry.",
      "Reject branch-as-folder or uncommitted-as-recorded reasoning."
    ],
    worked: {
      scenario:
        "One tracked source file changes and a new commit is created on a feature branch.",
      given: "changed file bytes, recorded tree and parent commit",
      unit: "byte",
      reasoning: [
        "Distinguish changed working-tree bytes from the prior recorded object.",
        "Record the new blob and tree, then create a commit pointing to that tree and the prior parent.",
        "Advance the feature branch reference and inspect the commit-to-parent edge."
      ],
      outcome:
        "The new commit preserves one immutable snapshot and ancestry edge while the branch name moves to it.",
      criterion:
        "The recorded tree must contain the intended bytes and the commit must name the expected parent.",
      verification:
        "Inspect the commit tree and parent identifiers, then compare the recorded blob content with the intended source bytes."
    },
    counter: {
      scenario:
        "A file is edited but not recorded, and the current branch name is cited as proof that the edit exists in the latest commit.",
      given: "working-tree edit absent from the recorded tree",
      unit: "byte",
      reasoning: [
        "The altered content violates the commit-membership boundary.",
        "The branch reference still names a commit whose tree lacks those bytes.",
        "A mutable branch label cannot satisfy the recorded-snapshot criterion."
      ],
      outcome:
        "The edit exists only in the working tree and has no commit provenance.",
      criterion:
        "History contains content only when a commit's tree names the corresponding object.",
      verification:
        "Compare working-tree content with the commit tree and inspect whether their object identifiers differ."
    },
    misconception: [
      "Creating a Git branch makes a full independent copy of all project files.",
      "The branch name is visualised as a folder rather than a movable reference into a shared object graph.",
      "Model blobs, trees and commits as immutable objects and branches as movable commit references.",
      "Two branch names can point to the same commit without duplicating any blob or tree objects."
    ],
    moves: [
      "recording content objects before moving a branch reference",
      "repairing a provenance claim about an uncommitted edit",
      "screening history statements by tree membership and parent edges",
      "diagnosing whether workspace, commit or reference state diverged",
      "explaining why a branch name is not a copied directory",
      "matching object and ancestry links to immutability boundaries",
      "tracing pseudocode from bytes to tree, commit and reference",
      "reviewing a shared-object graph after two names diverge"
    ],
    language: "pseudocode",
    baseCode: "blob = store(file_bytes)\ntree = store(path -> blob)\ncommit = store(tree, parent)\nbranch_ref = commit",
    retryCode: "recorded = commit.tree[path]\ncurrent = hash(working_tree[path])\nchanged = recorded != current",
    variant: 2
  },
  {
    lessonId: "EML-E1-D06-L04",
    systemModel:
      "A data format defines syntax and encoded values, a schema constrains meaning and shape, and an application interface defines the request-response behaviour between independently changeable components.",
    failurePattern:
      "Accepting syntactically valid data without schema checks, silently changing field units or assuming transport success means semantic success breaks the interface contract.",
    visualExplanation:
      "A graph links source values, a serialised payload, parser and schema, request-response exchange and a consumer decision.",
    applicationTask:
      "Explain how a robot pose message crosses a JSON-like interface while retaining numeric types, metre and radian units, required fields and explicit errors.",
    terms: [
      ["Serialisation", "Encoding structured values into bytes or text for storage or transfer.", "Successful parsing establishes syntax, not that units, ranges or meanings are correct."],
      ["Schema", "A machine-checkable declaration of required fields, types and selected constraints.", "A schema covers only declared rules and does not replace domain validation."],
      ["API contract", "The documented requests, responses, errors, versions and meaning shared across a component boundary.", "Network delivery or a successful status alone does not prove the returned domain value is acceptable."]
    ],
    entities: [
      ["input", "Pose values", "Position in metres and orientation in radians with named fields."],
      ["state", "Serialised payload", "The text or bytes carrying the pose representation."],
      ["mechanism", "Parser and schema", "Syntax decoding followed by required-field and type checks."],
      ["component", "Request-response exchange", "The API operation, version, response and explicit error path."],
      ["decision", "Consumer interpretation", "The accepted, rejected or migrated pose value with units retained."]
    ],
    relationKinds: ["maps", "transforms", "constrains", "routes", "invalidates"],
    relationText: [
      "pose values map into named serialised fields with declared units",
      "the parser transforms payload text into typed candidate values",
      "the schema constrains required fields, types and allowed shape",
      "the interface routes validated requests, responses and errors",
      "a type, unit or version mismatch invalidates consumer interpretation"
    ],
    conditions: [
      ["assumption", "Field names, numeric types, metres, radians and API version are declared on both sides."],
      ["boundary", "Parsing is followed by schema and domain checks before the payload controls any robot behaviour."],
      ["criterion", "Acceptance requires valid syntax, schema, units, ranges, version and an explicit success or error response."],
      ["operating-state", "The altered case is syntactically valid but changes a number to text, omits a field or silently changes units."]
    ],
    failure: [
      "Transport and syntax are mistaken for semantic compatibility.",
      "A consumer accepts missing, mistyped or differently scaled pose data and moves to the wrong state.",
      "Reject the interface value unless syntax, schema, domain units, version and error handling all pass."
    ],
    steps: [
      "Declare pose fields, numeric types and metre-radian units.",
      "Serialise values without changing their meaning or precision contract.",
      "Parse then validate required fields, types, ranges and units.",
      "Route a versioned response or explicit error to the consumer.",
      "Reject parse-only acceptance or silent interface drift."
    ],
    worked: {
      scenario:
        "A pose request carries position and orientation fields across a versioned component boundary.",
      given: "payload with declared numeric fields and unit metadata",
      unit: "m and rad",
      reasoning: [
        "Parse the payload while preserving numbers as numbers.",
        "Apply schema checks, then enforce metre-radian domain ranges and version.",
        "Return either the validated pose or a structured error before consumer action."
      ],
      outcome:
        "The consumer receives a bounded pose whose syntax, shape, meaning and error path are explicit.",
      criterion:
        "No robot action occurs until every required interface and domain check succeeds.",
      verification:
        "Exercise valid, missing-field, wrong-type, out-of-range and version-mismatch payloads and inspect exact responses."
    },
    counter: {
      scenario:
        "A payload parses successfully but supplies the x position as text and omits the orientation unit.",
      given: "syntactically valid wrong-type payload",
      unit: null,
      reasoning: [
        "The altered payload violates the declared type and unit conditions.",
        "Parsing alone cannot turn text into a trusted metre-valued position.",
        "The consumer cannot meet the semantic acceptance criterion."
      ],
      outcome:
        "The request must produce a validation error rather than an assumed pose.",
      criterion:
        "Syntax success never overrides field type, unit, range or version failures.",
      verification:
        "Run the payload through parser, schema and domain validators separately and retain each failure."
    },
    misconception: [
      "If a JSON payload parses, the data is valid for the application.",
      "Syntactic decoding is conflated with schema and domain meaning.",
      "Validate shape, types, units, ranges and version after parsing and before use.",
      "A quoted number parses as valid JSON while still violating a numeric pose-field contract."
    ],
    moves: [
      "encoding values before parsing, schema and domain checks",
      "repairing a parse-success response with invalid field meaning",
      "screening interface claims by type, unit, range and version",
      "diagnosing whether syntax, schema or domain validation failed",
      "explaining why successful decoding is not semantic acceptance",
      "matching payload transformations to contract boundaries",
      "analysing a validation pipeline for a bounded pose request",
      "reviewing a wrong-type variant through the explicit error path"
    ],
    language: "TypeScript-like pseudocode",
    baseCode: "candidate = parse(payload)\nshape = validateSchema(candidate)\npose = validatePoseUnitsAndRange(shape)\nreturn success(pose)",
    retryCode: "candidate = parse(payload)\nif typeof candidate.x != number:\n  return error(\"x must be numeric metres\")",
    variant: 3
  },
  {
    lessonId: "EML-E1-D06-L05",
    systemModel:
      "A reproducible computation binds a code revision, exact inputs, configuration and execution environment to an output whose provenance and comparison method are retained.",
    failurePattern:
      "Keeping only source code while inputs, random seed, dependency versions or run configuration drift makes a matching result accidental and a changed result unexplained.",
    visualExplanation:
      "A graph links code revision, input digest, configuration, execution environment and a provenance-labelled output.",
    applicationTask:
      "Explain how to reproduce a robotics experiment result locally using exact data, deterministic seeds, pinned dependencies and a comparison tolerance with units.",
    terms: [
      ["Reproducible run", "A run that can be reconstructed from recorded code, inputs, configuration, environment and procedure.", "Reproduction can allow a declared numeric tolerance; it does not require unexplained byte identity for every platform."],
      ["Environment lock", "A recorded set of dependency and runtime versions used to recreate execution conditions.", "A lock does not capture undeclared external services, hardware behaviour or mutable data."],
      ["Provenance", "Evidence linking an output to the exact sources and transformations that produced it.", "A filename or timestamp alone is insufficient when content or procedure can change."]
    ],
    entities: [
      ["input", "Code revision", "The exact recorded source snapshot used by the computation."],
      ["input", "Input digest", "A content hash and metadata for each source dataset."],
      ["constraint", "Run configuration", "Parameters, random seed, units and comparison tolerance."],
      ["state", "Execution environment", "Runtime, dependency and relevant platform versions."],
      ["observation", "Output evidence", "The result plus provenance, metrics and comparison status."]
    ],
    relationKinds: ["depends-on", "compares", "constrains", "supports", "invalidates"],
    relationText: [
      "the run depends on an exact code revision and input content",
      "input digests compare current bytes with the recorded dataset",
      "configuration and environment constrain the executed transformation",
      "retained provenance supports comparison of output evidence",
      "an unrecorded dependency, seed or input change invalidates a reproduction claim"
    ],
    conditions: [
      ["assumption", "Code identifier, input digests, units, seed and dependency versions are recorded before execution."],
      ["boundary", "The comparison metric and numeric tolerance are declared in the output quantity's unit or dimensionless scale."],
      ["criterion", "A reproduced result either meets the declared comparison or records a traceable changed input, code, configuration or environment."],
      ["operating-state", "The altered run changes data, seed or dependency while retaining only the same script name."]
    ],
    failure: [
      "One provenance component drifts without entering the run record.",
      "The output changes with no attributable cause or happens to match for the wrong inputs.",
      "Reject reproducibility unless exact sources, environment, procedure, units and comparison rule are retained."
    ],
    steps: [
      "Identify the exact code revision before starting the run.",
      "Hash every input and record units, parameters and random seed.",
      "Recreate the declared runtime and locked dependency environment.",
      "Run the procedure and compare output with the stated metric and tolerance.",
      "Reject same-script-name evidence when any provenance component is missing."
    ],
    worked: {
      scenario:
        "A localisation evaluation is rerun from a recorded source revision and sensor-log digest.",
      given: "code ID, data digest, seed, parameters and locked runtime",
      unit: "m for position error",
      reasoning: [
        "Verify code and input content identifiers before execution.",
        "Recreate dependencies and apply the recorded seed and parameters.",
        "Compare position-error output in metres using the declared tolerance and retain provenance."
      ],
      outcome:
        "The rerun is reproducible because matching or differing evidence can be traced to recorded inputs and conditions.",
      criterion:
        "Every causal run component is identified and the output comparison uses the declared metre-valued metric.",
      verification:
        "Change one recorded component at a time and confirm the provenance record and comparison status reflect that change."
    },
    counter: {
      scenario:
        "The same script filename is rerun with a newer dataset and unpinned libraries, then called reproducible because the chart looks similar.",
      given: "same filename with changed data and environment",
      unit: null,
      reasoning: [
        "The altered run violates input and environment identity.",
        "Visual similarity does not reveal changed bytes or dependency behaviour.",
        "The run cannot satisfy traceable comparison criteria."
      ],
      outcome:
        "The new output may be useful, but it is not a verified reproduction of the original run.",
      criterion:
        "Reproduction requires the recorded causal inputs, not just a familiar command or visual shape.",
      verification:
        "Compare code, data and environment digests before comparing numeric output."
    },
    misconception: [
      "Keeping the script is enough to reproduce a computation.",
      "Code is treated as the entire experiment while data, seed, configuration and environment remain implicit.",
      "Record and verify every run input, then compare outputs with an explicit metric, unit and tolerance.",
      "The same script produces a different localisation error after the sensor log or dependency version changes."
    ],
    moves: [
      "binding revision, data, configuration and environment before execution",
      "repairing a similar-looking rerun with changed provenance",
      "screening reproduction claims by digest, seed, unit and tolerance",
      "diagnosing which recorded component explains output drift",
      "explaining why source code alone is not an experiment",
      "matching provenance links to identity and comparison conditions",
      "analysing a manifest-driven run before accepting output",
      "reviewing a changed-input variant through digest comparison"
    ],
    language: "pseudocode",
    baseCode: "assert hash(data) == manifest.data_hash\nset_seed(manifest.seed)\nresult = run(manifest.parameters)\ncompare(result, manifest.metric, manifest.tolerance)",
    retryCode: "record = {code_id, data_hash, config_hash, environment_id}\noutput = run(record)\nsave(output, record)",
    variant: 4
  },
  {
    lessonId: "EML-E1-D06-L06",
    systemModel:
      "A network moves framed bytes between addressed endpoints, a parser converts bounded bytes into candidate messages, validation establishes allowed meaning and least authority limits what accepted messages can cause.",
    failurePattern:
      "Trusting source address, length fields or command-like text before validation lets malformed or hostile input cross from data into privileged behaviour.",
    visualExplanation:
      "A state graph links received bytes, bounded parser, validated message, authority boundary and permitted action.",
    applicationTask:
      "Explain how a robot service receives an untrusted network message, validates framing and fields, and invokes only an allowlisted action with minimum authority.",
    terms: [
      ["Network frame", "A bounded sequence of transmitted bytes with addressing and protocol structure.", "Delivery does not establish that payload length, source identity or meaning is trustworthy."],
      ["Input validation", "Checks that untrusted data has the required structure, type, range and allowed semantics.", "Escaping one character class is not a substitute for a complete typed contract."],
      ["Least authority", "Granting a component only the operations and resources required for its declared task.", "Authentication does not justify unlimited filesystem, process or network access."]
    ],
    entities: [
      ["input", "Untrusted bytes", "Network data received from outside the process trust boundary."],
      ["mechanism", "Bounded parser", "A parser enforcing frame length and structural limits before allocation or interpretation."],
      ["state", "Validated message", "A typed candidate whose fields pass range and allowlist checks."],
      ["constraint", "Authority boundary", "The small set of actions and resources available to the handler."],
      ["decision", "Permitted action", "The explicit operation accepted or rejected with audit evidence."]
    ],
    relationKinds: ["routes", "transforms", "constrains", "supports", "invalidates"],
    relationText: [
      "the network routes untrusted bytes to the bounded parser",
      "the parser transforms a length-bounded frame into a typed candidate",
      "validation and least authority constrain the message's possible effects",
      "retained checks support the permitted-action decision",
      "unchecked length or executable interpretation invalidates the security boundary"
    ],
    conditions: [
      ["boundary", "All received bytes remain untrusted until framing, type, range and allowlist checks pass."],
      ["assumption", "The handler has only the named robot actions and resources required by the protocol."],
      ["criterion", "Acceptance requires bounded parsing, typed validation, allowlisted action and retained rejection or success evidence."],
      ["operating-state", "The altered case trusts a declared length, concatenates input into executable text or grants broad authority."]
    ],
    failure: [
      "Untrusted bytes influence allocation or execution before the parser and authority boundaries hold.",
      "A malformed frame consumes excessive resources or command-like text invokes an unintended operation.",
      "Reject the design unless every byte-to-effect transition is bounded, typed, allowlisted and least-authorised."
    ],
    steps: [
      "Receive the network frame as untrusted bytes with a maximum permitted length.",
      "Parse structure only after enforcing actual and declared length bounds.",
      "Validate field types, ranges and an explicit action allowlist.",
      "Invoke one permitted operation through a least-authority interface and retain evidence.",
      "Reject executable concatenation, unchecked allocation or broad handler privilege."
    ],
    worked: {
      scenario:
        "A robot service accepts a small message requesting one named diagnostic action.",
      given: "bounded frame with typed action field and parameters",
      unit: "byte",
      reasoning: [
        "Reject frames whose actual or declared byte length exceeds the protocol bound.",
        "Parse into typed fields and require the action to appear in the explicit allowlist.",
        "Call the narrow diagnostic interface and retain accepted or rejected evidence."
      ],
      outcome:
        "The message can trigger only the bounded diagnostic action authorised by the protocol.",
      criterion:
        "No unvalidated byte may determine allocation, executable text or authority.",
      verification:
        "Exercise truncated, oversized, wrong-type, unknown-action and valid frames and inspect both effects and audit evidence."
    },
    counter: {
      scenario:
        "A received action string is appended to a shell command and executed under a broadly privileged service account.",
      given: "unchecked command-like text from the network",
      unit: "byte",
      reasoning: [
        "The altered handler violates the data-versus-execution boundary.",
        "String concatenation permits input to choose behaviour outside a typed allowlist.",
        "Broad service authority magnifies the effect beyond the permitted-action criterion."
      ],
      outcome:
        "Untrusted data controls executable behaviour and the handler cannot bound its effects.",
      criterion:
        "External input must select only predefined typed actions through a narrow interface.",
      verification:
        "Replace the text path with an enum allowlist and demonstrate that unknown values produce no external effect."
    },
    misconception: [
      "Data from an authenticated network peer is safe to execute as a command.",
      "Peer identity is confused with payload validity and with authorisation for arbitrary effects.",
      "Treat every payload as untrusted, parse within bounds, validate typed fields and invoke only least-authority allowlisted operations.",
      "An authenticated client can still send a malformed length or an action outside its protocol permission."
    ],
    moves: [
      "bounding bytes before parsing, validation and authorised effect",
      "repairing a handler that turns network text into execution",
      "screening security claims by length, type, allowlist and authority",
      "diagnosing where untrusted data first crosses into effect",
      "explaining why identity does not make payload semantics safe",
      "matching byte transformations to trust and privilege boundaries",
      "analysing a typed dispatcher from frame to narrow action",
      "reviewing an unknown-action variant that must have no effect"
    ],
    language: "TypeScript-like pseudocode",
    baseCode: "frame = readAtMost(MAX_FRAME_BYTES)\nmessage = parseTyped(frame)\naction = requireAllowlisted(message.action)\nrobotDiagnostics.invoke(action)",
    retryCode: "if frame.length > MAX_FRAME_BYTES:\n  return reject(\"oversized\")\nif not isKnownAction(message.action):\n  return reject(\"unknown action\")",
    variant: 5
  },
  {
    lessonId: "EML-E1-D06-L07",
    systemModel:
      "Maintainable documentation connects purpose and constraints to interfaces, setup, tests and recorded decisions so a later change can be executed and reviewed against retained intent.",
    failurePattern:
      "Documentation that repeats code syntax but omits assumptions, units, failure modes or verification leaves later maintainers unable to distinguish intentional behaviour from accidental state.",
    visualExplanation:
      "A graph links purpose and constraints, interface contract, setup and configuration, regression evidence and a reviewable change decision.",
    applicationTask:
      "Explain a robot sensor module so another engineer can configure units, call its interface, reproduce tests and understand one design trade-off without external reading.",
    terms: [
      ["Interface documentation", "A description of inputs, outputs, units, errors, side effects and version expectations at a component boundary.", "A function name and parameter list alone do not explain semantic constraints."],
      ["Decision record", "A concise record of context, considered options, chosen trade-off and consequences.", "It captures a decision at a date; it is not permanent proof that the choice remains best."],
      ["Regression evidence", "A reproducible test or observation showing that documented behaviour still holds after change.", "A passing example outside the stated boundary does not cover every failure mode."]
    ],
    entities: [
      ["input", "Purpose and constraints", "The problem, audience, units, safety limits and exclusions."],
      ["component", "Interface contract", "Inputs, outputs, errors and side effects seen by callers."],
      ["state", "Setup and configuration", "Dependencies, runtime steps and parameter sources needed to reproduce behaviour."],
      ["observation", "Regression evidence", "Tests and expected results tied to documented claims."],
      ["decision", "Change decision", "A reviewable choice linked to purpose, contract and verification."]
    ],
    relationKinds: ["supports", "depends-on", "maps", "compares", "invalidates"],
    relationText: [
      "purpose and constraints support the scope of the interface contract",
      "reproducible setup depends on explicit configuration and version sources",
      "documented claims map to concrete regression evidence",
      "a proposed change is compared with retained purpose and tests",
      "stale units, missing failures or unreproducible setup invalidates the documentation claim"
    ],
    conditions: [
      ["assumption", "Audience, module scope, SI units, supported versions and excluded behaviour are declared."],
      ["boundary", "Every setup step and example is local, reproducible and tied to the documented interface version."],
      ["criterion", "A maintainer can configure, call, test and review the module using the native documentation and retained evidence."],
      ["operating-state", "The altered case changes an interface or unit while documentation and tests retain the old contract."]
    ],
    failure: [
      "Documentation drifts away from executable interface or verification evidence.",
      "A maintainer supplies the wrong unit, misses a failure path or cannot reproduce the stated setup.",
      "Reject maintainability claims unless purpose, contract, setup, decisions, tests and change synchronisation are explicit."
    ],
    steps: [
      "State the module purpose, audience, units, constraints and exclusions.",
      "Document the interface contract including errors and side effects.",
      "Provide bounded setup and configuration sources that can be reproduced.",
      "Link important claims and decisions to regression evidence.",
      "Reject documentation that drifts from the implemented version or omits failure behaviour."
    ],
    worked: {
      scenario:
        "A range-sensor module changes its filtering parameter while keeping its public distance unit in metres.",
      given: "interface contract, configuration source and regression cases",
      unit: "m",
      reasoning: [
        "Restate purpose, metre-valued inputs and outputs, errors and supported range.",
        "Record why the filtering trade-off changed and where configuration is supplied.",
        "Run linked regression cases and update versioned behaviour evidence."
      ],
      outcome:
        "A maintainer can reproduce the module and review the filter change without reconstructing intent from source alone.",
      criterion:
        "Documentation, configuration, interface version and regression evidence must describe the same behaviour.",
      verification:
        "Follow the documentation from a clean local setup, execute the named tests and compare observed units and errors."
    },
    counter: {
      scenario:
        "The implementation changes distance output from metres to millimetres while documentation and tests still say metres.",
      given: "unit-changing implementation with stale contract",
      unit: "m versus mm",
      reasoning: [
        "The altered implementation violates the documented unit condition.",
        "Existing examples and assertions interpret the numeric magnitude with the old scale.",
        "The documentation cannot meet the same-behaviour criterion."
      ],
      outcome:
        "The interface is unsafe to consume until implementation, contract and tests are reconciled.",
      criterion:
        "A unit change is an interface change and must be versioned, documented and regression-tested.",
      verification:
        "Compare live output against a known physical distance and inspect contract and test expectations for the same unit."
    },
    misconception: [
      "Readable code makes separate documentation and decision evidence unnecessary.",
      "Local syntax clarity is assumed to reveal user intent, setup context, units and historical trade-offs.",
      "Document purpose, boundaries, interfaces, reproducible setup, decisions and linked tests at their proper level.",
      "A clear conversion function still cannot reveal why callers expect metres, which versions are supported or how failure is handled."
    ],
    moves: [
      "connecting purpose, contract, setup and tests before review",
      "repairing a stale unit contract after implementation drift",
      "screening documentation claims by audience, version and evidence",
      "diagnosing which contract or setup statement became stale",
      "explaining why code syntax cannot preserve all design intent",
      "matching documented claims to configuration and regression checks",
      "analysing a documentation checklist for one interface change",
      "reviewing a unit-drift variant through contract and test evidence"
    ],
    language: "documentation pseudocode",
    baseCode: "document(purpose, units, inputs, outputs, errors)\nrecord(setup, configuration_source, supported_version)\nlink(claims, regression_tests, decision_record)",
    retryCode: "if implementation.unit != documented.unit:\n  reject_release()\n  update_contract_and_tests_together()",
    variant: 6
  }
] satisfies readonly ComputingSource[];

export const academyLessonTeachingProfileV2PlansE1D06 = sources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE1D06 =
  sources.map((source) => source.lessonId);

const seeds = materialiseAcademyLessonTeachingProfileV2Registry(
  academyLessonTeachingProfileV2LessonIdsE1D06,
  academyLessonTeachingProfileV2PlansE1D06
);

export const academyLessonTeachingProfilesV2E1D06 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE1D06.map((lessonId) => {
      const seed = seeds[lessonId];
      if (!seed) throw new Error(`Missing materialised D06 seed ${lessonId}.`);
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E1D06;
