import { apiRequest } from "./client";

export type Profile = {
  display_name: string;
  avatar_url?: string;
  age: number;
  sex: "male" | "female";
  height_cm: number;
  weight_kg: number;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose_fat" | "maintain" | "build_muscle";
  target_weight_kg?: number;
  pace_kg_per_week?: number;
  dietary_pref?: string;
  theme_id: string;
  accent_color: string;
};

export function getProfile() {
  return apiRequest<Profile>("/profile");
}

export function upsertProfile(profile: Profile) {
  return apiRequest<Profile>("/profile", { method: "PUT", body: profile });
}
