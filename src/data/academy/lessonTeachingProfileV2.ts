export const ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION = 2 as const;

export type AcademyDomainTermTuple = readonly [
  termId: string,
  label: string,
  definition: string,
  boundary: string,
  firstUseStepId: string
];

export type AcademyDomainEntityType =
  | "input"
  | "state"
  | "mechanism"
  | "component"
  | "constraint"
  | "observation"
  | "criterion"
  | "decision";

export type AcademyDomainEntityTuple = readonly [
  entityId: string,
  entityType: AcademyDomainEntityType,
  label: string,
  definition: string
];

export type AcademyDomainRelationKind =
  | "causes"
  | "constrains"
  | "depends-on"
  | "feeds-back"
  | "maps"
  | "measures"
  | "compares"
  | "transforms"
  | "routes"
  | "supports"
  | "invalidates";

export type AcademyDomainDirection = "directed" | "undirected";

export type AcademyDomainCardinality =
  | "one-to-one"
  | "one-to-many"
  | "many-to-one"
  | "many-to-many";

export type AcademyDomainRelationTuple = readonly [
  relationId: string,
  relationKind: AcademyDomainRelationKind,
  fromEntityIds: readonly string[],
  toEntityIds: readonly string[],
  predicate: string,
  direction: AcademyDomainDirection,
  cardinality: AcademyDomainCardinality
];

export type AcademyDomainConditionType =
  | "assumption"
  | "boundary"
  | "criterion"
  | "operating-state";

export type AcademyDomainConditionTuple = readonly [
  conditionId: string,
  conditionType: AcademyDomainConditionType,
  statement: string,
  affectedEntityIds: readonly string[],
  affectedRelationIds: readonly string[]
];

export type AcademyFailureBoundaryTuple = readonly [
  failureId: string,
  conditionId: string,
  mechanism: string,
  observableConsequence: string,
  criterion: string,
  affectedEntityIds: readonly string[],
  affectedRelationIds: readonly string[]
];

export type AcademyConceptualStepTuple = readonly [
  stepId: string,
  statement: string,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export type AcademyCaseGivenTuple = readonly [
  givenId: string,
  label: string,
  value: string,
  unit: string | null,
  entityId: string
];

export type AcademyCaseReasoningStepTuple = readonly [
  stepId: string,
  statement: string,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyReasonedCaseSeed {
  id: string;
  kind: "example" | "counterexample";
  scenario: string;
  changedConditionIds: readonly string[];
  givens: readonly AcademyCaseGivenTuple[];
  reasoningSteps: readonly AcademyCaseReasoningStepTuple[];
  outcome: string;
  criterionConditionId: string;
  criterion: string;
  verification: string;
}

export interface AcademyMisconceptionSeed {
  id: string;
  claim: string;
  mechanism: string;
  correction: string;
  disconfirmingObservation: string;
  entityIds: readonly string[];
  relationIds: readonly string[];
  conditionIds: readonly string[];
}

export interface AcademyQuestionFeedbackSeed {
  feedbackCorrect: string;
  feedbackIncorrect: string;
  hints: readonly string[];
  solution: readonly string[];
}

export type AcademyOrderingStepTuple = readonly [
  stepId: string,
  label: string,
  explanation: string,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyOrderingScenarioSeed extends AcademyQuestionFeedbackSeed {
  prompt: string;
  contextConditionIds: readonly string[];
  steps: readonly AcademyOrderingStepTuple[];
  correctOrder: readonly string[];
}

export type AcademySelectionOptionTuple = readonly [
  optionId: string,
  label: string,
  isCorrect: boolean,
  explanation: string,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[],
  misconceptionId: string | null
];

export interface AcademySelectionScenarioSeed extends AcademyQuestionFeedbackSeed {
  prompt: string;
  contextConditionIds: readonly string[];
  options: readonly AcademySelectionOptionTuple[];
}

export type AcademyConceptGroupTuple = readonly [
  conceptId: string,
  label: string,
  acceptedPhrases: readonly string[],
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyShortResponseScenarioSeed extends AcademyQuestionFeedbackSeed {
  kind: "short-response";
  prompt: string;
  contextConditionIds: readonly string[];
  conceptGroups: readonly AcademyConceptGroupTuple[];
  minimumConceptGroups: number;
  requiredRelationIds: readonly string[];
  criterionConditionId: string;
  exemplarResponse: string;
}

export type AcademyMatchingPairTuple = readonly [
  pairId: string,
  leftLabel: string,
  rightLabel: string,
  explanation: string,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
];

export interface AcademyMatchingScenarioSeed extends AcademyQuestionFeedbackSeed {
  kind: "matching";
  prompt: string;
  contextConditionIds: readonly string[];
  pairs: readonly AcademyMatchingPairTuple[];
}

export type AcademyQ4ScenarioSeed =
  | AcademyShortResponseScenarioSeed
  | AcademyMatchingScenarioSeed;

export type AcademyDiagramPositionTuple = readonly [
  entityId: string,
  column: number,
  row: number
];

export type AcademyDiagramOptionTuple = readonly [
  optionId: string,
  label: string,
  isCorrect: boolean,
  reasoning: string,
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[],
  misconceptionId: string | null
];

export interface AcademyDiagramScenarioSeed extends AcademyQuestionFeedbackSeed {
  kind: "diagram";
  prompt: string;
  contextConditionIds: readonly string[];
  positions: readonly AcademyDiagramPositionTuple[];
  relationIds: readonly string[];
  answerRelationIds: readonly string[];
  options: readonly AcademyDiagramOptionTuple[];
  textEquivalent: string;
}

export interface AcademyCodeScenarioSeed extends AcademyQuestionFeedbackSeed {
  kind: "code-analysis";
  prompt: string;
  contextConditionIds: readonly string[];
  language: string;
  code: string;
  options: readonly AcademyDiagramOptionTuple[];
}

export type AcademyQ5ScenarioSeed =
  | AcademyDiagramScenarioSeed
  | AcademyCodeScenarioSeed;

export interface AcademyAssessmentBindingsSeed {
  q2: {
    base: AcademyOrderingScenarioSeed;
    retry: AcademyOrderingScenarioSeed;
  };
  q3: {
    base: AcademySelectionScenarioSeed;
    retry: AcademySelectionScenarioSeed;
  };
  q4: {
    base: AcademyQ4ScenarioSeed;
    retry: AcademyQ4ScenarioSeed;
  };
  q5: {
    base: AcademyQ5ScenarioSeed;
    retry: AcademyQ5ScenarioSeed;
  };
}

export type AcademyExplorerAnnotationTuple = readonly [
  annotationId: string,
  label: string,
  entityIds: readonly string[],
  relationIds: readonly string[]
];

export interface AcademyExplorerGraphStateSeed {
  kind: "causal-graph" | "state-graph";
  positions: readonly AcademyDiagramPositionTuple[];
  visibleEntityIds: readonly string[];
  visibleRelationIds: readonly string[];
  activeEntityIds: readonly string[];
  activeRelationIds: readonly string[];
  suppressedRelationIds: readonly string[];
  reversedRelationIds: readonly string[];
  annotations: readonly AcademyExplorerAnnotationTuple[];
}

export type AcademyExplorerAxisTuple = readonly [
  axisId: string,
  label: string,
  unit: string | null,
  entityId: string
];

export type AcademyExplorerPointTuple = readonly [
  pointId: string,
  x: number,
  y: number,
  label: string,
  conditionIds: readonly string[]
];

export interface AcademyExplorerParameterSweepStateSeed {
  kind: "parameter-sweep";
  axes: readonly [AcademyExplorerAxisTuple, AcademyExplorerAxisTuple];
  points: readonly AcademyExplorerPointTuple[];
  highlightedPointId: string;
  verification: string;
}

export type AcademyExplorerGeometryPointTuple = readonly [
  pointId: string,
  label: string,
  x: number,
  y: number,
  entityId: string
];

export type AcademyExplorerGeometrySegmentTuple = readonly [
  segmentId: string,
  fromPointId: string,
  toPointId: string,
  relationId: string
];

export interface AcademyExplorerGeometryStateSeed {
  kind: "geometry-transform";
  frameEntityId: string;
  points: readonly AcademyExplorerGeometryPointTuple[];
  segments: readonly AcademyExplorerGeometrySegmentTuple[];
  verification: string;
}

export type AcademyExplorerMatrixCellState =
  | "supported"
  | "contradicted"
  | "not-observed"
  | "outside-boundary";

export type AcademyExplorerMatrixCellTuple = readonly [
  entityId: string,
  conditionId: string,
  state: AcademyExplorerMatrixCellState,
  label: string
];

export interface AcademyExplorerComparisonMatrixStateSeed {
  kind: "comparison-matrix";
  rowEntityIds: readonly string[];
  columnConditionIds: readonly string[];
  cells: readonly AcademyExplorerMatrixCellTuple[];
}

export type AcademyExplorerStateSeed =
  | AcademyExplorerGraphStateSeed
  | AcademyExplorerParameterSweepStateSeed
  | AcademyExplorerGeometryStateSeed
  | AcademyExplorerComparisonMatrixStateSeed;

export interface AcademyExplorerControlSeed {
  id: string;
  label: string;
  changedConditionIds: readonly string[];
  state: AcademyExplorerStateSeed;
  outcome: string;
  requiredAction: string;
  retainedEvidence: string;
  textEquivalent: string;
}

export interface AcademyExplorerSeed {
  title: string;
  description: string;
  modelKind: AcademyExplorerStateSeed["kind"];
  controls: readonly AcademyExplorerControlSeed[];
}

export interface AcademyLessonTeachingProfileV2Seed {
  schemaVersion: typeof ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION;
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
  assessments: AcademyAssessmentBindingsSeed;
  explorer: AcademyExplorerSeed;
}

export interface AcademyDomainTerm {
  termId: string;
  label: string;
  definition: string;
  boundary: string;
  firstUseStepId: string;
}

export interface AcademyDomainEntity {
  entityId: string;
  entityType: AcademyDomainEntityType;
  label: string;
  definition: string;
}

export interface AcademyDomainRelation {
  relationId: string;
  relationKind: AcademyDomainRelationKind;
  fromEntityIds: string[];
  toEntityIds: string[];
  predicate: string;
  direction: AcademyDomainDirection;
  cardinality: AcademyDomainCardinality;
}

export interface AcademyDomainCondition {
  conditionId: string;
  conditionType: AcademyDomainConditionType;
  statement: string;
  affectedEntityIds: string[];
  affectedRelationIds: string[];
}

export interface AcademyFailureBoundary {
  failureId: string;
  conditionId: string;
  mechanism: string;
  observableConsequence: string;
  criterion: string;
  affectedEntityIds: string[];
  affectedRelationIds: string[];
}

export interface AcademyConceptualStep {
  stepId: string;
  statement: string;
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
}

export interface AcademyCaseGiven {
  givenId: string;
  label: string;
  value: string;
  unit: string | null;
  entityId: string;
}

export interface AcademyCaseReasoningStep {
  stepId: string;
  statement: string;
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
}

export interface AcademyReasonedCase {
  id: string;
  kind: "example" | "counterexample";
  scenario: string;
  changedConditionIds: string[];
  givens: AcademyCaseGiven[];
  reasoningSteps: AcademyCaseReasoningStep[];
  outcome: string;
  criterionConditionId: string;
  criterion: string;
  verification: string;
}

export interface AcademyMisconception {
  id: string;
  claim: string;
  mechanism: string;
  correction: string;
  disconfirmingObservation: string;
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
}

export interface AcademyOrderingStep {
  stepId: string;
  label: string;
  explanation: string;
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
}

export interface AcademySelectionOption {
  optionId: string;
  label: string;
  isCorrect: boolean;
  explanation: string;
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
  misconceptionId: string | null;
}

export interface AcademyConceptGroup {
  conceptId: string;
  label: string;
  acceptedPhrases: string[];
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
}

export interface AcademyMatchingPair {
  pairId: string;
  leftLabel: string;
  rightLabel: string;
  explanation: string;
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
}

export interface AcademyDiagramPosition {
  entityId: string;
  column: number;
  row: number;
}

export interface AcademyDiagramOption {
  optionId: string;
  label: string;
  isCorrect: boolean;
  reasoning: string;
  entityIds: string[];
  relationIds: string[];
  conditionIds: string[];
  misconceptionId: string | null;
}

export interface AcademyQuestionFeedback {
  feedbackCorrect: string;
  feedbackIncorrect: string;
  hints: string[];
  solution: string[];
}

export interface AcademyOrderingScenario extends AcademyQuestionFeedback {
  prompt: string;
  contextConditionIds: string[];
  steps: AcademyOrderingStep[];
  correctOrder: string[];
}

export interface AcademySelectionScenario extends AcademyQuestionFeedback {
  prompt: string;
  contextConditionIds: string[];
  options: AcademySelectionOption[];
}

export interface AcademyShortResponseScenario extends AcademyQuestionFeedback {
  kind: "short-response";
  prompt: string;
  contextConditionIds: string[];
  conceptGroups: AcademyConceptGroup[];
  minimumConceptGroups: number;
  requiredRelationIds: string[];
  criterionConditionId: string;
  exemplarResponse: string;
}

export interface AcademyMatchingScenario extends AcademyQuestionFeedback {
  kind: "matching";
  prompt: string;
  contextConditionIds: string[];
  pairs: AcademyMatchingPair[];
}

export type AcademyQ4Scenario =
  | AcademyShortResponseScenario
  | AcademyMatchingScenario;

export interface AcademyDiagramScenario extends AcademyQuestionFeedback {
  kind: "diagram";
  prompt: string;
  contextConditionIds: string[];
  positions: AcademyDiagramPosition[];
  relationIds: string[];
  answerRelationIds: string[];
  options: AcademyDiagramOption[];
  textEquivalent: string;
}

export interface AcademyCodeScenario extends AcademyQuestionFeedback {
  kind: "code-analysis";
  prompt: string;
  contextConditionIds: string[];
  language: string;
  code: string;
  options: AcademyDiagramOption[];
}

export type AcademyQ5Scenario = AcademyDiagramScenario | AcademyCodeScenario;

export interface AcademyAssessmentBindings {
  q2: {
    base: AcademyOrderingScenario;
    retry: AcademyOrderingScenario;
  };
  q3: {
    base: AcademySelectionScenario;
    retry: AcademySelectionScenario;
  };
  q4: {
    base: AcademyQ4Scenario;
    retry: AcademyQ4Scenario;
  };
  q5: {
    base: AcademyQ5Scenario;
    retry: AcademyQ5Scenario;
  };
}

export interface AcademyExplorerAnnotation {
  annotationId: string;
  label: string;
  entityIds: string[];
  relationIds: string[];
}

export interface AcademyExplorerAxis {
  axisId: string;
  label: string;
  unit: string | null;
  entityId: string;
}

export interface AcademyExplorerPoint {
  pointId: string;
  x: number;
  y: number;
  label: string;
  conditionIds: string[];
}

export interface AcademyExplorerGeometryPoint {
  pointId: string;
  label: string;
  x: number;
  y: number;
  entityId: string;
}

export interface AcademyExplorerGeometrySegment {
  segmentId: string;
  fromPointId: string;
  toPointId: string;
  relationId: string;
}

export interface AcademyExplorerMatrixCell {
  entityId: string;
  conditionId: string;
  state: AcademyExplorerMatrixCellState;
  label: string;
}

export interface AcademyExplorerGraphState {
  kind: "causal-graph" | "state-graph";
  positions: AcademyDiagramPosition[];
  visibleEntityIds: string[];
  visibleRelationIds: string[];
  activeEntityIds: string[];
  activeRelationIds: string[];
  suppressedRelationIds: string[];
  reversedRelationIds: string[];
  annotations: AcademyExplorerAnnotation[];
}

export interface AcademyExplorerParameterSweepState {
  kind: "parameter-sweep";
  axes: [AcademyExplorerAxis, AcademyExplorerAxis];
  points: AcademyExplorerPoint[];
  highlightedPointId: string;
  verification: string;
}

export interface AcademyExplorerGeometryState {
  kind: "geometry-transform";
  frameEntityId: string;
  points: AcademyExplorerGeometryPoint[];
  segments: AcademyExplorerGeometrySegment[];
  verification: string;
}

export interface AcademyExplorerComparisonMatrixState {
  kind: "comparison-matrix";
  rowEntityIds: string[];
  columnConditionIds: string[];
  cells: AcademyExplorerMatrixCell[];
}

export type AcademyExplorerState =
  | AcademyExplorerGraphState
  | AcademyExplorerParameterSweepState
  | AcademyExplorerGeometryState
  | AcademyExplorerComparisonMatrixState;

export interface AcademyExplorerControl {
  id: string;
  label: string;
  changedConditionIds: string[];
  state: AcademyExplorerState;
  outcome: string;
  requiredAction: string;
  retainedEvidence: string;
  textEquivalent: string;
}

export interface AcademyLessonTeachingProfileV2 {
  schemaVersion: typeof ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION;
  lessonId: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: AcademyDomainTerm[];
  entities: AcademyDomainEntity[];
  relations: AcademyDomainRelation[];
  conditions: AcademyDomainCondition[];
  failureBoundary: AcademyFailureBoundary;
  conceptualModel: AcademyConceptualStep[];
  reasonedCases: AcademyReasonedCase[];
  misconception: AcademyMisconception;
  assessments: AcademyAssessmentBindings;
  explorer: Omit<AcademyExplorerSeed, "controls"> & {
    controls: AcademyExplorerControl[];
  };
}

const copyStrings = (values: readonly string[]): string[] => [...values];

const expandReferences = (
  entityIds: readonly string[],
  relationIds: readonly string[],
  conditionIds: readonly string[]
) => ({
  entityIds: copyStrings(entityIds),
  relationIds: copyStrings(relationIds),
  conditionIds: copyStrings(conditionIds)
});

const expandDiagramOption = (
  option: AcademyDiagramOptionTuple
): AcademyDiagramOption => ({
  optionId: option[0],
  label: option[1],
  isCorrect: option[2],
  reasoning: option[3],
  ...expandReferences(option[4], option[5], option[6]),
  misconceptionId: option[7]
});

const expandFeedback = (
  feedback: AcademyQuestionFeedbackSeed
): AcademyQuestionFeedback => ({
  feedbackCorrect: feedback.feedbackCorrect,
  feedbackIncorrect: feedback.feedbackIncorrect,
  hints: copyStrings(feedback.hints),
  solution: copyStrings(feedback.solution)
});

const expandOrderingScenario = (
  scenario: AcademyOrderingScenarioSeed
): AcademyOrderingScenario => ({
  prompt: scenario.prompt,
  contextConditionIds: copyStrings(scenario.contextConditionIds),
  steps: scenario.steps.map(
    ([stepId, label, explanation, entityIds, relationIds, conditionIds]) => ({
      stepId,
      label,
      explanation,
      ...expandReferences(entityIds, relationIds, conditionIds)
    })
  ),
  correctOrder: copyStrings(scenario.correctOrder),
  ...expandFeedback(scenario)
});

const expandSelectionScenario = (
  scenario: AcademySelectionScenarioSeed
): AcademySelectionScenario => ({
  prompt: scenario.prompt,
  contextConditionIds: copyStrings(scenario.contextConditionIds),
  options: scenario.options.map(
    ([
      optionId,
      label,
      isCorrect,
      explanation,
      entityIds,
      relationIds,
      conditionIds,
      misconceptionId
    ]) => ({
      optionId,
      label,
      isCorrect,
      explanation,
      misconceptionId,
      ...expandReferences(entityIds, relationIds, conditionIds)
    })
  ),
  ...expandFeedback(scenario)
});

const expandQ4Scenario = (
  scenario: AcademyQ4ScenarioSeed
): AcademyQ4Scenario => {
  if (scenario.kind === "matching") {
    return {
      kind: "matching",
      prompt: scenario.prompt,
      contextConditionIds: copyStrings(scenario.contextConditionIds),
      pairs: scenario.pairs.map(
        ([
          pairId,
          leftLabel,
          rightLabel,
          explanation,
          entityIds,
          relationIds,
          conditionIds
        ]) => ({
          pairId,
          leftLabel,
          rightLabel,
          explanation,
          ...expandReferences(entityIds, relationIds, conditionIds)
        })
      ),
      ...expandFeedback(scenario)
    };
  }
  return {
    kind: "short-response",
    prompt: scenario.prompt,
    contextConditionIds: copyStrings(scenario.contextConditionIds),
    conceptGroups: scenario.conceptGroups.map(
      ([
        conceptId,
        label,
        acceptedPhrases,
        entityIds,
        relationIds,
        conditionIds
      ]) => ({
        conceptId,
        label,
        acceptedPhrases: copyStrings(acceptedPhrases),
        ...expandReferences(entityIds, relationIds, conditionIds)
      })
    ),
    minimumConceptGroups: scenario.minimumConceptGroups,
    requiredRelationIds: copyStrings(scenario.requiredRelationIds),
    criterionConditionId: scenario.criterionConditionId,
    exemplarResponse: scenario.exemplarResponse,
    ...expandFeedback(scenario)
  };
};

const expandQ5Scenario = (
  scenario: AcademyQ5ScenarioSeed
): AcademyQ5Scenario => {
  const common = {
    kind: scenario.kind,
    prompt: scenario.prompt,
    contextConditionIds: copyStrings(scenario.contextConditionIds),
    options: scenario.options.map(expandDiagramOption),
    ...expandFeedback(scenario)
  };
  if (scenario.kind === "code-analysis") {
    return {
      ...common,
      kind: "code-analysis",
      language: scenario.language,
      code: scenario.code
    };
  }
  return {
    ...common,
    kind: "diagram",
    positions: scenario.positions.map(([entityId, column, row]) => ({
      entityId,
      column,
      row
    })),
    relationIds: copyStrings(scenario.relationIds),
    answerRelationIds: copyStrings(scenario.answerRelationIds),
    textEquivalent: scenario.textEquivalent
  };
};

const expandExplorerState = (
  state: AcademyExplorerStateSeed
): AcademyExplorerState => {
  switch (state.kind) {
    case "causal-graph":
    case "state-graph":
      return {
        ...state,
        positions: state.positions.map(([entityId, column, row]) => ({
          entityId,
          column,
          row
        })),
        visibleEntityIds: copyStrings(state.visibleEntityIds),
        visibleRelationIds: copyStrings(state.visibleRelationIds),
        activeEntityIds: copyStrings(state.activeEntityIds),
        activeRelationIds: copyStrings(state.activeRelationIds),
        suppressedRelationIds: copyStrings(state.suppressedRelationIds),
        reversedRelationIds: copyStrings(state.reversedRelationIds),
        annotations: state.annotations.map(
          ([annotationId, label, entityIds, relationIds]) => ({
            annotationId,
            label,
            entityIds: copyStrings(entityIds),
            relationIds: copyStrings(relationIds)
          })
        )
      };
    case "parameter-sweep":
      return {
        ...state,
        axes: state.axes.map(([axisId, label, unit, entityId]) => ({
          axisId,
          label,
          unit,
          entityId
        })) as [AcademyExplorerAxis, AcademyExplorerAxis],
        points: state.points.map(
          ([pointId, x, y, label, conditionIds]) => ({
            pointId,
            x,
            y,
            label,
            conditionIds: copyStrings(conditionIds)
          })
        )
      };
    case "geometry-transform":
      return {
        ...state,
        points: state.points.map(([pointId, label, x, y, entityId]) => ({
          pointId,
          label,
          x,
          y,
          entityId
        })),
        segments: state.segments.map(
          ([segmentId, fromPointId, toPointId, relationId]) => ({
            segmentId,
            fromPointId,
            toPointId,
            relationId
          })
        )
      };
    case "comparison-matrix":
      return {
        ...state,
        rowEntityIds: copyStrings(state.rowEntityIds),
        columnConditionIds: copyStrings(state.columnConditionIds),
        cells: state.cells.map(([entityId, conditionId, cellState, label]) => ({
          entityId,
          conditionId,
          state: cellState,
          label
        }))
      };
  }
};

export const expandAcademyLessonTeachingProfileV2SeedUnchecked = (
  seed: AcademyLessonTeachingProfileV2Seed
): AcademyLessonTeachingProfileV2 => ({
  schemaVersion: seed.schemaVersion,
  lessonId: seed.lessonId,
  systemModel: seed.systemModel,
  failurePattern: seed.failurePattern,
  visualExplanation: seed.visualExplanation,
  applicationTask: seed.applicationTask,
  terms: seed.terms.map(
    ([termId, label, definition, boundary, firstUseStepId]) => ({
      termId,
      label,
      definition,
      boundary,
      firstUseStepId
    })
  ),
  entities: seed.entities.map(
    ([entityId, entityType, label, definition]) => ({
      entityId,
      entityType,
      label,
      definition
    })
  ),
  relations: seed.relations.map(
    ([
      relationId,
      relationKind,
      fromEntityIds,
      toEntityIds,
      predicate,
      direction,
      cardinality
    ]) => ({
      relationId,
      relationKind,
      fromEntityIds: copyStrings(fromEntityIds),
      toEntityIds: copyStrings(toEntityIds),
      predicate,
      direction,
      cardinality
    })
  ),
  conditions: seed.conditions.map(
    ([
      conditionId,
      conditionType,
      statement,
      affectedEntityIds,
      affectedRelationIds
    ]) => ({
      conditionId,
      conditionType,
      statement,
      affectedEntityIds: copyStrings(affectedEntityIds),
      affectedRelationIds: copyStrings(affectedRelationIds)
    })
  ),
  failureBoundary: {
    failureId: seed.failureBoundary[0],
    conditionId: seed.failureBoundary[1],
    mechanism: seed.failureBoundary[2],
    observableConsequence: seed.failureBoundary[3],
    criterion: seed.failureBoundary[4],
    affectedEntityIds: copyStrings(seed.failureBoundary[5]),
    affectedRelationIds: copyStrings(seed.failureBoundary[6])
  },
  conceptualModel: seed.conceptualModel.map(
    ([stepId, statement, entityIds, relationIds, conditionIds]) => ({
      stepId,
      statement,
      ...expandReferences(entityIds, relationIds, conditionIds)
    })
  ),
  reasonedCases: seed.reasonedCases.map((reasonedCase) => ({
    ...reasonedCase,
    changedConditionIds: copyStrings(reasonedCase.changedConditionIds),
    givens: reasonedCase.givens.map(
      ([givenId, label, value, unit, entityId]) => ({
        givenId,
        label,
        value,
        unit,
        entityId
      })
    ),
    reasoningSteps: reasonedCase.reasoningSteps.map(
      ([stepId, statement, entityIds, relationIds, conditionIds]) => ({
        stepId,
        statement,
        ...expandReferences(entityIds, relationIds, conditionIds)
      })
    )
  })),
  misconception: {
    ...seed.misconception,
    ...expandReferences(
      seed.misconception.entityIds,
      seed.misconception.relationIds,
      seed.misconception.conditionIds
    )
  },
  assessments: {
    q2: {
      base: expandOrderingScenario(seed.assessments.q2.base),
      retry: expandOrderingScenario(seed.assessments.q2.retry)
    },
    q3: {
      base: expandSelectionScenario(seed.assessments.q3.base),
      retry: expandSelectionScenario(seed.assessments.q3.retry)
    },
    q4: {
      base: expandQ4Scenario(seed.assessments.q4.base),
      retry: expandQ4Scenario(seed.assessments.q4.retry)
    },
    q5: {
      base: expandQ5Scenario(seed.assessments.q5.base),
      retry: expandQ5Scenario(seed.assessments.q5.retry)
    }
  },
  explorer: {
    title: seed.explorer.title,
    description: seed.explorer.description,
    modelKind: seed.explorer.modelKind,
    controls: seed.explorer.controls.map((control) => ({
      ...control,
      changedConditionIds: copyStrings(control.changedConditionIds),
      state: expandExplorerState(control.state)
    }))
  }
});

export type AcademyLessonTeachingProfileV2Registry = Readonly<
  Record<string, AcademyLessonTeachingProfileV2>
>;
