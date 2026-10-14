import { useState } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { LeaderboardRow, RankBadge } from "../components/domain/LeaderboardRow";
import { ChevronLeftIcon, ChevronRightIcon, TrophyIcon } from "../components/ui/DashIcons";
import { useLeaderboard, useRooms } from "../features/dashboard/queries";
import { useSessionUser } from "../hooks/useSessionUser";
import { clsx } from "../lib/clsx";
import { formatNumber } from "../utils/format";

const PAGE_SIZE = 10;

export default function LeaderboardPage() {
  const user = useSessionUser();
  const showRooms = user.role !== "PARENT";
  const rooms = useRooms();
  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const q = useLeaderboard(roomId, page, PAGE_SIZE);

  const tabs = [{ id: undefined as string | undefined, name: "Global" }, ...(showRooms ? (rooms.data ?? []).map((r) => ({ id: r.id as string | undefined, name: r.name })) : [])];
  const totalPages = q.data ? Math.max(1, Math.ceil(q.data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Peringkat berdasarkan total XP. Makin rajin belajar, makin naik!" />

      {tabs.length > 1 && (
        <div role="tablist" aria-label="Cakupan leaderboard" className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = t.id === roomId;
            return (
              <button
                key={t.id ?? "global"}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => { setRoomId(t.id); setPage(1); }}
                className={clsx(
                  "rounded-full border-2 px-4 py-2 font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                  active ? "border-brand-purple bg-brand-purple text-white" : "border-brand-ink/10 bg-white text-brand-ink/70 hover:border-brand-purple/40"
                )}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-3 sm:p-4">
          {q.isPending ? (
            <div className="flex flex-col gap-2" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : q.isError ? (
            <ErrorState onRetry={() => q.refetch()} />
          ) : q.data.entries.length === 0 ? (
            <EmptyState icon={<TrophyIcon />} title="Belum ada peringkat" description="Peringkat akan muncul setelah santri mulai mengumpulkan XP." />
          ) : (
            <>
              <ol className={clsx("flex flex-col gap-1.5", q.isPlaceholderData && "opacity-60")} start={(page - 1) * PAGE_SIZE + 1}>
                {q.data.entries.map((e) => <LeaderboardRow key={e.studentId} entry={e} />)}
              </ol>
              <nav aria-label="Halaman leaderboard" className="mt-4 flex items-center justify-between">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} leftIcon={<ChevronLeftIcon className="h-4 w-4" />}>Sebelumnya</Button>
                <p className="text-sm font-bold text-brand-ink/60">Halaman {page} dari {totalPages}</p>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} rightIcon={<ChevronRightIcon className="h-4 w-4" />}>Berikutnya</Button>
              </nav>
            </>
          )}
        </Card>

        {user.role === "SANTRI" && (
          <aside aria-label="Posisimu" className="h-fit rounded-3xl border-2 border-brand-purple-dark bg-brand-purple p-5 text-white shadow-[0_6px_0_0_#5B1FB0] lg:sticky lg:top-24">
            {q.data?.me ? (
              <>
                <p className="font-display text-sm font-bold text-white/75">Posisimu {roomId ? "di room" : "secara global"}</p>
                <div className="mt-2 flex items-center gap-3">
                  <RankBadge rank={q.data.me.rank} />
                  <p className="font-display text-3xl font-extrabold">#{q.data.me.rank}</p>
                </div>
                <p className="mt-2 font-display font-bold text-brand-gold">{formatNumber(q.data.me.xp)} XP</p>
                <p className="mt-3 text-sm text-white/75">Check-in dan selesaikan pelajaran untuk naik peringkat.</p>
              </>
            ) : (
              <p className="text-sm text-white/80">Posisimu muncul di sini setelah kamu punya XP.</p>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
