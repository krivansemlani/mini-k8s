package api

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/krivansemlani/mini-k8s/db"
)

type Handler struct {
	pool *pgxpool.Pool
}

type RequestBody struct {
	Image   string  `json:"image"`
	Command *string `json:"command"`
	EnvVars []byte  `json:"env_vars"`
}

func Start(pool *pgxpool.Pool) {
	h := &Handler{pool: pool}
	router := gin.Default()
	router.POST("/jobs", h.createJob)
	router.GET("/jobs", h.getJob)

	router.Run(":8080")
}

func (h *Handler) createJob(c *gin.Context) {
	var rb RequestBody

	err := c.ShouldBindJSON(&rb)

	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	jobID, err := db.InsertJob(context.Background(), h.pool, rb.Image, rb.Command, rb.EnvVars)

	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"job_id": jobID,
	})

}

func (h *Handler) getJob(c *gin.Context) {
	jobs, err := db.GetAllJobs(context.Background(), h.pool)

	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, jobs)

}
