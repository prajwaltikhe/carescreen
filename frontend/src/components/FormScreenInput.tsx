'use client';

import React, { useId, useRef, useEffect } from 'react';
import type { FormScreen } from '../../../shared/types';
import { FIELD_HINTS, FIELD_UNITS, getBmiCategory } from '../lib/screen-meta';

interface FormScreenInputProps {
  screen: FormScreen;
  computedValue?: number;
  initialValue?: string | number | string[];
  onChange: (value: string | number | string[]) => void;
  error?: string;
}

export function FormScreenInput({
  screen,
  computedValue,
  initialValue,
  onChange,
  error,
}: FormScreenInputProps) {
  const errorId = useId();

  if (screen.inputType === 'computed') {
    const bmi = computedValue ?? 0;
    const category = bmi > 0 ? getBmiCategory(bmi) : null;
    const toneStyles: Record<string, string> = {
      low: 'border-amber-200 bg-amber-50 text-amber-900',
      ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      elevated: 'border-teal-200 bg-teal-50 text-teal-900',
      high: 'border-orange-200 bg-orange-50 text-orange-900',
      'very-high': 'border-red-200 bg-red-50 text-red-900',
    };

    return (
      <section
        data-testid="computed-bmi"
        className="overflow-hidden rounded-xl border border-slate-200"
      >
        <header className="bg-slate-50 px-5 py-4">
          <p className="text-sm text-slate-600">
            {screen.description ?? 'Calculated from your height and weight.'}
          </p>
        </header>
        <div className="flex flex-col items-center px-5 py-8 sm:flex-row sm:justify-center sm:gap-10">
          <div className="text-center" aria-live="polite">
            <p className="text-sm font-medium text-slate-500">Your BMI</p>
            <p
              className="mt-1 text-5xl font-bold tracking-tight text-slate-900"
              data-testid="bmi-value"
            >
              {computedValue ?? '—'}
            </p>
          </div>
          {category && (
            <aside
              className={`rounded-lg border px-4 py-3 text-center ${toneStyles[category.tone]}`}
            >
              <p className="font-semibold">{category.label}</p>
              <p className="mt-0.5 text-sm opacity-90">{category.description}</p>
            </aside>
          )}
        </div>
        <footer className="border-t border-slate-100 bg-white px-5 py-3 text-center text-xs text-slate-500">
          Formula: weight (kg) ÷ [height (m)]² — tap Next to continue.
        </footer>
      </section>
    );
  }

  if (screen.inputType === 'evaluation') {
    return null;
  }

  if (screen.inputType === 'number') {
    return (
      <NumberInput
        screen={screen}
        initialValue={initialValue as number | undefined}
        onChange={onChange}
        error={error}
        errorId={errorId}
      />
    );
  }

  if (screen.inputType === 'radio') {
    return (
      <RadioInput
        screen={screen}
        initialValue={initialValue as string | undefined}
        onChange={onChange}
        error={error}
        errorId={errorId}
      />
    );
  }

  if (screen.inputType === 'checkbox') {
    return (
      <CheckboxInput
        screen={screen}
        initialValue={(initialValue as string[]) ?? []}
        onChange={onChange}
        error={error}
        errorId={errorId}
      />
    );
  }

  return null;
}

/* ─────────────── Number Input ─────────────── */

function NumberInput({
  screen,
  initialValue,
  onChange,
  error,
  errorId,
}: {
  screen: FormScreen;
  initialValue?: number;
  onChange: (v: number) => void;
  error?: string;
  errorId: string;
}) {
  const inputId = `input-${screen.key}`;
  const hintId = `${inputId}-hint`;
  const unit = FIELD_UNITS[screen.key];
  const hint = FIELD_HINTS[screen.key] ?? screen.description;

  // We use string state for the raw input value to allow empty strings and decimals
  const displayValue = initialValue !== undefined && !Number.isNaN(initialValue) ? initialValue.toString() : '';

  const placeholders: Record<string, string> = {
    age: 'e.g. 35',
    weightKg: 'e.g. 70',
    heightCm: 'e.g. 170',
    hba1c: 'e.g. 5.5',
  };
  const placeholder = placeholders[screen.key] || '';

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {screen.prompt}
        {screen.required ? ' (required)' : ''}
      </label>
      {hint && (
        <p id={hintId} className="mb-3 text-sm text-slate-500">
          {hint}
        </p>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={screen.key}
          type="number"
          inputMode="decimal"
          data-testid={`input-${screen.key}`}
          className="input-field pr-16"
          min={screen.validation?.min}
          max={screen.validation?.max}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? NaN : Number(v));
          }}
          aria-invalid={!!error}
          aria-describedby={
            [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
          }
          required={screen.required}
        />
        {unit && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="alert-error mt-3" data-testid="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────── Radio Input ─────────────── */

function RadioInput({
  screen,
  initialValue,
  onChange,
  error,
  errorId,
}: {
  screen: FormScreen;
  initialValue?: string;
  onChange: (v: string) => void;
  error?: string;
  errorId: string;
}) {
  const selected = initialValue ?? '';

  return (
    <fieldset data-testid={`fieldset-${screen.key}`} className="border-0 p-0" aria-required={screen.required}>
      <legend className="sr-only">{screen.prompt}</legend>
      {screen.description && <p className="mb-3 text-sm text-slate-500">{screen.description}</p>}
      <div className="space-y-2" role="radiogroup" aria-describedby={error ? errorId : undefined}>
        {screen.options?.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <label
              key={opt.value}
              data-testid={`option-${screen.key}-${opt.value}`}
              className={`option-card ${isSelected ? 'option-card-selected' : ''}`}
            >
              <input
                type="radio"
                name={screen.key}
                value={opt.value}
                data-testid={`radio-${screen.key}-${opt.value}`}
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) onChange(opt.value);
                }}
                className="sr-only peer"
                required={screen.required}
              />
              <span
                className={`radio-indicator ${isSelected ? 'radio-indicator-checked' : ''}`}
                aria-hidden="true"
              />
              <span className="font-medium text-slate-800">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="alert-error mt-3" data-testid="field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/* ─────────────── Checkbox Input ─────────────── */

function CheckboxInput({
  screen,
  initialValue,
  onChange,
  error,
  errorId,
}: {
  screen: FormScreen;
  initialValue: string[];
  onChange: (v: string[]) => void;
  error?: string;
  errorId: string;
}) {
  const selectedRef = useRef(initialValue);

  // Sync ref with parent updates
  useEffect(() => {
    selectedRef.current = initialValue;
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isChecked = e.target.checked;

    const current = selectedRef.current;
    const next = isChecked ? [...current, value] : current.filter((v) => v !== value);

    // Update ref immediately to handle rapid sequential clicks
    selectedRef.current = next;
    onChange(next);
  };

  const selected = initialValue; // For rendering, use the parent's source of truth

  const hasCrisis = screen.key === 'bloodPressure' && selected.includes('crisis');
  const hasNormal = screen.key === 'bloodPressure' && selected.includes('normal');

  return (
    <fieldset data-testid={`fieldset-${screen.key}`} className="border-0 p-0" aria-required={screen.required}>
      <legend className="sr-only">{screen.prompt}</legend>
      <p className="mb-3 text-sm text-slate-500">
        {screen.description ?? 'Select all that apply. Leave blank if none.'}
      </p>
      <div className="space-y-2" role="group" aria-describedby={error ? errorId : undefined}>
        {screen.options?.map((opt) => {
          const isChecked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              data-testid={`option-${screen.key}-${opt.value}`}
              className={`option-card ${isChecked ? 'option-card-selected' : ''}`}
            >
              <input
                type="checkbox"
                name={screen.key}
                value={opt.value}
                data-testid={`checkbox-${screen.key}-${opt.value}`}
                checked={isChecked}
                onChange={handleChange}
                className="sr-only peer"
              />
              <span
                className={`checkbox-indicator ${isChecked ? 'checkbox-indicator-checked' : ''}`}
                aria-hidden="true"
              >
                {isChecked && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="font-medium leading-snug text-slate-800">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {hasCrisis && hasNormal && (
        <p
          role="alert"
          className="alert-warning mt-4"
          data-testid="bp-contradiction-warning"
        >
          You selected both Normal and Hypertensive Crisis. Crisis takes precedence and routes to
          clinical review.
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="alert-error mt-3" data-testid="field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
