import { useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
};

const TOKEN_PATTERN = /#[^\n]*|"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|if|import|in|is|lambda|None|not|or|pass|raise|return|True|try|while|with|yield)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*(?=\s*\()|\*\*|\x2f\x2f|==|!=|<=|>=|[=+\-*\x2f%<>]/g;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

export function highlightPython(value: string) {
  let html = "";
  let cursor = 0;
  for (const match of Array.from(value.matchAll(TOKEN_PATTERN))) {
    const token = match[0];
    const index = match.index ?? cursor;
    html += escapeHtml(value.slice(cursor, index));
    const color = token.startsWith("#") ? "#8fbd8b" : token.startsWith("\"") || token.startsWith("'") ? "#f0c674" : /^(\*\*|\/\/|==|!=|<=|>=|[=+\-*/%<>])$/.test(token) ? "#e49aa4" : /^\d/.test(token) ? "#8fd7d0" : /^(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|if|import|in|is|lambda|None|not|or|pass|raise|return|True|try|while|with|yield)$/.test(token) ? "#d6a8e8" : "#7fc8e8";
    html += `<span style="color:${color}">${escapeHtml(token)}</span>`;
    cursor = index + token.length;
  }
  return html + escapeHtml(value.slice(cursor));
}

export type PythonEditorEdit = { handled: boolean; value: string; cursorStart: number; cursorEnd: number };

export function applyPythonEditorKey(value: string, start: number, end: number, key: string, shiftKey = false): PythonEditorEdit {
  if (key === "Enter" && start === end) {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const currentLine = value.slice(lineStart, start);
    const indent = currentLine.match(/^\s*/)?.[0] ?? "";
    const extraIndent = /:\s*(?:#.*)?$/.test(currentLine) ? "    " : "";
    const insertion = `\n${indent}${extraIndent}`;
    const next = value.slice(0, start) + insertion + value.slice(end);
    return { handled: true, value: next, cursorStart: start + insertion.length, cursorEnd: start + insertion.length };
  }
  if (key === "Tab") {
    if (shiftKey) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const removed = value.slice(lineStart, lineStart + 4).match(/^ {1,4}/)?.[0] ?? "";
      const next = value.slice(0, lineStart) + value.slice(lineStart + removed.length);
      return { handled: true, value: next, cursorStart: Math.max(lineStart, start - removed.length), cursorEnd: Math.max(lineStart, end - removed.length) };
    }
    const next = value.slice(0, start) + "    " + value.slice(end);
    return { handled: true, value: next, cursorStart: start + 4, cursorEnd: start + 4 };
  }
  if (start === end) {
    const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}", "\"": "\"", "'": "'" };
    if (pairs[key]) {
      const next = value.slice(0, start) + key + pairs[key] + value.slice(end);
      return { handled: true, value: next, cursorStart: start + 1, cursorEnd: start + 1 };
    }
  }
  return { handled: false, value, cursorStart: start, cursorEnd: end };
}

export function PythonCodeEditor({ value, onChange, placeholder = "def solution(...):", minHeight = "min-h-64" }: Props) {
  const highlightRef = useRef<HTMLPreElement>(null);
  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const edit = applyPythonEditorKey(value, target.selectionStart, target.selectionEnd, event.key, event.shiftKey);
    if (!edit.handled) return;
    event.preventDefault();
    onChange(edit.value);
    requestAnimationFrame(() => target.setSelectionRange(edit.cursorStart, edit.cursorEnd));
  };
  return <div className="relative overflow-hidden rounded-xl border border-[#263d5f] bg-[#102039] shadow-inner">
    <pre ref={highlightRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-sm leading-6 text-[#edf3fa] ${minHeight}`} dangerouslySetInnerHTML={{ __html: value ? highlightPython(value) : `<span class="text-[#8492a5]">${escapeHtml(placeholder)}</span>` }} />
    <textarea value={value} onChange={event => onChange(event.target.value)} onKeyDown={handleKeyDown} onScroll={handleScroll} spellCheck={false} autoCapitalize="off" autoCorrect="off" className={`relative z-10 block w-full resize-y overflow-auto bg-transparent p-4 font-mono text-sm leading-6 text-transparent caret-white outline-none selection:bg-[#5173a0]/50 ${minHeight}`} aria-label="Редактор Python-кода" />
    <div className="border-t border-white/10 px-3 py-1.5 text-[11px] text-[#9eacc0]">Tab — отступ · Shift+Tab — убрать отступ · скобки закрываются автоматически</div>
  </div>;
}
