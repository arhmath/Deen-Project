import type { Role } from "@/modules/users/user.types";

const PERSONAL = /\b(saya|aku|ku|punyaku|milikku|gue|gw)\b|\w+ku\b/;
const CHILD = /\b(anak|anakku|ananda|putra|putri)\b/;

/**
 * Pertanyaan "cara/fungsi/arti" = pengetahuan statis (RAG), bukan data pribadi — kecuali ia juga meminta
 * nilai konkret ("berapa", "sudah sampai mana", "sekarang"). Mencegah tool dipanggil untuk
 * "Bagaimana orang tua melihat progress anak?" yang sebenarnya pertanyaan prosedur.
 */
const HOW_TO = /\b(cara|caranya|fungsi|apa itu|apa sih|arti|artinya|maksud|maksudnya)\b|^\s*bagaimana (orang ?tua|guru|santri|sistem|deen)\b/;
const WANTS_VALUE = /\b(berapa|sudah sampai|sampai mana|sekarang|saat ini|terbaru|hari ini)\b/;
export const isHowTo = (message: string) => HOW_TO.test(message.toLowerCase()) && !WANTS_VALUE.test(message.toLowerCase());

/** Pertanyaan tentang Deen itu sendiri ("Apa itu Deen?") — kata "deen" adalah stopword sehingga RAG leksikal tidak menemukannya. */
const ABOUT = /\b(apa (itu|sih)|apa yang dimaksud( dengan)?|jelaskan|ceritakan( tentang)?|kenalkan|tentang)\s+(aplikasi\s+)?(deen|aplikasi (ini|itu))\b|\b(deen|aplikasi ini) (itu )?(apa|buat apa|untuk apa)\b|\bfungsi (aplikasi|deen)\b/;
export const isAboutDeen = (message: string) => ABOUT.test(message.toLowerCase());

/** Id chunk knowledge yang wajib disertakan untuk niat tertentu (di luar hasil skor RAG). */
export function forcedKnowledge(message: string, domain: string): string[] {
  const ids: string[] = [];
  if (isAboutDeen(message)) ids.push("kb-about");
  if (domain === "MAPS") ids.push("kb-maps");
  return ids;
}

export interface IntentResult {
  tools: string[];
}

/**
 * Router niat deterministik: data dinamis milik user → tool (lewat service + otorisasi);
 * pengetahuan statis → RAG. Pertanyaan umum ("Apa itu XP?") TIDAK memanggil tool.
 */
export function routeIntent(message: string, role: Role, childNames: string[] = []): IntentResult {
  const m = message.toLowerCase();
  const tools = new Set<string>();
  const personal = PERSONAL.test(m);
  if (isHowTo(message)) return { tools: [] };

  if (role === "SANTRI") {
    if (personal) {
      if (/\b(xp|poin|point|level|tingkat)\b/.test(m)) tools.add("get_my_gamification");
      if (/\b(streak|check-?in|absen)\b/.test(m)) tools.add("get_my_streak");
      if (/\b(progres|progress|kemajuan|selesai|belajar|course|materi)\b/.test(m)) tools.add("get_my_progress");
      if (/\b(nilai|skor|hasil)\b/.test(m)) tools.add("get_my_quiz_results");
      if (/\b(peringkat|ranking|rangking|posisi|leaderboard)\b/.test(m)) tools.add("get_leaderboard");
      if (/\b(room|kelas)\b/.test(m)) tools.add("get_my_rooms");
      if (/\b(notifikasi|pemberitahuan)\b/.test(m)) tools.add("get_notifications");
      if (/\b(profil|profile|akun|username|nama)\b/.test(m)) tools.add("get_my_profile");
    } else if (/\b(peringkat|ranking|leaderboard)\b/.test(m) && /\b(teratas|top|juara|terbaik|siapa)\b/.test(m)) {
      tools.add("get_leaderboard");
    }
  } else if (role === "PARENT") {
    const namesChild = childNames.some((n) => n.length >= 3 && m.includes(n.toLowerCase()));
    if (CHILD.test(m) || namesChild) {
      if (/\b(xp|poin|point|level|streak|check-?in|absen)\b/.test(m)) tools.add("get_child_gamification");
      if (/\b(progres|progress|kemajuan|selesai|belajar|course|materi)\b/.test(m)) tools.add("get_child_progress");
      if (/\b(nilai|skor|hasil|kuis|quiz)\b/.test(m)) tools.add("get_child_quiz_results");
      if (!tools.size && /\b(perkembangan|kabar|bagaimana|gimana)\b/.test(m)) {
        tools.add("get_child_gamification");
        tools.add("get_child_progress");
      }
    }
    if (/\b(notifikasi|pemberitahuan)\b/.test(m) && personal) tools.add("get_notifications");
    if (/\b(peringkat|ranking|leaderboard)\b/.test(m) && /\b(teratas|top|juara|terbaik)\b/.test(m)) tools.add("get_leaderboard");
  } else {
    if (/\b(statistik|ringkasan|rekap|ikhtisar|overview|dashboard)\b/.test(m)) {
      tools.add("get_room_statistics");
      tools.add("get_learning_statistics");
    }
    if (/\b(perlu perhatian|tertinggal|tidak aktif|jarang aktif|santri)\b/.test(m) && /\b(aktif|perhatian|tertinggal|progres|progress|statistik)\b/.test(m)) tools.add("get_student_statistics");
    if (/\b(course|kursus|materi)\b/.test(m) && /\b(statistik|berapa|jumlah|daftar|status)\b/.test(m)) tools.add("get_course_statistics");
    if (/\b(notifikasi|pemberitahuan)\b/.test(m) && personal) tools.add("get_notifications");
  }
  return { tools: [...tools] };
}
