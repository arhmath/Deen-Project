import { randomBytes } from "node:crypto";
import { env } from "@/config/env";
import { db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { sha256 } from "@/shared/ids";
import { logger } from "@/shared/logger";
import { consume } from "@/shared/rate-limit";
import { hashPassword } from "@/shared/security";
import { uniqueRef } from "@/shared/unique";
import { audit, auditInTx } from "../audit/audit";
import type { UserDoc } from "../users/user.types";
import type { ForgotPasswordInput, ResetPasswordInput } from "./auth.schema";
import { sendPasswordResetEmail } from "./mailer";
import { invalidateUserCache } from "./session";

interface ResetDoc {
  userId: string;
  expiresAt: FirebaseFirestore.Timestamp;
  usedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
}

/** Pesan seragam: tidak membocorkan apakah akun/email terdaftar (anti user-enumeration). */
export const FORGOT_PASSWORD_MESSAGE =
  "Jika akunmu punya email terdaftar, tautan untuk mengatur ulang password sudah kami kirim. Cek kotak masuk dan folder spam.";

const INVALID_LINK = "Tautan reset sudah tidak berlaku. Minta tautan baru lewat “Lupa password?”.";

/** Tandai semua token reset milik user yang belum dipakai sebagai terpakai. */
async function expirePendingResets(userId: string) {
  const snap = await db().collection(C.passwordResets).where("userId", "==", userId).where("usedAt", "==", null).get();
  if (snap.empty) return;
  const batch = db().batch();
  const now = ts();
  snap.docs.forEach((d) => batch.update(d.ref, { usedAt: now }));
  await batch.commit();
}

/** Cabut semua refresh token user → semua perangkat harus login ulang dengan password baru. */
async function revokeAllSessions(userId: string) {
  for (;;) {
    const snap = await db().collection(C.refreshTokens).where("userId", "==", userId).where("revokedAt", "==", null).limit(400).get();
    if (snap.empty) return;
    const batch = db().batch();
    const now = ts();
    snap.docs.forEach((d) => batch.update(d.ref, { revokedAt: now }));
    await batch.commit();
  }
}

export const passwordResetService = {
  /** Selalu selesai tanpa error bagi pemanggil (kecuali rate limit), apa pun hasil pencarian akun. */
  async request(input: ForgotPasswordInput): Promise<{ message: string }> {
    const ident = input.identifier.trim().toLowerCase();
    // Batasi per-identifier agar inbox seseorang tidak dibanjiri; batas per-IP ada di route.
    consume(`forgot-ident:${ident}`, 3, 15 * 60_000);

    const keySnap = await uniqueRef(ident.includes("@") ? "email" : "username", ident).get();
    const userId = keySnap.data()?.userId as string | undefined;
    const userSnap = userId ? await db().collection(C.users).doc(userId).get() : null;
    const u = userSnap?.data() as UserDoc | undefined;

    // Akun tanpa email (email bersifat opsional saat daftar) tidak bisa dikirimi tautan.
    if (!userSnap || !u || !u.email || !u.isActive || u.deletedAt) return { message: FORGOT_PASSWORD_MESSAGE };

    const token = randomBytes(32).toString("base64url");
    const ttlMin = env().PASSWORD_RESET_TTL_MIN;
    await expirePendingResets(userSnap.id);
    await db()
      .collection(C.passwordResets)
      .doc(sha256(token)) // hanya hash yang disimpan
      .create({
        userId: userSnap.id,
        expiresAt: ts(new Date(Date.now() + ttlMin * 60_000)),
        usedAt: null,
        createdAt: ts(),
      } satisfies ResetDoc);

    const link = `${env().APP_URL.replace(/\/+$/, "")}/reset-password?token=${token}`;
    // Tidak di-await: kecepatan respons tidak membedakan akun yang ada dan yang tidak.
    void sendPasswordResetEmail({ to: u.email, name: u.name, link, ttlMin }).catch((err) =>
      logger.error("password_reset_mail_failed", { userId: userSnap.id, err: err instanceof Error ? err.message : String(err) })
    );
    await audit({ actorId: userSnap.id, action: "PASSWORD_RESET_REQUESTED", entityType: "user", entityId: userSnap.id });
    return { message: FORGOT_PASSWORD_MESSAGE };
  },

  async reset(input: ResetPasswordInput): Promise<{ message: string }> {
    const ref = db().collection(C.passwordResets).doc(sha256(input.token));
    const passwordHash = await hashPassword(input.password);

    const userId = await db().runTransaction(async (tx) => {
      const rSnap = await tx.get(ref);
      const r = rSnap.data() as ResetDoc | undefined;
      if (!r || r.usedAt || r.expiresAt.toMillis() < Date.now()) throw Errors.badRequest(INVALID_LINK);

      const userRef = db().collection(C.users).doc(r.userId);
      const u = (await tx.get(userRef)).data() as UserDoc | undefined;
      if (!u || !u.isActive || u.deletedAt) throw Errors.badRequest(INVALID_LINK);

      tx.update(userRef, { passwordHash, updatedAt: ts() });
      tx.update(ref, { usedAt: ts() });
      auditInTx(tx, { actorId: r.userId, action: "PASSWORD_RESET_COMPLETED", entityType: "user", entityId: r.userId });
      return r.userId;
    });

    await Promise.all([expirePendingResets(userId), revokeAllSessions(userId)]);
    invalidateUserCache(userId);
    return { message: "Password berhasil diubah. Silakan masuk dengan password barunya." };
  },
};
