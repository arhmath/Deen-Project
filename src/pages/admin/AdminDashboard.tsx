import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardTitle } from "../../components/ui/Card";
import { StatTile } from "../../components/domain/StatTile";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { UsersIcon, CheckIcon, ChartIcon, ClockIcon } from "../../components/ui/DashIcons";
import { useAdminOverview } from "../../features/dashboard/queries";
import { useSessionUser } from "../../hooks/useSessionUser";
import { greeting, timeAgo } from "../../utils/format";

export default function AdminDashboard() {
  const user = useSessionUser();
  const q = useAdminOverview();

  if (q.isPending) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;

  const o = q.data;
  const max = Math.max(1, ...o.activity.map((a) => a.activeStudents));

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name}`}
        subtitle="Ringkasan aktivitas santri di semua room kamu."
        actions={<Link to="/admin/monitoring"><Button size="sm" variant="outline">Buka monitoring</Button></Link>}
      />

      <ul className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Ringkasan">
        <li><StatTile icon={<UsersIcon />} iconClassName="bg-brand-purple/12 text-brand-purple" label="Total santri" value={o.totalStudents} hint={`${o.totalRooms} room`} /></li>
        <li><StatTile icon={<ClockIcon />} iconClassName="bg-brand-blue/15 text-brand-blue" label="Aktif hari ini" value={o.activeToday} /></li>
        <li><StatTile icon={<CheckIcon />} iconClassName="bg-brand-amber/20 text-brand-amber-dark" label="Check-in hari ini" value={o.checkInsToday} /></li>
        <li><StatTile icon={<ChartIcon />} iconClassName="bg-brand-gold/25 text-brand-gold-dark" label="Progres rata-rata" value={`${o.avgCourseProgress}%`} hint={`Skor rata-rata ${o.avgScore}`} /></li>
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Santri aktif 7 hari terakhir</CardTitle>
          <ul className="mt-6 flex h-52 items-end gap-2 sm:gap-3" aria-label="Grafik santri aktif per hari">
            {o.activity.map((a) => (
              <li key={a.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="font-display text-sm font-extrabold text-brand-ink">{a.activeStudents}</span>
                <span
                  className="w-full rounded-t-xl bg-brand-purple motion-safe:transition-[height] motion-safe:duration-700"
                  style={{ height: `${(a.activeStudents / max) * 80}%`, minHeight: 6 }}
                  title={`${a.activeStudents} aktif, ${a.checkIns} check-in`}
                />
                <span className="text-xs font-bold text-brand-ink/60">{a.label}</span>
                <span className="sr-only">{a.activeStudents} santri aktif, {a.checkIns} check-in</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Perlu perhatian</CardTitle>
          <p className="mb-3 text-sm text-brand-ink/60">Santri yang sudah 3 hari atau lebih tidak belajar.</p>
          {o.needsAttention.length === 0 ? (
            <EmptyState title="Semua santri aktif" description="Tidak ada santri yang tertinggal saat ini." />
          ) : (
            <ul className="flex flex-col gap-2">
              {o.needsAttention.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-brand-cream/70 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{s.name}</p>
                    <p className="truncate text-xs text-brand-ink/50">{s.roomName}</p>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-red-500">{timeAgo(s.lastActiveAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
