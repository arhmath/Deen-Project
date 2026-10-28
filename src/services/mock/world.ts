/**
 * "Dunia" data mock: room, keanggotaan, course (beserta isi materinya), dan
 * relasi orang tua–anak. Semua bisa dibuat/diubah guru & pengguna lewat API mock,
 * lalu disimpan di localStorage. Aturan bisnis SRS ditegakkan DI SINI (server side).
 */
import { ApiError } from "../api";
import type { CourseStatus } from "../../types/learning";
import type {
  CardDoc,
  ContentDoc,
  CourseDoc,
  EditableContentType,
  ModuleDoc,
  QuestionDoc,
} from "../../types/courseAdmin";
import { COURSE_DEFS, DECKS, lessonFor, questionsForQuiz } from "./content";
import { ROOMS, ROSTER, USERS } from "./data";

export type CourseRec = Omit<CourseDoc, "roomName">;

export interface RoomRec {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  archived: boolean;
  createdAt: string;
}
export interface Membership {
  roomId: string;
  studentId: string;
  joinedAt: string;
}
export interface ParentLink {
  parentId: string;
  studentId: string;
}
export interface World {
  rooms: RoomRec[];
  memberships: Membership[];
  courses: CourseRec[];
  parentLinks: ParentLink[];
  /** studentId → kode yang diberikan santri ke orang tuanya */
  linkCodes: Record<string, string>;
}

/* ------------------------------ persistensi ------------------------------ */

const WORLD_KEY = "deen.mock.world.v1";
let cache: World | null = null;

export const GURU_ID = "u-guru";

function seedWorld(): World {
  const now = new Date().toISOString();
  const rooms: RoomRec[] = [
    { id: "r1", name: ROOMS[0]!.name, joinCode: "HKM7A2", ownerId: GURU_ID, archived: false, createdAt: now },
    { id: "r2", name: ROOMS[1]!.name, joinCode: "HKM7B5", ownerId: GURU_ID, archived: false, createdAt: now },
  ];

  const memberships: Membership[] = [
    { roomId: "r1", studentId: "s-ahmad", joinedAt: now },
    ...ROSTER.map((r) => ({ roomId: r.roomId, studentId: r.id, joinedAt: now })),
  ];

  const courses: CourseRec[] = COURSE_DEFS.map((def) => ({
    id: def.id,
    roomId: "r1",
    title: def.title,
    description: def.description,
    status: "PUBLISHED" as CourseStatus,
    updatedAt: now,
    modules: def.modules.map((m) => ({
      id: m.id,
      title: m.title,
      contents: m.contents.map<ContentDoc>((c) => ({
        id: c.id,
        title: c.title,
        type: c.type as EditableContentType,
        sections: c.type === "LESSON" ? lessonFor(c.id, c.title).map((x) => ({ ...x })) : [],
        cards: c.type === "FLASHCARD" ? (DECKS[c.id] ?? []).map((d, i) => ({ id: `${c.id}-f${i}`, ...d })) : [],
        questions: c.type === "QUIZ" ? questionsForQuiz(c.id).map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) })) : [],
      })),
    })),
  }));

  // Satu course DRAFT sebagai bahan demo "publikasikan"
  courses.push({
    id: "c5",
    roomId: "r1",
    title: "Doa Sehari-hari",
    description: "Doa-doa pendek yang dipakai dalam kegiatan harian.",
    status: "DRAFT",
    updatedAt: now,
    modules: [
      {
        id: "c5-m1",
        title: "Doa harian",
        contents: [
          {
            id: "c5-1", title: "Doa Sebelum dan Sesudah Tidur", type: "LESSON", cards: [], questions: [],
            sections: [
              { heading: "Sebelum tidur", text: "Sebelum tidur kita membaca: Bismika Allahumma ahya wa bismika amut. Artinya: dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati." },
              { heading: "Setelah bangun", text: "Setelah bangun kita membaca: Alhamdu lillahilladzi ahyana ba'da ma amatana wa ilaihin nusyur." },
            ],
          },
          {
            id: "c5-2", title: "Kartu Doa Harian", type: "FLASHCARD", sections: [], questions: [],
            cards: [
              { id: "c5-2-f0", front: "Sebelum makan", back: "Bismillah" },
              { id: "c5-2-f1", front: "Setelah makan", back: "Alhamdulillah" },
              { id: "c5-2-f2", front: "Sebelum tidur", back: "Bismika Allahumma ahya wa bismika amut" },
            ],
          },
          {
            id: "c5-3", title: "Kuis Doa Harian", type: "QUIZ", sections: [], cards: [],
            questions: [
              { id: "c5-3-q0", text: "Apa yang diucapkan sebelum makan?", options: [{ id: "a", text: "Bismillah" }, { id: "b", text: "Alhamdulillah" }], correctOptionId: "a", explanation: "Sebelum makan kita mengucapkan Bismillah." },
              { id: "c5-3-q1", text: "Setelah selesai makan, kita mengucapkan ...", options: [{ id: "a", text: "Bismillah" }, { id: "b", text: "Alhamdulillah" }], correctOptionId: "b", explanation: "Alhamdulillah adalah tanda syukur setelah makan." },
            ],
          },
        ],
      },
    ],
  });

  const parentLinks: ParentLink[] = [];
  for (const u of USERS) {
    if ("children" in u && u.children) u.children.forEach((c) => parentLinks.push({ parentId: u.id, studentId: c }));
  }

  return { rooms, memberships, courses, parentLinks, linkCodes: { "s-ahmad": "ORT-AHMAD" } };
}

export function getWorld(): World {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(WORLD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as World;
      if (Array.isArray(parsed.rooms) && Array.isArray(parsed.courses)) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    /* seed ulang */
  }
  cache = seedWorld();
  saveWorld(cache);
  return cache;
}

export function saveWorld(w: World) {
  cache = w;
  try {
    localStorage.setItem(WORLD_KEY, JSON.stringify(w));
  } catch {
    /* noop */
  }
}

export function resetWorld() {
  cache = null;
  try {
    localStorage.removeItem(WORLD_KEY);
  } catch {
    /* noop */
  }
}

/* ------------------------------ pencarian ------------------------------ */

export const courseContentsOf = (c: CourseRec): ContentDoc[] => c.modules.flatMap((m) => m.contents);
export const roomById = (w: World, id: string) => w.rooms.find((r) => r.id === id);

/** Room aktif (tidak diarsipkan) yang diikuti santri. */
export function activeRoomIds(w: World, studentId: string): string[] {
  const active = new Set(w.rooms.filter((r) => !r.archived).map((r) => r.id));
  return w.memberships.filter((m) => m.studentId === studentId && active.has(m.roomId)).map((m) => m.roomId);
}

/** BR-005 & BR-013: santri hanya melihat course PUBLISHED dari room aktif yang diikutinya. */
export function visibleCourses(w: World, studentId: string): CourseRec[] {
  const rooms = new Set(activeRoomIds(w, studentId));
  return w.courses.filter((c) => c.status === "PUBLISHED" && rooms.has(c.roomId));
}

export function findContentIn(w: World, contentId: string, courses: CourseRec[] = w.courses) {
  for (const course of courses) {
    const list = courseContentsOf(course);
    const index = list.findIndex((c) => c.id === contentId);
    if (index >= 0) return { course, content: list[index]!, index, list };
  }
  return null;
}

/* ------------------------------ kode & id ------------------------------ */

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = (len: number) =>
  Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

/** BR-014: join code unik. */
export function newJoinCode(w: World): string {
  let code = randomCode(6);
  while (w.rooms.some((r) => r.joinCode === code)) code = randomCode(6);
  return code;
}

export function linkCodeFor(w: World, studentId: string): string {
  let code = w.linkCodes[studentId];
  if (!code) {
    do code = `ORT-${randomCode(6)}`;
    while (Object.values(w.linkCodes).includes(code));
    w.linkCodes[studentId] = code;
    saveWorld(w);
  }
  return code;
}

/* ------------------------------ room ------------------------------ */

export function ownedRoomOrThrow(w: World, ownerId: string, roomId: string): RoomRec {
  const room = roomById(w, roomId);
  if (!room) throw new ApiError("Room tidak ditemukan.", 404);
  if (room.ownerId !== ownerId) throw new ApiError("Room ini bukan milikmu.", 403); // BR-004
  return room;
}

const cleanName = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function createRoom(w: World, ownerId: string, name: unknown): RoomRec {
  const n = cleanName(name);
  if (n.length < 3 || n.length > 80) {
    throw new ApiError("Nama room harus 3–80 karakter.", 422, { name: "Nama room harus 3–80 karakter." });
  }
  const room: RoomRec = {
    id: `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name: n,
    joinCode: newJoinCode(w),
    ownerId,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  saveWorld({ ...w, rooms: [...w.rooms, room] });
  return room;
}

export function updateRoom(w: World, ownerId: string, roomId: string, patch: { name?: unknown; archived?: unknown }) {
  const room = ownedRoomOrThrow(w, ownerId, roomId);
  if (patch.name !== undefined) {
    const n = cleanName(patch.name);
    if (n.length < 3 || n.length > 80) {
      throw new ApiError("Nama room harus 3–80 karakter.", 422, { name: "Nama room harus 3–80 karakter." });
    }
    room.name = n;
  }
  if (typeof patch.archived === "boolean") room.archived = patch.archived;
  saveWorld(w);
  return room;
}

export function removeMember(w: World, ownerId: string, roomId: string, studentId: string) {
  ownedRoomOrThrow(w, ownerId, roomId);
  const before = w.memberships.length;
  const memberships = w.memberships.filter((m) => !(m.roomId === roomId && m.studentId === studentId));
  if (memberships.length === before) throw new ApiError("Anggota tidak ditemukan di room ini.", 404);
  saveWorld({ ...w, memberships });
}

export function joinRoom(w: World, studentId: string, code: unknown): RoomRec {
  const c = cleanName(code).toUpperCase();
  if (!c) throw new ApiError("Masukkan kode gabung dulu, ya.", 422, { code: "Masukkan kode gabung." });
  const room = w.rooms.find((r) => r.joinCode === c);
  if (!room) throw new ApiError("Kode gabung tidak ditemukan. Cek lagi kodenya ya.", 404);
  if (room.archived) throw new ApiError("Room ini sudah diarsipkan, jadi belum bisa dimasuki.", 403);
  // BR-002: tidak boleh ada keanggotaan ganda
  if (w.memberships.some((m) => m.roomId === room.id && m.studentId === studentId)) {
    throw new ApiError("Kamu sudah tergabung di room ini.", 409);
  }
  saveWorld({ ...w, memberships: [...w.memberships, { roomId: room.id, studentId, joinedAt: new Date().toISOString() }] });
  return room;
}

/* ------------------------------ orang tua ------------------------------ */

export function linkChild(w: World, parentId: string, code: unknown): string {
  const c = cleanName(code).toUpperCase();
  if (!c) throw new ApiError("Masukkan kode anak dulu, ya.", 422, { code: "Masukkan kode anak." });
  const entry = Object.entries(w.linkCodes).find(([, v]) => v === c);
  if (!entry) throw new ApiError("Kode anak tidak ditemukan. Minta anakmu cek lagi di halaman Profil.", 404);
  const studentId = entry[0];
  if (w.parentLinks.some((l) => l.parentId === parentId && l.studentId === studentId)) {
    throw new ApiError("Anak ini sudah terhubung dengan akunmu.", 409);
  }
  saveWorld({ ...w, parentLinks: [...w.parentLinks, { parentId, studentId }] });
  return studentId;
}

export const linkedChildIds = (w: World, parentId: string) =>
  w.parentLinks.filter((l) => l.parentId === parentId).map((l) => l.studentId);

/* ------------------------------ course ------------------------------ */

export function createCourse(
  w: World,
  ownerId: string,
  input: { roomId?: unknown; title?: unknown; description?: unknown }
): CourseRec {
  const room = ownedRoomOrThrow(w, ownerId, String(input.roomId ?? ""));
  const title = cleanName(input.title);
  if (title.length < 3 || title.length > 120) {
    throw new ApiError("Judul course harus 3–120 karakter.", 422, { title: "Judul course harus 3–120 karakter." });
  }
  const course: CourseRec = {
    id: `co-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    roomId: room.id,
    title,
    description: cleanName(input.description).slice(0, 500),
    status: "DRAFT", // FR-COURSE-2: course baru selalu DRAFT
    updatedAt: new Date().toISOString(),
    modules: [{ id: `m-${Math.random().toString(36).slice(2, 9)}`, title: "Modul 1", contents: [] }],
  };
  saveWorld({ ...w, courses: [...w.courses, course] });
  return course;
}

/** Daftar masalah isi course. `strict` = syarat untuk PUBLISHED. */
export function courseProblems(c: Pick<CourseDoc, "title" | "modules">, strict: boolean): string[] {
  const out: string[] = [];
  if (!c.title.trim()) out.push("Judul course belum diisi.");
  if (strict) {
    const total = c.modules.reduce((a, m) => a + m.contents.length, 0);
    if (total === 0) out.push("Tambahkan minimal satu materi sebelum dipublikasikan.");
  }
  c.modules.forEach((m, mi) => {
    if (!m.title.trim()) out.push(`Modul ${mi + 1}: judul belum diisi.`);
    m.contents.forEach((ct) => {
      const where = `Materi "${ct.title.trim() || "tanpa judul"}"`;
      if (!ct.title.trim()) out.push(`Modul ${mi + 1}: ada materi yang judulnya belum diisi.`);
      if (!strict) return;
      if (ct.type === "LESSON") {
        if (ct.sections.length === 0 || ct.sections.some((s) => !s.text.trim())) out.push(`${where}: isi pelajaran belum lengkap.`);
      } else if (ct.type === "FLASHCARD") {
        if (ct.cards.length === 0 || ct.cards.some((k) => !k.front.trim() || !k.back.trim())) out.push(`${where}: kartu belum lengkap (sisi depan dan belakang).`);
      } else if (ct.type === "QUIZ") {
        if (ct.questions.length === 0) out.push(`${where}: tambahkan minimal satu soal.`);
        ct.questions.forEach((q, qi) => {
          const filled = q.options.filter((o) => o.text.trim());
          if (!q.text.trim()) out.push(`${where}: soal ${qi + 1} belum ada pertanyaannya.`);
          else if (filled.length < 2) out.push(`${where}: soal ${qi + 1} butuh minimal 2 pilihan jawaban.`);
          else if (!filled.some((o) => o.id === q.correctOptionId)) out.push(`${where}: soal ${qi + 1} belum punya jawaban yang benar.`);
        });
      }
    });
  });
  return out;
}

function normalizeContent(ct: ContentDoc): ContentDoc {
  const type = ct.type;
  return {
    id: ct.id,
    title: ct.title.trim(),
    type,
    sections: type === "LESSON" ? ct.sections.map((s) => ({ heading: s.heading?.trim() || undefined, text: s.text })) : [],
    cards: type === "FLASHCARD" ? ct.cards.map<CardDoc>((k) => ({ id: k.id, front: k.front.trim(), back: k.back.trim() })) : [],
    questions:
      type === "QUIZ"
        ? ct.questions.map<QuestionDoc>((q) => ({
            id: q.id,
            text: q.text.trim(),
            // pilihan kosong dibuang; jawaban benar yang ikut terbuang dianggap belum dipilih
            options: q.options.filter((o) => o.text.trim()).map((o) => ({ id: o.id, text: o.text.trim() })),
            correctOptionId: q.options.some((o) => o.id === q.correctOptionId && o.text.trim()) ? q.correctOptionId : "",
            explanation: q.explanation.trim(),
          }))
        : [],
  };
}

export function saveCourse(w: World, ownerId: string, courseId: string, doc: Partial<CourseDoc>): CourseRec {
  const existing = w.courses.find((c) => c.id === courseId);
  if (!existing) throw new ApiError("Course tidak ditemukan.", 404);
  ownedRoomOrThrow(w, ownerId, existing.roomId); // BR-004: hanya course di room miliknya

  const status = (doc.status ?? existing.status) as CourseStatus;
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) throw new ApiError("Status course tidak valid.", 422);
  const modules = (doc.modules ?? existing.modules) as ModuleDoc[];
  const title = (doc.title ?? existing.title).toString();
  const description = (doc.description ?? existing.description).toString().slice(0, 500);

  // id modul/materi harus unik, termasuk terhadap course lain
  const seen = new Set<string>();
  const otherIds = new Set(w.courses.filter((c) => c.id !== courseId).flatMap((c) => c.modules.flatMap((m) => [m.id, ...m.contents.map((x) => x.id)])));
  for (const m of modules) {
    for (const id of [m.id, ...m.contents.map((x) => x.id)]) {
      if (seen.has(id) || otherIds.has(id)) throw new ApiError("ID modul/materi bentrok. Muat ulang halaman lalu coba lagi.", 409);
      seen.add(id);
    }
  }

  const problems = courseProblems({ title, modules }, status === "PUBLISHED");
  if (problems.length > 0) {
    throw new ApiError(
      status === "PUBLISHED" ? `Course belum bisa dipublikasikan:\n${problems.join("\n")}` : problems.join("\n"),
      422
    );
  }

  const next: CourseRec = {
    ...existing,
    title: title.trim(),
    description: description.trim(),
    status,
    updatedAt: new Date().toISOString(),
    modules: modules.map((m) => ({ id: m.id, title: m.title.trim(), contents: m.contents.map(normalizeContent) })),
  };
  saveWorld({ ...w, courses: w.courses.map((c) => (c.id === courseId ? next : c)) });
  return next;
}

/** Hapus course yang sudah diarsipkan (selaras dengan DELETE /admin/courses/:id di backend). */
export function deleteCourse(w: World, ownerId: string, courseId: string) {
  const existing = w.courses.find((c) => c.id === courseId);
  if (!existing) throw new ApiError("Course tidak ditemukan.", 404);
  ownedRoomOrThrow(w, ownerId, existing.roomId);
  if (existing.status !== "ARCHIVED") throw new ApiError("Arsipkan course dulu sebelum menghapusnya.", 409);
  saveWorld({ ...w, courses: w.courses.filter((c) => c.id !== courseId) });
}

/** Hapus room yang sudah diarsipkan beserta course-nya (selaras dengan DELETE /admin/rooms/:id?permanent=true). */
export function deleteRoom(w: World, ownerId: string, roomId: string) {
  const room = ownedRoomOrThrow(w, ownerId, roomId);
  if (!room.archived) throw new ApiError("Arsipkan room dulu sebelum menghapusnya.", 409);
  saveWorld({
    ...w,
    rooms: w.rooms.filter((r) => r.id !== roomId),
    courses: w.courses.filter((c) => c.roomId !== roomId),
    memberships: w.memberships.filter((m) => m.roomId !== roomId),
  });
}
