import { createHash, randomInt, randomUUID } from "node:crypto";

export const newId = () => randomUUID();

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** ID path-aman (mencegah path injection ke dokumen Firestore). */
export const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function docId(...parts: string[]): string {
  for (const p of parts) if (!SAFE_ID.test(p)) throw new Error("ID tidak valid");
  return parts.join("_");
}

// Tanpa 0/O/1/I/L agar mudah diketik anak-anak.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateJoinCode(len = 8): string {
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "course"
  );
}
