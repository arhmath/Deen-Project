/**
 * Memuat dokumen knowledge base terkurasi ke Firestore (`knowledgeBase`) dari data/knowledge.json.
 *
 *   npx tsx scripts/seed-knowledge.ts            → dokumen disimpan dengan reviewed=false (TIDAK dipakai chatbot)
 *   npx tsx scripts/seed-knowledge.ts --approve  → reviewed=true (dipakai chatbot) — jalankan HANYA setelah ustadz/guru meninjau isinya
 *
 * Aturan Deen AI: materi keagamaan hanya boleh bersumber dari dokumen reviewed=true atau materi course guru.
 * Format tiap entri: { "id": "slug-unik", "title": "...", "text": "...", "roles": ["SANTRI","PARENT","ADMIN"] (opsional) }
 */
import { readFileSync } from "node:fs";
import { db, ts } from "../src/lib/firebase";
import { C } from "../src/shared/collections";
import { SAFE_ID } from "../src/shared/ids";

interface Entry { id: string; title: string; text: string; roles?: string[] }

async function main() {
  const approve = process.argv.includes("--approve");
  const file = process.argv.find((a) => a.endsWith(".json")) ?? "data/knowledge.json";
  const entries = JSON.parse(readFileSync(file, "utf8")) as Entry[];
  let n = 0;
  for (const e of entries) {
    // Entri contoh/template tidak boleh pernah disetujui (reviewed=true) — ganti dulu dengan teks yang sudah ditinjau.
    if (approve && e.id.startsWith("contoh-")) { console.warn(`Lewati (contoh/template, tidak disetujui): ${e.id}`); continue; }
    if (!SAFE_ID.test(e.id) || !e.title?.trim() || !e.text?.trim()) { console.warn(`Lewati entri tidak valid: ${e.id}`); continue; }
    await db().collection(C.knowledgeBase).doc(e.id).set(
      { title: e.title.trim(), text: e.text.trim(), roles: e.roles ?? [], reviewed: approve, updatedAt: ts(), ...(approve ? { reviewedAt: ts() } : {}) },
      { merge: true }
    );
    n++;
  }
  console.log(`${n} dokumen disimpan (reviewed=${approve}).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
