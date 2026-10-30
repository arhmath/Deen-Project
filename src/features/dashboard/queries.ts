import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useAdventure = () => useQuery({ queryKey: ["santri", "adventure"], queryFn: dashboardService.adventure });

export const useMyCourses = () => useQuery({ queryKey: keys.courses, queryFn: dashboardService.myCourses });

export const useRooms = () => useQuery({ queryKey: keys.rooms, queryFn: dashboardService.rooms });

export const useLeaderboard = (roomId: string | undefined, page: number, pageSize = 10) =>
  useQuery({
    queryKey: [...keys.leaderboard(roomId, page), pageSize],
    queryFn: () => dashboardService.leaderboard({ roomId, page, pageSize }),
    // Leaderboard harus selalu mengambil snapshot terbaru saat halaman dibuka.
    // Hindari menampilkan cache/halaman sebelumnya seolah-olah hasil final.
    staleTime: 0,
    refetchOnMount: "always",
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

/* ---------------- Belajar & kuis ---------------- */

export const useCourse = (id: string) =>
  useQuery({ queryKey: ["santri", "course", id], queryFn: () => dashboardService.course(id) });

export const useContent = (id: string) =>
  useQuery({ queryKey: ["santri", "content", id], queryFn: () => dashboardService.content(id) });

/** Reward/progress berubah → segarkan semua tampilan yang bergantung padanya. */
function useInvalidateAfterLearning() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["santri"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["parent"] });
  };
}

export function useCompleteContent(contentId: string) {
  const invalidate = useInvalidateAfterLearning();
  return useMutation({
    mutationFn: () => dashboardService.completeContent(contentId),
    onSuccess: invalidate,
  });
}

export const useStartQuiz = (contentId: string) =>
  useMutation({ mutationFn: () => dashboardService.startQuiz(contentId) });

export function useSubmitQuiz() {
  const invalidate = useInvalidateAfterLearning();
  return useMutation({
    mutationFn: (v: { attemptId: string; answers: Record<string, string> }) =>
      dashboardService.submitQuiz(v.attemptId, v.answers),
    onSuccess: invalidate,
  });
}

/* ---------------- Room & orang tua ---------------- */

/** Perubahan keanggotaan/room memengaruhi banyak tampilan sekaligus. */
function useInvalidateAfterMembership() {
  const qc = useQueryClient();
  return () => {
    for (const key of ["santri", "rooms", "leaderboard", "admin", "parent"]) qc.invalidateQueries({ queryKey: [key] });
  };
}

export function useJoinRoom() {
  const invalidate = useInvalidateAfterMembership();
  return useMutation({ mutationFn: dashboardService.joinRoom, onSuccess: invalidate });
}

export const useLinkCode = (enabled = true) =>
  useQuery({ queryKey: ["santri", "link-code"], queryFn: dashboardService.linkCode, staleTime: Infinity, enabled });

export function useLinkChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.linkChild,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent"] }),
  });
}
