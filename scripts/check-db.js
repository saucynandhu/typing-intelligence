const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function check() {
  const sessionCount = await db.typingSession.count();
  const wordSkillCount = await db.wordSkill.count();
  const userCount = await db.typingSession.groupBy({ by: ['userId'] });
  const firstSession = await db.typingSession.findFirst({ orderBy: { startedAt: 'desc' } });
  
  console.log({ 
    sessionCount, 
    wordSkillCount, 
    uniqueUserIdsInSessions: userCount.map(u => u.userId),
    latestSessionUserId: firstSession?.userId
  });
}

check().catch(console.error).finally(() => db.$disconnect());
