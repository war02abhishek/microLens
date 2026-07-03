import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { getAuthToken, setTokens } from "../api/client";
import { signup } from "../api/authApi";

const DEVICE_ID_KEY = "macrolens.deviceId";

type AuthContextValue = {
  isAuthenticated: boolean;
  signIn: (accessToken: string, refreshToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Every downloaded instance is a private, independent account (PRD
  // §2.1) — there's no signup/login UI yet, so on first launch we
  // provision one automatically using a random per-device email, and
  // reuse the stored token on every later launch.
  ensureDeviceAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const provisioning = useRef<Promise<void> | null>(null);

  useEffect(() => {
    getAuthToken().then((token) => {
      if (token) setIsAuthenticated(true);
    });
  }, []);

  const ensureDeviceAccount = async () => {
    if (isAuthenticated) return;
    if (provisioning.current) return provisioning.current;

    provisioning.current = (async () => {
      const existing = await getAuthToken();
      if (existing) {
        setIsAuthenticated(true);
        return;
      }

      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      const email = `device-${deviceId}@macrolens.local`;
      const password = deviceId; // random + device-local; never shown or reused as a real credential

      const auth = await signup(email, password);
      await setTokens(auth.access_token, auth.refresh_token);
      setIsAuthenticated(true);
    })();

    try {
      await provisioning.current;
    } finally {
      provisioning.current = null;
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      signIn: async (accessToken: string, refreshToken?: string) => {
        await setTokens(accessToken, refreshToken ?? null);
        setIsAuthenticated(true);
      },
      signOut: async () => {
        await setTokens(null, null);
        setIsAuthenticated(false);
      },
      ensureDeviceAccount,
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
