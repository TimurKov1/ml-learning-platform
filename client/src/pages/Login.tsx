import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BrainCircuit, LockKeyhole, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
    onError: error => toast.error(error.message || "Не удалось выполнить вход."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ username, password });
  };

  return (
    <main className="login-stage min-h-screen p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-[#f8f5ef] shadow-[0_32px_100px_rgba(20,29,47,0.16)] lg:grid-cols-[1.1fr_.9fr]">
        <section className="relative hidden overflow-hidden bg-[#0e1b33] p-12 text-[#f7f1e7] lg:flex lg:flex-col">
          <img src="/manus-storage/neural-network-glow_bd5ab1e5.jpg" alt="Абстрактная нейронная сеть" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen" />
          <div className="absolute inset-0 opacity-90" style={{ backgroundImage: "radial-gradient(circle at 80% 16%, rgba(206,168,99,.24), transparent 27%), radial-gradient(circle at 15% 90%, rgba(77,150,173,.18), transparent 25%)" }} />
          <div className="relative flex items-center gap-3 text-sm font-semibold tracking-[0.18em] uppercase text-[#d9bf8f]">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#d9bf8f]/40 bg-white/5"><BrainCircuit className="h-5 w-5" /></span>
            NeuroClass
          </div>
          <div className="relative my-auto max-w-md">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#d9bf8f]"><Sparkles className="h-4 w-4" /> закрытая академия</p>
            <h1 className="font-display text-6xl leading-[.92] tracking-[-0.055em]">Глубокое понимание. <em className="text-[#ddc48f]">Чёткая</em> практика.</h1>
            <p className="mt-8 max-w-sm text-base leading-7 text-[#d7dbe5]">Пространство для системного изучения машинного обучения и нейронных сетей.</p>
          </div>
          <p className="relative text-sm text-[#bac4d5]">Вход доступен только ученикам курса и администратору.</p>
        </section>

        <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0e1b33] text-[#ddc48f]"><BrainCircuit className="h-5 w-5" /></span>
            <span className="font-semibold tracking-[0.12em] uppercase text-[#0e1b33]">NeuroClass</span>
          </div>
          <div className="max-w-sm">
            <div className="mb-9">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e9e1d4] px-3 py-1.5 text-xs font-semibold text-[#6b593d]"><LockKeyhole className="h-3.5 w-3.5" /> Защищённый доступ</div>
              <h2 className="font-display text-4xl tracking-[-0.04em] text-[#13223d]">Добро пожаловать</h2>
              <p className="mt-3 text-sm leading-6 text-[#687084]">Введите данные, полученные от администратора курса.</p>
            </div>
            <form className="space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-[#293650]">Логин</Label>
                <Input id="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Ваш логин" className="h-12 border-[#d8d2c8] bg-white/80 px-4 focus-visible:ring-[#b49054]" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[#293650]">Пароль</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Ваш пароль" className="h-12 border-[#d8d2c8] bg-white/80 px-4 focus-visible:ring-[#b49054]" required />
              </div>
              <Button type="submit" disabled={login.isPending} className="mt-2 h-12 w-full rounded-xl bg-[#13223d] text-sm font-semibold text-white shadow-lg shadow-[#13223d]/15 hover:bg-[#263958]">
                {login.isPending ? "Проверяем данные…" : <>Войти в пространство <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
            <p className="mt-8 text-center text-xs leading-5 text-[#7d8492]">Нет доступа? Обратитесь к администратору курса для получения учётных данных.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
