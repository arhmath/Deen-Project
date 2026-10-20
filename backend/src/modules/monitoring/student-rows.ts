import { C } from "@/shared/collections";
import { getByIds } from "@/shared/firestore-utils";
import { dayKey } from "@/shared/time";
import { toIso } from "@/lib/firebase";
import { levelFor } from "../gamification/gamification.logic";
import { effectiveStreak } from "../gamification/gamification.logic";
import type { UserGamificationDoc } from "../gamification/gamification.types";
import type { RoomDoc } from "../rooms/room.types";
import type { UserDoc } from "../users/user.types";

/** Bentuk StudentProgress yang dibaca frontend (types/monitoring.ts). */
export interface StudentProgress {
  id: string; name: string; username: string; roomName: string; level: number; levelName: string;
  xp: number; point: number; streak: number; courseProgress: number; avgScore: number;
  lastActiveAt: string; checkedInToday: boolean;
}

/**
 * Bangun baris StudentProgress dari read model. `scopeRoomIds` membatasi room yang boleh
 * tampil sebagai `roomName` (admin hanya melihat room miliknya).
 */
export async function buildStudentRows(studentIds: string[], scopeRoomIds?: string[]): Promise<StudentProgress[]> {
  if (!studentIds.length) return [];
  const [users, gams] = await Promise.all([getByIds<UserDoc>(C.users, studentIds), getByIds<UserGamificationDoc>(C.userGamification, studentIds)]);
  const gMap = new Map(gams.map((g) => [g.id, g.data]));
  const roomIds = [...new Set(gams.flatMap((g) => g.data.roomIds))].filter((r) => !scopeRoomIds || scopeRoomIds.includes(r));
  const rooms = await getByIds<RoomDoc>(C.rooms, roomIds);
  const rName = new Map(rooms.map((r) => [r.id, r.data.name]));
  const today = dayKey();

  return users
    .filter((u) => !u.data.deletedAt && u.data.role === "SANTRI")
    .map((u) => {
      const g = gMap.get(u.id);
      const lv = levelFor(g?.totalXp ?? 0);
      const rid = (g?.roomIds ?? []).filter((r) => rName.has(r)).sort((a, b) => rName.get(a)!.localeCompare(rName.get(b)!))[0];
      return {
        id: u.id, name: u.data.name, username: u.data.username, roomName: rid ? rName.get(rid)! : "-",
        level: lv.level, levelName: lv.name, xp: g?.totalXp ?? 0, point: g?.totalPoints ?? 0,
        streak: g ? effectiveStreak(g, today) : 0, courseProgress: g?.courseProgress ?? 0,
        avgScore: g && g.quizzesDone > 0 ? Math.round(g.quizScoreSum / g.quizzesDone) : 0,
        lastActiveAt: toIso(g?.lastActiveAt ?? u.data.createdAt)!, checkedInToday: g?.lastCheckinDate === today,
      };
    });
}
