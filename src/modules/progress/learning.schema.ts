import { z } from "zod";
import { SAFE_ID } from "@/shared/ids";

const id = z.string().regex(SAFE_ID);

/** QuizSubmissionRequest (04-API-SPEC.yaml). `answers` wajib untuk QUIZ, opsional untuk konten lain. */
export const submitSchema = z
  .object({
    attemptId: id.optional(),
    answers: z
      .array(z.object({ questionId: id, selectedOptionIds: z.array(id).max(8).optional() }).strict())
      .max(200)
      .optional(),
    idempotencyKey: z.string().min(1).max(255).optional(),
  })
  .strict();
export type SubmitInput = z.output<typeof submitSchema>;

export const courseProgressQuery = z.object({ studentId: id.optional() });
