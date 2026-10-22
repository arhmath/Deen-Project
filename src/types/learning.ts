export type ContentType = "LESSON" | "QUIZ" | "FLASHCARD" | "CHALLENGE" | "VIDEO" | "ARTICLE";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface NextContent {
  id: string;
  title: string;
  type: ContentType;
  rewardXp: number;
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  roomName: string;
  status: CourseStatus;
  totalContents: number;
  completedContents: number;
  /** 0–100, dihitung server */
  progressPercent: number;
  nextContent: NextContent | null;
}
