import type { LevelProgress } from "../../types/gamification";
import { ProgressBar } from "../ui/ProgressBar";
import { formatNumber } from "../../utils/format";

export function XPProgress({ level, xp, onDark = false }: { level: LevelProgress; xp: number; onDark?: boolean }) {
  const muted = onDark ? "text-white/75" : "text-brand-ink/60";
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <p className={`font-display text-sm font-bold ${muted}`}>
          {formatNumber(xp)} XP
        </p>
        <p className={`font-display text-sm font-bold ${muted}`}>
          {level.xpToNext === null
            ? "Level tertinggi!"
            : `${formatNumber(level.xpToNext)} XP lagi ke Level ${level.level + 1}`}
        </p>
      </div>
      <ProgressBar
        value={level.percent}
        label={`Progres XP menuju level berikutnya, ${level.percent} persen`}
        tone="gold"
        size="lg"
        onDark={onDark}
        className="mt-2"
      />
    </div>
  );
}
