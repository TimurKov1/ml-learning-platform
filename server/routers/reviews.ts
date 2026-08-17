import { z } from "zod";
import { getSubmissionFileAccessUrl, listAssignmentSubmissionsForReview, reviewAssignmentSubmission } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const adminReviewsRouter = router({
  list: adminProcedure.query(() => listAssignmentSubmissionsForReview()),
  openFile: adminProcedure.input(z.object({ submissionId: z.number().int().positive() })).mutation(({ input }) => getSubmissionFileAccessUrl(input.submissionId)),
  review: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "revision"]), awardedScore: z.number().int().min(0).max(10).default(0), reviewComment: z.string().trim().max(5_000).optional().nullable() }))
    .mutation(({ input, ctx }) => reviewAssignmentSubmission({ ...input, reviewComment: input.reviewComment || null, reviewerId: ctx.user.id })),
});
