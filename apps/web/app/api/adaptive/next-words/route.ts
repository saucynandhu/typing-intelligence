import { db } from "@/lib/db";
import { computeConfidence, computeDifficulty } from "@/lib/adaptive";
import { NextResponse } from "next/server";

function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value ** 2, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value ** 2, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

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

  if (!skills.length) {
    const embeddings = await db.userEmbedding.findMany();
    if (embeddings.length > 1) {
      const target = embeddings.find((entry) => entry.userId === userId);
      if (target) {
        const sourceVector = ((target.vector as { normalized?: number[]; raw?: number[] })?.normalized ||
          (target.vector as { normalized?: number[]; raw?: number[] })?.raw ||
          []) as number[];

        const mostSimilar = embeddings
          .filter((entry) => entry.userId !== userId)
          .map((entry) => {
            const vector = ((entry.vector as { normalized?: number[]; raw?: number[] })?.normalized ||
              (entry.vector as { normalized?: number[]; raw?: number[] })?.raw ||
              []) as number[];
            return { userId: entry.userId, score: cosineSimilarity(sourceVector, vector) };
          })
          .sort((a, b) => b.score - a.score)[0];

        if (mostSimilar?.userId) {
          const borrowed = await db.wordSkill.findMany({
            where: { userId: mostSimilar.userId },
            include: { word: true },
            orderBy: { difficultyScore: "desc" },
            take: 20
          });
          return NextResponse.json({
            words: borrowed.map((entry) => entry.word.value),
            fallback: {
              strategy: "similar-user",
              sourceUserId: mostSimilar.userId,
              similarity: Number(mostSimilar.score.toFixed(4))
            }
          });
        }
      }
    }

    const fallback = await db.word.findMany({ take: 20, orderBy: { id: "asc" } });
    return NextResponse.json({
      words: fallback.map((word) => word.value),
      fallback: { strategy: "default-word-list" }
    });
  }

  const ranked = skills
    .map((skill) => ({
      word: skill.word.value,
      confidence: computeConfidence(skill.attempts),
      difficulty: computeDifficulty({
        accuracyEma: skill.accuracyEma,
        avgTimeMs: skill.speedMs,
        varianceMs: skill.stabilityVariance,
        attempts: skill.attempts
      })
    }))
    .filter((entry) => entry.confidence >= 0.2)
    .sort((a, b) => b.difficulty - a.difficulty);

  return NextResponse.json({
    words: ranked.slice(0, 20).map((entry) => entry.word),
    diagnostics: ranked.slice(0, 5)
  });
}
