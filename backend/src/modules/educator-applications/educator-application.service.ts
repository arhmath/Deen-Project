import { randomInt } from "node:crypto";
import { db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { newId } from "@/shared/ids";
import { hashPassword } from "@/shared/security";
import { uniqueRef } from "@/shared/unique";
import type { AuthUser, UserDoc } from "@/modules/users/user.types";
import type { EducatorApplicationInput } from "./educator-application.schema";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
function temporaryPassword() { return Array.from({ length: 18 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""); }
function usernameBase(name: string) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9_.]+/g, ".").replace(/^\.+|\.+$/g, "").replace(/\.{2,}/g, ".").slice(0, 28) || "ustadz";
}

async function createTeacher(applicationId: string, application: Record<string, any>, actorId: string, note?: string) {
  const userId = newId();
  const base = usernameBase(application.fullName);
  const username = `${base}.${randomInt(1000, 9999)}`;
  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  const emailLower = String(application.emailLower);
  const uKey = uniqueRef("username", username.toLowerCase());
  const eKey = uniqueRef("email", emailLower);
  const now = ts();
  const user: UserDoc = {
    name: application.fullName, username, usernameLower: username.toLowerCase(),
    email: application.email, emailLower, passwordHash, role: "ADMIN", avatarUrl: null,
    linkCode: null, isActive: true, createdAt: now, updatedAt: now, deletedAt: null,
  };
  const appRef = db().collection(C.educatorApplications).doc(applicationId);
  await db().runTransaction(async (tx) => {
    const [appSnap, uSnap, eSnap] = await tx.getAll(appRef, uKey, eKey);
    if (!appSnap.exists) throw Errors.notFound("Pendaftaran");
    const current = appSnap.data()!;
    if (current.status !== "PENDING") throw Errors.conflict("Pendaftaran ini sudah diproses.");
    if (uSnap.exists || eSnap.exists) throw Errors.conflict("Username atau Gmail sudah terdaftar. Coba proses kembali.");
    tx.create(db().collection(C.users).doc(userId), user);
    tx.create(uKey, { userId, type: "username", createdAt: now });
    tx.create(eKey, { userId, type: "email", createdAt: now });
    tx.update(appRef, { status: "APPROVED", userId, username, reviewedBy: actorId, reviewedAt: now, reviewNote: note ?? null, updatedAt: now });
    tx.create(db().collection(C.auditLogs).doc(newId()), {
      actorId, action: "EDUCATOR_APPLICATION_APPROVED", entityType: "educatorApplication", entityId: applicationId,
      metadata: { userId, username }, createdAt: now,
    });
  });
  return { username, password, userId };
}

export const educatorApplicationService = {
  async submit(input: EducatorApplicationInput) {
    const emailLower = input.email.toLowerCase();
    if ((await uniqueRef("email", emailLower).get()).exists) {
      throw Errors.conflict("Gmail ini sudah terhubung ke akun Deen. Gunakan Gmail lain atau masuk ke akun yang sudah ada.");
    }
    const existing = await db().collection(C.educatorApplications).where("emailLower", "==", emailLower).limit(10).get();
    if (existing.docs.some((d) => ["PENDING", "APPROVED"].includes(String(d.data().status)))) {
      throw Errors.conflict("Pendaftaran dengan Gmail ini sudah pernah dikirim atau disetujui.");
    }
    const id = newId();
    const now = ts();
    const doc = {
      ...input, email: input.email.trim(), emailLower, status: "PENDING", userId: null,
      username: null, reviewNote: null, reviewedBy: null, reviewedAt: null, createdAt: now, updatedAt: now,
    };
    await db().collection(C.educatorApplications).doc(id).create(doc);

    // Hanya untuk simulasi lokal/demo. Di production, biarkan false agar Superadmin memverifikasi dahulu.
    if (process.env.EDUCATOR_APPLICATION_SIMULATION === "true") {
      const credentials = await createTeacher(id, doc, "SIMULATION", "Auto-approve mode simulasi");
      return { applicationId: id, status: "APPROVED" as const, simulation: true, credentials: { username: credentials.username, password: credentials.password } };
    }
    return { applicationId: id, status: "PENDING" as const, simulation: false };
  },

  async list(actor: AuthUser) {
    const snap = await db().collection(C.educatorApplications).orderBy("createdAt", "desc").limit(100).get();
    return { items: snap.docs.map((d) => {
      const x = d.data();
      return { id: d.id, fullName: x.fullName, email: x.email, phone: x.phone, institution: x.institution,
        city: x.city, education: x.education, subjects: x.subjects, experience: x.experience,
        motivation: x.motivation, evidenceUrl: x.evidenceUrl ?? "", status: x.status, username: x.username ?? null, reviewNote: x.reviewNote ?? null,
        createdAt: x.createdAt?.toDate?.().toISOString?.() ?? null, reviewedAt: x.reviewedAt?.toDate?.().toISOString?.() ?? null };
    }), requestedBy: actor.id };
  },

  async decide(actor: AuthUser, applicationId: string, decision: "APPROVE" | "REJECT", note?: string) {
    const ref = db().collection(C.educatorApplications).doc(applicationId);
    const snap = await ref.get();
    if (!snap.exists) throw Errors.notFound("Pendaftaran");
    const app = snap.data()!;
    if (app.status !== "PENDING") throw Errors.conflict("Pendaftaran ini sudah diproses.");
    if (decision === "REJECT") {
      await ref.update({ status: "REJECTED", reviewedBy: actor.id, reviewedAt: ts(), reviewNote: note ?? null, updatedAt: ts() });
      return { status: "REJECTED" as const };
    }
    const credentials = await createTeacher(applicationId, app, actor.id, note);
    return { status: "APPROVED" as const, credentials: { username: credentials.username, password: credentials.password } };
  },
};
