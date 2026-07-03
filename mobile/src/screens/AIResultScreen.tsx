import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Icon from "../components/Icon";
import { useTheme } from "../theme/ThemeContext";
import { bodyFont, FONT_DISPLAY } from "../theme/typography";
import { CONFIDENCE, MACRO_COLORS, type ConfidenceLevel } from "../theme/themes";
import { fmt } from "../hooks/useProgress";
import { useMealLog } from "../context/MealLogContext";
import { analyzePhoto, analyzeText, createMeal, type MealItemDraft } from "../api/mealApi";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Item = {
  id: string;
  name: string;
  qty: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  conf: ConfidenceLevel;
};

function confidenceLevel(c: number): ConfidenceLevel {
  if (c >= 0.7) return "high";
  if (c >= 0.4) return "med";
  return "low";
}

function draftToItem(d: MealItemDraft, i: number): Item {
  return {
    id: String(i),
    name: d.food_name,
    qty: `${d.quantity_value} ${d.quantity_unit}`,
    cal: Math.round(d.calories),
    p: Math.round(d.protein_g),
    c: Math.round(d.carbs_g),
    f: Math.round(d.fat_g),
    conf: confidenceLevel(d.confidence),
  };
}

type AIResultRoute = RouteProp<RootStackParamList, "AIResult">;
type Phase = "scan" | "result" | "error";

export default function AIResultScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AIResultRoute>();
  const { addMeal } = useMealLog();
  const [phase, setPhase] = useState<Phase>("scan");
  const [items, setItems] = useState<Item[]>([]);
  const [mealName, setMealName] = useState("Logged meal");
  const [error, setError] = useState<string | null>(null);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<"photo" | "text">("text");

  useEffect(() => {
    const { mode, description, imageBase64 } = route.params ?? { mode: "text" as const };
    setSource(mode);

    let request: Promise<{ items: MealItemDraft[] }>;
    if (mode === "photo") {
      if (!imageBase64) {
        setError("No photo was captured. Go back and try again.");
        setPhase("error");
        return;
      }
      request = analyzePhoto(imageBase64);
    } else {
      if (!description || !description.trim()) {
        setError("Type a description first.");
        setPhase("error");
        return;
      }
      request = analyzeText(description);
    }

    let cancelled = false;
    request
      .then((draft) => {
        if (cancelled) return;
        setItems(draft.items.map(draftToItem));
        setMealName(draft.items[0]?.food_name ?? "Logged meal");
        setPhase("result");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "AI request failed");
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = items.reduce(
    (acc, it) => ({ cal: acc.cal + it.cal, p: acc.p + it.p, c: acc.c + it.c, f: acc.f + it.f }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  const bump = (id: string, delta: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, cal: Math.max(0, it.cal + delta) } : it)));
  };

  const onSave = async () => {
    setSaving(true);
    setSavingError(null);
    try {
      const draftItems: MealItemDraft[] = items.map((it) => ({
        food_name: it.name,
        quantity_value: parseFloat(it.qty) || 0,
        quantity_unit: it.qty.split(" ")[1] ?? "g",
        calories: it.cal,
        protein_g: it.p,
        carbs_g: it.c,
        fat_g: it.f,
        confidence: it.conf === "high" ? 0.9 : it.conf === "med" ? 0.5 : 0.2,
      }));
      await createMeal({ source, items: draftItems });
      addMeal(mealName, totals);
      // Capture + AIResult are both pushed on the root stack above Tabs —
      // popToTop dismisses both and lands back on the dashboard.
      navigation.popToTop();
    } catch (e) {
      setSavingError(e instanceof Error ? e.message : "Failed to save meal");
    } finally {
      setSaving(false);
    }
  };

  if (phase === "scan") {
    return <ScanningState theme={theme} />;
  }

  if (phase === "error") {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.bg }]}>
        <Icon name="x" size={32} color="#ff5a5f" />
        <Text style={[styles.errorTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Couldn't analyze that meal</Text>
        <Text style={[styles.errorMessage, { color: theme.muted, fontFamily: bodyFont(500) }]}>{error}</Text>
        <Pressable style={[styles.errorBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.errorBtnText, { fontFamily: bodyFont(700) }]}>Back to capture</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.topBar}>
        <Pressable style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => navigation.goBack()}>
          <Icon name="chevL" size={20} color={theme.ink} />
        </Pressable>
        <View style={[styles.aiPill, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Icon name="sparkle" size={14} color={theme.accent} fill={theme.accent} />
          <Text style={[styles.aiPillText, { color: theme.accent, fontFamily: bodyFont(700) }]}>AI estimate · editable</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* hero total */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroThumb} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]} numberOfLines={1}>
                {mealName}
              </Text>
              <Text style={[styles.heroSub, { color: theme.muted, fontFamily: bodyFont(600) }]}>{items.length} items detected</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.heroCal, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{fmt(totals.cal)}</Text>
              <Text style={[styles.heroCalUnit, { color: theme.muted, fontFamily: bodyFont(700) }]}>kcal</Text>
            </View>
          </View>
          <View style={styles.macroTilesRow}>
            {(
              [
                ["Protein", totals.p, MACRO_COLORS.protein],
                ["Carbs", totals.c, MACRO_COLORS.carbs],
                ["Fat", totals.f, MACRO_COLORS.fat],
              ] as const
            ).map(([label, value, color]) => (
              <View key={label} style={[styles.macroTile, { backgroundColor: theme.surface2 }]}>
                <Text style={[styles.macroTileValue, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>
                  {fmt(value)}
                  <Text style={{ fontSize: 11, color: theme.muted }}>g</Text>
                </Text>
                <View style={styles.macroTileLabelRow}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[styles.macroTileLabel, { color: theme.muted, fontFamily: bodyFont(600) }]}>{label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ingredientsHeader}>
          <Text style={[styles.ingredientsTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Ingredients</Text>
          <Text style={[styles.tapToAdjust, { color: theme.muted, fontFamily: bodyFont(600) }]}>Tap to adjust</Text>
        </View>

        <View style={{ gap: 10 }}>
          {items.map((it) => {
            const cf = CONFIDENCE[it.conf];
            return (
              <View key={it.id} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.itemNameRow}>
                    <Text style={[styles.itemName, { color: theme.ink, fontFamily: bodyFont(700) }]}>{it.name}</Text>
                    {it.conf !== "high" && (
                      <View style={[styles.confBadge, { backgroundColor: `${cf.color}1e` }]}>
                        <Text style={[styles.confBadgeText, { color: cf.color, fontFamily: bodyFont(700) }]}>{cf.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.itemMeta, { color: theme.muted, fontFamily: bodyFont(600) }]}>
                    {it.qty} · {it.cal} kcal · {it.p}p {it.c}c {it.f}f
                  </Text>
                </View>
                <View style={styles.stepperRow}>
                  <Pressable style={[styles.stepBtn, { borderColor: theme.line, backgroundColor: theme.surface2 }]} onPress={() => bump(it.id, -10)}>
                    <Text style={[styles.stepBtnText, { color: theme.ink }]}>−</Text>
                  </Pressable>
                  <Pressable style={[styles.stepBtn, { borderColor: theme.line, backgroundColor: theme.surface2 }]} onPress={() => bump(it.id, 10)}>
                    <Text style={[styles.stepBtnText, { color: theme.ink }]}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.confHint, { backgroundColor: `${theme.accent}12` }]}>
          <Icon name="sparkle" size={16} color={theme.accent} />
          <Text style={[styles.confHintText, { color: theme.muted, fontFamily: bodyFont(600) }]}>
            Flagged items are lower-confidence. Adjust before saving.
          </Text>
        </View>
        {savingError && (
          <Text style={[styles.errorMessage, { color: "#ff5a5f", marginTop: 12 }]}>{savingError}</Text>
        )}
      </ScrollView>

      <View style={[styles.saveBar, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
        <Pressable
          style={[styles.saveBtn, { backgroundColor: theme.accent }, saving && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="check" size={20} color="#fff" strokeWidth={2.6} />
              <Text style={[styles.saveBtnText, { fontFamily: FONT_DISPLAY }]}>Log this meal · {fmt(totals.cal)} kcal</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ScanningState({ theme }: { theme: ReturnType<typeof useTheme>["theme"] }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const bounce = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const pulse = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    sweepLoop.start();

    const bounceLoops = bounce.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ),
    );
    bounceLoops.forEach((l) => l.start());

    const pulseLoops = pulse.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 250),
          Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
      ),
    );
    pulseLoops.forEach((l) => l.start());

    return () => {
      sweepLoop.stop();
      bounceLoops.forEach((l) => l.stop());
      pulseLoops.forEach((l) => l.stop());
    };
  }, []);

  const sweepTranslate = sweep.interpolate({ inputRange: [0, 1], outputRange: [-60, 230] });

  return (
    <View style={scanStyles.container}>
      <View style={scanStyles.tile}>
        <Animated.View
          style={[
            scanStyles.sweepBar,
            { backgroundColor: theme.accent, transform: [{ translateY: sweepTranslate }] },
          ]}
        />
        {[
          [38, 30],
          [66, 52],
          [30, 62],
        ].map(([x, y], i) => {
          const scale = pulse[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] });
          const opacity = pulse[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
          return (
            <Animated.View
              key={i}
              style={[
                scanStyles.pulseDot,
                { left: `${x}%`, top: `${y}%`, opacity, transform: [{ scale }] },
              ]}
            />
          );
        })}
      </View>
      <View style={scanStyles.bounceRow}>
        {bounce.map((v, i) => {
          const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
          const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
          return (
            <Animated.View
              key={i}
              style={[scanStyles.bounceDot, { backgroundColor: theme.accent, opacity, transform: [{ translateY }] }]}
            />
          );
        })}
      </View>
      <Text style={[scanStyles.title, { fontFamily: FONT_DISPLAY }]}>Reading your plate…</Text>
      <Text style={[scanStyles.sub, { fontFamily: bodyFont(600) }]}>Identifying foods &amp; estimating portions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  errorTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  errorMessage: { fontSize: 14, fontWeight: "500", textAlign: "center", lineHeight: 20 },
  errorBtn: { marginTop: 12, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  errorBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  aiPill: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 13 },
  aiPillText: { fontSize: 12.5, fontWeight: "700" },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  heroCard: { borderRadius: 26, padding: 20, borderWidth: 1, marginBottom: 16 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  heroThumb: { width: 62, height: 62, borderRadius: 16, backgroundColor: "#4a3a2c" },
  heroTitle: { fontSize: 19, fontWeight: "700" },
  heroSub: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  heroCal: { fontSize: 30, fontWeight: "700", lineHeight: 32 },
  heroCalUnit: { fontSize: 11, fontWeight: "700" },
  macroTilesRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  macroTile: { flex: 1, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center" },
  macroTileValue: { fontSize: 17, fontWeight: "700" },
  macroTileLabelRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  macroTileLabel: { fontSize: 11, fontWeight: "600" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ingredientsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 2, marginBottom: 10 },
  ingredientsTitle: { fontSize: 15, fontWeight: "700" },
  tapToAdjust: { fontSize: 12.5, fontWeight: "600" },
  itemCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14, borderWidth: 1 },
  itemNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemName: { fontSize: 14.5, fontWeight: "700" },
  confBadge: { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 },
  confBadgeText: { fontSize: 10.5, fontWeight: "700" },
  itemMeta: { fontSize: 12.5, fontWeight: "600", marginTop: 3 },
  stepperRow: { flexDirection: "row", gap: 6 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepBtnText: { fontSize: 18, fontWeight: "700", lineHeight: 18 },
  confHint: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 14, padding: 14, borderRadius: 14 },
  confHintText: { flex: 1, fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
  saveBar: { paddingTop: 14, paddingHorizontal: 20, paddingBottom: 30, borderTopWidth: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingVertical: 16, borderRadius: 18 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

const scanStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0a09", alignItems: "center", justifyContent: "center" },
  tile: {
    width: 230,
    height: 230,
    borderRadius: 28,
    backgroundColor: "#3a2c20",
    overflow: "hidden",
    position: "relative",
  },
  sweepBar: { position: "absolute", left: 0, right: 0, height: 60, opacity: 0.4 },
  pulseDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  bounceRow: { flexDirection: "row", gap: 7, marginTop: 34 },
  bounceDot: { width: 9, height: 9, borderRadius: 5 },
  title: { fontSize: 19, fontWeight: "700", color: "#fff", marginTop: 20 },
  sub: { fontSize: 13.5, color: "rgba(255,255,255,0.6)", marginTop: 6 },
});
