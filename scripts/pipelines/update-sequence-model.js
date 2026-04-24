const { PrismaClient } = require("@prisma/client");
const { average, variance, confidenceFromSupport, cleanSessionEvents, toMsTimestamp } = require("./utils");

const db = new PrismaClient();
const SMOOTHING_ALPHA = 1;
const MIN_SUPPORT = 3;

function buildSequences(events, width) {
  const entries = [];
  for (let index = width - 1; index < events.length; index += 1) {
    const window = events.slice(index - (width - 1), index + 1);
    const sequence = window.map((event) => event.expectedChar || "").join("");
    if (!sequence.trim()) continue;

    const current = window[window.length - 1];
    const previous = window[window.length - 2] ?? current;
    const delay = current.interKeyDelayMs || Math.max(0, toMsTimestamp(current.timestamp) - toMsTimestamp(previous.timestamp));
    entries.push({
      sequence: sequence.toLowerCase(),
      isError: !current.isMatch,
      delay
    });
  }
  return entries;
}

async function run() {
  const sessions = await db.typingSession.findMany({
    where: { userId: { not: null } },
    include: { events: true },
    orderBy: { startedAt: "asc" }
  });

  const aggregate = new Map();
  for (const session of sessions) {
    if (!session.userId) continue;
    const events = cleanSessionEvents(session);
    if (events.length < 2) continue;

    const sequenceEvents = [...buildSequences(events, 2), ...buildSequences(events, 3)];
    for (const item of sequenceEvents) {
      const key = `${session.userId}::${item.sequence}`;
      const bucket = aggregate.get(key) || {
        userId: session.userId,
        sequence: item.sequence,
        support: 0,
        errorCount: 0,
        delays: []
      };

      bucket.support += 1;
      if (item.isError) bucket.errorCount += 1;
      bucket.delays.push(item.delay);
      aggregate.set(key, bucket);
    }
  }

  for (const item of aggregate.values()) {
    if (item.support < MIN_SUPPORT) continue;

    const smoothedError = (item.errorCount + SMOOTHING_ALPHA) / (item.support + 2 * SMOOTHING_ALPHA);
    const meanDelay = average(item.delays);
    const delayVariance = variance(item.delays);
    const confidence = confidenceFromSupport(item.support);
    const encodedAvgDelay = Number((meanDelay + delayVariance / 1000 + confidence).toFixed(4));

    await db.sequenceStat.upsert({
      where: { userId_sequence: { userId: item.userId, sequence: item.sequence } },
      update: {
        errorFrequency: Number(smoothedError.toFixed(6)),
        avgDelayMs: encodedAvgDelay
      },
      create: {
        userId: item.userId,
        sequence: item.sequence,
        errorFrequency: Number(smoothedError.toFixed(6)),
        avgDelayMs: encodedAvgDelay
      }
    });
  }
}

run()
  .catch((error) => {
    console.error("sequence-model-failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
