interface ProgressBarProps {
  percent: number;
  current: number;
  total: number;
}

export function ProgressBar({ percent, current, total }: ProgressBarProps) {
  return (
    <section className="mb-8" data-testid="progress-bar">
      <header className="mb-2 flex items-end justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Overall progress
        </span>
        <span className="text-2xl font-bold tabular-nums text-sky-800">{percent}%</span>
      </header>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Form progress: step ${current} of ${total}, ${percent} percent complete`}
      >
        <span
          className="block h-full rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
          data-testid="progress-fill"
        />
      </div>
    </section>
  );
}
