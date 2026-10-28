import { api } from "./api";
import type { CourseAdminSummary, CourseDoc } from "../types/courseAdmin";
import type { RoomAdminSummary, RoomDetail } from "../types/room";

export const adminService = {
  rooms: () => api.get<RoomAdminSummary[]>("/admin/rooms"),
  createRoom: (name: string) => api.post<RoomAdminSummary>("/admin/rooms", { name }),
  room: (id: string) => api.get<RoomDetail>(`/admin/rooms/${id}`),
  updateRoom: (id: string, patch: { name?: string; archived?: boolean }) =>
    api.patch<RoomAdminSummary>(`/admin/rooms/${id}`, patch),
  deleteRoom: (id: string) => api.delete<void>(`/admin/rooms/${id}`, { params: { permanent: "true" } }),
  removeMember: (roomId: string, studentId: string) =>
    api.delete<void>(`/admin/rooms/${roomId}/members/${studentId}`),
  courses: () => api.get<CourseAdminSummary[]>("/admin/courses"),
  createCourse: (p: { roomId: string; title: string; description?: string }) =>
    api.post<CourseDoc>("/admin/courses", p),
  course: (id: string) => api.get<CourseDoc>(`/admin/courses/${id}`),
  saveCourse: (id: string, doc: CourseDoc) => api.put<CourseDoc>(`/admin/courses/${id}`, doc),
  deleteCourse: (id: string) => api.delete<void>(`/admin/courses/${id}`),
};
