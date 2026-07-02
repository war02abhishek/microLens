import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import Icon from "./Icon";
import { FONT_BODY_SEMIBOLD, FONT_DISPLAY } from "../theme/typography";
import type { ThemeTokens } from "../theme/themes";

type Props = {
  theme: ThemeTokens;
};

export default function SavedToast({ theme }: Props) {
  const pop = useRef(new Animated.Value(0)).current;
  const checkPop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }).start();
    Animated.sequence([
      Animated.delay(60),
      Animated.spring(checkPop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 100 }),
    ]).start();
  }, []);

  return (
    <View style={styles.scrim}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.surface, transform: [{ scale: pop }], opacity: pop },
        ]}
      >
        <Animated.View
          style={[styles.checkCircle, { transform: [{ scale: checkPop }], opacity: checkPop }]}
        >
          <Icon name="check" size={38} color="#fff" strokeWidth={3} />
        </Animated.View>
        <Text style={[styles.title, { color: theme.ink, fontFamily: FONT_DISPLAY }]}>Meal logged!</Text>
        <Text style={[styles.sub, { color: theme.muted, fontFamily: FONT_BODY_SEMIBOLD }]}>
          Protein goal reached 🎉
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  card: {
    borderRadius: 26,
    paddingVertical: 30,
    paddingHorizontal: 36,
    alignItems: "center",
    gap: 14,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#34b9a0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700" },
  sub: { fontSize: 13.5, fontWeight: "600" },
});
