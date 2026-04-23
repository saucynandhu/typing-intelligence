const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function run() {
  const sessions = await db.typingSession.findMany({ where: { userId: { not: null } }, include: { events: true } });
  for (const session of sessions) {
    if (!session.userId) continue;
    const map = new Map();
    for (let i = 1; i < session.events.length; i += 1) {
      const prev = session.events[i - 1];
      const curr = session.events[i];
      const sequence = `${prev.expectedChar}${curr.expectedChar}`;
      const entry = map.get(sequence) || { count: 0, errors: 0, delay: 0 };
      entry.count += 1;
      entry.delay += curr.interKeyDelayMs || 0;
      if (!curr.isMatch) entry.errors += 1;
      map.set(sequence, entry);
    }
    for (const [sequence, value] of map.entries()) {
      const errorFrequency = value.count ? value.errors / value.count : 0;
      const avgDelayMs = value.count ? value.delay / value.count : 0;
      await db.sequenceStat.upsert({
        where: { userId_sequence: { userId: session.userId, sequence } },
        update: { errorFrequency, avgDelayMs },
        create: { userId: session.userId, sequence, errorFrequency, avgDelayMs }
      });
    }
  }
}

run().finally(() => db.$disconnect());
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function run() {
  const sessions = await db.typingSession.findMany({ where: { userId: { not: null } }, include: { events: true } });
  for (const session of sessions) {
    if (!session.userId) continue;
    const map = new Map();
    for (let i = 1; i < session.events.length; i += 1) {
      const prev = session.events[i - 1];
      const curr = session.events[i];
      const sequence = ;
      const entry = map.get(sequence) || { count: 0, errors: 0, delay: 0 };
      entry.count += 1;
      entry.delay += curr.interKeyDelayMs || 0;
      if (!curr.isMatch) entry.errors += 1;
      map.set(sequence, entry);
    }
    for (const [sequence, value] of map.entries()) {
      const errorFrequency = value.count ? value.errors / value.count : 0;
      const avgDelayMs = value.count ? value.delay / value.count : 0;
      await db.sequenceStat.upsert({
        where: { userId_sequence: { userId: session.userId, sequence } },
        update: { errorFrequency, avgDelayMs },
        create: { userId: session.userId, sequence, errorFrequency, avgDelayMs }
      });
    }
  }
}
run().finally(() => db.());
