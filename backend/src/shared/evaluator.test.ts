import { describe, expect, it } from 'vitest';
import { evaluateEligibility } from './evaluator';
import type { SessionAnswers } from './types';

const eligibleBase: SessionAnswers = {
  age: 45,
  weightKg: 90,
  heightCm: 170,
  bmi: 31.1,
  pregnant: 'no',
  comorbidities: ['hypertension'],
  diabetes: 'no',
  bloodPressure: ['normal'],
  medications: [],
  smoking: 'no',
  alcohol: 'monthly',
  activity: 'moderate',
  diet: ['balanced'],
};

describe('evaluateEligibility', () => {
  it('returns eligible for typical qualifying path', () => {
    const result = evaluateEligibility(eligibleBase);
    expect(result.status).toBe('eligible');
    expect(result.code).toBe('eligible');
  });

  it('returns underage when age < 18', () => {
    const result = evaluateEligibility({ ...eligibleBase, age: 16 });
    expect(result.status).toBe('ineligible');
    expect(result.code).toBe('underage');
  });

  it('returns bmi_too_low when BMI < 25', () => {
    const result = evaluateEligibility({ ...eligibleBase, bmi: 22 });
    expect(result.status).toBe('ineligible');
    expect(result.code).toBe('bmi_too_low');
  });

  it('computes BMI from weight/height when bmi key missing', () => {
    const { bmi: _, ...rest } = eligibleBase;
    const result = evaluateEligibility(rest);
    expect(result.status).toBe('eligible');
  });

  it('returns pregnancy ineligible', () => {
    const result = evaluateEligibility({ ...eligibleBase, pregnant: 'yes' });
    expect(result.code).toBe('pregnancy');
  });

  it('returns uncontrolled diabetes when hba1c > 9', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      diabetes: 'yes',
      hba1c: 10.2,
    });
    expect(result.code).toBe('uncontrolled_diabetes');
  });

  it('returns already_on_glp1 review', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      medications: ['glp1'],
    });
    expect(result.code).toBe('already_on_glp1');
  });

  it('returns high_bmi review when BMI >= 40', () => {
    const result = evaluateEligibility({ ...eligibleBase, bmi: 42 });
    expect(result.code).toBe('high_bmi');
  });

  it('returns stage2_diabetes review', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      diabetes: 'yes',
      hba1c: 7,
      bloodPressure: ['stage2'],
    });
    expect(result.code).toBe('stage2_diabetes');
  });

  it('returns hypertensive_crisis review', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      bloodPressure: ['crisis', 'normal'],
    });
    expect(result.code).toBe('hypertensive_crisis');
  });

  it('returns multiple_comorbidities review when >= 3', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      comorbidities: ['hypertension', 'gerd', 'sleep_apnea'],
    });
    expect(result.code).toBe('multiple_comorbidities');
  });

  it('returns stage1_lifestyle review', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      bloodPressure: ['stage1'],
      activity: 'sedentary',
      diet: ['high_sugar'],
    });
    expect(result.code).toBe('stage1_lifestyle');
  });

  it('returns daily_alcohol_risk review', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      alcohol: 'daily',
      comorbidities: ['hypertension', 'gerd'],
      bloodPressure: ['stage1'],
      activity: 'sedentary',
    });
    expect(result.code).toBe('daily_alcohol_risk');
  });

  it('returns flagged_review when age > 75 only', () => {
    const result = evaluateEligibility({ ...eligibleBase, age: 76 });
    expect(result.status).toBe('requires_clinical_review');
    expect(result.code).toBe('flagged_review');
    expect(result.flags).toContain('Age over 75 — proceed with caution');
  });

  it('does not flag hba1c at exactly 9.0', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      diabetes: 'yes',
      hba1c: 9.0,
    });
    expect(result.code).not.toBe('uncontrolled_diabetes');
  });

  it('handles missing optional arrays', () => {
    const result = evaluateEligibility({
      age: 40,
      bmi: 30,
      pregnant: 'no',
      diabetes: 'no',
    });
    expect(result.status).toBe('eligible');
  });

  it('daily alcohol review via high_processed diet risk factors', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      alcohol: 'daily',
      diet: ['high_processed', 'balanced'],
      comorbidities: ['hypertension', 'gerd'],
    });
    expect(result.code).toBe('daily_alcohol_risk');
  });

  it('daily alcohol review via stage2 BP plus sedentary activity', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      alcohol: 'daily',
      diabetes: 'no',
      bloodPressure: ['stage2'],
      activity: 'sedentary',
    });
    expect(result.code).toBe('daily_alcohol_risk');
  });

  it('daily alcohol review via smoking plus stage1 BP', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      alcohol: 'daily',
      smoking: 'yes',
      bloodPressure: ['stage1'],
    });
    expect(result.code).toBe('daily_alcohol_risk');
  });

  it('daily alcohol review via diabetes plus sedentary activity', () => {
    const result = evaluateEligibility({
      ...eligibleBase,
      alcohol: 'daily',
      diabetes: 'yes',
      hba1c: 7,
      activity: 'sedentary',
    });
    expect(result.code).toBe('daily_alcohol_risk');
  });

  it('skips underage check when age is absent', () => {
    const { age: _, ...noAge } = eligibleBase;
    expect(evaluateEligibility(noAge).status).toBe('eligible');
  });

  it('skips BMI check when BMI cannot be computed', () => {
    const result = evaluateEligibility({
      age: 40,
      pregnant: 'no',
      diabetes: 'no',
    });
    expect(result.status).toBe('eligible');
  });
});
