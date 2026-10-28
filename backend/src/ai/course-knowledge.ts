import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { courseService } from "@/modules/courses/course.service";
import { loadStructure } from "@/modules/courses/course.structure";
import { activeChildIds } from "@/modules/parent/parent.service";
import { progressService } from "@/modules/progress/progress.service";
import type { AuthUser } from "@/modules/users/user.types";
import { chunkText } from "./retriever";
import type { Chunk } from "./types";

const MAX_COURSES = 12;
const MAX_CONTENTS = 150;

function extractText(value: unknown, depth = 0): string[] {
  if (depth > 5 || value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((v) => extractText(v, depth + 1));
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap((v) => extractText(v, depth + 1));
  return [];
}

/**
 * Materi course yang BOLEH dibaca user ini — dipakai sebagai konteks RAG:
 * SANTRI → course published di room aktifnya; PARENT → idem untuk anak terhubung; ADMIN → course miliknya.
 * Konten QUIZ tidak diindeks untuk santri/orang tua (mencegah chatbot membocorkan kunci jawaban).
 */
export async function loadCourseChunks(user: AuthUser): Promise<Chunk[]> {
  let courses: { id: string; title: string; description: string }[] = [];
  const includeAll = (user.role === "ADMIN" || user.role === "SUPERADMIN");

  if (user.role === "SANTRI") {
    courses = await progressService.coursesForStudent(user.id);
  } else if (user.role === "PARENT") {
    const kids = await activeChildIds(user.id);
    const lists = await Promise.all(kids.map((k) => progressService.coursesForStudent(k)));
    const seen = new Map(lists.flat().map((c) => [c.id, c]));
    courses = [...seen.values()];
  } else {
    const list = await courseService.list(user, {});
    courses = list.map((c) => ({ id: c.id, title: c.title, description: c.description ?? "" }));
  }

  const chunks: Chunk[] = [];
  let contentCount = 0;
  for (const course of courses.slice(0, MAX_COURSES)) {
    const { contents } = await loadStructure(course.id, { publishedOnly: !includeAll });
    chunks.push(...chunkText({ id: `course:${course.id}`, title: course.title, type: "course" }, course.description ?? ""));
    for (const c of contents) {
      if (contentCount++ >= MAX_CONTENTS) return chunks;
      if (c.type === "QUIZ" && !includeAll) continue;
      const text = [c.description ?? "", ...extractText(c.body)].join("\n\n").slice(0, 4000);
      chunks.push(...chunkText({ id: `content:${c.id}`, title: `${course.title} › ${c.title}`, type: "course" }, text || c.title));
    }
  }
  return chunks;
}

/** Dokumen knowledge base terkurasi (Firestore `knowledgeBase`) — hanya yang reviewed=true. */
export async function loadCuratedChunks(role: string): Promise<Chunk[]> {
  const snap = await db().collection(C.knowledgeBase).where("reviewed", "==", true).limit(300).get();
  const out: Chunk[] = [];
  for (const d of snap.docs) {
    const x = d.data() as { title?: string; text?: string; roles?: string[] };
    if (!x.title || !x.text) continue;
    if (x.roles?.length && !x.roles.includes(role)) continue;
    out.push(...chunkText({ id: `kb:${d.id}`, title: x.title, type: "knowledge" }, x.text));
  }
  return out;
}

