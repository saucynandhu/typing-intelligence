import test from "node:test";
import assert from "node:assert";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

test("Phase 8: Real-time Adaptive Session Flow", async (t) => {
  let sessionId;
  const userId = "test_user_phase_8";

  await t.test("1. Start Session", async () => {
    const res = await fetch(`${BASE_URL}/api/session/start`, { method: "POST" });
    const data = await res.json();
    assert.ok(data.sessionId, "Should return a sessionId");
    assert.ok(Array.isArray(data.words), "Should return initial words");
    sessionId = data.sessionId;
  });

  await t.test("2. Simulate Low Accuracy and check adaptive strategy", async () => {
    const res = await fetch(`${BASE_URL}/api/adaptive/next-words?userId=${userId}&accuracy=50&wpm=10`);
    const data = await res.json();
    assert.ok(data.diagnostics, "Should return diagnostics");
    // Since this user is new, it will be 'default-word-list' or 'similar-user'
    // but diagnostics should be present
    assert.ok(data.diagnostics.strategy, "Should have a strategy");
    assert.strictEqual(data.diagnostics.currentAccuracy, 50);
  });

  await t.test("3. Simulate High Accuracy and check adaptive strategy", async () => {
    const res = await fetch(`${BASE_URL}/api/adaptive/next-words?userId=${userId}&accuracy=98&wpm=80`);
    const data = await res.json();
    assert.ok(data.diagnostics, "Should return diagnostics");
    assert.strictEqual(data.diagnostics.currentAccuracy, 98);
  });

  await t.test("4. Finish Session", async () => {
    const res = await fetch(`${BASE_URL}/api/session/finish`, {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        wpm: 75,
        accuracy: 95,
        durationMs: 60000
      })
    });
    const data = await res.json();
    assert.ok(data.session.finishedAt, "Session should be marked as finished");
  });
});
