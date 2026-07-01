package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	// store *store.Store
}

func NewProfileHandler() *ProfileHandler {
	return &ProfileHandler{}
}

// GET /profile
func (h *ProfileHandler) Get(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// PUT /profile
func (h *ProfileHandler) Upsert(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}
