import { useMemo, useRef, useEffect } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

type Props = {
  colors: string[];
  count?: number;
};

// Port of the design handoff's <Confetti> — bits burst outward from the
// center and fade over ~1.1s (ml-conf keyframe).
export default function Confetti({ colors, count = 26 }: Props) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: 50 + (Math.random() * 2 - 1) * 44,
        dx: (Math.random() * 2 - 1) * 120,
        dy: -140 - Math.random() * 160,
        rot: Math.random() * 720 - 360,
        color: colors[i % colors.length],
        delay: Math.random() * 120,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
      })),
    [],
  );

  const anims = useRef(bits.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      4,
      anims.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 1100,
          delay: bits[i].delay,
          easing: Easing.bezier(0.2, 0.7, 0.3, 1),
          useNativeDriver: true,
        }),
      ),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bits.map((b, i) => {
        const translateX = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, b.dx] });
        const translateY = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, b.dy] });
        const rotate = anims[i].interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${b.rot}deg`] });
        const opacity = anims[i].interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              top: "54%",
              width: b.w,
              height: b.h,
              backgroundColor: b.color,
              borderRadius: 2,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
