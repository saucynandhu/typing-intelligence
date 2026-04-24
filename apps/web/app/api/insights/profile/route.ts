import { db } from "@/lib/db";
import { computeConfidence, scoreComponents } from "@/lib/adaptive";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const weakestWords = await db.wordSkill.findMany({
    where: { userId },
    include: { word: true },
    take: 10,
    orderBy: { accuracyEma: "asc" }
  });

  const sequences = await db.sequenceStat.findMany({
    where: { userId },
    take: 10,
    orderBy: { errorFrequency: "desc" }
  });

  return NextResponse.json({
    weakestWords: weakestWords.map((entry) => ({
      word: entry.word.value,
      accuracy: entry.accuracyEma,
      speedMs: entry.speedMs,
      stabilityVariance: entry.stabilityVariance,
      difficultyScore: entry.difficultyScore,
      confidence: computeConfidence(entry.attempts),
      diagnostics: scoreComponents({
        accuracyEma: entry.accuracyEma,
        avgTimeMs: entry.speedMs,
        varianceMs: entry.stabilityVariance,
        attempts: entry.attempts
      })
    })),
    weakSequences: sequences.map((entry) => {
      const supportProxy = Math.max(1, Math.round(entry.avgDelayMs / 20));
      return {
        sequence: entry.sequence,
        errorFrequency: entry.errorFrequency,
        avgDelayMs: entry.avgDelayMs,
        confidence: computeConfidence(supportProxy)
      };
    }),
    thresholds: {
      minWordAttemptsForTrustedScore: 10,
      minSequenceSupportForTrustedScore: 3
    }
  });
}
