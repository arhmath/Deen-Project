export type RewardSource =
  | "DAILY_CHECKIN"
  | "LESSON"
  | "QUIZ"
  | "PERFECT_QUIZ"
  | "CHALLENGE"
  | "COURSE";

export interface LevelProgress {
  level: number;
  name: string;
  /** XP minimum level ini */
  levelMinXp: number;
  /** XP minimum level berikutnya; null jika sudah level tertinggi */
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpToNext: number | null;
  /** 0–100, dihitung server */
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

export interface CheckInResult {
  /** true jika request diulang (retry) — reward TIDAK diberikan dua kali */
  alreadyCheckedIn: boolean;
  reward: { xp: number; point: number };
  gamification: GamificationSummary;
  levelUp: { from: number; to: number; name: string } | null;
}
