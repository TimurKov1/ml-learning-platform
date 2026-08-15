import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("role boundaries", () => {
  it("does not permit an administrator to call student progress procedures", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "local-admin",
        username: "admin",
        passwordHash: "hashed",
        name: "Администратор",
        email: null,
        loginMethod: "password",
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    await expect(appRouter.createCaller(ctx).student.curriculum()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
