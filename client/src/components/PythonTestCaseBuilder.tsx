import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export type PythonTestCaseDraft = { id: string; name: string; argsJson: string; expectedJson: string; isVisible: boolean };
type StructuredTests = { format: "structured-v1"; cases: PythonTestCaseDraft[] };

const newCase = (index: number): PythonTestCaseDraft => ({ id: `case-${Date.now()}-${index}`, name: `Тест ${index}`, argsJson: "[]", expectedJson: "null", isVisible: false });

function parse(value: string | null | undefined): StructuredTests {
  try {
    const parsed = JSON.parse(value || "") as StructuredTests;
    if (parsed.format === "structured-v1" && Array.isArray(parsed.cases)) return { format: "structured-v1", cases: parsed.cases };
  } catch {}
  return { format: "structured-v1", cases: [] };
}

export function PythonTestCaseBuilder({ value, onChange }: { value: string | null | undefined; onChange: (value: string) => void }) {
  const data = parse(value);
  const save = (cases: PythonTestCaseDraft[]) => onChange(JSON.stringify({ format: "structured-v1", cases } satisfies StructuredTests));
  const update = (id: string, patch: Partial<PythonTestCaseDraft>) => save(data.cases.map(testCase => testCase.id === id ? { ...testCase, ...patch } : testCase));
  return <div className="space-y-4 rounded-2xl border border-[#d9c696] bg-[#fffaf0] p-4 sm:p-5">
    <div><p className="text-sm font-semibold text-[#594317]">Тест-кейсы Python</p><p className="mt-1 text-xs leading-5 text-[#756649]">Укажите аргументы, с которыми будет вызвана функция <code>solution(...)</code>, и ожидаемый результат. Используйте JSON: например, <code>[2, 3]</code> и <code>5</code>.</p></div>
    <div className="space-y-3">{data.cases.length === 0 ? <p className="rounded-xl border border-dashed border-[#d8c9a9] bg-white/60 px-4 py-5 text-center text-sm text-[#89795d]">Добавьте первый тест. Минимум один тест обязателен для автопроверки.</p> : data.cases.map((testCase, index) => <div key={testCase.id} className="rounded-xl border border-[#e6d8bd] bg-white p-4"><div className="grid gap-3 lg:grid-cols-[minmax(120px,.8fr)_minmax(180px,1fr)_minmax(160px,.8fr)_auto]"><div className="space-y-1"><Label className="text-xs">Название</Label><Input value={testCase.name} onChange={event => update(testCase.id, { name: event.target.value })} placeholder={`Тест ${index + 1}`} /></div><div className="space-y-1"><Label className="text-xs">Входные данные · JSON-массив</Label><Input className="font-mono text-xs" value={testCase.argsJson} onChange={event => update(testCase.id, { argsJson: event.target.value })} placeholder="[2, 3]" /></div><div className="space-y-1"><Label className="text-xs">Ожидаемый результат · JSON</Label><Input className="font-mono text-xs" value={testCase.expectedJson} onChange={event => update(testCase.id, { expectedJson: event.target.value })} placeholder="5" /></div><Button type="button" variant="ghost" size="icon" className="self-end text-[#b64b43] hover:bg-[#fff0ee]" onClick={() => save(data.cases.filter(item => item.id !== testCase.id))} aria-label="Удалить тест"><Trash2 className="h-4 w-4" /></Button></div><div className="mt-3 flex items-center gap-2"><Checkbox id={`visible-test-${testCase.id}`} checked={testCase.isVisible} onCheckedChange={checked => update(testCase.id, { isVisible: checked === true })} /><Label htmlFor={`visible-test-${testCase.id}`} className="cursor-pointer text-xs font-medium text-[#5d664f]">Показать этот пример ученику</Label></div></div>)}</div>
    <Button type="button" variant="outline" onClick={() => save([...data.cases, newCase(data.cases.length + 1)])} className="border-[#cbb37f] bg-white text-[#735821] hover:bg-[#fff8e8]"><Plus className="mr-2 h-4 w-4" />Добавить тест-кейс</Button>
  </div>;
}
