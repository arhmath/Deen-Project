import { db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { createCourseSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
import { protectedRoute, created } from "@/shared/http";
import type { CourseDoc } from "@/modules/courses/course.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const courseSummary = async (course: { id: string; title: string; roomId: string; roomName: string; status: string }) => {
  const [modulesSnap, contentsSnap] = await Promise.all([
    db().collection(C.courseModules).where("courseId", "==", course.id).get(),
    db().collection(C.contents).where("courseId", "==", course.id).get(),
  ]);

  return {
    id: course.id,
    title: course.title,
    roomId: course.roomId,
    roomName: course.roomName,
    status: course.status,
    moduleCount: modulesSnap.size,
    contentCount: contentsSnap.size,
  };
};

export const GET = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"] }, async ({ user }) => {
  // includeArchived: course ARCHIVED harus ikut supaya folder "Diarsipkan" di frontend terisi.
  const courses = await courseService.list(user, { includeArchived: true });
  return Promise.all(courses.map((course) => courseSummary(course)));
});

export const POST = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"], body: createCourseSchema }, async ({ user, body }) => {
  const createdCourse = await courseService.create(user, body);
  const course = await courseService.get(user, createdCourse.id);
  const roomSnap = await db().collection(C.rooms).doc(course.roomId).get();
  const roomName = (roomSnap.data() as { name?: string } | undefined)?.name ?? "";

  const modules = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    contents: (module.contents ?? []).map((content) => ({
      id: content.id,
      title: content.title,
      type: content.type === "ARTICLE" ? "LESSON" : content.type,
      sections: Array.isArray((content as any).sections) ? (content as any).sections : [],
      cards: Array.isArray((content as any).cards) ? (content as any).cards : [],
      questions: Array.isArray((content as any).questions) ? (content as any).questions : [],
    })),
  }));

  const response: Record<string, unknown> = {
    id: course.id,
    roomId: course.roomId,
    roomName,
    title: course.title,
    description: course.description ?? "",
    status: course.status,
    modules,
    updatedAt: typeof course.createdAt === "string" ? course.createdAt : toIso(ts()),
  };

  return created(response);
});
