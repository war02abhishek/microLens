// Local fallback themes — mirrors the seed data in
// backend/migrations/0001_init.sql so the app has something to render
// before the themes endpoint is wired up. Real theme definitions (colors,
// gradients, typography) come from the design handoff.
export type ThemeColors = {
  background: string;
  accent: string;
  text: string;
};

export const themes: Record<string, ThemeColors> = {
  "light-default": { background: "#FFFFFF", accent: "#22C55E", text: "#111111" },
  "dark-default": { background: "#0B0B0F", accent: "#22D3EE", text: "#F5F5F5" },
};

export const defaultThemeId = "light-default";
