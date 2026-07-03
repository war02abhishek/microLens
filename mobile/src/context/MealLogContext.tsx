import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { listMealsForDay, type Meal } from "../api/mealApi";
import { getGoals, type Goals } from "../api/goalApi";

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

// Shown until real goals load from GET /goals (e.g. before onboarding
// finishes, or while the request is in flight).
export const DEFAULT_TARGETS = { cal: 2200, protein: 165, carbs: 220, fat: 73 };

function hashHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

function toLoggedMeal(m: Meal): LoggedMeal {
  const totals = m.items.reduce(
    (acc, it) => ({ cal: acc.cal + it.calories, p: acc.p + it.protein_g, c: acc.c + it.carbs_g, f: acc.f + it.fat_g }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );
  const name =
    m.items.length === 0 ? "Meal" : m.items.length === 1 ? m.items[0].food_name : `${m.items[0].food_name} + ${m.items.length - 1} more`;
  const time = new Date(m.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return {
    id: m.id,
    name,
    time,
    cal: Math.round(totals.cal),
    p: Math.round(totals.p),
    c: Math.round(totals.c),
    f: Math.round(totals.f),
    hue: hashHue(m.id),
  };
}

type MealLogContextValue = {
  meals: LoggedMeal[];
  targets: typeof DEFAULT_TARGETS;
  celebrate: boolean;
  saved: boolean;
  addMeal: (name: string, totals: MealTotals) => void;
  refreshMeals: () => Promise<void>;
  refreshTargets: () => Promise<void>;
};

const MealLogContext = createContext<MealLogContextValue | undefined>(undefined);

export function MealLogProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [celebrate, setCelebrate] = useState(false);
  const [saved, setSaved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Optimistic local append for the immediate save-animation + list update;
  // refreshMeals() reconciles with the server's copy on next screen focus.
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
    timers.current = [setTimeout(() => setSaved(false), 1700), setTimeout(() => setCelebrate(false), 2600)];
  };

  const refreshMeals = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = await listMealsForDay(today);
    setMeals((result ?? []).map(toLoggedMeal));
  };

  const refreshTargets = async () => {
    const g: Goals = await getGoals();
    setTargets({ cal: g.calories, protein: g.protein_g, carbs: g.carbs_g, fat: g.fat_g });
  };

  const value = useMemo(
    () => ({ meals, targets, celebrate, saved, addMeal, refreshMeals, refreshTargets }),
    [meals, targets, celebrate, saved],
  );

  return <MealLogContext.Provider value={value}>{children}</MealLogContext.Provider>;
}

export function useMealLog() {
  const ctx = useContext(MealLogContext);
  if (!ctx) throw new Error("useMealLog must be used within a MealLogProvider");
  return ctx;
}
