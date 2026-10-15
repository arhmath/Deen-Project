import { z } from "zod";
import { SAFE_ID } from "@/shared/ids";

const id = z.string().regex(SAFE_ID, "ID tidak valid");

export const createCourseSchema = z
  .object({
    roomId: id,
    title: z.string().trim().min(3, "Judul minimal 3 karakter").max(200),
    description: z.string().trim().max(5000).optional(),
  })
  .strict();
export type CreateCourseInput = z.output<typeof createCourseSchema>;

export const updateCourseSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    // ARCHIVED hanya lewat DELETE /courses/:id
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada data yang diubah" });
export type UpdateCourseInput = z.output<typeof updateCourseSchema>;

export const listCoursesQuery = z.object({
  roomId: id.optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const createModuleSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).optional(),
    orderIndex: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();
export type CreateModuleInput = z.output<typeof createModuleSchema>;

export const updateModuleSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    orderIndex: z.number().int().min(0).max(10_000).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada data yang diubah" });
export type UpdateModuleInput = z.output<typeof updateModuleSchema>;

export const questionSchema = z
  .object({
    text: z.string().trim().min(1).max(2000),
    type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]).default("SINGLE_CHOICE"),
    explanation: z.string().trim().max(2000).optional(),
    points: z.number().int().min(0).max(100).default(1),
    options: z
      .array(z.object({ text: z.string().trim().min(1).max(500), isCorrect: z.boolean() }).strict())
      .min(2)
      .max(8),
  })
  .strict();

const contentFields = {
  type: z.enum(["LESSON", "QUIZ", "FLASHCARD", "CHALLENGE", "VIDEO", "ARTICLE"]),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  xpReward: z.number().int().min(0).max(1000).optional(),
  pointReward: z.number().int().min(0).max(1000).optional(),
  orderIndex: z.number().int().min(0).max(10_000).optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(questionSchema).max(100).optional(),
};

export const createContentSchema = z.object(contentFields).strict();
export type CreateContentInput = z.output<typeof createContentSchema>;

export const updateContentSchema = z
  .object({ ...contentFields, description: z.string().trim().max(2000).nullable().optional() })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada data yang diubah" });
export type UpdateContentInput = z.output<typeof updateContentSchema>;
