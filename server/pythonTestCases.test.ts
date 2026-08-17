import { describe, expect, it } from "vitest";
import { buildPythonTestCode, extractSolutionSignature, getPythonSolutionTemplate, getVisiblePythonExamples, normalizeFunctionSignature, parseStructuredPythonTests, validateStructuredTestArity } from "./pythonTestCases";

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

  it("generates a solution template with parameters from test inputs", () => {
    expect(getPythonSolutionTemplate(structured)).toContain("def solution(arg1, arg2):");
    expect(getPythonSolutionTemplate(structured)).toContain("Имя solution менять нельзя");
  });

  it("uses parameter names from the administrator starter code", () => {
    expect(extractSolutionSignature("def solution(numbers, limit):\\n    return 0")).toBe("solution(numbers, limit)");
    expect(getPythonSolutionTemplate(structured, null, "def solution(numbers, limit):\\n    return 0")).toContain("def solution(numbers, limit):");
  });

  it("extracts names when parameters have annotations or defaults", () => {
    expect(extractSolutionSignature("def solution(numbers: list[int], limit: int = 3):\n    return numbers[:limit]")).toBe("solution(numbers, limit)");
    expect(getPythonSolutionTemplate(structured, null, "# task\ndef solution(values, threshold=0):\n    return values")).toContain("def solution(values, threshold):");
  });

  it("supports explicit one- and multi-argument signatures", () => {
    expect(getPythonSolutionTemplate(structured, "solution(numbers)")).toContain("def solution(numbers):");
    expect(getPythonSolutionTemplate(structured, "def solution(numbers, limit):")).toContain("def solution(numbers, limit):");
  });

  it("rejects test cases with incompatible argument counts", () => {
    const invalid = JSON.stringify({ format: "structured-v1", cases: [{ id: "a", name: "one", argsJson: "[1]", expectedJson: "1", isVisible: false }, { id: "b", name: "two", argsJson: "[1, 2]", expectedJson: "3", isVisible: false }] });
    expect(validateStructuredTestArity(invalid, "solution(value)")).toContain("Тест «two» содержит 2 аргументов");
    expect(normalizeFunctionSignature("def solution(value):")).toBe("solution(value)");
  });

  it("returns only marked examples to students", () => {
    expect(getVisiblePythonExamples(structured)).toEqual([{ name: "Сумма положительных чисел", argsJson: "[2, 3]", expectedJson: "5" }]);
  });
});
