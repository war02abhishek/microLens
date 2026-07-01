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

export function analyzeText(description: string) {
  return apiRequest<MealDraft>("/meals/analyze/text", {
    method: "POST",
    body: { description },
  });
}

// Photo analysis is a multipart upload — implement once the capture
// screen's image format (uri vs base64) is decided during design/build.
export function analyzePhoto(_photoUri: string): Promise<MealDraft> {
  throw new Error("not implemented");
}

export function createMeal(meal: MealDraft) {
  return apiRequest<{ id: string }>("/meals", { method: "POST", body: meal });
}

export function listMealsForDay(date: string) {
  return apiRequest<MealDraft[]>(`/meals?date=${date}`);
}

export function deleteMeal(id: string) {
  return apiRequest<void>(`/meals/${id}`, { method: "DELETE" });
}
