"use client";

import { useMemo, useState } from "react";
import { calculateAccuracy, calculateWpm } from "@/lib/metrics";
import type { KeystrokePayload } from "@/lib/types";

const DEFAULT_WORDS = "quick brown fox jumps over the lazy dog adaptive typing engine smart model".split(" ");

export function TypingTest() {
  const [words] = useState(DEFAULT_WORDS);
  const expected = useMemo(() => words.join(" "), [words]);
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<KeystrokePayload[]>([]);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);

  function onType(value: string) {
    const now = Date.now();
    if (startTs === null) setStartTs(now);

    const index = Math.max(value.length - 1, 0);
    const typedChar = value[index] ?? "";
    const expectedChar = expected[index] ?? "";
    const wordIndex = value.slice(0, index).split(" ").length - 1;
    const charIndex = index;

    const event: KeystrokePayload = {
      key: typedChar,
      timestamp: now,
      expectedChar,
      isMatch: typedChar === expectedChar,
      interKeyDelayMs: lastTs ? now - lastTs : 0,
      usedCorrection: value.length < input.length,
      wordIndex,
      charIndex
    };

    setInput(value);
    setEvents((current) => [...current, event]);
    setLastTs(now);

    if (value.length >= expected.length && startTs !== null) {
      const duration = now - startTs;
      setResult({
        wpm: calculateWpm(value.length, duration),
        accuracy: calculateAccuracy([...events, event])
      });
    }
  }

  const elapsed = startTs ? Date.now() - startTs : 0;
  const liveWpm = calculateWpm(input.length, elapsed);
  const liveAccuracy = calculateAccuracy(events);

  return (
    <main>
      <h1>Typing Intelligence</h1>
      <div className="card">
        <p><strong>Target:</strong> {expected}</p>
        <p><strong>Progress:</strong> {input.length}/{expected.length} chars</p>
        <p><strong>Live WPM:</strong> {liveWpm}</p>
        <p><strong>Live Accuracy:</strong> {liveAccuracy}%</p>
        <textarea
          value={input}
          onChange={(event) => onType(event.target.value)}
          rows={6}
          style={{ width: "100%" }}
          placeholder="Start typing..."
        />
      </div>
      {result && (
        <div className="card">
          <h2>Session Summary</h2>
          <p>Final WPM: {result.wpm}</p>
          <p>Final Accuracy: {result.accuracy}%</p>
          <p>Captured events: {events.length}</p>
        </div>
      )}
    </main>
  );
}
