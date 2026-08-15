import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

export function AdminQueryState({ loading, error, onRetry, label = "данные" }: { loading: boolean; error?: unknown; onRetry?: () => void; label?: string }) {
  if (loading) return <div className="grid min-h-56 place-items-center rounded-3xl border border-[#e1dbd0] bg-white"><div className="flex items-center gap-3 text-sm text-[#6e798e]"><Loader2 className="h-5 w-5 animate-spin text-[#a47d3a]" />Загружаем {label}…</div></div>;
  if (error) return <div className="rounded-3xl border border-[#f0cbc6] bg-[#fff8f6] p-6"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 text-[#aa4b43]" /><div><h2 className="font-semibold text-[#773b36]">Не удалось загрузить {label}</h2><p className="mt-1 text-sm leading-6 text-[#8b5c57]">Проверьте соединение и повторите попытку. Данные не были изменены.</p>{onRetry && <Button size="sm" variant="outline" onClick={onRetry} className="mt-4 border-[#e9bbb5] bg-white text-[#8b423b] hover:bg-[#fff1ef] hover:text-[#8b423b]">Повторить</Button>}</div></div></div>;
  return null;
}
