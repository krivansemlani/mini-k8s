import { useMemo } from "react";
import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { PhaseStats } from "./components/PhaseStats";
import { CreateJobForm } from "./components/CreateJobForm";
import { JobsTable } from "./components/JobsTable";
import { Architecture } from "./components/Architecture";
import { Footer } from "./components/Footer";
import { ApiErrorBanner } from "./components/ApiErrorBanner";
import { useJobs } from "./lib/useJobs";

const POLL_MS = 3000;

export default function App() {
  const { jobs, apiStatus, error, nextPollInMs, refresh } = useJobs(POLL_MS);

  const showBanner = useMemo(
    () => apiStatus === "error" && jobs.length === 0,
    [apiStatus, jobs.length]
  );

  return (
    <div className="min-h-full flex flex-col">
      <TopBar
        apiStatus={apiStatus}
        nextPollInMs={nextPollInMs}
        pollIntervalMs={POLL_MS}
      />

      {showBanner && <ApiErrorBanner error={error} />}

      <main className="flex-1">
        <div className="animate-[fadeUp_0.7s_cubic-bezier(0.2,0.8,0.2,1)_both]">
          <Hero />
        </div>

        <div
          className="animate-[fadeUp_0.7s_cubic-bezier(0.2,0.8,0.2,1)_both]"
          style={{ animationDelay: "120ms" }}
        >
          <PhaseStats jobs={jobs} />
        </div>

        <section
          className="mx-auto max-w-7xl px-6 lg:px-10 pb-16 animate-[fadeUp_0.7s_cubic-bezier(0.2,0.8,0.2,1)_both]"
          style={{ animationDelay: "220ms" }}
        >
          <div className="grid grid-cols-12 gap-6 lg:gap-8">
            <div className="col-span-12 lg:col-span-5 xl:col-span-4">
              <CreateJobForm onCreated={refresh} />
            </div>
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 min-h-[560px]">
              <JobsTable
                jobs={jobs}
                onRefresh={refresh}
                nextPollInMs={nextPollInMs}
                pollIntervalMs={POLL_MS}
              />
            </div>
          </div>
        </section>

        <div
          className="animate-[fadeUp_0.7s_cubic-bezier(0.2,0.8,0.2,1)_both]"
          style={{ animationDelay: "320ms" }}
        >
          <Architecture />
        </div>
      </main>

      <Footer />
    </div>
  );
}
