import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { ButtonLink } from "../components/ui/ButtonLink";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { XPProgress } from "../components/domain/XPProgress";
import { MapIcon } from "../components/ui/DashIcons";
import { FlameIcon } from "../components/landing/DecorativeIcons";
import { AdventureMap } from "../features/adventure/AdventureMap";
import { JoinRoomCard } from "../features/rooms/JoinRoomCard";
import { useAdventure, useSantriDashboard } from "../features/dashboard/queries";
import { useSessionUser } from "../hooks/useSessionUser";
import { initials } from "../utils/format";

function Legend() {
  const dot = "inline-block h-3.5 w-3.5 rounded-full border-2 align-[-2px]";
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-brand-ink/70" aria-label="Keterangan peta">
      <li><span className={`${dot} border-brand-amber-dark bg-brand-amber`} aria-hidden="true" /> Selesai</li>
      <li><span className={`${dot} border-brand-purple-dark bg-brand-purple`} aria-hidden="true" /> Berikutnya</li>
      <li><span className={`${dot} border-brand-ink/20 bg-white`} aria-hidden="true" /> Belum dikerjakan</li>
    </ul>
  );
}

export default function MapsPage() {
  const user = useSessionUser();
  const adventure = useAdventure();
  const dash = useSantriDashboard();

  const regions = adventure.data?.regions ?? [];
  const next = regions.find((r) => !r.completed) ?? regions[0] ?? null;
  const nextNode = next?.nodes.find((n) => n.isNext) ?? next?.nodes.find((n) => !n.completed) ?? next?.nodes[0] ?? null;

  return (
    <>
      <PageHeader title="Peta Petualangan" subtitle="Ikuti jalurnya, selesaikan setiap pos, dan kumpulkan hadiah di ujung wilayah." />

      {adventure.isPending ? (
        <div aria-busy="true" aria-label="Memuat peta" className="mx-auto flex max-w-md flex-col gap-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-[30rem] rounded-3xl" />
        </div>
      ) : adventure.isError ? (
        <ErrorState onRetry={() => adventure.refetch()} />
      ) : regions.length === 0 ? (
        dash.data && dash.data.roomCount === 0 ? (
          <div className="mx-auto max-w-xl">
            <JoinRoomCard
              title="Mulai petualanganmu"
              hint="Peta terbuka setelah kamu bergabung ke room gurumu. Masukkan kode gabung dari gurumu di sini."
            />
          </div>
        ) : (
          <EmptyState
            icon={<MapIcon />}
            title="Belum ada wilayah di petamu"
            description="Gurumu belum mempublikasikan course di room kamu. Coba lagi nanti ya."
            action={<Link to="/learning" className="font-display text-sm font-bold text-brand-purple hover:underline">Lihat pembelajaran</Link>}
          />
        )
      ) : (
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <Card className="p-4">
            {dash.data ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-display text-lg font-extrabold">
                    Level {dash.data.gamification.level.level} · {dash.data.gamification.level.name}
                  </p>
                  <p className="inline-flex items-center gap-1 font-display text-sm font-extrabold text-brand-ink/80">
                    <FlameIcon className="h-4 w-4 text-brand-amber" aria-hidden="true" />
                    {dash.data.gamification.streak}<span className="sr-only"> hari beruntun</span>
                  </p>
                </div>
                <XPProgress level={dash.data.gamification.level} xp={dash.data.gamification.xp} />
              </>
            ) : (
              <Skeleton className="h-14" />
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Legend />
              {next && nextNode && (
                <ButtonLink to={`/learning/${next.courseId}/content/${nextNode.id}`} className="px-4 py-2 text-sm">
                  Lanjutkan petualangan
                </ButtonLink>
              )}
            </div>
          </Card>

          <AdventureMap regions={regions} initial={initials(user.name).slice(0, 1) || "?"} />
        </div>
      )}
    </>
  );
}
