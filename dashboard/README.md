# mini-k8s · dashboard

A showcase UI for the mini-k8s control plane. Built with Vite + React + TypeScript + Tailwind.

Zero backend changes: the Vite dev server proxies `/api/*` to `http://localhost:8080/*`, so the browser app talks to the Go API without CORS.

## Run

In one terminal, start the Go API at the project root:

```bash
go run .
```

In another terminal, start the dashboard:

```bash
cd dashboard
npm install
npm run dev
```

Then open <http://localhost:5173>.

## What it shows

- **Hero** — one-sentence pitch, the four-step reconciliation loop as editorial notes.
- **Phase stats** — live counts for each job status (submitted → runnable → running → succeeded / failed).
- **Submit form** — mirrors `POST /jobs`, with presets, optional command, and KEY=value env vars.
- **Jobs log** — live table polling `GET /jobs` every 3s, with filters, search, and per-job detail.
- **Architecture** — the state machine and the three workers (dispatcher, cri-worker, job-watcher).

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v3 (custom *field-notes* palette: warm paper + atlantic teal + rust)
- Motion (Framer) for layout animations
- Lucide icons
- Fonts: Instrument Serif (display) + Geist (body) + Geist Mono (code)

## Build

```bash
npm run build
```

Outputs static assets in `dist/`. You can serve those from any static host, or later wire them into the Go binary with `embed.FS` if you want a single-binary distribution.
