const MODEL_VERSION = "ml-v2";

function toMsTimestamp(value) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

function sortEvents(events) {
  return [...events].sort((a, b) => toMsTimestamp(a.timestamp) - toMsTimestamp(b.timestamp));
}

function isValidEvent(event) {
  if (!event) return false;
  if (typeof event.wordIndex !== "number" || event.wordIndex < 0) return false;
  if (typeof event.charIndex !== "number" || event.charIndex < 0) return false;
  if (typeof event.isMatch !== "boolean") return false;
  if (toMsTimestamp(event.timestamp) <= 0) return false;
  return true;
}

function cleanSessionEvents(session) {
  const validEvents = sortEvents(session.events).filter(isValidEvent);
  if (!validEvents.length) return [];

  let previousTs = 0;
  return validEvents.filter((event) => {
    const ts = toMsTimestamp(event.timestamp);
    if (ts < previousTs) return false;
    previousTs = ts;
    return true;
  });
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return average(values.map((value) => (value - mean) ** 2));
}

function confidenceFromSupport(support) {
  return Number(Math.min(1, support / 30).toFixed(4));
}

function dayDecayFactor(daysAgo, halfLifeDays) {
  return Math.exp((-Math.log(2) * daysAgo) / halfLifeDays);
}

function modelMetadata(sourceWindowStart, sourceWindowEnd) {
  return {
    modelVersion: MODEL_VERSION,
    computedAt: new Date().toISOString(),
    sourceWindow: {
      start: sourceWindowStart.toISOString(),
      end: sourceWindowEnd.toISOString()
    }
  };
}

module.exports = {
  MODEL_VERSION,
  average,
  variance,
  confidenceFromSupport,
  dayDecayFactor,
  cleanSessionEvents,
  modelMetadata,
  toMsTimestamp
};
