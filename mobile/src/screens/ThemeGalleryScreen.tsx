import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import Icon from "../components/Icon";
import Ring from "../components/Ring";
import { useTheme } from "../theme/ThemeContext";
import { bodyFont, FONT_DISPLAY } from "../theme/typography";
import { ACCENTS, THEMES, type ThemeKey } from "../theme/themes";

export default function ThemeGalleryScreen() {
  const { theme, themeKey, setThemeKey, setAccent } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: theme.muted, fontFamily: bodyFont(600) }]}>Make it yours</Text>
        <Text style={[styles.title, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Personalize</Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Theme</Text>
      <View style={styles.grid}>
        {(Object.entries(THEMES) as [ThemeKey, (typeof THEMES)[ThemeKey]][]).map(([k, th]) => {
          const active = k === themeKey;
          return (
            <Pressable
              key={k}
              onPress={() => setThemeKey(k)}
              style={[styles.card, { backgroundColor: th.bg, borderColor: active ? theme.accent : theme.line }]}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.swatch, { backgroundColor: th.accent }]} />
                <View style={{ gap: 4 }}>
                  <View style={[styles.typeBar, { backgroundColor: th.ink, opacity: 0.85, width: 44 }]} />
                  <View style={[styles.typeBar, { backgroundColor: th.muted, width: 30, height: 5 }]} />
                </View>
              </View>
              <View style={styles.cardBottomRow}>
                <Text style={[styles.cardName, { color: th.ink, fontFamily: FONT_DISPLAY }]}>{th.name}</Text>
                {active && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.accent }]}>
                    <Icon name="check" size={13} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: theme.ink, fontFamily: FONT_DISPLAY, marginTop: 26 }]}>Accent color</Text>
      <View style={[styles.accentCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.accentRow}>
          {ACCENTS.map((c) => {
            const active = theme.accent === c;
            return (
              <Pressable
                key={c}
                onPress={() => setAccent(c)}
                style={[styles.accentSwatch, { backgroundColor: c, borderColor: active ? theme.ink : "transparent" }]}
              >
                {active && <Icon name="check" size={16} color="#fff" strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.previewRow, { borderTopColor: theme.line }]}>
          <View style={styles.previewRing}>
            <Ring size={54} stroke={7} pct={0.68} color={theme.accent} track={theme.surface2} />
            <View style={styles.previewRingCenter}>
              <Text style={[styles.previewPct, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>68%</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: theme.ink, fontFamily: bodyFont(700) }]}>Live preview</Text>
            <Text style={[styles.previewSub, { color: theme.muted, fontFamily: bodyFont(500) }]}>
              Applied instantly across rings, buttons &amp; highlights.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  header: { marginBottom: 18 },
  eyebrow: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  sectionLabel: { fontSize: 14, fontWeight: "700", marginBottom: 12, marginHorizontal: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", borderRadius: 20, borderWidth: 2, padding: 14, overflow: "hidden" },
  cardTopRow: { flexDirection: "row", gap: 7, marginBottom: 12 },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  typeBar: { height: 6, borderRadius: 6 },
  cardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: 14, fontWeight: "700" },
  checkBadge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  accentCard: { borderRadius: 22, padding: 18, borderWidth: 1 },
  accentRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "space-between" },
  accentSwatch: { width: 42, height: 42, borderRadius: 21, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, paddingTop: 16, borderTopWidth: 1 },
  previewRing: { width: 54, height: 54 },
  previewRingCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  previewPct: { fontSize: 13, fontWeight: "700" },
  previewTitle: { fontSize: 13, fontWeight: "700" },
  previewSub: { fontSize: 12, marginTop: 2 },
});
