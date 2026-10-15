import { db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
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
