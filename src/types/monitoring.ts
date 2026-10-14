import type { RewardEntry } from "./gamification";
import type { CourseSummary } from "./learning";

export interface StudentProgress {
  id: string;
  name: string;
  username: string;
  roomName: string;
  level: number;
  levelName: string;
  xp: number;
  point: number;
  streak: number;
  /** rata-rata progres course, 0–100 */
  courseProgress: number;
  avgScore: number;
  lastActiveAt: string;
  checkedInToday: boolean;
}

export interface AdminOverview {
  totalStudents: number;
  totalRooms: number;
  activeToday: number;
  checkInsToday: number;
  avgCourseProgress: number;
  avgScore: number;
  activity: { date: string; label: string; activeStudents: number; checkIns: number }[];
  needsAttention: StudentProgress[];
}

export interface StudentListPage {
  items: StudentProgress[];
  page: number;
  pageSize: number;
  total: number;
  rooms: string[];
}

export interface QuizScore {
  id: string;
  title: string;
  score: number;
  takenAt: string;
}

export interface StudentDetail {
  student: StudentProgress;
  courses: CourseSummary[];
  recentRewards: RewardEntry[];
  quizScores: QuizScore[];
}
