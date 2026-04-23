import test from "node:test";
import assert from "node:assert/strict";

function calculateWpm(charsTyped, elapsedMs) {
  if (elapsedMs <= 0) return 0;
  return Number((((charsTyped / 5) * 60000) / elapsedMs).toFixed(2));
}

function calculateAccuracy(events) {
  if (!events.length) return 0;
  const matches = events.filter((event) => event.isMatch).length;
  return Number(((matches / events.length) * 100).toFixed(2));
}

function variance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
}

test("calculateWpm returns expected value", () => {
  const wpm = calculateWpm(250, 60000);
  assert.equal(wpm, 50);
});

test("calculateAccuracy handles matches", () => {
  const accuracy = calculateAccuracy([
    { isMatch: true },
    { isMatch: false },
    { isMatch: true }
  ]);
  assert.equal(accuracy, 66.67);
});

test("variance computes spread", () => {
  const spread = variance([100, 120, 130, 110]);
  assert.ok(spread > 0);
});
