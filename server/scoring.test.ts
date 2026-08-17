import { describe, expect, it } from "vitest";
import { aggregateScores, calculateLessonProgress, calculateScoreProgress, needsResubmission, nextAttemptNumber, normalizeAwardedScore, shouldNotifyForSubmission } from "./scoring";

describe("score calculations", () => {
  it("clamps an awarded manual score to 0..maxScore", () => {
    expect(normalizeAwardedScore(14, 10)).toBe(10);
    expect(normalizeAwardedScore(-2, 10)).toBe(0);
    expect(normalizeAwardedScore(7.6, 10)).toBe(8);
  });

  it("calculates lesson progress from earned points, not task count", () => {
    expect(calculateScoreProgress(5, 10)).toBe(50);
    expect(calculateScoreProgress(10, 10)).toBe(100);
    expect(calculateScoreProgress(0, 0)).toBe(100);
  });

  it("completes an empty lesson only after it is viewed", () => {
    expect(calculateLessonProgress(0, false, 0, 0)).toBe(0);
    expect(calculateLessonProgress(0, true, 0, 0)).toBe(100);
    expect(calculateLessonProgress(2, false, 5, 10)).toBe(50);
  });

  it("increments the attempt number for repeat submissions", () => {
    expect(nextAttemptNumber(undefined)).toBe(1);
    expect(nextAttemptNumber(1)).toBe(2);
    expect(nextAttemptNumber(4)).toBe(5);
  });

  it("notifies only for file submissions", () => {
    expect(shouldNotifyForSubmission("manual_file")).toBe(true);
    expect(shouldNotifyForSubmission("code")).toBe(false);
  });

  it("allows a file resubmission after a partial approval", () => {
    expect(needsResubmission("manual_file", "approved", 7, 10)).toBe(true);
    expect(needsResubmission("manual_file", "approved", 10, 10)).toBe(false);
    expect(needsResubmission("code", "approved", 7, 10)).toBe(false);
  });

  it("aggregates earned and maximum points across assignments", () => {
    expect(aggregateScores([8, 3, 0], [10, 5, 5])).toEqual({ earnedScore: 11, maxScore: 20, progressPercent: 55 });
  });
});
