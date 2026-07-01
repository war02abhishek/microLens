import PlaceholderScreen from "./PlaceholderScreen";

// PRD §3.1 / §4.4-4: editable ingredient breakdown, adjust portions,
// low-confidence flags, confirm. Every AI result is a draft, never final.
export default function MealReviewScreen() {
  return <PlaceholderScreen title="AI Result / Edit" note="Editable ingredient breakdown, confidence flags, confirm" />;
}
