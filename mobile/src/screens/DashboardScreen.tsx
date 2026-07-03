import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import Icon from "../components/Icon";
import Confetti from "../components/Confetti";
import SavedToast from "../components/SavedToast";
import { useTheme } from "../theme/ThemeContext";
import { FONT_DISPLAY, bodyFont } from "../theme/typography";
import { MACRO_COLORS } from "../theme/themes";
import { useProgress, fmt } from "../hooks/useProgress";
import { useMealLog, type LoggedMeal } from "../context/MealLogContext";
import { getProfile } from "../api/profileApi";
import { getHistory } from "../api/historyApi";
import Ring from "../components/Ring";
import type { RootStackParamList } from "../navigation/AppNavigator";

const RING_SIZE = 218;

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { meals, targets, celebrate, saved, refreshMeals, refreshTargets } = useMealLog();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const p = useProgress(true, 1150);
  const [displayName, setDisplayName] = useState("");
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshMeals().catch(() => {});
      refreshTargets().catch(() => {});
      getProfile()
        .then((profile) => setDisplayName(profile.display_name))
        .catch(() => {});
      getHistory(1)
        .then((h) => setStreak(h.streak.current_streak))
        .catch(() => {});
    }, []),
  );

  const consumed = meals.reduce(
    (acc, m) => ({ cal: acc.cal + m.cal, protein: acc.protein + m.p, carbs: acc.carbs + m.c, fat: acc.fat + m.f }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const remain = Math.max(0, targets.cal - consumed.cal);
  const over = consumed.cal > targets.cal;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greeting, { color: theme.muted, fontFamily: bodyFont(600) }]}>
            {timeOfDayGreeting()}{displayName ? `, ${displayName}` : ""}
          </Text>
          <Text style={[styles.today, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Today</Text>
        </View>
        <View style={[styles.streakPill, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Icon name="flame" size={17} color={theme.accent} fill={theme.accent} />
          <Text style={[styles.streakNum, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{streak}</Text>
          <Text style={[styles.streakLabel, { color: theme.muted, fontFamily: bodyFont(600) }]}>days</Text>
        </View>
      </View>

      {/* hero ring card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: theme.surface, borderColor: theme.line },
          !theme.isDark && styles.heroCardShadow,
        ]}
      >
        {celebrate && <Confetti colors={[theme.accent, MACRO_COLORS.protein, MACRO_COLORS.carbs, MACRO_COLORS.fat]} />}
        <View style={styles.ringWrap}>
          <Ring size={RING_SIZE} stroke={16} pct={p * (consumed.cal / targets.cal)} color={theme.accent} track={theme.surface2} />
          <View style={styles.innerRing}>
            <Ring
              size={RING_SIZE - 42}
              stroke={11}
              pct={p * (consumed.protein / targets.protein)}
              color={MACRO_COLORS.protein}
              track={theme.surface2}
            />
          </View>
          <View style={styles.ringCenter}>
            <Text style={[styles.ringLabel, { color: theme.muted, fontFamily: bodyFont(700) }]}>
              {over ? "OVER BY" : "REMAINING"}
            </Text>
            <Text style={[styles.ringNumber, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>
              {fmt(p * (over ? consumed.cal - targets.cal : remain))}
            </Text>
            <Text style={[styles.ringSub, { color: theme.muted, fontFamily: bodyFont(600) }]}>
              of {targets.cal.toLocaleString()} kcal
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { borderTopColor: theme.line }]}>
          <StatPill value={fmt(p * consumed.protein)} label="Protein" color={MACRO_COLORS.protein} theme={theme} />
          <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
          <StatPill value={fmt(p * consumed.carbs)} label="Carbs" color={MACRO_COLORS.carbs} theme={theme} />
          <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
          <StatPill value={fmt(p * consumed.fat)} label="Fat" color={MACRO_COLORS.fat} theme={theme} />
        </View>
      </View>

      {/* today's meals */}
      <View style={styles.mealsHeader}>
        <Text style={[styles.mealsTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Today's meals</Text>
        <Text style={[styles.mealsTotal, { color: theme.accent, fontFamily: bodyFont(700) }]}>{fmt(consumed.cal)} kcal</Text>
      </View>
      <View style={{ gap: 10 }}>
        {meals.map((m) => (
          <MealRow key={m.id} meal={m} theme={theme} />
        ))}
        <Pressable style={[styles.addMeal, { borderColor: theme.line }]} onPress={() => navigation.navigate("Capture")}>
          <Icon name="plus" size={18} color={theme.muted} />
          <Text style={[styles.addMealText, { color: theme.muted, fontFamily: bodyFont(700) }]}>Add another meal</Text>
        </Pressable>
      </View>
    </ScrollView>
    {saved && <SavedToast theme={theme} />}
    </View>
  );
}

function StatPill({ value, label, color, theme }: { value: string; label: string; color: string; theme: ReturnType<typeof useTheme>["theme"] }) {
  return (
    <View style={styles.statPill}>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{value}</Text>
        <Text style={[styles.statUnit, { color: theme.muted, fontFamily: bodyFont(600) }]}>g</Text>
      </View>
      <View style={styles.statLabelRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.statLabel, { color: theme.muted, fontFamily: bodyFont(600) }]}>{label}</Text>
      </View>
    </View>
  );
}

function MealRow({ meal, theme }: { meal: LoggedMeal; theme: ReturnType<typeof useTheme>["theme"] }) {
  const slide = useRef(new Animated.Value(meal.fresh ? 0 : 1)).current;

  useEffect(() => {
    if (meal.fresh) {
      Animated.timing(slide, { toValue: 1, duration: 460, useNativeDriver: true }).start();
    }
  }, []);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View
      style={[
        styles.mealRow,
        { backgroundColor: theme.surface, borderColor: theme.line, opacity: slide, transform: [{ translateY }] },
      ]}
    >
      <LinearGradient
        colors={[`hsl(${meal.hue}, 62%, 62%)`, `hsl(${meal.hue + 28}, 66%, 52%)`]}
        style={styles.mealThumb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="flame" size={20} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.9)" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={[styles.mealName, { color: theme.ink, fontFamily: bodyFont(700) }]} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={[styles.mealMeta, { color: theme.muted, fontFamily: bodyFont(500) }]}>
          {meal.time} · {meal.p}p · {meal.c}c · {meal.f}f
        </Text>
      </View>
      <Text style={[styles.mealCal, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{meal.cal}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  greetingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  greeting: { fontSize: 14, fontWeight: "600" },
  today: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  streakNum: { fontSize: 15, fontWeight: "700" },
  streakLabel: { fontSize: 12, fontWeight: "600" },
  heroCard: { position: "relative", borderRadius: 30, paddingTop: 26, paddingHorizontal: 22, paddingBottom: 22, borderWidth: 1, overflow: "hidden" },
  heroCardShadow: {
    shadowColor: "rgba(60,40,20,0.4)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 4,
  },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignSelf: "center", position: "relative" },
  innerRing: { position: "absolute", top: 21, left: 21 },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  ringNumber: { fontSize: 52, fontWeight: "700", letterSpacing: -1, marginTop: 2 },
  ringSub: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 6, marginTop: 20, paddingTop: 18, borderTopWidth: 1 },
  statPill: { flex: 1, alignItems: "center", gap: 2 },
  statValueRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  statValue: { fontSize: 21, fontWeight: "700", letterSpacing: -0.4 },
  statUnit: { fontSize: 11, fontWeight: "600" },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statLabel: { fontSize: 11, fontWeight: "600" },
  statDivider: { width: 1 },
  mealsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 26, marginBottom: 12, marginHorizontal: 2 },
  mealsTitle: { fontSize: 18, fontWeight: "700" },
  mealsTotal: { fontSize: 13, fontWeight: "700" },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 18, padding: 11, borderWidth: 1 },
  mealThumb: { width: 50, height: 50, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  mealName: { fontSize: 15, fontWeight: "700" },
  mealMeta: { fontSize: 12.5, fontWeight: "500", marginTop: 2 },
  mealCal: { fontSize: 17, fontWeight: "700" },
  addMeal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addMealText: { fontSize: 14, fontWeight: "700" },
});
