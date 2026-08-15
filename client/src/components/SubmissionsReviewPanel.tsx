import { AdminQueryState } from "@/components/AdminQueryState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, RotateCcw, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ReviewStatus = "pending" | "approved" | "revision";

const labels: Record<ReviewStatus, string> = { pending: "Ожидает проверки", approved: "Зачтено", revision: "На доработку" };

export function SubmissionsReviewPanel({ onChanged }: { onChanged: () => Promise<void> }) {
  const submissions = trpc.admin.reviews.list.useQuery();
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [comments, setComments] = useState<Record<number, string>>({});
  const review = trpc.admin.reviews.review.useMutation({
    onSuccess: async () => {
      toast.success("Решение проверено.");
      await Promise.all([submissions.refetch(), onChanged()]);
    },
    onError: error => toast.error(error.message),
  });

  const rows = useMemo(() => (submissions.data ?? []).filter(item => filter === "all" || item.status === filter), [filter, submissions.data]);
  const pendingCount = (submissions.data ?? []).filter(item => item.status === "pending").length;

  if (submissions.isLoading || submissions.error) return <AdminQueryState loading={submissions.isLoading} error={submissions.error} onRetry={() => { void submissions.refetch(); }} label="решения учеников" />;

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-5"><div className="max-w-2xl"><p className="text-xs font-bold tracking-[.17em] text-[#a47d3a] uppercase">Обратная связь</p><h1 className="mt-3 font-display text-4xl tracking-[-.045em] sm:text-5xl">Проверка решений</h1><p className="mt-4 leading-7 text-[#667188]">Проверяйте ответы учеников, засчитывайте задания или возвращайте их на доработку с комментарием.</p></div><span className="inline-flex items-center rounded-full bg-[#f4ead6] px-3 py-1.5 text-xs font-semibold text-[#8b682a]"><Clock3 className="mr-2 h-3.5 w-3.5" />{pendingCount} ожидают проверки</span></div>
    <div className="mt-8 flex gap-2 overflow-x-auto pb-1">{(["pending", "revision", "approved", "all"] as const).map(status => <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} onClick={() => setFilter(status)} className={filter === status ? "bg-[#142440] hover:bg-[#263958]" : "bg-white"}>{status === "all" ? "Все" : labels[status]}</Button>)}</div>
    <div className="mt-5 space-y-4">{rows.length === 0 ? <div className="rounded-3xl border border-dashed border-[#d8d2c7] bg-white px-6 py-14 text-center text-sm leading-6 text-[#7a8496]">В этой категории решений пока нет.</div> : rows.map(item => <article key={item.id} className="rounded-3xl border border-[#e1dbd0] bg-white p-6 shadow-[0_12px_30px_rgba(30,41,60,.04)]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[.14em] text-[#a47d3a] uppercase">{item.sectionTitle} · {item.lessonTitle}</p><h2 className="mt-2 text-lg font-semibold">{item.assignmentTitle}</h2><p className="mt-2 text-sm text-[#778196]">Ученик: <b className="text-[#263652]">{item.studentName || item.studentUsername}</b> · @{item.studentUsername}</p></div><StatusBadge status={item.status as ReviewStatus} /></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl bg-[#f7f4ee] p-4"><p className="text-xs font-bold tracking-[.13em] text-[#8a94a5] uppercase">Условие</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#667188]">{item.assignmentInstructions}</p></div><div className="rounded-2xl bg-[#fcfbf8] p-4"><p className="text-xs font-bold tracking-[.13em] text-[#8a94a5] uppercase">Ответ ученика</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#263652]">{item.response}</p></div></div><div className="mt-5 border-t border-[#eee9e1] pt-5"><Textarea value={comments[item.id] ?? item.reviewComment ?? ""} onChange={event => setComments(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Комментарий ученику (особенно важен при возврате на доработку)" className="min-h-24 bg-white" />{item.status === "approved" || item.status === "revision" ? <p className="mt-3 text-sm text-[#778196]">Последнее решение: <b className="text-[#263652]">{labels[item.status as ReviewStatus]}</b></p> : <div className="mt-4 flex flex-wrap justify-end gap-2"><Button disabled={review.isPending} variant="outline" className="border-[#e6c2bd] text-[#a64b42] hover:bg-[#fff1ef] hover:text-[#a64b42]" onClick={() => { const comment = comments[item.id]?.trim(); if (!comment) return toast.error("Добавьте комментарий, чтобы вернуть решение на доработку."); review.mutate({ id: item.id, status: "revision", reviewComment: comment }); }}><RotateCcw className="mr-2 h-4 w-4" />На доработку</Button><Button disabled={review.isPending} onClick={() => review.mutate({ id: item.id, status: "approved", reviewComment: comments[item.id]?.trim() || null })} className="bg-[#2d6b49] hover:bg-[#24593c]"><CheckCircle2 className="mr-2 h-4 w-4" />Зачесть</Button></div>}</div></article>)}</div>
  </section>;
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const style = status === "approved" ? "bg-[#e5f0e7] text-[#3e7651]" : status === "revision" ? "bg-[#fff0ee] text-[#a64b42]" : "bg-[#f4ead6] text-[#8b682a]";
  return <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}>{status === "approved" ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : status === "revision" ? <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}{labels[status]}</span>;
}
