import type {
  AcademyDiagramScenario,
  AcademyDomainCondition,
  AcademyDomainRelation,
  AcademyLessonTeachingProfileV2,
  AcademyMatchingScenario,
  AcademyOrderingScenario,
  AcademyQ5Scenario,
  AcademySelectionScenario,
  AcademyShortResponseScenario
} from "../../data/academy/lessonTeachingProfileV2";
import { gradeQuestion, type GradeResult } from "./assessment";
import type {
  CodeAnalysisQuestion,
  DiagramQuestion,
  MatchingQuestion,
  MultipleSelectionQuestion,
  OrderingQuestion
} from "./types";

export type AcademyLessonV2QuestionKey = "q2" | "q3" | "q4" | "q5";
export type AcademyLessonV2ScenarioMode = "base" | "retry";

export interface AcademyLessonV2QuestionIdentity {
  lessonId: string;
  assessmentId: string;
  questionKey: AcademyLessonV2QuestionKey;
  questionId: string;
  scenarioMode: AcademyLessonV2ScenarioMode;
  retryIndex: 0 | 1;
}

const normaliseIdPart = (value: string): string =>
  value.trim().replace(/[^A-Za-z0-9_.:-]+/gu, "-");

const normaliseResponse = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en-AU")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");

const containsPhrase = (response: string, phrase: string): boolean => {
  const normalisedPhrase = normaliseResponse(phrase);
  return normalisedPhrase !== "" && response.includes(normalisedPhrase);
};

const roundScore = (value: number): number =>
  Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;

const stableSeed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const academyLessonV2AssessmentId = (lessonId: string): string =>
  `${normaliseIdPart(lessonId)}-V2-ASSESSMENT`;

export const academyLessonV2QuestionId = (
  lessonId: string,
  questionKey: AcademyLessonV2QuestionKey,
  scenarioMode: AcademyLessonV2ScenarioMode
): string =>
  `${normaliseIdPart(lessonId)}-V2-${questionKey.toLocaleUpperCase("en-AU")}-${
    scenarioMode.toLocaleUpperCase("en-AU")
  }`;

export const academyLessonV2MatchingRightId = (pairId: string): string =>
  `${normaliseIdPart(pairId)}-RIGHT`;

export const academyLessonV2ScenarioPrompt = (
  questionLabel: string,
  prompt: string,
  contextConditionIds: readonly string[],
  conditions: readonly AcademyDomainCondition[]
): string => {
  const statements = contextConditionIds.map(
    (conditionId) =>
      conditions.find((condition) => condition.conditionId === conditionId)
        ?.statement ?? conditionId
  );
  const context = statements.length > 0
    ? ` Case conditions: ${statements
      .map((statement) => statement.trim().replace(/[.;:!?]+$/u, ""))
      .join("; ")}.`
    : "";
  return `${questionLabel}. ${prompt}${context}`;
};

const misconceptionFeedback = (
  entries: readonly [string, string][]
): Record<string, string> =>
  Object.fromEntries(entries.filter(([, explanation]) => explanation.trim() !== ""));

export const buildAcademyLessonV2OrderingQuestion = (
  scenario: AcademyOrderingScenario,
  identity: AcademyLessonV2QuestionIdentity,
  conditions: readonly AcademyDomainCondition[]
): OrderingQuestion => ({
  id: identity.questionId,
  type: "ordering",
  skillIds: [identity.lessonId],
  prompt: academyLessonV2ScenarioPrompt(
    "Q2 - Put the mechanism in order",
    scenario.prompt,
    scenario.contextConditionIds,
    conditions
  ),
  feedbackCorrect: scenario.feedbackCorrect,
  feedbackIncorrect: scenario.feedbackIncorrect,
  misconceptionFeedback: misconceptionFeedback(
    scenario.steps.map((step) => [step.stepId, step.explanation])
  ),
  hints: [...scenario.hints],
  solution: [...scenario.solution],
  variantSeed: stableSeed(identity.questionId),
  items: scenario.steps.map((step) => ({
    id: step.stepId,
    label: step.label
  })),
  correctOrder: [...scenario.correctOrder]
});

export const buildAcademyLessonV2SelectionQuestion = (
  scenario: AcademySelectionScenario,
  identity: AcademyLessonV2QuestionIdentity,
  conditions: readonly AcademyDomainCondition[]
): MultipleSelectionQuestion => ({
  id: identity.questionId,
  type: "multiple-selection",
  skillIds: [identity.lessonId],
  prompt: academyLessonV2ScenarioPrompt(
    "Q3 - Select every supported claim",
    scenario.prompt,
    scenario.contextConditionIds,
    conditions
  ),
  feedbackCorrect: scenario.feedbackCorrect,
  feedbackIncorrect: scenario.feedbackIncorrect,
  misconceptionFeedback: misconceptionFeedback(
    scenario.options.map((option) => [option.optionId, option.explanation])
  ),
  hints: [...scenario.hints],
  solution: [...scenario.solution],
  variantSeed: stableSeed(identity.questionId),
  options: scenario.options.map((option) => ({
    id: option.optionId,
    label: option.label
  })),
  correctOptionIds: scenario.options
    .filter((option) => option.isCorrect)
    .map((option) => option.optionId)
});

export const buildAcademyLessonV2MatchingQuestion = (
  scenario: AcademyMatchingScenario,
  identity: AcademyLessonV2QuestionIdentity,
  conditions: readonly AcademyDomainCondition[]
): MatchingQuestion => ({
  id: identity.questionId,
  type: "matching",
  skillIds: [identity.lessonId],
  prompt: academyLessonV2ScenarioPrompt(
    "Q4 - Match each relationship",
    scenario.prompt,
    scenario.contextConditionIds,
    conditions
  ),
  feedbackCorrect: scenario.feedbackCorrect,
  feedbackIncorrect: scenario.feedbackIncorrect,
  misconceptionFeedback: misconceptionFeedback(
    scenario.pairs.map((pair) => [pair.pairId, pair.explanation])
  ),
  hints: [...scenario.hints],
  solution: [...scenario.solution],
  variantSeed: stableSeed(identity.questionId),
  left: scenario.pairs.map((pair) => ({
    id: pair.pairId,
    label: pair.leftLabel
  })),
  right: scenario.pairs.map((pair) => ({
    id: academyLessonV2MatchingRightId(pair.pairId),
    label: pair.rightLabel
  })),
  correctPairs: Object.fromEntries(
    scenario.pairs.map((pair) => [
      pair.pairId,
      academyLessonV2MatchingRightId(pair.pairId)
    ])
  )
});

export const buildAcademyLessonV2DiagramQuestion = (
  scenario: AcademyDiagramScenario,
  identity: AcademyLessonV2QuestionIdentity,
  profile: AcademyLessonTeachingProfileV2
): DiagramQuestion => {
  const visibleEntityIds = new Set(
    scenario.positions.map((position) => position.entityId)
  );
  const nodes = scenario.positions.map((position) => {
    const entity = profile.entities.find(
      (candidate) => candidate.entityId === position.entityId
    );
    return {
      id: position.entityId,
      label: entity?.label ?? position.entityId,
      detail: entity?.definition ?? "Authored lesson entity.",
      role: entity?.entityType === "decision"
        ? "decision" as const
        : entity?.entityType === "criterion"
          || entity?.entityType === "constraint"
          ? "failure" as const
          : "system" as const
    };
  });
  const edges = scenario.relationIds.flatMap((relationId) => {
    const relation = profile.relations.find(
      (candidate) => candidate.relationId === relationId
    );
    if (!relation) return [];
    return relation.fromEntityIds.flatMap((fromEntityId) =>
      relation.toEntityIds
        .filter(
          (toEntityId) =>
            visibleEntityIds.has(fromEntityId)
            && visibleEntityIds.has(toEntityId)
        )
        .map((toEntityId, index) => ({
          id: `${relationId}-${fromEntityId}-${toEntityId}-${index}`,
          fromNodeId: fromEntityId,
          toNodeId: toEntityId,
          label: relation.predicate,
          direction: relation.direction
        }))
    );
  });
  const answerEdge = edges.find((edge) =>
    scenario.answerRelationIds.some((relationId) =>
      edge.id.startsWith(`${relationId}-`)
    )
  ) ?? edges[0];
  return {
    id: identity.questionId,
    type: "diagram",
    skillIds: [identity.lessonId],
    prompt: academyLessonV2ScenarioPrompt(
      "Q5 - Interpret the represented mechanism",
      scenario.prompt,
      scenario.contextConditionIds,
      profile.conditions
    ),
    feedbackCorrect: scenario.feedbackCorrect,
    feedbackIncorrect: scenario.feedbackIncorrect,
    misconceptionFeedback: misconceptionFeedback(
      scenario.options.map((option) => [option.optionId, option.reasoning])
    ),
    hints: [...scenario.hints],
    solution: [...scenario.solution],
    variantSeed: stableSeed(identity.questionId),
    diagramDescription: scenario.textEquivalent,
    diagram: {
      layout: "chain",
      nodes,
      edges,
      answerEdgeId: answerEdge?.id ?? ""
    },
    options: scenario.options.map((option) => ({
      id: option.optionId,
      label: option.label
    })),
    correctOptionId:
      scenario.options.find((option) => option.isCorrect)?.optionId ?? ""
  };
};

export const buildAcademyLessonV2CodeQuestion = (
  scenario: Extract<AcademyQ5Scenario, { kind: "code-analysis" }>,
  identity: AcademyLessonV2QuestionIdentity,
  profile: AcademyLessonTeachingProfileV2
): CodeAnalysisQuestion => ({
  id: identity.questionId,
  type: "code-analysis",
  skillIds: [identity.lessonId],
  prompt: academyLessonV2ScenarioPrompt(
    "Q5 - Interpret the represented mechanism",
    scenario.prompt,
    scenario.contextConditionIds,
    profile.conditions
  ),
  feedbackCorrect: scenario.feedbackCorrect,
  feedbackIncorrect: scenario.feedbackIncorrect,
  misconceptionFeedback: misconceptionFeedback(
    scenario.options.map((option) => [option.optionId, option.reasoning])
  ),
  hints: [...scenario.hints],
  solution: [...scenario.solution],
  variantSeed: stableSeed(identity.questionId),
  language: scenario.language,
  code: scenario.code,
  options: scenario.options.map((option) => ({
    id: option.optionId,
    label: option.label
  })),
  correctOptionId:
    scenario.options.find((option) => option.isCorrect)?.optionId ?? ""
});

export const gradeAcademyLessonV2Ordering = (
  scenario: AcademyOrderingScenario,
  order: readonly string[],
  identity: AcademyLessonV2QuestionIdentity,
  conditions: readonly AcademyDomainCondition[]
): GradeResult =>
  gradeQuestion(
    buildAcademyLessonV2OrderingQuestion(scenario, identity, conditions),
    { type: "ordering", itemIds: [...order] }
  );

export const gradeAcademyLessonV2Selection = (
  scenario: AcademySelectionScenario,
  selectedOptionIds: ReadonlySet<string>,
  identity: AcademyLessonV2QuestionIdentity,
  conditions: readonly AcademyDomainCondition[]
): GradeResult =>
  gradeQuestion(
    buildAcademyLessonV2SelectionQuestion(scenario, identity, conditions),
    { type: "multiple-selection", optionIds: [...selectedOptionIds] }
  );

export interface AcademyLessonV2ShortResponseGrade extends GradeResult {
  matchedConceptGroupIds: string[];
  missingRelationIds: string[];
  criterionMatched: boolean;
}

export const gradeAcademyLessonV2ShortResponse = (
  scenario: AcademyShortResponseScenario,
  response: string,
  identity: AcademyLessonV2QuestionIdentity,
  relations: readonly AcademyDomainRelation[],
  conditions: readonly AcademyDomainCondition[]
): AcademyLessonV2ShortResponseGrade => {
  const normalised = normaliseResponse(response);
  const matchedConceptGroups = scenario.conceptGroups.filter((group) =>
    group.acceptedPhrases.some((phrase) => containsPhrase(normalised, phrase))
  );
  const missingRelationIds = scenario.requiredRelationIds.filter((relationId) => {
    const predicate = relations.find(
      (relation) => relation.relationId === relationId
    )?.predicate;
    return predicate === undefined || !containsPhrase(normalised, predicate);
  });
  const criterion = conditions.find(
    (condition) => condition.conditionId === scenario.criterionConditionId
  )?.statement;
  const criterionMatched =
    criterion !== undefined && containsPhrase(normalised, criterion);
  const conceptRequirementMet =
    matchedConceptGroups.length >= scenario.minimumConceptGroups;
  const isCorrect =
    conceptRequirementMet
    && missingRelationIds.length === 0
    && criterionMatched;
  const totalChecks =
    scenario.minimumConceptGroups + scenario.requiredRelationIds.length + 1;
  const passedChecks =
    Math.min(matchedConceptGroups.length, scenario.minimumConceptGroups)
    + scenario.requiredRelationIds.length
    - missingRelationIds.length
    + (criterionMatched ? 1 : 0);
  const details: string[] = [];
  if (!conceptRequirementMet) {
    details.push(
      `The response covers ${matchedConceptGroups.length} of the required ${
        scenario.minimumConceptGroups
      } concept groups.`
    );
  }
  if (missingRelationIds.length > 0) {
    const labels = missingRelationIds.map(
      (relationId) =>
        relations.find((relation) => relation.relationId === relationId)
          ?.predicate ?? relationId
    );
    details.push(`State the required relationship: ${labels.join("; ")}.`);
  }
  if (!criterionMatched) {
    details.push(
      `Apply the declared decision criterion: ${
        criterion ?? scenario.criterionConditionId
      }.`
    );
  }
  return {
    questionId: identity.questionId,
    questionType: "short-response",
    isCorrect,
    scorePercent: roundScore((passedChecks / totalChecks) * 100),
    feedback: [
      isCorrect ? scenario.feedbackCorrect : scenario.feedbackIncorrect,
      ...details
    ],
    misconceptionKeys: [
      ...(conceptRequirementMet
        ? []
        : scenario.conceptGroups
            .filter(
              (group) =>
                !matchedConceptGroups.some(
                  (matched) => matched.conceptId === group.conceptId
                )
            )
            .map((group) => group.conceptId)),
      ...missingRelationIds,
      ...(criterionMatched ? [] : [scenario.criterionConditionId])
    ],
    convertedValue: null,
    variantSeed: stableSeed(identity.questionId),
    matchedConceptGroupIds: matchedConceptGroups.map(
      (group) => group.conceptId
    ),
    missingRelationIds,
    criterionMatched
  };
};

export const gradeAcademyLessonV2Matching = (
  scenario: AcademyMatchingScenario,
  responses: Readonly<Record<string, string>>,
  identity: AcademyLessonV2QuestionIdentity,
  conditions: readonly AcademyDomainCondition[]
): GradeResult =>
  gradeQuestion(
    buildAcademyLessonV2MatchingQuestion(scenario, identity, conditions),
    { type: "matching", pairs: { ...responses } }
  );

export const gradeAcademyLessonV2Q5 = (
  scenario: AcademyQ5Scenario,
  selectedOptionId: string,
  identity: AcademyLessonV2QuestionIdentity,
  profile: AcademyLessonTeachingProfileV2
): GradeResult => {
  const question = scenario.kind === "diagram"
    ? buildAcademyLessonV2DiagramQuestion(scenario, identity, profile)
    : buildAcademyLessonV2CodeQuestion(scenario, identity, profile);
  return gradeQuestion(
    question,
    scenario.kind === "diagram"
      ? { type: "diagram", optionId: selectedOptionId }
      : { type: "code-analysis", optionId: selectedOptionId }
  );
};
