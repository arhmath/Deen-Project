import { api } from "./api";
import { dayKey } from "../utils/format";
import type { SantriDashboard } from "../types/dashboard";
import type { CheckInResult } from "../types/gamification";
import type { CourseSummary } from "../types/learning";
import type { LeaderboardPage, RoomSummary } from "../types/leaderboard";
import type { AdminOverview, StudentDetail, StudentListPage, StudentProgress } from "../types/monitoring";

export const dashboardService = {
  santri: () => api.get<SantriDashboard>("/me/dashboard"),
  // Idempotency-Key: retry request yang sama tidak boleh memberi reward dua kali (BR-010)
  checkIn: () =>
    api.post<CheckInResult>("/me/check-ins", undefined, {
      headers: { "Idempotency-Key": `checkin-${dayKey()}` },
    }),
  myCourses: () => api.get<CourseSummary[]>("/me/courses"),
  rooms: () => api.get<RoomSummary[]>("/rooms"),
  leaderboard: (p: { roomId?: string; page: number; pageSize: number }) =>
    api.get<LeaderboardPage>("/leaderboard", { params: p }),
  adminOverview: () => api.get<AdminOverview>("/admin/overview"),
  adminStudents: (p: { page: number; pageSize: number; q?: string; room?: string; sort?: string }) =>
    api.get<StudentListPage>("/admin/students", { params: p }),
  parentStudents: () => api.get<StudentProgress[]>("/parent/students"),
  parentStudent: (id: string) => api.get<StudentDetail>(`/parent/students/${id}`),
};
