import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { adminStudentsRouter, localAuthRouter } from "./routers/auth";
import { adminCourseRouter, studentCourseRouter } from "./routers/course";
import { adminReviewsRouter } from "./routers/reviews";

export const appRouter = router({
  system: systemRouter,
  auth: localAuthRouter,
  admin: router({ course: adminCourseRouter, students: adminStudentsRouter, reviews: adminReviewsRouter }),
  student: studentCourseRouter,
});

export type AppRouter = typeof appRouter;
