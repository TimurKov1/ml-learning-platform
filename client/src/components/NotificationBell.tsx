import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

export function NotificationList({ items, onReadAll, onRead, dark = false }: { items: Array<{ id: number; title: string; message: string; isRead: boolean; createdAt: Date | string }>; onReadAll: () => void; onRead: (id: number) => void; dark?: boolean }) {
  const unread = items.filter(item => !item.isRead).length;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className={`relative ${dark ? "text-[#d4deec] hover:bg-white/10 hover:text-white" : "text-[#65708a]"}`} aria-label="Уведомления"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute right-1 top-1 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-[#b84c45] px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}</Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-2">
      <div className="flex items-center justify-between px-2 py-1"><DropdownMenuLabel className="p-0">Уведомления</DropdownMenuLabel>{unread > 0 && <button onClick={onReadAll} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8b682a] hover:underline"><CheckCheck className="h-3.5 w-3.5" />Прочитать все</button>}</div>
      <DropdownMenuSeparator />
      {items.length === 0 ? <p className="px-2 py-5 text-center text-sm text-[#7a8496]">Новых уведомлений пока нет.</p> : items.slice(0, 8).map(item => <DropdownMenuItem key={item.id} onSelect={() => { if (!item.isRead) onRead(item.id); }} className={`block cursor-pointer whitespace-normal rounded-xl p-3 ${item.isRead ? "opacity-65" : "bg-[#faf6eb]"}`}><p className="text-xs font-semibold text-[#24324d]">{item.title}</p><p className="mt-1 text-xs leading-5 text-[#68748a]">{item.message}</p><p className="mt-1 text-[10px] text-[#9aa3b1]">{new Date(item.createdAt).toLocaleString()}</p></DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function AdminNotificationBell() {
  const query = trpc.admin.notifications.list.useQuery(undefined, { refetchInterval: 15000 });
  const read = trpc.admin.notifications.markRead.useMutation({ onSuccess: () => { void query.refetch(); } });
  const readAll = trpc.admin.notifications.markAllRead.useMutation({ onSuccess: () => { void query.refetch(); } });
  return <NotificationList items={query.data ?? []} onRead={id => read.mutate({ id })} onReadAll={() => readAll.mutate()} dark />;
}

export function StudentNotificationBell() {
  const query = trpc.student.notifications.list.useQuery(undefined, { refetchInterval: 15000 });
  const read = trpc.student.notifications.markRead.useMutation({ onSuccess: () => { void query.refetch(); } });
  const readAll = trpc.student.notifications.markAllRead.useMutation({ onSuccess: () => { void query.refetch(); } });
  return <NotificationList items={query.data ?? []} onRead={id => read.mutate({ id })} onReadAll={() => readAll.mutate()} />;
}
