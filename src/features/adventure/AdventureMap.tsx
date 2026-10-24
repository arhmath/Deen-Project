import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { AdventureNode, AdventureRegion } from "../../types/adventure";
import type { ContentType } from "../../types/learning";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { BookOpenIcon, CheckIcon } from "../../components/ui/DashIcons";
import { CrownIcon, SparkleIcon, StarIcon } from "../../components/landing/DecorativeIcons";
import { clsx } from "../../lib/clsx";
import { MAP_WIDTH, labelSide, layoutRegion, pathUpTo } from "./layout";

const TYPE: Record<ContentType, { label: string; icon: typeof StarIcon }> = {
  LESSON: { label: "Pelajaran", icon: BookOpenIcon },
  FLASHCARD: { label: "Kartu", icon: SparkleIcon },
  QUIZ: { label: "Kuis", icon: StarIcon },
  CHALLENGE: { label: "Tantangan", icon: CrownIcon },
  VIDEO: { label: "Video", icon: BookOpenIcon },
  ARTICLE: { label: "Artikel", icon: BookOpenIcon },
};

/** Tema warna bergilir antar wilayah. */
const THEMES = [
  { banner: "bg-brand-purple text-white border-brand-purple-dark shadow-[0_5px_0_0_#5B1FB0]", zone: "from-brand-purple/8", bar: "gold" as const },
  { banner: "bg-brand-blue text-white border-brand-blue-dark shadow-[0_5px_0_0_#0072B8]", zone: "from-brand-blue/10", bar: "gold" as const },
  { banner: "bg-brand-amber text-night border-brand-amber-dark shadow-[0_5px_0_0_#CC8A00]", zone: "from-brand-amber/12", bar: "purple" as const },
];

type NodeState = "done" | "current" | "upcoming";
const stateOf = (n: AdventureNode, isCurrent: boolean): NodeState =>
  n.completed ? "done" : n.isNext && isCurrent ? "current" : "upcoming";
const STATE_LABEL: Record<NodeState, string> = { done: "selesai", current: "berikutnya", upcoming: "belum dikerjakan" };

function NodeLink({
  region,
  node,
  x,
  y,
  height,
  initial,
  isCurrent,
  currentRef,
}: {
  region: AdventureRegion;
  node: AdventureNode;
  x: number;
  y: number;
  height: number;
  initial: string;
  isCurrent: boolean;
  currentRef: React.RefObject<HTMLAnchorElement | null>;
}) {
  const state = stateOf(node, isCurrent);
  const { icon: Icon, label } = TYPE[node.type];
  const side = labelSide(x);
  return (
    <Link
      ref={state === "current" ? currentRef : undefined}
      to={`/learning/${region.courseId}/content/${node.id}`}
      aria-label={`${label}: ${node.title}, ${STATE_LABEL[state]}, ${node.rewardXp} XP`}
      aria-current={state === "current" ? "step" : undefined}
      className={clsx(
        "group absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 transition-transform",
        "hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue",
        state === "done" && "border-brand-amber-dark bg-brand-amber text-night shadow-[0_4px_0_0_#CC8A00]",
        state === "current" && "border-brand-purple-dark bg-brand-purple text-white shadow-[0_5px_0_0_#5B1FB0]",
        state === "upcoming" && "border-brand-ink/15 bg-surface text-brand-ink/45 shadow-[0_4px_0_0_rgba(35,19,52,0.08)]"
      )}
      style={{ left: `${(x / MAP_WIDTH) * 100}%`, top: `${(y / height) * 100}%` }}
    >
      {state === "current" && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-purple/40 motion-safe:animate-ping" />}
      <Icon className="relative h-6 w-6" aria-hidden="true" />
      {state === "done" && (
        <span aria-hidden="true" className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-surface bg-night text-brand-amber">
          <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.5} />
        </span>
      )}
      {state === "current" && (
        <span aria-hidden="true" className="absolute -top-12 left-1/2 -translate-x-1/2">
          <span className="flex flex-col items-center motion-safe:animate-float">
            <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-surface bg-brand-gold font-display text-base font-extrabold text-night shadow-md">{initial}</span>
            <span className="-mt-1.5 h-2.5 w-2.5 rotate-45 bg-brand-gold" />
          </span>
        </span>
      )}
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none absolute top-1/2 w-28 -translate-y-1/2 font-display text-xs font-bold leading-snug",
          side === "right" ? "left-full ml-3 text-left" : "right-full mr-3 text-right",
          state === "upcoming" ? "text-brand-ink/50" : "text-brand-ink"
        )}
      >
        {node.title}
        <span className="block font-body text-[11px] font-semibold text-brand-ink/50">+{node.rewardXp} XP</span>
      </span>
    </Link>
  );
}

function Region({
  region,
  index,
  initial,
  isCurrent,
  currentRef,
}: {
  region: AdventureRegion;
  index: number;
  initial: string;
  isCurrent: boolean;
  currentRef: React.RefObject<HTMLAnchorElement | null>;
}) {
  const theme = THEMES[index % THEMES.length]!;
  const { points, height } = layoutRegion(region.nodes.length);
  const currentIdx = region.nodes.findIndex((n) => n.isNext);
  const doneUntil = region.completed ? points.length - 1 : currentIdx >= 0 ? currentIdx : 0;
  const rewardPoint = points[points.length - 1]!;

  return (
    <section aria-labelledby={`region-${region.courseId}`} className="flex flex-col items-center">
      <div className={clsx("w-full max-w-md rounded-3xl border-2 p-5", theme.banner)}>
        <p className="font-display text-xs font-bold uppercase tracking-wide opacity-80">Wilayah {index + 1}</p>
        <h2 id={`region-${region.courseId}`} className="font-display text-2xl font-extrabold leading-tight">{region.title}</h2>
        <div className="mt-3 flex items-center justify-between text-sm font-bold">
          <span>{region.completedContents} dari {region.totalContents} materi</span>
          <span>{region.progressPercent}%</span>
        </div>
        <ProgressBar value={region.progressPercent} label={`Progres wilayah ${region.title}`} tone={theme.bar} size="lg" onDark className="mt-1.5" />
        <Link
          to={`/learning/${region.courseId}`}
          className="mt-3 inline-block rounded-lg font-display text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Lihat daftar materi
        </Link>
      </div>

      <div className={clsx("relative mt-2 w-full max-w-sm rounded-3xl bg-gradient-to-b to-transparent", theme.zone)} style={{ aspectRatio: `${MAP_WIDTH} / ${height}` }}>
        <svg viewBox={`0 0 ${MAP_WIDTH} ${height}`} className="absolute inset-0 h-full w-full text-brand-ink" aria-hidden="true" focusable="false">
          <path d={pathUpTo(points, points.length - 1)} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 18" />
          {doneUntil > 0 && <path d={pathUpTo(points, doneUntil)} fill="none" stroke="#FFAD00" strokeWidth="10" strokeLinecap="round" />}
        </svg>

        <ol className="contents">
          {region.nodes.map((n, i) => (
            <li key={n.id} className="contents">
              <NodeLink region={region} node={n} x={points[i]!.x} y={points[i]!.y} height={height} initial={initial} isCurrent={isCurrent} currentRef={currentRef} />
            </li>
          ))}
          <li className="contents">
            <Link
              to={`/learning/${region.courseId}`}
              aria-label={`Hadiah course ${region.title}, ${region.completed ? "sudah didapat" : "didapat setelah semua materi selesai"}, ${region.courseRewardXp} XP`}
              className={clsx(
                "absolute grid h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl border-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue",
                region.completed
                  ? "border-brand-gold-dark bg-brand-gold text-night shadow-[0_5px_0_0_#CCA300]"
                  : "border-dashed border-brand-ink/25 bg-surface text-brand-ink/40"
              )}
              style={{ left: `${(rewardPoint.x / MAP_WIDTH) * 100}%`, top: `${(rewardPoint.y / height) * 100}%` }}
            >
              <CrownIcon className="h-9 w-9" aria-hidden="true" />
              <span aria-hidden="true" className="absolute -bottom-6 whitespace-nowrap font-display text-xs font-extrabold text-brand-ink">
                {region.completed ? "Selesai!" : `Hadiah +${region.courseRewardXp} XP`}
              </span>
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}

export function AdventureMap({ regions, initial }: { regions: AdventureRegion[]; initial: string }) {
  const currentRef = useRef<HTMLAnchorElement | null>(null);

  // gulir ke posisi petualang saat peta pertama kali tampil
  useEffect(() => {
    const el = currentRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, []);

  // hanya satu "posisi sekarang": wilayah yang sedang berjalan, atau yang pertama belum selesai
  const currentRegion =
    regions.find((r) => !r.completed && r.completedContents > 0) ?? regions.find((r) => !r.completed);

  return (
    <div className="flex flex-col gap-14 pb-10">
      {regions.map((r, i) => (
        <Region
          key={r.courseId}
          region={r}
          index={i}
          initial={initial}
          isCurrent={r.courseId === currentRegion?.courseId}
          currentRef={currentRef}
        />
      ))}
    </div>
  );
}
