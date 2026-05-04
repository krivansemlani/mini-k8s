import { ArrowDownRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-14 lg:pt-24 lg:pb-20 grid grid-cols-12 gap-10 items-end">
        {/* Left: editorial copy */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-7">
          <div className="flex items-center gap-3 mb-8">
            <span className="eyebrow">phase 01 · control plane</span>
            <span className="h-px w-10 bg-line" />
            <span className="eyebrow">v0.1</span>
          </div>

          <h1 className="font-display text-[44px] sm:text-[56px] lg:text-[72px] leading-[1.02] tracking-[-0.02em] text-ink">
            A minimalist <em className="italic text-pine-700">container</em>
            <br className="hidden sm:block" /> control plane, built from{" "}
            <span className="whitespace-nowrap">first principles.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-[1.65] text-ink-soft">
            Jobs are written to Postgres as{" "}
            <em className="italic">desired state</em>. Three tiny Go workers
            reconcile that state against Docker — dispatching, running, and
            watching — the same loop that powers real Kubernetes, stripped to
            its essentials.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#submit" className="btn-primary">
              Submit a job
              <ArrowDownRight size={14} strokeWidth={2} />
            </a>
            <a
              href="#architecture"
              className="text-[13px] font-mono uppercase tracking-eyebrow text-ink-muted hover:text-ink transition-colors"
            >
              how it works →
            </a>
          </div>
        </div>

        {/* Right: editorial annotation card */}
        <aside className="col-span-12 lg:col-span-5 xl:col-span-5">
          <div className="card p-6 lg:p-7">
            <div className="flex items-center justify-between mb-5">
              <span className="eyebrow">the loop</span>
              <span className="font-mono text-[10.5px] text-ink-faint tracking-[0.14em] uppercase">
                reconcile
              </span>
            </div>

            <ol className="space-y-4">
              {LOOP_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4 group">
                  <span className="font-display italic text-[28px] leading-none text-pine-700/80 w-8 shrink-0 tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 pb-4 border-b border-line last:border-0 last:pb-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-[14px] text-ink">
                        {step.title}
                      </span>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                        {step.owner}
                      </span>
                    </div>
                    <p className="text-[13px] text-ink-muted mt-1 leading-[1.55]">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {/* Elegant bottom rule */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="rule" />
      </div>
    </section>
  );
}

const LOOP_STEPS = [
  {
    title: "A job is written to Postgres",
    detail: "POST /jobs inserts a row with status = submitted. The database is the source of truth.",
    owner: "api",
  },
  {
    title: "The dispatcher marks it runnable",
    detail: "A ticker scans submitted jobs and flips them to runnable — the scheduling decision.",
    owner: "dispatcher",
  },
  {
    title: "The CRI worker runs it on Docker",
    detail: "Pulls the image if needed, creates and starts a container, records its ID.",
    owner: "cri-worker",
  },
  {
    title: "The watcher reconciles the outcome",
    detail: "Inspects the container and transitions the row to succeeded or failed, then cleans up.",
    owner: "job-watcher",
  },
];
