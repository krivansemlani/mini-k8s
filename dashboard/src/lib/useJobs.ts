import { useEffect, useRef, useState } from "react";
import { fetchJobs } from "./api";
import type { Job } from "./types";

export type ApiStatus = "idle" | "ok" | "error";

export interface UseJobsResult {
  jobs: Job[];
  apiStatus: ApiStatus;
  error: string | null;
  lastUpdated: number | null;
  nextPollInMs: number;
  refresh: () => void;
}

/**
 * Polls GET /jobs on an interval. Exposes a gentle "next poll in…" countdown
 * so the UI can show a live heartbeat without spamming re-renders.
 */
export function useJobs(intervalMs: number = 3000): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [nextPollInMs, setNextPollInMs] = useState<number>(intervalMs);

  const abortRef = useRef<AbortController | null>(null);
  const nextPollAtRef = useRef<number>(Date.now() + intervalMs);
  const refreshTokenRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const data = await fetchJobs(ac.signal);
        if (cancelled) return;
        setJobs(data);
        setApiStatus("ok");
        setError(null);
        setLastUpdated(Date.now());
      } catch (err) {
        if (cancelled || ac.signal.aborted) return;
        setApiStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        nextPollAtRef.current = Date.now() + intervalMs;
      }
    };

    run();

    const poll = setInterval(run, intervalMs);

    const tick = setInterval(() => {
      const remaining = Math.max(0, nextPollAtRef.current - Date.now());
      setNextPollInMs(remaining);
    }, 200);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
      abortRef.current?.abort();
    };
  }, [intervalMs, refreshTokenRef.current]);

  const refresh = () => {
    refreshTokenRef.current += 1;
    nextPollAtRef.current = Date.now();
    // Trigger an immediate fetch by re-running effect via state tick.
    setNextPollInMs(0);
    fetchJobs()
      .then((data) => {
        setJobs(data);
        setApiStatus("ok");
        setError(null);
        setLastUpdated(Date.now());
        nextPollAtRef.current = Date.now() + intervalMs;
      })
      .catch((err) => {
        setApiStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      });
  };

  return { jobs, apiStatus, error, lastUpdated, nextPollInMs, refresh };
}
