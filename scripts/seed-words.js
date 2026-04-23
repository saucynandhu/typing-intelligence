const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const words = [
  "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "practice", "typing", "adaptive",
  "model", "latency", "accuracy", "speed", "focus", "rhythm", "precision", "keyboard", "session", "replay",
  "insight", "profile", "learning", "sequence", "difficulty", "pattern", "response", "stability", "training", "improve"
];

async function main() {
  for (const value of words) {
    await db.word.upsert({
      where: { value },
      update: {},
      create: { value }
    });
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
