package workers

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/krivansemlani/mini-k8s/db"
)

func StartDispatcher(pool *pgxpool.Pool) {
	ticker := time.NewTicker(2000 * time.Millisecond)
	defer ticker.Stop()

	done := make(chan bool)

	for {
		select {
		case <-ticker.C:
			//do work
			jobs, err := db.GetSubmittedJobs(context.Background(), pool)
			if err != nil {
				log.Println("dispatcher error:", err)
				continue
			}
			if len(jobs) == 0 {
				continue
			}
			var jobID []string
			for _, job := range jobs {
				jobID = append(jobID, job.Id)
			}
			err = db.UpdateJobsToRunnable(context.Background(), pool, jobID)

			if err != nil {
				log.Println("dispatcher error:", err)
				continue
			}

		case <-done:
			return
		}
	}

}
