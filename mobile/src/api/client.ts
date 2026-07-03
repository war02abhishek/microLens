import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Per dev-playbook: never hardcode 10.0.2.2 blindly — but do use it as the
// *dev-only* fallback for the Android emulator (its alias for the host
// machine's localhost), since `docker compose up` runs the backend on the
// host, not in the emulator. Once there's a real deployed backend, set
// EXPO_PUBLIC_API_URL (app config / eas.json) and it always wins over both
// dev fallbacks.
function resolveBaseURL(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (__DEV__) {
    return Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
  }
  return "https://your-backend.onrender.com";
}

const BASE_URL = resolveBaseURL();

const AUTH_TOKEN_KEY = "macrolens.authToken";

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}
