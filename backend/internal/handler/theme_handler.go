package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"macrolens-backend/internal/store"
)

type ThemeHandler struct {
	store *store.Store
}

func NewThemeHandler(s *store.Store) *ThemeHandler {
	return &ThemeHandler{store: s}
}

// GET /themes — curated theme gallery
func (h *ThemeHandler) List(c *gin.Context) {
	themes, err := h.store.ListThemes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load themes"})
		return
	}
	c.JSON(http.StatusOK, themes)
}
