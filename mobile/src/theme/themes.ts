// Design tokens from the MacroLens design handoff (2026-07). 5 curated
// themes + a custom accent override. accent drives the calorie ring,
// primary buttons, active tabs, highlights and selection states.
export type ThemeTokens = {
  name: string;
  isDark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
};

export type ThemeKey = "sunrise" | "midnight" | "forest" | "grape" | "ocean";

export const THEMES: Record<ThemeKey, ThemeTokens> = {
  sunrise: {
    name: "Sunrise",
    isDark: false,
    bg: "#f6f1ea",
    surface: "#fffdf9",
    surface2: "#f0e8dd",
    ink: "#241d16",
    muted: "#9a8f80",
    line: "rgba(0,0,0,0.07)",
    accent: "#e8724c",
  },
  midnight: {
    name: "Midnight",
    isDark: true,
    bg: "#141110",
    surface: "#1f1b18",
    surface2: "#282320",
    ink: "#f5efe8",
    muted: "#9a8f83",
    line: "rgba(255,255,255,0.10)",
    accent: "#ff7a4d",
  },
  forest: {
    name: "Forest",
    isDark: true,
    bg: "#10140f",
    surface: "#191f17",
    surface2: "#212a1f",
    ink: "#eef3ea",
    muted: "#8fa088",
    line: "rgba(255,255,255,0.09)",
    accent: "#a6e64d",
  },
  grape: {
    name: "Grape",
    isDark: false,
    bg: "#f4f1f9",
    surface: "#fffdff",
    surface2: "#ebe4f6",
    ink: "#241a2e",
    muted: "#94899e",
    line: "rgba(0,0,0,0.06)",
    accent: "#8b5cf6",
  },
  ocean: {
    name: "Ocean",
    isDark: false,
    bg: "#edf3f7",
    surface: "#ffffff",
    surface2: "#e0eaf1",
    ink: "#10222e",
    muted: "#7f8f9a",
    line: "rgba(0,0,0,0.06)",
    accent: "#2f80ed",
  },
};

export const defaultThemeKey: ThemeKey = "sunrise";

// Selectable accent swatches (override the current theme's accent).
export const ACCENTS = [
  "#e8724c",
  "#ff5a5f",
  "#f0a93a",
  "#34b9a0",
  "#2f80ed",
  "#8b5cf6",
  "#e05a8a",
  "#111111",
];

// Constant across all themes.
export const MACRO_COLORS = {
  protein: "#e05a8a",
  carbs: "#f0a93a",
  fat: "#34b9a0",
};

export const CONFIDENCE = {
  high: { label: "High", color: "#34b9a0" },
  med: { label: "Review", color: "#f0a93a" },
  low: { label: "Check", color: "#ff5a5f" },
} as const;

export type ConfidenceLevel = keyof typeof CONFIDENCE;
