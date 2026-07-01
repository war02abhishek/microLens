package model

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type ActivityLevel string

const (
	ActivitySedentary  ActivityLevel = "sedentary"
	ActivityLight      ActivityLevel = "light"
	ActivityModerate   ActivityLevel = "moderate"
	ActivityActive     ActivityLevel = "active"
	ActivityVeryActive ActivityLevel = "very_active"
)

type Goal string

const (
	GoalLoseFat     Goal = "lose_fat"
	GoalMaintain    Goal = "maintain"
	GoalBuildMuscle Goal = "build_muscle"
)

type Sex string

const (
	SexMale   Sex = "male"
	SexFemale Sex = "female"
)

// Profile holds the inputs collected during onboarding.
type Profile struct {
	UserID         string        `json:"user_id"`
	DisplayName    string        `json:"display_name"`
	AvatarURL      string        `json:"avatar_url,omitempty"`
	Age            int           `json:"age"`
	Sex            Sex           `json:"sex"`
	HeightCM       float64       `json:"height_cm"`
	WeightKG       float64       `json:"weight_kg"`
	ActivityLevel  ActivityLevel `json:"activity_level"`
	Goal           Goal          `json:"goal"`
	TargetWeightKG *float64      `json:"target_weight_kg,omitempty"`
	PaceKGPerWeek  *float64      `json:"pace_kg_per_week,omitempty"`
	DietaryPref    string        `json:"dietary_pref,omitempty"`
	ThemeID        string        `json:"theme_id"`
	AccentColor    string        `json:"accent_color"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

// Goals are the computed (or user-overridden) daily targets.
type Goals struct {
	UserID     string    `json:"user_id"`
	Calories   int       `json:"calories"`
	ProteinG   int       `json:"protein_g"`
	CarbsG     int       `json:"carbs_g"`
	FatG       int       `json:"fat_g"`
	Overridden bool      `json:"overridden"`
	ComputedAt time.Time `json:"computed_at"`
}

type MealSource string

const (
	MealSourcePhoto MealSource = "photo"
	MealSourceText  MealSource = "text"
)

type Meal struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	Source     MealSource `json:"source"`
	PhotoURL   *string    `json:"photo_url,omitempty"`
	RawInput   string     `json:"raw_input,omitempty"`
	Confidence float64    `json:"confidence"`
	LoggedAt   time.Time  `json:"logged_at"`
	Items      []MealItem `json:"items,omitempty"`
}

type MealItem struct {
	ID            string  `json:"id"`
	MealID        string  `json:"meal_id"`
	FoodName      string  `json:"food_name"`
	QuantityValue float64 `json:"quantity_value"`
	QuantityUnit  string  `json:"quantity_unit"`
	Calories      float64 `json:"calories"`
	ProteinG      float64 `json:"protein_g"`
	CarbsG        float64 `json:"carbs_g"`
	FatG          float64 `json:"fat_g"`
	MatchedFoodID *string `json:"matched_food_id,omitempty"`
}

type Theme struct {
	ID     string            `json:"id"`
	Name   string            `json:"name"`
	Colors map[string]string `json:"colors"`
}

type Streak struct {
	UserID         string     `json:"user_id"`
	CurrentStreak  int        `json:"current_streak"`
	LongestStreak  int        `json:"longest_streak"`
	LastLoggedDate *time.Time `json:"last_logged_date,omitempty"`
}
