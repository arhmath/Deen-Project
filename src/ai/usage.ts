import { env } from "@/config/env";
import { FieldValue, db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { logger } from "@/shared/logger";
import { addDays, dayKey, zonedStartOfDay } from "@/shared/time";
import type { TokenUsage, UsageSnapshot } from "./types";

/**
 * Anggaran token LLM per user per hari (kalender APP_TIMEZONE). Dokumen: aiUsage/{userId}_{YYYY-MM-DD}.
 * Pengecekan dilakukan sebelum memanggil LLM dan pencatatan sesudahnya, sehingga permintaan yang
 * berjalan bersamaan bisa melampaui batas sedikit (dibatasi rate limit 5 pesan/10 detik per user).
 */
export const usageDocId = (userId: string, day: string) => `${userId}_${day}`;

/** null = tanpa batas (AI_DAILY_TOKEN_LIMIT=0). */
export function dailyLimit(): number | null {
  const n = env().AI_DAILY_TOKEN_LIMIT;
  return n > 0 ? n : null;
}

export function makeSnapshot(used: number, limit: number | null, now: Date = new Date()): UsageSnapshot {
  const tz = env().APP_TIMEZONE;
  const resets = zonedStartOfDay(addDays(dayKey(now, tz), 1), tz);
  return { used, limit, remaining: limit === null ? null : Math.max(0, limit - used), resets_at: resets.toISOString() };
}

export const isExhausted = (s: UsageSnapshot | null): boolean => !!s && s.remaining !== null && s.remaining <= 0;

/** Pemakaian hari ini. null bila Firestore gagal dibaca (pemanggil memutuskan; orkestrator memilih tetap melayani). */
export async function readUsage(userId: string): Promise<UsageSnapshot | null> {
  try {
    const snap = await db().collection(C.aiUsage).doc(usageDocId(userId, dayKey())).get();
    const used = Number((snap.data() as { totalTokens?: number } | undefined)?.totalTokens ?? 0);
    return makeSnapshot(Number.isFinite(used) ? used : 0, dailyLimit());
  } catch (err) {
    logger.warn("ai_usage_read_failed", { reason: err instanceof Error ? err.message : "unknown" });
    return null;
  }
}

export async function recordUsage(userId: string, u: TokenUsage): Promise<void> {
  try {
    const day = dayKey();
    await db().collection(C.aiUsage).doc(usageDocId(userId, day)).set(
      {
        userId, day, requests: FieldValue.increment(1), updatedAt: ts(),
        promptTokens: FieldValue.increment(u.prompt),
        completionTokens: FieldValue.increment(u.completion),
        totalTokens: FieldValue.increment(u.total),
      },
      { merge: true }
    );
  } catch (err) {
    logger.warn("ai_usage_write_failed", { reason: err instanceof Error ? err.message : "unknown" });
  }
}
