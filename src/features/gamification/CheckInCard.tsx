import { useState } from "react";
import type { GamificationSummary } from "../../types/gamification";
import { Button } from "../../components/ui/Button";
import { CheckIcon } from "../../components/ui/DashIcons";
import { FlameIcon } from "../../components/landing/DecorativeIcons";
import { clsx } from "../../lib/clsx";
import { useCheckIn } from "../dashboard/queries";
import { LevelUpDialog } from "./LevelUpDialog";

export function CheckInCard({ gamification: g }: { gamification: GamificationSummary }) {
  const checkIn = useCheckIn();
  const [levelUp, setLevelUp] = useState<{ to: number; name: string } | null>(null);
  const [gained, setGained] = useState<{ xp: number; point: number } | null>(null);

  function handleCheckIn() {
    checkIn.mutate(undefined, {
      onSuccess: (res) => {
        if (!res.alreadyCheckedIn) setGained(res.reward);
        if (res.levelUp) setLevelUp(res.levelUp);
      },
    });
  }

  return (
    <section
      aria-labelledby="checkin-title"
      className="flex flex-col keep-light rounded-3xl border-2 border-brand-amber-dark bg-brand-amber p-5 text-night shadow-[0_6px_0_0_#CC8A00]"
    >
      <div className="flex items-center gap-4">
        <FlameIcon
          className={clsx("h-14 w-14 shrink-0", g.checkedInToday ? "text-white drop-shadow" : "text-brand-ink/30")}
          aria-hidden="true"
        />
        <div>
          <h2 id="checkin-title" className="font-display text-lg font-extrabold leading-tight">
            Daily check-in
          </h2>
          <p className="font-display text-3xl font-extrabold leading-none">
            {g.streak} <span className="text-base font-bold">hari beruntun</span>
          </p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Check-in minggu ini">
        {g.week.map((d) => (
          <li key={d.date} className="flex flex-col items-center gap-1">
            <span
              className={clsx(
                "grid h-9 w-9 place-items-center rounded-full border-2 sm:h-10 sm:w-10",
                d.checked
                  ? "border-brand-ink bg-brand-ink text-brand-amber"
                  : d.isToday
                    ? "border-brand-ink border-dashed bg-surface/60"
                    : "border-brand-ink/25 bg-white/30"
              )}
            >
              {d.checked && <CheckIcon className="h-5 w-5" strokeWidth={3} />}
              <span className="sr-only">
                {d.label}: {d.checked ? "sudah check-in" : d.isFuture ? "belum tiba" : d.isToday ? "belum check-in" : "terlewat"}
              </span>
            </span>
            <span aria-hidden="true" className={clsx("text-xs font-bold", d.isToday ? "text-brand-ink" : "text-brand-ink/65")}>
              {d.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5">
        {g.checkedInToday ? (
          <p role="status" className="rounded-2xl bg-surface/60 px-4 py-3 text-center font-display font-extrabold">
            {gained ? `+${gained.xp} XP${gained.point > 0 ? ` dan +${gained.point} point` : ""} masuk!` : "Check-in hari ini sudah beres. Sampai besok ya!"}
          </p>
        ) : (
          <>
            <Button fullWidth variant="primary" isLoading={checkIn.isPending} onClick={handleCheckIn}>
              Check-in hari ini
            </Button>
            {checkIn.isError && (
              <p role="alert" className="mt-2 text-center text-sm font-bold text-red-700">
                Check-in belum berhasil. Coba lagi ya.
              </p>
            )}
          </>
        )}
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-brand-ink/70">
        Rekor terpanjangmu: {g.longestStreak} hari
      </p>

      <LevelUpDialog levelUp={levelUp} onClose={() => setLevelUp(null)} />
    </section>
  );
}
