import { db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { newId } from "@/shared/ids";
import { consume } from "@/shared/rate-limit";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "@/shared/security";
import { uniqueRef } from "@/shared/unique";
import { auditInTx, audit } from "../audit/audit";
import { initialGamification } from "../gamification/gamification.logic";
import { gamRef } from "../gamification/gamification.repository";
import { toSessionUser, type SessionUser, type UserDoc } from "../users/user.types";
import type { LoginInput, RegisterInput } from "./auth.schema";
import { invalidateUserCache } from "./session";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

interface RefreshDoc {
  userId: string;
  family: string;
  expiresAt: FirebaseFirestore.Timestamp;
  usedAt: FirebaseFirestore.Timestamp | null;
  revokedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
}

async function issueSession(id: string, u: UserDoc, family?: string): Promise<LoginResponse> {
  const [accessToken, refresh] = await Promise.all([signAccessToken(id, u.role), signRefreshToken(id, family)]);
  await db()
    .collection(C.refreshTokens)
    .doc(refresh.jti)
    .create({
      userId: id,
      family: refresh.family,
      expiresAt: ts(refresh.expiresAt),
      usedAt: null,
      revokedAt: null,
      createdAt: ts(),
    } satisfies RefreshDoc);
  return { accessToken, refreshToken: refresh.token, user: toSessionUser(id, u) };
}

async function revokeFamily(family: string) {
  const snap = await db().collection(C.refreshTokens).where("family", "==", family).where("revokedAt", "==", null).get();
  if (snap.empty) return;
  const batch = db().batch();
  const now = ts();
  snap.docs.forEach((d) => batch.update(d.ref, { revokedAt: now }));
  await batch.commit();
}

export const authService = {
  async register(input: RegisterInput): Promise<{ user: SessionUser }> {
    const usernameLower = input.username.toLowerCase();
    const email = input.email ? input.email : null;
    const emailLower = email ? email.toLowerCase() : null;
    const passwordHash = await hashPassword(input.password);
    const id = newId();
    const now = ts();

    const doc: UserDoc = {
      name: input.name,
      username: input.username,
      usernameLower,
      email,
      emailLower,
      passwordHash,
      role: input.role,
      avatarUrl: null,
      linkCode: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const uKey = uniqueRef("username", usernameLower);
    const eKey = emailLower ? uniqueRef("email", emailLower) : null;

    await db().runTransaction(async (tx) => {
      const snaps = await tx.getAll(...(eKey ? [uKey, eKey] : [uKey]));
      const fields: Record<string, string> = {};
      if (snaps[0]!.exists) fields.username = "Username sudah dipakai.";
      if (eKey && snaps[1]!.exists) fields.email = "Email sudah terdaftar.";
      if (Object.keys(fields).length) throw Errors.conflict("Username atau email sudah dipakai.", fields);

      const userRef = db().collection(C.users).doc(id);
      tx.create(userRef, doc);
      tx.create(uKey, { userId: id, type: "username", createdAt: now });
      if (eKey) tx.create(eKey, { userId: id, type: "email", createdAt: now });
      if (input.role === "SANTRI") tx.create(gamRef(id), initialGamification(id, input.name, input.username, now));
      auditInTx(tx, { actorId: id, action: "USER_REGISTERED", entityType: "user", entityId: id, metadata: { role: input.role } });
    });

    return { user: toSessionUser(id, doc) };
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    const ident = input.identifier.trim().toLowerCase();
    // Pembatasan per-identifier (anti brute-force terarah); pembatasan per-IP ada di route.
    consume(`login-ident:${ident}`, 8, 15 * 60_000);

    const uKey = uniqueRef(ident.includes("@") ? "email" : "username", ident);
    const keySnap = await uKey.get();
    const userId = keySnap.data()?.userId as string | undefined;
    const userSnap = userId ? await db().collection(C.users).doc(userId).get() : null;
    const u = userSnap?.data() as UserDoc | undefined;

    if (!u || !userSnap) {
      await verifyAgainstDummy(input.password); // samakan waktu respons
      throw Errors.unauthorized("Username/email atau password salah.");
    }
    const ok = await verifyPassword(input.password, u.passwordHash);
    if (!ok) throw Errors.unauthorized("Username/email atau password salah.");
    // BR-012: akun nonaktif tidak bisa login (dicek setelah password benar → tidak membocorkan keberadaan akun)
    if (!u.isActive || u.deletedAt) throw Errors.forbidden("Akunmu sedang dinonaktifkan. Hubungi gurumu.");

    return issueSession(userSnap.id, u);
  },

  /** Rotasi refresh token + deteksi penggunaan ulang (token curian) → seluruh family dicabut. */
  async refresh(refreshToken: string): Promise<LoginResponse> {
    const claims = await verifyRefreshToken(refreshToken);
    const ref = db().collection(C.refreshTokens).doc(claims.jti);
    const userRef = db().collection(C.users).doc(claims.sub);

    const outcome = await db().runTransaction(async (tx) => {
      const [rSnap, uSnap] = await tx.getAll(ref, userRef);
      const r = rSnap.data() as RefreshDoc | undefined;
      const u = uSnap.data() as UserDoc | undefined;
      if (!r || r.userId !== claims.sub || r.revokedAt || r.expiresAt.toMillis() < Date.now()) return { kind: "invalid" as const };
      if (r.usedAt) return { kind: "reuse" as const, family: r.family };
      if (!u || !u.isActive || u.deletedAt) return { kind: "invalid" as const };
      tx.update(ref, { usedAt: ts() });
      return { kind: "ok" as const, family: r.family, user: u };
    });

    if (outcome.kind === "reuse") {
      await revokeFamily(outcome.family);
      await audit({ actorId: claims.sub, action: "REFRESH_TOKEN_REUSE", entityType: "user", entityId: claims.sub });
      throw Errors.unauthorized();
    }
    if (outcome.kind === "invalid") throw Errors.unauthorized();
    return issueSession(claims.sub, outcome.user, outcome.family);
  },

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const claims = await verifyRefreshToken(refreshToken);
      const snap = await db().collection(C.refreshTokens).doc(claims.jti).get();
      const fam = (snap.data() as RefreshDoc | undefined)?.family;
      if (fam) await revokeFamily(fam);
      invalidateUserCache(claims.sub);
    } catch {
      /* logout selalu dianggap sukses */
    }
  },

  async me(userId: string): Promise<SessionUser> {
    const snap = await db().collection(C.users).doc(userId).get();
    const u = snap.data() as UserDoc | undefined;
    if (!u || !u.isActive || u.deletedAt) throw Errors.unauthorized();
    return toSessionUser(snap.id, u);
  },
};
