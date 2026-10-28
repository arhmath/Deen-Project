import { db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { countOf, getByIds, queryIn } from "@/shared/firestore-utils";
import { newId, slugify } from "@/shared/ids";
import { uniqueRef } from "@/shared/unique";
import { auditInTx } from "../audit/audit";
import { baseRewardOf } from "../gamification/gamification.logic";
import { assertRoomOwner, activeRoomIdsOfStudent } from "../rooms/room.access";
import type { RoomDoc, RoomMemberDoc } from "../rooms/room.types";
import { validateQuestionShape, type QuestionDoc } from "../quiz/quiz.logic";
import type { AuthUser } from "../users/user.types";
import { assertCourseOwner, assertStudentCourseAccess, loadContent, loadCourse, loadModule } from "./course.access";
import type {
  CreateContentInput, CreateCourseInput, CreateModuleInput, UpdateContentInput, UpdateCourseInput, UpdateModuleInput,
} from "./course.schema";
import { loadStructure } from "./course.structure";
import type { ContentDoc, CourseDoc, ModuleDoc, WithId } from "./course.types";

const courseDto = (c: WithId<CourseDoc>) => ({
  id: c.id, roomId: c.roomId, title: c.title, slug: c.slug, description: c.description,
  status: c.status, publishedAt: toIso(c.publishedAt), createdAt: toIso(c.createdAt),
});

export function questionsDto(qs: WithId<QuestionDoc>[], includeAnswers: boolean) {
  return [...qs].sort((a, b) => a.orderIndex - b.orderIndex).map((q) => ({
    id: q.id, text: q.text, type: q.type, points: q.points, orderIndex: q.orderIndex,
    ...(includeAnswers ? { explanation: q.explanation } : {}),
    options: [...q.options].sort((a, b) => a.orderIndex - b.orderIndex).map((o) => ({
      id: o.id, text: o.text, orderIndex: o.orderIndex, ...(includeAnswers ? { isCorrect: o.isCorrect } : {}),
    })),
  }));
}

async function loadQuestions(contentId: string): Promise<WithId<QuestionDoc>[]> {
  const snap = await db().collection(C.questions).where("contentId", "==", contentId).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as QuestionDoc) }));
}
export { loadQuestions };

function buildQuestionDocs(contentId: string, input: NonNullable<CreateContentInput["questions"]>) {
  return input.map((q, i) => {
    const err = validateQuestionShape(q);
    if (err) throw Errors.validation({ [`questions.${i}`]: err });
    const doc: QuestionDoc = {
      contentId, text: q.text, type: q.type, explanation: q.explanation ?? null, points: q.points, orderIndex: i,
      options: q.options.map((o, j) => ({ id: newId(), text: o.text, isCorrect: o.isCorrect, orderIndex: j })),
    };
    return { id: newId(), doc };
  });
}

async function fanOutNotification(roomId: string, n: { title: string; message: string; data: Record<string, unknown> }) {
  const snap = await db().collection(C.roomMembers).where("roomId", "==", roomId).where("isActive", "==", true).limit(400).get();
  if (snap.empty) return;
  const batch = db().batch();
  const now = ts();
  snap.docs.forEach((d) =>
    batch.set(db().collection(C.notifications).doc(newId()), {
      userId: (d.data() as RoomMemberDoc).userId, type: "COURSE", title: n.title, message: n.message,
      data: n.data, readAt: null, createdAt: now,
    })
  );
  await batch.commit();
}

async function hasProgress(contentIds: string[]): Promise<boolean> {
  for (const id of contentIds) {
    const s = await db().collection(C.contentProgress).where("contentId", "==", id).limit(1).get();
    if (!s.empty) return true;
  }
  return false;
}

export const courseService = {
  async create(admin: AuthUser, input: CreateCourseInput) {
    await assertRoomOwner(admin, input.roomId); // hanya di room miliknya
    const id = newId();
    const now = ts();
    const base = slugify(input.title);
    for (let n = 0; n < 20; n++) {
      const slug = n === 0 ? base : `${base}-${n + 1}`;
      const key = uniqueRef("courseSlug", `${input.roomId}:${slug}`);
      const ok = await db().runTransaction(async (tx) => {
        if ((await tx.get(key)).exists) return false;
        const doc: CourseDoc = {
          roomId: input.roomId, creatorId: admin.id, title: input.title, slug, description: input.description ?? null,
          thumbnailUrl: null, status: "DRAFT", publishedAt: null, createdAt: now, updatedAt: now, deletedAt: null,
        };
        tx.create(db().collection(C.courses).doc(id), doc);
        tx.create(db().collection(C.courseModules).doc(newId()), {
          courseId: id,
          title: "Modul 1",
          description: null,
          orderIndex: 0,
          createdAt: now,
          updatedAt: now,
        } satisfies ModuleDoc);
        tx.create(key, { courseId: id, type: "courseSlug", createdAt: now });
        auditInTx(tx, { actorId: admin.id, action: "COURSE_CREATED", entityType: "course", entityId: id });
        return true;
      });
      if (ok) return courseDto(await loadCourse(id));
    }
    throw Errors.conflict("Gagal membuat slug course. Ubah judulnya sedikit.");
  },

  /**
   * `includeArchived` hanya berlaku untuk ADMIN: halaman "Pembelajaran" admin butuh course
   * ARCHIVED juga supaya folder "Diarsipkan" terisi. Tanpa flag ini, ARCHIVED tetap disembunyikan.
   */
  async list(user: AuthUser, q: { roomId?: string; status?: string; includeArchived?: boolean }) {
    let courses: WithId<CourseDoc>[];
    if (user.role === "ADMIN") {
      const snap = await db().collection(C.courses).where("creatorId", "==", user.id).get();
      courses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CourseDoc) }));
      if (q.status) courses = courses.filter((c) => c.status === q.status);
      else if (!q.includeArchived) courses = courses.filter((c) => c.status !== "ARCHIVED");
    } else {
      const roomIds = await activeRoomIdsOfStudent(user.id);
      const rows = await queryIn<CourseDoc>((vals) => db().collection(C.courses).where("roomId", "in", vals).where("status", "==", "PUBLISHED"), roomIds);
      courses = rows.map((r) => ({ id: r.id, ...r.data }));
    }
    courses = courses.filter((c) => !c.deletedAt && (!q.roomId || c.roomId === q.roomId));
    const rooms = await getByIds<RoomDoc>(C.rooms, courses.map((c) => c.roomId));
    const rName = new Map(rooms.map((r) => [r.id, r.data.name]));
    return courses.sort((a, b) => a.title.localeCompare(b.title)).map((c) => ({ ...courseDto(c), roomName: rName.get(c.roomId) ?? "-" }));
  },

  async get(user: AuthUser, courseId: string) {
    const course = user.role === "ADMIN" ? await assertCourseOwner(user, courseId) : await assertStudentCourseAccess(user, courseId);
    const isOwner = user.role === "ADMIN";
    const { modules, contents } = await loadStructure(courseId, { publishedOnly: !isOwner });
    let done = new Set<string>();
    if (!isOwner) {
      const p = await db().collection(C.contentProgress).where("studentId", "==", user.id).where("courseId", "==", courseId).get();
      done = new Set(p.docs.filter((d) => d.data().status === "COMPLETED").map((d) => d.data().contentId as string));
    }
    return {
      ...courseDto(course),
      modules: modules.map((m) => ({
        id: m.id, title: m.title, description: m.description, orderIndex: m.orderIndex,
        contents: contents.filter((c) => c.moduleId === m.id).map((c) => ({
          id: c.id, type: c.type, title: c.title, description: c.description, orderIndex: c.orderIndex,
          rewardXp: baseRewardOf(c).xp, isPublished: c.isPublished,
          ...(isOwner ? {} : { completed: done.has(c.id) }),
        })),
      })),
    };
  },

  async update(admin: AuthUser, courseId: string, input: UpdateCourseInput) {
    const course = await assertCourseOwner(admin, courseId);
    if (course.status === "ARCHIVED") throw Errors.conflict("Course yang diarsipkan tidak bisa diubah.");
    const patch: Record<string, any> = { updatedAt: ts() }; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    let publishing = false;
    if (input.status !== undefined && input.status !== course.status) {
      if (input.status === "PUBLISHED") {
        const n = await countOf(db().collection(C.contents).where("courseId", "==", courseId).where("isPublished", "==", true));
        if (n === 0) throw Errors.conflict("Course belum punya konten yang dipublikasikan.");
        patch.publishedAt = course.publishedAt ?? ts();
        publishing = true;
      }
      patch.status = input.status;
    }
    await db().runTransaction(async (tx) => {
      tx.update(db().collection(C.courses).doc(courseId), patch);
      auditInTx(tx, { actorId: admin.id, action: publishing ? "COURSE_PUBLISHED" : "COURSE_UPDATED", entityType: "course", entityId: courseId });
    });
    if (publishing && !course.publishedAt) {
      await fanOutNotification(course.roomId, {
        title: "Course baru tersedia", message: `Course "${course.title}" sudah bisa dipelajari.`, data: { courseId },
      }).catch(() => undefined);
    }
    return courseDto(await loadCourse(courseId));
  },

  /** DELETE → diarsipkan (soft). */
  async archive(admin: AuthUser, courseId: string): Promise<void> {
    await assertCourseOwner(admin, courseId);
    await db().runTransaction(async (tx) => {
      tx.update(db().collection(C.courses).doc(courseId), { status: "ARCHIVED", updatedAt: ts() });
      auditInTx(tx, { actorId: admin.id, action: "COURSE_ARCHIVED", entityType: "course", entityId: courseId });
    });
  },

  /**
   * Hapus course dari arsip (soft delete lewat `deletedAt`, sama seperti pola room/user).
   * Hanya course yang sudah ARCHIVED yang boleh dihapus, supaya tidak terhapus tak sengaja.
   */
  async remove(admin: AuthUser, courseId: string): Promise<void> {
    const course = await assertCourseOwner(admin, courseId);
    if (course.status !== "ARCHIVED") throw Errors.conflict("Arsipkan course dulu sebelum menghapusnya.");
    await db().runTransaction(async (tx) => {
      tx.update(db().collection(C.courses).doc(courseId), { deletedAt: ts(), updatedAt: ts() });
      auditInTx(tx, { actorId: admin.id, action: "COURSE_DELETED", entityType: "course", entityId: courseId });
    });
  },

  /* ---------------- modul ---------------- */
  async listModules(user: AuthUser, courseId: string) {
    return (await this.get(user, courseId)).modules.map(({ contents: _c, ...m }) => m);
  },

  async createModule(admin: AuthUser, courseId: string, input: CreateModuleInput) {
    await assertCourseOwner(admin, courseId);
    const count = await countOf(db().collection(C.courseModules).where("courseId", "==", courseId));
    const id = newId();
    const now = ts();
    const doc: ModuleDoc = { courseId, title: input.title, description: input.description ?? null, orderIndex: input.orderIndex ?? count, createdAt: now, updatedAt: now };
    await db().collection(C.courseModules).doc(id).create(doc);
    return { id, title: doc.title, description: doc.description, orderIndex: doc.orderIndex };
  },

  async updateModule(admin: AuthUser, moduleId: string, input: UpdateModuleInput) {
    const m = await loadModule(moduleId);
    await assertCourseOwner(admin, m.courseId);
    const patch: Record<string, any> = { updatedAt: ts() }; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const k of ["title", "description", "orderIndex"] as const) if (input[k] !== undefined) patch[k] = input[k];
    await db().collection(C.courseModules).doc(moduleId).update(patch);
    const n = await loadModule(moduleId);
    return { id: n.id, title: n.title, description: n.description, orderIndex: n.orderIndex };
  },

  async deleteModule(admin: AuthUser, moduleId: string): Promise<void> {
    const m = await loadModule(moduleId);
    await assertCourseOwner(admin, m.courseId);
    const cs = await db().collection(C.contents).where("moduleId", "==", moduleId).get();
    if (await hasProgress(cs.docs.map((d) => d.id))) {
      throw Errors.conflict("Modul sudah dikerjakan santri. Arsipkan course atau sembunyikan kontennya.");
    }
    const batch = db().batch();
    for (const c of cs.docs) {
      const qs = await db().collection(C.questions).where("contentId", "==", c.id).get();
      qs.docs.forEach((q) => batch.delete(q.ref));
      batch.delete(c.ref);
    }
    batch.delete(db().collection(C.courseModules).doc(moduleId));
    await batch.commit();
  },

  /* ---------------- konten ---------------- */
  async listContents(user: AuthUser, moduleId: string) {
    const m = await loadModule(moduleId);
    const course = await this.get(user, m.courseId);
    return course.modules.find((x) => x.id === moduleId)?.contents ?? [];
  },

  async createContent(admin: AuthUser, moduleId: string, input: CreateContentInput) {
    const m = await loadModule(moduleId);
    await assertCourseOwner(admin, m.courseId);
    if (input.questions?.length && input.type !== "QUIZ") throw Errors.validation({ questions: "Pertanyaan hanya untuk konten bertipe QUIZ." });
    const count = await countOf(db().collection(C.contents).where("moduleId", "==", moduleId));
    const id = newId();
    const now = ts();
    const doc: ContentDoc = {
      moduleId, courseId: m.courseId, type: input.type, title: input.title, description: input.description ?? null,
      body: input.body ?? {}, xpReward: input.xpReward ?? 0, pointReward: input.pointReward ?? 0,
      orderIndex: input.orderIndex ?? count, isPublished: input.isPublished ?? true, createdAt: now, updatedAt: now,
    };
    const qs = input.questions ? buildQuestionDocs(id, input.questions) : [];
    const batch = db().batch();
    batch.create(db().collection(C.contents).doc(id), doc);
    qs.forEach((q) => batch.create(db().collection(C.questions).doc(q.id), q.doc));
    await batch.commit();
    return this.getContent(admin, id);
  },

  async getContent(user: AuthUser, contentId: string) {
    const content = await loadContent(contentId);
    const isOwner = user.role === "ADMIN";
    if (isOwner) await assertCourseOwner(user, content.courseId);
    else {
      await assertStudentCourseAccess(user, content.courseId);
      if (!content.isPublished) throw Errors.notFound("Konten");
    }
    const questions = content.type === "QUIZ" ? await loadQuestions(contentId) : [];
    return {
      id: content.id, moduleId: content.moduleId, courseId: content.courseId, type: content.type, title: content.title,
      description: content.description, body: content.body, rewardXp: baseRewardOf(content).xp, orderIndex: content.orderIndex,
      isPublished: content.isPublished,
      // kunci jawaban & pembahasan hanya untuk guru pemilik; santri menerimanya setelah submit
      questions: questionsDto(questions, isOwner),
    };
  },

  async updateContent(admin: AuthUser, contentId: string, input: UpdateContentInput) {
    const content = await loadContent(contentId);
    await assertCourseOwner(admin, content.courseId);
    const type = input.type ?? content.type;
    if (input.questions && type !== "QUIZ") throw Errors.validation({ questions: "Pertanyaan hanya untuk konten bertipe QUIZ." });
    const patch: Record<string, any> = { updatedAt: ts() }; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const k of ["type", "title", "description", "body", "xpReward", "pointReward", "orderIndex", "isPublished"] as const) {
      if (input[k] !== undefined) patch[k] = input[k];
    }
    const batch = db().batch();
    batch.update(db().collection(C.contents).doc(contentId), patch);
    if (input.questions) {
      // melindungi integritas riwayat attempt
      const attempts = await db().collection(C.quizAttempts).where("contentId", "==", contentId).limit(1).get();
      if (!attempts.empty) throw Errors.conflict("Kuis sudah dikerjakan santri; pertanyaan tidak bisa diganti.");
      (await db().collection(C.questions).where("contentId", "==", contentId).get()).docs.forEach((d) => batch.delete(d.ref));
      buildQuestionDocs(contentId, input.questions).forEach((q) => batch.create(db().collection(C.questions).doc(q.id), q.doc));
    }
    await batch.commit();
    return this.getContent(admin, contentId);
  },

  async deleteContent(admin: AuthUser, contentId: string): Promise<void> {
    const content = await loadContent(contentId);
    await assertCourseOwner(admin, content.courseId);
    if (await hasProgress([contentId])) throw Errors.conflict("Konten sudah dikerjakan santri. Sembunyikan dengan isPublished=false.");
    const batch = db().batch();
    (await db().collection(C.questions).where("contentId", "==", contentId).get()).docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db().collection(C.contents).doc(contentId));
    await batch.commit();
  },
};

