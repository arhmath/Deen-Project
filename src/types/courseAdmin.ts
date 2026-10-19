import type { CourseStatus } from "./learning";

/** Tipe materi yang bisa dibuat guru sekarang (CHALLENGE/VIDEO menyusul). */
export type EditableContentType = "LESSON" | "FLASHCARD" | "QUIZ";

export interface LessonSectionDoc {
  heading?: string;
  text: string;
}
export interface CardDoc {
  id: string;
  front: string;
  back: string;
}
export interface OptionDoc {
  id: string;
  text: string;
}
export interface QuestionDoc {
  id: string;
  text: string;
  options: OptionDoc[];
  correctOptionId: string;
  explanation: string;
}

export interface ContentDoc {
  id: string;
  title: string;
  type: EditableContentType;
  sections: LessonSectionDoc[];
  cards: CardDoc[];
  questions: QuestionDoc[];
}

export interface ModuleDoc {
  id: string;
  title: string;
  contents: ContentDoc[];
}

/** Dokumen course lengkap yang diedit guru. */
export interface CourseDoc {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  description: string;
  status: CourseStatus;
  modules: ModuleDoc[];
  updatedAt: string;
}

export interface CourseAdminSummary {
  id: string;
  title: string;
  roomId: string;
  roomName: string;
  status: CourseStatus;
  moduleCount: number;
  contentCount: number;
}
