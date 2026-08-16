import { describe, expect, it } from "vitest";
import { insertMarkdown, normalizeLessonMarkdown } from "./markdownEditorUtils";

describe("markdown lesson editor utilities", () => {
  it("wraps selected text in Markdown formatting", () => {
    expect(insertMarkdown("hello world", 6, 11, "**", "**")).toEqual({ value: "hello **world**", cursor: 15 });
  });

  it("inserts a LaTeX block with a useful fallback", () => {
    expect(insertMarkdown("", 0, 0, "$$\n", "\n$$", "x^2").value).toBe("$$\nx^2\n$$");
  });

  it("normalizes lesson line endings while preserving Markdown content", () => {
    expect(normalizeLessonMarkdown("# Формула\r\n\r\n$E=mc^2$\r\n")).toBe("# Формула\n\n$E=mc^2$");
  });
});
