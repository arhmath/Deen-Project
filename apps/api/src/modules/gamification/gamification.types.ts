import type { Timestamp } from "firebase-admin/firestore";

/** Sumber reward yang dikenal frontend (types/gamification.ts). */
export type RewardSource = "DAILY_CHECKIN" | "LESSON" | "QUIZ" | "PERFECT_QUIZ" | "CHALLENGE" | "COURSE";

/** Enum event di ledger (03-DATABASE-SCHEMA.sql → gamification_event_type). */
export type GamificationEventType =
  | "DAILY_CHECKIN"
  | "LESSON_COMPLETED"
  | "QUIZ_COMPLETED"
  | "PERFECT_QUIZ"
  | "CHALLENGE_COMPLETED"
  | "COURSE_COMPLETED"
  | "MANUAL_ADJUSTMENT";

export const SOURCE_TO_EVENT: Record<RewardSource, GamificationEventType> = {
  DAILY_CHECKIN: "DAILY_CHECKIN",
  LESSON: "LESSON_COMPLETED",
  QUIZ: "QUIZ_COMPLETED",
  PERFECT_QUIZ: "PERFECT_QUIZ",
  CHALLENGE: "CHALLENGE_COMPLETED",
  COURSE: "COURSE_COMPLETED",
};

export const EVENT_TO_SOURCE: Partial<Record<GamificationEventType, RewardSource>> = {
  DAILY_CHECKIN: "DAILY_CHECKIN",
  LESSON_COMPLETED: "LESSON",
  QUIZ_COMPLETED: "QUIZ",
  PERFECT_QUIZ: "PERFECT_QUIZ",
  CHALLENGE_COMPLETED: "CHALLENGE",
  COURSE_COMPLETED: "COURSE",
};

export interface LevelProgress {
  level: number;
  name: string;
  levelMinXp: number;
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpToNext: number | null;
  percent: number;
}

export interface WeekDay {
  date: string;
  label: string;
  checked: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface GamificationSummary {
  xp: number;
  point: number;
  level: LevelProgress;
  streak: number;
  longestStreak: number;
  checkedInToday: boolean;
  week: WeekDay[];
}

export interface RewardEntry {
  id: string;
  source: RewardSource;
  label: string;
  xp: number;
  point: number;
  createdAt: string;
}

/** Dokumen `userGamification/{userId}` — read model; sumber kebenaran historis = ledger. */
export interface UserGamificationDoc {
  userId: string;
  name: string;
  username: string;
  level: number;
  totalXp: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string | null;
  /** maks 14 tanggal check-in terakhir (untuk strip mingguan tanpa query) */
  checkinDates: string[];
  quizzesDone: number;
  quizScoreSum: number;
  coursesCompleted: number;
  /** rata-rata progres course (0–100) — di-refresh server-side setelah progres berubah */
  courseProgress: number;
  lastActiveAt: Timestamp | null;
  roomIds: string[];
  /** string urut untuk leaderboard: points DESC, xp DESC, updatedAt ASC, userId ASC */
  sortKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Hasil check-in untuk frontend (types/gamification.ts → CheckInResult). */
export interface CheckInResult {
  alreadyCheckedIn: boolean;
  reward: { xp: number; point: number };
  gamification: GamificationSummary;
  levelUp: { from: number; to: number; name: string } | null;
}
