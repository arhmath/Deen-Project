/**
 * Mock Deen AI (mode VITE_USE_MOCK != "false") — meniru kontrak /ai/* (05B) supaya halaman Chatbot bisa
 * didemokan tanpa backend. Ini BUKAN AI sungguhan: klasifikasi domain berbasis kata kunci, jawaban dari FAQ kecil
 * dan (untuk santri) data gamifikasi mock. Perilaku aturan yang ditiru: ownership (403/404), domain refusal = 200,
 * injection ditolak, rate limit 5/10 dtk (429), umpan balik sekali per pesan (409).
 */
import { ApiError } from "../api";
import type { GamificationSummary } from "../../types/gamification";
import type { Role } from "../../types/user";

interface StoredMessage { id: string; role: "user" | "assistant"; content: string; created_at: string; sources?: { id: string; title: string; type: string }[] }
interface StoredConversation { id: string; userId: string; title: string; created_at: string; updated_at: string; messages: StoredMessage[] }
interface Store { conversations: StoredConversation[]; feedback: Record<string, string> }

const KEY = "deen.mock.ai.v1";
let memory: Store | null = null;
const hits = new Map<string, number[]>();

function load(): Store {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (memory = JSON.parse(raw) as Store);
  } catch { /* abaikan */ }
  return (memory = { conversations: [], feedback: {} });
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* abaikan */ }
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`);

const INJECTION = /(abaikan|lupakan|ignore|disregard).{0,40}(instruksi|perintah|aturan|instruction|prompt)|system prompt|api[ _-]?key|jailbreak|developer mode/i;
const BLOCKED = /\b(flutter|react|python|javascript|coding|malware|hack|saham|kripto|presiden|pemilu|film|drakor|resep|minecraft|roblox)\b/i;
const DEEN = /\b(deen|xp|poin|point|level|streak|check-?in|leaderboard|peringkat|room|kelas|kuis|quiz|course|materi|belajar|progres|progress|santri|guru|ustadz|orang ?tua|anak|notifikasi|profil|akun|maps|peta)\b/i;

const FAQ: [RegExp, { id: string; title: string; text: string }][] = [
  [/\b(apa itu|jelaskan|tentang)\b.*\bdeen\b|\bdeen itu apa\b/i, { id: "kb-about", title: "Tentang Deen", text: "Deen adalah aplikasi pembelajaran Islam berbasis gamifikasi untuk santri TPA, dengan tujuan mengubah rasa bosan menjadi semangat belajar, setiap hari." }],
  [/\b(xp|poin|point)\b/i, { id: "kb-xp-point", title: "Apa itu XP dan point", text: "XP dipakai untuk menentukan level, sedangkan point dipakai untuk peringkat leaderboard. Keduanya diberikan oleh server Deen dan tidak bisa diberikan dua kali untuk aktivitas yang sama." }],
  [/\b(streak|check-?in)\b/i, { id: "kb-checkin-streak", title: "Daily check-in dan streak", text: "Santri bisa check-in satu kali per hari dan mendapat reward harian. Streak adalah jumlah hari berturut-turut santri check-in; jika satu hari terlewat, streak kembali ke 1." }],
  [/\b(kuis|quiz)\b/i, { id: "kb-quiz", title: "Cara mengerjakan kuis", text: "Buka konten kuis di course, pilih jawaban untuk setiap pertanyaan, lalu kirim. Nilai dihitung otomatis oleh server dan pembahasan ditampilkan setelah kuis dikirim." }],
  [/\b(room|kelas|join|gabung)\b/i, { id: "kb-join-room", title: "Cara bergabung ke room", text: "Minta kode room dari gurumu, lalu masukkan kode itu di aplikasi Deen. Setelah bergabung, course yang sudah dipublikasikan guru muncul di halaman Pembelajaran." }],
  [/\b(leaderboard|peringkat)\b/i, { id: "kb-leaderboard", title: "Leaderboard", text: "Leaderboard menampilkan peringkat santri berdasarkan point tertinggi, lalu XP tertinggi." }],
  [/\b(orang ?tua|anak)\b/i, { id: "kb-parent", title: "Orang tua memantau anak", text: "Orang tua dapat memantau progres, XP, streak, dan nilai kuis anak yang sudah terhubung." }],
  [/\b(maps?|peta|terdekat)\b/i, { id: "kb-maps", title: "Maps", text: "Fitur Maps masih disiapkan dan belum tersedia sepenuhnya, jadi aku belum bisa mencari lokasi terdekat." }],
];

export const MOCK_REFUSAL = "Maaf, saya fokus membantu hal-hal yang berkaitan dengan Deen. Coba tanyakan tentang pembelajaran, quiz, progress, room, gamifikasi, atau fitur Deen lainnya.";
const REFUSAL_INJECTION = "Maaf, aku tidak bisa mengikuti permintaan itu. Aku di sini untuk membantu belajar dan memakai fitur Deen — yuk tanyakan hal itu saja!";

interface Reply { content: string; sources: { id: string; title: string; type: string }[]; domain: string; grounded: boolean }

function answer(message: string, role: Role, g: GamificationSummary | null): Reply {
  if (INJECTION.test(message)) return { content: REFUSAL_INJECTION, sources: [], domain: "PROMPT_INJECTION", grounded: false };
  const deen = DEEN.test(message);
  if (BLOCKED.test(message) && !deen) return { content: MOCK_REFUSAL, sources: [], domain: "GENERAL_RESEARCH", grounded: false };
  if (!deen) return { content: MOCK_REFUSAL, sources: [], domain: "UNRELATED", grounded: false };

  const parts: string[] = [];
  const sources: Reply["sources"] = [];
  const personal = /\b(saya|aku|ku)\b/i.test(message);
  if (role === "SANTRI" && g && personal && /\b(xp|poin|point|level|streak|check-?in)\b/i.test(message)) {
    parts.push(`Saat ini kamu punya ${g.xp} XP dan ${g.point} point, level ${g.level.level} (${g.level.name}). Streakmu ${g.streak} hari${g.checkedInToday ? ", dan kamu sudah check-in hari ini." : ", dan kamu belum check-in hari ini."}`);
    sources.push({ id: "data:progress", title: "Data belajar", type: "progress" });
  }
  const faq = FAQ.find(([re]) => re.test(message));
  if (faq) {
    parts.push(faq[1].text);
    sources.push({ id: faq[1].id, title: faq[1].title, type: "knowledge" });
  }
  if (!parts.length) return { content: "Aku belum menemukan informasi tentang itu di Deen. Coba tanyakan tentang XP, level, streak, room, quiz, atau progres belajar.", sources: [], domain: "DEEN_FEATURE", grounded: false };
  return { content: parts.join("\n\n"), sources, domain: "DEEN_FEATURE", grounded: true };
}

function rateLimit(userId: string) {
  const now = Date.now();
  const arr = (hits.get(userId) ?? []).filter((t) => now - t < 10_000);
  if (arr.length >= 5) throw new ApiError("Terlalu banyak permintaan. Coba lagi sebentar lagi.", 429);
  arr.push(now);
  hits.set(userId, arr);
}

function owned(id: string, userId: string): StoredConversation {
  const c = load().conversations.find((x) => x.id === id);
  if (!c) throw new ApiError("Percakapan tidak ditemukan.", 404);
  if (c.userId !== userId) throw new ApiError("Percakapan ini bukan milikmu.", 403);
  return c;
}

export interface MockAiReq { method: string; path: string; body: unknown; params: Record<string, string>; userId: string; role: Role; gamification: GamificationSummary | null }

/** Kembalikan `undefined` bila path bukan milik /ai/*. */
export function mockAiRoute(req: MockAiReq): unknown {
  const { method, path, userId } = req;
  const store = load();

  if (method === "POST" && path === "/ai/chat") {
    rateLimit(userId);
    const b = (req.body ?? {}) as { message?: unknown; conversation_id?: unknown };
    const message = typeof b.message === "string" ? b.message.trim() : "";
    if (!message || message.length > 4000) throw new ApiError("Pesan harus 1–4000 karakter.", 400);
    const now = new Date();
    let conv: StoredConversation;
    if (typeof b.conversation_id === "string" && b.conversation_id) conv = owned(b.conversation_id, userId);
    else {
      conv = { id: uid(), userId, title: message.slice(0, 80), created_at: now.toISOString(), updated_at: now.toISOString(), messages: [] };
      store.conversations.unshift(conv);
    }
    const r = answer(message, req.role, req.gamification);
    const reply: StoredMessage = { id: uid(), role: "assistant", content: r.content, created_at: new Date(now.getTime() + 1).toISOString(), sources: r.sources };
    conv.messages.push({ id: uid(), role: "user", content: message, created_at: now.toISOString() }, reply);
    conv.updated_at = reply.created_at;
    store.conversations.sort((a, z) => z.updated_at.localeCompare(a.updated_at));
    save();
    return {
      message: r.grounded || r.domain === "DEEN_FEATURE" ? "Pesan AI berhasil diproses" : "Pertanyaan berada di luar cakupan Deen",
      data: { conversation_id: conv.id, message: { id: reply.id, role: "assistant", content: reply.content, created_at: reply.created_at }, sources: r.sources, meta: { intent: r.domain, domain: r.domain, grounded: r.grounded } },
    };
  }

  if (method === "GET" && path === "/ai/conversations") {
    const mine = store.conversations.filter((c) => c.userId === userId);
    return {
      message: "Daftar percakapan berhasil diambil",
      data: mine.map((c) => ({ id: c.id, title: c.title, message_count: c.messages.length, created_at: c.created_at, updated_at: c.updated_at })),
      pagination: { page: 1, limit: 30, total: mine.length },
    };
  }

  const m = path.match(/^\/ai\/conversations\/([^/]+)$/);
  if (m && method === "GET") {
    const c = owned(m[1]!, userId);
    return { message: "Percakapan berhasil diambil", data: { id: c.id, title: c.title, created_at: c.created_at, messages: c.messages.map((x) => (x.role === "assistant" ? x : { id: x.id, role: x.role, content: x.content, created_at: x.created_at })) } };
  }
  if (m && method === "DELETE") {
    owned(m[1]!, userId);
    store.conversations = store.conversations.filter((c) => c.id !== m[1]);
    save();
    return { message: "Percakapan berhasil dihapus" };
  }

  const f = path.match(/^\/ai\/messages\/([^/]+)\/feedback$/);
  if (f && method === "POST") {
    const owner = store.conversations.find((c) => c.messages.some((x) => x.id === f[1] && x.role === "assistant"));
    if (!owner) throw new ApiError("Pesan tidak ditemukan.", 404);
    if (owner.userId !== userId) throw new ApiError("Pesan ini bukan milikmu.", 403);
    const rating = (req.body as { rating?: string } | undefined)?.rating;
    if (rating !== "positive" && rating !== "negative") throw new ApiError("Penilaian tidak valid.", 400);
    if (store.feedback[f[1]!]) throw new ApiError("Kamu sudah memberi umpan balik untuk pesan ini.", 409);
    store.feedback[f[1]!] = rating;
    save();
    return { message: "Umpan balik berhasil disimpan" };
  }

  throw new ApiError("Endpoint tidak ditemukan.", 404);
}
