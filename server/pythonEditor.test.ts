import { describe, expect, it } from "vitest";
import { applyPythonEditorKey, highlightPython } from "../client/src/components/PythonCodeEditor";

describe("Python editor behavior", () => {
  it("adds four spaces with Tab and removes them with Shift+Tab", () => {
    const indented = applyPythonEditorKey("x", 1, 1, "Tab");
    expect(indented.value).toBe("x    ");
    const restored = applyPythonEditorKey("    x", 5, 5, "Tab", true);
    expect(restored.value).toBe("x");
    expect(restored.cursorStart).toBe(1);
  });

  it("keeps indentation on Enter and adds a level after a colon", () => {
    const result = applyPythonEditorKey("def solution(x):", 16, 16, "Enter");
    expect(result.value).toBe("def solution(x):\n    ");
    const nested = applyPythonEditorKey("    if x:", 10, 10, "Enter");
    expect(nested.value).toBe("    if x:\n        ");
  });

  it("autocloses brackets and quotes", () => {
    expect(applyPythonEditorKey("", 0, 0, "(").value).toBe("()");
    expect(applyPythonEditorKey("", 0, 0, "\"").value).toBe("\"\"");
    expect(applyPythonEditorKey("abc", 1, 1, "[").value).toBe("a[]bc");
  });

  it("highlights strings without exposing HTML class markup", () => {
    const html = highlightPython('name = "NeuroClass" # course');
    expect(html).toContain("NeuroClass");
    expect(html).toContain("#f0c674");
    expect(html).not.toContain("class='text'");
    expect(html).not.toContain("class=\"text\"");
  });
});
