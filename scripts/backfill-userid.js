const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function backfill() {
  const result = await db.typingSession.updateMany({
    where: { userId: null },
    data: { userId: "user_1" }
  });
  console.log(`Updated ${result.count} sessions with userId 'user_1'`);
}

backfill().catch(console.error).finally(() => db.$disconnect());
