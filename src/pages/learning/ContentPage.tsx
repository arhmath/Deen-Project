import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState, PermissionDenied } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { ChevronLeftIcon, ChevronRightIcon } from "../../components/ui/DashIcons";
import { useContent } from "../../features/dashboard/queries";
import { LessonView } from "../../features/learning/LessonView";
import { FlashcardView } from "../../features/learning/FlashcardView";
import { QuizView } from "../../features/learning/QuizView";
import { ApiError } from "../../services/api";

const TYPE_LABEL = { LESSON: "Pelajaran", QUIZ: "Kuis", FLASHCARD: "Kartu belajar", CHALLENGE: "Tantangan", VIDEO: "Video" } as const;

export default function ContentPage() {
  const { courseId = "", contentId = "" } = useParams();
  const q = useContent(contentId);

  if (q.isPending) return <div aria-busy="true" className="mx-auto grid max-w-2xl gap-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64 rounded-3xl" /></div>;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 403) return <PermissionDenied message={q.error.message} />;
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title={notFound ? "Materi tidak ditemukan" : undefined}
          message={notFound ? "Materi ini tidak ada atau sudah dipindahkan." : undefined}
          onRetry={notFound ? undefined : () => q.refetch()}
        />
      </div>
    );
  }

  const c = q.data;
  const base = `/learning/${c.courseId}/content`;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/learning/${courseId || c.courseId}`} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple-fg hover:underline">
        <ChevronLeftIcon className="h-4 w-4" /> {c.courseTitle}
      </Link>

      <header className="mb-5">
        <p className="font-display text-sm font-bold text-brand-ink/55">
          {TYPE_LABEL[c.type]} · Materi {c.position.index} dari {c.position.total} · +{c.rewardXp} XP
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight text-brand-ink">{c.title}</h1>
      </header>

      {/* key → state view ter-reset saat pindah materi */}
      {c.type === "LESSON" && <LessonView key={c.id} content={c} />}
      {c.type === "FLASHCARD" && <FlashcardView key={c.id} content={c} />}
      {c.type === "QUIZ" && <QuizView key={c.id} content={c} />}
      {(c.type === "CHALLENGE" || c.type === "VIDEO") && (
        <Card>
          <EmptyState title="Tipe materi ini belum tersedia" description="Materi jenis ini akan hadir pada pembaruan berikutnya." />
        </Card>
      )}

      <nav aria-label="Navigasi materi" className="mt-8 flex items-center justify-between gap-3">
        {c.prevId ? (
          <ButtonLink to={`${base}/${c.prevId}`} variant="outline" className="px-4 py-2 text-sm">
            <ChevronLeftIcon className="h-4 w-4" /> Sebelumnya
          </ButtonLink>
        ) : <span />}
        {c.nextId ? (
          <ButtonLink to={`${base}/${c.nextId}`} variant={c.completed ? "primary" : "outline"} className="px-4 py-2 text-sm">
            Materi berikutnya <ChevronRightIcon className="h-4 w-4" />
          </ButtonLink>
        ) : (
          <ButtonLink to={`/learning/${c.courseId}`} variant="primary" className="px-4 py-2 text-sm">Lihat course</ButtonLink>
        )}
      </nav>
    </div>
  );
}
