import { SCREEN_SHORT_LABELS } from '../lib/screen-meta';

interface StepIndicatorProps {
  currentScreen: number;
  totalScreens: number;
  percent: number;
}

export function StepIndicator({ currentScreen, totalScreens, percent }: StepIndicatorProps) {
  const currentLabel = SCREEN_SHORT_LABELS[currentScreen] ?? `Step ${currentScreen}`;

  return (
    <nav aria-label="Form progress" className="mb-6" data-testid="step-indicator">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-800">
          <span className="text-sky-700">Step {currentScreen}</span>
          <span className="font-normal text-slate-400"> / {totalScreens}</span>
          <span className="mx-2 text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="font-medium text-slate-600">{currentLabel}</span>
        </p>
        <p className="text-sm font-bold text-sky-700">{Math.round(percent)}%</p>
      </div>

      <ol className="flex gap-1" aria-hidden="true">
        {Array.from({ length: totalScreens }, (_, i) => {
          const step = i + 1;
          const isComplete = step < currentScreen;
          const isCurrent = step === currentScreen;
          return (
            <li key={step} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={[
                  'h-full rounded-full transition-all duration-500',
                  isComplete
                    ? 'w-full bg-gradient-to-r from-sky-600 to-emerald-500'
                    : isCurrent
                      ? 'w-full bg-sky-500'
                      : 'w-0',
                ].join(' ')}
              />
            </li>
          );
        })}
      </ol>

      <ol className="sr-only">
        {Array.from({ length: totalScreens }, (_, i) => {
          const step = i + 1;
          const label = SCREEN_SHORT_LABELS[step] ?? `Step ${step}`;
          return (
            <li
              key={step}
              aria-current={step === currentScreen ? 'step' : undefined}
            >
              Step {step}: {label}
              {step < currentScreen ? ' (completed)' : ''}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
