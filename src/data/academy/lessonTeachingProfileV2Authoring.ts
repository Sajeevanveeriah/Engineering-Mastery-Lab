import {
  type AcademyCodeScenarioSeed,
  type AcademyConceptGroupTuple,
  type AcademyConceptualStepTuple,
  type AcademyDiagramOptionTuple,
  type AcademyDiagramPositionTuple,
  type AcademyDomainConditionTuple,
  type AcademyDomainEntityTuple,
  type AcademyDomainRelationTuple,
  type AcademyDomainTermTuple,
  type AcademyExplorerAnnotationTuple,
  type AcademyExplorerStateSeed,
  type AcademyFailureBoundaryTuple,
  type AcademyLessonTeachingProfileV2Seed,
  type AcademyMatchingPairTuple,
  type AcademyMisconceptionSeed,
  type AcademyOrderingScenarioSeed,
  type AcademyOrderingStepTuple,
  type AcademyQ4ScenarioSeed,
  type AcademyQ5ScenarioSeed,
  type AcademyQuestionFeedbackSeed,
  type AcademyReasonedCaseSeed,
  type AcademySelectionOptionTuple,
  type AcademySelectionScenarioSeed
} from "./lessonTeachingProfileV2";
import {
  AcademyLessonProfileV2ValidationError,
  expandAcademyLessonTeachingProfileV2Seed,
  validateAcademyLessonTeachingProfileV2Registry
} from "./lessonTeachingProfileV2Validation";

export type AcademyLessonV2AuthoredTextRef =
  | readonly [
      source: "term",
      sourceId: string,
      field: "label" | "definition" | "boundary"
    ]
  | readonly [
      source: "relation",
      sourceId: string,
      field: "predicate"
    ]
  | readonly [
      source: "condition",
      sourceId: string,
      field: "statement"
    ]
  | readonly [
      source: "case",
      sourceId: string,
      field: "scenario" | "outcome" | "criterion" | "verification"
    ]
  | readonly [
      source: "misconception",
      sourceId: string,
      field:
        | "claim"
        | "mechanism"
        | "correction"
        | "disconfirmingObservation"
    ];

export const academyLessonV2TextRef = Object.freeze({
  term: (
    sourceId: string,
    field: "label" | "definition" | "boundary"
  ): AcademyLessonV2AuthoredTextRef => ["term", sourceId, field],
  relation: (
    sourceId: string
  ): AcademyLessonV2AuthoredTextRef => [
    "relation",
    sourceId,
    "predicate"
  ],
  condition: (
    sourceId: string
  ): AcademyLessonV2AuthoredTextRef => [
    "condition",
    sourceId,
    "statement"
  ],
  reasonedCase: (
    sourceId: string,
    field: "scenario" | "outcome" | "criterion" | "verification"
  ): AcademyLessonV2AuthoredTextRef => ["case", sourceId, field],
  misconception: (
    sourceId: string,
    field:
      | "claim"
      | "mechanism"
      | "correction"
      | "disconfirmingObservation"
  ): AcademyLessonV2AuthoredTextRef => [
    "misconception",
    sourceId,
    field
  ]
});

export type AcademyLessonV2QuestionCopyPlan = readonly [
  promptRefs: readonly AcademyLessonV2AuthoredTextRef[],
  feedbackCorrectRefs: readonly AcademyLessonV2AuthoredTextRef[],
  feedbackIncorrectRefs: readonly AcademyLessonV2AuthoredTextRef[],
  hintRefs: readonly AcademyLessonV2AuthoredTextRef[],
  solutionRefs: readonly AcademyLessonV2AuthoredTextRef[]
];

export type AcademyLessonV2InstructionPlan = readonly [
  promptLead: string,
  feedbackCorrect: string,
  feedbackIncorrect: string,
  hints: readonly string[],
  solution: readonly string[]
];

export type AcademyLessonV2OrderingStepPlan = readonly [
  stepId: string,
  labelRef: AcademyLessonV2AuthoredTextRef,
  explanationRef: AcademyLessonV2AuthoredTextRef,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyLessonV2OrderingScenarioPlan {
  instruction: AcademyLessonV2InstructionPlan;
  copy: AcademyLessonV2QuestionCopyPlan;
  contextConditionIds: readonly string[];
  steps: readonly AcademyLessonV2OrderingStepPlan[];
  correctOrder: readonly string[];
}

export type AcademyLessonV2SelectionOptionPlan = readonly [
  optionId: string,
  labelRef: AcademyLessonV2AuthoredTextRef,
  isCorrect: boolean,
  explanationRef: AcademyLessonV2AuthoredTextRef,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[],
  misconceptionId: string | null
];

export interface AcademyLessonV2SelectionScenarioPlan {
  instruction: AcademyLessonV2InstructionPlan;
  copy: AcademyLessonV2QuestionCopyPlan;
  contextConditionIds: readonly string[];
  options: readonly AcademyLessonV2SelectionOptionPlan[];
}

export type AcademyLessonV2ConceptGroupPlan = readonly [
  conceptId: string,
  labelRef: AcademyLessonV2AuthoredTextRef,
  acceptedPhraseRefs: readonly AcademyLessonV2AuthoredTextRef[],
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyLessonV2ShortResponseScenarioPlan {
  kind: "short-response";
  instruction: AcademyLessonV2InstructionPlan;
  copy: AcademyLessonV2QuestionCopyPlan;
  contextConditionIds: readonly string[];
  conceptGroups: readonly AcademyLessonV2ConceptGroupPlan[];
  minimumConceptGroups: number;
  requiredRelationIds: readonly string[];
  criterionConditionId: string;
  exemplarRefs: readonly AcademyLessonV2AuthoredTextRef[];
}

export type AcademyLessonV2MatchingPairPlan = readonly [
  pairId: string,
  leftRef: AcademyLessonV2AuthoredTextRef,
  rightRef: AcademyLessonV2AuthoredTextRef,
  explanationRef: AcademyLessonV2AuthoredTextRef,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyLessonV2MatchingScenarioPlan {
  kind: "matching";
  instruction: AcademyLessonV2InstructionPlan;
  copy: AcademyLessonV2QuestionCopyPlan;
  contextConditionIds: readonly string[];
  pairs: readonly AcademyLessonV2MatchingPairPlan[];
}

export type AcademyLessonV2Q4ScenarioPlan =
  | AcademyLessonV2ShortResponseScenarioPlan
  | AcademyLessonV2MatchingScenarioPlan;

export type AcademyLessonV2DiagramOptionPlan = readonly [
  optionId: string,
  labelRef: AcademyLessonV2AuthoredTextRef,
  isCorrect: boolean,
  reasoningRef: AcademyLessonV2AuthoredTextRef,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[],
  misconceptionId: string | null
];

export interface AcademyLessonV2DiagramScenarioPlan {
  kind: "diagram";
  instruction: AcademyLessonV2InstructionPlan;
  copy: AcademyLessonV2QuestionCopyPlan;
  contextConditionIds: readonly string[];
  positions: readonly AcademyDiagramPositionTuple[];
  relationIds: readonly string[];
  answerRelationIds: readonly string[];
  options: readonly AcademyLessonV2DiagramOptionPlan[];
  textEquivalentRefs: readonly AcademyLessonV2AuthoredTextRef[];
  textEquivalent: string;
}

export interface AcademyLessonV2CodeScenarioPlan {
  kind: "code-analysis";
  instruction: AcademyLessonV2InstructionPlan;
  copy: AcademyLessonV2QuestionCopyPlan;
  contextConditionIds: readonly string[];
  language: string;
  code: string;
  options: readonly AcademyLessonV2DiagramOptionPlan[];
}

export type AcademyLessonV2Q5ScenarioPlan =
  | AcademyLessonV2DiagramScenarioPlan
  | AcademyLessonV2CodeScenarioPlan;

export interface AcademyLessonV2ExplorerControlPlan {
  id: string;
  labelRef: AcademyLessonV2AuthoredTextRef;
  changedConditionIds: readonly string[];
  state: AcademyExplorerStateSeed;
  outcomeRefs: readonly AcademyLessonV2AuthoredTextRef[];
  requiredActionRefs: readonly AcademyLessonV2AuthoredTextRef[];
  retainedEvidenceRefs: readonly AcademyLessonV2AuthoredTextRef[];
  textEquivalentRefs: readonly AcademyLessonV2AuthoredTextRef[];
  textEquivalent: string;
}

export interface AcademyLessonV2ExplorerPlan {
  titleRef: AcademyLessonV2AuthoredTextRef;
  descriptionRefs: readonly AcademyLessonV2AuthoredTextRef[];
  modelKind: AcademyExplorerStateSeed["kind"];
  controls: readonly AcademyLessonV2ExplorerControlPlan[];
}

export interface AcademyLessonTeachingProfileV2CompactAuthoring {
  schemaVersion: AcademyLessonTeachingProfileV2Seed["schemaVersion"];
  lessonId: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: readonly AcademyDomainTermTuple[];
  entities: readonly AcademyDomainEntityTuple[];
  relations: readonly AcademyDomainRelationTuple[];
  conditions: readonly AcademyDomainConditionTuple[];
  failureBoundary: AcademyFailureBoundaryTuple;
  conceptualModel: readonly AcademyConceptualStepTuple[];
  reasonedCases: readonly AcademyReasonedCaseSeed[];
  misconception: AcademyMisconceptionSeed;
  assessmentPlans: {
    q2: {
      base: AcademyLessonV2OrderingScenarioPlan;
      retry: AcademyLessonV2OrderingScenarioPlan;
    };
    q3: {
      base: AcademyLessonV2SelectionScenarioPlan;
      retry: AcademyLessonV2SelectionScenarioPlan;
    };
    q4: {
      base: AcademyLessonV2Q4ScenarioPlan;
      retry: AcademyLessonV2Q4ScenarioPlan;
    };
    q5: {
      base: AcademyLessonV2Q5ScenarioPlan;
      retry: AcademyLessonV2Q5ScenarioPlan;
    };
  };
  explorerPlan: AcademyLessonV2ExplorerPlan;
}

export type AcademyLessonV2CompactOrderingStepPlan = readonly [
  stepId: string,
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyLessonV2CompactOrderingScenarioPlan {
  instruction: AcademyLessonV2InstructionPlan;
  focusRef: AcademyLessonV2AuthoredTextRef;
  contextConditionIds: readonly string[];
  steps: readonly AcademyLessonV2CompactOrderingStepPlan[];
  correctOrder: readonly string[];
}

export type AcademyLessonV2CompactOptionPlan = readonly [
  optionId: string,
  isCorrect: boolean,
  labelRef: AcademyLessonV2AuthoredTextRef,
  explanationRef: AcademyLessonV2AuthoredTextRef,
  relationIds: readonly string[],
  conditionIds: readonly string[],
  misconceptionId: string | null
];

export interface AcademyLessonV2CompactSelectionScenarioPlan {
  instruction: AcademyLessonV2InstructionPlan;
  focusRef: AcademyLessonV2AuthoredTextRef;
  contextConditionIds: readonly string[];
  options: readonly AcademyLessonV2CompactOptionPlan[];
}

export type AcademyLessonV2CompactConceptGroupPlan = readonly [
  conceptId: string,
  labelRef: AcademyLessonV2AuthoredTextRef,
  acceptedPhraseRefs: readonly AcademyLessonV2AuthoredTextRef[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyLessonV2CompactShortResponseScenarioPlan {
  kind: "short-response";
  instruction: AcademyLessonV2InstructionPlan;
  focusRef: AcademyLessonV2AuthoredTextRef;
  contextConditionIds: readonly string[];
  conceptGroups: readonly AcademyLessonV2CompactConceptGroupPlan[];
  minimumConceptGroups: number;
  requiredRelationIds: readonly string[];
  criterionConditionId: string;
}

export type AcademyLessonV2CompactMatchingPairPlan = readonly [
  pairId: string,
  leftRef: AcademyLessonV2AuthoredTextRef,
  rightRef: AcademyLessonV2AuthoredTextRef,
  explanationRef: AcademyLessonV2AuthoredTextRef,
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyLessonV2CompactMatchingScenarioPlan {
  kind: "matching";
  instruction: AcademyLessonV2InstructionPlan;
  focusRef: AcademyLessonV2AuthoredTextRef;
  contextConditionIds: readonly string[];
  pairs: readonly AcademyLessonV2CompactMatchingPairPlan[];
}

export type AcademyLessonV2CompactQ4ScenarioPlan =
  | AcademyLessonV2CompactShortResponseScenarioPlan
  | AcademyLessonV2CompactMatchingScenarioPlan;

export interface AcademyLessonV2CompactDiagramScenarioPlan {
  kind: "diagram";
  instruction: AcademyLessonV2InstructionPlan;
  focusRef: AcademyLessonV2AuthoredTextRef;
  contextConditionIds: readonly string[];
  positions: readonly AcademyDiagramPositionTuple[];
  relationIds: readonly string[];
  answerRelationIds: readonly string[];
  options: readonly AcademyLessonV2CompactOptionPlan[];
}

export interface AcademyLessonV2CompactCodeScenarioPlan {
  kind: "code-analysis";
  instruction: AcademyLessonV2InstructionPlan;
  focusRef: AcademyLessonV2AuthoredTextRef;
  contextConditionIds: readonly string[];
  language: string;
  code: string;
  options: readonly AcademyLessonV2CompactOptionPlan[];
}

export type AcademyLessonV2CompactQ5ScenarioPlan =
  | AcademyLessonV2CompactDiagramScenarioPlan
  | AcademyLessonV2CompactCodeScenarioPlan;

export type AcademyLessonV2CompactGraphControlPlan = readonly [
  controlId: string,
  labelRef: AcademyLessonV2AuthoredTextRef,
  changedConditionIds: readonly string[],
  activeEntityIds: readonly string[],
  activeRelationIds: readonly string[],
  suppressedRelationIds: readonly string[],
  reversedRelationIds: readonly string[],
  annotations: readonly AcademyExplorerAnnotationTuple[],
  evidenceRef: AcademyLessonV2AuthoredTextRef
];

export interface AcademyLessonV2CompactSharedGraphExplorerPlan {
  kind: "shared-graph";
  titleRef: AcademyLessonV2AuthoredTextRef;
  focusRef: AcademyLessonV2AuthoredTextRef;
  modelKind: "causal-graph" | "state-graph";
  positions: readonly AcademyDiagramPositionTuple[];
  visibleEntityIds: readonly string[];
  visibleRelationIds: readonly string[];
  controls: readonly AcademyLessonV2CompactGraphControlPlan[];
}

export type AcademyLessonV2CompactExplicitControlPlan = readonly [
  controlId: string,
  labelRef: AcademyLessonV2AuthoredTextRef,
  changedConditionIds: readonly string[],
  state: AcademyExplorerStateSeed,
  evidenceRef: AcademyLessonV2AuthoredTextRef,
  textEquivalentRefs: readonly AcademyLessonV2AuthoredTextRef[]
];

export interface AcademyLessonV2CompactExplicitExplorerPlan {
  kind: "explicit-states";
  titleRef: AcademyLessonV2AuthoredTextRef;
  focusRef: AcademyLessonV2AuthoredTextRef;
  modelKind: AcademyExplorerStateSeed["kind"];
  controls: readonly AcademyLessonV2CompactExplicitControlPlan[];
}

export type AcademyLessonV2CompactExplorerPlan =
  | AcademyLessonV2CompactSharedGraphExplorerPlan
  | AcademyLessonV2CompactExplicitExplorerPlan;

export interface AcademyLessonTeachingProfileV2CompactPlan {
  schemaVersion: AcademyLessonTeachingProfileV2Seed["schemaVersion"];
  lessonId: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: readonly AcademyDomainTermTuple[];
  entities: readonly AcademyDomainEntityTuple[];
  relations: readonly AcademyDomainRelationTuple[];
  conditions: readonly AcademyDomainConditionTuple[];
  failureBoundary: AcademyFailureBoundaryTuple;
  conceptualModel: readonly AcademyConceptualStepTuple[];
  reasonedCases: readonly AcademyReasonedCaseSeed[];
  misconception: AcademyMisconceptionSeed;
  assessmentPlans: {
    q2: {
      base: AcademyLessonV2CompactOrderingScenarioPlan;
      retry: AcademyLessonV2CompactOrderingScenarioPlan;
    };
    q3: {
      base: AcademyLessonV2CompactSelectionScenarioPlan;
      retry: AcademyLessonV2CompactSelectionScenarioPlan;
    };
    q4: {
      base: AcademyLessonV2CompactQ4ScenarioPlan;
      retry: AcademyLessonV2CompactQ4ScenarioPlan;
    };
    q5: {
      base: AcademyLessonV2CompactQ5ScenarioPlan;
      retry: AcademyLessonV2CompactQ5ScenarioPlan;
    };
  };
  explorerPlan: AcademyLessonV2CompactExplorerPlan;
}

export type AcademyLessonV2AuthoringIssueCode =
  | "v2-authoring-shape"
  | "v2-authoring-reference"
  | "v2-authoring-reference-binding"
  | "v2-authoring-instruction"
  | "v2-authoring-semantic-duplicate"
  | "v2-authoring-relation-set"
  | "v2-authoring-explorer-integrity"
  | "v2-authoring-rendered-duplicate"
  | "v2-authoring-answer-leakage"
  | "v2-authoring-q4-integrity"
  | "v2-authoring-reasoned-case"
  | "v2-authoring-registry";

export class AcademyLessonV2AuthoringError extends Error {
  readonly code: AcademyLessonV2AuthoringIssueCode;
  readonly path: string;

  constructor(
    code: AcademyLessonV2AuthoringIssueCode,
    path: string,
    message: string
  ) {
    super(`${path}: ${message}`);
    this.name = "AcademyLessonV2AuthoringError";
    this.code = code;
    this.path = path;
  }
}

type TextResolver = (
  reference: AcademyLessonV2AuthoredTextRef,
  path: string
) => string;

const fail = (
  code: AcademyLessonV2AuthoringIssueCode,
  path: string,
  message: string
): never => {
  throw new AcademyLessonV2AuthoringError(code, path, message);
};

const requireRecord = (
  value: unknown,
  path: string
): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail("v2-authoring-shape", path, "Expected an object.");
  }
  return value as Record<string, unknown>;
};

const requireArray = (value: unknown, path: string): readonly unknown[] => {
  if (!Array.isArray(value)) {
    return fail("v2-authoring-shape", path, "Expected an explicit array.");
  }
  return value;
};

const requireString = (value: unknown, path: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fail("v2-authoring-shape", path, "Expected a non-empty string.");
  }
  return value;
};

const indexTuples = (
  value: unknown,
  path: string
): ReadonlyMap<string, readonly unknown[]> => {
  const tuples = requireArray(value, path);
  const entries = tuples.map((tuple, index) => {
    const fields = requireArray(tuple, `${path}[${index}]`);
    const id = requireString(fields[0], `${path}[${index}][0]`);
    return [id, fields] as const;
  });
  return new Map(entries);
};

const indexCases = (
  value: unknown,
  path: string
): ReadonlyMap<string, Record<string, unknown>> => {
  const cases = requireArray(value, path);
  const entries = cases.map((reasonedCase, index) => {
    const record = requireRecord(reasonedCase, `${path}[${index}]`);
    const id = requireString(record.id, `${path}[${index}].id`);
    return [id, record] as const;
  });
  return new Map(entries);
};

const requireTuple = (
  value: unknown,
  length: number,
  path: string
): readonly unknown[] => {
  const tuple = requireArray(value, path);
  if (tuple.length !== length) {
    return fail(
      "v2-authoring-shape",
      path,
      `Expected a ${length}-position tuple.`
    );
  }
  return tuple;
};

const createTextResolver = (
  input: AcademyLessonTeachingProfileV2CompactAuthoring
): TextResolver => {
  const terms = indexTuples(input.terms, "input.terms");
  const relations = indexTuples(input.relations, "input.relations");
  const conditions = indexTuples(input.conditions, "input.conditions");
  const cases = indexCases(input.reasonedCases, "input.reasonedCases");
  const misconception = requireRecord(
    input.misconception,
    "input.misconception"
  );
  const misconceptionId = requireString(
    misconception.id,
    "input.misconception.id"
  );

  const tupleText = (
    collection: ReadonlyMap<string, readonly unknown[]>,
    id: string,
    fieldIndex: number,
    path: string
  ) => {
    const tuple = collection.get(id);
    if (!tuple) {
      return fail(
        "v2-authoring-reference",
        path,
        `Unknown authored source "${id}".`
      );
    }
    return requireString(tuple[fieldIndex], path);
  };

  return (reference, path) => {
    const tuple = requireTuple(reference, 3, path);
    const source = requireString(tuple[0], `${path}[0]`);
    const sourceId = requireString(tuple[1], `${path}[1]`);
    const field = requireString(tuple[2], `${path}[2]`);

    if (source === "term") {
      const fieldIndex = {
        label: 1,
        definition: 2,
        boundary: 3
      }[field];
      if (fieldIndex === undefined) {
        return fail(
          "v2-authoring-reference",
          path,
          `Unsupported term field "${field}".`
        );
      }
      return tupleText(terms, sourceId, fieldIndex, path);
    }
    if (source === "relation") {
      if (field !== "predicate") {
        return fail(
          "v2-authoring-reference",
          path,
          `Unsupported relation field "${field}".`
        );
      }
      return tupleText(relations, sourceId, 4, path);
    }
    if (source === "condition") {
      if (field !== "statement") {
        return fail(
          "v2-authoring-reference",
          path,
          `Unsupported condition field "${field}".`
        );
      }
      return tupleText(conditions, sourceId, 2, path);
    }
    if (source === "case") {
      if (
        field !== "scenario"
        && field !== "outcome"
        && field !== "criterion"
        && field !== "verification"
      ) {
        return fail(
          "v2-authoring-reference",
          path,
          `Unsupported case field "${field}".`
        );
      }
      const reasonedCase = cases.get(sourceId);
      if (!reasonedCase) {
        return fail(
          "v2-authoring-reference",
          path,
          `Unknown authored case "${sourceId}".`
        );
      }
      return requireString(reasonedCase[field], path);
    }
    if (source === "misconception") {
      if (sourceId !== misconceptionId) {
        return fail(
          "v2-authoring-reference",
          path,
          `Unknown misconception "${sourceId}".`
        );
      }
      if (
        field !== "claim"
        && field !== "mechanism"
        && field !== "correction"
        && field !== "disconfirmingObservation"
      ) {
        return fail(
          "v2-authoring-reference",
          path,
          `Unsupported misconception field "${field}".`
        );
      }
      return requireString(misconception[field], path);
    }
    return fail(
      "v2-authoring-reference",
      path,
      `Unsupported authored source "${source}".`
    );
  };
};

const resolveRefs = (
  value: unknown,
  path: string,
  resolveText: TextResolver,
  minimum: number
): string[] => {
  const refs = requireArray(value, path);
  if (refs.length < minimum) {
    return fail(
      "v2-authoring-shape",
      path,
      `Expected at least ${minimum} explicit authored reference(s).`
    );
  }
  return refs.map((reference, index) =>
    resolveText(
      reference as AcademyLessonV2AuthoredTextRef,
      `${path}[${index}]`
    )
  );
};

const joinRefs = (
  value: unknown,
  path: string,
  resolveText: TextResolver
): string => resolveRefs(value, path, resolveText, 1).join(" ");

const materialiseQuestionCopy = (
  value: unknown,
  instructionValue: unknown,
  path: string,
  resolveText: TextResolver
): { prompt: string } & AcademyQuestionFeedbackSeed => {
  const copy = requireTuple(value, 5, path);
  const promptBody = joinRefs(copy[0], `${path}[0]`, resolveText);
  joinRefs(copy[1], `${path}[1]`, resolveText);
  joinRefs(copy[2], `${path}[2]`, resolveText);
  resolveRefs(copy[3], `${path}[3]`, resolveText, 2);
  resolveRefs(copy[4], `${path}[4]`, resolveText, 2);
  const instructionPath = path.replace(/\.copy$/u, ".instruction");
  const instruction = requireTuple(
    instructionValue,
    5,
    instructionPath
  );
  const promptLead = requireString(
    instruction[0],
    `${instructionPath}[0]`
  );
  const feedbackCorrect = requireString(
    instruction[1],
    `${instructionPath}[1]`
  );
  const feedbackIncorrect = requireString(
    instruction[2],
    `${instructionPath}[2]`
  );
  const hints = requireArray(
    instruction[3],
    `${instructionPath}[3]`
  ).map((hint, index) =>
    requireString(hint, `${instructionPath}[3][${index}]`)
  );
  const solution = requireArray(
    instruction[4],
    `${instructionPath}[4]`
  ).map((step, index) =>
    requireString(step, `${instructionPath}[4][${index}]`)
  );
  if (hints.length < 2 || solution.length < 2) {
    return fail(
      "v2-authoring-shape",
      instructionPath,
      "Instruction requires two lesson-specific hints and two solution steps."
    );
  }
  return {
    prompt: `${promptLead} ${promptBody}`,
    feedbackCorrect,
    feedbackIncorrect,
    hints,
    solution
  };
};

const assertTextReferenceBinding = (
  reference: AcademyLessonV2AuthoredTextRef,
  relationIds: readonly string[],
  conditionIds: readonly string[],
  misconceptionId: string | null,
  expectedMisconceptionId: string,
  path: string
) => {
  const [source, sourceId] = requireTuple(reference, 3, path);
  if (source === "relation" && !relationIds.includes(String(sourceId))) {
    fail(
      "v2-authoring-reference-binding",
      path,
      "Relation text source is absent from the explicit relation reference set."
    );
  }
  if (source === "condition" && !conditionIds.includes(String(sourceId))) {
    fail(
      "v2-authoring-reference-binding",
      path,
      "Condition text source is absent from the explicit condition reference set."
    );
  }
  if (
    source === "misconception"
    && (
      sourceId !== expectedMisconceptionId
      || misconceptionId !== expectedMisconceptionId
    )
  ) {
    fail(
      "v2-authoring-reference-binding",
      path,
      "Misconception text requires the exact explicit misconception binding."
    );
  }
};

const materialiseQ2 = (
  plan: AcademyLessonV2OrderingScenarioPlan,
  path: string,
  resolveText: TextResolver,
  misconceptionId: string
): AcademyOrderingScenarioSeed => {
  const record = requireRecord(plan, path);
  const steps = requireArray(record.steps, `${path}.steps`).map(
    (value, index): AcademyOrderingStepTuple => {
      const step = requireTuple(value, 6, `${path}.steps[${index}]`);
      const relationIds = step[4] as readonly string[];
      const conditionIds = step[5] as readonly string[];
      assertTextReferenceBinding(
        step[1] as AcademyLessonV2AuthoredTextRef,
        relationIds,
        conditionIds,
        null,
        misconceptionId,
        `${path}.steps[${index}][1]`
      );
      assertTextReferenceBinding(
        step[2] as AcademyLessonV2AuthoredTextRef,
        relationIds,
        conditionIds,
        null,
        misconceptionId,
        `${path}.steps[${index}][2]`
      );
      return [
        requireString(step[0], `${path}.steps[${index}][0]`),
        resolveText(
          step[1] as AcademyLessonV2AuthoredTextRef,
          `${path}.steps[${index}][1]`
        ),
        resolveText(
          step[2] as AcademyLessonV2AuthoredTextRef,
          `${path}.steps[${index}][2]`
        ),
        step[3] as readonly string[],
        relationIds,
        conditionIds
      ];
    }
  );
  return {
    ...materialiseQuestionCopy(
      record.copy,
      record.instruction,
      `${path}.copy`,
      resolveText
    ),
    contextConditionIds: record.contextConditionIds as readonly string[],
    steps,
    correctOrder: record.correctOrder as readonly string[]
  };
};

const materialiseSelectionOption = (
  value: unknown,
  path: string,
  resolveText: TextResolver,
  expectedMisconceptionId: string
): AcademySelectionOptionTuple => {
  const option = requireTuple(value, 8, path);
  const relationIds = option[5] as readonly string[];
  const conditionIds = option[6] as readonly string[];
  const misconceptionId = option[7] as string | null;
  assertTextReferenceBinding(
    option[1] as AcademyLessonV2AuthoredTextRef,
    relationIds,
    conditionIds,
    misconceptionId,
    expectedMisconceptionId,
    `${path}[1]`
  );
  assertTextReferenceBinding(
    option[3] as AcademyLessonV2AuthoredTextRef,
    relationIds,
    conditionIds,
    misconceptionId,
    expectedMisconceptionId,
    `${path}[3]`
  );
  return [
    requireString(option[0], `${path}[0]`),
    resolveText(option[1] as AcademyLessonV2AuthoredTextRef, `${path}[1]`),
    option[2] as boolean,
    resolveText(option[3] as AcademyLessonV2AuthoredTextRef, `${path}[3]`),
    option[4] as readonly string[],
    relationIds,
    conditionIds,
    misconceptionId
  ];
};

const materialiseQ3 = (
  plan: AcademyLessonV2SelectionScenarioPlan,
  path: string,
  resolveText: TextResolver,
  misconceptionId: string
): AcademySelectionScenarioSeed => {
  const record = requireRecord(plan, path);
  return {
    ...materialiseQuestionCopy(
      record.copy,
      record.instruction,
      `${path}.copy`,
      resolveText
    ),
    contextConditionIds: record.contextConditionIds as readonly string[],
    options: requireArray(record.options, `${path}.options`).map(
      (option, index) =>
        materialiseSelectionOption(
          option,
          `${path}.options[${index}]`,
          resolveText,
          misconceptionId
        )
    )
  };
};

const materialiseConceptGroup = (
  value: unknown,
  path: string,
  resolveText: TextResolver,
  misconceptionId: string
): AcademyConceptGroupTuple => {
  const group = requireTuple(value, 6, path);
  const relationIds = group[4] as readonly string[];
  const conditionIds = group[5] as readonly string[];
  assertTextReferenceBinding(
    group[1] as AcademyLessonV2AuthoredTextRef,
    relationIds,
    conditionIds,
    null,
    misconceptionId,
    `${path}[1]`
  );
  return [
    requireString(group[0], `${path}[0]`),
    resolveText(group[1] as AcademyLessonV2AuthoredTextRef, `${path}[1]`),
    resolveRefs(group[2], `${path}[2]`, resolveText, 1),
    group[3] as readonly string[],
    relationIds,
    conditionIds
  ];
};

const materialiseMatchingPair = (
  value: unknown,
  path: string,
  resolveText: TextResolver,
  misconceptionId: string
): AcademyMatchingPairTuple => {
  const pair = requireTuple(value, 7, path);
  const relationIds = pair[5] as readonly string[];
  const conditionIds = pair[6] as readonly string[];
  [1, 2, 3].forEach((fieldIndex) =>
    assertTextReferenceBinding(
      pair[fieldIndex] as AcademyLessonV2AuthoredTextRef,
      relationIds,
      conditionIds,
      null,
      misconceptionId,
      `${path}[${fieldIndex}]`
    )
  );
  return [
    requireString(pair[0], `${path}[0]`),
    resolveText(pair[1] as AcademyLessonV2AuthoredTextRef, `${path}[1]`),
    resolveText(pair[2] as AcademyLessonV2AuthoredTextRef, `${path}[2]`),
    resolveText(pair[3] as AcademyLessonV2AuthoredTextRef, `${path}[3]`),
    pair[4] as readonly string[],
    relationIds,
    conditionIds
  ];
};

const materialiseQ4 = (
  plan: AcademyLessonV2Q4ScenarioPlan,
  path: string,
  resolveText: TextResolver,
  misconceptionId: string
): AcademyQ4ScenarioSeed => {
  const record = requireRecord(plan, path);
  const kind = requireString(record.kind, `${path}.kind`);
  const common = materialiseQuestionCopy(
    record.copy,
    record.instruction,
    `${path}.copy`,
    resolveText
  );
  if (kind === "matching") {
    return {
      kind,
      ...common,
      contextConditionIds: record.contextConditionIds as readonly string[],
      pairs: requireArray(record.pairs, `${path}.pairs`).map((pair, index) =>
        materialiseMatchingPair(
          pair,
          `${path}.pairs[${index}]`,
          resolveText,
          misconceptionId
        )
      )
    };
  }
  if (kind !== "short-response") {
    return fail(
      "v2-authoring-shape",
      `${path}.kind`,
      `Unsupported Q4 plan kind "${kind}".`
    );
  }
  return {
    kind,
    ...common,
    contextConditionIds: record.contextConditionIds as readonly string[],
    conceptGroups: requireArray(
      record.conceptGroups,
      `${path}.conceptGroups`
    ).map((group, index) =>
      materialiseConceptGroup(
        group,
        `${path}.conceptGroups[${index}]`,
        resolveText,
        misconceptionId
      )
    ),
    minimumConceptGroups: record.minimumConceptGroups as number,
    requiredRelationIds: record.requiredRelationIds as readonly string[],
    criterionConditionId: record.criterionConditionId as string,
    exemplarResponse: joinRefs(
      record.exemplarRefs,
      `${path}.exemplarRefs`,
      resolveText
    )
  };
};

const materialiseDiagramOption = (
  value: unknown,
  path: string,
  resolveText: TextResolver,
  expectedMisconceptionId: string
): AcademyDiagramOptionTuple => {
  const option = requireTuple(value, 8, path);
  const relationIds = option[5] as readonly string[];
  const conditionIds = option[6] as readonly string[];
  const misconceptionId = option[7] as string | null;
  assertTextReferenceBinding(
    option[1] as AcademyLessonV2AuthoredTextRef,
    relationIds,
    conditionIds,
    misconceptionId,
    expectedMisconceptionId,
    `${path}[1]`
  );
  assertTextReferenceBinding(
    option[3] as AcademyLessonV2AuthoredTextRef,
    relationIds,
    conditionIds,
    misconceptionId,
    expectedMisconceptionId,
    `${path}[3]`
  );
  return [
    requireString(option[0], `${path}[0]`),
    resolveText(option[1] as AcademyLessonV2AuthoredTextRef, `${path}[1]`),
    option[2] as boolean,
    resolveText(option[3] as AcademyLessonV2AuthoredTextRef, `${path}[3]`),
    option[4] as readonly string[],
    relationIds,
    conditionIds,
    misconceptionId
  ];
};

const materialiseQ5 = (
  plan: AcademyLessonV2Q5ScenarioPlan,
  path: string,
  resolveText: TextResolver,
  misconceptionId: string
): AcademyQ5ScenarioSeed => {
  const record = requireRecord(plan, path);
  const kind = requireString(record.kind, `${path}.kind`);
  const common = {
    ...materialiseQuestionCopy(
      record.copy,
      record.instruction,
      `${path}.copy`,
      resolveText
    ),
    contextConditionIds: record.contextConditionIds as readonly string[],
    options: requireArray(record.options, `${path}.options`).map(
      (option, index) =>
        materialiseDiagramOption(
          option,
          `${path}.options[${index}]`,
          resolveText,
          misconceptionId
        )
    )
  };
  if (kind === "diagram") {
    return {
      kind,
      ...common,
      positions: record.positions as readonly AcademyDiagramPositionTuple[],
      relationIds: record.relationIds as readonly string[],
      answerRelationIds: record.answerRelationIds as readonly string[],
      textEquivalent: requireString(
        record.textEquivalent,
        `${path}.textEquivalent`
      )
    };
  }
  if (kind !== "code-analysis") {
    return fail(
      "v2-authoring-shape",
      `${path}.kind`,
      `Unsupported Q5 plan kind "${kind}".`
    );
  }
  const codeScenario: AcademyCodeScenarioSeed = {
    kind,
    ...common,
    language: requireString(record.language, `${path}.language`),
    code: requireString(record.code, `${path}.code`)
  };
  return codeScenario;
};

const materialiseExplorer = (
  plan: AcademyLessonV2ExplorerPlan,
  resolveText: TextResolver
): AcademyLessonTeachingProfileV2Seed["explorer"] => {
  const record = requireRecord(plan, "input.explorerPlan");
  const controls = requireArray(
    record.controls,
    "input.explorerPlan.controls"
  ).map((controlValue, index) => {
    const path = `input.explorerPlan.controls[${index}]`;
    const control = requireRecord(controlValue, path);
    resolveRefs(
      control.textEquivalentRefs,
      `${path}.textEquivalentRefs`,
      resolveText,
      1
    );
    return {
      id: requireString(control.id, `${path}.id`),
      label: resolveText(
        control.labelRef as AcademyLessonV2AuthoredTextRef,
        `${path}.labelRef`
      ),
      changedConditionIds: control.changedConditionIds as readonly string[],
      state: control.state as AcademyExplorerStateSeed,
      outcome: joinRefs(control.outcomeRefs, `${path}.outcomeRefs`, resolveText),
      requiredAction: joinRefs(
        control.requiredActionRefs,
        `${path}.requiredActionRefs`,
        resolveText
      ),
      retainedEvidence: joinRefs(
        control.retainedEvidenceRefs,
        `${path}.retainedEvidenceRefs`,
        resolveText
      ),
      textEquivalent: requireString(
        control.textEquivalent,
        `${path}.textEquivalent`
      )
    };
  });
  return {
    title: resolveText(
      record.titleRef as AcademyLessonV2AuthoredTextRef,
      "input.explorerPlan.titleRef"
    ),
    description: joinRefs(
      record.descriptionRefs,
      "input.explorerPlan.descriptionRefs",
      resolveText
    ),
    modelKind: record.modelKind as AcademyExplorerStateSeed["kind"],
    controls
  };
};

const assertUniqueRenderedText = (
  values: readonly string[],
  path: string
) => {
  const normalised = values.map(normaliseInstructionText);
  if (
    normalised.some((value) => value.length === 0)
    || new Set(normalised).size !== normalised.length
  ) {
    fail(
      "v2-authoring-rendered-duplicate",
      path,
      "Rendered learner choices or labels must be non-empty and unique after punctuation normalisation."
    );
  }
};

const validateRenderedChoiceUniqueness = (
  seed: AcademyLessonTeachingProfileV2Seed
) => {
  (["base", "retry"] as const).forEach((mode) => {
    assertUniqueRenderedText(
      seed.assessments.q2[mode].steps.map((step) => step[1]),
      `seed.assessments.q2.${mode}.steps`
    );
    assertUniqueRenderedText(
      seed.assessments.q3[mode].options.map((option) => option[1]),
      `seed.assessments.q3.${mode}.options`
    );
    const q4 = seed.assessments.q4[mode];
    if (q4.kind === "short-response") {
      assertUniqueRenderedText(
        q4.conceptGroups.map((group) => group[1]),
        `seed.assessments.q4.${mode}.conceptGroups`
      );
    } else {
      assertUniqueRenderedText(
        q4.pairs.map((pair) => pair[1]),
        `seed.assessments.q4.${mode}.pairs.left`
      );
      assertUniqueRenderedText(
        q4.pairs.map((pair) => pair[2]),
        `seed.assessments.q4.${mode}.pairs.right`
      );
      assertUniqueRenderedText(
        q4.pairs.map((pair) => `${pair[1]} ${pair[2]}`),
        `seed.assessments.q4.${mode}.pairs`
      );
    }
    assertUniqueRenderedText(
      seed.assessments.q5[mode].options.map((option) => option[1]),
      `seed.assessments.q5.${mode}.options`
    );
  });
};

const materialiseExplicitReferencePlan = (
  input: AcademyLessonTeachingProfileV2CompactAuthoring
): AcademyLessonTeachingProfileV2Seed => {
  const root = requireRecord(input, "input");
  requireRecord(root.assessmentPlans, "input.assessmentPlans");
  const assessmentPlans = input.assessmentPlans;
  const resolveText = createTextResolver(input);
  const misconceptionId = requireString(
    input.misconception.id,
    "input.misconception.id"
  );

  const seed: AcademyLessonTeachingProfileV2Seed = {
    schemaVersion: input.schemaVersion,
    lessonId: input.lessonId,
    systemModel: input.systemModel,
    failurePattern: input.failurePattern,
    visualExplanation: input.visualExplanation,
    applicationTask: input.applicationTask,
    terms: input.terms,
    entities: input.entities,
    relations: input.relations,
    conditions: input.conditions,
    failureBoundary: input.failureBoundary,
    conceptualModel: input.conceptualModel,
    reasonedCases: input.reasonedCases,
    misconception: input.misconception,
    assessments: {
      q2: {
        base: materialiseQ2(
          assessmentPlans.q2.base,
          "input.assessmentPlans.q2.base",
          resolveText,
          misconceptionId
        ),
        retry: materialiseQ2(
          assessmentPlans.q2.retry,
          "input.assessmentPlans.q2.retry",
          resolveText,
          misconceptionId
        )
      },
      q3: {
        base: materialiseQ3(
          assessmentPlans.q3.base,
          "input.assessmentPlans.q3.base",
          resolveText,
          misconceptionId
        ),
        retry: materialiseQ3(
          assessmentPlans.q3.retry,
          "input.assessmentPlans.q3.retry",
          resolveText,
          misconceptionId
        )
      },
      q4: {
        base: materialiseQ4(
          assessmentPlans.q4.base,
          "input.assessmentPlans.q4.base",
          resolveText,
          misconceptionId
        ),
        retry: materialiseQ4(
          assessmentPlans.q4.retry,
          "input.assessmentPlans.q4.retry",
          resolveText,
          misconceptionId
        )
      },
      q5: {
        base: materialiseQ5(
          assessmentPlans.q5.base,
          "input.assessmentPlans.q5.base",
          resolveText,
          misconceptionId
        ),
        retry: materialiseQ5(
          assessmentPlans.q5.retry,
          "input.assessmentPlans.q5.retry",
          resolveText,
          misconceptionId
        )
      }
    },
    explorer: materialiseExplorer(input.explorerPlan, resolveText)
  };

  validateRenderedChoiceUniqueness(seed);
  validateQ4Integrity(seed);
  validateNoAnswerLeakage(seed);
  expandAcademyLessonTeachingProfileV2Seed(seed);
  return seed;
};

const firstString = (value: unknown, path: string): string => {
  const values = requireArray(value, path);
  if (values.length === 0) {
    return fail(
      "v2-authoring-shape",
      path,
      "Expected at least one explicit reference."
    );
  }
  return requireString(values[0], `${path}[0]`);
};

const compactCoreMapCache = new WeakMap<
  object,
  {
    entities: ReadonlyMap<string, readonly unknown[]>;
    relations: ReadonlyMap<string, readonly unknown[]>;
    conditions: ReadonlyMap<string, readonly unknown[]>;
  }
>();

const compactCoreMaps = (
  input: AcademyLessonTeachingProfileV2CompactPlan
) => {
  const cached = compactCoreMapCache.get(input);
  if (cached) return cached;
  const created = {
    entities: indexTuples(input.entities, "input.entities"),
    relations: indexTuples(input.relations, "input.relations"),
    conditions: indexTuples(input.conditions, "input.conditions")
  };
  compactCoreMapCache.set(input, created);
  return created;
};

const deriveEntityIds = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  relationIdsValue: unknown,
  conditionIdsValue: unknown,
  path: string
): string[] => {
  const relationIds = requireArray(
    relationIdsValue,
    `${path}.relationIds`
  ).map((id, index) =>
    requireString(id, `${path}.relationIds[${index}]`)
  );
  const conditionIds = requireArray(
    conditionIdsValue,
    `${path}.conditionIds`
  ).map((id, index) =>
    requireString(id, `${path}.conditionIds[${index}]`)
  );
  if (relationIds.length === 0 && conditionIds.length === 0) {
    return fail(
      "v2-authoring-shape",
      path,
      "Every compact item requires an explicit relation or condition reference."
    );
  }
  const maps = compactCoreMaps(input);
  const entityIds: string[] = [];
  const addEntityId = (value: unknown, entityPath: string) => {
    const entityId = requireString(value, entityPath);
    if (!entityIds.includes(entityId)) entityIds.push(entityId);
  };
  relationIds.forEach((relationId, relationIndex) => {
    const relationTuple = maps.relations.get(relationId);
    if (!relationTuple) {
      return fail(
        "v2-authoring-reference",
        `${path}.relationIds[${relationIndex}]`,
        `Unknown relation "${relationId}".`
      );
    }
    requireArray(
      relationTuple[2],
      `input.relations.${relationId}.fromEntityIds`
    ).forEach((entityId, entityIndex) =>
      addEntityId(
        entityId,
        `input.relations.${relationId}.fromEntityIds[${entityIndex}]`
      )
    );
    requireArray(
      relationTuple[3],
      `input.relations.${relationId}.toEntityIds`
    ).forEach((entityId, entityIndex) =>
      addEntityId(
        entityId,
        `input.relations.${relationId}.toEntityIds[${entityIndex}]`
      )
    );
  });
  conditionIds.forEach((conditionId, conditionIndex) => {
    const conditionTuple = maps.conditions.get(conditionId);
    if (!conditionTuple) {
      return fail(
        "v2-authoring-reference",
        `${path}.conditionIds[${conditionIndex}]`,
        `Unknown condition "${conditionId}".`
      );
    }
    requireArray(
      conditionTuple[3],
      `input.conditions.${conditionId}.affectedEntityIds`
    ).forEach((entityId, entityIndex) =>
      addEntityId(
        entityId,
        `input.conditions.${conditionId}.affectedEntityIds[${entityIndex}]`
      )
    );
  });
  return entityIds;
};

const coreTupleText = (
  collection: ReadonlyMap<string, readonly unknown[]>,
  id: string,
  fieldIndex: number,
  path: string
): string => {
  const tuple = collection.get(id);
  if (!tuple) {
    return fail(
      "v2-authoring-reference",
      path,
      `Unknown core reference "${id}".`
    );
  }
  return requireString(tuple[fieldIndex], path);
};

const entityLabel = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  entityId: string,
  path: string
): string => coreTupleText(
  compactCoreMaps(input).entities,
  entityId,
  2,
  path
);

const relationPredicate = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  relationId: string,
  path: string
): string => coreTupleText(
  compactCoreMaps(input).relations,
  relationId,
  4,
  path
);

const conditionStatement = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  conditionId: string,
  path: string
): string => coreTupleText(
  compactCoreMaps(input).conditions,
  conditionId,
  2,
  path
);

const textEquivalentSection = (
  label: string,
  values: readonly string[],
  emptyValue = "none"
): string => {
  const clauses = values
    .map((value) => value.trim().replace(/[.;:!?]+$/u, ""))
    .filter(Boolean);
  return `${label}: ${clauses.length > 0 ? clauses.join("; ") : emptyValue}.`;
};

const diagramTextEquivalent = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  positionsValue: unknown,
  relationIds: readonly string[],
  answerRelationIds: readonly string[],
  conditionIdsValue: unknown,
  path: string
): string => {
  const nodes = requireArray(positionsValue, `${path}.positions`).map(
    (positionValue, index) => {
      const position = requireTuple(
        positionValue,
        3,
        `${path}.positions[${index}]`
      );
      const entityId = requireString(
        position[0],
        `${path}.positions[${index}][0]`
      );
      if (
        typeof position[1] !== "number"
        || !Number.isFinite(position[1])
        || typeof position[2] !== "number"
        || !Number.isFinite(position[2])
      ) {
        return fail(
          "v2-authoring-shape",
          `${path}.positions[${index}]`,
          "Diagram coordinates must be finite numbers."
        );
      }
      return `${entityLabel(
        input,
        entityId,
        `${path}.positions[${index}]`
      )} at column ${position[1]}, row ${position[2]}`;
    }
  );
  const relations = relationIds.map((relationId, index) =>
    relationPredicate(input, relationId, `${path}.relationIds[${index}]`)
  );
  const answers = answerRelationIds.map((relationId, index) =>
    relationPredicate(
      input,
      relationId,
      `${path}.answerRelationIds[${index}]`
    )
  );
  const conditions = explicitStringArray(
    conditionIdsValue,
    `${path}.contextConditionIds`
  ).map((conditionId, index) =>
    conditionStatement(
      input,
      conditionId,
      `${path}.contextConditionIds[${index}]`
    )
  );
  return [
    textEquivalentSection("Nodes and positions", nodes),
    textEquivalentSection("Visible relations", relations),
    textEquivalentSection("Active conditions", conditions),
    textEquivalentSection("Answer relation state", answers)
  ].join(" ");
};

const explorerStateTextEquivalent = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  stateValue: unknown,
  path: string
): string => {
  const state = requireRecord(stateValue, path);
  const kind = requireString(state.kind, `${path}.kind`);
  if (kind === "causal-graph" || kind === "state-graph") {
    const positions = requireArray(state.positions, `${path}.positions`).map(
      (positionValue, index) => {
        const position = requireTuple(
          positionValue,
          3,
          `${path}.positions[${index}]`
        );
        const entityId = requireString(
          position[0],
          `${path}.positions[${index}][0]`
        );
        return `${entityLabel(
          input,
          entityId,
          `${path}.positions[${index}]`
        )} at ${String(position[1])},${String(position[2])}`;
      }
    );
    const relationState = (
      value: unknown,
      stateLabel: string,
      statePath: string
    ) => {
      const ids = explicitStringArray(value, statePath);
      return textEquivalentSection(
        stateLabel,
        ids.map((relationId, index) =>
          relationPredicate(input, relationId, `${statePath}[${index}]`)
        )
      );
    };
    return [
      textEquivalentSection(`${kind} nodes and positions`, positions),
      relationState(
        state.visibleRelationIds,
        "Visible relations",
        `${path}.visibleRelationIds`
      ),
      relationState(
        state.activeRelationIds,
        "Active relations",
        `${path}.activeRelationIds`
      ),
      relationState(
        state.suppressedRelationIds,
        "Suppressed relations",
        `${path}.suppressedRelationIds`
      ),
      relationState(
        state.reversedRelationIds,
        "Reversed relations",
        `${path}.reversedRelationIds`
      )
    ].join(" ");
  }
  if (kind === "parameter-sweep") {
    const axes = requireTuple(state.axes, 2, `${path}.axes`).map(
      (axisValue, index) => {
        const axis = requireTuple(axisValue, 4, `${path}.axes[${index}]`);
        return `${requireString(
          axis[1],
          `${path}.axes[${index}][1]`
        )} for ${entityLabel(
          input,
          requireString(axis[3], `${path}.axes[${index}][3]`),
          `${path}.axes[${index}][3]`
        )}`;
      }
    );
    const highlightedPointId = requireString(
      state.highlightedPointId,
      `${path}.highlightedPointId`
    );
    const points = requireArray(state.points, `${path}.points`).map(
      (pointValue, index) => {
        const point = requireTuple(
          pointValue,
          5,
          `${path}.points[${index}]`
        );
        const pointId = requireString(
          point[0],
          `${path}.points[${index}][0]`
        );
        return `${requireString(
          point[3],
          `${path}.points[${index}][3]`
        )} at ${String(point[1])},${String(point[2])}${pointId === highlightedPointId
          ? " highlighted"
          : ""}`;
      }
    );
    return [
      textEquivalentSection("Parameter sweep axes", axes),
      textEquivalentSection("Points and state", points)
    ].join(" ");
  }
  if (kind === "geometry-transform") {
    const frameId = requireString(state.frameEntityId, `${path}.frameEntityId`);
    const points = requireArray(state.points, `${path}.points`).map(
      (pointValue, index) => {
        const point = requireTuple(
          pointValue,
          5,
          `${path}.points[${index}]`
        );
        return `${requireString(
          point[1],
          `${path}.points[${index}][1]`
        )} at ${String(point[2])},${String(point[3])}`;
      }
    );
    const segments = requireArray(state.segments, `${path}.segments`).map(
      (segmentValue, index) => {
        const segment = requireTuple(
          segmentValue,
          4,
          `${path}.segments[${index}]`
        );
        return `${String(segment[1])} to ${String(segment[2])} by ${relationPredicate(
          input,
          requireString(segment[3], `${path}.segments[${index}][3]`),
          `${path}.segments[${index}][3]`
        )}`;
      }
    );
    return [
      textEquivalentSection(
        "Geometry frame",
        [entityLabel(input, frameId, `${path}.frameEntityId`)]
      ),
      textEquivalentSection("Points", points),
      textEquivalentSection("Segments", segments)
    ].join(" ");
  }
  if (kind === "comparison-matrix") {
    const rows = explicitStringArray(
      state.rowEntityIds,
      `${path}.rowEntityIds`
    ).map((entityId, index) =>
      entityLabel(input, entityId, `${path}.rowEntityIds[${index}]`)
    );
    const columns = explicitStringArray(
      state.columnConditionIds,
      `${path}.columnConditionIds`
    ).map((conditionId, index) =>
      conditionStatement(
        input,
        conditionId,
        `${path}.columnConditionIds[${index}]`
      )
    );
    const cells = requireArray(state.cells, `${path}.cells`).map(
      (cellValue, index) => {
        const cell = requireTuple(
          cellValue,
          4,
          `${path}.cells[${index}]`
        );
        return `${entityLabel(
          input,
          requireString(cell[0], `${path}.cells[${index}][0]`),
          `${path}.cells[${index}][0]`
        )} under ${conditionStatement(
          input,
          requireString(cell[1], `${path}.cells[${index}][1]`),
          `${path}.cells[${index}][1]`
        )}: ${String(cell[2])}, ${requireString(
          cell[3],
          `${path}.cells[${index}][3]`
        )}`;
      }
    );
    return [
      textEquivalentSection("Comparison matrix rows", rows),
      textEquivalentSection("Conditions", columns),
      textEquivalentSection("Cell states", cells)
    ].join(" ");
  }
  return fail(
    "v2-authoring-explorer-integrity",
    `${path}.kind`,
    `Unsupported explorer state kind "${kind}".`
  );
};

const compactQuestionCopy = (
  promptRef: AcademyLessonV2AuthoredTextRef,
  correctRef: AcademyLessonV2AuthoredTextRef,
  incorrectRef: AcademyLessonV2AuthoredTextRef,
  firstHintRef: AcademyLessonV2AuthoredTextRef,
  secondHintRef: AcademyLessonV2AuthoredTextRef,
  firstSolutionRef: AcademyLessonV2AuthoredTextRef,
  secondSolutionRef: AcademyLessonV2AuthoredTextRef
): AcademyLessonV2QuestionCopyPlan => [
  [promptRef],
  [correctRef],
  [incorrectRef],
  [firstHintRef, secondHintRef],
  [firstSolutionRef, secondSolutionRef]
];

const compactQ2 = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  plan: AcademyLessonV2CompactOrderingScenarioPlan,
  path: string
): AcademyLessonV2OrderingScenarioPlan => {
  const record = requireRecord(plan, path);
  const compactSteps = requireArray(record.steps, `${path}.steps`);
  if (compactSteps.length < 3) {
    return fail(
      "v2-authoring-shape",
      `${path}.steps`,
      "Compact Q2 requires at least three explicit steps."
    );
  }
  const stepRefs = compactSteps.map((value, index) => {
    const stepPath = `${path}.steps[${index}]`;
    const step = requireTuple(value, 3, stepPath);
    const stepId = requireString(step[0], `${stepPath}[0]`);
    const relationIds = requireArray(step[1], `${stepPath}[1]`).map(
      (relationId, relationIndex) =>
        requireString(relationId, `${stepPath}[1][${relationIndex}]`)
    );
    const conditionIds = requireArray(step[2], `${stepPath}[2]`).map(
      (conditionId, conditionIndex) =>
        requireString(conditionId, `${stepPath}[2][${conditionIndex}]`)
    );
    const labelRelationId = firstString(relationIds, `${stepPath}[1]`);
    const explanationConditionId = firstString(
      conditionIds,
      `${stepPath}[2]`
    );
    return {
      step: [
        stepId,
        academyLessonV2TextRef.relation(labelRelationId),
        academyLessonV2TextRef.condition(explanationConditionId),
        deriveEntityIds(input, relationIds, conditionIds, stepPath),
        relationIds,
        conditionIds
      ] as AcademyLessonV2OrderingStepPlan,
      labelRef: academyLessonV2TextRef.relation(labelRelationId),
      explanationRef: academyLessonV2TextRef.condition(
        explanationConditionId
      )
    };
  });
  const last = stepRefs[stepRefs.length - 1];
  if (!last) {
    return fail("v2-authoring-shape", `${path}.steps`, "Missing last step.");
  }
  return {
    instruction: record.instruction as AcademyLessonV2InstructionPlan,
    copy: compactQuestionCopy(
      record.focusRef as AcademyLessonV2AuthoredTextRef,
      last.labelRef,
      stepRefs[0].explanationRef,
      stepRefs[0].labelRef,
      stepRefs[1].labelRef,
      stepRefs[stepRefs.length - 2].labelRef,
      last.labelRef
    ),
    contextConditionIds: record.contextConditionIds as readonly string[],
    steps: stepRefs.map(({ step }) => step),
    correctOrder: record.correctOrder as readonly string[]
  };
};

const compactOptions = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  value: unknown,
  path: string
): Array<{
  option: AcademyLessonV2SelectionOptionPlan;
  labelRef: AcademyLessonV2AuthoredTextRef;
  explanationRef: AcademyLessonV2AuthoredTextRef;
  isCorrect: boolean;
  misconceptionId: string | null;
}> => requireArray(value, path).map((optionValue, index) => {
  const optionPath = `${path}[${index}]`;
  const option = requireTuple(optionValue, 7, optionPath);
  const relationIds = requireArray(option[4], `${optionPath}[4]`).map(
    (relationId, relationIndex) =>
      requireString(relationId, `${optionPath}[4][${relationIndex}]`)
  );
  const conditionIds = requireArray(option[5], `${optionPath}[5]`).map(
    (conditionId, conditionIndex) =>
      requireString(conditionId, `${optionPath}[5][${conditionIndex}]`)
  );
  const labelRef = option[2] as AcademyLessonV2AuthoredTextRef;
  const explanationRef = option[3] as AcademyLessonV2AuthoredTextRef;
  if (typeof option[1] !== "boolean") {
    return fail(
      "v2-authoring-shape",
      `${optionPath}[1]`,
      "Option correctness must be an explicit boolean."
    );
  }
  const expectedMisconceptionId = requireString(
    input.misconception.id,
    "input.misconception.id"
  );
  const misconceptionId = option[6] === null
    ? null
    : requireString(option[6], `${optionPath}[6]`);
  if (
    misconceptionId !== null
    && (
      misconceptionId !== expectedMisconceptionId
      || option[1] === true
    )
  ) {
    return fail(
      "v2-authoring-reference-binding",
      `${optionPath}[6]`,
      "A misconception binding must name this lesson misconception and must be a distractor."
    );
  }
  return {
    option: [
      requireString(option[0], `${optionPath}[0]`),
      labelRef,
      option[1],
      explanationRef,
      deriveEntityIds(input, relationIds, conditionIds, optionPath),
      relationIds,
      conditionIds,
      misconceptionId
    ],
    labelRef,
    explanationRef,
    isCorrect: option[1],
    misconceptionId
  };
});

const compactQ3 = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  plan: AcademyLessonV2CompactSelectionScenarioPlan,
  path: string
): AcademyLessonV2SelectionScenarioPlan => {
  const record = requireRecord(plan, path);
  const options = compactOptions(input, record.options, `${path}.options`);
  const correct = options.filter((option) => option.isCorrect);
  const distractor = options.find((option) => !option.isCorrect);
  if (correct.length < 2 || !distractor) {
    return fail(
      "v2-authoring-shape",
      `${path}.options`,
      "Compact Q3 requires two correct claims and a distractor."
    );
  }
  if (!options.some((option) => option.misconceptionId !== null)) {
    return fail(
      "v2-authoring-reference-binding",
      `${path}.options`,
      "Compact Q3 requires an explicit false misconception distractor."
    );
  }
  options.forEach((option, index) => {
    if (option.misconceptionId === null) return;
    const label = requireTuple(
      option.labelRef,
      3,
      `${path}.options[${index}][2]`
    );
    const explanation = requireTuple(
      option.explanationRef,
      3,
      `${path}.options[${index}][3]`
    );
    if (
      label[0] !== "misconception"
      || label[1] !== option.misconceptionId
      || label[2] !== "claim"
      || explanation[0] !== "misconception"
      || explanation[1] !== option.misconceptionId
      || explanation[2] !== "mechanism"
    ) {
      fail(
        "v2-authoring-reference-binding",
        `${path}.options[${index}]`,
        "A Q3 misconception distractor must render the lesson misconception claim and mechanism."
      );
    }
  });
  return {
    instruction: record.instruction as AcademyLessonV2InstructionPlan,
    copy: compactQuestionCopy(
      record.focusRef as AcademyLessonV2AuthoredTextRef,
      correct[0].labelRef,
      distractor.explanationRef,
      options[0].labelRef,
      options[1].labelRef,
      correct[0].explanationRef,
      correct[1].explanationRef
    ),
    contextConditionIds: record.contextConditionIds as readonly string[],
    options: options.map(({ option }) => option)
  };
};

const compactQ4 = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  plan: AcademyLessonV2CompactQ4ScenarioPlan,
  path: string
): AcademyLessonV2Q4ScenarioPlan => {
  const record = requireRecord(plan, path);
  const kind = requireString(record.kind, `${path}.kind`);
  if (kind === "matching") {
    const compactPairs = requireArray(record.pairs, `${path}.pairs`);
    if (compactPairs.length < 3) {
      return fail(
        "v2-authoring-shape",
        `${path}.pairs`,
        "Compact matching Q4 requires three explicit pairs."
      );
    }
    const pairs = compactPairs.map((pairValue, index) => {
      const pairPath = `${path}.pairs[${index}]`;
      const pair = requireTuple(pairValue, 6, pairPath);
      const relationIds = pair[4] as readonly string[];
      const conditionIds = pair[5] as readonly string[];
      return {
        pair: [
          requireString(pair[0], `${pairPath}[0]`),
          pair[1] as AcademyLessonV2AuthoredTextRef,
          pair[2] as AcademyLessonV2AuthoredTextRef,
          pair[3] as AcademyLessonV2AuthoredTextRef,
          deriveEntityIds(input, relationIds, conditionIds, pairPath),
          relationIds,
          conditionIds
        ] as AcademyLessonV2MatchingPairPlan,
        leftRef: pair[1] as AcademyLessonV2AuthoredTextRef,
        rightRef: pair[2] as AcademyLessonV2AuthoredTextRef,
        explanationRef: pair[3] as AcademyLessonV2AuthoredTextRef
      };
    });
    return {
      kind,
      instruction: record.instruction as AcademyLessonV2InstructionPlan,
      copy: compactQuestionCopy(
        record.focusRef as AcademyLessonV2AuthoredTextRef,
        pairs[0].explanationRef,
        pairs[2].rightRef,
        pairs[0].leftRef,
        pairs[1].leftRef,
        pairs[1].explanationRef,
        pairs[2].explanationRef
      ),
      contextConditionIds: record.contextConditionIds as readonly string[],
      pairs: pairs.map(({ pair }) => pair)
    };
  }
  if (kind !== "short-response") {
    return fail(
      "v2-authoring-shape",
      `${path}.kind`,
      `Unsupported compact Q4 kind "${kind}".`
    );
  }
  const compactGroups = requireArray(
    record.conceptGroups,
    `${path}.conceptGroups`
  );
  if (compactGroups.length < 3) {
    return fail(
      "v2-authoring-shape",
      `${path}.conceptGroups`,
      "Compact short-response Q4 requires three explicit groups."
    );
  }
  const groups = compactGroups.map((groupValue, index) => {
    const groupPath = `${path}.conceptGroups[${index}]`;
    const group = requireTuple(groupValue, 5, groupPath);
    const relationIds = group[3] as readonly string[];
    const conditionIds = group[4] as readonly string[];
    return {
      group: [
        requireString(group[0], `${groupPath}[0]`),
        group[1] as AcademyLessonV2AuthoredTextRef,
        group[2] as readonly AcademyLessonV2AuthoredTextRef[],
        deriveEntityIds(input, relationIds, conditionIds, groupPath),
        relationIds,
        conditionIds
      ] as AcademyLessonV2ConceptGroupPlan,
      labelRef: group[1] as AcademyLessonV2AuthoredTextRef,
      acceptedRefs:
        group[2] as readonly AcademyLessonV2AuthoredTextRef[]
    };
  });
  const requiredRelationIds = record.requiredRelationIds as readonly string[];
  const exemplarRefs = [
    ...groups.map(({ acceptedRefs }, index) => {
      const acceptedRef = acceptedRefs[0];
      if (!acceptedRef) {
        return fail(
          "v2-authoring-q4-integrity",
          `${path}.conceptGroups[${index}][2]`,
          "Every short-Q4 concept group requires an accepted phrase."
        );
      }
      return acceptedRef;
    }),
    ...requiredRelationIds.map((relationId) =>
      academyLessonV2TextRef.relation(relationId)
    ),
    academyLessonV2TextRef.condition(
      requireString(
        record.criterionConditionId,
        `${path}.criterionConditionId`
      )
    )
  ].filter((reference, index, references) =>
    references.findIndex((candidate) =>
      JSON.stringify(candidate) === JSON.stringify(reference)
    ) === index
  );
  return {
    kind,
    instruction: record.instruction as AcademyLessonV2InstructionPlan,
    copy: compactQuestionCopy(
      record.focusRef as AcademyLessonV2AuthoredTextRef,
      groups[2].labelRef,
      groups[0].labelRef,
      groups[0].labelRef,
      groups[1].labelRef,
      groups[1].labelRef,
      groups[2].labelRef
    ),
    contextConditionIds: record.contextConditionIds as readonly string[],
    conceptGroups: groups.map(({ group }) => group),
    minimumConceptGroups: record.minimumConceptGroups as number,
    requiredRelationIds,
    criterionConditionId: record.criterionConditionId as string,
    exemplarRefs
  };
};

const compactQ5 = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  plan: AcademyLessonV2CompactQ5ScenarioPlan,
  path: string
): AcademyLessonV2Q5ScenarioPlan => {
  const record = requireRecord(plan, path);
  const kind = requireString(record.kind, `${path}.kind`);
  const options = compactOptions(input, record.options, `${path}.options`);
  const correct = options.filter((option) => option.isCorrect);
  const distractors = options.filter((option) => !option.isCorrect);
  if (correct.length !== 1 || distractors.length < 2) {
    return fail(
      "v2-authoring-shape",
      `${path}.options`,
      "Compact Q5 requires one correct implication and two distractors."
    );
  }
  const copy = compactQuestionCopy(
    record.focusRef as AcademyLessonV2AuthoredTextRef,
    correct[0].labelRef,
    distractors[0].explanationRef,
    options[0].labelRef,
    options[1].labelRef,
    correct[0].explanationRef,
    distractors[1].explanationRef
  );
  const expandedOptions = options.map(({ option }) => [
    option[0],
    option[1],
    option[2],
    option[3],
    option[4],
    option[5],
    option[6],
    option[7]
  ] as AcademyLessonV2DiagramOptionPlan);
  if (kind === "diagram") {
    const relationIds = requireArray(
      record.relationIds,
      `${path}.relationIds`
    ).map((relationId, index) =>
      requireString(relationId, `${path}.relationIds[${index}]`)
    );
    const answerRelationIds = requireArray(
      record.answerRelationIds,
      `${path}.answerRelationIds`
    ).map((relationId, index) =>
      requireString(relationId, `${path}.answerRelationIds[${index}]`)
    );
    if (
      relationIds.length < 2
      || new Set(relationIds).size !== relationIds.length
      || answerRelationIds.length === 0
      || new Set(answerRelationIds).size !== answerRelationIds.length
      || answerRelationIds.some((relationId) =>
        !relationIds.includes(relationId)
      )
    ) {
      return fail(
        "v2-authoring-relation-set",
        path,
        "Diagram relation and answer sets must be unique, non-empty where required and explicitly nested."
      );
    }
    return {
      kind,
      instruction: record.instruction as AcademyLessonV2InstructionPlan,
      copy,
      contextConditionIds: record.contextConditionIds as readonly string[],
      positions: record.positions as readonly AcademyDiagramPositionTuple[],
      relationIds,
      answerRelationIds,
      options: expandedOptions,
      textEquivalentRefs: relationIds.map((relationId) =>
        academyLessonV2TextRef.relation(relationId)
      ),
      textEquivalent: diagramTextEquivalent(
        input,
        record.positions,
        relationIds,
        answerRelationIds,
        record.contextConditionIds,
        path
      )
    };
  }
  if (kind !== "code-analysis") {
    return fail(
      "v2-authoring-shape",
      `${path}.kind`,
      `Unsupported compact Q5 kind "${kind}".`
    );
  }
  return {
    kind,
    instruction: record.instruction as AcademyLessonV2InstructionPlan,
    copy,
    contextConditionIds: record.contextConditionIds as readonly string[],
    language: requireString(record.language, `${path}.language`),
    code: requireString(record.code, `${path}.code`),
    options: expandedOptions
  };
};

const explicitStringArray = (
  value: unknown,
  path: string
): string[] => requireArray(value, path).map((entry, index) =>
  requireString(entry, `${path}[${index}]`)
);

const assertUniqueStrings = (
  values: readonly string[],
  path: string
) => {
  if (new Set(values).size !== values.length) {
    fail(
      "v2-authoring-explorer-integrity",
      path,
      "Explorer identifiers must be unique."
    );
  }
};

const assertSubset = (
  values: readonly string[],
  allowed: ReadonlySet<string>,
  path: string
) => {
  const outside = values.find((value) => !allowed.has(value));
  if (outside !== undefined) {
    fail(
      "v2-authoring-explorer-integrity",
      path,
      `Explorer reference "${outside}" is outside its declared visible set.`
    );
  }
};

const assertPairwiseDisjoint = (
  groups: readonly (readonly string[])[],
  path: string
) => {
  const seen = new Set<string>();
  groups.forEach((group) => {
    group.forEach((value) => {
      if (seen.has(value)) {
        fail(
          "v2-authoring-explorer-integrity",
          path,
          `Explorer state sets overlap at "${value}".`
        );
      }
      seen.add(value);
    });
  });
};

const assertUniquePositions = (
  value: unknown,
  path: string
) => {
  const positions = requireArray(value, path);
  const entityIds: string[] = [];
  const coordinateKeys: string[] = [];
  positions.forEach((positionValue, index) => {
    const position = requireTuple(positionValue, 3, `${path}[${index}]`);
    entityIds.push(requireString(position[0], `${path}[${index}][0]`));
    if (
      typeof position[1] !== "number"
      || !Number.isFinite(position[1])
      || typeof position[2] !== "number"
      || !Number.isFinite(position[2])
    ) {
      fail(
        "v2-authoring-explorer-integrity",
        `${path}[${index}]`,
        "Explorer coordinates must be finite numbers."
      );
    }
    coordinateKeys.push(`${position[1]}:${position[2]}`);
  });
  assertUniqueStrings(entityIds, path);
  if (new Set(coordinateKeys).size !== coordinateKeys.length) {
    fail(
      "v2-authoring-explorer-integrity",
      path,
      "Explorer positions must not overlap."
    );
  }
};

const assertGraphStateIntegrity = (
  stateValue: unknown,
  path: string
) => {
  const state = requireRecord(stateValue, path);
  assertUniquePositions(state.positions, `${path}.positions`);
  const positionedEntityIds = new Set(
    requireArray(state.positions, `${path}.positions`).map(
      (position, index) =>
        requireString(
          requireTuple(position, 3, `${path}.positions[${index}]`)[0],
          `${path}.positions[${index}][0]`
        )
    )
  );
  const visibleEntityIds = explicitStringArray(
    state.visibleEntityIds,
    `${path}.visibleEntityIds`
  );
  const visibleRelationIds = explicitStringArray(
    state.visibleRelationIds,
    `${path}.visibleRelationIds`
  );
  const activeEntityIds = explicitStringArray(
    state.activeEntityIds,
    `${path}.activeEntityIds`
  );
  const activeRelationIds = explicitStringArray(
    state.activeRelationIds,
    `${path}.activeRelationIds`
  );
  const suppressedRelationIds = explicitStringArray(
    state.suppressedRelationIds,
    `${path}.suppressedRelationIds`
  );
  const reversedRelationIds = explicitStringArray(
    state.reversedRelationIds,
    `${path}.reversedRelationIds`
  );
  [
    visibleEntityIds,
    visibleRelationIds,
    activeEntityIds,
    activeRelationIds,
    suppressedRelationIds,
    reversedRelationIds
  ].forEach((values, index) =>
    assertUniqueStrings(values, `${path}.sets[${index}]`)
  );
  const visibleEntitySet = new Set(visibleEntityIds);
  const visibleRelationSet = new Set(visibleRelationIds);
  assertSubset([...positionedEntityIds], visibleEntitySet, `${path}.positions`);
  assertSubset(activeEntityIds, visibleEntitySet, `${path}.activeEntityIds`);
  assertSubset(
    activeRelationIds,
    visibleRelationSet,
    `${path}.activeRelationIds`
  );
  assertSubset(
    suppressedRelationIds,
    visibleRelationSet,
    `${path}.suppressedRelationIds`
  );
  assertSubset(
    reversedRelationIds,
    visibleRelationSet,
    `${path}.reversedRelationIds`
  );
  assertPairwiseDisjoint(
    [activeRelationIds, suppressedRelationIds, reversedRelationIds],
    `${path}.relationStateSets`
  );
};

const assertExplicitExplorerStateIntegrity = (
  stateValue: unknown,
  path: string
) => {
  const state = requireRecord(stateValue, path);
  const kind = requireString(state.kind, `${path}.kind`);
  if (kind === "causal-graph" || kind === "state-graph") {
    assertGraphStateIntegrity(state, path);
    return;
  }
  if (kind === "comparison-matrix") {
    const rows = explicitStringArray(state.rowEntityIds, `${path}.rowEntityIds`);
    const columns = explicitStringArray(
      state.columnConditionIds,
      `${path}.columnConditionIds`
    );
    assertUniqueStrings(rows, `${path}.rowEntityIds`);
    assertUniqueStrings(columns, `${path}.columnConditionIds`);
    const expected = new Set(
      rows.flatMap((entityId) =>
        columns.map((conditionId) => `${entityId}\u0000${conditionId}`)
      )
    );
    const actualKeys = requireArray(state.cells, `${path}.cells`).map(
      (cellValue, index) => {
        const cell = requireTuple(cellValue, 4, `${path}.cells[${index}]`);
        return `${requireString(
          cell[0],
          `${path}.cells[${index}][0]`
        )}\u0000${requireString(
          cell[1],
          `${path}.cells[${index}][1]`
        )}`;
      }
    );
    if (
      new Set(actualKeys).size !== actualKeys.length
      || actualKeys.length !== expected.size
      || actualKeys.some((key) => !expected.has(key))
    ) {
      fail(
        "v2-authoring-explorer-integrity",
        `${path}.cells`,
        "Comparison matrix requires exactly one cell for every row-condition pair."
      );
    }
    return;
  }
  if (kind === "parameter-sweep") {
    const axes = requireTuple(state.axes, 2, `${path}.axes`);
    const axisIds = axes.map((axis, index) =>
      requireString(
        requireTuple(axis, 4, `${path}.axes[${index}]`)[0],
        `${path}.axes[${index}][0]`
      )
    );
    assertUniqueStrings(axisIds, `${path}.axes`);
    const pointCoordinates: string[] = [];
    const pointIds = requireArray(state.points, `${path}.points`).map(
      (point, index) => {
        const pointTuple = requireTuple(
          point,
          5,
          `${path}.points[${index}]`
        );
        if (
          typeof pointTuple[1] !== "number"
          || !Number.isFinite(pointTuple[1])
          || typeof pointTuple[2] !== "number"
          || !Number.isFinite(pointTuple[2])
        ) {
          return fail(
            "v2-authoring-explorer-integrity",
            `${path}.points[${index}]`,
            "Parameter points require finite coordinates."
          );
        }
        pointCoordinates.push(`${pointTuple[1]}:${pointTuple[2]}`);
        return requireString(
          pointTuple[0],
          `${path}.points[${index}][0]`
        );
      }
    );
    assertUniqueStrings(pointIds, `${path}.points`);
    if (
      pointIds.length < 3
      || new Set(pointCoordinates).size !== pointCoordinates.length
    ) {
      fail(
        "v2-authoring-explorer-integrity",
        `${path}.points`,
        "Parameter sweeps require at least three distinct non-overlapping points."
      );
    }
    return;
  }
  if (kind === "geometry-transform") {
    const pointCoordinates: string[] = [];
    const pointIds = requireArray(state.points, `${path}.points`).map(
      (point, index) => {
        const pointTuple = requireTuple(
          point,
          5,
          `${path}.points[${index}]`
        );
        if (
          typeof pointTuple[2] !== "number"
          || !Number.isFinite(pointTuple[2])
          || typeof pointTuple[3] !== "number"
          || !Number.isFinite(pointTuple[3])
        ) {
          return fail(
            "v2-authoring-explorer-integrity",
            `${path}.points[${index}]`,
            "Geometry points require finite coordinates."
          );
        }
        pointCoordinates.push(`${pointTuple[2]}:${pointTuple[3]}`);
        return requireString(
          pointTuple[0],
          `${path}.points[${index}][0]`
        );
      }
    );
    assertUniqueStrings(pointIds, `${path}.points`);
    if (new Set(pointCoordinates).size !== pointCoordinates.length) {
      fail(
        "v2-authoring-explorer-integrity",
        `${path}.points`,
        "Geometry points must not overlap."
      );
    }
    const segmentEndpointKeys: string[] = [];
    const segmentIds = requireArray(state.segments, `${path}.segments`).map(
      (segment, index) => {
        const segmentTuple = requireTuple(
          segment,
          4,
          `${path}.segments[${index}]`
        );
        const fromPointId = requireString(
          segmentTuple[1],
          `${path}.segments[${index}][1]`
        );
        const toPointId = requireString(
          segmentTuple[2],
          `${path}.segments[${index}][2]`
        );
        if (fromPointId === toPointId) {
          return fail(
            "v2-authoring-explorer-integrity",
            `${path}.segments[${index}]`,
            "Geometry segments require two distinct endpoints."
          );
        }
        segmentEndpointKeys.push(
          [fromPointId, toPointId].sort().join("\u0000")
        );
        return requireString(
          segmentTuple[0],
          `${path}.segments[${index}][0]`
        );
      }
    );
    assertUniqueStrings(segmentIds, `${path}.segments`);
    if (
      new Set(segmentEndpointKeys).size !== segmentEndpointKeys.length
    ) {
      fail(
        "v2-authoring-explorer-integrity",
        `${path}.segments`,
        "Geometry segments must not overlap the same endpoint pair."
      );
    }
    return;
  }
  fail(
    "v2-authoring-explorer-integrity",
    `${path}.kind`,
    `Unsupported explorer state kind "${kind}".`
  );
};

const assertChangedConditionsAffectState = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  changedConditionIds: readonly string[],
  state: AcademyExplorerStateSeed,
  path: string
) => {
  const stateEntityIds = new Set<string>();
  const stateRelationIds = new Set<string>();
  const stateConditionIds = new Set<string>();
  if (state.kind === "causal-graph" || state.kind === "state-graph") {
    state.activeEntityIds.forEach((id) => stateEntityIds.add(id));
    [
      ...state.activeRelationIds,
      ...state.suppressedRelationIds,
      ...state.reversedRelationIds
    ].forEach((id) => stateRelationIds.add(id));
  } else if (state.kind === "comparison-matrix") {
    state.rowEntityIds.forEach((id) => stateEntityIds.add(id));
    state.columnConditionIds.forEach((id) => stateConditionIds.add(id));
  } else if (state.kind === "parameter-sweep") {
    state.axes.forEach((axis) => stateEntityIds.add(axis[3]));
    state.points.forEach((point) =>
      point[4].forEach((id) => stateConditionIds.add(id))
    );
  } else if (state.kind === "geometry-transform") {
    stateEntityIds.add(state.frameEntityId);
    state.points.forEach((point) => stateEntityIds.add(point[4]));
    state.segments.forEach((segment) => stateRelationIds.add(segment[3]));
  } else {
    fail(
      "v2-authoring-explorer-integrity",
      path,
      "Unsupported explorer state kind."
    );
  }
  changedConditionIds.forEach((conditionId, index) => {
    const conditionValue = input.conditions.find(
      (candidate) => candidate[0] === conditionId
    );
    if (conditionValue === undefined) {
      return fail(
        "v2-authoring-reference",
        `${path}.changedConditionIds[${index}]`,
        `Unknown explorer condition "${conditionId}".`
      );
    }
    const affectsState = (
      stateConditionIds.has(conditionId)
      || conditionValue[3].some((entityId) => stateEntityIds.has(entityId))
      || conditionValue[4].some((relationId) =>
        stateRelationIds.has(relationId)
      )
    );
    if (!affectsState) {
      fail(
        "v2-authoring-explorer-integrity",
        `${path}.changedConditionIds[${index}]`,
        `Changed condition "${conditionId}" does not affect the rendered explorer state.`
      );
    }
  });
};

const compactExplorer = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  plan: AcademyLessonV2CompactExplorerPlan
): AcademyLessonV2ExplorerPlan => {
  const record = requireRecord(plan, "input.explorerPlan");
  const kind = requireString(record.kind, "input.explorerPlan.kind");
  const focusRef = record.focusRef as AcademyLessonV2AuthoredTextRef;
  if (kind === "shared-graph") {
    const positions = record.positions as readonly AcademyDiagramPositionTuple[];
    assertUniquePositions(positions, "input.explorerPlan.positions");
    const visibleEntityIds = explicitStringArray(
      record.visibleEntityIds,
      "input.explorerPlan.visibleEntityIds"
    );
    const visibleRelationIds = explicitStringArray(
      record.visibleRelationIds,
      "input.explorerPlan.visibleRelationIds"
    );
    assertUniqueStrings(
      visibleEntityIds,
      "input.explorerPlan.visibleEntityIds"
    );
    assertUniqueStrings(
      visibleRelationIds,
      "input.explorerPlan.visibleRelationIds"
    );
    const modelKindValue = requireString(
      record.modelKind,
      "input.explorerPlan.modelKind"
    );
    if (modelKindValue !== "causal-graph" && modelKindValue !== "state-graph") {
      return fail(
        "v2-authoring-explorer-integrity",
        "input.explorerPlan.modelKind",
        "Shared graph explorer requires causal-graph or state-graph."
      );
    }
    const modelKind = modelKindValue;
    return {
      titleRef: record.titleRef as AcademyLessonV2AuthoredTextRef,
      descriptionRefs: [focusRef],
      modelKind,
      controls: requireArray(
        record.controls,
        "input.explorerPlan.controls"
      ).map((controlValue, index) => {
        const path = `input.explorerPlan.controls[${index}]`;
        const control = requireTuple(controlValue, 9, path);
        const changedConditionIds = explicitStringArray(
          control[2],
          `${path}[2]`
        );
        assertUniqueStrings(changedConditionIds, `${path}[2]`);
        const activeEntityIds = explicitStringArray(control[3], `${path}[3]`);
        const activeRelationIds = explicitStringArray(
          control[4],
          `${path}[4]`
        );
        const suppressedRelationIds = explicitStringArray(
          control[5],
          `${path}[5]`
        );
        const reversedRelationIds = explicitStringArray(
          control[6],
          `${path}[6]`
        );
        const actionRelationId = firstString(
          activeRelationIds,
          `${path}[4]`
        );
        const changedConditionId = firstString(
          changedConditionIds,
          `${path}[2]`
        );
        const textRelationIds = [
          ...activeRelationIds,
          ...suppressedRelationIds,
          ...reversedRelationIds
        ];
        firstString(textRelationIds, `${path}.textRelationIds`);
        const state: AcademyExplorerStateSeed = {
          kind: modelKind,
          positions,
          visibleEntityIds,
          visibleRelationIds,
          activeEntityIds,
          activeRelationIds,
          suppressedRelationIds,
          reversedRelationIds,
          annotations: control[7] as readonly AcademyExplorerAnnotationTuple[]
        };
        assertGraphStateIntegrity(state, `${path}.state`);
        assertChangedConditionsAffectState(
          input,
          changedConditionIds,
          state,
          path
        );
        return {
          id: requireString(control[0], `${path}[0]`),
          labelRef: control[1] as AcademyLessonV2AuthoredTextRef,
          changedConditionIds,
          state,
          outcomeRefs: [
            focusRef,
            control[1] as AcademyLessonV2AuthoredTextRef
          ],
          requiredActionRefs: [
            academyLessonV2TextRef.relation(actionRelationId),
            academyLessonV2TextRef.condition(changedConditionId)
          ],
          retainedEvidenceRefs: [
            control[8] as AcademyLessonV2AuthoredTextRef
          ],
          textEquivalentRefs: textRelationIds.map((relationId) =>
            academyLessonV2TextRef.relation(relationId)
          ),
          textEquivalent: explorerStateTextEquivalent(
            input,
            state,
            `${path}.state`
          )
        };
      })
    };
  }
  if (kind !== "explicit-states") {
    return fail(
      "v2-authoring-shape",
      "input.explorerPlan.kind",
      `Unsupported compact explorer kind "${kind}".`
    );
  }
  return {
    titleRef: record.titleRef as AcademyLessonV2AuthoredTextRef,
    descriptionRefs: [focusRef],
    modelKind: record.modelKind as AcademyExplorerStateSeed["kind"],
    controls: requireArray(
      record.controls,
      "input.explorerPlan.controls"
    ).map((controlValue, index) => {
      const path = `input.explorerPlan.controls[${index}]`;
      const control = requireTuple(controlValue, 6, path);
      const changedConditionIds = explicitStringArray(control[2], `${path}[2]`);
      assertUniqueStrings(changedConditionIds, `${path}[2]`);
      const changedConditionId = firstString(
        changedConditionIds,
        `${path}[2]`
      );
      const state = control[3] as AcademyExplorerStateSeed;
      assertExplicitExplorerStateIntegrity(state, `${path}.state`);
      assertChangedConditionsAffectState(
        input,
        changedConditionIds,
        state,
        path
      );
      return {
        id: requireString(control[0], `${path}[0]`),
        labelRef: control[1] as AcademyLessonV2AuthoredTextRef,
        changedConditionIds,
        state,
        outcomeRefs: [focusRef, control[1] as AcademyLessonV2AuthoredTextRef],
        requiredActionRefs: [
          academyLessonV2TextRef.condition(changedConditionId)
        ],
        retainedEvidenceRefs: [
          control[4] as AcademyLessonV2AuthoredTextRef
        ],
        textEquivalentRefs:
          control[5] as readonly AcademyLessonV2AuthoredTextRef[],
        textEquivalent: explorerStateTextEquivalent(
          input,
          state,
          `${path}.state`
        )
      };
    })
  };
};

const normaliseInstructionText = (value: string): string =>
  value
    .toLocaleLowerCase("en-AU")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");

const normalisedContains = (
  container: string,
  phrase: string
): boolean => {
  const normalisedPhrase = normaliseInstructionText(phrase);
  return (
    normalisedPhrase.length > 0
    && normaliseInstructionText(container).includes(normalisedPhrase)
  );
};

const validateReasonedCaseEvidence = (
  input: AcademyLessonTeachingProfileV2CompactPlan
) => {
  const examples = input.reasonedCases.filter(
    (reasonedCase) => reasonedCase.kind === "example"
  );
  const counterexamples = input.reasonedCases.filter(
    (reasonedCase) => reasonedCase.kind === "counterexample"
  );
  const renderedSignature = (
    reasonedCase: AcademyLessonTeachingProfileV2CompactPlan[
      "reasonedCases"
    ][number]
  ) => normaliseInstructionText([
    reasonedCase.scenario,
    ...reasonedCase.givens.flatMap((given) => [given[1], given[2]]),
    ...reasonedCase.reasoningSteps.map((step) => step[1]),
    reasonedCase.outcome,
    reasonedCase.criterion,
    reasonedCase.verification
  ].join(" "));
  counterexamples.forEach((counterexample, index) => {
    const path = `input.reasonedCases[counterexample:${index}]`;
    const changedConditionIds = [...counterexample.changedConditionIds];
    if (
      changedConditionIds.length === 0
      || new Set(changedConditionIds).size !== changedConditionIds.length
      || examples.some((example) =>
        JSON.stringify([...example.changedConditionIds].sort())
          === JSON.stringify([...changedConditionIds].sort())
      )
    ) {
      fail(
        "v2-authoring-reasoned-case",
        `${path}.changedConditionIds`,
        "A counterexample requires a unique changed-condition set that differs from the example."
      );
    }
    const reasoningConditionIds = new Set(
      counterexample.reasoningSteps.flatMap((step) => step[4])
    );
    const missingReasoningCondition = changedConditionIds.find(
      (conditionId) => !reasoningConditionIds.has(conditionId)
    );
    if (missingReasoningCondition !== undefined) {
      fail(
        "v2-authoring-reasoned-case",
        `${path}.reasoningSteps`,
        `Changed condition "${missingReasoningCondition}" must appear in counterexample reasoning.`
      );
    }
    const counterexampleRenderedSignature =
      renderedSignature(counterexample);
    if (
      counterexampleRenderedSignature.length === 0
      || examples.some((example) =>
        renderedSignature(example) === counterexampleRenderedSignature
      )
    ) {
      fail(
        "v2-authoring-reasoned-case",
        path,
        "A counterexample must render substantively different content from the example."
      );
    }
  });
};

const shortResponseSatisfiesContract = (
  scenario: Extract<AcademyQ4ScenarioSeed, { kind: "short-response" }>,
  response: string,
  seed: AcademyLessonTeachingProfileV2Seed,
  requireEveryConceptGroup: boolean
): boolean => {
  const matchedConceptGroups = scenario.conceptGroups.filter((group) =>
    group[2].some((phrase) => normalisedContains(response, phrase))
  );
  const requiredConceptCount = requireEveryConceptGroup
    ? scenario.conceptGroups.length
    : scenario.minimumConceptGroups;
  const relationsMatched = scenario.requiredRelationIds.every((relationId) => {
    const predicate = seed.relations.find(
      (relationValue) => relationValue[0] === relationId
    )?.[4];
    return predicate !== undefined && normalisedContains(response, predicate);
  });
  const criterion = seed.conditions.find(
    (conditionValue) =>
      conditionValue[0] === scenario.criterionConditionId
  )?.[2];
  return (
    matchedConceptGroups.length >= requiredConceptCount
    && relationsMatched
    && criterion !== undefined
    && normalisedContains(response, criterion)
  );
};

const validateQ4Integrity = (
  seed: AcademyLessonTeachingProfileV2Seed
) => {
  (["base", "retry"] as const).forEach((mode) => {
    const scenario = seed.assessments.q4[mode];
    if (scenario.kind !== "short-response") return;
    const phrases: Array<{
      conceptId: string;
      normalised: string;
    }> = [];
    scenario.conceptGroups.forEach((group) => {
      group[2].forEach((phrase) => {
        const normalised = normaliseInstructionText(phrase);
        const overlap = phrases.find((candidate) =>
          candidate.normalised === normalised
          || (
            candidate.conceptId !== group[0]
            && (
              candidate.normalised.includes(normalised)
              || normalised.includes(candidate.normalised)
            )
          )
        );
        if (normalised.length === 0 || overlap !== undefined) {
          fail(
            "v2-authoring-q4-integrity",
            `seed.assessments.q4.${mode}.conceptGroups`,
            "Short-Q4 accepted phrases must be non-empty and disjoint between concept groups."
          );
        }
        phrases.push({ conceptId: group[0], normalised });
      });
    });
    if (
      !shortResponseSatisfiesContract(
        scenario,
        scenario.exemplarResponse,
        seed,
        true
      )
    ) {
      fail(
        "v2-authoring-q4-integrity",
        `seed.assessments.q4.${mode}.exemplarResponse`,
        "The short-Q4 exemplar must satisfy every concept group, required relation and criterion."
      );
    }
  });
};

const validateNoAnswerLeakage = (
  seed: AcademyLessonTeachingProfileV2Seed
) => {
  (["base", "retry"] as const).forEach((mode) => {
    const q2 = seed.assessments.q2[mode];
    const orderedStepLabels = q2.correctOrder.map((stepId) =>
      q2.steps.find((step) => step[0] === stepId)?.[1] ?? ""
    );
    let q2Cursor = 0;
    const q2Prompt = normaliseInstructionText(q2.prompt);
    const q2Leaks = orderedStepLabels.length > 0
      && orderedStepLabels.every((label) => {
        const normalisedLabel = normaliseInstructionText(label);
        const matchIndex = q2Prompt.indexOf(normalisedLabel, q2Cursor);
        if (normalisedLabel.length === 0 || matchIndex < 0) return false;
        q2Cursor = matchIndex + normalisedLabel.length;
        return true;
      });

    const q3 = seed.assessments.q3[mode];
    const q3Leaks = q3.options
      .filter((option) => option[2])
      .some((option) => normalisedContains(q3.prompt, option[1]));

    const q4 = seed.assessments.q4[mode];
    const q4Leaks = q4.kind === "short-response"
      ? shortResponseSatisfiesContract(q4, q4.prompt, seed, false)
      : q4.pairs.every((pair) =>
          normalisedContains(q4.prompt, pair[1])
          && normalisedContains(q4.prompt, pair[2])
        );

    const q5 = seed.assessments.q5[mode];
    const q5Leaks = q5.options
      .filter((option) => option[2])
      .some((option) => normalisedContains(q5.prompt, option[1]));

    const leakingQuestion = [
      ["q2", q2Leaks],
      ["q3", q3Leaks],
      ["q4", q4Leaks],
      ["q5", q5Leaks]
    ].find(([, leaks]) => leaks);
    if (leakingQuestion !== undefined) {
      fail(
        "v2-authoring-answer-leakage",
        `seed.assessments.${leakingQuestion[0]}.${mode}.prompt`,
        "The question prompt contains enough rendered answer content to reveal the correct response."
      );
    }
  });
};

const lessonDomainTokens = (
  input: AcademyLessonTeachingProfileV2CompactPlan
): ReadonlySet<string> => {
  const ignored = new Set([
    "about",
    "answer",
    "boundary",
    "check",
    "concept",
    "correct",
    "decision",
    "evidence",
    "explain",
    "lesson",
    "model",
    "question",
    "relation",
    "select",
    "solution",
    "state",
    "step",
    "system",
    "under",
    "with"
  ]);
  const sourceText = [
    ...input.terms.map((termTuple) => termTuple[1]),
    ...input.entities.map((entityTuple) => entityTuple[2])
  ].join(" ");
  return new Set(
    normaliseInstructionText(sourceText)
      .split(" ")
      .filter((token) => token.length >= 4 && !ignored.has(token))
  );
};

const instructionTemplateSignature = (
  copyParts: readonly string[],
  domainTokens: ReadonlySet<string>
): string => JSON.stringify(copyParts.map((part) =>
  normaliseInstructionText(part)
    .split(" ")
    .filter((token) => !domainTokens.has(token))
    .join(" ")
));

const validateInstructionPlans = (
  input: AcademyLessonTeachingProfileV2CompactPlan
) => {
  const scenarios: Array<[path: string, value: unknown]> = [
    ["input.assessmentPlans.q2.base", input.assessmentPlans.q2.base],
    ["input.assessmentPlans.q2.retry", input.assessmentPlans.q2.retry],
    ["input.assessmentPlans.q3.base", input.assessmentPlans.q3.base],
    ["input.assessmentPlans.q3.retry", input.assessmentPlans.q3.retry],
    ["input.assessmentPlans.q4.base", input.assessmentPlans.q4.base],
    ["input.assessmentPlans.q4.retry", input.assessmentPlans.q4.retry],
    ["input.assessmentPlans.q5.base", input.assessmentPlans.q5.base],
    ["input.assessmentPlans.q5.retry", input.assessmentPlans.q5.retry]
  ];
  const domainTokens = lessonDomainTokens(input);
  if (domainTokens.size === 0) {
    return fail(
      "v2-authoring-instruction",
      "input",
      "Lesson terms and entities do not provide a domain token for instruction copy."
    );
  }
  const promptLeads = new Set<string>();
  const instructionSignatures = new Set<string>();
  const instructionTemplateSignatures = new Set<string>();
  scenarios.forEach(([path, scenario]) => {
    const record = requireRecord(scenario, path);
    const instruction = requireTuple(
      record.instruction,
      5,
      `${path}.instruction`
    );
    const promptLead = requireString(
      instruction[0],
      `${path}.instruction[0]`
    );
    const feedbackCorrect = requireString(
      instruction[1],
      `${path}.instruction[1]`
    );
    const feedbackIncorrect = requireString(
      instruction[2],
      `${path}.instruction[2]`
    );
    const hints = explicitStringArray(
      instruction[3],
      `${path}.instruction[3]`
    );
    const solution = explicitStringArray(
      instruction[4],
      `${path}.instruction[4]`
    );
    if (hints.length < 2 || solution.length < 2) {
      fail(
        "v2-authoring-instruction",
        `${path}.instruction`,
        "Every scenario requires two authored hints and two authored solution steps."
      );
    }
    const copyParts = [
      promptLead,
      feedbackCorrect,
      feedbackIncorrect,
      ...hints,
      ...solution
    ];
    const scenarioDomainTokens = new Set<string>();
    copyParts.forEach((part, partIndex) => {
      const tokens = new Set(normaliseInstructionText(part).split(" "));
      const matchedDomainTokens = [...domainTokens].filter((token) =>
        tokens.has(token)
      );
      if (matchedDomainTokens.length === 0) {
        fail(
          "v2-authoring-instruction",
          `${path}.instruction.copy[${partIndex}]`,
          "Every authored instruction sentence must contain a lesson-domain term or entity token."
        );
      }
      matchedDomainTokens.forEach((token) => scenarioDomainTokens.add(token));
    });
    if (scenarioDomainTokens.size < 3) {
      fail(
        "v2-authoring-instruction",
        `${path}.instruction`,
        "Every scenario must use at least three distinct lesson-domain tokens across its authored copy."
      );
    }
    const normalisedPromptLead = normaliseInstructionText(promptLead);
    if (promptLeads.has(normalisedPromptLead)) {
      fail(
        "v2-authoring-semantic-duplicate",
        `${path}.instruction[0]`,
        "Question leads must be unique within the lesson."
      );
    }
    promptLeads.add(normalisedPromptLead);
    const signature = JSON.stringify(
      copyParts.map(normaliseInstructionText)
    );
    if (instructionSignatures.has(signature)) {
      fail(
        "v2-authoring-semantic-duplicate",
        `${path}.instruction`,
        "Instruction copy duplicates another scenario after punctuation normalisation."
      );
    }
    instructionSignatures.add(signature);
    const templateSignature = instructionTemplateSignature(
      copyParts,
      domainTokens
    );
    if (instructionTemplateSignatures.has(templateSignature)) {
      fail(
        "v2-authoring-instruction",
        `${path}.instruction`,
        "Instruction copy repeats a noun-swapped template used by another scenario."
      );
    }
    instructionTemplateSignatures.add(templateSignature);
  });
};

const registryInstructionTemplateEntries = (
  input: AcademyLessonTeachingProfileV2CompactPlan
): Array<{ path: string; signature: string }> => {
  const domainTokens = lessonDomainTokens(input);
  const scenarios = [
    ["q2.base", input.assessmentPlans.q2.base],
    ["q2.retry", input.assessmentPlans.q2.retry],
    ["q3.base", input.assessmentPlans.q3.base],
    ["q3.retry", input.assessmentPlans.q3.retry],
    ["q4.base", input.assessmentPlans.q4.base],
    ["q4.retry", input.assessmentPlans.q4.retry],
    ["q5.base", input.assessmentPlans.q5.base],
    ["q5.retry", input.assessmentPlans.q5.retry]
  ] as const;
  return scenarios.map(([path, scenario]) => {
    const instruction = scenario.instruction;
    return {
      path,
      signature: instructionTemplateSignature(
        [
          instruction[0],
          instruction[1],
          instruction[2],
          ...instruction[3],
          ...instruction[4]
        ],
        domainTokens
      )
    };
  });
};

const canonicalDomainMaps = (
  input: AcademyLessonTeachingProfileV2CompactPlan
) => ({
  entities: new Map(
    input.entities.map((entity, index) => [
      entity[0],
      `e${index}:${entity[1]}`
    ])
  ),
  relations: new Map(
    input.relations.map((relationValue, index) => [
      relationValue[0],
      `r${index}:${relationValue[1]}:${relationValue[5]}:${relationValue[6]}`
    ])
  ),
  conditions: new Map(
    input.conditions.map((conditionValue, index) => [
      conditionValue[0],
      `c${index}:${conditionValue[1]}`
    ])
  ),
  terms: new Map(
    input.terms.map((termValue, index) => [termValue[0], `t${index}`])
  ),
  cases: new Map(
    input.reasonedCases.map((caseValue, index) => [caseValue.id, `k${index}`])
  )
});

const canonicalTextReference = (
  referenceValue: unknown,
  maps: ReturnType<typeof canonicalDomainMaps>,
  path: string
): string => {
  const reference = requireTuple(referenceValue, 3, path);
  const source = requireString(reference[0], `${path}[0]`);
  const sourceId = requireString(reference[1], `${path}[1]`);
  const field = requireString(reference[2], `${path}[2]`);
  const canonicalId = source === "term"
    ? maps.terms.get(sourceId)
    : source === "relation"
      ? maps.relations.get(sourceId)
      : source === "condition"
        ? maps.conditions.get(sourceId)
        : source === "case"
          ? maps.cases.get(sourceId)
          : source === "misconception"
            ? "misconception"
            : undefined;
  if (!canonicalId) {
    return fail(
      "v2-authoring-reference",
      path,
      `Cannot canonicalise text reference "${source}:${sourceId}".`
    );
  }
  return `${source}:${canonicalId}:${field}`;
};

const canonicalIds = (
  value: unknown,
  map: ReadonlyMap<string, string>,
  path: string
): string[] => explicitStringArray(value, path).map((id, index) => {
  const canonical = map.get(id);
  if (!canonical) {
    return fail(
      "v2-authoring-reference",
      `${path}[${index}]`,
      `Unknown canonical reference "${id}".`
    );
  }
  return canonical;
});

const sortCanonicalValues = <Value>(
  values: readonly Value[]
): Value[] => [...values].sort((left, right) => {
  const leftKey = JSON.stringify(left);
  const rightKey = JSON.stringify(right);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
});

const canonicalIdSet = (
  value: unknown,
  map: ReadonlyMap<string, string>,
  path: string
): string[] => canonicalIds(value, map, path).sort();

const compactScenarioSignature = (
  input: AcademyLessonTeachingProfileV2CompactPlan,
  question: "q2" | "q3" | "q4" | "q5",
  scenarioValue: unknown,
  path: string
): string => {
  const maps = canonicalDomainMaps(input);
  const scenario = requireRecord(scenarioValue, path);
  canonicalTextReference(
    scenario.focusRef,
    maps,
    `${path}.focusRef`
  );
  const context = canonicalIdSet(
    scenario.contextConditionIds,
    maps.conditions,
    `${path}.contextConditionIds`
  );
  if (question === "q2") {
    const stepValues = requireArray(scenario.steps, `${path}.steps`);
    const stepsById = new Map<string, {
      relations: string[];
      conditions: string[];
    }>();
    stepValues.forEach((stepValue, index) => {
      const step = requireTuple(stepValue, 3, `${path}.steps[${index}]`);
      const stepId = requireString(
        step[0],
        `${path}.steps[${index}][0]`
      );
      if (stepsById.has(stepId)) {
        fail(
          "v2-authoring-shape",
          `${path}.steps[${index}][0]`,
          `Duplicate ordering step ID "${stepId}".`
        );
      }
      stepsById.set(stepId, {
        relations: canonicalIdSet(
          step[1],
          maps.relations,
          `${path}.steps[${index}][1]`
        ),
        conditions: canonicalIdSet(
          step[2],
          maps.conditions,
          `${path}.steps[${index}][2]`
        )
      });
    });
    const orderedSteps = explicitStringArray(
      scenario.correctOrder,
      `${path}.correctOrder`
    ).map((stepId, index) => {
      const step = stepsById.get(stepId);
      if (step === undefined) {
        return fail(
          "v2-authoring-reference",
          `${path}.correctOrder[${index}]`,
          `Unknown ordering step ID "${stepId}".`
        );
      }
      return step;
    });
    return JSON.stringify({ context, orderedSteps });
  }
  if (question === "q3") {
    const options = sortCanonicalValues(
      requireArray(scenario.options, `${path}.options`).map(
        (optionValue, index) => {
        const option = requireTuple(
          optionValue,
          7,
          `${path}.options[${index}]`
        );
        return {
          correct: option[1],
          label: canonicalTextReference(
            option[2],
            maps,
            `${path}.options[${index}][2]`
          ),
          explanation: canonicalTextReference(
            option[3],
            maps,
            `${path}.options[${index}][3]`
          ),
          relations: canonicalIdSet(
            option[4],
            maps.relations,
            `${path}.options[${index}][4]`
          ),
          conditions: canonicalIdSet(
            option[5],
            maps.conditions,
            `${path}.options[${index}][5]`
          ),
          misconception: option[6] !== null
        };
      }
      )
    );
    return JSON.stringify({ context, options });
  }
  const kind = requireString(scenario.kind, `${path}.kind`);
  if (question === "q4") {
    if (kind === "matching") {
      const pairs = sortCanonicalValues(
        requireArray(scenario.pairs, `${path}.pairs`).map(
          (pairValue, index) => {
          const pair = requireTuple(
            pairValue,
            6,
            `${path}.pairs[${index}]`
          );
          return {
            left: canonicalTextReference(
              pair[1],
              maps,
              `${path}.pairs[${index}][1]`
            ),
            right: canonicalTextReference(
              pair[2],
              maps,
              `${path}.pairs[${index}][2]`
            ),
            explanation: canonicalTextReference(
              pair[3],
              maps,
              `${path}.pairs[${index}][3]`
            ),
            relations: canonicalIdSet(
              pair[4],
              maps.relations,
              `${path}.pairs[${index}][4]`
            ),
            conditions: canonicalIdSet(
              pair[5],
              maps.conditions,
              `${path}.pairs[${index}][5]`
            )
          };
        }
        )
      );
      return JSON.stringify({ kind, context, pairs });
    }
    const groups = sortCanonicalValues(
      requireArray(
        scenario.conceptGroups,
        `${path}.conceptGroups`
      ).map((groupValue, index) => {
        const group = requireTuple(
          groupValue,
          5,
          `${path}.conceptGroups[${index}]`
        );
        return {
          label: canonicalTextReference(
            group[1],
            maps,
            `${path}.conceptGroups[${index}][1]`
          ),
          accepted: sortCanonicalValues(
            requireArray(
              group[2],
              `${path}.conceptGroups[${index}][2]`
            ).map((reference, refIndex) =>
              canonicalTextReference(
                reference,
                maps,
                `${path}.conceptGroups[${index}][2][${refIndex}]`
              )
            )
          ),
          relations: canonicalIdSet(
            group[3],
            maps.relations,
            `${path}.conceptGroups[${index}][3]`
          ),
          conditions: canonicalIdSet(
            group[4],
            maps.conditions,
            `${path}.conceptGroups[${index}][4]`
          )
        };
      })
    );
    return JSON.stringify({
      kind,
      context,
      groups,
      minimum: scenario.minimumConceptGroups,
      required: canonicalIdSet(
        scenario.requiredRelationIds,
        maps.relations,
        `${path}.requiredRelationIds`
      ),
      criterion: canonicalIdSet(
        [scenario.criterionConditionId],
        maps.conditions,
        `${path}.criterionConditionId`
      )
    });
  }
  const options = sortCanonicalValues(
    requireArray(scenario.options, `${path}.options`).map(
      (optionValue, index) => {
      const option = requireTuple(
        optionValue,
        7,
        `${path}.options[${index}]`
      );
      return {
        correct: option[1],
        label: canonicalTextReference(
          option[2],
          maps,
          `${path}.options[${index}][2]`
        ),
        explanation: canonicalTextReference(
          option[3],
          maps,
          `${path}.options[${index}][3]`
        ),
        relations: canonicalIdSet(
          option[4],
          maps.relations,
          `${path}.options[${index}][4]`
        ),
        conditions: canonicalIdSet(
          option[5],
          maps.conditions,
          `${path}.options[${index}][5]`
        ),
        misconception: option[6] !== null
      };
    }
    )
  );
  if (kind === "diagram") {
    const positions = sortCanonicalValues(
      requireArray(
        scenario.positions,
        `${path}.positions`
      ).map((positionValue, index) => {
        const position = requireTuple(
          positionValue,
          3,
          `${path}.positions[${index}]`
        );
        const entityId = requireString(
          position[0],
          `${path}.positions[${index}][0]`
        );
        const entity = maps.entities.get(entityId);
        if (!entity) {
          return fail(
            "v2-authoring-reference",
            `${path}.positions[${index}][0]`,
            `Unknown entity "${entityId}".`
          );
        }
        return [entity, position[1], position[2]];
      })
    );
    return JSON.stringify({
      kind,
      context,
      positions,
      relations: canonicalIdSet(
        scenario.relationIds,
        maps.relations,
        `${path}.relationIds`
      ),
      answers: canonicalIdSet(
        scenario.answerRelationIds,
        maps.relations,
        `${path}.answerRelationIds`
      ),
      options
    });
  }
  return JSON.stringify({
    kind,
    context,
    language: scenario.language,
    code: normaliseInstructionText(String(scenario.code)),
    options
  });
};

const validateBaseRetrySemanticDifference = (
  input: AcademyLessonTeachingProfileV2CompactPlan
) => {
  (["q2", "q3", "q4", "q5"] as const).forEach((question) => {
    const plans = input.assessmentPlans[question] as {
      base: unknown;
      retry: unknown;
    };
    const base = compactScenarioSignature(
      input,
      question,
      plans.base,
      `input.assessmentPlans.${question}.base`
    );
    const retry = compactScenarioSignature(
      input,
      question,
      plans.retry,
      `input.assessmentPlans.${question}.retry`
    );
    if (base === retry) {
      fail(
        "v2-authoring-semantic-duplicate",
        `input.assessmentPlans.${question}`,
        "Base and retry plans are semantically identical after IDs and copy punctuation are removed."
      );
    }
  });
};

const expandCompactPlan = (
  input: AcademyLessonTeachingProfileV2CompactPlan
): AcademyLessonTeachingProfileV2CompactAuthoring => {
  validateReasonedCaseEvidence(input);
  validateInstructionPlans(input);
  validateBaseRetrySemanticDifference(input);
  return {
    schemaVersion: input.schemaVersion,
    lessonId: input.lessonId,
    systemModel: input.systemModel,
    failurePattern: input.failurePattern,
    visualExplanation: input.visualExplanation,
    applicationTask: input.applicationTask,
    terms: input.terms,
    entities: input.entities,
    relations: input.relations,
    conditions: input.conditions,
    failureBoundary: input.failureBoundary,
    conceptualModel: input.conceptualModel,
    reasonedCases: input.reasonedCases,
    misconception: input.misconception,
    assessmentPlans: {
      q2: {
        base: compactQ2(
          input,
          input.assessmentPlans.q2.base,
          "input.assessmentPlans.q2.base"
        ),
        retry: compactQ2(
          input,
          input.assessmentPlans.q2.retry,
          "input.assessmentPlans.q2.retry"
        )
      },
      q3: {
        base: compactQ3(
          input,
          input.assessmentPlans.q3.base,
          "input.assessmentPlans.q3.base"
        ),
        retry: compactQ3(
          input,
          input.assessmentPlans.q3.retry,
          "input.assessmentPlans.q3.retry"
        )
      },
      q4: {
        base: compactQ4(
          input,
          input.assessmentPlans.q4.base,
          "input.assessmentPlans.q4.base"
        ),
        retry: compactQ4(
          input,
          input.assessmentPlans.q4.retry,
          "input.assessmentPlans.q4.retry"
        )
      },
      q5: {
        base: compactQ5(
          input,
          input.assessmentPlans.q5.base,
          "input.assessmentPlans.q5.base"
        ),
        retry: compactQ5(
          input,
          input.assessmentPlans.q5.retry,
          "input.assessmentPlans.q5.retry"
        )
      }
    },
    explorerPlan: compactExplorer(input, input.explorerPlan)
  };
};

const materialiseAcademyLessonTeachingProfileV2Seed = (
  input: AcademyLessonTeachingProfileV2CompactPlan
): AcademyLessonTeachingProfileV2Seed =>
  materialiseExplicitReferencePlan(expandCompactPlan(input));

export const materialiseAcademyLessonTeachingProfileV2Registry = (
  expectedLessonIdsValue: readonly string[],
  inputsValue: readonly AcademyLessonTeachingProfileV2CompactPlan[]
): Readonly<Record<string, AcademyLessonTeachingProfileV2Seed>> => {
  const expectedLessonIds = explicitStringArray(
    expectedLessonIdsValue,
    "expectedLessonIds"
  );
  const inputs = requireArray(inputsValue, "inputs") as readonly
    AcademyLessonTeachingProfileV2CompactPlan[];
  if (
    expectedLessonIds.length === 0
    || new Set(expectedLessonIds).size !== expectedLessonIds.length
    || inputs.length !== expectedLessonIds.length
  ) {
    return fail(
      "v2-authoring-registry",
      "inputs",
      "Registry requires one compact plan for every unique expected lesson ID."
    );
  }
  const seeds: Record<string, AcademyLessonTeachingProfileV2Seed> = {};
  const expandedRegistry: Record<
    string,
    ReturnType<typeof expandAcademyLessonTeachingProfileV2Seed>
  > = {};
  inputs.forEach((input, index) => {
    const lessonId = requireString(input.lessonId, `inputs[${index}].lessonId`);
    if (!expectedLessonIds.includes(lessonId) || seeds[lessonId] !== undefined) {
      fail(
        "v2-authoring-registry",
        `inputs[${index}].lessonId`,
        `Unexpected or duplicate registry lesson ID "${lessonId}".`
      );
    }
    const seed = materialiseAcademyLessonTeachingProfileV2Seed(input);
    seeds[lessonId] = seed;
    expandedRegistry[lessonId] =
      expandAcademyLessonTeachingProfileV2Seed(seed);
  });
  const missingLessonId = expectedLessonIds.find(
    (lessonId) => seeds[lessonId] === undefined
  );
  if (missingLessonId !== undefined) {
    return fail(
      "v2-authoring-registry",
      "inputs",
      `Missing expected lesson ID "${missingLessonId}".`
    );
  }
  const registryIssues =
    validateAcademyLessonTeachingProfileV2Registry(expandedRegistry);
  if (registryIssues.length > 0) {
    throw new AcademyLessonProfileV2ValidationError(registryIssues);
  }
  const instructionTemplateOwners = new Map<
    string,
    { lessonId: string; path: string }
  >();
  inputs.forEach((input) => {
    registryInstructionTemplateEntries(input).forEach((entry) => {
      const owner = instructionTemplateOwners.get(entry.signature);
      if (owner !== undefined && owner.lessonId !== input.lessonId) {
        fail(
          "v2-authoring-instruction",
          `inputs.${input.lessonId}.assessmentPlans.${entry.path}.instruction`,
          `Instruction template duplicates ${owner.lessonId}:${owner.path} after lesson-domain nouns are removed.`
        );
      }
      instructionTemplateOwners.set(entry.signature, {
        lessonId: input.lessonId,
        path: entry.path
      });
    });
  });
  return Object.freeze(seeds);
};
