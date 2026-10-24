import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { ErrorState, PermissionDenied } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ChevronLeftIcon, BookOpenIcon, CheckIcon, ClockIcon, TrophyIcon } from "../../components/ui/DashIcons";
import { CrownIcon, SparkleIcon, StarIcon } from "../../components/landing/DecorativeIcons";
import { useCourse } from "../../features/dashboard/queries";
import { ApiError } from "../../services/api";
import type { ContentType } from "../../types/learning";

const TYPE: Record<ContentType, { label: string; icon: typeof StarIcon }> = {
  LESSON: { label: "Pelajaran", icon: BookOpenIcon },
  FLASHCARD: { label: "Kartu", icon: SparkleIcon },
  QUIZ: { label: "Kuis", icon: TrophyIcon },
  CHALLENGE: { label: "Tantangan", icon: CrownIcon },
  VIDEO: { label: "Video", icon: ClockIcon },
  ARTICLE: { label: "Artikel", icon: BookOpenIcon },
};

export default function CourseDetailPage() {
  const { courseId = "" } = useParams();
  const q = useCourse(courseId);

  if (q.isPending) return <div aria-busy="true" className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-72 rounded-3xl" /></div>;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 403) return <PermissionDenied message={q.error.message} />;
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return <ErrorState title={notFound ? "Course tidak ditemukan" : undefined} message={notFound ? "Course ini tidak ada atau belum dipublikasikan." : undefined} onRetry={notFound ? undefined : () => q.refetch()} />;
  }

  const c = q.data;
  return (
    <>
      <Link to="/learning" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple-fg hover:underline">
        <ChevronLeftIcon className="h-4 w-4" /> Semua pembelajaran
      </Link>
      <PageHeader title={c.title} subtitle={c.description} />

      <Card className="mb-6">
        <div className="mb-1.5 flex justify-between text-sm font-bold text-brand-ink/60">
          <span>{c.completedContents} dari {c.totalContents} materi selesai</span>
          <span>{c.progressPercent}%</span>
        </div>
        <ProgressBar value={c.progressPercent} label={`Progres ${c.title}`} tone={c.progressPercent === 100 ? "amber" : "purple"} size="lg" />
      </Card>

      <div className="flex flex-col gap-6">
        {c.modules.map((m, mi) => (
          <section key={m.id} aria-labelledby={m.id}>
            <CardTitle className="mb-3" id={m.id}>Modul {mi + 1}: {m.title}</CardTitle>
            <ul className="flex flex-col gap-2">
              {m.contents.map((ct) => {
                const { label, icon: Icon } = TYPE[ct.type];
                return (
                  <li key={ct.id}>
                    <Link
                      to={`/learning/${c.id}/content/${ct.id}`}
                      className="flex items-center gap-3 rounded-2xl border-2 border-brand-ink/10 bg-surface px-4 py-3 transition-colors hover:border-brand-purple/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ct.completed ? "bg-brand-amber/25 text-brand-amber-dark" : "bg-brand-purple/10 text-brand-purple-fg"}`}>
                        {ct.completed ? <CheckIcon className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display font-extrabold text-brand-ink">{ct.title}</span>
                        <span className="text-xs font-semibold text-brand-ink/55">
                          {label} · +{ct.rewardXp} XP{ct.completed && " · Selesai"}
                        </span>
                      </span>
                      {ct.isNext && <Badge tone="amber" className="px-3 py-1 text-xs">Lanjut</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
