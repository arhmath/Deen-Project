import type { GamificationSummary, RewardEntry } from "./gamification";
import type { CourseSummary } from "./learning";

export interface SantriDashboard {
  gamification: GamificationSummary;
  rank: { position: number; total: number };
  recentRewards: RewardEntry[];
  continueLearning: CourseSummary | null;
  stats: { coursesCompleted: number; quizzesDone: number; avgScore: number };
}
