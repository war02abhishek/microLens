import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import Icon, { type IconName } from "../components/Icon";
import { useTheme } from "../theme/ThemeContext";
import { bodyFont, FONT_DISPLAY } from "../theme/typography";
import { TARGETS } from "../context/MealLogContext";
import type { RootStackParamList } from "../navigation/AppNavigator";

// TODO: source from GET /profile + GET /goals once wired to the backend.
const TARGET_ROWS: [IconName, string, string][] = [
  ["target", "Daily calories", `${TARGETS.cal.toLocaleString()} kcal`],
  ["bolt", "Protein", `${TARGETS.protein} g`],
  ["flame", "Carbs", `${TARGETS.carbs} g`],
  ["sparkle", "Fat", `${TARGETS.fat} g`],
];
const STATS: [string, string][] = [
  ["Age", "28"],
  ["Height", `5'7"`],
  ["Weight", "148 lb"],
  ["Activity", "High"],
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.identityRow}>
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={[styles.avatarLetter, { fontFamily: FONT_DISPLAY }]}>M</Text>
        </View>
        <View>
          <Text style={[styles.name, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Maya Chen</Text>
          <View style={[styles.goalChip, { backgroundColor: theme.surface2 }]}>
            <Icon name="bolt" size={13} color={theme.accent} fill={theme.accent} />
            <Text style={[styles.goalChipText, { color: theme.ink, fontFamily: bodyFont(700) }]}>Build muscle</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Daily targets</Text>
        <Pressable style={styles.editBtn} onPress={() => navigation.navigate("Onboarding")}>
          <Icon name="edit" size={15} color={theme.accent} />
          <Text style={[styles.editBtnText, { color: theme.accent, fontFamily: bodyFont(700) }]}>Edit</Text>
        </Pressable>
      </View>
      <View style={[styles.targetsCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {TARGET_ROWS.map(([icon, label, value], i) => (
          <View key={label} style={[styles.targetRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.line }]}>
            <View style={[styles.targetIcon, { backgroundColor: theme.surface2 }]}>
              <Icon name={icon} size={18} color={theme.accent} />
            </View>
            <Text style={[styles.targetLabel, { color: theme.ink, fontFamily: bodyFont(600) }]}>{label}</Text>
            <Text style={[styles.targetValue, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.derivationNote, { backgroundColor: theme.surface2 }]}>
        <Icon name="sparkle" size={16} color={theme.accent} fill={theme.accent} />
        <Text style={[styles.derivationText, { color: theme.muted, fontFamily: bodyFont(500) }]}>
          Targets derived from your BMR (1,480) × activity (1.55) + a 250 kcal surplus for muscle gain. Tap any number to
          override.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.ink, fontFamily: FONT_DISPLAY, marginHorizontal: 2 }]}>Your stats</Text>
      <View style={styles.statsGrid}>
        {STATS.map(([label, value]) => (
          <View key={label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Text style={[styles.statLabel, { color: theme.muted, fontFamily: bodyFont(600) }]}>{label}</Text>
            <Text style={[styles.statValue, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 15, marginTop: 12, marginBottom: 22 },
  avatar: { width: 66, height: 66, borderRadius: 33, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 26, fontWeight: "700", color: "#fff" },
  name: { fontSize: 23, fontWeight: "700" },
  goalChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 5, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 11 },
  goalChipText: { fontSize: 12.5, fontWeight: "700" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 2, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  editBtnText: { fontSize: 13, fontWeight: "700" },
  targetsCard: { borderRadius: 22, borderWidth: 1, overflow: "hidden" },
  targetRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 15, paddingHorizontal: 16 },
  targetIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  targetLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  targetValue: { fontSize: 15, fontWeight: "700" },
  derivationNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 18, paddingVertical: 13, paddingHorizontal: 16, marginVertical: 14 },
  derivationText: { flex: 1, fontSize: 12.5, fontWeight: "500", lineHeight: 18 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  statCard: { width: "47%", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1 },
  statLabel: { fontSize: 12, fontWeight: "600" },
  statValue: { fontSize: 20, fontWeight: "700", marginTop: 3 },
});
