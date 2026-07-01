package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"macrolens-backend/config"
	"macrolens-backend/internal/ai"
	"macrolens-backend/internal/handler"
	"macrolens-backend/internal/middleware"
	"macrolens-backend/internal/nutrition"
)

func main() {
	cfg := config.Load()

	aiClient := ai.NewClient(cfg.OpenAIAPIKey)
	nutritionClient := nutrition.NewClient(cfg.NutritionAPIKey, cfg.NutritionAPIBase)

	authHandler := handler.NewAuthHandler(cfg.JWTSecret)
	profileHandler := handler.NewProfileHandler()
	goalHandler := handler.NewGoalHandler()
	mealHandler := handler.NewMealHandler(aiClient, nutritionClient)
	themeHandler := handler.NewThemeHandler()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	auth := r.Group("/auth")
	{
		auth.POST("/signup", authHandler.Signup)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
	}

	api := r.Group("/")
	api.Use(middleware.RequireAuth(cfg.JWTSecret))
	{
		api.GET("/profile", profileHandler.Get)
		api.PUT("/profile", profileHandler.Upsert)

		api.GET("/goals", goalHandler.Get)
		api.POST("/goals/recalculate", goalHandler.Recalculate)
		api.PUT("/goals", goalHandler.Override)

		api.POST("/meals/analyze/text", mealHandler.AnalyzeText)
		api.POST("/meals/analyze/photo", mealHandler.AnalyzePhoto)
		api.POST("/meals", mealHandler.Create)
		api.GET("/meals", mealHandler.ListForDay)
		api.DELETE("/meals/:id", mealHandler.Delete)

		api.GET("/themes", themeHandler.List)
	}

	log.Printf("macrolens-backend listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
