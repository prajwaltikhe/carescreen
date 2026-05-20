export type InputType = 'number' | 'radio' | 'checkbox' | 'computed' | 'evaluation';

export type OutcomeStatus = 'eligible' | 'ineligible' | 'requires_clinical_review';

export interface FormOption {
  value: string;
  label: string;
}

export type BranchCondition =
  | { type: 'lt'; field: string; value: number; next: BranchTarget }
  | { type: 'gt'; field: string; value: number; next: BranchTarget }
  | { type: 'equals'; field: string; value: string | number | boolean; next: BranchTarget }
  | { type: 'includes'; field: string; value: string; next: BranchTarget }
  | { type: 'bmi_lt'; value: number; next: BranchTarget }
  | { type: 'bmi_gte'; value: number; next: BranchTarget }
  | { type: 'bmi_range'; min: number; max: number; next: BranchTarget }
  | { type: 'always'; next: BranchTarget };

export type BranchTarget =
  | { screenId: number }
  | { end: TerminalOutcome };

export interface TerminalOutcome {
  status: OutcomeStatus;
  reason: string;
  code: string;
}

export interface FormScreen {
  id: number;
  key: string;
  prompt: string;
  description?: string;
  inputType: InputType;
  options?: FormOption[];
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
  };
  branches: BranchCondition[];
  /** For computed screens: keys of answers used */
  computeFrom?: string[];
}

export interface FormSchema {
  title: string;
  version: string;
  screens: FormScreen[];
}

export type AnswerValue = string | number | string[];

export type SessionAnswers = Record<string, AnswerValue>;

export interface EligibilityResult {
  status: OutcomeStatus;
  reason: string;
  code: string;
  flags: string[];
}

export interface QuestionPayload {
  screen: FormScreen;
  currentScreen: number;
  totalScreens: number;
  progressPercent: number;
  computedValue?: number;
  priorAnswers?: SessionAnswers;
}
