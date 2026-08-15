import { useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
};

const KEYWORDS = /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|if|import|in|is|lambda|None|not|or|pass|raise|return|True|try|while|with|yield)\b/g;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function highlightPython(value: string) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/(#[^\n]*)/g, '<span class="text-[#7f9b7b]">$1</span>')
    .replace(/(&quot;.*?&quot;|&#39;.*?&#39;|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)/g, '<span class="text-[#d8b879]">$1</span>')
    .replace(KEYWORDS, '<span class="text-[#bd9bdb]">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-[#8ec5d6]">$1</span>');
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
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const removed = value.slice(lineStart, lineStart + 4).match(/^ {1,4}/)?.[0] ?? "";
        onChange(value.slice(0, lineStart) + value.slice(lineStart + removed.length));
        requestAnimationFrame(() => target.setSelectionRange(Math.max(lineStart, start - removed.length), Math.max(lineStart, end - removed.length)));
      } else {
        onChange(value.slice(0, start) + "    " + value.slice(end));
        requestAnimationFrame(() => target.setSelectionRange(start + 4, start + 4));
      }
      return;
    }
    const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}", "\"": "\"", "'": "'" };
    if (pairs[event.key] && start === end) {
      event.preventDefault();
      onChange(value.slice(0, start) + event.key + pairs[event.key] + value.slice(end));
      requestAnimationFrame(() => target.setSelectionRange(start + 1, start + 1));
    }
  };
  return <div className="relative overflow-hidden rounded-xl border border-[#263d5f] bg-[#102039] shadow-inner">
    <pre ref={highlightRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-sm leading-6 ${minHeight}`} dangerouslySetInnerHTML={{ __html: value ? highlightPython(value) : `<span class="text-[#8492a5]">${escapeHtml(placeholder)}</span>` }} />
    <textarea value={value} onChange={event => onChange(event.target.value)} onKeyDown={handleKeyDown} onScroll={handleScroll} spellCheck={false} autoCapitalize="off" autoCorrect="off" className={`relative z-10 block w-full resize-y overflow-auto bg-transparent p-4 font-mono text-sm leading-6 text-transparent caret-white outline-none selection:bg-[#5173a0]/50 ${minHeight}`} aria-label="Редактор Python-кода" />
    <div className="border-t border-white/10 px-3 py-1.5 text-[11px] text-[#9eacc0]">Tab — отступ · Shift+Tab — убрать отступ · скобки закрываются автоматически</div>
  </div>;
}
