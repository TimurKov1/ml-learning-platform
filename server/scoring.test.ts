import { describe, expect, it } from "vitest";
import { aggregateScores, calculateScoreProgress, normalizeAwardedScore } from "./scoring";

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

  it("aggregates earned and maximum points across assignments", () => {
    expect(aggregateScores([8, 3, 0], [10, 5, 5])).toEqual({ earnedScore: 11, maxScore: 20, progressPercent: 55 });
  });
});
