import { z } from "zod";
import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { chunk, queryIn } from "@/shared/firestore-utils";
import { WEEK_LABELS, addDays, dayKey, weekdayOf } from "@/shared/time";
import { getByIds } from "@/shared/firestore-utils";
import { ownedRoomIds } from "../rooms/room.access";
import type { RoomDoc, RoomMemberDoc } from "../rooms/room.types";
import type { AuthUser } from "../users/user.types";
import { buildStudentRows, type StudentProgress } from "./student-rows";

export const studentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(8),
  q: z.string().trim().max(100).optional(),
  room: z.string().trim().max(150).optional(),
  sort: z.enum(["xp", "name", "progress", "streak", "lastActive"]).default("xp"),
});

/** Santri aktif di seluruh room milik guru (BR-004: hanya room miliknya). */
export async function adminScope(admin: AuthUser) {
  const roomIds = admin.role === "SUPERADMIN"
    ? (await db().collection(C.rooms).get()).docs
        .filter((d) => !(d.data() as RoomDoc).deletedAt)
        .map((d) => d.id)
    : await ownedRoomIds(admin.id);
  const members = await queryIn<RoomMemberDoc>((v) => db().collection(C.roomMembers).where("roomId", "in", v).where("isActive", "==", true), roomIds);
  const studentIds = [...new Set(members.map((m) => m.data.userId))];
  return { roomIds, studentIds };
}

const daysSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86_400_000;

export const monitoringService = {
  async overview(admin: AuthUser) {
    const { roomIds, studentIds } = await adminScope(admin);
    const rows = await buildStudentRows(studentIds, roomIds);
    const today = dayKey();
    const start = addDays(today, -6);

    const inScope = new Set(rows.map((r) => r.id));
    const perDay = new Map<string, { active: Set<string>; checked: Set<string> }>();
    for (let i = 0; i < 7; i++) perDay.set(addDays(start, i), { active: new Set(), checked: new Set() });
    for (const part of chunk(roomIds, 30)) {
      const snap = await db().collection(C.dailyActivity).where("roomIds", "array-contains-any", part).where("date", ">=", start).get();
      snap.docs.forEach((d) => {
        const x = d.data();
        const bucket = perDay.get(x.date as string);
        if (!bucket || !inScope.has(x.userId as string)) return;
        bucket.active.add(x.userId);
        if (x.checkedIn) bucket.checked.add(x.userId);
      });
    }
    const activity = [...perDay.entries()].map(([date, b]) => ({
      date, label: date === today ? "Hari ini" : WEEK_LABELS[weekdayOf(date)]!, activeStudents: b.active.size, checkIns: b.checked.size,
    }));
    const t = perDay.get(today)!;
    const withQuiz = rows.filter((r) => r.avgScore > 0);
    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

    return {
      totalStudents: rows.length,
      totalRooms: roomIds.length,
      activeToday: t.active.size,
      checkInsToday: t.checked.size,
      avgCourseProgress: avg(rows.map((r) => r.courseProgress)),
      avgScore: avg(withQuiz.map((r) => r.avgScore)),
      activity,
      needsAttention: rows.filter((r) => daysSince(r.lastActiveAt) >= 3).sort((a, b) => (a.lastActiveAt < b.lastActiveAt ? -1 : 1)).slice(0, 5),
    };
  },

  async students(admin: AuthUser, q: z.output<typeof studentsQuery>) {
    const { roomIds, studentIds } = await adminScope(admin);
    let list = await buildStudentRows(studentIds, roomIds);
    const rooms = await getByIds<RoomDoc>(C.rooms, roomIds);
    const roomNames = rooms.map((r) => r.data.name).sort((a, b) => a.localeCompare(b));
    if (q.q) {
      const s = q.q.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(s) || r.username.toLowerCase().includes(s));
    }
    if (q.room) list = list.filter((r) => r.roomName === q.room);
    list.sort((a, b) => {
      if (q.sort === "name") return a.name.localeCompare(b.name);
      if (q.sort === "progress") return b.courseProgress - a.courseProgress;
      if (q.sort === "streak") return b.streak - a.streak;
      if (q.sort === "lastActive") return a.lastActiveAt < b.lastActiveAt ? -1 : 1;
      return b.xp - a.xp;
    });
    const start = (q.page - 1) * q.pageSize;
    return { items: list.slice(start, start + q.pageSize) as StudentProgress[], page: q.page, pageSize: q.pageSize, total: list.length, rooms: roomNames };
  },
};
