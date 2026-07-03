import { apiRequest } from "./client";

export type MealItemDraft = {
  food_name: string;
  quantity_value: number;
  quantity_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
};

export type MealDraft = {
  source: "photo" | "text";
  raw_input?: string;
  items: MealItemDraft[];
};

export type MealItem = {
  id: string;
  meal_id: string;
  food_name: string;
  quantity_value: number;
  quantity_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  matched_food_id?: string;
};

export type Meal = {
  id: string;
  user_id: string;
  source: "photo" | "text";
  photo_url?: string;
  raw_input?: string;
  confidence: number;
  logged_at: string;
  items: MealItem[];
};

// Runs the real backend pipeline: OpenAI identifies foods/portions and
// estimates macros directly (backend/internal/ai).
export function analyzeText(description: string) {
  return apiRequest<MealDraft>("/meals/analyze/text", {
    method: "POST",
    body: { description },
  });
}

// imageBase64 must be a full data URL (e.g. "data:image/jpeg;base64,...").
export function analyzePhoto(imageBase64: string) {
  return apiRequest<MealDraft>("/meals/analyze/photo", {
    method: "POST",
    body: { image_base64: imageBase64 },
  });
}

export function createMeal(meal: MealDraft) {
  return apiRequest<Meal>("/meals", { method: "POST", body: meal });
}

export function listMealsForDay(date: string) {
  return apiRequest<Meal[] | null>(`/meals?date=${date}`);
}

export function deleteMeal(id: string) {
  return apiRequest<void>(`/meals/${id}`, { method: "DELETE" });
}
