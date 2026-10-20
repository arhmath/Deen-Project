import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import type { ContentDoc, ModuleDoc, WithId } from "./course.types";

const byOrder = <T extends { orderIndex: number; createdAt: { toMillis(): number } }>(a: T, b: T) =>
  a.orderIndex - b.orderIndex || a.createdAt.toMillis() - b.createdAt.toMillis();

export interface CourseStructure {
  modules: WithId<ModuleDoc>[];
  /** konten terurut (modul → urutan konten) */
  contents: WithId<ContentDoc>[];
}

export async function loadStructure(courseId: string, opts: { publishedOnly: boolean }): Promise<CourseStructure> {
  const [mSnap, cSnap] = await Promise.all([
    db().collection(C.courseModules).where("courseId", "==", courseId).get(),
    db().collection(C.contents).where("courseId", "==", courseId).get(),
  ]);
  const modules = mSnap.docs.map((d) => ({ id: d.id, ...(d.data() as ModuleDoc) })).sort(byOrder);
  const modOrder = new Map(modules.map((m, i) => [m.id, i]));
  let contents = cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as ContentDoc) }));
  if (opts.publishedOnly) contents = contents.filter((c) => c.isPublished);
  contents.sort((a, b) => (modOrder.get(a.moduleId) ?? 0) - (modOrder.get(b.moduleId) ?? 0) || byOrder(a, b));
  return { modules, contents };
}
