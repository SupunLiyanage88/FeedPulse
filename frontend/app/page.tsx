import FeedbackForm from './components/FeedbackForm';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="pt-8 pb-6">
        <div className="fp-shell">
          <div className="fp-card flex flex-wrap items-center justify-between gap-6 px-6 py-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e74b5]">Feedback Platform</p>
              <h1 className="mt-2 text-3xl font-bold text-[#163f61] sm:text-4xl">FeedPulse</h1>
              <p className="mt-2 text-sm text-[#335b7b] sm:text-base">Simple feedback collection with thoughtful analysis.</p>
            </div>
            <div className="fp-soft-card px-4 py-3 text-sm text-[#1f4e78]">
              <p className="font-semibold">No account required</p>
              <p className="mt-1 text-xs text-[#365f80]">Share ideas, issues, and improvements in minutes.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-14">
        <div className="fp-shell">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
            <section className="fp-soft-card h-fit space-y-7 p-6 sm:p-8 lg:sticky lg:top-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e74b5]">Why this works</p>
                <h2 className="mt-2 text-2xl font-bold text-[#173f60] sm:text-3xl">Feedback that turns into action</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#355b79] sm:text-base">
                  Keep it short, clear, and honest. Every submission is categorized and reviewed to help us improve faster.
                </p>
              </div>

              <div className="space-y-4">
                <div className="fp-card px-4 py-4 sm:px-5">
                  <p className="text-sm font-semibold text-[#1f4e78]">Fast to submit</p>
                  <p className="mt-1 text-xs text-[#4a6f8d]">A short form with no signup friction.</p>
                </div>
                <div className="fp-card px-4 py-4 sm:px-5">
                  <p className="text-sm font-semibold text-[#1f4e78]">Consistent review</p>
                  <p className="mt-1 text-xs text-[#4a6f8d]">AI-assisted summaries and prioritization.</p>
                </div>
                <div className="fp-card px-4 py-4 sm:px-5">
                  <p className="text-sm font-semibold text-[#1f4e78]">Protected quality</p>
                  <p className="mt-1 text-xs text-[#4a6f8d]">Rate limit keeps submissions useful and fair.</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#5a7893]">
                Submission limit: 5 entries per hour on each device.
              </p>
            </section>

            <section className="fp-card p-6 sm:p-8 lg:p-10">
              <div className="mb-6 border-b border-[#d7e5f3] pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e74b5]">Send feedback</p>
                <h2 className="mt-2 text-2xl font-bold text-[#173f60]">Tell us what you noticed</h2>
                <p className="mt-2 text-sm text-[#486989]">Bug report, feature request, suggestion, or anything else that helps us improve.</p>
              </div>
              <FeedbackForm />
            </section>
          </div>
        </div>
      </main>

      <footer className="pb-8">
        <div className="fp-shell">
          <p className="text-center text-xs text-[#567693]">2026 FeedPulse. Built for clear voices and better decisions.</p>
        </div>
      </footer>
    </div>
  );
}
