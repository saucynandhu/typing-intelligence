const { PrismaClient } = require("@prisma/client");
const { average, modelMetadata } = require("./utils");

const db = new PrismaClient();

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value ** 2, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value ** 2, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

function normalizeColumns(vectors) {
  const columns = vectors[0].length;
  const means = new Array(columns).fill(0);
  const std = new Array(columns).fill(0);

  for (let column = 0; column < columns; column += 1) {
    const values = vectors.map((vector) => vector[column]);
    means[column] = average(values);
    std[column] = Math.sqrt(average(values.map((value) => (value - means[column]) ** 2))) || 1;
  }

  return vectors.map((vector) =>
    vector.map((value, column) => Number(((value - means[column]) / std[column]).toFixed(6)))
  );
}

function reduceToTwoDimensions(vectors) {
  return vectors.map(([a, b, c]) => [Number((0.7 * a + 0.3 * b).toFixed(6)), Number((0.6 * b + 0.4 * c).toFixed(6))]);
}

async function run() {
  const sourceWindowStart = new Date();
  const users = await db.wordSkill.groupBy({
    by: ["userId"],
    _avg: { accuracyEma: true, speedMs: true, stabilityVariance: true }
  });

  const baseVectors = users.map((user) => ({
    userId: user.userId,
    vector: [user._avg.accuracyEma || 0, user._avg.speedMs || 0, user._avg.stabilityVariance || 0]
  }));
  if (!baseVectors.length) return;

  const normalized = normalizeColumns(baseVectors.map((entry) => entry.vector));
  const reduced = reduceToTwoDimensions(normalized);
  const metadata = modelMetadata(sourceWindowStart, new Date());

  for (let index = 0; index < baseVectors.length; index += 1) {
    const user = baseVectors[index];
    const embeddingPayload = {
      ...metadata,
      raw: user.vector,
      normalized: normalized[index],
      reduced2d: reduced[index]
    };

    await db.userEmbedding.upsert({
      where: { userId: user.userId },
      update: { vector: embeddingPayload },
      create: { userId: user.userId, vector: embeddingPayload }
    });
  }

  const embeddings = await db.userEmbedding.findMany();
  if (embeddings.length > 1) {
    const source = embeddings[0];
    const similar = embeddings
      .slice(1)
      .map((entry) => {
        const left = source.vector.normalized || source.vector.raw || [];
        const right = entry.vector.normalized || entry.vector.raw || [];
        return { userId: entry.userId, score: cosineSimilarity(left, right) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    console.log(`Top similarities for ${source.userId}:`, similar);
  }
}

run().finally(() => db.$disconnect());
