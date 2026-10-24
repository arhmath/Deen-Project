import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorState, PermissionDenied } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/domain/StatusBadge";
import { fieldCls, iconBtnCls, labelCls } from "../../components/ui/fieldStyles";
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, PlusIcon, TrashIcon } from "../../components/ui/DashIcons";
import { FlashcardEditor, LessonEditor, QuizEditor } from "../../features/admin/ContentEditors";
import { useAdminCourse, useSaveCourse } from "../../features/admin/queries";
import { ApiError, errorMessage } from "../../services/api";
import { clsx } from "../../lib/clsx";
import { newId } from "../../utils/id";
import { timeAgo } from "../../utils/format";
import type { ContentDoc, CourseDoc, EditableContentType } from "../../types/courseAdmin";
import type { CourseStatus } from "../../types/learning";

const TYPE_LABEL: Record<EditableContentType, string> = { LESSON: "Pelajaran", FLASHCARD: "Kartu", QUIZ: "Kuis" };

function blankContent(type: EditableContentType): ContentDoc {
  return {
    id: newId("ct"),
    type,
    title: type === "LESSON" ? "Pelajaran baru" : type === "FLASHCARD" ? "Kartu baru" : "Kuis baru",
    sections: type === "LESSON" ? [{ heading: "", text: "" }] : [],
    cards: type === "FLASHCARD" ? [{ id: newId("k"), front: "", back: "" }] : [],
    questions:
      type === "QUIZ"
        ? [{ id: newId("q"), text: "", options: [{ id: "a", text: "" }, { id: "b", text: "" }], correctOptionId: "", explanation: "" }]
        : [],
  };
}

function move<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return;
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item!);
}

interface Pending {
  title: string;
  message: string;
  confirmLabel: string;
  run: () => void;
}

function Editor({ course }: { course: CourseDoc }) {
  const [doc, setDoc] = useState<CourseDoc>(course);
  const [dirty, setDirty] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const save = useSaveCourse(course.id);

  // peringatan sebelum menutup tab bila masih ada perubahan yang belum disimpan
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function edit(fn: (d: CourseDoc) => void) {
    setDoc((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
    setNotice(null);
  }

  const editContent = (contentId: string) => (fn: (c: ContentDoc) => void) =>
    edit((d) => {
      for (const m of d.modules) {
        const c = m.contents.find((x) => x.id === contentId);
        if (c) return fn(c);
      }
    });

  function submit(status: CourseStatus, okMessage: string) {
    save.mutate({ ...doc, status }, {
      onSuccess: (res) => {
        setDoc(res);
        setDirty(false);
        setNotice(okMessage);
      },
    });
  }

  const totalContents = doc.modules.reduce((a, m) => a + m.contents.length, 0);

  return (
    <>
      <Link to="/admin/courses" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple-fg hover:underline">
        <ChevronLeftIcon className="h-4 w-4" /> Semua course
      </Link>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={doc.status} />
          <p className="text-sm text-brand-ink/60">{doc.roomName} · {doc.modules.length} modul · {totalContents} materi · diubah {timeAgo(doc.updatedAt)}</p>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="course-title" className={labelCls}>Judul course</label>
            <input id="course-title" value={doc.title} onChange={(e) => edit((d) => { d.title = e.target.value; })} maxLength={120} className={clsx(fieldCls, "font-display text-lg font-extrabold")} />
          </div>
          <div>
            <label htmlFor="course-desc" className={labelCls}>Deskripsi</label>
            <textarea id="course-desc" rows={2} value={doc.description} onChange={(e) => edit((d) => { d.description = e.target.value; })} maxLength={500} className={fieldCls} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={!dirty} isLoading={save.isPending} onClick={() => submit(doc.status, "Perubahan tersimpan.")}>Simpan</Button>
          {doc.status !== "PUBLISHED" && (
            <Button size="sm" variant="secondary" isLoading={save.isPending} onClick={() => submit("PUBLISHED", "Course dipublikasikan. Santri di room ini sekarang bisa membukanya.")}>Publikasikan</Button>
          )}
          {doc.status === "PUBLISHED" && (
            <Button size="sm" variant="outline" isLoading={save.isPending} onClick={() => submit("DRAFT", "Course dikembalikan ke draft. Santri tidak bisa melihatnya.")}>Jadikan draft</Button>
          )}
          {doc.status !== "ARCHIVED" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPending({
                title: "Arsipkan course?",
                message: "Course yang diarsipkan tidak terlihat oleh santri. Kamu bisa mempublikasikannya lagi nanti.",
                confirmLabel: "Arsipkan",
                run: () => submit("ARCHIVED", "Course diarsipkan."),
              })}
            >
              Arsipkan
            </Button>
          )}
          {dirty && <span className="text-sm font-bold text-brand-amber-dark">Ada perubahan yang belum disimpan</span>}
        </div>

        <div aria-live="polite" className="mt-3">
          {save.isError && (
            <p role="alert" className="whitespace-pre-line rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {save.error instanceof ApiError ? save.error.message : errorMessage(save.error)}
            </p>
          )}
          {notice && !save.isError && <p className="rounded-2xl bg-brand-purple/8 px-4 py-3 text-sm font-bold text-brand-purple-fg">{notice}</p>}
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        {doc.modules.map((m, mi) => (
          <section key={m.id} aria-label={`Modul ${mi + 1}`} className="rounded-3xl border-2 border-brand-ink/10 bg-surface/70 p-4 sm:p-5">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor={`mod-${m.id}`} className={labelCls}>Modul {mi + 1}</label>
                <input id={`mod-${m.id}`} value={m.title} onChange={(e) => edit((d) => { d.modules[mi]!.title = e.target.value; })} className={fieldCls} />
              </div>
              <button type="button" className={iconBtnCls} aria-label={`Naikkan modul ${mi + 1}`} disabled={mi === 0} onClick={() => edit((d) => move(d.modules, mi, mi - 1))}><ArrowUpIcon className="h-4 w-4" /></button>
              <button type="button" className={iconBtnCls} aria-label={`Turunkan modul ${mi + 1}`} disabled={mi === doc.modules.length - 1} onClick={() => edit((d) => move(d.modules, mi, mi + 1))}><ArrowDownIcon className="h-4 w-4" /></button>
              <button
                type="button"
                className={iconBtnCls}
                aria-label={`Hapus modul ${mi + 1}`}
                onClick={() => setPending({
                  title: `Hapus modul ${mi + 1}?`,
                  message: m.contents.length ? `Modul ini berisi ${m.contents.length} materi yang ikut terhapus.` : "Modul ini kosong.",
                  confirmLabel: "Hapus modul",
                  run: () => edit((d) => { d.modules.splice(mi, 1); }),
                })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {m.contents.map((c, ci) => {
                const open = openId === c.id;
                return (
                  <li key={c.id} className="rounded-2xl border-2 border-brand-ink/10 bg-surface">
                    <div className="flex flex-wrap items-center gap-2 p-2.5">
                      <span className="rounded-full bg-brand-purple/10 px-2.5 py-1 font-display text-xs font-bold text-brand-purple-fg">{TYPE_LABEL[c.type]}</span>
                      <label htmlFor={`ct-${c.id}`} className="sr-only">Judul materi</label>
                      <input id={`ct-${c.id}`} value={c.title} onChange={(e) => editContent(c.id)((x) => { x.title = e.target.value; })} className={clsx(fieldCls, "min-w-40 flex-1 py-1.5")} />
                      <Button type="button" size="sm" variant={open ? "primary" : "outline"} aria-expanded={open} onClick={() => setOpenId(open ? null : c.id)}>
                        {open ? "Tutup" : "Isi materi"}
                      </Button>
                      <button type="button" className={iconBtnCls} aria-label={`Naikkan materi ${c.title}`} disabled={ci === 0} onClick={() => edit((d) => move(d.modules[mi]!.contents, ci, ci - 1))}><ArrowUpIcon className="h-4 w-4" /></button>
                      <button type="button" className={iconBtnCls} aria-label={`Turunkan materi ${c.title}`} disabled={ci === m.contents.length - 1} onClick={() => edit((d) => move(d.modules[mi]!.contents, ci, ci + 1))}><ArrowDownIcon className="h-4 w-4" /></button>
                      <button
                        type="button"
                        className={iconBtnCls}
                        aria-label={`Hapus materi ${c.title}`}
                        onClick={() => setPending({
                          title: "Hapus materi?",
                          message: `“${c.title}” akan dihapus dari course ini.`,
                          confirmLabel: "Hapus materi",
                          run: () => edit((d) => { d.modules[mi]!.contents.splice(ci, 1); }),
                        })}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {open && (
                      <div className="border-t-2 border-brand-ink/10 bg-brand-cream/50 p-4">
                        {c.type === "LESSON" && <LessonEditor content={c} update={editContent(c.id)} />}
                        {c.type === "FLASHCARD" && <FlashcardEditor content={c} update={editContent(c.id)} />}
                        {c.type === "QUIZ" && <QuizEditor content={c} update={editContent(c.id)} />}
                      </div>
                    )}
                  </li>
                );
              })}
              {m.contents.length === 0 && <li className="rounded-2xl border-2 border-dashed border-brand-ink/15 px-4 py-5 text-center text-sm text-brand-ink/55">Modul ini belum punya materi.</li>}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Tambah materi ke modul ${mi + 1}`}>
              {(["LESSON", "FLASHCARD", "QUIZ"] as EditableContentType[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => {
                    const fresh = blankContent(t);
                    edit((d) => { d.modules[mi]!.contents.push(fresh); });
                    setOpenId(fresh.id);
                  }}
                >
                  {TYPE_LABEL[t]}
                </Button>
              ))}
            </div>
          </section>
        ))}

        <div>
          <Button type="button" variant="outline" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => edit((d) => { d.modules.push({ id: newId("m"), title: `Modul ${d.modules.length + 1}`, contents: [] }); })}>
            Tambah modul
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        title={pending?.title ?? ""}
        message={pending?.message ?? ""}
        confirmLabel={pending?.confirmLabel}
        onCancel={() => setPending(null)}
        onConfirm={() => { pending?.run(); setPending(null); }}
      />
    </>
  );
}

export default function AdminCourseEditor() {
  const { courseId = "" } = useParams();
  const q = useAdminCourse(courseId);

  if (q.isPending) return <div aria-busy="true" className="grid gap-4"><Skeleton className="h-48 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 403) return <PermissionDenied message={q.error.message} />;
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return <ErrorState title={notFound ? "Course tidak ditemukan" : undefined} message={notFound ? "Course ini tidak ada." : undefined} onRetry={notFound ? undefined : () => q.refetch()} />;
  }
  return <Editor key={q.data.id} course={q.data} />;
}
