/**
 * Mock REST server (in-browser) — meniru bentuk API backend di SRS supaya
 * seluruh UI bisa dibangun & didemokan sebelum backend siap.
 * Semua perhitungan (level, streak, reward, rank, progress) dilakukan DI SINI
 * (sisi "server"), bukan di komponen React — sesuai BR-007/008/009/010.
 */
import { ApiError } from "../api";
import { dayKey } from "../../utils/format";
import type { Role, SessionUser, LoginResponse } from "../../types/user";
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
import {
  COURSES,
  DEMO_PASSWORD,
  LEVELS,
  QUIZ_SCORES,
  REWARD_CONFIG,
  ROOMS,
  ROSTER,
  USERS,
  WEEK_LABELS,
} from "./data";

/* ------------------------------------------------------------------ */
/* State persisten (localStorage) — meniru tabel ledger & check-in      */
/* ------------------------------------------------------------------ */

const STATE_KEY = "deen.mock.v1";
const AHMAD_ID = "s-ahmad";
const AHMAD_ROOM = "r1";

interface MockState {
  checkIns: string[];
  ledger: RewardEntry[];
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
  };
}

let memoryState: MockState | null = null;

function loadState(): MockState {
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      memoryState = JSON.parse(raw) as MockState;
      return memoryState;
    }
  } catch {
    /* fallthrough ke seed */
  }
  memoryState = seedState();
  saveState(memoryState);
  return memoryState;
}

function saveState(s: MockState) {
  memoryState = s;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

/** Dipakai tombol "Reset data demo" di halaman Profil. */
export function resetMockState() {
  memoryState = null;
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    /* noop */
  }
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

const roomName = (id: string) => ROOMS.find((r) => r.id === id)?.name ?? "-";
const iso = (daysAgo: number) => daysAgoAt(daysAgo, 12).toISOString();

function allStudents(): StudentProgress[] {
  const s = loadState();
  const t = totals(s);
  const todayChecked = s.checkIns.includes(dayKey());
  const ahmadLastActive = s.ledger.length
    ? s.ledger.reduce((a, r) => (r.createdAt > a ? r.createdAt : a), s.ledger[0]!.createdAt)
    : iso(0);
  const ahmad: StudentProgress = {
    id: AHMAD_ID,
    name: "Ahmad Fauzi",
    username: "ahmad_santri",
    roomName: roomName(AHMAD_ROOM),
    level: levelFor(t.xp).level,
    levelName: levelFor(t.xp).name,
    xp: t.xp,
    point: t.point,
    streak: currentStreak(s.checkIns),
    courseProgress: Math.round((COURSES.reduce((a, c) => a + c.done, 0) / (COURSES.length * 10)) * 100),
    avgScore: Math.round(QUIZ_SCORES.reduce((a, q) => a + q.score, 0) / QUIZ_SCORES.length),
    lastActiveAt: ahmadLastActive,
    checkedInToday: todayChecked,
  };
  const others = ROSTER.map<StudentProgress>((r) => {
    const lv = levelFor(r.xp);
    return {
      id: r.id,
      name: r.name,
      username: r.username,
      roomName: roomName(r.roomId),
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
  return [ahmad, ...others];
}

const roomIdOf = (st: StudentProgress) =>
  ROOMS.find((r) => r.name === st.roomName)?.id ?? AHMAD_ROOM;

function coursesFor(student: StudentProgress): CourseSummary[] {
  const isAhmad = student.id === AHMAD_ID;
  let remaining = Math.round((student.courseProgress / 100) * COURSES.length * 10);
  return COURSES.map((c) => {
    let done: number;
    if (isAhmad) done = c.done;
    else {
      done = Math.min(c.total, remaining);
      remaining -= done;
    }
    const nextContent = done >= c.total ? null : c.next ?? null;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      roomName: student.roomName,
      status: "PUBLISHED",
      totalContents: c.total,
      completedContents: done,
      progressPercent: Math.round((done / c.total) * 100),
      nextContent,
    };
  });
}

function rewardsFor(student: StudentProgress, limit = 6): RewardEntry[] {
  if (student.id === AHMAD_ID) {
    return [...loadState().ledger]
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

function toSession(u: (typeof USERS)[number]): SessionUser {
  return { id: u.id, name: u.name, username: u.username, email: u.email, role: u.role };
}

function authUser(token: string | null): (typeof USERS)[number] {
  const u = token?.startsWith("mock.") ? USERS.find((x) => x.id === token.slice(5)) : undefined;
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
  user: (typeof USERS)[number]
): LeaderboardPage {
  const page = Math.max(1, Number(req.params.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.params.pageSize ?? 10)));
  const roomId = req.params.roomId;

  let pool = allStudents();
  if (roomId) pool = pool.filter((s) => roomIdOf(s) === roomId);
  pool.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));

  const myId = user.role === "SANTRI" ? AHMAD_ID : null;
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

async function route<T>(req: MockReq): Promise<T> {
  const { method, path } = req;
  const state = loadState();

  /* ---- auth ---- */
  if (method === "POST" && path === "/auth/login") {
    const { identifier, password } = (req.body ?? {}) as { identifier?: string; password?: string };
    const id = (identifier ?? "").trim().toLowerCase();
    const u = USERS.find((x) => x.username === id || x.email === id);
    if (!u || password !== DEMO_PASSWORD) {
      throw new ApiError("Username/email atau password salah.", 401);
    }
    const res: LoginResponse = { accessToken: `mock.${u.id}`, user: toSession(u) };
    return res as T;
  }
  if (method === "POST" && path === "/auth/logout") return undefined as T;

  const user = authUser(req.token);

  if (method === "GET" && path === "/auth/me") return toSession(user) as T;

  /* ---- santri ---- */
  if (method === "GET" && path === "/me/dashboard") {
    requireRole(user, "SANTRI");
    const me = allStudents()[0]!;
    const courses = coursesFor(me);
    const lb = leaderboard({ ...req, params: { pageSize: "50" } }, user);
    const res: SantriDashboard = {
      gamification: gamificationOf(state),
      rank: { position: lb.me?.rank ?? 0, total: lb.total },
      recentRewards: rewardsFor(me, 5),
      continueLearning: courses.find((c) => c.progressPercent < 100 && c.progressPercent > 0) ?? courses.find((c) => c.progressPercent < 100) ?? null,
      stats: {
        coursesCompleted: courses.filter((c) => c.progressPercent === 100).length,
        quizzesDone: state.ledger.filter((r) => r.source === "QUIZ" || r.source === "PERFECT_QUIZ").length,
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

  if (method === "GET" && path === "/me/courses") {
    requireRole(user, "SANTRI");
    return coursesFor(allStudents()[0]!) as T;
  }

  /* ---- rooms & leaderboard ---- */
  if (method === "GET" && path === "/rooms") {
    const students = allStudents();
    const visible = user.role === "SANTRI" ? ROOMS.filter((r) => r.id === AHMAD_ROOM) : ROOMS;
    const res: RoomSummary[] = visible.map((r) => ({
      id: r.id,
      name: r.name,
      memberCount: students.filter((s) => roomIdOf(s) === r.id).length,
    }));
    return res as T;
  }

  if (method === "GET" && path === "/leaderboard") {
    if (user.role === "SANTRI" && req.params.roomId && req.params.roomId !== AHMAD_ROOM) {
      throw new ApiError("Kamu bukan anggota room ini.", 403);
    }
    return leaderboard(req, user) as T;
  }

  /* ---- guru ---- */
  if (method === "GET" && path === "/admin/overview") {
    requireRole(user, "ADMIN");
    const all = allStudents();
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
      totalRooms: ROOMS.length,
      activeToday,
      checkInsToday,
      avgCourseProgress: Math.round(all.reduce((a, s) => a + s.courseProgress, 0) / all.length),
      avgScore: Math.round(all.reduce((a, s) => a + s.avgScore, 0) / all.length),
      activity,
      needsAttention: all.filter(needsAttention).sort((a, b) => (a.lastActiveAt < b.lastActiveAt ? -1 : 1)).slice(0, 5),
    };
    return res as T;
  }

  if (method === "GET" && path === "/admin/students") {
    requireRole(user, "ADMIN");
    const page = Math.max(1, Number(req.params.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.params.pageSize ?? 8)));
    const q = (req.params.q ?? "").toLowerCase();
    const room = req.params.room;
    const sort = req.params.sort ?? "xp";
    let list = allStudents();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.username.includes(q));
    if (room) list = list.filter((s) => s.roomName === room);
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") return b.courseProgress - a.courseProgress;
      if (sort === "streak") return b.streak - a.streak;
      if (sort === "lastActive") return a.lastActiveAt < b.lastActiveAt ? -1 : 1;
      return b.xp - a.xp;
    });
    const { slice, total } = paginate(list, page, pageSize);
    const res: StudentListPage = { items: slice, page, pageSize, total, rooms: ROOMS.map((r) => r.name) };
    return res as T;
  }

  /* ---- orang tua ---- */
  if (method === "GET" && path === "/parent/students") {
    requireRole(user, "PARENT");
    const ids = (user as { children?: string[] }).children ?? [];
    return allStudents().filter((s) => ids.includes(s.id)) as T;
  }

  const detail = path.match(/^\/parent\/students\/([^/]+)$/);
  if (method === "GET" && detail) {
    requireRole(user, "PARENT");
    const ids = (user as { children?: string[] }).children ?? [];
    const sid = detail[1]!;
    // BR-003: parent hanya boleh melihat anak yang terhubung.
    if (!ids.includes(sid)) throw new ApiError("Santri ini tidak terhubung dengan akunmu.", 403);
    const st = allStudents().find((s) => s.id === sid);
    if (!st) throw new ApiError("Santri tidak ditemukan.", 404);
    const res: StudentDetail = {
      student: st,
      courses: coursesFor(st),
      recentRewards: rewardsFor(st, 6),
      quizScores: QUIZ_SCORES.map((q, i) => ({
        id: q.id,
        title: q.title,
        score: Math.max(40, Math.min(100, st.avgScore + [5, 10, -5, 0][i]!)),
        takenAt: iso(q.daysAgo),
      })),
    };
    return res as T;
  }

  throw new ApiError("Endpoint tidak ditemukan.", 404);
}

export async function mockRequest<T>(req: MockReq): Promise<T> {
  await sleep(350);
  return route<T>(req);
}
