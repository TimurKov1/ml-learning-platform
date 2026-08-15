import { describe, expect, it } from "vitest";
import { runPythonChecks } from "./pythonCodeRunner";

describe("runPythonChecks", () => {
  const tests = `
def test_double():
    assert solution(2) == 4

def test_negative():
    assert solution(-3) == -6
`;

  it("approves a Python solution when every test passes", async () => {
    const result = await runPythonChecks("def solution(x):\n    return x * 2", tests);
    expect(result.passed).toBe(true);
    expect(result.tests).toEqual([{ name: "test_double", passed: true }, { name: "test_negative", passed: true }]);
  });

  it("reports the failed test without approving the solution", async () => {
    const result = await runPythonChecks("def solution(x):\n    return x", tests);
    expect(result.passed).toBe(false);
    expect(result.tests).toHaveLength(2);
    expect(result.tests.some(test => !test.passed)).toBe(true);
  });

  it("rejects unsafe Python imports", async () => {
    const result = await runPythonChecks("import os\ndef solution(x):\n    return x", tests);
    expect(result.passed).toBe(false);
    expect(result.error).toContain("недоступные");
  });
});
