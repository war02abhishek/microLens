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
const REFRESH_TOKEN_KEY = "macrolens.refreshToken";

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

// Stores both tokens from a signup/login/refresh response in one call so
// callers never have the access token set without its matching refresh
// token (or vice versa).
export async function setTokens(accessToken: string | null, refreshToken: string | null): Promise<void> {
  await setAuthToken(accessToken);
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

// Concurrent 401s during the same expiry should trigger exactly one
// refresh call — later callers await the in-flight promise instead of
// each racing their own POST /auth/refresh.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) {
          await setTokens(null, null);
          return null;
        }
        const data = (await response.json()) as { access_token: string; refresh_token: string };
        await setTokens(data.access_token, data.refresh_token);
        return data.access_token;
      } catch {
        return null;
      }
    })();
  }
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function doFetch(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAuthToken();
  let response = await doFetch(path, options, token);

  if (response.status === 401 && token && path !== "/auth/refresh") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(path, options, newToken);
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}
