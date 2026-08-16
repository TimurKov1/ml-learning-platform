export function insertMarkdown(value: string, selectionStart: number, selectionEnd: number, before: string, after = "", fallback = "текст") {
  const selected = value.slice(selectionStart, selectionEnd) || fallback;
  const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  const cursor = selectionStart + before.length + selected.length + after.length;
  return { value: next, cursor };
}

export function normalizeLessonMarkdown(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}
