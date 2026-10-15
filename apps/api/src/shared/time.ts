import { env } from "@/config/env";

/**
 * Semua "tanggal" bisnis (check-in, streak, aktivitas harian) memakai kunci kalender
 * YYYY-MM-DD pada zona waktu aplikasi (default Asia/Jakarta), BUKAN UTC.
 */
export function dayKey(d: Date = new Date(), tz: string = env().APP_TIMEZONE): string {
  // locale en-CA menghasilkan format YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

const toUtc = (key: string) => {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
};

const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(key: string, n: number): string {
  return fromUtc(toUtc(key) + n * 86_400_000);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** 0 = Minggu … 6 = Sabtu */
export function weekdayOf(key: string): number {
  return new Date(toUtc(key)).getUTCDay();
}

/** Senin pada minggu yang memuat `key` (minggu dimulai Senin, sama dengan UI). */
export function mondayOf(key: string): string {
  return addDays(key, -((weekdayOf(key) + 6) % 7));
}

export const WEEK_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

export const clock = { now: () => new Date() };
