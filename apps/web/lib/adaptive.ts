type WordSkill = {
  accuracyEma: number;
  avgTimeMs: number;
  varianceMs: number;
  attempts: number;
};

export function computeDifficulty(skill: WordSkill) {
  const accuracyPenalty = 100 - skill.accuracyEma;
  const speedPenalty = Math.min(skill.avgTimeMs / 10, 100);
  const stabilityPenalty = Math.min(skill.varianceMs / 10, 100);
  return Number((accuracyPenalty * 0.5 + speedPenalty * 0.3 + stabilityPenalty * 0.2).toFixed(2));
}

export function computeConfidence(attempts: number) {
  return Number(Math.min(1, attempts / 30).toFixed(4));
}

export function scoreComponents(skill: WordSkill) {
  const accuracyPenalty = 100 - skill.accuracyEma;
  const speedPenalty = Math.min(skill.avgTimeMs / 10, 100);
  const stabilityPenalty = Math.min(skill.varianceMs / 10, 100);

  return {
    accuracyPenalty: Number(accuracyPenalty.toFixed(2)),
    speedPenalty: Number(speedPenalty.toFixed(2)),
    stabilityPenalty: Number(stabilityPenalty.toFixed(2))
  };
}

export function ucbScore(avgReward: number, totalPulls: number, wordPulls: number) {
  if (wordPulls === 0) return Number.MAX_SAFE_INTEGER;
  return avgReward + Math.sqrt((2 * Math.log(Math.max(totalPulls, 1))) / wordPulls);
}
