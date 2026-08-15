import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const db = { createStudentAccount: vi.fn(), deleteStudentAccount: vi.fn(), ensureAdminAccount: vi.fn(), getLocalUserByUsername: vi.fn(), getStudentStats: vi.fn(), listStudentAccounts: vi.fn(), setStudentActive: vi.fn(), updateStudentAccount: vi.fn() };
vi.mock("../db", () => db);

const { adminStudentsRouter } = await import("./auth");

function context(): TrpcContext {
  return { user: { id: 1, openId: "local-admin", username: "admin", passwordHash: "hash", name: "Администратор", email: null, loginMethod: "password", role: "admin", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("student account administration", () => {
  it("creates an account with a derived password hash rather than raw password", async () => {
    db.getLocalUserByUsername.mockResolvedValue(null);
    db.createStudentAccount.mockResolvedValue({ id: 8, username: "anna.pet" });
    await adminStudentsRouter.createCaller(context()).create({ name: "Анна Петрова", username: "anna.pet", password: "secret7" });
    expect(db.createStudentAccount).toHaveBeenCalledWith(expect.objectContaining({ name: "Анна Петрова", username: "anna.pet", passwordHash: expect.any(String) }));
    expect(db.createStudentAccount.mock.calls[0][0].passwordHash).not.toBe("secret7");
  });

  it("updates and deletes an administrator-managed student account", async () => {
    db.getLocalUserByUsername.mockResolvedValue({ id: 8, username: "anna.pet" });
    db.updateStudentAccount.mockResolvedValue({ success: true });
    db.deleteStudentAccount.mockResolvedValue({ success: true });
    const caller = adminStudentsRouter.createCaller(context());
    await expect(caller.update({ id: 8, name: "Анна", username: "anna.pet", password: undefined })).resolves.toEqual({ success: true });
    await expect(caller.delete({ id: 8 })).resolves.toEqual({ success: true });
    expect(db.updateStudentAccount).toHaveBeenCalledWith(8, expect.objectContaining({ name: "Анна", username: "anna.pet" }));
    expect(db.deleteStudentAccount).toHaveBeenCalledWith(8);
  });
});
