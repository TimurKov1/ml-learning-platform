export function normalizeAwardedScore(score: number, maxScore: number) {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return Math.min(maxScore, Math.max(0, Math.round(score)));
}

export function calculateLessonProgress(totalAssignments: number, isViewed: boolean, earnedScore: number, maxScore: number) {
  if (totalAssignments === 0) return isViewed ? 100 : 0;
  return calculateScoreProgress(earnedScore, maxScore);
}

export function calculateScoreProgress(earnedScore: number, maxScore: number) {
  const safeMax = Math.max(0, maxScore);
  const safeEarned = Math.min(safeMax, Math.max(0, earnedScore));
  return safeMax === 0 ? 100 : Math.round((safeEarned / safeMax) * 100);
}

export function nextAttemptNumber(previousAttemptNumber: number | null | undefined) {
  return Math.max(1, (previousAttemptNumber ?? 0) + 1);
}

export function shouldNotifyForSubmission(assignmentType: "manual_file" | "code") {
  return assignmentType === "manual_file";
}

export function needsResubmission(assignmentType: "manual_file" | "code", status: "pending" | "approved" | "revision" | null | undefined, awardedScore: number, maxScore: number) {
  return assignmentType === "manual_file" && status === "approved" && awardedScore < maxScore;
}

export function aggregateScores(scores: number[], maxScores: number[]) {
  const earnedScore = scores.reduce((sum, score) => sum + Math.max(0, score), 0);
  const maxScore = maxScores.reduce((sum, score) => sum + Math.max(0, score), 0);
  return { earnedScore, maxScore, progressPercent: calculateScoreProgress(earnedScore, maxScore) };
}
