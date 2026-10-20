import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { MapIcon } from "../components/ui/DashIcons";
import { clsx } from "../lib/clsx";
import { useCourse, useMyCourses } from "../features/dashboard/queries";
import { AdventureMap } from "../features/maps/AdventureMap";

function CourseJourney({ courseId }: { courseId: string }) {
  const q = useCourse(courseId);
  if (q.isPending) return <div aria-busy="true"><Skeleton className="mb-4 h-24 rounded-3xl" /><Skeleton className="h-96 rounded-3xl" /></div>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const c = q.data;
  return (
    <>
      <Card className="mb-5">
        <div className="mb-1.5 flex justify-between text-sm font-bold text-brand-ink/60">
          <span>{c.completedContents} dari {c.totalContents} pos selesai</span>
          <span>{c.progressPercent}%</span>
        </div>
        <ProgressBar value={c.progressPercent} label={`Progres petualangan ${c.title}`} tone={c.progressPercent === 100 ? "amber" : "purple"} size="lg" />
      </Card>
      <AdventureMap course={c} />
    </>
  );
}

export default function MapsPage() {
  const courses = useMyCourses();
  const [picked, setPicked] = useState<string | null>(null);

  if (courses.isPending) return <div aria-busy="true"><Skeleton className="mb-4 h-10 w-64" /><Skeleton className="h-96 rounded-3xl" /></div>;
  if (courses.isError) return <ErrorState onRetry={() => courses.refetch()} />;

  const list = courses.data;
  if (list.length === 0) {
    return (
      <>
        <PageHeader title="Peta Petualangan" subtitle="Jelajahi jalur belajarmu pos demi pos." />
        <EmptyState
          icon={<MapIcon />}
          title="Petamu masih kosong."
          description="Gabung ke room gurumu dulu supaya jalur petualangannya muncul di sini."
          action={<Link to="/learning"><Button size="sm" variant="outline">Gabung room</Button></Link>}
        />
      </>
    );
  }

  const activeId = picked && list.some((c) => c.id === picked) ? picked : (list.find((c) => c.nextContent)?.id ?? list[0].id);
  const active = list.find((c) => c.id === activeId)!;

  return (
    <>
      <PageHeader
        title="Peta Petualangan"
        subtitle="Setiap pos adalah materi. Selesaikan satu per satu, kumpulkan XP, dan buka peti harta di tiap modul."
        actions={
          active.nextContent && (
            <Link to={`/learning/${active.id}/content/${active.nextContent.id}`}>
              <Button size="sm">Lanjutkan petualangan</Button>
            </Link>
          )
        }
      />

      {list.length > 1 && (
        <div role="tablist" aria-label="Pilih petualangan" className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {list.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === activeId}
              onClick={() => setPicked(c.id)}
              className={clsx(
                "shrink-0 rounded-2xl border-2 px-4 py-2 font-display text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                c.id === activeId ? "border-brand-purple bg-brand-purple text-white" : "border-brand-ink/10 bg-white text-brand-ink/70 hover:border-brand-purple/40",
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      <CourseJourney key={activeId} courseId={activeId} />
    </>
  );
}
