import { FormWizard } from '../components/FormWizard';

export default function Home() {
  return (
    <div className="page-bg min-h-full">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to screening form
      </a>

      <header className="border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-700 to-emerald-600 text-sm font-bold text-white shadow-md"
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2L2 7v10l10 5 10-5V7L12 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12v10M7 9.5l10 5M17 9.5l-10 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">CareScreen</p>
              <p className="text-xs text-slate-500">GLP-1 eligibility assessment</p>
            </div>
          </div>
          <p className="hidden text-xs font-medium text-slate-500 sm:block">
            Secure · Saves progress automatically
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-8 sm:px-6 lg:grid-cols-[35fr_65fr] lg:py-12">
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            <div>
              <p className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Clinical Eligibility Screening
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900">
                Discover your GLP-1 eligibility
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Complete this comprehensive assessment to determine if prescription weight-management medication is right for you. Your progress is securely saved as you go.
              </p>
            </div>

            <ul className="space-y-4 text-sm text-slate-600">
              {[
                { title: 'Personalized assessment', desc: 'The questionnaire dynamically adapts to your specific medical history and profile.' },
                { title: 'Clinical precision', desc: 'Your metrics are instantly evaluated against standard GLP-1 prescribing guidelines.' },
                { title: 'Immediate insights', desc: 'Receive clear, actionable feedback on your eligibility status and next steps.' },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>
                    <strong className="font-semibold text-slate-800">{item.title}</strong>
                    <br />
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-600">
              <strong className="font-semibold text-slate-800">Important Note:</strong> This assessment provides a preliminary eligibility estimate for informational purposes. It does not replace a formal medical consultation, diagnosis, or treatment from a licensed healthcare provider.
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-6 lg:hidden">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              GLP-1 eligibility screening
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Answer each question carefully. Progress is saved automatically.
            </p>
          </div>

          <main id="main-content" className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 to-emerald-50/80 px-5 py-4 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                Patient self-screening
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                All fields marked with <span className="text-red-600">*</span> are required unless
                noted optional.
              </p>
            </div>
            <div className="card-inner p-5 sm:p-8">
              <FormWizard />
            </div>
          </main>

          <footer className="mt-6 text-center text-xs leading-relaxed text-slate-500 lg:text-left">
            <p>
              HIPAA-aware design patterns · Keyboard accessible · WCAG 2.1 AA oriented inputs
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
