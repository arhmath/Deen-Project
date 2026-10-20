import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { getByIds } from "@/shared/firestore-utils";
import { toIso } from "@/lib/firebase";
import { courseService } from "@/modules/courses/course.service";
import type { ContentDoc } from "@/modules/courses/course.types";
import { gamificationService } from "@/modules/gamification/gamification.service";
import { leaderboardService } from "@/modules/leaderboard/leaderboard.service";
import { monitoringService } from "@/modules/monitoring/monitoring.service";
import { notificationService } from "@/modules/notifications/notification.service";
import { activeChildIds, assertActiveLink, parentService } from "@/modules/parent/parent.service";
import { progressService } from "@/modules/progress/progress.service";
import { roomService } from "@/modules/rooms/room.service";
import { userService } from "@/modules/users/user.service";
import type { AuthUser, Role } from "@/modules/users/user.types";
import type { AISource } from "./types";

export interface ToolCtx {
  user: AuthUser;
  /** pesan user — dipakai untuk memilih anak (parent) berdasarkan nama */
  message: string;
}

export interface Tool {
  name: string;
  /** role yang BOLEH memakai tool ini — dicek di registry, bukan oleh LLM */
  roles: Role[];
  source: AISource["type"];
  run: (ctx: ToolCtx) => Promise<unknown>;
}

async function recentQuizResults(studentId: string, limit = 5) {
  const snap = await db().collection(C.quizAttempts).where("studentId", "==", studentId).orderBy("submittedAt", "desc").limit(limit).get();
  const contents = await getByIds<ContentDoc>(C.contents, snap.docs.map((d) => d.data().contentId as string));
  const title = new Map(contents.map((c) => [c.id, c.data.title]));
  return snap.docs.map((d) => ({
    kuis: title.get(d.data().contentId as string) ?? "-", nilai: d.data().percent as number, tanggal: toIso(d.data().submittedAt),
  }));
}

/** Pilih anak: nama disebut di pesan → anak itu; hanya 1 anak → anak itu; selain itu minta klarifikasi. */
async function resolveChild(ctx: ToolCtx): Promise<string> {
  const ids = await activeChildIds(ctx.user.id);
  if (!ids.length) throw Errors.notFound("Santri yang terhubung");
  const rows = await parentService.students(ctx.user);
  const msg = ctx.message.toLowerCase();
  const named = rows.filter((r) => r.name.toLowerCase().split(" ").some((p) => p.length >= 3 && msg.includes(p)));
  if (named.length === 1) return named[0]!.id;
  if (rows.length === 1) return rows[0]!.id;
  throw Object.assign(new Error("ambiguous"), { clarify: rows.map((r) => r.name) });
}

const child = async (ctx: ToolCtx) => {
  const id = await resolveChild(ctx);
  await assertActiveLink(ctx.user.id, id); // otorisasi relasi parent–anak (bukan dari LLM)
  return parentService.student(ctx.user, id);
};

export const TOOLS: Tool[] = [
  { name: "get_my_profile", roles: ["SANTRI", "PARENT", "ADMIN"], source: "profile", run: async ({ user }) => {
    const u = await userService.getMe(user.id);
    return { nama: u.name, username: u.username, peran: u.role };
  } },
  { name: "get_my_gamification", roles: ["SANTRI"], source: "progress", run: async ({ user }) => {
    const g = await gamificationService.summary(user.id);
    return { xp: g.xp, point: g.point, level: g.level.level, namaLevel: g.level.name, xpMenujuLevelBerikutnya: g.level.xpToNext, streak: g.streak, streakTerpanjang: g.longestStreak, sudahCheckInHariIni: g.checkedInToday };
  } },
  { name: "get_my_streak", roles: ["SANTRI"], source: "progress", run: async ({ user }) => {
    const g = await gamificationService.summary(user.id);
    return { streak: g.streak, streakTerpanjang: g.longestStreak, sudahCheckInHariIni: g.checkedInToday };
  } },
  { name: "get_my_progress", roles: ["SANTRI"], source: "progress", run: async ({ user }) => {
    const courses = await progressService.coursesForStudent(user.id);
    return courses.map((c) => ({ course: c.title, selesai: c.completedContents, total: c.totalContents, persen: c.progressPercent, berikutnya: c.nextContent?.title ?? null }));
  } },
  { name: "get_my_courses", roles: ["SANTRI"], source: "progress", run: async ({ user }) => {
    const courses = await progressService.coursesForStudent(user.id);
    return courses.map((c) => ({ course: c.title, room: c.roomName, persen: c.progressPercent }));
  } },
  { name: "get_my_quiz_results", roles: ["SANTRI"], source: "progress", run: async ({ user }) => recentQuizResults(user.id) },
  { name: "get_leaderboard", roles: ["SANTRI", "PARENT", "ADMIN"], source: "progress", run: async ({ user }) => {
    const lb = await leaderboardService.page(user, { page: 1, pageSize: 5 });
    return { top: lb.entries.map((e) => ({ peringkat: e.rank, nama: e.name, xp: e.xp })), peringkatSaya: lb.me ? { peringkat: lb.me.rank, xp: lb.me.xp } : null, totalPeserta: lb.total };
  } },
  { name: "get_my_rooms", roles: ["SANTRI", "ADMIN"], source: "progress", run: async ({ user }) => (await roomService.list(user)).map((r) => ({ room: r.name, anggota: r.memberCount })) },
  { name: "get_notifications", roles: ["SANTRI", "PARENT", "ADMIN"], source: "notification", run: async ({ user }) => {
    const n = await notificationService.list(user.id, { unread: "true", page: 1, limit: 5 });
    return { belumDibaca: n.unreadCount, terbaru: n.items.map((i) => ({ judul: i.title, pesan: i.message })) };
  } },
  // ---- orang tua ----
  { name: "get_child_gamification", roles: ["PARENT"], source: "progress", run: async (ctx) => {
    const s = (await child(ctx)).student;
    return { anak: s.name, xp: s.xp, point: s.point, level: s.level, namaLevel: s.levelName, streak: s.streak, sudahCheckInHariIni: s.checkedInToday };
  } },
  { name: "get_child_progress", roles: ["PARENT"], source: "progress", run: async (ctx) => {
    const d = await child(ctx);
    return { anak: d.student.name, rataRataProgres: d.student.courseProgress, course: d.courses.map((c) => ({ course: c.title, persen: c.progressPercent })) };
  } },
  { name: "get_child_quiz_results", roles: ["PARENT"], source: "progress", run: async (ctx) => {
    const d = await child(ctx);
    return { anak: d.student.name, rataRataNilai: d.student.avgScore, kuisTerbaru: d.quizScores.slice(0, 5).map((q) => ({ kuis: q.title, nilai: q.score })) };
  } },
  // ---- guru ----
  { name: "get_room_statistics", roles: ["ADMIN"], source: "progress", run: async ({ user }) => {
    const o = await monitoringService.overview(user);
    return { totalSantri: o.totalStudents, totalRoom: o.totalRooms, aktifHariIni: o.activeToday, checkInHariIni: o.checkInsToday };
  } },
  { name: "get_learning_statistics", roles: ["ADMIN"], source: "progress", run: async ({ user }) => {
    const o = await monitoringService.overview(user);
    return { rataRataProgresCourse: o.avgCourseProgress, rataRataNilai: o.avgScore };
  } },
  { name: "get_student_statistics", roles: ["ADMIN"], source: "progress", run: async ({ user }) => {
    const o = await monitoringService.overview(user);
    return { perluPerhatian: o.needsAttention.map((s) => ({ nama: s.name, room: s.roomName, progres: s.courseProgress, terakhirAktif: s.lastActiveAt })) };
  } },
  { name: "get_course_statistics", roles: ["ADMIN"], source: "progress", run: async ({ user }) => {
    const list = await courseService.list(user, {});
    return { jumlahCourse: list.length, course: list.slice(0, 10).map((c) => ({ course: c.title, status: c.status, room: c.roomName })) };
  } },
];

const byName = new Map(TOOLS.map((t) => [t.name, t]));

/**
 * Registry: otorisasi role dilakukan di sini; data diambil lewat service yang sama dengan REST API
 * (bukan HTTP internal, bukan SQL/Firestore langsung dari LLM).
 */
export async function runTool(name: string, ctx: ToolCtx): Promise<{ ok: true; data: unknown; source: AISource["type"] } | { ok: false; note: string }> {
  const tool = byName.get(name);
  if (!tool) return { ok: false, note: "Tool tidak dikenal." };
  if (!tool.roles.includes(ctx.user.role)) return { ok: false, note: "Data ini tidak tersedia untuk peranmu." };
  try {
    return { ok: true, data: await tool.run(ctx), source: tool.source };
  } catch (err) {
    const clarify = (err as { clarify?: string[] }).clarify;
    if (clarify) return { ok: false, note: `Ada beberapa anak (${clarify.join(", ")}). Tanyakan dengan menyebut nama anak.` };
    return { ok: false, note: "Data tidak tersedia." };
  }
}
