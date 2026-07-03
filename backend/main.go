package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"macrolens-backend/config"
	"macrolens-backend/internal/ai"
	"macrolens-backend/internal/handler"
	"macrolens-backend/internal/middleware"
	"macrolens-backend/internal/nutrition"
	"macrolens-backend/internal/store"
)

func main() {
	cfg := config.Load()
	if cfg.JWTSecret == "" || cfg.JWTSecret == "change-me" {
		log.Fatal("JWT_SECRET must be set to a real secret before starting (see backend/.env.example) — refusing to sign tokens with an empty or placeholder secret")
	}
	ctx := context.Background()

	db, err := store.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	migrationsDir := getEnv("MIGRATIONS_DIR", "migrations")
	if err := db.RunMigrations(ctx, migrationsDir); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}
	log.Println("migrations applied")

	aiClient := ai.NewClient(cfg.OpenAIAPIKey)
	nutritionClient := nutrition.NewClient(cfg.NutritionAPIKey, cfg.NutritionAPIBase)

	authHandler := handler.NewAuthHandler(db, cfg.JWTSecret)
	profileHandler := handler.NewProfileHandler(db)
	goalHandler := handler.NewGoalHandler(db)
	mealHandler := handler.NewMealHandler(aiClient, nutritionClient, db)
	themeHandler := handler.NewThemeHandler(db)
	historyHandler := handler.NewHistoryHandler(db)

	r := gin.Default()
	r.Use(middleware.CORS())
	r.Use(middleware.MaxBodyBytes(10 << 20)) // 10MB — generous for a compressed meal photo, caps abuse

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	auth := r.Group("/auth")
	auth.Use(middleware.RateLimit(20, time.Hour)) // per-IP: signup/login/refresh abuse guard
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

		aiLimited := api.Group("/meals/analyze")
		aiLimited.Use(middleware.RateLimit(30, time.Hour)) // per-user: caps OpenAI cost exposure
		{
			aiLimited.POST("/text", mealHandler.AnalyzeText)
			aiLimited.POST("/photo", mealHandler.AnalyzePhoto)
		}
		api.POST("/meals", mealHandler.Create)
		api.GET("/meals", mealHandler.ListForDay)
		api.DELETE("/meals/:id", mealHandler.Delete)

		api.GET("/themes", themeHandler.List)

		api.GET("/history", historyHandler.Get)
	}

	log.Printf("macrolens-backend listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
