// Display font (headings, numbers): Bricolage Grotesque 700.
// Body font (labels, UI, copy): Figtree 500-800.
// Loaded via @expo-google-fonts/* in App.tsx before first render.
export const FONT_DISPLAY = "BricolageGrotesque_700Bold";
export const FONT_BODY_MEDIUM = "Figtree_500Medium";
export const FONT_BODY_SEMIBOLD = "Figtree_600SemiBold";
export const FONT_BODY_BOLD = "Figtree_700Bold";
export const FONT_BODY_EXTRABOLD = "Figtree_800ExtraBold";

// The design spec expresses body text as "Figtree, weight N" — since each
// weight is a separate loaded font file (not a variable font), map the
// numeric weight to the right family here instead of at every call site.
export function bodyFont(weight: 500 | 600 | 700 | 800 = 600): string {
  switch (weight) {
    case 500:
      return FONT_BODY_MEDIUM;
    case 700:
      return FONT_BODY_BOLD;
    case 800:
      return FONT_BODY_EXTRABOLD;
    case 600:
    default:
      return FONT_BODY_SEMIBOLD;
  }
}
