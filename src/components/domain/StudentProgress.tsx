import { Link } from "react-router-dom";
import type { StudentProgress } from "../../types/monitoring";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { FlameIcon } from "../landing/DecorativeIcons";
import { ArrowRightIcon } from "../ui/DashIcons";
import { formatNumber, initials, timeAgo } from "../../utils/format";

export function ChildCard({ child, detailed = false }: { child: StudentProgress; detailed?: boolean }) {
  return (
    <article className="flex flex-col rounded-3xl border-2 border-brand-ink/10 bg-surface p-5 shadow-[0_4px_0_0_rgba(35,19,52,0.06)]">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-purple font-display text-lg font-extrabold text-white" aria-hidden="true">
          {initials(child.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-extrabold text-brand-ink">{child.name}</h3>
          <p className="truncate text-sm text-brand-ink/55">{child.roomName}</p>
        </div>
        <Badge tone={child.checkedInToday ? "amber" : "cream"}>
          {child.checkedInToday ? "Sudah check-in" : "Belum check-in"}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-brand-cream p-2.5">
          <dt className="text-xs font-semibold text-brand-ink/55">Level</dt>
          <dd className="font-display text-lg font-extrabold">{child.level}</dd>
        </div>
        <div className="rounded-2xl bg-brand-cream p-2.5">
          <dt className="text-xs font-semibold text-brand-ink/55">XP</dt>
          <dd className="font-display text-lg font-extrabold">{formatNumber(child.xp)}</dd>
        </div>
        <div className="rounded-2xl bg-brand-cream p-2.5">
          <dt className="text-xs font-semibold text-brand-ink/55">Streak</dt>
          <dd className="flex items-center justify-center gap-1 font-display text-lg font-extrabold">
            <FlameIcon className="h-4 w-4 text-brand-amber" aria-hidden="true" />{child.streak}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs font-bold text-brand-ink/60">
          <span>Progres belajar</span><span>{child.courseProgress}%</span>
        </div>
        <ProgressBar value={child.courseProgress} label={`Progres belajar ${child.name}`} tone="blue" />
      </div>

      {detailed && (
        <p className="mt-3 text-sm text-brand-ink/65">
          Skor rata-rata <strong className="font-extrabold text-brand-ink">{child.avgScore}</strong> · {formatNumber(child.point)} point
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <p className="text-xs text-brand-ink/50">Aktif {timeAgo(child.lastActiveAt)}</p>
        <Link
          to={`/parent/students/${child.id}`}
          className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-brand-purple-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          Lihat detail <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
