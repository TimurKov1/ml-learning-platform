import { spawn } from "node:child_process";

export type PythonTestResult = { name: string; passed: boolean; message?: string };
export type PythonCheckResult = { passed: boolean; tests: PythonTestResult[]; error?: string };

const runner = String.raw`
import ast, json, resource, sys, traceback

memory_limit = 128 * 1024 * 1024
resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))
resource.setrlimit(resource.RLIMIT_CPU, (5, 5))

def reject_unsafe(tree):
    forbidden = (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal, ast.ClassDef,
                 ast.AsyncFunctionDef, ast.AsyncFor, ast.AsyncWith, ast.Await, ast.With)
    for node in ast.walk(tree):
        if isinstance(node, forbidden):
            raise ValueError("Использованы конструкции, недоступные в учебной проверке.")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise ValueError("Обращение к служебным атрибутам запрещено.")

payload = json.loads(sys.stdin.read())
student_code = payload.get("code", "")
tests_code = payload.get("tests", "")
safe_builtins = {
    "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict, "enumerate": enumerate,
    "float": float, "int": int, "len": len, "list": list, "max": max, "min": min,
    "range": range, "round": round, "set": set, "sorted": sorted, "str": str, "sum": sum,
    "tuple": tuple, "zip": zip,
}
scope = {"__builtins__": safe_builtins}
try:
    reject_unsafe(ast.parse(student_code, mode="exec"))
    reject_unsafe(ast.parse(tests_code, mode="exec"))
    exec(compile(student_code, "submission.py", "exec"), scope, scope)
    exec(compile(tests_code, "tests.py", "exec"), scope, scope)
    tests = [(name, value) for name, value in scope.items() if name.startswith("test_") and callable(value)]
    if not tests:
        raise ValueError("В задании не найдено ни одной тестовой функции test_...().")
    results = []
    for name, test in tests:
        try:
            test()
            results.append({"name": name, "passed": True})
        except Exception as error:
            results.append({"name": name, "passed": False, "message": str(error) or error.__class__.__name__})
    print(json.dumps({"passed": all(item["passed"] for item in results), "tests": results}, ensure_ascii=False))
except Exception as error:
    print(json.dumps({"passed": False, "tests": [], "error": str(error) or error.__class__.__name__}, ensure_ascii=False))
`;

export async function runPythonChecks(code: string, tests: string): Promise<PythonCheckResult> {
  return new Promise((resolve) => {
    const child = spawn("python3", ["-I", "-S", "-c", runner], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), 8_000);
    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.on("error", () => {
      clearTimeout(timeout);
      resolve({ passed: false, tests: [], error: "Среда выполнения Python временно недоступна." });
    });
    child.on("close", () => {
      clearTimeout(timeout);
      try {
        const result = JSON.parse(stdout.trim()) as PythonCheckResult;
        resolve(result);
      } catch {
        resolve({ passed: false, tests: [], error: stderr.trim() || "Проверка не смогла обработать решение." });
      }
    });
    child.stdin.end(JSON.stringify({ code, tests }));
  });
}
