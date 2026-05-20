import type { FormSchema } from './types';

export const FORM_SCHEMA: FormSchema = {
  title: 'GLP-1 Weight-Loss Medication Eligibility Screening',
  version: '1.0.0',
  screens: [
    {
      id: 1,
      key: 'age',
      prompt: 'What is your age?',
      inputType: 'number',
      required: true,
      validation: { min: 1, max: 120 },
      branches: [
        {
          type: 'lt',
          field: 'age',
          value: 18,
          next: {
            end: {
              status: 'ineligible',
              reason: 'Ineligible — Underage',
              code: 'underage',
            },
          },
        },
        {
          type: 'always',
          next: { screenId: 2 },
        },
      ],
    },
    {
      id: 2,
      key: 'weightKg',
      prompt: 'Enter your weight in kilograms.',
      inputType: 'number',
      required: true,
      validation: { min: 20, max: 500 },
      branches: [{ type: 'always', next: { screenId: 3 } }],
    },
    {
      id: 3,
      key: 'heightCm',
      prompt: 'Enter your height in centimeters.',
      inputType: 'number',
      required: true,
      validation: { min: 50, max: 250 },
      branches: [{ type: 'always', next: { screenId: 4 } }],
    },
    {
      id: 4,
      key: 'bmi',
      prompt: 'BMI Evaluation',
      description: 'Your BMI is calculated from your height and weight.',
      inputType: 'computed',
      computeFrom: ['weightKg', 'heightCm'],
      branches: [
        {
          type: 'bmi_lt',
          value: 25,
          next: {
            end: {
              status: 'ineligible',
              reason: 'Ineligible — BMI Too Low',
              code: 'bmi_too_low',
            },
          },
        },
        {
          type: 'bmi_gte',
          value: 40,
          next: {
            end: {
              status: 'requires_clinical_review',
              reason: 'Requires Clinical Review — High BMI',
              code: 'high_bmi',
            },
          },
        },
        {
          type: 'bmi_range',
          min: 25,
          max: 40,
          next: { screenId: 5 },
        },
      ],
    },
    {
      id: 5,
      key: 'pregnant',
      prompt: 'Are you currently pregnant?',
      inputType: 'radio',
      required: true,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      branches: [
        {
          type: 'equals',
          field: 'pregnant',
          value: 'yes',
          next: {
            end: {
              status: 'ineligible',
              reason: 'Ineligible — Pregnancy Contraindication',
              code: 'pregnancy',
            },
          },
        },
        {
          type: 'always',
          next: { screenId: 6 },
        },
      ],
    },
    {
      id: 6,
      key: 'comorbidities',
      prompt:
        'Which chronic conditions have you been diagnosed with? (Select all that apply)',
      inputType: 'checkbox',
      required: false,
      options: [
        { value: 'hypertension', label: 'Hypertension' },
        { value: 'dyslipidemia', label: 'Dyslipidemia' },
        { value: 'sleep_apnea', label: 'Sleep Apnea' },
        { value: 'gerd', label: 'GERD' },
        { value: 'thyroid_disorder', label: 'Thyroid Disorder' },
      ],
      branches: [{ type: 'always', next: { screenId: 7 } }],
    },
    {
      id: 7,
      key: 'diabetes',
      prompt: 'Have you ever been diagnosed with diabetes?',
      inputType: 'radio',
      required: true,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      branches: [
        {
          type: 'equals',
          field: 'diabetes',
          value: 'yes',
          next: { screenId: 8 },
        },
        {
          type: 'always',
          next: { screenId: 9 },
        },
      ],
    },
    {
      id: 8,
      key: 'hba1c',
      prompt: 'Enter your latest HbA1c (%) result.',
      inputType: 'number',
      required: true,
      validation: { min: 4, max: 20 },
      branches: [
        {
          type: 'gt',
          field: 'hba1c',
          value: 9.0,
          next: {
            end: {
              status: 'ineligible',
              reason: 'Ineligible — Uncontrolled Diabetes',
              code: 'uncontrolled_diabetes',
            },
          },
        },
        {
          type: 'always',
          next: { screenId: 9 },
        },
      ],
    },
    {
      id: 9,
      key: 'bloodPressure',
      prompt:
        'Check all that apply based on your most recent blood pressure reading',
      inputType: 'checkbox',
      required: false,
      options: [
        { value: 'normal', label: 'Normal (< 120/80)' },
        { value: 'elevated', label: 'Elevated (120–129 / <80)' },
        { value: 'stage1', label: 'Stage 1 Hypertension (130–139 / 80–89)' },
        { value: 'stage2', label: 'Stage 2 Hypertension (≥140 / ≥90)' },
        {
          value: 'crisis',
          label: 'Hypertensive Crisis (>180 / >120)',
        },
      ],
      branches: [{ type: 'always', next: { screenId: 10 } }],
    },
    {
      id: 10,
      key: 'medications',
      prompt: 'Which medications are you currently prescribed?',
      inputType: 'checkbox',
      required: false,
      options: [
        { value: 'ace_inhibitors', label: 'ACE inhibitors' },
        { value: 'beta_blockers', label: 'Beta blockers' },
        { value: 'statins', label: 'Statins' },
        { value: 'thyroid_medication', label: 'Thyroid medication' },
        { value: 'glp1', label: 'GLP-1 receptor agonist' },
      ],
      branches: [
        {
          type: 'includes',
          field: 'medications',
          value: 'glp1',
          next: {
            end: {
              status: 'requires_clinical_review',
              reason: 'Requires Clinical Review — Already On Therapy',
              code: 'already_on_glp1',
            },
          },
        },
        {
          type: 'always',
          next: { screenId: 11 },
        },
      ],
    },
    {
      id: 11,
      key: 'smoking',
      prompt: 'Do you currently smoke tobacco?',
      inputType: 'radio',
      required: true,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      branches: [{ type: 'always', next: { screenId: 12 } }],
    },
    {
      id: 12,
      key: 'alcohol',
      prompt: 'How often do you consume alcohol?',
      inputType: 'radio',
      required: true,
      options: [
        { value: 'never', label: 'Never' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'daily', label: 'Daily' },
      ],
      branches: [{ type: 'always', next: { screenId: 13 } }],
    },
    {
      id: 13,
      key: 'activity',
      prompt: 'How would you describe your typical activity level?',
      inputType: 'radio',
      required: true,
      options: [
        { value: 'sedentary', label: 'Sedentary' },
        { value: 'light', label: 'Light (1–2x/week)' },
        { value: 'moderate', label: 'Moderate (3–4x/week)' },
        { value: 'vigorous', label: 'Vigorous (5+x/week)' },
      ],
      branches: [{ type: 'always', next: { screenId: 14 } }],
    },
    {
      id: 14,
      key: 'diet',
      prompt: 'Which best describes your diet? (Select all that apply)',
      inputType: 'checkbox',
      required: false,
      options: [
        { value: 'high_sugar', label: 'High sugar intake' },
        { value: 'high_processed', label: 'High processed foods' },
        { value: 'sugary_beverages', label: 'Frequent sugary beverages' },
        { value: 'high_fiber', label: 'High fiber diet' },
        { value: 'balanced', label: 'Balanced diet' },
      ],
      branches: [{ type: 'always', next: { screenId: 15 } }],
    },
    {
      id: 15,
      key: 'evaluation',
      prompt: 'Final Evaluation & Eligibility Outcome',
      inputType: 'evaluation',
      branches: [],
    },
  ],
};

export const SCREEN_COUNT = FORM_SCHEMA.screens.length;

export function getScreenById(id: number) {
  return FORM_SCHEMA.screens.find((s) => s.id === id);
}

export function getScreenByKey(key: string) {
  return FORM_SCHEMA.screens.find((s) => s.key === key);
}
