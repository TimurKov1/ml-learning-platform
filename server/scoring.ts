export function normalizeAwardedScore(score: number, maxScore: number) {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return Math.min(maxScore, Math.max(0, Math.round(score)));
}

export function calculateScoreProgress(earnedScore: number, maxScore: number) {
  const safeMax = Math.max(0, maxScore);
  const safeEarned = Math.min(safeMax, Math.max(0, earnedScore));
  return safeMax === 0 ? 100 : Math.round((safeEarned / safeMax) * 100);
}

export function aggregateScores(scores: number[], maxScores: number[]) {
  const earnedScore = scores.reduce((sum, score) => sum + Math.max(0, score), 0);
  const maxScore = maxScores.reduce((sum, score) => sum + Math.max(0, score), 0);
  return { earnedScore, maxScore, progressPercent: calculateScoreProgress(earnedScore, maxScore) };
}
