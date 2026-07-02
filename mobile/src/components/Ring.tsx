import Svg, { Circle } from "react-native-svg";

type Props = {
  size: number;
  stroke: number;
  pct: number; // 0-1
  color: string;
  track: string;
  cap?: "round" | "butt";
};

// Direct port of the design handoff's <Ring> — same stroke-dasharray trick,
// rotated -90deg so progress starts at 12 o'clock.
export default function Ring({ size, stroke, pct, color, track, cap = "round" }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(pct, 1));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap={cap}
        strokeDasharray={`${c}, ${c}`}
        strokeDashoffset={c * (1 - clamped)}
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}
