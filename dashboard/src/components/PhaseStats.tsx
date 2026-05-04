import { useMemo } from "react";
import type { Job, JobStatus } from "../lib/types";
import { STATUS_ORDER } from "../lib/types";

interface Props {
  jobs: Job[];
}

const PHASE_META: Record<
  JobStatus,
  { label: string; code: string; tone: string; ring: string }
> = {
  submitted: {
    label: "Submitted",
    code: "01",
    tone: "text-slate2-500",
    ring: "before:bg-slate2-500",
  },
  runnable: {
    label: "Runnable",
    code: "02",
    tone: "text-clay-700",
    ring: "before:bg-clay-500",
  },
  running: {
    label: "Running",
    code: "03",
    tone: "text-pine-900",
    ring: "before:bg-pine-700",
  },
  succeeded: {
    label: "Succeeded",
    code: "04",
    tone: "text-forest-700",
    ring: "before:bg-forest-500",
  },
  failed: {
    label: "Failed",
    code: "05",
    tone: "text-rust-700",
    ring: "before:bg-rust-500",
  },
};

export function PhaseStats({ jobs }: Props) {
  const counts = useMemo(() => {
    const base: Record<JobStatus, number> = {
      submitted: 0,
      runnable: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
    };
    for (const j of jobs) base[j.status] = (base[j.status] ?? 0) + 1;
    return base;
  }, [jobs]);

  const total = jobs.length;

  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-10 py-10 lg:py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="eyebrow mb-2">jobs by phase</div>
          <h2 className="font-display text-[32px] leading-none tracking-tight">
            The cluster, right now.
          </h2>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-muted hidden sm:block">
          total · <span className="text-ink tnum">{total}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line rounded-xl overflow-hidden border border-line">
        {STATUS_ORDER.map((status) => {
          const meta = PHASE_META[status];
          const count = counts[status];
          return (
            <div
              key={status}
              className={`relative group bg-surface p-5 lg:p-6 transition-colors hover:bg-paper-soft
                         before:content-[''] before:absolute before:left-0 before:top-5 before:lg:top-6
                         before:h-8 before:w-[2px] ${meta.ring}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint tnum">
                  {meta.code}
                </span>
                <span className={`font-mono text-[10.5px] uppercase tracking-eyebrow ${meta.tone}`}>
                  {meta.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-display leading-none tnum text-[56px] lg:text-[64px] ${meta.tone}`}
                >
                  {count}
                </span>
                {total > 0 && (
                  <span className="font-mono text-[11px] text-ink-faint tnum">
                    {Math.round((count / total) * 100)}%
                  </span>
                )}
              </div>
              <div className="mt-4 h-[3px] w-full bg-paper-deep rounded-full overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-700 ease-out ${meta.ring.replace("before:", "")}`}
                  style={{
                    width: total === 0 ? "0%" : `${(count / Math.max(total, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
