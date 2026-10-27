import type { DocumentData, DocumentSnapshot, Query } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Ambil banyak dokumen berdasarkan ID (urutan input dipertahankan, dokumen yang tidak ada dibuang). */
export async function getByIds<T = DocumentData>(collection: string, ids: string[]): Promise<{ id: string; data: T }[]> {
  const unique = [...new Set(ids)];
  if (!unique.length) return [];
  const refs = unique.map((id) => db().collection(collection).doc(id));
  const snaps: DocumentSnapshot[] = [];
  for (const part of chunk(refs, 300)) snaps.push(...(await db().getAll(...part)));
  return snaps.filter((s) => s.exists).map((s) => ({ id: s.id, data: s.data() as T }));
}

/** Query `in` dipecah per 30 nilai (batas Firestore) dan digabung. */
export async function queryIn<T = DocumentData>(
  build: (values: string[]) => Query,
  values: string[]
): Promise<{ id: string; data: T }[]> {
  const unique = [...new Set(values)];
  const out: { id: string; data: T }[] = [];
  for (const part of chunk(unique, 30)) {
    const snap = await build(part).get();
    snap.docs.forEach((d) => out.push({ id: d.id, data: d.data() as T }));
  }
  return out;
}

export async function countOf(q: Query): Promise<number> {
  return (await q.count().get()).data().count;
}
