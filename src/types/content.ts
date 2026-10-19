import type { ContentType, CourseStatus } from "./learning";
import type { GamificationSummary } from "./gamification";

export interface ContentListItem {
  id: string;
  title: string;
  type: ContentType;
  rewardXp: number;
  completed: boolean;
  /** content berikutnya yang disarankan */
  isNext: boolean;
}

export interface ModuleDetail {
  id: string;
  title: string;
  contents: ContentListItem[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  roomName: string;
  status: CourseStatus;
  progressPercent: number;
  completedContents: number;
  totalContents: number;
  modules: ModuleDetail[];
}

export interface LessonSection {
  heading?: string;
  text: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface ContentDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  type: ContentType;
  rewardXp: number;
  completed: boolean;
  position: { index: number; total: number };
  prevId: string | null;
  nextId: string | null;
  lesson?: { sections: LessonSection[] };
  flashcards?: Flashcard[];
  quiz?: { questionCount: number; bestScore: number | null };
}

/** Hasil pemberian reward — dihitung server, idempotent (BR-010). */
export interface RewardOutcome {
  /** true jika materi ini sudah pernah diselesaikan → tidak ada reward baru */
  alreadyRewarded: boolean;
  grants: { label: string; xp: number; point: number }[];
  totalXp: number;
  totalPoint: number;
  levelUp: { from: number; to: number; name: string } | null;
  courseCompleted: boolean;
  gamification: GamificationSummary;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

/** Soal yang dikirim ke klien TIDAK berisi kunci jawaban. */
export interface QuizAttempt {
  attemptId: string;
  contentId: string;
  questions: QuizQuestion[];
}

export interface QuizQuestionResult {
  questionId: string;
  text: string;
  options: { id: string; text: string }[];
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  correct: number;
  total: number;
  perfect: boolean;
  bestScore: number;
  questions: QuizQuestionResult[];
  outcome: RewardOutcome;
}
