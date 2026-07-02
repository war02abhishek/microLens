import { BlurView } from "expo-blur";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import Icon, { type IconName } from "../components/Icon";
import { useTheme } from "../theme/ThemeContext";
import { FONT_BODY_BOLD } from "../theme/typography";

const TAB_ICON: Record<string, IconName> = {
  Home: "home",
  History: "chart",
  ThemeGallery: "palette",
  Profile: "user",
};
const TAB_LABEL: Record<string, string> = {
  Home: "Home",
  History: "Trends",
  ThemeGallery: "Themes",
  Profile: "Profile",
};

// Floating glass pill tab bar with a center FAB that opens the Capture
// modal on the parent stack — matches the design handoff's TabBar.
export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const routes = state.routes;

  const renderTab = (route: (typeof routes)[number], index: number) => {
    const isFocused = state.index === index;
    const color = isFocused ? theme.accent : theme.muted;
    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tab}
        activeOpacity={0.7}
        onPress={() => navigation.navigate(route.name)}
      >
        <Icon
          name={TAB_ICON[route.name] ?? "home"}
          size={23}
          color={color}
          fill={isFocused ? color : "none"}
          strokeWidth={isFocused ? 0 : 2}
        />
        <Text style={[styles.label, { color, fontFamily: FONT_BODY_BOLD }]}>{TAB_LABEL[route.name] ?? route.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <BlurView
        intensity={60}
        tint={theme.isDark ? "dark" : "light"}
        style={[styles.bar, { borderColor: theme.line }]}
      >
        {routes.slice(0, 2).map((r, i) => renderTab(r, i))}
        <View style={styles.fabSlot}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.accent, borderColor: theme.bg, shadowColor: theme.accent }]}
            activeOpacity={0.85}
            onPress={() => navigation.getParent()?.navigate("Capture" as never)}
          >
            <Icon name="plus" size={28} color="#fff" strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
        {routes.slice(2).map((r, i) => renderTab(r, i + 2))}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 22,
    zIndex: 25,
  },
  bar: {
    marginHorizontal: 14,
    height: 62,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: { fontSize: 10.5, fontWeight: "700" },
  fabSlot: { width: 64, height: "100%" },
  fab: {
    position: "absolute",
    left: "50%",
    marginLeft: -29,
    bottom: 6,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
});
