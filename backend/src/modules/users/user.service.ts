import { db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { generateStudentLinkCode } from "@/shared/ids";
import { uniqueRef } from "@/shared/unique";
import { gamRef } from "../gamification/gamification.repository";
import type { UpdateProfileInput } from "../auth/auth.schema";
import { invalidateUserCache } from "../auth/session";
import { toSessionUser, type SessionUser, type UserDoc } from "./user.types";

export const userService = {
  async getMe(userId: string): Promise<SessionUser> {
    const snap = await db().collection(C.users).doc(userId).get();
    const u = snap.data() as UserDoc | undefined;
    if (!u) throw Errors.notFound("Pengguna");
    return toSessionUser(snap.id, u);
  },

  async getLinkCode(userId: string): Promise<{ code: string }> {
    const ref = db().collection(C.users).doc(userId);
    const now = ts();
    return db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const u = snap.data() as UserDoc | undefined;
      if (!u) throw Errors.notFound("Pengguna");

      let code = (u.linkCode ?? "").trim().toUpperCase();
      if (!code) {
        for (let attempt = 0; attempt < 12; attempt++) {
          const candidate = generateStudentLinkCode();
          const key = uniqueRef("linkCode", candidate);
          if ((await tx.get(key)).exists) continue;
          tx.update(ref, { linkCode: candidate, updatedAt: now });
          tx.create(key, { userId: userId, type: "linkCode", createdAt: now });
          code = candidate;
          break;
        }
      }
      if (!code) throw Errors.unavailable("Gagal membuat kode profil santri. Coba lagi.");
      return { code };
    });
  },

  async updateMe(userId: string, input: UpdateProfileInput): Promise<SessionUser> {
    const ref = db().collection(C.users).doc(userId);
    const now = ts();
    return db().runTransaction(async (tx) => {
      const [uSnap, gSnap] = await tx.getAll(ref, gamRef(userId));
      const u = uSnap.data() as UserDoc | undefined;
      if (!u) throw Errors.notFound("Pengguna");
      const patch: Partial<UserDoc> = { updatedAt: now };
      if (input.name !== undefined) patch.name = input.name;
      if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl;
      tx.update(ref, patch);
      // nama didenormalisasi ke read model leaderboard
      if (input.name !== undefined && gSnap.exists) tx.update(gamRef(userId), { name: input.name });
      invalidateUserCache(userId);
      return toSessionUser(userId, { ...u, ...patch } as UserDoc);
    });
  },
};
