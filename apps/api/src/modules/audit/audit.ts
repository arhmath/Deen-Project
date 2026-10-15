import type { Transaction } from "firebase-admin/firestore";
import { db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { newId } from "@/shared/ids";
import { logger } from "@/shared/logger";

export interface AuditInput {
  actorId: string | null;
  action: string; // mis. "ROOM_CREATED", "PARENT_LINK_APPROVED"
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

const doc = (a: AuditInput) => ({ ...a, metadata: a.metadata ?? {}, createdAt: ts() });

/** Tulis audit log di dalam transaksi (append-only). */
export function auditInTx(tx: Transaction, a: AuditInput) {
  tx.set(db().collection(C.auditLogs).doc(newId()), doc(a));
}

/** Audit best-effort di luar transaksi: kegagalan audit tidak boleh menggagalkan request. */
export async function audit(a: AuditInput): Promise<void> {
  try {
    await db().collection(C.auditLogs).doc(newId()).set(doc(a));
  } catch (err) {
    logger.error("audit_failed", { action: a.action, err: err instanceof Error ? err.message : String(err) });
  }
}
