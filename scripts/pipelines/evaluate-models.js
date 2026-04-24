const { PrismaClient } = require("@prisma/client");
const { average, variance } = require("./utils");

const db = new PrismaClient();

function rank(values, key) {
  return [...values].sort((a, b) => b[key] - a[key]).map((item, index) => ({ ...item, rank: index + 1 }));
}

async function evaluatePersonalModel() {
  const skills = await db.wordSkill.findMany();
  if (!skills.length) return { coverage: 0, scoreStability: 0 };
  const diffs = skills.map((skill) => skill.difficultyScore);
  return {
    coverage: skills.length,
    scoreStability: Number((1 / (1 + variance(diffs))).toFixed(6))
  };
}

async function evaluateSequenceModel() {
  const sequences = await db.sequenceStat.findMany({ where: { sequence: { not: { startsWith: "word:" } } } });
  if (!sequences.length) return { coverage: 0, calibration: 0 };
  const values = sequences.map((entry) => entry.errorFrequency);
  return {
    coverage: sequences.length,
    calibration: Number((1 - average(values)).toFixed(6))
  };
}

async function evaluateGlobalModel() {
  const embeddings = await db.userEmbedding.findMany();
  if (embeddings.length < 2) return { users: embeddings.length, coldStartLift: 0 };

  const scored = embeddings.map((entry) => ({
    userId: entry.userId,
    magnitude: average((entry.vector.normalized || entry.vector.raw || []).map((value) => Math.abs(value)))
  }));
  const ranked = rank(scored, "magnitude");
  const baseline = average(scored.map((item) => item.magnitude));
  const top = average(ranked.slice(0, Math.min(5, ranked.length)).map((item) => item.magnitude));

  return {
    users: embeddings.length,
    coldStartLift: Number((top - baseline).toFixed(6))
  };
}

async function run() {
  const personal = await evaluatePersonalModel();
  const sequence = await evaluateSequenceModel();
  const global = await evaluateGlobalModel();

  const report = {
    evaluatedAt: new Date().toISOString(),
    personal,
    sequence,
    global
  };

  console.log(JSON.stringify(report, null, 2));
}

run()
  .catch((error) => {
    console.error("evaluation-failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
