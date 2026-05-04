import { useState } from "react";
import { Plus, X, Loader2, Check, AlertCircle } from "lucide-react";
import { createJob } from "../lib/api";

interface Props {
  onCreated: () => void;
}

interface EnvPair {
  key: string;
  value: string;
}

const PRESETS = [
  { label: "nginx", image: "nginx:alpine", command: "" },
  { label: "hello-world", image: "hello-world", command: "" },
  { label: "busybox echo", image: "busybox", command: "echo hello from mini-k8s" },
  { label: "alpine sleep", image: "alpine", command: "sleep 12" },
];

export function CreateJobForm({ onCreated }: Props) {
  const [image, setImage] = useState("nginx:alpine");
  const [command, setCommand] = useState("");
  const [envPairs, setEnvPairs] = useState<EnvPair[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<
    | { kind: "ok"; id: string }
    | { kind: "err"; msg: string }
    | null
  >(null);

  const applyPreset = (p: typeof PRESETS[number]) => {
    setImage(p.image);
    setCommand(p.command);
    setEnvPairs([]);
  };

  const addEnv = () =>
    setEnvPairs((prev) => [...prev, { key: "", value: "" }]);

  const updateEnv = (i: number, key: keyof EnvPair, val: string) =>
    setEnvPairs((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p))
    );

  const removeEnv = (i: number) =>
    setEnvPairs((prev) => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image.trim()) return;
    setSubmitting(true);
    setToast(null);
    try {
      const envMap = envPairs.reduce<Record<string, string>>((acc, p) => {
        const k = p.key.trim();
        if (k) acc[k] = p.value;
        return acc;
      }, {});
      const id = await createJob({
        image: image.trim(),
        command: command.trim() || undefined,
        envVars: Object.keys(envMap).length ? envMap : undefined,
      });
      setToast({ kind: "ok", id });
      onCreated();
      setTimeout(() => setToast(null), 4200);
    } catch (err) {
      setToast({
        kind: "err",
        msg: err instanceof Error ? err.message : "Failed to submit job",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="submit"
      onSubmit={onSubmit}
      className="card p-6 lg:p-7 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="eyebrow mb-1.5">new job</div>
          <h3 className="font-display text-[26px] leading-tight tracking-tight">
            Schedule a container.
          </h3>
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint hidden sm:block">
          POST /jobs
        </span>
      </div>

      {/* Presets */}
      <div className="mb-5">
        <div className="field-label">presets</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="h-7 px-2.5 rounded-full border border-line bg-paper-soft
                         text-[11.5px] font-mono text-ink-soft
                         hover:border-pine-500 hover:text-pine-900 hover:bg-pine-50
                         transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image */}
      <div className="mb-4">
        <label className="field-label">image *</label>
        <input
          className="field-input field-input-mono"
          placeholder="nginx:alpine"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          required
        />
      </div>

      {/* Command */}
      <div className="mb-4">
        <label className="field-label">command (optional)</label>
        <input
          className="field-input field-input-mono"
          placeholder="echo hello"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
      </div>

      {/* Env vars */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="field-label mb-0">env vars</span>
          <button
            type="button"
            onClick={addEnv}
            className="btn-ghost -mr-2"
          >
            <Plus size={12} strokeWidth={2.2} />
            add
          </button>
        </div>
        {envPairs.length === 0 ? (
          <div className="h-10 px-3 flex items-center rounded-lg border border-dashed border-line text-[12.5px] text-ink-faint">
            No environment variables.
          </div>
        ) : (
          <div className="space-y-1.5">
            {envPairs.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  className="field-input field-input-mono flex-1"
                  placeholder="KEY"
                  value={p.key}
                  onChange={(e) => updateEnv(i, "key", e.target.value)}
                />
                <span className="font-mono text-ink-faint text-[13px]">=</span>
                <input
                  className="field-input field-input-mono flex-1"
                  placeholder="value"
                  value={p.value}
                  onChange={(e) => updateEnv(i, "value", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeEnv(i)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg
                             text-ink-faint hover:text-rust-500 hover:bg-rust-50 transition-colors"
                  aria-label="Remove env var"
                >
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2.5 text-[12.5px] flex items-start gap-2 ${
            toast.kind === "ok"
              ? "border-[#C7DFD0] bg-[#E7F1EA] text-forest-700"
              : "border-[#EBC9C0] bg-rust-50 text-rust-700"
          }`}
        >
          {toast.kind === "ok" ? (
            <Check size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            {toast.kind === "ok" ? (
              <>
                Job queued. <span className="font-mono opacity-80">id={toast.id.slice(0, 12)}…</span>
              </>
            ) : (
              <span className="font-mono">{toast.msg}</span>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !image.trim()}
        className="btn-primary w-full h-11 text-[14px]"
      >
        {submitting ? (
          <>
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            submitting…
          </>
        ) : (
          <>
            submit job
            <span className="font-mono opacity-70 text-[11px]">↵</span>
          </>
        )}
      </button>

      <p className="mt-3 font-mono text-[10.5px] text-ink-faint leading-relaxed">
        → row inserted as <span className="text-ink-soft">submitted</span>. the dispatcher picks it up within ~2s.
      </p>
    </form>
  );
}
