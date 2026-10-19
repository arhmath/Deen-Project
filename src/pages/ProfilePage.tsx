import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { XPProgress } from "../components/domain/XPProgress";
import { Skeleton } from "../components/ui/Skeleton";
import { useSessionUser } from "../hooks/useSessionUser";
import { useLinkCode, useSantriDashboard } from "../features/dashboard/queries";
import { CopyButton } from "../components/ui/CopyButton";
import { USE_MOCK } from "../services/api";
import { resetMockState } from "../services/mock/server";
import { ROLE_LABEL } from "../types/user";
import { initials } from "../utils/format";

export default function ProfilePage() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const dash = useSantriDashboard(user.role === "SANTRI");
  const link = useLinkCode(user.role === "SANTRI");

  function resetDemo() {
    resetMockState();
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Profil" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-amber font-display text-2xl font-extrabold" aria-hidden="true">{initials(user.name)}</span>
            <div>
              <p className="font-display text-xl font-extrabold">{user.name}</p>
              <p className="text-sm text-brand-ink/60">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="font-bold text-brand-ink/55">Username</dt><dd>{user.username}</dd>
            {user.email && (<><dt className="font-bold text-brand-ink/55">Email</dt><dd className="break-all">{user.email}</dd></>)}
          </dl>
        </Card>

        {user.role === "SANTRI" && (
          <Card>
            <CardTitle className="mb-4">Level kamu</CardTitle>
            {dash.data ? (
              <>
                <p className="mb-3 font-display text-2xl font-extrabold text-brand-purple">Level {dash.data.gamification.level.level} · {dash.data.gamification.level.name}</p>
                <XPProgress level={dash.data.gamification.level} xp={dash.data.gamification.xp} />
              </>
            ) : <Skeleton className="h-20" />}
          </Card>
        )}

        {user.role === "SANTRI" && (
          <Card className="lg:col-span-2">
            <CardTitle>Kode untuk orang tua</CardTitle>
            <p className="mb-3 mt-1 text-sm text-brand-ink/60">
              Berikan kode ini ke orang tuamu. Mereka memasukkannya di akun Deen mereka untuk memantau belajarmu.
            </p>
            {link.data ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-2xl bg-brand-cream px-4 py-2 font-display text-2xl font-extrabold tracking-widest text-brand-purple">{link.data.code}</p>
                <CopyButton text={link.data.code} label="Salin kode" />
              </div>
            ) : link.isError ? (
              <p role="alert" className="text-sm font-bold text-red-600">Kode belum bisa dimuat. Muat ulang halaman ya.</p>
            ) : (
              <Skeleton className="h-12 w-60" />
            )}
          </Card>
        )}

        {USE_MOCK && (
          <Card className="lg:col-span-2">
            <CardTitle>Mode demo</CardTitle>
            <p className="mb-4 mt-1 text-sm text-brand-ink/60">Data saat ini berasal dari mock lokal di browser ini. Reset mengembalikan progres, room, course, dan keterhubungan orang tua ke data awal. Akun yang sudah kamu daftarkan tetap ada.</p>
            <Button size="sm" variant="outline" onClick={resetDemo}>Reset data demo</Button>
          </Card>
        )}
      </div>
    </>
  );
}
