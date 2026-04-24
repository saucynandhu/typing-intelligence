const { PrismaClient } = require("@prisma/client");
const { average, variance, dayDecayFactor, cleanSessionEvents } = require("./utils");

const db = new PrismaClient();
const ALPHA = 0.35;
const HALF_LIFE_DAYS = 30;

function difficultyScore({ accuracyEma, speedMs, stabilityVariance }) {
  const accuracyPenalty = 100 - accuracyEma;
  const speedPenalty = Math.min(speedMs / 12, 100);
  const stabilityPenalty = Math.min(stabilityVariance / 8, 100);
  return Number((accuracyPenalty * 0.5 + speedPenalty * 0.3 + stabilityPenalty * 0.2).toFixed(4));
}

async function run() {
  const sessions = await db.typingSession.findMany({
    where: { userId: { not: null } },
    include: { events: true },
    orderBy: { startedAt: "asc" }
  });

  for (const session of sessions) {
    const events = cleanSessionEvents(session);
    if (!events.length || !session.userId) continue;

    const byWord = new Map();
    for (const event of events) {
      const bucket = byWord.get(event.wordIndex) || { hits: 0, total: 0, delays: [], timings: [] };
      bucket.total += 1;
      if (event.isMatch) bucket.hits += 1;
      if (event.interKeyDelayMs) bucket.delays.push(event.interKeyDelayMs);
      bucket.timings.push(Number(event.timestamp));
      byWord.set(event.wordIndex, bucket);
    }

    for (const [wordIndex, stats] of byWord.entries()) {
      const word = session.promptWords[wordIndex];
      if (!word) continue;

      const wordRow = await db.word.upsert({ where: { value: word }, update: {}, create: { value: word } });
      const accuracy = (stats.hits / stats.total) * 100;
      const speed = average(stats.delays);
      const stability = variance(stats.delays);
      const existing = await db.wordSkill.findUnique({ where: { userId_wordId: { userId: session.userId, wordId: wordRow.id } } });

      const daysAgo = Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60 * 24));
      const decay = dayDecayFactor(daysAgo, HALF_LIFE_DAYS);
      const weightedAlpha = ALPHA * decay;
      const accuracyEma = existing ? weightedAlpha * accuracy + (1 - weightedAlpha) * existing.accuracyEma : accuracy;
      const speedMs = existing ? weightedAlpha * speed + (1 - weightedAlpha) * existing.speedMs : speed;
      const stabilityVariance = existing ? weightedAlpha * stability + (1 - weightedAlpha) * existing.stabilityVariance : stability;
      const attempts = (existing?.attempts || 0) + 1;
      const score = difficultyScore({ accuracyEma, speedMs, stabilityVariance });

      await db.wordSkill.upsert({
        where: { userId_wordId: { userId: session.userId, wordId: wordRow.id } },
        update: {
          accuracyEma,
          speedMs,
          stabilityVariance,
          attempts,
          difficultyScore: score
        },
        create: {
          userId: session.userId,
          wordId: wordRow.id,
          accuracyEma,
          speedMs,
          stabilityVariance,
          attempts,
          difficultyScore: score
        }
      });

      // Persist per-run diagnostics for reproducibility and backfill comparisons.
      await db.sequenceStat.upsert({
        where: { userId_sequence: { userId: session.userId, sequence: `word:${word}` } },
        update: {
          errorFrequency: Number((1 - accuracy / 100).toFixed(6)),
          avgDelayMs: Number(speedMs.toFixed(4))
        },
        create: {
          userId: session.userId,
          sequence: `word:${word}`,
          errorFrequency: Number((1 - accuracy / 100).toFixed(6)),
          avgDelayMs: Number(speedMs.toFixed(4))
        }
      });
    }
  }
}

run()
  .catch((error) => {
    console.error("personal-model-failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
