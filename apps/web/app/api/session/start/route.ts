import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const words = await db.word.findMany({ take: 40, orderBy: { id: "asc" } });
  const session = await db.typingSession.create({
    data: {
      promptWords: words.map((word) => word.value)
    }
  });

  return NextResponse.json({
    sessionId: session.id,
    words: session.promptWords
  });
}
