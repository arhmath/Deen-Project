type Level = "info" | "warn" | "error";

const REDACT = /(password|token|secret|authorization|api[_-]?key|private[_-]?key)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT.test(k) ? "[REDACTED]" : sanitize(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** Log JSON satu baris. Tidak pernah mencatat password/token/API key. */
export function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({ level, time: new Date().toISOString(), msg, ...(sanitize(fields) as object) });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const logger = {
  info: (msg: string, f?: Record<string, unknown>) => log("info", msg, f),
  warn: (msg: string, f?: Record<string, unknown>) => log("warn", msg, f),
  error: (msg: string, f?: Record<string, unknown>) => log("error", msg, f),
};
