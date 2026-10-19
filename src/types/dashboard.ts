import type { GamificationSummary, RewardEntry } from "./gamification";
import type { CourseSummary } from "./learning";

export interface SantriDashboard {
  /** jumlah room aktif yang diikuti santri */
  roomCount: number;
  gamification: GamificationSummary;
  rank: { position: number; total: number };
  recentRewards: RewardEntry[];
  continueLearning: CourseSummary | null;
  stats: { coursesCompleted: number; quizzesDone: number; avgScore: number };
}
