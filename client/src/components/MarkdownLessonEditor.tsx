import { Bold, Code2, Heading2, Italic, List, Sigma } from "lucide-react";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { insertMarkdown } from "./markdownEditorUtils";
import { Textarea } from "@/components/ui/textarea";

type Props = { value: string; onChange: (value: string) => void };

export function MarkdownLessonEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const insert = (before: string, after = "", fallback = "текст") => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    const { value: next, cursor } = insertMarkdown(value, start, end, before, after, fallback);
    onChange(next);
    requestAnimationFrame(() => {
      if (!element) return;
      element.focus();
      element.setSelectionRange(cursor, cursor);
    });
  };
  const tools = [
    { label: "Жирный", icon: Bold, action: () => insert("**", "**") },
    { label: "Курсив", icon: Italic, action: () => insert("*", "*") },
    { label: "Заголовок", icon: Heading2, action: () => insert("## ", "", "Заголовок") },
    { label: "Список", icon: List, action: () => insert("- ", "", "пункт списка") },
    { label: "Код", icon: Code2, action: () => insert("```python\n", "\n```", "print('hello')") },
    { label: "Формула", icon: Sigma, action: () => insert("$$\n", "\n$$", "x^2 + y^2 = z^2") },
  ];
  return <div className="overflow-hidden rounded-2xl border border-[#dcd5c8] bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b border-[#ebe6dd] bg-[#fbfaf7] p-2">{tools.map(tool => <Button key={tool.label} type="button" variant="ghost" size="sm" onClick={tool.action} className="gap-1.5 text-xs text-[#55627a] hover:bg-[#efe8dc] hover:text-[#142440]"><tool.icon className="h-3.5 w-3.5" />{tool.label}</Button>)}</div>
    <div className="grid lg:grid-cols-2">
      <div className="border-b border-[#ebe6dd] p-3 lg:border-b-0 lg:border-r"><p className="px-2 pb-2 text-[10px] font-bold tracking-[.14em] text-[#9a7b42] uppercase">Markdown / LaTeX</p><Textarea ref={textareaRef} value={value} onChange={event => onChange(event.target.value)} placeholder={'# Заголовок урока\n\nТекст объяснения и формула: $x^2 + y^2 = z^2$'} className="min-h-[360px] resize-y border-0 bg-transparent p-2 font-mono text-sm leading-6 shadow-none focus-visible:ring-0" /></div>
      <div className="min-h-[360px] bg-[#fcfbf8] p-5"><p className="mb-3 text-[10px] font-bold tracking-[.14em] text-[#9a7b42] uppercase">Предпросмотр</p>{value.trim() ? <div className="prose prose-slate max-w-none text-[#2b3851]"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{value}</ReactMarkdown></div> : <p className="text-sm italic text-[#9aa3b1]">Предпросмотр появится здесь.</p>}</div>
    </div>
    <div className="border-t border-[#ebe6dd] px-4 py-2 text-[11px] leading-5 text-[#7d8798]">Поддерживаются заголовки, списки, выделение, блоки кода и формулы LaTeX: `$x^2$` или `$$E = mc^2$$`.</div>
  </div>;
}
