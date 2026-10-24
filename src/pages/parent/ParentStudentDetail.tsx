import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardTitle } from "../../components/ui/Card";
import { StatTile } from "../../components/domain/StatTile";
import { RewardList } from "../../components/domain/RewardList";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { ErrorState, PermissionDenied } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { CoinIcon, ChevronLeftIcon, TrophyIcon } from "../../components/ui/DashIcons";
import { FlameIcon, StarIcon } from "../../components/landing/DecorativeIcons";
import { useParentStudent } from "../../features/dashboard/queries";
import { ApiError } from "../../services/api";
import { formatNumber, timeAgo } from "../../utils/format";

export default function ParentStudentDetail() {
  const { studentId = "" } = useParams();
  const q = useParentStudent(studentId);

  if (q.isPending) return <div aria-busy="true" className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-72" /></div>;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 403) return <PermissionDenied message={q.error.message} />;
    return <ErrorState message={q.error instanceof ApiError ? q.error.message : undefined} onRetry={() => q.refetch()} />;
  }

  const { student: s, courses, recentRewards, quizScores } = q.data;

  return (
    <>
      <Link to="/parent" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple-fg hover:underline">
        <ChevronLeftIcon className="h-4 w-4" /> Semua anak
      </Link>
      <PageHeader title={s.name} subtitle={`${s.roomName} · Level ${s.level} ${s.levelName} · aktif ${timeAgo(s.lastActiveAt)}`} />

      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Statistik">
        <li><StatTile icon={<StarIcon />} iconClassName="bg-brand-gold/25 text-brand-gold-dark" label="XP" value={formatNumber(s.xp)} /></li>
        <li><StatTile icon={<CoinIcon />} iconClassName="bg-brand-blue/15 text-brand-blue" label="Point" value={formatNumber(s.point)} /></li>
        <li><StatTile icon={<FlameIcon />} iconClassName="bg-brand-amber/20 text-brand-amber-dark" label="Streak" value={`${s.streak} hari`} hint={s.checkedInToday ? "Sudah check-in hari ini" : "Belum check-in hari ini"} /></li>
        <li><StatTile icon={<TrophyIcon />} iconClassName="bg-brand-purple/12 text-brand-purple-fg" label="Skor rata-rata" value={s.avgScore} /></li>
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Progres course</CardTitle>
          <ul className="flex flex-col gap-4">
            {courses.map((c) => (
              <li key={c.id}>
                <div className="mb-1.5 flex justify-between gap-3 text-sm">
                  <span className="font-bold text-brand-ink">{c.title}</span>
                  <span className="shrink-0 font-bold text-brand-ink/60">{c.completedContents}/{c.totalContents}</span>
                </div>
                <ProgressBar value={c.progressPercent} label={`Progres ${c.title}`} tone={c.progressPercent === 100 ? "amber" : "purple"} />
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardTitle className="mb-3">Skor kuis terakhir</CardTitle>
            <ul className="flex flex-col gap-2">
              {quizScores.map((qz) => (
                <li key={qz.id} className="flex items-center justify-between gap-3 rounded-2xl bg-brand-cream/70 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{qz.title}</p>
                    <p className="text-xs text-brand-ink/50">{timeAgo(qz.takenAt)}</p>
                  </div>
                  <p className="font-display text-lg font-extrabold text-brand-purple-fg">{qz.score}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle className="mb-3">Reward terbaru</CardTitle>
            <RewardList items={recentRewards} />
          </Card>
        </div>
      </div>
    </>
  );
}
