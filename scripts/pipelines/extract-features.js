const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function run() {
  const sessions = await db.typingSession.findMany({ include: { events: true } });
  for (const session of sessions) {
    const delays = session.events.map((e) => e.interKeyDelayMs || 0).filter((v) => v > 0);
    const avg = delays.length ? delays.reduce((a,b) => a + b, 0) / delays.length : 0;
    const variance = delays.length ? delays.reduce((acc, v) => acc + (v - avg) ** 2, 0) / delays.length : 0;
    const errors = session.events.filter((e) => !e.isMatch).length;
    await db.sessionFeature.upsert({
      where: { sessionId: session.id },
      update: { avgWpm: session.totalWpm || 0, wpmVariance: variance, avgHesitationMs: avg, errorRate: session.events.length ? errors / session.events.length : 0, bigramLatencyJson: {} },
      create: { sessionId: session.id, avgWpm: session.totalWpm || 0, wpmVariance: variance, avgHesitationMs: avg, errorRate: session.events.length ? errors / session.events.length : 0, bigramLatencyJson: {} }
    });
  }
}

run().finally(() => db.());
