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

function parameterNamesFromList(rawParameters: string): string[] {
  return rawParameters.split(",").map(parameter => parameter.trim()).filter(Boolean).map(parameter => {
    const withoutVariadic = parameter.replace(/^\*{1,2}/, "").trim();
    const withoutDefault = withoutVariadic.split("=")[0].trim();
    const name = withoutDefault.split(":")[0].trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error("Имена параметров должны содержать только латинские буквы, цифры и символ _.");
    return name;
  });
}

export function normalizeFunctionSignature(signature: string | null | undefined, testsJson?: string | null): string {
  const raw = signature?.trim();
  if (raw) {
    const match = raw.match(/^(?:def\s+)?solution\s*\(([^)]*)\)\s*:?\s*$/);
    if (!match) throw new Error("Сигнатура должна иметь вид solution(arg1, arg2) или def solution(arg1, arg2):.");
    return `solution(${parameterNamesFromList(match[1] ?? "").join(", ")})`;
  }
  const structured = parseStructuredPythonTests(testsJson);
  let argumentCount = 0;
  if (structured?.cases[0]) {
    try { const args = JSON.parse(structured.cases[0].argsJson); if (Array.isArray(args)) argumentCount = args.length; } catch { /* fallback to zero arguments */ }
  }
  return `solution(${Array.from({ length: argumentCount }, (_, index) => `arg${index + 1}`).join(", ")})`;
}

export function validateStructuredTestArity(value: string | null | undefined, signature: string | null | undefined): string | null {
  const structured = parseStructuredPythonTests(value);
  if (!structured || structured.cases.length < 2) return null;
  const normalized = normalizeFunctionSignature(signature, value);
  const expected = normalized.slice(normalized.indexOf("(") + 1, -1).split(",").map(item => item.trim()).filter(Boolean).length;
  for (const testCase of structured.cases) {
    try {
      const args = JSON.parse(testCase.argsJson);
      if (!Array.isArray(args) || args.length !== expected) return `Тест «${testCase.name}» содержит ${Array.isArray(args) ? args.length : 0} аргументов, а функция ожидает ${expected}.`;
    } catch { return `Проверьте JSON входных данных теста «${testCase.name}».`; }
  }
  return null;
}

export function extractSolutionSignature(code: string | null | undefined): string | null {
  const match = code?.match(/\bdef\s+solution\s*\(([^)]*)\)\s*:/);
  return match ? normalizeFunctionSignature(`solution(${match[1] ?? ""})`) : null;
}

export function getPythonSolutionTemplate(value: string | null | undefined, signature?: string | null, starterCode?: string | null): string {
  const header = normalizeFunctionSignature(signature ?? extractSolutionSignature(starterCode), value);
  return `def ${header}:\n    # Напишите решение здесь. Имя solution менять нельзя.\n    pass`;
}

export function getVisiblePythonExamples(value: string | null | undefined) {
  const structured = parseStructuredPythonTests(value);
  if (!structured) return [];
  return structured.cases.filter(testCase => testCase.isVisible).map(testCase => ({ name: testCase.name, argsJson: testCase.argsJson, expectedJson: testCase.expectedJson }));
}
