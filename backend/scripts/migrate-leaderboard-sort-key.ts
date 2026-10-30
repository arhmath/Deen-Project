import { pathToFileURL } from "node:url";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "../src/lib/firebase";
import { C } from "../src/shared/collections";
import { buildSortKey } from "../src/modules/gamification/gamification.logic";

/**
 * Migrasi sortKey lama (points sebagai prioritas) ke format baru (XP sebagai
 * prioritas). Harus dijalankan satu kali setelah deploy kode leaderboard baru.
 * Aman dijalankan ulang; hanya memperbarui sortKey, tidak mengubah saldo XP/points.
 */
export async function migrateLeaderboardSortKeys() {
  const collection = db().collection(C.userGamification);
  const pageSize = 400;
  let cursor: QueryDocumentSnapshot | undefined;
  let scanned = 0;
  let updated = 0;

  while (true) {
    let query = collection.orderBy("__name__").limit(pageSize);
    if (cursor) query = query.startAfter(cursor);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    const batch = db().batch();
    let pageUpdated = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userId = String(data.userId ?? doc.id);
      const xp = Number(data.totalXp ?? 0);
      const points = Number(data.totalPoints ?? 0);
      const updatedAt = data.updatedAt;
      const updatedAtMs = typeof updatedAt?.toMillis === "function"
        ? updatedAt.toMillis()
        : 0;

      if (!Number.isFinite(xp) || !Number.isFinite(points)) {
        throw new Error(`Saldo XP/points tidak valid pada userGamification/${doc.id}; migrasi dihentikan.`);
      }

      const sortKey = buildSortKey(points, xp, updatedAtMs, userId);
      if (data.sortKey !== sortKey) {
        batch.update(doc.ref, { sortKey });
        updated++;
        pageUpdated++;
      }
    }

    if (pageUpdated > 0) await batch.commit();
    scanned += snapshot.size;
    cursor = snapshot.docs[snapshot.docs.length - 1];
    console.log(`Diproses ${scanned} dokumen; ${updated} sortKey diperbarui.`);
    if (snapshot.size < pageSize) break;
  }

  return { scanned, updated };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrateLeaderboardSortKeys()
    .then((result) => console.log("Migrasi leaderboard selesai:", result))
    .catch((error) => {
      console.error("Migrasi leaderboard gagal:", error);
      process.exitCode = 1;
    });
}
