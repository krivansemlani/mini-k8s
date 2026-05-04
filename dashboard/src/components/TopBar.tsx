import { Github, BookOpen } from "lucide-react";
import type { ApiStatus } from "../lib/useJobs";

interface Props {
  apiStatus: ApiStatus;
  nextPollInMs: number;
  pollIntervalMs: number;
}

export function TopBar({ apiStatus, nextPollInMs, pollIntervalMs }: Props) {
  const secs = Math.ceil(nextPollInMs / 1000);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mark />
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[20px] leading-none tracking-tight text-ink">
              mini<span className="text-pine-700">·</span>k8s
            </span>
            <span className="eyebrow text-[10px] hidden sm:inline">
              control plane
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <StatusPill apiStatus={apiStatus} />
          <span className="text-[11px] font-mono text-ink-faint tnum">
            {apiStatus === "ok" && `next poll · ${secs}s / ${Math.round(pollIntervalMs / 1000)}s`}
            {apiStatus === "error" && "retrying…"}
            {apiStatus === "idle" && "initializing…"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <a
            className="btn-ghost"
            href="https://github.com/krivansemlani/mini-k8s#readme"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={14} strokeWidth={1.8} />
            <span className="hidden sm:inline">docs</span>
          </a>
          <a
            className="btn-ghost"
            href="https://github.com/krivansemlani/mini-k8s"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={14} strokeWidth={1.8} />
            <span className="hidden sm:inline">source</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function StatusPill({ apiStatus }: { apiStatus: ApiStatus }) {
  const color =
    apiStatus === "ok"
      ? "bg-forest-500"
      : apiStatus === "error"
        ? "bg-rust-500"
        : "bg-ink-faint";
  const label =
    apiStatus === "ok" ? "api online" : apiStatus === "error" ? "api offline" : "connecting";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-soft h-6 px-2 font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-soft">
      <span className="relative flex h-1.5 w-1.5">
        {apiStatus === "ok" && (
          <span
            className={`absolute inset-0 rounded-full ${color} opacity-60 animate-ping`}
            style={{ animationDuration: "2.2s" }}
          />
        )}
        <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${color}`} />
      </span>
      {label}
    </span>
  );
}

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" className="shrink-0">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="#FFFFFF" stroke="#E2DCCC" />
      <path
        d="M9 9v14M9 16h8M17 9l6 7-6 7"
        stroke="#2D5F5D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23" cy="9" r="1.8" fill="#B04A3C" />
    </svg>
  );
}
