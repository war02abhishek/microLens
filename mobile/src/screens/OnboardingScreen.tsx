import PlaceholderScreen from "./PlaceholderScreen";

// PRD §3.6 / §4.4-1: welcome -> stats -> goal -> revealed targets -> pick
// theme -> first log. Will likely become its own multi-step navigator
// once the design lands rather than a single screen.
export default function OnboardingScreen() {
  return <PlaceholderScreen title="Onboarding" note="Welcome -> stats -> goal -> targets -> theme -> first log" />;
}
