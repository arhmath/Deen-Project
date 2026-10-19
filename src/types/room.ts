import type { CourseAdminSummary } from "./courseAdmin";

export interface RoomAdminSummary {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
  courseCount: number;
  archived: boolean;
  createdAt: string;
}

export interface RoomMember {
  studentId: string;
  name: string;
  username: string;
  level: number;
  xp: number;
  joinedAt: string;
  lastActiveAt: string;
}

export interface RoomDetail {
  room: RoomAdminSummary;
  members: RoomMember[];
  courses: CourseAdminSummary[];
}
