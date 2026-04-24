"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateAccuracy, calculateWpm } from "@/lib/metrics";
import type { KeystrokePayload } from "@/lib/types";

export function TypingTest() {
  const [userId, setUserId] = useState("user_1"); // Mock userId
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const expected = useMemo(() => words.join(" "), [words]);
  
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<KeystrokePayload[]>([]);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [adaptiveStrategy, setAdaptiveStrategy] = useState<string>("balanced");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [selectedMode, setSelectedMode] = useState<number>(30);
  const [isFinished, setIsFinished] = useState(false);

  const unspentEvents = useRef<KeystrokePayload[]>([]);
  const isFetchingMore = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestStats = useRef({ input: "", events: [] as KeystrokePayload[] });

  // Update latestStats ref on every change to avoid stale closures in timer
  useEffect(() => {
    latestStats.current = { input, events };
  }, [input, events]);

  // Initialize Session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        startSession(selectedMode);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMode]);

  async function startSession(duration: number) {
    setIsFinished(false);
    setResult(null);
    setInput("");
    setEvents([]);
    setStartTs(null);
    setLastTs(null);
    setTimeLeft(duration);
    setSelectedMode(duration);
    unspentEvents.current = [];
    
    const response = await fetch("/api/session/start", { 
      method: "POST",
      body: JSON.stringify({ userId })
    });
    const data = await response.json();
    setSessionId(data.sessionId);
    setWords(data.words || []);
    setAdaptiveStrategy(data.strategy || "balanced");
  }

  useEffect(() => {
    startSession(30);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (startTs && timeLeft > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTs, isFinished]);

  async function handleFinish() {
    setIsFinished(true);
    const now = Date.now();
    const duration = startTs ? now - startTs : 0;
    
    const { input: finalInput, events: finalEvents } = latestStats.current;
    
    // Net WPM: Only count correct characters in the final string
    const correctChars = finalInput.split("").filter((c, i) => c === expected[i]).length;
    const finalWpm = calculateWpm(correctChars, duration);
    const finalAccuracy = calculateAccuracy(finalEvents);
    
    setResult({ wpm: finalWpm, accuracy: finalAccuracy });
    await finishSession(finalWpm, finalAccuracy);
  }

  // Periodic Event Reporting (every 3 seconds or 50 events)
  useEffect(() => {
    if (!sessionId || unspentEvents.current.length === 0) return;

    const interval = setInterval(async () => {
      if (unspentEvents.current.length === 0) return;
      
      setIsSyncing(true);
      const batch = [...unspentEvents.current];
      unspentEvents.current = [];

      try {
        await fetch("/api/session/events", {
          method: "POST",
          body: JSON.stringify({ sessionId, events: batch })
        });
      } catch (err) {
        console.error("Failed to sync events", err);
        unspentEvents.current = [...batch, ...unspentEvents.current];
      } finally {
        setIsSyncing(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const liveCorrectChars = input.split("").filter((c, i) => c === expected[i]).length;
  const liveWpm = calculateWpm(liveCorrectChars, startTs ? Date.now() - startTs : 0);
  const liveAccuracy = calculateAccuracy(events);

  // Dynamic Word Injection
  async function fetchMoreWords() {
    if (isFetchingMore.current || !userId) return;
    isFetchingMore.current = true;

    try {
      const response = await fetch(
        `/api/adaptive/next-words?userId=${userId}&accuracy=${liveAccuracy}&wpm=${liveWpm}`
      );
      const data = await response.json();
      setWords((curr) => [...curr, ...data.words]);
      setAdaptiveStrategy(data.diagnostics?.strategy || "balanced");
    } finally {
      isFetchingMore.current = false;
    }
  }

  async function finishSession(finalWpm: number, finalAccuracy: number) {
    if (!sessionId) return;
    
    // Send any remaining events first
    if (unspentEvents.current.length > 0) {
      await fetch("/api/session/events", {
        method: "POST",
        body: JSON.stringify({ sessionId, events: unspentEvents.current })
      });
      unspentEvents.current = [];
    }

    await fetch("/api/session/finish", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        wpm: finalWpm,
        accuracy: finalAccuracy,
        durationMs: startTs ? Date.now() - startTs : 0
      })
    });
  }

  function onType(value: string) {
    if (isFinished) return;
    const now = Date.now();
    if (startTs === null) setStartTs(now);

    const isBackspace = value.length < input.length;
    const index = isBackspace ? input.length - 1 : Math.max(value.length - 1, 0);
    const typedChar = isBackspace ? "Backspace" : (value[index] ?? "");
    const expectedChar = expected[index] ?? "";
    
    // Simple word index calculation
    const wordIndex = value.slice(0, index).split(" ").length - 1;
    const charIndex = index;

    const event: KeystrokePayload = {
      key: typedChar,
      timestamp: now,
      expectedChar,
      isMatch: typedChar === expectedChar,
      interKeyDelayMs: lastTs ? now - lastTs : 0,
      usedCorrection: isBackspace,
      wordIndex,
      charIndex
    };

    setInput(value);
    setEvents((current) => [...current, event]);
    unspentEvents.current.push(event);
    setLastTs(now);

    // Trigger more words when 10 words from the end for smoother infinite scrolling
    const currentWordCount = value.split(" ").length;
    if (words.length - currentWordCount < 10) {
      fetchMoreWords();
    }
  }

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", color: "var(--sub-color)" }}>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[15, 30, 60].map((mode) => (
            <button
              key={mode}
              onClick={() => startSession(mode)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: selectedMode === mode ? "var(--main-color)" : "inherit",
                fontSize: "1rem",
                transition: "color 0.2s",
                fontFamily: "var(--font-family)"
              }}
            >
              {mode}s
            </button>
          ))}
        </div>
        <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
          <p>Session: {sessionId?.slice(0, 8)}... {isSyncing ? " (syncing...)" : ""}</p>
          <p>Strategy: <span style={{ color: adaptiveStrategy === "challenge" ? "var(--error-color)" : (adaptiveStrategy === "recovery" ? "#91d18b" : "var(--main-color)") }}>{adaptiveStrategy}</span></p>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: "2rem" }}>
        <div style={{ fontSize: "2rem", color: "var(--main-color)", marginBottom: "1rem", opacity: startTs ? 1 : 0 }}>
          {timeLeft}s
        </div>

        <div 
          onClick={() => document.getElementById("typing-input")?.focus()}
          style={{ 
            fontSize: "1.5rem", 
            lineHeight: "2.5rem", 
            color: "var(--sub-color)", 
            position: "relative",
            minHeight: "10rem",
            cursor: "text",
            outline: "none",
            userSelect: "none",
            wordBreak: "break-word"
          }}
        >
          {words.map((word, wordIdx) => {
            const currentWordIdx = input.split(" ").length - 1;
            const isCurrent = wordIdx === currentWordIdx;
            const typedWords = input.split(" ");
            const typedWord = typedWords[wordIdx] || "";
            
            return (
              <span key={wordIdx} style={{ 
                marginRight: "0.6rem",
                display: "inline-block",
                position: "relative",
              }}>
                {word.split("").map((char, charIdx) => {
                  let color = "inherit";
                  const isCharCurrent = isCurrent && charIdx === typedWord.length;
                  
                  if (wordIdx < currentWordIdx) {
                    color = "var(--text-color)";
                  } else if (isCurrent) {
                    if (charIdx < typedWord.length) {
                      color = typedWord[charIdx] === char ? "var(--text-color)" : "var(--error-color)";
                    }
                  }

                  return (
                    <span key={charIdx} style={{ position: "relative", color }}>
                      {char}
                      {isCharCurrent && !isFinished && (
                        <div style={{
                          position: "absolute",
                          left: 0,
                          bottom: "0.2rem",
                          width: "2px",
                          height: "1.5rem",
                          background: "var(--main-color)",
                          animation: "blink 1s infinite"
                        }} />
                      )}
                    </span>
                  );
                })}
                {/* Handle extra characters in typed word */}
                {isCurrent && typedWord.length > word.length && (
                  <span style={{ color: "var(--error-color)", opacity: 0.8, position: "relative" }}>
                    {typedWord.slice(word.length)}
                    {!isFinished && (
                      <div style={{
                        position: "absolute",
                        right: 0,
                        bottom: "0.2rem",
                        width: "2px",
                        height: "1.5rem",
                        background: "var(--main-color)",
                        animation: "blink 1s infinite"
                      }} />
                    )}
                  </span>
                )}
                {/* Space cursor */}
                {isCurrent && typedWord.length === 0 && wordIdx > 0 && (
                   <div style={{
                    position: "absolute",
                    left: "-0.3rem",
                    bottom: "0.2rem",
                    width: "2px",
                    height: "1.5rem",
                    background: "var(--main-color)",
                    animation: "blink 1s infinite"
                  }} />
                )}
              </span>
            );
          })}
          
          <textarea
            id="typing-input"
            value={input}
            onChange={(event) => onType(event.target.value)}
            disabled={isFinished}
            autoFocus
            style={{ 
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              left: 0,
              top: 0
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem", color: "var(--sub-color)" }}>
        <div className="stat">
          <label style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>wpm</label>
          <div style={{ fontSize: "2.5rem", color: "var(--text-color)" }}>{liveWpm}</div>
        </div>
        <div className="stat">
          <label style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>acc</label>
          <div style={{ fontSize: "2.5rem", color: "var(--text-color)" }}>{liveAccuracy}%</div>
        </div>
        <div className="stat">
          <label style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>words</label>
          <div style={{ fontSize: "2.5rem", color: "var(--text-color)" }}>{words.length}</div>
        </div>
      </div>

      {result && (
        <div style={{ 
          marginTop: "3rem", 
          padding: "3rem", 
          background: "#2c2e31", 
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <h2 style={{ color: "var(--main-color)", marginBottom: "2rem", fontSize: "2rem" }}>Session Summary</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "5rem" }}>
            <div>
              <div style={{ fontSize: "1.2rem", color: "var(--sub-color)", textTransform: "uppercase" }}>wpm</div>
              <div style={{ fontSize: "4rem", color: "var(--main-color)", fontWeight: "bold" }}>{result.wpm}</div>
            </div>
            <div>
              <div style={{ fontSize: "1.2rem", color: "var(--sub-color)", textTransform: "uppercase" }}>accuracy</div>
              <div style={{ fontSize: "4rem", color: "var(--main-color)", fontWeight: "bold" }}>{result.accuracy}%</div>
            </div>
          </div>
          <button 
            onClick={() => startSession(selectedMode)}
            style={{
              marginTop: "3rem",
              padding: "0.8rem 3rem",
              background: "var(--main-color)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#323437",
              fontSize: "1.1rem",
              fontFamily: "var(--font-family)",
              transition: "transform 0.1s"
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Restart (Tab + Enter)
          </button>
        </div>
      )}
    </main>
  );
}
