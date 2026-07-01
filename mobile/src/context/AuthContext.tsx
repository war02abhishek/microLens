import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { setAuthToken } from "../api/client";

type AuthContextValue = {
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Stub — swap for Supabase Auth session handling (or a custom JWT flow)
// once the backend's /auth endpoints are implemented.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      signIn: async (token: string) => {
        await setAuthToken(token);
        setIsAuthenticated(true);
      },
      signOut: async () => {
        await setAuthToken(null);
        setIsAuthenticated(false);
      },
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
