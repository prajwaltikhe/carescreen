import type { EligibilityResult, SessionAnswers } from '../../../shared/types';
import type { FormScreen } from '../../../shared/types';

export interface QuestionResponse {
  screen: FormScreen;
  currentScreen: number;
  totalScreens: number;
  progressPercent: number;
  computedValue?: number;
}

export interface StartResponse {
  sessionId: string;
  question: QuestionResponse;
}

export interface AnswerResponse {
  nextQuestion?: QuestionResponse;
  result?: EligibilityResult;
  status: string;
}

export interface SessionState {
  sessionId: string;
  status: string;
  currentScreen: number;
  answers: SessionAnswers;
  question: QuestionResponse | null;
  result?: EligibilityResult;
}

const SESSION_KEY = 'glp1_session_id';

export function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setStoredSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearStoredSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function startSession(): Promise<StartResponse> {
  const res = await fetch('/api/session/start', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start session');
  const data = (await res.json()) as StartResponse;
  setStoredSessionId(data.sessionId);
  return data;
}

export async function getSession(sessionId: string): Promise<SessionState> {
  const res = await fetch(`/api/session/${sessionId}`);
  if (!res.ok) throw new Error('Failed to load session');
  return res.json() as Promise<SessionState>;
}

export async function submitAnswer(
  sessionId: string,
  screenId: number,
  answer: unknown,
): Promise<AnswerResponse> {
  const res = await fetch('/api/session/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, screenId, answer }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Failed to save answer');
  }
  return res.json() as Promise<AnswerResponse>;
}
