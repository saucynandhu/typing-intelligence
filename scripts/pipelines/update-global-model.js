const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value ** 2, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value ** 2, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

async function run() {
  const users = await db.wordSkill.groupBy({
    by: ["userId"],
    _avg: { accuracyEma: true, speedMs: true, stabilityVariance: true }
  });

  for (const user of users) {
    const vector = [user._avg.accuracyEma || 0, user._avg.speedMs || 0, user._avg.stabilityVariance || 0];
    await db.userEmbedding.upsert({
      where: { userId: user.userId },
      update: { vector },
      create: { userId: user.userId, vector }
    });
  }

  const embeddings = await db.userEmbedding.findMany();
  if (embeddings.length > 1) {
    const source = embeddings[0];
    const similar = embeddings
      .slice(1)
      .map((entry) => ({ userId: entry.userId, score: cosineSimilarity(source.vector, entry.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    console.log(`Top similarities for ${source.userId}:`, similar);
  }
}

run().finally(() => db.$disconnect());
