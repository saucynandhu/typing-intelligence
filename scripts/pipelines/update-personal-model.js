const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const ALPHA = 0.3;

async function run() {
  const sessions = await db.typingSession.findMany({ where: { userId: { not: null } }, include: { events: true } });
  for (const session of sessions) {
    const byWord = new Map();
    for (const event of session.events) {
      const bucket = byWord.get(event.wordIndex) || { hits: 0, total: 0, delays: [] };
      bucket.total += 1;
      if (event.isMatch) bucket.hits += 1;
      if (event.interKeyDelayMs) bucket.delays.push(event.interKeyDelayMs);
      byWord.set(event.wordIndex, bucket);
    }
    for (const [wordIndex, stats] of byWord.entries()) {
      const word = session.promptWords[wordIndex];
      if (!word || !session.userId) continue;
      const wordRow = await db.word.upsert({ where: { value: word }, update: {}, create: { value: word } });
      const accuracy = (stats.hits / stats.total) * 100;
      const speed = stats.delays.length ? stats.delays.reduce((a,b) => a + b, 0) / stats.delays.length : 0;
      const existing = await db.wordSkill.findUnique({ where: { userId_wordId: { userId: session.userId, wordId: wordRow.id } } });
      const accuracyEma = existing ? ALPHA * accuracy + (1 - ALPHA) * existing.accuracyEma : accuracy;
      await db.wordSkill.upsert({
        where: { userId_wordId: { userId: session.userId, wordId: wordRow.id } },
        update: { accuracyEma, speedMs: speed, attempts: { increment: 1 } },
        create: { userId: session.userId, wordId: wordRow.id, accuracyEma, speedMs: speed, stabilityVariance: 0, attempts: 1 }
      });
    }
  }
}
run().finally(() => db.());
