import { describe, expect, it } from "vitest";
import { buildPythonTestCode, getVisiblePythonExamples, parseStructuredPythonTests } from "./pythonTestCases";

const structured = JSON.stringify({
  format: "structured-v1",
  cases: [
    { id: "one", name: "Сумма положительных чисел", argsJson: "[2, 3]", expectedJson: "5", isVisible: true },
    { id: "two", name: "Ноль", argsJson: "[0, 0]", expectedJson: "0", isVisible: false },
  ],
});

describe("structured Python test cases", () => {
  it("parses structured tests and retains visibility", () => {
    const result = parseStructuredPythonTests(structured);
    expect(result?.cases).toHaveLength(2);
    expect(result?.cases[0]?.isVisible).toBe(true);
  });

  it("builds Python assertions that call solution with input values", () => {
    const code = buildPythonTestCode(structured);
    expect(code).toContain("solution(*[2,3]) == 5");
    expect(code).toContain("test_case_2");
  });

  it("returns only marked examples to students", () => {
    expect(getVisiblePythonExamples(structured)).toEqual([{ name: "Сумма положительных чисел", argsJson: "[2, 3]", expectedJson: "5" }]);
  });
});
