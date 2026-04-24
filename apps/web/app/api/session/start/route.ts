import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = body.userId || null;

  // Create the session
  const session = await db.typingSession.create({
    data: {
      userId,
      promptWords: [] // Will be populated by the first fetch or a default
    }
  });

  // Fetch initial adaptive words if userId is provided
  let words: string[] = [];
  let strategy = "default";
  
  if (userId) {
    const skills = await db.wordSkill.findMany({ where: { userId } });
    if (skills.length > 0) {
      // For simplicity in the start route, just get some words the user has practiced
      const practiced = await db.wordSkill.findMany({
        where: { userId },
        include: { word: true },
        take: 40,
        orderBy: { difficultyScore: "desc" }
      });
      words = practiced.map(p => p.word.value);
      strategy = "adaptive-start";
    }
  }

  if (words.length < 20) {
    const fallback = await db.word.findMany({ take: 40, orderBy: { id: "asc" } });
    words = fallback.map(w => w.value);
    strategy = "default-start";
  }

  // Update session with the actual words used
  await db.typingSession.update({
    where: { id: session.id },
    data: { promptWords: words }
  });

  return NextResponse.json({
    sessionId: session.id,
    words,
    strategy
  });
}
