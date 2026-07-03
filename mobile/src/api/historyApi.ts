import { apiRequest } from "./client";

export type DayTotal = {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals_logged: number;
};

export type Streak = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_logged_date?: string;
};

export type History = {
  days: DayTotal[];
  streak: Streak;
};

// days defaults to 28 on the backend (enough for the 7-day charts plus the
// 4-week logged-days grid).
export function getHistory(days = 28) {
  return apiRequest<History>(`/history?days=${days}`);
}
