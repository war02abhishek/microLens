package goals

import "macrolens-backend/internal/model"

// activityMultipliers scale BMR to TDEE (Mifflin-St Jeor).
var activityMultipliers = map[model.ActivityLevel]float64{
	model.ActivitySedentary:  1.2,
	model.ActivityLight:      1.375,
	model.ActivityModerate:   1.55,
	model.ActivityActive:     1.725,
	model.ActivityVeryActive: 1.9,
}

// goalCalorieAdjustment is the daily surplus/deficit applied to TDEE.
var goalCalorieAdjustment = map[model.Goal]int{
	model.GoalLoseFat:     -500,
	model.GoalMaintain:    0,
	model.GoalBuildMuscle: 300,
}

// Compute derives daily calorie and macro targets from body stats,
// activity level, and goal. Mirrors PRD §3.2 — result should always be
// shown with its derivation and remain user-editable.
func Compute(p model.Profile) model.Goals {
	bmr := mifflinStJeor(p)
	multiplier := activityMultipliers[p.ActivityLevel]
	if multiplier == 0 {
		multiplier = activityMultipliers[model.ActivitySedentary]
	}
	tdee := bmr * multiplier

	adjustment := goalCalorieAdjustment[p.Goal]
	calories := int(tdee) + adjustment
	if calories < 1200 {
		calories = 1200 // floor to avoid unsafe targets
	}

	proteinG, carbsG, fatG := macroSplit(calories, p.Goal, p.WeightKG)

	return model.Goals{
		UserID:   p.UserID,
		Calories: calories,
		ProteinG: proteinG,
		CarbsG:   carbsG,
		FatG:     fatG,
	}
}

func mifflinStJeor(p model.Profile) float64 {
	base := 10*p.WeightKG + 6.25*p.HeightCM - 5*float64(p.Age)
	if p.Sex == model.SexMale {
		return base + 5
	}
	return base - 161
}

// macroSplit allocates protein by bodyweight (goal-dependent g/kg), then
// splits remaining calories between carbs and fat.
func macroSplit(calories int, goal model.Goal, weightKG float64) (proteinG, carbsG, fatG int) {
	proteinPerKG := 1.8
	if goal == model.GoalBuildMuscle {
		proteinPerKG = 2.2
	}
	proteinG = int(proteinPerKG * weightKG)
	proteinCalories := proteinG * 4

	fatCalories := int(float64(calories) * 0.25)
	fatG = fatCalories / 9

	remaining := calories - proteinCalories - fatCalories
	if remaining < 0 {
		remaining = 0
	}
	carbsG = remaining / 4

	return proteinG, carbsG, fatG
}
