import type { Timestamp } from "firebase-admin/firestore";
import type { ContentType } from "../gamification/gamification.logic";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CourseDoc {
  roomId: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: CourseStatus;
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface ModuleDoc {
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ContentDoc {
  moduleId: string;
  courseId: string;
  type: ContentType;
  title: string;
  description: string | null;
  /** isi materi (JSON bebas; teks pada `body.text` ikut diindeks untuk chatbot) */
  body: Record<string, unknown>;
  xpReward: number;
  pointReward: number;
  orderIndex: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type WithId<T> = T & { id: string };
