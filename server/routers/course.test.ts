import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const db = {
  addAssignment: vi.fn(), addLessonMaterial: vi.fn(), createCourseSection: vi.fn(), createLesson: vi.fn(), deleteAssignment: vi.fn(), deleteCourseSection: vi.fn(), deleteLesson: vi.fn(), deleteLessonMaterial: vi.fn(), getLessonDetail: vi.fn(), getStudentMaterialAccessUrl: vi.fn(), listAdminLessons: vi.fn(), listCourseSectionsWithLessons: vi.fn(), listStudentProgress: vi.fn(), markLessonViewed: vi.fn(), submitAssignment: vi.fn(), updateAssignment: vi.fn(), updateCourseSection: vi.fn(), updateLessonMaterial: vi.fn(), updateLesson: vi.fn(),
};

vi.mock("../db", () => db);
vi.mock("../storage", () => ({ storagePut: vi.fn() }));

const { adminCourseRouter, studentCourseRouter } = await import("./course");

function context(role: "admin" | "user"): TrpcContext {
  return { user: { id: 42, openId: "local-test", username: "test", passwordHash: "hash", name: "Тест", email: null, loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("course routers", () => {
  it("creates a section through the admin route", async () => {
    db.createCourseSection.mockResolvedValue({ id: 7 });
    const result = await adminCourseRouter.createCaller(context("admin")).sections.create({ title: "Введение", description: "Старт", orderIndex: 0 });
    expect(result).toEqual({ id: 7 });
    expect(db.createCourseSection).toHaveBeenCalledWith({ title: "Введение", description: "Старт", orderIndex: 0 });
  });

  it("returns curriculum for a student account only", async () => {
    const curriculum = [{ id: 1, title: "Основы", lessons: [] }];
    db.listCourseSectionsWithLessons.mockResolvedValue(curriculum);
    await expect(studentCourseRouter.createCaller(context("user")).curriculum()).resolves.toEqual(curriculum);
    expect(db.listCourseSectionsWithLessons).toHaveBeenCalledWith(false, 42);
  });

  it("opens a published lesson, marks it viewed and saves assignment completion", async () => {
    db.getLessonDetail.mockResolvedValue({ id: 3, isPublished: true, materials: [], assignments: [] });
    db.markLessonViewed.mockResolvedValue({ success: true });
    db.submitAssignment.mockResolvedValue({ success: true });
    const caller = studentCourseRouter.createCaller(context("user"));
    await expect(caller.lesson({ id: 3 })).resolves.toMatchObject({ id: 3 });
    await expect(caller.markViewed({ lessonId: 3 })).resolves.toEqual({ success: true });
    await expect(caller.submitAssignment({ assignmentId: 11, response: "Ссылка на решение" })).resolves.toEqual({ success: true });
    expect(db.getLessonDetail).toHaveBeenCalledWith(3, false, 42);
    expect(db.markLessonViewed).toHaveBeenCalledWith(42, 3);
    expect(db.submitAssignment).toHaveBeenCalledWith(42, 11, {
      response: "Ссылка на решение",
      submittedFileName: null,
      submittedFileUrl: null,
      submittedFileKey: null,
    });
  });

  it("returns an authenticated file URL only for a student material request", async () => {
    db.getStudentMaterialAccessUrl.mockResolvedValue({ url: "https://signed-storage.example/material.pdf" });
    const caller = studentCourseRouter.createCaller(context("user"));
    await expect(caller.materials.open({ materialId: 8 })).resolves.toEqual({ url: "https://signed-storage.example/material.pdf" });
    expect(db.getStudentMaterialAccessUrl).toHaveBeenCalledWith(8);
  });
});
