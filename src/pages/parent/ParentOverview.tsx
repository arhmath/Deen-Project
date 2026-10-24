import { PageHeader } from "../../components/layout/PageHeader";
import { StatTile } from "../../components/domain/StatTile";
import { ChildCard } from "../../components/domain/StudentProgress";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { UsersIcon, ChartIcon, CheckIcon } from "../../components/ui/DashIcons";
import { useParentStudents } from "../../features/dashboard/queries";
import { LinkChildCard } from "../../features/parent/LinkChildCard";
import { useSessionUser } from "../../hooks/useSessionUser";
import { greeting } from "../../utils/format";

export default function ParentOverview() {
  const user = useSessionUser();
  const q = useParentStudents();

  if (q.isPending) {
    return (
      <div aria-busy="true" className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-64 sm:col-span-2" />
      </div>
    );
  }
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;

  const kids = q.data;
  const checked = kids.filter((k) => k.checkedInToday).length;
  const avg = kids.length ? Math.round(kids.reduce((a, k) => a + k.courseProgress, 0) / kids.length) : 0;

  return (
    <>
      <PageHeader title={`${greeting()}, ${user.name}`} subtitle="Pantau perkembangan belajar anak-anakmu hari ini." />
      {kids.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <EmptyState
            icon={<UsersIcon />}
            title="Belum ada anak yang terhubung"
            description="Hubungkan akun anakmu dengan kode dari halaman Profil mereka, lalu perkembangannya tampil di sini."
          />
          <LinkChildCard />
        </div>
      ) : (
        <>
          <ul className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Ringkasan">
            <li><StatTile icon={<UsersIcon />} iconClassName="bg-brand-purple/12 text-brand-purple-fg" label="Anak terhubung" value={kids.length} /></li>
            <li><StatTile icon={<CheckIcon />} iconClassName="bg-brand-amber/20 text-brand-amber-dark" label="Sudah check-in hari ini" value={`${checked} dari ${kids.length}`} /></li>
            <li><StatTile icon={<ChartIcon />} iconClassName="bg-brand-blue/15 text-brand-blue" label="Rata-rata progres" value={`${avg}%`} /></li>
          </ul>
          <ul className="grid gap-4 md:grid-cols-2">
            {kids.map((k) => <li key={k.id}><ChildCard child={k} /></li>)}
          </ul>
        </>
      )}
    </>
  );
}
