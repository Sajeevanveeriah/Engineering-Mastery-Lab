import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyDiagramOption,
  type AcademyDiagramScenario,
  type AcademyDomainEntity,
  type AcademyDomainRelation,
  type AcademyExplorerState,
  type AcademyLessonTeachingProfileV2,
  type AcademyLessonTeachingProfileV2Registry,
  type AcademyLessonTeachingProfileV2Seed,
  type AcademyOrderingScenario,
  type AcademyQ4Scenario,
  type AcademyQ5Scenario,
  type AcademySelectionScenario,
  expandAcademyLessonTeachingProfileV2SeedUnchecked
} from "./lessonTeachingProfileV2";

export type AcademyLessonProfileV2IssueCode =
  | "v2-seed-not-object"
  | "v2-seed-required-field"
  | "v2-seed-field-type"
  | "v2-seed-tuple-shape"
  | "v2-schema-version"
  | "v2-empty-text"
  | "v2-non-ascii-dash"
  | "v2-id-format"
  | "v2-duplicate-id"
  | "v2-term-count"
  | "v2-term-first-use"
  | "v2-entity-count"
  | "v2-generic-domain-model"
  | "v2-relation-count"
  | "v2-domain-reference"
  | "v2-disconnected-entity"
  | "v2-condition-count"
  | "v2-condition-binding"
  | "v2-failure-boundary"
  | "v2-conceptual-model"
  | "v2-reasoned-cases"
  | "v2-misconception-contract"
  | "v2-q2-contract"
  | "v2-q3-contract"
  | "v2-q4-contract"
  | "v2-q5-contract"
  | "v2-assessment-domain-binding"
  | "v2-base-retry-duplicate"
  | "v2-generic-question-shell"
  | "v2-diagram-answer-copy"
  | "v2-explorer-contract"
  | "v2-explorer-state-duplicate"
  | "v2-registry-key"
  | "v2-duplicate-information"
  | "v2-duplicate-unit-shell";

export interface AcademyLessonProfileV2Issue {
  code: AcademyLessonProfileV2IssueCode;
  path: string;
  message: string;
}

export class AcademyLessonProfileV2ValidationError extends Error {
  readonly issues: AcademyLessonProfileV2Issue[];

  constructor(issues: AcademyLessonProfileV2Issue[]) {
    super(
      `Academy lesson teaching profile V2 is invalid: ${issues
        .map((issue) => `${issue.code}@${issue.path}`)
        .join(", ")}`
    );
    this.name = "AcademyLessonProfileV2ValidationError";
    this.issues = issues;
  }
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const addIssue = (
  issues: AcademyLessonProfileV2Issue[],
  code: AcademyLessonProfileV2IssueCode,
  path: string,
  message: string
) => {
  issues.push({ code, path, message });
};

const requireRecord = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
): UnknownRecord | null => {
  if (!isRecord(value)) {
    addIssue(issues, "v2-seed-field-type", path, "Expected an object.");
    return null;
  }
  return value;
};

const requireField = (
  record: UnknownRecord,
  key: string,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
): unknown => {
  if (!Object.hasOwn(record, key)) {
    addIssue(
      issues,
      "v2-seed-required-field",
      `${path}.${key}`,
      "Required field is absent."
    );
  }
  return record[key];
};

const requireString = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[],
  allowNull = false
): value is string | null => {
  if (allowNull && value === null) return true;
  if (typeof value !== "string") {
    addIssue(issues, "v2-seed-field-type", path, "Expected a string.");
    return false;
  }
  return true;
};

const requireBoolean = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
): value is boolean => {
  if (typeof value !== "boolean") {
    addIssue(issues, "v2-seed-field-type", path, "Expected a boolean.");
    return false;
  }
  return true;
};

const requireFiniteNumber = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
): value is number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(issues, "v2-seed-field-type", path, "Expected a finite number.");
    return false;
  }
  return true;
};

const requireArray = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
): unknown[] | null => {
  if (!Array.isArray(value)) {
    addIssue(issues, "v2-seed-field-type", path, "Expected an array.");
    return null;
  }
  return value;
};

const requireStringArray = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
): value is string[] => {
  const values = requireArray(value, path, issues);
  if (!values) return false;
  let valid = true;
  values.forEach((entry, index) => {
    if (!requireString(entry, `${path}[${index}]`, issues)) valid = false;
  });
  return valid;
};

const requireTuple = (
  value: unknown,
  length: number,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
): unknown[] | null => {
  const tuple = requireArray(value, path, issues);
  if (!tuple) return null;
  if (tuple.length !== length) {
    addIssue(
      issues,
      "v2-seed-tuple-shape",
      path,
      `Expected exactly ${length} tuple positions; received ${tuple.length}.`
    );
    return null;
  }
  return tuple;
};

const validateReferenceTuple = (
  tuple: unknown[],
  stringPositions: readonly number[],
  arrayPositions: readonly number[],
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  stringPositions.forEach((position) =>
    requireString(tuple[position], `${path}[${position}]`, issues)
  );
  arrayPositions.forEach((position) =>
    requireStringArray(tuple[position], `${path}[${position}]`, issues)
  );
};

const validateFeedbackShape = (
  value: UnknownRecord,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  requireString(requireField(value, "prompt", path, issues), `${path}.prompt`, issues);
  requireString(
    requireField(value, "feedbackCorrect", path, issues),
    `${path}.feedbackCorrect`,
    issues
  );
  requireString(
    requireField(value, "feedbackIncorrect", path, issues),
    `${path}.feedbackIncorrect`,
    issues
  );
  requireStringArray(requireField(value, "hints", path, issues), `${path}.hints`, issues);
  requireStringArray(
    requireField(value, "solution", path, issues),
    `${path}.solution`,
    issues
  );
  requireStringArray(
    requireField(value, "contextConditionIds", path, issues),
    `${path}.contextConditionIds`,
    issues
  );
};

const validateQ2SeedShape = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const scenario = requireRecord(value, path, issues);
  if (!scenario) return;
  validateFeedbackShape(scenario, path, issues);
  requireStringArray(
    requireField(scenario, "correctOrder", path, issues),
    `${path}.correctOrder`,
    issues
  );
  const steps = requireArray(requireField(scenario, "steps", path, issues), `${path}.steps`, issues);
  steps?.forEach((entry, index) => {
    const stepPath = `${path}.steps[${index}]`;
    const tuple = requireTuple(entry, 6, stepPath, issues);
    if (tuple) validateReferenceTuple(tuple, [0, 1, 2], [3, 4, 5], stepPath, issues);
  });
};

const validateQ3SeedShape = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const scenario = requireRecord(value, path, issues);
  if (!scenario) return;
  validateFeedbackShape(scenario, path, issues);
  const options = requireArray(
    requireField(scenario, "options", path, issues),
    `${path}.options`,
    issues
  );
  options?.forEach((entry, index) => {
    const optionPath = `${path}.options[${index}]`;
    const tuple = requireTuple(entry, 8, optionPath, issues);
    if (!tuple) return;
    validateReferenceTuple(tuple, [0, 1, 3], [4, 5, 6], optionPath, issues);
    requireBoolean(tuple[2], `${optionPath}[2]`, issues);
    requireString(tuple[7], `${optionPath}[7]`, issues, true);
  });
};

const validateQ4SeedShape = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const scenario = requireRecord(value, path, issues);
  if (!scenario) return;
  validateFeedbackShape(scenario, path, issues);
  const kind = requireField(scenario, "kind", path, issues);
  if (kind !== "short-response" && kind !== "matching") {
    addIssue(
      issues,
      "v2-seed-field-type",
      `${path}.kind`,
      "Expected short-response or matching."
    );
    return;
  }
  if (kind === "short-response") {
    const groups = requireArray(
      requireField(scenario, "conceptGroups", path, issues),
      `${path}.conceptGroups`,
      issues
    );
    groups?.forEach((entry, index) => {
      const groupPath = `${path}.conceptGroups[${index}]`;
      const tuple = requireTuple(entry, 6, groupPath, issues);
      if (!tuple) return;
      validateReferenceTuple(tuple, [0, 1], [2, 3, 4, 5], groupPath, issues);
    });
    requireFiniteNumber(
      requireField(scenario, "minimumConceptGroups", path, issues),
      `${path}.minimumConceptGroups`,
      issues
    );
    requireStringArray(
      requireField(scenario, "requiredRelationIds", path, issues),
      `${path}.requiredRelationIds`,
      issues
    );
    requireString(
      requireField(scenario, "criterionConditionId", path, issues),
      `${path}.criterionConditionId`,
      issues
    );
    requireString(
      requireField(scenario, "exemplarResponse", path, issues),
      `${path}.exemplarResponse`,
      issues
    );
    return;
  }
  const pairs = requireArray(
    requireField(scenario, "pairs", path, issues),
    `${path}.pairs`,
    issues
  );
  pairs?.forEach((entry, index) => {
    const pairPath = `${path}.pairs[${index}]`;
    const tuple = requireTuple(entry, 7, pairPath, issues);
    if (tuple) validateReferenceTuple(tuple, [0, 1, 2, 3], [4, 5, 6], pairPath, issues);
  });
};

const validateDiagramOptionsShape = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const options = requireArray(value, path, issues);
  options?.forEach((entry, index) => {
    const optionPath = `${path}[${index}]`;
    const tuple = requireTuple(entry, 8, optionPath, issues);
    if (!tuple) return;
    validateReferenceTuple(tuple, [0, 1, 3], [4, 5, 6], optionPath, issues);
    requireBoolean(tuple[2], `${optionPath}[2]`, issues);
    requireString(tuple[7], `${optionPath}[7]`, issues, true);
  });
};

const validateQ5SeedShape = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const scenario = requireRecord(value, path, issues);
  if (!scenario) return;
  validateFeedbackShape(scenario, path, issues);
  const kind = requireField(scenario, "kind", path, issues);
  if (kind !== "diagram" && kind !== "code-analysis") {
    addIssue(
      issues,
      "v2-seed-field-type",
      `${path}.kind`,
      "Expected diagram or code-analysis."
    );
    return;
  }
  validateDiagramOptionsShape(
    requireField(scenario, "options", path, issues),
    `${path}.options`,
    issues
  );
  if (kind === "code-analysis") {
    requireString(
      requireField(scenario, "language", path, issues),
      `${path}.language`,
      issues
    );
    requireString(requireField(scenario, "code", path, issues), `${path}.code`, issues);
    return;
  }
  const positions = requireArray(
    requireField(scenario, "positions", path, issues),
    `${path}.positions`,
    issues
  );
  positions?.forEach((entry, index) => {
    const positionPath = `${path}.positions[${index}]`;
    const tuple = requireTuple(entry, 3, positionPath, issues);
    if (!tuple) return;
    requireString(tuple[0], `${positionPath}[0]`, issues);
    requireFiniteNumber(tuple[1], `${positionPath}[1]`, issues);
    requireFiniteNumber(tuple[2], `${positionPath}[2]`, issues);
  });
  requireStringArray(
    requireField(scenario, "relationIds", path, issues),
    `${path}.relationIds`,
    issues
  );
  requireStringArray(
    requireField(scenario, "answerRelationIds", path, issues),
    `${path}.answerRelationIds`,
    issues
  );
  requireString(
    requireField(scenario, "textEquivalent", path, issues),
    `${path}.textEquivalent`,
    issues
  );
};

const validateExplorerStateSeedShape = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const state = requireRecord(value, path, issues);
  if (!state) return;
  const kind = requireField(state, "kind", path, issues);
  if (kind === "causal-graph" || kind === "state-graph") {
    const positions = requireArray(
      requireField(state, "positions", path, issues),
      `${path}.positions`,
      issues
    );
    positions?.forEach((entry, index) => {
      const tuplePath = `${path}.positions[${index}]`;
      const tuple = requireTuple(entry, 3, tuplePath, issues);
      if (!tuple) return;
      requireString(tuple[0], `${tuplePath}[0]`, issues);
      requireFiniteNumber(tuple[1], `${tuplePath}[1]`, issues);
      requireFiniteNumber(tuple[2], `${tuplePath}[2]`, issues);
    });
    [
      "visibleEntityIds",
      "visibleRelationIds",
      "activeEntityIds",
      "activeRelationIds",
      "suppressedRelationIds",
      "reversedRelationIds"
    ].forEach((key) =>
      requireStringArray(
        requireField(state, key, path, issues),
        `${path}.${key}`,
        issues
      )
    );
    const annotations = requireArray(
      requireField(state, "annotations", path, issues),
      `${path}.annotations`,
      issues
    );
    annotations?.forEach((entry, index) => {
      const tuplePath = `${path}.annotations[${index}]`;
      const tuple = requireTuple(entry, 4, tuplePath, issues);
      if (tuple) validateReferenceTuple(tuple, [0, 1], [2, 3], tuplePath, issues);
    });
    return;
  }
  if (kind === "parameter-sweep") {
    const axes = requireTuple(
      requireField(state, "axes", path, issues),
      2,
      `${path}.axes`,
      issues
    );
    axes?.forEach((axis, index) => {
      const tuplePath = `${path}.axes[${index}]`;
      const tuple = requireTuple(axis, 4, tuplePath, issues);
      if (!tuple) return;
      requireString(tuple[0], `${tuplePath}[0]`, issues);
      requireString(tuple[1], `${tuplePath}[1]`, issues);
      requireString(tuple[2], `${tuplePath}[2]`, issues, true);
      requireString(tuple[3], `${tuplePath}[3]`, issues);
    });
    const points = requireArray(
      requireField(state, "points", path, issues),
      `${path}.points`,
      issues
    );
    points?.forEach((point, index) => {
      const tuplePath = `${path}.points[${index}]`;
      const tuple = requireTuple(point, 5, tuplePath, issues);
      if (!tuple) return;
      requireString(tuple[0], `${tuplePath}[0]`, issues);
      requireFiniteNumber(tuple[1], `${tuplePath}[1]`, issues);
      requireFiniteNumber(tuple[2], `${tuplePath}[2]`, issues);
      requireString(tuple[3], `${tuplePath}[3]`, issues);
      requireStringArray(tuple[4], `${tuplePath}[4]`, issues);
    });
    requireString(
      requireField(state, "highlightedPointId", path, issues),
      `${path}.highlightedPointId`,
      issues
    );
    requireString(
      requireField(state, "verification", path, issues),
      `${path}.verification`,
      issues
    );
    return;
  }
  if (kind === "geometry-transform") {
    requireString(
      requireField(state, "frameEntityId", path, issues),
      `${path}.frameEntityId`,
      issues
    );
    const points = requireArray(
      requireField(state, "points", path, issues),
      `${path}.points`,
      issues
    );
    points?.forEach((point, index) => {
      const tuplePath = `${path}.points[${index}]`;
      const tuple = requireTuple(point, 5, tuplePath, issues);
      if (!tuple) return;
      requireString(tuple[0], `${tuplePath}[0]`, issues);
      requireString(tuple[1], `${tuplePath}[1]`, issues);
      requireFiniteNumber(tuple[2], `${tuplePath}[2]`, issues);
      requireFiniteNumber(tuple[3], `${tuplePath}[3]`, issues);
      requireString(tuple[4], `${tuplePath}[4]`, issues);
    });
    const segments = requireArray(
      requireField(state, "segments", path, issues),
      `${path}.segments`,
      issues
    );
    segments?.forEach((segment, index) => {
      const tuplePath = `${path}.segments[${index}]`;
      const tuple = requireTuple(segment, 4, tuplePath, issues);
      if (tuple) validateReferenceTuple(tuple, [0, 1, 2, 3], [], tuplePath, issues);
    });
    requireString(
      requireField(state, "verification", path, issues),
      `${path}.verification`,
      issues
    );
    return;
  }
  if (kind === "comparison-matrix") {
    requireStringArray(
      requireField(state, "rowEntityIds", path, issues),
      `${path}.rowEntityIds`,
      issues
    );
    requireStringArray(
      requireField(state, "columnConditionIds", path, issues),
      `${path}.columnConditionIds`,
      issues
    );
    const cells = requireArray(
      requireField(state, "cells", path, issues),
      `${path}.cells`,
      issues
    );
    cells?.forEach((cell, index) => {
      const tuplePath = `${path}.cells[${index}]`;
      const tuple = requireTuple(cell, 4, tuplePath, issues);
      if (tuple) validateReferenceTuple(tuple, [0, 1, 2, 3], [], tuplePath, issues);
    });
    return;
  }
  addIssue(
    issues,
    "v2-seed-field-type",
    `${path}.kind`,
    "Unknown explorer state kind."
  );
};

export const validateAcademyLessonTeachingProfileV2Seed = (
  value: unknown
): AcademyLessonProfileV2Issue[] => {
  const issues: AcademyLessonProfileV2Issue[] = [];
  if (!isRecord(value)) {
    addIssue(
      issues,
      "v2-seed-not-object",
      "profile",
      "Profile seed must be an object."
    );
    return issues;
  }
  const path = "profile";
  const requiredTextFields = [
    "lessonId",
    "systemModel",
    "failurePattern",
    "visualExplanation",
    "applicationTask"
  ] as const;
  requiredTextFields.forEach((key) =>
    requireString(requireField(value, key, path, issues), `${path}.${key}`, issues)
  );
  const schemaVersion = requireField(value, "schemaVersion", path, issues);
  if (typeof schemaVersion !== "number") {
    addIssue(
      issues,
      "v2-seed-field-type",
      `${path}.schemaVersion`,
      "Schema version must be numeric."
    );
  }

  const tupleCollections = [
    ["terms", 5, [0, 1, 2, 3], []],
    ["entities", 4, [0, 1, 2, 3], []],
    ["relations", 7, [0, 1, 4, 5, 6], [2, 3]],
    ["conditions", 5, [0, 1, 2], [3, 4]],
    ["conceptualModel", 5, [0, 1], [2, 3, 4]]
  ] as const;
  tupleCollections.forEach(([key, length, stringPositions, arrayPositions]) => {
    const entries = requireArray(
      requireField(value, key, path, issues),
      `${path}.${key}`,
      issues
    );
    entries?.forEach((entry, index) => {
      const tuplePath = `${path}.${key}[${index}]`;
      const tuple = requireTuple(entry, length, tuplePath, issues);
      if (tuple) {
        validateReferenceTuple(
          tuple,
          stringPositions,
          arrayPositions,
          tuplePath,
          issues
        );
      }
    });
  });

  const failure = requireTuple(
    requireField(value, "failureBoundary", path, issues),
    7,
    `${path}.failureBoundary`,
    issues
  );
  if (failure) {
    validateReferenceTuple(
      failure,
      [0, 1, 2, 3, 4],
      [5, 6],
      `${path}.failureBoundary`,
      issues
    );
  }

  const cases = requireArray(
    requireField(value, "reasonedCases", path, issues),
    `${path}.reasonedCases`,
    issues
  );
  cases?.forEach((entry, caseIndex) => {
    const casePath = `${path}.reasonedCases[${caseIndex}]`;
    const reasonedCase = requireRecord(entry, casePath, issues);
    if (!reasonedCase) return;
    ["id", "kind", "scenario", "outcome", "criterionConditionId", "criterion", "verification"]
      .forEach((key) =>
        requireString(
          requireField(reasonedCase, key, casePath, issues),
          `${casePath}.${key}`,
          issues
        )
      );
    requireStringArray(
      requireField(reasonedCase, "changedConditionIds", casePath, issues),
      `${casePath}.changedConditionIds`,
      issues
    );
    const givens = requireArray(
      requireField(reasonedCase, "givens", casePath, issues),
      `${casePath}.givens`,
      issues
    );
    givens?.forEach((given, index) => {
      const tuplePath = `${casePath}.givens[${index}]`;
      const tuple = requireTuple(given, 5, tuplePath, issues);
      if (!tuple) return;
      requireString(tuple[0], `${tuplePath}[0]`, issues);
      requireString(tuple[1], `${tuplePath}[1]`, issues);
      requireString(tuple[2], `${tuplePath}[2]`, issues);
      requireString(tuple[3], `${tuplePath}[3]`, issues, true);
      requireString(tuple[4], `${tuplePath}[4]`, issues);
    });
    const steps = requireArray(
      requireField(reasonedCase, "reasoningSteps", casePath, issues),
      `${casePath}.reasoningSteps`,
      issues
    );
    steps?.forEach((step, index) => {
      const tuplePath = `${casePath}.reasoningSteps[${index}]`;
      const tuple = requireTuple(step, 5, tuplePath, issues);
      if (tuple) validateReferenceTuple(tuple, [0, 1], [2, 3, 4], tuplePath, issues);
    });
  });

  const misconception = requireRecord(
    requireField(value, "misconception", path, issues),
    `${path}.misconception`,
    issues
  );
  if (misconception) {
    ["id", "claim", "mechanism", "correction", "disconfirmingObservation"].forEach(
      (key) =>
        requireString(
          requireField(misconception, key, `${path}.misconception`, issues),
          `${path}.misconception.${key}`,
          issues
        )
    );
    ["entityIds", "relationIds", "conditionIds"].forEach((key) =>
      requireStringArray(
        requireField(misconception, key, `${path}.misconception`, issues),
        `${path}.misconception.${key}`,
        issues
      )
    );
  }

  const assessments = requireRecord(
    requireField(value, "assessments", path, issues),
    `${path}.assessments`,
    issues
  );
  if (assessments) {
    const validators = {
      q2: validateQ2SeedShape,
      q3: validateQ3SeedShape,
      q4: validateQ4SeedShape,
      q5: validateQ5SeedShape
    };
    (Object.keys(validators) as Array<keyof typeof validators>).forEach((question) => {
      const questionBinding = requireRecord(
        requireField(assessments, question, `${path}.assessments`, issues),
        `${path}.assessments.${question}`,
        issues
      );
      if (!questionBinding) return;
      (["base", "retry"] as const).forEach((mode) =>
        validators[question](
          requireField(
            questionBinding,
            mode,
            `${path}.assessments.${question}`,
            issues
          ),
          `${path}.assessments.${question}.${mode}`,
          issues
        )
      );
    });
  }

  const explorer = requireRecord(
    requireField(value, "explorer", path, issues),
    `${path}.explorer`,
    issues
  );
  if (explorer) {
    ["title", "description", "modelKind"].forEach((key) =>
      requireString(
        requireField(explorer, key, `${path}.explorer`, issues),
        `${path}.explorer.${key}`,
        issues
      )
    );
    const controls = requireArray(
      requireField(explorer, "controls", `${path}.explorer`, issues),
      `${path}.explorer.controls`,
      issues
    );
    controls?.forEach((entry, index) => {
      const controlPath = `${path}.explorer.controls[${index}]`;
      const control = requireRecord(entry, controlPath, issues);
      if (!control) return;
      [
        "id",
        "label",
        "outcome",
        "requiredAction",
        "retainedEvidence",
        "textEquivalent"
      ].forEach((key) =>
        requireString(
          requireField(control, key, controlPath, issues),
          `${controlPath}.${key}`,
          issues
        )
      );
      requireStringArray(
        requireField(control, "changedConditionIds", controlPath, issues),
        `${controlPath}.changedConditionIds`,
        issues
      );
      validateExplorerStateSeedShape(
        requireField(control, "state", controlPath, issues),
        `${controlPath}.state`,
        issues
      );
    });
  }
  return issues;
};

const normaliseText = (value: string): string =>
  value.normalize("NFKC").toLocaleLowerCase("en-AU").replace(/\s+/gu, " ").trim();

const validLocalId = (value: string): boolean => /^[a-z][a-z0-9-]*$/u.test(value);

const scanTextValues = (
  value: unknown,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  if (typeof value === "string") {
    if (value.trim() === "") {
      addIssue(issues, "v2-empty-text", path, "Text must not be empty.");
    }
    if (/[\u2013\u2014]/u.test(value)) {
      addIssue(
        issues,
        "v2-non-ascii-dash",
        path,
        "Use ASCII punctuation instead of Unicode en or em dashes."
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanTextValues(entry, `${path}[${index}]`, issues));
    return;
  }
  if (isRecord(value)) {
    Object.entries(value).forEach(([key, entry]) =>
      scanTextValues(entry, `${path}.${key}`, issues)
    );
  }
};

const uniqueIds = (
  values: readonly string[],
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (!validLocalId(value)) {
      addIssue(
        issues,
        "v2-id-format",
        `${path}[${index}]`,
        `Local ID "${value}" must use lower-case ASCII slug syntax.`
      );
    }
    if (seen.has(value)) {
      addIssue(
        issues,
        "v2-duplicate-id",
        `${path}[${index}]`,
        `Duplicate local ID "${value}".`
      );
    }
    seen.add(value);
  });
};

interface DomainSets {
  entityIds: Set<string>;
  relationIds: Set<string>;
  conditionIds: Set<string>;
}

const addUnknownReferences = (
  references: {
    entityIds?: readonly string[];
    relationIds?: readonly string[];
    conditionIds?: readonly string[];
  },
  domain: DomainSets,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const groups = [
    ["entityIds", references.entityIds ?? [], domain.entityIds],
    ["relationIds", references.relationIds ?? [], domain.relationIds],
    ["conditionIds", references.conditionIds ?? [], domain.conditionIds]
  ] as const;
  groups.forEach(([label, ids, knownIds]) => {
    ids.forEach((id, index) => {
      if (!knownIds.has(id)) {
        addIssue(
          issues,
          "v2-domain-reference",
          `${path}.${label}[${index}]`,
          `Reference "${id}" does not resolve in the lesson domain model.`
        );
      }
    });
  });
};

const scenarioDomainCounts = (
  references: Array<{
    entityIds?: readonly string[];
    relationIds?: readonly string[];
    conditionIds?: readonly string[];
  }>
) => ({
  entities: new Set(references.flatMap((entry) => entry.entityIds ?? [])).size,
  relations: new Set(references.flatMap((entry) => entry.relationIds ?? [])).size,
  conditions: new Set(references.flatMap((entry) => entry.conditionIds ?? [])).size
});

const validateScenarioDomainBinding = (
  references: Array<{
    entityIds?: readonly string[];
    relationIds?: readonly string[];
    conditionIds?: readonly string[];
  }>,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const counts = scenarioDomainCounts(references);
  if (counts.entities < 2 || counts.relations + counts.conditions < 1) {
    addIssue(
      issues,
      "v2-assessment-domain-binding",
      path,
      "Scenario must bind at least two declared entities and one relation or condition."
    );
  }
};

const validateFeedback = (
  feedback: {
    hints: readonly string[];
    solution: readonly string[];
  },
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  if (feedback.hints.length < 2 || feedback.solution.length < 2) {
    addIssue(
      issues,
      "v2-assessment-domain-binding",
      path,
      "Question feedback requires at least two hints and two solution steps."
    );
  }
};

const validateQ2 = (
  scenario: AcademyOrderingScenario,
  domain: DomainSets,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  validateFeedback(scenario, path, issues);
  uniqueIds(scenario.steps.map((step) => step.stepId), `${path}.steps`, issues);
  const stepIds = new Set(scenario.steps.map((step) => step.stepId));
  if (
    scenario.steps.length < 3
    || scenario.steps.length > 5
    || scenario.correctOrder.length !== scenario.steps.length
    || new Set(scenario.correctOrder).size !== scenario.steps.length
    || scenario.correctOrder.some((id) => !stepIds.has(id))
  ) {
    addIssue(
      issues,
      "v2-q2-contract",
      path,
      "Q2 requires 3-5 unique subject steps and one exact permutation."
    );
  }
  addUnknownReferences(
    { conditionIds: scenario.contextConditionIds },
    domain,
    `${path}.context`,
    issues
  );
  scenario.steps.forEach((step, index) => {
    addUnknownReferences(step, domain, `${path}.steps[${index}]`, issues);
    if (step.entityIds.length === 0) {
      addIssue(
        issues,
        "v2-q2-contract",
        `${path}.steps[${index}]`,
        "Every Q2 step must name a subject entity."
      );
    }
  });
  validateScenarioDomainBinding(
    [
      { conditionIds: scenario.contextConditionIds },
      ...scenario.steps
    ],
    path,
    issues
  );
};

const validateQ3 = (
  scenario: AcademySelectionScenario,
  domain: DomainSets,
  misconceptionId: string,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  validateFeedback(scenario, path, issues);
  uniqueIds(scenario.options.map((option) => option.optionId), `${path}.options`, issues);
  const correctCount = scenario.options.filter((option) => option.isCorrect).length;
  if (
    scenario.options.length < 4
    || scenario.options.length > 6
    || correctCount < 2
    || correctCount === scenario.options.length
  ) {
    addIssue(
      issues,
      "v2-q3-contract",
      path,
      "Q3 requires 4-6 options, at least two correct claims and at least one distractor."
    );
  }
  if (!scenario.options.some((option) => option.misconceptionId === misconceptionId)) {
    addIssue(
      issues,
      "v2-q3-contract",
      path,
      "Q3 requires a distractor bound to the declared misconception mechanism."
    );
  }
  addUnknownReferences(
    { conditionIds: scenario.contextConditionIds },
    domain,
    `${path}.context`,
    issues
  );
  scenario.options.forEach((option, index) => {
    addUnknownReferences(option, domain, `${path}.options[${index}]`, issues);
    if (
      option.misconceptionId !== null
      && option.misconceptionId !== misconceptionId
    ) {
      addIssue(
        issues,
        "v2-q3-contract",
        `${path}.options[${index}].misconceptionId`,
        "Option misconception ID does not resolve to the lesson misconception."
      );
    }
  });
  validateScenarioDomainBinding(
    [{ conditionIds: scenario.contextConditionIds }, ...scenario.options],
    path,
    issues
  );
};

const validateQ4 = (
  scenario: AcademyQ4Scenario,
  domain: DomainSets,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  validateFeedback(scenario, path, issues);
  addUnknownReferences(
    { conditionIds: scenario.contextConditionIds },
    domain,
    `${path}.context`,
    issues
  );
  if (scenario.kind === "matching") {
    uniqueIds(scenario.pairs.map((pair) => pair.pairId), `${path}.pairs`, issues);
    if (scenario.pairs.length < 3) {
      addIssue(
        issues,
        "v2-q4-contract",
        path,
        "Matching Q4 requires at least three domain pairs."
      );
    }
    scenario.pairs.forEach((pair, index) =>
      addUnknownReferences(pair, domain, `${path}.pairs[${index}]`, issues)
    );
    validateScenarioDomainBinding(
      [{ conditionIds: scenario.contextConditionIds }, ...scenario.pairs],
      path,
      issues
    );
    return;
  }
  uniqueIds(
    scenario.conceptGroups.map((group) => group.conceptId),
    `${path}.conceptGroups`,
    issues
  );
  if (
    scenario.conceptGroups.length < 3
    || scenario.minimumConceptGroups < 3
    || scenario.minimumConceptGroups > scenario.conceptGroups.length
    || scenario.requiredRelationIds.length === 0
  ) {
    addIssue(
      issues,
      "v2-q4-contract",
      path,
      "Short Q4 requires at least three concept groups, a minimum of three and a required relation."
    );
  }
  if (!domain.conditionIds.has(scenario.criterionConditionId)) {
    addIssue(
      issues,
      "v2-q4-contract",
      `${path}.criterionConditionId`,
      "Q4 criterion condition does not resolve."
    );
  }
  addUnknownReferences(
    { relationIds: scenario.requiredRelationIds },
    domain,
    `${path}.requiredRelationIds`,
    issues
  );
  scenario.conceptGroups.forEach((group, index) => {
    addUnknownReferences(group, domain, `${path}.conceptGroups[${index}]`, issues);
    if (group.acceptedPhrases.length === 0) {
      addIssue(
        issues,
        "v2-q4-contract",
        `${path}.conceptGroups[${index}]`,
        "Concept group must explicitly list accepted phrases."
      );
    }
  });
  validateScenarioDomainBinding(
    [
      { conditionIds: scenario.contextConditionIds },
      { relationIds: scenario.requiredRelationIds },
      { conditionIds: [scenario.criterionConditionId] },
      ...scenario.conceptGroups
    ],
    path,
    issues
  );
};

const validateOptions = (
  options: readonly AcademyDiagramOption[],
  domain: DomainSets,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  uniqueIds(options.map((option) => option.optionId), path, issues);
  if (
    options.length < 3
    || options.filter((option) => option.isCorrect).length !== 1
  ) {
    addIssue(
      issues,
      "v2-q5-contract",
      path,
      "Q5 requires at least three options and exactly one correct implication."
    );
  }
  options.forEach((option, index) =>
    addUnknownReferences(option, domain, `${path}[${index}]`, issues)
  );
};

const validateDiagram = (
  scenario: AcademyDiagramScenario,
  entities: ReadonlyMap<string, AcademyDomainEntity>,
  relations: ReadonlyMap<string, AcademyDomainRelation>,
  domain: DomainSets,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  const nodeIds = scenario.positions.map((position) => position.entityId);
  uniqueIds(nodeIds, `${path}.positions`, issues);
  if (nodeIds.length < 3 || nodeIds.length > 5) {
    addIssue(
      issues,
      "v2-q5-contract",
      `${path}.positions`,
      "Diagram requires 3-5 declared lesson entities."
    );
  }
  const positionKeys = scenario.positions.map(
    (position) => `${position.column}:${position.row}`
  );
  if (new Set(positionKeys).size !== positionKeys.length) {
    addIssue(
      issues,
      "v2-q5-contract",
      `${path}.positions`,
      "Diagram positions must not overlap."
    );
  }
  addUnknownReferences(
    {
      entityIds: nodeIds,
      relationIds: scenario.relationIds,
      conditionIds: scenario.contextConditionIds
    },
    domain,
    path,
    issues
  );
  if (
    scenario.relationIds.length < 2
    || scenario.answerRelationIds.length === 0
    || scenario.answerRelationIds.some((id) => !scenario.relationIds.includes(id))
  ) {
    addIssue(
      issues,
      "v2-q5-contract",
      path,
      "Diagram requires two relations and a resolved answer-relation subset."
    );
  }
  const nodeSet = new Set(nodeIds);
  scenario.relationIds.forEach((relationId, index) => {
    const relation = relations.get(relationId);
    if (
      relation
      && [...relation.fromEntityIds, ...relation.toEntityIds].some(
        (entityId) => !nodeSet.has(entityId)
      )
    ) {
      addIssue(
        issues,
        "v2-q5-contract",
        `${path}.relationIds[${index}]`,
        "Every displayed relation endpoint must be a displayed domain entity."
      );
    }
  });
  validateOptions(scenario.options, domain, `${path}.options`, issues);
  const correct = scenario.options.find((option) => option.isCorrect);
  const copiedLabels = new Set([
    ...scenario.answerRelationIds
      .map((relationId) => relations.get(relationId)?.predicate)
      .filter((value): value is string => value !== undefined),
    ...nodeIds
      .map((entityId) => entities.get(entityId)?.label)
      .filter((value): value is string => value !== undefined)
  ].map(normaliseText));
  if (correct && copiedLabels.has(normaliseText(correct.label))) {
    addIssue(
      issues,
      "v2-diagram-answer-copy",
      `${path}.options`,
      "Correct diagram answer must interpret an implication or condition, not copy a node or edge label."
    );
  }
};

const validateQ5 = (
  scenario: AcademyQ5Scenario,
  entities: ReadonlyMap<string, AcademyDomainEntity>,
  relations: ReadonlyMap<string, AcademyDomainRelation>,
  domain: DomainSets,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  validateFeedback(scenario, path, issues);
  addUnknownReferences(
    { conditionIds: scenario.contextConditionIds },
    domain,
    `${path}.context`,
    issues
  );
  if (scenario.kind === "diagram") {
    validateDiagram(scenario, entities, relations, domain, path, issues);
    validateScenarioDomainBinding(
      [
        {
          entityIds: scenario.positions.map((position) => position.entityId),
          relationIds: scenario.relationIds,
          conditionIds: scenario.contextConditionIds
        },
        ...scenario.options
      ],
      path,
      issues
    );
    return;
  }
  if (!scenario.language.trim() || !scenario.code.trim()) {
    addIssue(
      issues,
      "v2-q5-contract",
      path,
      "Code Q5 requires explicit language and static source."
    );
  }
  validateOptions(scenario.options, domain, `${path}.options`, issues);
  validateScenarioDomainBinding(
    [{ conditionIds: scenario.contextConditionIds }, ...scenario.options],
    path,
    issues
  );
};

const explorerNonTextSignature = (state: AcademyExplorerState): string => {
  switch (state.kind) {
    case "causal-graph":
    case "state-graph":
      return JSON.stringify({
        kind: state.kind,
        positions: state.positions,
        visibleEntityIds: state.visibleEntityIds,
        visibleRelationIds: state.visibleRelationIds,
        activeEntityIds: state.activeEntityIds,
        activeRelationIds: state.activeRelationIds,
        suppressedRelationIds: state.suppressedRelationIds,
        reversedRelationIds: state.reversedRelationIds
      });
    case "parameter-sweep":
      return JSON.stringify({
        kind: state.kind,
        axes: state.axes.map(({ axisId: _axisId, label: _label, ...axis }) => axis),
        points: state.points.map(({ pointId: _pointId, label: _label, ...point }) => point),
        highlightedPointId: state.highlightedPointId
      });
    case "geometry-transform":
      return JSON.stringify({
        kind: state.kind,
        frameEntityId: state.frameEntityId,
        points: state.points.map(({ pointId: _pointId, label: _label, ...point }) => point),
        segments: state.segments
      });
    case "comparison-matrix":
      return JSON.stringify({
        kind: state.kind,
        rows: state.rowEntityIds,
        columns: state.columnConditionIds,
        cells: state.cells.map(({ label: _label, ...cell }) => cell)
      });
  }
};

const validateExplorerState = (
  state: AcademyExplorerState,
  relations: ReadonlyMap<string, AcademyDomainRelation>,
  domain: DomainSets,
  path: string,
  issues: AcademyLessonProfileV2Issue[]
) => {
  if (state.kind === "causal-graph" || state.kind === "state-graph") {
    if (state.positions.length < 3 || state.visibleRelationIds.length < 2) {
      addIssue(
        issues,
        "v2-explorer-contract",
        path,
        "Graph explorer state requires at least three positioned entities and two visible relations."
      );
    }
    addUnknownReferences(
      {
        entityIds: [
          ...state.positions.map((position) => position.entityId),
          ...state.visibleEntityIds,
          ...state.activeEntityIds
        ],
        relationIds: [
          ...state.visibleRelationIds,
          ...state.activeRelationIds,
          ...state.suppressedRelationIds,
          ...state.reversedRelationIds
        ]
      },
      domain,
      path,
      issues
    );
    state.annotations.forEach((annotation, index) =>
      addUnknownReferences(annotation, domain, `${path}.annotations[${index}]`, issues)
    );
    const visibleEntities = new Set(state.visibleEntityIds);
    state.visibleRelationIds.forEach((relationId, index) => {
      const relation = relations.get(relationId);
      if (
        relation
        && [...relation.fromEntityIds, ...relation.toEntityIds].some(
          (entityId) => !visibleEntities.has(entityId)
        )
      ) {
        addIssue(
          issues,
          "v2-explorer-contract",
          `${path}.visibleRelationIds[${index}]`,
          "Visible graph relation has a hidden endpoint."
        );
      }
    });
    return;
  }
  if (state.kind === "parameter-sweep") {
    if (
      state.points.length < 3
      || !state.points.some((point) => point.pointId === state.highlightedPointId)
    ) {
      addIssue(
        issues,
        "v2-explorer-contract",
        path,
        "Parameter sweep requires three finite points and a resolved highlight."
      );
    }
    addUnknownReferences(
      {
        entityIds: state.axes.map((axis) => axis.entityId),
        conditionIds: state.points.flatMap((point) => point.conditionIds)
      },
      domain,
      path,
      issues
    );
    return;
  }
  if (state.kind === "geometry-transform") {
    if (state.points.length < 3 || state.segments.length < 2) {
      addIssue(
        issues,
        "v2-explorer-contract",
        path,
        "Geometry state requires at least three points and two segments."
      );
    }
    const pointIds = new Set(state.points.map((point) => point.pointId));
    addUnknownReferences(
      {
        entityIds: [
          state.frameEntityId,
          ...state.points.map((point) => point.entityId)
        ],
        relationIds: state.segments.map((segment) => segment.relationId)
      },
      domain,
      path,
      issues
    );
    state.segments.forEach((segment, index) => {
      if (!pointIds.has(segment.fromPointId) || !pointIds.has(segment.toPointId)) {
        addIssue(
          issues,
          "v2-explorer-contract",
          `${path}.segments[${index}]`,
          "Geometry segment endpoint does not resolve."
        );
      }
    });
    return;
  }
  if (state.kind !== "comparison-matrix") return;
  const expectedCells = state.rowEntityIds.length * state.columnConditionIds.length;
  if (
    state.rowEntityIds.length < 2
    || state.columnConditionIds.length < 1
    || state.cells.length !== expectedCells
  ) {
    addIssue(
      issues,
      "v2-explorer-contract",
      path,
      "Comparison matrix must provide every row-condition cell."
    );
  }
  addUnknownReferences(
    {
      entityIds: [
        ...state.rowEntityIds,
        ...state.cells.map((cell) => cell.entityId)
      ],
      conditionIds: [
        ...state.columnConditionIds,
        ...state.cells.map((cell) => cell.conditionId)
      ]
    },
    domain,
    path,
    issues
  );
};

const canonicalReferenceMaps = (profile: AcademyLessonTeachingProfileV2) => ({
  entity: new Map(
    profile.entities.map((entity, index) => [
      entity.entityId,
      `e${index}:${entity.entityType}`
    ])
  ),
  relation: new Map(
    profile.relations.map((relation, index) => [
      relation.relationId,
      `r${index}:${relation.relationKind}:${relation.direction}:${relation.cardinality}`
    ])
  ),
  condition: new Map(
    profile.conditions.map((condition, index) => [
      condition.conditionId,
      `c${index}:${condition.conditionType}`
    ])
  )
});

const canonicalRefs = (
  references: {
    entityIds?: readonly string[];
    relationIds?: readonly string[];
    conditionIds?: readonly string[];
  },
  maps: ReturnType<typeof canonicalReferenceMaps>
) => ({
  entities: (references.entityIds ?? []).map((id) => maps.entity.get(id) ?? "?"),
  relations: (references.relationIds ?? []).map((id) => maps.relation.get(id) ?? "?"),
  conditions: (references.conditionIds ?? []).map((id) => maps.condition.get(id) ?? "?")
});

export type AcademyAssessmentShellQuestion = "q2" | "q3" | "q4" | "q5";

export const normaliseAcademyAssessmentV2Shell = (
  profile: AcademyLessonTeachingProfileV2,
  question: AcademyAssessmentShellQuestion
): string => {
  const maps = canonicalReferenceMaps(profile);
  if (question === "q2") {
    const scenario = (value: AcademyOrderingScenario) => ({
      conditions: canonicalRefs(
        { conditionIds: value.contextConditionIds },
        maps
      ).conditions,
      steps: value.steps.map((step) => canonicalRefs(step, maps)),
      order: value.correctOrder.map(
        (id) => value.steps.findIndex((step) => step.stepId === id)
      ),
      hints: value.hints.length,
      solution: value.solution.length
    });
    return JSON.stringify({
      base: scenario(profile.assessments.q2.base),
      retry: scenario(profile.assessments.q2.retry)
    });
  }
  if (question === "q3") {
    const scenario = (value: AcademySelectionScenario) => ({
      conditions: canonicalRefs(
        { conditionIds: value.contextConditionIds },
        maps
      ).conditions,
      options: value.options.map((option) => ({
        correct: option.isCorrect,
        misconception: option.misconceptionId !== null,
        refs: canonicalRefs(option, maps)
      })),
      hints: value.hints.length,
      solution: value.solution.length
    });
    return JSON.stringify({
      base: scenario(profile.assessments.q3.base),
      retry: scenario(profile.assessments.q3.retry)
    });
  }
  if (question === "q4") {
    const scenario = (value: AcademyQ4Scenario) => {
      if (value.kind === "matching") {
        return {
          kind: value.kind,
          conditions: canonicalRefs(
            { conditionIds: value.contextConditionIds },
            maps
          ).conditions,
          pairs: value.pairs.map((pair) => canonicalRefs(pair, maps)),
          hints: value.hints.length,
          solution: value.solution.length
        };
      }
      return {
        kind: value.kind,
        conditions: canonicalRefs(
          { conditionIds: value.contextConditionIds },
          maps
        ).conditions,
        concepts: value.conceptGroups.map((group) => ({
          acceptedPhraseCount: group.acceptedPhrases.length,
          refs: canonicalRefs(group, maps)
        })),
        minimum: value.minimumConceptGroups,
        requiredRelations: canonicalRefs(
          { relationIds: value.requiredRelationIds },
          maps
        ).relations,
        criterion: maps.condition.get(value.criterionConditionId),
        hints: value.hints.length,
        solution: value.solution.length
      };
    };
    return JSON.stringify({
      base: scenario(profile.assessments.q4.base),
      retry: scenario(profile.assessments.q4.retry)
    });
  }
  const scenario = (value: AcademyQ5Scenario) => {
    const common = {
      kind: value.kind,
      conditions: canonicalRefs(
        { conditionIds: value.contextConditionIds },
        maps
      ).conditions,
      options: value.options.map((option) => ({
        correct: option.isCorrect,
        refs: canonicalRefs(option, maps)
      })),
      hints: value.hints.length,
      solution: value.solution.length
    };
    return value.kind === "diagram"
      ? {
          ...common,
          positions: value.positions.map((position) => ({
            entity: maps.entity.get(position.entityId),
            column: position.column,
            row: position.row
          })),
          relations: canonicalRefs(
            { relationIds: value.relationIds },
            maps
          ).relations,
          answers: canonicalRefs(
            { relationIds: value.answerRelationIds },
            maps
          ).relations
        }
      : {
          ...common,
          languagePresent: value.language.trim().length > 0,
          codeLineCount: value.code.split(/\r?\n/u).length
        };
  };
  return JSON.stringify({
    base: scenario(profile.assessments.q5.base),
    retry: scenario(profile.assessments.q5.retry)
  });
};

const informationText = (profile: AcademyLessonTeachingProfileV2): string[] => [
  profile.systemModel,
  profile.failurePattern,
  profile.visualExplanation,
  profile.applicationTask,
  ...profile.terms.flatMap((term) => [
    term.label,
    term.definition,
    term.boundary
  ]),
  ...profile.entities.flatMap((entity) => [entity.label, entity.definition]),
  ...profile.relations.map((relation) => relation.predicate),
  ...profile.conditions.map((condition) => condition.statement),
  ...profile.conceptualModel.map((step) => step.statement),
  ...profile.reasonedCases.flatMap((reasonedCase) => [
    reasonedCase.scenario,
    reasonedCase.outcome,
    reasonedCase.criterion,
    reasonedCase.verification
  ]),
  profile.misconception.claim,
  profile.misconception.mechanism,
  profile.misconception.correction,
  profile.misconception.disconfirmingObservation
];

export const academyLessonTeachingProfileV2InformationSignature = (
  profile: AcademyLessonTeachingProfileV2
): string => normaliseText(informationText(profile).join(" "));

export const validateAcademyLessonTeachingProfileV2 = (
  profile: AcademyLessonTeachingProfileV2
): AcademyLessonProfileV2Issue[] => {
  const issues: AcademyLessonProfileV2Issue[] = [];
  scanTextValues(profile, "profile", issues);
  if (
    profile.schemaVersion
    !== ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION
  ) {
    addIssue(
      issues,
      "v2-schema-version",
      "profile.schemaVersion",
      "Profile schema version is not V2."
    );
  }
  if (!/^EML-E[0-4]-D\d{2}-L\d{2}$/u.test(profile.lessonId)) {
    addIssue(
      issues,
      "v2-id-format",
      "profile.lessonId",
      "Lesson ID must use the canonical EML stage, unit and lesson format."
    );
  }

  uniqueIds(profile.terms.map((term) => term.termId), "profile.terms", issues);
  if (profile.terms.length < 2 || profile.terms.length > 6) {
    addIssue(
      issues,
      "v2-term-count",
      "profile.terms",
      "Profile requires 2-6 explicitly bounded terms."
    );
  }
  const conceptualStepIds = new Set(
    profile.conceptualModel.map((step) => step.stepId)
  );
  profile.terms.forEach((term, index) => {
    if (!conceptualStepIds.has(term.firstUseStepId)) {
      addIssue(
        issues,
        "v2-term-first-use",
        `profile.terms[${index}].firstUseStepId`,
        "Term first-use step does not resolve."
      );
    }
  });

  uniqueIds(
    profile.entities.map((entity) => entity.entityId),
    "profile.entities",
    issues
  );
  if (profile.entities.length < 3) {
    addIssue(
      issues,
      "v2-entity-count",
      "profile.entities",
      "Profile requires at least three lesson-domain entities."
    );
  }
  const genericWords = new Set([
    "system",
    "application",
    "relationship",
    "failure",
    "decision",
    "input",
    "model",
    "evidence",
    "criterion",
    "observation",
    "condition",
    "output"
  ]);
  const specificEntities = profile.entities.filter((entity) =>
    normaliseText(entity.label)
      .split(/[^a-z0-9]+/u)
      .some((token) => token.length > 2 && !genericWords.has(token))
  );
  if (specificEntities.length < 2) {
    addIssue(
      issues,
      "v2-generic-domain-model",
      "profile.entities",
      "Meta-role labels alone are not a lesson-domain model."
    );
  }

  uniqueIds(
    profile.relations.map((relation) => relation.relationId),
    "profile.relations",
    issues
  );
  if (profile.relations.length < 2) {
    addIssue(
      issues,
      "v2-relation-count",
      "profile.relations",
      "Profile requires at least two declared domain relations."
    );
  }
  uniqueIds(
    profile.conditions.map((condition) => condition.conditionId),
    "profile.conditions",
    issues
  );
  if (profile.conditions.length < 1) {
    addIssue(
      issues,
      "v2-condition-count",
      "profile.conditions",
      "Profile requires at least one explicit assumption, boundary or criterion."
    );
  }

  const domain: DomainSets = {
    entityIds: new Set(profile.entities.map((entity) => entity.entityId)),
    relationIds: new Set(profile.relations.map((relation) => relation.relationId)),
    conditionIds: new Set(profile.conditions.map((condition) => condition.conditionId))
  };
  const entities = new Map(
    profile.entities.map((entity) => [entity.entityId, entity])
  );
  const relations = new Map(
    profile.relations.map((relation) => [relation.relationId, relation])
  );
  const connectedEntityIds = new Set<string>();
  profile.relations.forEach((relation, index) => {
    addUnknownReferences(
      {
        entityIds: [...relation.fromEntityIds, ...relation.toEntityIds]
      },
      domain,
      `profile.relations[${index}]`,
      issues
    );
    relation.fromEntityIds.forEach((id) => connectedEntityIds.add(id));
    relation.toEntityIds.forEach((id) => connectedEntityIds.add(id));
    if (relation.fromEntityIds.length === 0 || relation.toEntityIds.length === 0) {
      addIssue(
        issues,
        "v2-relation-count",
        `profile.relations[${index}]`,
        "Relation requires explicit source and target entities."
      );
    }
  });
  profile.entities.forEach((entity, index) => {
    if (!connectedEntityIds.has(entity.entityId)) {
      addIssue(
        issues,
        "v2-disconnected-entity",
        `profile.entities[${index}]`,
        "Every domain entity must participate in a declared relation."
      );
    }
  });
  profile.conditions.forEach((condition, index) => {
    addUnknownReferences(
      {
        entityIds: condition.affectedEntityIds,
        relationIds: condition.affectedRelationIds
      },
      domain,
      `profile.conditions[${index}]`,
      issues
    );
    if (
      condition.affectedEntityIds.length
      + condition.affectedRelationIds.length
      === 0
    ) {
      addIssue(
        issues,
        "v2-condition-binding",
        `profile.conditions[${index}]`,
        "Condition must affect a declared entity or relation."
      );
    }
  });
  addUnknownReferences(
    {
      entityIds: profile.failureBoundary.affectedEntityIds,
      relationIds: profile.failureBoundary.affectedRelationIds,
      conditionIds: [profile.failureBoundary.conditionId]
    },
    domain,
    "profile.failureBoundary",
    issues
  );
  if (
    profile.failureBoundary.affectedEntityIds.length === 0
    || profile.failureBoundary.affectedRelationIds.length === 0
  ) {
    addIssue(
      issues,
      "v2-failure-boundary",
      "profile.failureBoundary",
      "Failure boundary must link a condition, affected entities, an affected relation and an observable consequence."
    );
  }

  uniqueIds(
    profile.conceptualModel.map((step) => step.stepId),
    "profile.conceptualModel",
    issues
  );
  if (profile.conceptualModel.length < 4 || profile.conceptualModel.length > 8) {
    addIssue(
      issues,
      "v2-conceptual-model",
      "profile.conceptualModel",
      "Conceptual model requires 4-8 explicit reasoning steps."
    );
  }
  profile.conceptualModel.forEach((step, index) => {
    addUnknownReferences(step, domain, `profile.conceptualModel[${index}]`, issues);
    if (step.entityIds.length === 0 || step.relationIds.length + step.conditionIds.length === 0) {
      addIssue(
        issues,
        "v2-conceptual-model",
        `profile.conceptualModel[${index}]`,
        "Conceptual step must bind a domain entity and relation or condition."
      );
    }
  });

  uniqueIds(
    profile.reasonedCases.map((reasonedCase) => reasonedCase.id),
    "profile.reasonedCases",
    issues
  );
  if (
    profile.reasonedCases.length < 2
    || !profile.reasonedCases.some((reasonedCase) => reasonedCase.kind === "example")
    || !profile.reasonedCases.some(
      (reasonedCase) => reasonedCase.kind === "counterexample"
    )
  ) {
    addIssue(
      issues,
      "v2-reasoned-cases",
      "profile.reasonedCases",
      "Profile requires at least one example and one counterexample."
    );
  }
  profile.reasonedCases.forEach((reasonedCase, caseIndex) => {
    addUnknownReferences(
      {
        conditionIds: [
          ...reasonedCase.changedConditionIds,
          reasonedCase.criterionConditionId
        ],
        entityIds: reasonedCase.givens.map((given) => given.entityId)
      },
      domain,
      `profile.reasonedCases[${caseIndex}]`,
      issues
    );
    if (
      reasonedCase.givens.length === 0
      || reasonedCase.reasoningSteps.length < 3
      || (
        reasonedCase.kind === "counterexample"
        && reasonedCase.changedConditionIds.length === 0
      )
    ) {
      addIssue(
        issues,
        "v2-reasoned-cases",
        `profile.reasonedCases[${caseIndex}]`,
        "Case requires givens, at least three reasoning steps and an explicit changed condition for counterexamples."
      );
    }
    reasonedCase.reasoningSteps.forEach((step, stepIndex) =>
      addUnknownReferences(
        step,
        domain,
        `profile.reasonedCases[${caseIndex}].reasoningSteps[${stepIndex}]`,
        issues
      )
    );
  });

  addUnknownReferences(
    profile.misconception,
    domain,
    "profile.misconception",
    issues
  );
  if (
    profile.misconception.entityIds.length < 2
    || profile.misconception.relationIds.length
      + profile.misconception.conditionIds.length < 1
  ) {
    addIssue(
      issues,
      "v2-misconception-contract",
      "profile.misconception",
      "Misconception must explain a subject mechanism across at least two entities and one relation or condition."
    );
  }

  const assessmentModes = ["base", "retry"] as const;
  assessmentModes.forEach((mode) => {
    validateQ2(
      profile.assessments.q2[mode],
      domain,
      `profile.assessments.q2.${mode}`,
      issues
    );
    validateQ3(
      profile.assessments.q3[mode],
      domain,
      profile.misconception.id,
      `profile.assessments.q3.${mode}`,
      issues
    );
    validateQ4(
      profile.assessments.q4[mode],
      domain,
      `profile.assessments.q4.${mode}`,
      issues
    );
    validateQ5(
      profile.assessments.q5[mode],
      entities,
      relations,
      domain,
      `profile.assessments.q5.${mode}`,
      issues
    );
  });
  (["q2", "q3", "q4", "q5"] as const).forEach((question) => {
    const shell = normaliseAcademyAssessmentV2Shell(profile, question);
    const baseMarker = shell.indexOf('"base"');
    const retryMarker = shell.indexOf('"retry"');
    if (baseMarker === -1 || retryMarker === -1) return;
    const binding = profile.assessments[question] as {
      base: unknown;
      retry: unknown;
    };
    if (JSON.stringify(binding.base) === JSON.stringify(binding.retry)) {
      addIssue(
        issues,
        "v2-base-retry-duplicate",
        `profile.assessments.${question}`,
        "Base and retry authoring must be distinct explicit scenarios."
      );
    }
  });
  if (profileUsesRejectedGenericShell(profile)) {
    addIssue(
      issues,
      "v2-generic-question-shell",
      "profile.assessments",
      "Profile uses a rejected generic Q2, Q3, Q4 or meta-role diagram shell."
    );
  }

  uniqueIds(
    profile.explorer.controls.map((control) => control.id),
    "profile.explorer.controls",
    issues
  );
  if (profile.explorer.controls.length < 2) {
    addIssue(
      issues,
      "v2-explorer-contract",
      "profile.explorer.controls",
      "Explorer requires at least two explicit control states."
    );
  }
  const stateSignatures = new Set<string>();
  const textEquivalents = new Set<string>();
  profile.explorer.controls.forEach((control, index) => {
    const controlPath = `profile.explorer.controls[${index}]`;
    if (
      control.state.kind !== profile.explorer.modelKind
      || control.changedConditionIds.length === 0
    ) {
      addIssue(
        issues,
        "v2-explorer-contract",
        controlPath,
        "Control state kind must match the explorer and explicitly change a condition."
      );
    }
    addUnknownReferences(
      { conditionIds: control.changedConditionIds },
      domain,
      controlPath,
      issues
    );
    validateExplorerState(
      control.state,
      relations,
      domain,
      `${controlPath}.state`,
      issues
    );
    stateSignatures.add(explorerNonTextSignature(control.state));
    textEquivalents.add(normaliseText(control.textEquivalent));
  });
  if (stateSignatures.size !== profile.explorer.controls.length) {
    addIssue(
      issues,
      "v2-explorer-state-duplicate",
      "profile.explorer.controls",
      "Every control must change the deterministic non-text model state."
    );
  }
  if (textEquivalents.size !== profile.explorer.controls.length) {
    addIssue(
      issues,
      "v2-explorer-state-duplicate",
      "profile.explorer.controls",
      "Every visual state requires its own exact text equivalent."
    );
  }
  return issues;
};

export const expandAcademyLessonTeachingProfileV2Seed = (
  value: unknown
): AcademyLessonTeachingProfileV2 => {
  const seedIssues = validateAcademyLessonTeachingProfileV2Seed(value);
  if (seedIssues.length > 0) {
    throw new AcademyLessonProfileV2ValidationError(seedIssues);
  }
  const expanded = expandAcademyLessonTeachingProfileV2SeedUnchecked(
    value as AcademyLessonTeachingProfileV2Seed
  );
  const expandedIssues = validateAcademyLessonTeachingProfileV2(expanded);
  if (expandedIssues.length > 0) {
    throw new AcademyLessonProfileV2ValidationError(expandedIssues);
  }
  return expanded;
};

const unitIdFromLessonId = (lessonId: string): string =>
  lessonId.replace(/-L\d{2}$/u, "");

export const validateAcademyLessonTeachingProfileV2Registry = (
  registry: AcademyLessonTeachingProfileV2Registry
): AcademyLessonProfileV2Issue[] => {
  const issues: AcademyLessonProfileV2Issue[] = [];
  const informationOwners = new Map<string, string>();
  const shellOwnersByUnit = new Map<string, Map<string, string>>();
  Object.entries(registry).forEach(([registryKey, profile]) => {
    if (registryKey !== profile.lessonId) {
      addIssue(
        issues,
        "v2-registry-key",
        `registry.${registryKey}`,
        `Registry key does not match profile lessonId "${profile.lessonId}".`
      );
    }
    issues.push(
      ...validateAcademyLessonTeachingProfileV2(profile).map((issue) => ({
        ...issue,
        path: `registry.${registryKey}.${issue.path}`
      }))
    );
    const informationSignature =
      academyLessonTeachingProfileV2InformationSignature(profile);
    const informationOwner = informationOwners.get(informationSignature);
    if (informationOwner) {
      addIssue(
        issues,
        "v2-duplicate-information",
        `registry.${registryKey}`,
        `Profile duplicates substantive information from ${informationOwner}.`
      );
    } else {
      informationOwners.set(informationSignature, registryKey);
    }

    const unitId = unitIdFromLessonId(profile.lessonId);
    const shellOwners = shellOwnersByUnit.get(unitId) ?? new Map<string, string>();
    shellOwnersByUnit.set(unitId, shellOwners);
    (["q2", "q3", "q4"] as const).forEach((question) => {
      const shell = `${question}:${normaliseAcademyAssessmentV2Shell(
        profile,
        question
      )}`;
      const priorOwner = shellOwners.get(shell);
      if (priorOwner) {
        addIssue(
          issues,
          "v2-duplicate-unit-shell",
          `registry.${registryKey}.assessments.${question}`,
          `Normalised ${question.toLocaleUpperCase("en-AU")} shell duplicates ${priorOwner} within ${unitId}.`
        );
      } else {
        shellOwners.set(shell, registryKey);
      }
    });
  });
  return issues;
};

export const academyLessonProfileV2GenericShellFixtures = Object.freeze({
  q2: {
    labels: [
      "Observe and bound the need",
      "Select a concept or model",
      "Apply a check or test",
      "Interpret and retain evidence"
    ]
  },
  q3: {
    labels: [
      "Inputs, units and assumptions",
      "Method or reasoning chain",
      "Observed result and acceptance boundary",
      "A record that the page was opened"
    ]
  },
  q4: {
    acceptedConcepts: ["title-first-token", "evidence"],
    minimumConceptGroups: 2
  },
  diagram: {
    metaRoles: ["system", "application", "relationship", "failure", "decision"]
  },
  explorer: {
    modelKind: "text-only",
    renderedElementKinds: ["button", "paragraph", "definition-list"]
  }
});

export const profileUsesRejectedGenericShell = (
  profile: AcademyLessonTeachingProfileV2
): boolean => {
  const q2Labels = profile.assessments.q2.base.steps.map((step) => step.label);
  const q3Labels = profile.assessments.q3.base.options.map((option) => option.label);
  const q4 = profile.assessments.q4.base;
  const genericEntityLabels = new Set(
    academyLessonProfileV2GenericShellFixtures.diagram.metaRoles
  );
  return (
    JSON.stringify(q2Labels)
      === JSON.stringify(academyLessonProfileV2GenericShellFixtures.q2.labels)
    || JSON.stringify(q3Labels)
      === JSON.stringify(academyLessonProfileV2GenericShellFixtures.q3.labels)
    || (
      q4.kind === "short-response"
      && q4.minimumConceptGroups
        === academyLessonProfileV2GenericShellFixtures.q4.minimumConceptGroups
      && q4.conceptGroups.map((group) => group.label).every((label) =>
        academyLessonProfileV2GenericShellFixtures.q4.acceptedConcepts.includes(
          normaliseText(label)
        )
      )
    )
    || profile.entities.every((entity) =>
      genericEntityLabels.has(normaliseText(entity.label))
    )
  );
};
