export function Footer() {
  const stack = ["go", "postgres", "docker", "gin", "pgx", "react", "tailwind"];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="font-display text-[22px] leading-none tracking-tight text-ink">
            mini<span className="text-pine-700">·</span>k8s
          </div>
          <p className="mt-2 text-[12.5px] text-ink-muted max-w-md">
            A portfolio piece exploring the core ideas of real Kubernetes —
            desired state, reconciliation, and the quiet discipline of
            single-purpose workers.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {stack.map((t) => (
            <span
              key={t}
              className="h-6 px-2 rounded-full border border-line bg-paper-soft
                         font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-muted"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
