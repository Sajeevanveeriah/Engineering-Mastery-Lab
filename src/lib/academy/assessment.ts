import type {
  AcademyQuestion,
  CodeAnalysisQuestion,
  DiagramQuestion,
  MatchingQuestion,
  MultipleSelectionQuestion,
  NumericQuestion,
  OrderingQuestion,
  SeededCalculationQuestion,
  ShortResponseQuestion,
  SingleChoiceQuestion
} from "./types";

export const MAX_RETRY_INDEX = 20;
export const DEFAULT_ATTEMPT_HISTORY_LIMIT = 20;
export const MAX_ATTEMPT_HISTORY_LIMIT = 100;

export class AssessmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssessmentValidationError";
  }
}

export type AssessmentResponse =
  | { type: "single-choice"; optionId: string }
  | { type: "multiple-selection"; optionIds: string[] }
  | { type: "numeric"; value: number; unit: string }
  | { type: "ordering"; itemIds: string[] }
  | { type: "matching"; pairs: Record<string, string> }
  | { type: "short-response"; text: string }
  | { type: "diagram"; optionId: string }
  | { type: "code-analysis"; optionId: string }
  | { type: "seeded-calculation"; value: number; unit: string };

export interface GradeContext {
  retryIndex?: number;
}

export interface GradeResult {
  questionId: string;
  questionType: AcademyQuestion["type"];
  isCorrect: boolean;
  scorePercent: number;
  feedback: string[];
  misconceptionKeys: string[];
  convertedValue: number | null;
  variantSeed: number | null;
}

export interface SeededCalculationVariant {
  questionId: string;
  retryIndex: number;
  variantSeed: number;
  inputValue: number;
  prompt: string;
}

export interface GeneratedAcademyQuestionRetry {
  question: AcademyQuestion;
  retryIndex: number;
  variantSeed: number;
  inputValue: number | null;
  expectedValue: number | null;
}

export interface HintResult {
  questionId: string;
  hint: string | null;
  hintIndex: number | null;
  remainingHints: number;
  exhausted: boolean;
}

export interface AssessmentAttemptRecord {
  questionId: string;
  questionType: AcademyQuestion["type"];
  attemptedAt: string;
  responseSummary: string;
  isCorrect: boolean;
  scorePercent: number;
  misconceptionKeys: string[];
  variantSeed: number | null;
  retryIndex?: number;
}

export interface SolutionRevealRequest {
  attemptHistory: readonly AssessmentAttemptRecord[];
  explicitReveal: boolean;
}

export interface SolutionRevealResult {
  questionId: string;
  eligible: boolean;
  revealed: boolean;
  reason: string;
  solution: string[];
}

export interface AssessmentScoreRecord {
  responseSummary: Readonly<Record<string, string>>;
  scorePercent: number;
}

export interface QuestionSetScoreState {
  identity: string;
  scores: Record<string, number>;
}

interface NumericGrade {
  isCorrect: boolean;
  scorePercent: number;
  details: string[];
  misconceptionKeys: string[];
  convertedValue: number | null;
}

interface BaseGrade {
  isCorrect: boolean;
  scorePercent: number;
  details: string[];
  misconceptionKeys: string[];
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new AssessmentValidationError(`${label} must be a finite number.`);
  }
}

function assertNonNegativeFinite(value: number, label: string): void {
  assertFinite(value, label);
  if (value < 0) {
    throw new AssessmentValidationError(`${label} must not be negative.`);
  }
}

function assertRetryIndex(retryIndex: number): void {
  if (!Number.isInteger(retryIndex) || retryIndex < 0 || retryIndex > MAX_RETRY_INDEX) {
    throw new AssessmentValidationError(
      `retryIndex must be an integer from 0 to ${MAX_RETRY_INDEX}.`
    );
  }
}

function assertHistoryLimit(limit: number): void {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_ATTEMPT_HISTORY_LIMIT
  ) {
    throw new AssessmentValidationError(
      `Attempt history limit must be an integer from 1 to ${MAX_ATTEMPT_HISTORY_LIMIT}.`
    );
  }
}

function assertIsoTimestamp(value: string, label: string): void {
  if (value.trim() === "" || !Number.isFinite(Date.parse(value))) {
    throw new AssessmentValidationError(`${label} must be a valid timestamp.`);
  }
}

function uniqueIds(ids: readonly string[], label: string): string[] {
  const trimmed = ids.map((id) => id.trim());
  if (trimmed.some((id) => id === "")) {
    throw new AssessmentValidationError(`${label} must not contain blank ids.`);
  }
  if (new Set(trimmed).size !== trimmed.length) {
    throw new AssessmentValidationError(`${label} must not contain duplicate ids.`);
  }
  return trimmed;
}

function optionIds(
  options: readonly { id: string }[],
  label: string
): string[] {
  return uniqueIds(
    options.map((option) => option.id),
    label
  );
}

function ensureKnownIds(
  submitted: readonly string[],
  known: readonly string[],
  label: string
): void {
  const knownSet = new Set(known);
  const unknown = submitted.find((id) => !knownSet.has(id));
  if (unknown !== undefined) {
    throw new AssessmentValidationError(`${label} contains unknown id "${unknown}".`);
  }
}

function roundScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;
}

function matchingMisconceptions(
  question: AcademyQuestion,
  candidateKeys: readonly string[]
): { keys: string[]; messages: string[] } {
  const keys = uniqueIds(
    candidateKeys.filter((key) =>
      Object.prototype.hasOwnProperty.call(question.misconceptionFeedback, key)
    ),
    "Misconception keys"
  );
  return {
    keys,
    messages: keys.map((key) => question.misconceptionFeedback[key] as string)
  };
}

function gradeSingleChoice(
  question: SingleChoiceQuestion,
  response: Extract<AssessmentResponse, { type: "single-choice" }>
): BaseGrade {
  const known = optionIds(question.options, "Single-choice option ids");
  ensureKnownIds([response.optionId], known, "Single-choice response");
  if (!known.includes(question.correctOptionId)) {
    throw new AssessmentValidationError("The correct single-choice option is not defined.");
  }

  const isCorrect = response.optionId === question.correctOptionId;
  const misconception = isCorrect
    ? { keys: [], messages: [] }
    : matchingMisconceptions(question, [response.optionId]);
  return {
    isCorrect,
    scorePercent: isCorrect ? 100 : 0,
    details: misconception.messages,
    misconceptionKeys: misconception.keys
  };
}

function gradeMultipleSelection(
  question: MultipleSelectionQuestion,
  response: Extract<AssessmentResponse, { type: "multiple-selection" }>
): BaseGrade {
  const known = optionIds(question.options, "Multiple-selection option ids");
  const submitted = uniqueIds(response.optionIds, "Multiple-selection response");
  const expected = uniqueIds(
    question.correctOptionIds,
    "Multiple-selection correct option ids"
  );
  if (expected.length === 0) {
    throw new AssessmentValidationError(
      "A multiple-selection question must define at least one correct option."
    );
  }
  ensureKnownIds(submitted, known, "Multiple-selection response");
  ensureKnownIds(expected, known, "Multiple-selection correct options");

  const submittedSet = new Set(submitted);
  const expectedSet = new Set(expected);
  const intersection = submitted.filter((id) => expectedSet.has(id)).length;
  const union = new Set([...submitted, ...expected]).size;
  const missingCount = expected.filter((id) => !submittedSet.has(id)).length;
  const extra = submitted.filter((id) => !expectedSet.has(id));
  const details: string[] = [];
  if (missingCount > 0) {
    details.push(
      `${missingCount} required selection${missingCount === 1 ? " is" : "s are"} missing.`
    );
  }
  if (extra.length > 0) {
    details.push(
      `${extra.length} selected option${extra.length === 1 ? " does" : "s do"} not belong in the answer.`
    );
  }
  const misconception = matchingMisconceptions(question, extra);
  details.push(...misconception.messages);
  const isCorrect = missingCount === 0 && extra.length === 0;
  return {
    isCorrect,
    scorePercent: isCorrect ? 100 : roundScore((intersection / union) * 100),
    details,
    misconceptionKeys: misconception.keys
  };
}

function conversionFactor(
  question: NumericQuestion | SeededCalculationQuestion,
  unit: string
): number | null {
  const submittedUnit = unit.trim();
  if (submittedUnit === question.canonicalUnit) return 1;
  const factor = question.acceptedUnits[submittedUnit];
  if (factor === undefined) return null;
  assertFinite(factor, `Conversion factor for ${submittedUnit}`);
  if (factor <= 0) {
    throw new AssessmentValidationError(
      `Conversion factor for ${submittedUnit} must be greater than zero.`
    );
  }
  return factor;
}

function gradeNumericValue(
  question: NumericQuestion | SeededCalculationQuestion,
  submittedValue: number,
  submittedUnit: string,
  expectedValue: number
): NumericGrade {
  assertFinite(submittedValue, "Submitted numeric value");
  assertFinite(expectedValue, "Expected numeric value");
  assertNonNegativeFinite(question.absoluteTolerance, "Absolute tolerance");
  assertNonNegativeFinite(question.relativeTolerance, "Relative tolerance");

  const factor = conversionFactor(question, submittedUnit);
  if (factor === null) {
    const misconception = matchingMisconceptions(question, ["unit"]);
    return {
      isCorrect: false,
      scorePercent: 0,
      details: [
        `The unit "${submittedUnit.trim()}" is not accepted for this question.`,
        ...misconception.messages
      ],
      misconceptionKeys: misconception.keys,
      convertedValue: null
    };
  }

  const convertedValue = submittedValue * factor;
  assertFinite(convertedValue, "Converted numeric value");
  const tolerance = Math.max(
    question.absoluteTolerance,
    Math.abs(expectedValue) * question.relativeTolerance
  );
  const difference = Math.abs(convertedValue - expectedValue);
  const roundingMargin =
    Number.EPSILON * Math.max(1, Math.abs(convertedValue), Math.abs(expectedValue));
  const isCorrect = difference <= tolerance + roundingMargin;
  if (isCorrect) {
    return {
      isCorrect: true,
      scorePercent: 100,
      details: [],
      misconceptionKeys: [],
      convertedValue
    };
  }

  const candidateKeys: string[] = [];
  const details = ["The converted value is outside the accepted tolerance."];
  if (
    (expectedValue > 0 && convertedValue < 0) ||
    (expectedValue < 0 && convertedValue > 0)
  ) {
    candidateKeys.push("sign");
    details.push("Check the sign convention used in the calculation.");
  } else if (expectedValue === 0) {
    candidateKeys.push("zero");
    details.push("Check the zero reference and any offset in the model.");
  } else if (convertedValue === 0) {
    candidateKeys.push("zero");
    details.push("A zero result does not follow from the supplied non-zero reference.");
  } else {
    const magnitudeRatio = Math.abs(convertedValue / expectedValue);
    if (magnitudeRatio >= 10 || magnitudeRatio <= 0.1) {
      candidateKeys.push("magnitude");
      details.push("Check the SI prefix and order of magnitude.");
    }
  }
  const misconception = matchingMisconceptions(question, candidateKeys);
  details.push(...misconception.messages);
  return {
    isCorrect: false,
    scorePercent: 0,
    details,
    misconceptionKeys: misconception.keys,
    convertedValue
  };
}

function gradeOrdering(
  question: OrderingQuestion,
  response: Extract<AssessmentResponse, { type: "ordering" }>
): BaseGrade {
  const known = optionIds(question.items, "Ordering item ids");
  if (known.length === 0) {
    throw new AssessmentValidationError(
      "An ordering question must define at least one item."
    );
  }
  const expected = uniqueIds(question.correctOrder, "Correct ordering");
  const submitted = uniqueIds(response.itemIds, "Ordering response");
  if (expected.length !== known.length) {
    throw new AssessmentValidationError(
      "Correct ordering must contain every ordering item exactly once."
    );
  }
  if (submitted.length !== known.length) {
    throw new AssessmentValidationError(
      "Ordering response must contain every ordering item exactly once."
    );
  }
  ensureKnownIds(expected, known, "Correct ordering");
  ensureKnownIds(submitted, known, "Ordering response");

  const correctPositions = submitted.reduce(
    (count, id, index) => count + (expected[index] === id ? 1 : 0),
    0
  );
  const isCorrect = correctPositions === expected.length;
  const details = isCorrect
    ? []
    : [
        `${correctPositions} of ${expected.length} items are in the correct position.`,
        "Recheck the dependency or event sequence before changing adjacent items."
      ];
  const misplaced = submitted.filter((id, index) => expected[index] !== id);
  const misconception = matchingMisconceptions(question, misplaced);
  details.push(...misconception.messages);
  return {
    isCorrect,
    scorePercent: roundScore((correctPositions / expected.length) * 100),
    details,
    misconceptionKeys: misconception.keys
  };
}

function gradeMatching(
  question: MatchingQuestion,
  response: Extract<AssessmentResponse, { type: "matching" }>
): BaseGrade {
  const leftIds = optionIds(question.left, "Matching left ids");
  const rightIds = optionIds(question.right, "Matching right ids");
  if (leftIds.length === 0 || rightIds.length === 0) {
    throw new AssessmentValidationError(
      "A matching question must define at least one item on each side."
    );
  }
  const correctKeys = uniqueIds(
    Object.keys(question.correctPairs),
    "Correct matching left ids"
  );
  if (
    correctKeys.length !== leftIds.length ||
    leftIds.some((id) => !correctKeys.includes(id))
  ) {
    throw new AssessmentValidationError(
      "Correct matching pairs must define one answer for every left item."
    );
  }
  ensureKnownIds(
    Object.values(question.correctPairs),
    rightIds,
    "Correct matching pairs"
  );

  const submittedEntries = Object.entries(response.pairs);
  const submittedKeys = uniqueIds(
    submittedEntries.map(([leftId]) => leftId),
    "Submitted matching left ids"
  );
  ensureKnownIds(submittedKeys, leftIds, "Submitted matching pairs");
  ensureKnownIds(
    submittedEntries.map(([, rightId]) => rightId),
    rightIds,
    "Submitted matching pairs"
  );

  const correctCount = leftIds.filter(
    (leftId) => response.pairs[leftId] === question.correctPairs[leftId]
  ).length;
  const missingCount = leftIds.length - submittedKeys.length;
  const isCorrect = correctCount === leftIds.length;
  const details: string[] = [];
  if (!isCorrect) {
    details.push(
      `${correctCount} of ${leftIds.length} pairs are correct${
        missingCount > 0 ? `; ${missingCount} pair${missingCount === 1 ? " is" : "s are"} missing` : ""
      }.`
    );
  }
  const incorrectLeftIds = leftIds.filter(
    (leftId) =>
      response.pairs[leftId] !== undefined &&
      response.pairs[leftId] !== question.correctPairs[leftId]
  );
  const misconception = matchingMisconceptions(question, incorrectLeftIds);
  details.push(...misconception.messages);
  return {
    isCorrect,
    scorePercent: roundScore((correctCount / leftIds.length) * 100),
    details,
    misconceptionKeys: misconception.keys
  };
}

function tokenise(value: string): string[] {
  return value
    .toLocaleLowerCase("en-GB")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function includesTerm(tokens: readonly string[], term: string): boolean {
  const termTokens = tokenise(term);
  if (termTokens.length === 0 || termTokens.length > tokens.length) return false;
  for (let start = 0; start <= tokens.length - termTokens.length; start += 1) {
    if (termTokens.every((token, offset) => tokens[start + offset] === token)) {
      return true;
    }
  }
  return false;
}

function gradeShortResponse(
  question: ShortResponseQuestion,
  response: Extract<AssessmentResponse, { type: "short-response" }>
): BaseGrade {
  if (response.text.trim() === "") {
    throw new AssessmentValidationError("Short response must not be blank.");
  }
  const requiredTerms = uniqueIds(
    question.requiredTerms.map((term) => term.toLocaleLowerCase("en-GB")),
    "Short-response required terms"
  );
  if (
    !Number.isInteger(question.minimumTerms) ||
    question.minimumTerms < 1 ||
    question.minimumTerms > requiredTerms.length
  ) {
    throw new AssessmentValidationError(
      "minimumTerms must be an integer within the required-term count."
    );
  }

  const tokens = tokenise(response.text);
  const matchedTerms = requiredTerms.filter((term) => includesTerm(tokens, term));
  const missingTerms = requiredTerms.filter((term) => !matchedTerms.includes(term));
  const isCorrect = matchedTerms.length >= question.minimumTerms;
  const details = isCorrect
    ? []
    : [
        `The response includes ${matchedTerms.length} of the ${question.minimumTerms} required concepts.`,
        `Revisit these missing concepts: ${missingTerms.join(", ")}.`
      ];
  const misconception = matchingMisconceptions(question, missingTerms);
  details.push(...misconception.messages);
  return {
    isCorrect,
    scorePercent: roundScore(
      (Math.min(matchedTerms.length, question.minimumTerms) /
        question.minimumTerms) *
        100
    ),
    details,
    misconceptionKeys: misconception.keys
  };
}

function gradeDiagram(
  question: DiagramQuestion,
  response: Extract<AssessmentResponse, { type: "diagram" }>
): BaseGrade {
  const known = optionIds(question.options, "Diagram option ids");
  ensureKnownIds([response.optionId], known, "Diagram response");
  if (!known.includes(question.correctOptionId)) {
    throw new AssessmentValidationError("The correct diagram option is not defined.");
  }
  const isCorrect = response.optionId === question.correctOptionId;
  const misconception = isCorrect
    ? { keys: [], messages: [] }
    : matchingMisconceptions(question, [response.optionId]);
  return {
    isCorrect,
    scorePercent: isCorrect ? 100 : 0,
    details: misconception.messages,
    misconceptionKeys: misconception.keys
  };
}

function gradeCodeAnalysis(
  question: CodeAnalysisQuestion,
  response: Extract<AssessmentResponse, { type: "code-analysis" }>
): BaseGrade {
  if (question.language.trim() === "") {
    throw new AssessmentValidationError(
      "Code-analysis language must not be blank."
    );
  }
  if (question.code.trim() === "") {
    throw new AssessmentValidationError(
      "Code-analysis source must not be blank."
    );
  }
  const known = optionIds(question.options, "Code-analysis option ids");
  ensureKnownIds([response.optionId], known, "Code-analysis response");
  if (!known.includes(question.correctOptionId)) {
    throw new AssessmentValidationError(
      "The correct code-analysis option is not defined."
    );
  }
  const isCorrect = response.optionId === question.correctOptionId;
  const misconception = isCorrect
    ? { keys: [], messages: [] }
    : matchingMisconceptions(question, [response.optionId]);
  return {
    isCorrect,
    scorePercent: isCorrect ? 100 : 0,
    details: misconception.messages,
    misconceptionKeys: misconception.keys
  };
}

function mixSeed(seed: number, retryIndex: number): number {
  let value = (Math.trunc(seed) ^ Math.imul(retryIndex + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function variantGrid(question: SeededCalculationQuestion): {
  count: number;
  minimum: number;
  step: number;
} {
  const { minimum, maximum, step, coefficient, offset } = question.generator;
  assertFinite(minimum, "Variant minimum");
  assertFinite(maximum, "Variant maximum");
  assertFinite(step, "Variant step");
  assertFinite(coefficient, "Variant coefficient");
  assertFinite(offset, "Variant offset");
  if (minimum > maximum) {
    throw new AssessmentValidationError(
      "Variant minimum must not exceed variant maximum."
    );
  }
  if (step <= 0) {
    throw new AssessmentValidationError("Variant step must be greater than zero.");
  }
  const count = Math.floor((maximum - minimum) / step + 1e-12) + 1;
  if (!Number.isSafeInteger(count) || count < 1 || count > 10_000) {
    throw new AssessmentValidationError(
      "Variant range must contain between 1 and 10,000 values."
    );
  }
  return { count, minimum, step };
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function distinctVariantInputs(
  question: SeededCalculationQuestion
): number[] {
  const grid = variantGrid(question);
  const values: number[] = [];
  const expectedFingerprints = new Set<string>();
  for (let index = 0; index < grid.count; index += 1) {
    const inputValue = Number(
      (grid.minimum + index * grid.step).toPrecision(15)
    );
    if (question.generator.algorithm === "inverse-scale" && inputValue === 0) {
      continue;
    }
    const expected = calculateVariantExpected(question, inputValue);
    const fingerprint = expected.toPrecision(15);
    if (expectedFingerprints.has(fingerprint)) continue;
    expectedFingerprints.add(fingerprint);
    values.push(inputValue);
  }
  if (values.length === 0) {
    throw new AssessmentValidationError(
      "Seeded variants require at least one finite, gradeable expected response."
    );
  }
  return values;
}

function variantInput(
  question: SeededCalculationQuestion,
  retryIndex: number
): { inputValue: number; variantSeed: number } {
  assertRetryIndex(retryIndex);
  const values = distinctVariantInputs(question);
  if (retryIndex >= values.length) {
    throw new AssessmentValidationError(
      `retryIndex ${retryIndex} exceeds the ${values.length} distinct generated answers.`
    );
  }
  const startIndex = mixSeed(question.variantSeed, 0) % values.length;
  let stride = values.length === 1
    ? 1
    : 1 + (mixSeed(question.variantSeed, 1) % (values.length - 1));
  while (
    values.length > 1
    && greatestCommonDivisor(stride, values.length) !== 1
  ) {
    stride = stride === values.length - 1 ? 1 : stride + 1;
  }
  const index = (startIndex + retryIndex * stride) % values.length;
  return {
    inputValue: values[index] as number,
    variantSeed: mixSeed(question.variantSeed, retryIndex)
  };
}

function calculateVariantExpected(
  question: SeededCalculationQuestion,
  inputValue: number
): number {
  const { algorithm, coefficient, offset } = question.generator;
  let expectedValue: number;
  switch (algorithm) {
    case "linear-scale":
      expectedValue = coefficient * inputValue + offset;
      break;
    case "inverse-scale":
      if (inputValue === 0) {
        throw new AssessmentValidationError(
          "Inverse-scale calculation cannot divide by zero."
        );
      }
      expectedValue = coefficient / inputValue + offset;
      break;
    case "sum":
      expectedValue = inputValue + coefficient + offset;
      break;
    case "difference":
      expectedValue = inputValue - coefficient + offset;
      break;
    case "product":
      expectedValue = inputValue * coefficient + offset;
      break;
  }
  assertFinite(expectedValue, "Generated expected value");
  return expectedValue;
}

export function generateQuestionVariant(
  question: SeededCalculationQuestion,
  retryIndex: number
): SeededCalculationVariant {
  const { inputValue, variantSeed } = variantInput(question, retryIndex);
  return {
    questionId: question.id,
    retryIndex,
    variantSeed,
    inputValue,
    prompt: question.prompt.replace(/\{\{input\}\}/g, String(inputValue))
  };
}

export function getQuestionVariantExpectedValue(
  question: SeededCalculationQuestion,
  retryIndex: number
): number {
  const { inputValue } = variantInput(question, retryIndex);
  return calculateVariantExpected(question, inputValue);
}

function assertRetryQuestionContract(
  source: AcademyQuestion,
  retry: AcademyQuestion
): void {
  if (retry.id !== source.id) {
    throw new AssessmentValidationError(
      `Retry question id "${retry.id}" must match "${source.id}".`
    );
  }
  const sourceSkills = [...source.skillIds].sort();
  const retrySkills = [...retry.skillIds].sort();
  if (JSON.stringify(sourceSkills) !== JSON.stringify(retrySkills)) {
    throw new AssessmentValidationError(
      `Retry question "${source.id}" must test the same linked skills.`
    );
  }
}

export function getQuestionRetryLimit(question: AcademyQuestion): number {
  if (question.type === "seeded-calculation") {
    return Math.min(
      MAX_RETRY_INDEX,
      distinctVariantInputs(question).length - 1
    );
  }
  const retryCount = question.retryVariants?.length ?? 0;
  if (retryCount > MAX_RETRY_INDEX) {
    throw new AssessmentValidationError(
      `Question "${question.id}" exceeds the retry variant limit.`
    );
  }
  return retryCount;
}

export function generateAcademyQuestionRetry(
  question: AcademyQuestion,
  retryIndex: number
): GeneratedAcademyQuestionRetry {
  assertRetryIndex(retryIndex);
  const variantSeed = mixSeed(
    question.variantSeed ^ hashString(question.id),
    retryIndex
  );
  if (question.type === "seeded-calculation") {
    const generated = generateQuestionVariant(question, retryIndex);
    return {
      question: {
        ...question,
        prompt: generated.prompt
      },
      retryIndex,
      variantSeed: generated.variantSeed,
      inputValue: generated.inputValue,
      expectedValue: getQuestionVariantExpectedValue(question, retryIndex)
    };
  }
  if (retryIndex === 0) {
    return {
      question,
      retryIndex,
      variantSeed,
      inputValue: null,
      expectedValue: question.type === "numeric"
        ? question.expectedValue
        : null
    };
  }
  const retry = question.retryVariants?.[retryIndex - 1];
  if (!retry) {
    throw new AssessmentValidationError(
      `Question "${question.id}" does not define retry variant ${retryIndex}.`
    );
  }
  assertRetryQuestionContract(question, retry);
  return {
    question: retry,
    retryIndex,
    variantSeed,
    inputValue: null,
    expectedValue: retry.type === "numeric"
      ? retry.expectedValue
      : null
  };
}

export function getQuestionExpectedResponseFingerprint(
  question: AcademyQuestion,
  retryIndex = 0
): string {
  const generated = generateAcademyQuestionRetry(question, retryIndex);
  const retry = generated.question;
  switch (retry.type) {
    case "single-choice":
    case "diagram":
    case "code-analysis": {
      const correct = retry.options.find(
        (option) => option.id === retry.correctOptionId
      );
      if (!correct) {
        throw new AssessmentValidationError(
          `Question "${retry.id}" has an unresolved correct option.`
        );
      }
      return JSON.stringify([retry.type, correct.label]);
    }
    case "multiple-selection": {
      const labels = retry.correctOptionIds.map((correctId) => {
        const option = retry.options.find((candidate) => candidate.id === correctId);
        if (!option) {
          throw new AssessmentValidationError(
            `Question "${retry.id}" has an unresolved correct selection.`
          );
        }
        return option.label;
      });
      return JSON.stringify([retry.type, [...labels].sort()]);
    }
    case "numeric":
      return JSON.stringify([
        retry.type,
        retry.expectedValue,
        retry.canonicalUnit
      ]);
    case "ordering": {
      const labels = retry.correctOrder.map((correctId) => {
        const item = retry.items.find((candidate) => candidate.id === correctId);
        if (!item) {
          throw new AssessmentValidationError(
            `Question "${retry.id}" has an unresolved correct ordering.`
          );
        }
        return item.label;
      });
      return JSON.stringify([retry.type, labels]);
    }
    case "matching": {
      const labels = retry.left.map((left) => {
        const rightId = retry.correctPairs[left.id];
        const right = retry.right.find((candidate) => candidate.id === rightId);
        if (!right) {
          throw new AssessmentValidationError(
            `Question "${retry.id}" has an unresolved correct match.`
          );
        }
        return [left.label, right.label];
      });
      return JSON.stringify([retry.type, labels]);
    }
    case "short-response":
      return JSON.stringify([
        retry.type,
        [...retry.requiredTerms].sort(),
        retry.minimumTerms
      ]);
    case "seeded-calculation":
      return JSON.stringify([
        retry.type,
        generated.inputValue,
        generated.expectedValue,
        retry.canonicalUnit
      ]);
  }
}

export function assertDistinctQuestionRetryAnswers(
  question: AcademyQuestion
): void {
  const retryLimit = getQuestionRetryLimit(question);
  if (retryLimit < 1) {
    throw new AssessmentValidationError(
      `Question "${question.id}" requires at least one distinct retry answer.`
    );
  }
  const seen = new Map<string, number>();
  for (let retryIndex = 0; retryIndex <= retryLimit; retryIndex += 1) {
    const fingerprint = getQuestionExpectedResponseFingerprint(
      question,
      retryIndex
    );
    const previousIndex = seen.get(fingerprint);
    if (previousIndex !== undefined) {
      throw new AssessmentValidationError(
        `Question "${question.id}" retry ${retryIndex} repeats the expected response from case ${previousIndex}.`
      );
    }
    seen.set(fingerprint, retryIndex);
  }
}

export function getInitialOrdering(
  question: OrderingQuestion,
  retryIndex = 0
): string[] {
  assertRetryIndex(retryIndex);
  const itemIds = optionIds(question.items, "Ordering item ids");
  if (itemIds.length === 0) {
    throw new AssessmentValidationError(
      "An ordering question must define at least one item."
    );
  }
  const expected = uniqueIds(question.correctOrder, "Correct ordering");
  if (
    expected.length !== itemIds.length ||
    expected.some((id) => !itemIds.includes(id))
  ) {
    throw new AssessmentValidationError(
      "Correct ordering must contain every ordering item exactly once."
    );
  }

  const ordered = [...itemIds];
  let state = mixSeed(
    question.variantSeed ^ hashString(question.id),
    retryIndex
  );
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    state = mixSeed(state, index);
    const destination = state % (index + 1);
    [ordered[index], ordered[destination]] = [
      ordered[destination] as string,
      ordered[index] as string
    ];
  }
  const accidentallyCorrect = ordered.every(
    (id, index) => expected[index] === id
  );
  if (accidentallyCorrect && ordered.length > 1) {
    [ordered[0], ordered[1]] = [ordered[1] as string, ordered[0] as string];
  }
  return ordered;
}

export function recordFirstAttemptScore(
  current: Record<string, number>,
  questionId: string,
  scorePercent: number
): Record<string, number> {
  if (questionId.trim() === "") {
    throw new AssessmentValidationError("questionId must not be blank.");
  }
  assertNonNegativeFinite(scorePercent, "Attempt score");
  if (scorePercent > 100) {
    throw new AssessmentValidationError(
      "Attempt score must not exceed 100 percent."
    );
  }
  if (Object.prototype.hasOwnProperty.call(current, questionId)) return current;
  return { ...current, [questionId]: scorePercent };
}

export function currentAssessmentSessionAttempts<
  T extends AssessmentScoreRecord
>(attempts: readonly T[]): T[] {
  let latestResultIndex = -1;
  for (let index = 0; index < attempts.length; index += 1) {
    if (
      Object.prototype.hasOwnProperty.call(
        attempts[index]?.responseSummary,
        "RESULT"
      )
    ) {
      latestResultIndex = index;
    }
  }
  return attempts.slice(latestResultIndex + 1);
}

export function firstAttemptQuestionScores(
  attempts: readonly AssessmentScoreRecord[],
  questionIds: readonly string[]
): Record<string, number> {
  const allowedQuestionIds = new Set(
    uniqueIds(questionIds, "Assessment question ids")
  );
  const scores: Record<string, number> = {};
  for (const attempt of attempts) {
    assertNonNegativeFinite(attempt.scorePercent, "Stored attempt score");
    if (attempt.scorePercent > 100) {
      throw new AssessmentValidationError(
        "Stored attempt score must not exceed 100 percent."
      );
    }
    for (const questionId of Object.keys(attempt.responseSummary)) {
      if (
        allowedQuestionIds.has(questionId) &&
        !Object.prototype.hasOwnProperty.call(scores, questionId)
      ) {
        scores[questionId] = attempt.scorePercent;
      }
    }
  }
  return scores;
}

export function bestCompletedAssessmentScore(
  attempts: readonly AssessmentScoreRecord[]
): number | null {
  const resultScores = attempts
    .filter((attempt) =>
      Object.prototype.hasOwnProperty.call(attempt.responseSummary, "RESULT")
    )
    .map((attempt) => {
      assertNonNegativeFinite(attempt.scorePercent, "Stored result score");
      if (attempt.scorePercent > 100) {
        throw new AssessmentValidationError(
          "Stored result score must not exceed 100 percent."
        );
      }
      return attempt.scorePercent;
    });
  return resultScores.length === 0 ? null : Math.max(...resultScores);
}

export function buildQuestionSetIdentity(
  setId: string,
  questions: readonly Pick<AcademyQuestion, "id" | "type">[],
  initialScores: Readonly<Record<string, number>>
): string {
  if (setId.trim() === "") {
    throw new AssessmentValidationError("Question set id must not be blank.");
  }
  const questionIds = uniqueIds(
    questions.map((question) => question.id),
    "Question set ids"
  );
  const descriptors = questions.map((question, index) => [
    questionIds[index],
    question.type,
    Object.prototype.hasOwnProperty.call(initialScores, question.id)
      ? initialScores[question.id]
      : null
  ]);
  return JSON.stringify([setId, descriptors]);
}

export function reconcileQuestionSetScoreState(
  current: QuestionSetScoreState,
  setIdentity: string,
  initialScores: Readonly<Record<string, number>>
): QuestionSetScoreState {
  if (current.identity === setIdentity) return current;
  return {
    identity: setIdentity,
    scores: { ...initialScores }
  };
}

export function gradeQuestion(
  question: AcademyQuestion,
  response: AssessmentResponse,
  context: GradeContext = {}
): GradeResult {
  if (question.type !== response.type) {
    throw new AssessmentValidationError(
      `Question type "${question.type}" cannot be graded with response type "${response.type}".`
    );
  }

  let grade: BaseGrade;
  let convertedValue: number | null = null;
  let variantSeed: number | null = question.variantSeed;

  switch (question.type) {
    case "single-choice":
      grade = gradeSingleChoice(
        question,
        response as Extract<AssessmentResponse, { type: "single-choice" }>
      );
      break;
    case "multiple-selection":
      grade = gradeMultipleSelection(
        question,
        response as Extract<AssessmentResponse, { type: "multiple-selection" }>
      );
      break;
    case "numeric": {
      const numericGrade = gradeNumericValue(
        question,
        (response as Extract<AssessmentResponse, { type: "numeric" }>).value,
        (response as Extract<AssessmentResponse, { type: "numeric" }>).unit,
        question.expectedValue
      );
      grade = numericGrade;
      convertedValue = numericGrade.convertedValue;
      break;
    }
    case "ordering":
      grade = gradeOrdering(
        question,
        response as Extract<AssessmentResponse, { type: "ordering" }>
      );
      break;
    case "matching":
      grade = gradeMatching(
        question,
        response as Extract<AssessmentResponse, { type: "matching" }>
      );
      break;
    case "short-response":
      grade = gradeShortResponse(
        question,
        response as Extract<AssessmentResponse, { type: "short-response" }>
      );
      break;
    case "diagram":
      grade = gradeDiagram(
        question,
        response as Extract<AssessmentResponse, { type: "diagram" }>
      );
      break;
    case "code-analysis":
      grade = gradeCodeAnalysis(
        question,
        response as Extract<AssessmentResponse, { type: "code-analysis" }>
      );
      break;
    case "seeded-calculation": {
      const retryIndex = context.retryIndex ?? 0;
      const variant = generateQuestionVariant(question, retryIndex);
      const expectedValue = calculateVariantExpected(question, variant.inputValue);
      const numericGrade = gradeNumericValue(
        question,
        (
          response as Extract<
            AssessmentResponse,
            { type: "seeded-calculation" }
          >
        ).value,
        (
          response as Extract<
            AssessmentResponse,
            { type: "seeded-calculation" }
          >
        ).unit,
        expectedValue
      );
      grade = numericGrade;
      convertedValue = numericGrade.convertedValue;
      variantSeed = variant.variantSeed;
      break;
    }
  }

  const primaryFeedback = grade.isCorrect
    ? question.feedbackCorrect
    : question.feedbackIncorrect;
  return {
    questionId: question.id,
    questionType: question.type,
    isCorrect: grade.isCorrect,
    scorePercent: grade.scorePercent,
    feedback: [primaryFeedback, ...grade.details].filter(
      (message) => message.trim() !== ""
    ),
    misconceptionKeys: [...grade.misconceptionKeys],
    convertedValue,
    variantSeed
  };
}

export function getProgressiveHint(
  question: AcademyQuestion,
  hintsAlreadyShown: number
): HintResult {
  if (!Number.isInteger(hintsAlreadyShown) || hintsAlreadyShown < 0) {
    throw new AssessmentValidationError(
      "hintsAlreadyShown must be a non-negative integer."
    );
  }
  const hint =
    hintsAlreadyShown < question.hints.length
      ? (question.hints[hintsAlreadyShown] as string)
      : null;
  const shownAfterRequest =
    hint === null ? question.hints.length : hintsAlreadyShown + 1;
  return {
    questionId: question.id,
    hint,
    hintIndex: hint === null ? null : hintsAlreadyShown,
    remainingHints: Math.max(0, question.hints.length - shownAfterRequest),
    exhausted: hint === null || shownAfterRequest >= question.hints.length
  };
}

function responseSummary(response: AssessmentResponse): string {
  switch (response.type) {
    case "single-choice":
    case "diagram":
    case "code-analysis":
      return response.optionId.trim();
    case "multiple-selection":
      return JSON.stringify([...response.optionIds].sort());
    case "numeric":
    case "seeded-calculation":
      return `${response.value} ${response.unit.trim()}`;
    case "ordering":
      return JSON.stringify(response.itemIds);
    case "matching":
      return JSON.stringify(
        Object.entries(response.pairs).sort(([leftA], [leftB]) =>
          leftA < leftB ? -1 : leftA > leftB ? 1 : 0
        )
      );
    case "short-response":
      return response.text.trim();
  }
}

export function createAttemptRecord(
  question: AcademyQuestion,
  response: AssessmentResponse,
  grade: GradeResult,
  attemptedAt: string,
  retryIndex = 0
): AssessmentAttemptRecord {
  assertRetryIndex(retryIndex);
  assertIsoTimestamp(attemptedAt, "attemptedAt");
  if (
    grade.questionId !== question.id ||
    grade.questionType !== question.type ||
    response.type !== question.type
  ) {
    throw new AssessmentValidationError(
      "Question, response and grade must describe the same attempt."
    );
  }
  const summary = responseSummary(response);
  if (summary.trim() === "") {
    throw new AssessmentValidationError(
      "A genuine attempt must contain a submitted response."
    );
  }
  return {
    questionId: question.id,
    questionType: question.type,
    attemptedAt,
    responseSummary: summary,
    isCorrect: grade.isCorrect,
    scorePercent: grade.scorePercent,
    misconceptionKeys: [...grade.misconceptionKeys],
    variantSeed: grade.variantSeed,
    retryIndex
  };
}

export function appendAttemptHistory(
  history: readonly AssessmentAttemptRecord[],
  attempt: AssessmentAttemptRecord,
  limit = DEFAULT_ATTEMPT_HISTORY_LIMIT
): AssessmentAttemptRecord[] {
  assertHistoryLimit(limit);
  assertIsoTimestamp(attempt.attemptedAt, "attemptedAt");
  if (attempt.responseSummary.trim() === "") {
    throw new AssessmentValidationError(
      "Attempt history cannot contain a blank response summary."
    );
  }
  return [...history, { ...attempt, misconceptionKeys: [...attempt.misconceptionKeys] }]
    .slice(-limit);
}

export function recentQuestionAttempts(
  history: readonly AssessmentAttemptRecord[],
  questionId: string,
  limit = DEFAULT_ATTEMPT_HISTORY_LIMIT
): AssessmentAttemptRecord[] {
  assertHistoryLimit(limit);
  if (questionId.trim() === "") {
    throw new AssessmentValidationError("questionId must not be blank.");
  }
  return history
    .filter(
      (attempt) =>
        attempt.questionId === questionId &&
        attempt.responseSummary.trim() !== "" &&
        Number.isFinite(Date.parse(attempt.attemptedAt))
    )
    .sort((left, right) => {
      const timeDifference =
        Date.parse(left.attemptedAt) - Date.parse(right.attemptedAt);
      if (timeDifference !== 0) return timeDifference;
      return left.responseSummary < right.responseSummary
        ? -1
        : left.responseSummary > right.responseSummary
          ? 1
          : 0;
    })
    .slice(-limit)
    .map((attempt) => ({
      ...attempt,
      misconceptionKeys: [...attempt.misconceptionKeys]
    }));
}

export function getSolutionReveal(
  question: AcademyQuestion,
  request: SolutionRevealRequest
): SolutionRevealResult {
  const genuineAttempt = request.attemptHistory.some(
    (attempt) =>
      attempt.questionId === question.id &&
      attempt.questionType === question.type &&
      attempt.responseSummary.trim() !== "" &&
      Number.isFinite(Date.parse(attempt.attemptedAt))
  );
  const eligible = request.explicitReveal || genuineAttempt;
  if (!eligible) {
    return {
      questionId: question.id,
      eligible: false,
      revealed: false,
      reason:
        "Submit a genuine attempt or explicitly request the worked solution.",
      solution: []
    };
  }
  return {
    questionId: question.id,
    eligible: true,
    revealed: true,
    reason: request.explicitReveal
      ? "The learner explicitly requested the worked solution."
      : "A genuine attempt has been recorded.",
    solution: [...question.solution]
  };
}
