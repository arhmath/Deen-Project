import { Link } from "react-router-dom";
import type { CourseSummary } from "../../types/learning";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { ArrowRightIcon, CheckIcon } from "../ui/DashIcons";

const TYPE_LABEL = { LESSON: "Pelajaran", QUIZ: "Kuis", FLASHCARD: "Kartu", CHALLENGE: "Tantangan", VIDEO: "Video" } as const;

export function CourseCard({ course }: { course: CourseSummary }) {
  const done = course.progressPercent === 100;
  const started = course.progressPercent > 0;
  const next = course.nextContent;
  const href = next ? `/learning/${course.id}/content/${next.id}` : `/learning/${course.id}`;
  return (
    <article className="flex h-full flex-col rounded-3xl border-2 border-brand-ink/10 bg-surface p-5 shadow-[0_4px_0_0_rgba(35,19,52,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-extrabold leading-snug text-brand-ink">
          <Link to={`/learning/${course.id}`} className="hover:text-brand-purple-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
            {course.title}
          </Link>
        </h3>
        {done && (
          <Badge tone="amber" icon={<CheckIcon className="h-4 w-4" />}>Selesai</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-brand-ink/60">{course.description}</p>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs font-bold text-brand-ink/60">
          <span>{course.completedContents} dari {course.totalContents} materi</span>
          <span>{course.progressPercent}%</span>
        </div>
        <ProgressBar value={course.progressPercent} label={`Progres ${course.title}`} tone={done ? "amber" : "purple"} />
      </div>
      <div className="mt-auto pt-4">
        <Link
          to={href}
          className="inline-flex items-center gap-2 rounded-xl font-display text-sm font-bold text-brand-purple-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          {done ? "Ulangi materi" : started && next ? `Lanjut: ${TYPE_LABEL[next.type]}` : "Mulai belajar"}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
