import { AlertCircle } from "lucide-react";

interface Props {
  error: string | null;
}

export function ApiErrorBanner({ error }: Props) {
  if (!error) return null;
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-6">
      <div className="rounded-xl border border-[#EBC9C0] bg-rust-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle size={16} strokeWidth={1.8} className="text-rust-700 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-rust-700 mb-0.5">
            api unreachable
          </div>
          <p className="text-[13px] text-rust-700 leading-snug">
            Couldn't reach the Go API on <span className="font-mono">:8080</span>.
            Make sure the server is running —{" "}
            <span className="font-mono text-rust-700/80">go run .</span> in the project root.
          </p>
        </div>
      </div>
    </div>
  );
}
