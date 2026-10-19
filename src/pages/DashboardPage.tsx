import { Link, Navigate } from "react-router-dom";
import { useSessionUser } from "../hooks/useSessionUser";
import { useSantriDashboard } from "../features/dashboard/queries";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardTitle } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { StatTile } from "../components/domain/StatTile";
import { RewardList } from "../components/domain/RewardList";
import { CourseCard } from "../components/domain/CourseCard";
import { XPProgress } from "../components/domain/XPProgress";
import { CheckInCard } from "../features/gamification/CheckInCard";
import { MiniLeaderboard } from "../features/dashboard/MiniLeaderboard";
import { JoinRoomCard } from "../features/rooms/JoinRoomCard";
import { CoinIcon, TrophyIcon, BookOpenIcon } from "../components/ui/DashIcons";
import { FlameIcon, SparkleIcon } from "../components/landing/DecorativeIcons";
import { formatNumber, greeting } from "../utils/format";
import ParentOverview from "./parent/ParentOverview";

function SantriSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat dashboard" className="grid gap-6 lg:grid-cols-[1fr_21rem]">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-48 rounded-3xl" />
      </div>
      <div className="flex flex-col gap-6"><Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>
    </div>
  );
}

function SantriDashboard() {
  const user = useSessionUser();
  const q = useSantriDashboard();
  const firstName = user.name.split(" ")[0];

  if (q.isPending) return <SantriSkeleton />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;

  const { gamification: g, rank, recentRewards, continueLearning, stats } = q.data;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}!`}
        subtitle={g.checkedInToday ? "Hari ini sudah check-in. Yuk lanjut belajar!" : "Check-in dulu, lalu lanjut petualangan belajarmu."}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Level */}
          <section aria-labelledby="level-title" className="relative overflow-hidden rounded-3xl border-2 border-brand-purple-dark bg-brand-purple p-6 text-white shadow-[0_6px_0_0_#5B1FB0]">
            <SparkleIcon className="absolute right-6 top-5 h-6 w-6 text-brand-gold motion-safe:animate-twinkle" aria-hidden="true" />
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-brand-gold bg-brand-purple-dark" aria-hidden="true">
                <span className="text-center font-display leading-none">
                  <span className="block text-xs font-bold text-white/70">Level</span>
                  <span className="block text-3xl font-extrabold">{g.level.level}</span>
                </span>
              </div>
              <div>
                <h2 id="level-title" className="font-display text-2xl font-extrabold">{g.level.name}</h2>
                <p className="text-sm text-white/75">Level {g.level.level}</p>
              </div>
            </div>
            <div className="mt-6"><XPProgress level={g.level} xp={g.xp} onDark /></div>
          </section>

          {/* Statistik */}
          <ul className="grid gap-3 sm:grid-cols-3" aria-label="Statistik">
            <li><StatTile icon={<CoinIcon />} iconClassName="bg-brand-blue/15 text-brand-blue" label="Point" value={formatNumber(g.point)} /></li>
            <li><StatTile icon={<FlameIcon />} iconClassName="bg-brand-amber/20 text-brand-amber-dark" label="Streak" value={`${g.streak} hari`} hint={`Rekor ${g.longestStreak} hari`} /></li>
            <li><StatTile icon={<TrophyIcon />} iconClassName="bg-brand-purple/12 text-brand-purple" label="Peringkat" value={rank.position ? `#${rank.position}` : "-"} hint={`dari ${rank.total} santri`} /></li>
          </ul>

          {/* Lanjutkan belajar */}
          <section aria-labelledby="continue-title">
            <h2 id="continue-title" className="mb-3 font-display text-lg font-extrabold">Lanjutkan belajar</h2>
            {continueLearning ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
                <CourseCard course={continueLearning} />
                <div className="grid grid-cols-2 gap-3 sm:w-44 sm:grid-cols-1">
                  <StatTile icon={<BookOpenIcon />} iconClassName="bg-brand-blue/15 text-brand-blue" label="Course selesai" value={stats.coursesCompleted} />
                  <StatTile icon={<TrophyIcon />} iconClassName="bg-brand-gold/25 text-brand-gold-dark" label="Skor rata-rata" value={stats.avgScore} />
                </div>
              </div>
            ) : q.data.roomCount === 0 ? (
              <JoinRoomCard />
            ) : (
              <EmptyState
                title="Belum ada pembelajaran"
                description="Gurumu belum mempublikasikan course di room kamu. Coba lagi nanti ya."
                action={<Link to="/learning"><Button size="sm" variant="outline">Lihat pembelajaran</Button></Link>}
              />
            )}
          </section>

          <MiniLeaderboard />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <CheckInCard gamification={g} />
          <Card>
            <CardTitle className="mb-3">Reward terbaru</CardTitle>
            <RewardList items={recentRewards} />
          </Card>
        </div>
      </div>
    </>
  );
}

/** /dashboard menyesuaikan role dari sesi server. */
export default function DashboardPage() {
  const user = useSessionUser();
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "PARENT") return <ParentOverview />;
  return <SantriDashboard />;
}
