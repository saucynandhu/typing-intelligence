const { PrismaClient } = require("@prisma/client");
const { confidenceFromSupport } = require("./utils");

const db = new PrismaClient();

async function run() {
  const skills = await db.wordSkill.findMany({
    orderBy: [{ userId: "asc" }, { wordId: "asc" }]
  });

  for (const skill of skills) {
    const reward =
      (skill.accuracyEma / 100) -
      Math.min(skill.speedMs / 1500, 1) -
      Math.min(skill.stabilityVariance / 5000, 0.2);
    const confidence = confidenceFromSupport(skill.attempts);

    await db.banditWordState.upsert({
      where: { userId_wordId: { userId: skill.userId, wordId: skill.wordId } },
      update: {
        pulls: skill.attempts,
        avgReward: Number(reward.toFixed(6)),
        confidence
      },
      create: {
        userId: skill.userId,
        wordId: skill.wordId,
        pulls: skill.attempts,
        avgReward: Number(reward.toFixed(6)),
        confidence
      }
    });
  }
}

run()
  .catch((error) => {
    console.error("bandit-update-failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
