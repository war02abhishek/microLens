package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"macrolens-backend/internal/model"
	"macrolens-backend/internal/store"
)

type ProfileHandler struct {
	store *store.Store
}

func NewProfileHandler(s *store.Store) *ProfileHandler {
	return &ProfileHandler{store: s}
}

// GET /profile
func (h *ProfileHandler) Get(c *gin.Context) {
	userID := c.GetString("user_id")
	profile, err := h.store.GetProfile(c.Request.Context(), userID)
	if errors.Is(err, store.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not set up yet"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load profile"})
		return
	}
	c.JSON(http.StatusOK, profile)
}

// PUT /profile
func (h *ProfileHandler) Upsert(c *gin.Context) {
	userID := c.GetString("user_id")

	var body model.Profile
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	body.UserID = userID

	saved, err := h.store.UpsertProfile(c.Request.Context(), body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save profile"})
		return
	}
	c.JSON(http.StatusOK, saved)
}
