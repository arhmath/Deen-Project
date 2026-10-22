/**
 * Mock REST server (in-browser) — meniru bentuk API backend di SRS supaya
 * seluruh UI bisa dibangun & didemokan sebelum backend siap.
 * Semua perhitungan (level, streak, reward, rank, progress) dilakukan DI SINI
 * (sisi "server"), bukan di komponen React — sesuai BR-007/008/009/010.
 */
import { ApiError } from "../api";
import { dayKey } from "../../utils/format";
import type { Role, SessionUser, LoginResponse } from "../../types/user";
import type { RegisterRequest } from "../../types/auth";
import type {
  CheckInResult,
  GamificationSummary,
  LevelProgress,
  RewardEntry,
  RewardSource,
  WeekDay,
} from "../../types/gamification";
import type { SantriDashboard } from "../../types/dashboard";
import type { CourseSummary } from "../../types/learning";
import type { LeaderboardEntry, LeaderboardPage, RoomSummary } from "../../types/leaderboard";
import type {
  AdminOverview,
  StudentDetail,
  StudentListPage,
  StudentProgress,
} from "../../types/monitoring";
import type {
  ContentDetail,
  CourseDetail,
  QuizAttempt,
  QuizResult,
  RewardOutcome,
} from "../../types/content";
import type { ContentType } from "../../types/learning";
import type { Adventure } from "../../types/adventure";
import type { QuizScore } from "../../types/monitoring";
import { SEED_COMPLETED, SEED_QUIZ_SCORES } from "./content";
import {
  activeRoomIds,
  courseContentsOf,
  createCourse,
  createRoom,
  findContentIn,
  getWorld,
  joinRoom,
  linkChild,
  linkCodeFor,
  linkedChildIds,
  ownedRoomOrThrow,
  removeMember,
  resetWorld,
  roomById,
  saveCourse,
  updateRoom,
  visibleCourses,
  type CourseRec,
  type RoomRec,
  type World,
} from "./world";
import type { CourseAdminSummary, CourseDoc, QuestionDoc } from "../../types/courseAdmin";
import type { RoomAdminSummary, RoomDetail } from "../../types/room";
import {
  DEMO_PASSWORD,
  LEVELS,
  REWARD_CONFIG,
  ROSTER,
  USERS,
  WEEK_LABELS,
} from "./data";

/* ------------------------------------------------------------------ */
/* State persisten (localStorage) — meniru tabel ledger & check-in      */
/* ------------------------------------------------------------------ */

const STATE_KEY = "deen.mock.v2";
const AHMAD_ID = "s-ahmad";

interface StoredQuizScore {
  contentId: string;
  /** skor terbaik */
  score: number;
  /** waktu percobaan terakhir */
  takenAt: string;
}

interface MockState {
  checkIns: string[];
  ledger: RewardEntry[];
  /** id content yang sudah selesai (unik per santri/content — SRS §9) */
  completed: string[];
  quizScores: StoredQuizScore[];
}

function daysAgoAt(daysAgo: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d;
}

function seedState(): MockState {
  const mk = (
    n: number,
    source: RewardSource,
    label: string,
    xp: number,
    when: Date
  ): RewardEntry => ({
    id: `seed-${n}`,
    source,
    label,
    xp,
    point: xp,
    createdAt: when.toISOString(),
  });
  // Total XP = 240 → tinggal 10 XP lagi menuju Level 3 (check-in hari ini = level up).
  const ledger: RewardEntry[] = [
    mk(1, "DAILY_CHECKIN", "Daily check-in", 10, daysAgoAt(3, 7)),
    mk(2, "COURSE", "Menyelesaikan course Mengenal Huruf Hijaiyah", 100, daysAgoAt(3, 16)),
    mk(3, "QUIZ", "Kuis: Huruf Hijaiyah 1", 20, daysAgoAt(4, 15)),
    mk(4, "QUIZ", "Kuis: Huruf Hijaiyah 2", 20, daysAgoAt(3, 18)),
    mk(5, "PERFECT_QUIZ", "Kuis sempurna: Huruf Hijaiyah 3", 30, daysAgoAt(2, 17)),
    mk(6, "DAILY_CHECKIN", "Daily check-in", 10, daysAgoAt(2, 7)),
    mk(7, "LESSON", "Pelajaran: Kisah Nabi Adam", 5, daysAgoAt(2, 16)),
    mk(8, "LESSON", "Pelajaran: Kisah Nabi Idris", 5, daysAgoAt(1, 15)),
    mk(9, "QUIZ", "Kuis: Kisah Nabi Adam", 20, daysAgoAt(1, 16)),
    mk(10, "DAILY_CHECKIN", "Daily check-in", 10, daysAgoAt(1, 7)),
    mk(11, "LESSON", "Pelajaran: Kisah Nabi Nuh", 5, daysAgoAt(0, 6)),
    mk(12, "LESSON", "Pelajaran: Kisah Nabi Hud", 5, daysAgoAt(0, 6)),
  ];
  const sum = ledger.reduce((a, r) => a + r.xp, 0);
  void sum; // 240
  return {
    checkIns: [dayKey(daysAgoAt(1, 7)), dayKey(daysAgoAt(2, 7)), dayKey(daysAgoAt(3, 7))],
    ledger,
    completed: [...SEED_COMPLETED],
    quizScores: SEED_QUIZ_SCORES.map((q) => ({
      contentId: q.contentId,
      score: q.score,
      takenAt: daysAgoAt(q.daysAgo, 16).toISOString(),
    })),
  };
}

/** Santri yang sedang membuat request (diset di route() setelah autentikasi). */
const ctx = { studentId: AHMAD_ID };
const states = new Map<string, MockState>();

const stateKeyFor = (id: string) => (id === AHMAD_ID ? STATE_KEY : `deen.mock.s.${id}.v1`);
const emptyState = (): MockState => ({ checkIns: [], ledger: [], completed: [], quizScores: [] });
/** Santri hasil register punya id berawalan "s-u-" dan mulai dari state kosong. */
const isRegisteredStudent = (id: string) => id.startsWith("s-u-");
const hasOwnState = (id: string) => id === AHMAD_ID || isRegisteredStudent(id);

function saveStateFor(id: string, s: MockState) {
  states.set(id, s);
  try {
    localStorage.setItem(stateKeyFor(id), JSON.stringify(s));
  } catch {
    /* noop */
  }
}

function stateFor(id: string): MockState {
  const cached = states.get(id);
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(stateKeyFor(id));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MockState>;
      if (Array.isArray(parsed.completed) && Array.isArray(parsed.quizScores)) {
        states.set(id, parsed as MockState);
        return parsed as MockState;
      }
    }
  } catch {
    /* fallthrough ke seed */
  }
  const fresh = id === AHMAD_ID ? seedState() : emptyState();
  saveStateFor(id, fresh);
  return fresh;
}

const loadState = () => stateFor(ctx.studentId);
const saveState = (s: MockState) => saveStateFor(ctx.studentId, s);

/** Dipakai tombol "Reset data demo": menghapus PROGRES semua santri. Akun hasil register tetap ada. */
export function resetMockState() {
  resetWorld();
  states.clear();
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k === STATE_KEY || k.startsWith("deen.mock.s."))) localStorage.removeItem(k);
    }
  } catch {
    /* noop */
  }
}

/* ------------------------------------------------------------------ */
/* Akun hasil register (disimpan di localStorage — HANYA untuk mock)    */
/* ------------------------------------------------------------------ */

interface RegisteredUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  /** MOCK ONLY. Backend asli wajib menyimpan hash, bukan password asli (FR-AUTH-3). */
  password: string;
  role: "SANTRI" | "PARENT";
  createdAt: string;
}

const USERS_KEY = "deen.mock.users.v1";

function loadRegistered(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUser[]) : [];
  } catch {
    return [];
  }
}

function saveRegistered(list: RegisteredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

interface Account {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: Role;
  studentId?: string;
  children?: string[];
}

function allAccounts(): Account[] {
  const demo: Account[] = USERS.map((u) => ({ ...u }));
  const registered: Account[] = loadRegistered().map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    studentId: u.role === "SANTRI" ? `s-${u.id}` : undefined,
  }));
  return [...demo, ...registered];
}

/* ------------------------------------------------------------------ */
/* Perhitungan gamifikasi                                              */
/* ------------------------------------------------------------------ */

function levelFor(xp: number): LevelProgress {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i;
  });
  const cur = LEVELS[idx]!;
  const next = LEVELS[idx + 1] ?? null;
  const xpIntoLevel = xp - cur.min;
  return {
    level: cur.level,
    name: cur.name,
    levelMinXp: cur.min,
    nextLevelXp: next?.min ?? null,
    xpIntoLevel,
    xpToNext: next ? next.min - xp : null,
    percent: next ? Math.min(100, Math.round((xpIntoLevel / (next.min - cur.min)) * 100)) : 100,
  };
}

function currentStreak(checkIns: string[]): number {
  const set = new Set(checkIns);
  const cursor = new Date();
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (set.has(dayKey(cursor))) {
    n++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

function longestStreak(checkIns: string[]): number {
  const days = [...new Set(checkIns)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const d = new Date(`${k}T00:00:00`);
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

function weekStrip(checkIns: string[]): WeekDay[] {
  const set = new Set(checkIns);
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const todayKey = dayKey(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dayKey(d);
    return {
      date: key,
      label: WEEK_LABELS[d.getDay()]!,
      checked: set.has(key),
      isToday: key === todayKey,
      isFuture: key > todayKey,
    };
  });
}

function totals(s: MockState) {
  return {
    xp: s.ledger.reduce((a, r) => a + r.xp, 0),
    point: s.ledger.reduce((a, r) => a + r.point, 0),
  };
}

function gamificationOf(s: MockState): GamificationSummary {
  const t = totals(s);
  return {
    xp: t.xp,
    point: t.point,
    level: levelFor(t.xp),
    streak: currentStreak(s.checkIns),
    longestStreak: longestStreak(s.checkIns),
    checkedInToday: s.checkIns.includes(dayKey()),
    week: weekStrip(s.checkIns),
  };
}

/* ------------------------------------------------------------------ */
/* Data santri / course                                                */
/* ------------------------------------------------------------------ */

const iso = (daysAgo: number) => daysAgoAt(daysAgo, 12).toISOString();

const NO_ROOM = "Belum bergabung room";

/** Nama room pertama yang aktif untuk santri (untuk ditampilkan di tabel/kartu). */
function roomNameOf(studentId: string): string {
  const w = getWorld();
  const first = activeRoomIds(w, studentId)[0];
  return (first && roomById(w, first)?.name) || NO_ROOM;
}

/** Persentase materi (dari course yang terlihat oleh santri) yang sudah selesai. */
function progressPct(studentId: string, completed: string[]): number {
  const ids = visibleCourses(getWorld(), studentId).flatMap((c) => courseContentsOf(c).map((x) => x.id));
  if (ids.length === 0) return 0;
  return Math.round((ids.filter((id) => completed.includes(id)).length / ids.length) * 100);
}

function ownProgress(
  id: string,
  name: string,
  username: string,
  st: MockState,
  joinedAt: string
): StudentProgress {
  const t = totals(st);
  const lv = levelFor(t.xp);
  const lastActive = st.ledger.length
    ? st.ledger.reduce((a, r) => (r.createdAt > a ? r.createdAt : a), st.ledger[0]!.createdAt)
    : joinedAt;
  return {
    id,
    name,
    username,
    roomName: roomNameOf(id),
    level: lv.level,
    levelName: lv.name,
    xp: t.xp,
    point: t.point,
    streak: currentStreak(st.checkIns),
    courseProgress: progressPct(id, st.completed),
    avgScore: st.quizScores.length
      ? Math.round(st.quizScores.reduce((a, q) => a + q.score, 0) / st.quizScores.length)
      : 0,
    lastActiveAt: lastActive,
    checkedInToday: st.checkIns.includes(dayKey()),
  };
}

function allStudents(): StudentProgress[] {
  const ahmad = ownProgress(AHMAD_ID, "Ahmad Fauzi", "ahmad_santri", stateFor(AHMAD_ID), iso(0));
  const others = ROSTER.map<StudentProgress>((r) => {
    const lv = levelFor(r.xp);
    return {
      id: r.id,
      name: r.name,
      username: r.username,
      roomName: roomNameOf(r.id),
      level: lv.level,
      levelName: lv.name,
      xp: r.xp,
      point: r.xp,
      streak: r.streak,
      courseProgress: r.courseProgress,
      avgScore: r.avgScore,
      lastActiveAt: iso(r.lastActiveDaysAgo),
      checkedInToday: r.checkedInToday,
    };
  });
  const registered = loadRegistered()
    .filter((u) => u.role === "SANTRI")
    .map((u) => ownProgress(`s-${u.id}`, u.name, u.username, stateFor(`s-${u.id}`), u.createdAt));
  return [ahmad, ...others, ...registered];
}

const ownStudent = () => allStudents().find((x) => x.id === ctx.studentId)!;

/** Santri yang menjadi anggota room (aktif) milik guru — dasar monitoring (BR-004). */
function studentsOfOwner(ownerId: string, onlyRoomId?: string): StudentProgress[] {
  const w = getWorld();
  const rooms = w.rooms.filter((r) => r.ownerId === ownerId && !r.archived && (!onlyRoomId || r.id === onlyRoomId));
  const roomIds = new Set(rooms.map((r) => r.id));
  const ids = new Set(w.memberships.filter((m) => roomIds.has(m.roomId)).map((m) => m.studentId));
  return allStudents().filter((s) => ids.has(s.id));
}

const rewardXpFor = (type: ContentType) =>
  type === "QUIZ" ? REWARD_CONFIG.QUIZ.xp : type === "CHALLENGE" ? REWARD_CONFIG.CHALLENGE.xp : REWARD_CONFIG.LESSON.xp;

function coursesFor(student: StudentProgress): CourseSummary[] {
  const w = getWorld();
  const stateful = hasOwnState(student.id);
  const completed = stateful ? stateFor(student.id).completed : [];
  const visible = visibleCourses(w, student.id);
  const totalAll = visible.reduce((a, c) => a + courseContentsOf(c).length, 0);
  // Santri dummy (tanpa akun) memakai persentase tetap yang disebar berurutan.
  let remaining = Math.round((student.courseProgress / 100) * totalAll);
  return visible.map((c) => {
    const list = courseContentsOf(c);
    let done: number;
    let next = list.find((x) => !completed.includes(x.id));
    if (stateful) done = list.filter((x) => completed.includes(x.id)).length;
    else {
      done = Math.min(list.length, remaining);
      remaining -= done;
      next = list[done];
    }
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      roomName: roomById(w, c.roomId)?.name ?? "-",
      status: c.status,
      totalContents: list.length,
      completedContents: done,
      progressPercent: list.length ? Math.round((done / list.length) * 100) : 0,
      nextContent:
        done >= list.length || !next
          ? null
          : { id: next.id, title: next.title, type: next.type, rewardXp: rewardXpFor(next.type) },
    };
  });
}

function quizScoresFor(st: StudentProgress): QuizScore[] {
  const title = (id: string) => findContentIn(getWorld(), id)?.content.title ?? id;
  if (hasOwnState(st.id)) {
    return [...stateFor(st.id).quizScores]
      .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))
      .slice(0, 4)
      .map((q) => ({ id: q.contentId, title: title(q.contentId), score: q.score, takenAt: q.takenAt }));
  }
  const ids = ["c1-4", "c1-8", "c1-10", "c2-2"];
  return ids.map((id, i) => ({
    id,
    title: title(id),
    score: Math.max(40, Math.min(100, st.avgScore + [5, 10, -5, 0][i]!)),
    takenAt: iso([6, 5, 4, 2][i]!),
  }));
}

function rewardsFor(student: StudentProgress, limit = 6): RewardEntry[] {
  if (hasOwnState(student.id)) {
    return [...stateFor(student.id).ledger]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  }
  const mk = (n: number, source: RewardSource, label: string, xp: number, d: number): RewardEntry => ({
    id: `${student.id}-r${n}`,
    source,
    label,
    xp,
    point: xp,
    createdAt: iso(d),
  });
  return [
    mk(1, "QUIZ", "Kuis: Kisah Nabi Adam", 20, student.checkedInToday ? 0 : 1),
    mk(2, "LESSON", "Pelajaran: Kisah Nabi Nuh", 5, 1),
    mk(3, "DAILY_CHECKIN", "Daily check-in", 10, 2),
  ].slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Router mock                                                         */
/* ------------------------------------------------------------------ */

interface MockReq {
  method: string;
  path: string;
  params: Record<string, string>;
  body: unknown;
  token: string | null;
  headers?: Record<string, string>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toSession(u: Account): SessionUser {
  return { id: u.id, name: u.name, username: u.username, email: u.email, role: u.role };
}

function authUser(token: string | null): Account {
  const u = token?.startsWith("mock.") ? allAccounts().find((x) => x.id === token.slice(5)) : undefined;
  if (!u) throw new ApiError("Sesi berakhir. Silakan masuk lagi.", 401);
  return u;
}

function requireRole(u: { role: Role }, ...roles: Role[]) {
  if (!roles.includes(u.role)) throw new ApiError("Kamu tidak punya akses ke halaman ini.", 403);
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { slice: items.slice(start, start + pageSize), total: items.length };
}

function leaderboard(
  req: MockReq,
  user: Account
): LeaderboardPage {
  const page = Math.max(1, Number(req.params.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.params.pageSize ?? 10)));
  const roomId = req.params.roomId;

  let pool = allStudents();
  if (roomId) pool = pool.filter((s) => activeRoomIds(getWorld(), s.id).includes(roomId));
  pool.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));

  const myId = user.role === "SANTRI" ? ctx.studentId : null;
  const ranked: LeaderboardEntry[] = pool.map((s, i) => ({
    rank: i + 1,
    studentId: s.id,
    name: s.name,
    level: s.level,
    xp: s.xp,
    isMe: s.id === myId,
  }));
  const { slice, total } = paginate(ranked, page, pageSize);
  return {
    entries: slice,
    page,
    pageSize,
    total,
    me: ranked.find((e) => e.isMe) ?? null,
  };
}

function needsAttention(s: StudentProgress): boolean {
  const days = (Date.now() - new Date(s.lastActiveAt).getTime()) / 86_400_000;
  return days >= 3;
}


/* ------------------------------------------------------------------ */
/* Konten, kuis, dan reward belajar                                    */
/* ------------------------------------------------------------------ */

interface Grant {
  id: string;
  source: RewardSource;
  label: string;
  xp: number;
  point: number;
}

/** Terapkan reward ke ledger secara idempotent (id ledger unik → tidak pernah dobel). */
function applyGrants(
  state: MockState,
  patch: Partial<Pick<MockState, "completed" | "quizScores">>,
  grants: Grant[],
  courseCompleted: boolean
): RewardOutcome {
  const before = levelFor(totals(state).xp);
  const now = new Date().toISOString();
  const fresh = grants.filter((g) => !state.ledger.some((r) => r.id === g.id));
  const next: MockState = {
    ...state,
    ...patch,
    ledger: [
      ...state.ledger,
      ...fresh.map<RewardEntry>((g) => ({
        id: g.id,
        source: g.source,
        label: g.label,
        xp: g.xp,
        point: g.point,
        createdAt: now,
      })),
    ],
  };
  saveState(next);
  const after = levelFor(totals(next).xp);
  return {
    alreadyRewarded: fresh.length === 0,
    grants: fresh.map((g) => ({ label: g.label, xp: g.xp, point: g.point })),
    totalXp: fresh.reduce((a, g) => a + g.xp, 0),
    totalPoint: fresh.reduce((a, g) => a + g.point, 0),
    levelUp: after.level > before.level ? { from: before.level, to: after.level, name: after.name } : null,
    courseCompleted: courseCompleted && fresh.some((g) => g.source === "COURSE"),
    gamification: gamificationOf(next),
  };
}

function courseGrant(courseId: string, title: string): Grant {
  return {
    id: `course-${courseId}`,
    source: "COURSE",
    label: `Menyelesaikan course ${title}`,
    ...REWARD_CONFIG.COURSE,
  };
}

interface AttemptRecord {
  contentId: string;
  /** snapshot soal saat attempt dimulai — edit guru di tengah kuis tidak merusak attempt */
  questions: QuestionDoc[];
  result?: QuizResult;
}
const attempts = new Map<string, AttemptRecord>();
let attemptSeq = 0;

const NOT_AVAILABLE =
  "Materi ini belum tersedia untukmu. Pastikan kamu sudah bergabung di room-nya dan course sudah dipublikasikan.";

/** BR-005 & BR-013: hanya course PUBLISHED dari room aktif yang diikuti. */
function requireVisibleCourse(courseId: string): CourseRec {
  const w = getWorld();
  const course = w.courses.find((c) => c.id === courseId);
  if (!course) throw new ApiError("Course tidak ditemukan.", 404);
  if (!visibleCourses(w, ctx.studentId).some((c) => c.id === courseId)) throw new ApiError(NOT_AVAILABLE, 403);
  return course;
}

function requireContent(contentId: string) {
  const w = getWorld();
  const found = findContentIn(w, contentId);
  if (!found) throw new ApiError("Materi tidak ditemukan.", 404);
  requireVisibleCourse(found.course.id);
  return found;
}

function contentDetail(contentId: string): ContentDetail {
  const { course, content, index, list } = requireContent(contentId);
  const state = loadState();
  const detail: ContentDetail = {
    id: content.id,
    courseId: course.id,
    courseTitle: course.title,
    title: content.title,
    type: content.type,
    rewardXp: rewardXpFor(content.type),
    completed: state.completed.includes(content.id),
    position: { index: index + 1, total: list.length },
    prevId: list[index - 1]?.id ?? null,
    nextId: list[index + 1]?.id ?? null,
  };
  if (content.type === "LESSON") detail.lesson = { sections: content.sections };
  if (content.type === "FLASHCARD") {
    detail.flashcards = content.cards.map((c) => ({ id: c.id, front: c.front, back: c.back }));
  }
  if (content.type === "QUIZ") {
    detail.quiz = {
      questionCount: content.questions.length,
      bestScore: state.quizScores.find((q) => q.contentId === content.id)?.score ?? null,
    };
  }
  return detail;
}

function courseDetail(courseId: string): CourseDetail {
  const course = requireVisibleCourse(courseId);
  const state = loadState();
  const list = courseContentsOf(course);
  const done = list.filter((c) => state.completed.includes(c.id)).length;
  const nextId = list.find((c) => !state.completed.includes(c.id))?.id;
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    roomName: roomById(getWorld(), course.roomId)?.name ?? "-",
    status: course.status,
    progressPercent: list.length ? Math.round((done / list.length) * 100) : 0,
    completedContents: done,
    totalContents: list.length,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      contents: m.contents.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        rewardXp: rewardXpFor(c.type),
        completed: state.completed.includes(c.id),
        isNext: c.id === nextId,
      })),
    })),
  };
}

function completeContent(contentId: string): RewardOutcome {
  const { course, content, list } = requireContent(contentId);
  if (content.type === "QUIZ") {
    throw new ApiError("Kuis diselesaikan lewat pengiriman jawaban.", 400);
  }
  const state = loadState();
  if (state.completed.includes(content.id)) {
    return applyGrants(state, {}, [], false); // retry/ulang → tanpa reward baru
  }
  const completed = [...state.completed, content.id];
  const grants: Grant[] = [
    {
      id: `content-${content.id}`,
      source: "LESSON",
      label: `${content.type === "FLASHCARD" ? "Kartu belajar" : "Pelajaran"}: ${content.title}`,
      ...REWARD_CONFIG.LESSON,
    },
  ];
  const courseDone = list.every((c) => completed.includes(c.id));
  if (courseDone) grants.push(courseGrant(course.id, course.title));
  return applyGrants(state, { completed }, grants, courseDone);
}

function startAttempt(contentId: string): QuizAttempt {
  const { content } = requireContent(contentId);
  if (content.type !== "QUIZ") throw new ApiError("Materi ini bukan kuis.", 400);
  if (content.questions.length === 0) throw new ApiError("Kuis ini belum punya soal.", 422);
  const qs = content.questions.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) }));
  const attemptId = `att-${++attemptSeq}-${Date.now()}`;
  attempts.set(attemptId, { contentId: content.id, questions: qs });
  return {
    attemptId,
    contentId: content.id,
    // kunci jawaban & penjelasan sengaja TIDAK dikirim (BR-009)
    questions: qs.map((q) => ({ id: q.id, text: q.text, options: q.options })),
  };
}

function submitAttempt(attemptId: string, answers: Record<string, string>): QuizResult {
  const att = attempts.get(attemptId);
  if (!att) throw new ApiError("Percobaan kuis tidak ditemukan. Mulai kuisnya lagi ya.", 404);
  if (att.result) return att.result; // submit ulang → hasil yang sama, tanpa reward baru

  const { course, content, list } = requireContent(att.contentId);
  const questions = att.questions.map((q) => {
    const selected = answers[q.id] ?? null;
    return {
      questionId: q.id,
      text: q.text,
      options: q.options,
      selectedOptionId: selected,
      correctOptionId: q.correctOptionId,
      isCorrect: selected === q.correctOptionId,
      explanation: q.explanation,
    };
  });
  const correct = questions.filter((q) => q.isCorrect).length;
  const total = questions.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const perfect = total > 0 && correct === total;

  const state = loadState();
  const prev = state.quizScores.find((q) => q.contentId === content.id);
  const bestScore = Math.max(prev?.score ?? 0, score);
  const quizScores = [
    ...state.quizScores.filter((q) => q.contentId !== content.id),
    { contentId: content.id, score: bestScore, takenAt: new Date().toISOString() },
  ];

  let outcome: RewardOutcome;
  if (state.completed.includes(content.id)) {
    // Sudah pernah selesai: skor terbaik diperbarui, reward tidak diberikan lagi (BR-010)
    outcome = applyGrants(state, { quizScores }, [], false);
  } else {
    const completed = [...state.completed, content.id];
    const cfg = perfect ? REWARD_CONFIG.PERFECT_QUIZ : REWARD_CONFIG.QUIZ;
    const grants: Grant[] = [
      {
        id: `content-${content.id}`,
        source: perfect ? "PERFECT_QUIZ" : "QUIZ",
        label: `${perfect ? "Kuis sempurna" : "Kuis"}: ${content.title}`,
        ...cfg,
      },
    ];
    const courseDone = list.every((c) => completed.includes(c.id));
    if (courseDone) grants.push(courseGrant(course.id, course.title));
    outcome = applyGrants(state, { completed, quizScores }, grants, courseDone);
  }

  const result: QuizResult = { attemptId, score, correct, total, perfect, bestScore, questions, outcome };
  att.result = result;
  return result;
}

/* ------------------------------------------------------------------ */
/* Ringkasan untuk halaman guru                                        */
/* ------------------------------------------------------------------ */

function roomSummaryFor(w: World, r: RoomRec): RoomAdminSummary {
  return {
    id: r.id,
    name: r.name,
    joinCode: r.joinCode,
    memberCount: w.memberships.filter((m) => m.roomId === r.id).length,
    courseCount: w.courses.filter((c) => c.roomId === r.id).length,
    archived: r.archived,
    createdAt: r.createdAt,
  };
}

function courseSummaryFor(w: World, c: CourseRec): CourseAdminSummary {
  return {
    id: c.id,
    title: c.title,
    roomId: c.roomId,
    roomName: roomById(w, c.roomId)?.name ?? "-",
    status: c.status,
    moduleCount: c.modules.length,
    contentCount: courseContentsOf(c).length,
  };
}

const courseDocFor = (w: World, c: CourseRec): CourseDoc => ({ ...c, roomName: roomById(w, c.roomId)?.name ?? "-" });

async function route<T>(req: MockReq): Promise<T> {
  const { method, path } = req;

  /* ---- auth ---- */
  if (method === "POST" && path === "/auth/register") {
    const b = (req.body ?? {}) as Partial<RegisterRequest>;
    const name = (b.name ?? "").trim();
    const username = (b.username ?? "").trim();
    const email = (b.email ?? "").trim();
    const password = b.password ?? "";
    const fieldErrors: Record<string, string> = {};
    // Validasi server-side (client juga memvalidasi, tapi server tidak boleh percaya klien)
    if (name.length < 2 || name.length > 100) fieldErrors.name = "Nama harus 2–100 karakter.";
    if (!/^[a-zA-Z0-9_.]{3,50}$/.test(username)) fieldErrors.username = "Username 3–50 karakter: huruf, angka, titik, underscore.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Format email tidak valid.";
    if (password.length < 8 || password.length > 128) fieldErrors.password = "Password harus 8–128 karakter.";
    if (b.role !== "SANTRI" && b.role !== "PARENT") fieldErrors.role = "Peran tidak diizinkan untuk pendaftaran.";
    if (Object.keys(fieldErrors).length) throw new ApiError("Data pendaftaran belum valid.", 422, fieldErrors);

    // BR-001: username/email unik (tidak peka huruf besar-kecil)
    const accounts = allAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
      throw new ApiError("Username sudah dipakai.", 409, { username: "Username sudah dipakai, coba yang lain." });
    }
    if (email && accounts.some((a) => a.email?.toLowerCase() === email.toLowerCase())) {
      throw new ApiError("Email sudah terdaftar.", 409, { email: "Email ini sudah terdaftar. Coba masuk saja." });
    }

    const created: RegisteredUser = {
      id: `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name,
      username,
      email: email || undefined,
      password,
      role: b.role,
      createdAt: new Date().toISOString(),
    };
    saveRegistered([...loadRegistered(), created]);
    const acct = allAccounts().find((a) => a.id === created.id)!;
    return { user: toSession(acct) } as T;
  }

  if (method === "POST" && path === "/auth/login") {
    const { identifier, password } = (req.body ?? {}) as { identifier?: string; password?: string };
    const id = (identifier ?? "").trim().toLowerCase();
    const u = allAccounts().find((x) => x.username.toLowerCase() === id || x.email?.toLowerCase() === id);
    const registered = u ? loadRegistered().find((r) => r.id === u.id) : undefined;
    const passwordOk = registered ? registered.password === password : password === DEMO_PASSWORD;
    if (!u || !passwordOk) {
      throw new ApiError("Username/email atau password salah.", 401);
    }
    const res: LoginResponse = { accessToken: `mock.${u.id}`, user: toSession(u) };
    return res as T;
  }
  if (method === "POST" && path === "/auth/logout") return undefined as T;

  const user = authUser(req.token);
  ctx.studentId = user.role === "SANTRI" ? (user.studentId ?? AHMAD_ID) : AHMAD_ID;
  const state = loadState();

  if (method === "GET" && path === "/auth/me") return toSession(user) as T;

  /* ---- santri ---- */
  if (method === "GET" && path === "/me/dashboard") {
    requireRole(user, "SANTRI");
    const me = ownStudent();
    const courses = coursesFor(me);
    const lb = leaderboard({ ...req, params: { pageSize: "50" } }, user);
    const res: SantriDashboard = {
      roomCount: activeRoomIds(getWorld(), ctx.studentId).length,
      gamification: gamificationOf(state),
      rank: { position: lb.me?.rank ?? 0, total: lb.total },
      recentRewards: rewardsFor(me, 5),
      continueLearning: courses.find((c) => c.progressPercent < 100 && c.progressPercent > 0) ?? courses.find((c) => c.progressPercent < 100) ?? null,
      stats: {
        coursesCompleted: courses.filter((c) => c.progressPercent === 100).length,
        quizzesDone: state.quizScores.length,
        avgScore: me.avgScore,
      },
    };
    return res as T;
  }

  if (method === "POST" && path === "/me/check-ins") {
    requireRole(user, "SANTRI");
    const today = dayKey();
    const before = levelFor(totals(state).xp);
    // BR-006/BR-010: satu check-in per tanggal; retry tidak menambah reward.
    if (state.checkIns.includes(today)) {
      const res: CheckInResult = {
        alreadyCheckedIn: true,
        reward: { xp: 0, point: 0 },
        gamification: gamificationOf(state),
        levelUp: null,
      };
      return res as T;
    }
    const { xp, point } = REWARD_CONFIG.DAILY_CHECKIN;
    const next: MockState = {
      ...state,
      checkIns: [...state.checkIns, today],
      ledger: [
        ...state.ledger,
        {
          id: `ci-${today}`,
          source: "DAILY_CHECKIN",
          label: "Daily check-in",
          xp,
          point,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    saveState(next);
    const after = levelFor(totals(next).xp);
    const res: CheckInResult = {
      alreadyCheckedIn: false,
      reward: { xp, point },
      gamification: gamificationOf(next),
      levelUp: after.level > before.level ? { from: before.level, to: after.level, name: after.name } : null,
    };
    return res as T;
  }

  if (method === "GET" && path === "/me/adventure") {
    requireRole(user, "SANTRI");
    const w = getWorld();
    const regions = visibleCourses(w, ctx.studentId).map((course) => {
      const list = courseContentsOf(course);
      const done = list.filter((c) => state.completed.includes(c.id)).length;
      const nextId = list.find((c) => !state.completed.includes(c.id))?.id;
      const moduleOf = new Map(course.modules.flatMap((m) => m.contents.map((c) => [c.id, m.title] as const)));
      return {
        courseId: course.id,
        title: course.title,
        description: course.description,
        roomName: roomById(w, course.roomId)?.name ?? "-",
        totalContents: list.length,
        completedContents: done,
        progressPercent: list.length ? Math.round((done / list.length) * 100) : 0,
        completed: list.length > 0 && done === list.length,
        courseRewardXp: REWARD_CONFIG.COURSE.xp,
        nodes: list.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          moduleTitle: moduleOf.get(c.id) ?? "",
          rewardXp: rewardXpFor(c.type),
          completed: state.completed.includes(c.id),
          isNext: c.id === nextId,
        })),
      };
    });
    const res: Adventure = { regions };
    return res as T;
  }

  if (method === "GET" && path === "/me/courses") {
    requireRole(user, "SANTRI");
    return coursesFor(ownStudent()) as T;
  }

  const courseM = path.match(/^\/me\/courses\/([^/]+)$/);
  const contentM = path.match(/^\/me\/contents\/([^/]+)$/);
  const completeM = path.match(/^\/me\/contents\/([^/]+)\/complete$/);
  const attemptM = path.match(/^\/me\/quizzes\/([^/]+)\/attempts$/);
  const submitM = path.match(/^\/me\/quiz-attempts\/([^/]+)\/submit$/);
  if (courseM || contentM || completeM || attemptM || submitM) requireRole(user, "SANTRI");
  if (method === "GET" && courseM) return courseDetail(courseM[1]!) as T;
  if (method === "GET" && contentM) return contentDetail(contentM[1]!) as T;
  if (method === "POST" && completeM) return completeContent(completeM[1]!) as T;
  if (method === "POST" && attemptM) return startAttempt(attemptM[1]!) as T;
  if (method === "POST" && submitM) {
    const { answers } = (req.body ?? {}) as { answers?: Record<string, string> };
    return submitAttempt(submitM[1]!, answers ?? {}) as T;
  }

  /* ---- santri: gabung room & kode untuk orang tua ---- */
  if (method === "POST" && path === "/me/rooms/join") {
    requireRole(user, "SANTRI");
    const { code } = (req.body ?? {}) as { code?: string };
    const room = joinRoom(getWorld(), ctx.studentId, code);
    const w2 = getWorld();
    const res: RoomSummary = { id: room.id, name: room.name, memberCount: w2.memberships.filter((m) => m.roomId === room.id).length };
    return res as T;
  }

  if (method === "GET" && path === "/me/link-code") {
    requireRole(user, "SANTRI");
    return { code: linkCodeFor(getWorld(), ctx.studentId) } as T;
  }

  /* ---- rooms & leaderboard ---- */
  if (method === "GET" && path === "/rooms") {
    const w = getWorld();
    let visible: RoomRec[] = [];
    if (user.role === "SANTRI") {
      const ids = activeRoomIds(w, ctx.studentId);
      visible = w.rooms.filter((r) => ids.includes(r.id));
    } else if (user.role === "ADMIN") {
      visible = w.rooms.filter((r) => r.ownerId === user.id && !r.archived);
    }
    const res: RoomSummary[] = visible.map((r) => ({
      id: r.id,
      name: r.name,
      memberCount: w.memberships.filter((m) => m.roomId === r.id).length,
    }));
    return res as T;
  }

  if (method === "GET" && path === "/leaderboard") {
    const rid = req.params.roomId;
    if (rid) {
      const w = getWorld();
      const allowed =
        user.role === "SANTRI"
          ? activeRoomIds(w, ctx.studentId).includes(rid)
          : user.role === "ADMIN"
            ? w.rooms.some((r) => r.id === rid && r.ownerId === user.id)
            : false;
      if (!allowed) throw new ApiError("Kamu bukan anggota room ini.", 403);
    }
    return leaderboard(req, user) as T;
  }

  /* ---- guru ---- */
  if (path.startsWith("/admin/")) requireRole(user, "ADMIN");

  if (method === "GET" && path === "/admin/overview") {
    const all = studentsOfOwner(user.id);
    const count = Math.max(1, all.length);
    const activeToday = all.filter((s) => dayKey(new Date(s.lastActiveAt)) === dayKey()).length;
    const checkInsToday = all.filter((s) => s.checkedInToday).length;
    const past = [11, 14, 12, 16, 15, 13];
    const activity = past.map((n, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: dayKey(d),
        label: WEEK_LABELS[d.getDay()]!,
        activeStudents: n,
        checkIns: Math.max(0, n - 3 - (i % 3)),
      };
    });
    activity.push({ date: dayKey(), label: "Hari ini", activeStudents: activeToday, checkIns: checkInsToday });
    const res: AdminOverview = {
      totalStudents: all.length,
      totalRooms: getWorld().rooms.filter((r) => r.ownerId === user.id && !r.archived).length,
      activeToday,
      checkInsToday,
      avgCourseProgress: Math.round(all.reduce((a, s) => a + s.courseProgress, 0) / count),
      avgScore: Math.round(all.reduce((a, s) => a + s.avgScore, 0) / count),
      activity,
      needsAttention: all.filter(needsAttention).sort((a, b) => (a.lastActiveAt < b.lastActiveAt ? -1 : 1)).slice(0, 5),
    };
    return res as T;
  }

  if (method === "GET" && path === "/admin/students") {
    const page = Math.max(1, Number(req.params.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.params.pageSize ?? 8)));
    const q = (req.params.q ?? "").toLowerCase();
    const sort = req.params.sort ?? "xp";
    const w = getWorld();
    const ownedRooms = w.rooms.filter((r) => r.ownerId === user.id && !r.archived);
    const roomFilter = ownedRooms.find((r) => r.name === req.params.room);
    let list = studentsOfOwner(user.id, roomFilter?.id);
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.username.includes(q));
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") return b.courseProgress - a.courseProgress;
      if (sort === "streak") return b.streak - a.streak;
      if (sort === "lastActive") return a.lastActiveAt < b.lastActiveAt ? -1 : 1;
      return b.xp - a.xp;
    });
    const { slice, total } = paginate(list, page, pageSize);
    const res: StudentListPage = { items: slice, page, pageSize, total, rooms: ownedRooms.map((r) => r.name) };
    return res as T;
  }

  /* ---- guru: room ---- */
  if (method === "GET" && path === "/admin/rooms") {
    const w = getWorld();
    return w.rooms.filter((r) => r.ownerId === user.id).map((r) => roomSummaryFor(w, r)) as T;
  }
  if (method === "POST" && path === "/admin/rooms") {
    const { name } = (req.body ?? {}) as { name?: string };
    const room = createRoom(getWorld(), user.id, name);
    return roomSummaryFor(getWorld(), room) as T;
  }

  const roomM = path.match(/^\/admin\/rooms\/([^/]+)$/);
  if (roomM && method === "GET") {
    const w = getWorld();
    const room = ownedRoomOrThrow(w, user.id, roomM[1]!);
    const byId = new Map(allStudents().map((s) => [s.id, s]));
    const members = w.memberships
      .filter((m) => m.roomId === room.id)
      .map((m) => {
        const st = byId.get(m.studentId);
        return {
          studentId: m.studentId,
          name: st?.name ?? m.studentId,
          username: st?.username ?? "-",
          level: st?.level ?? 1,
          xp: st?.xp ?? 0,
          joinedAt: m.joinedAt,
          lastActiveAt: st?.lastActiveAt ?? m.joinedAt,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    const res: RoomDetail = {
      room: roomSummaryFor(w, room),
      members,
      courses: w.courses.filter((c) => c.roomId === room.id).map((c) => courseSummaryFor(w, c)),
    };
    return res as T;
  }
  if (roomM && method === "PATCH") {
    const room = updateRoom(getWorld(), user.id, roomM[1]!, (req.body ?? {}) as { name?: unknown; archived?: unknown });
    return roomSummaryFor(getWorld(), room) as T;
  }

  const memberM = path.match(/^\/admin\/rooms\/([^/]+)\/members\/([^/]+)$/);
  if (memberM && method === "DELETE") {
    removeMember(getWorld(), user.id, memberM[1]!, memberM[2]!);
    return undefined as T;
  }

  /* ---- guru: course ---- */
  if (method === "GET" && path === "/admin/courses") {
    const w = getWorld();
    const mine = new Set(w.rooms.filter((r) => r.ownerId === user.id).map((r) => r.id));
    return w.courses.filter((c) => mine.has(c.roomId)).map((c) => courseSummaryFor(w, c)) as T;
  }
  if (method === "POST" && path === "/admin/courses") {
    const course = createCourse(getWorld(), user.id, (req.body ?? {}) as { roomId?: unknown; title?: unknown; description?: unknown });
    return courseDocFor(getWorld(), course) as T;
  }

  const courseAdminM = path.match(/^\/admin\/courses\/([^/]+)$/);
  if (courseAdminM && method === "GET") {
    const w = getWorld();
    const course = w.courses.find((c) => c.id === courseAdminM[1]);
    if (!course) throw new ApiError("Course tidak ditemukan.", 404);
    ownedRoomOrThrow(w, user.id, course.roomId); // BR-004
    return courseDocFor(w, course) as T;
  }
  if (courseAdminM && method === "PUT") {
    const course = saveCourse(getWorld(), user.id, courseAdminM[1]!, (req.body ?? {}) as Partial<CourseDoc>);
    return courseDocFor(getWorld(), course) as T;
  }

  /* ---- orang tua ---- */
  if (method === "GET" && path === "/parent/students") {
    requireRole(user, "PARENT");
    const ids = linkedChildIds(getWorld(), user.id);
    return allStudents().filter((s) => ids.includes(s.id)) as T;
  }

  if (method === "POST" && path === "/parent/students") {
    requireRole(user, "PARENT");
    const { code } = (req.body ?? {}) as { code?: string };
    const studentId = linkChild(getWorld(), user.id, code);
    return allStudents().find((s) => s.id === studentId) as T;
  }

  const detail = path.match(/^\/parent\/students\/([^/]+)$/);
  if (method === "GET" && detail) {
    requireRole(user, "PARENT");
    const sid = detail[1]!;
    // BR-003: parent hanya boleh melihat anak yang terhubung.
    if (!linkedChildIds(getWorld(), user.id).includes(sid)) {
      throw new ApiError("Santri ini tidak terhubung dengan akunmu.", 403);
    }
    const st = allStudents().find((s) => s.id === sid);
    if (!st) throw new ApiError("Santri tidak ditemukan.", 404);
    const res: StudentDetail = {
      student: st,
      courses: coursesFor(st),
      recentRewards: rewardsFor(st, 6),
      quizScores: quizScoresFor(st),
    };
    return res as T;
  }

  throw new ApiError("Endpoint tidak ditemukan.", 404);
}

export async function mockRequest<T>(req: MockReq): Promise<T> {
  await sleep(350);
  return route<T>(req);
}
