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
  const currentAccuracy = parseFloat(searchParams.get("accuracy") || "100");
  const currentWpm = parseFloat(searchParams.get("wpm") || "0");

  if (!userId) {
    const fallback = await db.word.findMany({ take: 20, orderBy: { id: "asc" } });
    return NextResponse.json({ words: fallback.map((word) => word.value) });
  }

  const skills = await db.wordSkill.findMany({
    where: { userId },
    include: { word: true }
  });

  // If we have no skills yet, try to find a similar user
  if (!skills.length) {
    // ... similarity logic ...
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
            diagnostics: {
              strategy: "similar-user",
              sourceUserId: mostSimilar.userId,
              similarity: Number(mostSimilar.score.toFixed(4)),
              currentAccuracy,
              currentWpm
            }
          });
        }
      }
    }

    const fallback = await db.word.findMany({ take: 20, orderBy: { id: "asc" } });
    return NextResponse.json({
      words: fallback.map((word) => word.value),
      diagnostics: { 
        strategy: "default-word-list",
        currentAccuracy,
        currentWpm
      }
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
    .sort((a, b) => b.difficulty - a.difficulty);

  // Phase 8: Real-time adaptation logic
  // If performance is struggling, mix in easier words
  let selection;
  if (currentAccuracy < 85) {
    // Struggling: Take 5 hard, 15 easy/medium
    const hard = ranked.slice(0, 5);
    const easier = ranked.slice(5).sort(() => 0.5 - Math.random()).slice(0, 15);
    selection = [...hard, ...easier].sort(() => 0.5 - Math.random());
  } else if (currentAccuracy > 95) {
    // Crushing it: Take top 20 hardest
    selection = ranked.slice(0, 20);
  } else {
    // Normal: Take top 40 and sample 20
    selection = ranked.slice(0, 40).sort(() => 0.5 - Math.random()).slice(0, 20);
  }

  // Fallback if we don't have enough words in the model yet
  if (selection.length < 10) {
    const extras = await db.word.findMany({ 
      where: { value: { notIn: selection.map(s => s.word) } },
      take: 20 - selection.length 
    });
    selection = [...selection, ...extras.map(e => ({ word: e.value, difficulty: 0, confidence: 0 }))];
  }

  return NextResponse.json({
    words: selection.map((entry) => entry.word),
    diagnostics: {
      currentAccuracy,
      currentWpm,
      strategy: currentAccuracy < 85 ? "recovery" : (currentAccuracy > 95 ? "challenge" : "balanced"),
      topDifficulties: selection.slice(0, 3).map(s => ({ word: s.word, diff: s.difficulty }))
    }
  });
}
