import Svg, { Path } from "react-native-svg";

// Path data ported directly from the design handoff's inline icon set
// (macrolens.jsx `P`) — SVG path syntax is identical between web and
// react-native-svg, so no translation needed.
export const ICONS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  chart: ["M4 20V4", "M4 20h16", "M8 16v-4", "M13 16V8", "M18 16v-7"],
  palette:
    "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.5-.2-.8-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.8.7-1.5 1.5-1.5H15a5 5 0 0 0 5-5c0-4-3.6-6.7-8-6.7Z",
  user: ["M20 21a8 8 0 1 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
  camera: [
    "M3 8.5A1.5 1.5 0 0 1 4.5 7h2l1.2-2h6.6L15.5 7h2A1.5 1.5 0 0 1 19 8.5v9A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5Z",
    "M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  ],
  plus: ["M12 5v14", "M5 12h14"],
  mic: ["M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z", "M6 11a6 6 0 0 0 12 0", "M12 17v4"],
  check: "M20 6 9 17l-5-5",
  x: ["M6 6l12 12", "M18 6 6 18"],
  edit: ["M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17Z", "M13.5 6.5l3 3"],
  chevL: "M15 5l-7 7 7 7",
  chevR: "M9 5l7 7-7 7",
  flame: "M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0 3 3 3 3 6a5 5 0 0 1-10 0c0-4 4-5 5-13Z",
  bolt: "M13 3 4 14h6l-1 7 9-11h-6l1-7Z",
  trend: ["M3 17 9 11l4 4 8-8", "M15 7h6v6"],
  gallery: ["M4 5h16v14H4z", "M4 15l4-4 4 4 3-3 5 5"],
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z",
  scale: ["M12 3v3", "M6 6h12l3 8a4.5 4.5 0 0 1-9 0Z", "M18 6l-3 8", "M9 21h6"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
};

export default function Icon({ name, size = 24, color = "#000", fill = "none", strokeWidth = 2 }: Props) {
  const d: string | readonly string[] = ICONS[name];
  const paths: readonly string[] = Array.isArray(d) ? d : [d as string];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths.map((p, i) => (
        <Path
          key={i}
          d={p}
          fill={fill === "none" ? "none" : fill}
          stroke={fill === "none" ? color : "none"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
