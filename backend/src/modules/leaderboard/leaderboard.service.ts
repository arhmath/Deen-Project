import { z } from "zod";
import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { countOf } from "@/shared/firestore-utils";
import { SAFE_ID } from "@/shared/ids";
import type { UserGamificationDoc } from "../gamification/gamification.types";
import { gamificationService } from "../gamification/gamification.service";
import { isActiveMember, loadRoom } from "../rooms/room.access";
import type { AuthUser } from "../users/user.types";

export const leaderboardQuery = z.object({
  roomId: z.string().regex(SAFE_ID).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export interface LeaderboardEntry {
  rank: number; studentId: string; name: string; level: number; xp: number; isMe: boolean;
}

/** Leaderboard hanya untuk SANTRI (route dibatasi `roles: ["SANTRI"]`); santri hanya melihat room yang ia ikuti. */
async function assertRoomVisible(user: AuthUser, roomId: string) {
  await loadRoom(roomId);
  if (!(await isActiveMember(roomId, user.id))) throw Errors.forbidden("Kamu bukan anggota room ini.");
}

export const leaderboardService = {
  /** Urutan: points ↓, xp ↓, updatedAt ↑, userId ↑ (via sortKey). Pagination offset (skala TPA). */
  async page(user: AuthUser, q: z.output<typeof leaderboardQuery>) {
    if (q.roomId) await assertRoomVisible(user, q.roomId);
    const col = db().collection(C.userGamification);
    const base = q.roomId ? col.where("roomIds", "array-contains", q.roomId) : col;
    const offset = (q.page - 1) * q.pageSize;

    const [total, snap] = await Promise.all([countOf(base), base.orderBy("sortKey").offset(offset).limit(q.pageSize).get()]);
    const entries: LeaderboardEntry[] = snap.docs.map((d, i) => {
      const g = d.data() as UserGamificationDoc;
      return { rank: offset + i + 1, studentId: g.userId, name: g.name, level: g.level, xp: g.totalXp, isMe: g.userId === user.id };
    });

    let me: LeaderboardEntry | null = null;
    const mine = await gamificationService.getOrCreate(user.id);
    if (!q.roomId || mine.roomIds.includes(q.roomId)) {
      const ahead = await countOf(base.where("sortKey", "<", mine.sortKey));
      me = { rank: ahead + 1, studentId: mine.userId, name: mine.name, level: mine.level, xp: mine.totalXp, isMe: true };
    }
    return { entries, page: q.page, pageSize: q.pageSize, total, me };
  },
};
