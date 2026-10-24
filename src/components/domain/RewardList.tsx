import type { RewardEntry, RewardSource } from "../../types/gamification";
import { BookIcon, CrownIcon, FlameIcon, StarIcon } from "../landing/DecorativeIcons";
import { EmptyState } from "../ui/EmptyState";
import { timeAgo } from "../../utils/format";

const ICON: Record<RewardSource, { icon: typeof StarIcon; cls: string }> = {
  DAILY_CHECKIN: { icon: FlameIcon, cls: "bg-brand-amber/20 text-brand-amber-dark" },
  LESSON: { icon: BookIcon, cls: "bg-brand-blue/15 text-brand-blue-dark" },
  QUIZ: { icon: StarIcon, cls: "bg-brand-gold/25 text-brand-gold-dark" },
  PERFECT_QUIZ: { icon: StarIcon, cls: "bg-brand-purple/15 text-brand-purple-fg" },
  CHALLENGE: { icon: CrownIcon, cls: "bg-brand-purple/15 text-brand-purple-fg" },
  COURSE: { icon: CrownIcon, cls: "bg-brand-amber/25 text-brand-amber-dark" },
};

export function RewardList({ items }: { items: RewardEntry[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Belum ada reward"
        description="Selesaikan pelajaran atau check-in harian untuk mengumpulkan XP, dan kerjakan kuis untuk mendapat point."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((r) => {
        const { icon: Icon, cls } = ICON[r.source];
        return (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-brand-cream/70 px-3 py-2.5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${cls}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-ink">{r.label}</p>
              <p className="text-xs text-brand-ink/50">{timeAgo(r.createdAt)}</p>
            </div>
            <p className="shrink-0 font-display text-sm font-extrabold text-brand-purple-fg">
              +{r.xp} XP
              {r.point > 0 && <span className="block text-xs text-brand-gold-dark">+{r.point} Point</span>}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
