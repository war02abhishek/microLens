package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"macrolens-backend/internal/store"
)

type HistoryHandler struct {
	store *store.Store
}

func NewHistoryHandler(s *store.Store) *HistoryHandler {
	return &HistoryHandler{store: s}
}

// GET /history?days=28 — daily macro totals (oldest first, zero-filled for
// days with no meals logged) plus the current/longest streak, for the
// History screen's weekly charts and logged-days grid.
func (h *HistoryHandler) Get(c *gin.Context) {
	userID := c.GetString("user_id")

	days := 28
	if raw := c.Query("days"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 || parsed > 90 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "days must be an integer between 1 and 90"})
			return
		}
		days = parsed
	}

	totals, err := h.store.GetDailyTotals(c.Request.Context(), userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load history"})
		return
	}

	streak, err := h.store.GetStreak(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load streak"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"days": totals, "streak": streak})
}
