package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"macrolens-backend/internal/ai"
	"macrolens-backend/internal/model"
	"macrolens-backend/internal/nutrition"
	"macrolens-backend/internal/store"
)

type MealHandler struct {
	ai        *ai.Client
	nutrition *nutrition.Client
	store     *store.Store
}

func NewMealHandler(aiClient *ai.Client, nutritionClient *nutrition.Client, s *store.Store) *MealHandler {
	return &MealHandler{ai: aiClient, nutrition: nutritionClient, store: s}
}

type mealItemDraft struct {
	FoodName      string  `json:"food_name"`
	QuantityValue float64 `json:"quantity_value"`
	QuantityUnit  string  `json:"quantity_unit"`
	Calories      float64 `json:"calories"`
	ProteinG      float64 `json:"protein_g"`
	CarbsG        float64 `json:"carbs_g"`
	FatG          float64 `json:"fat_g"`
	Confidence    float64 `json:"confidence"`
}

type mealDraft struct {
	Source   string          `json:"source"`
	RawInput string          `json:"raw_input,omitempty"`
	Items    []mealItemDraft `json:"items"`
}

// POST /meals/analyze/text — body: {"description": "two eggs and toast"}
// Runs the AI identification step (OpenAI vision/text, structured output)
// and macro lookup (nutrition DB), returns an editable draft. Does NOT
// persist — the client confirms via POST /meals first.
func (h *MealHandler) AnalyzeText(c *gin.Context) {
	var req struct {
		Description string `json:"description" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	identified, err := h.ai.IdentifyFromText(c.Request.Context(), req.Description)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI meal recognition failed: " + err.Error()})
		return
	}

	draft := mealDraft{Source: "text", RawInput: req.Description, Items: identifiedToDraft(identified)}
	c.JSON(http.StatusOK, draft)
}

// POST /meals/analyze/photo — body: {"image_base64": "data:image/jpeg;base64,..."}
func (h *MealHandler) AnalyzePhoto(c *gin.Context) {
	var req struct {
		ImageBase64 string `json:"image_base64" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	identified, err := h.ai.IdentifyFromPhoto(c.Request.Context(), req.ImageBase64)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI meal recognition failed: " + err.Error()})
		return
	}

	draft := mealDraft{Source: "photo", Items: identifiedToDraft(identified)}
	c.JSON(http.StatusOK, draft)
}

// identifiedToDraft maps the AI's directly-estimated macros straight
// through. The nutrition-DB lookup path (internal/nutrition) is kept but
// unused for now — the USDA free-text search was mismatching foods (see
// git history), and macro accuracy is being trusted to the model itself
// for the time being.
func identifiedToDraft(identified []ai.IdentifiedItem) []mealItemDraft {
	items := make([]mealItemDraft, 0, len(identified))
	for _, it := range identified {
		items = append(items, mealItemDraft{
			FoodName:      it.FoodName,
			QuantityValue: it.QuantityValue,
			QuantityUnit:  it.QuantityUnit,
			Calories:      it.Calories,
			ProteinG:      it.ProteinG,
			CarbsG:        it.CarbsG,
			FatG:          it.FatG,
			Confidence:    it.Confidence,
		})
	}
	return items
}

// POST /meals — persist a confirmed (possibly edited) meal draft
func (h *MealHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")

	var body mealDraft
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	meal := model.Meal{
		UserID:   userID,
		Source:   model.MealSource(body.Source),
		RawInput: body.RawInput,
	}
	items := make([]model.MealItem, 0, len(body.Items))
	var totalConfidence float64
	for _, it := range body.Items {
		items = append(items, model.MealItem{
			FoodName:      it.FoodName,
			QuantityValue: it.QuantityValue,
			QuantityUnit:  it.QuantityUnit,
			Calories:      it.Calories,
			ProteinG:      it.ProteinG,
			CarbsG:        it.CarbsG,
			FatG:          it.FatG,
		})
		totalConfidence += it.Confidence
	}
	if len(items) > 0 {
		meal.Confidence = totalConfidence / float64(len(items))
	}

	created, err := h.store.CreateMeal(c.Request.Context(), meal, items)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save meal"})
		return
	}
	if err := h.store.UpdateStreakOnLog(c.Request.Context(), userID, created.LoggedAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "meal saved but failed to update streak"})
		return
	}

	c.JSON(http.StatusCreated, created)
}

// GET /meals?date=YYYY-MM-DD
func (h *MealHandler) ListForDay(c *gin.Context) {
	userID := c.GetString("user_id")

	dateStr := c.Query("date")
	day := time.Now()
	if dateStr != "" {
		parsed, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "date must be YYYY-MM-DD"})
			return
		}
		day = parsed
	}

	meals, err := h.store.ListMealsForDay(c.Request.Context(), userID, day)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load meals"})
		return
	}
	c.JSON(http.StatusOK, meals)
}

// DELETE /meals/:id
func (h *MealHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	mealID := c.Param("id")

	err := h.store.DeleteMeal(c.Request.Context(), userID, mealID)
	if errors.Is(err, store.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "meal not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete meal"})
		return
	}
	c.Status(http.StatusNoContent)
}
