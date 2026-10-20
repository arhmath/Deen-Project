import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import type { AuthUser, UserDoc } from "../users/user.types";
import { verifyAccessToken } from "./tokens";

/**
 * Cache singkat per-instance supaya tidak membaca Firestore di setiap request,
 * tetapi akun yang dinonaktifkan tetap terblokir dalam ≤ TTL (BR-012).
 */
const TTL_MS = 30_000;
const cache = new Map<string, { user: AuthUser; exp: number }>();

export function invalidateUserCache(userId?: string) {
  if (userId) cache.delete(userId);
  else cache.clear();
}

/** Identitas & role SELALU dari token terverifikasi + DB — tidak pernah dari body/query. */
export async function authenticate(token: string): Promise<AuthUser> {
  const claims = await verifyAccessToken(token);
  const hit = cache.get(claims.sub);
  if (hit && hit.exp > Date.now()) return hit.user;

  const snap = await db().collection(C.users).doc(claims.sub).get();
  const u = snap.data() as UserDoc | undefined;
  if (!u || !u.isActive || u.deletedAt) throw Errors.unauthorized();

  const user: AuthUser = { id: snap.id, role: u.role };
  cache.set(claims.sub, { user, exp: Date.now() + TTL_MS });
  return user;
}
