import type { Timestamp } from "firebase-admin/firestore";

export type RoomStatus = "ACTIVE" | "ARCHIVED";

export interface RoomDoc {
  ownerId: string;
  name: string;
  description: string | null;
  joinCode: string;
  status: RoomStatus;
  memberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface RoomMemberDoc {
  roomId: string;
  userId: string;
  isActive: boolean;
  joinedAt: Timestamp;
}
