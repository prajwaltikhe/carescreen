import { FORM_SCHEMA } from '../../../shared/form-schema';
import { formatAnswerForSummary, SUMMARY_SECTIONS } from '../lib/screen-meta';

interface EvaluationSummaryProps {
  answers: Record<string, string | number | string[] | undefined>;
}

export function EvaluationSummary({ answers }: EvaluationSummaryProps) {
  const labelByKey = Object.fromEntries(
    FORM_SCHEMA.screens.map((s) => [s.key, s.prompt]),
  );

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white"
      data-testid="evaluation-summary"
    >
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Review your responses
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Confirm everything looks correct before we calculate your eligibility.
        </p>
      </header>

      <div className="space-y-6 p-5">
        {SUMMARY_SECTIONS.map((section) => {
          const rows = section.keys.filter((k) => answers[k] !== undefined);
          if (rows.length === 0) return null;
          return (
            <section key={section.title}>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-800">
                <span className="h-px flex-1 bg-sky-200" aria-hidden="true" />
                {section.title}
                <span className="h-px flex-1 bg-sky-200" aria-hidden="true" />
              </h3>
              <dl className="grid gap-2 sm:grid-cols-1">
                {rows.map((key) => (
                  <div
                    key={key}
                    className="grid gap-1 rounded-lg border border-slate-100 bg-white px-4 py-3 sm:grid-cols-[1fr_auto] sm:gap-4"
                  >
                    <dt className="text-sm text-slate-500">{labelByKey[key] ?? key}</dt>
                    <dd className="text-sm font-semibold text-slate-900 sm:text-right">
                      {formatAnswerForSummary(key, answers[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </section>
  );
}
