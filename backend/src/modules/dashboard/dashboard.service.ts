import { toGamificationSummary } from "../gamification/gamification.logic";
import { gamificationService } from "../gamification/gamification.service";
import { progressService } from "../progress/progress.service";
import { dayKey } from "@/shared/time";
import type { AuthUser } from "../users/user.types";

/** GET /me/dashboard — bentuk SantriDashboard (types/dashboard.ts). */
export const dashboardService = {
  async santri(user: AuthUser) {
    const [g, rank, recentRewards, courses] = await Promise.all([
      gamificationService.getOrCreate(user.id),
      gamificationService.globalRank(user.id),
      gamificationService.recentRewards(user.id, 5),
      progressService.coursesForStudent(user.id),
    ]);
    return {
      gamification: toGamificationSummary(g, dayKey()),
      rank,
      recentRewards,
      continueLearning:
        courses.find((c) => c.progressPercent > 0 && c.progressPercent < 100) ?? courses.find((c) => c.progressPercent < 100) ?? null,
      stats: {
        coursesCompleted: courses.filter((c) => c.progressPercent === 100).length,
        quizzesDone: g.quizzesDone,
        avgScore: g.quizzesDone > 0 ? Math.round(g.quizScoreSum / g.quizzesDone) : 0,
      },
    };
  },
};
