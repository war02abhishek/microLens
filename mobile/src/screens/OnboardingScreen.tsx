import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import Icon, { type IconName } from "../components/Icon";
import Ring from "../components/Ring";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useMealLog } from "../context/MealLogContext";
import { bodyFont, FONT_DISPLAY } from "../theme/typography";
import { ACCENTS, THEMES, type ThemeKey } from "../theme/themes";
import { useProgress, fmt } from "../hooks/useProgress";
import { MACRO_COLORS } from "../theme/themes";
import {
  feetInchesToCm,
  formatHeightFtIn,
  formatWeightKg,
  formatWeightLb,
  kgToLb,
  lbToKg,
  parseHeightFtIn,
} from "../utils/units";
import { upsertProfile, type Profile } from "../api/profileApi";
import { recalculateGoals, type Goals } from "../api/goalApi";
import type { RootStackParamList } from "../navigation/AppNavigator";

const STEPS = 6;
type Sex = "female" | "male" | "other";
type HeightUnit = "ftin" | "cm";
type WeightUnit = "lb" | "kg";

function parseHeightToCm(text: string, unit: HeightUnit): number | null {
  if (unit === "cm") {
    const n = parseFloat(text);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return parseHeightFtIn(text);
}

function parseWeightToKg(text: string, unit: WeightUnit): number | null {
  const n = parseFloat(text);
  if (!Number.isFinite(n) || n <= 0) return null;
  return unit === "kg" ? n : lbToKg(n);
}

export default function OnboardingScreen() {
  const { theme, themeKey, setThemeKey, setAccent } = useTheme();
  const { ensureDeviceAccount } = useAuth();
  const { refreshTargets } = useMealLog();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex>("female");
  const [ageText, setAgeText] = useState("28");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("ftin");
  const [heightText, setHeightText] = useState(`5'7"`);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [weightText, setWeightText] = useState("148");
  const [targetText, setTargetText] = useState("150");
  const [activity, setActivity] = useState<Profile["activity_level"]>("active");
  const [goal, setGoal] = useState<Profile["goal"]>("build_muscle");

  const [computedGoals, setComputedGoals] = useState<Goals | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeHeightUnit = (unit: HeightUnit) => {
    const cm = parseHeightToCm(heightText, heightUnit) ?? feetInchesToCm(5, 7);
    setHeightText(unit === "cm" ? String(Math.round(cm)) : formatHeightFtIn(cm));
    setHeightUnit(unit);
  };

  const changeWeightUnit = (unit: WeightUnit) => {
    const w = parseWeightToKg(weightText, weightUnit) ?? 67;
    const t = parseWeightToKg(targetText, weightUnit) ?? w;
    setWeightText(unit === "kg" ? formatWeightKg(w) : formatWeightLb(w));
    setTargetText(unit === "kg" ? formatWeightKg(t) : formatWeightLb(t));
    setWeightUnit(unit);
  };

  // Saves the profile and recomputes real goals against the backend
  // (Mifflin-St Jeor — backend/internal/goals/calculator.go). Runs once,
  // right before the Reveal step, so the animated numbers are real.
  const saveProfileAndComputeGoals = async () => {
    setSaving(true);
    setError(null);
    try {
      await ensureDeviceAccount();

      const heightCm = parseHeightToCm(heightText, heightUnit) ?? feetInchesToCm(5, 7);
      const weightKg = parseWeightToKg(weightText, weightUnit) ?? 67;
      const targetWeightKg = parseWeightToKg(targetText, weightUnit) ?? undefined;
      const age = parseInt(ageText, 10) || 28;

      await upsertProfile({
        display_name: name.trim(),
        age,
        sex: sex === "other" ? "female" : sex, // backend models sex as male/female today
        height_cm: heightCm,
        weight_kg: weightKg,
        activity_level: activity,
        goal,
        target_weight_kg: targetWeightKg,
        theme_id: themeKey,
        accent_color: theme.accent,
      });

      const goals = await recalculateGoals();
      setComputedGoals(goals);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach the backend");
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    await refreshTargets().catch(() => {});
    // Capture/AIResult are pushed on the root stack above Tabs; reset so
    // Tabs is the new root, then open Capture for the guided first log.
    navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
    setTimeout(() => navigation.navigate("Capture"), 60);
  };

  const next = async () => {
    if (step === 3) {
      // leaving the Goal step, entering Reveal — compute real targets first
      await saveProfileAndComputeGoals();
      setStep(step + 1);
      return;
    }
    if (step < STEPS - 1) {
      setStep(step + 1);
    } else {
      await finish();
    }
  };
  const back = () => step > 0 && setStep(step - 1);

  const ctaLabel =
    step === 0 ? "Get started" : step === 4 ? "Looks good — continue" : step === STEPS - 1 ? "Log my first meal" : "Continue";

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerRow}>
        {step > 0 ? (
          <Pressable style={styles.backBtn} onPress={back}>
            <Icon name="chevL" size={22} color={theme.muted} />
          </Pressable>
        ) : (
          <View style={styles.backBtnSpacer} />
        )}
        <View style={styles.progressRow}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressBar, { backgroundColor: i <= step ? theme.accent : theme.surface2 }]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {step === 0 && <OnbWelcome theme={theme} />}
        {step === 1 && (
          <OnbStats
            theme={theme}
            name={name}
            setName={setName}
            sex={sex}
            setSex={setSex}
            ageText={ageText}
            setAgeText={setAgeText}
            heightUnit={heightUnit}
            heightText={heightText}
            setHeightText={setHeightText}
            onToggleHeightUnit={changeHeightUnit}
            weightUnit={weightUnit}
            weightText={weightText}
            setWeightText={setWeightText}
            targetText={targetText}
            setTargetText={setTargetText}
            onToggleWeightUnit={changeWeightUnit}
          />
        )}
        {step === 2 && (
          <OnbChoice
            theme={theme}
            title="How active are you?"
            sub="We use this to fine-tune your daily energy."
            value={activity}
            setValue={(v) => setActivity(v as Profile["activity_level"])}
            options={[
              ["sedentary", "Mostly sedentary", "Desk job, little exercise", "user"],
              ["light", "Lightly active", "Walks, 1–2 workouts / week", "trend"],
              ["active", "Very active", "Training 3–5× / week", "bolt"],
            ]}
          />
        )}
        {step === 3 && (
          <OnbChoice
            theme={theme}
            title="What's your goal?"
            sub="This sets your calorie balance and macro split."
            value={goal}
            setValue={(v) => setGoal(v as Profile["goal"])}
            options={[
              ["lose_fat", "Lose fat", "Gentle calorie deficit", "flame"],
              ["maintain", "Maintain", "Stay at your weight", "target"],
              ["build_muscle", "Build muscle", "Slight surplus, high protein", "bolt"],
            ]}
          />
        )}
        {step === 4 && <OnbReveal theme={theme} goals={computedGoals} saving={saving} error={error} />}
        {step === 5 && (
          <OnbTheme theme={theme} themeKey={themeKey} setThemeKey={setThemeKey} setAccent={setAccent} />
        )}
      </ScrollView>

      <View style={styles.ctaWrap}>
        <Pressable
          style={[styles.cta, { backgroundColor: theme.accent, shadowColor: theme.accent }, saving && { opacity: 0.6 }]}
          onPress={next}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={[styles.ctaText, { fontFamily: FONT_DISPLAY }]}>{ctaLabel}</Text>
              {step === STEPS - 1 && <Icon name="camera" size={19} color="#fff" />}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function OnbWelcome({ theme }: { theme: ReturnType<typeof useTheme>["theme"] }) {
  return (
    <View style={styles.welcomeWrap}>
      <View style={styles.welcomeRing}>
        <Ring size={120} stroke={12} pct={0.72} color={theme.accent} track={theme.surface2} />
        <View style={styles.welcomeRingCenter}>
          <Icon name="sparkle" size={44} color={theme.accent} fill={theme.accent} />
        </View>
      </View>
      <Text style={[styles.welcomeTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Welcome to{"\n"}MacroLens</Text>
      <Text style={[styles.welcomeSub, { color: theme.muted, fontFamily: bodyFont(500) }]}>
        Snap it or say it — your macros, tracked in under 10 seconds.
      </Text>
    </View>
  );
}

function UnitToggle<U extends string>({
  theme,
  options,
  value,
  onChange,
}: {
  theme: ReturnType<typeof useTheme>["theme"];
  options: readonly U[];
  value: U;
  onChange: (u: U) => void;
}) {
  return (
    <View style={[styles.unitToggle, { backgroundColor: theme.surface2 }]}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.unitToggleBtn, active && { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.unitToggleText, { color: active ? "#fff" : theme.muted, fontFamily: bodyFont(700) }]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatField({
  theme,
  label,
  value,
  onChangeText,
  unit,
  keyboardType = "numeric",
  unitToggle,
}: {
  theme: ReturnType<typeof useTheme>["theme"];
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
  keyboardType?: "numeric" | "default";
  unitToggle?: React.ReactNode;
}) {
  return (
    <View style={[styles.statField, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.statFieldHeaderRow}>
        <Text style={[styles.statFieldLabel, { color: theme.muted, fontFamily: bodyFont(600) }]}>{label}</Text>
        {unitToggle}
      </View>
      <View style={styles.statFieldValueRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          selectTextOnFocus
          style={[styles.statFieldInput, { color: theme.ink, fontFamily: FONT_DISPLAY }]}
        />
        {unit ? <Text style={[styles.statFieldUnit, { color: theme.muted, fontFamily: bodyFont(600) }]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function OnbStats({
  theme,
  name,
  setName,
  sex,
  setSex,
  ageText,
  setAgeText,
  heightUnit,
  heightText,
  setHeightText,
  onToggleHeightUnit,
  weightUnit,
  weightText,
  setWeightText,
  targetText,
  setTargetText,
  onToggleWeightUnit,
}: {
  theme: ReturnType<typeof useTheme>["theme"];
  name: string;
  setName: (v: string) => void;
  sex: Sex;
  setSex: (s: Sex) => void;
  ageText: string;
  setAgeText: (v: string) => void;
  heightUnit: HeightUnit;
  heightText: string;
  setHeightText: (v: string) => void;
  onToggleHeightUnit: (u: HeightUnit) => void;
  weightUnit: WeightUnit;
  weightText: string;
  setWeightText: (v: string) => void;
  targetText: string;
  setTargetText: (v: string) => void;
  onToggleWeightUnit: (u: WeightUnit) => void;
}) {
  return (
    <View>
      <Text style={[styles.h2, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Tell us about you</Text>
      <Text style={[styles.pCopy, { color: theme.muted, fontFamily: bodyFont(500) }]}>
        We'll calculate your personalized targets — everything stays private on your device.
      </Text>
      <View style={[styles.nameField, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={[styles.statFieldLabel, { color: theme.muted, fontFamily: bodyFont(600) }]}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="What should we call you?"
          placeholderTextColor={theme.muted}
          autoCapitalize="words"
          style={[styles.nameFieldInput, { color: theme.ink, fontFamily: FONT_DISPLAY }]}
        />
      </View>
      <View style={styles.sexRow}>
        {(
          [
            ["female", "Female"],
            ["male", "Male"],
            ["other", "Other"],
          ] as const
        ).map(([k, label]) => {
          const on = sex === k;
          return (
            <Pressable
              key={k}
              onPress={() => setSex(k)}
              style={[
                styles.sexBtn,
                { borderColor: on ? theme.accent : theme.line, backgroundColor: on ? `${theme.accent}12` : theme.surface },
              ]}
            >
              <Text style={[styles.sexBtnText, { color: on ? theme.accent : theme.ink, fontFamily: bodyFont(700) }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.statRow}>
        <StatField theme={theme} label="Age" value={ageText} onChangeText={setAgeText} unit="yrs" />
        <StatField
          theme={theme}
          label="Height"
          value={heightText}
          onChangeText={setHeightText}
          unit=""
          keyboardType="default"
          unitToggle={
            <UnitToggle theme={theme} options={["ftin", "cm"] as const} value={heightUnit} onChange={onToggleHeightUnit} />
          }
        />
      </View>
      <View style={styles.statRow}>
        <StatField
          theme={theme}
          label="Weight"
          value={weightText}
          onChangeText={setWeightText}
          unit={weightUnit}
          unitToggle={
            <UnitToggle theme={theme} options={["lb", "kg"] as const} value={weightUnit} onChange={onToggleWeightUnit} />
          }
        />
        <StatField theme={theme} label="Target" value={targetText} onChangeText={setTargetText} unit={weightUnit} />
      </View>
    </View>
  );
}

function OnbChoice({
  theme,
  title,
  sub,
  value,
  setValue,
  options,
}: {
  theme: ReturnType<typeof useTheme>["theme"];
  title: string;
  sub: string;
  value: string;
  setValue: (v: string) => void;
  options: [string, string, string, IconName][];
}) {
  return (
    <View>
      <Text style={[styles.h2, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{title}</Text>
      <Text style={[styles.pCopy, { color: theme.muted, fontFamily: bodyFont(500) }]}>{sub}</Text>
      <View style={{ gap: 12 }}>
        {options.map(([k, label, desc, icon]) => {
          const on = value === k;
          return (
            <Pressable
              key={k}
              onPress={() => setValue(k)}
              style={[
                styles.choiceCard,
                { borderColor: on ? theme.accent : theme.line, backgroundColor: on ? `${theme.accent}10` : theme.surface },
              ]}
            >
              <View style={[styles.choiceIcon, { backgroundColor: on ? theme.accent : theme.surface2 }]}>
                <Icon name={icon} size={22} color={on ? "#fff" : theme.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{label}</Text>
                <Text style={[styles.choiceDesc, { color: theme.muted, fontFamily: bodyFont(500) }]}>{desc}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: on ? theme.accent : theme.line, backgroundColor: on ? theme.accent : "transparent" },
                ]}
              >
                {on && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function OnbReveal({
  theme,
  goals,
  saving,
  error,
}: {
  theme: ReturnType<typeof useTheme>["theme"];
  goals: Goals | null;
  saving: boolean;
  error: string | null;
}) {
  const p = useProgress(!!goals, 1300, 200);
  const targets = goals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const macros = [
    ["Protein", targets.protein_g, MACRO_COLORS.protein],
    ["Carbs", targets.carbs_g, MACRO_COLORS.carbs],
    ["Fat", targets.fat_g, MACRO_COLORS.fat],
  ] as const;

  return (
    <View style={{ paddingTop: 10 }}>
      <View style={{ alignItems: "center" }}>
        <View style={[styles.revealPill, { backgroundColor: `${theme.accent}16` }]}>
          <Icon name="sparkle" size={14} color={theme.accent} fill={theme.accent} />
          <Text style={[styles.revealPillText, { color: theme.accent, fontFamily: bodyFont(700) }]}>Your personalized plan</Text>
        </View>
        <Text style={[styles.h2, { color: theme.ink, fontFamily: FONT_DISPLAY, textAlign: "center", marginTop: 16 }]}>
          Here's your daily target
        </Text>
      </View>
      {saving && !goals && !error ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
      ) : error ? (
        <Text style={[styles.errorText, { color: "#ff5a5f" }]}>
          Couldn't reach the backend ({error}). Check that `docker compose up` is running.
        </Text>
      ) : (
        <>
          <View style={styles.revealRingWrap}>
            <Ring size={200} stroke={16} pct={p} color={theme.accent} track={theme.surface2} />
            <View style={styles.revealRingCenter}>
              <Text style={[styles.revealKcal, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{fmt(p * targets.calories)}</Text>
              <Text style={[styles.revealKcalUnit, { color: theme.muted, fontFamily: bodyFont(700) }]}>kcal / day</Text>
            </View>
          </View>
          <View style={styles.revealMacroRow}>
            {macros.map(([label, value, color]) => (
              <View key={label} style={[styles.revealMacroTile, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <Text style={[styles.revealMacroValue, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>
                  {fmt(p * value)}
                  <Text style={{ fontSize: 12, color: theme.muted }}>g</Text>
                </Text>
                <View style={styles.revealMacroLabelRow}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[styles.revealMacroLabel, { color: theme.muted, fontFamily: bodyFont(600) }]}>{label}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={[styles.pCopy, { color: theme.muted, fontFamily: bodyFont(500), textAlign: "center", marginTop: 18, marginBottom: 0 }]}>
            Computed from your real stats and goal (Mifflin-St Jeor). You can fine-tune any number later.
          </Text>
        </>
      )}
    </View>
  );
}

function OnbTheme({
  theme,
  themeKey,
  setThemeKey,
  setAccent,
}: {
  theme: ReturnType<typeof useTheme>["theme"];
  themeKey: ThemeKey;
  setThemeKey: (k: ThemeKey) => void;
  setAccent: (c: string) => void;
}) {
  return (
    <View>
      <Text style={[styles.h2, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Make it yours</Text>
      <Text style={[styles.pCopy, { color: theme.muted, fontFamily: bodyFont(500) }]}>
        Pick a starting look — you can change it anytime.
      </Text>
      <View style={styles.themeGrid}>
        {(Object.entries(THEMES) as [ThemeKey, (typeof THEMES)[ThemeKey]][]).map(([k, th]) => {
          const active = k === themeKey;
          return (
            <Pressable
              key={k}
              onPress={() => setThemeKey(k)}
              style={[styles.themeCard, { backgroundColor: th.bg, borderColor: active ? theme.accent : theme.line }]}
            >
              <View style={styles.themeCardTop}>
                <View style={[styles.themeSwatch, { backgroundColor: th.accent }]} />
                {active && <Icon name="check" size={16} color={theme.accent} strokeWidth={3} />}
              </View>
              <Text style={[styles.themeCardName, { color: th.ink, fontFamily: FONT_DISPLAY }]}>{th.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.accentLabel, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Accent</Text>
      <View style={styles.accentRow}>
        {ACCENTS.map((c) => {
          const active = theme.accent === c;
          return (
            <Pressable
              key={c}
              onPress={() => setAccent(c)}
              style={[styles.accentSwatch, { backgroundColor: c, borderColor: active ? theme.ink : "transparent" }]}
            >
              {active && <Icon name="check" size={15} color="#fff" strokeWidth={3} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 62, paddingHorizontal: 18, paddingBottom: 8 },
  progressRow: { flex: 1, flexDirection: "row", gap: 6 },
  progressBar: { flex: 1, height: 5, borderRadius: 9 },
  backBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  backBtnSpacer: { width: 30 },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 },
  ctaWrap: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 30 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 17,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaText: { color: "#fff", fontSize: 16.5, fontWeight: "700" },
  welcomeWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40, minHeight: 420 },
  welcomeRing: { width: 120, height: 120, marginBottom: 30, alignItems: "center", justifyContent: "center" },
  welcomeRingCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  welcomeTitle: { fontSize: 34, fontWeight: "700", textAlign: "center", letterSpacing: -0.8, lineHeight: 38 },
  welcomeSub: { fontSize: 16, fontWeight: "500", textAlign: "center", marginTop: 16, maxWidth: 260, lineHeight: 23 },
  h2: { fontSize: 27, fontWeight: "700", letterSpacing: -0.5, marginBottom: 8, lineHeight: 31 },
  pCopy: { fontSize: 14.5, fontWeight: "500", marginBottom: 22, lineHeight: 21 },
  errorText: { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 40, lineHeight: 20 },
  nameField: { borderRadius: 16, padding: 13, borderWidth: 1, marginBottom: 12 },
  nameFieldInput: { fontSize: 18, fontWeight: "700", padding: 0, marginTop: 4 },
  sexRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  sexBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, alignItems: "center" },
  sexBtnText: { fontSize: 14, fontWeight: "700" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statField: { flex: 1, borderRadius: 16, padding: 13, borderWidth: 1 },
  statFieldHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statFieldLabel: { fontSize: 12.5, fontWeight: "600" },
  statFieldValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 3 },
  statFieldInput: { fontSize: 24, fontWeight: "700", padding: 0, minWidth: 40 },
  statFieldUnit: { fontSize: 13, fontWeight: "600" },
  unitToggle: { flexDirection: "row", borderRadius: 99, padding: 2, gap: 2 },
  unitToggleBtn: { paddingVertical: 3, paddingHorizontal: 7, borderRadius: 99 },
  unitToggleText: { fontSize: 10, fontWeight: "700" },
  choiceCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 18, borderWidth: 1.5 },
  choiceIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  choiceTitle: { fontSize: 16, fontWeight: "700" },
  choiceDesc: { fontSize: 13, fontWeight: "500", marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  revealPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 13 },
  revealPillText: { fontSize: 13, fontWeight: "700" },
  revealRingWrap: { width: 200, height: 200, alignSelf: "center", marginTop: 18, marginBottom: 8 },
  revealRingCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  revealKcal: { fontSize: 46, fontWeight: "700", letterSpacing: -1 },
  revealKcalUnit: { fontSize: 13, fontWeight: "700", marginTop: 3 },
  revealMacroRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  revealMacroTile: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", borderWidth: 1 },
  revealMacroValue: { fontSize: 22, fontWeight: "700" },
  revealMacroLabelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  revealMacroLabel: { fontSize: 12, fontWeight: "600" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  themeCard: { width: "47%", padding: 14, borderRadius: 18, borderWidth: 2 },
  themeCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  themeSwatch: { width: 26, height: 26, borderRadius: 13 },
  themeCardName: { fontSize: 14, fontWeight: "700" },
  accentLabel: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  accentRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  accentSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, alignItems: "center", justifyContent: "center" },
});
