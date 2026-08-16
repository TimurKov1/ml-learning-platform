import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonMarkdown } from "./LessonMarkdown";

describe("LessonMarkdown", () => {
  it("renders Markdown and inline/display LaTeX as KaTeX markup", () => {
    const html = renderToStaticMarkup(
      <LessonMarkdown content={'# Формулы\n\nInline: $E = mc^2$\n\n$$\\int_0^1 x^2 dx = \\frac{1}{3}$$'} />,
    );

    expect(html).toContain("<h1>Формулы</h1>");
    expect(html).toContain('class="katex"');
    expect((html.match(/class="katex"/g) ?? []).length).toBe(2);
    expect(html).toContain("\\int_0^1 x^2 dx = \\frac{1}{3}");
    expect(html).not.toContain("$E = mc^2$");
  });
});
