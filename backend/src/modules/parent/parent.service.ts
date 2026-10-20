import { z } from "zod";
import { db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { getByIds, queryIn } from "@/shared/firestore-utils";
import { SAFE_ID, docId } from "@/shared/ids";
import { uniqueRef } from "@/shared/unique";
import { auditInTx } from "../audit/audit";
import { gamificationService } from "../gamification/gamification.service";
import { adminScope } from "../monitoring/monitoring.service";
import { buildStudentRows } from "../monitoring/student-rows";
import { notifyInTx } from "../notifications/notification.service";
import { progressService } from "../progress/progress.service";
import type { AuthUser, UserDoc } from "../users/user.types";
import type { ContentDoc } from "../courses/course.types";

export const linkRequestSchema = z
  .object({
    studentUsername: z.string().trim().min(3).max(50).optional(),
    code: z.string().trim().min(6).max(20).regex(/^ORT-[A-Z0-9]+$/i, "Kode santri tidak valid").optional(),
    relationship: z.string().trim().max(50).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.studentUsername || v.code), { message: "Masukkan username santri atau kode santri." });

export const parentStudentLinkSchema = z
  .object({
    code: z.string().trim().min(6).max(20).regex(/^ORT-[A-Z0-9]+$/i, "Kode santri tidak valid"),
    relationship: z.string().trim().max(50).optional(),
  })
  .strict();
export const linkDecisionSchema = z.object({ status: z.enum(["ACTIVE", "REJECTED"]) }).strict();
export const linkListQuery = z.object({ status: z.enum(["PENDING", "ACTIVE", "REJECTED"]).default("PENDING") });
export const idParamSchema = z.string().regex(SAFE_ID);

type LinkStatus = "PENDING" | "ACTIVE" | "REJECTED";
interface LinkDoc {
  parentId: string; studentId: string; relationship: string | null; status: LinkStatus;
  createdAt: FirebaseFirestore.Timestamp; updatedAt: FirebaseFirestore.Timestamp;
}

/** BR-003 / AuthZ §4: parent hanya boleh membaca santri dengan relasi ACTIVE. */
export async function assertActiveLink(parentId: string, studentId: string): Promise<void> {
  const snap = await db().collection(C.parentStudents).doc(docId(parentId, studentId)).get();
  if (!snap.exists || (snap.data() as LinkDoc).status !== "ACTIVE") throw Errors.forbidden("Santri ini tidak terhubung dengan akunmu.");
}

export async function activeChildIds(parentId: string): Promise<string[]> {
  const snap = await db().collection(C.parentStudents).where("parentId", "==", parentId).where("status", "==", "ACTIVE").get();
  return snap.docs.map((d) => (d.data() as LinkDoc).studentId);
}

export const parentService = {
  async students(parent: AuthUser) {
    return (await buildStudentRows(await activeChildIds(parent.id))).sort((a, b) => a.name.localeCompare(b.name));
  },

  async student(parent: AuthUser, studentId: string) {
    await assertActiveLink(parent.id, studentId);
    const [row] = await buildStudentRows([studentId]);
    if (!row) throw Errors.notFound("Santri");
    const [courses, recentRewards, attempts] = await Promise.all([
      progressService.coursesForStudent(studentId),
      gamificationService.recentRewards(studentId, 6),
      db().collection(C.quizAttempts).where("studentId", "==", studentId).orderBy("submittedAt", "desc").limit(10).get(),
    ]);
    const contents = await getByIds<ContentDoc>(C.contents, attempts.docs.map((d) => d.data().contentId as string));
    const title = new Map(contents.map((c) => [c.id, c.data.title]));
    return {
      student: row, courses, recentRewards,
      quizScores: attempts.docs.map((d) => ({
        id: d.id, title: `Kuis: ${title.get(d.data().contentId as string) ?? "-"}`,
        score: d.data().percent as number, takenAt: toIso(d.data().submittedAt)!,
      })),
    };
  },

  async linkStudentByCode(parent: AuthUser, input: z.output<typeof parentStudentLinkSchema>) {
    const code = input.code.trim().toUpperCase();
    const key = await uniqueRef("linkCode", code).get();
    const studentId = key.data()?.userId as string | undefined;
    const sSnap = studentId ? await db().collection(C.users).doc(studentId).get() : null;
    const student = sSnap?.data() as UserDoc | undefined;
    if (!studentId || !student || student.role !== "SANTRI" || !student.isActive || student.deletedAt) throw Errors.notFound("Santri");

    const ref = db().collection(C.parentStudents).doc(docId(parent.id, studentId));
    const now = ts();
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.data() as LinkDoc | undefined;
      if (cur?.status === "ACTIVE") throw Errors.conflict("Santri ini sudah terhubung dengan akunmu.");
      if (cur?.status === "PENDING") throw Errors.conflict("Permintaan sudah dikirim dan menunggu persetujuan guru.");
      tx.set(ref, { parentId: parent.id, studentId, relationship: input.relationship ?? cur?.relationship ?? null, status: "ACTIVE", createdAt: cur?.createdAt ?? now, updatedAt: now } satisfies LinkDoc);
      auditInTx(tx, { actorId: parent.id, action: "PARENT_LINK_APPROVED", entityType: "parentStudent", entityId: ref.id });
    });

    const [row] = await buildStudentRows([studentId]);
    if (!row) throw Errors.notFound("Santri");
    return row;
  },

  /** Orang tua mengajukan tautan ke santri (PENDING) → disetujui guru santri tsb. */
  async requestLink(parent: AuthUser, input: z.output<typeof linkRequestSchema>) {
    if (input.code) return this.linkStudentByCode(parent, { code: input.code, relationship: input.relationship });

    const studentUsername = input.studentUsername!.trim().toLowerCase();
    const key = await uniqueRef("username", studentUsername).get();
    const studentId = key.data()?.userId as string | undefined;
    const sSnap = studentId ? await db().collection(C.users).doc(studentId).get() : null;
    const student = sSnap?.data() as UserDoc | undefined;
    if (!studentId || !student || student.role !== "SANTRI" || !student.isActive || student.deletedAt) throw Errors.notFound("Santri");

    const ref = db().collection(C.parentStudents).doc(docId(parent.id, studentId));
    const now = ts();
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.data() as LinkDoc | undefined;
      if (cur?.status === "ACTIVE") throw Errors.conflict("Santri ini sudah terhubung dengan akunmu.");
      if (cur?.status === "PENDING") throw Errors.conflict("Permintaan sudah dikirim dan menunggu persetujuan guru.");
      tx.set(ref, { parentId: parent.id, studentId, relationship: input.relationship ?? null, status: "PENDING", createdAt: cur?.createdAt ?? now, updatedAt: now } satisfies LinkDoc);
      auditInTx(tx, { actorId: parent.id, action: "PARENT_LINK_REQUESTED", entityType: "parentStudent", entityId: ref.id });
    });
    return { id: ref.id, studentId, studentName: student.name, status: "PENDING" as const };
  },

  async listRequests(admin: AuthUser, status: LinkStatus) {
    const { studentIds } = await adminScope(admin);
    const links = await queryIn<LinkDoc>((v) => db().collection(C.parentStudents).where("studentId", "in", v).where("status", "==", status), studentIds);
    const users = await getByIds<UserDoc>(C.users, links.flatMap((l) => [l.data.parentId, l.data.studentId]));
    const name = new Map(users.map((u) => [u.id, u.data.name]));
    return links.map((l) => ({
      id: l.id, status: l.data.status, relationship: l.data.relationship,
      parent: { id: l.data.parentId, name: name.get(l.data.parentId) ?? "-" },
      student: { id: l.data.studentId, name: name.get(l.data.studentId) ?? "-" },
      createdAt: toIso(l.data.createdAt),
    }));
  },

  /** Hanya guru yang memiliki room tempat santri itu menjadi anggota. */
  async decide(admin: AuthUser, linkId: string, status: "ACTIVE" | "REJECTED") {
    const ref = db().collection(C.parentStudents).doc(linkId);
    const { studentIds } = await adminScope(admin);
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const l = snap.data() as LinkDoc | undefined;
      if (!l) throw Errors.notFound("Permintaan");
      if (!studentIds.includes(l.studentId)) throw Errors.forbidden("Santri ini bukan anggota room-mu.");
      if (l.status !== "PENDING") throw Errors.conflict("Permintaan ini sudah diproses.");
      tx.update(ref, { status, updatedAt: ts() });
      notifyInTx(tx, {
        userId: l.parentId, type: "SYSTEM",
        title: status === "ACTIVE" ? "Tautan santri disetujui" : "Tautan santri ditolak",
        message: status === "ACTIVE" ? "Kamu sekarang bisa memantau perkembangan anakmu." : "Permintaan tautan ke santri ditolak oleh guru.",
        data: { studentId: l.studentId },
      });
      auditInTx(tx, { actorId: admin.id, action: status === "ACTIVE" ? "PARENT_LINK_APPROVED" : "PARENT_LINK_REJECTED", entityType: "parentStudent", entityId: linkId });
    });
    return { id: linkId, status };
  },
};
