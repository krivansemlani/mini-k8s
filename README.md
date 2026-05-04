# Mini Kubernetes — Complete Documentation

> A from-scratch implementation of core Kubernetes concepts in Go. This project builds a real container orchestration system that schedules, runs, and monitors Docker containers through a state machine — the same fundamental loop that powers production Kubernetes.

A companion web dashboard lives in [`dashboard/`](./dashboard) — a premium UI for submitting jobs and watching them flow through the state machine in real time. See [`dashboard/README.md`](./dashboard/README.md) to run it.

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Why Kubernetes? The Problem It Solves](#2-why-kubernetes-the-problem-it-solves)
3. [How Real Kubernetes Works](#3-how-real-kubernetes-works)
4. [Architecture Overview](#4-architecture-overview)
5. [The Job State Machine](#5-the-job-state-machine)
6. [Project Structure](#6-project-structure)
7. [Technology Choices & Why](#7-technology-choices--why)
8. [Database Layer](#8-database-layer)
9. [API Server](#9-api-server)
10. [The Three Workers](#10-the-three-workers)
11. [Key Concepts Explained](#11-key-concepts-explained)
12. [Running the Project](#12-running-the-project)
13. [Testing](#13-testing)
14. [Graceful Shutdown](#14-graceful-shutdown)

---

## 1. What Is This Project?

Mini Kubernetes is a container orchestration system built from scratch in Go. It implements the core control loop of Kubernetes:

- A user submits a job (a Docker image to run)
- The system schedules it, runs it as a real Docker container, tracks its state, and cleans up when it's done
- Everything is tracked in a PostgreSQL database as the single source of truth
- Three background workers run concurrently, each owning one phase of the lifecycle

This is not a toy — it implements real production patterns: connection pooling, database row locking to prevent race conditions, goroutine-based concurrency, graceful shutdown, and Docker SDK integration.

---

## 2. Why Kubernetes? The Problem It Solves

Before container orchestration, deploying an app meant:
- Manually SSHing into a server
- Running `docker run` yourself
- Manually restarting containers if they crashed
- No visibility into what's running where

Kubernetes solves this by letting you declare *what you want* and having the system figure out *how to make it happen*. You say "run 3 nginx containers" and Kubernetes handles scheduling, placement, restarts, and monitoring.

The core insight is **desired state vs current state**:
- **Desired state**: what you asked for ("3 nginx containers running")
- **Current state**: what's actually running right now
- **Reconciliation loop**: the system continuously compares the two and fixes any difference

This loop runs forever. If a container crashes, current state diverges from desired state, and Kubernetes brings it back. This is the fundamental design pattern this project implements.

---

## 3. How Real Kubernetes Works

Real Kubernetes has several components. This project implements the core ones:

| Real Kubernetes | This Project | Role |
|---|---|---|
| kube-apiserver | `api/handlers.go` | Accepts requests, stores state |
| Scheduler | Job Dispatcher | Decides what should run |
| kubelet | CRI Worker | Actually runs containers on a node |
| Controller Manager | Job Watcher | Reconciles actual vs desired state |
| etcd | PostgreSQL | State store (single source of truth) |
| CRI (containerd) | Docker SDK | Container runtime |

**What's skipped:** kube-proxy (networking between pods), multi-node support, RBAC, namespaces. This project focuses on the core scheduling loop.

**Why etcd vs PostgreSQL:** Real Kubernetes uses etcd, a distributed key-value store with Raft consensus. If one etcd node dies, the cluster keeps working. This project uses PostgreSQL — simpler, familiar, sufficient for a single-machine setup. The tradeoff: PostgreSQL is a single point of failure. etcd is not.

---

## 4. Architecture Overview

```
User
  |
  | HTTP POST /jobs
  v
┌─────────────────┐
│   API Server    │  ← Gin HTTP server on :8080
│  (api/handlers) │
└────────┬────────┘
         │ INSERT job (status: submitted)
         v
┌─────────────────┐
│   PostgreSQL    │  ← Single source of truth
│   (jobs table)  │
└────────┬────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
    v                              v
┌──────────────┐          ┌───────────────┐
│  Dispatcher  │          │  Job Watcher  │
│ (every 2s)   │          │  (every 10s)  │
│              │          │               │
│ submitted →  │          │ running →     │
│ runnable     │          │ succeeded/    │
└──────┬───────┘          │ failed        │
       │                  └───────┬───────┘
       v                          │
┌──────────────┐                  │
│  CRI Worker  │──────────────────┘
│  (every 2s)  │
│              │
│ runnable →   │
│ running      │
│              │
│ (talks to    │
│  Docker)     │
└──────────────┘
```

All three workers run as goroutines concurrently. They share the PostgreSQL pool but never step on each other — each worker operates on a different status.

---

## 5. The Job State Machine

Every job moves through these states in order:

```
submitted → runnable → running → succeeded
                               ↘ failed
```

**submitted**: Job has been accepted by the API and saved to the database. Nothing is running yet.

**runnable**: The dispatcher has verified compute is available and marked this job ready to run. In a real system this is where node selection happens.

**running**: The CRI worker has pulled the Docker image, created a container, started it, and stored the container ID. The container is now actually running.

**succeeded**: The watcher detected the container exited with code 0. Job finished cleanly. Container has been removed.

**failed**: The watcher detected the container exited with a non-zero exit code. Something went wrong. Container has been removed.

---

## 6. Project Structure

```
my_own_kubernetes/
├── api/
│   └── handlers.go          # Gin HTTP server, route handlers
├── db/
│   ├── db.go                # PostgreSQL connection pool setup
│   ├── queries.go           # All SQL queries (CRUD operations)
│   └── migrations/
│       ├── 000001_create_jobs_table.up.sql
│       └── 000001_create_jobs_table.down.sql
├── workers/
│   ├── job-dispatcher.go    # submitted → runnable
│   ├── cri-worker.go        # runnable → running (runs Docker containers)
│   └── job-watcher.go       # running → succeeded/failed
├── docker-compose.yml        # PostgreSQL container
├── .env                      # DATABASE_URL
├── go.mod
└── main.go                   # Wires everything together
```

**Package naming rule:** Every file in a folder must declare the same package name at the top. `api/` → `package api`, `db/` → `package db`, `workers/` → `package workers`. Go uses this for imports.

---

## 7. Technology Choices & Why

### Go
Chosen because Kubernetes itself is written in Go. Go has native goroutines — lightweight threads managed by the Go runtime. This means true parallel concurrency without needing external queue systems. The video this project is based on used Node.js, which is single-threaded and required BullMQ + Redis to coordinate workers. In Go, goroutines handle this natively.

### PostgreSQL (not Redis/BullMQ)
The video used BullMQ + Valkey (Redis) as a queue. This project uses PostgreSQL's `FOR UPDATE SKIP LOCKED` instead. This achieves the same result — safe concurrent job pickup — with one fewer service. PostgreSQL acts as both the state store and the queue.

### `FOR UPDATE SKIP LOCKED`
The most important SQL feature in this project. When multiple workers query for jobs simultaneously, this prevents two workers from grabbing the same row. Worker 1 locks row A, Worker 2 automatically skips it and takes row B. This is how the system would safely scale to multiple instances.

### pgxpool (Connection Pooling)
Instead of opening a new database connection for every query (expensive), `pgxpool` maintains a pool of open connections and hands them out as needed. Critical when 3 workers + the API server all need database access simultaneously.

### Gin
HTTP framework for Go. Chosen over standard `net/http` for cleaner routing and JSON handling. The handler struct pattern (`type Handler struct { pool *pgxpool.Pool }`) is used to give handlers access to the database pool, since Gin requires handlers to have a fixed signature `func(c *gin.Context)` with no extra parameters.

### Docker SDK (`github.com/moby/moby/client`)
Direct programmatic access to the Docker daemon. Used to check if images exist locally, pull images, create containers, start containers, inspect container state, stop containers, and remove containers.

### golang-migrate
Manages database schema changes as versioned SQL files. Every change is a `.up.sql` (apply) and `.down.sql` (revert) file. Guarantees anyone cloning the repo can recreate the exact schema by running `migrate up`.

---

## 8. Database Layer

### Schema

```sql
CREATE TYPE enum_status AS ENUM (
    'submitted', 'runnable', 'running', 'succeeded', 'failed'
);

CREATE TABLE jobs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image        TEXT NOT NULL,
    command      TEXT,
    env_vars     JSONB,
    container_id TEXT,
    status       enum_status NOT NULL DEFAULT 'submitted',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status ON jobs(status);
```

**Why UUID:** Globally unique, no coordination needed to generate. PostgreSQL generates it automatically via `gen_random_uuid()`.

**Why JSONB for env_vars:** Environment variables are key-value pairs. JSONB stores them as structured data, queryable and indexable, better than a plain text blob.

**Why index on status:** All three workers query by status constantly (`WHERE status = 'submitted'`, etc.). Without an index, PostgreSQL scans every row. With it, lookups are O(log n).

**Why enum for status:** Prevents invalid states. If you try to insert `status = 'banana'` PostgreSQL rejects it at the database level, not just the application level.

### Go Struct

```go
type Job struct {
    Id          string
    Image       string
    Command     *string    // pointer because nullable
    EnvVars     []byte     // JSONB as raw bytes
    ContainerID *string    // pointer because nullable
    Status      Status
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

**Why pointers for nullable fields:** In Go, a regular `string` can never be nil. A `*string` (pointer to string) can be nil, representing SQL NULL. `Command` and `ContainerID` start as NULL and get set later.

### Query Functions

| Function | Used By | SQL Operation |
|---|---|---|
| `InsertJob` | API | INSERT + RETURNING id |
| `GetSubmittedJobs` | Dispatcher | SELECT WHERE status = 'submitted' |
| `GetRunnableJobs` | CRI Worker | SELECT WHERE status = 'runnable' |
| `GetRunningJobs` | Watcher | SELECT WHERE status = 'running' |
| `GetAllJobs` | API | SELECT all |
| `UpdateJobsToRunnable` | Dispatcher | UPDATE batch by IDs |
| `UpdateJobToRunning` | CRI Worker | UPDATE status + container_id |
| `UpdateJobToSucceeded` | Watcher | UPDATE status, container_id = NULL |
| `UpdateJobToFailed` | Watcher | UPDATE status, container_id = NULL |

---

## 9. API Server

Two endpoints:

**`POST /jobs`** — Submit a job
```json
// Request body
{
    "image": "nginx:latest",
    "command": "echo hello",   // optional
    "env_vars": {"KEY": "VALUE"}  // optional
}

// Response
{
    "job_id": "a3dab7b2-d0b6-4db9-93c2-0126ae52647a"
}
```

**`GET /jobs`** — List all jobs
```json
// Response
[
  {
    "Id": "a3dab7b2-...",
    "Image": "nginx:latest",
    "Status": "running",
    "ContainerID": "5bdab7...",
    ...
  }
]
```

### Handler Struct Pattern

Gin requires handlers to have signature `func(c *gin.Context)` — no extra parameters allowed. To give handlers database access, a struct is used:

```go
type Handler struct {
    pool *pgxpool.Pool
}

func (h *Handler) createJob(c *gin.Context) {
    // h.pool is accessible here
}

router.POST("/jobs", h.createJob)
```

---

## 10. The Three Workers

All workers follow the same pattern:
1. Create a ticker
2. Loop forever
3. On each tick, do work
4. Log errors and continue (never crash)

### Job Dispatcher (every 2 seconds)

```
Poll submitted jobs → move to runnable
```

Uses `FOR UPDATE SKIP LOCKED` to safely handle multiple instances. Processes up to 5 jobs per tick. If no jobs found, skips. On error, logs and continues to next tick — never kills the worker.

### CRI Worker (every 2 seconds)

```
Poll runnable jobs → pull image if needed → create container → start container → store container ID → mark running
```

Key details:
- Docker client created once before the loop, reused every tick
- Image pull blocks until complete (important — the video had a bug where it didn't wait)
- `command` string split by spaces into `[]string` before passing to Docker
- `env_vars` JSONB parsed from `{"KEY": "VALUE"}` into `["KEY=VALUE"]` format for Docker
- `ContainerCreate` and `ContainerStart` are separate Docker calls

### Job Watcher (every 10 seconds)

```
Poll running jobs → inspect container → exited? → check exit code → mark succeeded/failed → remove container
```

Key details:
- Checks `ContainerID` is not nil before inspecting
- `State.Status == "exited"` means container has stopped
- `State.ExitCode == 0` means success, anything else is failure
- Sets `container_id = NULL` in database after cleanup
- Removes container from Docker after updating status

---

## 11. Key Concepts Explained

### Goroutines
Lightweight threads managed by Go's runtime. Spawned with the `go` keyword. The Go runtime multiplexes thousands of goroutines onto actual OS threads. This is why Go doesn't need Redis/BullMQ for worker coordination — workers are real parallel threads.

```go
go workers.StartDispatcher(pool)  // runs in its own goroutine
go workers.StartCRIWorker(pool)   // runs in its own goroutine
go workers.StartJobWatcher(pool)  // runs in its own goroutine
api.Start(pool)                   // runs in main goroutine, blocks
```

### Channels
Go's mechanism for communication between goroutines. `chan bool` is a channel that carries boolean values. Used here for the `done` pattern — a way to signal a goroutine to stop.

```go
done := make(chan bool)
<-done  // blocks until someone sends to done
```

### Context
Passed to every I/O operation. Carries cancellation signals and deadlines. `context.Background()` means no timeout. If a parent context is cancelled (e.g., on shutdown), all operations using child contexts automatically stop.

### Connection Pooling
Opening a database connection is expensive (TCP handshake, auth). A pool opens multiple connections upfront and reuses them. `pgxpool` manages this automatically — when a query finishes, the connection returns to the pool for the next query.

### FOR UPDATE SKIP LOCKED
PostgreSQL feature for safe concurrent job pickup:
```sql
SELECT id FROM jobs 
WHERE status = 'submitted' 
ORDER BY created_at ASC 
FOR UPDATE SKIP LOCKED 
LIMIT 5
```
Worker 1 locks rows 1-5. Worker 2's query automatically skips those locked rows and takes rows 6-10. No two workers ever process the same job.

### Desired State vs Current State
The fundamental Kubernetes concept. PostgreSQL stores the desired state (what jobs should exist and in what state). Docker represents current state (what containers are actually running). The watcher continuously reconciles them — if a container dies unexpectedly, it updates the DB to reflect reality.

### Graceful Shutdown
On `SIGINT` (ctrl+c) or `SIGTERM`:
1. Fetch all jobs in `running` state
2. Stop their Docker containers
3. Mark them `failed` in the database
4. Exit

Without this, containers keep running after the app exits and the database has stale `running` entries that cause the watcher to loop forever on restart trying to find containers that don't exist.

---

## 12. Running the Project

### Prerequisites
- Go 1.21+
- Docker Desktop
- `golang-migrate` CLI (`brew install golang-migrate`)

### Setup

```bash
# Clone and enter project
git clone https://github.com/krivansemlani/mini-k8s
cd mini-k8s

# Create .env file
echo 'DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable' > .env

# Start PostgreSQL
docker compose up -d

# Run migrations
migrate -database "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable" -path db/migrations up

# Install dependencies
go mod tidy

# Run
go run main.go
```

### Submit a Job

```bash
curl -X POST http://localhost:8080/jobs \
  -H "Content-Type: application/json" \
  -d '{"image": "nginx:latest"}'
```

### Check Job Status

```bash
curl http://localhost:8080/jobs
```

### Run the Dashboard (UI)

A companion web dashboard lives in [`dashboard/`](./dashboard). It talks to the Go API through a Vite dev proxy, so there is **no CORS change needed** on the backend.

**Prerequisites**: Node.js 18+ and npm.

In one terminal, keep the Go API running:

```bash
go run main.go
```

In a second terminal, start the dashboard:

```bash
cd dashboard
npm install          # first time only
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

What you'll see:

- **Phase stats** — live counts for submitted / runnable / running / succeeded / failed.
- **Submit form** — presets like `nginx:alpine`, `busybox`, `alpine sleep`, plus optional command and KEY=value env vars.
- **Jobs log** — polls `GET /jobs` every 3s with filters, search, and per-job detail (container id, env vars, timestamps).
- **Architecture** — the state machine and the three workers.

To produce a production build (static assets in `dashboard/dist/`):

```bash
cd dashboard
npm run build
```

See [`dashboard/README.md`](./dashboard/README.md) for more.

---

## 13. Testing

### Test a long-running container (nginx)
```bash
curl -X POST http://localhost:8080/jobs \
  -H "Content-Type: application/json" \
  -d '{"image": "nginx:latest"}'
```
Job stays in `running`. Visible in Docker Desktop.

### Test succeeded
```bash
curl -X POST http://localhost:8080/jobs \
  -H "Content-Type: application/json" \
  -d '{"image": "alpine:latest", "command": "echo hello"}'
```
Alpine runs, prints "hello", exits with code 0 → `succeeded` within ~10 seconds.

### Test failed
```bash
curl -X POST http://localhost:8080/jobs \
  -H "Content-Type: application/json" \
  -d '{"image": "alpine:latest", "command": "ls /nonexistent"}'
```
Alpine tries to list a nonexistent directory, exits with code 1 → `failed` within ~10 seconds.

### Test with env vars
```bash
curl -X POST http://localhost:8080/jobs \
  -H "Content-Type: application/json" \
  -d '{"image": "alpine:latest", "command": "env", "env_vars": {"MY_VAR": "hello"}}'
```

---

## 14. Graceful Shutdown

Press `ctrl+c`. The shutdown handler:
1. Fetches all `running` jobs from PostgreSQL
2. Stops each Docker container (`docker stop`)
3. Removes each Docker container (`docker rm`)
4. Marks each job as `failed` in PostgreSQL
5. Exits cleanly

On next startup, no phantom `running` jobs exist. Workers start clean.

---

*Built with Go, PostgreSQL, Docker SDK, Gin, pgxpool, golang-migrate.*