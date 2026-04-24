import { KeystrokePayload } from "./types";

export function calculateWpm(charsTyped: number, elapsedMs: number) {
  if (elapsedMs <= 0) return 0;
  // Standard WPM: (chars / 5) / (ms / 60000)
  const wpm = (charsTyped / 5) / (elapsedMs / 60000);
  return Math.max(0, Math.round(wpm));
}

export function calculateAccuracy(events: KeystrokePayload[]) {
  if (!events.length) return 0;
  
  // Accuracy = (Correct Keystrokes) / (Total Keystrokes)
  // We exclude Backspace from the "correct" count but include it in total if we want strict accuracy,
  // or we can follow Monkeytype: (correct characters) / (total key presses)
  
  const totalKeys = events.length;
  const correctKeys = events.filter(e => e.isMatch && e.key !== "Backspace").length;
  
  return Number(((correctKeys / totalKeys) * 100).toFixed(1));
}

export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((acc, current) => acc + current, 0) / values.length;
}

export function variance(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return average(values.map((value) => (value - mean) ** 2));
}
