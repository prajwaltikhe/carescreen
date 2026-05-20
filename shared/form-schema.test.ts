import { describe, expect, it } from 'vitest';
import { FORM_SCHEMA, getScreenById, SCREEN_COUNT } from './form-schema';
import { validateFormSchema } from './form-engine';
import { resolveNextStep } from './form-engine';

describe('FORM_SCHEMA', () => {
  it('has exactly 15 screens', () => {
    expect(SCREEN_COUNT).toBe(15);
    expect(FORM_SCHEMA.screens).toHaveLength(15);
  });

  it('passes structural validation', () => {
    expect(validateFormSchema()).toEqual([]);
  });

  it('has unique screen ids 1-15', () => {
    const ids = FORM_SCHEMA.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(15);
    expect(ids.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    );
  });

  it('branches age < 18 to terminal underage', () => {
    const { terminal } = resolveNextStep(1, 16, { age: 16 });
    expect(terminal?.code).toBe('underage');
  });

  it('branches pregnancy yes to terminal', () => {
    const { terminal } = resolveNextStep(5, 'yes', { pregnant: 'yes' });
    expect(terminal?.code).toBe('pregnancy');
  });

  it('skips hba1c when no diabetes', () => {
    const { nextScreenId } = resolveNextStep(7, 'no', { diabetes: 'no' });
    expect(nextScreenId).toBe(9);
  });

  it('routes to hba1c when diabetes yes', () => {
    const { nextScreenId } = resolveNextStep(7, 'yes', { diabetes: 'yes' });
    expect(nextScreenId).toBe(8);
  });

  it('computes BMI branch for low BMI', () => {
    const answers = { weightKg: 50, heightCm: 180 };
    const { terminal } = resolveNextStep(4, undefined, answers);
    expect(terminal?.code).toBe('bmi_too_low');
  });

  it('screen 15 is evaluation type', () => {
    expect(getScreenById(15)?.inputType).toBe('evaluation');
  });
});
