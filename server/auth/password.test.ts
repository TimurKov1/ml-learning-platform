import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("accepts the password that created the hash", async () => {
    const passwordHash = await hashPassword("secure-course-password");
    await expect(verifyPassword("secure-course-password", passwordHash)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const passwordHash = await hashPassword("secure-course-password");
    await expect(verifyPassword("incorrect-password", passwordHash)).resolves.toBe(false);
  });
});
