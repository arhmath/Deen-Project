import { env } from "@/config/env";
import type { AIDomain, AllowedDomain, BlockedDomain } from "./types";

/** Penanda rahasia di system prompt — jika muncul di output berarti prompt bocor. */
export const SYSTEM_MARKER = "[[DEEN-POLICY-7f3a91]]";

const normalize = (s: string) =>
  s.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/* ------------------------------ prompt injection ------------------------------ */

const INJECTION: RegExp[] = [
  /\b(abaikan|lupakan|acuhkan|kesampingkan|timpa|override)\b.{0,40}\b(instruksi|perintah|aturan|petunjuk|prompt|batasan)/,
  /\b(ignore|disregard|forget|override)\b.{0,40}\b(previous|prior|above|earlier|all|your|the)\b.{0,30}\b(instruction|prompt|rule|guideline|polic)/,
  /\b(system prompt|prompt sistem|instruksi sistem|developer (message|instruction|prompt)|pesan sistem)\b/,
  /\b(tampilkan|tunjukkan|bocorkan|ungkap|beritahu|sebutkan|tuliskan|cetak|show|reveal|print|display|leak|dump|repeat)\b.{0,50}\b(prompt|instruksi (awal|asli|rahasia)|api[ _-]?key|apikey|token|jwt|password|kata sandi|kredensial|credential|secret|private key|env(ironment)?|konfigurasi (internal|rahasia))/,
  /\b(jailbreak|dan mode|developer mode|mode pengembang|do anything now)\b/,
  /\b(kamu|anda|you)\s+(sekarang|kini|are now|must now)\b.{0,40}\b(adalah|jadi|bertindak|act|become)/,
  /\b(pura-?pura|berpura|pretend|roleplay|role-play|bertindak sebagai)\b.{0,40}\b(tanpa (batas|aturan|filter)|admin|root|developer|sistem|unrestricted)/,
  /\b(akses|baca|ambil|tampilkan)\b.{0,30}\b(database|firestore|semua (data|user|pengguna|santri))\b/,
];

export function detectInjection(message: string): boolean {
  const m = normalize(message);
  return INJECTION.some((re) => re.test(m));
}

/* ------------------------------ klasifikasi domain ------------------------------ */

const ALLOWED: [AllowedDomain, RegExp][] = [
  ["GAMIFICATION", /\b(xp|poin|point|level|tingkat|streak|check-?in|absen harian|reward|hadiah|badge|lencana)\b/],
  ["LEADERBOARD", /\b(leaderboard|peringkat|ranking|rangking|papan skor|posisi)\b/],
  ["QUIZ", /\b(quiz|kuis|soal|ujian|pertanyaan kuis|nilai|skor)\b/],
  ["PROGRESS", /\b(progres|progress|kemajuan|perkembangan|capaian|selesai)\b/],
  ["ROOM", /\b(room|kelas|ruang belajar|kode (room|kelas|gabung)|join|bergabung|gabung)\b/],
  ["COURSE", /\b(course|kursus|materi|pelajaran|belajar|modul|konten|lesson|flashcard|challenge|tantangan)\b/],
  ["PARENT_MONITORING", /\b(orang ?tua|wali|ananda|anak(ku| saya)?|putra|putri|memantau|pantau|monitor(ing)?)\b/],
  ["NOTIFICATION", /\b(notifikasi|pemberitahuan|pengingat)\b/],
  ["MAPS", /\b(maps?|peta|lokasi|tpa terdekat|masjid terdekat)\b/],
  ["PROFILE", /\b(profil|profile|akun|username|avatar|nama saya|ganti nama)\b/],
  ["RELIGIOUS_KNOWLEDGE", /\b(islam|islami|allah|nabi|rasul|rasulullah|quran|qur'?an|al-?quran|ayat|surat|surah|hadits?|doa|do'a|sholat|salat|shalat|puasa|zakat|wudhu|wudu|hijaiyah|tajwid|asmaul|husna|akhlak|adab|iman|rukun|malaikat|kisah (para )?nabi|mengaji|iqra|halal|haram|riba|dosa|pahala|syahadat|tauhid|fiqih|fikih)\b/],
  ["DEEN_FEATURE", /\b(deen|aplikasi|fitur|chatbot|guru|ustadz|ustadzah|admin|santri|login|masuk|daftar|register|logout|keluar|cara (pakai|menggunakan))\b/],
];

const BLOCKED: [BlockedDomain, RegExp][] = [
  ["GENERAL_PROGRAMMING", /\b(flutter|react|python|javascript|typescript|java|kotlin|c\+\+|coding|ngoding|program(ming)?|algoritma|compiler|stack ?overflow|malware|virus komputer|ransomware|hack(ing|er)?|exploit|sql injection|bug)\b/],
  ["GENERAL_GAMING", /\b(minecraft|roblox|mobile legends|free fire|pubg|fortnite|genshin|valorant|dota|playstation|steam|cheat game)\b/],
  ["GENERAL_POLITICS", /\b(presiden|pemilu|pilpres|politik|partai|kampanye|demo(nstrasi)?|dpr|menteri)\b/],
  ["GENERAL_ENTERTAINMENT", /\b(film|drama korea|drakor|artis|selebriti|konser|lagu|musik|anime|netflix|youtube|tiktok|gosip)\b/],
  ["GENERAL_RESEARCH", /\b(saham|kripto|bitcoin|investasi|forex|resep|masakan|cuaca|berita|skripsi|jurnal|penelitian|rumus|persamaan|matematika|fisika|kimia)\b/],
];

const GREETING = /^(h[ae]+lo+|hai+|hi+|hey|halo+|assalamu'?alaikum( wr\.? ?wb\.?)?|selamat (pagi|siang|sore|malam)|permisi|p)\b|^(terima ?kasih|makasih|thanks|thank you|oke|ok|siap)\b/;

export const isGreeting = (message: string) => normalize(message).length <= 60 && GREETING.test(normalize(message));

/**
 * Domain Guard deterministik (tanpa LLM): murah, dapat diuji, tidak bisa "dibujuk".
 * Aturan: injection → blokir; ada kata kunci domain Deen → izinkan; jika tidak, kategori blokir/UNRELATED.
 * Pesan sangat pendek dalam percakapan yang sudah relevan mewarisi domain terakhir.
 */
const NEARBY = /\b(terdekat|dekat (saya|sini|rumah)|sekitar (saya|sini|rumah)|nearby)\b/;
const PLACE = /\b(room|kelas|tpa|masjid|mushola|musholla|madrasah|lokasi|tempat belajar|lembaga|ustadz|ustadzah)\b/;

export function classifyDomain(message: string, lastDomain?: AIDomain | null): AIDomain {
  if (detectInjection(message)) return "PROMPT_INJECTION";
  const m = normalize(message);
  // Pencarian lokasi ("room/TPA/masjid terdekat") = Maps, yang belum tersedia → dijawab jujur dari knowledge, bukan sebagai pertanyaan room.
  if (NEARBY.test(m) && PLACE.test(m)) return "MAPS";

  // Skor domain Deen. Religius diutamakan bila ada kata kunci keagamaan eksplisit.
  const hits = ALLOWED.map(([d, re]) => [d, (m.match(new RegExp(re.source, "g")) ?? []).length] as const).filter(([, n]) => n > 0);
  const blocked = BLOCKED.find(([, re]) => re.test(m));

  if (hits.length) {
    // Pertanyaan teknis umum yang kebetulan memuat kata ambigu (mis. "bug", "level" di game lain) ditolak
    // bila TIDAK ada konteks Deen eksplisit.
    const deenCtx = /\b(deen|xp|room|kuis|quiz|course|streak|check-?in|leaderboard|santri|ustadz|ustadzah|materi|nabi|quran|al-?quran|hijaiyah|asmaul)\b/.test(m);
    if (blocked && !deenCtx) return blocked[0];
    hits.sort((a, b) => b[1] - a[1]);
    const rel = hits.find(([d]) => d === "RELIGIOUS_KNOWLEDGE");
    return rel && rel[1] >= hits[0]![1] ? "RELIGIOUS_KNOWLEDGE" : hits[0]![0];
  }
  if (blocked) return blocked[0];
  if (isGreeting(message)) return "DEEN_FEATURE";
  if (lastDomain && !["UNRELATED", "PROMPT_INJECTION"].includes(lastDomain) && !lastDomain.startsWith("GENERAL_") && m.split(" ").length <= 8) {
    return lastDomain; // tindak lanjut singkat: "kenapa?", "contohnya?"
  }
  return "UNRELATED";
}

export const isAllowedDomain = (d: AIDomain): d is AllowedDomain =>
  d !== "UNRELATED" && d !== "PROMPT_INJECTION" && !d.startsWith("GENERAL_");

/* ------------------------------ output guard ------------------------------ */

const OUTPUT_PATTERNS: RegExp[] = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/, // JWT
  /\bsk-[A-Za-z0-9_-]{20,}/, // kunci API gaya OpenAI/Anthropic
  /\bAIza[0-9A-Za-z_-]{30,}/, // kunci Google
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{40,}/, // hash bcrypt
  /\b(FIREBASE_PRIVATE_KEY|JWT_(ACCESS|REFRESH)_SECRET|AI_API_KEY)\b/,
];

export const SAFE_FALLBACK =
  "Maaf, aku tidak bisa menampilkan jawaban itu. Coba tanyakan hal lain tentang belajar di Deen, ya.";

export function guardOutput(text: string): { ok: boolean; text: string } {
  const e = env();
  const secrets = [e.JWT_ACCESS_SECRET, e.JWT_REFRESH_SECRET, e.AI_API_KEY, e.FIREBASE_PRIVATE_KEY].filter((s): s is string => !!s && s.length >= 12);
  const leaked =
    text.includes(SYSTEM_MARKER) || OUTPUT_PATTERNS.some((re) => re.test(text)) || secrets.some((s) => text.includes(s));
  if (leaked) return { ok: false, text: SAFE_FALLBACK };
  return { ok: true, text: text.length > 4000 ? `${text.slice(0, 3990)}…` : text };
}

/* ------------------------------ pesan standar ------------------------------ */

export const REFUSAL_OUT_OF_SCOPE =
  "Maaf, saya fokus membantu hal-hal yang berkaitan dengan Deen. Coba tanyakan tentang pembelajaran, quiz, progress, room, gamifikasi, atau fitur Deen lainnya.";

export const REFUSAL_INJECTION =
  "Maaf, aku tidak bisa mengikuti permintaan itu. Aku di sini untuk membantu belajar dan memakai fitur Deen — yuk tanyakan hal itu saja!";

export const NO_RELIGIOUS_SOURCE =
  "Aku belum punya materi resmi di Deen yang membahas itu, jadi aku tidak mau menjawab sembarangan. Coba lihat materi di course-mu atau tanyakan langsung ke ustadz/ustadzah, ya.";

export const NO_CONTEXT =
  "Aku belum menemukan informasi tentang itu di Deen. Coba tanyakan dengan kata lain, misalnya tentang XP, level, streak, room, quiz, atau progres belajar.";

export const GREETING_REPLY = "Halo! Aku asisten belajar Deen. Mau tanya soal materi, quiz, XP, atau fitur Deen? Silakan ya 😊";
