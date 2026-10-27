import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { isActiveMember, loadRoom } from "../rooms/room.access";
import type { AuthUser } from "../users/user.types";
import type { ContentDoc, CourseDoc, ModuleDoc, WithId } from "./course.types";

export async function loadCourse(courseId: string): Promise<WithId<CourseDoc>> {
  const snap = await db().collection(C.courses).doc(courseId).get();
  const c = snap.data() as CourseDoc | undefined;
  if (!c || c.deletedAt) throw Errors.notFound("Course");
  return { id: snap.id, ...c };
}

/** Course boleh diubah hanya oleh creator-nya (BR-004). */
export async function assertCourseOwner(admin: AuthUser, courseId: string): Promise<WithId<CourseDoc>> {
  const c = await loadCourse(courseId);
  if (c.creatorId !== admin.id) throw Errors.forbidden("Course ini bukan milikmu.");
  return c;
}

/**
 * BR-005 + BR-013: santri hanya boleh mengakses course PUBLISHED, melalui room AKTIF yang ia ikuti.
 * Course DRAFT/ARCHIVED → 404 (keberadaannya tidak dibocorkan).
 */
export async function assertStudentCourseAccess(user: AuthUser, courseId: string): Promise<WithId<CourseDoc>> {
  const c = await loadCourse(courseId);
  if (c.status !== "PUBLISHED") throw Errors.notFound("Course");
  const room = await loadRoom(c.roomId).catch(() => null);
  if (!room || room.status !== "ACTIVE") throw Errors.notFound("Course");
  if (!(await isActiveMember(c.roomId, user.id))) throw Errors.forbidden("Kamu bukan anggota room course ini.");
  return c;
}

export async function loadModule(moduleId: string): Promise<WithId<ModuleDoc>> {
  const snap = await db().collection(C.courseModules).doc(moduleId).get();
  const m = snap.data() as ModuleDoc | undefined;
  if (!m) throw Errors.notFound("Modul");
  return { id: snap.id, ...m };
}

export async function loadContent(contentId: string): Promise<WithId<ContentDoc>> {
  const snap = await db().collection(C.contents).doc(contentId).get();
  const c = snap.data() as ContentDoc | undefined;
  if (!c) throw Errors.notFound("Konten");
  return { id: snap.id, ...c };
}
