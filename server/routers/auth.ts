import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { createStudentAccount, deleteStudentAccount, ensureAdminAccount, getLocalUserByUsername, getStudentStats, listStudentAccounts, setStudentActive, updateStudentAccount } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { hashPassword, verifyPassword } from "../auth/password";

export const safeUser = (user: { id: number; name: string | null; email: string | null; username: string | null; role: "admin" | "user"; isActive: boolean }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  isActive: user.isActive,
});

const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/, "Используйте 3–32 символа: латинские буквы, цифры, точку, дефис или подчёркивание.");

export const localAuthRouter = router({
  me: publicProcedure.query(({ ctx }) => (ctx.user ? safeUser(ctx.user) : null)),
  login: publicProcedure
    .input(z.object({ username: usernameSchema, password: z.string().min(1).max(256) }))
    .mutation(async ({ input, ctx }) => {
      if (input.username === "admin") await ensureAdminAccount();
      const user = await getLocalUserByUsername(input.username);
      const isCorrect = user && user.isActive && (await verifyPassword(input.password, user.passwordHash));
      if (!isCorrect || !user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Неверный логин или пароль." });

      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "Пользователь" });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { user: safeUser(user), sessionToken };
    }),
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
    return { success: true } as const;
  }),
});

export const adminStudentsRouter = router({
  list: adminProcedure.query(() => listStudentAccounts()),
  statistics: adminProcedure.query(() => getStudentStats()),
  create: adminProcedure
    .input(z.object({ name: z.string().trim().min(2).max(100), username: usernameSchema, password: z.string().min(6, "Пароль должен состоять минимум из 6 символов.").max(256) }))
    .mutation(async ({ input }) => {
      const existing = await getLocalUserByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Этот логин уже используется." });
      return createStudentAccount({ ...input, passwordHash: await hashPassword(input.password) });
    }),
  setActive: adminProcedure
    .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(({ input }) => setStudentActive(input.id, input.isActive)),
  update: adminProcedure
    .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(100), username: usernameSchema, password: z.string().max(256).optional() }))
    .mutation(async ({ input }) => {
      const account = await getLocalUserByUsername(input.username);
      if (account && account.id !== input.id) throw new TRPCError({ code: "CONFLICT", message: "Этот логин уже используется." });
      const passwordHash = input.password?.trim() ? await hashPassword(input.password) : undefined;
      return updateStudentAccount(input.id, { name: input.name, username: input.username, passwordHash });
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => deleteStudentAccount(input.id)),
});
