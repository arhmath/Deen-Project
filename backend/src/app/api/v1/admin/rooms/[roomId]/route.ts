import { db, toIso } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { protectedRoute } from "@/shared/http";
import { roomService } from "@/modules/rooms/room.service";
import { updateRoomSchema } from "@/modules/rooms/room.schema";
import { courseService } from "@/modules/courses/course.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeMember = (m: { id: string; name: string; username: string; level: number; xp: number; joinedAt: string | null }) => ({
  studentId: m.id,
  name: m.name,
  username: m.username,
  level: m.level,
  xp: m.xp,
  joinedAt: m.joinedAt ?? "",
  lastActiveAt: m.joinedAt ?? "",
});

export const GET = protectedRoute({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const roomId = params.roomId!;
  const room = await roomService.get(user, roomId);
  const members = await roomService.members(user, roomId);
  const courses = await courseService.list(user, { roomId });

  const courseCountMap = await Promise.all(
    courses.map(async (course) => {
      const [modulesSnap, contentsSnap] = await Promise.all([
        db().collection(C.courseModules).where("courseId", "==", course.id).get(),
        db().collection(C.contents).where("courseId", "==", course.id).get(),
      ]);
      return [course.id, { moduleCount: modulesSnap.size, contentCount: contentsSnap.size }] as const;
    }),
  );
  const courseMetrics = new Map(courseCountMap);

  return {
    room: {
      id: room.id,
      name: room.name,
      joinCode: room.joinCode ?? "",
      memberCount: room.memberCount,
      courseCount: courses.length,
      archived: room.status === "ARCHIVED",
      createdAt: room.createdAt ?? toIso(new Date()),
    },
    members: members.map((m) => normalizeMember({
      id: m.id,
      name: m.name,
      username: m.username,
      level: m.level,
      xp: m.xp,
      joinedAt: m.joinedAt ?? null,
    })),
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title,
      roomId: course.roomId,
      roomName: course.roomName,
      status: course.status,
      moduleCount: courseMetrics.get(course.id)?.moduleCount ?? 0,
      contentCount: courseMetrics.get(course.id)?.contentCount ?? 0,
    })),
  };
});

export const PATCH = protectedRoute({ roles: ["ADMIN"], body: updateRoomSchema }, async ({ user, params, body }) => {
  const updated = await roomService.update(user, params.roomId!, body);
  const courseCountSnap = await db().collection(C.courses).where("roomId", "==", params.roomId!).where("deletedAt", "==", null).get();
  return {
    id: updated.id,
    name: updated.name,
    joinCode: updated.joinCode ?? "",
    memberCount: updated.memberCount,
    courseCount: courseCountSnap.size,
    archived: updated.status === "ARCHIVED",
    createdAt: updated.createdAt ?? toIso(new Date()),
  };
});

export const DELETE = protectedRoute({ roles: ["ADMIN"] }, async ({ user, params }) => {
  await roomService.archive(user, params.roomId!);
  return { ok: true };
});
