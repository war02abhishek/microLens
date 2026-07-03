// Canonical storage is always metric (cm / kg) — matches the backend's
// profile schema. These helpers convert to/from the imperial display units
// shown in the onboarding stats step.

export function kgToLb(kg: number): number {
  return kg * 2.20462;
}

export function lbToKg(lb: number): number {
  return lb / 2.20462;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return inches === 12 ? { feet: feet + 1, inches: 0 } : { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

export function formatHeightFtIn(cm: number): string {
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
}

// Parses "5'7"" / "5' 7"" / "5'7" (missing trailing quote tolerated) back to cm.
// Returns null if the string doesn't look like a feet/inches height.
export function parseHeightFtIn(value: string): number | null {
  const match = value.match(/^(\d+)'\s*(\d{1,2})"?$/);
  if (!match) return null;
  const feet = parseInt(match[1], 10);
  const inches = parseInt(match[2], 10);
  if (inches >= 12) return null;
  return feetInchesToCm(feet, inches);
}

export function formatWeightLb(kg: number): string {
  return String(Math.round(kgToLb(kg)));
}

export function formatWeightKg(kg: number): string {
  return String(Math.round(kg));
}
