const { PrismaClient } = require("@prisma/client");
const { average, variance, cleanSessionEvents, modelMetadata, toMsTimestamp } = require("./utils");

const db = new PrismaClient();

function bigramLatency(events) {
  const map = new Map();
  for (let index = 1; index < events.length; index += 1) {
    const previous = events[index - 1];
    const current = events[index];
    const pair = `${previous.expectedChar}${current.expectedChar}`;
    const delay = current.interKeyDelayMs || Math.max(0, toMsTimestamp(current.timestamp) - toMsTimestamp(previous.timestamp));
    if (!pair.trim()) continue;
    const bucket = map.get(pair) || [];
    bucket.push(delay);
    map.set(pair, bucket);
  }

  const output = {};
  for (const [pair, delays] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    output[pair] = {
      avgDelayMs: Number(average(delays).toFixed(4)),
      varianceMs: Number(variance(delays).toFixed(4)),
      support: delays.length
    };
  }
  return output;
}

async function run() {
  const sourceWindowStart = new Date();
  const sessions = await db.typingSession.findMany({
    include: { events: true },
    orderBy: { startedAt: "asc" }
  });

  for (const session of sessions) {
    const events = cleanSessionEvents(session);
    if (!events.length) continue;

    const delays = events.map((event) => event.interKeyDelayMs || 0).filter((value) => value > 0);
    const errors = events.filter((event) => !event.isMatch).length;
    const hesitationByWord = {};
    for (const event of events) {
      const key = String(event.wordIndex);
      hesitationByWord[key] = hesitationByWord[key] || [];
      if (event.interKeyDelayMs && event.interKeyDelayMs > 0) {
        hesitationByWord[key].push(event.interKeyDelayMs);
      }
    }

    const hesitationSummary = {};
    for (const [wordIndex, samples] of Object.entries(hesitationByWord)) {
      hesitationSummary[wordIndex] = Number(average(samples).toFixed(4));
    }

    const metadata = modelMetadata(sourceWindowStart, new Date());
    await db.sessionFeature.upsert({
      where: { sessionId: session.id },
      update: {
        avgWpm: session.totalWpm || 0,
        wpmVariance: Number(variance(delays).toFixed(4)),
        avgHesitationMs: Number(average(delays).toFixed(4)),
        errorRate: Number((events.length ? errors / events.length : 0).toFixed(6)),
        bigramLatencyJson: {
          ...metadata,
          hesitationByWordMs: hesitationSummary,
          bigrams: bigramLatency(events)
        }
      },
      create: {
        sessionId: session.id,
        avgWpm: session.totalWpm || 0,
        wpmVariance: Number(variance(delays).toFixed(4)),
        avgHesitationMs: Number(average(delays).toFixed(4)),
        errorRate: Number((events.length ? errors / events.length : 0).toFixed(6)),
        bigramLatencyJson: {
          ...metadata,
          hesitationByWordMs: hesitationSummary,
          bigrams: bigramLatency(events)
        }
      }
    });
  }
}

run()
  .catch((error) => {
    console.error("feature-extraction-failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
