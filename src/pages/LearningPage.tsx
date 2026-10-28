import { PageHeader } from "../components/layout/PageHeader";
import { CourseCard } from "../components/domain/CourseCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { BookOpenIcon } from "../components/ui/DashIcons";
import { useMyCourses } from "../features/dashboard/queries";
import { JoinRoomCard } from "../features/rooms/JoinRoomCard";

export default function LearningPage() {
  const q = useMyCourses();
  // Nama TPA/room tempat santri belajar, diambil dari course yang tampil.
  const roomNames = Array.from(new Set((q.data ?? []).map((c) => c.roomName).filter(Boolean)));
  return (
    <>
      <PageHeader
        title="Pembelajaran"
        subtitle="Semua course dari room yang kamu ikuti."
        actions={
          roomNames.length > 0 ? (
            <p
              className="max-w-full self-start rounded-full bg-brand-purple/12 px-4 py-1.5 text-right font-display text-sm font-extrabold uppercase tracking-wide text-brand-purple-fg"
              aria-label={`Kamu belajar di ${roomNames.join(", ")}`}
            >
              {roomNames.join(" · ")}
            </p>
          ) : undefined
        }
      />
      {q.isPending ? (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-52 rounded-3xl" />)}</div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState icon={<BookOpenIcon />} title="Belum ada pembelajaran." description="Gabung ke room gurumu dengan kode di bawah. Course yang sudah dipublikasikan muncul di sini." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {q.data.map((c) => <li key={c.id}><CourseCard course={c} /></li>)}
        </ul>
      )}
      <div className="mt-8 max-w-xl">
        <JoinRoomCard
          title={q.data && q.data.length > 0 ? "Gabung ke room lain" : "Gabung ke room gurumu"}
          hint="Punya kode gabung dari guru? Masukkan di sini."
        />
      </div>
    </>
  );
}
