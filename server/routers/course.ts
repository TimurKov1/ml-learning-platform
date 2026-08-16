import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addAssignment,
  addLessonMaterial,
  createCourseSection,
  createLesson,
  deleteAssignment,
  deleteCourseSection,
  deleteLesson,
  deleteLessonMaterial,
  getLessonDetail,
  getStudentMaterialAccessUrl,
  getStudentLeaderboard,
  listAdminLessons,
  listCourseSectionsWithLessons,
  listStudentProgress,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markLessonViewed,
  submitAssignment,
  updateAssignment,
  updateCourseSection,
  updateLessonMaterial,
  updateLesson,
} from "../db";
import { storagePut } from "../storage";
import { adminProcedure, router, studentProcedure } from "../_core/trpc";

const lessonInput = z
  .object({
    sectionId: z.number().int().positive(),
    title: z.string().trim().min(2).max(180),
    summary: z.string().trim().max(500).optional().nullable(),
    contentMode: z.enum(["text", "video", "mixed"]),
    textContent: z.string().max(30_000).optional().nullable(),
    videoUrl: z.string().url().max(2_000).optional().nullable(),
    orderIndex: z.number().int().min(0).max(10_000),
    isPublished: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const hasText = Boolean(value.textContent?.trim());
    const hasVideo = Boolean(value.videoUrl?.trim());
    const expectedMode = hasText && hasVideo ? "mixed" : hasVideo ? "video" : hasText ? "text" : null;
    if ((expectedMode && expectedMode !== value.contentMode) || (!expectedMode && value.isPublished)) {
      ctx.addIssue({ code: "custom", message: "Формат урока должен соответствовать заполненному контенту.", path: ["contentMode"] });
    }
  });

export const adminCourseRouter = router({
  sections: router({
    list: adminProcedure.query(() => listCourseSectionsWithLessons(true)),
    create: adminProcedure
      .input(z.object({ title: z.string().trim().min(2).max(160), description: z.string().trim().max(1_000).optional().nullable(), orderIndex: z.number().int().min(0).max(10_000) }))
      .mutation(({ input }) => createCourseSection(input)),
    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(2).max(160), description: z.string().trim().max(1_000).optional().nullable(), orderIndex: z.number().int().min(0).max(10_000) }))
      .mutation(({ input }) => updateCourseSection(input.id, input)),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCourseSection(input.id)),
  }),
  lessons: router({
    list: adminProcedure.query(() => listAdminLessons()),
    detail: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getLessonDetail(input.id)),
    create: adminProcedure.input(lessonInput).mutation(({ input }) => createLesson(input)),
    update: adminProcedure.input(lessonInput.safeExtend({ id: z.number().int().positive() })).mutation(({ input }) => updateLesson(input.id, input)),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteLesson(input.id)),
    materials: router({
      createLink: adminProcedure
        .input(z.object({ lessonId: z.number().int().positive(), title: z.string().trim().min(2).max(180), url: z.string().url().max(2_000), orderIndex: z.number().int().min(0).max(10_000) }))
        .mutation(({ input }) => addLessonMaterial({ lessonId: input.lessonId, title: input.title, sourceType: "link", fileUrl: input.url, fileKey: null, orderIndex: input.orderIndex })),
      uploadFile: adminProcedure
        .input(z.object({ lessonId: z.number().int().positive(), fileName: z.string().trim().min(1).max(180), contentType: z.string().trim().min(1).max(100), base64Data: z.string().min(1).max(14_000_000), orderIndex: z.number().int().min(0).max(10_000) }))
        .mutation(async ({ input, ctx }) => {
          const bytes = Buffer.from(input.base64Data, "base64");
          if (bytes.length > 10 * 1024 * 1024) {
            throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Размер файла не должен превышать 10 МБ." });
          }
          const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const { key, url } = await storagePut(`lesson-materials/${ctx.user.id}/${Date.now()}-${safeName}`, bytes, input.contentType);
          return addLessonMaterial({ lessonId: input.lessonId, title: input.fileName, sourceType: "file", fileUrl: url, fileKey: key, orderIndex: input.orderIndex });
        }),
      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteLessonMaterial(input.id)),
      update: adminProcedure
        .input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(2).max(180), url: z.string().trim().min(1).max(2_000), orderIndex: z.number().int().min(0).max(10_000) }))
        .mutation(({ input }) => updateLessonMaterial(input.id, { title: input.title, fileUrl: input.url, orderIndex: input.orderIndex })),
    }),
    assignments: router({
      create: adminProcedure
        .input(z.object({ lessonId: z.number().int().positive(), title: z.string().trim().min(2).max(180), instructions: z.string().trim().min(2).max(10_000), assignmentType: z.enum(["manual_file", "code"]).default("manual_file"), language: z.string().trim().max(32).optional().nullable(), starterCode: z.string().max(30_000).optional().nullable(), functionSignature: z.string().trim().max(500).optional().nullable(), testsJson: z.string().max(50_000).optional().nullable(), orderIndex: z.number().int().min(0).max(10_000) }))
        .mutation(({ input }) => addAssignment(input)),
      update: adminProcedure
        .input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(2).max(180), instructions: z.string().trim().min(2).max(10_000), assignmentType: z.enum(["manual_file", "code"]).default("manual_file"), language: z.string().trim().max(32).optional().nullable(), starterCode: z.string().max(30_000).optional().nullable(), functionSignature: z.string().trim().max(500).optional().nullable(), testsJson: z.string().max(50_000).optional().nullable(), orderIndex: z.number().int().min(0).max(10_000) }))
        .mutation(({ input }) => updateAssignment(input.id, input)),
      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteAssignment(input.id)),
    }),
  }),
});

export const studentCourseRouter = router({
  curriculum: studentProcedure.query(({ ctx }) => listCourseSectionsWithLessons(false, ctx.user.id)),
  lesson: studentProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
    const lesson = await getLessonDetail(input.id, false, ctx.user.id);
    if (!lesson || !lesson.isPublished) throw new TRPCError({ code: "NOT_FOUND" });
    return lesson;
  }),
  progress: studentProcedure.query(({ ctx }) => listStudentProgress(ctx.user.id)),
  leaderboard: studentProcedure.query(({ ctx }) => getStudentLeaderboard(ctx.user.id)),
  markViewed: studentProcedure.input(z.object({ lessonId: z.number().int().positive() })).mutation(({ input, ctx }) => markLessonViewed(ctx.user.id, input.lessonId)),
  submitAssignment: studentProcedure
    .input(z.object({ assignmentId: z.number().int().positive(), response: z.string().max(30_000).optional(), fileName: z.string().trim().min(1).max(180).optional(), contentType: z.string().trim().min(1).max(100).optional(), base64Data: z.string().min(1).max(14_000_000).optional() }))
    .mutation(async ({ input, ctx }) => {
      let submittedFileName: string | null = null;
      let submittedFileUrl: string | null = null;
      let submittedFileKey: string | null = null;
      if (input.base64Data && input.fileName && input.contentType) {
        const bytes = Buffer.from(input.base64Data, "base64");
        if (bytes.length > 10 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Размер файла не должен превышать 10 МБ." });
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const stored = await storagePut(`assignment-submissions/${ctx.user.id}/${Date.now()}-${safeName}`, bytes, input.contentType);
        submittedFileName = input.fileName;
        submittedFileUrl = stored.url;
        submittedFileKey = stored.key;
      }
      return submitAssignment(ctx.user.id, input.assignmentId, { response: input.response, submittedFileName, submittedFileUrl, submittedFileKey });
    }),
  notifications: router({
    list: studentProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    markRead: studentProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => markNotificationRead(ctx.user.id, input.id)),
    markAllRead: studentProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
  }),
  materials: router({
    open: studentProcedure.input(z.object({ materialId: z.number().int().positive() })).mutation(async ({ input }) => {
      const material = await getStudentMaterialAccessUrl(input.materialId);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "Материал недоступен." });
      return material;
    }),
  }),
});
