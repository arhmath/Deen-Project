/**
 * DATA CONTOH (dummy) — ganti/hapus saat backend sudah ada.
 * Judul course di bawah hanya placeholder; materi final ditentukan sendiri.
 */
export const DEMO_PASSWORD = "deen1234";

export const LEVELS = [
  { level: 1, min: 0, name: "Pemula" },
  { level: 2, min: 100, name: "Pencari Ilmu" },
  { level: 3, min: 250, name: "Santri Rajin" },
  { level: 4, min: 500, name: "Penjaga Ayat" },
  { level: 5, min: 1000, name: "Bintang Deen" },
];

/**
 * Konfigurasi reward — hidup di "server", bukan di komponen UI (BR-007/008, SRS §6).
 * Semua aktivitas belajar memberi XP; POINT hanya dari menyelesaikan kuis.
 */
export const REWARD_CONFIG = {
  DAILY_CHECKIN: { xp: 10, point: 0 },
  LESSON: { xp: 5, point: 0 },
  QUIZ: { xp: 20, point: 20 },
  PERFECT_QUIZ: { xp: 30, point: 30 },
  CHALLENGE: { xp: 50, point: 0 },
  COURSE: { xp: 100, point: 0 },
} as const;

/** Point hanya diberikan untuk kuis. */
export const earnsPoint = (source: "DAILY_CHECKIN" | "LESSON" | "QUIZ" | "PERFECT_QUIZ" | "CHALLENGE" | "COURSE") =>
  source === "QUIZ" || source === "PERFECT_QUIZ";

export const ROOMS = [
  { id: "r1", name: "TPA Al-Hikmah · Kelas A" },
  { id: "r2", name: "TPA Al-Hikmah · Kelas B" },
];

export const USERS = [
  { id: "u-ahmad", studentId: "s-ahmad", name: "Ahmad Fauzi", username: "ahmad_santri", email: "ahmad@deen.test", role: "SANTRI" as const },
  { id: "u-parent", name: "Ibu Rahma", username: "bunda_ahmad", email: "rahma@deen.test", role: "PARENT" as const, children: ["s-ahmad", "s-aisyah"] },
  { id: "u-guru", name: "Ustadz Hakim", username: "ustadz_hakim", email: "hakim@deen.test", role: "ADMIN" as const },
];

export interface RosterStudent {
  id: string;
  name: string;
  username: string;
  roomId: string;
  xp: number;
  streak: number;
  courseProgress: number;
  avgScore: number;
  lastActiveDaysAgo: number;
  checkedInToday: boolean;
}

/** Santri lain di room. Ahmad (santri yang login) dihitung dinamis dari ledger. */
export const ROSTER: RosterStudent[] = [
  { id: "s-r1", name: "Zahra Nabila", username: "zahra_n", roomId: "r1", xp: 640, streak: 12, courseProgress: 88, avgScore: 94, lastActiveDaysAgo: 0, checkedInToday: true },
  { id: "s-r2", name: "Umar Hakim", username: "umar_h", roomId: "r2", xp: 590, streak: 9, courseProgress: 81, avgScore: 90, lastActiveDaysAgo: 0, checkedInToday: true },
  { id: "s-aisyah", name: "Aisyah Putri", username: "aisyah_p", roomId: "r1", xp: 535, streak: 7, courseProgress: 74, avgScore: 92, lastActiveDaysAgo: 0, checkedInToday: true },
  { id: "s-r4", name: "Fatimah Azzahra", username: "fatimah_a", roomId: "r1", xp: 480, streak: 5, courseProgress: 70, avgScore: 86, lastActiveDaysAgo: 1, checkedInToday: false },
  { id: "s-r5", name: "Yusuf Ramadhan", username: "yusuf_r", roomId: "r2", xp: 430, streak: 4, courseProgress: 62, avgScore: 84, lastActiveDaysAgo: 0, checkedInToday: true },
  { id: "s-r6", name: "Khadijah Safira", username: "khadijah_s", roomId: "r1", xp: 385, streak: 3, courseProgress: 58, avgScore: 88, lastActiveDaysAgo: 1, checkedInToday: false },
  { id: "s-r7", name: "Ibrahim Malik", username: "ibrahim_m", roomId: "r2", xp: 310, streak: 2, courseProgress: 49, avgScore: 79, lastActiveDaysAgo: 2, checkedInToday: false },
  { id: "s-r8", name: "Maryam Salsabila", username: "maryam_s", roomId: "r1", xp: 262, streak: 6, courseProgress: 45, avgScore: 83, lastActiveDaysAgo: 0, checkedInToday: true },
  { id: "s-r9", name: "Bilal Prasetyo", username: "bilal_p", roomId: "r2", xp: 245, streak: 1, courseProgress: 40, avgScore: 76, lastActiveDaysAgo: 1, checkedInToday: false },
  { id: "s-r10", name: "Hafidz Alfarizi", username: "hafidz_a", roomId: "r1", xp: 225, streak: 0, courseProgress: 36, avgScore: 72, lastActiveDaysAgo: 4, checkedInToday: false },
  { id: "s-r11", name: "Nadia Kamila", username: "nadia_k", roomId: "r2", xp: 190, streak: 2, courseProgress: 31, avgScore: 80, lastActiveDaysAgo: 1, checkedInToday: false },
  { id: "s-r12", name: "Rayhan Pratama", username: "rayhan_p", roomId: "r1", xp: 165, streak: 0, courseProgress: 27, avgScore: 68, lastActiveDaysAgo: 5, checkedInToday: false },
  { id: "s-r13", name: "Salma Aulia", username: "salma_a", roomId: "r2", xp: 140, streak: 1, courseProgress: 22, avgScore: 74, lastActiveDaysAgo: 2, checkedInToday: false },
  { id: "s-r14", name: "Zidan Maulana", username: "zidan_m", roomId: "r1", xp: 120, streak: 1, courseProgress: 20, avgScore: 70, lastActiveDaysAgo: 0, checkedInToday: true },
  { id: "s-r15", name: "Alifa Rahmania", username: "alifa_r", roomId: "r2", xp: 95, streak: 0, courseProgress: 14, avgScore: 65, lastActiveDaysAgo: 6, checkedInToday: false },
  { id: "s-r16", name: "Faris Naufal", username: "faris_n", roomId: "r1", xp: 70, streak: 0, courseProgress: 10, avgScore: 60, lastActiveDaysAgo: 3, checkedInToday: false },
  { id: "s-r17", name: "Naila Syakira", username: "naila_s", roomId: "r2", xp: 45, streak: 1, courseProgress: 6, avgScore: 70, lastActiveDaysAgo: 1, checkedInToday: false },
  { id: "s-r18", name: "Daffa Ardiansyah", username: "daffa_a", roomId: "r1", xp: 20, streak: 0, courseProgress: 3, avgScore: 55, lastActiveDaysAgo: 7, checkedInToday: false },
];

export const WEEK_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
