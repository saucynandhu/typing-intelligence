const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function run() {
  const skills = await db.wordSkill.findMany();
  for (const skill of skills) {
    const reward = (skill.accuracyEma / 100) - Math.min(skill.speedMs / 1500, 1);
    await db.banditWordState.upsert({
      where: { userId_wordId: { userId: skill.userId, wordId: skill.wordId } },
      update: {
        pulls: { increment: 1 },
        avgReward: reward
      },
      create: {
        userId: skill.userId,
        wordId: skill.wordId,
        pulls: 1,
        avgReward: reward,
        confidence: 1
      }
    });
  }
}

run().finally(() => db.$disconnect());
