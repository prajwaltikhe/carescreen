/** UI copy and metadata keyed by screen id or answer key */
export const SCREEN_SHORT_LABELS: Record<number, string> = {
  1: 'Age',
  2: 'Weight',
  3: 'Height',
  4: 'BMI',
  5: 'Pregnancy',
  6: 'Conditions',
  7: 'Diabetes',
  8: 'HbA1c',
  9: 'Blood pressure',
  10: 'Medications',
  11: 'Smoking',
  12: 'Alcohol',
  13: 'Activity',
  14: 'Diet',
  15: 'Results',
};

export const FIELD_UNITS: Record<string, string> = {
  age: 'years',
  weightKg: 'kg',
  heightCm: 'cm',
  hba1c: '%',
};

export const FIELD_HINTS: Record<string, string> = {
  age: 'You must be 18 or older for GLP-1 screening.',
  weightKg: 'Ensure the value is in kilograms.',
  heightCm: 'Ensure the value is in centimeters.',
  hba1c: 'From your most recent lab result.',
};

export function getBmiCategory(bmi: number): {
  label: string;
  description: string;
  tone: 'low' | 'ok' | 'elevated' | 'high' | 'very-high';
} {
  if (bmi < 18.5) {
    return { label: 'Underweight', description: 'Below typical GLP-1 eligibility range', tone: 'low' };
  }
  if (bmi < 25) {
    return { label: 'Below threshold', description: 'BMI under 25 — usually not eligible', tone: 'low' };
  }
  if (bmi < 30) {
    return { label: 'Eligible range', description: 'BMI 25–29.9', tone: 'ok' };
  }
  if (bmi < 40) {
    return { label: 'Eligible range', description: 'BMI 30–39.9', tone: 'elevated' };
  }
  return {
    label: 'High BMI',
    description: 'BMI 40+ — requires clinical review',
    tone: 'very-high',
  };
}

const ANSWER_LABELS: Record<string, Record<string, string>> = {
  pregnant: { yes: 'Yes', no: 'No' },
  diabetes: { yes: 'Yes', no: 'No' },
  smoking: { yes: 'Yes', no: 'No' },
  alcohol: {
    never: 'Never',
    monthly: 'Monthly',
    weekly: 'Weekly',
    daily: 'Daily',
  },
  activity: {
    sedentary: 'Sedentary',
    light: 'Light (1–2×/week)',
    moderate: 'Moderate (3–4×/week)',
    vigorous: 'Vigorous (5+×/week)',
  },
};

const CHECKBOX_LABELS: Record<string, string> = {
  hypertension: 'Hypertension',
  dyslipidemia: 'Dyslipidemia',
  sleep_apnea: 'Sleep Apnea',
  gerd: 'GERD',
  thyroid_disorder: 'Thyroid Disorder',
  normal: 'Normal BP',
  elevated: 'Elevated BP',
  stage1: 'Stage 1 Hypertension',
  stage2: 'Stage 2 Hypertension',
  crisis: 'Hypertensive Crisis',
  ace_inhibitors: 'ACE inhibitors',
  beta_blockers: 'Beta blockers',
  statins: 'Statins',
  thyroid_medication: 'Thyroid medication',
  glp1: 'GLP-1 receptor agonist',
  high_sugar: 'High sugar intake',
  high_processed: 'High processed foods',
  sugary_beverages: 'Frequent sugary beverages',
  high_fiber: 'High fiber diet',
  balanced: 'Balanced diet',
};

export function formatAnswerForSummary(
  key: string,
  value: string | number | string[] | undefined,
): string {
  if (value === undefined || value === null) return '—';
  if (key === 'bmi' && typeof value === 'number') {
    return `${value} (${getBmiCategory(value).label})`;
  }
  if (typeof value === 'number') {
    const unit = FIELD_UNITS[key];
    return unit ? `${value} ${unit}` : String(value);
  }
  if (typeof value === 'string') {
    return ANSWER_LABELS[key]?.[value] ?? value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None selected';
    return value.map((v) => CHECKBOX_LABELS[v] ?? v).join(', ');
  }
  return String(value);
}

export const SUMMARY_SECTIONS: { title: string; keys: string[] }[] = [
  { title: 'Demographics & body metrics', keys: ['age', 'weightKg', 'heightCm', 'bmi'] },
  { title: 'Health history', keys: ['pregnant', 'comorbidities', 'diabetes', 'hba1c', 'bloodPressure'] },
  { title: 'Medications & lifestyle', keys: ['medications', 'smoking', 'alcohol', 'activity', 'diet'] },
];
