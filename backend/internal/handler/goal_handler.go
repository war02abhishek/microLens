package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"macrolens-backend/internal/goals"
	"macrolens-backend/internal/model"
	"macrolens-backend/internal/store"
)

type GoalHandler struct {
	store *store.Store
}

func NewGoalHandler(s *store.Store) *GoalHandler {
	return &GoalHandler{store: s}
}

// GET /goals
func (h *GoalHandler) Get(c *gin.Context) {
	userID := c.GetString("user_id")
	g, err := h.store.GetGoals(c.Request.Context(), userID)
	if errors.Is(err, store.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "goals not computed yet — call POST /goals/recalculate"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load goals"})
		return
	}
	c.JSON(http.StatusOK, g)
}

// POST /goals/recalculate — recompute from the caller's saved profile
// using the same Mifflin-St Jeor formula documented in
// internal/goals/calculator.go (PRD §3.2 — always show the derivation and
// let the user override).
func (h *GoalHandler) Recalculate(c *gin.Context) {
	userID := c.GetString("user_id")

	profile, err := h.store.GetProfile(c.Request.Context(), userID)
	if errors.Is(err, store.ErrNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "save a profile first (PUT /profile) before recalculating goals"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load profile"})
		return
	}

	computed := goals.Compute(profile)
	saved, err := h.store.UpsertGoals(c.Request.Context(), computed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save goals"})
		return
	}
	c.JSON(http.StatusOK, saved)
}

// PUT /goals — manual override
func (h *GoalHandler) Override(c *gin.Context) {
	userID := c.GetString("user_id")

	var body model.Goals
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	body.UserID = userID
	body.Overridden = true

	saved, err := h.store.UpsertGoals(c.Request.Context(), body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save goals"})
		return
	}
	c.JSON(http.StatusOK, saved)
}
