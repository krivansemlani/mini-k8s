import type { ApiJob, Job } from "./types";

const API_BASE = "/api";

function decodeEnvVars(b64: string | null): Record<string, string> | null {
  if (!b64) return null;
  try {
    const json = atob(b64);
    if (!json.trim()) return null;
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeJob(j: ApiJob): Job {
  return {
    id: j.Id,
    image: j.Image,
    command: j.Command,
    envVars: decodeEnvVars(j.EnvVars),
    containerId: j.ContainerID,
    status: j.Status,
    createdAt: j.CreatedAt,
    updatedAt: j.UpdatedAt,
  };
}

export async function fetchJobs(signal?: AbortSignal): Promise<Job[]> {
  const res = await fetch(`${API_BASE}/jobs`, { signal });
  if (!res.ok) {
    throw new Error(`GET /jobs failed: ${res.status}`);
  }
  const data = (await res.json()) as ApiJob[] | null;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeJob);
}

export interface CreateJobInput {
  image: string;
  command?: string;
  envVars?: Record<string, string>;
}

export async function createJob(input: CreateJobInput): Promise<string> {
  // The Go handler expects `env_vars` as []byte — which JSON-decodes from a
  // base64 string. We encode a JSON object of { KEY: value } entries.
  const body: Record<string, unknown> = { image: input.image };

  if (input.command && input.command.trim()) {
    body.command = input.command.trim();
  }

  if (input.envVars && Object.keys(input.envVars).length > 0) {
    const envJson = JSON.stringify(input.envVars);
    body.env_vars = btoa(envJson);
  }

  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `POST /jobs failed: ${res.status}`);
  }

  const data = (await res.json()) as { job_id?: string };
  return data.job_id ?? "";
}
