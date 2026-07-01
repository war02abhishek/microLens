package config

import "os"

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	OpenAIAPIKey     string
	NutritionAPIKey  string
	NutritionAPIBase string
}

func Load() Config {
	return Config{
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		JWTSecret:        os.Getenv("JWT_SECRET"),
		OpenAIAPIKey:     os.Getenv("OPENAI_API_KEY"),
		NutritionAPIKey:  os.Getenv("NUTRITION_API_KEY"),
		NutritionAPIBase: getEnv("NUTRITION_API_BASE", "https://api.nal.usda.gov/fdc/v1"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
