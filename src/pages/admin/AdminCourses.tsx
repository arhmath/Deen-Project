import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/domain/StatusBadge";
import { BookOpenIcon, PlusIcon } from "../../components/ui/DashIcons";
import { CreateCourseDialog } from "../../features/admin/CreateCourseDialog";
import { useAdminCourses, useDeleteCourse } from "../../features/admin/queries";
import { errorMessage } from "../../services/api";
import { clsx } from "../../lib/clsx";
import type { CourseAdminSummary } from "../../types/courseAdmin";
import type { CourseStatus } from "../../types/learning";

const FILTERS: { value: CourseStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Dipublikasikan" },
  { value: "ARCHIVED", label: "Diarsipkan" },
];

export default function AdminCourses() {
  const q = useAdminCourses();
  const del = useDeleteCourse();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<CourseAdminSummary | null>(null);

  // ?status=ARCHIVED membuka folder arsip langsung (dipakai setelah course diarsipkan dari editor)
  const requested = params.get("status");
  const filter: CourseStatus | "ALL" = FILTERS.some((f) => f.value === requested) ? (requested as CourseStatus | "ALL") : "ALL";
  const setFilter = (value: CourseStatus | "ALL") => setParams(value === "ALL" ? {} : { status: value }, { replace: true });

  const all = q.data ?? [];
  const archivedCount = all.filter((c) => c.status === "ARCHIVED").length;
  // "Semua" tidak mencakup arsip: arsip punya folder sendiri
  const list = all.filter((c) => (filter === "ALL" ? c.status !== "ARCHIVED" : c.status === filter));

  return (
    <>
      <PageHeader
        title="Pembelajaran"
        subtitle="Buat course, susun modul dan materi, lalu publikasikan ke room."
        actions={<Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setCreating(true)}>Buat course</Button>}
      />

      <div role="group" aria-label="Filter status" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              "rounded-full border-2 px-4 py-2 font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
              filter === f.value ? "border-brand-purple bg-brand-purple text-white" : "border-brand-ink/10 bg-surface text-brand-ink/70 hover:border-brand-purple/40"
            )}
          >
            {f.label}
            {f.value === "ARCHIVED" && archivedCount > 0 && <span className="ml-1.5 opacity-70">({archivedCount})</span>}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div aria-busy="true" className="grid gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon />}
          title={filter === "ALL" ? "Belum ada course" : filter === "ARCHIVED" ? "Arsip masih kosong" : "Tidak ada course dengan status ini"}
          description={filter === "ALL" ? "Buat course pertamamu untuk salah satu room." : filter === "ARCHIVED" ? "Course yang kamu arsipkan akan muncul di sini." : "Coba ubah filter status."}
          action={filter === "ALL" ? <Button size="sm" onClick={() => setCreating(true)}>Buat course</Button> : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((c) => (
            <li key={c.id}>
              <Card className="flex flex-wrap items-center gap-x-5 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-extrabold text-brand-ink">
                    <Link to={`/admin/courses/${c.id}`} className="hover:text-brand-purple-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
                      {c.title}
                    </Link>
                  </h2>
                  <p className="truncate text-sm text-brand-ink/55">{c.roomName} · {c.moduleCount} modul · {c.contentCount} materi</p>
                </div>
                <StatusBadge status={c.status} />
                <Link to={`/admin/courses/${c.id}`} className="font-display text-sm font-bold text-brand-purple-fg hover:underline">
                  {c.status === "ARCHIVED" ? "Buka / pulihkan" : "Edit"}
                </Link>
                {c.status === "ARCHIVED" && (
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { del.reset(); setToDelete(c); }}>Hapus</Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus course ini?"
        message={del.isError ? errorMessage(del.error) : `“${toDelete?.title ?? "Course"}” akan dihapus dari arsip dan tidak bisa dikembalikan.`}
        confirmLabel="Hapus"
        isLoading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
      <CreateCourseDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
