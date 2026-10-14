import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../../services/dashboardService";

export const keys = {
  santri: ["santri", "dashboard"] as const,
  courses: ["santri", "courses"] as const,
  rooms: ["rooms"] as const,
  leaderboard: (roomId: string | undefined, page: number) => ["leaderboard", roomId ?? "global", page] as const,
  adminOverview: ["admin", "overview"] as const,
  adminStudents: (p: object) => ["admin", "students", p] as const,
  parentStudents: ["parent", "students"] as const,
  parentStudent: (id: string) => ["parent", "students", id] as const,
};

export const useSantriDashboard = (enabled = true) =>
  useQuery({ queryKey: keys.santri, queryFn: dashboardService.santri, enabled });

export const useMyCourses = () => useQuery({ queryKey: keys.courses, queryFn: dashboardService.myCourses });

export const useRooms = () => useQuery({ queryKey: keys.rooms, queryFn: dashboardService.rooms });

export const useLeaderboard = (roomId: string | undefined, page: number, pageSize = 10) =>
  useQuery({
    queryKey: keys.leaderboard(roomId, page),
    queryFn: () => dashboardService.leaderboard({ roomId, page, pageSize }),
    placeholderData: keepPreviousData,
  });

export const useAdminOverview = () =>
  useQuery({ queryKey: keys.adminOverview, queryFn: dashboardService.adminOverview });

export const useAdminStudents = (p: { page: number; pageSize: number; q?: string; room?: string; sort?: string }) =>
  useQuery({
    queryKey: keys.adminStudents(p),
    queryFn: () => dashboardService.adminStudents(p),
    placeholderData: keepPreviousData,
  });

export const useParentStudents = () =>
  useQuery({ queryKey: keys.parentStudents, queryFn: dashboardService.parentStudents });

export const useParentStudent = (id: string) =>
  useQuery({ queryKey: keys.parentStudent(id), queryFn: () => dashboardService.parentStudent(id) });

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.checkIn,
    onSuccess: () => {
      // XP/point/streak/rank berubah → segarkan semua yang bergantung
      qc.invalidateQueries({ queryKey: keys.santri });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
