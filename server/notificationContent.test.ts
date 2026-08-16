import { describe, expect, it } from "vitest";
import { autoCheckMessage, reviewMessage, submissionReceivedMessage } from "./notificationContent";

describe("notification content", () => {
  it("describes a new submission for an administrator", () => {
    expect(submissionReceivedMessage("Анна", "Сумма массива")).toContain("Анна");
    expect(submissionReceivedMessage("Анна", "Сумма массива")).toContain("Сумма массива");
  });

  it("describes both automatic check outcomes", () => {
    expect(autoCheckMessage("Сортировка", true)).toContain("пройдено автоматически");
    expect(autoCheckMessage("Сортировка", false)).toContain("непройденные тесты");
  });

  it("describes manual review outcomes and preserves comments", () => {
    expect(reviewMessage("Отчёт", "approved")).toContain("зачтено");
    expect(reviewMessage("Отчёт", "revision", "Добавьте выводы")).toContain("Добавьте выводы");
  });
});
