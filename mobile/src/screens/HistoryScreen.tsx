import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import Icon from "../components/Icon";
import { useTheme } from "../theme/ThemeContext";
import { bodyFont, FONT_DISPLAY } from "../theme/typography";
import { MACRO_COLORS } from "../theme/themes";
import { useProgress, fmt } from "../hooks/useProgress";
import { useMealLog } from "../context/MealLogContext";
import { getHistory, type DayTotal, type Streak } from "../api/historyApi";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function weekdayLetter(dateStr: string): string {
  return WEEKDAY_LETTERS[new Date(`${dateStr}T00:00:00`).getDay()];
}

function chunkIntoWeeks(days: DayTotal[]): DayTotal[][] {
  const weeks: DayTotal[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export default function HistoryScreen() {
  const { theme } = useTheme();
  const { targets } = useMealLog();
  const p = useProgress(true, 900);
  const [days, setDays] = useState<DayTotal[] | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getHistory(28)
        .then((h) => {
          if (cancelled) return;
          setDays(h.days);
          setStreak(h.streak);
          setError(null);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to load history");
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <Icon name="x" size={28} color="#ff5a5f" />
        <Text style={[styles.errorText, { color: theme.muted, fontFamily: bodyFont(500) }]}>{error}</Text>
      </View>
    );
  }

  if (!days || !streak) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const week = days.slice(-7);
  const calories = week.map((d) => d.calories);
  const protein = week.map((d) => d.protein_g);
  const dayLabels = week.map((d) => weekdayLetter(d.date));
  const maxCal = Math.max(targets.cal * 1.3, ...calories, 1);
  const avgCal = Math.round(calories.reduce((a, b) => a + b, 0) / calories.length);
  const maxProtein = Math.max(targets.protein * 1.25, ...protein, 1);
  const weeks = chunkIntoWeeks(days);
  const recentLoggedDays = days.slice(-5).filter((d) => d.meals_logged > 0).length;

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: theme.muted, fontFamily: bodyFont(600) }]}>Your progress</Text>
        <Text style={[styles.title, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>History &amp; trends</Text>
      </View>

      {/* streak banner */}
      <View style={[styles.streakBanner, { backgroundColor: theme.accent }]}>
        <View style={styles.streakIcon}>
          <Icon name="flame" size={24} color="#fff" fill="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.streakTitle, { fontFamily: FONT_DISPLAY }]}>{streak.current_streak}-day streak</Text>
          <Text style={[styles.streakSub, { fontFamily: bodyFont(600) }]}>
            {streak.current_streak >= streak.longest_streak && streak.current_streak > 0
              ? "New record!"
              : `Best yet — ${Math.max(0, streak.longest_streak - streak.current_streak)} days to your record`}
          </Text>
        </View>
        <View style={styles.streakBars}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.streakBar, { height: 20 + i * 4, backgroundColor: i < recentLoggedDays ? "#fff" : "rgba(255,255,255,0.35)" }]}
            />
          ))}
        </View>
      </View>

      {/* weekly calories */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Calories · this week</Text>
          <Text style={[styles.cardMeta, { color: theme.muted, fontFamily: bodyFont(600) }]}>avg {fmt(avgCal)}</Text>
        </View>
        <View style={styles.barsRow}>
          {calories.map((v, i) => {
            const isToday = i === calories.length - 1;
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${p * (v / maxCal) * 100}%`,
                        backgroundColor: isToday ? theme.accent : theme.surface2,
                      },
                    ]}
                  >
                    {isToday && (
                      <Text style={[styles.barValue, { color: theme.accent, fontFamily: FONT_DISPLAY }]}>{Math.round(v)}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.barDay, { color: theme.muted, fontFamily: bodyFont(600) }]}>{dayLabels[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* protein trend */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Protein trend</Text>
        </View>
        <Sparkline vals={protein} color={MACRO_COLORS.protein} track={theme.muted} p={p} target={targets.protein} max={maxProtein} surface={theme.surface} />
      </View>

      {/* logged days grid */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={[styles.cardTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Logged days</Text>
        <View style={{ gap: 6, marginTop: 14 }}>
          {weeks.map((wk, wi) => (
            <View key={wi} style={{ flexDirection: "row", gap: 6 }}>
              {wk.map((d, di) => {
                const lvl = Math.min(3, d.meals_logged);
                return (
                  <View
                    key={di}
                    style={[
                      styles.dayCell,
                      { backgroundColor: lvl === 0 ? theme.surface2 : theme.accent, opacity: lvl === 0 ? 0.5 : 0.35 + lvl * 0.22 },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Sparkline({
  vals,
  color,
  track,
  p,
  target,
  max,
  surface,
}: {
  vals: number[];
  color: string;
  track: string;
  p: number;
  target: number;
  max: number;
  surface: string;
}) {
  const W = 320;
  const H = 84;
  const pad = 6;
  const step = (W - pad * 2) / (vals.length - 1);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const pts = vals.map((v, i) => [pad + i * step, y(v)] as const);
  const drawnCount = Math.max(2, Math.ceil(p * pts.length));
  const drawn = pts.slice(0, drawnCount);
  const line = drawn.map(([x, yy], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${yy.toFixed(1)}`).join(" ");
  const last = drawn[drawn.length - 1];
  const area = `${line} L${last[0].toFixed(1)} ${H - pad} L${pad} ${H - pad} Z`;

  return (
    <Svg width="100%" height={84} viewBox={`0 0 ${W} ${H}`}>
      <Line x1={pad} x2={W - pad} y1={y(target)} y2={y(target)} stroke={track} strokeWidth={1} strokeDasharray="3,4" opacity={0.5} />
      <Path d={area} fill={color} opacity={0.12} />
      <Path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last[0]} cy={last[1]} r={4} fill={color} stroke={surface} strokeWidth={2.5} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  errorText: { fontSize: 14, textAlign: "center" },
  header: { marginBottom: 18 },
  eyebrow: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  streakBanner: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 22, padding: 16, marginBottom: 18 },
  streakIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  streakTitle: { fontSize: 22, fontWeight: "700", color: "#fff", lineHeight: 24 },
  streakSub: { fontSize: 12.5, color: "rgba(255,255,255,0.85)", marginTop: 3 },
  streakBars: { flexDirection: "row", gap: 5, alignItems: "flex-end" },
  streakBar: { width: 6, borderRadius: 4 },
  card: { borderRadius: 22, padding: 18, borderWidth: 1, marginBottom: 14 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardMeta: { fontSize: 12, fontWeight: "600" },
  barsRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, height: 120 },
  barCol: { flex: 1, alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" },
  barTrack: { width: "100%", maxWidth: 22, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 7, alignItems: "center" },
  barValue: { position: "absolute", top: -18, fontSize: 10, fontWeight: "700" },
  barDay: { fontSize: 11, fontWeight: "600" },
  dayCell: { flex: 1, aspectRatio: 1, borderRadius: 7 },
});
