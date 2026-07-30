export const ACADEMY_CONTENT_VERSION = "2026.07.30";
export const ACADEMY_SCHEMA_VERSION = 1 as const;

export type AcademyStage = "E0" | "E1" | "E2" | "E3" | "E4";
export type MasteryState =
  | "not-started"
  | "introduced"
  | "practising"
  | "proficient"
  | "mastered"
  | "review-due";

export interface SourceReference {
  id: string;
  title: string;
  organisation: string;
  url: string;
  kind: "official-documentation" | "courseware" | "standard" | "textbook" | "video";
  licence: string;
  attribution: string;
  lastValidated: string;
  optional: boolean;
}

export interface FormulaVariable {
  symbol: string;
  meaning: string;
  siUnit: string;
}

export interface AcademyReviewedMath {
  id: string;
  plainText: string;
  latex: string;
  spoken: string;
  displayMode: boolean;
}

export type AcademyInstructionPart =
  | { kind: "text"; text: string }
  | { kind: "math"; expression: AcademyReviewedMath };

export type AcademyInstruction = AcademyInstructionPart[];

export interface AcademyQuestionMathSupport {
  prompt: AcademyInstruction;
  hints: (AcademyInstruction | null)[];
  solution: (AcademyInstruction | null)[];
}

export interface FormulaSpec {
  id: string;
  latex: string;
  displayMode: boolean;
  spoken: string;
  variables: FormulaVariable[];
  assumptions: string[];
  derivationSteps: AcademyInstruction[];
}

export interface WorkedExampleVerificationOutput {
  outputId: string;
  value: number;
  canonicalUnit: string;
}

export interface WorkedExample {
  id: string;
  verificationCaseId: string;
  verificationOutputs: WorkedExampleVerificationOutput[];
  title: string;
  problem: AcademyInstruction;
  assumptions: string[];
  governingFormulaId: string | null;
  steps: AcademyInstruction[];
  result: AcademyInstruction;
  dimensionalCheck: AcademyInstruction;
  independentCheck: AcademyInstruction;
}

export interface MediaSpec {
  id: string;
  provider: "youtube" | "local" | "native-interactive";
  creator: string;
  title: string;
  kind: "video" | "interactive" | "diagram";
  originalUrl: string | null;
  providerId: string | null;
  durationMinutes: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
  learningOutcome: string;
  poster: string | null;
  captionsStatus: "available" | "not-applicable" | "unverified";
  nativeSummaryFallback: string;
  chapters: string[];
  licence: string;
  attribution: string;
  embedPermission: "permitted" | "not-applicable" | "unverified" | "blocked";
  lastValidated: string;
  privacyBehaviour: string;
  offlineFallback: string;
  alternativeSourceId: string | null;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

interface QuestionBase {
  id: string;
  skillIds: string[];
  prompt: string;
  mathSupport?: AcademyQuestionMathSupport;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  misconceptionFeedback: Record<string, string>;
  hints: string[];
  solution: string[];
  variantSeed: number;
  retryVariants?: AcademyQuestion[];
}

export interface SingleChoiceQuestion extends QuestionBase {
  type: "single-choice";
  options: ChoiceOption[];
  correctOptionId: string;
}

export interface MultipleSelectionQuestion extends QuestionBase {
  type: "multiple-selection";
  options: ChoiceOption[];
  correctOptionIds: string[];
}

export interface NumericQuestion extends QuestionBase {
  type: "numeric";
  expectedValue: number;
  canonicalUnit: string;
  acceptedUnits: Record<string, number>;
  absoluteTolerance: number;
  relativeTolerance: number;
}

export interface OrderingQuestion extends QuestionBase {
  type: "ordering";
  items: ChoiceOption[];
  correctOrder: string[];
}

export interface MatchingQuestion extends QuestionBase {
  type: "matching";
  left: ChoiceOption[];
  right: ChoiceOption[];
  correctPairs: Record<string, string>;
}

export interface ShortResponseQuestion extends QuestionBase {
  type: "short-response";
  requiredTerms: string[];
  minimumTerms: number;
}

export type AcademyDiagramLayout = "chain" | "branch" | "convergence";

export type AcademyDiagramNodeRole =
  | "system"
  | "application"
  | "relationship"
  | "failure"
  | "decision";

export interface AcademyDiagramNode {
  id: string;
  label: string;
  detail: string;
  role: AcademyDiagramNodeRole;
}

export interface AcademyDiagramEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  direction: "directed" | "undirected";
}

export interface AcademyDiagramStructure {
  layout: AcademyDiagramLayout;
  nodes: AcademyDiagramNode[];
  edges: AcademyDiagramEdge[];
  answerEdgeId: string;
}

export interface DiagramQuestion extends QuestionBase {
  type: "diagram";
  diagramDescription: string;
  diagram: AcademyDiagramStructure;
  options: ChoiceOption[];
  correctOptionId: string;
}

export interface CodeAnalysisQuestion extends QuestionBase {
  type: "code-analysis";
  language: string;
  code: string;
  options: ChoiceOption[];
  correctOptionId: string;
}

export interface SeededCalculationQuestion extends QuestionBase {
  type: "seeded-calculation";
  generator: {
    algorithm: "linear-scale" | "inverse-scale" | "sum" | "difference" | "product";
    minimum: number;
    maximum: number;
    step: number;
    coefficient: number;
    offset: number;
  };
  canonicalUnit: string;
  acceptedUnits: Record<string, number>;
  absoluteTolerance: number;
  relativeTolerance: number;
}

export type AcademyQuestion =
  | SingleChoiceQuestion
  | MultipleSelectionQuestion
  | NumericQuestion
  | OrderingQuestion
  | MatchingQuestion
  | ShortResponseQuestion
  | DiagramQuestion
  | CodeAnalysisQuestion
  | SeededCalculationQuestion;

export interface AcademyConceptExplorerControl {
  id: string;
  label: string;
  outcome: string;
  requiredAction: string;
  retainedEvidence: string;
}

export type LessonBlock =
  | { id: string; kind: "prose"; heading: string; paragraphs: string[] }
  | { id: string; kind: "definition"; term: string; definition: string }
  | { id: string; kind: "inline-math"; formulaId: string; context: string }
  | { id: string; kind: "display-math"; formulaId: string; context: string }
  | {
      id: string;
      kind: "derivation";
      heading: string;
      formulaId: string;
      steps: AcademyInstruction[];
    }
  | { id: string; kind: "worked-example"; example: WorkedExample }
  | { id: string; kind: "diagram"; title: string; description: string; textEquivalent: string }
  | {
      id: string;
      kind: "image";
      src: string;
      alt: string;
      caption: string;
      width: number;
      height: number;
    }
  | { id: string; kind: "media"; mediaId: string }
  | {
      id: string;
      kind: "interactive-visual";
      title: string;
      description: string;
      controls: AcademyConceptExplorerControl[];
      textEquivalent: string;
    }
  | { id: string; kind: "warning"; heading: string; body: string }
  | { id: string; kind: "misconception"; claim: string; correction: string }
  | { id: string; kind: "knowledge-check"; questionIds: string[] }
  | { id: string; kind: "practice-set"; questionIds: string[] }
  | {
      id: string;
      kind: "laboratory-callout";
      title: string;
      route: string;
      task: string;
      expectedOutcome: string;
    }
  | { id: string; kind: "summary"; points: string[] }
  | { id: string; kind: "source-note"; sourceIds: string[] };

export interface Lesson {
  schemaVersion: typeof ACADEMY_SCHEMA_VERSION;
  contentVersion: string;
  id: string;
  unitId: string;
  title: string;
  description: string;
  objectives: string[];
  prerequisites: string[];
  estimatedMinutes: number;
  skillIds: string[];
  blocks: LessonBlock[];
  formulae: FormulaSpec[];
  questions: AcademyQuestion[];
  mediaIds: string[];
  laboratoryRoute: string | null;
  summary: string[];
  retrievalPrompts: string[];
  sourceIds: string[];
  previousLessonId: string | null;
  nextLessonId: string | null;
}

export interface AcademyStageContent {
  schemaVersion: typeof ACADEMY_SCHEMA_VERSION;
  contentVersion: string;
  stage: AcademyStage;
  lessons: Lesson[];
}

export interface AssessmentSpec {
  id: string;
  kind: "guided-practice" | "lesson-practice" | "unit-quiz" | "unit-test" | "course-challenge";
  title: string;
  questionIds: string[];
  requiredScorePercent: number;
  requiredAppliedEvidence: boolean;
  timeLimitMinutes: number | null;
}

export interface Unit {
  schemaVersion: typeof ACADEMY_SCHEMA_VERSION;
  contentVersion: string;
  id: string;
  legacyModuleId: string;
  courseId: string;
  title: string;
  description: string;
  prerequisiteSkillIds: string[];
  lessonIds: string[];
  quiz: AssessmentSpec;
  unitTest: AssessmentSpec;
  laboratoryRoute: string | null;
  projectRoute: string | null;
  masterySummary: string;
}

export interface Course {
  schemaVersion: typeof ACADEMY_SCHEMA_VERSION;
  contentVersion: string;
  id: string;
  stage: AcademyStage;
  title: string;
  description: string;
  prerequisiteCourseIds: string[];
  outcomes: string[];
  unitIds: string[];
  estimatedMinutes: number;
  challenge: AssessmentSpec;
  sourceIds: string[];
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  prerequisiteSkillIds: string[];
  unitIds: string[];
  lessonIds: string[];
  requiresAppliedEvidence: boolean;
}

export interface CurriculumCoverageEntry {
  requirementId: string;
  subject: string;
  courseId: string;
  unitId: string;
  lessonId: string;
  prerequisiteSkillIds: string[];
  skillIds: string[];
  assessmentIds: string[];
  appliedRoute: string | null;
  status: "mapped";
}

export interface RebootActivityMapping {
  sessionId: string;
  lessonIds: string[];
  assessmentIds: string[];
  reviewSkillIds: string[];
  appliedRoutes: string[];
  mandatoryProof: boolean;
}

export interface AcademyCatalogue {
  courses: Course[];
  units: Unit[];
  skills: Skill[];
  coverage: CurriculumCoverageEntry[];
  rebootMappings: RebootActivityMapping[];
  media: MediaSpec[];
  sources: SourceReference[];
}
