import { z } from "zod";
import { listAssignmentSubmissionsForReview, reviewAssignmentSubmission } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const adminReviewsRouter = router({
  list: adminProcedure.query(() => listAssignmentSubmissionsForReview()),
  review: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "revision"]), reviewComment: z.string().trim().max(5_000).optional().nullable() }))
    .mutation(({ input, ctx }) => reviewAssignmentSubmission({ ...input, reviewComment: input.reviewComment || null, reviewerId: ctx.user.id })),
});
