import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const db = { listNotifications: vi.fn(), markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn() };
vi.mock("../db", () => db);

const { adminNotificationsRouter, studentNotificationsRouter } = await import("./notifications");

const base = { openId: "local", username: "user", passwordHash: "hash", name: "Тест", email: null, loginMethod: "password", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as const;
function context(role: "admin" | "user", id: number): TrpcContext { return { user: { ...base, id, role }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("notifications routers", () => {
  it("lists and marks an administrator notification read", async () => {
    const item = { id: 4, title: "Новое решение", message: "Анна отправила работу", isRead: false, createdAt: new Date() };
    db.listNotifications.mockResolvedValue([item]);
    db.markNotificationRead.mockResolvedValue({ success: true });
    const caller = adminNotificationsRouter.createCaller(context("admin", 1));
    await expect(caller.list()).resolves.toEqual([item]);
    await expect(caller.markRead({ id: 4 })).resolves.toEqual({ success: true });
    expect(db.markNotificationRead).toHaveBeenCalledWith(1, 4);
  });

  it("allows a student to mark all result notifications read", async () => {
    db.markAllNotificationsRead.mockResolvedValue({ success: true });
    const caller = studentNotificationsRouter.createCaller(context("user", 7));
    await expect(caller.markAllRead()).resolves.toEqual({ success: true });
    expect(db.markAllNotificationsRead).toHaveBeenCalledWith(7);
  });
});
