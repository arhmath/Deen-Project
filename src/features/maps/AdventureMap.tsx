import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "../../lib/clsx";
import { BookOpenIcon, CheckIcon, ClockIcon, TrophyIcon } from "../../components/ui/DashIcons";
import { CrownIcon, SparkleIcon, StarIcon } from "../../components/landing/DecorativeIcons";
import type { ContentListItem, CourseDetail, ModuleDetail } from "../../types/content";
import type { ContentType } from "../../types/learning";

const TYPE_ICON: Record<ContentType, typeof StarIcon> = {
  LESSON: BookOpenIcon,
  FLASHCARD: SparkleIcon,
  QUIZ: TrophyIcon,
  CHALLENGE: CrownIcon,
  VIDEO: ClockIcon,
};

const TYPE_LABEL: Record<ContentType, string> = {
  LESSON: "Pelajaran",
  FLASHCARD: "Kartu",
  QUIZ: "Kuis",
  CHALLENGE: "Tantangan",
  VIDEO: "Video",
};

/** Jarak vertikal antar pos (px) dan posisi horizontal zig-zag (% lebar jalur). */
const ROW = 128;
const X_STEPS = [50, 24, 50, 76];
const xOf = (i: number) => X_STEPS[i % X_STEPS.length];

/** Jalur putus-putus yang menyambung tiap pos lewat kurva halus. */
function buildPath(count: number): string {
  const pts = Array.from({ length: count }, (_, i) => ({ x: xOf(i), y: i * ROW + ROW / 2 }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const mid = (a.y + b.y) / 2;
    d += ` C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`;
  }
  return d;
}

type NodeState = "done" | "current" | "upcoming";
const stateOf = (c: ContentListItem): NodeState => (c.completed ? "done" : c.isNext ? "current" : "upcoming");

function Waypoint({ courseId, item, index }: { courseId: string; item: ContentListItem; index: number }) {
  const reduce = useReducedMotion();
  const state = stateOf(item);
  const Icon = TYPE_ICON[item.type];
  const left = xOf(index);

  return (
    <div
      className="absolute -translate-x-1/2"
      style={{ left: `${left}%`, top: index * ROW + 10, width: 132 }}
    >
      <div className="flex flex-col items-center">
        {state === "current" && (
          <motion.span
            aria-hidden="true"
            className="mb-1 rounded-full bg-brand-ink px-3 py-1 font-display text-xs font-extrabold text-white"
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          >
            Mulai di sini!
          </motion.span>
        )}
        <Link
          to={`/learning/${courseId}/content/${item.id}`}
          aria-label={`${item.title}. ${TYPE_LABEL[item.type]}, ${item.rewardXp} XP. ${
            state === "done" ? "Sudah selesai" : state === "current" ? "Langkah berikutnya" : "Belum dikerjakan"
          }`}
          className={clsx(
            "relative grid h-[68px] w-[68px] place-items-center rounded-full border-4 transition-transform",
            "hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue",
            state === "done" &&
              "border-brand-gold-dark bg-brand-gold text-brand-ink shadow-[0_5px_0_0_#cca300]",
            state === "current" &&
              "border-brand-purple-dark bg-brand-purple text-white shadow-[0_5px_0_0_#5B1FB0] ring-4 ring-brand-purple/25",
            state === "upcoming" && "border-brand-ink/15 bg-white text-brand-ink/45 shadow-[0_5px_0_0_rgba(35,19,52,0.10)]",
          )}
        >
          {state === "done" ? <CheckIcon className="h-8 w-8" strokeWidth={3} /> : <Icon className="h-7 w-7" aria-hidden="true" />}
          {state === "done" && (
            <StarIcon aria-hidden="true" className="absolute -right-2 -top-2 h-6 w-6 text-brand-amber drop-shadow" />
          )}
        </Link>
        <span className={clsx("mt-2 line-clamp-2 text-center font-display text-[13px] font-extrabold leading-tight", state === "upcoming" ? "text-brand-ink/55" : "text-brand-ink")}>
          {item.title}
        </span>
        <span className="text-[11px] font-bold text-brand-ink/50">
          {TYPE_LABEL[item.type]} · +{item.rewardXp} XP
        </span>
      </div>
    </div>
  );
}

function TreasureChest({ open, xp }: { open: boolean; xp: number }) {
  return (
    <div className="mt-2 flex flex-col items-center text-center">
      <div
        className={clsx(
          "grid h-16 w-16 place-items-center rounded-2xl border-4",
          open ? "border-brand-amber-dark bg-brand-amber text-white shadow-[0_5px_0_0_#cc8a00]" : "border-brand-ink/15 bg-brand-ink/5 text-brand-ink/35",
        )}
        role="img"
        aria-label={open ? "Peti harta modul terbuka" : "Peti harta modul masih terkunci"}
      >
        <CrownIcon className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-2 font-display text-sm font-extrabold text-brand-ink">{open ? "Modul tuntas! 🎉" : "Peti harta modul"}</p>
      <p className="text-xs font-semibold text-brand-ink/55">
        {open ? `Kamu sudah mengumpulkan ${xp} XP dari modul ini` : `Selesaikan semua pos untuk membukanya (${xp} XP)`}
      </p>
    </div>
  );
}

function Zone({ courseId, module: m, number }: { courseId: string; module: ModuleDetail; number: number }) {
  const done = m.contents.filter((c) => c.completed).length;
  const total = m.contents.length;
  const complete = total > 0 && done === total;
  const xp = m.contents.reduce((s, c) => s + c.rewardXp, 0);
  const tones = ["bg-brand-purple", "bg-brand-blue", "bg-brand-amber"];

  return (
    <section aria-labelledby={`zone-${m.id}`} className="mb-2">
      <div className={clsx("mx-auto mb-2 flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-white shadow-[0_4px_0_0_rgba(35,19,52,0.18)]", tones[(number - 1) % tones.length])}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/25 font-display text-lg font-extrabold">{number}</span>
        <div className="min-w-0 flex-1">
          <h2 id={`zone-${m.id}`} className="truncate font-display text-base font-extrabold">{m.title}</h2>
          <p className="text-xs font-semibold text-white/85">{done} dari {total} pos selesai</p>
        </div>
      </div>

      {total === 0 ? (
        <p className="py-8 text-center text-sm font-semibold text-brand-ink/55">Pos di modul ini belum disiapkan gurumu.</p>
      ) : (
        <>
          <div className="relative mx-auto max-w-md" style={{ height: total * ROW }}>
            <svg aria-hidden="true" viewBox={`0 0 100 ${total * ROW}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <path d={buildPath(total)} fill="none" stroke="rgba(35,19,52,0.18)" strokeWidth={6} strokeLinecap="round" strokeDasharray="1 14" vectorEffect="non-scaling-stroke" />
            </svg>
            {m.contents.map((c, i) => (
              <Waypoint key={c.id} courseId={courseId} item={c} index={i} />
            ))}
          </div>
          <TreasureChest open={complete} xp={xp} />
        </>
      )}
    </section>
  );
}

export function AdventureMap({ course }: { course: CourseDetail }) {
  const finished = course.totalContents > 0 && course.completedContents === course.totalContents;
  return (
    <div className="rounded-[2rem] border-2 border-brand-ink/10 bg-gradient-to-b from-brand-blue/10 via-brand-cream to-brand-amber/15 px-3 py-6 sm:px-6">
      <ol className="list-none">
        {course.modules.map((m, i) => (
          <li key={m.id} className="mb-8">
            <Zone courseId={course.id} module={m} number={i + 1} />
          </li>
        ))}
      </ol>

      <div className="flex flex-col items-center text-center">
        <div
          role="img"
          aria-label={finished ? "Petualangan selesai" : "Garis finis petualangan"}
          className={clsx(
            "grid h-20 w-20 place-items-center rounded-full border-4",
            finished ? "border-brand-amber-dark bg-brand-gold text-brand-ink shadow-[0_6px_0_0_#cca300]" : "border-brand-ink/15 bg-white text-brand-ink/35",
          )}
        >
          <TrophyIcon className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="mt-3 font-display text-lg font-extrabold text-brand-ink">{finished ? "Petualangan tamat! Hebat!" : "Garis finis"}</p>
        <p className="max-w-xs text-sm font-semibold text-brand-ink/55">
          {finished ? "Kamu sudah menyelesaikan semua pos di course ini." : "Selesaikan semua pos untuk menamatkan course ini."}
        </p>
      </div>
    </div>
  );
}
