package db

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Status string

const (
	Submitted Status = "submitted"
	Runnable  Status = "runnable"
	Running   Status = "running"
	Succeeded Status = "succeeded"
	Failed    Status = "failed"
)

type Job struct {
	Id          string
	Image       string
	Command     *string
	EnvVars     []byte
	ContainerID *string
	Status      Status
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func GetAllJobs(ctx context.Context, pool *pgxpool.Pool) ([]Job, error) {
	query := "SELECT id, image, command, env_vars, container_id, status, created_at, updated_at FROM jobs"
	rows, err := pool.Query(ctx, query)

	if err != nil {
		return []Job{}, err
	}
	defer rows.Close()
	jobs := []Job{}

	for rows.Next() {
		var job Job
		err := rows.Scan(&job.Id, &job.Image, &job.Command, &job.EnvVars, &job.ContainerID, &job.Status, &job.CreatedAt, &job.UpdatedAt)
		if err != nil {
			return []Job{}, err
		}
		jobs = append(jobs, job)

	}

	return jobs, nil

}

func InsertJob(ctx context.Context, pool *pgxpool.Pool, image string, command *string, env_vars []byte) (jobID string, err error) {
	query := "INSERT INTO jobs (image, command, env_vars) VALUES ($1, $2, $3) RETURNING id"

	err = pool.QueryRow(ctx, query, image, command, env_vars).Scan(&jobID)

	if err != nil {
		// fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
		return "", err
	}
	return jobID, err
}

func GetSubmittedJobs(ctx context.Context, pool *pgxpool.Pool) ([]Job, error) {
	query := "SELECT id, image, command, env_vars, container_id, status, created_at, updated_at FROM jobs WHERE status = 'submitted'"

	rows, err := pool.Query(ctx, query)

	if err != nil {
		return []Job{}, err
	}
	defer rows.Close()
	jobs := []Job{}

	for rows.Next() {
		var job Job
		err := rows.Scan(&job.Id, &job.Image, &job.Command, &job.EnvVars, &job.ContainerID, &job.Status, &job.CreatedAt, &job.UpdatedAt)
		if err != nil {
			return []Job{}, err
		}
		jobs = append(jobs, job)

	}

	return jobs, nil

}

func GetRunnableJobs(ctx context.Context, pool *pgxpool.Pool) ([]Job, error) {
	query := "SELECT id, image, command, env_vars, container_id, status, created_at, updated_at FROM jobs WHERE status = 'runnable'"

	rows, err := pool.Query(ctx, query)

	if err != nil {
		return []Job{}, err
	}
	defer rows.Close()
	jobs := []Job{}

	for rows.Next() {
		var job Job
		err := rows.Scan(&job.Id, &job.Image, &job.Command, &job.EnvVars, &job.ContainerID, &job.Status, &job.CreatedAt, &job.UpdatedAt)
		if err != nil {
			return []Job{}, err
		}
		jobs = append(jobs, job)

	}

	return jobs, nil
}

func GetRunningJobs(ctx context.Context, pool *pgxpool.Pool) ([]Job, error) {
	query := "SELECT id, image, command, env_vars, container_id, status, created_at, updated_at FROM jobs WHERE status = 'running'"

	rows, err := pool.Query(ctx, query)

	if err != nil {
		return []Job{}, err
	}
	defer rows.Close()
	jobs := []Job{}

	for rows.Next() {
		var job Job
		err := rows.Scan(&job.Id, &job.Image, &job.Command, &job.EnvVars, &job.ContainerID, &job.Status, &job.CreatedAt, &job.UpdatedAt)
		if err != nil {
			return []Job{}, err
		}
		jobs = append(jobs, job)

	}

	return jobs, nil
}

func UpdateJobsToRunnable(ctx context.Context, pool *pgxpool.Pool, jobIDs []string) error {
	query := "UPDATE jobs SET status = 'runnable' WHERE status = 'submitted' and id = any($1)"

	_, err := pool.Exec(ctx, query, jobIDs)
	if err != nil {
		return err
	}
	return nil
}

func UpdateJobToRunning(ctx context.Context, pool *pgxpool.Pool, jobID string, containerID string) error {
	query := "UPDATE jobs SET status = 'running' , container_id = $2 WHERE status = 'runnable' and id = $1"
	_, err := pool.Exec(ctx, query, jobID, containerID)
	if err != nil {
		return err
	}
	return nil
}

func UpdateJobToSucceeded(ctx context.Context, pool *pgxpool.Pool, jobID string) error {
	query := "UPDATE jobs SET status = 'succeeded' , container_id = null WHERE status = 'running' and id = $1"
	_, err := pool.Exec(ctx, query, jobID)
	if err != nil {
		return err
	}
	return nil
}

func UpdateJobToFailed(ctx context.Context, pool *pgxpool.Pool, jobID string) error {
	query := "UPDATE jobs SET status = 'failed' , container_id = null WHERE status = 'running' and id = $1"
	_, err := pool.Exec(ctx, query, jobID)
	if err != nil {
		return err
	}
	return nil
}
