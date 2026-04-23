import { db } from "@/lib/db";
import { computeDifficulty } from "@/lib/adaptive";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    const fallback = await db.word.findMany({ take: 20, orderBy: { id: "asc" } });
    return NextResponse.json({ words: fallback.map((word) => word.value) });
  }

  const skills = await db.wordSkill.findMany({
    where: { userId },
    include: { word: true }
  });

  const ranked = skills
    .map((skill) => ({
      word: skill.word.value,
      difficulty: computeDifficulty({
        accuracyEma: skill.accuracyEma,
        avgTimeMs: skill.speedMs,
        varianceMs: skill.stabilityVariance,
        attempts: skill.attempts
      })
    }))
    .sort((a, b) => b.difficulty - a.difficulty);

  return NextResponse.json({ words: ranked.slice(0, 20).map((entry) => entry.word) });
}
