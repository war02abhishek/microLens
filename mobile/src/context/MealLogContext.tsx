import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export type LoggedMeal = {
  id: string;
  name: string;
  time: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  hue: number;
  fresh?: boolean;
};

export type MealTotals = { cal: number; p: number; c: number; f: number };

// TODO: replace with real values from GET /goals once the profile/goals
// flow is wired to the backend (see backend/internal/goals).
export const TARGETS = { cal: 2200, protein: 165, carbs: 220, fat: 73 };

const SEED_MEALS: LoggedMeal[] = [
  { id: "1", name: "Greek yogurt & berries", time: "7:40 AM", cal: 320, p: 24, c: 38, f: 8, hue: 340 },
  { id: "2", name: "Chicken & rice bowl", time: "12:55 PM", cal: 540, p: 46, c: 62, f: 12, hue: 30 },
  { id: "3", name: "Whey protein shake", time: "3:20 PM", cal: 220, p: 40, c: 6, f: 3, hue: 265 },
];

type MealLogContextValue = {
  meals: LoggedMeal[];
  celebrate: boolean;
  saved: boolean;
  addMeal: (name: string, totals: MealTotals) => void;
};

const MealLogContext = createContext<MealLogContextValue | undefined>(undefined);

export function MealLogProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<LoggedMeal[]>(SEED_MEALS);
  const [celebrate, setCelebrate] = useState(false);
  const [saved, setSaved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addMeal = (name: string, totals: MealTotals) => {
    setMeals((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name,
        time: "Just now",
        cal: Math.round(totals.cal),
        p: Math.round(totals.p),
        c: Math.round(totals.c),
        f: Math.round(totals.f),
        hue: 130,
        fresh: true,
      },
    ]);
    setSaved(true);
    setCelebrate(true);
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setSaved(false), 1700),
      setTimeout(() => setCelebrate(false), 2600),
    ];
  };

  const value = useMemo(() => ({ meals, celebrate, saved, addMeal }), [meals, celebrate, saved]);

  return <MealLogContext.Provider value={value}>{children}</MealLogContext.Provider>;
}

export function useMealLog() {
  const ctx = useContext(MealLogContext);
  if (!ctx) throw new Error("useMealLog must be used within a MealLogProvider");
  return ctx;
}
