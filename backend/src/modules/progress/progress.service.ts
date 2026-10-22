import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { getByIds, queryIn } from "@/shared/firestore-utils";
import { assertCourseOwner, assertStudentCourseAccess } from "../courses/course.access";
import { loadStructure } from "../courses/course.structure";
import type { CourseDoc, WithId } from "../courses/course.types";
import { REWARD_CONFIG, baseRewardOf } from "../gamification/gamification.logic";
import { gamRef } from "../gamification/gamification.repository";
import { activeRoomIdsOfStudent } from "../rooms/room.access";
import type { RoomDoc } from "../rooms/room.types";
import type { AuthUser } from "../users/user.types";

export type ContentTypeDto = "LESSON" | "QUIZ" | "FLASHCARD" | "CHALLENGE" | "VIDEO" | "ARTICLE";

export interface AdventureNodeDto {
  id: string;
  title: string;
  type: ContentTypeDto;
  moduleTitle: string;
  rewardXp: number;
  completed: boolean;
  isNext: boolean;
}

export interface AdventureRegionDto {
  courseId: string;
  title: string;
  description: string;
  roomName: string;
  totalContents: number;
  completedContents: number;
  progressPercent: number;
  completed: boolean;
  courseRewardXp: number;
  nodes: AdventureNodeDto[];
}

export interface AdventureDto {
  regions: AdventureRegionDto[];
}

/** Bentuk CourseSummary yang dibaca frontend (types/learning.ts). */
export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  roomName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  totalContents: number;
  completedContents: number;
  progressPercent: number;
  nextContent: { id: string; title: string; type: ContentTypeDto; rewardXp: number } | null;
}

interface AdventureContentShape {
  id: string;
  title: string;
  type: ContentTypeDto;
  moduleId: string;
  xpReward: number;
  pointReward: number;
}

export function buildAdventureRegions(
  courses: CourseSummary[],
  structures: Record<string, { modules: Array<{ id: string; title: string }>; contents: AdventureContentShape[] }>,
  completedContentIds: Set<string> = new Set()
): AdventureRegionDto[] {
  return courses.map((course) => {
    const structure = structures[course.id] ?? { modules: [], contents: [] };
    const moduleTitle = new Map(structure.modules.map((m) => [m.id, m.title] as const));
    const contents = structure.contents;
    const next = contents.find((c) => !completedContentIds.has(c.id)) ?? null;
    const done = contents.filter((c) => completedContentIds.has(c.id)).length;
    return {
      courseId: course.id,
      title: course.title,
      description: course.description ?? "",
      roomName: course.roomName,
      totalContents: contents.length,
      completedContents: done,
      progressPercent: contents.length ? Math.round((done / contents.length) * 100) : 0,
      completed: contents.length > 0 && done === contents.length,
      courseRewardXp: REWARD_CONFIG.COURSE.xp,
      nodes: contents.map((content) => ({
        id: content.id,
        title: content.title,
        type: content.type,
        moduleTitle: moduleTitle.get(content.moduleId) ?? "",
        rewardXp: baseRewardOf({ type: content.type, xpReward: content.xpReward, pointReward: content.pointReward }).xp,
        completed: completedContentIds.has(content.id),
        isNext: content.id === next?.id,
      })),
    };
  });
}

async function summarize(course: WithId<CourseDoc>, roomName: string, studentId: string): Promise<CourseSummary> {
  const [{ contents }, prog] = await Promise.all([
    loadStructure(course.id, { publishedOnly: true }),
    db().collection(C.contentProgress).where("studentId", "==", studentId).where("courseId", "==", course.id).get(),
  ]);
  const done = new Set(prog.docs.filter((d) => d.data().status === "COMPLETED").map((d) => d.data().contentId as string));
  const completed = contents.filter((c) => done.has(c.id)).length;
  const next = contents.find((c) => !done.has(c.id)) ?? null;
  return {
    id: course.id,
    title: course.title,
    description: course.description ?? "",
    roomName,
    status: course.status,
    totalContents: contents.length,
    completedContents: completed,
    progressPercent: contents.length ? Math.round((completed / contents.length) * 100) : 0,
    nextContent: next ? { id: next.id, title: next.title, type: next.type, rewardXp: baseRewardOf(next).xp } : null,
  };
}

export const progressService = {
  async adventureForStudent(studentId: string): Promise<AdventureDto> {
    const courses = await this.coursesForStudent(studentId);
    if (!courses.length) return { regions: [] };

    const structures = await Promise.all(
      courses.map(async (course) => {
        const structure = await loadStructure(course.id, { publishedOnly: true });
        return {
          id: course.id,
          modules: structure.modules.map((m) => ({ id: m.id, title: m.title })),
          contents: structure.contents.map((c) => ({
            id: c.id,
            title: c.title,
            type: c.type,
            moduleId: c.moduleId,
            xpReward: c.xpReward,
            pointReward: c.pointReward,
          })),
        };
      })
    );

    const courseIds = courses.map((c) => c.id);
    const rows = await queryIn(
      (v) => db().collection(C.contentProgress).where("studentId", "==", studentId).where("courseId", "in", v),
      courseIds
    );
    const completedIds = new Set(
      rows.filter((r) => (r.data.status as string | undefined) === "COMPLETED").map((r) => String(r.data.contentId))
    );
    const byId = Object.fromEntries(structures.map((s) => [s.id, { modules: s.modules, contents: s.contents }]));
    return { regions: buildAdventureRegions(courses, byId, completedIds) };
  },

  /** Course PUBLISHED dari room aktif santri beserta progresnya (BR-005, BR-013). */
  async coursesForStudent(studentId: string): Promise<CourseSummary[]> {
    const roomIds = await activeRoomIdsOfStudent(studentId);
    if (!roomIds.length) return [];
    const [rows, rooms] = await Promise.all([
      queryIn<CourseDoc>((v) => db().collection(C.courses).where("roomId", "in", v).where("status", "==", "PUBLISHED"), roomIds),
      getByIds<RoomDoc>(C.rooms, roomIds),
    ]);
    const roomName = new Map(rooms.filter((r) => r.data.status === "ACTIVE").map((r) => [r.id, r.data.name]));
    const courses = rows.filter((r) => !r.data.deletedAt && roomName.has(r.data.roomId)).map((r) => ({ id: r.id, ...r.data }));
    const out = await Promise.all(courses.map((c) => summarize(c, roomName.get(c.roomId)!, studentId)));
    return out.sort((a, b) => a.title.localeCompare(b.title));
  },

  /** Refresh read model `courseProgress` (rata-rata progres course). Best-effort. */
  async refreshCourseProgress(studentId: string): Promise<number> {
    const list = await this.coursesForStudent(studentId);
    const avg = list.length ? Math.round(list.reduce((a, c) => a + c.progressPercent, 0) / list.length) : 0;
    await gamRef(studentId).update({ courseProgress: avg }).catch(() => undefined);
    return avg;
  },

  async me(user: AuthUser) {
    const courses = await this.coursesForStudent(user.id);
    return {
      courses,
      totals: {
        courses: courses.length,
        completedCourses: courses.filter((c) => c.progressPercent === 100).length,
        completedContents: courses.reduce((a, c) => a + c.completedContents, 0),
        totalContents: courses.reduce((a, c) => a + c.totalContents, 0),
      },
    };
  },

  /** Detail progres satu course: SANTRI (anggota room) atau ADMIN pemilik (untuk `studentId`). */
  async course(user: AuthUser, courseId: string, studentId?: string) {
    let target = user.id;
    let course: WithId<CourseDoc>;
    if (user.role === "ADMIN") {
      course = await assertCourseOwner(user, courseId);
      if (!studentId) throw Errors.badRequest("Parameter studentId wajib untuk guru.");
      const m = await db().collection(C.roomMembers).doc(`${course.roomId}_${studentId}`).get();
      if (!m.exists) throw Errors.notFound("Santri");
      target = studentId;
    } else {
      course = await assertStudentCourseAccess(user, courseId);
    }
    const { contents } = await loadStructure(courseId, { publishedOnly: true });
    const prog = await db().collection(C.contentProgress).where("studentId", "==", target).where("courseId", "==", courseId).get();
    const byContent = new Map(prog.docs.map((d) => [d.data().contentId as string, d.data()]));
    const items = contents.map((c) => {
      const p = byContent.get(c.id);
      return {
        contentId: c.id, title: c.title, type: c.type,
        status: (p?.status as string | undefined) ?? "NOT_STARTED",
        score: (p?.score as number | undefined) ?? null,
        completedAt: p?.completedAt ? (p.completedAt as FirebaseFirestore.Timestamp).toDate().toISOString() : null,
      };
    });
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    return {
      courseId, title: course.title, totalContents: items.length, completedContents: completed,
      progressPercent: items.length ? Math.round((completed / items.length) * 100) : 0, items,
    };
  },
};
