import { Link } from "react-router-dom";
import { Card, CardTitle } from "../../components/ui/Card";
import { LeaderboardRow } from "../../components/domain/LeaderboardRow";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useLeaderboard } from "./queries";

export function MiniLeaderboard() {
  const q = useLeaderboard(undefined, 1, 5);
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>Papan peringkat</CardTitle>
        <Link to="/leaderboard" className="text-sm font-bold text-brand-purple hover:underline">Lihat semua</Link>
      </div>
      {q.isPending ? (
        <div className="flex flex-col gap-2"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : q.data.entries.length === 0 ? (
        <EmptyState title="Belum ada peringkat" description="Peringkat muncul setelah ada santri yang mengumpulkan XP." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {q.data.entries.map((e) => <LeaderboardRow key={e.studentId} entry={e} />)}
          {q.data.me && q.data.me.rank > 5 && (
            <>
              <li aria-hidden="true" className="text-center text-brand-ink/30">⋮</li>
              <LeaderboardRow entry={q.data.me} />
            </>
          )}
        </ul>
      )}
    </Card>
  );
}
