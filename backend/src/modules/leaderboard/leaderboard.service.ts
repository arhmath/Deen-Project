import { z } from "zod";
import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { countOf } from "@/shared/firestore-utils";
import { SAFE_ID } from "@/shared/ids";
import type { UserGamificationDoc } from "../gamification/gamification.types";
import { gamificationService } from "../gamification/gamification.service";
import { compareLeaderboardEntries } from "../gamification/gamification.logic";
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
  /** Ranking dihitung dari XP aktual seluruh peserta sebelum pagination. */
  async page(user: AuthUser, q: z.output<typeof leaderboardQuery>) {
    if (q.roomId) await assertRoomVisible(user, q.roomId);

    // Pastikan dokumen santri sendiri sudah ada sebelum membaca seluruh pool.
    const mine = await gamificationService.getOrCreate(user.id);
    const col = db().collection(C.userGamification);
    const base = q.roomId ? col.where("roomIds", "array-contains", q.roomId) : col;
    const snapshot = await base.get();
    const ranked = snapshot.docs
      .map((doc) => {
        const data = doc.data() as UserGamificationDoc;
        return { ...data, userId: data.userId || doc.id };
      })
      .sort(compareLeaderboardEntries);

    const total = ranked.length;
    const offset = (q.page - 1) * q.pageSize;
    const entries: LeaderboardEntry[] = ranked.slice(offset, offset + q.pageSize).map((g, index) => ({
      rank: offset + index + 1,
      studentId: g.userId,
      name: g.name,
      level: g.level,
      xp: Number(g.totalXp ?? 0),
      isMe: g.userId === user.id,
    }));

    const myIndex = (!q.roomId || mine.roomIds.includes(q.roomId))
      ? ranked.findIndex((g) => g.userId === user.id)
      : -1;
    const me: LeaderboardEntry | null = myIndex >= 0
      ? {
          rank: myIndex + 1,
          studentId: mine.userId,
          name: mine.name,
          level: mine.level,
          xp: Number(mine.totalXp ?? 0),
          isMe: true,
        }
      : null;

    return { entries, page: q.page, pageSize: q.pageSize, total, me };
  },
};
