import type { JobStatus } from "../lib/types";

interface Props {
  status: JobStatus;
  size?: "sm" | "md";
}

const STYLES: Record<JobStatus, { dot: string; text: string; bg: string; border: string; label: string }> = {
  submitted: {
    dot: "bg-slate2-500",
    text: "text-slate2-500",
    bg: "bg-paper-soft",
    border: "border-line",
    label: "submitted",
  },
  runnable: {
    dot: "bg-clay-500",
    text: "text-clay-700",
    bg: "bg-clay-50",
    border: "border-clay-300/60",
    label: "runnable",
  },
  running: {
    dot: "bg-pine-700",
    text: "text-pine-900",
    bg: "bg-pine-50",
    border: "border-pine-100",
    label: "running",
  },
  succeeded: {
    dot: "bg-forest-500",
    text: "text-forest-700",
    bg: "bg-[#E7F1EA]",
    border: "border-[#C7DFD0]",
    label: "succeeded",
  },
  failed: {
    dot: "bg-rust-500",
    text: "text-rust-700",
    bg: "bg-rust-50",
    border: "border-[#EBC9C0]",
    label: "failed",
  },
};

export function StatusBadge({ status, size = "md" }: Props) {
  const s = STYLES[status];
  const live = status === "running";
  const sizeClasses =
    size === "sm"
      ? "text-[10.5px] px-2 h-5 gap-1.5"
      : "text-[11px] px-2.5 h-[22px] gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono uppercase tracking-[0.14em] ${sizeClasses} ${s.bg} ${s.text} ${s.border}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {live && (
          <span
            className={`absolute inset-0 rounded-full ${s.dot} opacity-60 animate-ping`}
            style={{ animationDuration: "1.8s" }}
          />
        )}
        <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
      </span>
      {s.label}
    </span>
  );
}
