'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EligibilityResult } from '../../../shared/types';
import { SCREEN_SHORT_LABELS } from '../lib/screen-meta';
import {
  clearStoredSessionId,
  getSession,
  getStoredSessionId,
  startSession,
  submitAnswer,
  type QuestionResponse,
} from '../lib/api';
import { EvaluationSummary } from './EvaluationSummary';
import { FormScreenInput } from './FormScreenInput';

import { ResultView } from './ResultView';
import { StepIndicator } from './StepIndicator';

type AnswerState = string | number | string[] | undefined;

export function FormWizard() {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const beginNew = useCallback(async () => {
    clearStoredSessionId();
    const data = await startSession();
    setSessionId(data.sessionId);
    setQuestion(data.question);
    setResult(null);
    setAnswers({});
    setCurrentAnswer(undefined);
    setResumed(false);
  }, []);

  const resumeOrStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = getStoredSessionId();
      if (stored) {
        const session = await getSession(stored);
        setSessionId(session.sessionId);
        setAnswers(session.answers as Record<string, AnswerState>);
        if (session.result) {
          setResult(session.result);
          setQuestion(null);
        } else if (session.question) {
          setQuestion(session.question);
          setResumed(true);
          const key = session.question.screen.key;
          setCurrentAnswer(session.answers[key] as AnswerState);
        } else {
          await beginNew();
        }
      } else {
        await beginNew();
      }
    } catch {
      clearStoredSessionId();
      await beginNew();
    } finally {
      setLoading(false);
    }
  }, [beginNew]);

  useEffect(() => {
    resumeOrStart();
  }, [resumeOrStart]);

  useEffect(() => {
    if (!question || loading) return;
    const label = SCREEN_SHORT_LABELS[question.currentScreen] ?? `Step ${question.currentScreen}`;
    setStatusMessage(`Step ${question.currentScreen}: ${label}. ${question.screen.prompt}`);
    headingRef.current?.focus();
  }, [question?.currentScreen, loading]);

  const resolveAnswer = (_form: HTMLFormElement): AnswerState => {
    if (!question) return currentAnswer;
    const screen = question.screen;

    if (screen.inputType === 'number') {
      if (typeof currentAnswer === 'number' && !Number.isNaN(currentAnswer)) {
        return currentAnswer;
      }
      return undefined;
    }
    if (screen.inputType === 'radio') {
      if (typeof currentAnswer === 'string' && currentAnswer) return currentAnswer;
      return undefined;
    }
    if (screen.inputType === 'checkbox') {
      // Always use React state for checkboxes; default to empty array
      return Array.isArray(currentAnswer) ? currentAnswer : [];
    }
    return currentAnswer;
  };

  const validate = (form: HTMLFormElement): boolean => {
    if (!question) return false;
    const screen = question.screen;
    const answer = resolveAnswer(form);

    if (screen.inputType === 'computed' || screen.inputType === 'evaluation') {
      return true;
    }

    if (screen.inputType === 'number') {
      const num = Number(answer);
      if (Number.isNaN(num)) {
        setFieldError('Please enter a valid number.');
        return false;
      }
      if (screen.validation?.min != null && num < screen.validation.min) {
        setFieldError(`Value must be at least ${screen.validation.min}.`);
        return false;
      }
      if (screen.validation?.max != null && num > screen.validation.max) {
        setFieldError(`Value must be at most ${screen.validation.max}.`);
        return false;
      }
    }

    if (screen.inputType === 'radio' && screen.required && !answer) {
      setFieldError('Please select an option before continuing.');
      return false;
    }

    setFieldError(null);
    return true;
  };

  const handleNext = async (form: HTMLFormElement) => {
    if (!sessionId || !question) return;
    if (!validate(form)) return;

    setResumed(false);
    setSubmitting(true);
    setError(null);

    try {
      const screen = question.screen;
      const resolved = resolveAnswer(form);
      let payload: unknown = resolved;

      if (screen.inputType === 'computed') {
        payload = question.computedValue ?? resolved;
      }
      if (screen.inputType === 'evaluation') {
        payload = 'complete';
      }

      const response = await submitAnswer(sessionId, screen.id, payload);

      if (screen.key !== 'evaluation' && screen.inputType !== 'computed') {
        setAnswers((prev) => ({ ...prev, [screen.key]: payload as AnswerState }));
      }
      if (screen.inputType === 'computed' && question.computedValue != null) {
        setAnswers((prev) => ({ ...prev, bmi: question.computedValue as number }));
      }

      if (response.result) {
        setResult(response.result);
        setQuestion(null);
      } else if (response.nextQuestion) {
        setQuestion(response.nextQuestion);
        const key = response.nextQuestion.screen.key;
        setCurrentAnswer(
          (answers[key] ?? response.nextQuestion.computedValue) as AnswerState,
        );
        setFieldError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12" data-testid="loading">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"
          aria-hidden="true"
        />
        <p className="text-slate-600">Loading screening form…</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-8">
        <ResultView result={result} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void beginNew().finally(() => setLoading(false));
            }}
            className="btn-primary flex-1"
            data-testid="restart-button"
          >
            Start new screening
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <p className="text-center text-red-600" role="alert">
        Unable to load form. Please refresh the page.
      </p>
    );
  }

  const isEvaluation = question.screen.inputType === 'evaluation';
  const mergedAnswers = { ...answers };
  if (question.computedValue != null) {
    mergedAnswers.bmi = question.computedValue;
  }

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      {resumed && (
        <div
          className="mb-6 flex flex-col gap-3 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          data-testid="resume-banner"
        >
          <p className="text-sm text-sky-900">
            Welcome back — your progress was restored. You are on step {question.currentScreen} of{' '}
            {question.totalScreens}.
          </p>
          <button
            type="button"
            className="btn-secondary shrink-0 text-sm"
            onClick={() => {
              setLoading(true);
              void beginNew().finally(() => setLoading(false));
            }}
          >
            Start over
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleNext(e.currentTarget);
        }}
        data-testid="form-wizard"
        data-screen-id={question.screen.id}
        noValidate
        className="animate-fade-in"
      >
        <StepIndicator
          currentScreen={question.currentScreen}
          totalScreens={question.totalScreens}
          percent={question.progressPercent}
        />

        <h1
          ref={headingRef}
          tabIndex={-1}
          id="screen-heading"
          className="mb-6 text-2xl font-bold tracking-tight text-slate-900 outline-none sm:text-3xl"
          data-testid="screen-prompt"
        >
          {question.screen.prompt}
          {question.screen.required && (
            <span className="ml-1.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </h1>

        {isEvaluation ? (
          <div className="space-y-6">
            <EvaluationSummary answers={mergedAnswers} />
            <p className="text-sm text-slate-600" data-testid="evaluation-prompt">
              Submit to run the final eligibility evaluation based on your answers.
            </p>
          </div>
        ) : (
          <FormScreenInput
            key={`${question.screen.id}-${question.screen.key}`}
            screen={question.screen}
            computedValue={question.computedValue}
            initialValue={
              currentAnswer as string | number | string[] | undefined
            }
            onChange={setCurrentAnswer}
            error={fieldError ?? undefined}
          />
        )}

        {error && (
          <p role="alert" className="alert-error mt-4" data-testid="form-error">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            {question.screen.required === false
              ? 'Optional — skip if none apply'
              : '* Required field'}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary min-w-[140px]"
            data-testid="next-button"
          >
            {submitting ? 'Saving…' : isEvaluation ? 'See results' : 'Next'}
          </button>
        </div>
      </form>
    </>
  );
}
