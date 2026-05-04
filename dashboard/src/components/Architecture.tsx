export function Architecture() {
  return (
    <section
      id="architecture"
      className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-24"
    >
      <div className="grid grid-cols-12 gap-10 items-start">
        <div className="col-span-12 lg:col-span-4">
          <div className="eyebrow mb-3">section 02</div>
          <h2 className="font-display text-[40px] lg:text-[48px] leading-[1.05] tracking-[-0.015em]">
            The control loop,
            <br />
            <em className="italic text-pine-700">in full.</em>
          </h2>
          <p className="mt-5 text-[14px] leading-[1.7] text-ink-soft max-w-md">
            Three Go workers tick independently. Each owns one phase. None of
            them talk to each other — they coordinate through Postgres. That's
            the entire design.
          </p>

          <dl className="mt-8 space-y-4">
            {WORKERS.map((w) => (
              <div
                key={w.name}
                className="border-l-2 border-line pl-4 py-1 hover:border-pine-700 transition-colors"
              >
                <dt className="flex items-baseline justify-between gap-3 mb-0.5">
                  <span className="font-mono text-[12px] text-ink">
                    {w.name}
                  </span>
                  <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint">
                    {w.cadence}
                  </span>
                </dt>
                <dd className="text-[13px] text-ink-muted leading-[1.55]">
                  {w.summary}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <FlowDiagram />
        </div>
      </div>
    </section>
  );
}

const WORKERS = [
  {
    name: "job-dispatcher",
    cadence: "every 2s",
    summary:
      "Scans submitted rows, makes the scheduling decision, and marks them runnable.",
  },
  {
    name: "cri-worker",
    cadence: "every 2s",
    summary:
      "Pulls images if needed, creates and starts Docker containers, records the container id.",
  },
  {
    name: "job-watcher",
    cadence: "every 10s",
    summary:
      "Inspects running containers and transitions rows to succeeded or failed, then cleans up.",
  },
];

function FlowDiagram() {
  return (
    <div className="card p-6 lg:p-9">
      <div className="flex items-center justify-between mb-6">
        <span className="eyebrow">architecture</span>
        <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-faint">
          state · machine
        </span>
      </div>

      {/* State machine rail */}
      <div className="mb-10">
        <div className="relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-line" />
          <ol className="relative grid grid-cols-5 gap-2">
            {STATES.map((s) => (
              <li key={s.key} className="flex flex-col items-center text-center">
                <span
                  className={`relative z-10 h-9 w-9 rounded-full border-2 bg-surface flex items-center justify-center font-mono text-[11px] tnum ${s.dotBorder} ${s.dotText}`}
                >
                  {s.code}
                </span>
                <span
                  className={`mt-2.5 font-mono text-[11px] uppercase tracking-eyebrow ${s.labelColor}`}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2 text-center">
          <Owner label="api" />
          <Owner label="dispatcher" />
          <Owner label="cri-worker" />
          <Owner label="watcher" />
          <Owner label="watcher" />
        </div>
      </div>

      {/* Data flow */}
      <div className="rule my-6" />

      <div className="grid grid-cols-12 gap-4 items-stretch">
        <Node className="col-span-12 md:col-span-3" title="Client" sub="HTTP / curl" />
        <Arrow className="col-span-12 md:col-span-2" label="POST /jobs" />
        <Node
          className="col-span-12 md:col-span-4"
          title="Postgres"
          sub="source of truth"
          accent
        />
        <Arrow className="col-span-12 md:col-span-1" label="" />
        <Node className="col-span-12 md:col-span-2" title="Docker" sub="runtime" />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-5" />
        <div className="col-span-12 md:col-span-4">
          <div className="rounded-lg border border-dashed border-line bg-paper-soft px-3 py-2.5 font-mono text-[11.5px] text-ink-muted leading-relaxed">
            <div className="text-ink-soft">go workers · reconcilers</div>
            <div>
              ← <span className="text-ink">job-dispatcher</span>, <span className="text-ink">cri-worker</span>, <span className="text-ink">job-watcher</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATES = [
  {
    key: "submitted",
    code: "01",
    label: "submitted",
    dotBorder: "border-slate2-500",
    dotText: "text-slate2-500",
    labelColor: "text-slate2-500",
  },
  {
    key: "runnable",
    code: "02",
    label: "runnable",
    dotBorder: "border-clay-500",
    dotText: "text-clay-700",
    labelColor: "text-clay-700",
  },
  {
    key: "running",
    code: "03",
    label: "running",
    dotBorder: "border-pine-700",
    dotText: "text-pine-900",
    labelColor: "text-pine-900",
  },
  {
    key: "succeeded",
    code: "04",
    label: "succeeded",
    dotBorder: "border-forest-500",
    dotText: "text-forest-700",
    labelColor: "text-forest-700",
  },
  {
    key: "failed",
    code: "05",
    label: "failed",
    dotBorder: "border-rust-500",
    dotText: "text-rust-700",
    labelColor: "text-rust-700",
  },
] as const;

function Owner({ label }: { label: string }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-faint">
      {label}
    </span>
  );
}

function Node({
  title,
  sub,
  className = "",
  accent = false,
}: {
  title: string;
  sub: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        accent
          ? "border-pine-500/40 bg-pine-50"
          : "border-line bg-paper-soft"
      } ${className}`}
    >
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-faint">
        node
      </div>
      <div
        className={`font-display text-[22px] leading-none mt-1 ${
          accent ? "text-pine-900" : "text-ink"
        }`}
      >
        {title}
      </div>
      <div className="font-mono text-[11px] text-ink-muted mt-1">{sub}</div>
    </div>
  );
}

function Arrow({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-faint mb-1">
        {label}
      </span>
      <svg height="10" viewBox="0 0 80 10" className="w-full text-ink-faint">
        <line
          x1="0"
          y1="5"
          x2="74"
          y2="5"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <path
          d="M72 1l6 4-6 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
