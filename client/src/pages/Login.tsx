import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BrainCircuit, LockKeyhole } from "lucide-react";
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
    <main className="login-stage flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <section className="w-full max-w-md rounded-[2rem] border border-[#e1d9cc] bg-[#faf8f3] p-6 shadow-[0_24px_70px_rgba(20,29,47,0.12)] sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#13223d] text-[#ddc48f]">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.14em] text-[#13223d] uppercase">NeuroClass</p>
            <p className="mt-0.5 text-xs text-[#8a8f9b]">закрытая академия</p>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e9e1d4] px-3 py-1.5 text-xs font-semibold text-[#6b593d]">
              <LockKeyhole className="h-3.5 w-3.5" />
              Защищённый доступ
            </div>
            <h1 className="font-display text-4xl tracking-[-0.04em] text-[#13223d]">Добро пожаловать</h1>
            <p className="mt-3 text-sm leading-6 text-[#687084]">Введите данные, полученные от администратора курса.</p>
          </div>

          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-[#293650]">Логин</Label>
              <Input id="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Ваш логин" className="h-12 border-[#d8d2c8] bg-white px-4 focus-visible:ring-[#b49054]" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-[#293650]">Пароль</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Ваш пароль" className="h-12 border-[#d8d2c8] bg-white px-4 focus-visible:ring-[#b49054]" required />
            </div>
            <Button type="submit" disabled={login.isPending} className="mt-2 h-12 w-full rounded-xl bg-[#13223d] text-sm font-semibold text-white shadow-lg shadow-[#13223d]/15 hover:bg-[#263958]">
              {login.isPending ? "Проверяем данные…" : <>Войти в пространство <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>
          <p className="mt-8 text-center text-xs leading-5 text-[#7d8492]">Нет доступа? Обратитесь к администратору курса для получения учётных данных.</p>
        </div>
      </section>
    </main>
  );
}
