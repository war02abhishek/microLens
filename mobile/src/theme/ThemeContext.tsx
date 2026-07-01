import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { themes, defaultThemeId, type ThemeColors } from "./themes";

type ThemeContextValue = {
  themeId: string;
  colors: ThemeColors;
  accentColor: string;
  setThemeId: (id: string) => void;
  setAccentColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// PRD §3.4: themes apply instantly with a smooth transition. This context
// is the seam a cross-fade animation would hook into once designs land.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(defaultThemeId);
  const [accentColor, setAccentColor] = useState(themes[defaultThemeId].accent);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      colors: themes[themeId] ?? themes[defaultThemeId],
      accentColor,
      setThemeId,
      setAccentColor,
    }),
    [themeId, accentColor],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
