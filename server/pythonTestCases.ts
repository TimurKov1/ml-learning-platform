export type PythonTestCase = {
  id: string;
  name: string;
  argsJson: string;
  expectedJson: string;
  isVisible: boolean;
};

export type StructuredPythonTests = {
  format: "structured-v1";
  cases: PythonTestCase[];
};

function jsonToPythonLiteral(value: unknown): string {
  if (value === null) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.map(jsonToPythonLiteral).join(",")}]`;
  if (typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).map(([key, item]) => `${JSON.stringify(key)}:${jsonToPythonLiteral(item)}`).join(",")}}`;
  throw new Error("Тест-кейс содержит неподдерживаемый JSON-тип.");
}

export function parseStructuredPythonTests(value: string | null | undefined): StructuredPythonTests | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StructuredPythonTests>;
    if (parsed.format !== "structured-v1" || !Array.isArray(parsed.cases)) return null;
    const cases = parsed.cases.map((item, index) => ({
      id: typeof item.id === "string" && item.id ? item.id : `case-${index + 1}`,
      name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : `Тест ${index + 1}`,
      argsJson: typeof item.argsJson === "string" ? item.argsJson : "[]",
      expectedJson: typeof item.expectedJson === "string" ? item.expectedJson : "null",
      isVisible: Boolean(item.isVisible),
    }));
    return { format: "structured-v1", cases };
  } catch {
    return null;
  }
}

export function buildPythonTestCode(value: string | null | undefined): string {
  const structured = parseStructuredPythonTests(value);
  if (!structured) return value?.trim() || "";
  if (!structured.cases.length) return "";
  return structured.cases.map((testCase, index) => {
    let args: unknown;
    let expected: unknown;
    try {
      args = JSON.parse(testCase.argsJson);
      expected = JSON.parse(testCase.expectedJson);
    } catch {
      throw new Error(`Проверьте JSON в тесте «${testCase.name}».`);
    }
    if (!Array.isArray(args)) throw new Error(`Входные данные теста «${testCase.name}» должны быть JSON-массивом аргументов.`);
    const name = `test_case_${index + 1}`;
    return `def ${name}():\n    assert solution(*${jsonToPythonLiteral(args)}) == ${jsonToPythonLiteral(expected)}, ${JSON.stringify(testCase.name)}`;
  }).join("\n\n");
}

export function getVisiblePythonExamples(value: string | null | undefined) {
  const structured = parseStructuredPythonTests(value);
  if (!structured) return [];
  return structured.cases.filter(testCase => testCase.isVisible).map(testCase => ({ name: testCase.name, argsJson: testCase.argsJson, expectedJson: testCase.expectedJson }));
}
