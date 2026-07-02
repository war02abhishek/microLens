import { useEffect, useRef, useState } from "react";
import { Easing } from "react-native";

// Port of the design handoff's useProgress hook: a single 0-1 value driven
// by a native-ish easeOutCubic timing, used to animate ring fills and
// number count-ups off the same progress simultaneously.
export function useProgress(active: boolean, duration = 1100, delay = 60): number {
  const [p, setP] = useState(active ? 0 : 1);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    setP(0);
    let start: number | null = null;
    const easing = Easing.out(Easing.cubic);

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start - delay;
      const t = Math.max(0, Math.min(1, elapsed / duration));
      setP(easing(t));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return p;
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}
