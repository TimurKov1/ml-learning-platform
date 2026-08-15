import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const db = { listAssignmentSubmissionsForReview: vi.fn(), reviewAssignmentSubmission: vi.fn() };
vi.mock("../db", () => db);

const { adminReviewsRouter } = await import("./reviews");

function context(): TrpcContext {
  return { user: { id: 9, openId: "local-admin", username: "admin", passwordHash: "hash", name: "Администратор", email: null, loginMethod: "password", role: "admin", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("admin review queue", () => {
  it("lists submitted solutions and records an approval by the administrator", async () => {
    db.listAssignmentSubmissionsForReview.mockResolvedValue([{ id: 3, status: "pending" }]);
    db.reviewAssignmentSubmission.mockResolvedValue({ success: true });
    const caller = adminReviewsRouter.createCaller(context());
    await expect(caller.list()).resolves.toEqual([{ id: 3, status: "pending" }]);
    await expect(caller.review({ id: 3, status: "approved", reviewComment: "Верно" })).resolves.toEqual({ success: true });
    expect(db.reviewAssignmentSubmission).toHaveBeenCalledWith({ id: 3, status: "approved", reviewComment: "Верно", reviewerId: 9 });
  });

  it("allows returning a solution for revision with feedback", async () => {
    db.reviewAssignmentSubmission.mockResolvedValue({ success: true });
    const caller = adminReviewsRouter.createCaller(context());
    await expect(caller.review({ id: 4, status: "revision", reviewComment: "Поясните расчёт на втором шаге." })).resolves.toEqual({ success: true });
    expect(db.reviewAssignmentSubmission).toHaveBeenCalledWith({ id: 4, status: "revision", reviewComment: "Поясните расчёт на втором шаге.", reviewerId: 9 });
  });
});
