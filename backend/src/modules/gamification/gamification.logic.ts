/**
 * Logika gamifikasi MURNI (tanpa I/O) — sumber aturan XP/level/streak/leaderboard.
 * Dipakai di dalam transaksi Firestore dan diuji unit. Mengikuti mock server di frontend
 * (services/mock/server.ts) dan SRS §6–7.
 */
import type { Timestamp } from "firebase-admin/firestore";
import { WEEK_LABELS, addDays, daysBetween, mondayOf, weekdayOf } from "@/shared/time";
import type {
  GamificationSummary,
  LevelProgress,
  RewardSource,
  UserGamificationDoc,
  WeekDay,
} from "./gamification.types";

export const LEVELS = [
  { level: 1, min: 0, name: "Pemula" },
  { level: 2, min: 100, name: "Pencari Ilmu" },
  { level: 3, min: 250, name: "Santri Rajin" },
  { level: 4, min: 500, name: "Penjaga Ayat" },
  { level: 5, min: 1000, name: "Bintang Deen" },
] as const;

/**
 * Konfigurasi reward — hidup di server (BR-007/008). SRS §6.
 * Aturan: semua aktivitas belajar memberi XP, tetapi POINT hanya dari menyelesaikan kuis.
 * Baca modul, buka kartu, check-in, challenge, dan bonus course = XP saja (point 0).
 */
export const REWARD_CONFIG: Record<RewardSource, { xp: number; point: number }> = {
  DAILY_CHECKIN: { xp: 10, point: 0 },
  LESSON: { xp: 5, point: 0 },
  QUIZ: { xp: 20, point: 20 },
  PERFECT_QUIZ: { xp: 30, point: 30 },
  CHALLENGE: { xp: 50, point: 0 },
  COURSE: { xp: 100, point: 0 },
};

/** Skor minimum (%) agar kuis dianggap selesai. 0 = selesai pada submit pertama. */
export const QUIZ_COMPLETION_MIN_PERCENT = 0;

export function levelFor(xp: number): LevelProgress {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i;
  });
  const cur = LEVELS[idx]!;
  const next = LEVELS[idx + 1] ?? null;
  const xpIntoLevel = xp - cur.min;
  return {
    level: cur.level,
    name: cur.name,
    levelMinXp: cur.min,
    nextLevelXp: next?.min ?? null,
    xpIntoLevel,
    xpToNext: next ? next.min - xp : null,
    percent: next ? Math.min(100, Math.round((xpIntoLevel / (next.min - cur.min)) * 100)) : 100,
  };
}

/** Streak yang ditampilkan: tetap hidup jika check-in terakhir hari ini atau kemarin. */
export function effectiveStreak(
  doc: Pick<UserGamificationDoc, "lastCheckinDate" | "currentStreak">,
  today: string
): number {
  if (!doc.lastCheckinDate) return 0;
  return daysBetween(doc.lastCheckinDate, today) <= 1 ? doc.currentStreak : 0;
}

/** Streak setelah check-in `today`. */
export function streakAfterCheckin(
  prev: Pick<UserGamificationDoc, "lastCheckinDate" | "currentStreak" | "longestStreak">,
  today: string
): { currentStreak: number; longestStreak: number } {
  let current: number;
  if (prev.lastCheckinDate === today) current = prev.currentStreak;
  else if (prev.lastCheckinDate && daysBetween(prev.lastCheckinDate, today) === 1) current = prev.currentStreak + 1;
  else current = 1;
  return { currentStreak: current, longestStreak: Math.max(prev.longestStreak, current) };
}

export function weekStrip(checkinDates: string[], today: string): WeekDay[] {
  const set = new Set(checkinDates);
  const monday = mondayOf(today);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return {
      date,
      label: WEEK_LABELS[weekdayOf(date)]!,
      checked: set.has(date),
      isToday: date === today,
      isFuture: date > today,
    };
  });
}

export function appendCheckinDate(dates: string[], today: string, keep = 14): string[] {
  return [...new Set([...dates, today])].sort().slice(-keep);
}

const pad = (n: number, w = 13) => String(Math.max(0, Math.trunc(n))).padStart(w, "0");
const CAP = 1e12;

/**
 * Kunci urut leaderboard — ascending lexicographic = points DESC, xp DESC, updatedAt ASC, userId ASC
 * (aturan tie-break di 09-DEVELOPMENT-ROADMAP §10).
 */
export function buildSortKey(points: number, xp: number, updatedAtMs: number, userId: string): string {
  return `${pad(CAP - points)}${pad(CAP - xp)}${pad(updatedAtMs)}${userId}`;
}

export function toGamificationSummary(doc: UserGamificationDoc, today: string): GamificationSummary {
  return {
    xp: doc.totalXp,
    point: doc.totalPoints,
    level: levelFor(doc.totalXp),
    streak: effectiveStreak(doc, today),
    longestStreak: doc.longestStreak,
    checkedInToday: doc.lastCheckinDate === today,
    totalCheckIns: doc.totalCheckins ?? Math.max(doc.checkinDates.length, doc.longestStreak),
    week: weekStrip(doc.checkinDates, today),
  };
}

export function initialGamification(
  userId: string,
  name: string,
  username: string,
  now: Timestamp
): UserGamificationDoc {
  return {
    userId,
    name,
    username,
    level: 1,
    totalXp: 0,
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCheckinDate: null,
    checkinDates: [],
    quizzesDone: 0,
    quizScoreSum: 0,
    coursesCompleted: 0,
    courseProgress: 0,
    lastActiveAt: null,
    roomIds: [],
    sortKey: buildSortKey(0, 0, now.toMillis(), userId),
    createdAt: now,
    updatedAt: now,
  };
}

/** Terapkan delta XP/point ke ringkasan (murni) — menghitung ulang level & sortKey. */
export function applyDelta(
  doc: UserGamificationDoc,
  delta: { xp: number; point: number },
  now: Timestamp
): UserGamificationDoc {
  const totalXp = doc.totalXp + delta.xp;
  const totalPoints = doc.totalPoints + delta.point;
  return {
    ...doc,
    totalXp,
    totalPoints,
    level: levelFor(totalXp).level,
    sortKey: buildSortKey(totalPoints, totalXp, now.toMillis(), doc.userId),
    updatedAt: now,
    lastActiveAt: now,
  };
}

export function levelUpOf(beforeXp: number, afterXp: number) {
  const b = levelFor(beforeXp);
  const a = levelFor(afterXp);
  return a.level > b.level ? { from: b.level, to: a.level, name: a.name } : null;
}

/* ------------------------------------------------------------------ */
/* Perencanaan reward untuk submit konten (murni, idempotent by design) */
/* ------------------------------------------------------------------ */

export type ContentType = "LESSON" | "QUIZ" | "FLASHCARD" | "CHALLENGE" | "VIDEO" | "ARTICLE";

export interface RewardableContent {
  id: string;
  type: ContentType;
  title: string;
  xpReward: number;
  pointReward: number;
  courseId: string;
}

export interface PlannedReward {
  source: RewardSource;
  xp: number;
  point: number;
  label: string;
  /** unik per (user, referensi) → retry tidak pernah menggandakan reward (BR-010) */
  idempotencyKey: string;
  referenceType: "CONTENT" | "COURSE" | "CHECKIN";
  referenceId: string;
}

export function sourceForType(type: ContentType, perfect: boolean): RewardSource {
  if (type === "QUIZ") return perfect ? "PERFECT_QUIZ" : "QUIZ";
  if (type === "CHALLENGE") return "CHALLENGE";
  return "LESSON";
}

/** Hanya kuis yang memberi point. Tipe lain selalu 0, termasuk bila guru mengisi `pointReward`. */
export function earnsPoint(type: ContentType): boolean {
  return type === "QUIZ";
}

/** XP/point dasar sebuah konten (override per-konten jika diisi guru). */
export function baseRewardOf(c: Pick<RewardableContent, "type" | "xpReward" | "pointReward">) {
  const def = REWARD_CONFIG[sourceForType(c.type, false)];
  const xp = c.xpReward > 0 ? c.xpReward : def.xp;
  if (!earnsPoint(c.type)) return { xp, point: 0 };
  const point = c.pointReward > 0 ? c.pointReward : c.xpReward > 0 ? c.xpReward : def.point;
  return { xp, point };
}

export function rewardLabel(source: RewardSource, title: string): string {
  switch (source) {
    case "DAILY_CHECKIN":
      return "Daily check-in";
    case "LESSON":
      return `Pelajaran: ${title}`;
    case "QUIZ":
      return `Kuis: ${title}`;
    case "PERFECT_QUIZ":
      return `Kuis sempurna: ${title}`;
    case "CHALLENGE":
      return `Challenge: ${title}`;
    case "COURSE":
      return `Menyelesaikan course ${title}`;
  }
}

export interface PlanInput {
  content: RewardableContent;
  courseTitle: string;
  perfect: boolean;
  /** konten ini sudah COMPLETED sebelumnya? → tidak ada reward (retake/retry) */
  alreadyCompleted: boolean;
  /** jumlah konten selesai di course SEBELUM submit ini */
  completedBefore: number;
  totalContents: number;
  courseAlreadyCompleted: boolean;
}

export interface SubmissionPlan {
  rewards: PlannedReward[];
  completesCourse: boolean;
}

export function planSubmissionRewards(i: PlanInput): SubmissionPlan {
  if (i.alreadyCompleted) return { rewards: [], completesCourse: false };

  const rewards: PlannedReward[] = [];
  const source = sourceForType(i.content.type, i.perfect);
  const base = baseRewardOf(i.content);
  const mult =
    source === "PERFECT_QUIZ" ? REWARD_CONFIG.PERFECT_QUIZ.xp / REWARD_CONFIG.QUIZ.xp : 1;
  rewards.push({
    source,
    xp: Math.round(base.xp * mult),
    point: Math.round(base.point * mult),
    label: rewardLabel(source, i.content.title),
    idempotencyKey: `content:${i.content.id}`,
    referenceType: "CONTENT",
    referenceId: i.content.id,
  });

  const completesCourse =
    !i.courseAlreadyCompleted && i.totalContents > 0 && i.completedBefore + 1 >= i.totalContents;
  if (completesCourse) {
    rewards.push({
      source: "COURSE",
      ...REWARD_CONFIG.COURSE,
      label: rewardLabel("COURSE", i.courseTitle),
      idempotencyKey: `course:${i.content.courseId}`,
      referenceType: "COURSE",
      referenceId: i.content.courseId,
    });
  }
  return { rewards, completesCourse };
}
