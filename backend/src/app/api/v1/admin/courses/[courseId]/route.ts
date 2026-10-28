import { z } from "zod";
import { db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { noContent, protectedRoute } from "@/shared/http";
import { courseService } from "@/modules/courses/course.service";
import { loadContent } from "@/modules/courses/course.access";
import type { ContentDoc, CourseDoc, ModuleDoc } from "@/modules/courses/course.types";
import type { QuestionDoc } from "@/modules/quiz/quiz.logic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Skema body untuk PUT. Tanpa skema, `protectedRoute` tidak membaca body sehingga
 * `body` bernilai undefined dan `input.modules` melempar TypeError (HTTP 500).
 * `passthrough()` dipakai karena struktur konten (lesson/flashcard/quiz) bervariasi.
 */
const adminCourseUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    modules: z
      .array(
        z
          .object({
            id: z.string().optional(),
            title: z.string().optional(),
            contents: z
              .array(
                z
                  .object({
                    id: z.string().optional(),
                    title: z.string().optional(),
                    type: z.enum(["LESSON", "FLASHCARD", "QUIZ"]),
                    sections: z.array(z.any()).optional(),
                    cards: z.array(z.any()).optional(),
                    questions: z.array(z.any()).optional(),
                  })
                  .passthrough()
              )
              .optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

const normalizeCourseDoc = async (course: Awaited<ReturnType<typeof courseService.get>>) => {
  const roomSnap = await db().collection(C.rooms).doc(course.roomId).get();
  const roomName = (roomSnap.data() as { name?: string } | undefined)?.name ?? "";

  const modules = await Promise.all(course.modules.map(async (module) => ({
    id: module.id,
    title: module.title,
    contents: await Promise.all((module.contents ?? []).map(async (content) => {
      const contentDoc = await loadContent(content.id);
      const questionsSnap = await db().collection(C.questions).where("contentId", "==", content.id).get();
      const questions = questionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as QuestionDoc) })).sort((a, b) => a.orderIndex - b.orderIndex);

      if (content.type === "QUIZ") {
        return {
          id: content.id,
          title: content.title,
          type: "QUIZ",
          questions: questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options.map((o) => ({ id: o.id, text: o.text })),
            correctOptionId: q.options.find((o) => o.isCorrect)?.id ?? "",
            explanation: q.explanation ?? "",
          })),
          sections: [],
          cards: [],
        };
      }

      if (content.type === "FLASHCARD") {
        return {
          id: content.id,
          title: content.title,
          type: "FLASHCARD",
          sections: [],
          cards: Array.isArray((contentDoc.body as Record<string, unknown>)?.cards) ? ((contentDoc.body as Record<string, unknown>).cards as Array<{ id: string; front: string; back: string }>) : [],
          questions: [],
        };
      }

      return {
        id: content.id,
        title: content.title,
        type: "LESSON",
        sections: Array.isArray((contentDoc.body as Record<string, unknown>)?.sections)
          ? ((contentDoc.body as Record<string, unknown>).sections as Array<{ heading?: string; text: string }>)
          : [{ text: typeof (contentDoc.body as Record<string, unknown>)?.text === "string" ? (contentDoc.body as Record<string, unknown>).text as string : "" }],
        cards: [],
        questions: [],
      };
    })),
  })));

  return {
    id: course.id,
    roomId: course.roomId,
    roomName,
    title: course.title,
    description: course.description ?? "",
    status: course.status,
    modules,
    updatedAt: typeof course.createdAt === "string" ? course.createdAt : toIso(ts()),
  };
};

export const GET = protectedRoute({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const course = await courseService.get(user, params.courseId!);
  return normalizeCourseDoc(course);
});

export const PUT = protectedRoute({ roles: ["ADMIN"], body: adminCourseUpdateSchema, maxBodyBytes: 5_000_000 }, async ({ user, params, body }) => {
  const input = body;
  const courseId = params.courseId!;
  // Memastikan course ada dan milik admin ini (melempar 404/403 yang sesuai).
  await courseService.get(user, courseId);
  const courseSnap = await db().collection(C.courses).doc(courseId).get();

  const now = ts();
  const existingModulesSnap = await db().collection(C.courseModules).where("courseId", "==", courseId).get();
  const existingContentsSnap = await db().collection(C.contents).where("courseId", "==", courseId).get();
  const batch = db().batch();

  for (const doc of existingContentsSnap.docs) {
    const contentId = doc.id;
    const qSnap = await db().collection(C.questions).where("contentId", "==", contentId).get();
    qSnap.docs.forEach((q) => batch.delete(q.ref));
    batch.delete(doc.ref);
  }
  existingModulesSnap.docs.forEach((doc) => batch.delete(doc.ref));

  for (const [moduleIndex, module] of (input.modules ?? []).entries()) {
    const moduleId = module.id ?? crypto.randomUUID();
    batch.set(db().collection(C.courseModules).doc(moduleId), {
      courseId,
      title: module.title ?? "Modul",
      description: null,
      orderIndex: moduleIndex,
      createdAt: now,
      updatedAt: now,
    } satisfies ModuleDoc);

    for (const [contentIndex, content] of (module.contents ?? []).entries()) {
      const contentId = content.id ?? crypto.randomUUID();
      const contentType = content.type === "LESSON" ? "ARTICLE" : content.type === "FLASHCARD" ? "FLASHCARD" : "QUIZ";
      const bodyForDb: Record<string, unknown> =
        content.type === "LESSON" ? { sections: content.sections ?? [] } :
        content.type === "FLASHCARD" ? { cards: content.cards ?? [] } :
        { questions: content.questions ?? [] };

      batch.set(db().collection(C.contents).doc(contentId), {
        moduleId,
        courseId,
        type: contentType,
        title: content.title ?? "Materi",
        description: null,
        body: bodyForDb,
        xpReward: 0,
        pointReward: 0,
        orderIndex: contentIndex,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      } satisfies ContentDoc);

      if (content.type === "QUIZ") {
        for (const [questionIndex, question] of (content.questions ?? []).entries()) {
          batch.set(db().collection(C.questions).doc(question.id ?? crypto.randomUUID()), {
            contentId,
            text: question.text,
            type: "SINGLE_CHOICE",
            explanation: question.explanation ?? null,
            points: 1,
            orderIndex: questionIndex,
            options: (question.options ?? []).map((option: { id: string; text: string }, optionIndex: number) => ({
              id: option.id,
              text: option.text,
              isCorrect: option.id === question.correctOptionId,
              orderIndex: optionIndex,
            })),
          } satisfies QuestionDoc);
        }
      }
    }
  }

  const newStatus = input.status ?? courseSnap.data()?.status ?? "DRAFT";
  batch.update(db().collection(C.courses).doc(courseId), {
    title: input.title ?? courseSnap.data()?.title ?? "Course",
    description: input.description ?? null,
    status: newStatus,
    ...(newStatus === "PUBLISHED" && !courseSnap.data()?.publishedAt ? { publishedAt: now } : {}),
    updatedAt: now,
  });
  await batch.commit();
  const updated = await courseService.get(user, courseId);
  return normalizeCourseDoc(updated);
});

/** Hapus course yang sudah diarsipkan (soft delete). Course yang belum diarsipkan ditolak (409). */
export const DELETE = protectedRoute({ roles: ["ADMIN"] }, async ({ user, params }) => {
  await courseService.remove(user, params.courseId!);
  return noContent();
});
