export type BadgeCategory = "LEVEL" | "STREAK" | "LEARNING" | "CHECKIN" | "EXPLORATION" | "SPECIAL";

/** Warna chip label di bawah badge (mis. "Lv. 1", "3 Hari"). */
export type BadgeAccent = "orange" | "slate" | "green" | "blue" | "purple" | "gold" | "pink";

/** Angka-angka yang dipakai untuk menilai badge. Semuanya diturunkan dari data yang sudah ada. */
export type BadgeMetric =
  | "level"
  | "longestStreak"
  | "totalCheckIns"
  | "comebackStreak"
  | "modulesCompleted"
  | "modulesTotal"
  | "coursesCompleted"
  | "quizzesDone"
  | "roomCount"
  | "regionsExplored"
  | "discussions"
  | "challengesCompleted"
  | "rankTop";

export type BadgeStats = Record<BadgeMetric, number>;

export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  title: string;
  /** Kalimat singkat di bawah nama badge. */
  description: string;
  /** Teks chip, mis. "Lv. 1", "3 Hari", "Modul 5". */
  chip: string;
  accent: BadgeAccent;
  /** Path gambar di folder `public/badges/`. */
  image: string;
  /** Dinilai dari `metric` >= `target`. */
  metric?: BadgeMetric;
  target?: number;
  /** Target diambil dari angka lain (mis. "semua modul" = jumlah seluruh modul). */
  targetFrom?: BadgeMetric;
  /** Didapat jika semua badge ini sudah didapat. "ALL" = semua badge yang sudah tersedia. */
  requires?: string[] | "ALL";
  /** Fitur pendukungnya belum ada → tampil terkunci dengan label "Segera hadir". */
  comingSoon?: boolean;
}

export interface BadgeState extends BadgeDefinition {
  earned: boolean;
  current: number;
  /** Target yang berlaku saat ini (0 untuk badge "segera hadir"). */
  goal: number;
  /** 0–1 */
  progress: number;
}

export const BADGE_CATEGORY_LABEL: Record<BadgeCategory, string> = {
  LEVEL: "Level Badges",
  STREAK: "Streak Badges",
  LEARNING: "Learning Badges",
  CHECKIN: "Check-in Badges",
  EXPLORATION: "Exploration Badges",
  SPECIAL: "Special Badges",
};

export const BADGE_CATEGORY_HINT: Record<BadgeCategory, string> = {
  LEVEL: "Tunjukkan progres belajarmu. Semakin tinggi level, semakin keren!",
  STREAK: "Konsisten hari ini, luar biasa di kemudian hari!",
  LEARNING: "Selesaikan modul dan kuis!",
  CHECKIN: "Jangan lupa check-in setiap hari!",
  EXPLORATION: "Jelajahi fitur dan raih pengalaman baru!",
  SPECIAL: "Pencapaian spesial untuk momen luar biasa!",
};

export const BADGE_CATEGORY_ICON: Record<BadgeCategory, string> = {
  LEVEL: "🛡️",
  STREAK: "⚡",
  LEARNING: "📖",
  CHECKIN: "📅",
  EXPLORATION: "🗺️",
  SPECIAL: "⭐",
};
