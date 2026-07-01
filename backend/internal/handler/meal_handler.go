package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"macrolens-backend/internal/ai"
	"macrolens-backend/internal/nutrition"
)

type MealHandler struct {
	ai        *ai.Client
	nutrition *nutrition.Client
	// store *store.Store
}

func NewMealHandler(aiClient *ai.Client, nutritionClient *nutrition.Client) *MealHandler {
	return &MealHandler{ai: aiClient, nutrition: nutritionClient}
}

// POST /meals/analyze/text — body: {"description": "two eggs and toast"}
// Runs the AI identification step and macro lookup, returns an editable
// draft. Does NOT persist — the client confirms via POST /meals first.
func (h *MealHandler) AnalyzeText(c *gin.Context) {
	var req struct {
		Description string `json:"description" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// POST /meals/analyze/photo — multipart photo upload
func (h *MealHandler) AnalyzePhoto(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// POST /meals — persist a confirmed (possibly edited) meal draft
func (h *MealHandler) Create(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// GET /meals?date=YYYY-MM-DD
func (h *MealHandler) ListForDay(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// DELETE /meals/:id
func (h *MealHandler) Delete(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}
