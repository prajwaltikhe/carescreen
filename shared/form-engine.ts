import { FORM_SCHEMA, getScreenById } from './form-schema';
import type {
  AnswerValue,
  BranchCondition,
  BranchTarget,
  EligibilityResult,
  FormScreen,
  SessionAnswers,
  TerminalOutcome,
} from './types';
import { evaluateEligibility } from './evaluator';

export function computeBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0 || weightKg <= 0) return 0;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBmiFromAnswers(answers: SessionAnswers): number | undefined {
  const weight = answers.weightKg as number | undefined;
  const height = answers.heightCm as number | undefined;
  if (weight == null || height == null) return undefined;
  return computeBmi(weight, height);
}

function resolveBranchTarget(
  target: BranchTarget,
  answers: SessionAnswers,
): { nextScreenId: number; terminal?: TerminalOutcome } {
  if ('end' in target) {
    return { nextScreenId: 15, terminal: target.end };
  }
  return { nextScreenId: target.screenId };
}

function matchesBranch(
  branch: BranchCondition,
  screenKey: string,
  answer: AnswerValue | undefined,
  answers: SessionAnswers,
): boolean {
  switch (branch.type) {
    case 'always':
      return true;
    case 'lt': {
      const v = answers[branch.field] as number | undefined;
      return v != null && v < branch.value;
    }
    case 'gt': {
      const v = answers[branch.field] as number | undefined;
      return v != null && v > branch.value;
    }
    case 'equals': {
      const v = answers[branch.field];
      return v === branch.value;
    }
    case 'includes': {
      const v = answers[branch.field] as string[] | undefined;
      return Array.isArray(v) && v.includes(branch.value);
    }
    case 'bmi_lt': {
      const bmi = getBmiFromAnswers(answers);
      return bmi != null && bmi < branch.value;
    }
    case 'bmi_gte': {
      const bmi = getBmiFromAnswers(answers);
      return bmi != null && bmi >= branch.value;
    }
    case 'bmi_range': {
      const bmi = getBmiFromAnswers(answers);
      return bmi != null && bmi >= branch.min && bmi < branch.max;
    }
    default:
      return false;
  }
}

export function resolveNextStep(
  screenId: number,
  answer: AnswerValue | undefined,
  answers: SessionAnswers,
): {
  nextScreenId: number;
  terminal?: TerminalOutcome;
  mergedAnswers: SessionAnswers;
} {
  const screen = getScreenById(screenId);
  if (!screen) {
    throw new Error(`Unknown screen: ${screenId}`);
  }

  const mergedAnswers: SessionAnswers = { ...answers };
  if (answer !== undefined && screen.key !== 'bmi' && screen.inputType !== 'evaluation') {
    mergedAnswers[screen.key] = answer;
  }

  if (screen.inputType === 'computed') {
    const bmi = getBmiFromAnswers(mergedAnswers);
    if (bmi != null) {
      mergedAnswers.bmi = bmi;
    }
  }

  for (const branch of screen.branches) {
    const fieldAnswer =
      screen.inputType === 'computed'
        ? mergedAnswers.bmi
        : (mergedAnswers[screen.key] ?? answer);
    if (matchesBranch(branch, screen.key, fieldAnswer, mergedAnswers)) {
      return {
        ...resolveBranchTarget(branch.next, mergedAnswers),
        mergedAnswers,
      };
    }
  }

  return {
    nextScreenId: Math.min(screenId + 1, 15),
    mergedAnswers,
  };
}

export function terminalToResult(terminal: TerminalOutcome): EligibilityResult {
  return {
    status: terminal.status,
    reason: terminal.reason,
    code: terminal.code,
    flags: [],
  };
}

export function evaluateScreen15(answers: SessionAnswers): EligibilityResult {
  return evaluateEligibility(answers);
}

export function getProgressPercent(currentScreen: number): number {
  return Math.round(((currentScreen - 1) / (FORM_SCHEMA.screens.length - 1)) * 100);
}

export function buildQuestionPayload(
  screen: FormScreen,
  currentScreen: number,
  answers: SessionAnswers,
): {
  screen: FormScreen;
  currentScreen: number;
  totalScreens: number;
  progressPercent: number;
  computedValue?: number;
} {
  const payload: ReturnType<typeof buildQuestionPayload> = {
    screen,
    currentScreen,
    totalScreens: FORM_SCHEMA.screens.length,
    progressPercent: getProgressPercent(currentScreen),
  };

  if (screen.inputType === 'computed') {
    payload.computedValue = getBmiFromAnswers(answers);
  }

  return payload;
}

/** Validate schema structure for tests */
export function validateFormSchema(): string[] {
  const errors: string[] = [];
  const ids = new Set<number>();

  for (const screen of FORM_SCHEMA.screens) {
    if (ids.has(screen.id)) {
      errors.push(`Duplicate screen id: ${screen.id}`);
    }
    ids.add(screen.id);

    if (!screen.key) {
      errors.push(`Screen ${screen.id} missing key`);
    }

    if (screen.inputType === 'radio' || screen.inputType === 'checkbox') {
      if (!screen.options?.length) {
        errors.push(`Screen ${screen.id} (${screen.key}) missing options`);
      }
    }

    if (screen.inputType === 'number' && screen.required && !screen.validation) {
      errors.push(`Screen ${screen.id} number field should have validation`);
    }
  }

  if (FORM_SCHEMA.screens.length !== 15) {
    errors.push(`Expected 15 screens, found ${FORM_SCHEMA.screens.length}`);
  }

  return errors;
}
