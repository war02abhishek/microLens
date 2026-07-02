import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { THEMES, defaultThemeKey, type ThemeKey, type ThemeTokens } from "./themes";

type ThemeContextValue = {
  themeKey: ThemeKey;
  theme: ThemeTokens;
  setThemeKey: (key: ThemeKey) => void;
  setAccent: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// PRD §3.4: themes apply instantly with a smooth cross-fade. Screens read
// `theme` (tokens + the current accent already merged in) and rely on RN's
// Animated/LayoutAnimation for the transition — see screens for usage.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(defaultThemeKey);
  const [accentOverride, setAccentOverride] = useState<string | null>(null);

  const setThemeKey = (key: ThemeKey) => {
    setThemeKeyState(key);
    setAccentOverride(null); // picking a theme resets to its default accent
  };

  const value = useMemo<ThemeContextValue>(() => {
    const base = THEMES[themeKey];
    return {
      themeKey,
      theme: { ...base, accent: accentOverride ?? base.accent },
      setThemeKey,
      setAccent: setAccentOverride,
    };
  }, [themeKey, accentOverride]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
