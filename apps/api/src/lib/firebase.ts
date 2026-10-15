import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "@/config/env";

export { FieldValue, Timestamp };
export type { Firestore };

// Cache di globalThis agar tidak re-inisialisasi saat hot reload Next dev
// (Firestore.settings() hanya boleh dipanggil sekali).
const g = globalThis as unknown as { __deenDb?: Firestore };

function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const e = env();
  if (e.FIREBASE_PROJECT_ID && e.FIREBASE_CLIENT_EMAIL && e.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId: e.FIREBASE_PROJECT_ID,
        clientEmail: e.FIREBASE_CLIENT_EMAIL,
        privateKey: e.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: e.FIREBASE_PROJECT_ID ?? "deen-local" });
  }
  return initializeApp({ credential: applicationDefault(), projectId: e.FIREBASE_PROJECT_ID });
}

export function db(): Firestore {
  if (!g.__deenDb) {
    const fs = getFirestore(app());
    fs.settings({ ignoreUndefinedProperties: true });
    g.__deenDb = fs;
  }
  return g.__deenDb;
}

export const ts = (d: Date = new Date()) => Timestamp.fromDate(d);
export const toIso = (v: Timestamp | Date | null | undefined): string | null =>
  v ? (v instanceof Date ? v : v.toDate()).toISOString() : null;
