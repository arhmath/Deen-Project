import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import type { CourseDoc } from "../../types/courseAdmin";

/** Semua data guru ada di bawah key ["admin"]; santri/orang tua ikut disegarkan jika relevan. */
function useInvalidate() {
  const qc = useQueryClient();
  return (extra: string[] = []) => {
    for (const key of ["admin", "rooms", ...extra]) qc.invalidateQueries({ queryKey: [key] });
  };
}

export const useAdminRooms = () => useQuery({ queryKey: ["admin", "rooms"], queryFn: adminService.rooms });
export const useAdminRoom = (id: string) =>
  useQuery({ queryKey: ["admin", "room", id], queryFn: () => adminService.room(id) });
export const useAdminCourses = () => useQuery({ queryKey: ["admin", "courses"], queryFn: adminService.courses });
export const useAdminCourse = (id: string) =>
  useQuery({ queryKey: ["admin", "course", id], queryFn: () => adminService.course(id) });

export function useCreateRoom() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: adminService.createRoom, onSuccess: () => invalidate() });
}

export function useUpdateRoom(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (patch: { name?: string; archived?: boolean }) => adminService.updateRoom(id, patch),
    onSuccess: () => invalidate(["santri", "leaderboard"]),
  });
}

export function useRemoveMember(roomId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (studentId: string) => adminService.removeMember(roomId, studentId),
    onSuccess: () => invalidate(["santri", "leaderboard"]),
  });
}

export function useCreateCourse() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: adminService.createCourse, onSuccess: () => invalidate() });
}

export function useSaveCourse(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (doc: CourseDoc) => adminService.saveCourse(id, doc),
    onSuccess: () => invalidate(["santri", "parent"]),
  });
}
