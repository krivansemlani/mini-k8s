export type JobStatus =
  | "submitted"
  | "runnable"
  | "running"
  | "succeeded"
  | "failed";

// Shape returned by the Go API (`GET /jobs`).
// Go marshals struct fields with their exact Go names (no json tags),
// and `[]byte` becomes base64 in JSON output.
export interface ApiJob {
  Id: string;
  Image: string;
  Command: string | null;
  EnvVars: string | null; // base64-encoded JSON bytes, or null
  ContainerID: string | null;
  Status: JobStatus;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Job {
  id: string;
  image: string;
  command: string | null;
  envVars: Record<string, string> | null;
  containerId: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_ORDER: JobStatus[] = [
  "submitted",
  "runnable",
  "running",
  "succeeded",
  "failed",
];
