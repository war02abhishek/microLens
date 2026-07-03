import { apiRequest } from "./client";

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user_id: string;
};

export function signup(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/signup", { method: "POST", body: { email, password } });
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
}
