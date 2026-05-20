import { getBmiFromAnswers } from './form-engine';
import type { EligibilityResult, SessionAnswers } from './types';

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  return undefined;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function hasBp(values: string[], key: string): boolean {
  return values.includes(key);
}

/** Count moderate/high lifestyle risk factors for optional alcohol review */
function countModerateRiskFactors(answers: SessionAnswers): number {
  let count = 0;
  const comorbidities = asStringArray(answers.comorbidities);
  const bp = asStringArray(answers.bloodPressure);
  const diet = asStringArray(answers.diet);
  const activity = asString(answers.activity);
  const smoking = asString(answers.smoking);

  if (comorbidities.length >= 2) count++;
  if (hasBp(bp, 'stage1') || hasBp(bp, 'stage2')) count++;
  if (diet.includes('high_sugar') || diet.includes('high_processed')) count++;
  if (activity === 'sedentary') count++;
  if (smoking === 'yes') count++;
  if (asString(answers.diabetes) === 'yes') count++;

  return count;
}

/**
 * Pure eligibility evaluator for Screen 15 and consolidated rules.
 * Branch-level terminal outcomes are handled separately; this covers cumulative rules.
 */
export function evaluateEligibility(answers: SessionAnswers): EligibilityResult {
  const flags: string[] = [];

  // ── Immediate ineligibility ──
  const age = asNumber(answers.age);
  if (age != null && age < 18) {
    return {
      status: 'ineligible',
      reason: 'Ineligible — Underage',
      code: 'underage',
      flags: [],
    };
  }

  const bmi = asNumber(answers.bmi) ?? getBmiFromAnswers(answers);
  if (bmi != null && bmi < 25) {
    return {
      status: 'ineligible',
      reason: 'Ineligible — BMI Too Low',
      code: 'bmi_too_low',
      flags: [],
    };
  }

  if (asString(answers.pregnant) === 'yes') {
    return {
      status: 'ineligible',
      reason: 'Ineligible — Pregnancy Contraindication',
      code: 'pregnancy',
      flags: [],
    };
  }

  const hba1c = asNumber(answers.hba1c);
  if (hba1c != null && hba1c > 9.0) {
    return {
      status: 'ineligible',
      reason: 'Ineligible — Uncontrolled Diabetes',
      code: 'uncontrolled_diabetes',
      flags: [],
    };
  }

  const medications = asStringArray(answers.medications);
  if (medications.includes('glp1')) {
    return {
      status: 'requires_clinical_review',
      reason: 'Requires Clinical Review — Already On Therapy',
      code: 'already_on_glp1',
      flags: [],
    };
  }

  // ── Automatic clinical review ──
  if (age != null && age > 75) {
    flags.push('Age over 75 — proceed with caution');
  }

  if (bmi != null && bmi >= 40) {
    return {
      status: 'requires_clinical_review',
      reason: 'Requires Clinical Review — High BMI',
      code: 'high_bmi',
      flags,
    };
  }

  const diabetes = asString(answers.diabetes);
  const bp = asStringArray(answers.bloodPressure);

  if (diabetes === 'yes' && hasBp(bp, 'stage2')) {
    return {
      status: 'requires_clinical_review',
      reason: 'Requires Clinical Review — Stage 2 Hypertension with Diabetes',
      code: 'stage2_diabetes',
      flags,
    };
  }

  if (hasBp(bp, 'crisis')) {
    return {
      status: 'requires_clinical_review',
      reason: 'Requires Clinical Review — Hypertensive Crisis',
      code: 'hypertensive_crisis',
      flags,
    };
  }

  const comorbidities = asStringArray(answers.comorbidities);
  if (comorbidities.length >= 3) {
    return {
      status: 'requires_clinical_review',
      reason: 'Requires Clinical Review — Three or More Comorbid Conditions',
      code: 'multiple_comorbidities',
      flags,
    };
  }

  // ── Optional review rules ──
  const activity = asString(answers.activity);
  const diet = asStringArray(answers.diet);

  if (
    hasBp(bp, 'stage1') &&
    activity === 'sedentary' &&
    diet.includes('high_sugar')
  ) {
    return {
      status: 'requires_clinical_review',
      reason:
        'Requires Clinical Review — Stage 1 Hypertension with sedentary lifestyle and high sugar diet',
      code: 'stage1_lifestyle',
      flags,
    };
  }

  const alcohol = asString(answers.alcohol);
  if (alcohol === 'daily' && countModerateRiskFactors(answers) >= 2) {
    return {
      status: 'requires_clinical_review',
      reason:
        'Requires Clinical Review — Daily alcohol use with multiple risk factors',
      code: 'daily_alcohol_risk',
      flags,
    };
  }

  if (flags.length > 0) {
    return {
      status: 'requires_clinical_review',
      reason: 'Requires Clinical Review — ' + flags.join('; '),
      code: 'flagged_review',
      flags,
    };
  }

  return {
    status: 'eligible',
    reason: 'Eligible',
    code: 'eligible',
    flags: [],
  };
}
