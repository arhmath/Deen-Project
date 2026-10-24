import { useState } from "react";
import type { RewardOutcome } from "../../types/content";
import { CrownIcon, StarIcon } from "../../components/landing/DecorativeIcons";
import { LevelUpDialog } from "../gamification/LevelUpDialog";

/** Menampilkan reward yang DIHITUNG SERVER. Frontend tidak menghitung sendiri. */
export function RewardPanel({ outcome }: { outcome: RewardOutcome }) {
  const [levelUp, setLevelUp] = useState(outcome.levelUp);

  if (outcome.alreadyRewarded) {
    return (
      <div role="status" className="rounded-2xl border-2 border-brand-ink/10 bg-surface px-4 py-3 text-sm text-brand-ink/70">
        Materi ini sudah pernah kamu selesaikan, jadi XP dan point tidak bertambah lagi. Tetap semangat mengulang!
      </div>
    );
  }

  return (
    <div role="status" className="rounded-3xl border-2 border-brand-gold-dark bg-brand-gold/25 p-5">
      <div className="flex items-center gap-3">
        <StarIcon className="h-9 w-9 shrink-0 text-brand-gold-dark" aria-hidden="true" />
        <div>
          <p className="font-display text-xl font-extrabold text-brand-ink">
            +{outcome.totalXp} XP{outcome.totalPoint > 0 && ` · +${outcome.totalPoint} Point`}
          </p>
          <p className="text-sm text-brand-ink/65">Reward masuk ke akunmu.</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {outcome.grants.map((g) => (
          <li key={g.label} className="flex justify-between gap-3 rounded-xl bg-surface/70 px-3 py-2">
            <span className="min-w-0 truncate font-semibold">{g.label}</span>
            <span className="shrink-0 font-extrabold text-brand-purple-fg">
              +{g.xp} XP{g.point > 0 && ` · +${g.point} Point`}
            </span>
          </li>
        ))}
      </ul>
      {outcome.courseCompleted && (
        <p className="mt-3 flex items-center gap-2 font-display font-extrabold text-brand-purple-fg">
          <CrownIcon className="h-6 w-6" aria-hidden="true" /> Selamat, course ini selesai!
        </p>
      )}
      <LevelUpDialog levelUp={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
