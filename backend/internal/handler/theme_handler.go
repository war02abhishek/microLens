package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ThemeHandler struct {
	// store *store.Store
}

func NewThemeHandler() *ThemeHandler {
	return &ThemeHandler{}
}

// GET /themes — curated theme gallery
func (h *ThemeHandler) List(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}
