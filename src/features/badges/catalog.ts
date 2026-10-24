import type { BadgeCategory, BadgeDefinition, BadgeState, BadgeStats } from "../../types/badge";

/**
 * Daftar badge. Untuk menambah badge cukup tambah satu objek di sini:
 * pilih `metric` + `target` dan badge otomatis dinilai dari data santri.
 * Gambar ada di `public/badges/` (hasil potongan dari desain "Koleksi Badge Achievements").
 */
export const BADGES: BadgeDefinition[] = [
  /* ---------------- Level (level di Deen saat ini: 1–5) ---------------- */
  { id: "level-1", category: "LEVEL", image: "/badges/level-1.png", accent: "orange", chip: "Lv. 1", title: "Pemula", description: "Langkah pertama menuju cahaya", metric: "level", target: 1 },
  { id: "level-2", category: "LEVEL", image: "/badges/level-2.png", accent: "slate", chip: "Lv. 2", title: "Penuntut Ilmu", description: "Semangatmu mulai terlihat", metric: "level", target: 2 },
  { id: "level-3", category: "LEVEL", image: "/badges/level-3.png", accent: "green", chip: "Lv. 3", title: "Pencari Hikmah", description: "Ilmu semakin membuka hati", metric: "level", target: 3 },
  { id: "level-4", category: "LEVEL", image: "/badges/level-4.png", accent: "blue", chip: "Lv. 4", title: "Pengamal Ilmu", description: "Ilmu yang kamu pelajari mulai diamalkan", metric: "level", target: 4 },
  { id: "level-5", category: "LEVEL", image: "/badges/level-5.png", accent: "purple", chip: "Lv. 5", title: "Teladan Baik", description: "Kamu memberi inspirasi untuk sekitar", metric: "level", target: 5 },

  /* ---------------- Streak ---------------- */
  { id: "streak-3", category: "STREAK", image: "/badges/streak-3.png", accent: "pink", chip: "3 Hari", title: "Semangat", description: "Konsisten adalah kunci", metric: "longestStreak", target: 3 },
  { id: "streak-7", category: "STREAK", image: "/badges/streak-7.png", accent: "slate", chip: "7 Hari", title: "Istiqomah", description: "Langkah kecil berdampak besar", metric: "longestStreak", target: 7 },
  { id: "streak-14", category: "STREAK", image: "/badges/streak-14.png", accent: "green", chip: "14 Hari", title: "Tidak Mudah Menyerah", description: "Kamu luar biasa!", metric: "longestStreak", target: 14 },
  { id: "streak-30", category: "STREAK", image: "/badges/streak-30.png", accent: "gold", chip: "30 Hari", title: "Sang Pejuang", description: "Konsistensi membawa berkah", metric: "longestStreak", target: 30 },

  /* ---------------- Learning ---------------- */
  { id: "learning-1", category: "LEARNING", image: "/badges/learning-1.png", accent: "purple", chip: "Modul 1", title: "Pembelajar", description: "Menyelesaikan modul pertama", metric: "modulesCompleted", target: 1 },
  { id: "learning-5", category: "LEARNING", image: "/badges/learning-5.png", accent: "blue", chip: "Modul 5", title: "Pencinta Ilmu", description: "Terus melangkah, terus belajar", metric: "modulesCompleted", target: 5 },
  { id: "learning-10", category: "LEARNING", image: "/badges/learning-10.png", accent: "green", chip: "Modul 10", title: "Ahli Materi", description: "Kamu semakin mendalami ilmu", metric: "modulesCompleted", target: 10 },
  { id: "learning-all", category: "LEARNING", image: "/badges/learning-all.png", accent: "gold", chip: "Semua Modul", title: "Master Belajar", description: "Kamu telah menyelesaikan semua modul", metric: "modulesCompleted", targetFrom: "modulesTotal" },

  /* ---------------- Check-in (total hari check-in) ---------------- */
  { id: "checkin-1", category: "CHECKIN", image: "/badges/checkin-1.png", accent: "blue", chip: "1x", title: "Rutin", description: "Hari pertama check-in", metric: "totalCheckIns", target: 1 },
  { id: "checkin-7", category: "CHECKIN", image: "/badges/checkin-7.png", accent: "purple", chip: "7x", title: "Disiplin", description: "Semangatmu menginspirasi", metric: "totalCheckIns", target: 7 },
  { id: "checkin-14", category: "CHECKIN", image: "/badges/checkin-14.png", accent: "green", chip: "14x", title: "Konsisten", description: "Kebiasaan baik yang berharga", metric: "totalCheckIns", target: 14 },
  { id: "checkin-30", category: "CHECKIN", image: "/badges/checkin-30.png", accent: "gold", chip: "30x", title: "Istimewa", description: "Kamu luar biasa konsisten!", metric: "totalCheckIns", target: 30 },

  /* ---------------- Exploration ---------------- */
  { id: "explore-room", category: "EXPLORATION", image: "/badges/explore-room.png", accent: "purple", chip: "Ruang", title: "Petualang Ruang", description: "Bergabung dengan ruang belajar", metric: "roomCount", target: 1 },
  { id: "explore-map", category: "EXPLORATION", image: "/badges/explore-map.png", accent: "blue", chip: "Peta", title: "Penjelajah Peta", description: "Menemukan lokasi baru di peta", metric: "regionsExplored", target: 2 },
  { id: "explore-chat", category: "EXPLORATION", image: "/badges/explore-chat.png", accent: "green", chip: "Chat", title: "Komunikator", description: "Aktif berdiskusi dengan Ziya", metric: "discussions", target: 3 },
  { id: "explore-all", category: "EXPLORATION", image: "/badges/explore-all.png", accent: "gold", chip: "Semua Fitur", title: "Explorer Sejati", description: "Mencoba semua fitur Deen", requires: ["explore-room", "explore-map", "explore-chat", "checkin-1", "learning-1"] },

  /* ---------------- Special ---------------- */
  { id: "special-kind", category: "SPECIAL", image: "/badges/special-kind.png", accent: "pink", chip: "Baik Hati", title: "Baik Hati", description: "Membantu teman di ruang belajar", comingSoon: true },
  { id: "special-collab", category: "SPECIAL", image: "/badges/special-collab.png", accent: "blue", chip: "Kelompok", title: "Kolaborator", description: "Aktif dalam kegiatan kelompok", comingSoon: true },
  { id: "special-creative", category: "SPECIAL", image: "/badges/special-creative.png", accent: "green", chip: "Ide", title: "Kreatif", description: "Memberikan ide bermanfaat", comingSoon: true },
  { id: "special-guard", category: "SPECIAL", image: "/badges/special-guard.png", accent: "orange", chip: "Keamanan", title: "Pelindung", description: "Menjaga keamanan akun", comingSoon: true },
  { id: "special-winner", category: "SPECIAL", image: "/badges/special-winner.png", accent: "purple", chip: "Top 3", title: "Pemenang", description: "Berhasil di leaderboard", metric: "rankTop", target: 1 },
  { id: "special-hijrah", category: "SPECIAL", image: "/badges/special-hijrah.png", accent: "blue", chip: "Bangkit", title: "Hijrah", description: "Kembali ke jalan yang lebih baik", metric: "comebackStreak", target: 3 },
  { id: "special-ramadhan", category: "SPECIAL", image: "/badges/special-ramadhan.png", accent: "green", chip: "Event", title: "Ramadhan", description: "Semangat di bulan penuh berkah", comingSoon: true },
  { id: "special-legend", category: "SPECIAL", image: "/badges/special-legend.png", accent: "gold", chip: "Semua Badge", title: "Legenda Deen", description: "Telah menjadi bagian dari keluarga Deen", requires: "ALL" },
];

export const BADGE_CATEGORY_ORDER: BadgeCategory[] = ["LEVEL", "STREAK", "LEARNING", "CHECKIN", "EXPLORATION", "SPECIAL"];

/**
 * Menilai semua badge.
 * @param sticky id badge yang pernah didapat — tetap dianggap didapat walau angkanya turun
 *               (mis. peringkat leaderboard atau percakapan yang dihapus).
 */
export function evaluateBadges(
  stats: BadgeStats,
  sticky: ReadonlySet<string> = new Set(),
  catalog: BadgeDefinition[] = BADGES
): BadgeState[] {
  const result = new Map<string, BadgeState>();

  const done = (def: BadgeDefinition, current: number, goal: number): BadgeState => {
    const earned = sticky.has(def.id) || (goal > 0 && current >= goal);
    return {
      ...def,
      earned,
      current: earned ? goal : Math.min(current, goal),
      goal,
      progress: earned ? 1 : goal > 0 ? Math.min(1, current / goal) : 0,
    };
  };

  // 1) badge yang dinilai dari satu angka
  for (const def of catalog) {
    if (def.comingSoon) result.set(def.id, { ...def, earned: false, current: 0, goal: 0, progress: 0 });
    else if (def.metric) {
      const goal = def.targetFrom ? Math.max(1, stats[def.targetFrom]) : (def.target ?? 1);
      result.set(def.id, done(def, stats[def.metric] ?? 0, goal));
    }
  }

  // 2) badge gabungan (daftar id tertentu), lalu 3) "semua badge"
  const combine = (def: BadgeDefinition, ids: string[]) => {
    const got = ids.filter((id) => result.get(id)?.earned).length;
    result.set(def.id, done(def, got, ids.length));
  };
  for (const def of catalog) if (Array.isArray(def.requires)) combine(def, def.requires);
  for (const def of catalog) {
    if (def.requires !== "ALL") continue;
    const ids = catalog.filter((b) => b.id !== def.id && !b.comingSoon).map((b) => b.id);
    combine(def, ids);
  }

  return catalog.map((def) => result.get(def.id)!);
}
