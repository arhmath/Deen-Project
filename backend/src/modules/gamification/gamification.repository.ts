import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue, db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { docId, sha256 } from "@/shared/ids";
import type { PlannedReward } from "./gamification.logic";
import { SOURCE_TO_EVENT, type UserGamificationDoc } from "./gamification.types";

export const gamRef = (userId: string) => db().collection(C.userGamification).doc(userId);

/** ID ledger deterministik → `create()` ganda untuk (user, key) yang sama mustahil (BR-010). */
export const ledgerRef = (userId: string, idempotencyKey: string): DocumentReference =>
  db().collection(C.gamificationTransactions).doc(docId(userId, sha256(idempotencyKey).slice(0, 40)));

export function activityRef(userId: string, date: string) {
  return db().collection(C.dailyActivity).doc(docId(userId, date));
}

/** Tandai user aktif pada tanggal tertentu (read model monitoring admin). */
export function touchActivityInTx(
  tx: Transaction,
  userId: string,
  date: string,
  roomIds: string[],
  opts: { checkedIn?: boolean } = {}
) {
  tx.set(
    activityRef(userId, date),
    {
      userId,
      date,
      roomIds,
      updatedAt: ts(),
      actions: FieldValue.increment(1),
      ...(opts.checkedIn ? { checkedIn: true } : {}),
    },
    { merge: true }
  );
}

/** Tulis baris ledger (append-only). Pemanggil sudah memastikan key belum ada. */
export function writeLedgerInTx(tx: Transaction, userId: string, r: PlannedReward, now: ReturnType<typeof ts>) {
  tx.create(ledgerRef(userId, r.idempotencyKey), {
    userId,
    eventType: SOURCE_TO_EVENT[r.source],
    xpDelta: r.xp,
    pointDelta: r.point,
    referenceType: r.referenceType,
    referenceId: r.referenceId,
    idempotencyKey: r.idempotencyKey,
    description: r.label,
    createdAt: now,
  });
}

export async function getGamificationDoc(userId: string): Promise<UserGamificationDoc | null> {
  const snap = await gamRef(userId).get();
  return snap.exists ? (snap.data() as UserGamificationDoc) : null;
}
