import { z } from "zod";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../db";
import { adminProcedure, router, studentProcedure } from "../_core/trpc";

const notificationInput = z.object({ id: z.number().int().positive() });

export const adminNotificationsRouter = router({
  list: adminProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
  markRead: adminProcedure.input(notificationInput).mutation(({ input, ctx }) => markNotificationRead(ctx.user.id, input.id)),
  markAllRead: adminProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
});

export const studentNotificationsRouter = router({
  list: studentProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
  markRead: studentProcedure.input(notificationInput).mutation(({ input, ctx }) => markNotificationRead(ctx.user.id, input.id)),
  markAllRead: studentProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
});
