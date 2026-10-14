import { PageHeader } from "../../components/layout/PageHeader";
import { ChildCard } from "../../components/domain/StudentProgress";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { UsersIcon } from "../../components/ui/DashIcons";
import { useParentStudents } from "../../features/dashboard/queries";

export default function ParentStudentsPage() {
  const q = useParentStudents();
  return (
    <>
      <PageHeader title="Monitoring anak" subtitle="Semua santri yang terhubung dengan akunmu." />
      {q.isPending ? (
        <div aria-busy="true" className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState icon={<UsersIcon />} title="Belum ada anak yang terhubung" description="Minta guru menghubungkan akun santri ke akunmu." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {q.data.map((k) => <li key={k.id}><ChildCard child={k} detailed /></li>)}
        </ul>
      )}
    </>
  );
}
