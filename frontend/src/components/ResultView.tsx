import type { EligibilityResult } from '../../../shared/types';

interface ResultViewProps {
  result: EligibilityResult;
}

const STATUS_CONFIG: Record<
  string,
  {
    gradient: string;
    ring: string;
    iconBg: string;
    icon: string;
    label: string;
    description: string;
  }
> = {
  eligible: {
    gradient: 'from-emerald-500/10 to-teal-500/5',
    ring: 'ring-emerald-500/30',
    iconBg: 'bg-emerald-600',
    icon: '✓',
    label: 'Eligible',
    description: 'You appear to meet the screening criteria for GLP-1 weight-loss therapy.',
  },
  ineligible: {
    gradient: 'from-red-500/10 to-rose-500/5',
    ring: 'ring-red-500/30',
    iconBg: 'bg-red-600',
    icon: '✕',
    label: 'Ineligible',
    description: 'Based on your responses, you do not meet the screening criteria at this time.',
  },
  requires_clinical_review: {
    gradient: 'from-amber-500/10 to-orange-500/5',
    ring: 'ring-amber-500/30',
    iconBg: 'bg-amber-600',
    icon: '!',
    label: 'Requires Clinical Review',
    description: 'A licensed clinician should review your profile before any treatment decision.',
  },
};

export function ResultView({ result }: ResultViewProps) {
  const config = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.requires_clinical_review;

  return (
    <article
      data-testid="result-screen"
      data-status={result.status}
      data-code={result.code}
      className={`overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-1 ring-1 ${config.ring}`}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-[calc(1rem-2px)] bg-white p-8">
        <header className="flex items-start gap-5">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.iconBg} text-2xl font-bold text-white shadow-lg`}
            aria-hidden="true"
          >
            {config.icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Screening outcome
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900" data-testid="result-title">
              {config.label}
            </h2>
            <p className="mt-2 text-slate-600">{config.description}</p>
          </div>
        </header>

        <p
          className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-lg font-medium leading-snug text-slate-900"
          data-testid="result-reason"
        >
          {result.reason}
        </p>

        {result.flags.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">Flagged for clinician review</h3>
            <ul
              className="mt-3 space-y-2"
              data-testid="result-flags"
            >
              {result.flags.map((flag) => (
                <li
                  key={flag}
                  className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950"
                >
                  <span aria-hidden="true">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
