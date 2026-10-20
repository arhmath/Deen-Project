import { db } from "@/lib/firebase";
import { C } from "./collections";
import { sha256 } from "./ids";

export type UniqueType = "username" | "email" | "joinCode" | "courseSlug" | "linkCode";

/**
 * Firestore tidak punya UNIQUE index. Keunikan dijamin dengan dokumen `uniqueKeys/{type}_{sha256(value)}`
 * yang dibuat dengan `tx.create()` (gagal bila sudah ada) di transaksi yang sama dengan entitasnya.
 */
export const uniqueRef = (type: UniqueType, value: string) =>
  db().collection(C.uniqueKeys).doc(`${type}_${sha256(value.toLowerCase())}`);
