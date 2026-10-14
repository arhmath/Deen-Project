import type { LeaderboardEntry } from "../../types/leaderboard";
import { clsx } from "../../lib/clsx";
import { formatNumber, initials } from "../../utils/format";

const MEDAL = ["bg-brand-gold text-brand-ink", "bg-brand-ink/15 text-brand-ink", "bg-brand-amber-dark/70 text-white"];

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={clsx(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold",
        rank <= 3 ? MEDAL[rank - 1] : "bg-brand-ink/6 text-brand-ink/70"
      )}
    >
      <span className="sr-only">Peringkat </span>{rank}
    </span>
  );
}

export function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li
      aria-current={entry.isMe ? "true" : undefined}
      className={clsx(
        "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5",
        entry.isMe ? "border-brand-purple bg-brand-purple/8" : "border-transparent bg-white"
      )}
    >
      <RankBadge rank={entry.rank} />
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue/15 font-display text-sm font-extrabold text-brand-blue-dark" aria-hidden="true">
        {initials(entry.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-extrabold text-brand-ink">
          {entry.name}
          {entry.isMe && <span className="ml-2 rounded-full bg-brand-purple px-2 py-0.5 text-xs text-white">Kamu</span>}
        </p>
        <p className="text-xs text-brand-ink/55">Level {entry.level}</p>
      </div>
      <p className="shrink-0 font-display text-sm font-extrabold text-brand-ink">{formatNumber(entry.xp)} XP</p>
    </li>
  );
}
