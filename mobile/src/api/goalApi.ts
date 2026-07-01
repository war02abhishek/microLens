import { apiRequest } from "./client";

export type Goals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  overridden: boolean;
};

export function getGoals() {
  return apiRequest<Goals>("/goals");
}

export function recalculateGoals() {
  return apiRequest<Goals>("/goals/recalculate", { method: "POST" });
}

export function overrideGoals(goals: Partial<Goals>) {
  return apiRequest<Goals>("/goals", { method: "PUT", body: goals });
}
