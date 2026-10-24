import { z } from "zod";
import { db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { dayKey } from "@/shared/time";
import type { UserDoc, AuthUser } from "../users/user.types";
import { notifyInTx } from "../notifications/notification.service";
import {
  REWARD_CONFIG,
  appendCheckinDate,
  applyDelta,
  initialGamification,
  levelUpOf,
  rewardLabel,
  streakAfterCheckin,
  toGamificationSummary,
} from "./gamification.logic";
import { gamRef, ledgerRef, touchActivityInTx, writeLedgerInTx } from "./gamification.repository";
import {
  EVENT_TO_SOURCE,
  type CheckInResult,
  type GamificationEventType,
  type GamificationSummary,
  type RewardEntry,
  type UserGamificationDoc,
} from "./gamification.types";

export const historyQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

interface LedgerDoc {
  eventType: GamificationEventType;
  xpDelta: number;
  pointDelta: number;
  description: string | null;
  createdAt: FirebaseFirestore.Timestamp;
}

const toRewardEntry = (id: string, l: LedgerDoc): RewardEntry => ({
  id,
  source: EVENT_TO_SOURCE[l.eventType] ?? "CHALLENGE",
  label: l.description ?? "Reward",
  xp: l.xpDelta,
  point: l.pointDelta,
  createdAt: toIso(l.createdAt)!,
});

export const gamificationService = {
  /** Ringkasan gamifikasi (membuat dokumen awal jika belum ada). */
  async summary(userId: string): Promise<GamificationSummary> {
    const doc = await this.getOrCreate(userId);
    return toGamificationSummary(doc, dayKey());
  },

  async getOrCreate(userId: string): Promise<UserGamificationDoc> {
    const snap = await gamRef(userId).get();
    if (snap.exists) return snap.data() as UserGamificationDoc;
    const u = (await db().collection(C.users).doc(userId).get()).data() as UserDoc | undefined;
    if (!u) throw Errors.notFound("Pengguna");
    const fresh = initialGamification(userId, u.name, u.username, ts());
    await gamRef(userId).create(fresh).catch(() => undefined); // balapan: biarkan pemenang pertama
    return ((await gamRef(userId).get()).data() as UserGamificationDoc) ?? fresh;
  },

  /**
   * POST /me/check-ins — satu kali per tanggal (BR-006), idempotent (BR-010).
   * Guard idempotensi = ID dokumen dailyCheckins/{user}_{tanggal} + ledger key `checkin:{tanggal}`.
   * Header Idempotency-Key dari client hanya informasi; tanggal ditentukan SERVER (zona Asia/Jakarta).
   */
  async checkIn(user: AuthUser): Promise<CheckInResult> {
    const now = new Date();
    const today = dayKey(now);
    const stamp = ts(now);
    const reward = REWARD_CONFIG.DAILY_CHECKIN;
    const ciRef = db().collection(C.dailyCheckins).doc(`${user.id}_${today}`);
    const lRef = ledgerRef(user.id, `checkin:${today}`);
    const userRef = db().collection(C.users).doc(user.id);

    return db().runTransaction(async (tx): Promise<CheckInResult> => {
      const [gSnap, ciSnap, lSnap, uSnap] = await tx.getAll(gamRef(user.id), ciRef, lRef, userRef);

      let g = gSnap.exists ? (gSnap.data() as UserGamificationDoc) : null;
      if (!g) {
        const u = uSnap.data() as UserDoc | undefined;
        if (!u) throw Errors.notFound("Pengguna");
        g = initialGamification(user.id, u.name, u.username, stamp);
      }

      if (ciSnap.exists || lSnap.exists) {
        return { alreadyCheckedIn: true, reward: { xp: 0, point: 0 }, gamification: toGamificationSummary(g, today), levelUp: null };
      }

      const streak = streakAfterCheckin(g, today);
      const next: UserGamificationDoc = {
        ...applyDelta(g, reward, stamp),
        ...streak,
        lastCheckinDate: today,
        checkinDates: appendCheckinDate(g.checkinDates, today),
        totalCheckins: (g.totalCheckins ?? Math.max(g.checkinDates.length, g.longestStreak)) + 1,
      };
      const levelUp = levelUpOf(g.totalXp, next.totalXp);

      tx.create(ciRef, { userId: user.id, checkinDate: today, xpReward: reward.xp, pointReward: reward.point, createdAt: stamp });
      writeLedgerInTx(tx, user.id, {
        source: "DAILY_CHECKIN", ...reward, label: rewardLabel("DAILY_CHECKIN", ""),
        idempotencyKey: `checkin:${today}`, referenceType: "CHECKIN", referenceId: today,
      }, stamp);
      tx.set(gamRef(user.id), next);
      touchActivityInTx(tx, user.id, today, g.roomIds, { checkedIn: true });
      if (levelUp) {
        notifyInTx(tx, {
          userId: user.id, type: "ACHIEVEMENT", title: `Naik ke Level ${levelUp.to}!`,
          message: `Selamat, kamu sekarang "${levelUp.name}". Terus semangat belajar!`,
          data: { levelUp },
        });
      }
      return { alreadyCheckedIn: false, reward, gamification: toGamificationSummary(next, today), levelUp };
    });
  },

  async recentRewards(userId: string, limit = 5): Promise<RewardEntry[]> {
    const snap = await db()
      .collection(C.gamificationTransactions)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => toRewardEntry(d.id, d.data() as LedgerDoc));
  },

  async history(userId: string, q: z.output<typeof historyQuery>) {
    const base = db().collection(C.gamificationTransactions).where("userId", "==", userId);
    const total = (await base.count().get()).data().count;
    const snap = await base.orderBy("createdAt", "desc").offset((q.page - 1) * q.limit).limit(q.limit).get();
    return {
      items: snap.docs.map((d) => toRewardEntry(d.id, d.data() as LedgerDoc)),
      page: q.page,
      limit: q.limit,
      total,
    };
  },

  async checkinHistory(userId: string, limit = 60) {
    const snap = await db().collection(C.dailyCheckins).where("userId", "==", userId).orderBy("checkinDate", "desc").limit(limit).get();
    return snap.docs.map((d) => {
      const x = d.data();
      return { date: x.checkinDate as string, xp: x.xpReward as number, point: x.pointReward as number };
    });
  },

  /** Peringkat global (berdasarkan sortKey: points ↓, xp ↓, updatedAt ↑, userId ↑). */
  async globalRank(userId: string): Promise<{ position: number; total: number }> {
    const g = await this.getOrCreate(userId);
    const col = db().collection(C.userGamification);
    const [ahead, total] = await Promise.all([
      col.where("sortKey", "<", g.sortKey).count().get(),
      col.count().get(),
    ]);
    return { position: ahead.data().count + 1, total: total.data().count };
  },
};
