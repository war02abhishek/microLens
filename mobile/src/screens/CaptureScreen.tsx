import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import Icon from "../components/Icon";
import { useTheme } from "../theme/ThemeContext";
import { bodyFont } from "../theme/typography";
import type { RootStackParamList } from "../navigation/AppNavigator";

const SUGGESTIONS = ["2 eggs & toast", "Chicken breast 200g + rice", "Protein shake", "Banana"];

type Mode = "photo" | "text";

// PRD §3.1 / §4.4-3. Camera capture is a placeholder tile (no camera
// integration yet) — wire expo-camera once native permissions/build are
// set up. Text mode is fully functional against POST /meals/analyze/text.
export default function CaptureScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mode, setMode] = useState<Mode>("photo");
  const [text, setText] = useState("");

  const analyze = (m: Mode) => {
    navigation.navigate("AIResult", { mode: m, description: m === "text" ? text : undefined });
  };

  return (
    <View style={styles.container}>
      {/* viewfinder */}
      <View style={styles.viewfinder}>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="x" size={20} color="#fff" strokeWidth={2.4} />
        </Pressable>
        <View style={styles.aiPill}>
          <Icon name="sparkle" size={15} color="#fff" fill="#fff" />
          <Text style={[styles.aiPillText, { fontFamily: bodyFont(700) }]}>AI ready</Text>
        </View>

        <View style={styles.plate} />

        <View style={styles.focusFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={[styles.hint, { fontFamily: bodyFont(600) }]}>Center your plate in the frame</Text>
      </View>

      {/* control tray */}
      <View style={[styles.tray, { backgroundColor: theme.surface }]}>
        <View style={[styles.segment, { backgroundColor: theme.surface2 }]}>
          {(["photo", "text"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.segmentBtn,
                mode === m && { backgroundColor: theme.surface, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
              ]}
            >
              <Icon name={m === "photo" ? "camera" : "edit"} size={17} color={mode === m ? theme.ink : theme.muted} />
              <Text
                style={[
                  styles.segmentLabel,
                  { color: mode === m ? theme.ink : theme.muted, fontFamily: bodyFont(700) },
                ]}
              >
                {m === "photo" ? "Photo" : "Describe"}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === "photo" ? (
          <View style={styles.photoRow}>
            <View style={[styles.sideBtn, { backgroundColor: theme.surface2 }]}>
              <Icon name="gallery" size={22} color={theme.muted} />
            </View>
            <Pressable
              style={[styles.shutter, { backgroundColor: theme.accent, borderColor: theme.surface, shadowColor: theme.accent }]}
              onPress={() => analyze("photo")}
            >
              <Icon name="camera" size={30} color="#fff" />
            </Pressable>
            <View style={[styles.sideBtn, { backgroundColor: theme.surface2 }]}>
              <Icon name="mic" size={22} color={theme.muted} />
            </View>
          </View>
        ) : (
          <View>
            <View style={[styles.inputRow, { backgroundColor: theme.surface2 }]}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="e.g. chicken breast 200g with rice"
                placeholderTextColor={theme.muted}
                style={[styles.input, { color: theme.ink, fontFamily: bodyFont(500) }]}
              />
              <Pressable style={styles.micBtn}>
                <Icon name="mic" size={20} color={theme.muted} />
              </Pressable>
              <Pressable
                style={[styles.sendBtn, { backgroundColor: theme.accent }]}
                onPress={() => analyze("text")}
                disabled={!text.trim()}
              >
                <Icon name="sparkle" size={22} color="#fff" fill="#fff" />
              </Pressable>
            </View>
            <View style={styles.chipRow}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={[styles.chip, { borderColor: theme.line }]} onPress={() => setText(s)}>
                  <Text style={[styles.chipText, { color: theme.muted, fontFamily: bodyFont(600) }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0a09" },
  viewfinder: { flex: 1, position: "relative", alignItems: "center", justifyContent: "center" },
  closeBtn: {
    position: "absolute",
    top: 62,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiPill: {
    position: "absolute",
    top: 62,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 99,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  aiPillText: { color: "#fff", fontSize: 13 },
  plate: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#4a3a2c",
  },
  focusFrame: { position: "absolute", width: 250, height: 250 },
  corner: { position: "absolute", width: 30, height: 30, borderColor: "rgba(255,255,255,0.9)" },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  hint: { position: "absolute", bottom: 20, color: "rgba(255,255,255,0.7)", fontSize: 13 },
  tray: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 18, paddingHorizontal: 20, paddingBottom: 30 },
  segment: { flexDirection: "row", borderRadius: 99, padding: 4, marginBottom: 18 },
  segmentBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 10, borderRadius: 99 },
  segmentLabel: { fontSize: 14, fontWeight: "700" },
  photoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sideBtn: { width: 50, height: 50, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  shutter: { width: 74, height: 74, borderRadius: 37, borderWidth: 4, alignItems: "center", justifyContent: "center", shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, paddingLeft: 16, paddingRight: 6 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  micBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sendBtn: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: { borderWidth: 1, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 13 },
  chipText: { fontSize: 13, fontWeight: "600" },
});
