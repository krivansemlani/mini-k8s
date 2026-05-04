package workers

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"os"
	"strings"
	"time"

	cerrdefs "github.com/containerd/errdefs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/krivansemlani/mini-k8s/db"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

func StartCRIWorker(pool *pgxpool.Pool) {
	dockerClient, err := client.New(client.FromEnv)
	if err != nil {
		log.Fatal("Failed to create Docker client:", err)
	}
	defer dockerClient.Close()

	ticker := time.NewTicker(2000 * time.Millisecond)
	defer ticker.Stop()

	done := make(chan bool)

	for {
		select {
		case <-ticker.C:
			jobs, err := db.GetRunnableJobs(context.Background(), pool)
			if err != nil {
				log.Println("CRI error:", err)
				continue
			}

			for _, job := range jobs {
				_, err := dockerClient.ImageInspect(context.Background(), job.Image)
				if err != nil {
					if cerrdefs.IsNotFound(err) {
						out, err := dockerClient.ImagePull(context.Background(), job.Image, client.ImagePullOptions{})
						if err != nil {
							log.Println("image pull error:", err)
							continue
						}
						io.Copy(os.Stdout, out)
						out.Close()
					} else {
						log.Println("inspect error:", err)
						continue
					}
				}

				var cmd []string
				if job.Command != nil {
					cmd = strings.Split(*job.Command, " ")
				}

				var envSlice []string
				if job.EnvVars != nil {
					var envMap map[string]string
					err := json.Unmarshal(job.EnvVars, &envMap)
					if err != nil {
						log.Println("env parse error:", err)
						continue
					}
					for k, v := range envMap {
						envSlice = append(envSlice, k+"="+v)
					}
				}

				c, err := dockerClient.ContainerCreate(context.Background(), client.ContainerCreateOptions{
					Config: &container.Config{
						Image: job.Image,
						Cmd:   cmd,
						Env:   envSlice,
					},
				})
				if err != nil {
					log.Println("create container error:", err)
					continue
				}

				_, err = dockerClient.ContainerStart(context.Background(), c.ID, client.ContainerStartOptions{})
				if err != nil {
					log.Println("start container error:", err)
					continue
				}

				err = db.UpdateJobToRunning(context.Background(), pool, job.Id, c.ID)
				if err != nil {
					log.Println("update job to running error:", err)
					continue
				}
			}

		case <-done:
			return
		}
	}
}
