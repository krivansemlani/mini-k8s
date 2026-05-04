package workers

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/krivansemlani/mini-k8s/db"
	"github.com/moby/moby/client"
)

func StartJobWatcher(pool *pgxpool.Pool) {
	dockerClient, err := client.New(client.FromEnv)
	if err != nil {
		log.Fatal("Failed to create Docker client:", err)
	}
	defer dockerClient.Close()
	ticker := time.NewTicker(10000 * time.Millisecond)
	defer ticker.Stop()

	done := make(chan bool)

	for {
		select {
		case <-ticker.C:
			jobs, err := db.GetRunningJobs(context.Background(), pool)

			if err != nil {
				log.Println("job watcher error:", err)
				continue
			}

			for _, job := range jobs {
				if job.ContainerID == nil {
					continue
				}

				containerID := *job.ContainerID
				containerInfo, err := dockerClient.ContainerInspect(context.Background(), containerID, client.ContainerInspectOptions{})
				if err != nil {
					log.Println("container inspect error:", err)
					continue
				}
				if containerInfo.Container.State.Status == "exited" {
					if containerInfo.Container.State.ExitCode == 0 {
						err = db.UpdateJobToSucceeded(context.Background(), pool, job.Id)
						if err != nil {
							log.Println("update job to succeeded error:", err)
							continue
						}
					} else {
						err = db.UpdateJobToFailed(context.Background(), pool, job.Id)
						if err != nil {
							log.Println("update job to failed error:", err)
							continue
						}
					}
					dockerClient.ContainerRemove(context.Background(), containerID, client.ContainerRemoveOptions{})
				}

			}
		case <-done:
			return

		}
	}
}
