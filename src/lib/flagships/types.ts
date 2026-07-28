export const FLAGSHIP_SCHEMA_VERSION = "1.0.0" as const;

export type FlagshipSchemaVersion = typeof FLAGSHIP_SCHEMA_VERSION;

export type FlagshipDomain =
  | "controls"
  | "robotics-autonomy"
  | "embedded-electronics-sensing"
  | "mechanical-design-dynamics"
  | "applied-ai-ml";

export interface FlagshipOutcome {
  statement: string;
  measure: string;
  passCriterion: string;
}

export interface FlagshipSequenceStep {
  id: string;
  title: string;
  action: string;
  verification: string;
  outputs: string[];
}

export interface EquationVariable {
  symbol: string;
  quantity: string;
  siUnit: string;
}

export interface FlagshipEquation {
  id: string;
  expression: string;
  variables: EquationVariable[];
  assumptions: string[];
  validWhen: string[];
}

export interface DeterministicWorkflow {
  inputs: string[];
  steps: string[];
  expectedOutputs: string[];
}

export interface FlagshipChallenge {
  prompt: string;
  constraints: string[];
  knownPassCriteria: string[];
}

export interface FailureState {
  id: string;
  condition: string;
  diagnosis: string;
  repair: string;
}

export interface EvidenceRubricItem {
  criterion: string;
  requiredEvidence: string;
  passCondition: string;
}

export interface WorkflowOutputDescriptor {
  kind: "notebook" | "calculation" | "evidence";
  title: string;
  requiredFields: string[];
}

export interface AccessibleAlternative {
  forOutput: string;
  tableColumns: string[];
  textSummary: string;
}

export interface LinkedApplication {
  projectId: string;
  labId: string;
  application: string;
}

export interface FlagshipWorkflowSpecification {
  schemaVersion: FlagshipSchemaVersion;
  id: string;
  title: string;
  domain: FlagshipDomain;
  linkedSkillIds: string[];
  summary: string;
  prerequisites: string[];
  outcomes: FlagshipOutcome[];
  sequence: FlagshipSequenceStep[];
  equations: FlagshipEquation[];
  deterministicWorkflow: DeterministicWorkflow;
  challenge: FlagshipChallenge;
  failureStates: FailureState[];
  linkedApplication: LinkedApplication;
  evidenceRubric: EvidenceRubricItem[];
  outputs: WorkflowOutputDescriptor[];
  accessibleAlternatives: AccessibleAlternative[];
  safetyBoundary: string;
}
