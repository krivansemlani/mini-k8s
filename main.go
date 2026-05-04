package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/krivansemlani/mini-k8s/api"
	"github.com/krivansemlani/mini-k8s/db"
	"github.com/krivansemlani/mini-k8s/workers"
	"github.com/moby/moby/client"
)

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")

	pool, err := db.Connect(dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	go workers.StartDispatcher(pool)
	go workers.StartCRIWorker(pool)
	go workers.StartJobWatcher(pool)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("shutting down, stopping all running containers...")

		dockerClient, err := client.New(client.FromEnv)
		if err != nil {
			log.Fatal(err)
		}
		defer dockerClient.Close()

		jobs, err := db.GetRunningJobs(context.Background(), pool)
		if err != nil {
			log.Println("error fetching running jobs:", err)
			os.Exit(1)
		}

		for _, job := range jobs {
			if job.ContainerID == nil {
				continue
			}
			containerID := *job.ContainerID
			_, err := dockerClient.ContainerStop(context.Background(), containerID, client.ContainerStopOptions{})
			if err != nil {
				log.Println("error stopping container:", err)
			}
			_, err = dockerClient.ContainerRemove(context.Background(), containerID, client.ContainerRemoveOptions{})
			err = db.UpdateJobToFailed(context.Background(), pool, job.Id)
			if err != nil {
				log.Println("error updating job to failed:", err)
			}
			if err != nil {
				log.Println("error removing container:", err)
			}
			log.Println("stopped and removed container:", containerID)
		}

		log.Println("all containers stopped. exiting.")
		os.Exit(0)
	}()

	api.Start(pool)
}
