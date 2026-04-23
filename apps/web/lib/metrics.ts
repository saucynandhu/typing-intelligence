import { KeystrokePayload } from "./types";

export function calculateWpm(charsTyped: number, elapsedMs: number) {
  if (elapsedMs <= 0) return 0;
  return Number((((charsTyped / 5) * 60000) / elapsedMs).toFixed(2));
}

export function calculateAccuracy(events: KeystrokePayload[]) {
  if (!events.length) return 0;
  const matches = events.filter((event) => event.isMatch).length;
  return Number(((matches / events.length) * 100).toFixed(2));
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
