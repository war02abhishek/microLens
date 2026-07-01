package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type GoalHandler struct {
	// store *store.Store
}

func NewGoalHandler() *GoalHandler {
	return &GoalHandler{}
}

// GET /goals
func (h *GoalHandler) Get(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// POST /goals/recalculate — recompute from profile via internal/goals.Compute
func (h *GoalHandler) Recalculate(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// PUT /goals — manual override
func (h *GoalHandler) Override(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}
