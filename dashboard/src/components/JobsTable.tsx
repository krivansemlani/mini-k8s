import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw, Search, Inbox } from "lucide-react";
import type { Job, JobStatus } from "../lib/types";
import { StatusBadge } from "./StatusBadge";
import { shortId, timeAgo, absoluteTime } from "../lib/format";

type Filter = "all" | "active" | "done";

interface Props {
  jobs: Job[];
  onRefresh: () => void;
  nextPollInMs: number;
  pollIntervalMs: number;
}

const ACTIVE: JobStatus[] = ["submitted", "runnable", "running"];
const DONE: JobStatus[] = ["succeeded", "failed"];

export function JobsTable({ jobs, onRefresh, nextPollInMs, pollIntervalMs }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const base = jobs.filter((j) => {
      if (filter === "active") return ACTIVE.includes(j.status);
      if (filter === "done") return DONE.includes(j.status);
      return true;
    });
    const query = q.trim().toLowerCase();
    const searched = query
      ? base.filter(
          (j) =>
            j.image.toLowerCase().includes(query) ||
            j.id.toLowerCase().includes(query) ||
            (j.command ?? "").toLowerCase().includes(query) ||
            (j.containerId ?? "").toLowerCase().includes(query)
        )
      : base;
    return [...searched].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [jobs, filter, q]);

  const counts = useMemo(
    () => ({
      all: jobs.length,
      active: jobs.filter((j) => ACTIVE.includes(j.status)).length,
      done: jobs.filter((j) => DONE.includes(j.status)).length,
    }),
    [jobs]
  );

  const pollPct = Math.max(
    0,
    Math.min(100, ((pollIntervalMs - nextPollInMs) / pollIntervalMs) * 100)
  );

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="px-6 lg:px-7 pt-6 pb-4 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="eyebrow mb-1.5">jobs</div>
            <h3 className="font-display text-[26px] leading-tight tracking-tight">
              The reconciliation log.
            </h3>
          </div>
          <button
            onClick={onRefresh}
            className="btn-ghost h-8"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw size={13} strokeWidth={1.8} />
            <span className="hidden sm:inline">refresh</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center rounded-lg border border-line bg-paper-soft p-[3px]">
            {(["all", "active", "done"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-7 px-3 rounded-[7px] font-mono text-[11px] uppercase tracking-eyebrow transition-all ${
                  filter === f
                    ? "bg-surface text-ink shadow-card"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {f}
                <span className="ml-1.5 text-ink-faint tnum">
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={13}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              className="field-input pl-8 h-9 text-[12.5px]"
              placeholder="search image, id, command…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Poll progress bar — a quiet heartbeat */}
      <div className="h-px bg-line relative overflow-hidden">
        <div
          className="h-full bg-pine-700/70 transition-[width] ease-linear"
          style={{
            width: `${pollPct}%`,
            transitionDuration: "200ms",
          }}
        />
      </div>

      {/* Table header */}
      <div className="px-6 lg:px-7 py-3 grid grid-cols-12 gap-4 border-b border-line font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint">
        <div className="col-span-3 sm:col-span-2">id</div>
        <div className="col-span-5 sm:col-span-4">image</div>
        <div className="col-span-4 sm:col-span-2">status</div>
        <div className="hidden sm:block sm:col-span-2">container</div>
        <div className="hidden sm:block sm:col-span-2 text-right">updated</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {filtered.map((j) => (
                <motion.li
                  key={j.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  className="group"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((id) => (id === j.id ? null : j.id))
                    }
                    className="w-full px-6 lg:px-7 py-3.5 grid grid-cols-12 gap-4 items-center text-left hover:bg-paper-soft transition-colors"
                  >
                    <div className="col-span-3 sm:col-span-2">
                      <span className="font-mono text-[12px] text-ink">
                        {shortId(j.id)}
                      </span>
                    </div>
                    <div className="col-span-5 sm:col-span-4 min-w-0">
                      <div className="font-mono text-[13px] text-ink truncate">
                        {j.image}
                      </div>
                      {j.command && (
                        <div className="font-mono text-[11px] text-ink-muted truncate mt-0.5">
                          $ {j.command}
                        </div>
                      )}
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <StatusBadge status={j.status} size="sm" />
                    </div>
                    <div className="hidden sm:block sm:col-span-2">
                      <span className="font-mono text-[11.5px] text-ink-muted">
                        {j.containerId ? shortId(j.containerId, 10) : "—"}
                      </span>
                    </div>
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      <span
                        className="font-mono text-[11.5px] text-ink-muted tnum"
                        title={absoluteTime(j.updatedAt)}
                      >
                        {timeAgo(j.updatedAt)}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedId === j.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden bg-paper-soft"
                      >
                        <JobDetail job={j} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 lg:px-7 py-3 border-t border-line flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint">
          {filtered.length} of {jobs.length}
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint tnum">
          live · polling every {Math.round(pollIntervalMs / 1000)}s
        </span>
      </div>
    </div>
  );
}

function JobDetail({ job }: { job: Job }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["job id", <span className="font-mono text-[12px] text-ink">{job.id}</span>],
    ["image", <span className="font-mono text-[12px] text-ink">{job.image}</span>],
    [
      "command",
      job.command ? (
        <span className="font-mono text-[12px] text-ink">{job.command}</span>
      ) : (
        <span className="font-mono text-[12px] text-ink-faint">—</span>
      ),
    ],
    [
      "container id",
      job.containerId ? (
        <span className="font-mono text-[12px] text-ink">{job.containerId}</span>
      ) : (
        <span className="font-mono text-[12px] text-ink-faint">—</span>
      ),
    ],
    [
      "created",
      <span className="font-mono text-[12px] text-ink-soft tnum">
        {absoluteTime(job.createdAt)}
      </span>,
    ],
    [
      "updated",
      <span className="font-mono text-[12px] text-ink-soft tnum">
        {absoluteTime(job.updatedAt)}
      </span>,
    ],
  ];

  return (
    <div className="px-6 lg:px-7 py-5 grid grid-cols-1 lg:grid-cols-5 gap-6">
      <dl className="lg:col-span-3 grid grid-cols-[112px_1fr] gap-x-5 gap-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint pt-0.5">
              {k}
            </dt>
            <dd className="min-w-0 break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="lg:col-span-2">
        <div className="eyebrow mb-2">env vars</div>
        {job.envVars && Object.keys(job.envVars).length > 0 ? (
          <ul className="space-y-1">
            {Object.entries(job.envVars).map(([k, v]) => (
              <li
                key={k}
                className="flex items-center gap-2 font-mono text-[12px]"
              >
                <span className="text-pine-900">{k}</span>
                <span className="text-ink-faint">=</span>
                <span className="text-ink-soft break-all">{v}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="font-mono text-[12px] text-ink-faint">none</span>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 px-6 py-20 flex flex-col items-center justify-center text-center">
      <div className="h-12 w-12 rounded-full border border-line bg-paper-soft flex items-center justify-center mb-4">
        <Inbox size={18} strokeWidth={1.6} className="text-ink-faint" />
      </div>
      <h4 className="font-display text-[22px] leading-tight mb-1.5">
        No jobs yet.
      </h4>
      <p className="text-[13px] text-ink-muted max-w-xs">
        Submit one on the left — try <span className="font-mono text-ink-soft">nginx:alpine</span> to
        watch the state machine move.
      </p>
    </div>
  );
}
