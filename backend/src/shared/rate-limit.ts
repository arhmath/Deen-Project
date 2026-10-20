import { Errors } from "./errors";

export interface RateRule {
  /** nama bucket, mis. "login" */
  name: string;
  limit: number;
  windowMs: number;
  /** identitas yang dibatasi: ip (default untuk route publik) atau user */
  by?: "ip" | "user";
}

/**
 * Sliding-window limiter in-memory.
 * CATATAN: state hidup per instance server. Pada deployment multi-instance/serverless,
 * ganti store-nya (mis. Upstash Redis) — antarmuka `consume` tetap sama.
 */
const hits = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, arr] of hits) {
    const fresh = arr.filter((t) => now - t < 5 * 60_000);
    if (fresh.length) hits.set(k, fresh);
    else hits.delete(k);
  }
}

export function consume(key: string, limit: number, windowMs: number, now = Date.now()): void {
  sweep(now);
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    const retryAfterMs = windowMs - (now - arr[0]!);
    hits.set(key, arr);
    throw Errors.tooMany(retryAfterMs / 1000);
  }
  arr.push(now);
  hits.set(key, arr);
}

export function resetRateLimits() {
  hits.clear();
}
